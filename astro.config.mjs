// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://posora.com',
  adapter: cloudflare({ imageService: 'compile' }),
  trailingSlash: 'ignore',
  session: false, // no server sessions - progress lives in the visitor's browser
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
