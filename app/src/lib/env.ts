import { env } from "cloudflare:workers";

/**
 * Single access point for Cloudflare bindings + secrets. Astro v6+ removed
 * `Astro.locals.runtime.env` — bindings come from the `cloudflare:workers`
 * module instead, available in all server code (request handler in prod,
 * platformProxy shim in `astro dev`). Bindings a deploy lacks (e.g. MEDIA
 * while R2 is disabled) are simply undefined — callers already handle that
 * (lib/db returns null, lib/media catches).
 *
 * Node-side scripts (db:seed-sql, migrate:blob) do NOT go through this
 * module — they read process.env directly.
 *
 * The `locals` parameter is kept (and ignored) so call sites read the same.
 */
export function getEnv(_locals: App.Locals | undefined): Env {
  return env;
}

/** True only when explicitly opted in (local no-DB browsing). */
export function seedFallbackEnabled(env: Env): boolean {
  return env.SEED_FALLBACK === "1";
}
