/**
 * The parts of a lab spec that can be read without loading any lab.
 *
 * These live apart from `labs.ts` because the browser must not import that
 * file: it pulls every world's cards into one chunk, which is exactly what
 * `lab-loader.ts` exists to avoid. Nothing here imports a lab - only its type.
 */
import type { Lab, LabCard } from './lab-types';

/** The anchor a card gets on its page. Stable, because chips link into it. */
export const cardId = (i: number): string => `k${i + 1}`;

/** Every world item this card stands for, in the order they appear on it. */
export function cardItems(c: LabCard): string[] {
  const own = [c.item];
  if (c.kind === 'cycle') return [...new Set([...(c.stages.map((s) => s.item).filter(Boolean) as string[]), ...own])];
  if (c.kind === 'place') return [...new Set([...(c.zones.map((z) => z.item).filter(Boolean) as string[]), ...own])];
  if (c.kind === 'balance') return [...new Set([...(c.rounds.map((r) => r.item).filter(Boolean) as string[]), ...own])];
  return [...new Set([...own, ...(c.also ?? [])])];
}

/** Every item the whole lab covers. */
export const labItems = (l: Lab): string[] => [...new Set(l.cards.flatMap(cardItems))];

/**
 * Where each of a category's items lives on its lab page, or null when the lab
 * does not cover all of them.
 *
 * The world page turns a category's chips into ticked links when it has this,
 * which is a claim that every one of those names is a live tool. A lab that
 * covers seven of nine items must not make that claim, so it returns null and
 * the lab is offered as one more thing to do instead.
 */
export function labAnchors(l: Lab, items: readonly string[]): string[] | null {
  const where = new Map<string, string>();
  l.cards.forEach((c, i) => { for (const it of cardItems(c)) if (!where.has(it)) where.set(it, cardId(i)); });
  const out = items.map((it) => where.get(it));
  return out.every(Boolean) ? (out as string[]) : null;
}
