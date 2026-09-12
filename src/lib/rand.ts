/**
 * Deterministic randomness.
 *
 * Everything generated on this site has to come out the same way twice: a quiz
 * so two attempts can be compared, and the daily activities so every child in
 * the country gets the same আজকের জিনিস and the server and the browser agree
 * about what today's questions are. That rules out Math.random entirely.
 *
 * mulberry32 seeded from an FNV-1a hash of a string is small, fast, has no
 * dependencies and is far better than good enough for shuffling a list.
 */

/** A seeded generator. Same seed, same sequence, forever. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a over the UTF-16 code units, which is all the seeding needs. */
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Fisher-Yates against a seeded generator. Returns a new array. */
export function shuffle<T>(arr: readonly T[], r: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}

/** Shuffle straight from a seed string, for the common one-line case. */
export const shuffled = <T>(arr: readonly T[], seed: string): T[] => shuffle(arr, rng(hash(seed)));

/** One deterministic pick from a list. Returns undefined only when empty. */
export const pick = <T>(arr: readonly T[], seed: string): T | undefined =>
  arr.length ? arr[Math.floor(rng(hash(seed))() * arr.length)] : undefined;
