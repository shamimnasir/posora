/**
 * The sitemap robots.txt has always pointed at, which until now returned 404.
 *
 * It is generated rather than checked in because the world list is content, not
 * configuration: it comes through src/lib/content.ts, so a world published from
 * the admin panel appears here without anyone remembering to edit a file. Only
 * pages that actually exist are listed, and /admin and /api are left out on
 * purpose.
 */
import type { APIRoute } from 'astro';
import { getWorlds, getBodies } from '../lib/content';
import { sheets } from '../data/printables';
import { POSTS } from '../data/blog';

export const prerender = false;

type Entry = { loc: string };

export const GET: APIRoute = async ({ site }) => {
  const origin = (site ?? new URL('https://posora.com')).origin;

  const entries: Entry[] = [
    { loc: '/' },
    { loc: '/today/' },
    { loc: '/space/' },
    { loc: '/family/' },
    { loc: '/collection/' },
    { loc: '/ladder/' },
    { loc: '/printables/' },
    { loc: '/schools/' },
    { loc: '/blog/' },
    { loc: '/contact/' },
    // Public product landing page; checkout and confirmation are intentionally
    // excluded because they are transactional/noindex routes.
    { loc: '/digital-pack/' },
  ];

  try {
    const worlds = await getWorlds();
    // `open` worlds have their own bespoke routes, added separately below.
    for (const w of worlds) if (!w.open) entries.push({ loc: `/${w.slug}/` });

    const bodies = await getBodies();
    for (const b of bodies) entries.push({ loc: `/space/${b.id}/` });

    for (const s of sheets) entries.push({ loc: `/printables/${s.slug}/` });
    for (const p of POSTS) entries.push({ loc: `/blog/${p.slug}/` });

    /**
     * Every hands-on lab, derived rather than listed.
     *
     * Only /math/measurement/ used to be here, typed by hand, so the other
     * nine hand-built labs and every lab rendered from data/labs were invisible
     * to search. The content layer already attaches `lab` to a category for
     * both kinds, so deriving it means a new lab cannot be forgotten. `open`
     * worlds are included: they are skipped above because their hub has its own
     * route, not because their categories have no labs.
     */
    const labs = new Set<string>();
    for (const w of worlds) for (const c of w.cats) if (c.lab) labs.add(c.lab);
    for (const loc of labs) entries.push({ loc });
  } catch {
    // A content-layer failure must not take the sitemap down; the fixed pages
    // above are still worth serving.
  }

  // Deliberately omit lastmod: the content sources do not expose trustworthy
  // per-page edit dates. A sitemap request time is not a content update time.
  // URLs are canonicalized and deduplicated before output in case a lab is
  // also listed as a bespoke route.
  const uniqueEntries = [...new Map(entries.map((entry) => [entry.loc, entry])).values()];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueEntries
  .map((e) => `  <url><loc>${origin}${e.loc}</loc></url>`)
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
};
