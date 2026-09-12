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
  /** Best result per mission, "world:index" to 1..3 stars. */
  missions: Record<string, number>;
  /**
   * Streak freezes in hand. Earned at a milestone, spent automatically on a
   * missed day, never bought. The moment one of these can be purchased the
   * site is selling a child anxiety, so there is deliberately no code path
   * that adds to this except `grantFreeze`, called from a milestone.
   */
  freezes: number;
  /** Streak milestones already celebrated, so day 7 is a moment exactly once. */
  marks: number[];
  /** Today's goal counters. `d` is the date they belong to; a new date resets. */
  today: { d: string; items: number; done: string[] };
};
const EMPTY: Progress = {
  xp: 0, seen: {}, stars: [], awards: [], best: {}, days: [], missions: {},
  freezes: 0, marks: [], today: { d: '', items: 0, done: [] },
};
const XP_PER_ITEM = 10;

function read(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(EMPTY);
    const p = JSON.parse(raw) as Partial<Progress>;
    return {
      xp: p.xp ?? 0, seen: p.seen ?? {}, stars: p.stars ?? [], awards: p.awards ?? [],
      best: p.best ?? {}, days: p.days ?? [], missions: p.missions ?? {},
      freezes: p.freezes ?? 0, marks: p.marks ?? [],
      today: p.today ?? { d: '', items: 0, done: [] },
    };
  } catch {
    return structuredClone(EMPTY);
  }
}
function write(p: Progress) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode etc. */ }
  window.dispatchEvent(new CustomEvent('posora:progress', { detail: p }));
}

export const getProgress = read;

/** Move `today` on to the given date, zeroing it if it belonged to another day. */
function rollToday(p: Progress, today: string): void {
  if (p.today.d !== today) p.today = { d: today, items: 0, done: [] };
}

/** Mark an item as discovered. Returns true the first time. */
export function markSeen(world: string, id: string): boolean {
  const p = read();
  const list = (p.seen[world] ??= []);
  if (list.includes(id)) return false;
  list.push(id);
  p.xp += XP_PER_ITEM;
  rollToday(p, dayKey(new Date()));
  p.today.items++;
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

/** Keep the best stars for a mission. Returns true when it improved. */
export function setMission(key: string, stars: number): boolean {
  const p = read();
  if ((p.missions[key] ?? 0) >= stars) return false;
  p.missions[key] = stars;
  write(p);
  return true;
}

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayGap = (from: string, to: string) => Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000);
/** Walk back through the visit list and count the unbroken run ending at the last day. */
function runLength(days: string[]): number {
  let n = days.length ? 1 : 0;
  for (let i = days.length - 1; i > 0; i--) {
    if (dayGap(days[i - 1]!, days[i]!) === 1) n++; else break;
  }
  return n;
}

/** Most freezes a learner can hold, and the widest gap they can cover. */
export const MAX_FREEZES = 2;

export type DayResult = {
  /** The run of consecutive days ending today, after any freeze was spent. */
  streak: number;
  /** Days since the previous visit; 0 when this is a repeat visit the same day. */
  gap: number;
  /** True the very first time this browser ever opened the site. */
  firstEver: boolean;
  /** A streak ended. `brokeAt` is how long it had been. */
  broke: boolean;
  brokeAt: number;
  /** A freeze was spent to cover the missed days, so the run survived. */
  froze: boolean;
};

/**
 * Note today's visit and report what it did to the streak.
 *
 * A day is counted where the learner is, from the device clock; nothing is
 * sent anywhere. Missing a day normally ends the run, which is the entire
 * point: a streak with nothing at stake is a number, not a habit. A freeze in
 * hand is spent automatically to cover the gap, and the missed dates are
 * written into the list so the run reads as continuous afterwards.
 */
export function openDay(): DayResult {
  const p = read();
  const today = dayKey(new Date());
  const last = p.days[p.days.length - 1];
  const firstEver = p.days.length === 0;

  if (last === today) return { streak: runLength(p.days), gap: 0, firstEver: false, broke: false, brokeAt: 0, froze: false };

  const gap = last ? dayGap(last, today) : 0;
  const missed = gap > 1 ? gap - 1 : 0;
  let broke = false, brokeAt = 0, froze = false;

  if (missed > 0) {
    const had = runLength(p.days);
    if (missed <= p.freezes) {
      // Cover every missed date so the run stays whole, and spend the freezes.
      p.freezes -= missed;
      for (let i = missed; i >= 1; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        p.days.push(dayKey(d));
      }
      froze = true;
    } else {
      broke = true; brokeAt = had;
      // The run is over, so the milestones are back on the table.
      p.marks = [];
    }
  }

  p.days.push(today);
  if (p.days.length > 400) p.days.splice(0, p.days.length - 400);
  rollToday(p, today);
  write(p);
  return { streak: runLength(p.days), gap, firstEver, broke, brokeAt, froze };
}

/** The dates this browser visited, oldest first. Read-only, for the calendar. */
export const visitDays = (): string[] => read().days.slice();

/** Freezes in hand. */
export const freezeCount = (): number => read().freezes;

/** Earn a freeze. Only a streak milestone calls this; nothing can buy one. */
export function grantFreeze(): number {
  const p = read();
  p.freezes = Math.min(MAX_FREEZES, p.freezes + 1);
  write(p);
  return p.freezes;
}

/** Record that a streak milestone has been celebrated. True the first time. */
export function markMilestone(n: number): boolean {
  const p = read();
  if (p.marks.includes(n)) return false;
  p.marks.push(n);
  write(p);
  return true;
}

/* ---------- today's goal ---------- */

/** Today's counters, rolled forward if the stored ones belong to an older day. */
export function todayState(): { items: number; done: string[] } {
  const p = read();
  const today = dayKey(new Date());
  if (p.today.d !== today) return { items: 0, done: [] };
  return { items: p.today.items, done: p.today.done.slice() };
}

/** Mark one of today's tasks finished. Returns true the first time today. */
export function finishTask(id: string): boolean {
  const p = read();
  rollToday(p, dayKey(new Date()));
  if (p.today.done.includes(id)) return false;
  p.today.done.push(id);
  write(p);
  return true;
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
