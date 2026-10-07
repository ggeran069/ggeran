import { ActionError, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { getEnv } from "@/lib/env";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";

/**
 * Shared helpers for admin actions: form-data coercion schemas (kept
 * compatible with the old hand-rolled parse() helpers — blank stays null,
 * never 0), the requireAdmin() re-check, and the duplicate-slug translator.
 */

/** Trimmed string, "" → null. */
export const strField = z.preprocess(
  (v) => {
    const s = String(v ?? "").trim();
    return s.length ? s : null;
  },
  z.string().nullable(),
);

/** Integer, "" → null (blank must stay blank — Number("") is 0, not empty). */
export const intField = z.preprocess((v) => {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}, z.number().int().nullable());

/** Checkbox: present-and-"on" → true, absent → false. */
export const boolField = z.preprocess(
  (v) => v === "on" || v === "true" || v === true,
  z.boolean(),
);

/** Repeated form fields (gallery) → string array. */
export const strListField = z.preprocess(
  (v) => (Array.isArray(v) ? v.filter((x): x is string => Boolean(x)) : v ? [String(v)] : []),
  z.array(z.string()),
);

export const idField = z.coerce.number().int().positive();

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Defense-in-depth: re-check the session inside every action handler. */
export async function requireAdmin(ctx: ActionAPIContext): Promise<void> {
  const token = ctx.cookies.get(SESSION_COOKIE)?.value;
  if (!(await verifyToken(getEnv(ctx.locals), token))) {
    throw new ActionError({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }
}

/**
 * Post-redirect-get for form flows happens at the PAGE level: handlers return
 * plain data (a returned Response can't be serialized by the actions runtime),
 * and pages call Astro.redirect after a successful Astro.getActionResult.
 */

/** Translate a unique-index violation into a friendly form error (works for
 *  both Postgres 23505 and SQLite/D1 "UNIQUE constraint failed", which drizzle
 *  nests under `cause`). */
export function isUniqueViolation(e: unknown): boolean {
  const err = e as {
    code?: string;
    message?: string;
    cause?: { code?: string; message?: string };
  };
  return (
    err?.code === "23505" ||
    err?.cause?.code === "23505" ||
    /unique constraint|duplicate key/i.test(`${err?.message ?? ""} ${err?.cause?.message ?? ""}`)
  );
}

export const slugConflict = () =>
  new ActionError({
    code: "CONFLICT",
    message: "That slug is already in use — pick a different title or slug.",
  });

export const dbMissing = () =>
  new ActionError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Database not configured (set DATABASE_URL).",
  });
