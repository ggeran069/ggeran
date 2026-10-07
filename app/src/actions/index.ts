import { defineAction, ActionError } from "astro:actions";

import { z } from "astro:schema";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { projects, publications, news, siteContent } from "@/db/schema";
import {
  checkCredentials,
  createSession,
  SESSION_COOKIE,
} from "@/lib/session";
import { deleteMedia } from "@/lib/media";
import {
  boolField,
  dbMissing,
  idField,
  intField,
  isUniqueViolation,
  requireAdmin,
  slugConflict,
  slugify,
  strField,
  strListField,
} from "./util";

/**
 * All admin mutations, as Astro Actions (progressive enhancement: plain HTML
 * forms POST here and Astro re-renders the page with results — no JS needed).
 * Every handler re-checks the session (requireAdmin); the middleware guards
 * /_actions/* at the edge too.
 */

const COOKIE_OPTS = {
  httpOnly: true,
  secure: import.meta.env.PROD, // plain-http localhost still needs the cookie in dev
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: "/",
} as const;

const projectSchema = z.object({
  slug: strField,
  title: strField,
  year: intField,
  date: strField,
  ref: strField,
  category: strField,
  location: strField,
  medium: strField,
  dimensions: strField,
  edition: strField,
  availability: strField,
  series: strField,
  featured: boolField,
  weight: intField,
  image: strField,
  gallery: strListField,
  body: strField,
});

const publicationSchema = z.object({
  slug: strField,
  title: strField,
  year: intField,
  date: strField,
  ref: strField,
  category: strField,
  publisher: strField,
  author: strField,
  isbn: strField,
  pages: strField,
  format: strField,
  edition: strField,
  image: strField,
  gallery: strListField,
  body: strField,
});

const newsSchema = z.object({
  slug: strField,
  title: strField,
  date: strField,
  summary: strField,
  image: strField,
  body: strField,
});

const siteContentSchema = z.object({
  contactEmail: strField,
  contactInstagramUrl: strField,
  contactInstagramHandle: strField,
  contactIntro: strField,
  aboutPortrait: strField,
  aboutBio: strField,
  aboutExhibitions: strField,
  availableHeading: strField,
  availableIntro: strField,
  heroTitle: strField,
  heroSubtitle: strField,
  navProjectsLabel: strField,
  navAvailableLabel: strField,
  navAboutLabel: strField,
  navContactLabel: strField,
  navShowPublications: boolField,
  navShowNews: boolField,
  projectCategories: strField,
  navExtraLinks: strField,
});

/** Common checks: admin session + configured DB + non-empty title (narrowed). */
function prepare(ctx: Parameters<typeof requireAdmin>[0], title: string | null) {
  if (!title) {
    throw new ActionError({ code: "BAD_REQUEST", message: "Title is required." });
  }
  const db = getDb(ctx.locals);
  if (!db) throw dbMissing();
  return { db, title };
}

function finalizeSlug(input: { slug: string | null; title: string }): string {
  const slug = slugify(input.slug || input.title);
  if (!slug) {
    throw new ActionError({
      code: "BAD_REQUEST",
      message: "Could not derive a slug — provide a title or slug.",
    });
  }
  return slug;
}

