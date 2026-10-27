import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, IcosahedronGeometry, Matrix4, SphereGeometry, Vector3 } from 'three';
import { Batch, alongY, blade, col, compose, displace, fbm, material, mix, noise3, polarBlade, seeded, taperedTube, writeAsset } from './lib/procedural-kit.mjs';

/**
 * Posora-original botanical teaching models, generation 2.
 *
 * Each plant is built from the features a field guide uses to tell it apart,
 * not from a generic tree: sundari's peg-like breathing roots and silvery leaf
 * undersides, kadam's tiered horizontal branches and golden ball flowers,
 * hijal's hanging red flower strings over water, tossa jute's tall unbranched
 * stems, thankuni's creeping runners with kidney-shaped leaves, tal's fan
 * leaves and fruit bunches, golpata's stemless fronds and cardamom's two-ranked
 * leafy shoots with fruiting stems along the ground.
 *
 * They remain illustrations. Leaves, flowers and fruit are enlarged relative
 * to the plant so they are visible at lesson scale; that is stated in every
 * manifest and in the visible credit.
 */
const CREATED = '2026-10-28';

/* ---------- shared helpers ---------- */
const v3 = (x, y, z) => new Vector3(x, y, z);
/** Basis matrix: blade +Z along `dir`, upper surface toward `up`. */
function frame(origin, dir, up, scale = 1) {
  const z = dir.clone().normalize();
  let y = up.clone().sub(z.clone().multiplyScalar(up.dot(z)));
  if (y.lengthSq() < 1e-6) y = Math.abs(z.y) < 0.9 ? v3(0, 1, 0) : v3(1, 0, 0);
  y.normalize();
  const x = new Vector3().crossVectors(y, z).normalize();
  const m = new Matrix4().makeBasis(x.multiplyScalar(scale), y.multiplyScalar(scale), z.multiplyScalar(scale));
  m.setPosition(origin);
  return m;
}
/** Copy a coloured geometry, tinting it so repeated leaves are not identical. */
function tinted(geometry, factor, hue = null, hueAmount = 0) {
  const g = geometry.clone(), c = g.attributes.color, tmp = new Color();
  for (let i = 0; i < c.count; i += 1) {
    tmp.setRGB(c.getX(i), c.getY(i), c.getZ(i));
    if (hue) tmp.lerp(hue, hueAmount);
    tmp.multiplyScalar(factor);
    c.setXYZ(i, tmp.r, tmp.g, tmp.b);
  }
  return g;
}
/** A leaf placed with its petiole at `origin`. */
function addLeaf(batch, keys, leaf, origin, dir, up, scale, random, { hue = null, hueAmount = 0 } = {}) {
  const m = frame(origin, dir, up, scale), shade = random(0.82, 1.08);
  batch.addColored(keys[0], tinted(leaf.upper, shade, hue, hueAmount), m);
  if (keys[1]) batch.addColored(keys[1], tinted(leaf.lower, shade, hue, hueAmount), m);
}
/** Fissured bark shading: dark furrows running along the stem. */
const barkPaint = (base, furrow, lichen, seed = 0, ridges = 9) => (u, a, p) => {
  const n = noise3(a * ridges, p.y * 2.2 + seed, seed) * 0.5 + 0.5;
  const patch = fbm(p.x * 6 + seed, p.y * 3, p.z * 6, 2) * 0.5 + 0.5;
  let c = mix(base, furrow, Math.pow(n, 2.2));
  if (lichen) c = mix(c, lichen, Math.max(0, patch - 0.62) * 1.6);
  return c;
};
/** A ground disc on a polar grid with noise displacement and colour. */
function groundDisc(batch, key, { radius = 1.2, rings = 14, spokes = 64, height = 0.03, paint, seed = 1, y = 0, squash = 1 }) {
  const positions = [], colors = [], index = [];
  for (let i = 0; i <= rings; i += 1) {
    const t = i / rings;
    for (let j = 0; j <= spokes; j += 1) {
      const a = (j / spokes) * Math.PI * 2;
      const wobble = 1 + fbm(Math.cos(a) * 2 + seed, Math.sin(a) * 2, seed, 2) * 0.12;
      const r = radius * t * (i === rings ? wobble : 1), x = Math.cos(a) * r, z = Math.sin(a) * r * squash;
      const lift = (1 - t * t) * height + fbm(x * 4 + seed, z * 4, seed, 3) * height * 0.6 - (i === rings ? height * 0.8 : 0);
      positions.push(x, y + lift, z);
      const c = paint(x, z, t); colors.push(c.r, c.g, c.b);
    }
  }
  const row = spokes + 1;
  for (let i = 0; i < rings; i += 1) for (let j = 0; j < spokes; j += 1) { const a = i * row + j, b = a + row; index.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(positions, 3)); g.setAttribute('color', new Float32BufferAttribute(colors, 3)); g.setIndex(index); g.computeVertexNormals();
  batch.addColored(key, g, null);
}
/** A curved limb from `start` along `dir`, bending toward `tropism`. */
function limbPoints(start, dir, length, random, { tropism = v3(0, 0.25, 0), wobble = 0.08, steps = 4 } = {}) {
  const pts = [start.clone()], d = dir.clone().normalize(), p = start.clone();
  for (let i = 1; i <= steps; i += 1) {
    d.add(tropism.clone().multiplyScalar(1 / steps)).add(v3(random(-wobble, wobble), random(-wobble, wobble) * 0.5, random(-wobble, wobble))).normalize();
    p.add(d.clone().multiplyScalar(length / steps)); pts.push(p.clone());
  }
  return pts;
}
const tipOf = (pts) => pts[pts.length - 1];
const dirAt = (pts) => tipOf(pts).clone().sub(pts[pts.length - 2]).normalize();
const leafMaterials = (prefix, { roughness = 0.62, clearcoat = 0.12, sheen = 0, doubleSided = false } = {}) => ({
  [`${prefix}-leaf-upper`]: material(`${prefix} leaf upper surface`, { roughness, clearcoat, sheen, side: doubleSided ? DoubleSide : undefined }),
  ...(doubleSided ? {} : { [`${prefix}-leaf-lower`]: material(`${prefix} leaf lower surface`, { roughness: Math.min(1, roughness + 0.15) }) }),
});

