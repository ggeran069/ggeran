import { desc, eq } from "drizzle-orm";
import { projects, publications, news, siteContent } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getEnv, seedFallbackEnabled } from "@/lib/env";
import {
  seedProjects,
  seedPublications,
  seedNews,
  seedSiteContent,
  type Project,
  type Publication,
  type NewsItem,
  type SiteContent,
} from "@/db/seed-data";

export type { Project, Publication, NewsItem, SiteContent };

// Typed row mappers — the DB row types are the source of truth, so no `any`.
const asProject = (r: typeof projects.$inferSelect): Project => ({
  slug: r.slug,
  title: r.title,
  year: r.year ?? null,
  date: r.date ?? null,
  ref: r.ref ?? null,
  category: r.category ?? null,
  location: r.location ?? null,
  medium: r.medium ?? null,
  dimensions: r.dimensions ?? null,
  edition: r.edition ?? null,
  availability: r.availability ?? null,
  series: r.series ?? null,
  featured: !!r.featured,
  weight: r.weight ?? 1,
  image: r.image ?? null,
  gallery: r.gallery ?? [],
  body: r.body ?? null,
});

const asPublication = (r: typeof publications.$inferSelect): Publication => ({
  slug: r.slug,
  title: r.title,
  year: r.year ?? null,
  date: r.date ?? null,
  ref: r.ref ?? null,
  category: r.category ?? null,
  publisher: r.publisher ?? null,
  author: r.author ?? null,
  isbn: r.isbn ?? null,
  pages: r.pages ?? null,
  format: r.format ?? null,
  edition: r.edition ?? null,
  image: r.image ?? null,
  gallery: r.gallery ?? [],
  body: r.body ?? null,
});

const asNews = (r: typeof news.$inferSelect): NewsItem => ({
  slug: r.slug,
  title: r.title,
  date: r.date ?? null,
  summary: r.summary ?? null,
  image: r.image ?? null,
  body: r.body ?? null,
});

/**
 * Canonical ordering for projects: manual `weight` first (the admin-editable
 * sort key — previously stored but never used), then year, newest first.
 */
export const byProjectOrder = (a: Project, b: Project): number =>
  (b.weight ?? 1) - (a.weight ?? 1) || (b.year ?? 0) - (a.year ?? 0);

/**
 * Canonical news ordering: date desc with NULLs LAST (Postgres `ORDER BY …
 * DESC` puts NULLs first, which is why this lives in JS — one place, used by
 * every news consumer).
 */
export const byDateDesc = (a: { date: string | null }, b: { date: string | null }): number => {
  if (!a.date && !b.date) return 0;
  if (!a.date) return 1;
  if (!b.date) return -1;
  return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
};

/**
 * `db` is null when DATABASE_URL is unset. Unlike the old Next.js version,
 * there is no build step that needs the site to render without a database —
 * everything renders on demand. So:
 *   - no DATABASE_URL and no SEED_FALLBACK=1  → hard error (misconfigured prod)
 *   - SEED_FALLBACK=1 (local dev escape hatch) → seed data + LOUD log line
 *   - DB unreachable / query failed            → the error propagates (500)
 */
async function readOrSeed<T>(
  locals: App.Locals,
  label: string,
  read: (db: NonNullable<ReturnType<typeof getDb>>) => Promise<T>,
  seed: T,
): Promise<T> {
  const db = getDb(locals);
  if (!db) {
    if (seedFallbackEnabled(getEnv(locals))) {
      console.error(`[data] ${label}: SERVING SEED CONTENT (SEED_FALLBACK=1, no DATABASE_URL).`);
      return seed;
    }
    throw new Error(
      "[data] DATABASE_URL is not set — configure it (`just secret DATABASE_URL`), or set SEED_FALLBACK=1 for local development.",
    );
  }
  return read(db);
}

// ── Projects ────────────────────────────────────────────────────────────
export async function getProjects(locals: App.Locals): Promise<Project[]> {
  return readOrSeed(locals, "getProjects", async (db) => {
    const rows = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.weight), desc(projects.year));
    return rows.map(asProject);
  }, [...seedProjects].sort(byProjectOrder));
}

export async function getFeaturedProjects(locals: App.Locals): Promise<Project[]> {
  return readOrSeed(locals, "getFeaturedProjects", async (db) => {
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.featured, true))
      .orderBy(desc(projects.weight), desc(projects.year));
    return rows.map(asProject);
  }, seedProjects.filter((p) => p.featured).sort(byProjectOrder));
}

export async function getAvailableProjects(locals: App.Locals): Promise<Project[]> {
  return readOrSeed(locals, "getAvailableProjects", async (db) => {
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.availability, "for-sale"))
      .orderBy(desc(projects.weight), desc(projects.year));
    return rows.map(asProject);
  }, seedProjects.filter((p) => p.availability === "for-sale").sort(byProjectOrder));
}

export async function getProject(locals: App.Locals, slug: string): Promise<Project | null> {
  return readOrSeed(locals, "getProject", async (db) => {
    const rows = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1);
    return rows[0] ? asProject(rows[0]) : null;
  }, seedProjects.find((p) => p.slug === slug) ?? null);
}

