import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/models');
const modelExtensions = new Set(['.glb', '.gltf']);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

const files = (await walk(root)).filter((file) => modelExtensions.has(path.extname(file).toLowerCase()));
const missing = [];
for (const model of files) {
  const directory = path.dirname(model);
  const readmePath = path.join(directory, 'README.md');
  const manifestPath = path.join(directory, 'asset-manifest.json');
  let record = '';
  try { record += await readFile(readmePath, 'utf8'); } catch {}
  try { record += `\n${await readFile(manifestPath, 'utf8')}`; } catch {}
  const hasSource = /https?:\/\//i.test(record) && /source/i.test(record);
  const hasLicense = /CC0|CC BY|Creative Commons|license/i.test(record);
  if (!hasSource || !hasLicense) missing.push(path.relative(root, model));
}

if (missing.length) {
  console.error(`Missing source/license evidence for ${missing.length} model file(s):`);
  for (const model of missing) console.error(`- ${model}`);
  process.exitCode = 1;
} else {
  console.log(`Rights-record audit passed: ${files.length} GLB/glTF files have local source and license evidence.`);
}
