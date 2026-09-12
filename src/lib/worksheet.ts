/**
 * অনুশীলনী - a paper worksheet generated from a category's own reading.
 *
 * Two exercises, both built from text that already exists so nothing can be
 * wrong in a new way:
 *   1. শূন্যস্থান পূরণ - each item's short reading with its name blanked, and a
 *      word bank of every item in the category to choose from.
 *   2. মিলাও - the items down the left, their first keyword shuffled down the
 *      right, to be joined with a line.
 * An answer key follows on its own page for the parent or teacher.
 */
import type { ItemDetail } from '../data/explorer-types';
import { blankOut } from './quiz';

export type Blank = { n: number; prompt: string; answer: string };
export type Match = { left: string; right: string };
export type Worksheet = {
  blanks: Blank[];
  bank: string[];
  matchLeft: string[];
  matchRight: string[];
  matchKey: Match[];
};

function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(arr: T[], r: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}

export const BLANKS_MAX = 10;
export const MATCH_MAX = 8;

export function buildWorksheet(world: string, cat: number, items: string[], detail: ItemDetail[]): Worksheet | null {
  if (items.length < 3 || detail.length !== items.length) return null;
  const r = seeded(`${world}:${cat}:ws`);
  const idx = items.map((_, i) => i);

  const blankIdx = shuffle(idx, r).slice(0, Math.min(BLANKS_MAX, items.length)).sort((a, b) => a - b);
  const blanks: Blank[] = blankIdx.map((i, n) => ({ n: n + 1, prompt: blankOut(detail[i]!.l1, items[i]!), answer: items[i]! }));
  const bank = shuffle(blankIdx.map((i) => items[i]!), seeded(`${world}:${cat}:bank`));

  // Matching pairs use the first keyword, skipping any that just repeats the name.
  const pairs: Match[] = idx
    .map((i) => ({ left: items[i]!, right: detail[i]!.chips.find((c) => c !== items[i]) ?? detail[i]!.chips[0] ?? '' }))
    .filter((p) => p.right && p.right !== p.left);
  const matchKey = shuffle(pairs, seeded(`${world}:${cat}:m`)).slice(0, Math.min(MATCH_MAX, pairs.length));
  const matchLeft = matchKey.map((p) => p.left);
  const matchRight = shuffle(matchKey.map((p) => p.right), seeded(`${world}:${cat}:mr`));

  return { blanks, bank, matchLeft, matchRight, matchKey };
}
