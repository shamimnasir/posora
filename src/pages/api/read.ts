import type { APIRoute } from 'astro';
import { getWorlds } from '../../lib/content';
import { EXPLORERS } from '../../lib/explorers';
import { bodies } from '../../data/space';
import { spaceExplorer } from '../../data/space-explorer';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // The reading for one item never changes without a deploy, so this can
      // sit in the edge cache for a good while.
      'cache-control': status === 200 ? 'public, max-age=300, s-maxage=86400' : 'no-store',
    },
  });

/**
 * The reading for one item, on its own.
 *
 * পড়ার সিঁড়ি needs to show any of 787 readings without shipping all of them,
 * which is most of the text of the site. Sending the whole catalogue to every
 * visitor so they can read four things would be a megabyte to save a request.
 *
 * Nothing here is personal and nothing is written: it is the same public text
 * the world page renders, addressed one item at a time.
 */
export const GET: APIRoute = async ({ url }) => {
  const w = url.searchParams.get('w') ?? '';
  const ci = Number(url.searchParams.get('c'));
  const ii = Number(url.searchParams.get('i'));
  if (!w || !Number.isInteger(ci) || !Number.isInteger(ii) || ci < 0 || ii < 0) {
    return json({ ok: false, error: 'bad-params' }, 400);
  }

  // Space keeps its bodies in one list rather than in a category's items.
  if (w === 'space' && ci === 0) {
    const b = bodies[ii];
    if (!b) return json({ ok: false, error: 'not-found' }, 404);
    return json({ ok: true, n: b.bn, chips: b.chips, l1: b.l1, l2: b.l2, l3: b.l3, fun: b.fun, href: `/space/${b.id}/` });
  }

  const world = (await getWorlds()).find((x) => x.slug === w);
  const cat = world?.cats[ci];
  if (!world || !cat) return json({ ok: false, error: 'not-found' }, 404);

  const detail = (w === 'space' ? spaceExplorer : EXPLORERS[w])?.[ci];
  const d = detail?.[ii];
  const name = cat.items[ii];
  if (!d || !name || detail!.length !== cat.items.length) return json({ ok: false, error: 'not-found' }, 404);

  return json({
    ok: true, n: name, chips: d.chips, l1: d.l1, l2: d.l2, l3: d.l3, fun: d.fun,
    href: w === 'space' ? '/space/' : `/${w}/?cat=${ci}`,
  });
};
