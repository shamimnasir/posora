/**
 * Every readable item on the site, flattened into one list.
 *
 * The daily activities need to reach across all eleven worlds rather than sit
 * inside one, so something has to put মঙ্গল গ্রহ, ইলিশ and লসাগু in the same
 * array. This is that thing, and it is deliberately built from exactly the
 * data the world pages render, so the day's item can never be one that does
 * not exist or has no reading behind it.
 *
 * Server side only. The whole corpus is roughly the entire text of the site;
 * a page picks the handful of entries it needs and serialises only those.
 */
import type { ItemDetail } from '../data/explorer-types';
import type { World } from '../data/worlds';
import { getWorlds } from './content';
import { EXPLORERS, itemKey } from './explorers';
import { bodies } from '../data/space';
import { spaceExplorer } from '../data/space-explorer';
import { emojiFor } from '../data/item-emoji';
import { bodyEmoji } from '../data/cat-emoji';
import { collectionFor } from '../data/collections';
import type { CorpusItem } from './daily';

/**
 * One readable item plus its reading, the key progress is stored under, and
 * the figure that stands for it on the shelf where it has one of its own.
 */
export type Entry = CorpusItem & { d: ItemDetail; key: string; emoji?: string; href: string; fig?: string };

/** A whole category, which is what the quiz and odd-one-out draw from. */
export type PoolCat = {
  w: string; wn: string; hue: string; ci: number; c: string;
  items: string[]; detail: ItemDetail[];
};

/** Space keeps its bodies in one bucket: that is the unit its page marks seen. */
export const SPACE_CAT = 'সৌরজগতের বস্তু';

/**
 * Flatten the catalogue. `worlds` is passed in where the caller already has it,
 * because `getWorlds()` hits D1 and one page should not ask twice.
 */
export async function buildCorpus(worlds?: World[]): Promise<{ entries: Entry[]; cats: PoolCat[] }> {
  const ws = worlds ?? (await getWorlds());
  const entries: Entry[] = [];
  const cats: PoolCat[] = [];

  for (const w of ws) {
    if (w.open) {
      // Space. The tracked unit is a body, so those are the entries; the
      // explorer's deeper categories still feed the question pool.
      bodies.forEach((b, ii) => {
        entries.push({
          w: w.slug, wn: w.bn, hue: w.hue, c: SPACE_CAT, ci: 0, n: b.bn, ii,
          d: { chips: b.chips, l1: b.l1, l2: b.l2, l3: b.l3, fun: b.fun },
          key: b.id, href: `/space/${b.id}/`, emoji: bodyEmoji(b.id),
        });
      });
      cats.push({
        w: w.slug, wn: w.bn, hue: w.hue, ci: 0, c: SPACE_CAT,
        items: bodies.map((b) => b.bn),
        detail: bodies.map((b) => ({ chips: b.chips, l1: b.l1, l2: b.l2, l3: b.l3, fun: b.fun })),
      });
      w.cats.forEach((c, ci) => {
        const d = spaceExplorer[ci];
        if (!d || d.length !== c.items.length) return;
        cats.push({ w: w.slug, wn: w.bn, hue: w.hue, ci, c: c.n, items: c.items, detail: d });
      });
      continue;
    }

    const explorer = EXPLORERS[w.slug];
    if (!explorer) continue;
    w.cats.forEach((c, ci) => {
      const d = explorer[ci];
      // A category whose reading is not finished, or a tool category that links
      // out instead of opening, contributes nothing. That is the whole check
      // that keeps an unwritten item out of today's card.
      if (!d || d.length !== c.items.length || c.lab) return;
      cats.push({ w: w.slug, wn: w.bn, hue: w.hue, ci, c: c.n, items: c.items, detail: d });
      const col = collectionFor(w.slug, c.n);
      c.items.forEach((n, ii) => {
        entries.push({
          w: w.slug, wn: w.bn, hue: w.hue, c: c.n, ci, n, ii,
          d: d[ii]!, key: itemKey(c.n, n), emoji: emojiFor(w.slug, n),
          href: `/${w.slug}/?cat=${ci}`,
          fig: col ? (col.items[n] ?? col.fallback) : undefined,
        });
      });
    });
  }
  return { entries, cats };
}
