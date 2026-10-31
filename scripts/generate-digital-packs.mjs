/**
 * npm run digital-packs
 *
 * Builds the paid PDF bundle from the site's own, fact-checked content:
 *   1. bundles scripts/lib/pack-data.ts with esbuild and takes a plain-data
 *      snapshot of the worlds, readings, worksheets, quizzes, missions, the
 *      solar-system bodies and the language and math tables;
 *   2. lays every document out as HTML and lets headless Chrome paginate it
 *      (the paginator lives in scripts/lib/pack-kit.mjs) and print it to A4;
 *   3. writes manifest.json (version 3), SHA256SUMS, the ZIP and the
 *      preview PNGs in public/digital-pack-preview/.
 *
 * Usage: npm run digital-packs [-- --only=math-play,start-here] [-- --no-zip]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { renderDoc } from './lib/pack-kit.mjs';
import { buildWorldDoc } from './lib/pack-docs.mjs';
import { buildStartHere, buildPlan, buildCertificates, buildWallCharts } from './lib/pack-guides.mjs';

const run = promisify(execFile);
const root = process.cwd();
const outDir = path.join(root, 'private-downloads', 'digital-packs');
const htmlDir = path.join(outDir, '_html');
const previewDir = path.join(root, 'public', 'digital-pack-preview');
const zipPath = path.join(root, 'private-downloads', 'posora-digital-pack-bundle.zip');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const args = process.argv.slice(2);
const only = (args.find((a) => a.startsWith('--only='))?.slice(7) ?? '').split(',').filter(Boolean);
const skipZip = args.includes('--no-zip');

/* 1. snapshot */
const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'posora-packs-'));
const entryOut = path.join(tmp, 'pack-data.mjs');
await build({ entryPoints: [path.join(root, 'scripts/lib/pack-data.ts')], bundle: true, platform: 'node', format: 'esm', outfile: entryOut, logLevel: 'warning' });
const { snapshot } = await import(pathToFileURL(entryOut).href);
const data = snapshot();

await fs.mkdir(htmlDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 800, height: 1200 }, deviceScaleFactor: 849 / 793.7 });

