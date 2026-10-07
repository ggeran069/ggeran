import { SignJWT, jwtVerify } from "jose";

/**
 * Lightweight single-admin session (jose-signed JWT in an HttpOnly cookie).
 * Credentials live in Cloudflare secrets (ADMIN_EMAIL / ADMIN_PASSWORD);
 * signing key in AUTH_SECRET. Stateless — no KV, no Astro sessions.
 */
export const SESSION_COOKIE = "gg_admin";
const DAY = 60 * 60 * 24;

function secret(env: Env): Uint8Array {
  const s = env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function createSession(env: Env): Promise<string> {
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${30 * DAY}s`)
    .sign(secret(env));
}

export async function verifyToken(env: Env, token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, secret(env));
    return true;
  } catch {
    return false;
  }
}

export async function checkCredentials(
  env: Env,
  email: string,
  password: string,
): Promise<boolean> {
  // Fail LOUDLY (and closed) when auth isn't configured — the source repo's
  // login silently rejected everything when the env vars were missing.
  if (!env.AUTH_SECRET || !env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.error(
      "[auth] admin auth is not configured — set AUTH_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD (see .dev.vars.example).",
    );
    return false;
  }
  return email === env.ADMIN_EMAIL && password === env.ADMIN_PASSWORD;
}
