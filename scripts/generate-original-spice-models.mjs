import { BufferGeometry, CylinderGeometry, Float32BufferAttribute, IcosahedronGeometry, LatheGeometry, SphereGeometry, Vector2, Vector3 } from 'three';
import { Batch, blade, col, compose, displace, fbm, material, mix, noise3, seeded, taperedTube, writeAsset } from './lib/procedural-kit.mjs';

/**
 * Posora-original whole-spice teaching models, generation 2 (CC0).
 *
 * The lesson asks a child to tell spices apart in the kitchen, so each seed
 * or leaf carries the cue a cook uses: cumin is slender, ridged and slightly
 * curved; coriander is a round, ribbed fruit that splits in two; tejpata
 * (Cinnamomum tamala) has three veins running from its base, unlike European
 * bay; mustard is tiny and round; fenugreek is small, angular and grooved;
 * Bengali gorom moshla is cinnamon, green cardamom and cloves.
 *
 * Seeds are enlarged relative to the bowl so their shape can be seen.
 */
const CREATED = '2026-10-28';
const v3 = (x, y, z) => new Vector3(x, y, z);

function smallBowl(batch, { radius = 0.62, height = 0.3, kind = 'steel' } = {}) {
  const profile = [[0, 0], [radius * 0.45, 0], [radius * 0.5, 0.03], [radius * 0.85, height * 0.45], [radius, height], [radius * 0.98, height * 1.03], [radius * 0.92, height * 0.95], [radius * 0.78, height * 0.45], [radius * 0.42, height * 0.12], [0, height * 0.1]];
  const tones = kind === 'clay' ? ['#8a4a2c', '#a8623a'] : ['#8f9599', '#cdd1d2'];
  batch.add(kind, new LatheGeometry(profile.map(([x, y]) => new Vector2(x, y)), 64), null, (p) => mix(col(tones[0]), col(tones[1]), p.y / height));
}
/** A heap of items piled into the bowl: denser and higher at the centre. */
function heap(batch, key, make, { count, radius, base, peak, random, paint, sizeJitter = 0.18 }) {
  for (let i = 0; i < count; i += 1) {
    const a = random(0, Math.PI * 2), r = radius * Math.sqrt(random()), x = Math.cos(a) * r, z = Math.sin(a) * r;
    const t = r / radius, y = base + peak * Math.pow(Math.max(0, 1 - t * t), 0.8) * random(0.55, 1);
    const s = 1 + random(-sizeJitter, sizeJitter);
    const g = make(i), m = compose([x, y, z], [random(-1.2, 1.2), random(0, Math.PI * 2), random(-1.2, 1.2)], s);
    // a seed that already carries its own shading keeps it
    if (paint) batch.add(key, g, m, (p) => paint(p, i)); else batch.addColored(key, g, m);
  }
}
const ridges = (p, n, axisLen) => Math.abs(Math.sin(Math.atan2(p.y, p.x) * n)) + Math.abs(p.z / axisLen) * 0.4;

/* ---------- জিরা: Cuminum cyminum ---------- */
function cumin() {
  const random = seeded(0xc0412), batch = new Batch();
  smallBowl(batch);
  // a slender, slightly curved fruit with fine longitudinal ridges and a
  // tiny stalk at one end
  const seed = () => {
    const len = 0.075, bend = random(0.004, 0.01);
    const { geometry } = taperedTube([v3(0, 0, -len / 2), v3(bend, 0, 0), v3(0, 0, len / 2)], (u) => 0.012 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.04 + u * 0.94)), 0.7) + 0.0015, { tubular: 8, radial: 8, paint: (u, a) => mix(col('#6e5a3e'), col('#b49b72'), Math.pow(Math.abs(Math.sin(a * Math.PI * 4.5)), 4) * 0.8 + (u < 0.08 ? 0.3 : 0)) });
    return geometry;
  };
  heap(batch, 'seeds', seed, { count: 480, radius: 0.44, base: 0.15, peak: 0.13, random, paint: null, sizeJitter: 0.15 });
  return finishTinted(batch, 'cumin-seeds');
}
function finishTinted(batch, name) {
  return batch.build(name, {
    steel: material('stainless steel bowl', { roughness: 0.22, clearcoat: 0.4 }),
    clay: material('terracotta bowl', { roughness: 0.9 }),
    seeds: material('dried seed', { roughness: 0.75, clearcoat: 0.05 }),
    leaves: material('dried leaf', { roughness: 0.8, side: 2 }),
    pods: material('green cardamom pod', { roughness: 0.6, clearcoat: 0.1 }),
    bark: material('cinnamon bark quill', { roughness: 0.85, side: 2 }),
    cloves: material('dried clove', { roughness: 0.7 }),
  });
}

