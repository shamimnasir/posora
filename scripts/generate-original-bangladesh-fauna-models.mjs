import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  BufferGeometry, CapsuleGeometry, Color, ConeGeometry, CylinderGeometry,
  DoubleSide, Float32BufferAttribute, Group, Mesh, MeshPhysicalMaterial,
  SphereGeometry, TorusGeometry, Vector3,
} from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Posora-original morphology teaching models. They are intentionally more
// detailed than the old symbolic figures, while remaining lightweight enough
// for a child-facing mobile WebGL lesson. They are illustrations, not scans.
const OUTPUT = path.resolve('public/models');
const CREATED = '2026-10-21';
class NodeFileReader { result = null; onloadend = null; onerror = null; async readAsArrayBuffer(blob) { try { this.result = await blob.arrayBuffer(); this.onloadend?.({ target: this }); } catch (e) { this.onerror?.(e); } } async readAsDataURL(blob) { try { const b = Buffer.from(await blob.arrayBuffer()); this.result = `data:${blob.type || 'application/octet-stream'};base64,${b.toString('base64')}`; this.onloadend?.({ target: this }); } catch (e) { this.onerror?.(e); } } }
globalThis.FileReader ??= NodeFileReader;

const material = (name, color, roughness = 0.78, clearcoat = 0.02, metalness = 0) => { const m = new MeshPhysicalMaterial({ name, color: new Color(color), roughness, metalness, clearcoat, clearcoatRoughness: 0.7 }); m.side = DoubleSide; return m; };
const black = material('feather black', '#171a1c', 0.76);
const white = material('feather white', '#e8e5dc', 0.83);
const eye = material('glossy eye', '#090909', 0.18, 0.9);
const beak = material('keratin beak', '#322d28', 0.72);
const leg = material('scaled leg', '#7c6544', 0.88);
const silver = material('silver scales', '#b8c8ce', 0.42, 0.28, 0.05);
const silverDark = material('blue-grey dorsal scales', '#647d88', 0.55, 0.16);
const fin = material('translucent fin', '#9eacaa', 0.55, 0.15);
const cat = material('golden leopard-cat coat', '#aa8050', 0.86);
const catLight = material('pale underside', '#d2b78b', 0.88);
const catDark = material('leopard-cat markings', '#2b2722', 0.82);
const macaque = material('macaque olive-brown fur', '#746553', 0.92);
const macaqueLight = material('macaque pale chest', '#a99a82', 0.9);
const macaqueFace = material('macaque bare face', '#9a7565', 0.82);
const vultureDark = material('vulture dark brown plumage', '#403a33', 0.94);
const vultureLight = material('vulture pale covert', '#827867', 0.92);
const vultureSkin = material('vulture bare head', '#a68b78', 0.86);

function mesh(geometry, mat, name, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) { const m = new Mesh(geometry, mat); m.name = name; m.position.set(...position); m.rotation.set(...rotation); m.scale.set(...scale); return m; }
function ellipsoid(parent, name, mat, position, scale, rotation = [0, 0, 0], detail = 24) { parent.add(mesh(new SphereGeometry(0.5, detail, Math.max(12, detail / 2)), mat, name, position, rotation, scale)); }
function limb(parent, name, mat, startArray, endArray, r1, r2 = r1) { const start = new Vector3(...startArray), end = new Vector3(...endArray), delta = end.clone().sub(start), length = delta.length(); const part = mesh(new CylinderGeometry(r2, r1, length, 12), mat, name); part.position.copy(start.clone().add(end).multiplyScalar(0.5)); part.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), delta.normalize()); parent.add(part); }
function triangle(parent, name, mat, points) { const geometry = new BufferGeometry(); geometry.setAttribute('position', new Float32BufferAttribute(points.flat(), 3)); geometry.setIndex([0, 1, 2]); geometry.computeVertexNormals(); parent.add(mesh(geometry, mat, name)); }
function eyePair(parent, x, y, z, spacing = 0.12, size = 0.04) { for (const side of [-1, 1]) ellipsoid(parent, `eye-${side > 0 ? 'near' : 'far'}`, eye, [x, y, z + spacing * side], [size, size, size]); }

