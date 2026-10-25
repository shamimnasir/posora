import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  BoxGeometry,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector2,
} from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Original, deterministic, dish-specific PBR assets released by Posora under
// CC0. They are illustrative servings rather than recipe standards or scans.
const OUTPUT = path.resolve('public/models');
const CREATED = '2026-10-21';

class NodeFileReader {
  result = null; onloadend = null; onerror = null;
  async readAsArrayBuffer(blob) { try { this.result = await blob.arrayBuffer(); this.onloadend?.({ target: this }); } catch (error) { this.onerror?.(error); } }
  async readAsDataURL(blob) { try { const bytes = Buffer.from(await blob.arrayBuffer()); this.result = `data:${blob.type || 'application/octet-stream'};base64,${bytes.toString('base64')}`; this.onloadend?.({ target: this }); } catch (error) { this.onerror?.(error); } }
}
globalThis.FileReader ??= NodeFileReader;

const mat = (name, color, roughness = 0.72, clearcoat = 0.03) => {
  const value = new MeshPhysicalMaterial({ name, color: new Color(color), roughness, metalness: 0, clearcoat, clearcoatRoughness: 0.7 });
  value.side = DoubleSide; return value;
};
const ceramic = mat('dark teal glazed ceramic', '#36575a', 0.34, 0.18);
const ceramicLight = mat('warm ceramic plate', '#d3c3a2', 0.43, 0.12);
const riceMat = mat('cooked rice', '#eee6cf', 0.84);
const dalMat = mat('yellow lentil soup', '#c79128', 0.58, 0.08);
const potatoMat = mat('mashed potato', '#c8ad62', 0.88);
const aubergineMat = mat('roasted aubergine mash', '#76563f', 0.9);
const khichuriMat = mat('turmeric rice and lentil', '#c49a36', 0.83);
const milkMat = mat('thickened milk', '#e8d7b7', 0.48, 0.12);
const haleemMat = mat('slow-cooked haleem', '#8b5a32', 0.86);
const waterMat = mat('rice soaking water', '#b8d5cb', 0.2, 0.34); waterMat.transparent = true; waterMat.opacity = 0.78;
const jaggeryMat = mat('date jaggery filling', '#7b3f24', 0.76);
const coconutMat = mat('coconut filling', '#e1d5b8', 0.82);
const sweetWhite = mat('chhana sweet', '#e8d6ab', 0.66, 0.08);
const sweetCaramel = mat('caramelised sweet', '#a65d2e', 0.69, 0.09);
const dateMat = mat('date fruit', '#6f3526', 0.57, 0.12);
const chickpeaMat = mat('cooked chickpea', '#b58a43', 0.8);
const onionMat = mat('red onion', '#9c4e69', 0.64, 0.08);
const chilliMat = mat('green chilli', '#397c3e', 0.55, 0.1);
const carrotMat = mat('carrot', '#d66c27', 0.72);
const peaMat = mat('green pea', '#66934c', 0.65, 0.08);
const raisinMat = mat('raisin', '#4d302c', 0.62, 0.12);
const nutMat = mat('cashew and almond', '#c8a46f', 0.74);
const herbMat = mat('fresh coriander leaf', '#3e7f48', 0.7);