/* ---------- সুন্দরী: Heritiera fomes ---------- */
function sundari() {
  const random = seeded(0x51da2), batch = new Batch();
  const mud = col('#4a4236'), wetMud = col('#2f2a24'), silt = col('#6b604c');
  groundDisc(batch, 'tidal-mud', { radius: 1.35, height: 0.05, seed: 3, paint: (x, z, t) => mix(mix(wetMud, mud, fbm(x * 5, z * 5, 1) * 0.5 + 0.5), silt, Math.max(0, t - 0.7) * 1.8) });
  // Pneumatophores: short, blunt breathing roots rising out of the mud in
  // dense ranks around the tree. The single strongest sundari/mangrove cue.
  const peg = col('#6f6455'), pegTip = col('#a39882');
  for (let i = 0; i < 150; i += 1) {
    const a = random(0, Math.PI * 2), r = 0.3 + Math.pow(random(), 0.8) * 0.95, h = random(0.06, 0.2) * (1.15 - r * 0.35);
    const base = v3(Math.cos(a) * r, 0.02, Math.sin(a) * r);
    const { geometry } = taperedTube([base, base.clone().add(v3(random(-0.012, 0.012), h * 0.55, random(-0.012, 0.012))), base.clone().add(v3(random(-0.02, 0.02), h, random(-0.02, 0.02)))],
      (u) => (0.016 + random(0, 0.006)) * (1 - u * 0.45), { tubular: 3, radial: 6, paint: (u) => mix(peg, pegTip, u * u) });
    batch.addColored('pneumatophores', geometry, null);
  }
  // Trunk with low plank buttresses and grey, longitudinally fissured bark.
  const barkBase = col('#6d6458'), barkFurrow = col('#3d362e'), lichen = col('#8f9483');
  const trunkPts = [v3(0, 0, 0), v3(0.02, 0.6, 0.01), v3(-0.02, 1.25, 0.03), v3(0.03, 1.85, 0), v3(0.02, 2.2, -0.02)];
  batch.addColored('bark', taperedTube(trunkPts, (u) => 0.135 * (1 - u * 0.55) + 0.05 * Math.pow(1 - u, 6), { tubular: 20, radial: 14, paint: barkPaint(barkBase, barkFurrow, lichen, 2) }).geometry, null);
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2 + random(-0.25, 0.25), out = v3(Math.cos(a), 0, Math.sin(a)), side = v3(-Math.sin(a), 0, Math.cos(a));
    const positions = [], colors = [], index = []; const steps = 8, reach = random(0.24, 0.34), rise = random(0.34, 0.5), th = 0.022;
    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps, yEdge = rise * Math.pow(1 - t, 1.8);
      const inner = out.clone().multiplyScalar(0.11).setY(yEdge), outer = out.clone().multiplyScalar(0.11 + reach * t).setY(yEdge * 0.98);
      for (const sgn of [-1, 1]) for (const p of [inner, outer]) {
        const q = p.clone().add(side.clone().multiplyScalar(sgn * th * (1 - t * 0.6)));
        positions.push(q.x, q.y, q.z); const c = mix(barkBase, barkFurrow, random(0.2, 0.55)); colors.push(c.r, c.g, c.b);
      }
      // the fin runs down to the mud: a second row at ground level closes it
    }
    for (let s = 0; s < steps; s += 1) { const a0 = s * 4, b0 = a0 + 4; index.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1, a0 + 2, a0 + 3, b0 + 2, a0 + 3, b0 + 3, b0 + 2, a0 + 1, b0 + 1, a0 + 3, a0 + 3, b0 + 1, b0 + 3); }
    const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(positions, 3)); g.setAttribute('color', new Float32BufferAttribute(colors, 3)); g.setIndex(index); g.computeVertexNormals();
    batch.addColored('bark', g, null);
  }
  // Elliptic-oblong leaves, dark green above and silvery-scaly beneath,
  // crowded toward the ends of the twigs.
  const leaf = blade({ length: 1, halfWidth: (u) => 0.21 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.02)), 0.72), segments: 7, across: 2, fold: 0.22, arch: 0.16, upper: col('#2c5a2c'), lower: col('#b4bcaa'), rib: col('#88a06a'), edge: col('#41662f') });
  const keys = ['sundari-leaf-upper', 'sundari-leaf-lower'];
  const branchColor = barkPaint(col('#5e554a'), col('#3a332b'), null, 5, 5);
  const grow = (start, dir, length, radius, depth) => {
    const pts = limbPoints(start, dir, length, random, { tropism: v3(0, 0.35, 0), wobble: 0.12, steps: 3 });
    batch.addColored('bark', taperedTube(pts, (u) => radius * (1 - u * 0.6), { tubular: 6, radial: 6, paint: branchColor }).geometry, null);
    if (depth > 0) {
      const n = depth > 1 ? 3 : 2;
      for (let k = 0; k < n; k += 1) {
        const at = pts[Math.min(pts.length - 1, 1 + Math.floor(random(0, pts.length - 1)))], a = random(0, Math.PI * 2);
        grow(at, dirAt(pts).add(v3(Math.cos(a) * 0.9, random(0.1, 0.5), Math.sin(a) * 0.9)), length * random(0.55, 0.72), radius * 0.6, depth - 1);
      }
    }
    if (depth <= 1) {
      const tip = tipOf(pts), d = dirAt(pts);
      for (let j = 0; j < (depth ? 6 : 11); j += 1) {
        const a = j * 2.4 + random(-0.3, 0.3), out = v3(Math.cos(a), 0, Math.sin(a));
        const dir2 = d.clone().multiplyScalar(0.55).add(out).add(v3(0, random(-0.25, 0.35), 0)).normalize();
        const origin = tip.clone().add(d.clone().multiplyScalar(-random(0, 0.06)));
        addLeaf(batch, keys, leaf, origin, dir2, v3(0, 1, 0).add(out.clone().multiplyScalar(-0.3)), random(0.2, 0.26), random);
      }
    }
  };
  for (let b = 0; b < 8; b += 1) {
    const a = (b / 8) * Math.PI * 2 + random(-0.3, 0.3), y = random(1.3, 2.1);
    const start = v3(Math.cos(a) * 0.03, y, Math.sin(a) * 0.03);
    grow(start, v3(Math.cos(a), random(0.75, 1.3), Math.sin(a)), random(0.6, 0.85), 0.045, 2);
  }
  grow(v3(0.02, 2.2, -0.02), v3(0.05, 1, 0), 0.55, 0.05, 2);
  return batch.build('sundari-heritiera-fomes', {
    'tidal-mud': material('wet tidal mud', { roughness: 0.85 }),
    pneumatophores: material('pneumatophore breathing roots', { roughness: 0.9 }),
    bark: material('fissured grey sundari bark', { roughness: 0.95 }),
    ...leafMaterials('sundari', { roughness: 0.55, clearcoat: 0.18 }),
  });
}

