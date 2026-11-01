/**
 * Does the live site show what src/data says?
 *
 * Worlds and the space/math/language datasets are served from D1 once seeded,
 * so a fix made only in src/data changes nothing live (the 2026-10-30 fact-check
 * shipped ~280 corrections that way and eleven planet texts stayed wrong for two
 * days). This compares production D1 against the checked-in data, field by
 * field, and exits non-zero on any difference. A difference is either a source
 * fix that needs a guarded migration (see migrations/0011) or an admin edit that
 * should be copied back into src/data.
 *
 *   npm run audit:d1-drift            # production
 *   npm run audit:d1-drift -- --local
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const where = process.argv.includes('--local') ? '--local' : '--remote';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'posora-drift-'));

const entry = path.join(tmp, 'entry.ts');
fs.writeFileSync(entry, [
  `export { worlds } from '${root}/src/data/worlds';`,
  `export { bodies } from '${root}/src/data/space';`,
  `export { tools, numberWords, denominations, shopItems } from '${root}/src/data/math';`,
  `export { vowels, consonants, kars, folas, conjuncts } from '${root}/src/data/language';`,
].join('\n'));
await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile: path.join(tmp, 'data.mjs'), logLevel: 'error' });
const src = await import(path.join(tmp, 'data.mjs'));

const query = (sql) => JSON.parse(execFileSync('npx', ['wrangler', 'd1', 'execute', 'DB', where, '--json', '--command', sql], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 }))[0].results;
const rows = query('SELECT * FROM worlds');
const datasets = Object.fromEntries(query('SELECT key, json FROM datasets').map((r) => [r.key, JSON.parse(r.json)]));

const out = [];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
if (!rows.length) console.log(`D1 (${where}) has no worlds: the site falls back to src/data, nothing to compare.`);
for (const w of rows.length ? src.worlds : []) {
  const r = rows.find((x) => x.slug === w.slug);
  if (!r) { out.push(`${w.slug}: not in D1`); continue; }
  for (const f of ['bn', 'en', 'tag', 'hue', 'age', 'dep', 'phase', 'intro']) if (r[f] !== w[f]) out.push(`${w.slug}.${f}`);
  for (const [f, col] of [['keys', 'keys_json'], ['keyCats', 'key_cats_json'], ['missions', 'missions_json'], ['missionCats', 'mission_cats_json']]) if (!same(JSON.parse(r[col]), w[f])) out.push(`${w.slug}.${f}`);
  const cats = JSON.parse(r.cats_json);
  if (cats.length !== w.cats.length) out.push(`${w.slug}.cats: ${cats.length} in D1, ${w.cats.length} in source`);
  w.cats.forEach((c, i) => {
    for (const k of new Set([...Object.keys(c), ...Object.keys(cats[i] ?? {})])) if (!same(c[k], cats[i]?.[k])) out.push(`${w.slug}.cats[${i}].${k} (${c.n})`);
  });
}
const srcSets = {
  space: src.bodies,
  math: { tools: src.tools, numberWords: src.numberWords, denominations: src.denominations, shopItems: src.shopItems },
  language: { vowels: src.vowels, consonants: src.consonants, kars: src.kars, folas: src.folas, conjuncts: src.conjuncts },
};
for (const [key, value] of Object.entries(srcSets)) if (datasets[key] !== undefined && !same(datasets[key], value)) out.push(`dataset ${key}`);

fs.rmSync(tmp, { recursive: true, force: true });
if (out.length) {
  console.log(`D1 (${where}) differs from src/data in ${out.length} place(s):`);
  for (const line of out) console.log(`- ${line}`);
  process.exit(1);
}
console.log(`D1 (${where}) matches src/data: ${rows.length} worlds, ${Object.keys(datasets).length} datasets.`);
