// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://posora.com',
  adapter: cloudflare({ imageService: 'compile' }),
  trailingSlash: 'ignore',
  session: false, // no server sessions - progress lives in the visitor's browser
  compressHTML: true,
  build: { inlineStylesheets: 'auto' },
  fonts: [
    {
      // Noto Sans Bengali: a clean, highly legible humanist sans with excellent
      // conjunct rendering. Used for both body and headings (via weight) for a
      // single, consistent typographic voice across the site.
      provider: fontProviders.google(),
      name: 'Noto Sans Bengali',
      cssVariable: '--font-body',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['bengali', 'latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Noto Sans Bengali',
      cssVariable: '--font-display',
      weights: [700, 800],
      styles: ['normal'],
      subsets: ['bengali', 'latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
  vite: {
    // Never inline scripts: the CSP is `script-src 'self'` (no inline).
    build: { cssCodeSplit: true, assetsInlineLimit: 0 },
  },
});
