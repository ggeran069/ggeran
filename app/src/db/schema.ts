import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * Content schema for the photography CMS. Drizzle + Cloudflare D1 (SQLite).
 * `date` columns are stored as 'YYYY-MM-DD' text; `gallery` is a JSON column
 * (SQLite has no array type) holding an array of /media/<key> URLs.
 */
export const projects = sqliteTable(
  "projects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    year: integer("year"),
    date: text("date"),
    ref: text("ref"),
    category: text("category"),
    location: text("location"),
    medium: text("medium"),
    dimensions: text("dimensions"),
    edition: text("edition"),
    availability: text("availability"), // for-sale | sold | reserved | not-for-sale
    series: text("series"),
    featured: integer("featured", { mode: "boolean" }).default(false),
    weight: integer("weight").default(1),
    image: text("image"), // cover image URL
    gallery: text("gallery", { mode: "json" }).$type<string[]>(), // additional image URLs
    body: text("body"), // description (markdown)
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("projects_slug_idx").on(t.slug)],
);

export const publications = sqliteTable(
  "publications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    year: integer("year"),
    date: text("date"),
    ref: text("ref"),
    category: text("category"),
    publisher: text("publisher"),
    author: text("author"),
    isbn: text("isbn"),
    pages: text("pages"),
    format: text("format"),
    edition: text("edition"),
    image: text("image"),
    gallery: text("gallery", { mode: "json" }).$type<string[]>(),
    body: text("body"),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("publications_slug_idx").on(t.slug)],
);

export const news = sqliteTable(
  "news",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    date: text("date"),
    summary: text("summary"),
    image: text("image"),
    body: text("body"),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("news_slug_idx").on(t.slug)],
);

/**
 * Singleton site-wide content (single row, id = 1). Edited via /admin/content.
 * Falls back to `seedSiteContent` in `db/seed-data.ts` when no row exists.
 */
export const siteContent = sqliteTable("site_content", {
  id: integer("id").primaryKey(),
  contactEmail: text("contact_email"),
  contactInstagramUrl: text("contact_instagram_url"),
  contactInstagramHandle: text("contact_instagram_handle"),
  contactIntro: text("contact_intro"),
  aboutPortrait: text("about_portrait"),
  aboutBio: text("about_bio"),
  aboutExhibitions: text("about_exhibitions"),
  availableHeading: text("available_heading"),
  availableIntro: text("available_intro"),
  heroTitle: text("hero_title"),
  heroSubtitle: text("hero_subtitle"),
  navProjectsLabel: text("nav_projects_label"),
  navAvailableLabel: text("nav_available_label"),
  navAboutLabel: text("nav_about_label"),
  navContactLabel: text("nav_contact_label"),
  navShowPublications: integer("nav_show_publications", { mode: "boolean" }).default(false),
  navShowNews: integer("nav_show_news", { mode: "boolean" }).default(false),
  projectCategories: text("project_categories"),
  navExtraLinks: text("nav_extra_links"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
