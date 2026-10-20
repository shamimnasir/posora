import { COLLECTIONS } from '../src/data/collections.ts';
import { LICENSED_FIGURES } from '../src/components/explorer/licensed-figures.ts';
import { MODEL_CATEGORY_POLICIES as policies } from '../src/data/model-category-policies.ts';

/**
 * A procedural figure is not automatically a defect. A diagram of inflation,
 * a food chain or an emotion should explain the idea; pretending it is a
 * photographed object would make the lesson worse. Concrete specimen/object
 * lists are different: their figures must eventually be exact licensed models.
 */
const unknownCategories = Object.keys(COLLECTIONS).filter((key) => !policies[key]);
if (unknownCategories.length) {
  console.error(`Unclassified collection categories: ${unknownCategories.join(', ')}`);
  process.exit(1);
}

const exactBacklog = [];
let total = 0;
let licensed = 0;
for (const [category, collection] of Object.entries(COLLECTIONS)) {
  const policy = policies[category];
  const rows = Object.entries(collection.items);
  total += rows.length;
  const concrete = rows.filter(([, figure]) => LICENSED_FIGURES[figure]);
  licensed += concrete.length;
  if (policy === 'exact-object') {
    exactBacklog.push(...rows
      .filter(([, figure]) => !LICENSED_FIGURES[figure])
      .map(([item, figure]) => ({ category, item, figure })));
  }
  console.log(`${policy.padEnd(16)} ${String(concrete.length).padStart(2)}/${String(rows.length).padEnd(2)} ${category}`);
}

console.log(`\nLicensed exact-object/example mappings: ${licensed}/${total}`);
console.log(`Concrete exact-object backlog: ${exactBacklog.length}`);
for (const row of exactBacklog) console.log(`- ${row.category} / ${row.item} (procedural: ${row.figure})`);

if (process.env.MODEL_COVERAGE_STRICT === '1' && exactBacklog.length) process.exitCode = 1;