function seeded(seed) { let s = seed >>> 0; return (min = 0, max = 1) => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return min + (s / 0x100000000) * (max - min); }; }
function mesh(geometry, material, name, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const value = new Mesh(geometry, material); value.name = name; value.position.set(...position); value.rotation.set(...rotation); value.scale.set(...scale); return value;
}
function bowl(radius = 0.82, height = 0.55, material = ceramic) {
  const group = new Group(); group.name = 'serving-bowl';
  const profile = [new Vector2(0, 0.02), new Vector2(radius * 0.72, 0.02), new Vector2(radius * 0.82, 0.12), new Vector2(radius * 0.96, height * 0.72), new Vector2(radius, height)];
  group.add(mesh(new LatheGeometry(profile, 64), material, 'bowl-shell'));
  group.add(mesh(new TorusGeometry(radius, 0.035, 10, 64), material, 'bowl-rim', [0, height, 0], [Math.PI / 2, 0, 0]));
  return group;
}
function plate(radius = 0.95) {
  const group = new Group(); group.name = 'serving-plate';
  group.add(mesh(new CylinderGeometry(radius, radius * 0.92, 0.08, 64), ceramicLight, 'plate-base'));
  group.add(mesh(new TorusGeometry(radius * 0.87, 0.075, 12, 64), ceramicLight, 'raised-rim', [0, 0.07, 0], [Math.PI / 2, 0, 0]));
  return group;
}
function grainCloud(parent, { count, seed, material, radius = 0.64, y = 0.58, height = 0.27, scale = [0.035, 0.018, 0.09], name = 'grain' }) {
  const random = seeded(seed); const geometry = new CapsuleGeometry(0.5, 0.8, 3, 6);
  for (let i = 0; i < count; i += 1) {
    const angle = random(0, Math.PI * 2), r = radius * Math.sqrt(random()), mound = Math.max(0, 1 - r / radius);
    parent.add(mesh(geometry, material, `${name}-${i + 1}`, [Math.cos(angle) * r, y + random(0, height) * mound, Math.sin(angle) * r], [random(-1, 1), random(0, Math.PI), random(-1, 1)], scale));
  }
}
function garnish(parent, seed, radius = 0.55, y = 0.76) {
  const random = seeded(seed);
  for (let i = 0; i < 12; i += 1) {
    const angle = random(0, Math.PI * 2), r = random(0.1, radius);
    parent.add(mesh(new BoxGeometry(0.055, 0.012, 0.026), i % 3 ? herbMat : onionMat, `garnish-${i + 1}`, [Math.cos(angle) * r, y + random(0, 0.03), Math.sin(angle) * r], [0, angle, random(-0.3, 0.3)]));
  }
}
function riceDal() {
  const root = new Group(); root.name = 'rice-and-dal-serving'; root.add(plate(1.08));
  const rice = new Group(); rice.name = 'steamed-rice-mound'; rice.position.set(-0.32, 0.06, 0); root.add(rice);
  grainCloud(rice, { count: 180, seed: 0x71ce, material: riceMat, radius: 0.55, y: 0.05, height: 0.48, name: 'cooked-rice-grain' });
  const dalBowl = bowl(0.42, 0.29, ceramic); dalBowl.name = 'dal-bowl'; dalBowl.position.set(0.52, 0.07, 0.05); root.add(dalBowl);
  dalBowl.add(mesh(new CylinderGeometry(0.38, 0.36, 0.035, 48), dalMat, 'dal-surface', [0, 0.27, 0]));
  garnish(dalBowl, 0xda1, 0.28, 0.3); return root;
}
function bhorta() {
  const root = new Group(); root.name = 'bhorta-variety'; root.add(plate(1.02)); const random = seeded(0xb407);
  [[-0.38, potatoMat, 'potato-bhorta'], [0.35, aubergineMat, 'aubergine-bhorta']].forEach(([x, material, name], m) => {
    const group = new Group(); group.name = name; root.add(group);
    for (let i = 0; i < 34; i += 1) { const a = random(0, Math.PI * 2), r = random(0, 0.35), h = Math.max(0, 1 - r / 0.35); group.add(mesh(new SphereGeometry(random(0.055, 0.095), 10, 7), material, `${name}-piece-${i + 1}`, [x + Math.cos(a) * r, 0.11 + random(0.01, 0.32) * h, Math.sin(a) * r], [random(0, 1), random(0, 1), random(0, 1)], [1.4, 0.7, 1.1])); }
    garnish(group, 0xb400 + m, 0.25, 0.29);
  });
  root.add(mesh(new CapsuleGeometry(0.025, 0.46, 5, 10), chilliMat, 'whole-green-chilli', [0.04, 0.17, -0.45], [0.1, 0, Math.PI / 2])); return root;
}
function khichuri() {
  const root = new Group(); root.name = 'vegetable-khichuri'; root.add(bowl()); grainCloud(root, { count: 170, seed: 0x4b1c, material: khichuriMat, radius: 0.66, y: 0.55, height: 0.34, name: 'rice-lentil-grain' });
  const random = seeded(0x4e9); for (let i = 0; i < 24; i += 1) { const a = random(0, Math.PI * 2), r = random(0.05, 0.58), y = 0.66 + random(0.02, 0.21) * (1 - r / 0.58); root.add(mesh(i % 2 ? new SphereGeometry(0.055, 10, 8) : new BoxGeometry(0.08, 0.065, 0.08), i % 2 ? peaMat : carrotMat, `vegetable-${i + 1}`, [Math.cos(a) * r, y, Math.sin(a) * r], [random(0, 2), random(0, 2), random(0, 2)])); } garnish(root, 0x4c, 0.48, 0.87); return root;
}
function pitha() {
  const root = new Group(); root.name = 'three-kinds-of-pitha'; root.add(plate(1.08));
  for (let i = 0; i < 4; i += 1) root.add(mesh(new CylinderGeometry(0.2, 0.23, 0.2, 32), riceMat, `bhapa-pitha-${i + 1}`, [-0.48 + i * 0.31, 0.17, 0.25], [0, i * 0.4, 0], [1, 1, 1]));
  for (let i = 0; i < 3; i += 1) { const roll = mesh(new CylinderGeometry(0.12, 0.12, 0.6, 28), riceMat, `patisapta-${i + 1}`, [-0.35 + i * 0.35, 0.18, -0.34], [0, 0, Math.PI / 2]); root.add(roll); root.add(mesh(new CylinderGeometry(0.078, 0.078, 0.606, 20), jaggeryMat, `patisapta-filling-${i + 1}`, [-0.35 + i * 0.35, 0.18, -0.34], [0, 0, Math.PI / 2])); }
  root.add(mesh(new TorusGeometry(0.25, 0.075, 12, 36), coconutMat, 'coconut-ring-pitha', [0.58, 0.16, 0.06], [Math.PI / 2, 0, 0])); return root;
}
function payesh() {
  const root = new Group(); root.name = 'rice-payesh'; root.add(bowl()); root.add(mesh(new CylinderGeometry(0.75, 0.7, 0.055, 56), milkMat, 'payesh-surface', [0, 0.54, 0])); grainCloud(root, { count: 58, seed: 0xfae5, material: riceMat, radius: 0.62, y: 0.57, height: 0.04, scale: [0.025, 0.012, 0.065], name: 'payesh-rice' });
  const random = seeded(0xfa15); for (let i = 0; i < 17; i += 1) { const a = random(0, Math.PI * 2), r = random(0, 0.58); root.add(mesh(new SphereGeometry(0.045, 10, 8), i % 2 ? raisinMat : nutMat, `topping-${i + 1}`, [Math.cos(a) * r, 0.61, Math.sin(a) * r], [0, 0, 0], i % 2 ? [1, 0.55, 0.8] : [1.6, 0.55, 0.8])); } return root;
}
function sweets() {
  const root = new Group(); root.name = 'bangla-sweets-assortment'; root.add(plate(1.08));
  const positions = [[-0.5, 0.25], [-0.1, 0.38], [0.35, 0.3], [0.55, -0.15], [0.1, -0.35], [-0.38, -0.28]];
  positions.forEach(([x, z], i) => { const material = i % 3 === 0 ? sweetCaramel : sweetWhite; const geometry = i % 2 ? new SphereGeometry(0.18, 20, 14) : new CylinderGeometry(0.17, 0.19, 0.23, 24); root.add(mesh(geometry, material, `sweet-${i + 1}`, [x, 0.19, z], [0, i * 0.3, 0], i % 2 ? [1, 0.82, 1] : [1, 1, 1])); }); return root;
}
function haleem() {
  const root = new Group(); root.name = 'haleem-bowl'; root.add(bowl()); root.add(mesh(new CylinderGeometry(0.75, 0.7, 0.06, 56), haleemMat, 'haleem-surface', [0, 0.55, 0])); garnish(root, 0xa11, 0.58, 0.61);
  const random = seeded(0xa112); for (let i = 0; i < 20; i += 1) { const a = random(0, Math.PI * 2), r = random(0, 0.55); root.add(mesh(new BoxGeometry(0.09, 0.018, 0.026), i % 3 ? onionMat : chilliMat, `haleem-topping-${i + 1}`, [Math.cos(a) * r, 0.62, Math.sin(a) * r], [0, a, 0])); } return root;
}
function iftar() {
  const root = new Group(); root.name = 'iftar-assortment'; root.add(plate(1.15)); const random = seeded(0x1f7a);
  for (let i = 0; i < 8; i += 1) { const a = i / 8 * Math.PI * 2; root.add(mesh(new SphereGeometry(0.13, 16, 10), dateMat, `date-${i + 1}`, [Math.cos(a) * 0.7, 0.18, Math.sin(a) * 0.7], [0, a, 0], [0.72, 1.35, 0.72])); }
  const chickpeas = new Group(); chickpeas.name = 'chickpea-salad'; root.add(chickpeas); for (let i = 0; i < 70; i += 1) { const a = random(0, Math.PI * 2), r = 0.46 * Math.sqrt(random()); chickpeas.add(mesh(new SphereGeometry(0.052, 9, 7), chickpeaMat, `chickpea-${i + 1}`, [Math.cos(a) * r, 0.13 + random(0, 0.18) * (1 - r / 0.46), Math.sin(a) * r])); } garnish(root, 0x1f71, 0.42, 0.31); return root;
}
function panta() {
  const root = new Group(); root.name = 'panta-rice'; root.add(bowl()); root.add(mesh(new CylinderGeometry(0.75, 0.7, 0.055, 56), waterMat, 'soaking-water-surface', [0, 0.55, 0])); grainCloud(root, { count: 125, seed: 0xfa47, material: riceMat, radius: 0.64, y: 0.51, height: 0.12, scale: [0.029, 0.014, 0.072], name: 'soaked-rice-grain' });
  root.add(mesh(new CapsuleGeometry(0.024, 0.42, 5, 10), chilliMat, 'green-chilli', [0.16, 0.63, 0.05], [0, 0.4, Math.PI / 2])); for (let i = 0; i < 5; i += 1) root.add(mesh(new TorusGeometry(0.105 + i * 0.006, 0.018, 8, 28), onionMat, `onion-ring-${i + 1}`, [-0.24 + i * 0.065, 0.61 + i * 0.004, -0.1 + i * 0.04], [Math.PI / 2, 0, i * 0.4])); return root;
}

