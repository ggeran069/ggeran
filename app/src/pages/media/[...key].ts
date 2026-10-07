import type { APIRoute } from "astro";
import { getEnv } from "@/lib/env";

/**
 * Serve an object from the R2 media bucket. Keys are unique-suffixed at
 * upload time, so responses are immutable — cache hard. Pages reference
 * objects by origin-relative /media/<key>, keeping the site portable.
 */
export const GET: APIRoute = async ({ params, locals }) => {
  const key = params.key;
  if (!key) return new Response("Not found", { status: 404 });

  const object = await getEnv(locals).MEDIA.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers); // content-type from putMedia
  headers.set("ETag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
};
