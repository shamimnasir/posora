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
