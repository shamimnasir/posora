import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/models/realistic_red_fox_01');
const sourcePage = 'https://1designtool.com/3d/models/red-fox';
const licensePage = 'https://1designtool.com/3d/license';
const sourceFile = 'https://assets.stoicsoft.com/1designtool/3d/models/red-fox/ef36760168/model.glb';
const chameleonRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/models/realistic_panther_chameleon_01');
const chameleonPage = 'https://1designtool.com/3d/models/panther-chameleon';
const chameleonSource = 'https://assets.stoicsoft.com/1designtool/3d/models/panther-chameleon/6f71d2b7df/model.glb';

const response = await fetch(sourceFile, { signal: AbortSignal.timeout(90000) });
if (!response.ok) throw new Error(`${response.status} downloading ${sourceFile}`);
const original = Buffer.from(await response.arrayBuffer());
const originalHash = createHash('sha256').update(original).digest('hex');
const directory = await mkdtemp(path.join(tmpdir(), 'posora-red-fox-'));
await mkdir(root, { recursive: true });

try {
  const sourcePath = path.join(directory, 'red-fox-source.glb');
  const resizedPath = path.join(directory, 'red-fox-resized.glb');
  const webpPath = path.join(directory, 'red-fox-webp.glb');
  const quantizedPath = path.join(directory, 'red-fox-quantized.glb');
  const outputPath = path.join(root, 'red-fox.glb');
  await writeFile(sourcePath, original);
  const cli = ['exec', '--yes', '--package=@gltf-transform/cli@4.5.1', '--', 'gltf-transform'];
  execFileSync('npm', [...cli, 'resize', sourcePath, resizedPath, '--width', '512', '--height', '512'], { stdio: 'inherit' });
  execFileSync('npm', [...cli, 'webp', resizedPath, webpPath, '--quality', '82', '--effort', '5'], { stdio: 'inherit' });
  execFileSync('npm', [...cli, 'quantize', webpPath, quantizedPath], { stdio: 'inherit' });
  const optimized = await readFile(quantizedPath);
  await writeFile(outputPath, optimized);

  const licenseEvidence = `# Source and license evidence — Red Fox\n\n- Model page: ${sourcePage}\n- Direct source file: ${sourceFile}\n- License terms: ${licensePage}\n- Checked: ${new Date().toISOString().slice(0, 10)}\n\nThe source's license permits personal and commercial work, including games, apps, and websites; modification and shipping inside a product are permitted. It prohibits re-selling or re-publishing the model file as a standalone model, pack, kit, or library. Attribution is not required. Posora uses this asset only as a model inside its interactive learning website, not in the paid printable pack or as a standalone downloadable model.\n\nThe source page identifies this as a realistic adult red fox (*Vulpes vulpes*). It is only a representative mammal specimen in the broad animal-class lesson and is not presented as a native Bangladeshi species.\n`;
  await writeFile(path.join(root, 'SOURCE-LICENSE.md'), licenseEvidence);
  const manifest = {
    name: 'Red Fox',
    source: sourcePage,
    directSource: sourceFile,
    license: '1DesignTool 3D Library License — commercial use in websites permitted; no attribution required; standalone file/model-pack redistribution prohibited.',
    licenseUrl: licensePage,
    licenseEvidence: 'SOURCE-LICENSE.md records the relevant site-published terms and intended scope of use.',
    format: 'glTF 2.0 GLB',
    localMainFile: 'red-fox.glb',
    downloadedDate: new Date().toISOString().slice(0, 10),
    original: { bytes: original.length, sha256: originalHash },
    files: [{ path: 'red-fox.glb', bytes: optimized.length, sha256: createHash('sha256').update(optimized).digest('hex') }],
    geometry: { triangles: 116808, vertices: 98586, meshes: 14, materials: 7 },
    educationalRole: 'Detailed red-fox example for the broad mammal-class lesson only; not a local-fauna claim.',
    modifications: ['Textures resized to a 512 px maximum and encoded as WebP at quality 82.', 'Geometry quantized using standard KHR_mesh_quantization; named mesh nodes retained, with no WASM-based compression.'],
    limitations: ['Static; it has no authored animation.', 'The fur uses texture and hair cards, not individual simulated strands.'],
  };
  await writeFile(path.join(root, 'asset-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(root, 'README.md'), `# Red Fox\n\n- Model: [Red Fox — 1DesignTool](${sourcePage})\n- License: [1DesignTool 3D library license](${licensePage})\n- Commercial use is allowed inside websites; the GLB is not offered as a standalone Posora download.\n- Role: broad mammal-class example; not a Bangladeshi species.\n- Local file: \`red-fox.glb\` (optimized derivative).\n- Source/model hashes and modification notes: [asset-manifest.json](asset-manifest.json).\n- Terms record: [SOURCE-LICENSE.md](SOURCE-LICENSE.md).\n`);
  console.log(`Red Fox: ${optimized.length} bytes, sha256 ${manifest.files[0].sha256}; source ${original.length} bytes, sha256 ${originalHash}`);
} finally {
  await rm(directory, { recursive: true, force: true });
}

const chameleonResponse = await fetch(chameleonSource, { signal: AbortSignal.timeout(90000) });
if (!chameleonResponse.ok) throw new Error(`${chameleonResponse.status} downloading ${chameleonSource}`);
const chameleonOriginal = Buffer.from(await chameleonResponse.arrayBuffer());
const chameleonOriginalHash = createHash('sha256').update(chameleonOriginal).digest('hex');
const chameleonDirectory = await mkdtemp(path.join(tmpdir(), 'posora-panther-chameleon-'));
await mkdir(chameleonRoot, { recursive: true });
try {
  const sourcePath = path.join(chameleonDirectory, 'panther-chameleon-source.glb');
  const resizedPath = path.join(chameleonDirectory, 'panther-chameleon-resized.glb');
  const webpPath = path.join(chameleonDirectory, 'panther-chameleon-webp.glb');
  const quantizedPath = path.join(chameleonDirectory, 'panther-chameleon-quantized.glb');
  const outputPath = path.join(chameleonRoot, 'panther-chameleon.glb');
  await writeFile(sourcePath, chameleonOriginal);
  const cli = ['exec', '--yes', '--package=@gltf-transform/cli@4.5.1', '--', 'gltf-transform'];
  execFileSync('npm', [...cli, 'resize', sourcePath, resizedPath, '--width', '512', '--height', '512'], { stdio: 'inherit' });
  execFileSync('npm', [...cli, 'webp', resizedPath, webpPath, '--quality', '82', '--effort', '5'], { stdio: 'inherit' });
  execFileSync('npm', [...cli, 'quantize', webpPath, quantizedPath], { stdio: 'inherit' });
  const optimized = await readFile(quantizedPath);
  await writeFile(outputPath, optimized);
  const licenseEvidence = `# Source and license evidence — Panther Chameleon\n\n- Model page: ${chameleonPage}\n- Direct source file: ${chameleonSource}\n- License terms: ${licensePage}\n- Checked: ${new Date().toISOString().slice(0, 10)}\n\nThe source license permits personal and commercial use in websites and permits shipping an asset inside a product; it prohibits standalone model or model-pack redistribution. Posora uses the model only inside its interactive learning site. The source requires no attribution; Posora links the model page for transparency.\n\nThe model page identifies this specimen as an adult male panther chameleon (*Furcifer pardalis*), built with the 1DesignTool 3D template. It is used only to illustrate the broad reptile class, not as a Bangladeshi species. The source says the pose is static and procedural with PBR textures; the published “realistic” style is not photogrammetry.\n`;
  await writeFile(path.join(chameleonRoot, 'SOURCE-LICENSE.md'), licenseEvidence);
  const manifest = {
    name: 'Panther Chameleon',
    species: 'Furcifer pardalis',
    source: chameleonPage,
    directSource: chameleonSource,
    license: '1DesignTool 3D Library License — commercial use in websites permitted; no attribution required; standalone file/model-pack redistribution prohibited.',
    licenseUrl: licensePage,
    format: 'glTF 2.0 GLB',
    localMainFile: 'panther-chameleon.glb',
    downloadedDate: new Date().toISOString().slice(0, 10),
    original: { bytes: chameleonOriginal.length, sha256: chameleonOriginalHash },
    files: [{ path: 'panther-chameleon.glb', bytes: optimized.length, sha256: createHash('sha256').update(optimized).digest('hex') }],
    geometry: { triangles: 115669, vertices: 61330, meshes: 17, materials: 5 },
    educationalRole: 'A named non-Bangladeshi reptile specimen for the broad reptile-class lesson only.',
    modifications: ['Textures resized to a 512 px maximum and encoded as WebP at quality 82.', 'Geometry quantized with standard KHR_mesh_quantization; no WASM-based compression.'],
    limitations: ['Static; it has no authored animation.', 'The source describes the model as code-built with PBR textures, not a photogrammetry scan.', 'It must not be presented as a Bangladeshi animal or offered as a standalone download.'],
  };
  await writeFile(path.join(chameleonRoot, 'asset-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(chameleonRoot, 'README.md'), `# Panther Chameleon\n\n- Model: [Panther Chameleon — 1DesignTool](${chameleonPage})\n- License: [1DesignTool 3D library license](${licensePage})\n- Commercial website use is allowed; standalone model redistribution is prohibited.\n- Role: broad reptile-class example only; this species is not Bangladeshi.\n- Local optimized file: \`panther-chameleon.glb\`.\n- Source and modifications: [asset-manifest.json](asset-manifest.json).\n`);
  console.log(`Panther chameleon: ${optimized.length} bytes, sha256 ${manifest.files[0].sha256}; source ${chameleonOriginal.length} bytes, sha256 ${chameleonOriginalHash}`);
} finally {
  await rm(chameleonDirectory, { recursive: true, force: true });
}