/** Render one document to PDF; returns page count, toc map and the open page for previews. */
async function renderPdf(slug, doc) {
  const htmlPath = path.join(htmlDir, `${slug}.html`);
  const pdfPath = path.join(outDir, `${slug}.pdf`);
  await fs.writeFile(htmlPath, renderDoc(doc, root), 'utf8');
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
  await page.evaluate(async () => { await document.fonts.load('16px PosoraBangla', 'অআক'); await document.fonts.ready; });
  const res = await page.evaluate(() => window.__paginate());
  if (res.errors.length) {
    console.error(`[${slug}] layout problems:\n  ${res.errors.join('\n  ')}`);
    throw new Error(`layout problems in ${slug}`);
  }
  await page.pdf({ path: pdfPath, preferCSSPageSize: true, printBackground: true });
  const bytes = await fs.readFile(pdfPath);
  const counted = (bytes.toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length;
  if (counted && counted !== res.pages) throw new Error(`${slug}: paginator made ${res.pages} pages but the PDF has ${counted}`);
  return { page, pages: counted || res.pages, toc: res.toc, bytes, pdfPath };
}

async function preview(page, n, name) {
  const el = page.locator('#out > .page').nth(n - 1);
  await el.screenshot({ path: path.join(previewDir, `${name}.png`) });
}

const files = [];
const packInfo = {};
const want = (slug) => !only.length || only.includes(slug);

/* 2. world packs */
for (const pack of data.packs) {
  if (!want(pack.slug) && !(only.length && only.some((o) => ['30-day-plan', 'certificates', 'start-here'].includes(o)))) continue;
  const world = data.worlds.find((w) => w.slug === pack.worldSlug);
  const doc = buildWorldDoc(pack, world, data);
  const r = await renderPdf(pack.slug, doc);
  packInfo[pack.slug] = { pages: r.pages, toc: r.toc, doc, pack, world };
  // The preview is the world's most typical work page.
  const previewSec = doc.previewSection;
  await preview(r.page, r.toc[previewSec] ?? 2, pack.slug);
  if (pack.slug === 'math-play') {
    await preview(r.page, r.toc['ws-0'] ?? 3, 'math-worksheet');
    await preview(r.page, r.toc['sp-shop'] ?? 3, 'math-bonus');
  }
  await r.page.close();
  // Pages a child writes on: worksheets, quizzes, the world's special pages and the missions.
  const work = new Set();
  doc.sections.forEach((sec, i) => {
    if (!/^(ws|qz|sp|ms)-/.test(sec.id)) return;
    const a = r.toc[sec.id];
    const next = doc.sections.slice(i + 1).find((x) => r.toc[x.id]);
    const b = next ? (next.flow ? r.toc[next.id] : r.toc[next.id] - 1) : r.pages;
    for (let pg = a; pg <= Math.max(a, b); pg++) work.add(pg);
  });
  files.push({ slug: pack.slug, file: `${pack.slug}.pdf`, title: pack.title, kind: 'world', pages: r.pages, workPages: work.size, bytes: r.bytes.length, sha256: sha(r.bytes) });
  console.log(`${pack.slug}.pdf  ${r.pages} pages (${work.size} work pages)  ${(r.bytes.length / 1024).toFixed(0)} KB`);
}

/* 3. bundle-wide guides and extras */
const guides = [
  { slug: 'start-here', title: 'শুরু করার গাইড', kind: 'guide', make: () => buildStartHere(data, packInfo), preview: 'math-guide', previewPage: 3 },
  { slug: '30-day-plan', title: '৩০ দিনের পরিকল্পনা', kind: 'guide', make: () => buildPlan(data, packInfo) },
  { slug: 'certificates', title: 'সনদপত্র', kind: 'extra', make: () => buildCertificates(data, packInfo) },
  { slug: 'wall-charts', title: 'দেয়াল-চার্ট', kind: 'extra', make: () => buildWallCharts(data) },
];
for (const g of guides) {
  if (!want(g.slug)) continue;
  const r = await renderPdf(g.slug, g.make());
  if (g.preview) await preview(r.page, g.previewPage, g.preview);
  await r.page.close();
  files.push({ slug: g.slug, file: `${g.slug}.pdf`, title: g.title, kind: g.kind, pages: r.pages, bytes: r.bytes.length, sha256: sha(r.bytes) });
  console.log(`${g.slug}.pdf  ${r.pages} pages  ${(r.bytes.length / 1024).toFixed(0)} KB`);
}
await browser.close();
await fs.rm(tmp, { recursive: true, force: true });

function sha(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }

if (only.length) { console.log('Partial run (--only): manifest and ZIP left unchanged.'); process.exit(0); }

/* 4. manifest, checksums, zip. Order = what a buyer should open first. */
const order = ['start-here', '30-day-plan', ...data.packs.map((p) => p.slug), 'wall-charts', 'certificates'];
files.sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
for (const f of files) if (!/^[a-z0-9-]{2,48}$/.test(f.slug)) throw new Error(`bad slug ${f.slug}`);
const manifest = {
  version: 3,
  generatedAt: new Date().toISOString(),
  priceBdt: data.bundle.priceBdt,
  totalPages: files.reduce((n, f) => n + f.pages, 0),
  files,
  packs: files.filter((f) => f.kind === 'world'),
  guides: files.filter((f) => f.kind !== 'world'),
};
await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
await fs.writeFile(path.join(outDir, 'SHA256SUMS'), files.map((f) => `${f.sha256}  ${f.file}`).join('\n') + '\n');
// Remove PDFs from earlier versions that are no longer in the manifest.
for (const name of await fs.readdir(outDir)) {
  if (name.endsWith('.pdf') && !files.some((f) => f.file === name)) await fs.rm(path.join(outDir, name));
}

if (!skipZip) {
  const stage = await fs.mkdtemp(path.join(os.tmpdir(), 'posora-zip-'));
  const folder = path.join(stage, 'posora-sob-download');
  await fs.mkdir(folder);
  for (const [i, f] of files.entries()) await fs.copyFile(path.join(outDir, f.file), path.join(folder, `${String(i + 1).padStart(2, '0')}-${f.file}`));
  await fs.rm(zipPath, { force: true });
  await run('zip', ['-q', '-r', '-X', zipPath, 'posora-sob-download'], { cwd: stage, timeout: 60000 });
  await fs.rm(stage, { recursive: true, force: true });
  const z = await fs.stat(zipPath);
  console.log(`ZIP ${(z.size / 1024 / 1024).toFixed(1)} MB -> ${zipPath}`);
}
console.log(`Done: ${files.length} PDFs, ${manifest.totalPages} pages.`);
