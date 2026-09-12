/**
 * How hard a piece of Bangla is to read, measured rather than guessed.
 *
 * পসরা already grades its writing by age: ছোট, মাঝারি, বড়. That is a judgement
 * about the idea. This is a different question - how hard the *letters* are for
 * a child who is still learning to read Bangla - and it is answerable from the
 * text itself, so nobody has to label 787 items by hand and nothing here can
 * drift out of step with what is actually on the page.
 *
 * Three things make Bangla prose hard for a new reader, and all three are
 * countable:
 *
 *  1. Sentence length. A long sentence has to be held in the head while it is
 *     decoded, and decoding is the part that is still slow.
 *  2. Word length. Longer words mean more clusters to get through before the
 *     word resolves into a meaning.
 *  3. Conjuncts. যুক্তাক্ষর are the single hardest part of learning to read
 *     Bangla: ক্ষ, ন্ত, ঙ্গ are not the shapes of their parts. Each one is
 *     marked in the text by a hasant (U+09CD) between two consonants, so they
 *     can be counted exactly.
 *
 * Latin letters and digits are counted too, because a five-year-old reading
 * Bangla has usually not met "CO₂" or "1971" on the page yet.
 *
 * The score is a number between 0 and 1. What it is NOT is a reading age: it
 * is not validated against any child, and the ladder page says so. It ranks
 * this site's own writing against itself, which is exactly what a route
 * through the site needs and no more than the measurement can support.
 */

/** U+09CD, the mark that joins two consonants into a conjunct. */
const HASANT = '্';

export type ReadMetrics = {
  chars: number;
  words: number;
  sentences: number;
  /** Words per sentence. */
  wps: number;
  /** Characters per word. */
  cpw: number;
  /** Conjuncts per hundred words. */
  conj: number;
  /** Latin letters and digits per hundred characters. */
  alien: number;
  /** 0 (easiest on this site) to 1 (hardest on this site). */
  score: number;
};

/** Bangla has its own danda; a full stop and a question mark also end sentences. */
const SENTENCE = /[।?!]+/;

/**
 * The weights and the ranges below were set by measuring this site's own
 * writing, not taken from a published formula: no Bangla readability formula
 * with published coefficients for children's prose was found, and inventing
 * one and dressing it up in a citation would be worse than saying this.
 */
const RANGE = {
  wps: [6, 22] as const,
  cpw: [4, 9] as const,
  conj: [2, 28] as const,
  alien: [0, 8] as const,
};
const WEIGHT = { wps: 0.34, cpw: 0.22, conj: 0.34, alien: 0.1 };

const norm = (v: number, [lo, hi]: readonly [number, number]) =>
  Math.max(0, Math.min(1, (v - lo) / (hi - lo)));

export function readMetrics(text: string): ReadMetrics {
  const t = text.trim();
  if (!t) return { chars: 0, words: 0, sentences: 0, wps: 0, cpw: 0, conj: 0, alien: 0, score: 0 };
  const words = t.split(/\s+/).filter(Boolean);
  const sentences = Math.max(1, t.split(SENTENCE).filter((s) => s.trim()).length);
  const chars = t.replace(/\s/g, '').length;
  let hasants = 0, alienChars = 0;
  for (const ch of t) {
    if (ch === HASANT) hasants++;
    else if (/[A-Za-z0-9]/.test(ch)) alienChars++;
  }
  const wps = words.length / sentences;
  const cpw = chars / words.length;
  const conj = (hasants / words.length) * 100;
  const alien = (alienChars / chars) * 100;
  const score =
    norm(wps, RANGE.wps) * WEIGHT.wps +
    norm(cpw, RANGE.cpw) * WEIGHT.cpw +
    norm(conj, RANGE.conj) * WEIGHT.conj +
    norm(alien, RANGE.alien) * WEIGHT.alien;
  return { chars, words: words.length, sentences, wps, cpw, conj, alien, score };
}

/* ---------------------------------------------------------------------------
 * the ladder
 * ------------------------------------------------------------------------- */

export const RUNGS = [
  { name: 'একদম শুরু', note: 'ছোট ছোট বাক্য, চেনা শব্দ, যুক্তাক্ষর কম' },
  { name: 'সহজ', note: 'বাক্য একটু লম্বা, কিন্তু শব্দগুলো এখনো সহজ' },
  { name: 'একটু কঠিন', note: 'যুক্তাক্ষর বাড়তে শুরু করেছে' },
  { name: 'মাঝারি', note: 'লম্বা বাক্য আর নতুন শব্দ একসঙ্গে' },
  { name: 'কঠিন', note: 'ঘন যুক্তাক্ষর, বড় বড় বাক্য' },
  { name: 'সবচেয়ে কঠিন', note: 'সংখ্যা, ইংরেজি অক্ষর আর কঠিন শব্দও আছে' },
] as const;

export type Ranked<T> = { item: T; m: ReadMetrics; rung: number };

/**
 * Sort by difficulty and cut into equal rungs.
 *
 * The boundaries come from the corpus rather than from thresholds typed in
 * here, so every rung is populated and stays populated as writing is added or
 * rewritten. It also means a rung is a statement about this site and not about
 * Bangla in general, which is the only claim the measurement can carry.
 */
export function ladder<T>(items: readonly T[], textOf: (x: T) => string): Ranked<T>[] {
  const scored = items.map((item) => ({ item, m: readMetrics(textOf(item)) }))
    .sort((a, b) => a.m.score - b.m.score);
  const per = Math.ceil(scored.length / RUNGS.length) || 1;
  return scored.map((s, i) => ({ ...s, rung: Math.min(RUNGS.length - 1, Math.floor(i / per)) }));
}

/** The average of one rung's measurements, for the sentence on its card. */
export function rungStats(rows: Ranked<unknown>[]): { wps: number; conj: number; words: number } {
  if (!rows.length) return { wps: 0, conj: 0, words: 0 };
  const n = rows.length;
  return {
    wps: rows.reduce((s, r) => s + r.m.wps, 0) / n,
    conj: rows.reduce((s, r) => s + r.m.conj, 0) / n,
    words: rows.reduce((s, r) => s + r.m.words, 0) / n,
  };
}
