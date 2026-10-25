import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshPhysicalMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Posora-original botanical teaching models. Morphology is intentionally
// species/item-specific; these are field-guide illustrations, not scans.
const OUTPUT = path.resolve('public/models');
const CREATED = '2026-10-21';
class NodeFileReader { result = null; onloadend = null; onerror = null; async readAsArrayBuffer(blob) { try { this.result = await blob.arrayBuffer(); this.onloadend?.({ target: this }); } catch (e) { this.onerror?.(e); } } async readAsDataURL(blob) { try { const b = Buffer.from(await blob.arrayBuffer()); this.result = `data:${blob.type || 'application/octet-stream'};base64,${b.toString('base64')}`; this.onloadend?.({ target: this }); } catch (e) { this.onerror?.(e); } } }
globalThis.FileReader ??= NodeFileReader;

const material = (name, color, roughness = 0.82, clearcoat = 0.02) => { const m = new MeshPhysicalMaterial({ name, color: new Color(color), roughness, metalness: 0, clearcoat, clearcoatRoughness: 0.75 }); m.side = DoubleSide; return m; };
const bark = material('fissured grey-brown bark', '#5a4b3c', 0.96);
const paleBark = material('pale wetland bark', '#776b5c', 0.92);
const palmBark = material('ringed palm trunk', '#756044', 0.94);
const green = material('mature green leaf', '#356c3d', 0.82, 0.04);
const lightGreen = material('young green leaf', '#5b8d48', 0.78, 0.05);
const silverGreen = material('silvery mangrove leaf underside', '#718a68', 0.84);
const juteStem = material('jute stem', '#71904c', 0.88);
const flowerCream = material('cream flower', '#e3d59a', 0.69, 0.08);
const flowerPink = material('pink-white wetland flower', '#d9a4af', 0.66, 0.1);
const podGreen = material('green cardamom pod', '#7c8a49', 0.82);
const fruitBlack = material('ripe palm fruit', '#42352a', 0.66, 0.08);
const soil = material('dark ground', '#4e4639', 0.98);

