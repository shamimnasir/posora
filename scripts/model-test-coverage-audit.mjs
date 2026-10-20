import { readFile } from 'node:fs/promises';
import { COLLECTIONS } from '../src/data/collections.ts';
import { LICENSED_FIGURES } from '../src/components/explorer/licensed-figures.ts';
import { MODEL_CATEGORY_POLICIES } from '../src/data/model-category-policies.ts';

const smokeSource = await readFile(new URL('./licensed-models-smoke.mjs', import.meta.url), 'utf8');
const testedAssets = new Set();
for (const match of smokeSource.matchAll(/expected:\s*\[([^\]]*)\]/gs)) {
  for (const asset of match[1].matchAll(/['"]([^'"]+)['"]/g)) testedAssets.add(asset[1]);
}

const active = new Map();
for (const [category, collection] of Object.entries(COLLECTIONS)) {
  // A teaching diagram explains a process or abstract idea. Its collection
  // map is not active 3D object content and must not be forced into model tests.
  if (MODEL_CATEGORY_POLICIES[category] === 'teaching-diagram') continue;
  for (const [item, figure] of Object.entries(collection.items)) {
    const model = LICENSED_FIGURES[figure];
    if (!model) continue;
    const asset = model.url.replace(/^\/models\//, '');
    if (!active.has(asset)) active.set(asset, []);
    active.get(asset).push({ category, item, figure });
  }
}

const missing = [...active].filter(([asset]) => !testedAssets.has(asset));
console.log(`Unique licensed assets used by collection content: ${active.size}`);
console.log(`Unique assets represented in the desktop/mobile smoke suite: ${[...active.keys()].filter((asset) => testedAssets.has(asset)).length}`);
console.log(`Missing smoke cases: ${missing.length}`);
for (const [asset, uses] of missing) {
  const locations = uses.map(({ category, item }) => `${category} / ${item}`).join('; ');
  console.log(`- ${asset}: ${locations}`);
}

if (process.env.MODEL_TEST_COVERAGE_STRICT === '1' && missing.length) process.exitCode = 1;
