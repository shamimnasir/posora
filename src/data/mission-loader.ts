/**
 * Client-side mission loading, one world at a time.
 *
 * Importing `./missions` in the browser would pull every world's missions into
 * one chunk: around 100KB of Bangla to start a single game. The template
 * literal below makes Vite emit one chunk per world instead, so pressing খেলো
 * on a physics mission downloads physics missions and nothing else.
 */
import type { Mission } from './missions-shared';

const cache = new Map<string, (Mission | null)[]>();

/** The spec for world `slug`, index `i`, fetching that world's chunk once. */
export async function loadMission(slug: string, i: number): Promise<Mission | null> {
  let list = cache.get(slug);
  if (!list) {
    try {
      const mod = await import(`./missions/${slug}.ts`);
      list = mod.default as (Mission | null)[];
    } catch {
      return null;   // a world with no missions module has no missions
    }
    cache.set(slug, list);
  }
  return list[i] ?? null;
}
