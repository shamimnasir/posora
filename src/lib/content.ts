/**
 * The site's content layer.
 *
 * Pages read through here instead of importing `src/data/*` directly. D1 is the
 * source of truth once seeded; the checked-in TypeScript data remains the
 * fallback, so the site still renders correctly if D1 is unreachable or empty.
 *
 * Reads are memoised per isolate for CACHE_MS to keep the common request off the
 * database. Edits therefore appear within that window; the admin panel bypasses
 * the cache entirely so you always see your own change immediately.
 */
import { db, selectWorlds, getDataset, type AdminWorld } from './db';
import { worlds as staticWorlds, type World } from '../data/worlds';
import { bodies as staticBodies, type Body } from '../data/space';
import { tools, numberWords, denominations, shopItems } from '../data/math';
import { vowels, consonants, kars, folas, conjuncts } from '../data/language';

const CACHE_MS = 30_000;

type Cached<T> = { at: number; value: T };
let worldCache: Cached<AdminWorld[]> | null = null;
const datasetCache = new Map<string, Cached<unknown>>();

/** The checked-in data, presented in the admin shape. */
const fallbackWorlds = (): AdminWorld[] =>
  staticWorlds.map((w, i) => ({ ...w, status: 'published' as const, sort: i, updatedAt: 0 }));

export type WorldOpts = {
  /** Include drafts. Admin and preview only - never for the public site. */
  includeDrafts?: boolean;
  /** Skip the isolate cache. Use after a write so the editor reflects it. */
  fresh?: boolean;
};

export async function getWorlds({ includeDrafts = false, fresh = false }: WorldOpts = {}): Promise<AdminWorld[]> {
  const all = await loadAllWorlds(fresh || includeDrafts);
  return includeDrafts ? all : all.filter((w) => w.status === 'published');
}

async function loadAllWorlds(fresh: boolean): Promise<AdminWorld[]> {
  if (!fresh && worldCache && Date.now() - worldCache.at < CACHE_MS) return worldCache.value;
  const d = db();
  if (!d) return fallbackWorlds();
  try {
    const rows = await selectWorlds(d, false);
    // An empty table means "not seeded yet", not "no content".
    const value = rows.length > 0 ? rows : fallbackWorlds();
    worldCache = { at: Date.now(), value };
    return value;
  } catch {
    // A D1 outage must never take the public site down.
    return worldCache?.value ?? fallbackWorlds();
  }
}

export async function getWorld(slug: string, opts: WorldOpts = {}): Promise<AdminWorld | null> {
  const all = await getWorlds(opts);
  return all.find((w) => w.slug === slug) ?? null;
}

/** Invalidate the isolate cache after a write. */
export function bustCache(): void {
  worldCache = null;
  datasetCache.clear();
}

async function dataset<T>(key: string, fallback: T, fresh = false): Promise<T> {
  if (!fresh) {
    const hit = datasetCache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.value as T;
  }
  const d = db();
  if (!d) return fallback;
  try {
    const value = await getDataset<T>(d, key);
    const resolved = value ?? fallback;
    datasetCache.set(key, { at: Date.now(), value: resolved });
    return resolved;
  } catch {
    return (datasetCache.get(key)?.value as T) ?? fallback;
  }
}

export const getBodies = (fresh = false): Promise<Body[]> => dataset<Body[]>('space', staticBodies, fresh);

export const getBody = async (id: string): Promise<Body | undefined> => (await getBodies()).find((b) => b.id === id);

/**
 * The other two editable datasets, which the panel offered and nothing read.
 *
 * `space` was wired to D1; `math` and `language` were seeded into it, listed on
 * the ডেটা page with a working editor, and then never read back, because the
 * one page that uses them imported `src/data/*` directly. Saving an edit
 * changed the row and changed nothing a visitor could see, which is the panel
 * claiming an ability it did not have. Same shape as `getBodies`: D1 when it
 * has the row, the checked-in file when it does not.
 */
const staticMath = { tools, numberWords, denominations, shopItems };
export const getMath = (fresh = false): Promise<typeof staticMath> => dataset('math', staticMath, fresh);

const staticLanguage = { vowels, consonants, kars, folas, conjuncts };
export const getLanguage = (fresh = false): Promise<typeof staticLanguage> => dataset('language', staticLanguage, fresh);

/** Header/footer counts, derived from whatever is currently live. */
export function computeTotals(list: World[]) {
  return {
    worlds: list.length,
    cats: list.reduce((s, w) => s + w.cats.length, 0),
    items: list.reduce((s, w) => s + w.cats.reduce((n, c) => n + c.items.length, 0), 0),
  };
}

export const itemCount = (w: World): number => w.cats.reduce((s, c) => s + c.items.length, 0);

/**
 * Datasets the panel exposes as raw JSON documents.
 *
 * `heroes` was here too, seeded as an empty object and read by nothing: the
 * hero scenes are code, in `src/data/heroes.ts`. The panel listed it with an
 * edit button, so it looked like a thing you could change. It wasn't.
 */
export const DATASET_KEYS = ['space', 'math', 'language'] as const;
export type DatasetKey = (typeof DATASET_KEYS)[number];
export const isDatasetKey = (k: string): k is DatasetKey => (DATASET_KEYS as readonly string[]).includes(k);
