import { BufferGeometry, Color, CylinderGeometry, DoubleSide, Float32BufferAttribute, IcosahedronGeometry, LatheGeometry, Matrix4, SphereGeometry, TorusGeometry, Vector2, Vector3 } from 'three';
import { Batch, blade, col, compose, displace, fbm, material, mix, noise3, seeded, taperedTube, writeAsset } from './lib/procedural-kit.mjs';

/**
 * Posora-original Bangla dish models, generation 2 (CC0).
 *
 * The first generation scattered a few hundred separate capsules over a plate
 * and called it rice. These are built the way the food is: a rice mound is a
 * soft dome covered in individual long grains; dal is a liquid with a
 * meniscus and its tempering floating on top; bhorta is a hand-pressed mound
 * with chilli and coriander flecks; each pitha, sweet and iftar item has its
 * own recognisable shape. Each remains one representative serving: recipes,
 * colours and presentation vary between families and regions.
 */
const CREATED = '2026-10-28';
const v3 = (x, y, z) => new Vector3(x, y, z);

/* ---------- serving ware ---------- */
function lathe(batch, key, profile, paint, segments = 64, at = [0, 0, 0]) {
  const g = new LatheGeometry(profile.map(([x, y]) => new Vector2(x, y)), segments);
  batch.add(key, g, compose(at), paint);
}
const plate = (batch, radius = 1, at = [0, 0, 0], tone = '#ece6da') => lathe(batch, 'plate', [[0, 0.012], [radius * 0.62, 0.012], [radius * 0.7, 0.03], [radius * 0.92, 0.075], [radius, 0.1], [radius * 1.005, 0.088], [radius * 0.94, 0.05], [radius * 0.72, 0.0], [0, 0.0]], (p) => mix(col(tone), col('#cfc6b5'), Math.max(0, Math.hypot(p.x, p.z) / radius - 0.85) * 3), 72, at);
/** Glazed ceramic, steel or clay bowl; the rim is rolled, the base has a foot. */
function bowl(batch, { radius = 0.72, height = 0.5, at = [0, 0, 0], kind = 'ceramic' } = {}) {
  const tones = { ceramic: ['#2f5a5c', '#4d7a76'], steel: ['#9aa0a3', '#c9cdce'], clay: ['#8a4a2c', '#a8623a'] }[kind];
  const key = kind === 'steel' ? 'steel' : kind === 'clay' ? 'clay' : 'ceramic';
  const outer = [[0, 0.0], [radius * 0.42, 0.0], [radius * 0.44, 0.04], [radius * 0.58, 0.07], [radius * 0.86, height * 0.42], [radius * 0.98, height * 0.86], [radius, height], [radius * 0.985, height * 1.02], [radius * 0.94, height * 0.96], [radius * 0.84, height * 0.5], [radius * 0.55, height * 0.16], [0, height * 0.13]];
  lathe(batch, key, outer, (p) => {
    const n = kind === 'clay' ? fbm(p.x * 14, p.y * 14, p.z * 14, 2) * 0.12 : 0;
    return mix(col(tones[0]), col(tones[1]), p.y / height * 0.7 + n);
  }, 72, at);
}
/** A height field over a disc: mounds of rice, bhorta, halwa-thick stews. */
function mound(batch, key, { radius, height: h, at = [0, 0, 0], shape = (r) => Math.pow(Math.max(0, 1 - r * r), 0.75), rough = 0.02, freq = 9, seed = 1, paint, rings = 18, spokes = 56, squash = 1 }) {
  const positions = [], colors = [], index = [];
  for (let i = 0; i <= rings; i += 1) {
    const t = i / rings;
    for (let j = 0; j <= spokes; j += 1) {
      const a = (j / spokes) * Math.PI * 2, edge = 1 + fbm(Math.cos(a) * 2 + seed, Math.sin(a) * 2, seed, 2) * 0.1;
      const x = Math.cos(a) * radius * t * edge, z = Math.sin(a) * radius * t * edge * squash;
      const y = h * shape(t) + (t < 1 ? fbm(x * freq + seed, z * freq, seed * 1.7, 3) * rough * (1 - t * 0.6) : 0);
      positions.push(at[0] + x, at[1] + y, at[2] + z);
      const c = paint(x, y, z, t); colors.push(c.r, c.g, c.b);
    }
  }
  const row = spokes + 1;
  for (let i = 0; i < rings; i += 1) for (let j = 0; j < spokes; j += 1) { const a = i * row + j, b = a + row; index.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(positions, 3)); g.setAttribute('color', new Float32BufferAttribute(colors, 3)); g.setIndex(index); g.computeVertexNormals();
  batch.addColored(key, g, null);
  // surface sampler so grains and garnish sit on the mound, not in the air
  return (x, z) => { const t = Math.min(1, Math.hypot(x, z / squash) / radius); return at[1] + h * shape(t); };
}
/** Place small items over a surface, lying along it. */
function scatter(batch, key, geometry, { count, radius, at = [0, 0, 0], surface, random, size = [1, 1, 1], paint, lift = 0, tilt = 0.5, squash = 1 }) {
  for (let i = 0; i < count; i += 1) {
    const a = random(0, Math.PI * 2), r = radius * Math.sqrt(random()), x = Math.cos(a) * r, z = Math.sin(a) * r * squash;
    const y = surface(x, z) + lift;
    const s = Array.isArray(size) ? size.map((v) => v * random(0.8, 1.15)) : size;
    batch.add(key, geometry.clone(), compose([at[0] + x, y, at[2] + z], [random(-tilt, tilt), random(0, Math.PI * 2), random(-tilt, tilt)], s), (p) => paint(p, i));
  }
}
/** One cooked rice grain: long, slightly bent, a little translucent. */
const grain = () => new SphereGeometry(1, 7, 4);
const riceWhite = (random) => () => mix(col('#f3eee2'), col('#ddd3bd'), random(0, 0.5));
/** A liquid surface inside a bowl, with a meniscus rising at the wall. */
function liquid(batch, key, { radius, y, at = [0, 0, 0], paint, ripple = 0.004 }) {
  return mound(batch, key, { radius, height: 0.0, at: [at[0], at[1] + y, at[2]], shape: (t) => 0.018 * Math.pow(t, 6), rough: ripple, freq: 6, paint, rings: 12 });
}
const greenChilli = (batch, from, to, bend = 0.04) => {
  const mid = from.clone().lerp(to, 0.5).add(v3(0, bend, 0));
  batch.addColored('garnish', taperedTube([from, mid, to], (u) => 0.022 * Math.sin(Math.PI * Math.min(1, 0.08 + u * 0.95)) + 0.003, { tubular: 12, radial: 8, paint: (u) => (u < 0.08 ? col('#6e7d3a') : mix(col('#2f7a2e'), col('#4c9a3a'), u)) }).geometry, null);
};
const onionSlices = (batch, random, centre, count, radius = 0.06) => {
  for (let i = 0; i < count; i += 1) {
    const ring = new TorusGeometry(radius * random(0.6, 1), 0.007, 5, 18, Math.PI * random(1.1, 2));
    batch.add('garnish', ring, compose([centre.x + random(-0.08, 0.08), centre.y + 0.006 * i, centre.z + random(-0.08, 0.08)], [Math.PI / 2 + random(-0.2, 0.2), 0, random(0, 6)]), () => mix(col('#c76a8a'), col('#f0dce4'), random(0, 0.6)));
  }
};
const herbLeaf = blade({ length: 1, halfWidth: (u) => 0.4 * Math.sin(Math.PI * u) * (1 + 0.15 * Math.sin(u * 18)), segments: 5, across: 1, fold: 0.1, arch: 0.1, upper: col('#2f7a35'), lower: col('#3f8a42') });
const herbs = (batch, random, surface, radius, at, count) => {
  for (let i = 0; i < count; i += 1) {
    const a = random(0, Math.PI * 2), r = radius * Math.sqrt(random()), x = at[0] + Math.cos(a) * r, z = at[2] + Math.sin(a) * r;
    const m = compose([x, surface(x - at[0], z - at[2]) + 0.006, z], [random(-0.3, 0.3), random(0, 6.3), random(-0.3, 0.3)], 0.045);
    batch.addColored('garnish', herbLeaf.upper.clone(), m);
  }
};
const MATERIALS = {
  plate: material('glazed white plate', { roughness: 0.28, clearcoat: 0.6 }),
  ceramic: material('glazed ceramic bowl', { roughness: 0.25, clearcoat: 0.7 }),
  steel: material('stainless steel', { roughness: 0.22, clearcoat: 0.4 }),
  clay: material('unglazed terracotta', { roughness: 0.9 }),
  rice: material('cooked rice', { roughness: 0.55, clearcoat: 0.2 }),
  food: material('cooked food surface', { roughness: 0.6, clearcoat: 0.2 }),
  liquid: material('liquid surface', { roughness: 0.12, clearcoat: 0.9 }),
  syrup: material('sugar syrup', { roughness: 0.05, clearcoat: 1, opacity: 0.72 }),
  water: material('soaking water', { roughness: 0.05, clearcoat: 1, opacity: 0.55 }),
  fried: material('fried batter', { roughness: 0.62, clearcoat: 0.25 }),
  garnish: material('garnish', { roughness: 0.55, clearcoat: 0.15, side: DoubleSide }),
  sweet: material('chhana sweets', { roughness: 0.48, clearcoat: 0.35 }),
};
const used = (batch) => Object.fromEntries([...batch.parts.keys()].map((k) => [k, MATERIALS[k]]));

