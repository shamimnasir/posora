import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const modelRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/models');
const licenseUrl = 'https://1designtool.com/3d/license';
const models = [
  {
    folder: 'realistic_indian_peafowl_01', file: 'indian-peafowl.glb', name: 'Indian Peafowl', species: 'Pavo cristatus',
    page: 'https://1designtool.com/3d/models/indian-peacock',
    direct: 'https://assets.stoicsoft.com/1designtool/3d/models/indian-peacock/e915b6ef69/model.glb',
    triangles: 97796, vertices: 84637, meshes: 21, materials: 12,
    role: 'A clearly named male Indian peafowl example for the general bird-class lesson only; not a Bangladesh-fauna claim.',
    limits: ['Static; no authored animation.', 'The model is code-built and described by its source as realistic, not photogrammetry.', 'The creator notes that the display train may crop at 390 px portrait width; keep its mobile presentation contained.', 'Do not present it as a Bangladesh native-fauna example or redistribute the GLB as a standalone file.'],
  },
  {
    folder: 'realistic_axolotl_01', file: 'axolotl.glb', name: 'Axolotl', species: 'Ambystoma mexicanum',
    page: 'https://1designtool.com/3d/models/axolotl',
    direct: 'https://assets.stoicsoft.com/1designtool/3d/models/axolotl/7843338603/model.glb',
    triangles: 107718, vertices: 61100, meshes: 11, materials: 4,
    role: 'A clearly named axolotl example for the general amphibian-class lesson only; not a Bangladesh-fauna claim.',
    limits: ['Static; no authored animation.', 'The model is code-built and described by its source as realistic, not photogrammetry.', 'External gills, feet and fins are separate overlapping meshes; the source notes close-up seams and a flat translucent fin.', 'Do not present it as a Bangladesh native-fauna example or redistribute the GLB as a standalone file.'],
  },
];

async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(90000) });
  if (!response.ok) throw new Error(`${response.status} downloading ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

for (const model of models) {
  const root = path.join(modelRoot, model.folder);
  const original = await download(model.direct);
  const originalSha = createHash('sha256').update(original).digest('hex');
  const work = await mkdtemp(path.join(tmpdir(), `posora-${model.folder}-`));
  await mkdir(root, { recursive: true });
  try {
    const source = path.join(work, 'source.glb');
    const resized = path.join(work, 'resized.glb');
    const webp = path.join(work, 'webp.glb');
    const quantized = path.join(work, 'quantized.glb');
    const output = path.join(root, model.file);
    await writeFile(source, original);
    const cli = ['exec', '--yes', '--package=@gltf-transform/cli@4.5.1', '--', 'gltf-transform'];
    execFileSync('npm', [...cli, 'resize', source, resized, '--width', '512', '--height', '512'], { stdio: 'inherit' });
    execFileSync('npm', [...cli, 'webp', resized, webp, '--quality', '82', '--effort', '5'], { stdio: 'inherit' });
    execFileSync('npm', [...cli, 'quantize', webp, quantized], { stdio: 'inherit' });
    const optimized = await readFile(quantized);
    await writeFile(output, optimized);
    const manifest = {
      name: model.name, species: model.species, source: model.page, directSource: model.direct,
      license: '1DesignTool 3D Library License — commercial website use and in-product embedding permitted; standalone file/model-pack redistribution prohibited.',
      licenseUrl, format: 'glTF 2.0 GLB', localMainFile: model.file,
      downloadedDate: new Date().toISOString().slice(0, 10),
      original: { bytes: original.length, sha256: originalSha },
      files: [{ path: model.file, bytes: optimized.length, sha256: createHash('sha256').update(optimized).digest('hex') }],
      geometry: { triangles: model.triangles, vertices: model.vertices, meshes: model.meshes, materials: model.materials },
      educationalRole: model.role,
      modifications: ['Textures resized to a 512 px maximum and encoded as WebP at quality 82.', 'Geometry quantized using standard KHR_mesh_quantization; no WASM-based compression.'],
      limitations: model.limits,
    };
    await writeFile(path.join(root, 'asset-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    await writeFile(path.join(root, 'SOURCE-LICENSE.md'), `# Source and license evidence — ${model.name}\n\n- Model page: ${model.page}\n- Direct source file: ${model.direct}\n- License: ${licenseUrl}\n- Checked: ${manifest.downloadedDate}\n\nThe source-published license permits commercial use in websites, modification, and shipping a model embedded in a product. It prohibits re-selling or redistributing the model file on its own or as a model pack. Posora uses it only inside the interactive learning site. Attribution is not required; a visible link is supplied for transparency.\n\nThe source identifies this model as ${model.name} (*${model.species}*) and says it is code-built by its 3D template, not photogrammetry. It is used only for a broad animal-class concept and not as a Bangladesh fauna claim.\n`);
    await writeFile(path.join(root, 'README.md'), `# ${model.name}\n\n- Model: [${model.name} — 1DesignTool](${model.page})\n- License: [1DesignTool 3D library license](${licenseUrl})\n- Commercial website use and embedded product use are allowed; standalone model redistribution is prohibited.\n- Role: ${model.role}\n- Local optimized file: \`${model.file}\`.\n- Source, hashes, geometry, and limitations: [asset-manifest.json](asset-manifest.json).\n`);
    console.log(`${model.name}: ${optimized.length} bytes, SHA-256 ${manifest.files[0].sha256}; source ${original.length} bytes, SHA-256 ${originalSha}`);
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}