/* ---------- কদম: Neolamarckia cadamba ---------- */
function kadam() {
  const random = seeded(0xcada2), batch = new Batch();
  groundDisc(batch, 'ground', { radius: 1.15, height: 0.035, seed: 7, paint: (x, z, t) => mix(col('#5c5233'), col('#4f6b34'), fbm(x * 6, z * 6, 2) * 0.5 + 0.5 + t * 0.2) });
  const bark = barkPaint(col('#7a7266'), col('#4b453c'), col('#9a9a88'), 4, 7);
  const height = 2.55;
  batch.addColored('bark', taperedTube([v3(0, 0, 0), v3(0.01, 0.8, 0), v3(-0.01, 1.6, 0.01), v3(0, height, 0)], (u) => 0.12 * (1 - u * 0.62) + 0.04 * Math.pow(1 - u, 8), { tubular: 18, radial: 12, paint: bark }).geometry, null);
  // Large, glossy, ovate leaves in opposite pairs.
  const leaf = blade({ length: 1, halfWidth: (u) => 0.33 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.82)), 0.85), segments: 6, across: 2, fold: 0.12, arch: 0.24, upper: col('#2b6a2e'), lower: col('#6f9a56'), rib: col('#a8c27a'), edge: col('#356f2f') });
  const keys = ['kadam-leaf-upper', 'kadam-leaf-lower'];
  const ballCore = col('#e39a17'), ballTop = col('#f6c544'), style = col('#f7f1d6');
  const flowerHead = (centre, r) => {
    const core = new IcosahedronGeometry(r, 1);
    batch.add('flower-heads', core, compose([centre.x, centre.y, centre.z]), (p) => mix(ballCore, ballTop, (p.y / r) * 0.5 + 0.5 + noise3(p.x * 80, p.y * 80, p.z * 80) * 0.15));
    // the protruding cream styles that give the head its fuzzy pin-cushion look
    for (let s = 0; s < 30; s += 1) {
      const zz = 1 - (2 * (s + 0.5)) / 30, rr = Math.sqrt(1 - zz * zz), phi = s * 2.39996;
      const n = v3(Math.cos(phi) * rr, zz, Math.sin(phi) * rr);
      const from = centre.clone().add(n.clone().multiplyScalar(r * 0.9)), to = centre.clone().add(n.clone().multiplyScalar(r * 1.42));
      batch.addColored('flower-styles', taperedTube([from, from.clone().lerp(to, 0.5), to], (u) => r * 0.07 * (1 - u * 0.4), { tubular: 2, radial: 3, paint: () => style, closeEnds: false }).geometry, null);
    }
  };
  // Branches grow in near-horizontal tiers, shortening toward the top: the
  // layered, umbrella-like crown is how a kadam is recognised from a field.
  // A clear bole, then tiers that stay wide almost to the top, so the
  // crown reads as a broad umbrella rather than a cone.
  const tiers = [[1.25, 0.9, 4], [1.47, 1.02, 5], [1.69, 1.0, 5], [1.9, 0.92, 5], [2.1, 0.78, 4], [2.3, 0.58, 4], [2.48, 0.34, 3]];
  tiers.forEach(([y, reach, count], tierIndex) => {
    for (let b = 0; b < count; b += 1) {
      const a = (b / count) * Math.PI * 2 + tierIndex * 0.7 + random(-0.15, 0.15), out = v3(Math.cos(a), 0, Math.sin(a));
      const start = v3(0, y, 0), mid = out.clone().multiplyScalar(reach * 0.55).setY(y - 0.04 * reach), end = out.clone().multiplyScalar(reach).setY(y + 0.05 * reach);
      const pts = [start, mid, end];
      batch.addColored('bark', taperedTube(pts, (u) => 0.03 * (1 - u * 0.7) * (0.6 + reach * 0.4), { tubular: 6, radial: 6, paint: bark }).geometry, null);
      // opposite leaf pairs along the outer part of the branch
      for (let k = 0; k < 5; k += 1) {
        const t = 0.35 + k * 0.15, at = start.clone().lerp(end, t).setY(y + (t - 0.5) * 0.04 * reach);
        const side = v3(-out.z, 0, out.x);
        for (const sgn of [-1, 1]) {
          const dir = side.clone().multiplyScalar(sgn).add(out.clone().multiplyScalar(0.45)).add(v3(0, -0.28, 0)).normalize();
          addLeaf(batch, keys, leaf, at, dir, v3(0, 1, 0), random(0.24, 0.3) * (0.8 + reach * 0.2), random);
        }
      }
      // a terminal leaf tuft, and the flower heads on short stalks below it
      for (let k = 0; k < 4; k += 1) { const aa = a + (k - 1.5) * 0.7; addLeaf(batch, keys, leaf, end, v3(Math.cos(aa), 0.25, Math.sin(aa)), v3(0, 1, 0), random(0.17, 0.22), random); }
      if (tierIndex > 0 && tierIndex < 6) for (let f = 0; f < 2; f += 1) {
        const off = v3(-out.z, 0, out.x).multiplyScalar(f ? 0.05 : -0.05), headPos = end.clone().add(off).add(v3(0, -0.11, 0)).add(out.clone().multiplyScalar(-0.04));
        batch.addColored('bark', taperedTube([end.clone().add(off.clone().multiplyScalar(0.4)), headPos.clone().add(v3(0, 0.05, 0))], () => 0.006, { tubular: 2, radial: 4, paint: () => col('#6f7d44') }).geometry, null);
        flowerHead(headPos, 0.052);
      }
    }
  });
  for (let k = 0; k < 6; k += 1) { const a = k * 1.05; addLeaf(batch, keys, leaf, v3(0, height, 0), v3(Math.cos(a), 0.9, Math.sin(a)), v3(0, 1, 0), 0.17, random); }
  return batch.build('kadam-neolamarckia-cadamba', {
    ground: material('dry ground and grass', { roughness: 0.97 }),
    bark: material('grey kadam bark', { roughness: 0.92 }),
    'flower-heads': material('orange-gold globose flower heads', { roughness: 0.7, sheen: 0.4 }),
    'flower-styles': material('cream protruding styles', { roughness: 0.6 }),
    ...leafMaterials('kadam', { roughness: 0.42, clearcoat: 0.35 }),
  });
}