/* ---------- ভাত ও ডাল ---------- */
function riceDal() {
  const random = seeded(0x71ce2), batch = new Batch();
  plate(batch, 1.05);
  const at = [-0.3, 0.06, 0.02];
  const surface = mound(batch, 'rice', { radius: 0.5, height: 0.34, at, rough: 0.025, paint: () => col('#ebe5d6'), seed: 2 });
  scatter(batch, 'rice', grain(), { count: 620, radius: 0.5, at, surface: (x, z) => surface(x, z) - 0.004, random, size: [0.011, 0.009, 0.033], paint: riceWhite(random), tilt: 0.35 });
  bowl(batch, { radius: 0.36, height: 0.25, at: [0.52, 0.04, 0.08], kind: 'steel' });
  const dalAt = [0.52, 0.04, 0.08];
  const dal = liquid(batch, 'liquid', { radius: 0.33, y: 0.2, at: dalAt, paint: (x, y, z) => mix(col('#d79a2a'), col('#e9b443'), fbm(x * 9, z * 9, 3) * 0.5 + 0.5) });
  // tempering (phoron): cumin seeds, fried garlic, a dried red chilli
  scatter(batch, 'garnish', grain(), { count: 28, radius: 0.24, at: dalAt, surface: () => dal(0, 0) + 0.004, random, size: [0.006, 0.004, 0.018], paint: () => col('#4a3624'), tilt: 0.1 });
  scatter(batch, 'garnish', new IcosahedronGeometry(1, 0), { count: 7, radius: 0.2, at: dalAt, surface: () => dal(0, 0) + 0.006, random, size: [0.018, 0.008, 0.014], paint: () => col('#b07a34'), tilt: 0.2 });
  batch.addColored('garnish', taperedTube([v3(0.44, dal(0, 0) + dalAt[1] * 0 + 0.012, 0.02), v3(0.5, dal(0, 0) + 0.018, 0.05), v3(0.58, dal(0, 0) + 0.012, 0.1)], (u) => 0.012 * Math.sin(Math.PI * Math.min(1, 0.1 + u)), { tubular: 8, radial: 6, paint: () => col('#8e1c12') }).geometry, null);
  herbs(batch, random, () => dal(0, 0) + 0.002, 0.2, dalAt, 6);
  greenChilli(batch, v3(-0.1, 0.11, -0.62), v3(0.3, 0.1, -0.5));
  return batch.build('rice-and-dal-serving', used(batch));
}

