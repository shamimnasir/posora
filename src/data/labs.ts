/**
 * The lab index.
 *
 * Same arrangement as the missions: every world's labs live in their own
 * module under `labs/`, this file pulls them together for the server, and
 * `lab-loader.ts` fetches one world's chunk in the browser. A lab card carries
 * a `compute` function, so the spec cannot be shipped as JSON - the browser
 * imports the real module or nothing.
 */
import type { Lab } from './lab-types';
import life from './labs/life';
import nature from './labs/nature';
import food from './labs/food';
import money from './labs/money';
import math from './labs/math';
import physics from './labs/physics';
import chemistry from './labs/chemistry';
import discovery from './labs/discovery';
import social from './labs/social';

export * from './lab-types';
export * from './lab-parts';

export const LABS: Record<string, Lab[]> = {
  life, nature, food, money, math, physics, chemistry, discovery, social,
};

export const labFor = (slug: string, cat: number): Lab | null =>
  LABS[slug]?.find((l) => l.cat === cat) ?? null;
