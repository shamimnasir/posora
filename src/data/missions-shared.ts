/**
 * Everything the mission modules share: the shape of a mission, and the few
 * drawing helpers several of them use. The missions themselves live one world
 * per file under `missions/`, so the browser can fetch just the world it needs.
 */
export type OrderRound = { title: string; chain: string[]; emoji: string[]; note: string };
export type PathStop = { name: string; emoji: string; fact: string; choices: string[] };
/** Either a drawing (`art`, an SVG fragment) or one big glyph or word (`big`). `shadow` blacks the glyph out on a bright card. */
export type IdRound = { answer: string; art?: string; big?: string; shadow?: boolean; clue: string; options: string[]; fact: string };
export type SortItem = { name: string; emoji: string; bucket: number; fact: string };
export type ChoiceRound = { situation: string; emoji: string; options: { text: string; good: boolean; why: string }[] };
export type CalcRound = { q: string; a: number; fact?: string };
/** `tags` are the requirements this item covers. An item with none is a trap, and `warn` says why. */
export type BuildItem = { name: string; emoji: string; cost: number; tags: string[]; warn?: string };
export type Mission =
  /**
   * `askFirst`, `askNext` and `wrong` are prompt templates. `{first}` is the
   * card already on the board, `{prev}` the one just placed. Without them the
   * engine falls back to neutral wording.
   */
  | { type: 'order'; intro: string; askFirst?: string; askNext?: string; wrong?: string; rounds: OrderRound[] }
  | { type: 'path'; intro: string; token: string; tokenName: string; stops: PathStop[] }
  | { type: 'identify'; intro: string; caption: string; rounds: IdRound[] }
  /** Tap the right bucket for each item. The buckets stay on screen, so the categories themselves are the lesson. */
  | { type: 'sort'; intro: string; buckets: { name: string; emoji: string }[]; items: SortItem[] }
  /** A situation and three ways to answer it. Only one is the good one. */
  | { type: 'choice'; intro: string; rounds: ChoiceRound[] }
  /** Quick numbers on a Bangla keypad. */
  | { type: 'calc'; intro: string; unit: string; rounds: CalcRound[] }
  /** Pick items under a budget until every requirement is covered. */
  | { type: 'build'; intro: string; budget: number; budgetLabel: string; unit: string; need: { tag: string; label: string }[]; pool: BuildItem[]; submit: string; note: string };

/* ---- simplified leaf drawings, 100 x 100, dark on transparent ---- */
export const midrib = (d: string) => `<path d="${d}" fill="none" stroke="currentColor" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round"/>`;
export const LEAF = {
  // আম: long, narrow, pointed at both ends
  aam: `<path d="M50 4 C72 26 74 62 50 96 C26 62 28 26 50 4Z"/>${midrib('M50 8 L50 92')}`,
  // কাঁঠাল: thick oval, widest above the middle, rounded tip
  kathal: `<path d="M50 6 C34 22 22 40 24 64 C26 84 38 95 50 95 C62 95 74 84 76 64 C78 40 66 22 50 6Z"/>${midrib('M50 10 L50 90')}`,
  // বট: broad oval with a long drip tip at the bottom
  bot: `<path d="M50 6 C76 12 84 46 62 76 C58 82 54 90 50 97 C46 90 42 82 38 76 C16 46 24 12 50 6Z"/>${midrib('M50 10 L50 92')}`,
  // তাল: a fan of stiff blades from one stalk
  taal: `<path d="M50 96 L14 44 L24 48 L18 22 L32 40 L36 10 L46 36 L50 4 L54 36 L64 10 L68 40 L82 22 L76 48 L86 44Z"/>`,
  // কৃষ্ণচূড়া: a feather of tiny leaflets along one stem
  krishnachura: `<path d="M50 6 L50 96" fill="none" stroke="currentColor" stroke-width="2"/>` +
    Array.from({ length: 11 }, (_v, i) => { const y = 14 + i * 7.4, w = 9 + Math.sin((i / 10) * Math.PI) * 26; return `<ellipse cx="${50 - w / 2 - 3}" cy="${y}" rx="${w / 2}" ry="2.6" transform="rotate(-18 ${50 - w / 2 - 3} ${y})"/><ellipse cx="${50 + w / 2 + 3}" cy="${y}" rx="${w / 2}" ry="2.6" transform="rotate(18 ${50 + w / 2 + 3} ${y})"/>`; }).join(''),
  // বাঁশ: three narrow grass blades from one node
  bansh: `<path d="M18 92 C26 58 40 32 80 10 C56 40 40 66 18 92Z"/><path d="M22 94 C36 70 56 50 92 40 C62 56 44 74 22 94Z"/><path d="M14 90 C12 60 20 34 46 8 C30 38 20 62 14 90Z"/>`,
  // শাপলা: a round floating pad with a notch to the middle
  shapla: `<path d="M50 50 L50 6 A44 44 0 1 1 20 18Z" transform="rotate(-20 50 50)"/>${midrib('M50 50 L50 92')}`,
};

