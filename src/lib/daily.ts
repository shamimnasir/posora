/**
 * আজকের পসরা - the daily engine.
 *
 * The site has 833 items, 87 categories and 33 missions. That is a finite
 * corpus, and every reward built on top of a finite corpus decays: the
 * hundredth item pays less than the first and after the last one there is
 * nothing. A streak pointed at an empty room is worse than no streak.
 *
 * So today has to be different from yesterday without anybody writing
 * anything. Everything here is *generated* from the reading that already
 * exists, the same way যাচাই is, and every pick is seeded from the calendar
 * date, which has three consequences worth stating:
 *
 *   1. Every child in the country gets the same আজকের জিনিস, so it is a thing
 *      families and classrooms can talk about.
 *   2. The server and the browser always agree about what today is, with no
 *      round trip and nothing stored.
 *   3. The marginal cost of another day of content is zero.
 *
 * The day is Asia/Dhaka, not the visitor's zone. পসরা is a Bangladeshi site
 * and "today's thing" should mean the same thing in Dhaka and in Sylhet. The
 * streak is the opposite: that is counted on the device, where the child is,
 * because a streak is about their evening, not about Dhaka's midnight.
 */
import type { ItemDetail } from '../data/explorer-types';
import { rng, hash, shuffle, shuffled } from './rand';
import { blankOut } from './quiz';

/* ---------------------------------------------------------------------------
 * the day
 * ------------------------------------------------------------------------- */

const DHAKA = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit',
});
/** Today in Dhaka as YYYY-MM-DD. */
export const dhakaDay = (d: Date = new Date()): string => DHAKA.format(d);

/** Whole days from a fixed origin, so a pick can walk forward one per day. */
export function dayNumber(key: string): number {
  return Math.floor(new Date(`${key}T00:00:00Z`).getTime() / 86400000);
}

const WEEKDAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'];
const MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'অগাস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
const BND = '০১২৩৪৫৬৭৮৯';
const bnd = (v: string | number) => String(v).replace(/\d/g, (d) => BND[+d]!);

