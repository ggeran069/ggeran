import { defineMiddleware } from "astro:middleware";
import { getEnv } from "@/lib/env";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";

/**
 * Guard /admin/* (except /admin/login) and every Astro Action except
 * auth/signIn — Actions POST to /_actions/*, which is NOT under /admin/, so
 * the page matcher alone would leave mutation endpoints open.
 * Defense in depth: requireAdmin() still re-checks inside every action.
 */
export const onRequest = defineMiddleware(async (ctx, next) => {
  const { pathname } = ctx.url;
  const isLoginPage = pathname === "/admin/login";
  const isAdminPage = pathname.startsWith("/admin");
  const isAction = pathname.startsWith("/_actions/");
  // Astro Actions POST to /_actions/<dotted.name> (e.g. /_actions/auth.signIn).
  const isPublicAction = isAction && pathname === "/_actions/auth.signIn";

  if (isAction && !isPublicAction) {
    if (!(await ok(ctx.locals, ctx.cookies.get(SESSION_COOKIE)?.value))) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (isAdminPage && !isLoginPage) {
    if (!(await ok(ctx.locals, ctx.cookies.get(SESSION_COOKIE)?.value))) {
      return ctx.redirect(`/admin/login?from=${encodeURIComponent(pathname)}`);
    }
  }

  return next();
});

async function ok(locals: App.Locals, token?: string): Promise<boolean> {
  return verifyToken(getEnv(locals), token);
}