/* ---------- ভর্তা ---------- */
function bhorta() {
  const random = seeded(0xb4072), batch = new Batch();
  plate(batch, 1.05);
  // three hand-pressed mounds: potato (aloo), roasted aubergine (begun) and
  // tomato bhorta, each flecked with chilli, onion and coriander
  const kinds = [
    { at: [-0.42, 0.06, 0.2], base: '#e2c879', fleck: ['#2f7a35', '#b3252a', '#d78a9c'] },
    { at: [0.38, 0.06, 0.24], base: '#6b5a42', fleck: ['#2f7a35', '#2a2018', '#c9b28a'] },
    { at: [0.0, 0.06, -0.4], base: '#c4452a', fleck: ['#2f7a35', '#7a1c14', '#e7b04a'] },
  ];
  kinds.forEach((k, i) => {
    const surface = mound(batch, 'food', { radius: 0.3, height: 0.2, at: k.at, rough: 0.04, freq: 14, seed: 4 + i, shape: (t) => Math.pow(Math.max(0, 1 - t * t), 0.55), paint: (x, y, z) => {
      const f = noise3(x * 70 + i, y * 70, z * 70);
      if (f > 0.62) return col(k.fleck[0]); if (f < -0.66) return col(k.fleck[1]); if (Math.abs(f) < 0.025) return col(k.fleck[2]);
      return mix(col(k.base), col(k.base).multiplyScalar(0.8), fbm(x * 20, y * 20, z * 20) * 0.5 + 0.5);
    } });
    herbs(batch, random, surface, 0.18, k.at, 4);
  });
  greenChilli(batch, v3(0.36, 0.11, -0.34), v3(0.68, 0.1, -0.12));
  onionSlices(batch, random, v3(-0.6, 0.1, -0.3), 3);
  return batch.build('bhorta-assortment', used(batch));
}

