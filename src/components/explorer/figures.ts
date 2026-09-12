/**
 * A vocabulary of small procedural figures.
 *
 * Some categories are not one thing with parts, they are a list of different
 * things: twelve animals, fourteen trees, ten spices. For those, an abstract
 * flock or a drifting molecule says nothing, and a child clicking a badge is
 * clicking a shape that has nothing to do with the word on it. Each figure here
 * builds one recognisable object into a group of its own, so the model becomes
 * the actual set of things the category is about and every badge can pin to the
 * thing it names.
 *
 * These are simplified silhouettes built from primitives, in keeping with the
 * rest of the site: no textures, no downloaded models. A tiger is stripes on a
 * four-legged body, not a photograph, and the page says the models are drawn
 * rather than photographed.
 */
import {
  Group, Mesh, Object3D, Color,
  SphereGeometry, BoxGeometry, CylinderGeometry, ConeGeometry, TorusGeometry,
  CircleGeometry, TetrahedronGeometry, IcosahedronGeometry, PlaneGeometry,
  MeshStandardMaterial, MeshBasicMaterial, DoubleSide, Vector3,
} from 'three';
// Seeded, so a species always grows the same way: the variation between trees
// is deliberate, and a tree must not reshuffle itself on every repaint.
import { rng } from '../../lib/rand';

/**
 * Roughness 0.75 rather than 0.6, and metalness flat zero.
 *
 * These figures are bark, leaf, cloth and clay. The old settings gave every
 * one of them a faint sheen that reads as plastic, which was invisible while
 * there was no environment map to reflect and became obvious the moment there
 * was one. Anything that genuinely is metal or glazed passes its own values.
 */
const std = (color: string | Color, o: Record<string, unknown> = {}) =>
  new MeshStandardMaterial({ color: color as Color, roughness: 0.75, metalness: 0, ...o });
const glow = (color: string, opacity = 0.4) =>
  new MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });

/** A figure builder: fills `g` with one object, roughly 1 unit across, sitting on y = 0. */
export type Figure = (g: Group) => void;

const put = (g: Group, m: Mesh, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m;
};
/** 24x16 rather than 16x12: these are the hero of the screen now, and a
 *  faceted silhouette is the first thing that gives cheap 3D away. */
const ball = (g: Group, c: string, r: number, x = 0, y = 0, z = 0) =>
  put(g, new Mesh(new SphereGeometry(r, 24, 16), std(c)), x, y, z);
const box = (g: Group, c: string, w: number, h: number, d: number, x = 0, y = 0, z = 0, rz = 0) =>
  put(g, new Mesh(new BoxGeometry(w, h, d), std(c)), x, y, z, 0, 0, rz);
const rod = (g: Group, c: string, r: number, h: number, x = 0, y = 0, z = 0, rz = 0, rx = 0) =>
  put(g, new Mesh(new CylinderGeometry(r, r, h, 14), std(c)), x, y, z, rx, 0, rz);
/** A tapered rod: a trunk, a branch, a stalk. Nothing in nature is a cylinder. */
const taper = (g: Group, c: string, rTop: number, rBot: number, h: number, x = 0, y = 0, z = 0, rz = 0, rx = 0) =>
  put(g, new Mesh(new CylinderGeometry(rTop, rBot, h, 12), std(c)), x, y, z, rx, 0, rz);
const cone = (g: Group, c: string, r: number, h: number, x = 0, y = 0, z = 0, rz = 0) =>
  put(g, new Mesh(new ConeGeometry(r, h, 12), std(c)), x, y, z, 0, 0, rz);
const disc = (g: Group, c: string, r: number, x = 0, y = 0, z = 0, rx = -Math.PI / 2) =>
  put(g, new Mesh(new CircleGeometry(r, 24), std(c, { side: DoubleSide })), x, y, z, rx);

/* ---------- trees and plants ---------- */
/**
 * A Bangladeshi shade tree.
 *
 * The old version of this was a brown cylinder with three green spheres on
 * top: a lollipop, and the same lollipop for all fourteen trees with only the
 * green changed. It is the thing on this site a player would have pointed at
 * first, and fairly.
 *
 * A tree reads as a tree because of three things, none of which need a model
 * file: the trunk **tapers** and leans a little; the crown sits on **branches**
 * that fan out rather than on a single stick; and the foliage is **many blobs
 * of slightly different size, height and green**, so the silhouette is ragged
 * instead of a circle. `seed` makes each species lean and clump differently,
 * so a grove is not one tree stamped fourteen times.
 */
const broadleaf = (crown: string, trunk = '#7a4f2a', h = 0.55, spread = 0.42, seed = 1): Figure => (g) => {
  const r = rng(seed * 977 + 13);
  const lean = (r() - 0.5) * 0.12;
  const bark = new Color(trunk);
  const leaf = new Color(crown);

  // Trunk: thick at the root, thin at the fork, leaning slightly off vertical.
  taper(g, trunk, 0.042, 0.075, h, 0, h / 2, 0, lean);
  // A flare where it meets the ground, which is what stops it looking pushed in.
  put(g, new Mesh(new CylinderGeometry(0.075, 0.12, 0.09, 12), std(bark.clone().multiplyScalar(0.88))), 0, 0.045, 0);

  // Three branches out of the fork, each carrying its own clump of crown.
  const forkY = h * 0.94;
  const arms = 3;
  for (let i = 0; i < arms; i++) {
    const a = (i / arms) * Math.PI * 2 + r() * 0.9;
    const len = spread * (0.62 + r() * 0.3);
    const tilt = 0.5 + r() * 0.25;
    const br = new Mesh(new CylinderGeometry(0.016, 0.036, len, 8), std(bark.clone().multiplyScalar(0.94)));
    br.position.set(Math.cos(a) * len * 0.3, forkY + len * 0.34, Math.sin(a) * len * 0.3);
    br.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt);
    g.add(br);
  }

  // Crown: one big mass plus five smaller ones pushed out along the branches,
  // each a shade off the last so the light finds edges inside the canopy.
  const cy = h + spread * 0.66;
  const blob = (x: number, y: number, z: number, rad: number, shade: number) => {
    const m = new Mesh(
      new IcosahedronGeometry(rad, 2),
      std(leaf.clone().offsetHSL(0, 0, shade)),
    );
    m.position.set(x, y, z);
    m.rotation.set(r() * 3, r() * 3, r() * 3);
    // Squashed a little: a canopy is wider than it is tall.
    m.scale.set(1, 0.82 + r() * 0.14, 1);
    g.add(m);
    return m;
  };
  blob(0, cy, 0, spread * 0.92, 0);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + r() * 1.2;
    const d = spread * (0.5 + r() * 0.42);
    blob(Math.cos(a) * d, cy + (r() - 0.5) * spread * 0.55, Math.sin(a) * d,
      spread * (0.4 + r() * 0.26), (r() - 0.45) * 0.075);
  }
};
/** A bare stem with a fan of stiff blades: palms and their relatives. */
/**
 * A palm.
 *
 * The old one was seven cones pointing outward from the top of a pipe, which
 * read as a mace rather than a tree. A palm is recognisable from three things:
 * a trunk that **tapers and curves**, ringed where old fronds fell away; a
 * crown of long **drooping** fronds, heaviest at the tips, not radiating
 * stiffly; and a tuft of new growth standing upright in the middle of them.
 */
const palm = (leaf: string, trunk = '#8a6a44', h = 0.85, seed = 5): Figure => (g) => {
  const r = rng(seed * 613 + 29);
  const bark = new Color(trunk);
  const lean = (r() - 0.5) * 0.16;
  // The trunk in segments, each a little narrower and a little further over,
  // so it curves instead of standing like a post.
  const segs = 7;
  for (let i = 0; i < segs; i++) {
    const f = i / segs;
    const sr = 0.062 - f * 0.022;
    const m = new Mesh(new CylinderGeometry(sr * 0.94, sr, h / segs + 0.012, 12), std(bark.clone().offsetHSL(0, 0, (i % 2 ? 0.03 : -0.02))));
    m.position.set(lean * f * f * 2.2, h * (f + 0.5 / segs), 0);
    m.rotation.z = -lean * f;
    g.add(m);
  }
  const topX = lean * 2.2, topY = h;
  // Fronds: a tapered blade bent down at the tip, laid around the crown.
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.3;
    const droop = 0.75 + r() * 0.5;
    const len = 0.46 + r() * 0.16;
    const frond = new Group();
    const inner = new Mesh(new ConeGeometry(0.055, len * 0.6, 6), std(leaf));
    inner.position.y = len * 0.3; inner.rotation.x = Math.PI;
    const outer = new Mesh(new ConeGeometry(0.038, len * 0.55, 6), std(new Color(leaf).offsetHSL(0, 0, -0.05)));
    outer.position.set(0, len * 0.72, len * 0.16); outer.rotation.set(Math.PI + 0.5, 0, 0);
    frond.add(inner, outer);
    frond.position.set(topX, topY + 0.05, 0);
    frond.rotation.set(Math.cos(a) * droop, -a, -Math.sin(a) * droop);
    g.add(frond);
  }
  // The spear of new growth at the centre, which is what says "still growing".
  const spear = new Mesh(new ConeGeometry(0.03, 0.22, 6), std(new Color(leaf).offsetHSL(0, 0, 0.08)));
  spear.position.set(topX, topY + 0.15, 0);
  g.add(spear);
};
/** Several thin culms with narrow leaves: bamboo, and by shape also cane. */
/**
 * Bamboo, paddy, jute: many thin stems from one clump.
 *
 * The old one was three bare rods with four-sided cones stuck on them. What
 * makes a culm read as a culm is the **node**: the swollen ring every few
 * inches that a bare cylinder has none of. Five stems now, each leaning its
 * own way, jointed, with narrow blades hanging in pairs from the joints.
 */
