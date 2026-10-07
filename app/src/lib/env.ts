/**
 * Single access point for Cloudflare bindings + secrets. The adapter exposes
 * them on `Astro.locals.runtime.env` (request handler in prod, platformProxy
 * middleware in `astro dev`), so every call site threads `Astro.locals` (or a
 * middleware/APIContext) through here instead of touching process.env.
 *
 * Node-side scripts (db:seed, migrate:blob) do NOT go through this module —
 * they read process.env directly.
 */
/**
 * Env, R2Bucket & co. are ambient globals declared in src/env.d.ts.
 */

export function getEnv(locals: App.Locals | undefined): Env {
  const env = locals?.runtime?.env;
  if (!env) {
    throw new Error(
      "Cloudflare runtime not available — are you running outside a request context?",
    );
  }
  return env;
}

/** True only when explicitly opted in (local no-DB browsing). */
export function seedFallbackEnabled(env: Env): boolean {
  return env.SEED_FALLBACK === "1";
}
