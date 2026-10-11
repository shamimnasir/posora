import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import ts from 'typescript';

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

// Keep the labels in collection scenes tied to real figures. Without this
// check, a renamed or removed figure silently displayed an unrelated face.
const loadData = async (path) => {
  const source = readFileSync(join(ROOT, path), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
};
const { worlds } = await loadData('src/data/worlds.ts');
const { COLLECTIONS } = await loadData('src/data/collections.ts');
const figuresSource = ts.createSourceFile(
  'figures.ts', readFileSync(join(ROOT, 'src/components/explorer/figures.ts'), 'utf8'),
  ts.ScriptTarget.Latest, true,
);
const figureKeys = new Set();
for (const statement of figuresSource.statements) {
  if (!ts.isVariableStatement(statement)) continue;
  for (const declaration of statement.declarationList.declarations) {
    if (declaration.name.getText(figuresSource) !== 'FIGURES' || !declaration.initializer || !ts.isObjectLiteralExpression(declaration.initializer)) continue;
    for (const property of declaration.initializer.properties) {
      if (ts.isShorthandPropertyAssignment(property) || ts.isPropertyAssignment(property)) {
        figureKeys.add(property.name.getText(figuresSource).replace(/^['"]|['"]$/g, ''));
      }
    }
  }
}
if (!figureKeys.size) failures.push('figures.ts: could not read the figure registry');
for (const [key, collection] of Object.entries(COLLECTIONS)) {
  const divider = key.indexOf(':');
  const world = worlds.find((w) => w.slug === key.slice(0, divider));
  const category = world?.cats.find((c) => c.n === key.slice(divider + 1));
  if (!category) { failures.push(`${key}: collection does not match a world category`); continue; }
  if (!figureKeys.has(collection.fallback)) failures.push(`${key}: unknown fallback figure ${collection.fallback}`);
  for (const item of category.items) {
    if (!(item in collection.items)) failures.push(`${key}/${item}: no explicit figure mapping`);
  }
  for (const [item, figure] of Object.entries(collection.items)) {
    if (!category.items.includes(item)) failures.push(`${key}/${item}: mapping has no matching item`);
    if (!figureKeys.has(figure)) failures.push(`${key}/${item}: unknown figure ${figure}`);
  }
}
for (const path of files(join(ROOT, 'src'))) {
  const rel = relative(ROOT, path);
  const text = readFileSync(path, 'utf8');
  if (text.includes('—') && !EXEMPT_EM_DASH.has(rel)) failures.push(`${rel}: forbidden em dash`);
  // `tool` is an exclusive coverage bucket: it only counts lab-backed items
  // that do not also have a reading record. Once Math measurement gained its
  // lessons, that number correctly became zero internally but public copy
  // incorrectly advertised "০টি চালু টুল". Public claims must use the
  // independently counted live labs/missions instead.
  if (rel !== 'src/lib/coverage.ts' && text.includes('COVERAGE.tool')) {
    failures.push(`${rel}: public copy uses the exclusive tool coverage bucket`);
  }
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
    if (name === 'search-questions.ts' || name === 'topic-gaps.ts') {
      // These content builders set generatedCover: true and the SVG route
      // creates a deterministic, title-specific image for every slug. They
      // intentionally have no duplicate raster JPEG under /images/blog/.
      if (!/generatedCover\s*:\s*true/.test(text)) failures.push(`${match[1]}: generated blog cover is not enabled`);
      if (!existsSync(join(ROOT, 'src/pages/blog/cover/[slug].svg.ts'))) failures.push(`${match[1]}: generated cover route is missing`);
      continue;
    }
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