/* ---------- ধনে: Coriandrum sativum ---------- */
function coriander() {
  const random = seeded(0xc0412b), batch = new Batch();
  smallBowl(batch);
  // a near-spherical ribbed fruit, straw-tan, with a small point on top;
  // some have split into their two hemispherical halves
  const whole = () => displace(new SphereGeometry(0.024, 12, 9), 0.0, 1);
  const half = () => new SphereGeometry(0.024, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  heap(batch, 'seeds', (i) => (i % 9 === 0 ? half() : whole()), { count: 360, radius: 0.44, base: 0.15, peak: 0.13, random, paint: (p) => mix(col('#a8875a'), col('#d8bf8a'), Math.pow(Math.abs(Math.sin(Math.atan2(p.x, p.z) * 5)), 3) * 0.8 + noise3(p.x * 300, p.y * 300, p.z * 300) * 0.1) });
  return finishTinted(batch, 'coriander-seeds');
}

/* ---------- তেজপাতা: Cinnamomum tamala ---------- */
function bayLeaves() {
  const random = seeded(0xba72), batch = new Batch();
  // Tejpata's three main veins run from the base to the tip, which is the
  // field difference from Laurus nobilis (one midrib with side veins).
  const veinPaint = (base, vein) => (p) => {
    const u = Math.min(1, Math.max(0, p.z)); const w = 0.21 * Math.sin(Math.PI * Math.pow(u, 0.9)) + 1e-3;
    const s = p.x / w, line = (c) => Math.exp(-Math.pow((s - c) / 0.1, 2));
    return mix(base, vein, Math.min(1, line(0) + line(-0.55) * 0.8 + line(0.55) * 0.8));
  };
  const leaf = blade({ length: 1, halfWidth: (u) => 0.21 * Math.sin(Math.PI * Math.pow(u, 0.9)), segments: 14, across: 10, fold: 0.04, arch: 0.08, twist: 0.1, upper: col('#7a7d3e'), lower: col('#8c8a52') });
  for (let i = 0; i < 7; i += 1) {
    const g = leaf.upper.clone(); const c = g.attributes.color, p = new Vector3();
    const base = mix(col('#55622a'), col('#7a5e30'), random(0, 0.6)), vein = col('#b3a873');
    const paint = veinPaint(base, vein);
    for (let k = 0; k < c.count; k += 1) { p.fromBufferAttribute(g.attributes.position, k); const q = paint(p); c.setXYZ(k, q.r, q.g, q.b); }
    const a = (i / 7) * Math.PI * 2 + random(-0.3, 0.3);
    batch.addColored('leaves', g, compose([Math.cos(a) * 0.12, 0.02 + i * 0.012, Math.sin(a) * 0.12], [random(-0.15, 0.15), -a + Math.PI / 2, random(-0.1, 0.1)], 0.75));
  }
  return finishTinted(batch, 'bay-leaves');
}

/* ---------- সরিষা: Brassica (mustard) ---------- */
function mustard() {
  const random = seeded(0x3a57), batch = new Batch();
  smallBowl(batch);
  heap(batch, 'seeds', () => new SphereGeometry(0.014, 6, 4), { count: 1100, radius: 0.44, base: 0.15, peak: 0.13, random, paint: (p, i) => (i % 11 === 0 ? col('#b8862e') : mix(col('#3a1c14'), col('#6a3420'), noise3(p.x * 400 + i, p.y * 400, p.z * 400) * 0.5 + 0.5)), sizeJitter: 0.2 });
  return finishTinted(batch, 'mustard-seeds');
}

/* ---------- মেথি: Trigonella foenum-graecum ---------- */
function fenugreek() {
  const random = seeded(0xfe9e), batch = new Batch();
  smallBowl(batch);
  // small, hard, angular seeds, golden-brown, with a diagonal groove
  const seed = () => displace(new SphereGeometry(0.02, 7, 5), 0.002, 120).scale(1.5, 0.75, 1);
  heap(batch, 'seeds', seed, { count: 520, radius: 0.44, base: 0.15, peak: 0.13, random, paint: (p) => mix(col('#c18a3a'), col('#7a5224'), Math.exp(-Math.pow((p.x - p.z * 0.8) / 0.004, 2)) * 0.9 + noise3(p.x * 200, p.y * 200, p.z * 200) * 0.15) });
  return finishTinted(batch, 'fenugreek-seeds');
}

/* ---------- গরম মশলা: Bengali whole gorom moshla ---------- */
function garamMasala() {
  const random = seeded(0x9a3a), batch = new Batch();
  smallBowl(batch, { radius: 0.7, height: 0.22, kind: 'clay' });
  // cinnamon (daruchini) quills: thin bark rolled into a scroll
  for (let i = 0; i < 5; i += 1) {
    const positions = [], colors = [], index = []; const len = random(0.42, 0.55), turns = 1.6, steps = 24, rings = 8;
    for (let r = 0; r <= rings; r += 1) for (let s = 0; s <= steps; s += 1) {
      const t = s / steps, ang = t * Math.PI * 2 * turns, rad = 0.028 + t * 0.018;
      positions.push(Math.cos(ang) * rad, Math.sin(ang) * rad, (r / rings - 0.5) * len);
      const c = mix(col('#7a3e1e'), col('#b0663a'), fbm(ang * 2, r * 0.8, i, 2) * 0.5 + 0.5 + (t > 0.9 ? 0.2 : 0)); colors.push(c.r, c.g, c.b);
    }
    for (let r = 0; r < rings; r += 1) for (let s = 0; s < steps; s += 1) { const a = r * (steps + 1) + s, b = a + steps + 1; index.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(positions, 3)); g.setAttribute('color', new Float32BufferAttribute(colors, 3)); g.setIndex(index); g.computeVertexNormals();
    const a = random(0, Math.PI * 2);
    batch.addColored('bark', g, compose([Math.cos(a) * 0.2, 0.1 + i * 0.03, Math.sin(a) * 0.2], [0.1, a, random(-0.2, 0.2)]));
  }
  // green cardamom (elach): three-sided, ribbed ovoid pods
  for (let i = 0; i < 16; i += 1) {
    const a = random(0, Math.PI * 2), r = random(0.05, 0.5);
    batch.add('pods', displace(new SphereGeometry(0.045, 12, 8), 0.004, 60, i), compose([Math.cos(a) * r, 0.1 + random(0, 0.08), Math.sin(a) * r], [random(-1, 1), random(0, 6.3), random(-1, 1)], [0.7, 0.7, 1.35]), (p) => mix(col('#6f8a3a'), col('#a6b55e'), Math.pow(Math.abs(Math.sin(Math.atan2(p.x, p.y) * 1.5)), 2)));
  }
  // cloves (labongo): a tapering stalk with a round bud and four sepals
  for (let i = 0; i < 18; i += 1) {
    const a = random(0, Math.PI * 2), r = random(0.05, 0.5), pos = v3(Math.cos(a) * r, 0.11 + random(0, 0.07), Math.sin(a) * r);
    const dir = v3(random(-1, 1), random(-0.3, 0.3), random(-1, 1)).normalize();
    const tip = pos.clone().add(dir.clone().multiplyScalar(0.11));
    batch.addColored('cloves', taperedTube([pos, pos.clone().lerp(tip, 0.5), tip], (u) => 0.008 + u * 0.006, { tubular: 4, radial: 6, paint: () => col('#4a2a1a') }).geometry, null);
    batch.add('cloves', new SphereGeometry(0.016, 10, 8), compose([tip.x + dir.x * 0.014, tip.y + dir.y * 0.014, tip.z + dir.z * 0.014]), () => col('#6a3a22'));
    for (let k = 0; k < 4; k += 1) batch.add('cloves', new CylinderGeometry(0.002, 0.006, 0.022, 4), compose([tip.x, tip.y, tip.z]), () => col('#3a2014'));
  }
  return finishTinted(batch, 'garam-masala');
}

const assets = [
  ['posora_cumin_01', 'cumin-seeds.glb', 'Cumin seeds', 'Cuminum cyminum', 'slender, slightly curved dried fruits with fine longitudinal ridges', cumin],
  ['posora_coriander_01', 'coriander-seeds.glb', 'Coriander seeds', 'Coriandrum sativum', 'round, ribbed straw-tan fruits, some split into two halves', coriander],
  ['posora_bay_leaf_01', 'bay-leaves.glb', 'Tejpata (Indian bay leaf)', 'Cinnamomum tamala', 'dried elliptic leaves with three main veins running from the base', bayLeaves],
  ['posora_mustard_01', 'mustard-seeds.glb', 'Mustard seeds', 'Brassica species', 'tiny round reddish-brown seeds with a few yellow ones', mustard],
  ['posora_fenugreek_01', 'fenugreek-seeds.glb', 'Fenugreek seeds', 'Trigonella foenum-graecum', 'small, hard, angular golden-brown seeds with a groove', fenugreek],
  ['posora_garam_masala_01', 'garam-masala.glb', 'Whole gorom moshla', 'Cinnamon, green cardamom and clove', 'Bengali whole garam masala: cinnamon quills, green cardamom pods and cloves', garamMasala],
];
for (const [directory, filename, name, species, features, build] of assets) {
  await writeAsset({
    directory, filename, scene: build(),
    manifest: {
      name, species, subject: `${species}: ${features}`, creator: 'Posora.com', license: 'CC0 1.0 Universal', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      source: 'Original deterministic Three.js geometry generated by scripts/generate-original-spice-models.mjs; not a scan.', createdDate: CREATED, qualityTier: 'teaching-diagram',
      educationalRole: 'Whole-spice identification model for Food → মশলার জগৎ; shown beside an exact reference photograph.',
      limitations: ['Original illustration, not a scan.', 'Seeds are enlarged relative to the bowl so their shape is visible; do not infer real size.', 'Colour and size vary with variety, origin, age and drying.'],
    },
    license: `# ${name}\n\n- Creator/source: Posora.com original asset\n- Generator: \`scripts/generate-original-spice-models.mjs\`\n- License: CC0 1.0 Universal — https://creativecommons.org/publicdomain/zero/1.0/\n- Created: ${CREATED}\n\nAn original teaching model of the whole spice, not a scan. Seeds are enlarged for visibility.\n`,
    readme: `# ${name}\n\n*${species}* — ${features}.\n\nSee \`asset-manifest.json\` and \`SOURCE-LICENSE.md\`. Shown on https://posora.com/food/ with an exact reference photograph.\n`,
  });
}
