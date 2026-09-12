/**
 * যাচাই - a comprehension check generated from the reading itself.
 *
 * Nothing here is authored separately, so nothing can be wrong in a way the
 * reading is not. Each question shows an item's short reading with the item's
 * own name blanked out, and asks which item it describes. The distractors are
 * the other items of the same category, so every option is something the
 * child has actually met on that page.
 *
 * The shuffle is seeded from the world, category and item, so the same child
 * sees the same quiz twice and a result can be compared with an earlier one.
 */
import type { ItemDetail } from '../data/explorer-types';

export type Question = {
  /** Index of the item the question is about. */
  item: number;
  /** The short reading with the item's name replaced by a blank. */
  prompt: string;
  /** Option labels, in display order. */
  options: string[];
  /** Index into `options` of the right one. */
  answer: number;
};

export const QUIZ_LENGTH = 8;
export const OPTIONS = 4;
export const BLANK = '______';

/* mulberry32: small, deterministic, good enough for shuffling a quiz */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function shuffle<T>(arr: T[], r: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}

/** Blank out the item's name wherever the reading uses it, including inflected forms. */
export function blankOut(text: string, name: string): string {
  const core = name.trim();
  if (!core) return text;
  // Escape for a regex, then allow the common Bangla suffixes that attach
  // directly to a noun: -র, -এর, -ের, -কে, -তে, -ে, -য়, -টি, -টা, -গুলো.
  const esc = core.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${esc}(?:ের|এর|র|কে|তে|ে|য়|টি|টা|গুলো)?`, 'g');
  const out = text.replace(re, BLANK);
  // Multi-word names: also blank the longest word on its own, so "নিউটনের
  // প্রথম সূত্র" does not survive as "প্রথম সূত্র বলে ...".
  const words = core.split(/\s+/).filter((w) => w.length >= 3);
  if (words.length > 1) {
    const longest = words.sort((a, b) => b.length - a.length)[0]!;
    const re2 = new RegExp(`${longest.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:ের|এর|র|কে|তে|ে|য়|টি|টা|গুলো)?`, 'g');
    return out.replace(re2, BLANK);
  }
  return out;
}

/**
 * Build the quiz for one category. Returns [] when the category has too few
 * items to make a fair multiple-choice question.
 */
export function buildQuiz(world: string, cat: number, items: string[], detail: ItemDetail[]): Question[] {
  if (items.length < 3 || detail.length !== items.length) return [];
  const r = rng(hash(`${world}:${cat}`));
  const order = shuffle(items.map((_, i) => i), r).slice(0, Math.min(QUIZ_LENGTH, items.length));
  return order.map((i) => {
    const d = detail[i]!;
    const others = shuffle(items.map((_, j) => j).filter((j) => j !== i), rng(hash(`${world}:${cat}:${i}`)))
      .slice(0, Math.min(OPTIONS - 1, items.length - 1));
    const opts = shuffle([i, ...others], rng(hash(`${world}:${cat}:${i}:o`)));
    return {
      item: i,
      prompt: blankOut(d.l1, items[i]!),
      options: opts.map((j) => items[j]!),
      answer: opts.indexOf(i),
    };
  });
}

/** Passing line for a certificate: four out of five, rounded down. */
export const passMark = (total: number): number => Math.ceil(total * 0.8);
