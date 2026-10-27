import { existsSync } from 'node:fs';
import { COLLECTIONS } from '../src/data/collections.ts';
import { LICENSED_FIGURES } from '../src/components/explorer/licensed-figures.ts';
import { MODEL_CATEGORY_POLICIES as policies } from '../src/data/model-category-policies.ts';
import { LICENSED_FIGURE_QUALITY as quality, PROCEDURAL_ITEM_DESIGNATIONS as designations } from '../src/data/model-quality.ts';
import { REFERENCE_PHOTOS } from '../src/data/reference-photos.ts';

/**
 * The authoritative inventory of every learning object's visual.
 *
 * A procedural figure is not automatically a defect: a diagram of inflation,
 * a food chain or an emotion should explain the idea. What this audit refuses
 * is a figure that merely loads. It fails when:
 *
 * - a collection category has no policy, or a licensed figure has no quality;
 * - an exact-object lesson uses a figure marked `replacement-required`, or is
 *   still drawn procedurally;
 * - an exact-object lesson shows a comparison or a teaching illustration
 *   without an exact reference photograph (and the photograph file exists);
 * - a mixed lesson draws an item procedurally without an explicit, reasoned
 *   designation, or a designation no longer matches any item.
 */
const errors = [];
const unknownCategories = Object.keys(COLLECTIONS).filter((key) => !policies[key]);
if (unknownCategories.length) errors.push(`Unclassified collection categories: ${unknownCategories.join(', ')}`);
for (const key of Object.keys(LICENSED_FIGURES)) if (!quality[key]) errors.push(`Licensed figure without a quality tier: ${key}`);
for (const key of Object.keys(quality)) if (!LICENSED_FIGURES[key]) errors.push(`Quality tier for a figure that no longer exists: ${key}`);

const counts = { 'exact-licensed': 0, 'accurate-authored': 0, 'disclosed-comparison': 0, 'teaching-diagram': 0, 'replacement-required': 0, 'procedural-concept': 0 };
const backlog = [];
const usedDesignations = new Set();
let total = 0;
for (const [category, collection] of Object.entries(COLLECTIONS)) {
  const policy = policies[category];
  const rows = Object.entries(collection.items);
  total += rows.length;
  const tally = {};
  for (const [item, figure] of rows) {
    const licensed = !!LICENSED_FIGURES[figure];
    const key = `${category}/${item}`;
    let tierName;
    if (licensed) {
      tierName = quality[figure] ?? 'unclassified';
      if (tierName === 'replacement-required') {
        if (policy === 'exact-object') errors.push(`${key}: exact-object lesson uses ${figure}, marked replacement-required`);
        else backlog.push(`${key} (${figure})`);
      }
      if (policy === 'exact-object' && (tierName === 'teaching-diagram' || tierName === 'disclosed-comparison')) {
        const [world, cat] = category.split(':');
        const reference = REFERENCE_PHOTOS[`${world}:${cat}`]?.[item];
        if (!reference) errors.push(`${key}: ${tierName} figure ${figure} has no exact reference photograph`);
        else if (!existsSync(new URL(`../public${reference.image}`, import.meta.url))) errors.push(`${key}: reference photograph missing on disk (${reference.image})`);
        else if (!reference.author || !reference.page.startsWith('https://') || !reference.licenseUrl.startsWith('https://')) errors.push(`${key}: reference photograph credit is incomplete`);
      }
    } else if (policy === 'exact-object') {
      tierName = 'procedural';
      errors.push(`${key}: exact-object lesson is still drawn procedurally (${figure})`);
    } else if (policy === 'mixed-example') {
      const designation = designations[key];
      usedDesignations.add(key);
      if (!designation) { errors.push(`${key}: procedural figure ${figure} has no teaching-diagram designation or replacement record`); tierName = 'procedural'; }
      else {
        tierName = designation.quality;
        if (!designation.reason?.trim()) errors.push(`${key}: designation has no reason`);
        if (designation.quality === 'replacement-required') backlog.push(`${key} (${figure}): ${designation.reason}`);
      }
    } else tierName = 'procedural-concept';
    counts[tierName] = (counts[tierName] ?? 0) + 1;
    tally[tierName] = (tally[tierName] ?? 0) + 1;
  }
  console.log(`${policy.padEnd(16)} ${category}  ${Object.entries(tally).map(([k, v]) => `${k}:${v}`).join(' ')}`);
}
for (const key of Object.keys(designations)) if (!usedDesignations.has(key)) errors.push(`Stale procedural designation: ${key}`);

console.log(`\n${total} learning objects`);
for (const [name, count] of Object.entries(counts)) if (count) console.log(`  ${name.padEnd(22)} ${count}`);
console.log(`\nReplacement backlog (mixed lessons, not failing): ${backlog.length}`);
for (const row of backlog) console.log(`- ${row}`);
if (errors.length) {
  console.error(`\nModel coverage audit failed (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else console.log('\nModel coverage audit passed: no exact-object lesson relies on a replacement-required or unexplained visual.');