export const server = {
  auth: {
    signIn: defineAction({
      accept: "form", // no-JS HTML form submissions (the default is JSON-only)
      input: z.object({
        email: z.string().min(1),
        password: z.string().min(1),
      }),
      handler: async (input, ctx) => {
        const env = getEnv(ctx.locals);
        if (!(await checkCredentials(env, input.email, input.password))) {
          throw new ActionError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password.",
          });
        }
        const token = await createSession(env);
        ctx.cookies.set(SESSION_COOKIE, token, COOKIE_OPTS);
        return { ok: true };
      },
    }),

    signOut: defineAction({
      handler: async (_input, ctx) => {
        ctx.cookies.delete(SESSION_COOKIE, { path: "/" });
        return { ok: true };
      },
    }),
  },

  projects: {
    create: defineAction({
      accept: "form", // no-JS HTML form submissions (the default is JSON-only)
      input: projectSchema,
      handler: async (input, ctx) => {
        await requireAdmin(ctx);
        const { db, title } = prepare(ctx, input.title);
        const slug = finalizeSlug({ slug: input.slug, title });
        const data = { ...input, title, slug, weight: input.weight ?? 1 };
        try {
          await db.insert(projects).values(data);
        } catch (e) {
          if (isUniqueViolation(e)) throw slugConflict();
          throw e;
        }
        return { ok: true };
      },
    }),

    update: defineAction({
      accept: "form", // no-JS HTML form submissions (the default is JSON-only)
      input: projectSchema.extend({ id: idField }),
      handler: async (input, ctx) => {
        await requireAdmin(ctx);
        const { id, ...rest } = input;
        const { db, title } = prepare(ctx, rest.title);
        const slug = finalizeSlug({ slug: rest.slug, title });
        const data = { ...rest, title, slug, weight: rest.weight ?? 1 };
        try {
          await db
            .update(projects)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(projects.id, id));
        } catch (e) {
          if (isUniqueViolation(e)) throw slugConflict();
          throw e;
        }
        return { ok: true };
      },
    }),

    delete: defineAction({
      accept: "form", // no-JS HTML form submissions (the default is JSON-only)
      input: z.object({ id: idField }),
      handler: async ({ id }, ctx) => {
        await requireAdmin(ctx);
        const db = getDb(ctx.locals);
        if (!db) throw dbMissing();
        await db.delete(projects).where(eq(projects.id, id));
        return { ok: true };
      },
    }),
  },

  publications: {
    create: defineAction({
      accept: "form", // no-JS HTML form submissions (the default is JSON-only)
      input: publicationSchema,
      handler: async (input, ctx) => {
        await requireAdmin(ctx);
        const { db, title } = prepare(ctx, input.title);
        const slug = finalizeSlug({ slug: input.slug, title });
        const data = { ...input, title, slug };
        try {
          await db.insert(publications).values(data);
        } catch (e) {
          if (isUniqueViolation(e)) throw slugConflict();
          throw e;
        }
        return { ok: true };
      },
    }),

    update: defineAction({
      accept: "form", // no-JS HTML form submissions (the default is JSON-only)
      input: publicationSchema.extend({ id: idField }),
      handler: async (input, ctx) => {
        await requireAdmin(ctx);
        const { id, ...rest } = input;
        const { db, title } = prepare(ctx, rest.title);
        const slug = finalizeSlug({ slug: rest.slug, title });
        const data = { ...rest, title, slug };
        try {
          await db
            .update(publications)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(publications.id, id));
        } catch (e) {
          if (isUniqueViolation(e)) throw slugConflict();
          throw e;
        }
        return { ok: true };
      },
    }),

    delete: defineAction({
      accept: "form", // no-JS HTML form submissions (the default is JSON-only)
      input: z.object({ id: idField }),
      handler: async ({ id }, ctx) => {
        await requireAdmin(ctx);
        const db = getDb(ctx.locals);
        if (!db) throw dbMissing();
        await db.delete(publications).where(eq(publications.id, id));
        return { ok: true };
      },
    }),
  },

  news: {
    create: defineAction({
      accept: "form", // no-JS HTML form submissions (the default is JSON-only)
      input: newsSchema,
      handler: async (input, ctx) => {
        await requireAdmin(ctx);
        const { db, title } = prepare(ctx, input.title);
        const slug = finalizeSlug({ slug: input.slug, title });
        const data = { ...input, title, slug };
        try {
          await db.insert(news).values(data);
        } catch (e) {
          if (isUniqueViolation(e)) throw slugConflict();
          throw e;
        }
        return { ok: true };
      },
    }),

    update: defineAction({
      accept: "form", // no-JS HTML form submissions (the default is JSON-only)
      input: newsSchema.extend({ id: idField }),
      handler: async (input, ctx) => {
        await requireAdmin(ctx);
        const { id, ...rest } = input;
        const { db, title } = prepare(ctx, rest.title);
        const slug = finalizeSlug({ slug: rest.slug, title });
        const data = { ...rest, title, slug };
        try {
          await db
            .update(news)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(news.id, id));
        } catch (e) {
          if (isUniqueViolation(e)) throw slugConflict();
          throw e;
        }
        return { ok: true };
      },
    }),

    delete: defineAction({
      accept: "form", // no-JS HTML form submissions (the default is JSON-only)
      input: z.object({ id: idField }),
      handler: async ({ id }, ctx) => {
        await requireAdmin(ctx);
        const db = getDb(ctx.locals);
        if (!db) throw dbMissing();
        await db.delete(news).where(eq(news.id, id));
        return { ok: true };
      },
    }),
  },

  content: {
    /** Upsert the singleton site-content row (id = 1). */
    save: defineAction({
      accept: "form", // no-JS HTML form submissions (the default is JSON-only)
      input: siteContentSchema,
      handler: async (input, ctx) => {
        await requireAdmin(ctx);
        const { db } = prepare(ctx, "site-content");
        await db
          .insert(siteContent)
          .values({ id: 1, ...input })
          .onConflictDoUpdate({
            target: siteContent.id,
            set: { ...input, updatedAt: new Date() },
          });
        return { ok: true };
      },
    }),
  },

  media: {
    /** Permanently delete an uploaded media object. */
    delete: defineAction({
      accept: "form", // no-JS HTML form submissions (the default is JSON-only)
      input: z.object({ key: z.string().min(1) }),
      handler: async ({ key }, ctx) => {
        await requireAdmin(ctx);
        try {
          await deleteMedia(ctx.locals, key);
        } catch (e) {
          console.error("[media] delete failed", e);
        }
        return { ok: true };
      },
    }),
  },
};
