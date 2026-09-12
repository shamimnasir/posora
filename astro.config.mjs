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
  fonts: [
    {
      // Noto Sans Bengali: a clean, highly legible humanist sans with excellent
      // conjunct rendering. One family for body and headings, separated by
      // weight, for a single typographic voice across the site.
      //
      // Declared once, not twice. It used to be listed again under a second
      // cssVariable for the display weights, which changed nothing about what
      // was downloaded (same family, same two files) and put twelve duplicate
      // @font-face blocks into the head of every page. `--font-display` is now
      // an alias in global.css.
      provider: fontProviders.google(),
      name: 'Noto Sans Bengali',
      cssVariable: '--font-body',
      weights: [400, 500, 600, 700, 800],
      styles: ['normal'],
      // Bengali only. The Latin subset was another 25KB on every page to set
      // "posora.com" and the English names in brackets, and Noto's Latin is
      // near enough to a device's own sans that almost nobody could pick the
      // difference. The fallback stack below covers it.
      subsets: ['bengali'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
  vite: {
    // Never inline scripts: the CSP is `script-src 'self'` (no inline).
    build: { cssCodeSplit: true, assetsInlineLimit: 0 },
  },
});
