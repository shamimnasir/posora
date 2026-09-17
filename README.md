# পসরা · posora.com

শিশু ও বড়দের জন্য বাংলায় ইন্টারঅ্যাকটিভ শেখার সাইট। Astro 7 · Cloudflare Workers (on-demand pages backed by D1, static assets) · Three.js procedural planets.

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

### SSLCommerz digital-pack checkout

The ৳249 digital-pack bundle is wired to a hosted SSLCommerz checkout. The
browser never receives merchant credentials or decides the price. The Worker
creates a pending order in D1, sends the customer to SSLCommerz, and accepts
success/fail/cancel callbacks plus IPN. A payment is only marked paid after
server-side validation; a valid payment grants the digital-pack entitlement to
the member account. Risk-flagged payments remain held for review.

Add the merchant credentials as Cloudflare secrets (never commit them):

```bash
npx wrangler secret put SSLCOMMERZ_STORE_ID
npx wrangler secret put SSLCOMMERZ_STORE_PASSWORD
npx wrangler secret put SSLCOMMERZ_MODE       # sandbox first; use live for production
npx wrangler secret put DIGITAL_PACK_READY    # only "true" after files are live
npx wrangler deploy
```

In the SSLCommerz merchant panel, set the IPN URL to
`https://posora.com/api/sslcommerz/ipn`. Until the two merchant credentials are
present, the checkout page intentionally shows a setup message and takes no
payment. `DIGITAL_PACK_READY` is an independent release switch: leave it unset
until the actual downloadable pack files and the member library are published.
The callback endpoints are `/api/sslcommerz/success`, `/fail`, and `/cancel`.

Paid files live in the private R2 bucket `posora-digital-packs` under
`digital-packs/`. The member account serves them through
`/api/digital-pack/download/<slug>` only after the `digital-pack-bundle`
entitlement is active. Generate the release files locally with
`npm run digital-packs`, upload each PDF (and the ZIP bundle) to R2, then set
`DIGITAL_PACK_READY=true` only after the member library has been deployed.

## Admin panel

`/admin` manages the whole site: every world's fields, categories, items, key
interactions and missions, plus the non-world datasets — with a draft/published
state per world and an audit log.

Content lives in **D1**, read at request time. The files in `src/data/` remain the
fallback: if D1 is empty or unreachable, the site renders exactly as it did
before, so a database problem can never take posora.com down.

### One-time setup

```bash
npm run db:migrate                   # create the tables on the remote database
npm run deploy
```

Then set up a way in. **Google sign-in** is the one to prefer: there is no
password to lose, mistype, or leak.

1. Google Cloud Console → **APIs & Services → Credentials → Create credentials
   → OAuth client ID → Web application**.
2. Authorised redirect URI, exactly: `https://posora.com/api/admin/oauth/callback`
3. It gives you a client ID and a client secret.

```bash
npx wrangler secret put GOOGLE_CLIENT_ID       # the ...apps.googleusercontent.com one
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put ADMIN_EMAILS           # your Google address; comma separated for more
```

Only an address on `ADMIN_EMAILS` can enter, and Google must have verified it.
Anyone else who signs in successfully is still refused, and the attempt is
recorded in the audit log.

**A password is also supported**, and worth keeping as the way back in when
Google is not an option: a misconfigured OAuth client, an address that
changed. The panel shows whichever methods are configured.

```bash
node scripts/hash-password.mjs | npx wrangler secret put ADMIN_PASSWORD_HASH
```

That asks for the password on the terminal, echoes nothing, and pipes the hash
straight across, so the eighty-character hash never goes through a clipboard.
A password pasted where the hash belongs, or a stray leading space, fails
exactly the way a wrong password fails and tells you nothing.

Lockout is 8 failed passwords per IP, then 15 minutes. Retrying does not extend
it, and a successful login clears it. To clear one by hand:
`npx wrangler d1 execute posora --remote --command "DELETE FROM login_throttle"`.

Then open `https://posora.com/admin`, log in, and press **কনটেন্ট আমদানি করো** once.
That copies the current `src/data/` content into D1. It is idempotent: re-running
never overwrites edits (pass `?force=1` to reset a world back to its file version).

For local work, `.dev.vars` holds `ADMIN_PASSWORD_HASH` and `npm run db:migrate:local`
sets up the local database.

### How it behaves

| | |
|---|---|
| Publishing | A world set to খসড়া disappears from the homepage and its URL returns 404. Admins see it at `/<slug>?preview=1`. |
| Caching | Public pages are memoised for 30s per isolate and sent with `s-maxage=60`, so edits appear within about a minute. Preview requests bypass both. |
| Auth | PBKDF2-SHA256 password, opaque session cookie (HttpOnly/Secure/SameSite=Lax, 7 days). Only the SHA-256 of a session id is stored, and failed logins lock an IP after 8 tries. |
| Audit | Every save, publish and login — including failures — is recorded under কার্যক্রম. |

Worlds with `open: true` (মহাকাশ) have a bespoke explorer built in code; the panel
edits their metadata and copy, not the explorer itself.

## Where things live

| Path | What |
|---|---|
| `src/data/worlds.ts` | The 11 worlds, categories and item names (generated from PLAN.md) |
| `src/data/space.ts` | Solar-system content: stats, three reading depths, shader params, moons |
| `src/components/explorer/` | Explorer shell, WebGL planet renderer (GLSL noise), and `heroes.ts` — the procedural 3D engine: ~30 scene types built from primitives, one per category via `src/data/heroes.ts` |
| `src/pages/space/[...item].astro` | `/space/` and `/space/<body>/` — rendered on demand from the `space` dataset |
| `src/pages/[world]/index.astro` | Category explorers for the other 10 worlds — every category has a live, draggable 3D hero with a slider |
| `src/pages/api/contact.ts` | Contact form → Cloudflare Email Sending |
| `src/lib/content.ts` | The content layer — D1 first, `src/data/` as fallback, 30s isolate cache |
| `src/lib/db.ts`, `src/lib/auth.ts` | D1 queries; password verification and sessions |
| `src/pages/admin/` | The panel: dashboard, world list, world editor, JSON data editor, audit log |
| `src/pages/api/admin/` | Login/logout, world save & delete, publish toggle, dataset save, seed |
| `migrations/` | D1 schema |
| `src/lib/progress.ts` | XP / discovered items / stars — localStorage only, no accounts |
| `public/_headers` | CSP (`script-src 'self'`, no inline scripts), caching, security headers |

## Performance & security notes

- Fonts are self-hosted, subset per script; only the two Bengali faces needed for first paint are preloaded.
- Three.js loads lazily after first paint on explorer pages only; the home and contact pages ship < 13 KB gz of HTML+CSS+JS.
- `vite.build.assetsInlineLimit: 0` keeps every script external so the strict CSP holds.
- No cookies for visitors and no personal data; learner progress stays in the visitor's browser. The only cookie on the site is the admin session, set at `/admin` after login.

## Adding content

Day-to-day content changes go through `/admin` — no deploy needed. `src/data/` is now the seed and fallback: edit it when you want to change the defaults a fresh database starts from, or to add a solar-system body (copy an existing one; set `visual.type` to `sun | rocky | gas | earth | ice`), then re-import with `?force=1`. Check conjunct rendering (`ক্ষ জ্ঞ ঙ্ক্ষ হ্ম ন্ত্র`) after any font change.
