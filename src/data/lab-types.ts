/**
 * What a hands-on card is, as data.
 *
 * The ten labs written before this one are ten hand-built pages: সরল যন্ত্র is
 * 839 lines, আলো 665, আমার থালা 509. They are good, and they are good for
 * reasons that have almost nothing to do with being hand-built - every item in
 * the category is its own card you can touch, every number on screen is
 * computed rather than decorative, touching one counts the same as reading
 * one, and a last card shows the single idea behind all of them. Only the
 * second of those needs bespoke code, and only for subjects that genuinely
 * have an equation.
 *
 * So a lab is described here and drawn by `lib/labkit.ts`. Four shapes cover
 * most of what the remaining categories actually want:
 *
 *   cycle    an ordered ring of stages you step through - a life cycle, the
 *            water cycle, the seasons, the stages of a process
 *   place    a diagram with named parts you have to put the labels onto
 *   balance  a pool of things and a target to hit with them - a plate, a
 *            budget, a go-bag, a habitat
 *   scrub    sliders and a real formula, with the numbers falling out of it
 *
 * `scrub` is the one that carries code, because the formula IS the content and
 * writing it in data would be writing it in a worse language. The other three
 * are pure content, which is the whole point: a new hands-on category should
 * cost about forty lines, not five hundred and fifty.
 */

/** One stage of a cycle: what it is, what it looks like, and what happens there. */
export type CycleStage = {
  n: string;
  /**
   * The item in `worlds.ts` this stage IS, when it is one.
   *
   * One card usually stands for several items - সরল যন্ত্র's eight cards are
   * its eight items - so credit belongs to the part being used, not to the
   * card holding it. A stage with no item of its own credits the card's.
   */
  item?: string;
  /** One glyph. Stages are read at a glance before they are read at all. */
  e: string;
  note: string;
  /** A short measured fact, when the stage has one: "৩ দিন", "৪০ ডিগ্রি". */
  span?: string;
};

export type CycleCard = {
  kind: 'cycle';
  /** The item in `worlds.ts` this card IS. Credit lands on this name. */
  item: string;
  n: string;
  how: string;
  /** A cycle returns to its first stage; a sequence stops at the last. */
  loop?: boolean;
  stages: CycleStage[];
};

/** A part of a diagram, at a point in the drawing's own units. */
export type PlaceZone = {
  n: string;
  /** The item in `worlds.ts` this part IS, when it is one. */
  item?: string;
  x: number; y: number;
  /** How big the target is. Defaults to something a fingertip can hit. */
  r?: number;
  note: string;
};

export type PlaceCard = {
  kind: 'place';
  item: string;
  n: string;
  how: string;
  /** The drawing, as an SVG fragment in the stated viewBox. */
  art: string;
  view: readonly [number, number];
  zones: PlaceZone[];
};

export type BalanceGroup = { k: string; n: string; hue: string };
/** `cost` is only read when the card sets a budget. */
export type BalanceItem = { n: string; e: string; g: string; cost?: number };
/** One target to hit: how much of each group it wants, and why. */
export type BalanceRound = { k: string; n: string; item?: string; want: Record<string, number>; note: string };

export type BalanceCard = {
  kind: 'balance';
  item: string;
  n: string;
  how: string;
  groups: BalanceGroup[];
  pool: BalanceItem[];
  rounds: BalanceRound[];
  /** When set, every pick spends from it and going over is a real failure. */
  budget?: { amount: number; unit: string; label: string };
  /** What the meters are counting, for the read-out. Defaults to "টা". */
  unit?: string;
};

export type ScrubKnob = {
  k: string; n: string;
  min: number; max: number; step: number; value: number;
  unit: string;
  /** Print the value some other way than a plain Bangla numeral. */
  text?: (v: number) => string;
};

/** What a formula gives back: lines of figures, optional bars, and a sentence. */
export type ScrubOut = {
  lines: { n: string; v: string }[];
  bars?: { n: string; frac: number; hue?: string; v?: string }[];
  say: string;
};

export type ScrubCard = {
  kind: 'scrub';
  item: string;
  n: string;
  how: string;
  knobs: ScrubKnob[];
  /** The real arithmetic. Everything on screen comes out of here. */
  compute: (v: Record<string, number>) => ScrubOut;
  /** Where the figures come from, said plainly. A number with no source is a decoration. */
  source?: string;
};

export type LabCard = CycleCard | PlaceCard | BalanceCard | ScrubCard;

export type Lab = {
  /** Which world and which category index in `worlds.ts` this lab is. */
  world: string;
  cat: number;
  /** The page's own title and opening, when the category name alone is not it. */
  n?: string;
  lede: string;
  cards: LabCard[];
};
