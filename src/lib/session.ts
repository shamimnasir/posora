/**
 * One visit, from the first page to the last.
 *
 * Everything in track.ts counts what got opened. This counts whether anybody
 * came back, which is the only number that decides whether পসরা has a future.
 * Duolingo's turnaround started by discovering that current-user retention was
 * worth about five times the next best lever; we cannot find our equivalent
 * without looking, and until this file existed nothing looked.
 *
 * A visit is not a page view. পসরা is a multi-page site, so every navigation
 * runs this module again from scratch, and the first version of this file
 * fired `session_start` on each one and reported a "session depth" of whatever
 * happened on that single page. That is a page-view counter wearing a session
 * counter's name, and GA4 already has one of those.
 *
 * So the visit lives in sessionStorage, which is exactly the right shape for
 * it: one per tab, cleared when the tab closes, invisible to other sites and
 * never sent anywhere. The running totals are carried across navigations
 * there, and the finished depth of a visit is reported at the *start of the
 * next one*, which is the only moment a visit is known to be over. A visitor
 * who never returns leaves their last visit unreported, which is both
 * unavoidable and the standard behaviour of every analytics tool.
 *
 * It also owns the two things that must happen exactly once a day: the streak
 * roll (including spending a freeze) and the day's goal becoming met.
 */
import { openDay, finishTask, todayState, grantFreeze, markMilestone, type DayResult } from './progress';
import { goalParts, goalMet, milestoneAt, type Milestone } from './daily';
import { trackSession, trackReturn, trackSessionDepth, trackStreakBroken, trackGoal } from './track';

const LIVE = 'posora:visit';      // sessionStorage: the visit in progress
const PENDING = 'posora:visit-end'; // localStorage: the last visit, not yet reported

/**
 * `secs` is written every time the page parks, not worked out when the visit
 * is finally reported. A visitor who leaves on Sunday and comes back on
 * Wednesday would otherwise be recorded as having stayed for three days.
 */
type Visit = { t0: number; secs: number; items: number; acts: number; worlds: string[] };
const fresh = (): Visit => ({ t0: Date.now(), secs: 0, items: 0, acts: 0, worlds: [] });

let day: DayResult | null = null;
let visit: Visit = fresh();

const read = (store: Storage | null, key: string): Visit | null => {
  try {
    const raw = store?.getItem(key);
    const v = raw ? (JSON.parse(raw) as Visit) : null;
    return v && typeof v.t0 === 'number' ? v : null;
  } catch { return null; }
};
const readVisit = () => read(typeof sessionStorage === 'undefined' ? null : sessionStorage, LIVE);

/**
 * Fold two records of the same visit together, keeping the furthest each got.
 *
 * This is not belt and braces. A page kept alive in the back/forward cache
 * still fires its own hide handler, long after it stopped being the page on
 * screen, and it fires it holding the counters it had when it was current. In
 * testing that produced a visit reported as "one world, nothing opened, fifty
 * five seconds" when the tab had by then covered two worlds and opened an
 * item. Taking the maximum of each field makes a late writer harmless.
 *
 * Records from different visits are not merged; the newer one simply wins.
 */
function fold(a: Visit | null, b: Visit): Visit {
  if (!a) return b;
  if (a.t0 !== b.t0) return a.t0 > b.t0 ? a : b;
  return {
    t0: a.t0,
    secs: Math.max(a.secs ?? 0, b.secs ?? 0),
    items: Math.max(a.items ?? 0, b.items ?? 0),
    acts: Math.max(a.acts ?? 0, b.acts ?? 0),
    worlds: [...new Set([...(a.worlds ?? []), ...(b.worlds ?? [])])],
  };
}

const saveVisit = () => {
  try { sessionStorage.setItem(LIVE, JSON.stringify(fold(readVisit(), visit))); } catch { /* private mode */ }
};

/**
 * Start or resume the visit. Safe to call more than once a page; only the
 * first call counts. Returns what today did to the streak, which the page
 * needs for the player bar whether or not anything interesting happened.
 */
export function beginSession(world?: string): DayResult {
  if (day) { if (world) note(world); return day; }
  day = openDay();

  const resumed = readVisit();
  if (resumed) {
    // Same tab, same visit, another page. Carry the totals; announce nothing.
    visit = resumed;
  } else {
    visit = fresh();
    reportPrevious();
    trackSession(day.streak, day.firstEver);
    if (!day.firstEver && day.gap > 0) trackReturn(day.gap);
    if (day.broke) trackStreakBroken(day.brokeAt, day.gap);
  }
  if (world) note(world);
  saveVisit();

  // Park the running totals wherever the page might be leaving, so the next
  // visit can report a finished number rather than a guess.
  const park = () => {
    visit.secs = Math.max(visit.secs, Math.round((Date.now() - visit.t0) / 1000));
    saveVisit();
    try {
      // The tab's own record is the authoritative one; this document may be a
      // bfcached page firing late with older counters.
      const best = fold(readVisit(), visit);
      localStorage.setItem(PENDING, JSON.stringify(fold(read(localStorage, PENDING), best)));
    } catch { /* private mode */ }
  };
  addEventListener('pagehide', park);
  addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') park(); });
  return day;
}

/**
 * Send the depth of the visit before this one, exactly once.
 *
 * A visit that opened nothing is reported too. Somebody arriving and doing
 * nothing is not noise to be filtered out, it is the single most important
 * thing a retention measurement can tell you, and dropping those rows would
 * make every average flattering and useless.
 */
function reportPrevious(): void {
  try {
    const raw = localStorage.getItem(PENDING);
    localStorage.removeItem(PENDING);
    if (!raw) return;
    const p = JSON.parse(raw) as Visit;
    if (!p || typeof p.t0 !== 'number') return;
    trackSessionDepth({
      items: p.items ?? 0,
      acts: p.acts ?? 0,
      seconds: Math.max(0, Math.round(p.secs ?? 0)),
      worlds: p.worlds?.length ?? 0,
    });
  } catch { /* a lost count is not worth an exception */ }
}

const note = (world: string) => { if (!visit.worlds.includes(world)) visit.worlds.push(world); };

/** A new item was opened during this visit. */
export function noteItem(world?: string): void {
  visit.items++;
  if (world) note(world);
  saveVisit();
}

/** An activity was finished during this visit: a mission, a game, a quiz. */
export function noteAct(): void { visit.acts++; saveVisit(); }

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
  trackGoal(day?.streak ?? 0, Math.round((Date.now() - visit.t0) / 1000));
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