/* ---------- খিচুড়ি ---------- */
function khichuri() {
  const random = seeded(0x4b1c2), batch = new Batch();
  bowl(batch, { radius: 0.78, height: 0.48, kind: 'ceramic' });
  const at = [0, 0.3, 0];
  const surface = mound(batch, 'rice', { radius: 0.66, height: 0.2, at, rough: 0.025, paint: () => col('#d9a73a'), seed: 6, shape: (t) => Math.pow(Math.max(0, 1 - t * t), 0.5) });
  // turmeric-yellow rice with split red-lentil (masoor) and moong grains
  scatter(batch, 'rice', grain(), { count: 700, radius: 0.63, at, surface: (x, z) => surface(x, z) - 0.004, random, size: [0.011, 0.009, 0.03], paint: () => mix(col('#e4b23a'), col('#c98a22'), random(0, 1)), tilt: 0.35 });
  scatter(batch, 'rice', new SphereGeometry(1, 6, 3), { count: 160, radius: 0.62, at, surface: (x, z) => surface(x, z), random, size: [0.014, 0.006, 0.014], paint: () => (random() < 0.5 ? col('#d9762e') : col('#c9b03a')), tilt: 0.4 });
  // vegetables: potato cubes, green peas, carrot, cauliflower florets
  scatter(batch, 'food', displace(new IcosahedronGeometry(1, 1), 0.08, 3), { count: 14, radius: 0.55, at, surface: (x, z) => surface(x, z) + 0.01, random, size: [0.05, 0.045, 0.05], paint: () => col('#e2c46a') });
  scatter(batch, 'garnish', new SphereGeometry(1, 8, 6), { count: 26, radius: 0.6, at, surface: (x, z) => surface(x, z) + 0.012, random, size: 0.02, paint: () => col('#5a9a3a') });
  scatter(batch, 'food', new CylinderGeometry(1, 1, 1, 10), { count: 12, radius: 0.55, at, surface: (x, z) => surface(x, z) + 0.008, random, size: [0.03, 0.012, 0.03], paint: () => col('#e2742a') });
  herbs(batch, random, surface, 0.5, at, 10);
  greenChilli(batch, v3(-0.25, surface(0, 0) + 0.02, 0.1), v3(0.15, surface(0, 0) + 0.01, 0.3), 0.02);
  return batch.build('vegetable-khichuri', used(batch));
}

/* ---------- পিঠা ---------- */
function pitha() {
  const random = seeded(0xb17a2), batch = new Batch();
  // white rice-flour pitha read best on a kansa (bell-metal) plate
  plate(batch, 1.1, [0, 0, 0], '#b99252');
  // bhapa pitha: a steamed rice-flour cake with date-palm jaggery and
  // coconut inside; one is broken open to show the filling
  for (let i = 0; i < 3; i += 1) {
    const x = -0.52 + i * 0.27, z = 0.36;
    const surf = mound(batch, 'food', { radius: 0.13, height: 0.11, at: [x, 0.06, z], rough: 0.012, freq: 30, seed: 10 + i, shape: (t) => Math.pow(Math.max(0, 1 - Math.pow(t, 4)), 0.4), paint: (px, py, pz) => mix(col('#f4efe4'), col('#e2d8c4'), fbm(px * 40, py * 40, pz * 40) * 0.5 + 0.5), rings: 10, spokes: 36 });
    if (i === 2) mound(batch, 'food', { radius: 0.06, height: 0.03, at: [x, surf(0, 0) - 0.01, z], rough: 0.01, freq: 40, seed: 30, paint: () => col('#6a3418'), rings: 6, spokes: 24 });
  }
  // patishapta: thin rolled crêpes with the filling showing at the ends
  for (let i = 0; i < 3; i += 1) {
    const z = -0.26 + i * 0.05, x0 = -0.62 + i * 0.03, x1 = -0.1 + i * 0.02, y = 0.1 + i * 0.002;
    batch.addColored('fried', taperedTube([v3(x0, y, z - i * 0.12), v3((x0 + x1) / 2, y + 0.006, z - i * 0.12), v3(x1, y, z - i * 0.12)], () => 0.05, { tubular: 10, radial: 14, paint: (u, a, p) => mix(col('#f0dfba'), col('#c89a5a'), Math.max(0, noise3(p.x * 40, p.y * 40, p.z * 40) - 0.2) * 1.6) }).geometry, null);
    for (const xe of [x0, x1]) batch.add('food', new CylinderGeometry(0.035, 0.035, 0.004, 14), compose([xe + (xe === x0 ? -0.002 : 0.002), y, z - i * 0.12], [0, 0, Math.PI / 2]), () => col('#d9c79a'));
  }
  // chitoi pitha: shallow cups cooked in a clay mould, dimpled and browned
  for (let i = 0; i < 2; i += 1) mound(batch, 'fried', { radius: 0.15, height: 0.045, at: [0.32 + i * 0.3, 0.06, -0.22], rough: 0.01, freq: 50, seed: 40 + i, shape: (t) => 1 - Math.pow(t, 5), paint: (x, y, z) => mix(col('#f3ead6'), col('#cfa56a'), Math.max(0, noise3(x * 60 + i, z * 60, i) * 0.8 + 0.1)), rings: 10, spokes: 40 });
  // puli: half-moon dumplings with a pleated edge
  for (let i = 0; i < 3; i += 1) {
    const cx = 0.3 + i * 0.2, cz = 0.32 + (i % 2) * 0.06, len = 0.12;
    const { geometry } = taperedTube([v3(cx - len, 0.08, cz), v3(cx - len * 0.4, 0.12, cz + 0.035), v3(cx + len * 0.4, 0.12, cz + 0.035), v3(cx + len, 0.08, cz)], (u) => 0.055 * Math.pow(Math.sin(Math.PI * u), 0.7) + 0.006, { tubular: 16, radial: 12, paint: () => col('#f2ead8') });
    batch.addColored('food', geometry, null);
    for (let k = 0; k < 9; k += 1) { const t = 0.1 + k * 0.1, x = cx - len + t * 2 * len; batch.add('food', new SphereGeometry(0.012, 6, 4), compose([x, 0.13 + Math.sin(Math.PI * t) * 0.04, cz + 0.035], [0, 0, 0], [1, 0.6, 1.3]), () => col('#e6dcc6')); }
  }
  return batch.build('pitha-assortment', used(batch));
}