const assets = [
  ['posora_rice_dal_01', 'rice-and-dal.glb', 'Rice and dal serving', 'A representative serving of steamed rice and yellow lentil dal', 'riceDal', riceDal],
  ['posora_bhorta_01', 'bhorta-assortment.glb', 'Bhorta assortment', 'Potato and roasted-aubergine bhorta examples', 'bhorta', bhorta],
  ['posora_khichuri_01', 'vegetable-khichuri.glb', 'Vegetable khichuri', 'Rice-and-lentil khichuri with visible vegetable garnish', 'khichuri', khichuri],
  ['posora_pitha_01', 'pitha-assortment.glb', 'Pitha assortment', 'Illustrative bhapa, patisapta and ring-shaped pitha examples', 'pitha', pitha],
  ['posora_payesh_01', 'rice-payesh.glb', 'Rice payesh', 'Thickened milk-and-rice payesh with raisin and nut garnish', 'payesh', payesh],
  ['posora_sweets_01', 'bangla-sweets.glb', 'Bangla sweet assortment', 'Illustrative chhana-based round and shaped sweets', 'sweet', sweets],
  ['posora_haleem_01', 'haleem.glb', 'Haleem serving', 'Thick slow-cooked haleem with onion, chilli and herb garnish', 'haleem', haleem],
  ['posora_iftar_01', 'iftar-assortment.glb', 'Iftar assortment', 'Dates and chickpea salad illustrating a varied iftar, not a fixed menu', 'dateBowl', iftar],
  ['posora_panta_01', 'panta-rice.glb', 'Panta rice', 'Cooked rice soaked in water with onion and chilli garnish', 'panta', panta],
];