/* ---------- হিজল: Barringtonia acutangula ---------- */
function hijal() {
  const random = seeded(0x417a2), batch = new Batch();
  // Hijal stands in seasonally flooded haor and beel margins.
  groundDisc(batch, 'mud', { radius: 1.3, height: 0.04, seed: 11, paint: (x, z) => mix(col('#3e3a2c'), col('#5b5136'), fbm(x * 5, z * 5, 3) * 0.5 + 0.5) });
  groundDisc(batch, 'water', { radius: 1.18, rings: 6, height: 0.004, seed: 12, y: 0.035, paint: (x, z, t) => mix(col('#2f4a44'), col('#4f6a5c'), t * 0.6 + fbm(x * 3, z * 3, 9) * 0.2) });
  const bark = barkPaint(col('#4f463c'), col('#2c2620'), col('#6f6a58'), 9, 6);
  // A short, crooked, leaning trunk that divides low into sinuous limbs.
  const trunk = [v3(0, 0, 0), v3(0.08, 0.35, 0.02), v3(0.04, 0.7, -0.05), v3(0.14, 1.0, -0.02)];
  batch.addColored('bark', taperedTube(trunk, (u) => 0.14 * (1 - u * 0.4) + 0.05 * Math.pow(1 - u, 8), { tubular: 14, radial: 12, paint: bark }).geometry, null);
  // Obovate leaves with finely toothed margins, crowded at the twig ends;
  // young flushes are coppery red.
  const leaf = blade({ length: 1, halfWidth: (u) => 0.3 * Math.pow(Math.sin(Math.PI * Math.pow(u, 1.45)), 0.8) * (1 + 0.04 * Math.sin(u * Math.PI * 18)), segments: 7, across: 2, fold: 0.16, arch: 0.12, upper: col('#2f5f28'), lower: col('#5f8448'), rib: col('#8aa462'), edge: col('#3a6b2a') });
  const keys = ['hijal-leaf-upper', 'hijal-leaf-lower'];
  const young = col('#9b4a2c');
  const strandColor = col('#8d3a3a'), flowerRed = col('#c8283f'), flowerPink = col('#ef7d92');
  const raceme = (top) => {
    // Long hanging flower strings: the defining hijal sight in early summer.
    const length = random(0.32, 0.55), sway = v3(random(-0.06, 0.06), 0, random(-0.06, 0.06));
    const pts = [top, top.clone().add(v3(sway.x * 0.3, -length * 0.35, sway.z * 0.3)), top.clone().add(v3(sway.x, -length, sway.z))];
    const { geometry, curve } = taperedTube(pts, () => 0.0045, { tubular: 8, radial: 4, paint: () => strandColor });
    batch.addColored('raceme-stalks', geometry, null);
    for (let k = 0; k < 13; k += 1) {
      const t = 0.12 + (k / 13) * 0.86, p = curve.getPointAt(t), a = k * 2.4;
      const off = v3(Math.cos(a) * 0.012, 0, Math.sin(a) * 0.012);
      batch.add('flowers', new IcosahedronGeometry(0.016 * (1.1 - t * 0.35), 0), compose([p.x + off.x, p.y, p.z + off.z]), (q) => mix(flowerRed, flowerPink, noise3(q.x * 300, q.y * 300, q.z * 300) * 0.5 + 0.5));
    }
  };
  const grow = (start, dir, length, radius, depth) => {
    const pts = limbPoints(start, dir, length, random, { tropism: v3(0, 0.18, 0), wobble: 0.22, steps: 4 });
    batch.addColored('bark', taperedTube(pts, (u) => radius * (1 - u * 0.55), { tubular: 8, radial: 7, paint: bark }).geometry, null);
    if (depth > 0) {
      for (let k = 0; k < 3; k += 1) {
        const at = pts[1 + Math.floor(random(0, pts.length - 1))], a = random(0, Math.PI * 2);
        grow(at, dirAt(pts).add(v3(Math.cos(a), random(0.05, 0.45), Math.sin(a))), length * random(0.5, 0.68), radius * 0.58, depth - 1);
      }
    } else {
      const tip = tipOf(pts), d = dirAt(pts);
      for (let j = 0; j < 12; j += 1) {
        const a = j * 2.4 + random(-0.3, 0.3), out = v3(Math.cos(a), 0, Math.sin(a));
        addLeaf(batch, keys, leaf, tip, d.clone().multiplyScalar(0.4).add(out).add(v3(0, random(-0.15, 0.4), 0)).normalize(), v3(0, 1, 0), random(0.17, 0.22), random, j > 9 ? { hue: young, hueAmount: 0.7 } : {});
      }
      if (random() < 0.62) raceme(tip.clone().add(v3(0, -0.02, 0)));
    }
  };
  const fork = tipOf(trunk);
  for (let b = 0; b < 5; b += 1) {
    const a = (b / 5) * Math.PI * 2 + random(-0.4, 0.4);
    grow(fork.clone().add(v3(0, random(-0.25, 0), 0)), v3(Math.cos(a) * 1.25, random(0.45, 0.9), Math.sin(a) * 1.25), random(0.62, 0.82), 0.065, 2);
  }
  return batch.build('hijal-barringtonia-acutangula', {
    mud: material('wetland mud', { roughness: 0.9 }),
    water: material('shallow haor water', { roughness: 0.55, opacity: 0.88 }),
    bark: material('dark rough hijal bark', { roughness: 0.96 }),
    'raceme-stalks': material('hanging flower string', { roughness: 0.7 }),
    flowers: material('red stamen flowers', { roughness: 0.55, sheen: 0.5 }),
    ...leafMaterials('hijal', { roughness: 0.58, clearcoat: 0.15 }),
  });
}

