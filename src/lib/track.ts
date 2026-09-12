/**
 * Aggregate usage counts.
 *
 * This exists to answer one product question: which worlds, categories and
 * items do people actually open. That is the number that decides what is worth
 * building next, and right now nothing measures it.
 *
 * What is sent: the slug of a world, the name of a category or item, and the
 * reading depth. Nothing that identifies a visitor, nothing a learner typed,
 * and no progress data - progress stays in localStorage and never leaves the
 * device. The advertising side of Analytics is switched off in Analytics.astro
 * because this site is made for children.
 *
 * Every call is a no-op when Analytics has not loaded, which includes anyone
 * running a blocker. Measurement must never change what the page does.
 */
type Params = Record<string, string | number | boolean>;

export function track(event: string, params: Params = {}): void {
  try {
    const g = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
    g?.('event', event, params);
  } catch {
    /* a failed count is not worth an exception */
  }
}

/** Opening one item's reading sheet. `item` is the Bangla label as shown. */
export const trackItem = (world: string, category: string, item: string) =>
  track('item_open', { world, category, item });

/** Switching to a different category within a world. */
export const trackCategory = (world: string, category: string) =>
  track('category_open', { world, category });

/** Switching reading depth. `level` is l1, l2 or l3. */
export const trackDepth = (world: string, level: string) =>
  track('depth_change', { world, level });

/** Touching a 3D model or its slider, counted once per category visit. */
export const trackPlay = (world: string, category: string) =>
  track('model_play', { world, category });

/* ---------------------------------------------------------------------------
 * Retention.
 *
 * Everything above counts what gets opened. None of it answers the only
 * question that decides whether this site has a future: does anybody come
 * back. These six do, and they are the reason the rest of the daily machinery
 * exists. Same rules as above - a streak length and a day count are facts
 * about a browser, not about a person, and nothing here can identify anyone.
 * ------------------------------------------------------------------------- */

/** A visit begins. `streak` is the run of days ending today, from the device. */
export const trackSession = (streak: number, firstEver: boolean) =>
  track('session_start', { streak, first_ever: firstEver });

/**
 * A visit that is not the first. `days` is the gap since the previous visit,
 * bucketed, because the bucket is what a retention curve is made of and the
 * exact number is noise.
 */
export const trackReturn = (days: number) =>
  track('return_visit', { days, bucket: days <= 1 ? '1' : days <= 3 ? '2-3' : days <= 7 ? '4-7' : '8+' });

/** How far a visit went, sent once when the page is hidden or unloaded. */
export const trackSessionDepth = (d: { items: number; acts: number; seconds: number; worlds: number }) =>
  track('session_depth', d);

/** The day's goal was met. The closest thing this site has to a north star. */
export const trackGoal = (streak: number, seconds: number) =>
  track('daily_goal_met', { streak, seconds });

/** A streak ended, and at what length, which is where the freeze rule is tuned. */
export const trackStreakBroken = (length: number, gap: number) =>
  track('streak_broken', { length, gap });

/** The day-7 prompt to the adult: shown, dismissed, or followed. */
export const trackParentPrompt = (action: 'shown' | 'dismissed' | 'followed', streak: number) =>
  track('parent_prompt', { action, streak });
