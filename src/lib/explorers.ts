/**
 * The per-world reading datasets in one place, keyed by world slug, plus the
 * counts the membership features need. The world page, the coverage numbers,
 * the quiz and the worksheet all read from here so they cannot disagree about
 * which categories are readable.
 */
import type { ItemDetail } from '../data/explorer-types';
import type { World } from '../data/worlds';
import { bodies } from '../data/space';
import { mathExplorer } from '../data/math-explorer';
import { physicsExplorer } from '../data/physics-explorer';
import { chemistryExplorer } from '../data/chemistry-explorer';
import { lifeExplorer } from '../data/life-explorer';
import { natureExplorer } from '../data/nature-explorer';
import { foodExplorer } from '../data/food-explorer';
import { moneyExplorer } from '../data/money-explorer';
import { languageExplorer } from '../data/language-explorer';
import { socialExplorer } from '../data/social-explorer';
import { discoveryExplorer } from '../data/discovery-explorer';

export const EXPLORERS: Record<string, (ItemDetail[] | null)[]> = {
  math: mathExplorer, physics: physicsExplorer, chemistry: chemistryExplorer,
  life: lifeExplorer, nature: natureExplorer, food: foodExplorer,
  money: moneyExplorer, language: languageExplorer, social: socialExplorer,
  discovery: discoveryExplorer,
};

/** The reading for one category, or null when it is a tool or unwritten. */
export function catDetail(slug: string, i: number): ItemDetail[] | null {
  return EXPLORERS[slug]?.[i] ?? null;
}

/** True when every item in the category has its reading written. */
export function isReadable(w: World, i: number): boolean {
  const c = w.cats[i];
  const d = catDetail(w.slug, i);
  return !!c && !!d && d.length === c.items.length;
}

/** Indexes of the categories a child can actually read through. */
export function readableCats(w: World): number[] {
  return w.cats.map((_, i) => i).filter((i) => isReadable(w, i));
}

/**
 * How many items count toward finishing a world. For space the unit is a
 * body in the explorer; for every other world it is a readable item.
 */
export function readableCount(w: World): number {
  if (w.open) return bodies.length;
  return readableCats(w).reduce((n, i) => n + w.cats[i]!.items.length, 0);
}

/** The progress key the site stores for an item, shared by device and server. */
export const itemKey = (catName: string, item: string) => `${catName}:${item}`;