/* ---------- পায়েস ---------- */
function payesh() {
  const random = seeded(0xfae52), batch = new Batch();
  bowl(batch, { radius: 0.74, height: 0.46, kind: 'clay' });
  const at = [0, 0.38, 0];
  const surface = mound(batch, 'food', { radius: 0.69, height: 0.0, at, shape: (t) => 0.02 * Math.pow(t, 4), rough: 0.012, freq: 5, seed: 3, paint: (x, y, z) => mix(col('#efe1c2'), col('#dcc59a'), fbm(x * 6, z * 6, 2) * 0.5 + 0.5 + Math.hypot(x, z) * 0.3) });
  // grains of gobindobhog rice just breaking the thickened milk
  scatter(batch, 'rice', grain(), { count: 260, radius: 0.64, at, surface: (x, z) => surface(x, z) - 0.006, random, size: [0.008, 0.006, 0.02], paint: () => mix(col('#f7f0de'), col('#e8dcc0'), random()), tilt: 0.2 });
  scatter(batch, 'garnish', displace(new SphereGeometry(1, 8, 6), 0.25, 4), { count: 14, radius: 0.5, at, surface: (x, z) => surface(x, z) + 0.006, random, size: [0.022, 0.014, 0.016], paint: () => col('#4a2a24'), tilt: 0.3 });
  scatter(batch, 'garnish', new SphereGeometry(1, 10, 6, 0, Math.PI), { count: 10, radius: 0.5, at, surface: (x, z) => surface(x, z) + 0.008, random, size: [0.04, 0.012, 0.02], paint: () => col('#e6cf9a'), tilt: 0.1 });
  // a tejpata (Indian bay leaf) and a cardamom pod, as in many homes
  const bay = blade({ length: 1, halfWidth: (u) => 0.22 * Math.sin(Math.PI * Math.pow(u, 0.9)), segments: 8, across: 2, fold: 0.06, arch: 0.04, upper: col('#7a7a3a'), lower: col('#8a8848'), rib: col('#b8b27a') });
  batch.addColored('garnish', bay.upper, compose([0.12, surface(0, 0) + 0.012, -0.08], [-0.05, 0.8, 0], 0.24));
  batch.add('garnish', new SphereGeometry(1, 8, 6), compose([-0.18, surface(0, 0) + 0.014, 0.16], [0, 0.4, 0], [0.04, 0.02, 0.022]), () => col('#8aa04a'));
  return batch.build('rice-payesh', used(batch));
}