const culms = (stem: string, leaf: string, seed = 9): Figure => (g) => {
  const r = rng(seed * 401 + 7);
  const stalks = 5;
  for (let i = 0; i < stalks; i++) {
    const x = (i - (stalks - 1) / 2) * 0.085 + (r() - 0.5) * 0.03;
    const z = (r() - 0.5) * 0.12;
    const h = 0.72 + r() * 0.42;
    const lean = (r() - 0.5) * 0.22;
    const joints = 5;
    const col = new Color(stem).offsetHSL(0, 0, (r() - 0.5) * 0.08);
    for (let k = 0; k < joints; k++) {
      const f = k / joints;
      const sy = h * (f + 0.5 / joints);
      const sec = new Mesh(new CylinderGeometry(0.019, 0.023, h / joints - 0.012, 10), std(col));
      sec.position.set(x + lean * f * f, sy, z);
      sec.rotation.z = -lean * f * 0.8;
      g.add(sec);
      // the node itself
      const node = new Mesh(new CylinderGeometry(0.026, 0.026, 0.014, 10), std(col.clone().offsetHSL(0, 0, -0.06)));
      node.position.set(x + lean * f * f, h * (k + 1) / joints, z);
      g.add(node);
      // a pair of blades off the upper joints, drooping outward
      if (k >= 2) {
        for (const side of [-1, 1]) {
          const bl = new Mesh(new ConeGeometry(0.022, 0.2 + r() * 0.08, 4), std(new Color(leaf).offsetHSL(0, 0, (r() - 0.5) * 0.1)));
          bl.position.set(x + lean * f * f + side * 0.07, h * (k + 1) / joints + 0.03, z + (r() - 0.5) * 0.05);
          bl.rotation.set(0, r() * 2, side * (1.05 + r() * 0.35));
          g.add(bl);
        }
      }
    }
  }
};
/** A flat pad on water with a bloom: the water lily. */
const lily: Figure = (g) => {
  disc(g, '#2f6b3f', 0.42, 0, 0.02);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    put(g, new Mesh(new SphereGeometry(0.08, 8, 6), std('#f4f6f8')), Math.cos(a) * 0.12, 0.1, Math.sin(a) * 0.12).scale.set(1, 0.5, 0.45);
  }
  ball(g, '#f0b429', 0.06, 0, 0.13);
};
/** A low leafy herb in a pot, for the medicinal and kitchen plants. */
const herb = (leaf: string, pot = '#a8643c'): Figure => (g) => {
  const p = put(g, new Mesh(new CylinderGeometry(0.2, 0.15, 0.22, 12), std(pot)), 0, 0.11);
  void p;
  for (let i = 0; i < 7; i++) {
    const a = i * 0.9, r = 0.1 + (i % 3) * 0.05;
    const l = new Mesh(new SphereGeometry(0.1, 10, 8), std(leaf));
    l.position.set(Math.cos(a) * r, 0.28 + (i % 3) * 0.08, Math.sin(a) * r);
    l.scale.set(1.5, 0.5, 0.9); l.rotation.y = a;
    g.add(l);
  }
};

/* ---------- animals ---------- */
/** A four-legged body with a head and tail; stripes or spots are optional. */
const quadruped = (body: string, opts: { stripe?: string; big?: boolean; trunk?: boolean; tail?: number } = {}): Figure => (g) => {
  const s = opts.big ? 1.25 : 1;
  const b = put(g, new Mesh(new SphereGeometry(0.26 * s, 16, 12), std(body)), 0, 0.34 * s);
  b.scale.set(1.55, 0.82, 0.86);
  ball(g, body, 0.17 * s, 0.38 * s, 0.44 * s);
  for (const [dx, dz] of [[0.24, 0.13], [0.24, -0.13], [-0.24, 0.13], [-0.24, -0.13]] as const)
    rod(g, body, 0.05 * s, 0.34 * s, dx * s, 0.17 * s, dz * s);
  if (opts.tail) rod(g, body, 0.028, opts.tail, -0.44 * s, 0.36 * s, 0, 0.9);
  if (opts.trunk) rod(g, body, 0.045, 0.3, 0.5 * s, 0.24 * s, 0.44 * s, 0.25);
  if (opts.stripe) for (let i = 0; i < 5; i++)
    put(g, new Mesh(new BoxGeometry(0.035, 0.2 * s, 0.42 * s), std(opts.stripe)), (i - 2) * 0.11 * s, 0.4 * s, 0);
  // ears
  ball(g, body, 0.06 * s, 0.32 * s, 0.52 * s, 0.11 * s);
  ball(g, body, 0.06 * s, 0.32 * s, 0.52 * s, -0.11 * s);
};
/** A streamlined body with fins and a forked tail. */
const fish = (body: string, fin?: string): Figure => (g) => {
  const b = put(g, new Mesh(new SphereGeometry(0.3, 16, 12), std(body)), 0, 0.32);
  b.scale.set(1.5, 0.72, 0.5);
  const t = put(g, new Mesh(new ConeGeometry(0.2, 0.28, 3), std(fin ?? body)), -0.5, 0.32, 0, 0, 0, Math.PI / 2);
  t.scale.set(1, 1, 0.3);
  put(g, new Mesh(new ConeGeometry(0.1, 0.2, 3), std(fin ?? body)), 0, 0.52, 0).scale.set(1, 1, 0.25);
  ball(g, '#10161f', 0.03, 0.34, 0.38, 0.1);
};
/** A perched bird: round body, beak, two wings, a tail. */
const bird = (body: string, wing?: string, beak = '#f0b429'): Figure => (g) => {
  const b = put(g, new Mesh(new SphereGeometry(0.2, 14, 12), std(body)), 0, 0.4);
  b.scale.set(1.15, 1, 0.9);
  ball(g, body, 0.12, 0.16, 0.58);
  cone(g, beak, 0.045, 0.14, 0.31, 0.58, 0, -Math.PI / 2);
  for (const s of [1, -1]) {
    const w = put(g, new Mesh(new SphereGeometry(0.14, 10, 8), std(wing ?? body)), 0, 0.42, s * 0.17);
    w.scale.set(1.2, 0.35, 0.6);
  }
  put(g, new Mesh(new ConeGeometry(0.09, 0.26, 4), std(wing ?? body)), -0.26, 0.38, 0, 0, 0, Math.PI / 2).scale.set(1, 1, 0.35);
  for (const s of [1, -1]) rod(g, '#c8862c', 0.018, 0.2, 0.02, 0.1, s * 0.06);
};
/** A long low body with a ridged back and a wide snout. */
const croc: Figure = (g) => {
  const b = put(g, new Mesh(new SphereGeometry(0.22, 14, 10), std('#4b5c3a')), 0, 0.16);
  b.scale.set(2.1, 0.55, 0.8);
  const s = put(g, new Mesh(new BoxGeometry(0.3, 0.1, 0.16), std('#4b5c3a')), 0.5, 0.15, 0);
  void s;
  for (let i = 0; i < 6; i++) put(g, new Mesh(new ConeGeometry(0.04, 0.09, 4), std('#3b4a2d')), 0.22 - i * 0.13, 0.27, 0);
  for (const [dx, dz] of [[0.2, 0.18], [0.2, -0.18], [-0.24, 0.18], [-0.24, -0.18]] as const)
    rod(g, '#4b5c3a', 0.035, 0.14, dx, 0.07, dz);
  put(g, new Mesh(new ConeGeometry(0.08, 0.4, 5), std('#4b5c3a')), -0.6, 0.15, 0, 0, 0, Math.PI / 2);
};
/** A shell with a head and four stumps. */
const turtle: Figure = (g) => {
  const sh = put(g, new Mesh(new SphereGeometry(0.28, 16, 10), std('#5d6b3e')), 0, 0.2);
  sh.scale.set(1, 0.55, 0.85);
  ball(g, '#7d8a55', 0.1, 0.3, 0.2, 0);
  for (const [dx, dz] of [[0.18, 0.2], [0.18, -0.2], [-0.2, 0.2], [-0.2, -0.2]] as const)
    ball(g, '#7d8a55', 0.07, dx, 0.12, dz);
};
/** A striped abdomen with wings: the honeybee. */
const bee: Figure = (g) => {
  for (let i = 0; i < 3; i++) ball(g, i % 2 ? '#2b2b2b' : '#f0b429', 0.1 - i * 0.012, -i * 0.12, 0.4);
  for (const s of [1, -1]) {
    const w = put(g, new Mesh(new CircleGeometry(0.13, 12), new MeshStandardMaterial({ color: '#dce8f5', transparent: true, opacity: 0.55, side: DoubleSide })), -0.02, 0.52, s * 0.1);
    w.rotation.set(-0.5, 0, s * 0.4);
  }
};
/** A dolphin-like body for the river dolphin: no dorsal fin worth speaking of. */
const dolphin: Figure = (g) => {
  const b = put(g, new Mesh(new SphereGeometry(0.26, 16, 12), std('#8e9bab')), 0, 0.34);
  b.scale.set(1.9, 0.7, 0.66);
  cone(g, '#8e9bab', 0.07, 0.26, 0.52, 0.34, 0, -Math.PI / 2);
  const t = put(g, new Mesh(new ConeGeometry(0.16, 0.2, 3), std('#8e9bab')), -0.5, 0.34, 0, 0, 0, Math.PI / 2);
  t.scale.set(1, 1, 0.25);
};
/** A sitting primate: rounded body, long tail, pale face. */
const monkey: Figure = (g) => {
  ball(g, '#8a6a48', 0.2, 0, 0.3);
  ball(g, '#8a6a48', 0.14, 0, 0.55);
  ball(g, '#d8bb93', 0.09, 0.06, 0.55, 0).scale.set(0.7, 1, 1);
  for (const s of [1, -1]) ball(g, '#8a6a48', 0.05, -0.02, 0.62, s * 0.13);
  const t = rod(g, '#8a6a48', 0.022, 0.5, -0.24, 0.3, 0, 0.5);
  void t;
  for (const s of [1, -1]) rod(g, '#8a6a48', 0.04, 0.22, 0.06, 0.12, s * 0.12);
};

