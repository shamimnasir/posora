import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ROOT = new URL('../', import.meta.url).pathname;
const INCLUDE = new Set(['.ts', '.astro', '.css', '.md', '.mjs']);
const EXEMPT_EM_DASH = new Set(['src/components/explorer/statviz.ts']);

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name === 'node_modules' || name === 'dist' || name === '.git') return [];
    return statSync(path).isDirectory() ? files(path) : INCLUDE.has(extname(path)) ? [path] : [];
  });
}

const banned = [
  ['outdated Saturn count', /১৪৬\s*(?:টি\s*)?চাঁদ|চাঁদ[^\n]{0,20}১৪৬/],
  ['outdated Jupiter moon count', /(?:৯৫\s*চাঁদ|চাঁদ[^\n]{0,20}৯৫)/],
  ['outdated Uranus moon count', /(?:২৮\s*চাঁদ|চাঁদ[^\n]{0,20}২৮)/],
  ['false per-item 3D claim', /প্রতিটি (?:বিষয়|জিনিস|আইটেম)(?:ের জন্য)? (?:একটা|একটি) থ্রিডি মডেল/],
  ['false all-printables-free claim', /সব ছাপার শিট (?:সম্পূর্ণ )?ফ্রি/],
  ['stale mission distribution claim', /three missions per world/],
];

const failures = [];
for (const path of files(join(ROOT, 'src'))) {
  const rel = relative(ROOT, path);
  const text = readFileSync(path, 'utf8');
  if (text.includes('—') && !EXEMPT_EM_DASH.has(rel)) failures.push(`${rel}: forbidden em dash`);
  for (const [label, pattern] of banned) {
    if (pattern.test(text)) failures.push(`${rel}: ${label}`);
  }
}

// Every published article must have its own crawlable social/cover image.
// Keeping this in the audit prevents a later post from silently falling back
// to the generic site artwork on the page, in image search and in link cards.
for (const name of readdirSync(join(ROOT, 'src/data/posts'))) {
  if (!name.endsWith('.ts')) continue;
  const text = readFileSync(join(ROOT, 'src/data/posts', name), 'utf8');
  for (const match of text.matchAll(/slug:\s*'([^']+)'/g)) {
    const image = join(ROOT, 'public/images/blog', `${match[1]}.jpg`);
    if (!existsSync(image)) failures.push(`public/images/blog/${match[1]}.jpg: missing blog image`);
  }
}

if (failures.length) {
  console.error(`Content audit failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Content audit passed');
