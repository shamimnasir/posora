/**
 * How much of the site is actually written.
 *
 * Every claim in the site's copy about "how many things you can read" comes
 * from here, computed from the same data the pages render, so a claim cannot
 * drift away from the truth when content is added. Counting by hand is exactly
 * how the homepage ended up promising three reading depths for all 833 items
 * when 38 of them had no page at all.
 *
 * Three buckets, and they are different things:
 *  - `readable`  an item with chips and all three depths written
 *  - `tool`      an item that is a live interactive tool instead of reading
 *                (গণিত - পরিমাপ), which is more than reading, not less
 *  - `uncovered` an item that exists in the plan but has nothing behind it yet
 */
import { worlds } from '../data/worlds';
import { bodies } from '../data/space';
import { spaceExplorer, beltExtras } from '../data/space-explorer';
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
import type { ItemDetail } from '../data/explorer-types';
import { MISSIONS } from '../data/missions';
import { LABS } from '../data/labs';

const EXPLORERS: Record<string, (ItemDetail[] | null)[]> = {
  math: mathExplorer, physics: physicsExplorer, chemistry: chemistryExplorer,
  life: lifeExplorer, nature: natureExplorer, food: foodExplorer,
  money: moneyExplorer, language: languageExplorer, social: socialExplorer,
  discovery: discoveryExplorer,
};

export type Coverage = {
  /**
   * How many worlds and categories the site has.
   *
   * These live here for the same reason every other count does: copy that says
   * "১১টি ভুবন" or "৮৭টি বিভাগে" was typed by hand in six places, and a hand
   * typed number is right until the day somebody adds a category, after which
   * the site is quietly lying on the home page, the family page, the school
   * page and the printables page at once.
   */
  worlds: number;
  cats: number;
  total: number;
  readable: number;
  tool: number;
  uncovered: number;
  /** readable + tool: everything a visitor can genuinely do something with. */
  covered: number;
  /**
   * How many missions are actually playable, and how many categories have
   * something to DO rather than only to read.
   *
   * The home page used to say "তিনটি করে মিশন" because that was true of every
   * world on the day it was typed. It stopped being true the moment social got
   * eleven, and a hand-typed count is right until exactly that moment. A
   * mission listed in worlds.ts with no spec behind it is not playable and is
   * not counted.
   */
  missions: number;
  /** Categories with a hands-on lab - hand-built or described in data/labs. */
  labs: number;
  /** Categories with a mission, a lab, or both. */
  interactive: number;
};

function compute(): Coverage {
  let total = 0, readable = 0, tool = 0, uncovered = 0;
  for (const w of worlds) {
    const items = w.cats.reduce((s, c) => s + c.items.length, 0);
    total += items;
    if (w.open) {
      // Space is written in two places, so it is counted in two. The eleven
      // bodies each have their own page, built from `bodies`; everything else
      // is written in space-explorer.ts and read on the /space/ hub. Each item
      // is checked against both rather than subtracted, so the count cannot
      // quietly drift past the number of items that exist.
      const bodyNames = new Set(bodies.map((b) => b.bn));
      const extraNames = new Set(beltExtras.map((e) => e.name));
      w.cats.forEach((c, i) => {
        const d = spaceExplorer[i];
        if (d && d.length === c.items.length) { readable += c.items.length; return; }
        const ok = c.items.filter((it) => bodyNames.has(it) || extraNames.has(it)).length;
        readable += ok;
        uncovered += c.items.length - ok;
      });
      continue;
    }
    const ex = EXPLORERS[w.slug];
    w.cats.forEach((c, i) => {
      const d = ex?.[i];
      if (d && d.length === c.items.length) readable += c.items.length;
      else if (c.lab) tool += c.items.length;
      else uncovered += c.items.length;
    });
  }
  let missions = 0, labs = 0, interactive = 0;
  for (const w of worlds) {
    const specs = MISSIONS[w.slug] ?? [];
    const playable = new Set<number>();
    w.missionCats.forEach((c, i) => { if (c != null && specs[i]) playable.add(c); });
    missions += specs.filter(Boolean).length;
    const kit = new Set((LABS[w.slug] ?? []).map((l) => l.cat));
    w.cats.forEach((c, i) => {
      const hasLab = !!c.lab || kit.has(i);
      if (hasLab) labs++;
      if (hasLab || playable.has(i)) interactive++;
    });
  }

  return {
    worlds: worlds.length,
    cats: worlds.reduce((s, w) => s + w.cats.length, 0),
    total, readable, tool, uncovered, covered: readable + tool,
    missions, labs, interactive,
  };
}

export const COVERAGE: Coverage = compute();

/** Items a given world can genuinely show, used for the world cards. */
export function coverageFor(slug: string): { items: number; covered: number } {
  const w = worlds.find((x) => x.slug === slug);
  if (!w) return { items: 0, covered: 0 };
  const items = w.cats.reduce((s, c) => s + c.items.length, 0);
  if (w.open) {
    // same two-source count as compute(), so the per-world pill and the
    // site-wide total can never tell different stories
    const bodyNames = new Set(bodies.map((b) => b.bn));
    const extraNames = new Set(beltExtras.map((e) => e.name));
    let covered = 0;
    w.cats.forEach((c, i) => {
      const d = spaceExplorer[i];
      if (d && d.length === c.items.length) { covered += c.items.length; return; }
      covered += c.items.filter((it) => bodyNames.has(it) || extraNames.has(it)).length;
    });
    return { items, covered };
  }
  const ex = EXPLORERS[w.slug];
  let covered = 0;
  w.cats.forEach((c, i) => {
    const d = ex?.[i];
    if ((d && d.length === c.items.length) || c.lab) covered += c.items.length;
  });
  return { items, covered };
}