/* ---------- things, tools, objects ---------- */
/** A shallow bowl holding loose powder, for spices. */
const bowl = (powder: string, vessel = '#cfd6de'): Figure => (g) => {
  const b = put(g, new Mesh(new CylinderGeometry(0.3, 0.2, 0.16, 18, 1, true), std(vessel, { side: DoubleSide })), 0, 0.1);
  void b;
  disc(g, vessel, 0.2, 0, 0.02);
  const heap = put(g, new Mesh(new SphereGeometry(0.26, 16, 10), std(powder, { roughness: 1 })), 0, 0.17);
  heap.scale.set(1, 0.45, 1);
};
/** A few dried sticks or pods lying together. */
const sticks = (color: string, n = 4, bent = false): Figure => (g) => {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 0.9 - 0.45;
    const s = rod(g, color, bent ? 0.045 : 0.028, 0.46, (i - (n - 1) / 2) * 0.09, 0.24, 0, a);
    if (bent) s.scale.set(1, 1, 0.6);
  }
};
/** A handful of seeds in a small heap. */
const seeds = (color: string): Figure => (g) => {
  for (let i = 0; i < 11; i++) {
    const a = i * 1.9, r = 0.06 + (i % 4) * 0.045;
    const s = ball(g, color, 0.045, Math.cos(a) * r, 0.05 + (i % 3) * 0.035, Math.sin(a) * r);
    s.scale.set(1, 0.7, 1.3); s.rotation.y = a;
  }
};
/** A curved pod tapering at both ends: the chilli. */
const chilli = (color: string): Figure => (g) => {
  const c = put(g, new Mesh(new ConeGeometry(0.09, 0.52, 10), std(color)), 0, 0.3, 0, 0, 0, 3.0);
  c.scale.set(1, 1, 0.85);
  rod(g, '#4b7a3a', 0.02, 0.12, 0.04, 0.56);
};
/** A lidded cooking pot on a flame. */
const pot = (body = '#8e99a6', lid = '#b6c0cb'): Figure => (g) => {
  put(g, new Mesh(new CylinderGeometry(0.3, 0.26, 0.3, 20), std(body)), 0, 0.26);
  put(g, new Mesh(new CylinderGeometry(0.32, 0.32, 0.04, 20), std(lid)), 0, 0.43);
  ball(g, lid, 0.05, 0, 0.47);
  for (const s of [1, -1]) put(g, new Mesh(new TorusGeometry(0.07, 0.018, 6, 12), std(lid)), s * 0.33, 0.3, 0, 0, Math.PI / 2);
  for (let i = 0; i < 5; i++) {
    const f = put(g, new Mesh(new ConeGeometry(0.06, 0.16, 6), glow(i % 2 ? '#f0b429' : '#e06a2b', 0.75)), (i - 2) * 0.07, 0.07, 0);
    void f;
  }
};
/** A glass with a liquid line. */
const glass = (liquid = '#79b6e8'): Figure => (g) => {
  put(g, new Mesh(new CylinderGeometry(0.19, 0.15, 0.44, 18, 1, true), new MeshStandardMaterial({ color: '#dce8f5', transparent: true, opacity: 0.35, side: DoubleSide, roughness: 0.2 })), 0, 0.24);
  put(g, new Mesh(new CylinderGeometry(0.17, 0.15, 0.26, 18), std(liquid, { transparent: true, opacity: 0.85 })), 0, 0.15);
};
/** A bowl of rice, and by shape a plate of any staple. */
const riceBowl: Figure = (g) => {
  put(g, new Mesh(new CylinderGeometry(0.3, 0.18, 0.22, 20), std('#e6ebf1')), 0, 0.13);
  const h = put(g, new Mesh(new SphereGeometry(0.27, 16, 10), std('#fbfbf6')), 0, 0.26);
  h.scale.set(1, 0.5, 1);
};
/** A rounded fruit with a small stalk. */
const fruit = (color: string, leaf = '#4b7a3a'): Figure => (g) => {
  const f = ball(g, color, 0.26, 0, 0.28);
  f.scale.set(1, 1.12, 0.94);
  rod(g, '#6b4a2a', 0.02, 0.1, 0, 0.55);
  const l = ball(g, leaf, 0.09, 0.09, 0.57);
  l.scale.set(1.5, 0.35, 0.8);
};
/** A drop, for oil and water. */
const drop = (color: string): Figure => (g) => {
  const d = ball(g, color, 0.22, 0, 0.28);
  d.scale.set(1, 1.15, 1);
  cone(g, color, 0.15, 0.26, 0, 0.56);
};
/** A cube of crystals, for salt and minerals. */
const crystal = (color: string): Figure => (g) => {
  for (let i = 0; i < 5; i++) {
    const a = i * 1.3, r = 0.1 + (i % 2) * 0.07;
    const c = box(g, color, 0.14, 0.14, 0.14, Math.cos(a) * r, 0.08 + (i % 3) * 0.1, Math.sin(a) * r);
    c.rotation.set(a, a * 0.7, 0);
  }
};
/** A stack of coins. */
const coinStack = (color = '#d9b44a', n = 5): Figure => (g) => {
  for (let i = 0; i < n; i++) put(g, new Mesh(new CylinderGeometry(0.2, 0.2, 0.05, 20), std(color, { metalness: 0.5, roughness: 0.35 })), 0, 0.03 + i * 0.055);
};
/** A columned building front, for the bank. */
const building = (wall = '#d7dee6', roof = '#8fa0b4'): Figure => (g) => {
  box(g, wall, 0.9, 0.12, 0.5, 0, 0.06);
  for (let i = 0; i < 4; i++) rod(g, wall, 0.055, 0.52, (i - 1.5) * 0.22, 0.38);
  box(g, roof, 1.0, 0.08, 0.56, 0, 0.68);
  const ped = put(g, new Mesh(new ConeGeometry(0.56, 0.24, 4), std(roof)), 0, 0.84, 0, 0, Math.PI / 4);
  ped.scale.set(1, 1, 0.5);
};
/** A bank card. */
const card = (color = '#2f6b8f'): Figure => (g) => {
  const c = box(g, color, 0.62, 0.4, 0.02, 0, 0.3, 0, 0.12);
  void c;
  box(g, '#d9b44a', 0.14, 0.11, 0.025, -0.14, 0.34, 0.012, 0.12);
  box(g, '#f4f8fc', 0.5, 0.04, 0.025, 0.01, 0.18, 0.012, 0.12);
};
/** A phone, screen facing the camera. */
const phone = (body = '#222a33', screen = '#9fd8ff'): Figure => (g) => {
  box(g, body, 0.42, 0.74, 0.05, 0, 0.4);
  box(g, screen, 0.35, 0.6, 0.02, 0, 0.42, 0.027);
};
/** A padlock. */
const lock = (body = '#f0b429'): Figure => (g) => {
  box(g, body, 0.36, 0.3, 0.22, 0, 0.2);
  put(g, new Mesh(new TorusGeometry(0.13, 0.035, 8, 16, Math.PI), std('#b9c3ce')), 0, 0.36, 0);
  ball(g, '#5b452a', 0.04, 0, 0.2, 0.12);
};
/** An upright person: a rounded head and a simple torso. */
const person = (coat: string, skin = '#c98f5f'): Figure => (g) => {
  ball(g, skin, 0.16, 0, 0.72);
  const t = put(g, new Mesh(new CylinderGeometry(0.2, 0.26, 0.5, 14), std(coat)), 0, 0.32);
  void t;
  for (const s of [1, -1]) rod(g, coat, 0.05, 0.36, s * 0.24, 0.36, 0, s * 0.25);
  ball(g, '#2a2a2a', 0.17, 0, 0.78).scale.set(1, 0.6, 1);
};
/** A thermometer: a tube with a bulb. */
const thermometer: Figure = (g) => {
  put(g, new Mesh(new CylinderGeometry(0.05, 0.05, 0.6, 12), std('#e8eef5', { transparent: true, opacity: 0.8 })), 0, 0.4);
  ball(g, '#c0392b', 0.1, 0, 0.1);
  put(g, new Mesh(new CylinderGeometry(0.025, 0.025, 0.4, 8), std('#c0392b')), 0, 0.3);
};
/** A two-pan balance. */
const balance: Figure = (g) => {
  rod(g, '#8a94a0', 0.03, 0.6, 0, 0.3);
  box(g, '#8a94a0', 0.7, 0.035, 0.035, 0, 0.62);
  for (const s of [1, -1]) {
    rod(g, '#8a94a0', 0.008, 0.18, s * 0.33, 0.53);
    put(g, new Mesh(new CylinderGeometry(0.12, 0.09, 0.05, 14), std('#b9c3ce')), s * 0.33, 0.44);
  }
};
/** A ruler laid flat with tick marks. */
const ruler: Figure = (g) => {
  box(g, '#e8c86a', 0.86, 0.06, 0.16, 0, 0.03);
  for (let i = 0; i < 9; i++) box(g, '#5b452a', 0.012, 0.02, i % 2 ? 0.05 : 0.09, -0.38 + i * 0.095, 0.065, 0.03);
};
/** A microscope: base, arm, tube. */
const microscope: Figure = (g) => {
  box(g, '#3b4551', 0.42, 0.08, 0.3, 0, 0.04);
  rod(g, '#4c5867', 0.05, 0.46, -0.1, 0.28);
  box(g, '#4c5867', 0.3, 0.05, 0.22, 0.04, 0.3);
  const tube = rod(g, '#2b333d', 0.06, 0.34, 0.1, 0.56, 0, 0.25);
  void tube;
  put(g, new Mesh(new CylinderGeometry(0.045, 0.06, 0.1, 12), std('#8a94a0')), 0.14, 0.38);
};
/** A telescope on a tripod. */
const telescope: Figure = (g) => {
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    rod(g, '#5b4a3a', 0.022, 0.5, Math.cos(a) * 0.13, 0.24, Math.sin(a) * 0.13, Math.cos(a) * 0.5, Math.sin(a) * 0.5);
  }
  const t = put(g, new Mesh(new CylinderGeometry(0.09, 0.06, 0.56, 14), std('#2f3a46')), 0, 0.62, 0, 0, 0, -0.7);
  void t;
  put(g, new Mesh(new CylinderGeometry(0.1, 0.1, 0.05, 14), std('#d9b44a')), 0.19, 0.78, 0, 0, 0, -0.7);
};
/** A compass: a dial with a needle. */
const compass: Figure = (g) => {
  put(g, new Mesh(new CylinderGeometry(0.28, 0.28, 0.07, 24), std('#c9a15e', { metalness: 0.4 })), 0, 0.06);
  disc(g, '#f4f8fc', 0.24, 0, 0.1);
  const n = box(g, '#c0392b', 0.03, 0.01, 0.22, 0, 0.11, 0.05);
  n.rotation.y = 0.5;
  const s2 = box(g, '#39506b', 0.03, 0.01, 0.22, 0, 0.11, -0.05);
  s2.rotation.y = 0.5;
};
/** A clock face with two hands. */
const clockFace: Figure = (g) => {
  put(g, new Mesh(new CylinderGeometry(0.32, 0.32, 0.08, 26), std('#e8eef5')), 0, 0.34, 0, Math.PI / 2);
  disc(g, '#fbfdff', 0.27, 0, 0.34, 0.045, 0);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    box(g, '#4c5867', 0.015, i % 3 ? 0.03 : 0.06, 0.01, Math.cos(a) * 0.22, 0.34 + Math.sin(a) * 0.22, 0.05);
  }
  box(g, '#222a33', 0.015, 0.14, 0.012, 0.02, 0.4, 0.06, -0.4);
  box(g, '#c0392b', 0.012, 0.2, 0.012, -0.04, 0.42, 0.06, 0.6);
};
/** A stopwatch: a clock with a crown on top. */
const stopwatch: Figure = (g) => {
  clockFace(g);
  rod(g, '#8a94a0', 0.04, 0.1, 0, 0.71);
  put(g, new Mesh(new TorusGeometry(0.06, 0.02, 6, 12), std('#8a94a0')), 0, 0.79, 0, Math.PI / 2);
};
/** A barometer: a dial on a wall plate. */
const barometer: Figure = (g) => {
  put(g, new Mesh(new CylinderGeometry(0.3, 0.3, 0.1, 24), std('#5b4a3a')), 0, 0.34, 0, Math.PI / 2);
  disc(g, '#f0e7d2', 0.24, 0, 0.34, 0.055, 0);
  box(g, '#2f3a46', 0.012, 0.18, 0.012, 0.03, 0.4, 0.07, -0.5);
};
/** An envelope. */
const envelope = (color = '#f4f8fc'): Figure => (g) => {
  box(g, color, 0.6, 0.4, 0.03, 0, 0.3);
  const f = put(g, new Mesh(new ConeGeometry(0.31, 0.22, 4), std('#dbe3ec')), 0, 0.4, 0.02, Math.PI, Math.PI / 4);
  f.scale.set(1.36, 1, 0.1);
};
/** A shopping stall: a counter under a striped awning. */
const stall = (awning = '#c0392b'): Figure => (g) => {
  box(g, '#a8763f', 0.8, 0.3, 0.4, 0, 0.15);
  for (const s of [1, -1]) rod(g, '#8a6a44', 0.028, 0.7, s * 0.36, 0.5, 0.16);
  const a = box(g, awning, 0.9, 0.06, 0.44, 0, 0.86, 0.06, 0);
  a.rotation.x = -0.22;
  for (let i = 0; i < 3; i++) ball(g, i === 0 ? '#e8c86a' : i === 1 ? '#5f9e4a' : '#c0392b', 0.08, (i - 1) * 0.2, 0.36, 0.1);
};
/** A paper sheet with lines, for receipts and ledgers. */
const sheet = (color = '#fbfdff'): Figure => (g) => {
  box(g, color, 0.46, 0.62, 0.015, 0, 0.34);
  for (let i = 0; i < 5; i++) box(g, '#b9c3ce', 0.3, 0.02, 0.02, -0.03, 0.54 - i * 0.09, 0.012);
};
/** An arrow pointing up, for growth. */
const arrowUp = (color = '#2f8f5b'): Figure => (g) => {
  box(g, color, 0.1, 0.5, 0.1, 0, 0.3);
  cone(g, color, 0.17, 0.24, 0, 0.66);
};
/** A cupped hand under a tap: washing. */
const tap: Figure = (g) => {
  rod(g, '#b9c3ce', 0.045, 0.5, -0.16, 0.55);
  box(g, '#b9c3ce', 0.3, 0.06, 0.06, -0.02, 0.78);
  rod(g, '#b9c3ce', 0.035, 0.12, 0.12, 0.71);
  for (let i = 0; i < 4; i++) ball(g, '#79b6e8', 0.035, 0.12, 0.56 - i * 0.12, 0);
  const h = put(g, new Mesh(new SphereGeometry(0.2, 14, 10), std('#c98f5f')), 0.12, 0.2);
  h.scale.set(1.2, 0.4, 0.9);
};
/** A gear wheel. */
const gear = (color = '#8a94a0', r = 0.28): Figure => (g) => {
  put(g, new Mesh(new CylinderGeometry(r, r, 0.09, 20), std(color, { metalness: 0.35 })), 0, 0.34, 0, Math.PI / 2);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    box(g, color, 0.1, 0.1, 0.09, Math.cos(a) * (r + 0.05), 0.34 + Math.sin(a) * (r + 0.05), 0, a);
  }
  put(g, new Mesh(new CylinderGeometry(0.07, 0.07, 0.11, 12), std('#39414b')), 0, 0.34, 0, Math.PI / 2);
};
/** A lit bulb. */
const bulb: Figure = (g) => {
  ball(g, '#ffe9a8', 0.22, 0, 0.5);
  put(g, new Mesh(new SphereGeometry(0.3, 12, 10), glow('#f0b429', 0.22)), 0, 0.5);
  put(g, new Mesh(new CylinderGeometry(0.1, 0.12, 0.16, 12), std('#9aa5b1', { metalness: 0.5 })), 0, 0.24);
};
/** A wheel: the first machine. */
const wheel: Figure = (g) => {
  put(g, new Mesh(new TorusGeometry(0.3, 0.06, 10, 24), std('#7a5a3a')), 0, 0.36, 0, Math.PI / 2);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI;
    box(g, '#a8763f', 0.03, 0.58, 0.03, 0, 0.36, 0, a);
  }
};
/** A book. */
const book = (cover = '#3d6b8f'): Figure => (g) => {
  box(g, cover, 0.5, 0.62, 0.1, 0, 0.33);
  box(g, '#fbfdff', 0.44, 0.56, 0.11, 0.02, 0.33);
  box(g, cover, 0.06, 0.62, 0.12, -0.22, 0.33);
};
/** A screen on a stand: a computer. */
const monitor: Figure = (g) => {
  box(g, '#2b333d', 0.78, 0.5, 0.06, 0, 0.55);
  box(g, '#7fd4ff', 0.68, 0.4, 0.02, 0, 0.55, 0.035);
  rod(g, '#4c5867', 0.05, 0.2, 0, 0.2);
  box(g, '#4c5867', 0.34, 0.04, 0.2, 0, 0.09);
};
/** A rounded robot. */
const robot: Figure = (g) => {
  box(g, '#8a94a0', 0.44, 0.4, 0.3, 0, 0.42);
  box(g, '#39414b', 0.3, 0.16, 0.02, 0, 0.48, 0.16);
  for (const s of [1, -1]) ball(g, '#7fd4ff', 0.05, s * 0.08, 0.48, 0.17);
  for (const s of [1, -1]) rod(g, '#6b7583', 0.04, 0.24, s * 0.28, 0.36);
  box(g, '#6b7583', 0.36, 0.2, 0.26, 0, 0.12);
  rod(g, '#6b7583', 0.02, 0.14, 0, 0.69);
  ball(g, '#c0392b', 0.05, 0, 0.78);
};
/** A flask. */
const flask = (liquid = '#7ac8a0'): Figure => (g) => {
  put(g, new Mesh(new ConeGeometry(0.28, 0.44, 16, 1, true), new MeshStandardMaterial({ color: '#dce8f5', transparent: true, opacity: 0.35, side: DoubleSide })), 0, 0.24);
  put(g, new Mesh(new CylinderGeometry(0.07, 0.07, 0.2, 12, 1, true), new MeshStandardMaterial({ color: '#dce8f5', transparent: true, opacity: 0.35, side: DoubleSide })), 0, 0.55);
  put(g, new Mesh(new ConeGeometry(0.2, 0.2, 16), std(liquid, { transparent: true, opacity: 0.9 })), 0, 0.12);
};
/** A cloud with rain, for a wet habitat. */
const cloudDrop: Figure = (g) => {
  for (const [x, y, r] of [[0, 0.6, 0.2], [0.18, 0.56, 0.15], [-0.18, 0.56, 0.15]] as const) ball(g, '#cfd8e3', r, x, y);
  for (let i = 0; i < 4; i++) ball(g, '#79b6e8', 0.045, (i - 1.5) * 0.12, 0.3 - (i % 2) * 0.1);
};
/** A leafy shrub with no pot: undergrowth and producers. */
const shrub = (leaf: string): Figure => (g) => {
  for (let i = 0; i < 5; i++) {
    const a = i * 1.3, r = 0.13;
    ball(g, leaf, 0.15, Math.cos(a) * r, 0.16 + (i % 2) * 0.1, Math.sin(a) * r);
  }
};
/** Soil with something growing out: decomposers and roots. */
const soil = (): Figure => (g) => {
  const s = put(g, new Mesh(new CylinderGeometry(0.34, 0.3, 0.18, 18), std('#6b5233')), 0, 0.09);
  void s;
  for (let i = 0; i < 5; i++) {
    const a = i * 1.4;
    const m = put(g, new Mesh(new SphereGeometry(0.07, 10, 8), std('#c9b98f')), Math.cos(a) * 0.14, 0.2, Math.sin(a) * 0.14);
    m.scale.set(1, 0.55, 1);
    rod(g, '#e8e0cc', 0.012, 0.08, Math.cos(a) * 0.14, 0.15, Math.sin(a) * 0.14);
  }
};
/** A sun disc with rays. */
const sunDisc: Figure = (g) => {
  ball(g, '#f5b731', 0.24, 0, 0.5);
  put(g, new Mesh(new SphereGeometry(0.33, 14, 12), glow('#f5b731', 0.25)), 0, 0.5);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    box(g, '#f5b731', 0.04, 0.14, 0.04, Math.cos(a) * 0.36, 0.5 + Math.sin(a) * 0.36, 0, a);
  }
};
/** A bird in flight, for migration. */
const flyingBird = (color = '#5b6b7d'): Figure => (g) => {
  const b = ball(g, color, 0.1, 0, 0.5);
  b.scale.set(1.6, 0.7, 0.7);
  for (const s of [1, -1]) {
    const w = put(g, new Mesh(new ConeGeometry(0.1, 0.42, 3), std(color)), 0, 0.54, s * 0.24, 0, 0, s * 0.5);
    w.scale.set(1, 1, 0.3); w.rotation.x = s * 0.3;
  }
};
/** A branching coral. */
const coral = (color = '#e07a8a'): Figure => (g) => {
  for (let i = 0; i < 5; i++) {
    const a = i * 1.25, r = 0.1;
    const h = 0.3 + (i % 3) * 0.14;
    rod(g, color, 0.035, h, Math.cos(a) * r, h / 2, Math.sin(a) * r, Math.cos(a) * 0.35);
    ball(g, color, 0.055, Math.cos(a) * (r + 0.09), h, Math.sin(a) * (r + 0.09));
  }
};
/** A simple house. */
const house = (wall = '#e2d6bf', roof = '#a8563c'): Figure => (g) => {
  box(g, wall, 0.6, 0.44, 0.46, 0, 0.22);
  const r = put(g, new Mesh(new ConeGeometry(0.5, 0.3, 4), std(roof)), 0, 0.59, 0, 0, Math.PI / 4);
  void r;
  box(g, '#6b4a2a', 0.16, 0.24, 0.02, 0, 0.12, 0.24);
};


