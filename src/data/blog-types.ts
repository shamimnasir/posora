/**
 * What a written piece is on this site.
 *
 * পসরা is a set of tools, and a tool is a poor answer to a question somebody
 * typed into a search box. Someone looking up "সরল যন্ত্র কাকে বলে" wants the
 * definition, the seven kinds and a worked example - and only then is a page
 * where they can drag a lever worth anything to them. So each piece answers
 * the question properly in Bangla first, and the interactive page is offered
 * at the point in the argument where it actually helps.
 *
 * Pieces are grouped into clusters: one pillar answering the broad question,
 * and supporting pieces going deeper, each linking to the pillar and to the
 * tool it belongs with. That shape is chosen because it matches how the site
 * is really built - worlds and categories - not because it is a tactic.
 *
 * Nothing here may claim something the site does not do. Every `links` entry
 * points at a page that exists and does what the note says.
 */
export type Section = {
  h: string;
  p: string[];
  /** Optional topic-specific visual; shown within the section, not as another hero. */
  image?: { src: string; alt: string; caption?: string };
};
export type Faq = { q: string; a: string };
/** A link out to the real thing, and why it is worth a click from here. */
export type Ref = { label: string; href: string; note: string };

export type Post = {
  slug: string;
  title: string;
  /** Under 155 characters, because that is what a search result shows. */
  description: string;
  cluster: string;
  /** The one piece that answers the cluster's broad question. */
  pillar?: boolean;
  /** When the text was last true. ISO date, no invented precision. */
  updated: string;
  /** The opening, before the first heading. */
  intro: string[];
  sections: Section[];
  faq?: Faq[];
  refs: Ref[];
};

export type Cluster = {
  id: string;
  n: string;
  blurb: string;
  /** The world this cluster belongs to, for its colour and its link. */
  world: string;
};

/** Bangla reads at roughly 150 words a minute for an adult; a word is ~5.5 characters. */
export const readMinutes = (p: Post): number => {
  const chars = p.intro.join('').length
    + p.sections.reduce((s, x) => s + x.h.length + x.p.join('').length, 0)
    + (p.faq ?? []).reduce((s, f) => s + f.q.length + f.a.length, 0);
  return Math.max(2, Math.round(chars / 5.5 / 150));
};
