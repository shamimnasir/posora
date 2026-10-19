import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/models');
const catalogIds = [
  'binoculars', 'classic_laptop', 'CashRegister_01', 'gamepad', 'calathea_orbifolia_01', 'sweet_potato',
  'food_apple_01', 'food_kiwi_01', 'food_pomegranate_01', 'food_pears_asian_01', 'yellow_onion', 'croissant',
  'anthurium_botany_01', 'fern_02', 'SchoolChair_01', 'SchoolDesk_01', 'binder_notebook',
  'measuring_tape_01', 'magnifying_glass_01', 'Camera_01', 'gaming_console', 'potted_plant_01',
  'pot_enamel_01', 'brass_pan_01', 'medical_box', 'long_life_food', 'lemon',
  'chemistry_set', 'digital_wrist_watch', 'food_lime_01',
];
const requestedIds = process.argv.slice(2);
const ids = requestedIds.length ? catalogIds.filter((id) => requestedIds.includes(id)) : catalogIds;
if (requestedIds.some((id) => !catalogIds.includes(id))) throw new Error(`Unknown Poly Haven model ID: ${requestedIds.find((id) => !catalogIds.includes(id))}`);
async function fetchBytes(url, attempts = 4) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(90000) });
      if (!response.ok) throw new Error(`${response.status} downloading ${url}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
      if (attempt + 1 < attempts) await new Promise((resolve) => setTimeout(resolve, 500 * (2 ** attempt)));
    }
  }
  throw lastError;
}
const getJson = async (url) => JSON.parse((await fetchBytes(url)).toString('utf8'));
const [catalog, ...assetFiles] = await Promise.all([
  getJson('https://api.polyhaven.com/assets?type=models'),
  ...ids.map((id) => getJson(`https://api.polyhaven.com/files/${id}`)),
]);