// ── Publications ────────────────────────────────────────────────────────
export async function getPublications(locals: App.Locals): Promise<Publication[]> {
  return readOrSeed(locals, "getPublications", async (db) => {
    const rows = await db.select().from(publications).orderBy(desc(publications.year));
    return rows.map(asPublication);
  }, seedPublications);
}

export async function getPublication(
  locals: App.Locals,
  slug: string,
): Promise<Publication | null> {
  return readOrSeed(locals, "getPublication", async (db) => {
    const rows = await db
      .select()
      .from(publications)
      .where(eq(publications.slug, slug))
      .limit(1);
    return rows[0] ? asPublication(rows[0]) : null;
  }, seedPublications.find((p) => p.slug === slug) ?? null);
}

// ── News ────────────────────────────────────────────────────────────────
export async function getNews(locals: App.Locals): Promise<NewsItem[]> {
  return readOrSeed(locals, "getNews", async (db) => {
    // Unordered fetch + the canonical JS sort (NULL dates land last).
    const rows = await db.select().from(news);
    return rows.map(asNews).sort(byDateDesc);
  }, [...seedNews].sort(byDateDesc));
}

export async function getNewsItem(locals: App.Locals, slug: string): Promise<NewsItem | null> {
  return readOrSeed(locals, "getNewsItem", async (db) => {
    const rows = await db.select().from(news).where(eq(news.slug, slug)).limit(1);
    return rows[0] ? asNews(rows[0]) : null;
  }, seedNews.find((n) => n.slug === slug) ?? null);
}

// ── Site content (singleton) ─────────────────────────────────────────────
const asSiteContent = (r: typeof siteContent.$inferSelect): SiteContent => ({
  contactEmail: r.contactEmail ?? seedSiteContent.contactEmail,
  contactInstagramUrl: r.contactInstagramUrl ?? seedSiteContent.contactInstagramUrl,
  contactInstagramHandle: r.contactInstagramHandle ?? seedSiteContent.contactInstagramHandle,
  contactIntro: r.contactIntro ?? seedSiteContent.contactIntro,
  aboutPortrait: r.aboutPortrait ?? seedSiteContent.aboutPortrait,
  aboutBio: r.aboutBio ?? seedSiteContent.aboutBio,
  aboutExhibitions: r.aboutExhibitions ?? seedSiteContent.aboutExhibitions,
  availableHeading: r.availableHeading ?? seedSiteContent.availableHeading,
  availableIntro: r.availableIntro ?? seedSiteContent.availableIntro,
  heroTitle: r.heroTitle ?? null,
  heroSubtitle: r.heroSubtitle ?? null,
  navProjectsLabel: r.navProjectsLabel ?? seedSiteContent.navProjectsLabel,
  navAvailableLabel: r.navAvailableLabel ?? seedSiteContent.navAvailableLabel,
  navAboutLabel: r.navAboutLabel ?? seedSiteContent.navAboutLabel,
  navContactLabel: r.navContactLabel ?? seedSiteContent.navContactLabel,
  navShowPublications: r.navShowPublications ?? false,
  navShowNews: r.navShowNews ?? false,
  projectCategories: r.projectCategories ?? seedSiteContent.projectCategories,
  navExtraLinks: r.navExtraLinks ?? seedSiteContent.navExtraLinks,
});

/** Newline-separated list → trimmed, non-empty array (project categories). */
export function parseCategoryList(s: string | null): string[] {
  return (s ?? "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

export type NavLink = { label: string; href: string };

/** Extra nav links, one per line as `Label | /path` or `Label | https://…`. */
export function parseNavLinks(s: string | null): NavLink[] {
  return (s ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, href] = line.split("|").map((p) => p.trim());
      return label && href ? { label, href } : null;
    })
    .filter((x): x is NavLink => x !== null);
}

export async function getSiteContent(locals: App.Locals): Promise<SiteContent> {
  return readOrSeed(locals, "getSiteContent", async (db) => {
    const rows = await db.select().from(siteContent).where(eq(siteContent.id, 1)).limit(1);
    return rows[0] ? asSiteContent(rows[0]) : seedSiteContent;
  }, seedSiteContent);
}

/**
 * Every image URL currently referenced somewhere in the content (project covers
 * + galleries, publication covers + galleries, news images, the bio portrait).
 * Used by /admin/media to tell which uploaded media objects are "in use" vs
 * orphaned.
 */
export async function getReferencedImageUrls(locals: App.Locals): Promise<Set<string>> {
  const [ps, pubs, ns, site] = await Promise.all([
    getProjects(locals),
    getPublications(locals),
    getNews(locals),
    getSiteContent(locals),
  ]);
  const urls = new Set<string>();
  for (const p of ps) {
    if (p.image) urls.add(p.image);
    for (const g of p.gallery) urls.add(g);
  }
  for (const p of pubs) {
    if (p.image) urls.add(p.image);
    for (const g of p.gallery) urls.add(g);
  }
  for (const n of ns) if (n.image) urls.add(n.image);
  if (site.aboutPortrait) urls.add(site.aboutPortrait);
  return urls;
}
