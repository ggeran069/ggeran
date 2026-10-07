# =========================================================================
# ggeran — Astro SSR portfolio on Cloudflare Pages
# =========================================================================
# Deploy target: Cloudflare Pages (Workers-style _worker.js output). There is
# no k3s/registry/nginx story in this repo — the Nix build produces the exact
# bytes that get uploaded, so local and production can't drift.
#
# One-time setup:
#   npx wrangler login                                    (or CLOUDFLARE_API_TOKEN)
#   npx wrangler pages project create ggeran --production-branch main
#   npx wrangler r2 bucket create ggeran-media            (or: just r2-create)
#   just secret DATABASE_URL / AUTH_SECRET / ADMIN_EMAIL / ADMIN_PASSWORD
#
# ⚠️ After ANY dependency change: (cd app && npm install) → just relock.
# ⚠️ git add -A before just site/cf — Nix evaluates the git INDEX.
# =========================================================================
set shell := ["bash", "-c"]

cf_project := "ggeran"
bucket     := "ggeran-media"
db_name    := "ggeran-db"

# Build the site offline via Nix into site-out/ (reproducible bytes).
site:
    nix build .#site --out-link site-out

# Plain (non-Nix) build loop — catches broken pages/imports fast.
check:
    cd app && npm run build

# Dev server (HMR, miniflare bindings from wrangler.toml + .dev.vars)
# → http://localhost:4321
serve:
    cd app && npm run dev

# Preview the SSR build on the real workerd runtime (after `just check`).
preview:
    cd app && npm run build && npx wrangler pages dev dist

# Pre-flight: wrangler auth, deps installed, git index clean.
doctor:
    #!/usr/bin/env bash
    set -uo pipefail
    ok=1
    (cd app && npx --no-install wrangler whoami >/dev/null 2>&1) && echo "  wrangler   authed" || { echo "  wrangler   NOT authed -> npx wrangler login"; ok=0; }
    [ -d app/node_modules ] && echo "  deps       installed" || { echo "  deps       MISSING -> (cd app && npm install)"; ok=0; }
    n=$(git status --porcelain . 2>/dev/null | wc -l)
    [ "$n" = 0 ] && echo "  git        clean" || echo "  git        WARN - $n unstaged/untracked (nix uses the git INDEX)"
    [ "$ok" = 1 ] && echo "doctor: ready" || { echo "doctor: NOT ready"; exit 1; }

# Recompute npmDepsHash after ANY package.json change.
# ORDER: (cd app && npm install) → just relock → just site.
relock:
    #!/usr/bin/env bash
    set -euo pipefail
    [ -f app/package-lock.json ] || { echo "generate the lockfile first: (cd app && npm install)"; exit 1; }
    hash=$(nix run nixpkgs#prefetch-npm-deps -- app/package-lock.json)
    echo "computed npmDepsHash: $hash"
    sed -i -E "s|npmDepsHash = .*|npmDepsHash = \"$hash\";  # from app/package-lock.json via just relock|" flake.nix
    echo "updated flake.nix — rebuild with: just site"

# Deploy PRODUCTION: Nix-built bytes → Cloudflare Pages.
cf: site
    #!/usr/bin/env bash
    set -euo pipefail
    rm -rf app/dist && mkdir -p app/dist && cp -r site-out/. app/dist/
    # Nix store outputs are read-only; wrangler needs a normal writable tree.
    chmod -R u+w app/dist
    cd app && npx wrangler pages deploy dist --project-name {{cf_project}} --branch main

# Preview deployment (a branch URL; production untouched).
# Override the branch: CF_BRANCH=feat-x just cf-preview
cf-preview: site
    #!/usr/bin/env bash
    set -euo pipefail
    branch="${CF_BRANCH:-preview}"
    rm -rf app/dist && mkdir -p app/dist && cp -r site-out/. app/dist/
    chmod -R u+w app/dist
    cd app && npx wrangler pages deploy dist --project-name {{cf_project}} --branch "$branch"

# Push a secret from app/.dev.vars (or enter a value interactively).
#   just secret DATABASE_URL
secret KEY:
    #!/usr/bin/env bash
    set -euo pipefail
    v=$(grep -E "^{{KEY}}=" app/.dev.vars 2>/dev/null | head -1 | cut -d= -f2- || true)
    cd app
    if [ -n "$v" ]; then
      printf '%s' "$v" | npx wrangler pages secret put "{{KEY}}" --project-name {{cf_project}}
    else
      npx wrangler pages secret put "{{KEY}}" --project-name {{cf_project}}
    fi

# One-time: create the R2 media bucket.
r2-create:
    cd app && npx wrangler r2 bucket create {{bucket}}

# One-time: create the D1 database (paste the printed id into app/wrangler.toml).
d1-create:
    cd app && npx wrangler d1 create {{db_name}}

# Generate SQL migrations from src/db/schema.ts (run after schema changes).
db-generate:
    cd app && npx drizzle-kit generate

# Apply schema migrations to D1.  MODE: local | remote
db-apply MODE:
    #!/usr/bin/env bash
    set -euo pipefail
    shopt -s nullglob
    files=(app/drizzle/0*.sql)
    [ ${#files[@]} -gt 0 ] || { echo "no migrations — run: just db-generate"; exit 1; }
    for f in "${files[@]}"; do
      echo "→ applying $(basename "$f")"
      (cd app && npx wrangler d1 execute {{db_name}} --{{MODE}} --file="drizzle/$(basename "$f")")
    done

# Generate + apply the seed content.  MODE: local | remote
db-seed MODE:
    #!/usr/bin/env bash
    set -euo pipefail
    (cd app && npm run -s db:seed-sql && npx wrangler d1 execute {{db_name}} --{{MODE}} --file=drizzle/seed.sql)

# One-time: create the Pages project.
cf-create:
    cd app && npx wrangler pages project create {{cf_project}} --production-branch main

shell:
    nix develop