/* ---------- faces, one per feeling ---------- */
/** A head with brows, eyes and a mouth built from primitives. */
const faceFig = (opts: { brow?: 'flat' | 'angry' | 'sad' | 'up'; eye?: 'open' | 'wide' | 'squint' | 'droop'; mouth?: 'smile' | 'frown' | 'o' | 'flat' | 'small'; cheek?: string }): Figure => (g) => {
  const skin = '#e8b98e';
  ball(g, skin, 0.36, 0, 0.5);
  if (opts.cheek) for (const s of [1, -1]) ball(g, opts.cheek, 0.08, s * 0.22, 0.46, 0.27).scale.set(1, 0.7, 0.4);
  const eye = opts.eye ?? 'open';
  for (const s of [1, -1]) {
    if (eye === 'squint') { const b = box(g, '#2a2118', 0.12, 0.025, 0.02, s * 0.14, 0.56, 0.32); b.rotation.z = s * 0.35; }
    else {
      const r = eye === 'wide' ? 0.06 : 0.045;
      ball(g, '#f8fbff', r, s * 0.14, 0.56, 0.3);
      ball(g, '#2a2118', r * 0.55, s * 0.14, 0.56 - (eye === 'droop' ? 0.015 : 0), 0.33);
    }
  }
  const brow = opts.brow ?? 'flat';
  for (const s of [1, -1]) {
    const b = box(g, '#3b2d22', 0.14, 0.028, 0.025, s * 0.14, 0.67, 0.3);
    b.rotation.z = brow === 'angry' ? -s * 0.45 : brow === 'sad' ? s * 0.4 : brow === 'up' ? s * 0.15 : 0;
    if (brow === 'up') b.position.y = 0.71;
  }
  const mouth = opts.mouth ?? 'smile';
  if (mouth === 'o') { put(g, new Mesh(new TorusGeometry(0.07, 0.025, 8, 14), std('#8a3b3b')), 0, 0.35, 0.32); }
  else if (mouth === 'flat') box(g, '#8a3b3b', 0.18, 0.028, 0.02, 0, 0.35, 0.33);
  else {
    const w = mouth === 'small' ? 0.1 : 0.15;
    const m = put(g, new Mesh(new TorusGeometry(w, 0.028, 8, 14, Math.PI), std('#8a3b3b')), 0, 0.37, 0.31);
    m.rotation.z = mouth === 'frown' ? 0 : Math.PI;
    if (mouth === 'frown') m.position.y = 0.31;
  }
};

