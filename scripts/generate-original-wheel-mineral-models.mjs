import { BufferGeometry, CylinderGeometry, Float32BufferAttribute, IcosahedronGeometry, LatheGeometry, Matrix4, Quaternion, Vector2, Vector3 } from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Batch, DoubleSide, col, compose, displace, fbm, material, mix, noise3, seeded, writeAsset } from './lib/procedural-kit.mjs';

/**
 * Two physical objects whose form is fully determined by how they are made,
 * so an authored model can be accurate rather than a stand-in:
 *
 * - চাকা: a Bangladeshi bullock-cart (গরুর গাড়ি) wheel — a turned wooden
 *   hub, twelve tapered spokes, six curved felloes pegged into a rim and an
 *   iron tyre shrunk on round it, the construction used for centuries.
 * - খনিজ: a quartz cluster. Quartz grows as six-sided prisms ending in
 *   six-faced pyramidal tips (its rhombohedral faces), so the crystal
 *   geometry follows the mineral itself; crystals rise from a rock matrix.
 *
 * Both are Posora-authored (CC0), not scans; sizes are not to scale.
 */
const CREATED = '2026-10-28';
const v3 = (x, y, z) => new Vector3(x, y, z);

/* ---------- চাকা: bullock-cart wheel ---------- */
function cartWheel() {
  const random = seeded(0xc4a7), batch = new Batch();
  const wood = (base, p, grain = 30) => mix(col(base), col('#4a2e18'), Math.pow(Math.abs(Math.sin(p.y * grain + fbm(p.x * 6, p.y * 3, p.z * 6, 2) * 4)), 6) * 0.55 + Math.max(0, noise3(p.x * 9, p.y * 9, p.z * 9)) * 0.2);
  const R = 0.62, rimDepth = 0.075, rimWidth = 0.07;
  // Felloes: six wooden arcs forming the rim, lathed as one ring with a
  // rectangular section; the joints between arcs are darkened lines.
  const ring = (inner, outer, width) => new LatheGeometry([[inner, -width / 2], [outer, -width / 2], [outer, width / 2], [inner, width / 2], [inner, -width / 2]].map(([x, y]) => new Vector2(x, y)), 96);
  batch.add('wood', ring(R - rimDepth, R, rimWidth), compose([0, 0, 0], [Math.PI / 2, 0, 0]), (p) => {
    const a = Math.atan2(p.z, p.x), joint = Math.abs(Math.sin(a * 3)) < 0.025;
    return joint ? col('#2a1a0e') : wood('#8a5a32', { x: p.x, y: a * 0.6, z: p.z }, 22);
  });
  // Iron tyre: a thin dark band shrunk on round the felloes, with rivets.
  batch.add('iron', ring(R, R + 0.014, rimWidth * 1.05), compose([0, 0, 0], [Math.PI / 2, 0, 0]), (p) => mix(col('#2b2622'), col('#6a3d22'), Math.max(0, noise3(p.x * 20, p.y * 20, p.z * 20)) * 0.7));
  for (let k = 0; k < 18; k += 1) { const a = (k / 18) * Math.PI * 2; batch.add('iron', new IcosahedronGeometry(0.008, 1), compose([Math.cos(a) * (R + 0.012), Math.sin(a) * (R + 0.012), rimWidth * 0.3]), () => col('#3a332d')); }
  // Hub: a turned wooden nave with two iron bands and the axle hole.
  const nave = new LatheGeometry([[0.05, -0.17], [0.11, -0.16], [0.13, -0.1], [0.14, 0], [0.13, 0.1], [0.11, 0.16], [0.05, 0.17]].map(([x, y]) => new Vector2(x, y)), 40);
  batch.add('wood', nave, compose([0, 0, 0], [Math.PI / 2, 0, 0]), (p) => wood('#7a4c2a', p, 40));
  for (const z of [-0.12, 0.12]) batch.add('iron', new CylinderGeometry(0.128, 0.128, 0.022, 40, 1, true), compose([0, 0, z], [Math.PI / 2, 0, 0]), () => col('#3a332d'));
  batch.add('iron', new CylinderGeometry(0.045, 0.045, 0.36, 24, 1, true), compose([0, 0, 0], [Math.PI / 2, 0, 0]), () => col('#1d1915'));
  // Twelve spokes, tapering from the hub to the felloes, slightly dished.
  for (let s = 0; s < 12; s += 1) {
    const a = (s / 12) * Math.PI * 2, dir = v3(Math.cos(a), Math.sin(a), 0);
    const from = dir.clone().multiplyScalar(0.12).setZ(0.015), to = dir.clone().multiplyScalar(R - rimDepth + 0.01).setZ(-0.01);
    const len = from.distanceTo(to), mid = from.clone().add(to).multiplyScalar(0.5);
    const g = new CylinderGeometry(0.016, 0.026, len, 10);
    const m = new Matrix4().compose(mid, new Quaternion().setFromUnitVectors(v3(0, 1, 0), to.clone().sub(from).normalize()), v3(1, 1, 0.75 + random(0, 0.08)));
    batch.add('wood', g, m, (p) => wood('#9a6a3e', p, 18));
  }
  return batch.build('bullock-cart-wheel', {
    wood: material('weathered hardwood', { roughness: 0.82 }),
    iron: material('forged iron tyre and bands', { roughness: 0.55, clearcoat: 0.1, side: DoubleSide }),
  });
}