/* ---------- পাট: Corchorus olitorius (tossa jute) ---------- */
function jute() {
  const random = seeded(0x3a7e2), batch = new Batch();
  // a field plot: ridged soil, squarer than a tree's ground disc
  groundDisc(batch, 'soil', { radius: 0.9, height: 0.03, seed: 21, squash: 0.85, paint: (x, z) => mix(col('#5b4630'), col('#3f3122'), Math.abs(Math.sin(x * 22)) * 0.5 + fbm(x * 8, z * 8, 4) * 0.3) });
  const stemBase = col('#6d6a3a'), stemMid = col('#5a8a3a'), stemTop = col('#7ea546');
  // Serrate, ovate-lanceolate leaves; tossa jute's two basal teeth run out
  // into short bristle-like tails, added as separate slivers.
  const leaf = blade({ length: 1, halfWidth: (u) => 0.24 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.75)), 0.9) * (1 + 0.07 * Math.max(0, Math.sin(u * Math.PI * 24))), segments: 12, across: 1, fold: 0.18, arch: 0.3, upper: col('#3b7431'), lower: col('#3b7431'), rib: col('#7fa152'), edge: col('#4a7f33') });
  const tail = blade({ length: 1, halfWidth: (u) => 0.08 * (1 - u), segments: 2, across: 1, fold: 0, arch: 0.2, upper: col('#4c7d36'), lower: col('#4c7d36') });
  const yellow = polarBlade({ radius: (th) => 0.9 + 0.35 * Math.cos(th * 5), rings: 2, spokes: 20, cup: 0.25, upper: col('#f3c51a'), lower: col('#e0a812'), span: Math.PI });
  const rows = 5, perRow = 5;
  for (let r = 0; r < rows; r += 1) for (let s = 0; s < perRow; s += 1) {
    const x = (s - (perRow - 1) / 2) * 0.28 + random(-0.05, 0.05), z = (r - (rows - 1) / 2) * 0.28 + random(-0.05, 0.05);
    const h = random(2.45, 3.0), lean = v3(random(-0.08, 0.08), 0, random(-0.08, 0.08));
    const pts = [v3(x, 0, z), v3(x + lean.x * 0.2, h * 0.35, z + lean.z * 0.2), v3(x + lean.x * 0.6, h * 0.7, z + lean.z * 0.6), v3(x + lean.x, h, z + lean.z)];
    const { geometry, curve } = taperedTube(pts, (u) => 0.014 * (1 - u * 0.65), { tubular: 10, radial: 5, paint: (u) => (u < 0.4 ? mix(stemBase, stemMid, u / 0.4) : mix(stemMid, stemTop, (u - 0.4) / 0.6)) });
    batch.addColored('stems', geometry, null);
    // In a crop stand the lower leaves have dropped; foliage is in the top half.
    const count = 12;
    for (let k = 0; k < count; k += 1) {
      const t = 0.42 + (k / count) * 0.58, p = curve.getPointAt(t), a = k * 2.513 + r + s;
      const out = v3(Math.cos(a), 0, Math.sin(a)), dir = out.clone().add(v3(0, 0.55 - t * 0.2, 0)).normalize();
      const scale = random(0.26, 0.32) * (1.2 - (t - 0.5));
      const petiole = p.clone().add(out.clone().multiplyScalar(0.02)).add(v3(0, 0.008, 0));
      batch.addColored('stems', taperedTube([p, petiole], () => 0.0025, { tubular: 1, radial: 3, paint: () => stemMid, closeEnds: false }).geometry, null);
      addLeaf(batch, ['jute-leaf-upper'], leaf, petiole, dir, v3(0, 1, 0), scale, random);
      for (const sgn of [-1, 1]) addLeaf(batch, ['jute-leaf-upper'], tail, petiole, out.clone().multiplyScalar(-0.3).add(v3(-out.z * sgn, -0.4, out.x * sgn)).normalize(), v3(0, 1, 0), scale * 0.28, random);
      // small yellow flowers sit in the upper leaf axils; slender ribbed pods
      // (the elongated capsule of tossa jute) a little lower
      if (t > 0.78 && k % 3 === 0) batch.addColored('flowers', tinted(yellow.upper, 1), frame(p.clone().add(out.clone().multiplyScalar(0.012)), out.clone().add(v3(0, 0.9, 0)), out, 0.014));
      if (t > 0.6 && t < 0.8 && k % 4 === 1) {
        const podEnd = p.clone().add(out.clone().multiplyScalar(0.02)).add(v3(0, 0.055, 0));
        batch.addColored('pods', taperedTube([p, p.clone().lerp(podEnd, 0.5).add(out.clone().multiplyScalar(0.006)), podEnd], (u) => 0.0055 * Math.sin(Math.PI * Math.min(1, 0.12 + u)), { tubular: 5, radial: 5, paint: (u, a2) => mix(col('#5e8a35'), col('#3f6a26'), Math.abs(Math.sin(a2 * Math.PI * 5))) }).geometry, null);
      }
    }
  }
  return batch.build('jute-corchorus-olitorius-stand', {
    soil: material('ridged field soil', { roughness: 0.98 }),
    stems: material('jute stem', { roughness: 0.7, clearcoat: 0.05 }),
    'jute-leaf-upper': material('jute leaf', { roughness: 0.6, clearcoat: 0.08, side: DoubleSide }),
    flowers: material('small yellow jute flower', { roughness: 0.55, side: DoubleSide }),
    pods: material('green ribbed capsule', { roughness: 0.65 }),
  });
}