function seeded(seed) { let s = seed >>> 0; return (min = 0, max = 1) => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return min + (s / 0x100000000) * (max - min); }; }
function mesh(geometry, mat, name, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) { const m = new Mesh(geometry, mat); m.name = name; m.position.set(...position); m.rotation.set(...rotation); m.scale.set(...scale); return m; }
function limb(a, b, ra, rb, mat, name) { const start = new Vector3(...a), end = new Vector3(...b), delta = end.clone().sub(start), length = delta.length(); const m = mesh(new CylinderGeometry(rb, ra, length, 10), mat, name); m.position.copy(start.clone().add(end).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), delta.normalize()); return m; }
function polygonLeaf(length = 0.42, width = 0.16, style = 'elliptic') {
  const positions = [], indices = []; const segments = 8;
  for (let i = 0; i <= segments; i += 1) { const u = i / segments; const z = (u - 0.5) * length; let w = Math.sin(Math.PI * u) * width; if (style === 'heart') w *= 0.72 + 0.5 * Math.sin(Math.PI * u); if (style === 'serrate') w *= 0.96 + 0.05 * Math.cos(u * Math.PI * 16); positions.push(-w, 0, z, w, 0, z); }
  for (let i = 0; i < segments; i += 1) { const a = i * 2, b = a + 2; indices.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(positions, 3)); g.setIndex(indices); g.computeVertexNormals(); return g;
}
function leaf(parent, position, rotation, scale, mat = green, style = 'elliptic', name = 'leaf') { parent.add(mesh(polygonLeaf(0.42, 0.16, style), mat, name, position, rotation, scale)); }
function canopyTree({ name, seed, trunkHeight = 2.4, crownRadius = 1.2, buttress = false, flower = null, leafStyle = 'elliptic' }) {
  const root = new Group(); root.name = name; const random = seeded(seed);
  root.add(mesh(new CylinderGeometry(0.18, buttress ? 0.34 : 0.26, trunkHeight, 14), buttress ? paleBark : bark, 'main-trunk', [0, trunkHeight / 2, 0]));
  if (buttress) for (let i = 0; i < 6; i += 1) { const a = i / 6 * Math.PI * 2; root.add(mesh(new ConeGeometry(0.36, 1.0, 4), paleBark, `plank-buttress-${i + 1}`, [Math.cos(a) * 0.28, 0.45, Math.sin(a) * 0.28], [0, -a, Math.PI / 2], [0.5, 1.0, 0.18])); }
  for (let b = 0; b < 9; b += 1) { const angle = b / 9 * Math.PI * 2 + random(-0.2, 0.2), startY = random(trunkHeight * 0.55, trunkHeight * 0.82), end = [Math.cos(angle) * random(0.72, crownRadius), random(trunkHeight * 0.82, trunkHeight * 1.12), Math.sin(angle) * random(0.72, crownRadius)]; root.add(limb([0, startY, 0], end, 0.11, 0.045, buttress ? paleBark : bark, `branch-${b + 1}`));
    // Broad leaves need a steep pitch rather than lying as nearly horizontal
    // cards. The varied tilt exposes their silhouettes to the lesson camera
    // while preserving the layered crown visible from above.
    for (let j = 0; j < 13; j += 1) { const p = random(0.42, 1), spread = random(-0.38, 0.38), x = end[0] * p + Math.cos(angle + Math.PI / 2) * spread, y = startY + (end[1] - startY) * p + random(-0.18, 0.28), z = end[2] * p + Math.sin(angle + Math.PI / 2) * spread; leaf(root, [x, y, z], [random(-1.14, -0.48), angle + random(-0.8, 0.8), random(-0.5, 0.5)], [random(1.02, 1.48), 1, random(0.92, 1.32)], j % 4 === 0 && buttress ? silverGreen : (j % 5 === 0 ? lightGreen : green), leafStyle, `leaf-${b + 1}-${j + 1}`); }
  }
  if (flower) for (let i = 0; i < flower.count; i += 1) { const a = random(0, Math.PI * 2), r = random(crownRadius * 0.35, crownRadius), y = random(trunkHeight * 0.82, trunkHeight * 1.14); root.add(mesh(new IcosahedronGeometry(flower.radius, 2), flower.material, `flower-${i + 1}`, [Math.cos(a) * r, y, Math.sin(a) * r])); }
  return root;
}
function talPalm() { const root = new Group(); root.name = 'tal-palmyra-palm'; const h = 2.85; root.add(mesh(new CylinderGeometry(0.18, 0.28, h, 18), palmBark, 'ringed-trunk', [0, h / 2, 0])); for (let r = 0; r < 16; r += 1) root.add(mesh(new CylinderGeometry(0.285, 0.29, 0.022, 18), bark, `trunk-ring-${r + 1}`, [0, 0.25 + r * 0.16, 0]));
  for (let i = 0; i < 18; i += 1) { const angle = i / 18 * Math.PI * 2; const holder = new Group(); holder.name = `fan-frond-${i + 1}`; holder.position.set(Math.cos(angle) * 0.1, h + (i % 2) * 0.08, Math.sin(angle) * 0.1); holder.rotation.set(-0.35 + (i % 3) * 0.14, angle, 0); holder.add(limb([0, 0, 0], [0, 0, 0.78], 0.025, 0.014, lightGreen, 'petiole'));
    for (let f = -5; f <= 5; f += 1) { const theta = f * 0.12; holder.add(mesh(new ConeGeometry(0.09, 0.78, 3), f % 3 ? green : lightGreen, `fan-segment-${f + 6}`, [Math.sin(theta) * 0.28, 0, 0.95 - Math.abs(f) * 0.025], [Math.PI / 2, 0, -theta], [1, 1, 0.18])); } root.add(holder); }
  for (let i = 0; i < 12; i += 1) { const a = i / 12 * Math.PI * 2; root.add(mesh(new SphereGeometry(0.13, 12, 9), fruitBlack, `tal-fruit-${i + 1}`, [Math.cos(a) * 0.25, h - 0.28 - (i % 3) * 0.08, Math.sin(a) * 0.25], [0, 0, 0], [1, 1.15, 1])); } return root; }