/* ---------- মিষ্টি ---------- */
function sweets() {
  const random = seeded(0x5ee72), batch = new Batch();
  plate(batch, 1.1, [0, 0, 0], '#b99252');
  // roshogolla: spongy chhana balls in a small bowl of light syrup
  bowl(batch, { radius: 0.36, height: 0.22, at: [-0.48, 0.03, 0.26], kind: 'steel' });
  for (let i = 0; i < 3; i += 1) { const a = i * 2.1; batch.add('sweet', displace(new SphereGeometry(0.1, 20, 14), 0.006, 40, i), compose([-0.48 + Math.cos(a) * 0.13, 0.17, 0.26 + Math.sin(a) * 0.13]), (p) => mix(col('#fbf6ea'), col('#ece0c6'), noise3(p.x * 60, p.y * 60, p.z * 60) * 0.5 + 0.5)); }
  liquid(batch, 'syrup', { radius: 0.33, y: 0.15, at: [-0.48, 0.03, 0.26], paint: () => col('#f2e6c2') });
  // kalojam: fried dark oblong sweets, glossy with syrup
  for (let i = 0; i < 3; i += 1) batch.add('sweet', displace(new SphereGeometry(0.075, 20, 12), 0.004, 50, i + 4), compose([0.18 + i * 0.17, 0.15, 0.36 - i * 0.05], [0, 0.6 + i * 0.3, 0], [1.45, 0.95, 1]), (p) => mix(col('#24120c'), col('#4a2416'), noise3(p.x * 70, p.y * 70, p.z * 70) * 0.5 + 0.5));
  // chomchom: oblong, rosy-brown, dusted with mawa crumbs
  for (let i = 0; i < 2; i += 1) {
    const at = [0.36 + i * 0.22, 0.15, -0.18 - i * 0.06];
    batch.add('sweet', displace(new SphereGeometry(0.07, 20, 12), 0.006, 30, i + 9), compose(at, [0, 0.4 + i * 0.5, 0], [1.7, 0.95, 1]), (p) => mix(col('#c9775a'), col('#a8553e'), Math.abs(p.x) * 6));
    scatter(batch, 'sweet', new IcosahedronGeometry(1, 0), { count: 40, radius: 0.08, at, surface: () => at[1] + 0.06, random, size: 0.008, paint: () => col('#f3e8cf') });
  }
  // sandesh: pressed chhana discs with a moulded pattern
  for (let i = 0; i < 3; i += 1) mound(batch, 'sweet', { radius: 0.1, height: 0.06, at: [-0.32 + i * 0.22, 0.06, -0.4], shape: (t) => (1 - Math.pow(t, 6)) * (0.85 + 0.15 * Math.cos(t * Math.PI * 4)), rough: 0.002, freq: 30, seed: 20 + i, paint: (x, y, z) => mix(col('#f1e2b8'), col('#e2c88e'), Math.hypot(x, z) * 8), rings: 10, spokes: 36 });
  return batch.build('bangla-sweets', used(batch));
}

/* ---------- হালিম ---------- */
function haleem() {
  const random = seeded(0xa1122), batch = new Batch();
  bowl(batch, { radius: 0.76, height: 0.46, kind: 'ceramic' });
  const at = [0, 0.32, 0];
  // thick, slow-cooked wheat-lentil-meat porridge with a little oil on top
  const surface = mound(batch, 'food', { radius: 0.65, height: 0.12, at, rough: 0.035, freq: 7, seed: 9, shape: (t) => Math.pow(Math.max(0, 1 - t * t), 0.4), paint: (x, y, z) => mix(mix(col('#7a4a26'), col('#9a6432'), fbm(x * 10, z * 10, 3) * 0.5 + 0.5), col('#c0702a'), Math.max(0, noise3(x * 8, z * 8, 5) - 0.45) * 2) });
  // birista (crisp fried onion), ginger julienne, green chilli, coriander
  for (let i = 0; i < 44; i += 1) { const a = random(0, 6.3), r = 0.45 * Math.sqrt(random()), x = Math.cos(a) * r, z = Math.sin(a) * r, y = surface(x, z) + 0.008; batch.add('garnish', new TorusGeometry(0.025, 0.005, 4, 10, random(2, 4)), compose([x, y, z], [Math.PI / 2 + random(-0.3, 0.3), 0, random(0, 6)]), () => mix(col('#5a2a10'), col('#9a5a22'), random())); }
  for (let i = 0; i < 16; i += 1) { const a = random(0, 6.3), r = 0.4 * Math.sqrt(random()), x = Math.cos(a) * r, z = Math.sin(a) * r; batch.add('garnish', new CylinderGeometry(0.004, 0.004, 0.08, 4), compose([x, surface(x, z) + 0.01, z], [Math.PI / 2, random(0, 6), 0]), () => col('#efd99a')); }
  for (let i = 0; i < 6; i += 1) { const a = random(0, 6.3), r = 0.35 * Math.sqrt(random()), x = Math.cos(a) * r, z = Math.sin(a) * r; batch.add('garnish', new TorusGeometry(0.016, 0.006, 6, 14), compose([x, surface(x, z) + 0.01, z], [Math.PI / 2, 0, 0]), () => col('#3a8a34')); }
  herbs(batch, random, surface, 0.4, [0, 0, 0], 12);
  // a lime wedge on the rim
  batch.add('garnish', new SphereGeometry(0.09, 16, 10, 0, Math.PI, 0, Math.PI / 2), compose([0.62, 0.48, 0.2], [0, -0.4, Math.PI / 2]), (p) => (p.length() > 0.085 ? col('#4f9a2a') : col('#d7e89a')));
  return batch.build('haleem', used(batch));
}