async function exportBinary(scene) { const exporter = new GLTFExporter(); return await new Promise((resolve, reject) => exporter.parse(scene, resolve, reject, { binary: true, onlyVisible: true })); }
for (const [directory, filename, name, subject, figure, build] of assets) {
  const out = path.join(OUTPUT, directory); await mkdir(out, { recursive: true }); const bytes = Buffer.from(await exportBinary(build())); await writeFile(path.join(out, filename), bytes);
  const manifest = { name, subject, creator: 'Posora.com', license: 'CC0 1.0 Universal', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/', source: 'Original deterministic Three.js geometry authored for Posora; not a scan or third-party marketplace model.', localMainFile: filename, format: 'glTF 2.0 GLB', createdDate: CREATED, files: [{ path: filename, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }], educationalRole: `Dish-specific illustrative model for Food → বাংলার খাবার → ${figure}.`, limitations: ['Original PBR illustration, not photogrammetry and not a standard recipe.', 'Ingredients, shape, garnish, portion and serving style vary by family, region and occasion.', 'The model shows one representative serving and must not be read as the only authentic form.'] };
  await writeFile(path.join(out, 'asset-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(out, 'SOURCE-LICENSE.md'), `# ${name}\n\n- Creator/source: Posora.com original asset\n- Source record: https://posora.com/food/\n- License: CC0 1.0 Universal — https://creativecommons.org/publicdomain/zero/1.0/\n- Created: ${CREATED}\n\nThis is an original illustrative teaching model, not a scan or a claim that every recipe looks the same.\n`);
  await writeFile(path.join(out, 'README.md'), `# ${name}\n\nSee \`asset-manifest.json\` and \`SOURCE-LICENSE.md\`. Source page: https://posora.com/food/.\n`);
  console.log(`${directory}/${filename}: ${bytes.length} bytes`);
}
