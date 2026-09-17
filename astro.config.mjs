// @ts-check
// No `fonts` entry: the one Bengali face is self-hosted, built by
// scripts/make-font.py and declared in src/styles/font.css. The import of
// `fontProviders` that used to sit here implied otherwise, which is half of
// how the admin layout came to call a <Font> component for a family nothing
// had ever defined.
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://posora.com',
  adapter: cloudflare({ imageService: 'compile' }),
  trailingSlash: 'ignore',
  session: false, // no server sessions - progress lives in the visitor's browser
  // SSLCommerz posts its IPN from a different origin. Browser-facing write
  // routes enforce sameOrigin explicitly in src/lib/auth.ts; the framework
  // check must be off so the payment provider can reach its callback.
  security: { checkOrigin: false },
  compressHTML: true,
  // Fetch the next page while the pointer is still on its way to the link.
  // Every navigation here is a full server render of a heavy page, so the
  // difference between clicking and seeing is mostly this round trip.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'auto' },
  vite: {
    // Never inline scripts: the CSP is `script-src 'self'` (no inline).
    build: { cssCodeSplit: true, assetsInlineLimit: 0 },
  },
});