/** "সোমবার, ১৪ সেপ্টেম্বর" from a YYYY-MM-DD key. */
export function dayLabel(key: string): string {
  const d = new Date(`${key}T00:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]}বার, ${bnd(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]}`;
}

/* ---------------------------------------------------------------------------
 * today's goal
 * ------------------------------------------------------------------------- */

/** New things that count toward the day being done. */
export const GOAL_NEW_ITEMS = 3;

export type GoalPart = { id: string; label: string; hint: string; done: boolean; n: number; of: number };

/**
 * Three small things, not a score to maximise.
 *
 * A goal that says *stop* is the point. It gives the day an end, which is what
 * makes tomorrow a separate occasion instead of a continuation, and it is the
 * half of this design a parent is willing to pay for. Nothing anywhere on the
 * site rewards going past it.
 */
export function goalParts(items: number, done: readonly string[]): GoalPart[] {
  return [
    { id: 'new', label: 'তিনটি নতুন জিনিস', hint: 'যেকোনো ভুবনে তিনটি নতুন আইটেম খুলে দেখো', done: items >= GOAL_NEW_ITEMS, n: Math.min(items, GOAL_NEW_ITEMS), of: GOAL_NEW_ITEMS },
    { id: 'quiz', label: 'আজকের পরখ', hint: 'পাঁচটা প্রশ্ন, রোজ নতুন', done: done.includes('quiz'), n: done.includes('quiz') ? 1 : 0, of: 1 },
    { id: 'play', label: 'একটা খেলা', hint: 'একটা মিশন, খোঁজার খেলা বা কোনটা আলাদা', done: done.includes('play'), n: done.includes('play') ? 1 : 0, of: 1 },
  ];
}
export const goalDone = (parts: readonly GoalPart[]): number => parts.filter((p) => p.done).length;
export const goalMet = (parts: readonly GoalPart[]): boolean => parts.every((p) => p.done);

/* ---------------------------------------------------------------------------
 * milestones
 * ------------------------------------------------------------------------- */

export type Milestone = { at: number; name: string; note: string; emoji: string; freeze: boolean };
/**
 * Where a streak gets a moment. Duolingo puts a free trial in the day-N chest;
 * ours puts a freeze in the child's hand and, at day seven, a card addressed to
 * the adult. Nothing here is ever for sale.
 */
export const MILESTONES: Milestone[] = [
  { at: 3, name: 'তিন দিন', note: 'একটা বরফ পেলে - একদিন না এলেও ধারা টিকবে', emoji: '🔥', freeze: true },
  { at: 7, name: 'সাত দিন', note: 'পুরো এক সপ্তাহ। বাড়ির বড়দের দেখাও।', emoji: '🗓', freeze: true },
  { at: 14, name: 'চোদ্দ দিন', note: 'দুই সপ্তাহ টানা। আরেকটা বরফ।', emoji: '❄', freeze: true },
  { at: 30, name: 'ত্রিশ দিন', note: 'এক মাস। এটা আর অভ্যাস নয়, এটা তুমি।', emoji: '🏅', freeze: true },
];
export const milestoneAt = (n: number): Milestone | undefined => MILESTONES.find((m) => m.at === n);
export const nextMilestone = (n: number): Milestone | undefined => MILESTONES.find((m) => m.at > n);

/* ---------------------------------------------------------------------------
 * the corpus the generators draw from
 * ------------------------------------------------------------------------- */

/** One readable item, flattened out of a world's category. */
export type CorpusItem = {
  /** world slug, world name, hue */
  w: string; wn: string; hue: string;
  /** category name and index within the world */
  c: string; ci: number;
  /** item name and its index within the category */
  n: string; ii: number;
};

/* ---------------------------------------------------------------------------
 * আজকের জিনিস - one item a day, the same one for everyone
 * ------------------------------------------------------------------------- */

/**
 * Walk the whole corpus in a fixed shuffled order, one step per day, so every
 * item gets its turn before any repeats. With 833 readable items that is two
 * and a quarter years of runway.
 */
export function dailyItem<T extends CorpusItem>(corpus: readonly T[], key: string): T | null {
  if (!corpus.length) return null;
  const order = shuffled(corpus.map((_, i) => i), 'posora:daily-order');
  return corpus[order[dayNumber(key) % order.length]!] ?? null;
}

/* ---------------------------------------------------------------------------
 * আজকের পরখ - five questions, generated from the reading
 * ------------------------------------------------------------------------- */

export type DailyQuestion = {
  /** The reading with the item's own name blanked out. */
  prompt: string;
  options: string[];
  answer: number;
  /** Where the answer lives, so a wrong guess can offer to go and read it. */
  w: string; ci: number; ii: number;
  /** The progress key, so the browser can prefer questions about things it has seen. */
  k: string;
};

export const DAILY_QUIZ_LENGTH = 5;
/** Categories rotated into the pool each day. Enough to choose from, small enough to send. */
const POOL_CATS = 8;

/**
 * Build the day's question pool.
 *
 * The pool is a rotating slice of the catalogue rather than a set chosen from
 * what this child has read, because progress lives in localStorage and does
 * not leave the device. The browser then prefers the questions whose items it
 * has actually seen, so in practice a reader is asked about their own reading
 * while the server learns nothing about them. Items resurface as the rotation
 * comes round, which is spaced repetition at the coarse end but honest about
 * what it is.
 */
export function dailyPool(
  cats: readonly { w: string; ci: number; c: string; items: string[]; detail: ItemDetail[] }[],
  key: string,
): DailyQuestion[] {
  const usable = cats.filter((c) => c.items.length >= 3 && c.detail.length === c.items.length);
  if (!usable.length) return [];
  const order = shuffled(usable.map((_, i) => i), 'posora:daily-pool');
  const start = (dayNumber(key) * POOL_CATS) % order.length;
  const chosen = Array.from({ length: Math.min(POOL_CATS, order.length) }, (_, k) => usable[order[(start + k) % order.length]!]!);

  const out: DailyQuestion[] = [];
  for (const c of chosen) {
    const r = rng(hash(`${key}:${c.w}:${c.ci}`));
    const i = Math.floor(r() * c.items.length);
    const others = shuffle(c.items.map((_, j) => j).filter((j) => j !== i), r).slice(0, 3);
    const opts = shuffle([i, ...others], r);
    out.push({
      prompt: blankOut(c.detail[i]!.l1, c.items[i]!),
      options: opts.map((j) => c.items[j]!),
      answer: opts.indexOf(i),
      w: c.w, ci: c.ci, ii: i,
      k: `${c.c}:${c.items[i]}`,
    });
  }
  return out;
}

/* ---------------------------------------------------------------------------
 * কোনটা আলাদা - odd one out
 * ------------------------------------------------------------------------- */

export type OddRound = { options: string[]; answer: number; because: string; from: string };

/**
 * Three from one category and one from another, which is combinatorial over 87
 * categories and so effectively never runs out. The explanation names both
 * categories, so a wrong answer still teaches the grouping.
 */
export function oddRounds(
  cats: readonly { w: string; wn: string; c: string; items: string[] }[],
  key: string,
  count = 5,
): OddRound[] {
  const usable = cats.filter((c) => c.items.length >= 3);
  if (usable.length < 2) return [];
  const order = shuffled(usable.map((_, i) => i), `posora:odd:${key}`);
  const out: OddRound[] = [];
  for (let k = 0; k < count && k < order.length; k++) {
    const home = usable[order[k]!]!;
    const r = rng(hash(`${key}:odd:${k}:${home.c}`));
    // The outsider comes from a different category, and from a different world
    // where one is available, so the grouping is obvious once it is named.
    const away = usable.filter((c) => c.c !== home.c && c.w !== home.w);
    const other = (away.length ? away : usable.filter((c) => c.c !== home.c))[Math.floor(r() * (away.length || usable.length - 1))];
    if (!other) continue;
    const three = shuffle(home.items, r).slice(0, 3);
    const odd = shuffle(other.items, r)[0]!;
    const opts = shuffle([...three, odd], r);
    out.push({
      options: opts,
      answer: opts.indexOf(odd),
      because: `বাকি তিনটিই ${home.c}, আর ${odd} হলো ${other.c}।`,
      from: home.c,
    });
  }
  return out;
}