/* ---------- places ---------- */
/** Mangrove: stilt roots in shallow water. */
const mangrove: Figure = (g) => {
  disc(g, '#2f5a6b', 0.6, 0, 0.02);
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 0.26;
    rod(g, '#5b4a3a', 0.04, 0.5, x, 0.3);
    ball(g, '#2f6b4a', 0.24, x, 0.66);
    for (const s of [1, -1]) rod(g, '#5b4a3a', 0.02, 0.22, x + s * 0.1, 0.1, 0, s * 0.5);
  }
};
/** A beach: sand, a wave line, a palm. */
const beach: Figure = (g) => {
  const sand = put(g, new Mesh(new CylinderGeometry(0.6, 0.6, 0.08, 24), std('#e6d2a8')), 0, 0.04);
  void sand;
  disc(g, '#3f86b8', 0.62, 0, 0.09, -Math.PI / 2).scale.set(1, 0.45, 1);
  rod(g, '#8a6a44', 0.04, 0.55, -0.2, 0.34, 0.1, 0.18);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const b = new Mesh(new ConeGeometry(0.05, 0.32, 5), std('#4b8f4f'));
    b.position.set(-0.28 + Math.cos(a) * 0.14, 0.64, 0.1 + Math.sin(a) * 0.14);
    b.rotation.set(Math.cos(a) * 1.0, 0, -Math.sin(a) * 1.0);
    g.add(b);
  }
};
/** A small island ringed by water. */
const island: Figure = (g) => {
  disc(g, '#3f86b8', 0.62, 0, 0.02);
  put(g, new Mesh(new SphereGeometry(0.3, 16, 10), std('#e6d2a8')), 0, 0.06).scale.set(1, 0.4, 1);
  ball(g, '#4b8f4f', 0.14, 0.06, 0.2);
  ball(g, '#e07a8a', 0.07, -0.16, 0.12, 0.12);
};
/** A wetland: open water with reeds. */
const wetland: Figure = (g) => {
  disc(g, '#3b7a8f', 0.6, 0, 0.02);
  for (let i = 0; i < 9; i++) {
    const a = i * 1.4, r = 0.2 + (i % 3) * 0.14;
    rod(g, '#7f9e4a', 0.018, 0.3 + (i % 3) * 0.1, Math.cos(a) * r, 0.18, Math.sin(a) * r);
  }
  ball(g, '#f4f6f8', 0.06, 0.1, 0.08, -0.1).scale.set(1.6, 0.5, 1);
};
/** Terraced rows on a slope: the tea garden. */
const teaGarden: Figure = (g) => {
  for (let i = 0; i < 4; i++) {
    const y = i * 0.13, z = -i * 0.18;
    const t = put(g, new Mesh(new BoxGeometry(1.0 - i * 0.12, 0.1, 0.22), std('#3f6b3a')), 0, y + 0.05, z);
    void t;
    for (let k = 0; k < 4; k++) ball(g, '#4f8f4a', 0.06, (k - 1.5) * 0.22, y + 0.14, z);
  }
};
/** Layered hills. */
const hills: Figure = (g) => {
  for (let i = 0; i < 3; i++) {
    const c = ['#5b7a5a', '#4a6b52', '#3c5a49'][i]!;
    const m = put(g, new Mesh(new ConeGeometry(0.42 - i * 0.05, 0.5 + i * 0.12, 5), std(c)), (i - 1) * 0.34, 0.25 + i * 0.06, -i * 0.2);
    void m;
  }
};
/** A dense patch of forest. */
const forest: Figure = (g) => {
  for (let i = 0; i < 5; i++) {
    const a = i * 1.25, r = 0.22;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    rod(g, '#6b4a2a', 0.035, 0.34, x, 0.17, z);
    ball(g, i % 2 ? '#2f6b3f' : '#3f7a42', 0.2, x, 0.5, z);
  }
};
/** A road bridge on piers over water. */
const bridge: Figure = (g) => {
  disc(g, '#3b6b8f', 0.7, 0, 0.02);
  box(g, '#c3ccd6', 1.2, 0.07, 0.24, 0, 0.44);
  for (let i = 0; i < 4; i++) rod(g, '#9aa5b1', 0.05, 0.42, (i - 1.5) * 0.32, 0.22);
  for (let i = 0; i < 4; i++) box(g, '#8a94a0', 0.03, 0.2, 0.03, (i - 1.5) * 0.32, 0.57, 0.1);
};