/* ---------- খনিজ: quartz cluster ---------- */
/** One quartz crystal: a hexagonal prism with a six-faced pyramidal tip. Flat faces. */
function quartzCrystal(radius, length, tip) {
  const positions = [], colors = [];
  const ring = (y, r) => [...Array(6).keys()].map((k) => { const a = (k / 6) * Math.PI * 2; return v3(Math.cos(a) * r, y, Math.sin(a) * r); });
  const base = ring(0, radius), top = ring(length, radius), apex = v3(0, length + tip, 0);
  const milky = col('#e9eef2'), clear = col('#fbfdff'), smoky = col('#c9d2d8');
  const tri = (a, b, c2, shade) => { for (const p of [a, b, c2]) { positions.push(p.x, p.y, p.z); const t = Math.min(1, p.y / (length + tip)); const cc = mix(mix(smoky, milky, t * 1.4), clear, Math.max(0, t - 0.6) * 2).multiplyScalar(shade); colors.push(cc.r, cc.g, cc.b); } };
  for (let k = 0; k < 6; k += 1) {
    const n = (k + 1) % 6, shade = 0.86 + (k % 3) * 0.07;
    tri(base[k], top[n], top[k], shade); tri(base[k], base[n], top[n], shade); // prism face, with faint horizontal striations below
    tri(top[k], top[n], apex, shade + 0.05);                                 // rhombohedral termination face
  }
  const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(positions, 3)); g.setAttribute('color', new Float32BufferAttribute(colors, 3)); g.computeVertexNormals();
  return g;
}
function quartzCluster() {
  const random = seeded(0x9a42), batch = new Batch();
  // the rock matrix the crystals grew from
  const welded = new IcosahedronGeometry(0.42, 8); welded.deleteAttribute('normal'); welded.deleteAttribute('uv');
  const matrix = displace(mergeVertices(welded), 0.06, 4, 3);
  batch.add('matrix', matrix, compose([0, 0.05, 0], [0, 0, 0], [1.35, 0.42, 1.1]), (p) => mix(col('#5b5148'), col('#8a7e70'), fbm(p.x * 7, p.y * 7, p.z * 7, 3) * 0.5 + 0.5));
  const crystals = [[0, 0.62, 0.11, 0, 0], [0.18, 0.44, 0.08, 0.35, 0.2], [-0.2, 0.5, 0.09, -0.3, -0.1], [0.06, 0.36, 0.065, 0.2, -0.45], [-0.1, 0.32, 0.06, -0.15, 0.5], [0.3, 0.26, 0.055, 0.6, 0.1], [-0.32, 0.28, 0.06, -0.6, 0.15], [0.14, 0.22, 0.045, 0.45, -0.6], [-0.05, 0.25, 0.05, -0.1, -0.7], [0.25, 0.3, 0.05, 0.25, 0.65], [-0.26, 0.2, 0.045, -0.45, -0.55]];
  for (const [x, len, r, tiltX, tiltZ] of crystals) {
    const g = quartzCrystal(r, len, r * 1.9);
    const m = new Matrix4().compose(v3(x, 0.12, (random() - 0.5) * 0.22), new Quaternion().setFromUnitVectors(v3(0, 1, 0), v3(tiltX, 1, tiltZ).normalize()).multiply(new Quaternion().setFromAxisAngle(v3(0, 1, 0), random(0, Math.PI))), v3(1, 1, 1));
    batch.addColored('quartz', g, m);
  }
  return batch.build('quartz-crystal-cluster', {
    matrix: material('host rock matrix', { roughness: 0.95 }),
    quartz: material('glassy quartz crystal faces', { roughness: 0.08, clearcoat: 1, side: DoubleSide }),
  });
}

const assets = [
  ['posora_bullock_cart_wheel_01', 'bullock-cart-wheel.glb', 'Bullock-cart wheel', 'wooden hub, twelve tapered spokes, six felloes and an iron tyre, as on a Bangladeshi গরুর গাড়ি', 'Discovery → আবিষ্কার ও আবিষ্কারক → চাকা', cartWheel],
  ['posora_quartz_cluster_01', 'quartz-cluster.glb', 'Quartz crystal cluster', 'six-sided quartz prisms with pyramidal (rhombohedral) tips growing from a rock matrix', 'Discovery → পৃথিবী ও ভূতত্ত্ব → খনিজ', quartzCluster],
];
for (const [directory, filename, name, features, role, build] of assets) {
  await writeAsset({
    directory, filename, scene: build(),
    manifest: {
      name, subject: features, creator: 'Posora.com', license: 'CC0 1.0 Universal', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      source: 'Original deterministic Three.js geometry generated by scripts/generate-original-wheel-mineral-models.mjs; not a scan.',
      createdDate: CREATED, qualityTier: 'accurate-authored', educationalRole: role,
      limitations: ['Authored model, not a scan of a particular object.', 'Not to scale; real cart wheels and crystals vary in size, wood, colour and proportion.'],
    },
    license: `# ${name}\n\n- Creator/source: Posora.com original asset\n- Generator: \`scripts/generate-original-wheel-mineral-models.mjs\`\n- License: CC0 1.0 Universal — https://creativecommons.org/publicdomain/zero/1.0/\n- Created: ${CREATED}\n\nAn original model built from the object's construction/crystal geometry; not a scan.\n`,
    readme: `# ${name}\n\n${features[0].toUpperCase()}${features.slice(1)}.\n\nSee \`asset-manifest.json\` and \`SOURCE-LICENSE.md\`.\n`,
  });
}
