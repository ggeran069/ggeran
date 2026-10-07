# =========================================================================
# GGERAN — Astro 5 + Tailwind v4 SSR site on Cloudflare Pages
# =========================================================================
# Defines:
#   1. devShells.default — nodejs + npm, direnv-loaded.
#   2. packages.site     — the built site (dist/ incl. _worker.js), built
#                          OFFLINE and reproducibly via buildNpmPackage.
#      (also packages.default — `nix build` builds the site)
#
# There is no image / registry / k8s story in this repo on purpose: the site
# is SSR on Cloudflare Pages (deployed with `just cf` → wrangler pages deploy).
# ONE deploy story, same Nix-built bytes every time.
#
# ⚠️ DEPS HASH: buildNpmPackage needs `npmDepsHash` matching
# app/package-lock.json. After ANY dependency change:
#   1. enter the shell:       direnv allow   (or `nix develop`)
#   2. refresh the lockfile:  (cd app && npm install)
#   3. just relock            # recomputes the hash + writes it into flake.nix
#   4. just site              # git add -A first! Nix evaluates the git INDEX.
#
# Dev → deploy loop:
#     just serve      # astro dev (HMR) → http://localhost:4321
#     just site && just cf     # Nix-built bytes → Cloudflare Pages (production)
#     just cf-preview          # → a preview deployment instead
#
# The build renders NOTHING at runtime (output: 'server', no prerendered DB
# pages), so the offline sandbox never needs the database. Telemetry is
# disabled (ASTRO_TELEMETRY_DISABLED) so it never phones home or writes $HOME.
# =========================================================================
{
  description = "ggeran — Astro portfolio on Cloudflare Pages; Nix devShell + offline site build";

  inputs.nixpkgs.url = "nixpkgs/nixos-26.05";

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
      pkgsFor = system: nixpkgs.legacyPackages.${system};
    in {
      packages = forAllSystems (system:
        let
          pkgs = pkgsFor system;

          # ── build the site (reproducible, OFFLINE via npmDepsHash) ──
          # buildNpmPackage runs `npm ci` (offline, deps resolved from the
          # hash) then `npm run build` → dist/ (static assets + _worker.js).
          # installPhase exposes dist/ as the package output.
          ggeranSite = pkgs.buildNpmPackage {
            pname = "ggeran";
            version = "0.1.0";
            src = ./app;
            npmDepsHash = "sha256-mU6WXP9WG+JwMJ0LhHN0UZ2p3pYn+BaqrpsE/0vmIEs=";  # from app/package-lock.json via just relock
            env.ASTRO_TELEMETRY_DISABLED = "1";    # offline sandbox: never write $HOME / phone home
            installPhase = ''
              runHook preInstall
              mkdir -p $out
              cp -r dist/* $out/
              runHook postInstall
            '';
          };
        in {
          default = ggeranSite;
          site    = ggeranSite;   # → `just site` / `just cf` (wrangler pages deploy)
        });

      devShells = forAllSystems (system:
        let pkgs = pkgsFor system; in {
          default = pkgs.mkShell {
            packages = with pkgs; [
              nodejs_22    # includes npm — dev + builds use npm (no pnpm drift)
              just
              # wrangler comes from app/node_modules (app-local, version-locked
              # in package.json) — `just cf` etc. call `npx wrangler` in app/.
            ];
            shellHook = ''
              echo ""
              echo "  ❯ ggeran devshell active"
              echo "      node    $(node -v 2>/dev/null || echo '—')"
              echo "      serve   just serve          (astro dev → http://localhost:4321)"
              echo "      deploy  just cf             (Nix-built bytes → Cloudflare Pages)"
              echo "      deps    (cd app && npm install) → just relock → just site"
              echo ""
            '';
          };
        });
    };
}
