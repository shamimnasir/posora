/** Learner progress, kept in localStorage only - no accounts, no personal data. */
const BASE_KEY = 'posora:v1';
let KEY = BASE_KEY;

/**
 * A family plan child gets their own bucket on the device, so two siblings
 * sharing a tablet do not share one set of ticks. Called by the page before
 * the first read; null returns to the anonymous bucket.
 */
export function setProgressScope(childId: string | null): void {
  KEY = childId ? `${BASE_KEY}:${childId}` : BASE_KEY;
}
export type Progress = { xp: number; seen: Record<string, string[]>; stars: string[] };
const EMPTY: Progress = { xp: 0, seen: {}, stars: [] };
const XP_PER_ITEM = 10;

function read(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(EMPTY);
    const p = JSON.parse(raw) as Partial<Progress>;
    return { xp: p.xp ?? 0, seen: p.seen ?? {}, stars: p.stars ?? [] };
  } catch {
    return structuredClone(EMPTY);
  }
}
function write(p: Progress) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode etc. */ }
  window.dispatchEvent(new CustomEvent('posora:progress', { detail: p }));
}

export const getProgress = read;

/** Mark an item as discovered. Returns true the first time. */
export function markSeen(world: string, id: string): boolean {
  const p = read();
  const list = (p.seen[world] ??= []);
  if (list.includes(id)) return false;
  list.push(id);
  p.xp += XP_PER_ITEM;
  write(p);
  return true;
}
export const seenCount = (world: string) => read().seen[world]?.length ?? 0;

/**
 * Merge keys seen on another device. Points are awarded for anything new,
 * since they were earned there; nothing is removed. Returns how many were new.
 */
export function importSeen(world: string, keys: string[]): number {
  const p = read();
  const list = (p.seen[world] ??= []);
  let added = 0;
  for (const k of keys) if (typeof k === 'string' && k && !list.includes(k)) { list.push(k); added++; }
  if (added) { p.xp += added * XP_PER_ITEM; write(p); }
  return added;
}

/** Star a not-yet-built item ("আগে এটা চাই"). Toggles; returns new state. */
export function toggleStar(key: string): boolean {
  const p = read();
  const i = p.stars.indexOf(key);
  if (i >= 0) p.stars.splice(i, 1); else p.stars.push(key);
  write(p);
  return i < 0;
}
export const isStarred = (key: string) => read().stars.includes(key);