/* ---------- dishes ---------- */
/** A plate with a mound and a side. */
const dish = (main: string, side: string, extra?: string): Figure => (g) => {
  put(g, new Mesh(new CylinderGeometry(0.4, 0.34, 0.06, 24), std('#f4f7fa')), 0, 0.03);
  const m = put(g, new Mesh(new SphereGeometry(0.22, 14, 10), std(main)), -0.08, 0.12);
  m.scale.set(1, 0.55, 1);
  const s2 = put(g, new Mesh(new SphereGeometry(0.13, 12, 8), std(side)), 0.18, 0.1, 0.05);
  s2.scale.set(1, 0.6, 1);
  if (extra) ball(g, extra, 0.07, 0.12, 0.12, -0.16);
};
/** A bowl of something thick. */
const bowlDish = (color: string): Figure => (g) => {
  put(g, new Mesh(new CylinderGeometry(0.3, 0.2, 0.22, 20), std('#eef2f6')), 0, 0.12);
  const h = put(g, new Mesh(new SphereGeometry(0.26, 14, 10), std(color)), 0, 0.24);
  h.scale.set(1, 0.45, 1);
};
/** A stack of flat cakes. */
const pitha: Figure = (g) => {
  for (let i = 0; i < 3; i++) put(g, new Mesh(new CylinderGeometry(0.24 - i * 0.02, 0.24 - i * 0.02, 0.07, 18), std(i % 2 ? '#f0e2c8' : '#e6d2a8')), 0, 0.05 + i * 0.075);
  ball(g, '#c08a3a', 0.05, 0, 0.3);
};
/** A round sweet in syrup. */
const sweet: Figure = (g) => {
  put(g, new Mesh(new CylinderGeometry(0.3, 0.26, 0.1, 20), std('#e8eef5')), 0, 0.05);
  for (let i = 0; i < 3; i++) {
    const a = i * 2.1;
    ball(g, '#b5762f', 0.12, Math.cos(a) * 0.11, 0.15, Math.sin(a) * 0.11);
  }
};

/* ---------- geology ---------- */
/** A rough rock. */
const rock = (color = '#7d848c'): Figure => (g) => {
  const r = put(g, new Mesh(new IcosahedronGeometry(0.3, 0), std(color, { flatShading: true })), 0, 0.26);
  r.rotation.set(0.5, 0.8, 0.2);
};
/** A shell pressed into stone. */
const fossil: Figure = (g) => {
  const slab = put(g, new Mesh(new CylinderGeometry(0.34, 0.34, 0.12, 8), std('#a89a86')), 0, 0.06);
  void slab;
  for (let i = 0; i < 5; i++) {
    const t = put(g, new Mesh(new TorusGeometry(0.06 + i * 0.04, 0.016, 6, 18, Math.PI * 1.5), std('#6b6257')), 0, 0.13, 0, -Math.PI / 2);
    t.rotation.z = i * 0.5;
  }
};
/** A long-necked dinosaur. */
const dino: Figure = (g) => {
  const b = put(g, new Mesh(new SphereGeometry(0.26, 14, 10), std('#5f7a4a')), 0, 0.34);
  b.scale.set(1.5, 0.9, 0.9);
  rod(g, '#5f7a4a', 0.05, 0.44, 0.3, 0.56, 0, -0.35);
  ball(g, '#5f7a4a', 0.09, 0.44, 0.76);
  const t = rod(g, '#5f7a4a', 0.04, 0.5, -0.38, 0.38, 0, 0.8);
  void t;
  for (const [dx, dz] of [[0.16, 0.14], [0.16, -0.14], [-0.16, 0.14], [-0.16, -0.14]] as const)
    rod(g, '#4f6a3a', 0.055, 0.3, dx, 0.15, dz);
};
/** An iceberg on water. */
const iceberg: Figure = (g) => {
  disc(g, '#3b6b8f', 0.6, 0, 0.02);
  const i1 = put(g, new Mesh(new ConeGeometry(0.3, 0.5, 5), std('#dff0fb')), 0, 0.25);
  i1.rotation.y = 0.4;
  put(g, new Mesh(new ConeGeometry(0.18, 0.26, 5), std('#eaf7ff')), 0.22, 0.13);
};
/** Stacked bands of soil. */
const strata: Figure = (g) => {
  const cols = ['#6b5233', '#8a6a44', '#b09873', '#cbb894'];
  for (let i = 0; i < cols.length; i++)
    put(g, new Mesh(new CylinderGeometry(0.34, 0.34, 0.12, 18), std(cols[i]!)), 0, 0.06 + i * 0.12);
};
/** A black lump and a dark drop: coal and oil. */
const coalOil: Figure = (g) => {
  const r = put(g, new Mesh(new IcosahedronGeometry(0.22, 0), std('#2b2b2e', { flatShading: true })), -0.16, 0.2);
  r.rotation.set(0.4, 0.9, 0.1);
  const d = ball(g, '#1d1a16', 0.16, 0.2, 0.22);
  d.scale.set(1, 1.2, 1);
  cone(g, '#1d1a16', 0.11, 0.2, 0.2, 0.42);
};
/** A globe split into drifting pieces. */
const continents: Figure = (g) => {
  ball(g, '#3b6b8f', 0.32, 0, 0.36);
  for (let i = 0; i < 4; i++) {
    const a = i * 1.6;
    const p = put(g, new Mesh(new SphereGeometry(0.14, 10, 8), std('#4f8f4a')), Math.cos(a) * 0.24, 0.36 + Math.sin(a) * 0.16, 0.2);
    p.scale.set(1, 0.7, 0.4);
  }
};