function sundari() { return canopyTree({ name: 'sundari-mangrove-herdiera-fomes', seed: 0x51da, trunkHeight: 2.35, crownRadius: 1.15, buttress: true }); }
function golpata() { const root = new Group(); root.name = 'golpata-nypa-palm'; const random = seeded(0x90fa); root.add(mesh(new CylinderGeometry(0.7, 0.82, 0.12, 32), soil, 'mud-base', [0, 0.04, 0], [0, 0, 0], [1.2, 1, 0.85]));
  for (let i = 0; i < 18; i += 1) { const angle = i / 18 * Math.PI * 2 + random(-0.12, 0.12), holder = new Group(); holder.name = `nipa-frond-${i + 1}`; holder.position.set(Math.cos(angle) * 0.2, 0.08, Math.sin(angle) * 0.2); holder.rotation.y = angle; holder.rotation.x = random(-0.28, -0.05); holder.add(limb([0, 0, 0], [0, 1.2, 0.9], 0.04, 0.018, lightGreen, 'frond-rachis'));
    for (let p = 1; p <= 9; p += 1) { const y = p * 0.115, z = p * 0.085; leaf(holder, [-0.16 - p * 0.018, y, z], [-0.1, 0.25, -0.2], [0.75 + p * 0.03, 1, 0.65], green, 'elliptic', `left-pinna-${p}`); leaf(holder, [0.16 + p * 0.018, y, z], [-0.1, -0.25, 0.2], [0.75 + p * 0.03, 1, 0.65], green, 'elliptic', `right-pinna-${p}`); } root.add(holder); }
  for (let i = 0; i < 18; i += 1) { const a = i / 18 * Math.PI * 2; root.add(mesh(new ConeGeometry(0.09, 0.34, 6), fruitBlack, `nipa-fruit-${i + 1}`, [Math.cos(a) * 0.25, 0.42 + (i % 2) * 0.04, Math.sin(a) * 0.25], [Math.PI, a, 0])); } return root; }
function jute() { const root = new Group(); root.name = 'jute-corchorus-stand'; const random = seeded(0x3a7e); for (let s = 0; s < 12; s += 1) { const x = random(-0.55, 0.55), z = random(-0.4, 0.4), h = random(2.1, 2.8); root.add(mesh(new CylinderGeometry(0.018, 0.032, h, 8), juteStem, `jute-stem-${s + 1}`, [x, h / 2, z])); for (let i = 2; i < 12; i += 1) { const a = i * 2.3 + s, y = i / 12 * h; leaf(root, [x + Math.cos(a) * 0.13, y, z + Math.sin(a) * 0.13], [0.15, a, 0.25], [0.9, 1, 0.55], i % 4 ? green : lightGreen, 'serrate', `jute-leaf-${s + 1}-${i}`); } } return root; }
function kadam() { return canopyTree({ name: 'kadam-neolamarckia-cadamba', seed: 0xcada, trunkHeight: 2.25, crownRadius: 1.18, leafStyle: 'heart', flower: { count: 18, radius: 0.105, material: flowerCream } }); }
function hijal() { const root = canopyTree({ name: 'hijal-barringtonia-acutangula', seed: 0x417a, trunkHeight: 2.15, crownRadius: 1.1, leafStyle: 'elliptic' }); const random = seeded(0x417b); for (let i = 0; i < 22; i += 1) { const a = random(0, Math.PI * 2), r = random(0.35, 1.0), y = random(1.55, 2.45); root.add(limb([Math.cos(a) * r, y, Math.sin(a) * r], [Math.cos(a) * r, y - random(0.22, 0.5), Math.sin(a) * r], 0.012, 0.006, flowerPink, `flower-stamen-${i + 1}`)); root.add(mesh(new SphereGeometry(0.04, 10, 8), flowerPink, `hijal-flower-${i + 1}`, [Math.cos(a) * r, y - random(0.22, 0.5), Math.sin(a) * r])); } return root; }
function cardamom() { const root = new Group(); root.name = 'green-cardamom-plant'; const random = seeded(0xca2d); for (let s = 0; s < 14; s += 1) { const a = s / 14 * Math.PI * 2, r = random(0.02, 0.38), h = random(1.45, 2.05), x = Math.cos(a) * r, z = Math.sin(a) * r; root.add(mesh(new CylinderGeometry(0.018, 0.026, h, 8), juteStem, `leafy-shoot-${s + 1}`, [x, h / 2, z])); for (let i = 2; i < 9; i += 1) { const y = i / 9 * h, side = i % 2 ? 1 : -1; leaf(root, [x + side * 0.18, y, z], [-0.82 + random(-0.18, 0.18), a + (side > 0 ? 0.5 : -0.5), side * random(0.12, 0.34)], [1.72, 1, 0.86], i > 7 ? lightGreen : green, 'elliptic', `cardamom-leaf-${s + 1}-${i}`); } }
  for (let i = 0; i < 18; i += 1) { const a = random(0, Math.PI * 2), r = random(0.18, 0.55); root.add(mesh(new SphereGeometry(0.07, 10, 8), podGreen, `cardamom-pod-${i + 1}`, [Math.cos(a) * r, random(0.12, 0.42), Math.sin(a) * r], [random(0, 1), random(0, 1), random(0, 1)], [0.75, 1.3, 0.75])); } return root; }
