/**
 * Environment/bindings shape for the ggeran Worker (Pages Functions runtime).
 * Hand-written (not `wrangler types`) so the offline Nix build needs no
 * codegen. Only the surfaces this app actually uses are declared.
 */
interface Env {
  /** R2 bucket holding site media (see wrangler.toml). */
  MEDIA: R2Bucket;
  /** D1 database holding the CMS content (see wrangler.toml). */
  DB: D1Database;
  AUTH_SECRET: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  /** Dev-only escape hatch: serve seed content when the DB is unavailable. */
  SEED_FALLBACK: string;
  /** Media quota in MB (defaults to 500 in lib/media.ts when unset). */
  QUOTA_MB: string;
}

/** Minimal D1 surface used by drizzle-orm/d1. */
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  query<T = unknown>(query: string, params?: unknown[]): Promise<D1Result<T>>;
  exec(query: string): Promise<unknown>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown[]>(opts?: { columnNames?: boolean }): Promise<T[]>;
}

interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: unknown;
}

/** Minimal R2 surface used by lib/media.ts and /media/[...key]. */
interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  head(key: string): Promise<R2Object | null>;
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream | string,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<R2Object>;
  delete(keys: string | string[]): Promise<void>;
  list(options?: {
    cursor?: string;
    limit?: number;
  }): Promise<{ objects: R2Object[]; truncated: boolean; cursor?: string }>;
}

interface R2Object {
  key: string;
  size: number;
  uploaded: Date;
  httpEtag: string;
  httpMetadata?: { contentType?: string };
}

interface R2ObjectBody extends R2Object {
  body: ReadableStream;
  writeHttpMetadata(headers: Headers): void;
}

declare namespace App {
  interface Locals {
    /**
     * Set by the Cloudflare adapter (request handler in prod, platformProxy
     * middleware in dev). Always present where getEnv() is called.
     */
    runtime?: {
      env: Env;
      cf: unknown;
      caches: CacheStorage;
      ctx: { waitUntil(promise: Promise<unknown>): void };
    };
  }
}
