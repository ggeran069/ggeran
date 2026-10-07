import type { APIRoute } from "astro";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { getEnv } from "@/lib/env";
import { MAX_BYTES, detectImageType } from "@/lib/upload";
import { getMediaUsage, putMedia, quotaMb } from "@/lib/media";

/**
 * Image upload → R2. Admin-only (session cookie checked).
 * Accepts ONE request with repeated `files` entries (the admin inputs send a
 * whole selection per batch) — per-file size/magic-byte validation produces
 * per-file errors, and the storage quota is checked ONCE per batch (the old
 * route re-listed the entire store for every single file).
 *
 * Response: { urls: string[], errors: string[] }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim().split("="))
    .find(([k]) => k === SESSION_COOKIE)?.[1];
  if (!(await verifyToken(getEnv(locals), cookie ? decodeURIComponent(cookie) : undefined))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const env = getEnv(locals);
  const form = await request.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return new Response(JSON.stringify({ error: "No files provided." }), { status: 400 });
  }

  const errors: string[] = [];
  let batchBytes = 0;
  type Valid = { file: File; buf: Uint8Array; ext: "jpg" | "png" | "webp" };
  const valid: Valid[] = [];

  for (const file of files) {
    if (file.size > MAX_BYTES) {
      errors.push(`“${file.name}” is larger than 5 MB.`);
      continue;
    }
    const buf = new Uint8Array(await file.arrayBuffer());
    const ext = detectImageType(buf);
    if (!ext) {
      errors.push(`“${file.name}” is not a valid JPEG, PNG, or WebP file.`);
      continue;
    }
    batchBytes += file.size;
    valid.push({ file, buf, ext });
  }

  if (valid.length === 0) {
    return new Response(JSON.stringify({ urls: [], errors }), { status: 400 });
  }

  // Storage quota guard — one usage check for the whole batch.
  const quota = quotaMb(env);
  const usage = await getMediaUsage(locals);
  if (usage && usage.usedBytes + batchBytes > quota * 1024 * 1024) {
    return new Response(
      JSON.stringify({
        urls: [],
        errors: [
          `Upload would exceed the ${quota} MB storage quota. Delete unused files in Media to free space.`,
          ...errors,
        ],
      }),
      { status: 413 },
    );
  }

  const urls: string[] = [];
  for (const { file, buf, ext } of valid) {
    try {
      urls.push(await putMedia(locals, file.name || "upload", buf, ext));
    } catch (e) {
      console.error("[upload] R2 put failed", e);
      errors.push(`“${file.name}” could not be stored. Please try again.`);
    }
  }

  return new Response(JSON.stringify({ urls, errors }), {
    headers: { "Content-Type": "application/json" },
  });
};
