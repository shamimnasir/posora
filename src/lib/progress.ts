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
export type Progress = {
  xp: number;
  seen: Record<string, string[]>;
  stars: string[];
  /** Ids of earned awards, e.g. "life:cat" or the global "streak3". */
  awards: string[];
  /** Best খোঁজার খেলা result per "world:category", 1 to 3 stars. */
  best: Record<string, number>;
  /** Days this learner opened a world, as YYYY-MM-DD, newest last (capped). */
  days: string[];
};
const EMPTY: Progress = { xp: 0, seen: {}, stars: [], awards: [], best: {}, days: [] };
const XP_PER_ITEM = 10;

function read(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(EMPTY);
    const p = JSON.parse(raw) as Partial<Progress>;
    return { xp: p.xp ?? 0, seen: p.seen ?? {}, stars: p.stars ?? [], awards: p.awards ?? [], best: p.best ?? {}, days: p.days ?? [] };
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

/** Points for something other than opening an item: a game round, a bonus. */
export function addXp(n: number): number {
  const p = read();
  p.xp += Math.max(0, Math.round(n));
  write(p);
  return p.xp;
}

/** Record an award. Returns true the first time, so the page can celebrate once. */
export function grantAward(id: string): boolean {
  const p = read();
  if (p.awards.includes(id)) return false;
  p.awards.push(id);
  write(p);
  return true;
}
export const hasAward = (id: string) => read().awards.includes(id);

/** Keep the best খোঁজার খেলা result for a category. Returns true when it improved. */
export function setBest(key: string, stars: number): boolean {
  const p = read();
  if ((p.best[key] ?? 0) >= stars) return false;
  p.best[key] = stars;
  write(p);
  return true;
}

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/**
 * Note today's visit and return the run of consecutive days ending today.
 * A day is counted where the learner is, from the device clock; nothing is sent.
 */
export function touchDay(): number {
  const p = read();
  const today = dayKey(new Date());
  if (p.days[p.days.length - 1] !== today) { p.days.push(today); if (p.days.length > 60) p.days.splice(0, p.days.length - 60); write(p); }
  let n = 1;
  for (let i = p.days.length - 1; i > 0; i--) {
    const a = new Date(p.days[i]!), b = new Date(p.days[i - 1]!);
    if (Math.round((a.getTime() - b.getTime()) / 86400000) === 1) n++; else break;
  }
  return n;
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