/* ---------- ইফতার ---------- */
function iftar() {
  const random = seeded(0x1f7a2), batch = new Batch();
  plate(batch, 1.18);
  // dates: wrinkled, glossy, oblong
  for (let i = 0; i < 5; i += 1) { const a = 2.4 + i * 0.32; batch.add('fried', displace(new SphereGeometry(0.085, 16, 10), 0.008, 35, i), compose([Math.cos(a) * 0.7, 0.15, Math.sin(a) * 0.7], [0, a, Math.PI / 2], [1.7, 1, 1]), (p) => mix(col('#3a160e'), col('#6a2a16'), noise3(p.x * 90, p.y * 90, p.z * 90) * 0.5 + 0.5)); }
  // piyaju: crisp lentil-onion fritters
  for (let i = 0; i < 4; i += 1) { const a = 0.3 + i * 0.42; batch.add('fried', displace(new SphereGeometry(0.11, 16, 10), 0.02, 18, i + 7), compose([Math.cos(a) * 0.66, 0.14, Math.sin(a) * 0.66], [0, 0, 0], [1, 0.6, 1]), (p) => mix(col('#b8722a'), col('#e0a24a'), noise3(p.x * 50, p.y * 50, p.z * 50) * 0.5 + 0.5)); }
  // beguni: battered aubergine slices
  for (let i = 0; i < 3; i += 1) { const a = 4.2 + i * 0.38; batch.add('fried', displace(new SphereGeometry(0.13, 18, 10), 0.012, 16, i + 12), compose([Math.cos(a) * 0.64, 0.12, Math.sin(a) * 0.64], [0, a + 1.4, 0], [1.9, 0.28, 0.75]), (p) => mix(col('#d39a3c'), col('#eec46a'), noise3(p.x * 40, p.y * 40, p.z * 40) * 0.5 + 0.5)); }
  // jilapi: deep-fried orange spirals soaked in syrup
  for (let j = 0; j < 2; j += 1) {
    const pts = []; for (let k = 0; k <= 40; k += 1) { const t = k / 40, r = 0.018 + t * 0.12, a = t * Math.PI * 5.2; pts.push(v3(-0.16 + j * 0.32 + Math.cos(a) * r, 0.12 + j * 0.01, -0.62 + Math.sin(a) * r)); }
    batch.addColored('fried', taperedTube(pts, () => 0.017, { tubular: 80, radial: 6, paint: (u, a, p) => mix(col('#e2781a'), col('#f4a230'), noise3(p.x * 80, p.y * 80, p.z * 80) * 0.5 + 0.5) }).geometry, null);
  }
  // chola: spiced chickpeas in a small bowl at the centre
  bowl(batch, { radius: 0.3, height: 0.18, at: [0, 0.05, 0.05], kind: 'steel' });
  const at = [0, 0.11, 0.05];
  const surf = mound(batch, 'food', { radius: 0.27, height: 0.08, at, rough: 0.01, paint: () => col('#a9702e'), seed: 15 });
  scatter(batch, 'food', displace(new SphereGeometry(1, 10, 8), 0.1, 3), { count: 60, radius: 0.25, at, surface: (x, z) => surf(x, z) + 0.008, random, size: 0.026, paint: () => mix(col('#c99a50'), col('#a8763a'), random()) });
  onionSlices(batch, random, v3(0, surf(0, 0) + 0.02, 0.05), 3, 0.04);
  herbs(batch, random, (x, z) => surf(x, z) + 0.015, 0.15, at, 5);
  return batch.build('iftar-assortment', used(batch));
}

