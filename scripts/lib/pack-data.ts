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
import { buildQuiz, blankOut } from '../../src/lib/quiz';
import { rng, hash, shuffle } from '../../src/lib/rand';
import { bodies } from '../../src/data/space';
import { vowels, consonants, kars, folas, conjuncts } from '../../src/data/language';
import { numberWords, denominations, shopItems } from '../../src/data/math';
import { MISSIONS } from '../../src/data/missions';
import { digitalPacks, bundle } from '../../src/data/digital-packs';
import { emojiFor } from '../../src/data/item-emoji';

/**
 * The paper যাচাই. The site's quiz asks about each item's short reading, which
 * is exactly what the paper অনুশীলনী already blanks out, so on paper the child
 * would answer the same ten sentences twice. This one asks about the card's
 * মজার তথ্য instead (or, where a card has none, its longer reading): the same
 * cards, different sentences, so it checks that the whole card was read.
 * The item's name is blanked the same way; a fact that still names it, or
 * names no one at all once blanked, is skipped rather than asked.
 */
function factQuiz(slug: string, cat: number, items: string[], detail: { l1: string; l2: string; fun: string }[]) {
  if (items.length < 4) return [];
  const r = rng(hash(`${slug}:${cat}:fq`));
  const out: { prompt: string; options: string[]; answer: number }[] = [];
  for (const i of shuffle(items.map((_, k) => k), r)) {
    const d = detail[i]!;
    const source = d.fun && d.fun !== d.l1 ? d.fun : d.l2;
    if (!source) continue;
    const prompt = blankOut(source, items[i]!);
    const core = items[i]!.split(/\s+/).filter((w) => w.length >= 3);
    if (core.some((w) => prompt.includes(w))) continue;
    // A blank glued to letters (মেরুদণ্ডী blanked inside অমেরুদণ্ডী) reads as a typo.
    if (/[\u0980-\u09FF]______|______[\u0995-\u09B9]/.test(prompt)) continue;
    // A wrong option the fact itself mentions would be a trap, not a distractor.
    const pool = items.map((_, j) => j).filter((j) => j !== i && !prompt.includes(items[j]!));
    if (pool.length < 3) continue;
    const others = shuffle(pool, rng(hash(`${slug}:${cat}:${i}:fq`))).slice(0, 3);
    const opts = shuffle([i, ...others], rng(hash(`${slug}:${cat}:${i}:fqo`)));
    out.push({ prompt, options: opts.map((j) => items[j]!), answer: opts.indexOf(i) });
    if (out.length === 8) break;
  }
  return out;
}
function readableCats(slug: string) {
  const w = worlds.find((x) => x.slug === slug)!;
  const out: { index: number; name: string; items: { name: string; emoji: string; chips: string[]; l1: string; fun: string }[]; worksheet: unknown; quiz: unknown; factQuiz: unknown }[] = [];
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
      items: c.items.map((name, k) => ({ name, emoji: emojiFor(slug, name) ?? '', chips: detail![k]!.chips, l1: detail![k]!.l1, fun: detail![k]!.fun })),
      worksheet: buildWorksheet(slug, i, c.items, detail),
      quiz: buildQuiz(slug, i, c.items, detail),
      factQuiz: factQuiz(slug, i, c.items, detail),
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
