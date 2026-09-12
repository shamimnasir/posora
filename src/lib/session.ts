/**
 * One visit, from the first paint to the moment the tab goes away.
 *
 * Everything in track.ts counts what got opened. This counts whether anybody
 * came back, which is the only number that decides whether পসরা has a future.
 * Duolingo's turnaround started by discovering that current-user retention was
 * worth about five times the next best lever; we cannot find our equivalent
 * without looking, and until this file existed nothing looked.
 *
 * It also owns the two things that have to happen exactly once a visit: the
 * streak roll (including spending a freeze) and the day's goal becoming met.
 */
import { openDay, finishTask, todayState, grantFreeze, markMilestone, type DayResult } from './progress';
import { goalParts, goalMet, milestoneAt, type Milestone } from './daily';
import { trackSession, trackReturn, trackSessionDepth, trackStreakBroken, trackGoal } from './track';

let day: DayResult | null = null;
let items = 0, acts = 0, t0 = 0;
const seenWorlds = new Set<string>();

/**
 * Start the visit. Safe to call more than once; only the first call counts.
 * Returns what today did to the streak, which the page needs for the player
 * bar whether or not anything interesting happened.
 */
export function beginSession(world?: string): DayResult {
  if (day) { if (world) seenWorlds.add(world); return day; }
  day = openDay();
  t0 = Date.now();
  if (world) seenWorlds.add(world);

  trackSession(day.streak, day.firstEver);
  if (!day.firstEver && day.gap > 0) trackReturn(day.gap);
  if (day.broke) trackStreakBroken(day.brokeAt, day.gap);

  // One event per visit, at the end, from whichever of these fires first.
  const flush = () => {
    if (!day) return;
    const d = day; day = null;
    trackSessionDepth({ items, acts, seconds: Math.round((Date.now() - t0) / 1000), worlds: seenWorlds.size });
    void d;
  };
  addEventListener('pagehide', flush, { once: true });
  addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  return day;
}

/** A new item was opened during this visit. */
export function noteItem(world?: string): void {
  items++;
  if (world) seenWorlds.add(world);
}

/** An activity was finished during this visit: a mission, a game, a quiz. */
export function noteAct(): void { acts++; }

/**
 * Has the day's goal just been completed? True exactly once per day, on the
 * visit that finished it, so the page can celebrate without celebrating again
 * every time the child navigates.
 */
export function goalJustMet(): boolean {
  const t = todayState();
  if (!goalMet(goalParts(t.items, t.done))) return false;
  // `goal` is a latch, not a task: goalParts never looks for it.
  if (!finishTask('goal')) return false;
  trackGoal(day?.streak ?? 0, Math.round((Date.now() - t0) / 1000));
  return true;
}

/**
 * The milestone this visit reached, if any, with its freeze already granted.
 * Returns null on every later visit of the same day, and the whole ladder is
 * winnable again after a streak ends, because `openDay` clears the marks.
 */
export function reachedMilestone(streak: number): Milestone | null {
  const m = milestoneAt(streak);
  if (!m || !markMilestone(m.at)) return null;
  if (m.freeze) grantFreeze();
  return m;
}