/* ---------- safety and everyday ---------- */
/** An open palm: touch, and saying no. */
const palmHand = (color = '#e8b98e'): Figure => (g) => {
  const p = put(g, new Mesh(new SphereGeometry(0.2, 14, 10), std(color)), 0, 0.34);
  p.scale.set(1, 1.15, 0.45);
  for (let i = 0; i < 4; i++) put(g, new Mesh(new CylinderGeometry(0.035, 0.035, 0.2, 8), std(color)), (i - 1.5) * 0.09, 0.58, 0);
  put(g, new Mesh(new CylinderGeometry(0.038, 0.038, 0.16, 8), std(color)), -0.2, 0.36, 0, 0, 0, 0.9);
};
/** A red octagon on a post. */
const stopSign: Figure = (g) => {
  rod(g, '#8a94a0', 0.03, 0.5, 0, 0.25);
  const s = put(g, new Mesh(new CylinderGeometry(0.26, 0.26, 0.05, 8), std('#c0392b')), 0, 0.62, 0, Math.PI / 2);
  s.rotation.z = Math.PI / 8;
  box(g, '#f8fbff', 0.26, 0.05, 0.02, 0, 0.62, 0.04);
};
/** Black and white bars: the crossing. */
const crossing: Figure = (g) => {
  box(g, '#33383f', 0.9, 0.04, 0.6, 0, 0.02);
  for (let i = 0; i < 4; i++) box(g, '#f4f7fa', 0.12, 0.05, 0.56, (i - 1.5) * 0.2, 0.04);
};
/** A flame. */
const flame: Figure = (g) => {
  for (let i = 0; i < 3; i++) {
    const c = ['#e8622b', '#f0a52b', '#f7d84a'][i]!;
    const f = put(g, new Mesh(new ConeGeometry(0.2 - i * 0.05, 0.5 - i * 0.1, 10), std(c, { emissive: c, emissiveIntensity: 0.4 })), 0, 0.25 + i * 0.03);
    void f;
  }
};
/** A medicine bottle with a cap. */
const medicine: Figure = (g) => {
  put(g, new Mesh(new CylinderGeometry(0.17, 0.17, 0.4, 16), std('#c9603f', { transparent: true, opacity: 0.9 })), 0, 0.22);
  put(g, new Mesh(new CylinderGeometry(0.12, 0.12, 0.1, 14), std('#e8eef5')), 0, 0.46);
  box(g, '#f8fbff', 0.2, 0.14, 0.02, 0, 0.24, 0.17);
};
/** Waves with a warning buoy. */
const water: Figure = (g) => {
  disc(g, '#3b7a9e', 0.6, 0, 0.02);
  for (let i = 0; i < 3; i++) {
    const w = put(g, new Mesh(new TorusGeometry(0.18 + i * 0.13, 0.02, 6, 22, Math.PI), std('#7fc2e0')), 0, 0.06, 0, -Math.PI / 2);
    void w;
  }
  ball(g, '#e8622b', 0.1, 0.05, 0.12);
};
/** Colour swatches, for the words about colour. */
const swatches: Figure = (g) => {
  const cols = ['#c0392b', '#2f8f5b', '#3d6b8f', '#f0b429', '#8a4a9e'];
  for (let i = 0; i < cols.length; i++) box(g, cols[i]!, 0.16, 0.34, 0.05, (i - 2) * 0.18, 0.2, 0, (i - 2) * 0.06);
};
/** A shirt on a hanger. */
const shirt = (color = '#3d6b8f'): Figure => (g) => {
  box(g, color, 0.42, 0.4, 0.08, 0, 0.32);
  for (const s of [1, -1]) box(g, color, 0.16, 0.12, 0.08, s * 0.28, 0.48, 0, s * 0.5);
  put(g, new Mesh(new TorusGeometry(0.06, 0.014, 6, 14, Math.PI), std('#9aa5b1')), 0, 0.6, 0);
};
/** A bus, for the words about vehicles. */
const bus = (color = '#c8a24a'): Figure => (g) => {
  box(g, color, 0.8, 0.34, 0.34, 0, 0.3);
  box(g, '#9fd8ff', 0.6, 0.14, 0.36, 0.02, 0.38);
  for (const dx of [-0.25, 0.25]) put(g, new Mesh(new CylinderGeometry(0.11, 0.11, 0.36, 14), std('#2b2b2e')), dx, 0.11, 0, Math.PI / 2);
};
/** A pair of figures side by side: family, and words about people. */
const family: Figure = (g) => {
  const one = (x: number, h: number, coat: string) => {
    ball(g, '#e8b98e', 0.11 * h, x, 0.56 * h);
    put(g, new Mesh(new CylinderGeometry(0.13 * h, 0.17 * h, 0.36 * h, 12), std(coat)), x, 0.3 * h);
  };
  one(-0.2, 1.15, '#3d6b8f'); one(0.12, 1.0, '#a8563c'); one(0.34, 0.7, '#2f8f5b');
};
/** A speech bubble: sounds and words. */
const bubble = (color = '#f4f7fa'): Figure => (g) => {
  const b = ball(g, color, 0.28, 0, 0.48);
  b.scale.set(1.3, 1, 0.5);
  cone(g, color, 0.08, 0.16, -0.1, 0.24, 0, 0.4);
  for (let i = 0; i < 3; i++) ball(g, '#8a94a0', 0.035, (i - 1) * 0.11, 0.48, 0.15);
};
/** Two arrows facing away: opposites. */
const opposites: Figure = (g) => {
  for (const s of [1, -1]) {
    box(g, s > 0 ? '#3d6b8f' : '#c0392b', 0.3, 0.08, 0.08, s * 0.2, 0.34);
    cone(g, s > 0 ? '#3d6b8f' : '#c0392b', 0.11, 0.16, s * 0.42, 0.34, 0, -s * Math.PI / 2);
  }
};
/** A volcano of foam. */
const volcano: Figure = (g) => {
  put(g, new Mesh(new ConeGeometry(0.36, 0.44, 14, 1, true), std('#7a5a45', { side: DoubleSide })), 0, 0.22);
  for (let i = 0; i < 7; i++) {
    const a = i * 1.2, r = 0.06 + (i % 3) * 0.07;
    ball(g, '#e8622b', 0.07, Math.cos(a) * r, 0.46 + (i % 3) * 0.09, Math.sin(a) * r);
  }
};
/** A lemon with two electrodes. */
const lemonBattery: Figure = (g) => {
  const l = ball(g, '#e8d44a', 0.22, 0, 0.24);
  l.scale.set(1.35, 1, 1);
  box(g, '#b5762f', 0.05, 0.22, 0.05, -0.1, 0.44);
  box(g, '#9aa5b1', 0.05, 0.22, 0.05, 0.1, 0.44);
  ball(g, '#ffe9a8', 0.06, 0.24, 0.5);
};
/** Strips of colour climbing a sheet. */
const rainbowPaper: Figure = (g) => {
  box(g, '#f8fbff', 0.44, 0.6, 0.02, 0, 0.32);
  const cols = ['#c0392b', '#f0a52b', '#f7d84a', '#2f8f5b', '#3d6b8f'];
  for (let i = 0; i < cols.length; i++) box(g, cols[i]!, 0.36, 0.07, 0.025, 0, 0.14 + i * 0.1, 0.012);
};
/** A glass of separated layers. */
const layers: Figure = (g) => {
  put(g, new Mesh(new CylinderGeometry(0.19, 0.16, 0.48, 18, 1, true), new MeshStandardMaterial({ color: '#dce8f5', transparent: true, opacity: 0.32, side: DoubleSide })), 0, 0.26);
  const cols = ['#b5762f', '#3d6b8f', '#e8c86a'];
  for (let i = 0; i < 3; i++) put(g, new Mesh(new CylinderGeometry(0.17, 0.16, 0.14, 18), std(cols[i]!, { transparent: true, opacity: 0.9 })), 0, 0.1 + i * 0.14);
};
/** A balloon with a jet of air. */
const balloonRocket: Figure = (g) => {
  const b = ball(g, '#c0392b', 0.22, 0.08, 0.42);
  b.scale.set(1.4, 1, 1);
  cone(g, '#c0392b', 0.08, 0.16, -0.2, 0.42, 0, Math.PI / 2);
  for (let i = 0; i < 3; i++) ball(g, '#cfe0f0', 0.04, -0.34 - i * 0.1, 0.42);
};
/** An egg floating in a glass. */
const floatEgg: Figure = (g) => {
  put(g, new Mesh(new CylinderGeometry(0.21, 0.18, 0.5, 18, 1, true), new MeshStandardMaterial({ color: '#dce8f5', transparent: true, opacity: 0.32, side: DoubleSide })), 0, 0.27);
  put(g, new Mesh(new CylinderGeometry(0.19, 0.18, 0.3, 18), std('#9fd0ea', { transparent: true, opacity: 0.6 })), 0, 0.18);
  const e = ball(g, '#f6efe2', 0.11, 0, 0.34);
  e.scale.set(1, 1.25, 1);
};
/** A gnomon casting a shadow on a dial. */
const sundial: Figure = (g) => {
  put(g, new Mesh(new CylinderGeometry(0.36, 0.36, 0.06, 22), std('#d9cdb4')), 0, 0.03);
  const gn = put(g, new Mesh(new ConeGeometry(0.06, 0.4, 3), std('#8a6a44')), 0, 0.24, 0, 0, 0, 0.35);
  void gn;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    box(g, '#8a7a5a', 0.02, 0.01, 0.08, Math.cos(a) * 0.27, 0.07, Math.sin(a) * 0.27, a);
  }
};
/** A bar magnet with iron filings. */
const magnet: Figure = (g) => {
  box(g, '#c0392b', 0.18, 0.42, 0.14, -0.11, 0.28);
  box(g, '#3d6b8f', 0.18, 0.42, 0.14, 0.11, 0.28);
  box(g, '#8a94a0', 0.4, 0.12, 0.14, 0, 0.05);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI;
    const f = box(g, '#6b7583', 0.02, 0.08, 0.02, Math.cos(a) * 0.3, 0.55 + Math.sin(a) * 0.12, 0, a);
    void f;
  }
};

