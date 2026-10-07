import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { getEnv } from "@/lib/env";

type Db = DrizzleD1Database<typeof schema>;

/**
 * Drizzle client over the D1 binding (native, no network hop, no secret).
 * Null only when the binding itself is missing — lib/data.ts then falls back
 * to seed data when SEED_FALLBACK=1, or errors loudly (misconfigured deploy).
 */
export function getDb(locals: App.Locals | undefined): Db | null {
  const env = getEnv(locals);
  return env.DB ? drizzle(env.DB, { schema }) : null;
}
