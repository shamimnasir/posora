/**
 * Append missions to a world in src/data/worlds.ts.
 *
 * worlds.ts is hand-formatted JSON-in-TypeScript with a comment at the top, so
 * a parse-and-reprint would rewrite the whole file and lose that shape. This
 * finds the world's own `missions` and `missionCats` arrays and appends to
 * both together, which is the only edit that can keep them index-aligned.
 *
 * Usage: node scripts/add-missions.mjs <slug> <json file with [{n,d,cat}]>
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [slug, specPath] = process.argv.slice(2);
const file = 'src/data/worlds.ts';
let src = readFileSync(file, 'utf8');
const add = JSON.parse(readFileSync(specPath, 'utf8'));

const start = src.indexOf(`"slug": "${slug}"`);
if (start < 0) throw new Error(`no world ${slug}`);
// the world block ends at the next world's slug, or at the end of the array
const next = src.indexOf('"slug": "', start + 10);
const end = next < 0 ? src.length : next;

/** The span of `key`'s array inside [from, to), as [openIdx, closeIdx]. */
function arraySpan(key, from, to) {
  const k = src.indexOf(`"${key}": [`, from);
  if (k < 0 || k > to) throw new Error(`no ${key} in ${slug}`);
  const open = src.indexOf('[', k);
  let depth = 0;
  for (let i = open; i < to; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') { depth--; if (depth === 0) return [open, i]; }
  }
  throw new Error(`unterminated ${key} in ${slug}`);
}

const [, mClose] = arraySpan('missions', start, end);
const [, cClose] = arraySpan('missionCats', start, end);
if (mClose > cClose) throw new Error('missions must come before missionCats');

const missionText = add.map((m) => `   {\n    "n": ${JSON.stringify(m.n)},\n    "d": ${JSON.stringify(m.d)}\n   }`).join(',\n');
const catText = add.map((m) => `   ${m.cat === null ? 'null' : m.cat}`).join(',\n');

// splice the later one first, so the earlier index stays valid
src = src.slice(0, cClose) + `,\n${catText}\n  ` + src.slice(cClose);
src = src.slice(0, mClose) + `,\n${missionText}\n  ` + src.slice(mClose);
writeFileSync(file, src);
console.log(`${slug}: +${add.length} missions`);