function hilsa() {
  const root = new Group(); root.name = 'hilsa-tenualosa-ilisha';
  ellipsoid(root, 'deep-compressed-body', silver, [0, 0.72, 0], [1.48, 0.62, 0.25]);
  ellipsoid(root, 'darker-dorsal-band', silverDark, [-0.03, 0.96, 0], [1.28, 0.19, 0.252]);
  ellipsoid(root, 'blunt-head', silver, [0.78, 0.74, 0], [0.48, 0.48, 0.24]);
  ellipsoid(root, 'silvery-operculum', white, [0.72, 0.73, 0.205], [0.22, 0.31, 0.018]);
  eyePair(root, 0.92, 0.88, 0, 0.205, 0.055);
  root.add(mesh(new TorusGeometry(0.115, 0.018, 8, 22, Math.PI * 1.35), beak, 'mouth-line', [1.02, 0.65, 0], [Math.PI / 2, 0, -0.6], [1, 1, 0.45]));
  triangle(root, 'forked-tail-upper', silverDark, [[-1.28, 0.74, 0], [-1.95, 1.28, 0], [-1.66, 0.72, 0]]);
  triangle(root, 'forked-tail-lower', silverDark, [[-1.28, 0.7, 0], [-1.95, 0.18, 0], [-1.66, 0.71, 0]]);
  triangle(root, 'dorsal-fin', fin, [[-0.38, 1.12, 0], [0.2, 1.55, 0], [0.48, 1.1, 0]]);
  triangle(root, 'anal-fin', fin, [[-0.55, 0.32, 0], [-0.1, 0.03, 0], [0.25, 0.34, 0]]);
  triangle(root, 'pectoral-fin-near', fin, [[0.55, 0.73, 0.2], [0.2, 0.2, 0.5], [0.08, 0.68, 0.22]]);
  for (let row = 0; row < 5; row += 1) for (let col = 0; col < 12; col += 1) { const x = -0.92 + col * 0.145 + (row % 2) * 0.07, y = 0.49 + row * 0.115; if (((x / 1.42) ** 2 + ((y - 0.72) / 0.55) ** 2) < 0.88) root.add(mesh(new TorusGeometry(0.045, 0.006, 5, 12, Math.PI), silverDark, `scale-${row}-${col}`, [x, y, 0.238], [Math.PI / 2, 0, 0])); }
  return root;
}

function birdBase({ name, bodyMat, chestMat, headMat, longTail = false }) {
  const root = new Group(); root.name = name;
  ellipsoid(root, 'body', bodyMat, [0, 0.92, 0], [0.5, 0.72, 0.4], [0, 0, -0.15]);
  ellipsoid(root, 'chest', chestMat, [0.2, 0.88, 0.31], [0.36, 0.57, 0.08], [0, 0, -0.18]);
  ellipsoid(root, 'head', headMat, [0.3, 1.55, 0], [0.34, 0.34, 0.32]);
  root.add(mesh(new ConeGeometry(0.09, 0.38, 10), beak, 'slender-beak', [0.68, 1.55, 0], [0, 0, -Math.PI / 2]));
  eyePair(root, 0.43, 1.65, 0, 0.265, 0.04);
  for (const side of [-1, 1]) {
    ellipsoid(root, `folded-wing-${side}`, bodyMat, [-0.05, 1.02, side * 0.34], [0.45, 0.57, 0.075], [0.1, 0, side * 0.14]);
    limb(root, `leg-${side}`, leg, [0.05, 0.45, side * 0.13], [0.02, 0.08, side * 0.14], 0.025, 0.018);
    limb(root, `foot-${side}`, leg, [0.02, 0.08, side * 0.14], [0.25, 0.03, side * 0.16], 0.018, 0.009);
  }
  const tailLength = longTail ? 1.28 : 0.8;
  for (let i = -2; i <= 2; i += 1) root.add(mesh(new CapsuleGeometry(0.07, tailLength, 5, 10), i === 0 ? chestMat : bodyMat, `tail-feather-${i + 3}`, [-0.58 - tailLength / 2, 0.68, i * 0.07], [0, 0, Math.PI / 2 - 0.13], [1, 1, 0.7]));
  return root;
}

function doel() {
  const root = birdBase({ name: 'oriental-magpie-robin-copsychus-saularis', bodyMat: black, chestMat: white, headMat: black, longTail: true });
  for (const side of [-1, 1]) {
    ellipsoid(root, `white-wing-bar-${side}`, white, [-0.03, 1.06, side * 0.402], [0.28, 0.22, 0.025], [0, 0, -0.18]);
    ellipsoid(root, `white-tail-edge-${side}`, white, [-1.0, 0.82, side * 0.16], [0.5, 0.05, 0.025], [0, 0, -0.13]);
  }
  return root;
}