for (let index = 0; index < ids.length; index++) {
  const id = ids[index];
  const record = catalog[id];
  const files = assetFiles[index];
  const format = files.gltf?.['1k'];
  if (!record || !format?.gltf?.url) throw new Error(`Missing 1K glTF metadata for ${id}`);
  const directory = path.join(root, id);
  await mkdir(path.join(directory, 'textures'), { recursive: true });
  const downloaded = [];
  for (const [relative, asset] of Object.entries(format.gltf.include)) {
    // Poly Haven's 1K glTF manifest points at the same binary under its 8K
    // directory. The binary itself is resolution-independent; fetch its 1K URL.
    const url = asset.url.replace('/gltf/8k/', '/gltf/1k/');
    const bytes = await fetchBytes(url);
    const md5 = createHash('md5').update(bytes).digest('hex');
    if (md5 !== asset.md5) throw new Error(`${id}: checksum mismatch for ${relative} (${md5} != ${asset.md5})`);
    const target = path.join(directory, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
    downloaded.push({ path: relative, source: url, bytes: bytes.length, md5, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  const gltfBytes = await fetchBytes(format.gltf.url);
  const gltfMd5 = createHash('md5').update(gltfBytes).digest('hex');
  if (gltfMd5 !== format.gltf.md5) throw new Error(`${id}: glTF checksum mismatch`);
  await writeFile(path.join(directory, path.basename(format.gltf.url)), gltfBytes);
  const gltf = JSON.parse(gltfBytes.toString('utf8'));
  downloaded.push({ path: path.basename(format.gltf.url), source: format.gltf.url, bytes: gltfBytes.length, md5: gltfMd5, sha256: createHash('sha256').update(gltfBytes).digest('hex') });

  const author = Object.keys(record.authors ?? {}).join(', ') || 'Poly Haven contributor';
  const manifest = {
    name: record.name,
    source: `https://polyhaven.com/a/${id}`,
    creator: author,
    license: 'CC0 1.0 Universal',
    licenseUrl: 'https://polyhaven.com/license',
    attributionRequired: false,
    format: 'glTF 2.0, Poly Haven 1K textures',
    dimensions: record.dimensions,
    dimensionsUnit: 'Not stated in the Poly Haven API response; raw values preserved.',
    coordinateSystem: 'Source glTF coordinates; runtime normalizes height and centers the model at floor level.',
    polycount: record.polycount,
    meshNames: (gltf.meshes ?? []).map((mesh) => mesh.name ?? '(unnamed mesh)'),
    animationClips: (gltf.animations ?? []).map((animation) => animation.name ?? '(unnamed animation)'),
    modifications: ['No mesh or material edits; source 1K glTF and textures are retained.'],
    lodVariants: ['1K textures; no additional LOD variant bundled.'],
    downloadedDate: new Date().toISOString().slice(0, 10),
    categories: record.categories,
    localMainFile: path.basename(format.gltf.url),
    files: downloaded,
    educationalRole: ({
      binoculars: 'Accurate hand-held optical instrument for Discovery: “দূরবীন”.',
      classic_laptop: 'Computer example for Discovery and a device example for Social screen-time learning.',
      CashRegister_01: 'Point-of-sale example to support how a market transaction works.',
      gamepad: 'Game controller example for online game purchase safety.',
      calathea_orbifolia_01: 'Real plant specimen illustrating a producer in an ecosystem.',
      sweet_potato: 'Real edible root example for the generic vegetables vocabulary tile.',
      food_apple_01: 'Real apple fruit example for generic fruit vocabulary and food groups.',
      food_kiwi_01: 'Real kiwi fruit example in generic fruit vocabulary.',
      food_pomegranate_01: 'Real pomegranate example in generic fruit vocabulary.',
      food_pears_asian_01: 'Real Asian pear example in generic fruit vocabulary.',
      yellow_onion: 'Real onion example for vegetable vocabulary and ingredients.',
      croissant: 'Baked pastry example for food-shape vocabulary; not presented as a Bangladeshi dish.',
      anthurium_botany_01: 'Botanical Anthurium specimen used only for the generic flower/plant-part concept.',
      fern_02: 'Fern specimen used to illustrate a plant and its visible fronds.',
      SchoolChair_01: 'School chair model for classroom and furniture concepts.',
      SchoolDesk_01: 'School desk model for classroom and furniture concepts.',
      binder_notebook: 'Bound notebook model for writing and paper vocabulary.',
      measuring_tape_01: 'Measuring tape instrument for length measurement.',
      magnifying_glass_01: 'Magnifying glass model for observation and investigation.',
      Camera_01: 'Camera model for image-making and media literacy concepts.',
      gaming_console: 'Gaming console model for digital entertainment and device comparisons.',
      potted_plant_01: 'Complete potted tropical plant used as an intact example of a photosynthetic producer.',
      pot_enamel_01: 'Real enamel cooking pot used for boiling and boiled-food examples; the model itself does not imply that food is currently boiling.',
      brass_pan_01: 'Real brass frying pan used as the cooking vessel in the frying example; the model itself does not depict a finished dish.',
      medical_box: 'Real first-aid box used only for the medicine-and-chemical safety item, as a visual cue for controlled storage rather than a claim about its contents.',
      long_life_food: 'Real packaged pantry foods used to make package-date reading concrete; the model labels should not be treated as legible date examples.',
      lemon: 'Real lemon used as the physical fruit in the lemon-battery demonstration; electrodes and circuit remain instructional additions.',
      chemistry_set: 'A real chemistry experiment set used to make the “experiment” step concrete; it is not a substitute for child-safe supervision or lab protocol.',
      digital_wrist_watch: 'A digital wristwatch used as a real-world example of a clock for time measurement; it does not model a stopwatch or analog dial.',
      food_lime_01: 'A real lime used as a vitamin-C-rich fruit example; it is not presented as a specific Bangladeshi lemon cultivar.',
    })[id],
  };
  await writeFile(path.join(directory, 'asset-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(directory, 'README.md'), `# ${record.name}\n\n- Source: [Poly Haven — ${record.name}](https://polyhaven.com/a/${id})\n- Creator: ${author}\n- License: CC0 1.0 Universal ([terms](https://polyhaven.com/license)); attribution is not required.\n- Format: glTF 2.0, 1K textures. File hashes and dimensions are recorded in [asset-manifest.json](asset-manifest.json).\n- Educational use: ${manifest.educationalRole}\n`);
  console.log(`${id}: ${downloaded.length} files, ${downloaded.reduce((sum, file) => sum + file.bytes, 0)} bytes`);
}