/* ---------- থানকুনি: Centella asiatica ---------- */
function thanakuni() {
  const random = seeded(0x7a902), batch = new Batch();
  groundDisc(batch, 'soil', { radius: 0.95, height: 0.025, seed: 31, paint: (x, z) => mix(col('#4a3d2c'), col('#58603a'), fbm(x * 7, z * 7, 5) * 0.5 + 0.55) });
  // Reniform (kidney-shaped) blade with a crenate margin and a deep basal
  // notch where the long petiole joins; palmate veins read as soft pleats.
  const leaf = polarBlade({
    radius: (th) => { const notch = Math.exp(-Math.pow(Math.abs(th) - Math.PI, 2) / 0.09); return (1 - 0.92 * notch) * (1 + 0.045 * Math.cos(th * 15)); },
    rings: 6, spokes: 34, cup: 0.14, pleat: 0.035, pleats: 7, upper: col('#4c8c35'), lower: col('#4c8c35'), edge: col('#3c7029'), span: Math.PI,
  });
  const runner = col('#7d5a3d'), petioleColor = col('#7b9a4a'), petioleBase = col('#8a4f3c');
  const nodes = [v3(0, 0.02, 0)];
  // creeping stolons that root and send up a rosette at every node
  for (let s = 0; s < 4; s += 1) {
    let a = (s / 4) * Math.PI * 2 + random(-0.3, 0.3), p = v3(0, 0.02, 0);
    for (let k = 0; k < 3; k += 1) {
      a += random(-0.45, 0.45); const step = random(0.2, 0.26), q = p.clone().add(v3(Math.cos(a) * step, 0, Math.sin(a) * step));
      batch.addColored('runners', taperedTube([p, p.clone().lerp(q, 0.5).add(v3(0, 0.012, 0)), q], () => 0.006, { tubular: 6, radial: 5, paint: () => runner }).geometry, null);
      nodes.push(q.clone()); p = q;
    }
  }
  const flower = col('#b0306a');
  nodes.forEach((node, n) => {
    // fine roots where the node touches the soil
    for (let r = 0; r < 4; r += 1) { const a = random(0, Math.PI * 2); batch.addColored('runners', taperedTube([node, node.clone().add(v3(Math.cos(a) * 0.03, -0.012, Math.sin(a) * 0.03))], () => 0.0022, { tubular: 1, radial: 3, paint: () => col('#a8957a'), closeEnds: false }).geometry, null); }
    const leaves = n === 0 ? 6 : 3 + Math.floor(random(0, 3));
    for (let k = 0; k < leaves; k += 1) {
      const a = (k / leaves) * Math.PI * 2 + random(-0.4, 0.4), out = v3(Math.cos(a), 0, Math.sin(a));
      const h = random(0.1, 0.26), top = node.clone().add(out.clone().multiplyScalar(random(0.03, 0.07))).setY(h);
      batch.addColored('petioles', taperedTube([node, node.clone().lerp(top, 0.5).add(out.clone().multiplyScalar(0.01)), top], (u) => 0.0045 * (1 - u * 0.35), { tubular: 5, radial: 4, paint: (u) => mix(petioleBase, petioleColor, u) }).geometry, null);
      // blades held nearly flat and tilted toward the light, notch at the petiole
      const dir = out.clone().add(v3(0, random(0.15, 0.45), 0)).normalize();
      addLeaf(batch, ['thanakuni-leaf-upper'], leaf, top, dir, v3(0, 1, 0).add(out.clone().multiplyScalar(-0.4)), random(0.075, 0.11), random);
    }
    // tiny umbels of reddish-purple flowers close to the ground
    if (n % 3 === 1) for (let f = 0; f < 3; f += 1) batch.add('flowers', new IcosahedronGeometry(0.008, 1), compose([node.x + random(-0.02, 0.02), 0.035 + random(0, 0.01), node.z + random(-0.02, 0.02)]), () => flower);
  });
  return batch.build('thanakuni-centella-asiatica', {
    soil: material('damp soil and moss', { roughness: 0.96 }),
    runners: material('creeping stolon', { roughness: 0.75 }),
    petioles: material('long leaf stalk', { roughness: 0.65 }),
    'thanakuni-leaf-upper': material('kidney-shaped thankuni leaf', { roughness: 0.45, clearcoat: 0.25, side: DoubleSide }),
    flowers: material('tiny purple-red flowers', { roughness: 0.6 }),
  });
}

/* ---------- তাল: Borassus flabellifer ---------- */
function talPalm() {
  const random = seeded(0x7a12), batch = new Batch();
  groundDisc(batch, 'ground', { radius: 0.95, height: 0.03, seed: 41, paint: (x, z) => mix(col('#6b5a3a'), col('#5a6b38'), fbm(x * 6, z * 6, 6) * 0.5 + 0.5) });
  const height = 2.75;
  // A stout, dark trunk banded by old leaf scars; slightly swollen low down.
  const dark = col('#3e3a35'), scar = col('#24211d'), grey = col('#5b5650');
  batch.addColored('trunk', taperedTube([v3(0, 0, 0), v3(0.01, 0.9, 0), v3(-0.01, 1.8, 0.01), v3(0, height, 0)], (u) => 0.13 - 0.03 * u + 0.025 * Math.exp(-Math.pow((u - 0.15) / 0.12, 2)), {
    tubular: 40, radial: 14, paint: (u, a, p) => mix(mix(grey, dark, fbm(a * 6, p.y * 3, 1) * 0.5 + 0.5), scar, Math.pow(Math.abs(Math.sin(p.y * 38)), 14) * 0.85),
  }).geometry, null);
  // Fan (costapalmate) leaves: a pleated blade split into stiff pointed
  // segments, on long petioles with dark toothed margins.
  const segments = 34;
  const fan = polarBlade({ radius: (th) => 0.78 + 0.22 * Math.pow(Math.abs(Math.cos((th * segments) / 2)), 0.35), rings: 7, spokes: segments * 2, cup: 0.05, pleat: 0.05, pleats: segments / 2, upper: col('#3f7a44'), lower: col('#4f8350'), edge: col('#8a9a52'), span: Math.PI * 0.72 });
  const top = v3(0, height, 0);
  for (let i = 0; i < 22; i += 1) {
    const a = i * 2.39996, elev = 1.2 - (i / 22) * 1.75, out = v3(Math.cos(a), 0, Math.sin(a));
    const dir = out.clone().multiplyScalar(Math.cos(Math.max(-1.2, Math.min(1.2, elev)))).add(v3(0, Math.sin(elev), 0)).normalize();
    const len = random(0.72, 0.86), end = top.clone().add(dir.clone().multiplyScalar(len));
    batch.addColored('petioles', taperedTube([top.clone().add(dir.clone().multiplyScalar(0.05)), top.clone().add(dir.clone().multiplyScalar(len * 0.5)).add(v3(0, 0.02, 0)), end], (u) => 0.016 * (1 - u * 0.5), { tubular: 5, radial: 5, paint: (u, aa) => mix(col('#6f7d3f'), col('#1f1c18'), Math.pow(Math.abs(Math.sin(aa * Math.PI)), 6)) }).geometry, null);
    const bladeDir = dir.clone().add(v3(0, 0.35, 0)).normalize(), up = new Vector3().crossVectors(bladeDir, v3(-out.z, 0, out.x)).normalize();
    addLeaf(batch, ['tal-fan-upper'], fan, end, bladeDir, up.y < 0 ? up.negate() : up, random(0.4, 0.46), random, i > 18 ? { hue: col('#8a7a45'), hueAmount: 0.45 } : {});
  }
  // A few persistent old leaf bases just below the crown.
  for (let i = 0; i < 9; i += 1) { const a = i * 0.7, out = v3(Math.cos(a), 0, Math.sin(a)); batch.addColored('trunk', taperedTube([v3(0, height - 0.08 - (i % 3) * 0.05, 0), top.clone().add(out.clone().multiplyScalar(0.17)).add(v3(0, -0.12 - (i % 3) * 0.05, 0))], (u) => 0.035 * (1 - u * 0.6), { tubular: 2, radial: 5, paint: () => col('#4a4238') }).geometry, null); }
  // Bunches of large round fruit with pale calyx caps.
  for (let b = 0; b < 3; b += 1) {
    const a = b * 2.1 + 0.4, out = v3(Math.cos(a), 0, Math.sin(a)), hub = top.clone().add(out.clone().multiplyScalar(0.16)).add(v3(0, -0.16, 0));
    batch.addColored('petioles', taperedTube([top.clone().add(out.clone().multiplyScalar(0.05)), hub], () => 0.014, { tubular: 2, radial: 5, paint: () => col('#5d5a2f') }).geometry, null);
    for (let f = 0; f < 9; f += 1) {
      const fa = f * 2.4, p = hub.clone().add(v3(Math.cos(fa) * 0.07, -0.02 - (f % 3) * 0.06, Math.sin(fa) * 0.07)).add(out.clone().multiplyScalar(0.04));
      batch.add('fruit', displace(new SphereGeometry(0.058, 14, 10), 0.004, 30, f), compose([p.x, p.y, p.z], [0, 0, 0], [1, 1.06, 1]), (q) => mix(col('#1d1418'), col('#3a2228'), noise3(q.x * 90, q.y * 90, q.z * 90) * 0.5 + 0.5));
      batch.add('fruit-caps', new SphereGeometry(0.03, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2.4), compose([p.x, p.y + 0.045, p.z], [0, 0, 0], [1, 0.6, 1]), () => col('#a39a5a'));
    }
  }
  return batch.build('tal-borassus-flabellifer', {
    ground: material('village ground', { roughness: 0.97 }),
    trunk: material('ringed dark palmyra trunk', { roughness: 0.93 }),
    petioles: material('toothed fan-leaf petiole', { roughness: 0.75 }),
    'tal-fan-upper': material('pleated fan leaf', { roughness: 0.55, clearcoat: 0.12, side: DoubleSide }),
    fruit: material('ripe purple-black palmyra fruit', { roughness: 0.38, clearcoat: 0.4 }),
    'fruit-caps': material('fruit calyx cap', { roughness: 0.8 }),
  });
}

