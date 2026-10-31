/**
 * Upload the generated paid library to the private R2 bucket.
 *
 *   npm run digital-packs          # build the PDFs, ZIP and manifest
 *   npm run digital-packs:upload   # this script; add --local for wrangler dev
 *
 * Every PDF and the ZIP go up first and the manifest last, so the site never
 * lists a file that is not in the bucket yet. bundleBytes is added to the
 * manifest here because the ZIP is made after the manifest is written.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = process.cwd();
const dir = path.join(root, 'private-downloads', 'digital-packs');
const zip = path.join(root, 'private-downloads', 'posora-digital-pack-bundle.zip');
const where = process.argv.includes('--local') ? '--local' : '--remote';
const bucket = 'posora-digital-packs';

const manifest = JSON.parse(await fs.readFile(path.join(dir, 'manifest.json'), 'utf8'));
if (!Array.isArray(manifest.files) || !manifest.files.length) throw new Error('manifest.json has no files[]; run npm run digital-packs first');

const put = async (key, file, type) => {
  await run('npx', ['wrangler', 'r2', 'object', 'put', `${bucket}/${key}`, where, '--file', file, '--content-type', type], { maxBuffer: 4 * 1024 * 1024 });
  console.log(`  ${key}`);
};

for (const f of manifest.files) await put(`digital-packs/${f.file}`, path.join(dir, f.file), 'application/pdf');
await put('digital-packs/posora-digital-pack-bundle.zip', zip, 'application/zip');
manifest.bundleBytes = (await fs.stat(zip)).size;
const tmp = path.join(dir, 'manifest.upload.json');
await fs.writeFile(tmp, JSON.stringify(manifest, null, 2));
await put('digital-packs/manifest.json', tmp, 'application/json');
await fs.rm(tmp);
console.log(`Uploaded ${manifest.files.length} PDFs + ZIP (${where.slice(2)})`);
