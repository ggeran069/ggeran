import type { APIRoute } from "astro";
import { getProjects, getPublications, getNews } from "@/lib/data";

/**
 * Hand-rolled sitemap: build-time generators can't see SSR slugs, so the
 * dynamic routes are queried at request time and joined with the static ones.
 */
const escape = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export const GET: APIRoute = async ({ site, locals }) => {
  const base = site ?? new URL("https://ggeran.pages.dev");
  const [projects, publications, news] = await Promise.all([
    getProjects(locals),
    getPublications(locals),
    getNews(locals),
  ]);

  const urls: { path: string; lastmod?: string }[] = [
    { path: "/" },
    { path: "/projects" },
    { path: "/available" },
    { path: "/publications" },
    { path: "/news" },
    { path: "/about" },
    { path: "/contact" },
    ...projects.map((p) => ({ path: `/projects/${p.slug}`, lastmod: p.date ?? undefined })),
    ...publications.map((p) => ({ path: `/publications/${p.slug}`, lastmod: p.date ?? undefined })),
    ...news.map((n) => ({ path: `/news/${n.slug}`, lastmod: n.date ?? undefined })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(({ path, lastmod }) => {
    const loc = escape(new URL(path, base).href);
    return `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${escape(lastmod)}</lastmod>` : ""}</url>`;
  })
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
