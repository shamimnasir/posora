/** Which procedural 3D scene each category gets. Index = category order in worlds.ts. */
import type { HeroSpec } from '../components/explorer/heroes';
import { collectionFor } from './collections';
import { worlds } from './worlds';
type H = Omit<HeroSpec, 'hue'>;
const T = (type: string, v?: string, p?: number): H => ({ type, v, p });

const MAP: Record<string, H[]> = {
  physics:   [T('ramp'), T('pendulum'), T('gears'), T('prism', undefined, 0.6), T('wave'), T('particles', undefined, 0.55), T('circuit', undefined, 0.7)],
  chemistry: [T('particles', undefined, 0.2), T('atom', undefined, 0.5), T('atom', undefined, 0.9), T('beaker', undefined, 0.6), T('beaker', 'ph', 0.2), T('particles', 'mix', 0.2), T('molecule')],
  life:      [T('treeparts', undefined, 0.75), T('tree', 'photo', 0.7), T('tree', undefined, 0.15), T('collection'), T('collection'), T('collection'), T('collection'), T('bodyparts', undefined, 0.25)],
  nature:    [T('weather', undefined, 0.4), T('seasonwheel'), T('terrain', 'delta', 0.6), T('terrain', undefined, 0.6), T('terrain', 'delta', 0.4), T('collection'), T('earth', undefined, 0.2), T('weather', 'storm', 0.9)],
  food:      [T('collection'), T('plate', undefined, 0.7), T('terrain', 'farm', 0.6), T('seasonwheel', 'fruit'), T('plate', undefined, 0.3), T('collection'), T('collection'), T('collection')],
  math:      [T('blocks', undefined, 0.47), T('blocks', undefined, 0.25), T('pie', undefined, 0.375), T('shapes', undefined, 0.15), T('scale', undefined, 0.5), T('coins', undefined, 0.5), T('blocks', 'wave'), T('bars', undefined, 0.6), T('scale', undefined, 0.3)],
  money:     [T('coins', undefined, 0.6), T('bars', undefined, 0.5), T('pie', undefined, 0.25), T('coins', undefined, 0.3), T('collection'), T('bars', 'compound', 0.5), T('bars', undefined, 0.8), T('rocket', undefined, 0.6), T('collection'), T('shield', undefined, 0.9)],
  language:  [T('letters', undefined, 0.2), T('letters', 'jukto'), T('letters', undefined, 0.5), T('letters', 'words'), T('letters', 'words', 0.7), T('letters', 'words', 0.3), T('letters', 'en'), T('minar')],
  social:    [T('face', undefined, 0.85), T('heart', 'breath', 0.4), T('face', 'pair', 0.8), T('face', undefined, 0.9), T('face', 'pair', 0.6), T('scale', undefined, 0.5), T('shield', undefined, 0.9), T('collection'), T('clock', undefined, 0.6), T('face', 'pair', 0.9)],
  discovery: [T('beaker', undefined, 0.5), T('beaker', undefined, 0.95), T('terrain', undefined, 0.8), T('collection'), T('collection'), T('circuit', 'network', 0.8), T('collection')],
};

export function heroFor(slug: string, hue: string, i: number, catName?: string): HeroSpec {
  const list = MAP[slug] ?? []; const h = list[i] ?? list[0] ?? T('atom');
  if (h.type !== 'collection' || !catName) return { ...h, hue };
  // a collection scene is built from the category's own items, so the model is
  // the actual set of things rather than a stand-in for them
  const col = collectionFor(slug, catName);
  const items = worlds.find((w) => w.slug === slug)?.cats.find((c) => c.n === catName)?.items ?? [];
  const figures = items.map((label) => ({ label, figure: col?.items[label] ?? col?.fallback ?? 'shrubGreen' }));
  return { ...h, hue, figures };
}
