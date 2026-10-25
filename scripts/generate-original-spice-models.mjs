import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  BufferGeometry,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  DodecahedronGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  SphereGeometry,
  Vector2,
} from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Posora-original, deterministic PBR teaching specimens. These are not scans:
// they model the visible morphology of the named dried spices and are released
// as CC0 so the site never depends on a paid/login-gated asset.
const OUTPUT = path.resolve('public/models');
const CHECKED = '2026-10-21';

class NodeFileReader {
  result = null;
  onloadend = null;
  onerror = null;
  async readAsArrayBuffer(blob) {
    try { this.result = await blob.arrayBuffer(); this.onloadend?.({ target: this }); }
    catch (error) { this.onerror?.(error); }
  }
  async readAsDataURL(blob) {
    try {
      const bytes = Buffer.from(await blob.arrayBuffer());
      this.result = `data:${blob.type || 'application/octet-stream'};base64,${bytes.toString('base64')}`;
      this.onloadend?.({ target: this });
    } catch (error) { this.onerror?.(error); }
  }
}
globalThis.FileReader ??= NodeFileReader;

const material = (name, color, roughness = 0.78, metalness = 0) => {
  const value = new MeshPhysicalMaterial({
    name,
    color: new Color(color),
    roughness,
    metalness,
    clearcoat: 0.08,
    clearcoatRoughness: 0.72,
  });
  value.side = DoubleSide;
  return value;
};

const ceramic = material('glazed earthenware', '#38545a', 0.34);
const ceramicInside = material('unglazed inner bowl', '#b9a68b', 0.72);
const cuminMat = material('cumin seed', '#8a6336', 0.86);
const cuminRidgeMat = material('cumin seed ridge', '#5b3e22', 0.9);
const corianderMat = material('coriander seed', '#b79a5d', 0.88);
const corianderDark = material('coriander groove', '#77613d', 0.9);
const mustardMat = material('brown mustard seed', '#5b371d', 0.72);
const mustardGold = material('yellow mustard seed', '#ba8f35', 0.76);
const fenugreekMat = material('fenugreek seed', '#b98d3f', 0.86);
const fenugreekCut = material('fenugreek crease', '#775223', 0.92);
const bayLeafMat = material('dried bay leaf', '#6f7134', 0.91);
const bayLeafEdge = material('bay leaf vein', '#a5a65c', 0.86);
const cinnamonMat = material('cinnamon bark', '#8a4528', 0.92);
const cloveMat = material('clove', '#4b2d21', 0.84);
const cardamomMat = material('green cardamom pod', '#788147', 0.9);
const pepperMat = material('black peppercorn', '#25211d', 0.68);
const starAniseMat = material('star anise', '#6e3422', 0.9);

function seeded(seed) {
  let state = seed >>> 0;
  return (min = 0, max = 1) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return min + (state / 0x100000000) * (max - min);
  };
}

function bowl() {
  const group = new Group(); group.name = 'ceramic-bowl';
  const profile = [
    new Vector2(0.0, 0.02), new Vector2(0.57, 0.02), new Vector2(0.62, 0.09),
    new Vector2(0.72, 0.28), new Vector2(0.79, 0.48), new Vector2(0.82, 0.58),
  ];
  const shell = new Mesh(new LatheGeometry(profile, 64), ceramic); shell.name = 'outer-bowl'; group.add(shell);
  const inside = new Mesh(new CylinderGeometry(0.75, 0.61, 0.055, 64), ceramicInside);
  inside.name = 'inner-bowl'; inside.position.y = 0.53; group.add(inside);
  const rim = new Mesh(new CylinderGeometry(0.86, 0.8, 0.07, 64, 1, true), ceramic);
  rim.name = 'bowl-rim'; rim.position.y = 0.59; group.add(rim);
  return group;
}