/* ---------- গোলপাতা: Nypa fruticans ---------- */
function golpata() {
  const random = seeded(0x90fa2), batch = new Batch();
  groundDisc(batch, 'mud', { radius: 1.15, height: 0.04, seed: 51, paint: (x, z) => mix(col('#3b352c'), col('#5a5240'), fbm(x * 5, z * 5, 7) * 0.5 + 0.5) });
  // Stemless: the trunk is a rhizome under the mud, so the fronds rise
  // straight from the ground in a fountain.
  const leaflet = blade({ length: 1, halfWidth: (u) => 0.055 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05)), 0.6), segments: 6, across: 1, fold: 0.35, arch: 0.1, upper: col('#3d7a3c'), lower: col('#3d7a3c'), rib: col('#b2b45f'), edge: col('#4a8442') });
  for (let i = 0; i < 11; i += 1) {
    const a = (i / 11) * Math.PI * 2 + random(-0.2, 0.2), out = v3(Math.cos(a), 0, Math.sin(a));
    const lean = random(0.45, 0.85), len = random(2.3, 2.7);
    const base = out.clone().multiplyScalar(0.06).setY(0.02);
    const pts = [base, base.clone().add(out.clone().multiplyScalar(len * lean * 0.25)).setY(len * 0.42), base.clone().add(out.clone().multiplyScalar(len * lean * 0.6)).setY(len * 0.74), base.clone().add(out.clone().multiplyScalar(len * lean * 1.05)).setY(len * 0.86)];
    const { geometry, curve } = taperedTube(pts, (u) => 0.035 * (1 - u * 0.82), { tubular: 14, radial: 6, paint: (u) => mix(col('#8b8a45'), col('#5e8a3c'), u) });
    batch.addColored('rachis', geometry, null);
    // many stiff, linear leaflets in two ranks, longest at mid-frond
    for (let k = 0; k < 30; k += 1) {
      const t = 0.18 + (k / 30) * 0.8, p = curve.getPointAt(t), tangent = curve.getTangentAt(t), side = new Vector3().crossVectors(tangent, v3(0, 1, 0)).normalize();
      const l = 0.36 * Math.sin(Math.PI * (0.15 + t * 0.75)) + 0.06;
      for (const sgn of [-1, 1]) addLeaf(batch, ['golpata-leaf-upper'], leaflet, p, side.clone().multiplyScalar(sgn).add(tangent.clone().multiplyScalar(0.75)).add(v3(0, 0.12, 0)).normalize(), v3(0, 1, 0), l, random);
    }
  }
  return batch.build('golpata-nypa-fruticans', {
    mud: material('tidal creek mud', { roughness: 0.88 }),
    rachis: material('frond midrib', { roughness: 0.7 }),
    'golpata-leaf-upper': material('linear golpata leaflet', { roughness: 0.5, clearcoat: 0.15, side: DoubleSide }),
  });
}