function thanakuni() { const root = new Group(); root.name = 'thanakuni-centella-asiatica'; const random = seeded(0x7a90); root.add(mesh(new CylinderGeometry(0.85, 0.92, 0.08, 40), soil, 'soil-patch', [0, 0.02, 0], [0, 0, 0], [1.2, 1, 0.9])); for (let i = 0; i < 38; i += 1) { const a = random(0, Math.PI * 2), r = random(0.08, 0.86), x = Math.cos(a) * r, z = Math.sin(a) * r, h = random(0.16, 0.48); root.add(limb([x, 0.06, z], [x, h, z], 0.012, 0.007, lightGreen, `petiole-${i + 1}`)); leaf(root, [x, h, z], [-Math.PI / 2 + random(-0.18, 0.18), a, 0], [random(0.6, 1.15), 1, random(0.65, 1.0)], i % 5 === 0 ? lightGreen : green, 'heart', `kidney-leaf-${i + 1}`); if (i % 4 === 0) root.add(limb([x, 0.07, z], [x * 0.72, 0.07, z * 0.72], 0.009, 0.006, lightGreen, `creeping-stolon-${i + 1}`)); } return root; }

const assets = [
  ['posora_tal_palm_01', 'tal-palmyra-palm.glb', 'Tal / Palmyra palm', 'Borassus flabellifer teaching illustration', 'talPalm', talPalm],
  ['posora_sundari_01', 'sundari-mangrove.glb', 'Sundari mangrove', 'Heritiera fomes teaching illustration with plank buttresses', 'sundari', sundari],
  ['posora_golpata_01', 'golpata-nypa-palm.glb', 'Golpata / Nipa palm', 'Nypa fruticans teaching illustration with stemless fronds and fruit head', 'golpata', golpata],
  ['posora_jute_01', 'jute-stand.glb', 'Jute stand', 'Corchorus crop teaching illustration', 'jute', jute],
  ['posora_kadam_01', 'kadam-tree.glb', 'Kadam tree', 'Neolamarckia cadamba teaching illustration with ball flowers', 'kodom', kadam],
  ['posora_hijal_01', 'hijal-tree.glb', 'Hijal tree', 'Barringtonia acutangula teaching illustration with pendent flowers', 'hijol', hijal],
  ['posora_cardamom_plant_01', 'cardamom-plant.glb', 'Green cardamom plant', 'Elettaria cardamomum leafy clump and basal fruit teaching illustration', 'cardamomPlant', cardamom],
  ['posora_thanakuni_01', 'thanakuni-creeper.glb', 'Thankuni creeper', 'Centella asiatica teaching illustration with creeping stolons and kidney-shaped leaves', 'thanakuni', thanakuni],
];
async function exportBinary(scene) { const exporter = new GLTFExporter(); return await new Promise((resolve, reject) => exporter.parse(scene, resolve, reject, { binary: true, onlyVisible: true })); }
for (const [directory, filename, name, subject, figure, build] of assets) { const out = path.join(OUTPUT, directory); await mkdir(out, { recursive: true }); const bytes = Buffer.from(await exportBinary(build())); await writeFile(path.join(out, filename), bytes); const manifest = { name, subject, creator: 'Posora.com', license: 'CC0 1.0 Universal', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/', source: 'Original deterministic Three.js geometry authored for Posora using species morphology references; not a scan or marketplace model.', localMainFile: filename, format: 'glTF 2.0 GLB', createdDate: CREATED, files: [{ path: filename, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }], educationalRole: `Exact named-item teaching illustration for Life → ${figure}.`, limitations: ['Original field-guide style PBR illustration, not photogrammetry or a herbarium specimen.', 'Individuals vary by age, season, habitat, health and cultivar.', 'Use the visible lesson copy and source references for facts; do not infer scale from this model.'] }; await writeFile(path.join(out, 'asset-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`); await writeFile(path.join(out, 'SOURCE-LICENSE.md'), `# ${name}\n\n- Creator/source: Posora.com original asset\n- Source record: https://posora.com/life/\n- License: CC0 1.0 Universal — https://creativecommons.org/publicdomain/zero/1.0/\n- Created: ${CREATED}\n\nOriginal morphology-focused teaching illustration; not a specimen scan.\n`); await writeFile(path.join(out, 'README.md'), `# ${name}\n\nSee \`asset-manifest.json\` and \`SOURCE-LICENSE.md\`. Source page: https://posora.com/life/.\n`); console.log(`${directory}/${filename}: ${bytes.length} bytes`); }
