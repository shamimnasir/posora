import { COLLECTIONS } from '../src/data/collections.ts';
import { LICENSED_FIGURES } from '../src/components/explorer/licensed-figures.ts';

/**
 * A procedural figure is not automatically a defect. A diagram of inflation,
 * a food chain or an emotion should explain the idea; pretending it is a
 * photographed object would make the lesson worse. Concrete specimen/object
 * lists are different: their figures must eventually be exact licensed models.
 */
const policies = {
  'life:বাংলাদেশের গাছপালা': 'exact-object',
  'life:ঔষধি ও মশলা গাছ': 'exact-object',
  'life:প্রাণীর শ্রেণি': 'exact-object',
  'life:বাংলাদেশের প্রাণী': 'exact-object',
  'food:মশলার জগৎ': 'exact-object',
  'food:বাংলার খাবার': 'exact-object',
  'discovery:পরিমাপের যন্ত্র': 'exact-object',
  'food:খাদ্যের ছয় উপাদান': 'mixed-example',
  'food:রান্নার বিজ্ঞান': 'mixed-example',
  'food:নিরাপদ খাবার ও অভ্যাস': 'teaching-diagram',
  'money:ব্যাংক ও লেনদেন': 'teaching-diagram',
  'money:বাজার ও অর্থনীতি': 'teaching-diagram',
  'social:অনলাইন নিরাপত্তা': 'teaching-diagram',
  'social:আবেগ চেনা': 'teaching-diagram',
  'social:নিরাপত্তা': 'teaching-diagram',
  'discovery:আবিষ্কার ও আবিষ্কারক': 'mixed-example',
  'discovery:বিজ্ঞানের পদ্ধতি': 'teaching-diagram',
  'discovery:বাঙালি বিজ্ঞানী': 'teaching-diagram',
  'discovery:ঘরে বসে পরীক্ষা': 'teaching-diagram',
  'discovery:পৃথিবী ও ভূতত্ত্ব': 'teaching-diagram',
  'nature:বাস্তুতন্ত্র': 'teaching-diagram',
  'nature:বাংলাদেশের প্রকৃতি': 'teaching-diagram',
  'language:শব্দভাণ্ডার': 'mixed-example',
};

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
