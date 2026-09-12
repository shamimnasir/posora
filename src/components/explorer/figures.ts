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

const std = (color: string | Color, o: Record<string, unknown> = {}) =>
  new MeshStandardMaterial({ color: color as Color, roughness: 0.6, metalness: 0.05, ...o });
const glow = (color: string, opacity = 0.4) =>
  new MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });

/** A figure builder: fills `g` with one object, roughly 1 unit across, sitting on y = 0. */
export type Figure = (g: Group) => void;

const put = (g: Group, m: Mesh, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m;
};
const ball = (g: Group, c: string, r: number, x = 0, y = 0, z = 0) =>
  put(g, new Mesh(new SphereGeometry(r, 16, 12), std(c)), x, y, z);
const box = (g: Group, c: string, w: number, h: number, d: number, x = 0, y = 0, z = 0, rz = 0) =>
  put(g, new Mesh(new BoxGeometry(w, h, d), std(c)), x, y, z, 0, 0, rz);
const rod = (g: Group, c: string, r: number, h: number, x = 0, y = 0, z = 0, rz = 0, rx = 0) =>
  put(g, new Mesh(new CylinderGeometry(r, r, h, 10), std(c)), x, y, z, rx, 0, rz);
const cone = (g: Group, c: string, r: number, h: number, x = 0, y = 0, z = 0, rz = 0) =>
  put(g, new Mesh(new ConeGeometry(r, h, 12), std(c)), x, y, z, 0, 0, rz);
const disc = (g: Group, c: string, r: number, x = 0, y = 0, z = 0, rx = -Math.PI / 2) =>
  put(g, new Mesh(new CircleGeometry(r, 24), std(c, { side: DoubleSide })), x, y, z, rx);

/* ---------- trees and plants ---------- */
/** A trunk with a rounded crown: the default shape of a Bangladeshi shade tree. */
const broadleaf = (crown: string, trunk = '#7a4f2a', h = 0.55, spread = 0.42): Figure => (g) => {
  rod(g, trunk, 0.055, h, 0, h / 2);
  ball(g, crown, spread, 0, h + spread * 0.62);
  ball(g, crown, spread * 0.62, spread * 0.5, h + spread * 0.3);
  ball(g, crown, spread * 0.58, -spread * 0.52, h + spread * 0.38);
};
/** A bare stem with a fan of stiff blades: palms and their relatives. */
const palm = (leaf: string, trunk = '#8a6a44', h = 0.85): Figure => (g) => {
  rod(g, trunk, 0.05, h, 0, h / 2);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const b = new Mesh(new ConeGeometry(0.07, 0.5, 5), std(leaf));
    b.position.set(Math.cos(a) * 0.2, h + 0.16, Math.sin(a) * 0.2);
    b.rotation.set(Math.cos(a) * 1.0, 0, -Math.sin(a) * 1.0);
    g.add(b);
  }
};
/** Several thin culms with narrow leaves: bamboo, and by shape also cane. */
const culms = (stem: string, leaf: string): Figure => (g) => {
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 0.11, h = 0.8 + i * 0.1;
    rod(g, stem, 0.028, h, x, h / 2);
    for (let k = 1; k <= 3; k++) {
      const b = new Mesh(new ConeGeometry(0.035, 0.24, 4), std(leaf));
      b.position.set(x + (k % 2 ? 0.11 : -0.11), h * 0.35 + k * 0.16, 0);
      b.rotation.z = (k % 2 ? -1 : 1) * 1.1;
      g.add(b);
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

/** Everything a category can be built from, keyed by name. */
export const FIGURES: Record<string, Figure> = {
  // plants
  mango: broadleaf('#3f7a42'), jackfruit: broadleaf('#356b39', '#6b4a2a', 0.6, 0.44),
  banyan: broadleaf('#2f6b3f', '#8a6a44', 0.42, 0.5), palm: palm('#4b8f4f'),
  simul: broadleaf('#5f9e4a', '#9aa5b1', 0.62, 0.38), krishnachura: broadleaf('#d94a3a', '#6b4a2a', 0.55, 0.4),
  sundari: broadleaf('#3d6b4a', '#5b4a3a', 0.45, 0.36), golpata: palm('#3f7a52', '#5b4a3a', 0.3),
  bamboo: culms('#8fae5a', '#5f9e4a'), paddy: culms('#c8b25a', '#a8bf5a'),
  jute: culms('#7f9e4a', '#6f8e3a'), lily,
  kodom: broadleaf('#3f7a42', '#6b4a2a', 0.6, 0.4), hijol: broadleaf('#2f6b4a', '#6b4a2a', 0.5, 0.42),
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
export function arc(n: number, i: number): Vector3 {
  const cols = Math.min(n, n <= 6 ? n : Math.ceil(n / 2));
  const row = n <= 6 ? 0 : Math.floor(i / cols);
  const rows = n <= 6 ? 1 : Math.ceil(n / cols);
  const inRow = n <= 6 ? n : Math.min(cols, n - row * cols);
  const k = n <= 6 ? i : i - row * cols;
  const spanX = Math.max(2.6, inRow * 0.78);
  const x = inRow === 1 ? 0 : (k / (inRow - 1) - 0.5) * spanX;
  const z = (row - (rows - 1) / 2) * -1.3;
  const y = -0.55 + row * 0.12;
  return new Vector3(x, y, z + Math.abs(x) * 0.16);
}

export { std as figMaterial };
export type { Object3D };
