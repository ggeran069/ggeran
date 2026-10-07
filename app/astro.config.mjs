// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Every DB-driven page renders on demand (matches the old Next ISR-60
  // semantics, and keeps the offline Nix build hermetic — no build-time DB).
  output: 'server',
  site: 'https://ggeran.pages.dev', // TODO: confirm production hostname
  adapter: cloudflare({
    // Exposes wrangler.toml bindings + .dev.vars to `astro dev` via miniflare.
    platformProxy: { enabled: true },
    // Plain <img> everywhere — we never use astro:assets for remote CMS images.
    imageService: 'passthrough',
  }),
  // Tailwind v4 ships as a Vite plugin — no tailwind.config.js, no
  // postcss.config.js; theme lives in CSS (@theme in src/styles/global.css).
  //
  // Note: the adapter auto-configures an Astro session driver (KV binding
  // "SESSION") and logs a warning about it; harmless — auth is a stateless
  // JWT cookie and Astro.session is never used.
  vite: {
    plugins: [tailwindcss()],
  },
});
