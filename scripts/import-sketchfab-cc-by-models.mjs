import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { normals, prune, simplify, weld } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';

/**
 * Sketchfab CC BY models for exact Bangladeshi subjects that were drawn as
 * Posora teaching diagrams. Sketchfab downloads need a signed-in account, so
 * the GLBs are fetched in a browser first (SKETCHFAB_DIR, default
 * ~/Downloads); this script verifies the licence against the public API,
 * drops studio props that are not the subject, and optimizes for the web.
 * A missing download is skipped, not faked.
 */
const CHECKED = '2026-10-28';
const sourceDir = process.env.SKETCHFAB_DIR ?? path.join(homedir(), 'Downloads');
const assets = [
  {
    uid: '675c51ed065348ac846fe52098868a0b', file: 'posora-palmyra.glb',
    directory: 'palmyra_fruit_01', filename: 'palmyra-fruit.glb', qualityTier: 'exact-licensed',
    // The source sits the fruits on a wooden board; the board is not the subject.
    dropMaterials: ['Ground'],
    role: 'Life → বাংলাদেশের গাছপালা → তাল: the fruit of Borassus flabellifer (one cut open to show the kernels), shown beside the whole-tree teaching figure.',
    limitations: ['Fruits only, not the whole palm; the tree stays a Posora teaching figure.', 'A hand-modelled fruit, not a scan of a particular specimen.', 'Textures reduced to 1024 px WebP; the wooden display board was removed.'],
  },
  {
    uid: '46e246f191e44684b98a16f48201b301', file: 'gulab_jamun.glb',
    directory: 'gulab_jamun_01', filename: 'gulab-jamun.glb', qualityTier: 'exact-licensed', dropMaterials: [],
    role: 'Food → বাংলার খাবার → মিষ্টি: three textured গোলাপজাম (gulab jamun) in syrup in a glass bowl, one real kind of Bangladeshi মিষ্টি.',
    limitations: ['One kind of মিষ্টি; রসগোল্লা, চমচম, সন্দেশ and others look different.', 'The glass bowl, syrup and spoon are modelled; textures reduced to 1024 px WebP.'],
  },
  {
    uid: 'a03baeed12ee4dc5a02b4fc02f4ee940', file: 'dal-bhat-scans-with-iphone12-pro.zip',
    // Held back (2026-10-28): a Nepali thali would replace an accurate
    // Bangladeshi rice-and-dal model with a comparison. SKETCHFAB_INCLUDE_HELD=1 imports it.
    held: true,
    directory: 'dal_bhat_nepal_scan_01', filename: 'dal-bhat-nepal-scan.glb', qualityTier: 'disclosed-comparison', dropMaterials: [],
    // A 398k-triangle LiDAR scan with unindexed vertex colour; weld it and
    // keep about a fifth of the triangles, which the scan noise hides.
    simplifyRatio: 0.2,
    role: 'Food → বাংলার খাবার → ভাত ও ডাল: an iPhone LiDAR scan of a Nepali dal bhat thali (rice, dal, vegetable curries) on a steel plate, shown as a disclosed comparison.',
    limitations: ['A Nepali serving, not a Bangladeshi one; Bangladeshi rice and dal is usually served on a plain plate with dal in a bowl.', 'A phone LiDAR scan: surfaces are noisy and the rice reads as a lump.', 'Geometry simplified to about 20% of the source triangles.'],
  },
];

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const work = await mkdtemp(path.join(tmpdir(), 'posora-sketchfab-'));
const evidence = [];
for (const asset of assets) {
  if (asset.held && process.env.SKETCHFAB_INCLUDE_HELD !== '1') { console.warn(`skip ${asset.directory}: held back, see comment`); continue; }
  const input = path.join(sourceDir, asset.file);
  try { await access(input); } catch { console.warn(`skip ${asset.directory}: ${input} not downloaded`); continue; }
  const meta = await (await fetch(`https://api.sketchfab.com/v3/models/${asset.uid}`)).json();
  if (meta.license?.slug !== 'by') throw new Error(`${asset.uid}: licence is ${meta.license?.label ?? 'unknown'}, not CC BY`);
  // Sketchfab serves some original-format downloads as a zip around the GLB.
  const original = input.endsWith('.zip') ? execFileSync('unzip', ['-p', input, '*.glb'], { maxBuffer: 1 << 30 }) : await readFile(input);
  const document = await io.readBinary(new Uint8Array(original));
  for (const node of document.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (mesh?.listPrimitives().every((primitive) => asset.dropMaterials.includes(primitive.getMaterial()?.getName()))) node.dispose();
  }
  await document.transform(prune());
  if (asset.simplifyRatio) {
    await MeshoptSimplifier.ready;
    // Scan vertices carry per-face normals, so nothing welds until they go;
    // smooth normals are recomputed after simplifying.
    for (const mesh of document.getRoot().listMeshes()) for (const primitive of mesh.listPrimitives()) primitive.getAttribute('NORMAL')?.dispose();
    await document.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: asset.simplifyRatio, error: 0.002 }), normals({ overwrite: true }), prune());
  }
  const stripped = path.join(work, asset.file);
  await io.write(stripped, document);
  const out = path.resolve('public/models', asset.directory);
  await mkdir(out, { recursive: true });
  const target = path.join(out, asset.filename);
  execFileSync('npx', ['-y', '@gltf-transform/cli@4.1.1', 'optimize', stripped, target, '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', '1024', '--simplify', 'false'], { stdio: 'inherit' });
  const bytes = await readFile(target);
  const creator = `${meta.user.displayName} (@${meta.user.username})`;
  const manifest = {
    name: meta.name, creator, source: meta.viewerUrl, license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    attributionRequired: true, publishedDate: meta.publishedAt.slice(0, 10), downloadedDate: CHECKED, qualityTier: asset.qualityTier,
    sourceFiles: [{ path: asset.file, bytes: original.length, sha256: sha(original), faceCount: meta.faceCount }],
    files: [{ path: asset.filename, bytes: bytes.length, sha256: sha(bytes) }],
    modifications: [...(asset.dropMaterials.length ? [`Removed meshes using material(s): ${asset.dropMaterials.join(', ')}.`] : []), ...(asset.simplifyRatio ? [`Welded and simplified to ~${asset.simplifyRatio * 100}% of the source triangles (meshoptimizer).`] : []), 'Re-encoded with EXT_meshopt_compression; textures resized to 1024 px WebP.'],
    educationalRole: asset.role, limitations: asset.limitations,
  };
  await writeFile(path.join(out, 'asset-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(out, 'SOURCE-LICENSE.md'), `# Source and license evidence — ${meta.name}\n\n- Creator: ${creator}\n- Source: ${meta.viewerUrl}\n- License: ${meta.license.label} (CC BY 4.0) — https://creativecommons.org/licenses/by/4.0/\n- Licence checked via https://api.sketchfab.com/v3/models/${asset.uid} on ${CHECKED}\n- Changes: ${manifest.modifications.join(' ')}
- Tier: ${asset.qualityTier}\n\nAttribution is shown on the page wherever the model appears.\n`);
  await writeFile(path.join(out, 'README.md'), `# ${meta.name}\n\n${asset.role}\n\nSee \`asset-manifest.json\` and \`SOURCE-LICENSE.md\`.\n`);
  evidence.push({ uid: asset.uid, name: meta.name, creator, source: meta.viewerUrl, license: meta.license.label, licenseSlug: meta.license.slug, publishedAt: meta.publishedAt, checked: CHECKED, asset: `${asset.directory}/${asset.filename}` });
  console.log(`${asset.directory}/${asset.filename}: ${(bytes.length / 1024).toFixed(0)} KiB`);
}
const evidencePath = path.resolve('docs/animation-remake/evidence/sketchfab-cc-by-licenses.json');
const previous = await readFile(evidencePath, 'utf8').then(JSON.parse).catch(() => []);
const merged = [...previous.filter((entry) => !evidence.some((next) => next.uid === entry.uid)), ...evidence];
await writeFile(evidencePath, `${JSON.stringify(merged, null, 2)}\n`);
