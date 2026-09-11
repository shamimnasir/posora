# পসরা · posora.com

শিশু ও বড়দের জন্য বাংলায় ইন্টারঅ্যাকটিভ শেখার সাইট। Astro 7 · Cloudflare Workers (static assets + one API route) · Three.js procedural planets.

কাঠামো পরিকল্পনা: [PLAN.md](PLAN.md) · ভিজ্যুয়াল সংস্করণ: [plan.html](plan.html)

## Run locally

```bash
npm install
npm run dev        # http://localhost:4321  (workerd runtime, HMR)
npm run build      # → dist/client (static) + dist/server (worker)
npm run preview    # build + wrangler dev
```

## Deploy (Cloudflare Workers)

One-time, from your own terminal:

```bash
npx wrangler login
npx wrangler email sending enable posora.com   # lets the contact form send from @posora.com
```

Then every release:

```bash
npm run deploy
```

`wrangler.jsonc` binds the custom domains `posora.com` and `www.posora.com` — Cloudflare creates the DNS records on first deploy (the zone must already be on the account, which it is). The contact form posts to `/api/contact`, which sends to `CONTACT_TO` via the `EMAIL` binding; until Email Sending is enabled the form falls back to WhatsApp / mailto with the message pre-filled.

## Where things live

| Path | What |
|---|---|
| `src/data/worlds.ts` | The 11 worlds, categories and item names (generated from PLAN.md) |
| `src/data/space.ts` | Solar-system content: stats, three reading depths, shader params, moons |
| `src/components/explorer/` | Explorer shell, WebGL planet renderer (GLSL noise), and `heroes.ts` — the procedural 3D engine: ~30 scene types built from primitives, one per category via `src/data/heroes.ts` |
| `src/pages/space/[...item].astro` | `/space/` and `/space/<body>/` — static, one page per body |
| `src/pages/[world]/index.astro` | Category explorers for the other 10 worlds — every category has a live, draggable 3D hero with a slider |
| `src/pages/api/contact.ts` | Contact form → Cloudflare Email Sending |
| `src/lib/progress.ts` | XP / discovered items / stars — localStorage only, no accounts |
| `public/_headers` | CSP (`script-src 'self'`, no inline scripts), caching, security headers |

## Performance & security notes

- Fonts are self-hosted, subset per script; only the two Bengali faces needed for first paint are preloaded.
- Three.js loads lazily after first paint on explorer pages only; the home and contact pages ship < 13 KB gz of HTML+CSS+JS.
- `vite.build.assetsInlineLimit: 0` keeps every script external so the strict CSP holds.
- No cookies, no analytics, no personal data; learner progress stays in the visitor's browser.

## Adding content

Add a body to `src/data/space.ts` (copy an existing one; set `visual.type` to `sun | rocky | gas | earth | ice`) — a new static page and rail entry appear on the next build. Check conjunct rendering (`ক্ষ জ্ঞ ঙ্ক্ষ হ্ম ন্ত্র`) after any font change.
