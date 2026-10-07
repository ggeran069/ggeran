/**
 * Shared upload constraints — imported by both the server route and the client
 * upload components so the rules can't drift. Keep this free of Node-only APIs
 * (it is bundled into the client).
 */

export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_MB = 5;

/** `accept` value for the file inputs (extensions + MIME types). */
export const ACCEPT_ATTR = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

/** Visible hint shown under every uploader. */
export const UPLOAD_NOTE = `JPEG, PNG, or WebP · up to ${MAX_MB} MB.`;

/** Performance tip shown under every uploader. */
export const UPLOAD_RECOMMENDATION =
  "Best site performance: export as WebP and resize to ~2000px on the longest side before uploading.";

/** Default cap on the number of gallery images per item. */
export const MAX_GALLERY_IMAGES = 12;

/**
 * Client-side pre-check on a File (before POSTing). Returns an error message or
 * null if the file looks acceptable. Browsers don't always populate `type`, so
 * we accept either a known MIME or a known extension.
 */
export function validateClientFile(file: File): string | null {
  if (file.size > MAX_BYTES) {
    return `“${file.name}” is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${MAX_MB} MB.`;
  }
  const okType = (ALLOWED_MIME as readonly string[]).includes(file.type);
  const okExt = /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!okType && !okExt) {
    return `“${file.name}” is not a supported format. Use JPEG, PNG, or WebP.`;
  }
  return null;
}

const MIME_BY_EXT = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;
export type ImageExt = keyof typeof MIME_BY_EXT;
export function mimeFor(ext: ImageExt): string {
  return MIME_BY_EXT[ext];
}

/**
 * Server-side magic-byte check on the raw bytes. Returns the canonical
 * extension if the buffer is genuinely a JPEG/PNG/WebP, otherwise null — this
 * is what blocks renamed or non-image payloads regardless of MIME/extension.
 */
export function detectImageType(buf: Uint8Array): ImageExt | null {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "png";
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}