function leopardCat() {
  const root = new Group(); root.name = 'leopard-cat-prionailurus-bengalensis';
  ellipsoid(root, 'slender-body', cat, [0, 0.82, 0], [1.05, 0.48, 0.4]);
  ellipsoid(root, 'pale-belly', catLight, [0.1, 0.62, 0], [0.78, 0.22, 0.405]);
  ellipsoid(root, 'head', cat, [0.9, 1.03, 0], [0.46, 0.42, 0.38]);
  ellipsoid(root, 'muzzle', catLight, [1.22, 0.94, 0], [0.22, 0.18, 0.26]);
  eyePair(root, 1.07, 1.14, 0, 0.33, 0.045);
  for (const side of [-1, 1]) root.add(mesh(new ConeGeometry(0.14, 0.3, 4), cat, `rounded-ear-${side}`, [0.79, 1.42, side * 0.24], [0, 0, side * 0.08]));
  for (const x of [-0.62, 0.55]) for (const side of [-1, 1]) { limb(root, `leg-${x}-${side}`, cat, [x, 0.68, side * 0.25], [x + 0.06, 0.08, side * 0.26], 0.105, 0.075); ellipsoid(root, `paw-${x}-${side}`, catDark, [x + 0.13, 0.06, side * 0.26], [0.18, 0.07, 0.11]); }
  const tailPoints = [[-0.9, 0.9, 0], [-1.35, 0.85, 0.05], [-1.72, 1.02, 0.08], [-1.96, 1.28, 0.06]];
  tailPoints.slice(0, -1).forEach((point, i) => limb(root, `ringed-tail-${i + 1}`, i % 2 ? catDark : cat, point, tailPoints[i + 1], 0.12 - i * 0.02, 0.105 - i * 0.02));
  const spots = [[-0.55,1.02,.36],[-.18,.96,.39],[.22,1.08,.37],[.52,.88,.37],[-.7,.7,.36],[-.3,.66,.4],[.15,.7,.4],[.62,1.12,.27]];
  spots.forEach((p, i) => ellipsoid(root, `coat-rosette-${i + 1}`, catDark, p, [0.11, 0.08, 0.024]));
  for (let i = 0; i < 3; i += 1) ellipsoid(root, `forehead-stripe-${i + 1}`, catDark, [0.92 + i * 0.08, 1.34 - i * 0.04, 0.31], [0.035, 0.12, 0.02], [0, 0, -0.2]);
  return root;
}

function monkey() {
  const root = new Group(); root.name = 'bangladesh-macaque-type-monkey';
  ellipsoid(root, 'furred-torso', macaque, [0, 1.05, 0], [0.55, 0.75, 0.42]);
  ellipsoid(root, 'pale-chest', macaqueLight, [0.2, 1.03, 0.35], [0.35, 0.56, 0.07]);
  ellipsoid(root, 'head', macaque, [0.15, 1.82, 0], [0.42, 0.43, 0.39]);
  ellipsoid(root, 'bare-face', macaqueFace, [0.39, 1.78, 0], [0.28, 0.31, 0.29]);
  ellipsoid(root, 'muzzle', macaqueFace, [0.62, 1.68, 0], [0.2, 0.15, 0.23]);
  eyePair(root, 0.48, 1.9, 0, 0.25, 0.045);
  for (const side of [-1, 1]) { ellipsoid(root, `ear-${side}`, macaqueFace, [0.12, 1.83, side * 0.39], [0.14, 0.17, 0.07]); limb(root, `arm-${side}`, macaque, [-0.27, 1.35, side * 0.32], [-0.62, 0.55, side * 0.42], 0.12, 0.085); ellipsoid(root, `hand-${side}`, macaqueFace, [-0.64, 0.45, side * 0.42], [0.13, 0.18, 0.09]); limb(root, `leg-${side}`, macaque, [-0.25, 0.65, side * 0.25], [-0.52, 0.1, side * 0.29], 0.16, 0.1); ellipsoid(root, `foot-${side}`, macaqueFace, [-0.36, 0.06, side * 0.29], [0.24, 0.08, 0.11]); }
  const tail = [[-0.45,1.1,0],[-0.92,1.08,-.05],[-1.23,.82,-.08],[-1.32,.45,-.03],[-1.14,.2,.05]];
  tail.slice(0, -1).forEach((p, i) => limb(root, `curved-tail-${i + 1}`, macaque, p, tail[i + 1], 0.09 - i * 0.01, 0.08 - i * 0.01));
  return root;
}