/* ---------- পান্তা ভাত ---------- */
function panta() {
  const random = seeded(0xfa472), batch = new Batch();
  // a clay sanki, the traditional bowl for panta
  bowl(batch, { radius: 0.74, height: 0.44, kind: 'clay' });
  const at = [0, 0.2, 0];
  const surface = mound(batch, 'rice', { radius: 0.6, height: 0.08, at, rough: 0.02, paint: () => col('#e8e2d2'), seed: 3, shape: (t) => Math.pow(Math.max(0, 1 - t * t), 0.6) });
  scatter(batch, 'rice', grain(), { count: 560, radius: 0.58, at, surface: (x, z) => surface(x, z) - 0.004, random, size: [0.012, 0.01, 0.034], paint: () => mix(col('#f4f0e4'), col('#dcd6c4'), random()), tilt: 0.4 });
  // rice soaked overnight: the water stands just above the grains
  liquid(batch, 'water', { radius: 0.69, y: 0.34, at: [0, 0, 0], paint: () => col('#e6ecd8') });
  // floating rice grains, a green chilli, raw onion and a pinch of salt
  scatter(batch, 'rice', grain(), { count: 40, radius: 0.55, at: [0, 0, 0], surface: () => 0.342, random, size: [0.011, 0.006, 0.032], paint: () => col('#f4f0e4'), tilt: 0.05 });
  greenChilli(batch, v3(-0.25, 0.36, -0.1), v3(0.1, 0.365, 0.12), 0.015);
  onionSlices(batch, random, v3(0.25, 0.355, -0.2), 4, 0.07);
  for (let i = 0; i < 30; i += 1) batch.add('garnish', new IcosahedronGeometry(0.006, 0), compose([0.62 + random(-0.03, 0.03), 0.455, -0.2 + random(-0.03, 0.03)]), () => col('#ffffff'));
  return batch.build('panta-rice', used(batch));
}

const assets = [
  ['posora_rice_dal_01', 'rice-and-dal.glb', 'Rice and dal serving', 'steamed rice mound of individual grains beside masoor dal with cumin, garlic and dried-chilli tempering', 'riceDal', riceDal],
  ['posora_bhorta_01', 'bhorta-assortment.glb', 'Bhorta assortment', 'hand-pressed aloo, begun and tomato bhorta flecked with chilli, onion and coriander', 'bhorta', bhorta],
  ['posora_khichuri_01', 'vegetable-khichuri.glb', 'Vegetable khichuri', 'turmeric rice cooked with masoor and moong dal, potato, peas, carrot and coriander', 'khichuri', khichuri],
  ['posora_pitha_01', 'pitha-assortment.glb', 'Pitha assortment', 'bhapa pitha with jaggery filling, rolled patishapta, chitoi pitha and pleated puli', 'pitha', pitha],
  ['posora_payesh_01', 'rice-payesh.glb', 'Rice payesh', 'rice cooked in thickened milk in a clay bowl, with raisins, cashew, tejpata and cardamom', 'payesh', payesh],
  ['posora_sweets_01', 'bangla-sweets.glb', 'Bangla sweet assortment', 'roshogolla in syrup, kalojam, mawa-dusted chomchom and moulded sandesh', 'sweet', sweets],
  ['posora_haleem_01', 'haleem.glb', 'Haleem serving', 'thick wheat-lentil-meat haleem with birista, ginger, green chilli, coriander and lime', 'haleem', haleem],
  ['posora_iftar_01', 'iftar-assortment.glb', 'Iftar assortment', 'a Bangladeshi iftar plate with dates, piyaju, beguni, jilapi and chola', 'dateBowl', iftar],
  ['posora_panta_01', 'panta-rice.glb', 'Panta rice', 'overnight-soaked rice in a clay sanki with green chilli, raw onion and salt', 'panta', panta],
];
for (const [directory, filename, name, features, figure, build] of assets) {
  await writeAsset({
    directory, filename, scene: build(),
    manifest: {
      name, subject: `Representative serving: ${features}`, creator: 'Posora.com', license: 'CC0 1.0 Universal', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      source: 'Original deterministic Three.js geometry generated by scripts/generate-original-bangla-food-models.mjs; not a scan or third-party marketplace model.',
      createdDate: CREATED, qualityTier: 'teaching-diagram', educationalRole: `Representative dish illustration for Food → ${figure}; shown beside an exact reference photograph.`,
      limitations: ['Original illustration, not a food scan.', 'One representative serving: recipes, colours, garnish and presentation vary between families and regions.', 'Garnish pieces are slightly enlarged for visibility.'],
    },
    license: `# ${name}\n\n- Creator/source: Posora.com original asset\n- Generator: \`scripts/generate-original-bangla-food-models.mjs\`\n- License: CC0 1.0 Universal — https://creativecommons.org/publicdomain/zero/1.0/\n- Created: ${CREATED}\n\nAn original illustrative teaching model, not a scan or a claim that every recipe looks the same.\n`,
    readme: `# ${name}\n\n${features[0].toUpperCase()}${features.slice(1)}.\n\nSee \`asset-manifest.json\` and \`SOURCE-LICENSE.md\`. Shown on https://posora.com/food/ with an exact reference photograph.\n`,
  });
}
