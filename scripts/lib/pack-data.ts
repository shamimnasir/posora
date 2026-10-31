/**
 * The data snapshot behind the paid PDF packs.
 *
 * The generator runs in plain Node, which cannot import the site's TypeScript
 * modules (they import without extensions). This entry is bundled with esbuild
 * by scripts/generate-digital-packs.mjs and returns one plain object built
 * from the same, already fact-checked sources the site renders: the world
 * catalogue, the per-item readings, the worksheet and quiz builders, the
 * missions, the solar-system bodies and the language and math tables.
 * Nothing in the PDFs is written separately from these files.
 */
import { worlds } from '../../src/data/worlds';
import { EXPLORERS, isReadable } from '../../src/lib/explorers';
import { spaceExplorer, beltExtras } from '../../src/data/space-explorer';
import { buildWorksheet } from '../../src/lib/worksheet';
import { buildQuiz } from '../../src/lib/quiz';
import { bodies } from '../../src/data/space';
import { vowels, consonants, kars, folas, conjuncts } from '../../src/data/language';
import { numberWords, denominations, shopItems } from '../../src/data/math';
import { MISSIONS } from '../../src/data/missions';
import { digitalPacks, bundle } from '../../src/data/digital-packs';

function readableCats(slug: string) {
  const w = worlds.find((x) => x.slug === slug)!;
  const out: { index: number; name: string; items: { name: string; chips: string[]; l1: string; fun: string }[]; worksheet: unknown; quiz: unknown }[] = [];
  w.cats.forEach((c, i) => {
    let detail = null as null | { chips: string[]; l1: string; l2: string; l3: string; fun: string }[];
    if (slug === 'space') {
      const d = spaceExplorer[i];
      if (d && d.length === c.items.length) detail = d;
    } else if (isReadable(w, i)) {
      detail = EXPLORERS[slug]![i]!;
    }
    if (!detail) return;
    out.push({
      index: i,
      name: c.n,
      items: c.items.map((name, k) => ({ name, chips: detail![k]!.chips, l1: detail![k]!.l1, fun: detail![k]!.fun })),
      worksheet: buildWorksheet(slug, i, c.items, detail),
      quiz: buildQuiz(slug, i, c.items, detail),
    });
  });
  return out;
}

export function snapshot() {
  return {
    bundle,
    packs: digitalPacks,
    worlds: worlds.map((w) => ({
      slug: w.slug, bn: w.bn, en: w.en, tag: w.tag, hue: w.hue, age: w.age, intro: w.intro,
      catNames: w.cats.map((c) => c.n),
      missionNames: w.missions.map((m) => m.n),
      readable: readableCats(w.slug),
      missions: (MISSIONS[w.slug] ?? []).map((m, i) => (m ? { index: i, name: w.missions[i]?.n ?? '', spec: m } : null)).filter(Boolean),
    })),
    bodies: bodies.map((b) => ({ id: b.id, bn: b.bn, en: b.en, tagline: b.tagline, chips: b.chips, stats: b.stats.map((s) => ({ k: s.k, v: s.v })), gravity: b.gravity, au: b.au, l1: b.l1, fun: b.fun, colors: b.visual.colors, ring: !!b.visual.ring, moons: b.moons.length })),
    beltExtras: beltExtras.map((e) => ({ name: e.name, l1: e.detail.l1, fun: e.detail.fun, chips: e.detail.chips })),
    language: { vowels, consonants, kars, folas, conjuncts },
    math: { numberWords, denominations, shopItems },
  };
}