function vulture() {
  const root = birdBase({ name: 'white-rumped-vulture-type-gyps-bengalensis', bodyMat: vultureDark, chestMat: vultureLight, headMat: vultureSkin });
  root.getObjectByName('head')?.scale.set(0.27, 0.3, 0.27);
  root.getObjectByName('head')?.position.set(0.29, 1.69, 0);
  root.getObjectByName('slender-beak')?.scale.set(1.2, 1.15, 1.2);
  root.add(mesh(new TorusGeometry(0.32, 0.11, 12, 28), white, 'white-neck-ruff', [0.17, 1.42, 0], [Math.PI / 2, 0, 0]));
  for (const side of [-1, 1]) {
    ellipsoid(root, `broad-folded-wing-${side}`, vultureDark, [-0.15, 1.04, side * 0.39], [0.68, 0.72, 0.1], [0.08, 0, side * 0.1]);
    for (let i = 0; i < 5; i += 1) root.add(mesh(new CapsuleGeometry(0.055, 0.62 + i * 0.06, 4, 8), black, `primary-feather-${side}-${i}`, [-0.46 - i * 0.05, 0.84 - i * 0.035, side * (0.4 + i * 0.025)], [0, 0, Math.PI / 2 - 0.25]));
  }
  ellipsoid(root, 'white-rump-field', white, [-0.5, 0.9, 0], [0.28, 0.24, 0.41]);
  return root;
}

const assets = [
  ['posora_hilsa_01', 'hilsa.glb', 'Hilsa fish', 'Tenualosa ilisha morphology teaching illustration', 'hilsa', hilsa],
  ['posora_doel_01', 'oriental-magpie-robin.glb', 'Doel / Oriental magpie-robin', 'Copsychus saularis morphology teaching illustration', 'doel', doel],
  ['posora_leopard_cat_01', 'leopard-cat.glb', 'Leopard cat', 'Prionailurus bengalensis morphology teaching illustration', 'leopardCat', leopardCat],
  ['posora_monkey_01', 'macaque-type-monkey.glb', 'Bangladesh macaque-type monkey', 'A broad macaque-form teaching illustration; not a verified individual species', 'monkey', monkey],
  ['posora_vulture_01', 'white-rumped-vulture-type.glb', 'White-rumped vulture type', 'Gyps bengalensis morphology teaching illustration', 'vulture', vulture],
];
async function exportBinary(scene) { const exporter = new GLTFExporter(); return await new Promise((resolve, reject) => exporter.parse(scene, resolve, reject, { binary: true, onlyVisible: true })); }
for (const [directory, filename, name, subject, figure, build] of assets) {
  const out = path.join(OUTPUT, directory); await mkdir(out, { recursive: true });
  const bytes = Buffer.from(await exportBinary(build())); await writeFile(path.join(out, filename), bytes);
  const manifest = { name, subject, creator: 'Posora.com', license: 'CC0 1.0 Universal', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/', source: 'Original deterministic Three.js geometry authored for Posora using diagnostic animal morphology; not a scan or marketplace model.', localMainFile: filename, format: 'glTF 2.0 GLB', createdDate: CREATED, files: [{ path: filename, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }], educationalRole: `Exact named-item or visibly disclosed type illustration for Life → ${figure}.`, limitations: ['Original morphology-focused PBR illustration, not photogrammetry, taxidermy or a verified individual specimen.', 'Individuals vary by sex, age, season, habitat and health.', figure === 'monkey' ? 'The Bengali lesson uses a broad common name; this model shows macaque-type anatomy and does not claim one verified species.' : 'Use the lesson references for facts; do not infer real size from this model.'] };
  await writeFile(path.join(out, 'asset-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(out, 'SOURCE-LICENSE.md'), `# ${name}\n\n- Creator/source: Posora.com original asset\n- Source record: https://posora.com/life/\n- License: CC0 1.0 Universal — https://creativecommons.org/publicdomain/zero/1.0/\n- Created: ${CREATED}\n\nOriginal morphology-focused teaching illustration; not a specimen scan.\n`);
  await writeFile(path.join(out, 'README.md'), `# ${name}\n\nSee \`asset-manifest.json\` and \`SOURCE-LICENSE.md\`. Source page: https://posora.com/life/.\n`);
  console.log(`${directory}/${filename}: ${bytes.length} bytes`);
}
