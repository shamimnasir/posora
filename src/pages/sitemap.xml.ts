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

export const prerender = false;

type Entry = { loc: string; priority: string };

export const GET: APIRoute = async ({ site }) => {
  const origin = (site ?? new URL('https://posora.com')).origin;

  const entries: Entry[] = [
    { loc: '/', priority: '1.0' },
    { loc: '/space/', priority: '0.9' },
    { loc: '/family/', priority: '0.9' },
    { loc: '/printables/', priority: '0.9' },
    { loc: '/schools/', priority: '0.8' },
    { loc: '/math/measurement/', priority: '0.7' },
    { loc: '/contact/', priority: '0.5' },
  ];

  try {
    const worlds = await getWorlds();
    // `open` worlds have their own bespoke routes, added separately below.
    for (const w of worlds) if (!w.open) entries.push({ loc: `/${w.slug}/`, priority: '0.8' });

    const bodies = await getBodies();
    for (const b of bodies) entries.push({ loc: `/space/${b.id}/`, priority: '0.7' });

    for (const s of sheets) entries.push({ loc: `/printables/${s.slug}/`, priority: '0.7' });
  } catch {
    // A content-layer failure must not take the sitemap down; the fixed pages
    // above are still worth serving.
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((e) => `  <url><loc>${origin}${e.loc}</loc><priority>${e.priority}</priority></url>`)
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
