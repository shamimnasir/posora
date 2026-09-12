/**
 * The mission index.
 *
 * Every world's missions live in their own module under `missions/`, and this
 * file pulls them all together for the server: rendering a mission card needs
 * the kind and the length of each mission, which means reading the spec at
 * request time. That import costs nothing on the server.
 *
 * The browser must not pay it. All thirty-three missions are about 100KB of
 * Bangla, and a page can only start the three it shows, so the client uses
 * `loadMission` in mission-loader.ts instead, which Vite splits into one chunk
 * per world.
 */
import type { Mission } from './missions-shared';
import space from './missions/space';
import physics from './missions/physics';
import chemistry from './missions/chemistry';
import life from './missions/life';
import nature from './missions/nature';
import food from './missions/food';
import math from './missions/math';
import money from './missions/money';
import language from './missions/language';
import social from './missions/social';
import discovery from './missions/discovery';

export * from './missions-shared';

export const MISSIONS: Record<string, (Mission | null)[]> = {
  space, physics, chemistry, life, nature, food, math, money, language, social, discovery,
};

/** The mission spec for world `slug`, index `i`, or null when it is not built. */
export const missionSpec = (slug: string, i: number): Mission | null => MISSIONS[slug]?.[i] ?? null;