function ridgedSeedGeometry(length = 0.24, width = 0.065, ridges = 7, bend = 0.025) {
  const radial = 12, along = 9;
  const positions = [], normals = [], indices = [];
  for (let zIndex = 0; zIndex <= along; zIndex += 1) {
    const u = zIndex / along;
    const z = (u - 0.5) * length;
    const taper = Math.pow(Math.sin(Math.PI * u), 0.55);
    const centreX = Math.sin((u - 0.5) * Math.PI) * bend;
    for (let a = 0; a < radial; a += 1) {
      const theta = a / radial * Math.PI * 2;
      const ridge = 1 + 0.14 * Math.cos(theta * ridges);
      const rx = width * taper * ridge;
      positions.push(centreX + Math.cos(theta) * rx, Math.sin(theta) * rx * 0.72, z);
      normals.push(Math.cos(theta), Math.sin(theta), 0.12 * Math.cos(Math.PI * u));
    }
  }
  for (let z = 0; z < along; z += 1) for (let a = 0; a < radial; a += 1) {
    const next = (a + 1) % radial, i = z * radial + a, j = z * radial + next;
    indices.push(i, i + radial, j, j, i + radial, j + radial);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  geometry.name = `ridged-seed-${ridges}`;
  return geometry;
}

function groovedSphereGeometry(radius = 0.075, grooves = 10) {
  const horizontal = 18, vertical = 12, positions = [], normals = [], indices = [];
  for (let y = 0; y <= vertical; y += 1) {
    const v = y / vertical, phi = v * Math.PI;
    for (let x = 0; x <= horizontal; x += 1) {
      const u = x / horizontal, theta = u * Math.PI * 2;
      const rib = 1 + 0.075 * Math.cos(theta * grooves) * Math.sin(phi);
      const r = radius * rib;
      const nx = Math.sin(phi) * Math.cos(theta), ny = Math.cos(phi), nz = Math.sin(phi) * Math.sin(theta);
      positions.push(nx * r, ny * r * 0.94, nz * r); normals.push(nx, ny, nz);
    }
  }
  for (let y = 0; y < vertical; y += 1) for (let x = 0; x < horizontal; x += 1) {
    const i = y * (horizontal + 1) + x, j = i + horizontal + 1;
    indices.push(i, j, i + 1, i + 1, j, j + 1);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.name = 'grooved-coriander-seed';
  return geometry;
}

function scatter(group, geometry, materials, count, seed, options = {}) {
  const random = seeded(seed);
  const radius = options.radius ?? 0.6;
  for (let i = 0; i < count; i += 1) {
    const mesh = new Mesh(geometry, materials[i % materials.length]);
    const angle = random(0, Math.PI * 2), r = radius * Math.sqrt(random(0.02, 1));
    mesh.position.set(Math.cos(angle) * r, 0.61 + random(0.02, options.height ?? 0.2) * (1 - r / radius), Math.sin(angle) * r);
    mesh.rotation.set(random(-0.7, 0.7), random(0, Math.PI * 2), random(-0.7, 0.7));
    const scale = random(options.scaleMin ?? 0.82, options.scaleMax ?? 1.18); mesh.scale.setScalar(scale);
    mesh.name = `${options.name ?? 'seed'}-${String(i + 1).padStart(2, '0')}`;
    group.add(mesh);
  }
}

function leafGeometry(length = 0.82, width = 0.2) {
  const segments = 14, positions = [], normals = [], indices = [];
  for (let i = 0; i <= segments; i += 1) {
    const u = i / segments, z = (u - 0.5) * length;
    const w = Math.sin(Math.PI * u) * width * (0.86 + 0.14 * Math.sin(Math.PI * u));
    const curl = Math.sin((u - 0.5) * Math.PI) * 0.055;
    positions.push(-w, curl, z, 0, curl + 0.028, z, w, curl, z);
    normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
  }
  for (let i = 0; i < segments; i += 1) {
    const row = i * 3, next = row + 3;
    indices.push(row, next, row + 1, row + 1, next, next + 1, row + 1, next + 1, row + 2, row + 2, next + 1, next + 2);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.name = 'curved-bay-leaf';
  return geometry;
}

function baseSpecimen(name) {
  const root = new Group(); root.name = name;
  root.add(bowl());
  const contents = new Group(); contents.name = `${name}-contents`; root.add(contents);
  return { root, contents };
}

function cuminModel() {
  const { root, contents } = baseSpecimen('cumin-seeds');
  scatter(contents, ridgedSeedGeometry(), [cuminMat, cuminRidgeMat], 84, 0xc001, { radius: 0.65, height: 0.28, name: 'cumin-seed' });
  return root;
}

function corianderModel() {
  const { root, contents } = baseSpecimen('coriander-seeds');
  scatter(contents, groovedSphereGeometry(), [corianderMat, corianderDark], 72, 0xc022, { radius: 0.65, height: 0.3, name: 'coriander-seed' });
  return root;
}

function mustardModel() {
  const { root, contents } = baseSpecimen('mustard-seeds');
  scatter(contents, new IcosahedronGeometry(0.046, 2), [mustardMat, mustardGold], 150, 0x5eed, { radius: 0.67, height: 0.26, scaleMin: 0.72, scaleMax: 1.16, name: 'mustard-seed' });
  return root;
}

function fenugreekModel() {
  const { root, contents } = baseSpecimen('fenugreek-seeds');
  const geometry = new DodecahedronGeometry(0.074, 1); geometry.scale(1.16, 0.72, 0.88); geometry.name = 'angular-fenugreek-seed';
  scatter(contents, geometry, [fenugreekMat, fenugreekCut], 88, 0xfe90, { radius: 0.65, height: 0.28, scaleMin: 0.75, scaleMax: 1.12, name: 'fenugreek-seed' });
  return root;
}

function bayLeafModel() {
  const { root, contents } = baseSpecimen('bay-leaves');
  const leaf = leafGeometry();
  const random = seeded(0xba71);
  for (let i = 0; i < 18; i += 1) {
    const holder = new Group(); holder.name = `bay-leaf-${String(i + 1).padStart(2, '0')}`;
    const mesh = new Mesh(leaf, bayLeafMat); holder.add(mesh);
    const vein = new Mesh(new CapsuleGeometry(0.013, 0.67, 5, 8), bayLeafEdge);
    vein.rotation.x = Math.PI / 2; vein.position.y = 0.035; holder.add(vein);
    const angle = random(0, Math.PI * 2), radius = random(0.03, 0.48);
    holder.position.set(Math.cos(angle) * radius, 0.64 + i * 0.018, Math.sin(angle) * radius);
    holder.rotation.set(random(-0.2, 0.2), angle + random(-0.4, 0.4), random(-0.45, 0.45));
    holder.scale.setScalar(random(0.78, 1.08)); contents.add(holder);
  }
  return root;
}

function garamMasalaModel() {
  const { root, contents } = baseSpecimen('garam-masala-whole-spices');
  const random = seeded(0x6a4a);
  // Cinnamon quills.
  for (let i = 0; i < 9; i += 1) {
    const stick = new Mesh(new CylinderGeometry(0.035, 0.04, random(0.42, 0.68), 16, 1, true), cinnamonMat);
    stick.name = `cinnamon-quill-${i + 1}`; stick.rotation.set(random(-0.35, 0.35), random(0, Math.PI), random(0.9, 1.45));
    stick.position.set(random(-0.48, 0.48), 0.75 + random(0, 0.16), random(-0.42, 0.42)); contents.add(stick);
  }
  // Cardamom pods and peppercorns.
  scatter(contents, ridgedSeedGeometry(0.2, 0.072, 9, 0.012), [cardamomMat], 28, 0xca2d, { radius: 0.58, height: 0.28, name: 'cardamom-pod' });
  scatter(contents, new IcosahedronGeometry(0.044, 2), [pepperMat], 48, 0x9e99, { radius: 0.63, height: 0.3, name: 'peppercorn' });
  // Cloves: distinct stalk and head groups.
  for (let i = 0; i < 22; i += 1) {
    const clove = new Group(); clove.name = `clove-${i + 1}`;
    const stem = new Mesh(new CylinderGeometry(0.015, 0.028, 0.22, 10), cloveMat); clove.add(stem);
    const head = new Mesh(new SphereGeometry(0.045, 12, 8), cloveMat); head.position.y = 0.125; head.scale.set(1, 0.7, 1); clove.add(head);
    clove.position.set(random(-0.5, 0.5), 0.76 + random(0, 0.14), random(-0.45, 0.45));
    clove.rotation.set(random(-1, 1), random(0, Math.PI * 2), random(-1, 1)); contents.add(clove);
  }
  // Two whole star-anise pods form unmistakable silhouettes.
  for (let s = 0; s < 2; s += 1) {
    const star = new Group(); star.name = `star-anise-${s + 1}`;
    for (let i = 0; i < 8; i += 1) {
      const arm = new Mesh(new CapsuleGeometry(0.035, 0.17, 4, 8), starAniseMat);
      arm.rotation.z = Math.PI / 2; arm.rotation.y = i / 8 * Math.PI * 2; arm.position.set(Math.cos(i / 8 * Math.PI * 2) * 0.11, 0, Math.sin(i / 8 * Math.PI * 2) * 0.11); star.add(arm);
    }
    star.position.set(s ? 0.28 : -0.24, 0.98 + s * 0.04, s ? 0.12 : -0.08); star.rotation.x = Math.PI / 2; contents.add(star);
  }
  return root;
}

const assets = [
  { key: 'cumin', folder: 'posora_cumin_01', file: 'cumin-seeds.glb', title: 'Cumin seeds', scientific: 'Cuminum cyminum dried fruits', build: cuminModel },
  { key: 'coriander', folder: 'posora_coriander_01', file: 'coriander-seeds.glb', title: 'Coriander seeds', scientific: 'Coriandrum sativum dried fruits', build: corianderModel },
  { key: 'bayLeaf', folder: 'posora_bay_leaf_01', file: 'bay-leaves.glb', title: 'Dried bay leaves', scientific: 'Cinnamomum tamala leaf teaching model', build: bayLeafModel },
  { key: 'mustard', folder: 'posora_mustard_01', file: 'mustard-seeds.glb', title: 'Mustard seeds', scientific: 'Brassica/Sinapis seed teaching model', build: mustardModel },
  { key: 'fenugreek', folder: 'posora_fenugreek_01', file: 'fenugreek-seeds.glb', title: 'Fenugreek seeds', scientific: 'Trigonella foenum-graecum dried seeds', build: fenugreekModel },
  { key: 'garamMasala', folder: 'posora_garam_masala_01', file: 'garam-masala.glb', title: 'Whole garam masala mixture', scientific: 'Cinnamon, cardamom, clove, pepper and star-anise teaching set', build: garamMasalaModel },
];

function exportBinary(object) {
  return new Promise((resolve, reject) => {
    new GLTFExporter().parse(object, (result) => resolve(Buffer.from(result)), reject, {
      binary: true,
      onlyVisible: true,
      trs: true,
    });
  });
}

for (const asset of assets) {
  const directory = path.join(OUTPUT, asset.folder);
  await mkdir(directory, { recursive: true });
  const model = asset.build();
  const bytes = await exportBinary(model);
  const hash = createHash('sha256').update(bytes).digest('hex');
  await writeFile(path.join(directory, asset.file), bytes);
  const manifest = {
    name: asset.title,
    subject: asset.scientific,
    creator: 'Posora.com',
    license: 'CC0 1.0 Universal',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    source: 'Original deterministic Three.js geometry authored for Posora; not a scan or third-party marketplace model.',
    localMainFile: asset.file,
    format: 'glTF 2.0 GLB',
    createdDate: CHECKED,
    files: [{ path: asset.file, bytes: bytes.length, sha256: hash }],
    educationalRole: `Exact dried-spice teaching specimen for Food → মশলার জগৎ → ${asset.key}.`,
    limitations: [
      'Original PBR teaching model, not photogrammetry and not a specimen scan.',
      'Natural products vary in size, color, curvature, age, processing and cultivar.',
      'The bowl is a display vessel and is not part of the spice.',
    ],
  };
  await writeFile(path.join(directory, 'asset-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(directory, 'SOURCE-LICENSE.md'), `# Source and license evidence — ${asset.title}\n\n- Creator: Posora.com\n- Created: ${CHECKED}\n- License: [CC0 1.0 Universal](${manifest.licenseUrl})\n- Source: original geometry generated by \`scripts/generate-original-spice-models.mjs\`\n\nThis asset was authored specifically for Posora from deterministic mesh geometry and PBR materials. It contains no downloaded third-party mesh or texture. Posora releases the resulting GLB under CC0. It is a morphology-focused teaching model, not photogrammetry or a scientific specimen scan.\n`);
  await writeFile(path.join(directory, 'README.md'), `# ${asset.title}\n\n- Subject: ${asset.scientific}\n- Local file: \`${asset.file}\`\n- Creator: Posora.com\n- License: CC0 1.0 Universal\n- Generation source: [generate-original-spice-models.mjs](../../../scripts/generate-original-spice-models.mjs)\n- Hashes and limitations: [asset-manifest.json](asset-manifest.json)\n`);
  console.log(`${asset.folder}/${asset.file}: ${bytes.length} bytes · ${hash}`);
}