/** Everything a category can be built from, keyed by name. */
export const FIGURES: Record<string, Figure> = {
  // faces, one per feeling
  faceHappy: faceFig({ brow: 'up', eye: 'squint', mouth: 'smile', cheek: '#e8a0a0' }),
  faceSad: faceFig({ brow: 'sad', eye: 'droop', mouth: 'frown' }),
  faceAngry: faceFig({ brow: 'angry', eye: 'open', mouth: 'flat' }),
  faceAfraid: faceFig({ brow: 'up', eye: 'wide', mouth: 'o' }),
  faceShy: faceFig({ brow: 'sad', eye: 'squint', mouth: 'small', cheek: '#e8a0a0' }),
  faceJealous: faceFig({ brow: 'angry', eye: 'squint', mouth: 'small' }),
  faceProud: faceFig({ brow: 'up', eye: 'open', mouth: 'smile' }),
  faceLonely: faceFig({ brow: 'sad', eye: 'droop', mouth: 'flat' }),
  faceExcited: faceFig({ brow: 'up', eye: 'wide', mouth: 'smile', cheek: '#e8a0a0' }),
  faceFlat: faceFig({ brow: 'flat', eye: 'droop', mouth: 'flat' }),
  // places
  mangrove, beach, island, wetland, teaGarden, hills, forest, bridge,
  // dishes
  riceDal: dish('#fbfbf6', '#e8c05a'), friedFish: dish('#d8b070', '#e8c05a'),
  bhorta: dish('#b5762f', '#4f8f4a', '#c0392b'), khichuri: bowlDish('#e2c05a'),
  pitha, payesh: bowlDish('#f2e6d0'), sweet, haleem: bowlDish('#8a5a33'),
  panta: bowlDish('#eef2f6'), dateBowl: bowlDish('#7a4a2a'),
  // geology
  rock: rock(), mineral: crystal('#8fd6e8'), fossil, dino, iceberg, strata, coalOil, continents,
  // safety and everyday words
  palmHand: palmHand(), stopSign, crossing, flame, medicine, waterSafe: water,
  swatches, shirt: shirt(), bus: bus(), family, bubble: bubble(), opposites,
  // home experiments
  volcano, lemonBattery, rainbowPaper, layers, balloonRocket, floatEgg, sundial, magnet,
  // plants
  mango: broadleaf('#3f7a42', '#7a4f2a', 0.55, 0.42, 3), jackfruit: broadleaf('#356b39', '#6b4a2a', 0.6, 0.44, 7),
  banyan: broadleaf('#2f6b3f', '#8a6a44', 0.42, 0.54, 11), palm: palm('#4b8f4f', '#8a6a44', 0.85, 5),
  simul: broadleaf('#5f9e4a', '#9aa5b1', 0.66, 0.36, 17), krishnachura: broadleaf('#d94a3a', '#6b4a2a', 0.55, 0.42, 23),
  sundari: broadleaf('#3d6b4a', '#5b4a3a', 0.45, 0.36, 29), golpata: palm('#3f7a52', '#5b4a3a', 0.3, 15),
  bamboo: culms('#8fae5a', '#5f9e4a', 4), paddy: culms('#c8b25a', '#a8bf5a', 12),
  jute: culms('#7f9e4a', '#6f8e3a', 21), lily,
  kodom: broadleaf('#3f7a42', '#6b4a2a', 0.6, 0.4, 31), hijol: broadleaf('#2f6b4a', '#6b4a2a', 0.5, 0.44, 37),
  herbGreen: herb('#4b8f4f'), herbDark: herb('#2f6b3f'), herbPale: herb('#8fae5a'),
  shrubGreen: shrub('#3f7a42'), shrubPale: shrub('#8fae5a'),
  // animals
  tiger: quadruped('#e08a2b', { stripe: '#2a2118', tail: 0.34 }),
  elephant: quadruped('#9aa0a8', { big: true, trunk: true, tail: 0.2 }),
  leopardCat: quadruped('#d8b070', { stripe: '#6b5136', tail: 0.3 }),
  hilsa: fish('#c9d3dc', '#9fb0c0'), fishSmall: fish('#8fae5a'), doel: bird('#1d232b', '#f4f8fc'),
  kingfisher: bird('#2f6b9e', '#e8a33d'), vulture: bird('#6b6257', '#4a443c', '#c9c2b6'),
  dolphin, croc, turtle, bee, monkey,
  flyingBird: flyingBird(), coral: coral(),
  // food and kitchen
  riceBowl, pot: pot(), glassWater: glass(), oilDrop: drop('#e8c86a'), waterDrop: drop('#79b6e8'),
  salt: crystal('#f4f8fc'), sugarFruit: fruit('#f0b429'), mangoFruit: fruit('#f5a623'),
  greenFruit: fruit('#5f9e4a'), redFruit: fruit('#c0392b'),
  turmeric: bowl('#e8a33d'), chilliPowder: bowl('#c0392b'), cumin: seeds('#8a6a44'),
  coriander: seeds('#c9b98f'), mustard: seeds('#d9b44a'), fenugreek: seeds('#c8a24a'),
  cinnamon: sticks('#8a5a33', 4, true), bayLeaf: sticks('#4b7a3a', 3),
  cardamom: seeds('#9fb06a'), chilliPod: chilli('#c0392b'), garamMasala: bowl('#7a4a2a'),
  tap, flask: flask(),
  // money and market
  coins: coinStack(), building: building(), card: card(), phone: phone(), sheet: sheet(),
  stall: stall(), arrowUp: arrowUp(), lock: lock(), envelope: envelope(),
  // people and tools
  personBlue: person('#3d6b8f'), personGreen: person('#2f8f5b'), personRed: person('#a8563c'),
  personTeal: person('#2f7f8f'), personPlum: person('#6b4a7a'), personSand: person('#a8843c'),
  personSlate: person('#4c5867'),
  thermometer, balance, ruler, microscope, telescope, compass,
  clockFace, stopwatch, barometer,
  gear: gear(), bulb, wheel, book: book(), monitor, robot,
  // places and weather
  house: house(), cloudDrop, soil: soil(), sunDisc,
};

/** Lay out n groups on a shallow arc facing the camera, biggest set spread widest. */
/**
 * Where the i-th of n figures stands.
 *
 * This used to be at most two rows, which for fourteen items meant seven
 * abreast: a hedge, edge to edge, with every figure touching its neighbours
 * and the camera forced so far back that none of them could be seen. Now it
 * builds a grove. At most five to a row, rows staggered by half a step so the
 * ones behind show through the gaps rather than hiding directly behind the
 * ones in front, pushed further apart in depth, and lifted slightly toward the
 * back so the whole group reads as receding ground rather than a flat wall.
 */
export function arc(n: number, i: number): Vector3 {
  const perRow = n <= 5 ? n : n <= 8 ? Math.ceil(n / 2) : 5;
  const rows = Math.ceil(n / perRow);
  const row = Math.floor(i / perRow);
  const inRow = Math.min(perRow, n - row * perRow);
  const k = i - row * perRow;
  const spanX = Math.max(2.4, (perRow - 1) * 1.02);
  // Half-step stagger on alternate rows: the single change that turns a grid
  // into something that looks grown rather than planted by a machine.
  const offset = row % 2 ? spanX / (perRow - 1 || 1) * 0.5 : 0;
  const x = inRow === 1 && rows === 1 ? 0 : (k / Math.max(1, perRow - 1) - 0.5) * spanX + offset;
  const z = -row * 1.55;
  const y = -0.55 + row * 0.07;
  // A gentle bow, so the ends of a row turn toward the camera instead of
  // trailing off sideways.
  return new Vector3(x, y, z + Math.abs(x) * 0.22);
}

export { std as figMaterial };
export type { Object3D };
