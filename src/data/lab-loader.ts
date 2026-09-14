/**
 * Client-side lab loading, one world at a time.
 *
 * Importing `./labs` in the browser would pull every world's cards into one
 * chunk. The template literal makes Vite emit one chunk per world, so a
 * জীবনচক্র page downloads life and nothing else.
 */
import type { Lab } from './lab-types';

const cache = new Map<string, Lab[]>();

export async function loadLab(slug: string, cat: number): Promise<Lab | null> {
  let list = cache.get(slug);
  if (!list) {
    try {
      const mod = await import(`./labs/${slug}.ts`);
      list = mod.default as Lab[];
    } catch {
      return null;
    }
    cache.set(slug, list);
  }
  return list.find((l) => l.cat === cat) ?? null;
}