/* ---------- এলাচ: Elettaria cardamomum ---------- */
function cardamom() {
  const random = seeded(0xca2d2), batch = new Batch();
  groundDisc(batch, 'soil', { radius: 0.85, height: 0.03, seed: 61, paint: (x, z) => mix(col('#3f3226'), col('#5a4a33'), fbm(x * 7, z * 7, 8) * 0.5 + 0.5) });
  // Lanceolate leaves borne in two ranks on each leafy pseudostem.
  const leaf = blade({ length: 1, halfWidth: (u) => 0.1 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.9)), 0.8), segments: 12, across: 1, fold: 0.2, arch: 0.62, upper: col('#2f6a32'), lower: col('#2f6a32'), rib: col('#7aa05a'), edge: col('#3b7535') });
  for (let s = 0; s < 13; s += 1) {
    const a = (s / 13) * Math.PI * 2 + random(-0.3, 0.3), r = random(0.03, 0.2), base = v3(Math.cos(a) * r, 0, Math.sin(a) * r);
    const h = random(1.5, 2.1), lean = v3(Math.cos(a), 0, Math.sin(a)).multiplyScalar(random(0.1, 0.32));
    const pts = [base, base.clone().add(lean.clone().multiplyScalar(0.3)).setY(h * 0.4), base.clone().add(lean).setY(h)];
    const { geometry, curve } = taperedTube(pts, (u) => 0.018 * (1 - u * 0.5), { tubular: 8, radial: 6, paint: (u) => mix(col('#5c7a3a'), col('#3e6e33'), u) });
    batch.addColored('pseudostems', geometry, null);
    const rank = v3(-Math.sin(a + random(-0.4, 0.4)), 0, Math.cos(a + random(-0.4, 0.4))); // the two-ranked (distichous) plane
    for (let k = 0; k < 9; k += 1) {
      const t = 0.3 + (k / 9) * 0.7, p = curve.getPointAt(t), sgn = k % 2 ? 1 : -1;
      addLeaf(batch, ['cardamom-leaf-upper'], leaf, p, rank.clone().multiplyScalar(sgn).add(v3(0, 0.5, 0)).normalize(), v3(0, 1, 0), random(0.62, 0.8) * (1.1 - t * 0.3), random);
    }
  }
  // Flowering panicles creep out along the ground from the base, carrying
  // small white flowers and three-sided green capsules (the spice).
  for (let p = 0; p < 6; p += 1) {
    const a = p * 1.05 + random(-0.2, 0.2), out = v3(Math.cos(a), 0, Math.sin(a));
    const pts = [out.clone().multiplyScalar(0.12).setY(0.03), out.clone().multiplyScalar(0.35).setY(0.045), out.clone().multiplyScalar(0.62).add(v3(-out.z * 0.06, 0.03, out.x * 0.06))];
    const { geometry, curve } = taperedTube(pts, () => 0.006, { tubular: 8, radial: 4, paint: () => col('#6a7a3a') });
    batch.addColored('panicles', geometry, null);
    for (let k = 0; k < 7; k += 1) {
      const q = curve.getPointAt(0.3 + k * 0.1), side = (k % 2 ? 1 : -1) * 0.025;
      const pos = q.clone().add(v3(-out.z * side, 0.012, out.x * side));
      if (k === 6) { batch.add('flowers', new IcosahedronGeometry(0.012, 1), compose([pos.x, pos.y + 0.008, pos.z]), () => col('#f3f0e6')); continue; }
      batch.add('pods', new IcosahedronGeometry(0.018, 1), compose([pos.x, pos.y, pos.z], [0, a, Math.PI / 2], [1.55, 0.85, 0.85]), (v) => mix(col('#7c9a3e'), col('#a8b85a'), v.y * 20 + 0.5));
    }
  }
  return batch.build('green-cardamom-elettaria-cardamomum', {
    soil: material('forest soil', { roughness: 0.97 }),
    pseudostems: material('leafy pseudostem', { roughness: 0.65 }),
    'cardamom-leaf-upper': material('lanceolate cardamom leaf', { roughness: 0.48, clearcoat: 0.2, side: DoubleSide }),
    panicles: material('prostrate flowering stem', { roughness: 0.7 }),
    pods: material('green cardamom capsule', { roughness: 0.55, clearcoat: 0.15 }),
    flowers: material('small white cardamom flower', { roughness: 0.5 }),
  });
}

const assets = [
  ['posora_tal_palm_01', 'tal-palmyra-palm.glb', 'Tal / Palmyra palm', 'Borassus flabellifer', 'talPalm', talPalm, 'ringed dark trunk, a crown of pleated fan leaves on toothed petioles, and bunches of round purple-black fruit'],
  ['posora_sundari_01', 'sundari-mangrove.glb', 'Sundari mangrove', 'Heritiera fomes', 'sundari', sundari, 'tidal mud with dense peg-like pneumatophores, low plank buttresses, fissured grey bark and elliptic leaves with silvery undersides'],
  ['posora_golpata_01', 'golpata-nypa-palm.glb', 'Golpata / Nipa palm', 'Nypa fruticans', 'golpata', golpata, 'stemless fronds rising straight from tidal mud with many linear leaflets (the real fruit-head scan is shown alongside)'],
  ['posora_jute_01', 'jute-stand.glb', 'Tossa jute stand', 'Corchorus olitorius', 'jute', jute, 'a dense plot of tall unbranched stems with serrate tailed leaves in the upper half, small yellow axillary flowers and slender ribbed capsules'],
  ['posora_kadam_01', 'kadam-tree.glb', 'Kadam tree', 'Neolamarckia cadamba', 'kodom', kadam, 'a straight trunk with horizontal branch tiers, large opposite glossy leaves and orange-gold globose flower heads with protruding cream styles'],
  ['posora_hijal_01', 'hijal-tree.glb', 'Hijal tree', 'Barringtonia acutangula', 'hijol', hijal, 'a crooked low-branching tree in shallow wetland water, obovate toothed leaves crowded at twig ends and long hanging strings of red flowers'],
  ['posora_cardamom_plant_01', 'cardamom-plant.glb', 'Green cardamom plant', 'Elettaria cardamomum', 'cardamom', cardamom, 'a clump of leafy pseudostems with two-ranked lanceolate leaves and fruiting panicles creeping along the ground'],
  ['posora_thanakuni_01', 'thanakuni-creeper.glb', 'Thankuni creeper', 'Centella asiatica', 'thanakuni', thanakuni, 'creeping stolons rooting at nodes, with rosettes of long-stalked kidney-shaped leaves with scalloped margins and tiny reddish flowers'],
];

for (const [directory, filename, name, species, figure, build, features] of assets) {
  await writeAsset({
    directory, filename, scene: build(),
    manifest: {
      name, species, subject: `${species} teaching illustration: ${features}`, creator: 'Posora.com', license: 'CC0 1.0 Universal', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      source: 'Original deterministic Three.js geometry generated by scripts/generate-original-bangladesh-botany-models.mjs from field-guide morphology; not a scan or marketplace model.',
      createdDate: CREATED, qualityTier: 'teaching-diagram', educationalRole: `Species-identified teaching illustration for Life → ${figure}; shown beside an exact reference photograph of ${species}.`,
      limitations: [
        'Original illustration, not photogrammetry, a herbarium specimen or a botanical-accuracy certified model.',
        'Leaves, flowers and fruit are enlarged relative to the whole plant so they remain visible at lesson scale; do not infer real proportions or size.',
        'Individuals vary by age, season, habitat, health and cultivar.',
      ],
    },
    license: `# ${name}\n\n- Creator/source: Posora.com original asset\n- Generator: \`scripts/generate-original-bangladesh-botany-models.mjs\`\n- Species depicted: *${species}*\n- License: CC0 1.0 Universal — https://creativecommons.org/publicdomain/zero/1.0/\n- Created: ${CREATED}\n\nOriginal morphology-focused teaching illustration; not a specimen scan. Diagnostic parts are enlarged for visibility.\n`,
    readme: `# ${name}\n\n*${species}* teaching illustration: ${features}.\n\nSee \`asset-manifest.json\` and \`SOURCE-LICENSE.md\`. Shown on https://posora.com/life/ with an exact reference photograph.\n`,
  });
}
