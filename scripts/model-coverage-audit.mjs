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
let exact = 0;
let analogies = 0;
const visualAnalogyOnly = new Set([
  // High-detail, visibly disclosed comparisons. They replace crude geometry,
  // but do not close the exact-species sourcing backlog.
  'hilsa', 'doel', 'leopardCat', 'monkey', 'vulture',
]);
for (const [category, collection] of Object.entries(COLLECTIONS)) {
  const policy = policies[category];
  const rows = Object.entries(collection.items);
  total += rows.length;
  const concrete = rows.filter(([, figure]) => LICENSED_FIGURES[figure]);
  const exactConcrete = concrete.filter(([, figure]) => !visualAnalogyOnly.has(figure));
  const visualAnalog = concrete.filter(([, figure]) => visualAnalogyOnly.has(figure));
  licensed += concrete.length;
  exact += exactConcrete.length;
  analogies += visualAnalog.length;
  if (policy === 'exact-object') {
    exactBacklog.push(...rows
      .filter(([, figure]) => !LICENSED_FIGURES[figure] || visualAnalogyOnly.has(figure))
      .map(([item, figure]) => ({ category, item, figure, analogy: visualAnalogyOnly.has(figure) })));
  }
  console.log(`${policy.padEnd(16)} ${String(concrete.length).padStart(2)}/${String(rows.length).padEnd(2)} ${category}`);
}

console.log(`\nLicensed model mappings: ${licensed}/${total} (${exact} exact, ${analogies} disclosed visual analogy)`);
console.log(`Exact-object backlog: ${exactBacklog.length}`);
for (const row of exactBacklog) console.log(`- ${row.category} / ${row.item} (${row.analogy ? 'visual analogy only: ' : 'procedural: '}${row.figure})`);

if (process.env.MODEL_COVERAGE_STRICT === '1' && exactBacklog.length) process.exitCode = 1;