export const pick4 = (answer: string, ...others: string[]) => [answer, ...others.slice(0, 3)];

/* ---- a clock face, hands at the given time ---- */
export function clock(h: number, m: number): string {
  const ticks = Array.from({ length: 12 }, (_v, i) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const x1 = 50 + Math.cos(a) * 41, y1 = 50 + Math.sin(a) * 41, x2 = 50 + Math.cos(a) * 46, y2 = 50 + Math.sin(a) * 46;
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="currentColor" stroke-width="${i % 3 === 0 ? 3.4 : 1.6}" stroke-linecap="round"/>`;
  }).join('');
  const ha = ((h % 12) + m / 60) / 12 * Math.PI * 2 - Math.PI / 2, ma = (m / 60) * Math.PI * 2 - Math.PI / 2;
  return `<circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" stroke-width="2.6"/>${ticks}` +
    `<line x1="50" y1="50" x2="${(50 + Math.cos(ha) * 24).toFixed(1)}" y2="${(50 + Math.sin(ha) * 24).toFixed(1)}" stroke="currentColor" stroke-width="5.5" stroke-linecap="round"/>` +
    `<line x1="50" y1="50" x2="${(50 + Math.cos(ma) * 36).toFixed(1)}" y2="${(50 + Math.sin(ma) * 36).toFixed(1)}" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>` +
    `<circle cx="50" cy="50" r="3.6" fill="currentColor"/>`;
}

/* ---- a simplified face: brows, eyes and a mouth say the feeling ---- */
export function face(brow: string, eye: 'open' | 'wide' | 'squint' | 'droop', mouth: string): string {
  const eyes = eye === 'wide'
    ? '<circle cx="36" cy="45" r="8" fill="#fff"/><circle cx="64" cy="45" r="8" fill="#fff"/><circle cx="36" cy="45" r="4" fill="currentColor"/><circle cx="64" cy="45" r="4" fill="currentColor"/>'
    : eye === 'squint'
      ? '<path d="M29 46 Q36 40 43 46" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/><path d="M57 46 Q64 40 71 46" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>'
      : eye === 'droop'
        ? '<circle cx="36" cy="47" r="5" fill="currentColor"/><circle cx="64" cy="47" r="5" fill="currentColor"/><path d="M29 40 Q36 44 43 40" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M57 40 Q64 44 71 40" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>'
        : '<circle cx="36" cy="45" r="5.4" fill="currentColor"/><circle cx="64" cy="45" r="5.4" fill="currentColor"/>';
  return `<circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="3"/>${brow}${eyes}${mouth}`;
}
export const BROW = {
  flat: '<path d="M28 33 L44 33" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/><path d="M56 33 L72 33" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>',
  angry: '<path d="M28 30 L44 37" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M72 30 L56 37" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
  sad: '<path d="M28 37 L44 31" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/><path d="M72 37 L56 31" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>',
  up: '<path d="M27 32 Q36 26 45 32" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><path d="M55 32 Q64 26 73 32" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>',
};
export const MOUTH = {
  smile: '<path d="M32 64 Q50 80 68 64" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
  frown: '<path d="M32 74 Q50 58 68 74" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
  o: '<ellipse cx="50" cy="70" rx="9" ry="12" fill="none" stroke="currentColor" stroke-width="3.6"/>',
  flat: '<path d="M34 70 L66 70" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
  grit: '<rect x="33" y="64" width="34" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="3.2"/><path d="M42 64 L42 76M50 64 L50 76M58 64 L58 76" stroke="currentColor" stroke-width="2"/>',
  small: '<path d="M40 70 Q50 76 60 70" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>',
};

/* ---------------------------------------------------------------------------
 * Variants
 *
 * Every mission was authored as a fixed list of rounds played in a fixed
 * order, which made the second attempt a memory test rather than a game. The
 * rounds themselves are worth keeping - they are written, checked prose - so
 * the fix is not to generate new ones but to stop playing all of them every
 * time. A mission with seven puzzles that hands you five of them, in an order
 * drawn from the day and the attempt, is twenty-one different games.
 *
 * Two types keep every piece they have. A `path` is a journey: food does not
 * reach the small intestine before the stomach, so its stops can be neither
 * cut nor reordered, and it makes no claim to vary. A `build` is one budget
 * against one set of requirements, so removing a pool item could make it
 * unsolvable - but the order the shelf is laid out in carries no meaning, so
 * that is shuffled and the puzzle is never the same shelf twice.
 * ------------------------------------------------------------------------- */
import { rng, hash, shuffle } from '../lib/rand';

/** How many rounds one attempt plays, or null to play the whole thing. */
export const PLAY_LENGTH: Record<Mission['type'], number | null> = {
  order: null, path: null, build: null,
  identify: 5, sort: 9, choice: 4, calc: 6,
};

/** Take `n` from a list, seeded, keeping the sample stable for one attempt. */
const sample = <T>(list: readonly T[], n: number, seed: string): T[] =>
  shuffle(list, rng(hash(seed))).slice(0, Math.min(n, list.length));

/**
 * One attempt's arrangement of a mission. The same seed always gives the same
 * arrangement, so a reload mid-mission does not shuffle the board underneath
 * the player.
 */
export function varyMission(m: Mission, seed: string): Mission {
  const want = PLAY_LENGTH[m.type];
  switch (m.type) {
    case 'order':
      // Three chains, kept whole because each is a complete idea, but the
      // order they arrive in is not part of the idea.
      return { ...m, rounds: shuffle(m.rounds, rng(hash(`${seed}:o`))) };
    case 'identify':
      return { ...m, rounds: sample(m.rounds, want!, `${seed}:i`) };
    case 'choice':
      return { ...m, rounds: sample(m.rounds, want!, `${seed}:c`) };
    case 'calc':
      return { ...m, rounds: sample(m.rounds, want!, `${seed}:n`) };
    case 'build':
      // The budget and the requirements are the puzzle and stay exactly as
      // authored. Where the items sit on the shelf is not.
      return { ...m, pool: shuffle(m.pool, rng(hash(`${seed}:b`))) };
    case 'sort': {
      // Sampling has to leave every bucket represented, or a bucket sits on
      // screen all game with nothing that belongs in it, which teaches the
      // wrong thing about the category.
      const r = rng(hash(`${seed}:s`));
      const byBucket = new Map<number, SortItem[]>();
      for (const it of m.items) (byBucket.get(it.bucket) ?? byBucket.set(it.bucket, []).get(it.bucket)!).push(it);
      const seeded = [...byBucket.values()].map((list) => shuffle(list, r)[0]!);
      const rest = shuffle(m.items.filter((it) => !seeded.includes(it)), r);
      const n = Math.max(seeded.length, Math.min(want!, m.items.length));
      return { ...m, items: shuffle([...seeded, ...rest.slice(0, n - seeded.length)], r) };
    }
    default:
      return m;
  }
}

/** What changes between attempts, said plainly, or null when nothing does. */
export function varies(m: Mission): string | null {
  const want = PLAY_LENGTH[m.type];
  const [total, unit] = fullLength(m);
  if (want === null) return m.type === 'path' ? null : 'প্রতিবার ক্রম বদলায়';
  if (total <= want) return 'প্রতিবার ক্রম বদলায়';
  return `প্রতিবার ${bnd(total)}টির মধ্যে ${bnd(want)}টি আসে`;
}
const BND = '০১২৩৪৫৬৭৮৯';
const bnd = (n: number) => String(n).replace(/\d/g, (d) => BND[+d]!);

/** What kind of game this is, for the card in the rail. */
export function missionKind(m: Mission): string {
  switch (m.type) {
    case 'order': return 'সাজানোর খেলা';
    case 'path': return 'যাত্রার খেলা';
    case 'identify': return 'চেনার খেলা';
    case 'sort': return 'বাছাইয়ের খেলা';
    case 'choice': return 'সিদ্ধান্তের খেলা';
    case 'calc': return 'হিসাবের খেলা';
    case 'build': return 'সাজিয়ে তোলার খেলা';
  }
}
/** Everything the mission holds, counted in whatever unit that game has. */
export function fullLength(m: Mission): [number, string] {
  switch (m.type) {
    case 'order': return [m.rounds.length, 'রাউন্ড'];
    case 'path': return [m.stops.length, 'ধাপ'];
    case 'identify': return [m.rounds.length, 'ধাঁধা'];
    case 'sort': return [m.items.length, 'জিনিস'];
    case 'choice': return [m.rounds.length, 'পরিস্থিতি'];
    case 'calc': return [m.rounds.length, 'প্রশ্ন'];
    case 'build': return [m.need.length, 'শর্ত'];
  }
}

/**
 * How long one attempt is, which is what the card should promise. A mission
 * holding seven puzzles and dealing five must say five, or the progress bar
 * and the card disagree in front of the child.
 */
export function missionLength(m: Mission): [number, string] {
  const [total, unit] = fullLength(m);
  const want = PLAY_LENGTH[m.type];
  return [want === null ? total : Math.min(want, total), unit];
}
