import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * Smithsonian Open Access 3D scans (CC0) for physical objects that were
 * still drawn as stand-ins: a flying bird for the first aeroplane, a
 * primitive for a fossil and a cartoon for a dinosaur.
 *
 * Each source is the Smithsonian's whole-object 100k Draco GLB. It is
 * converted to meshopt + WebP (the site's loader registers the Meshopt
 * decoder, not Draco) with 1024 px textures and no simplification.
 */
const CHECKED = '2026-10-28';
const assets = [
  {
    directory: 'wright_flyer_1903_si_01', filename: 'wright-flyer-1903.glb', name: '1903 Wright Flyer',
    source: 'https://3d-api.si.edu/content/document/3d_package:d8c62e5e-4ebc-11ea-b77f-2e728ce88125/1903WrightFlyer-100k-2048_std_draco.glb',
    record: 'http://n2t.net/ark:/65665/nv9aa91e7c2-85b2-4904-aff0-d990694b6f1d', holder: 'Smithsonian National Air and Space Museum',
    role: 'Discovery → আবিষ্কার ও আবিষ্কারক → উড়োজাহাজ: the actual first successful powered aeroplane (1903), digitised by the Smithsonian.',
    limitations: ['A digitised museum object, not a modern passenger aircraft.', 'Textures reduced to 1024 px WebP for web delivery; geometry unchanged.'],
  },
  {
    directory: 'triceratops_si_01', filename: 'triceratops-skeleton.glb', name: 'Triceratops horridus Marsh, 1889',
    source: 'https://3d-api.si.edu/content/document/3d_package:d8c623be-4ebc-11ea-b77f-2e728ce88125/resources/Triceratops-100k-2048_std_draco.glb',
    record: 'http://n2t.net/ark:/65665/305d36697-5158-4947-8d0b-521db04bae9b', holder: 'Smithsonian National Museum of Natural History, Department of Paleobiology',
    role: 'Discovery → পৃথিবী ও ভূতত্ত্ব → ডাইনোসর: a scanned Triceratops fossil skeleton.',
    limitations: ['A fossil skeleton, not a reconstruction of the living animal\'s skin or colour.', 'Textures reduced to 1024 px WebP for web delivery; geometry unchanged.'],
  },
  {
    directory: 'trilobite_poliella_si_01', filename: 'trilobite-poliella-prima.glb', name: 'Poliella prima (Walcott), USNM PAL 116112',
    source: 'https://3d-api.si.edu/content/document/3d_package:fcec58e8-ac1f-425d-9d83-8b16ca72b60c/nmnh-116112_w9k-100k-2048_std_draco.glb',
    record: 'http://n2t.net/ark:/65665/3b8ac40e8-2b17-4817-8488-f10907ed93c4', holder: 'Smithsonian National Museum of Natural History, Department of Paleobiology',
    role: 'Discovery → পৃথিবী ও ভূতত্ত্ব → জীবাশ্ম: a scanned Cambrian trilobite fossil specimen.',
    limitations: ['One trilobite fossil specimen in rock; fossils take many other forms.', 'Textures reduced to 1024 px WebP for web delivery; geometry unchanged.'],
  },
];

const work = await mkdtemp(path.join(tmpdir(), 'posora-si-'));
for (const asset of assets) {
  const response = await fetch(asset.source);
  if (!response.ok) throw new Error(`${response.status} downloading ${asset.source}`);
  const original = Buffer.from(await response.arrayBuffer());
  const input = path.join(work, `${asset.directory}-source.glb`);
  await writeFile(input, original);
  const out = path.resolve('public/models', asset.directory);
  await mkdir(out, { recursive: true });
  const target = path.join(out, asset.filename);
  execFileSync('npx', ['-y', '@gltf-transform/cli@4.1.1', 'optimize', input, target, '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', '1024', '--simplify', 'false'], { stdio: 'inherit' });
  const bytes = await readFile(target);
  const sha = (b) => createHash('sha256').update(b).digest('hex');
  const manifest = {
    name: asset.name, creator: asset.holder, source: asset.record, sourceFile: asset.source,
    license: 'CC0 1.0 Universal (Smithsonian Open Access)', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/', termsUrl: 'https://www.si.edu/termsofuse',
    attributionRequired: false, downloadedDate: CHECKED, qualityTier: 'exact-licensed',
    sourceFiles: [{ path: path.basename(asset.source), bytes: original.length, sha256: sha(original) }],
    files: [{ path: asset.filename, bytes: bytes.length, sha256: sha(bytes) }],
    modifications: ['Draco geometry decoded and re-encoded with EXT_meshopt_compression and KHR_mesh_quantization.', 'Textures resized to 1024 px and encoded as WebP.'],
    educationalRole: asset.role, limitations: asset.limitations,
  };
  await writeFile(path.join(out, 'asset-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(out, 'SOURCE-LICENSE.md'), `# Source and license evidence — ${asset.name}\n\n- Holder: ${asset.holder}\n- Collection record: ${asset.record}\n- Source file: ${asset.source}\n- License: CC0 1.0 Universal, as marked in the Smithsonian Open Access record (metadata_usage.access = CC0)\n- Terms: https://www.si.edu/termsofuse\n- Checked: ${CHECKED}\n\nCredit is given voluntarily on the page; CC0 does not require it.\n`);
  await writeFile(path.join(out, 'README.md'), `# ${asset.name}\n\n${asset.role}\n\nSee \`asset-manifest.json\` and \`SOURCE-LICENSE.md\`.\n`);
  console.log(`${asset.directory}/${asset.filename}: ${(bytes.length / 1024).toFixed(0)} KiB`);
}
