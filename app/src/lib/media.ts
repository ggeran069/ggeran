import { getEnv } from "@/lib/env";

/**
 * Server-only helpers for the R2 media store (binding `MEDIA`, see
 * wrangler.toml). Uploaded images live here (NOT in the Neon database — the
 * DB only stores `/media/<key>` URL strings). These power the storage meter,
 * the upload quota guard, and the Media page.
 */
export type MediaItem = {
  key: string;
  url: string; // origin-relative: /media/<key>
  size: number;
  uploadedAt: Date;
};
export type MediaUsage = { usedBytes: number; count: number };

/** Storage budget in MB. Set QUOTA_MB to your R2 budget. */
export const quotaMb = (env: Env): number => Number(env.QUOTA_MB) || 500;

async function collect(
  locals: App.Locals,
): Promise<{ items: MediaItem[]; usedBytes: number; count: number } | null> {
  try {
    const media = getEnv(locals).MEDIA;
    const items: MediaItem[] = [];
    let usedBytes = 0;
    let count = 0;
    let cursor: string | undefined;
    do {
      const res = await media.list({ cursor, limit: 1000 });
      for (const o of res.objects) {
        items.push({
          key: o.key,
          url: `/media/${o.key}`,
          size: o.size,
          uploadedAt: o.uploaded,
        });
        usedBytes += o.size;
        count++;
      }
      cursor = res.truncated ? res.cursor : undefined;
    } while (cursor);
    return { items, usedBytes, count };
  } catch (e) {
    console.error("[media] R2 list failed", e);
    return null;
  }
}

/** Total bytes + count of all stored objects. Null if R2 is unreachable. */
export async function getMediaUsage(locals: App.Locals): Promise<MediaUsage | null> {
  const r = await collect(locals);
  if (!r) return null;
  return { usedBytes: r.usedBytes, count: r.count };
}

/** Every media object, newest first. Null if R2 is unreachable. */
export async function listAllMedia(locals: App.Locals): Promise<MediaItem[] | null> {
  const r = await collect(locals);
  if (!r) return null;
  return r.items.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
}

/**
 * Store an uploaded image under a collision-proof key
 * (`<sanitized-base>-<random>.<ext>`) and return its origin-relative URL.
 * `ext` comes from the server-side magic-byte check (lib/upload.ts).
 */
export async function putMedia(
  locals: App.Locals,
  base: string,
  bytes: Uint8Array,
  ext: string,
): Promise<string> {
  const media = getEnv(locals).MEDIA;
  const safeBase =
    base
      .toLowerCase()
      .replace(/\.[^.]+$/, "") // strip any incoming extension
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "image";
  const key = `${safeBase}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  await media.put(key, bytes, {
    httpMetadata: { contentType: mimeFor(ext as "jpg" | "png" | "webp") },
  });
  return `/media/${key}`;
}

export async function deleteMedia(locals: App.Locals, key: string): Promise<void> {
  await getEnv(locals).MEDIA.delete(key);
}

function mimeFor(ext: "jpg" | "png" | "webp"): string {
  return { jpg: "image/jpeg", png: "image/png", webp: "image/webp" }[ext];
}

export const formatMB = (bytes: number) => {
  const mb = bytes / 1024 / 1024;
  return mb >= 10 ? mb.toFixed(0) : mb.toFixed(1);
};
