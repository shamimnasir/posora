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
  MeshStandardMaterial, MeshBasicMaterial, DoubleSide, Vector2, Vector3, Shape, ExtrudeGeometry,
  LatheGeometry,
} from 'three';
// Seeded, so a species always grows the same way: the variation between trees
// is deliberate, and a tree must not reshuffle itself on every repaint.
import { rng, hash } from '../../lib/rand';
import { stylise } from './render';

/**
 * Roughness 0.75 rather than 0.6, and metalness flat zero.
 *
 * These figures are bark, leaf, cloth and clay. The old settings gave every
 * one of them a faint sheen that reads as plastic, which was invisible while
 * there was no environment map to reflect and became obvious the moment there
 * was one. Anything that genuinely is metal or glazed passes its own values.
 */
const std = (color: string | Color, o: Record<string, unknown> = {}) =>
  stylise(new MeshStandardMaterial({ color: color as Color, roughness: 0.6, metalness: 0, envMapIntensity: 0.8, ...o }));
const glow = (color: string, opacity = 0.4) =>
  new MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });

/** A figure builder: fills `g` with one object, roughly 1 unit across, sitting on y = 0. */
export type Figure = (g: Group) => void;

const put = (g: Group, m: Mesh, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m;
};
/** 24x16 rather than 16x12: these are the hero of the screen now, and a
 *  faceted silhouette is the first thing that gives cheap 3D away. */
const ball = (g: Group, c: string | Color, r: number, x = 0, y = 0, z = 0) =>
  put(g, new Mesh(new SphereGeometry(r, 24, 16), std(c)), x, y, z);
/**
 * Boxes with the edges taken off.
 *
 * A BoxGeometry edge is a perfectly sharp right angle, and at the size these
 * are now drawn that single fact does more to say "untextured CAD" than
 * anything else in the scene. Nothing a child recognises has one: not a
 * tiger's stripe, not a book, not a bus, not a slab of rock. A bevel of about
 * a tenth of the smallest side catches the key light along every edge, which
 * is the highlight that reads as a made object rather than a primitive.
 *
 * Cached on a quantised key, because the same handful of sizes recur across
 * ninety figures and an ExtrudeGeometry is not free. Anything thinner than
 * 3cm in scene units keeps the cheap sharp box: a bevel that size is invisible
 * and would eat most of the sliver it is bevelling.
 */
const boxCache = new Map<string, ExtrudeGeometry>();
function roundedBox(w: number, h: number, d: number): ExtrudeGeometry {
  const q = (n: number) => Math.round(n * 500) / 500;
  const key = `${q(w)}|${q(h)}|${q(d)}`;
  const hit = boxCache.get(key);
  if (hit) return hit;
  const bev = Math.min(0.02, Math.min(w, h, d) * 0.16);
  const W = w / 2 - bev, H = h / 2 - bev;
  const sh = new Shape();
  sh.moveTo(-W, -H); sh.lineTo(W, -H); sh.lineTo(W, H); sh.lineTo(-W, H); sh.closePath();
  const geo = new ExtrudeGeometry(sh, {
    depth: Math.max(1e-4, d - bev * 2), bevelEnabled: true,
    bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 1,
  });
  geo.translate(0, 0, -(d - bev * 2) / 2 - bev);
  geo.computeVertexNormals();
  geo.userData.shared = true;
  boxCache.set(key, geo);
  return geo;
}
const box = (g: Group, c: string | Color, w: number, h: number, d: number, x = 0, y = 0, z = 0, rz = 0) =>
  put(g, new Mesh(
    Math.min(w, h, d) >= 0.03 ? roundedBox(w, h, d) : new BoxGeometry(w, h, d),
    std(c),
  ), x, y, z, 0, 0, rz);
const rod = (g: Group, c: string | Color, r: number, h: number, x = 0, y = 0, z = 0, rz = 0, rx = 0) =>
  put(g, new Mesh(new CylinderGeometry(r, r, h, 20), std(c)), x, y, z, rx, 0, rz);
/** A tapered rod: a trunk, a branch, a stalk. Nothing in nature is a cylinder. */
const taper = (g: Group, c: string | Color, rTop: number, rBot: number, h: number, x = 0, y = 0, z = 0, rz = 0, rx = 0) =>
  put(g, new Mesh(new CylinderGeometry(rTop, rBot, h, 20), std(c)), x, y, z, rx, 0, rz);
const cone = (g: Group, c: string | Color, r: number, h: number, x = 0, y = 0, z = 0, rz = 0) =>
  put(g, new Mesh(new ConeGeometry(r, h, 20), std(c)), x, y, z, 0, 0, rz);
/**
 * A slab with rounded corners, for the things that really do have them: a bank
 * card, a phone, a padlock body. A BoxGeometry corner is a perfectly sharp
 * right angle, which nothing manufactured actually has, and at this size the
 * sharpness is the first thing that reads as untextured CAD.
 *
 * Cached, because the same few sizes recur and an ExtrudeGeometry is not free.
 */
const cardCache = new Map<string, ExtrudeGeometry>();
function roundedCard(w: number, h: number, d: number, r = 0.05): ExtrudeGeometry {
  const key = `${w}|${h}|${d}|${r}`;
  const hit = cardCache.get(key);
  if (hit) return hit;
  const rad = Math.max(0.004, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3));
  const W = w / 2, H = h / 2;
  const sh = new Shape();
  sh.moveTo(-W + rad, -H);
  sh.lineTo(W - rad, -H); sh.quadraticCurveTo(W, -H, W, -H + rad);
  sh.lineTo(W, H - rad); sh.quadraticCurveTo(W, H, W - rad, H);
  sh.lineTo(-W + rad, H); sh.quadraticCurveTo(-W, H, -W, H - rad);
  sh.lineTo(-W, -H + rad); sh.quadraticCurveTo(-W, -H, -W + rad, -H);
  const geo = new ExtrudeGeometry(sh, { depth: d, bevelEnabled: false, curveSegments: 4 });
  geo.translate(0, 0, -d / 2);
  geo.computeVertexNormals();
  geo.userData.shared = true;
  cardCache.set(key, geo);
  return geo;
}
const disc = (g: Group, c: string | Color, r: number, x = 0, y = 0, z = 0, rx = -Math.PI / 2) =>
  put(g, new Mesh(new CircleGeometry(r, 32), std(c, { side: DoubleSide })), x, y, z, rx);
/**
 * A ring lying flat in the ground plane: a plate rim, a coin edge, a line of surf.
 *
 * `TorusGeometry` is built in the XY plane, so a torus added with no rotation
 * stands upright like a wheel. Almost every ring on this page wants the other
 * orientation, and the mistake is invisible in the code and unmistakable on
 * screen: it had turned all three plate rims into basket handles standing over
 * the food, the coin stack into a gold spring, the beach surf and the island's
 * ripples into croquet hoops, and it was sitting in nine more figures besides.
 * Ask for a rim by name and it cannot happen again. A torus that genuinely
 * should stand up - a padlock shackle, a hanger hook, a mouth on a face - is
 * still written out in full, which now reads as the deliberate choice it is.
 */
const ring = (g: Group, mat: MeshStandardMaterial, r: number, tube: number, x = 0, y = 0, z = 0, seg = 28, arc?: number) =>
  put(g, new Mesh(new TorusGeometry(r, tube, 8, seg, arc), mat), x, y, z, -Math.PI / 2);
/**
 * A sub-group the whole figure is built into, tipped up to face the viewer.
 *
 * The collection shelf puts its camera at y = 0 and looks at y = 0: dead
 * level with the figure, never down on it. Anything built lying flat in the
 * ground plane therefore presents its *edge* and nothing else - the zebra
 * crossing was a dark line, the ruler a pale line, and the fossil showed the
 * rim of its slab with the whole ammonite hidden on the face away from the
 * camera. Tipping the assembly up is one line and costs nothing, where moving
 * every part of it by hand would be a rewrite.
 */
const upright = (root: Group, rx: number, lift: number, rz = 0): Group => {
  const sub = new Group();
  sub.rotation.set(rx, 0, rz);
  sub.position.y = lift;
  root.add(sub);
  return sub;
};

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
  put(g, new Mesh(new CylinderGeometry(0.075, 0.12, 0.09, 20), std(bark.clone().multiplyScalar(0.88))), 0, 0.045, 0);

  // Three branches out of the fork, each carrying its own clump of crown.
  const forkY = h * 0.94;
  const arms = 3;
  for (let i = 0; i < arms; i++) {
    const a = (i / arms) * Math.PI * 2 + r() * 0.9;
    const len = spread * (0.62 + r() * 0.3);
    const tilt = 0.5 + r() * 0.25;
    const br = new Mesh(new CylinderGeometry(0.016, 0.036, len, 14), std(bark.clone().multiplyScalar(0.94)));
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
    const m = new Mesh(new CylinderGeometry(sr * 0.94, sr, h / segs + 0.012, 20), std(bark.clone().offsetHSL(0, 0, (i % 2 ? 0.03 : -0.02))));
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
    /**
     * A frond is a blade, so it has to be flattened.
     *
     * These were six-sided cones at full width in both axes: fat tapered tubes
     * radiating from the crown, which read as a shuttlecock rather than a
     * palm. Squashed to a fifth of their thickness they are blades, and the
     * flat face turns with the frond so it always shows edge up.
     */
    const frond = new Group();
    const inner = new Mesh(new ConeGeometry(0.07, len * 0.62, 5), std(leaf));
    inner.position.y = len * 0.3; inner.rotation.x = Math.PI; inner.scale.set(1, 1, 0.2);
    const outer = new Mesh(new ConeGeometry(0.05, len * 0.58, 5), std(new Color(leaf).offsetHSL(0, 0, -0.05)));
    outer.position.set(0, len * 0.72, len * 0.16); outer.rotation.set(Math.PI + 0.5, 0, 0); outer.scale.set(1, 1, 0.2);
    // the rib, which is the line every frond droops along
    const rib = new Mesh(new CylinderGeometry(0.009, 0.014, len * 0.66, 8), std(new Color(leaf).multiplyScalar(0.8)));
    rib.position.y = len * 0.3;
    frond.add(inner, outer, rib);
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
      const sec = new Mesh(new CylinderGeometry(0.019, 0.023, h / joints - 0.012, 16), std(col));
      sec.position.set(x + lean * f * f, sy, z);
      sec.rotation.z = -lean * f * 0.8;
      g.add(sec);
      // the node itself
      const node = new Mesh(new CylinderGeometry(0.026, 0.026, 0.014, 16), std(col.clone().offsetHSL(0, 0, -0.06)));
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
    put(g, new Mesh(new SphereGeometry(0.08, 16, 12), std('#f4f6f8')), Math.cos(a) * 0.12, 0.1, Math.sin(a) * 0.12).scale.set(1, 0.5, 0.45);
  }
  ball(g, '#f0b429', 0.06, 0, 0.13);
};
/** A low leafy herb in a pot, for the medicinal and kitchen plants. */
const herb = (leaf: string, pot = '#a8643c'): Figure => (g) => {
  const p = put(g, new Mesh(new CylinderGeometry(0.2, 0.15, 0.22, 20), std(pot)), 0, 0.11);
  void p;
  for (let i = 0; i < 7; i++) {
    const a = i * 0.9, r = 0.1 + (i % 3) * 0.05;
    const l = new Mesh(new SphereGeometry(0.1, 20, 14), std(leaf));
    l.position.set(Math.cos(a) * r, 0.28 + (i % 3) * 0.08, Math.sin(a) * r);
    l.scale.set(1.5, 0.5, 0.9); l.rotation.y = a;
    g.add(l);
  }
};

/* ---------- animals ---------- */
/** A four-legged body with a head and tail; stripes or spots are optional. */
/**
 * A four-legged animal: the cow, the goat, the tiger, the deer, the elephant.
 *
 * All of them used to be the same shape in different colours - an ellipsoid, a
 * ball dropped where the head goes, and four identical cylinders - so a tiger
 * was a cow with stripes. Three things carry nearly all of the difference and
 * none of them is a model file: a **neck** joining the head to the shoulder, a
 * **muzzle** on the front of the head, and legs that **taper into a hoof**
 * rather than ending in a flat disc in the grass.
 */
const quadruped = (body: string, opts: {
  stripe?: string; spot?: string; big?: boolean; trunk?: boolean; tail?: number;
  /** Cats are round, deer are tall, an elephant is mostly ear. */
  ear?: 'round' | 'tall' | 'flap';
} = {}): Figure => (g) => {
  const s = opts.big ? 1.25 : 1;
  const dark = new Color(body).multiplyScalar(0.72);
  /**
   * The animal stands on its legs instead of sitting on them.
   *
   * The torso's underside was at y 0.127 and the legs ran from 0.04, so nine
   * hundredths of a unit of leg showed below the belly - about a tenth of the
   * animal's height. Every mammal here read as a dachshund, or worse as a
   * cushion with hooves, and no amount of detail on the head was going to fix
   * a stance that wrong. Everything above the knees moves up together and the
   * legs grow by the same amount, so the feet stay on the floor and every
   * offset inside the body keeps the proportions it was drawn with.
   */
  const lift = 0.12 * s;
  const up = new Group(); up.position.y = lift; g.add(up);
  const b = put(up, new Mesh(new SphereGeometry(0.26 * s, 26, 18), std(body)), 0, 0.34 * s);
  b.scale.set(1.55, 0.82, 0.86);
  /**
   * A pale underside.
   *
   * Almost every land mammal is lighter underneath than on top - the shading
   * that cancels the sun and is the reason a real animal reads as solid rather
   * than as a cut-out. Without it a one-colour torso lit from above goes dark
   * along the belly, which is exactly backwards, and the animal looks like a
   * painted wooden block. Slightly inside the torso so it never pokes through
   * the flanks.
   */
  const pale = new Color(body).lerp(new Color('#fdfaf4'), 0.42);
  const belly = put(up, new Mesh(new SphereGeometry(0.26 * s, 22, 14), std(pale)), 0, 0.3 * s);
  belly.scale.set(1.5, 0.62, 0.8);
  // shoulder and haunch: an animal is thicker at both ends than in the middle
  ball(up, body, 0.17 * s, 0.2 * s, 0.38 * s).scale.set(1, 0.95, 1.02);
  ball(up, body, 0.16 * s, -0.22 * s, 0.37 * s).scale.set(1, 1, 1.04);
  // neck, from the shoulder up to the head
  const neck = taper(up, body, 0.085 * s, 0.13 * s, 0.22 * s, 0.32 * s, 0.42 * s, 0, -0.55);
  void neck;
  const head = ball(up, body, 0.15 * s, 0.42 * s, 0.5 * s); head.scale.set(1.05, 1, 0.92);
  // muzzle: the single feature that turns a ball into an animal's face
  const snout = put(up, new Mesh(new CylinderGeometry(0.07 * s, 0.095 * s, 0.15 * s, 16), std(body)), 0.55 * s, 0.46 * s, 0, 0, 0, -Math.PI / 2);
  void snout;
  ball(up, dark, 0.055 * s, 0.62 * s, 0.46 * s).scale.set(0.7, 1, 1);
  for (const z of [1, -1]) ball(up, '#17120e', 0.024 * s, 0.5 * s, 0.545 * s, z * 0.085 * s);
  /**
   * Ears, which this animal did not have.
   *
   * Every mammal in the site was a body, a head, a muzzle and four legs, and
   * read as a toy from across the room for one reason: the silhouette of a
   * mammal's head is its ears. They are the third thing an eye uses to tell a
   * cat from a dog from a deer, after size and stance, and they cost six
   * triangles. The inner surface is the pale of the belly, because an ear lit
   * from above is bright inside and that is most of what makes it read as an
   * ear rather than a fin.
   */
  {
    const kind = opts.ear ?? (opts.trunk ? 'flap' : 'round');
    for (const z of [1, -1]) {
      const e = new Group();
      e.position.set(0.36 * s, 0.6 * s, z * 0.085 * s);
      e.rotation.set(z * (kind === 'flap' ? 0.5 : 0.34), 0, kind === 'tall' ? -0.15 : 0.18);
      up.add(e);
      // An elephant is mostly ear, and 0.15 by 0.17 is a dog's. Big enough to
      // break the head's outline is the whole point of the feature.
      const w = kind === 'flap' ? 0.25 : kind === 'tall' ? 0.055 : 0.075;
      const h = kind === 'flap' ? 0.24 : kind === 'tall' ? 0.16 : 0.085;
      const shell = put(e, new Mesh(new SphereGeometry(1, 14, 10), std(body)), 0, h * 0.5 * s, 0);
      shell.scale.set(w * 0.55 * s, h * s, w * s);
      const inner = put(e, new Mesh(new SphereGeometry(1, 12, 8), std(pale)), 0.012 * s, h * 0.5 * s, 0);
      inner.scale.set(w * 0.3 * s, h * 0.74 * s, w * 0.72 * s);
    }
  }
  // legs: tapered, with a darker hoof
  for (const [dx, dz] of [[0.24, 0.13], [0.24, -0.13], [-0.24, 0.13], [-0.24, -0.13]] as const) {
    taper(g, body, 0.042 * s, 0.062 * s, 0.3 * s + lift, dx * s, 0.19 * s + lift / 2, dz * s);
    put(g, new Mesh(new CylinderGeometry(0.05 * s, 0.045 * s, 0.06 * s, 14), std(dark)), dx * s, 0.03 * s, dz * s);
  }
  if (opts.tail) {
    /**
     * Rooted at the haunch and sweeping back and down, with a tuft at the tip.
     * `rod` places a cylinder by its centre and turns it about z, so the axis
     * is (-sin rz, cos rz): the root and the tip are the centre plus and minus
     * half a length along that, and rz has to land in the second quadrant for
     * the tip to end up behind the animal and below the root rather than
     * sticking up over its back.
     */
    const L = opts.tail, rz = 2.4, ax = -Math.sin(rz), ay = Math.cos(rz);
    const cx = -0.3 * s + ax * L / 2, cy = 0.46 * s + ay * L / 2;
    rod(up, body, 0.022 * s, L, cx, cy, 0, rz);
    ball(up, dark, 0.035 * s, cx + ax * L / 2, cy + ay * L / 2, 0);
  }
  if (opts.trunk) {
    /**
     * A trunk hangs and curls; a single leaning cone is a snout.
     *
     * The old one was 0.32 long at a fixed 0.35 lean and did not scale with
     * the animal, so on the elephant - the only figure that has one - it came
     * out as a short thick nose. Three segments, each thinner than the last
     * and each turned a little further, give the hang and the curl at the tip
     * that the silhouette is recognised by.
     */
    const seg: [number, number, number, number, number][] = [
      [0.05, 0.042, 0.2, 0.62, 0.42],
      [0.042, 0.03, 0.18, 0.7, 0.26],
      [0.03, 0.02, 0.13, 0.76, 0.12],
    ];
    for (const [rt, rb, len, x, y] of seg) taper(up, body, rt * s, rb * s, len * s, x * s, y * s, 0, 0.12);
    ball(up, dark, 0.022 * s, 0.79 * s, 0.06 * s, 0);
    // tusks, which no other quadruped here has
    for (const z of [1, -1]) {
      const t = taper(up, '#efe6d2', 0.012 * s, 0.022 * s, 0.16 * s, 0.6 * s, 0.4 * s, z * 0.06 * s, 0.7);
      t.rotation.z = 0.95;
    }
  }
  /**
   * Stripes that wrap the animal instead of standing off it.
   *
   * These were flat slabs 0.42 deep dropped at y = 0.4, so on a torso whose
   * top curves away from the middle they stuck out of the back and the flanks
   * as separate black tabs - a tiger wearing five plates. A half-torus sized
   * to the body's own radius at that point arcs over the back and down both
   * sides and stops at the belly, which is where a tiger's stripes stop too.
   */
  if (opts.stripe) {
    const halfLen = 0.26 * 1.55 * s;                 // the torso ellipsoid's x semi-axis
    for (let i = 0; i < 5; i++) {
      const dx = (i - 2) * 0.11 * s;
      const k = Math.sqrt(Math.max(0.15, 1 - (dx / halfLen) ** 2));
      const band = new Mesh(new TorusGeometry(0.216 * s * k, 0.016 * s, 8, 20, Math.PI), std(opts.stripe));
      put(up, band, dx, 0.34 * s, 0, 0, Math.PI / 2, 0);
    }
  }
  /**
   * Rosettes seated on the animal's own surface.
   *
   * চিতা বিড়াল was wearing the tiger's five bands, so the only difference
   * between the two cats in this world was how tan the tan was. A spot placed
   * *near* a curved surface either sinks into it or breaks through it in a
   * crescent, the same trap the fruit's highlight fell into; each one is
   * centred exactly on the surface, turned to face along the normal and then
   * squashed flat against it, so it reads as a mark rather than a pebble.
   */
  if (opts.spot) {
    const rr = rng(0xc1a7);
    const n = new Vector3();
    const mark = (px: number, py: number, pz: number, nx: number, ny: number, nz: number, rad: number) => {
      const sp = new Mesh(new SphereGeometry(rad, 10, 8), std(opts.spot as string));
      sp.position.set(px, py, pz);
      n.set(nx, ny, nz).normalize();
      // lookAt points local +z along the normal, and it reads the world matrix,
      // so it has to happen while the mesh is still parentless
      sp.lookAt(px + n.x, py + n.y, pz + n.z);
      sp.scale.set(1, 0.74, 0.26);
      up.add(sp);
    };
    // the torso ellipsoid, whose semi-axes are the sphere radius times its scale
    const ax = 0.26 * 1.55 * s, ay = 0.26 * 0.82 * s, az = 0.26 * 0.86 * s, cy = 0.34 * s;
    for (let i = 0; i < 17; i++) {
      const th = rr() * Math.PI * 2, ph = -0.3 + rr() * 1.2;
      const px = ax * Math.sin(th) * Math.cos(ph), py = ay * Math.sin(ph), pz = az * Math.cos(th) * Math.cos(ph);
      mark(px, cy + py, pz, px / (ax * ax), py / (ay * ay), pz / (az * az), 0.026 * s + rr() * 0.016 * s);
    }
    // and on the shoulder, haunch and head, so the pattern does not stop at the ribs
    for (const [hx, hy, hr] of [[0.2 * s, 0.38 * s, 0.17 * s], [-0.22 * s, 0.37 * s, 0.16 * s], [0.42 * s, 0.5 * s, 0.15 * s]] as const) {
      for (let i = 0; i < 4; i++) {
        const th = rr() * Math.PI * 2, ph = -0.15 + rr() * 1.0;
        const ux = Math.sin(th) * Math.cos(ph), uy = Math.sin(ph), uz = Math.cos(th) * Math.cos(ph);
        mark(hx + hr * ux, hy + hr * uy, hr * uz, ux, uy, uz, 0.02 * s + rr() * 0.01 * s);
      }
    }
  }
  // ears, set on the head rather than floating behind it
  for (const z of [1, -1]) { const e = ball(g, body, 0.055 * s, 0.37 * s, 0.6 * s, z * 0.1 * s); e.scale.set(0.7, 1.1, 0.9); }
};
/**
 * A vulture (শকুন), which the generic `bird` cannot be.
 *
 * `bird()` builds a songbird: a round body, a short neck, a small cone beak.
 * Painted brown it is a pigeon, and a child looking for a শকুন would not find
 * one on the shelf. Four things make a vulture, and none of them are colour:
 * the folded wings hunch *above* the head, a bare neck rises out of a ruff of
 * feathers, the beak is heavy and hooked rather than pointed, and the bird's
 * weight is carried forward over thick legs.
 */
const vulture: Figure = (g) => {
  const feath = '#6b6257', dark = '#4a443c', bare = '#b9a898', horn = '#3c362f';
  const b = put(g, new Mesh(new SphereGeometry(0.24, 24, 18), std(feath)), -0.02, 0.42);
  b.scale.set(1.2, 1.05, 0.95);
  for (const s of [1, -1]) {
    const w = put(g, new Mesh(new SphereGeometry(0.2, 20, 14), std(dark)), -0.05, 0.5, s * 0.12);
    w.scale.set(1.15, 0.78, 0.55); w.rotation.set(0, -s * 0.18, s * 0.1);
  }
  const tail = put(g, new Mesh(new ConeGeometry(0.11, 0.26, 4), std(dark)), -0.32, 0.36, 0, 0, 0, Math.PI / 2 + 0.35);
  tail.scale.set(1, 1, 0.35);
  const ruff = put(g, new Mesh(new SphereGeometry(0.135, 18, 12), std(dark)), 0.14, 0.55, 0);
  ruff.scale.set(0.85, 0.8, 1);
  // the bare neck, up out of the ruff and then down: nothing on a songbird
  // does this, and it is the line the whole bird is recognised by
  let nx = 0.15, ny = 0.6;
  for (let i = 0; i < 4; i++) {
    const a = [1.0, 0.4, -0.3, -0.9][i]!, len = 0.08, rad = 0.05 - i * 0.005;
    nx += Math.cos(a) * len / 2; ny += Math.sin(a) * len / 2;
    taper(g, bare, rad * 0.9, rad, len + 0.012, nx, ny, 0, a - Math.PI / 2);
    nx += Math.cos(a) * len / 2; ny += Math.sin(a) * len / 2;
  }
  const head = ball(g, bare, 0.072, nx + 0.01, ny); head.scale.set(1.1, 0.95, 0.9);
  const upper = put(g, new Mesh(new ConeGeometry(0.055, 0.15, 12), std(horn)), nx + 0.1, ny, 0, 0, 0, -Math.PI / 2);
  upper.scale.set(1, 1, 0.85);
  const hook = put(g, new Mesh(new ConeGeometry(0.038, 0.09, 10), std(horn)), nx + 0.165, ny - 0.03, 0, 0, 0, -2.5);
  hook.scale.set(1, 1, 0.85);
  ball(g, '#8d8377', 0.031, nx + 0.065, ny + 0.022, 0).scale.set(0.9, 0.7, 0.9);
  for (const s of [1, -1]) {
    ball(g, '#f0eae0', 0.024, nx + 0.035, ny + 0.03, s * 0.052).scale.set(1, 1, 0.5);
    disc(g, '#17120e', 0.013, nx + 0.042, ny + 0.03, s * 0.064, 0).rotation.y = s > 0 ? 0.4 : Math.PI - 0.4;
  }
  for (const s of [1, -1]) {
    taper(g, '#b0a494', 0.021, 0.031, 0.24, 0.02, 0.13, s * 0.075);
    for (let t = -1; t <= 1; t++) box(g, '#b0a494', 0.08, 0.022, 0.03, 0.05, 0.012, s * 0.075 + t * 0.032);
  }
};
/** A streamlined body with fins and a forked tail. */
const fish = (body: string, fin?: string): Figure => (g) => {
  const finC = fin ?? body, dark = new Color(body).multiplyScalar(0.7);
  const b = put(g, new Mesh(new SphereGeometry(0.3, 26, 18), std(body)), 0, 0.32);
  b.scale.set(1.5, 0.72, 0.5);
  // a paler belly, which is what nearly every fish has and what stops the body
  // reading as one moulded lozenge
  const belly = put(g, new Mesh(new SphereGeometry(0.29, 22, 14), std(new Color(body).lerp(new Color('#ffffff'), 0.45))), 0, 0.27, 0);
  belly.scale.set(1.45, 0.5, 0.47);
  // a forked tail: two blades off the peduncle, not one flat triangle
  for (const s of [1, -1]) {
    const t = put(g, new Mesh(new ConeGeometry(0.16, 0.36, 3), std(finC)), -0.57, 0.32 + s * 0.075, 0, 0, 0, Math.PI / 2 + s * 0.36);
    t.scale.set(1, 1, 0.24);
  }
  /**
   * The dorsal has to clear the back.
   *
   * It was a 0.2 cone centred at y 0.52 on a body whose top is 0.536, so four
   * fifths of the fin was inside the animal and what showed was a bump. A fish
   * with no fin above the waterline of its own body is a torpedo - which is
   * exactly what হিলসা and the small fish read as on the shelf. Sitting the
   * fin on the back and stretching it along the spine is the whole difference.
   */
  const dorsal = put(g, new Mesh(new ConeGeometry(0.11, 0.26, 3), std(finC)), -0.02, 0.62, 0);
  dorsal.scale.set(1.7, 1, 0.22);
  // an anal fin under the tail-stock, the small second thing that says fish
  const anal = put(g, new Mesh(new ConeGeometry(0.07, 0.15, 3), std(finC)), -0.24, 0.16, 0, Math.PI, 0, 0);
  anal.scale.set(1.5, 1, 0.22);
  // pectoral fins, swept back along the flanks
  for (const s of [1, -1]) {
    const p = put(g, new Mesh(new ConeGeometry(0.07, 0.16, 3), std(finC)), 0.08, 0.29, s * 0.13, 0, 0, Math.PI / 2 + 0.5);
    p.scale.set(1, 1, 0.2); p.rotation.y = s * 0.5;
  }
  // the gill cover, the one line that says where the head ends
  const gill = put(g, new Mesh(new TorusGeometry(0.1, 0.012, 8, 18, Math.PI * 1.1), std(dark)), 0.2, 0.33, 0, 0, Math.PI / 2, 0.4);
  gill.scale.set(1, 1.3, 1);
  for (const s of [1, -1]) {
    ball(g, '#f4f7fa', 0.035, 0.36, 0.37, s * 0.085).scale.set(1, 1, 0.5);
    disc(g, '#10161f', 0.018, 0.375, 0.37, s * 0.095, 0).rotation.y = s * 1.15;
  }
};
/** A perched bird: round body, beak, two wings, a tail. */
const bird = (body: string, wing?: string, beak = '#f0b429'): Figure => (g) => {
  const wingC = wing ?? body;
  const b = put(g, new Mesh(new SphereGeometry(0.2, 24, 18), std(body)), 0, 0.4);
  b.scale.set(1.15, 1, 0.9);
  // a neck, so the head is joined to the body rather than resting on it
  taper(g, body, 0.075, 0.12, 0.14, 0.1, 0.52, 0, -0.5);
  const head = ball(g, body, 0.12, 0.17, 0.585); head.scale.set(1.05, 1, 0.95);
  cone(g, beak, 0.042, 0.15, 0.315, 0.575, 0, -Math.PI / 2);
  // the eye: a small pale ball with a flat pupil past its front, the same trick
  // the faces use, because a dark dot sunk into the skull is no eye at all
  for (const s of [1, -1]) {
    ball(g, '#f6f9fc', 0.03, 0.215, 0.615, s * 0.078).scale.set(1, 1, 0.55);
    disc(g, '#12161c', 0.017, 0.222, 0.615, s * 0.094, 0).rotation.y = s * 1.2;
  }
  // wings swept back and tilted, rather than two bulges lying flat on the flanks
  for (const s of [1, -1]) {
    const w = put(g, new Mesh(new SphereGeometry(0.145, 20, 14), std(wingC)), -0.03, 0.43, s * 0.155);
    w.scale.set(1.25, 0.28, 0.62); w.rotation.set(0, -s * 0.22, s * 0.12);
  }
  const tail = put(g, new Mesh(new ConeGeometry(0.1, 0.3, 4), std(wingC)), -0.28, 0.36, 0, 0, 0, Math.PI / 2 + 0.22);
  tail.scale.set(1, 1, 0.3);
  for (const s of [1, -1]) {
    rod(g, '#c8862c', 0.016, 0.2, 0.02, 0.1, s * 0.06);
    // a foot, so the bird stands on the shelf instead of balancing on two wires
    box(g, '#c8862c', 0.09, 0.02, 0.055, 0.035, 0.01, s * 0.06);
  }
};
/** A long low body with a ridged back and a wide snout. */
const croc: Figure = (g) => {
  const skin = '#4b5c3a', dark = '#3b4a2d';
  const b = put(g, new Mesh(new SphereGeometry(0.22, 24, 16), std(skin)), 0, 0.16);
  b.scale.set(2.1, 0.55, 0.8);
  // The snout was a rectangular slab. A crocodile is its jaw: long, tapering,
  // and split into an upper and a lower that meet in a visible line.
  const upper = put(g, new Mesh(new CylinderGeometry(0.055, 0.085, 0.34, 4), std(skin)), 0.52, 0.175, 0, 0, 0, -Math.PI / 2);
  upper.scale.set(1, 1, 1.5); upper.rotation.y = Math.PI / 4;
  const lower = put(g, new Mesh(new CylinderGeometry(0.042, 0.07, 0.32, 4), std(dark)), 0.51, 0.115, 0, 0, 0, -Math.PI / 2);
  lower.scale.set(1, 1, 1.45); lower.rotation.y = Math.PI / 4;
  // eyes up on top of the skull, where a crocodile's are so it can watch the
  // bank with the rest of itself under water
  for (const s of [1, -1]) {
    ball(g, dark, 0.045, 0.3, 0.25, s * 0.07);
    ball(g, '#e8dfa8', 0.026, 0.315, 0.275, s * 0.07).scale.set(1, 0.7, 1);
  }
  for (let i = 0; i < 6; i++) put(g, new Mesh(new ConeGeometry(0.04, 0.09, 4), std(dark)), 0.22 - i * 0.13, 0.27, 0);
  // legs splayed out to the sides, the way a crocodile's are, not tucked under
  for (const [dx, dz] of [[0.2, 0.18], [0.2, -0.18], [-0.24, 0.18], [-0.24, -0.18]] as const) {
    const leg = rod(g, skin, 0.033, 0.15, dx, 0.075, dz * 1.12, dz > 0 ? -0.45 : 0.45);
    void leg;
    ball(g, dark, 0.035, dx, 0.02, dz * 1.32).scale.set(1.2, 0.5, 1);
  }
  put(g, new Mesh(new ConeGeometry(0.08, 0.4, 5), std(skin)), -0.6, 0.15, 0, 0, 0, Math.PI / 2);
};
/** A shell with a head and four stumps. */
const turtle: Figure = (g) => {
  const shell = '#5d6b3e', skin = '#7d8a55';
  // a dome over a flat plastron, rather than a whole squashed sphere: the
  // underside of a turtle is flat, and that is half of its silhouette
  // Tall enough to be a dome. At 0.62 it was 0.17 high against a 0.28 radius,
  // which from the side is a lozenge lying on the ground - a pea pod, not a
  // shell. A turtle is read from the height of its carapace.
  const sh = put(g, new Mesh(new SphereGeometry(0.28, 26, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), std(shell)), 0, 0.115);
  sh.scale.set(1, 0.95, 0.85);
  const plate = put(g, new Mesh(new CylinderGeometry(0.278, 0.26, 0.06, 30), std('#cbbf94')), 0, 0.11);
  plate.scale.set(1, 1, 0.85);
  // scutes: a ring of low plates on the dome, which is what a shell is
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const s = ball(g, new Color(shell).multiplyScalar(1.2), 0.078, Math.cos(a) * 0.17, 0.28, Math.sin(a) * 0.145);
    s.scale.set(1, 0.5, 1);
  }
  ball(g, new Color(shell).multiplyScalar(1.2), 0.085, 0, 0.37, 0).scale.set(1, 0.45, 1);
  const head = ball(g, skin, 0.095, 0.3, 0.16, 0); head.scale.set(1.2, 1, 0.95);
  for (const s of [1, -1]) ball(g, '#1a1712', 0.018, 0.36, 0.185, s * 0.055);
  for (const [dx, dz] of [[0.18, 0.2], [0.18, -0.2], [-0.2, 0.2], [-0.2, -0.2]] as const) {
    const f = ball(g, skin, 0.075, dx, 0.085, dz); f.scale.set(1.1, 0.6, 0.85);
  }
  cone(g, skin, 0.04, 0.11, -0.3, 0.13, 0, Math.PI / 2);
};
/** A striped abdomen with wings: the honeybee. */
const bee: Figure = (g) => {
  const gold = '#f0b429', black = '#2b2b2b';
  // head, thorax, abdomen: three parts, which is what an insect is, instead of
  // three balls of the same size in a row
  const head = ball(g, black, 0.075, 0.15, 0.42); head.scale.set(0.9, 1, 1);
  for (const s of [1, -1]) ball(g, '#5d5346', 0.028, 0.19, 0.44, s * 0.045);
  for (const s of [1, -1]) { const a = rod(g, black, 0.008, 0.09, 0.2, 0.5, s * 0.03, -0.5); void a; }
  const thorax = ball(g, gold, 0.085, 0.03, 0.42); thorax.scale.set(1.1, 1, 1);
  const abd = ball(g, gold, 0.105, -0.13, 0.41); abd.scale.set(1.35, 1, 0.95);
  for (let i = 0; i < 3; i++) {
    const band = put(g, new Mesh(new TorusGeometry(0.098 - i * 0.012, 0.016, 8, 18), std(black)), -0.09 - i * 0.055, 0.41, 0, 0, Math.PI / 2, 0);
    band.scale.set(1, 0.98, 1);
  }
  cone(g, '#3b3228', 0.016, 0.05, -0.28, 0.41, 0, -Math.PI / 2);
  for (const s of [1, -1]) {
    const w = put(g, new Mesh(new CircleGeometry(0.13, 20), new MeshStandardMaterial({ color: '#dce8f5', transparent: true, opacity: 0.5, side: DoubleSide, roughness: 0.2 })), -0.02, 0.52, s * 0.1);
    w.rotation.set(-0.5, 0, s * 0.4);
    const w2 = put(g, new Mesh(new CircleGeometry(0.085, 16), new MeshStandardMaterial({ color: '#dce8f5', transparent: true, opacity: 0.45, side: DoubleSide, roughness: 0.2 })), -0.11, 0.49, s * 0.1);
    w2.rotation.set(-0.4, 0, s * 0.55);
  }
  for (const s of [1, -1]) for (const dx of [0.09, 0.01, -0.07]) rod(g, black, 0.009, 0.1, dx, 0.35, s * 0.06, s * 0.5);
};
/**
 * The Ganges river dolphin. A mammal, so the tail fluke is **horizontal**.
 *
 * It used to be flattened on the wrong axis, giving it the upright blade of a
 * fish, on a page whose whole job is teaching a child what a শুশুক is. It also
 * had no flippers, no eye and no blowhole, which are the other things that
 * separate it from the ইলিশ two shelves along.
 */
const dolphin: Figure = (g) => {
  const skin = '#8e9bab', pale = '#c3cdd8';
  /**
   * One lathed body, not a stack of spheres.
   *
   * This figure has been rewritten three times by adding parts - sections,
   * a melon, a pale belly - and every version read as a lumpy grey bag, for a
   * reason no amount of extra parts could fix: overlapping ellipsoids leave a
   * visible step wherever two surfaces cross, and a dolphin is the one animal
   * here whose whole identity is an unbroken curve from nose to fluke.
   *
   * A lathe turns a single profile into a single surface, so there is nothing
   * to step. The profile carries the shape that matters: thin at the tail
   * stock, thickest a third back from the head, then the melon's bulge and a
   * quick narrowing into the beak. Everything else hangs off it.
   */
  const P: [number, number][] = [
    [0.014, 0.00], [0.034, 0.08], [0.062, 0.18], [0.096, 0.30], [0.126, 0.42],
    [0.146, 0.54], [0.152, 0.64], [0.148, 0.72], [0.132, 0.80], [0.106, 0.87],
    [0.074, 0.92], [0.044, 0.955], [0.026, 0.98], [0.012, 1.0],
  ];
  const LEN = 1.06;
  const body = new Mesh(new LatheGeometry(P.map(([r, t]) => new Vector2(r, t * LEN)), 30), std(skin));
  // the lathe turns about Y; the animal lies along X, nose to +X
  body.rotation.z = -Math.PI / 2;
  body.position.set(-0.52, 0.34, 0);
  body.scale.set(1, 1, 0.88);
  g.add(body);
  // countershading: a slimmer copy of the same profile, dropped just enough to
  // show only from below, so the belly is pale without a seam on the flank
  const belly = new Mesh(new LatheGeometry(P.map(([r, t]) => new Vector2(r * 0.9, t * LEN)), 24), std(pale));
  belly.rotation.z = -Math.PI / 2;
  belly.position.set(-0.52, 0.305, 0);
  belly.scale.set(1, 1, 0.86);
  g.add(belly);

  // a falcate dorsal, swept back, sitting on the crest of the profile
  const fin = put(g, new Mesh(new ConeGeometry(0.1, 0.3, 3), std(skin)), 0.02, 0.63, 0, 0, 0, -0.45);
  fin.scale.set(1.25, 1, 0.24);
  // flippers, low on the shoulder and angled down and back
  for (const z of [1, -1]) {
    const fl = put(g, new Mesh(new ConeGeometry(0.062, 0.25, 3), std(skin)), 0.2, 0.26, z * 0.1, 0, 0, 1.9);
    fl.scale.set(1, 1, 0.22); fl.rotation.y = z * 0.45;
  }
  // the fluke is horizontal, because this is a mammal and that is the whole
  // difference between it and the ইলিশ two shelves along
  const fluke = put(g, new Mesh(new ConeGeometry(0.17, 0.26, 3), std(skin)), -0.58, 0.34, 0, 0.3, 0, Math.PI / 2);
  fluke.scale.set(0.18, 1, 1);
  // the long narrow beak, and the crease where it meets the melon
  const crease = put(g, new Mesh(new TorusGeometry(0.062, 0.008, 6, 16), std(new Color(skin).multiplyScalar(0.82))), 0.33, 0.335, 0, 0, Math.PI / 2, 0);
  crease.scale.set(1, 0.85, 1);
  ball(g, '#6f7b8a', 0.016, 0.5, 0.352, 0).scale.set(1.6, 0.5, 1);
  // eye and blowhole
  for (const z of [1, -1]) ball(g, '#14191f', 0.019, 0.3, 0.36, z * 0.085);
  ball(g, '#6f7b8a', 0.022, 0.13, 0.455, 0).scale.set(1.3, 0.4, 1);
};
/** A sitting primate: rounded body, long tail, pale face. */
const monkey: Figure = (g) => {
  const fur = '#8a6a48', face = '#d8bb93';
  const body = ball(g, fur, 0.2, 0, 0.3); body.scale.set(1, 1.05, 0.92);
  const head = ball(g, fur, 0.14, 0.01, 0.56); head.scale.set(1, 1.02, 0.96);
  // the pale mask a macaque has, sunk into the fur rather than stuck on top
  const mask = ball(g, face, 0.105, 0.055, 0.545, 0.02); mask.scale.set(0.62, 0.95, 1);
  const muzzle = ball(g, face, 0.055, 0.11, 0.5, 0.03); muzzle.scale.set(0.8, 0.75, 1);
  for (const s of [1, -1]) ball(g, '#1a1410', 0.012, 0.115, 0.505, s * 0.028);
  for (const s of [1, -1]) {
    ball(g, '#f4f6f8', 0.026, 0.095, 0.585, s * 0.048).scale.set(0.8, 1, 0.6);
    disc(g, '#20170f', 0.014, 0.108, 0.585, s * 0.06, 0).rotation.y = 1.2;
  }
  for (const s of [1, -1]) { const e = ball(g, fur, 0.048, -0.02, 0.6, s * 0.135); e.scale.set(0.45, 1, 1); }
  /**
   * A curled tail: eight short segments following an arc, each turned to the
   * tangent and thinning toward the tip. One straight stick is not a monkey's
   * tail, and the curl is most of what the silhouette is recognised by.
   *
   * `rod` turns a cylinder about z, so its axis ends up along (-sin rz, cos rz);
   * the tangent to this arc at angle `a` is parallel to that when rz = a, and a
   * cylinder is symmetric so the direction along it does not matter.
   */
  const N = 8, CX = -0.3, CY = 0.42, R = 0.2;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const a = 0.5 + t * 2.5;
    rod(g, fur, 0.021 - t * 0.009, 0.085, CX - Math.cos(a) * R, CY - Math.sin(a) * R * 0.85, 0, a);
  }
  for (const s of [1, -1]) rod(g, fur, 0.04, 0.22, 0.06, 0.12, s * 0.12);
  /**
   * Arms, which it had none of.
   *
   * Body, head and a curled tail with nothing in between read as a brown lump
   * with a piece of string on it. An upper arm angled down and forward, a
   * forearm reaching in to the ground and a hand at the end of it is what
   * makes a sitting primate read as sitting rather than as a bear cub.
   */
  for (const s of [1, -1]) {
    ball(g, fur, 0.055, 0.02, 0.4, s * 0.165).scale.set(0.9, 1, 0.9);
    rod(g, fur, 0.032, 0.19, 0.06, 0.32, s * 0.185, -0.5);
    rod(g, fur, 0.028, 0.17, 0.13, 0.18, s * 0.185, -1.15);
    ball(g, face, 0.038, 0.2, 0.11, s * 0.185).scale.set(1.1, 0.7, 0.9);
  }
};

/* ---------- things, tools, objects ---------- */
/** A shallow bowl holding loose powder, for spices. */
const bowl = (powder: string, vessel = '#cfd6de'): Figure => (g) => {
  const b = put(g, new Mesh(new CylinderGeometry(0.3, 0.2, 0.16, 26, 1, true), std(vessel, { side: DoubleSide })), 0, 0.1);
  void b;
  disc(g, vessel, 0.2, 0, 0.02);
  const heap = put(g, new Mesh(new SphereGeometry(0.26, 26, 16), std(powder, { roughness: 1 })), 0, 0.17);
  heap.scale.set(1, 0.45, 1);
};
/** A few dried sticks or pods lying together. */
/**
 * দারুচিনি: bark rolled into quills.
 *
 * It was `sticks()` with a fat radius, which on the shelf came out as a bundle
 * of planks - firewood. Cinnamon is a *tube*: bark that curled as it dried,
 * and the rolled end is the whole tell. A ring at each visible end and a seam
 * line along the length is enough to say tube rather than dowel.
 */
const quills = (color: string): Figure => (g) => {
  const dark = new Color(color).multiplyScalar(0.72);
  const lay = (x: number, z: number, rz: number, len: number) => {
    const r = 0.05;
    rod(g, color, r, len, x, 0.055, z, Math.PI / 2 + rz);
    // the rolled ends, which is what separates a quill from a stick
    for (const e of [1, -1]) {
      const ex = x + Math.cos(rz) * (len / 2) * e, ez = z - Math.sin(rz) * (len / 2) * e;
      const ring = put(g, new Mesh(new TorusGeometry(r * 0.66, r * 0.3, 8, 16), std(dark)), ex, 0.055, ez, 0, 0, 0);
      ring.rotation.y = -rz; ring.rotation.x = 0; ring.rotation.z = 0;
      ring.rotateY(Math.PI / 2);
    }
    rod(g, dark, 0.006, len * 0.96, x, 0.102, z, Math.PI / 2 + rz);
  };
  lay(-0.06, 0.07, 0.06, 0.4);
  lay(0.03, -0.02, -0.1, 0.36);
  lay(-0.02, -0.11, 0.14, 0.32);
};

const sticks = (color: string, n = 4, bent = false): Figure => (g) => {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 0.9 - 0.45;
    const s = rod(g, color, bent ? 0.045 : 0.028, 0.46, (i - (n - 1) / 2) * 0.09, 0.24, 0, a);
    if (bent) s.scale.set(1, 1, 0.6);
  }
};
/**
 * A few dried leaves lying in a pile: tej pata and the like.
 *
 * Bay leaf was `sticks()`, three green rods leaning together, which is a
 * tripod of twigs and not a leaf at all. What makes an ellipse read as a leaf
 * is the midrib down the middle and a slight curl, and what makes three of
 * them read as a handful is that no two lie at the same angle.
 */
const leaves = (color: string, n = 3): Figure => (g) => {
  const r = rng(hash(color) + 11);
  const base = new Color(color);
  for (let i = 0; i < n; i++) {
    // fanned and propped up rather than lying flat in a pile: the shelf looks
    // at a figure dead level, and three flat blades on the floor are three
    // lines. The rib is thicker than the blade, so it stands proud of both
    // faces without a second position to keep in step.
    const a = (i / n) * 2.0 - 1.0 + (r() - 0.5) * 0.35;
    const tilt = 0.78 + r() * 0.24;
    const x = Math.cos(a) * 0.05, z = Math.sin(a) * 0.05;
    const l = put(g, new Mesh(new SphereGeometry(0.2, 18, 10), std(base.clone().offsetHSL(0, 0, r() * 0.08 - 0.04))), x, 0.23, z, 0, a, tilt);
    l.scale.set(1.45, 0.055, 0.5);
    const rib = put(g, new Mesh(new BoxGeometry(0.52, 0.026, 0.014), std(base.clone().multiplyScalar(0.72))), x, 0.23, z, 0, a, tilt);
    void rib;
  }
};
/** A handful of seeds heaped on a saucer. */
const seeds = (color: string): Figure => (g) => {
  // they used to lie loose on the floor with nothing under them, which reads
  // as a few nuts dropped on the ground rather than a spice being measured out
  put(g, new Mesh(new CylinderGeometry(0.26, 0.22, 0.03, 26), std('#e8edf2')), 0, 0.015);
  ring(g, std('#dae1e8'), 0.26, 0.012, 0, 0.028, 0, 28);
  const heap = put(g, new Mesh(new SphereGeometry(0.19, 22, 12), std(new Color(color).multiplyScalar(0.92), { roughness: 1 })), 0, 0.035);
  heap.scale.set(1, 0.36, 1);
  for (let i = 0; i < 11; i++) {
    const a = i * 1.9, r = 0.03 + (i % 4) * 0.036;
    const s = ball(g, color, 0.033, Math.cos(a) * r, 0.07 + (i % 3) * 0.022, Math.sin(a) * r);
    s.scale.set(1, 0.62, 1.35); s.rotation.y = a;
  }
};
/** A curved pod tapering at both ends: the chilli. */
const chilli = (color: string): Figure => (g) => {
  const c = put(g, new Mesh(new ConeGeometry(0.09, 0.52, 16), std(color)), 0, 0.3, 0, 0, 0, 3.0);
  c.scale.set(1, 1, 0.85);
  rod(g, '#4b7a3a', 0.02, 0.12, 0.04, 0.56);
};
/** A lidded cooking pot on a flame. */
const pot = (body = '#8e99a6', lid = '#b6c0cb'): Figure => (g) => {
  put(g, new Mesh(new CylinderGeometry(0.3, 0.26, 0.3, 28), std(body)), 0, 0.26);
  put(g, new Mesh(new CylinderGeometry(0.32, 0.32, 0.04, 28), std(lid)), 0, 0.43);
  ball(g, lid, 0.05, 0, 0.47);
  for (const s of [1, -1]) put(g, new Mesh(new TorusGeometry(0.07, 0.018, 10, 20), std(lid)), s * 0.33, 0.3, 0, 0, Math.PI / 2);
  for (let i = 0; i < 5; i++) {
    const f = put(g, new Mesh(new ConeGeometry(0.06, 0.16, 6), glow(i % 2 ? '#f0b429' : '#e06a2b', 0.75)), (i - 2) * 0.07, 0.07, 0);
    void f;
  }
};
/** A glass with a liquid line. */
const glass = (liquid = '#79b6e8'): Figure => (g) => {
  const gm = () => new MeshStandardMaterial({ color: '#dce8f5', transparent: true, opacity: 0.26, side: DoubleSide, roughness: 0.1, depthWrite: false });
  put(g, new Mesh(new CylinderGeometry(0.19, 0.15, 0.44, 26, 1, true), gm()), 0, 0.24);
  // a base and a rolled rim, the two bits of a tumbler you can feel
  put(g, new Mesh(new CylinderGeometry(0.152, 0.16, 0.035, 26), gm()), 0, 0.03);
  ring(g, gm(), 0.19, 0.012, 0, 0.46);
  put(g, new Mesh(new CylinderGeometry(0.17, 0.15, 0.26, 26), std(liquid, { transparent: true, opacity: 0.82, roughness: 0.18 })), 0, 0.15);
  // the surface: a liquid needs a top or it is a coloured solid in a tube
  disc(g, new Color(liquid).lerp(new Color('#ffffff'), 0.22), 0.168, 0, 0.28);
};
/** A bowl of rice, and by shape a plate of any staple. */
const riceBowl: Figure = (g) => {
  // a foot ring, so the bowl stands rather than being a cone resting on its tip
  put(g, new Mesh(new CylinderGeometry(0.13, 0.15, 0.04, 24), std('#dde3ea')), 0, 0.02);
  put(g, new Mesh(new CylinderGeometry(0.3, 0.18, 0.22, 28), std('#e6ebf1')), 0, 0.15);
  ring(g, std('#d5dce4'), 0.3, 0.014, 0, 0.26, 0, 30);
  const h = put(g, new Mesh(new SphereGeometry(0.27, 26, 16), std('#fbfbf6')), 0, 0.28);
  h.scale.set(1, 0.5, 1);
  // a few loose grains on top, which is what stops the rice being one smooth dome
  const r = rng(0x21ce);
  for (let i = 0; i < 7; i++) {
    const a = r() * 6.28, rad = r() * 0.2;
    const grain = ball(g, '#ffffff', 0.022, Math.cos(a) * rad, 0.4 + r() * 0.02, Math.sin(a) * rad);
    grain.scale.set(1.6, 0.8, 1); grain.rotation.y = a;
  }
};
/** A rounded fruit with a small stalk. */
const fruit = (color: string, leaf = '#4b7a3a'): Figure => (g) => {
  const base = new Color(color);
  const f = ball(g, base, 0.26, 0, 0.28);
  f.scale.set(1, 1.12, 0.94);
  // a dimple where the stalk goes in, and a second lobe in the same colour so
  // the silhouette has a shoulder on it. The old highlight was a pale ellipsoid
  // set *inside* the fruit: too big to stay buried, it broke the surface in a
  // crescent round its own rim and read as a bite taken out of the side. Two
  // shapes of one colour cannot do that - the seam between them is a crease.
  ball(g, base.clone().multiplyScalar(0.82), 0.07, 0, 0.55, 0).scale.set(1, 0.5, 1);
  ball(g, base, 0.21, -0.09, 0.34, 0.04).scale.set(1, 1, 0.95);
  taper(g, '#6b4a2a', 0.013, 0.022, 0.11, 0, 0.58, 0, 0.12);
  const l = ball(g, leaf, 0.09, 0.09, 0.6);
  l.scale.set(1.5, 0.32, 0.8); l.rotation.set(0, 0.3, -0.3);
  // a midrib, the same detail the tree leaves get
  box(g, new Color(leaf).multiplyScalar(0.75), 0.16, 0.008, 0.008, 0.09, 0.605, 0, -0.3);
};
/** A drop, for oil and water. */
const drop = (color: string): Figure => (g) => {
  /**
   * A real teardrop: a sphere with the top drawn up into a point, and a
   * highlight. The cone used to sit on top of the ball as a separate hat with
   * a visible seam where the two met, because a cone's base radius and the
   * sphere's radius at that height were never the same number.
   */
  const d = ball(g, color, 0.22, 0, 0.26);
  d.scale.set(1, 1.06, 1);
  // the neck is tapered to meet the sphere's own radius where it joins it
  const joinY = 0.26 + 0.22 * 1.06 * 0.55;
  const rJoin = 0.22 * Math.sqrt(1 - 0.55 * 0.55);
  put(g, new Mesh(new CylinderGeometry(0.035, rJoin, 0.16, 20), std(color)), 0, joinY + 0.06);
  cone(g, color, 0.035, 0.1, 0, joinY + 0.18);
  // the catchlight that makes a blob read as liquid
  ball(g, '#ffffff', 0.05, -0.08, 0.31, 0.15).scale.set(1, 1.3, 0.4);
};
/** A cube of crystals, for salt and minerals. */
const crystal = (color: string): Figure => (g) => {
  /**
   * A cluster of prisms growing off a common base, not five cubes floating at
   * different heights. Salt and quartz both grow as faceted columns with a
   * point, and the shared base is what makes it a cluster rather than a
   * handful of dice.
   */
  const r = rng(hash(color));
  const base = new Color(color);
  put(g, new Mesh(new IcosahedronGeometry(0.16, 0), std(base.clone().multiplyScalar(0.8), { flatShading: true })), 0, 0.07).scale.set(1.5, 0.55, 1.4);
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05 + r() * 0.4, rad = r() * 0.14;
    const h = 0.14 + r() * 0.22;
    const tint = base.clone().offsetHSL(0, 0, r() * 0.14 - 0.05);
    const tilt = (r() - 0.5) * 0.5;
    const col = put(g, new Mesh(new CylinderGeometry(0.045, 0.055, h, 6), std(tint, { flatShading: true, roughness: 0.25, metalness: 0.12 })),
      Math.cos(a) * rad, 0.09 + h / 2, Math.sin(a) * rad, 0, a, tilt);
    void col;
    // the terminating point every crystal has
    put(g, new Mesh(new ConeGeometry(0.046, 0.07, 6), std(tint, { flatShading: true, roughness: 0.25, metalness: 0.12 })),
      Math.cos(a) * rad - Math.sin(tilt) * h * 0.55, 0.09 + h + 0.03, Math.sin(a) * rad, 0, a, tilt);
  }
};
/** A stack of coins. */
const coinStack = (color = '#d9b44a', n = 5): Figure => (g) => {
  const r = rng(hash(color));
  const rim = new Color(color).multiplyScalar(0.82);
  for (let i = 0; i < n; i++) {
    // a hand-stacked pile is never perfectly aligned, and the tiny offsets are
    // what stop this reading as one grooved cylinder
    const c = put(g, new Mesh(new CylinderGeometry(0.2, 0.2, 0.05, 28), std(color, { metalness: 0.55, roughness: 0.32 })), (r() - 0.5) * 0.018, 0.03 + i * 0.055, (r() - 0.5) * 0.018);
    c.rotation.y = r() * 3;
    ring(g, std(rim, { metalness: 0.5, roughness: 0.38 }), 0.193, 0.012, c.position.x, c.position.y, c.position.z, 26);
  }
  // the top coin gets a face, so the stack has a head on it
  put(g, new Mesh(new CylinderGeometry(0.13, 0.13, 0.056, 24), std(rim, { metalness: 0.5, roughness: 0.4 })), 0, 0.03 + (n - 1) * 0.055, 0);
};
/** A columned building front, for the bank. */
const building = (wall = '#d7dee6', roof = '#8fa0b4'): Figure => (g) => {
  // steps up to the portico, which is how you get into a building
  box(g, new Color(wall).multiplyScalar(0.92), 1.0, 0.04, 0.62, 0, 0.02);
  box(g, new Color(wall).multiplyScalar(0.96), 0.94, 0.04, 0.56, 0, 0.06);
  box(g, wall, 0.9, 0.08, 0.5, 0, 0.12);
  // a wall behind the colonnade with a door in it: the columns used to stand in
  // front of open air, so the bank was a portico with no bank behind it
  box(g, new Color(wall).multiplyScalar(0.9), 0.86, 0.52, 0.06, 0, 0.42, -0.18);
  box(g, '#5b6470', 0.2, 0.34, 0.02, 0, 0.33, -0.14);
  for (let i = 0; i < 4; i++) {
    const x = (i - 1.5) * 0.22;
    rod(g, wall, 0.05, 0.46, x, 0.39, 0.1);
    // base and capital, the two mouldings that make a cylinder a column
    put(g, new Mesh(new CylinderGeometry(0.066, 0.072, 0.045, 18), std(wall)), x, 0.18, 0.1);
    put(g, new Mesh(new CylinderGeometry(0.072, 0.066, 0.045, 18), std(wall)), x, 0.61, 0.1);
  }
  box(g, roof, 1.0, 0.07, 0.56, 0, 0.665);
  const ped = put(g, new Mesh(new ConeGeometry(0.56, 0.24, 4), std(roof)), 0, 0.82, 0, 0, Math.PI / 4);
  ped.scale.set(1, 1, 0.5);
};
/** A bank card. */
const card = (color = '#2f6b8f'): Figure => (g) => {
  // rounded corners and a raised chip: a bank card with square corners and a
  // flat gold rectangle is a swatch with a sticker on it
  const c = put(g, new Mesh(roundedCard(0.62, 0.4, 0.024, 0.05), std(color)), 0, 0.3, 0, 0, 0, 0.12);
  void c;
  const chip = put(g, new Mesh(roundedCard(0.13, 0.1, 0.03, 0.02), std('#d9b44a', { metalness: 0.55, roughness: 0.35 })), -0.14, 0.34, 0.013, 0, 0, 0.12);
  void chip;
  for (let i = 0; i < 2; i++) box(g, '#a8873a', 0.12, 0.006, 0.032, -0.14, 0.355 - i * 0.03, 0.013, 0.12);
  box(g, '#f4f8fc', 0.5, 0.035, 0.026, 0.01, 0.18, 0.013, 0.12);
  // the embossed number band, which is the other thing every card has
  for (let i = 0; i < 4; i++) box(g, '#dbe6f0', 0.08, 0.022, 0.028, -0.19 + i * 0.125, 0.255, 0.013, 0.12);
};
/** A phone, screen facing the camera. */
const phone = (body = '#222a33', screen = '#9fd8ff'): Figure => (g) => {
  put(g, new Mesh(roundedCard(0.42, 0.74, 0.05, 0.06), std(body)), 0, 0.4);
  put(g, new Mesh(roundedCard(0.35, 0.58, 0.022, 0.04), std(screen, { roughness: 0.12, metalness: 0.1 })), 0, 0.42, 0.026);
  // the three things that make a slab a phone: a camera, an earpiece and a
  // lit strip at the top of the screen
  ball(g, '#0e1319', 0.026, -0.13, 0.71, 0.028).scale.set(1, 1, 0.4);
  box(g, '#3a444f', 0.1, 0.014, 0.02, 0.02, 0.71, 0.028);
  box(g, '#e8f4ff', 0.3, 0.03, 0.024, 0, 0.65, 0.028);
  for (let i = 0; i < 3; i++) box(g, '#c7e4f7', 0.24 - i * 0.05, 0.02, 0.024, -0.03 + i * 0.02, 0.55 - i * 0.06, 0.028);
  box(g, '#3a444f', 0.012, 0.09, 0.055, 0.216, 0.52, 0);
};
/** A padlock. */
const lock = (body = '#f0b429'): Figure => (g) => {
  put(g, new Mesh(roundedCard(0.36, 0.3, 0.22, 0.05), std(body, { metalness: 0.3, roughness: 0.42 })), 0, 0.2);
  // the shackle goes *into* the body: it used to float above it with a gap
  put(g, new Mesh(new TorusGeometry(0.115, 0.032, 12, 26, Math.PI), std('#b9c3ce', { metalness: 0.6, roughness: 0.3 })), 0, 0.33, 0);
  for (const s of [1, -1]) rod(g, '#b9c3ce', 0.032, 0.1, s * 0.115, 0.29, 0);
  // a real keyhole: a round bore with a slot under it
  ball(g, '#3b2f1c', 0.036, 0, 0.21, 0.112).scale.set(1, 1, 0.4);
  box(g, '#3b2f1c', 0.026, 0.07, 0.02, 0, 0.175, 0.112);
  for (const s of [1, -1]) for (const t of [1, -1]) ball(g, '#c99a24', 0.015, s * 0.14, 0.2 + t * 0.1, 0.112).scale.set(1, 1, 0.35);
};
/** An upright person: a rounded head and a simple torso. */
/**
 * A standing person in a long garment.
 *
 * The head was a bare ball with a black cap *wider* than it, the arms were two
 * cylinders stuck to the sides of a cone, and there was no neck and no face at
 * all, so six different people were one silhouette in six coat colours. The
 * garment stays - it is the right stylisation at this size, and it saves
 * modelling legs that would be four pixels wide - but a person needs a neck
 * holding the head up, hands at the ends of the arms, and eyes.
 */
const person = (coat: string, skin = '#c98f5f'): Figure => (g) => {
  /**
   * Seeded off the coat colour, so six people standing in a row are six people
   * rather than one figure printed six times in different shirts. Same reason
   * a grove of trees is seeded: the eye reads repetition long before it reads
   * any single shape, and a category like বাঙালি বিজ্ঞানী is nine of these
   * side by side.
   */
  const r = rng(hash(coat));
  const H = 0.96 + r() * 0.13;            // how tall this one stands
  const hd = 0.148 + r() * 0.018;         // and how big a head they have
  const grey = r() < 0.3;
  const hairC = grey ? '#6b6259' : '#2f261d';
  const trim = new Color(coat).multiplyScalar(0.78);
  put(g, new Mesh(new CylinderGeometry(0.2, 0.3, 0.52 * H, 28), std(coat)), 0, 0.3 * H);
  // a hem, so the garment ends in something rather than just stopping
  put(g, new Mesh(new CylinderGeometry(0.305, 0.305, 0.05, 28), std(trim)), 0, 0.05);
  const sh = ball(g, coat, 0.2, 0, 0.55 * H); sh.scale.set(1, 0.55, 0.85);
  rod(g, skin, 0.052, 0.1, 0, 0.62 * H);
  const hy = 0.75 * H;
  const head = ball(g, skin, hd, 0, hy); head.scale.set(0.97, 1.05, 0.95);
  const jaw = ball(g, skin, hd * 0.74, 0, hy - 0.07, 0.015); jaw.scale.set(0.92, 0.8, 0.9);
  // hair that clears the brow, not a cap pulled down over the whole head
  const crown = put(g, new Mesh(new SphereGeometry(hd * 1.08, 22, 12, 0, Math.PI * 2, 0, Math.PI * (0.3 + r() * 0.08)), std(hairC, { roughness: 0.95 })), 0, hy, -0.005);
  crown.scale.set(1, 1.04, 1);
  const back = put(g, new Mesh(new SphereGeometry(hd * 1.045, 18, 14, Math.PI, Math.PI, 0, Math.PI * 0.6), std(hairC, { roughness: 0.95 })), 0, hy, -0.005);
  back.scale.set(1, 1.04, 0.99);
  const fz = hd * 0.845;                  // the face's surface, front and centre
  for (const s of [1, -1]) {
    rod(g, coat, 0.046, 0.34, s * 0.23, 0.36 * H, 0, s * 0.22);
    ball(g, skin, 0.048, s * 0.3, 0.2 * H, 0);
    // seated on the face: a flat iris past the eyeball's front cannot be
    // swallowed by it, which a small sphere on a sphere always is
    ball(g, '#f8fbff', 0.032, s * 0.058, hy + 0.025, fz).scale.set(1.1, 0.9, 0.34);
    disc(g, '#241a12', 0.016, s * 0.058, hy + 0.025, fz + 0.015, 0);
  }
  ball(g, skin, 0.026, 0, hy - 0.005, fz + 0.017).scale.set(0.85, 1, 1);
  // a mouth: without one the face is a mask, and it costs one small box
  box(g, '#8a5b4a', 0.05, 0.012, 0.012, 0, hy - 0.062, fz - 0.004);
};
/** A thermometer: a tube with a bulb. */
const thermometer: Figure = (g) => {
  put(g, new Mesh(new CylinderGeometry(0.05, 0.05, 0.6, 20), std('#e8eef5', { transparent: true, opacity: 0.72, roughness: 0.15 })), 0, 0.4);
  ball(g, '#c0392b', 0.1, 0, 0.1);
  put(g, new Mesh(new CylinderGeometry(0.025, 0.025, 0.4, 14), std('#c0392b')), 0, 0.3);
  // A scale. An instrument that measures and carries no marks is a glass tube
  // with red in it, and the marks are the entire reason the thing exists.
  for (let i = 0; i < 9; i++) box(g, '#4c5867', i % 2 ? 0.03 : 0.05, 0.008, 0.008, i % 2 ? 0.055 : 0.065, 0.2 + i * 0.055, 0.048);
};
/** A two-pan balance. */
const balance: Figure = (g) => {
  const metal2 = '#8a94a0';
  // a foot, so it stands on the bench rather than being a rod pushed into it
  put(g, new Mesh(new CylinderGeometry(0.24, 0.28, 0.05, 28), std('#6b7583')), 0, 0.025);
  rod(g, metal2, 0.03, 0.58, 0, 0.31);
  // the knife edge the beam actually pivots on
  put(g, new Mesh(new ConeGeometry(0.05, 0.08, 4), std('#b9c3ce')), 0, 0.63);
  box(g, metal2, 0.7, 0.035, 0.035, 0, 0.66);
  // a pointer, which is how you read a balance at all
  box(g, '#c0392b', 0.016, 0.13, 0.016, 0, 0.72);
  for (const s of [1, -1]) {
    // three cords rather than one strut: a pan hangs
    for (const d of [-1, 1]) rod(g, '#9aa5b1', 0.008, 0.2, s * 0.33 + d * 0.045, 0.56, 0, -d * 0.12);
    const pan = put(g, new Mesh(new CylinderGeometry(0.13, 0.1, 0.04, 26), std('#b9c3ce', { metalness: 0.35, roughness: 0.4 })), s * 0.33, 0.46);
    void pan;
    ring(g, std('#a4aeb9'), 0.125, 0.012, s * 0.33, 0.48, 0, 26);
  }
};
/** A ruler laid flat with tick marks. */
const ruler: Figure = (root) => {
  // stood on its long edge and tipped toward the viewer, so the marked face is
  // the face you see rather than a yellow line on the floor
  const g = upright(root, 1.3, 0.12);
  box(g, '#e8c86a', 0.86, 0.06, 0.16, 0, 0.03);
  // a bevelled reading edge, and marks on both faces the way a real rule has
  box(g, '#d4b25a', 0.86, 0.015, 0.04, 0, 0.058, 0.06);
  for (let i = 0; i < 9; i++) box(g, '#5b452a', 0.012, 0.02, i % 2 ? 0.05 : 0.09, -0.38 + i * 0.095, 0.065, 0.03);
  for (let i = 0; i < 9; i++) box(g, '#5b452a', 0.01, 0.02, i % 2 ? 0.035 : 0.06, -0.38 + i * 0.095, 0.065, -0.05);
};
/** A microscope: base, arm, tube. */
const microscope: Figure = (g) => {
  box(g, '#3b4551', 0.42, 0.08, 0.3, 0, 0.04);
  rod(g, '#4c5867', 0.05, 0.46, -0.1, 0.28);
  box(g, '#4c5867', 0.3, 0.05, 0.22, 0.04, 0.3);
  // a slide on the stage, which is what a microscope is looking at
  box(g, '#dbe8f2', 0.16, 0.012, 0.11, 0.08, 0.335);
  rod(g, '#2b333d', 0.06, 0.34, 0.1, 0.56, 0, 0.25);
  // the eyepiece at the top of the tube and the objective at the bottom: a
  // microscope without an eyepiece is a pipe on a stick
  put(g, new Mesh(new CylinderGeometry(0.05, 0.042, 0.11, 20), std('#20262e')), 0.02, 0.73, 0, 0, 0, 0.25);
  put(g, new Mesh(new CylinderGeometry(0.045, 0.06, 0.1, 20), std('#8a94a0')), 0.14, 0.38);
  // the focus knob
  put(g, new Mesh(new CylinderGeometry(0.055, 0.055, 0.05, 20), std('#6b7583')), -0.1, 0.4, 0.14, Math.PI / 2);
};
/** A telescope on a tripod. */
const telescope: Figure = (g) => {
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    rod(g, '#5b4a3a', 0.022, 0.5, Math.cos(a) * 0.13, 0.24, Math.sin(a) * 0.13, Math.cos(a) * 0.5, Math.sin(a) * 0.5);
  }
  // the head the tube swivels on, so the tripod carries something
  put(g, new Mesh(new CylinderGeometry(0.06, 0.08, 0.09, 18), std('#4c5867')), 0, 0.52);
  put(g, new Mesh(new CylinderGeometry(0.09, 0.06, 0.56, 20), std('#2f3a46')), 0, 0.62, 0, 0, 0, -0.7);
  put(g, new Mesh(new CylinderGeometry(0.1, 0.1, 0.05, 20), std('#d9b44a')), 0.19, 0.78, 0, 0, 0, -0.7);
  // the eyepiece, at the low end where the eye goes
  put(g, new Mesh(new CylinderGeometry(0.035, 0.045, 0.12, 16), std('#20262e')), -0.2, 0.46, 0, 0, 0, -0.7);
  // and a finder scope riding on top
  put(g, new Mesh(new CylinderGeometry(0.028, 0.028, 0.22, 14), std('#4c5867')), 0.02, 0.76, 0.08, 0, 0, -0.7);
};
/**
 * A compass: a dial with a needle.
 *
 * The needle used to be two separate bars sitting at z = +0.05 and -0.05 - two
 * parallel sticks at different depths rather than one needle through the
 * pivot, which is the only moving part the instrument has.
 */
const compass: Figure = (g) => {
  put(g, new Mesh(new CylinderGeometry(0.28, 0.28, 0.07, 32), std('#c9a15e', { metalness: 0.45, roughness: 0.35 })), 0, 0.06);
  ring(g, std('#a8823f', { metalness: 0.5, roughness: 0.3 }), 0.275, 0.022, 0, 0.095, 0, 34);
  disc(g, '#f4f8fc', 0.24, 0, 0.1);
  // the cardinal marks, longer at the four points
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const long = i % 3 === 0;
    put(g, new Mesh(new BoxGeometry(0.014, 0.006, long ? 0.07 : 0.035), std(long ? '#39506b' : '#8a94a0')), Math.sin(a) * (long ? 0.195 : 0.207), 0.105, Math.cos(a) * (long ? 0.195 : 0.207), 0, a, 0);
  }
  /**
   * One needle: two tapered halves meeting at the pivot, north in red.
   *
   * The tilt is baked into the geometry rather than composed at the mesh, so
   * the only rotation left is a single turn about y. Stacking an x-rotation
   * and a y-rotation on one Euler is where this kind of thing goes quietly
   * wrong, because the order they compose in is not the order they are written.
   */
  const th = 0.5;
  for (const [c, turn] of [['#c0392b', 0], ['#39506b', Math.PI]] as const) {
    const geo = new ConeGeometry(0.028, 0.19, 4);
    geo.rotateX(Math.PI / 2);                       // apex now points along +z
    const half = new Mesh(geo, std(c));
    half.scale.set(1, 0.42, 1);                     // a needle is thin, not square
    put(g, half, Math.sin(th + turn) * 0.095, 0.115, Math.cos(th + turn) * 0.095, 0, th + turn, 0);
  }
  put(g, new Mesh(new CylinderGeometry(0.025, 0.025, 0.03, 14), std('#8a94a0', { metalness: 0.5 })), 0, 0.125);
};
/** A clock face with two hands. */
const clockFace: Figure = (g) => {
  put(g, new Mesh(new CylinderGeometry(0.32, 0.32, 0.08, 32), std('#e8eef5')), 0, 0.34, 0, Math.PI / 2);
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
  put(g, new Mesh(new TorusGeometry(0.06, 0.02, 10, 20), std('#8a94a0')), 0, 0.79, 0, Math.PI / 2);
};
/** A barometer: a dial on a wall plate. */
const barometer: Figure = (g) => {
  put(g, new Mesh(new CylinderGeometry(0.3, 0.3, 0.1, 32), std('#5b4a3a')), 0, 0.34, 0, Math.PI / 2);
  disc(g, '#f0e7d2', 0.24, 0, 0.34, 0.055, 0);
  box(g, '#2f3a46', 0.012, 0.18, 0.012, 0.03, 0.4, 0.07, -0.5);
};
/** An envelope. */
const envelope = (color = '#f4f8fc'): Figure => (g) => {
  /**
   * The face of an envelope: the flap's V, a stamp, an address block.
   *
   * The old one was three `ConeGeometry(r, h, 3)` prisms squashed flat on Z. A
   * three-sided cone puts its base vertices at 0, 120 and 240 degrees, so
   * flattening one leaves an *asymmetric* triangle spanning -r/2 to +r rather
   * than the isoceles wedge intended - and the big top flap was additionally
   * scaled 1.36 times wider than the envelope it was supposed to fold onto. It
   * read as a paper dart with a red tab, because that is what it was. A shape
   * extruded from four explicit points cannot go crooked.
   */
  const body = new Color(color);
  put(g, new Mesh(roundedCard(0.62, 0.42, 0.035, 0.02), std(body)), 0, 0.3);
  const flap = new Shape();
  flap.moveTo(-0.305, 0.205); flap.lineTo(0.305, 0.205); flap.lineTo(0, -0.035); flap.lineTo(-0.305, 0.205);
  put(g, new Mesh(new ExtrudeGeometry(flap, { depth: 0.012, bevelEnabled: false }), std(body.clone().multiplyScalar(0.94))), 0, 0.3, 0.016);
  // a stamp with a lighter panel inside it, in the corner it always sits in
  put(g, new Mesh(roundedCard(0.12, 0.14, 0.014, 0.008), std('#f7f9fb')), 0.19, 0.44, 0.026);
  put(g, new Mesh(roundedCard(0.09, 0.11, 0.016, 0.006), std('#c0392b')), 0.19, 0.44, 0.03);
  // the address block, left aligned and getting shorter the way an address does
  for (let i = 0; i < 3; i++) {
    const w = 0.26 - i * 0.06;
    box(g, '#b9c3ce', w, 0.018, 0.014, -0.24 + w / 2, 0.19 - i * 0.05, 0.024);
  }
  ball(g, '#a8322c', 0.036, 0, 0.268, 0.03).scale.set(1, 1, 0.4);
};
/** A shopping stall: a counter under a striped awning. */
const stall = (awning = '#c0392b'): Figure => (g) => {
  box(g, '#a8763f', 0.8, 0.3, 0.4, 0, 0.15);
  box(g, '#8a6a44', 0.84, 0.04, 0.44, 0, 0.32);
  // four posts, not two. The back pair were missing, so the awning was a roof
  // resting on nothing along its whole rear edge.
  for (const s of [1, -1]) for (const z of [0.16, -0.16]) rod(g, '#8a6a44', 0.026, 0.7, s * 0.36, 0.5, z);
  const a = box(g, awning, 0.9, 0.06, 0.46, 0, 0.86, 0.04, 0);
  a.rotation.x = -0.22;
  // the stripes every market awning has, and a scalloped valance along the front
  for (let i = -2; i <= 2; i++) {
    const st = box(g, '#f4f1e8', 0.1, 0.02, 0.47, i * 0.18, 0.89, 0.04);
    st.rotation.x = -0.22;
  }
  for (let i = -4; i <= 4; i++) ball(g, awning, 0.045, i * 0.1, 0.83, 0.27).scale.set(1, 1, 0.5);
  for (let i = 0; i < 3; i++) ball(g, i === 0 ? '#e8c86a' : i === 1 ? '#5f9e4a' : '#c0392b', 0.08, (i - 1) * 0.2, 0.38, 0.1);
};
/** A paper sheet with lines, for receipts and ledgers. */
const sheet = (color = '#fbfdff'): Figure => (g) => {
  // a slight curl at the top and a shadow sheet behind: one flat rectangle
  // standing on its edge reads as a card, not paper
  box(g, '#dde4ea', 0.44, 0.6, 0.012, 0.02, 0.33, -0.014);
  box(g, color, 0.46, 0.62, 0.015, 0, 0.34);
  const curl = box(g, color, 0.46, 0.07, 0.015, 0, 0.655, 0.014);
  curl.rotation.x = -0.35;
  for (let i = 0; i < 5; i++) box(g, '#b9c3ce', 0.3, 0.016, 0.018, -0.03, 0.54 - i * 0.09, 0.012);
  // a total rule and a stamp, which is what makes it a receipt rather than
  // a blank page with lines
  box(g, '#8a94a0', 0.34, 0.008, 0.018, -0.01, 0.155, 0.012);
  box(g, '#2f6b8f', 0.14, 0.03, 0.018, 0.1, 0.115, 0.012);
  put(g, new Mesh(new TorusGeometry(0.05, 0.008, 8, 20), std('#c0392b', { transparent: true, opacity: 0.75 })), 0.12, 0.24, 0.014);
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
  /**
   * A cupped hand, not a flattened ball.
   *
   * The figure is called `tap` but the subject is washing, and a palm with
   * fingers is the half of it a child recognises. A squashed sphere under a
   * spout is a stone.
   */
  const palm = put(g, new Mesh(new SphereGeometry(0.17, 24, 16), std('#c98f5f')), 0.12, 0.2);
  palm.scale.set(1.15, 0.45, 0.95);
  // the cup: a shallow dish sunk into the palm so water would sit in it
  const cup = put(g, new Mesh(new SphereGeometry(0.13, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), std('#b87f52')), 0.12, 0.225);
  cup.scale.set(1.1, 0.35, 0.9);
  for (let i = 0; i < 4; i++) {
    const f = put(g, new Mesh(new CylinderGeometry(0.021, 0.025, 0.14, 12), std('#c98f5f')), 0.25, 0.215 + i * 0.004, (i - 1.5) * 0.055, 0, 0, -1.15);
    void f;
  }
  const thumb = put(g, new Mesh(new CylinderGeometry(0.024, 0.028, 0.1, 12), std('#c98f5f')), 0.06, 0.215, 0.13, 0, 0.9, -1.3);
  void thumb;
};
/** A gear wheel. */
const gear = (color = '#8a94a0', r = 0.28): Figure => (g) => {
  put(g, new Mesh(new CylinderGeometry(r, r, 0.09, 28), std(color, { metalness: 0.35 })), 0, 0.34, 0, Math.PI / 2);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    box(g, color, 0.1, 0.1, 0.09, Math.cos(a) * (r + 0.05), 0.34 + Math.sin(a) * (r + 0.05), 0, a);
  }
  put(g, new Mesh(new CylinderGeometry(0.07, 0.07, 0.11, 20), std('#39414b')), 0, 0.34, 0, Math.PI / 2);
};
/** A lit bulb. */
const bulb: Figure = (g) => {
  // the envelope, and a neck between it and the cap, which is the pear shape
  ball(g, '#ffe9a8', 0.22, 0, 0.5);
  put(g, new Mesh(new CylinderGeometry(0.13, 0.1, 0.1, 20), std('#ffe9a8', { transparent: true, opacity: 0.85 })), 0, 0.33);
  put(g, new Mesh(new SphereGeometry(0.3, 20, 16), glow('#f0b429', 0.22)), 0, 0.5);
  // a filament, which is the thing that actually lights and the only part a
  // child can point at and name
  const fil = put(g, new Mesh(new TorusGeometry(0.05, 0.009, 8, 18, Math.PI * 1.4), std('#ffd45e', { emissive: '#ffb020', emissiveIntensity: 0.9 })), 0, 0.5, 0, Math.PI / 2);
  void fil;
  for (const s of [1, -1]) rod(g, '#c9a15e', 0.008, 0.12, s * 0.035, 0.42);
  // a screw cap with real threads rather than a smooth collar
  put(g, new Mesh(new CylinderGeometry(0.1, 0.115, 0.15, 20), std('#9aa5b1', { metalness: 0.55, roughness: 0.35 })), 0, 0.24);
  for (let i = 0; i < 3; i++) ring(g, std('#8d97a2', { metalness: 0.5, roughness: 0.4 }), 0.106 - i * 0.002, 0.014, 0, 0.2 + i * 0.045, 0, 20);
  put(g, new Mesh(new SphereGeometry(0.035, 14, 10), std('#4c5867')), 0, 0.15);
};
/** A wheel: the first machine. */
const wheel: Figure = (g) => {
  /**
   * Upright, on its rim.
   *
   * The spokes were built in the XY plane and so stood up correctly, while the
   * rim and the iron tyre were laid flat: a wheel lying on the ground like a
   * dinner plate with a fan of spokes standing inside it. The hub and axle
   * were always right - a cylinder points along Y, so an axle aimed at the
   * viewer genuinely does need the quarter turn the rim did not.
   */
  put(g, new Mesh(new TorusGeometry(0.3, 0.06, 12, 32), std('#7a5a3a')), 0, 0.36);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI;
    box(g, '#a8763f', 0.03, 0.58, 0.03, 0, 0.36, 0, a);
  }
  // a hub. Six spokes crossing in mid air is a wheel with nothing at the
  // centre, and the centre is the whole idea of a wheel.
  put(g, new Mesh(new CylinderGeometry(0.085, 0.085, 0.12, 20), std('#6b4a2a')), 0, 0.36, 0, Math.PI / 2);
  put(g, new Mesh(new CylinderGeometry(0.03, 0.03, 0.18, 14), std('#4c5867', { metalness: 0.5 })), 0, 0.36, 0, Math.PI / 2);
  // an iron tyre round the rim, the way a cart wheel is banded
  put(g, new Mesh(new TorusGeometry(0.345, 0.022, 10, 34), std('#6b7583', { metalness: 0.45, roughness: 0.45 })), 0, 0.36);
};
/** A book. */
const book = (cover = '#3d6b8f'): Figure => (g) => {
  /**
   * A closed book standing on its bottom edge: page block, two covers that
   * overhang it, and a rounded spine joining them.
   *
   * It used to be a coloured slab with a white slab inside, which shows only
   * as a pale sliver at the edges. The thing that reads as a book is the page
   * block being visibly *thinner* than the covers and striped at the fore
   * edge, plus a spine you can see is curved.
   */
  const dark = new Color(cover).multiplyScalar(0.82);
  for (let i = 0; i < 6; i++) box(g, i % 2 ? '#f7f9fb' : '#e4eaf0', 0.46, 0.58, 0.014, 0.016, 0.33, -0.038 + i * 0.0152);
  box(g, cover, 0.5, 0.62, 0.018, 0, 0.33, 0.047);
  box(g, cover, 0.5, 0.62, 0.018, 0, 0.33, -0.047);
  put(g, new Mesh(new CylinderGeometry(0.056, 0.056, 0.62, 20), std(dark)), -0.25, 0.33, 0);
  // the bands and the title block a bound spine carries
  for (const y of [0.5, 0.16]) put(g, new Mesh(new TorusGeometry(0.057, 0.008, 8, 20), std('#d8b24a')), -0.25, y, 0, Math.PI / 2);
  box(g, '#d8b24a', 0.012, 0.16, 0.07, -0.3, 0.33, 0);
};
/** A screen on a stand: a computer. */
const monitor: Figure = (g) => {
  put(g, new Mesh(roundedCard(0.78, 0.5, 0.06, 0.03), std('#2b333d')), 0, 0.55);
  put(g, new Mesh(roundedCard(0.68, 0.4, 0.022, 0.015), std('#7fd4ff', { roughness: 0.12, emissive: '#2b6f95', emissiveIntensity: 0.35 })), 0, 0.55, 0.034);
  // something on the screen. A flat cyan rectangle is a monitor that is off,
  // on a card about computers.
  box(g, '#1e5e80', 0.66, 0.055, 0.026, 0, 0.72, 0.036);
  for (let i = 0; i < 4; i++) box(g, '#cfeeff', 0.42 - i * 0.07, 0.028, 0.026, -0.1 + i * 0.03, 0.62 - i * 0.06, 0.036);
  box(g, '#cfeeff', 0.2, 0.028, 0.026, -0.21, 0.38, 0.036);
  // a neck that widens into a foot, and a keyboard in front of it
  taper(g, '#4c5867', 0.045, 0.07, 0.2, 0, 0.2);
  put(g, new Mesh(roundedCard(0.34, 0.2, 0.045, 0.02), std('#4c5867')), 0, 0.09, 0, Math.PI / 2);
  put(g, new Mesh(roundedCard(0.44, 0.16, 0.03, 0.02), std('#39414b')), 0, 0.015, 0.3, Math.PI / 2);
  for (let rI = 0; rI < 3; rI++) for (let c = 0; c < 7; c++) box(g, '#5a6470', 0.045, 0.012, 0.03, (c - 3) * 0.055, 0.032, 0.26 + rI * 0.035);
};
/** A rounded robot. */
const robot: Figure = (g) => {
  // rounded body and head, a jointed arm, and a face that is a screen rather
  // than two dots: every edge on this used to be a perfect right angle
  put(g, new Mesh(roundedCard(0.44, 0.4, 0.3, 0.06), std('#8a94a0', { metalness: 0.25, roughness: 0.45 })), 0, 0.42);
  put(g, new Mesh(roundedCard(0.3, 0.16, 0.03, 0.03), std('#1b2129')), 0, 0.48, 0.152);
  for (const s2 of [1, -1]) ball(g, '#7fd4ff', 0.042, s2 * 0.075, 0.48, 0.163).scale.set(1, 1, 0.5);
  box(g, '#7fd4ff', 0.09, 0.012, 0.02, 0, 0.435, 0.16);
  for (const s2 of [1, -1]) {
    rod(g, '#6b7583', 0.035, 0.16, s2 * 0.27, 0.44, 0, s2 * 0.25);
    ball(g, '#6b7583', 0.045, s2 * 0.31, 0.3, 0);
    rod(g, '#5c6572', 0.03, 0.14, s2 * 0.33, 0.22, 0, -s2 * 0.15);
  }
  put(g, new Mesh(roundedCard(0.36, 0.2, 0.26, 0.05), std('#6b7583')), 0, 0.12);
  // treads rather than nothing: a robot needs a way to have arrived
  for (const s2 of [1, -1]) put(g, new Mesh(new CylinderGeometry(0.075, 0.075, 0.07, 18), std('#39414b')), s2 * 0.14, 0.075, 0, 0, 0, Math.PI / 2);
  rod(g, '#6b7583', 0.018, 0.13, 0, 0.68);
  ball(g, '#c0392b', 0.045, 0, 0.76);
};
/** A flask. */
const flask = (liquid = '#7ac8a0'): Figure => (g) => {
  const glassMat = () => new MeshStandardMaterial({ color: '#dce8f5', transparent: true, opacity: 0.28, side: DoubleSide, roughness: 0.12, depthWrite: false });
  put(g, new Mesh(new ConeGeometry(0.28, 0.44, 26, 1, true), glassMat()), 0, 0.24);
  put(g, new Mesh(new CylinderGeometry(0.07, 0.07, 0.2, 20, 1, true), glassMat()), 0, 0.55);
  ring(g, glassMat(), 0.072, 0.014, 0, 0.645, 0, 20);
  /**
   * The contents are a frustum, not a cone.
   *
   * A cone pointing the same way as the flask means the liquid comes to a
   * *point* at the top and is widest at the bottom - which is the shape of the
   * vessel, not the shape of what is in it. Liquid in a conical flask is the
   * bottom slice of that cone: narrow below, wide at the surface, with a flat
   * top where it meets the air.
   */
  const yTop = 0.19, fill = 0.17;
  const rAt = (y: number) => 0.28 * (1 - (y - 0.02) / 0.44);
  put(g, new Mesh(new CylinderGeometry(rAt(yTop), rAt(yTop - fill), fill, 26), std(liquid, { transparent: true, opacity: 0.88, roughness: 0.2 })), 0, yTop - fill / 2);
  disc(g, new Color(liquid).lerp(new Color('#ffffff'), 0.2), rAt(yTop) * 0.99, 0, yTop);
  put(g, new Mesh(new CylinderGeometry(0.285, 0.285, 0.02, 26), glassMat()), 0, 0.025);
};
/** A cloud with rain, for a wet habitat. */
const cloudDrop: Figure = (g) => {
  for (const [x, y, r] of [[0, 0.6, 0.2], [0.18, 0.56, 0.15], [-0.18, 0.56, 0.15]] as const) ball(g, '#cfd8e3', r, x, y);
  for (let i = 0; i < 4; i++) ball(g, '#79b6e8', 0.045, (i - 1.5) * 0.12, 0.3 - (i % 2) * 0.1);
};
/** A leafy shrub with no pot: undergrowth and producers. */
const shrub = (leaf: string): Figure => (g) => {
  // Seeded off the leaf colour and varied in size, height and shade, for the
  // same reason the tree crowns are: five identical balls in a ring read as
  // five identical balls, however good any one of them is.
  const r = rng(hash(leaf));
  const base = new Color(leaf);
  // a few woody stems under the mass, so it grows out of the ground
  for (let i = 0; i < 3; i++) {
    const a = i * 2.1 + r();
    rod(g, '#6b5233', 0.016, 0.16, Math.cos(a) * 0.07, 0.08, Math.sin(a) * 0.07, Math.cos(a) * 0.25);
  }
  for (let i = 0; i < 7; i++) {
    const a = i * 1.3 + r() * 0.5, rad = 0.06 + r() * 0.11;
    const blob = put(g, new Mesh(new IcosahedronGeometry(0.1 + r() * 0.06, 1), std(base.clone().offsetHSL(r() * 0.03 - 0.015, 0, r() * 0.12 - 0.06), { flatShading: true })),
      Math.cos(a) * rad, 0.14 + r() * 0.16, Math.sin(a) * rad);
    blob.rotation.set(r() * 3, r() * 3, 0);
  }
};
/** Soil with something growing out: decomposers and roots. */
const soil = (): Figure => (g) => {
  const s = put(g, new Mesh(new CylinderGeometry(0.34, 0.3, 0.18, 26), std('#6b5233')), 0, 0.09);
  void s;
  for (let i = 0; i < 5; i++) {
    const a = i * 1.4;
    const m = put(g, new Mesh(new SphereGeometry(0.07, 20, 14), std('#c9b98f')), Math.cos(a) * 0.14, 0.2, Math.sin(a) * 0.14);
    m.scale.set(1, 0.55, 1);
    rod(g, '#e8e0cc', 0.012, 0.08, Math.cos(a) * 0.14, 0.15, Math.sin(a) * 0.14);
  }
};
/** A sun disc with rays. */
const sunDisc: Figure = (g) => {
  ball(g, '#f5b731', 0.24, 0, 0.5);
  put(g, new Mesh(new SphereGeometry(0.33, 24, 18), glow('#f5b731', 0.25)), 0, 0.5);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    box(g, '#f5b731', 0.04, 0.14, 0.04, Math.cos(a) * 0.36, 0.5 + Math.sin(a) * 0.36, 0, a);
  }
};
/** A bird in flight, for migration. */
const flyingBird = (color = '#5b6b7d'): Figure => (g) => {
  /**
   * A body and two swept cones is a paper dart.
   *
   * What was missing is everything that points: no head, so there was no front
   * and no back, and no tail, so the wings sat on nothing. A bird in flight is
   * read from its silhouette - head out front, wings out to the sides, tail
   * fanned behind - and two of those three were absent.
   */
  const pale = new Color(color).lerp(new Color('#ffffff'), 0.3);
  const b = ball(g, color, 0.1, 0, 0.5);
  b.scale.set(1.7, 0.66, 0.62);
  const head = ball(g, color, 0.062, 0.19, 0.525);
  head.scale.set(1, 0.95, 0.95);
  cone(g, '#e8a63a', 0.028, 0.075, 0.265, 0.522, 0, -Math.PI / 2);
  for (const z of [1, -1]) ball(g, '#12181f', 0.014, 0.215, 0.545, z * 0.038);
  // a fanned tail behind, which is what the wings are balanced against
  const tail = put(g, new Mesh(new ConeGeometry(0.085, 0.2, 3), std(color)), -0.24, 0.495, 0, 0, 0, -Math.PI / 2);
  tail.scale.set(1, 1, 0.2);
  for (const s of [1, -1]) {
    // each wing is two blades: a broad inner and a swept outer, so the
    // trailing edge bends the way a real wing does
    const inner = put(g, new Mesh(new ConeGeometry(0.105, 0.3, 3), std(color)), -0.01, 0.545, s * 0.19, 0, 0, s * 0.62);
    inner.scale.set(1, 1, 0.26); inner.rotation.x = s * 0.22;
    const outer = put(g, new Mesh(new ConeGeometry(0.07, 0.28, 3), std(pale)), -0.05, 0.6, s * 0.4, 0, 0, s * 0.95);
    outer.scale.set(1, 1, 0.2); outer.rotation.x = s * 0.3;
  }
};
/** A branching coral. */
const coral = (color = '#e07a8a'): Figure => (g) => {
  // Coral branches: each arm forks once, which is what makes coral read as
  // coral rather than as a handful of sticks pushed into the sand.
  const r = rng(hash(color));
  const base = new Color(color);
  put(g, new Mesh(new CylinderGeometry(0.17, 0.22, 0.07, 22), std('#d8cbb0')), 0, 0.035);
  for (let i = 0; i < 5; i++) {
    const a = i * 1.25 + r() * 0.4, rad = 0.09;
    const h = 0.26 + r() * 0.16;
    const lean = Math.cos(a) * 0.35;
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad;
    const tint = base.clone().offsetHSL(r() * 0.04 - 0.02, 0, r() * 0.1 - 0.05);
    taper(g, tint, 0.022, 0.038, h, x, 0.06 + h / 2, z, lean);
    const tipX = x - Math.sin(lean) * h * 0.5, tipY = 0.06 + h * 0.98;
    for (const s of [1, -1]) {
      const bh = 0.11 + r() * 0.08;
      taper(g, tint, 0.013, 0.022, bh, tipX + s * 0.045, tipY + bh * 0.4, z + s * 0.03, lean + s * 0.6);
      ball(g, tint.clone().lerp(new Color('#ffffff'), 0.25), 0.032, tipX + s * 0.085, tipY + bh * 0.78, z + s * 0.055);
    }
  }
};
/** A simple house. */
const house = (wall = '#e2d6bf', roof = '#a8563c'): Figure => (g) => {
  box(g, wall, 0.6, 0.44, 0.46, 0, 0.22);
  put(g, new Mesh(new ConeGeometry(0.5, 0.3, 4), std(roof)), 0, 0.59, 0, 0, Math.PI / 4);
  // eaves: a roof that stops flush with the wall reads as a lid, not a roof
  put(g, new Mesh(new ConeGeometry(0.53, 0.06, 4), std(new Color(roof).multiplyScalar(0.85))), 0, 0.47, 0, 0, Math.PI / 4);
  box(g, '#6b4a2a', 0.16, 0.24, 0.02, 0, 0.12, 0.24);
  box(g, '#8a6a44', 0.02, 0.02, 0.02, 0.055, 0.12, 0.253);
  // windows, which is most of what tells a box from a house at a glance
  for (const s of [1, -1]) {
    box(g, '#9fd0e8', 0.13, 0.13, 0.02, s * 0.19, 0.28, 0.238);
    box(g, wall, 0.15, 0.015, 0.025, s * 0.19, 0.355, 0.24);
    box(g, wall, 0.015, 0.14, 0.025, s * 0.19, 0.28, 0.24);
  }
  // a step at the door
  box(g, '#c3b79c', 0.22, 0.04, 0.09, 0, 0.02, 0.27);
};


/* ---------- faces, one per feeling ---------- */
/** A head with brows, eyes and a mouth built from primitives. */
/**
 * A face, one per feeling: the most-used figure on the site.
 *
 * It was a bare ball with two spheres for eyes pushed to z = 0.3 on a head of
 * radius 0.36, which put them a third out of the surface and made every
 * feeling read as googly-eyed surprise, over a mouth whose torus sat mostly
 * *inside* the head and surfaced as a red gash. A sphere placed on a sphere is
 * either swallowed or bulging, never seated, which is why the iris and the
 * catchlight here are flat discs past the eyeball's frontmost point: a disc
 * cannot intersect the ball behind it at any radius.
 */
const faceFig = (opts: { brow?: 'flat' | 'angry' | 'sad' | 'up'; eye?: 'open' | 'wide' | 'squint' | 'droop'; mouth?: 'smile' | 'frown' | 'o' | 'flat' | 'small'; cheek?: string }): Figure => (g) => {
  const skin = '#e8b98e', hair = '#3a2c20';
  const CY = 0.5, R = 0.36;
  const head = ball(g, skin, R, 0, CY); head.scale.set(0.97, 1.04, 0.95);
  /**
   * Where the head's own surface sits at (x, y).
   *
   * The mouth used to be pinned to the single plane z = 0.345, but the head is
   * an ellipsoid whose surface at mouth height is 0.32 in the middle and 0.29
   * at the corners, and lower still where a smile curves down. So every smile
   * stood up to a tenth of a unit clear of the face and hung below the chin
   * like a tongue, and all ten feelings had it. Anything drawn *on* a face has
   * to follow the face.
   */
  const AX = R * 0.97, AY = R * 1.04, AZ = R * 0.95;
  const surfZ = (x: number, y: number) => {
    const u = x / AX, v = (y - CY) / AY;
    return AZ * Math.sqrt(Math.max(0.04, 1 - u * u - v * v));
  };
  // a jaw, so the head has a chin rather than being a perfect sphere
  const jaw = ball(g, skin, 0.27, 0, CY - 0.16, 0.03); jaw.scale.set(0.92, 0.8, 0.9);
  // hair in two pieces, the way the hero face does it: a crown that stops above
  // the brow and a back that comes down past the ear
  const crown = put(g, new Mesh(new SphereGeometry(R + 0.015, 26, 14, 0, Math.PI * 2, 0, Math.PI * 0.3), std(hair, { roughness: 0.95 })), 0, CY, -0.01);
  crown.scale.set(0.99, 1.06, 0.99);
  const back = put(g, new Mesh(new SphereGeometry(R + 0.008, 22, 16, Math.PI, Math.PI, 0, Math.PI * 0.62), std(hair, { roughness: 0.95 })), 0, CY, -0.01);
  back.scale.set(1, 1.05, 0.99);
  for (const s of [1, -1]) { const ear = ball(g, skin, 0.062, s * 0.34, CY - 0.03, 0); ear.scale.set(0.45, 1, 0.7); }
  const nose = ball(g, skin, 0.055, 0, CY - 0.05, 0.33); nose.scale.set(0.85, 1.05, 1);
  if (opts.cheek) for (const s of [1, -1]) ball(g, opts.cheek, 0.075, s * 0.2, CY - 0.06, 0.27).scale.set(1, 0.7, 0.35);

  const eye = opts.eye ?? 'open';
  for (const s of [1, -1]) {
    if (eye === 'squint') {
      const b = box(g, '#2a2118', 0.115, 0.024, 0.02, s * 0.14, CY + 0.06, 0.336); b.rotation.z = s * 0.35;
      continue;
    }
    const r = eye === 'wide' ? 0.062 : 0.05;
    /**
     * A flattened lens seated *at* the head's surface, not a ball in front of
     * it. The head is scaled 0.95 in z, so its surface at the eye is only
     * z = 0.309 - put a round eyeball at 0.336 and the whole thing clears the
     * face and reads as a googly eye glued on. Flat front to back and centred
     * on the surface, it reads as an eye-shaped patch instead, and the iris
     * disc still has somewhere to sit that the lens cannot swallow.
     */
    const ey = CY + 0.06 - (eye === 'droop' ? 0.012 : 0);
    const white = ball(g, '#f8fbff', r, s * 0.14, ey, 0.305);
    white.scale.set(1.15, 0.85, 0.32);
    const front = 0.305 + r * 0.32;
    disc(g, '#2f2218', r * 0.5, s * 0.14, ey, front + 0.004, 0);
    disc(g, '#100c07', r * 0.25, s * 0.14, ey, front + 0.008, 0);
    disc(g, '#ffffff', r * 0.12, s * 0.14 - r * 0.22, ey + r * 0.3, front + 0.012, 0);
    // a lid cap, which is what makes a droop read as a droop
    if (eye === 'droop') {
      const lid = put(g, new Mesh(new SphereGeometry(r * 1.14, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.44), std(skin)), s * 0.14, ey + 0.012, 0.302);
      lid.scale.set(1.05, 0.8, 0.36); lid.rotation.x = -0.4;
    }
  }
  const brow = opts.brow ?? 'flat';
  for (const s of [1, -1]) {
    const by = brow === 'up' ? 0.7 : 0.665;
    const b = box(g, '#3b2d22', 0.125, 0.026, 0.024, s * 0.14, by, surfZ(s * 0.14, by) - 0.006);
    // swung to lie along the tangent as well as seated on it, or the outer end
    // of the bar lifts off a face that is curving away under it
    b.rotation.set(0, -s * 0.44, brow === 'angry' ? -s * 0.45 : brow === 'sad' ? s * 0.4 : brow === 'up' ? s * 0.15 : 0);
  }
  const mouth = opts.mouth ?? 'smile';
  /**
   * A row of beads, each seated on the surface at its own x and y, rather than
   * one arc on a plane. `bow` is how far the middle drops below the corners,
   * so a positive bow is a smile and a negative one a frown.
   */
  const lip = (n: number, halfW: number, yc: number, bow: number, rad = 0.021) => {
    for (let i = 0; i < n; i++) {
      const u = (i / (n - 1)) * 2 - 1;
      const x = u * halfW, y = yc - bow * (1 - u * u);
      put(g, new Mesh(new SphereGeometry(rad, 10, 8), std('#8a3b3b')), x, y, surfZ(x, y)).scale.set(1.3, 1, 0.55);
    }
  };
  if (mouth === 'o') {
    const oy = CY - 0.15;
    const o = put(g, new Mesh(new TorusGeometry(0.06, 0.021, 10, 20), std('#8a3b3b')), 0, oy, surfZ(0, oy) - 0.008);
    o.scale.set(1, 1.15, 0.7);
  } else if (mouth === 'flat') lip(7, 0.085, CY - 0.15, 0);
  else if (mouth === 'small') lip(6, 0.058, CY - 0.14, 0.022, 0.019);
  else if (mouth === 'frown') lip(9, 0.112, CY - 0.15, -0.048);
  else lip(9, 0.112, CY - 0.13, 0.048);
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
  const r = rng(0xbea60);
  put(g, new Mesh(new CylinderGeometry(0.6, 0.6, 0.08, 32), std('#e6d2a8', { roughness: 1 })), 0, 0.04);
  /**
   * Sea in the far half, dry sand in the near half, a wet band between them.
   *
   * The sea and the wet band were written as `disc(g, colour, r, x, y, -PI/2)`,
   * one argument short: `disc` already defaults its rotation, so the quarter
   * turn landed in the **z** parameter and parked the sea a unit and a half
   * behind the beach, hanging in the air beside the palm. From the front it
   * read as a blue saucer floating in the sky, and the beach itself had no
   * water on it at all. A shoreline is water *overlapping* sand; the order the
   * three discs stack in is the whole effect.
   */
  const sea = disc(g, '#3f86b8', 0.58, 0, 0.098, -0.3); sea.scale.set(1.04, 0.62, 1);
  const wet = disc(g, '#cbb98e', 0.57, 0, 0.088, -0.14); wet.scale.set(1.04, 0.62, 1);
  // wave lines that follow the water rather than circles laid over an ellipse
  for (let i = 0; i < 3; i++) {
    const f = ring(g, std('#eef6fb', { transparent: true, opacity: 0.72 }), 0.3 + i * 0.12, 0.012, 0, 0.103, -0.3, 30);
    f.scale.set(1, 0.62, 1);
  }
  // a palm on the dry sand, leaning out over the water the way they all do
  for (let i = 0; i < 3; i++) taper(g, '#8a6a44', 0.03 - i * 0.005, 0.042 - i * 0.005, 0.2, -0.2 - i * 0.035, 0.18 + i * 0.18, 0.24, 0.22 + i * 0.06);
  for (let i = 0; i < 3; i++) {
    // a band round a leaning trunk has to be laid flat *first* and tilted
    // after, which is the reverse of the default XYZ order
    const band = ring(g, std('#7a5c3a'), 0.033, 0.007, -0.24 - i * 0.025, 0.3 + i * 0.14, 0.24, 14);
    band.rotation.order = 'ZYX';
    band.rotation.set(-Math.PI / 2, 0, 0.28 + i * 0.06);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const b = new Mesh(new ConeGeometry(0.045, 0.3, 5), std(new Color('#4b8f4f').offsetHSL(0, 0, r() * 0.1 - 0.05)));
    b.position.set(-0.33 + Math.cos(a) * 0.12, 0.72, 0.24 + Math.sin(a) * 0.12);
    b.rotation.set(Math.cos(a) * 1.15, 0, -Math.sin(a) * 1.15);
    b.scale.set(1, 1, 0.4);
    g.add(b);
  }
  ball(g, '#7a5c3a', 0.03, -0.3, 0.66, 0.28);
  // shells on the dry sand, which is now the near half
  for (let i = 0; i < 3; i++) {
    const a = r() * 6.28;
    const sh = ball(g, '#f2e6d2', 0.026, Math.cos(a) * 0.28, 0.09, 0.32 + Math.sin(a) * 0.08);
    sh.scale.set(1.3, 0.5, 1); sh.rotation.y = a;
  }
};
/** A small island ringed by water. */
const island: Figure = (g) => {
  const r = rng(0x151a1d);
  disc(g, '#3f86b8', 0.62, 0, 0.02);
  // rings of surf round the shore, which is what turns a disc of blue into sea
  for (let i = 0; i < 2; i++) ring(g, std('#cfe4f2', { transparent: true, opacity: 0.65 }), 0.36 + i * 0.1, 0.012, 0, 0.03 + i * 0.004, 0, 34);
  put(g, new Mesh(new SphereGeometry(0.3, 26, 16), std('#e6d2a8')), 0, 0.06).scale.set(1, 0.4, 1);
  // a palm rather than a green ball: a curved trunk and drooping fronds is the
  // one silhouette that says island rather than lump
  const th = 0.06;
  for (let i = 0; i < 3; i++) taper(g, '#8a6a44', 0.018 - i * 0.003, 0.026 - i * 0.003, 0.11, th + i * 0.018, 0.16 + i * 0.1, 0, 0.16 + i * 0.05);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const f = put(g, new Mesh(new ConeGeometry(0.035, 0.2, 5), std('#4b8f4f')), th + 0.09 + Math.cos(a) * 0.08, 0.42, Math.sin(a) * 0.08);
    f.rotation.set(Math.cos(a) * 1.15, 0, -Math.sin(a) * 1.15); f.scale.set(1, 1, 0.4);
  }
  for (let i = 0; i < 3; i++) ball(g, '#c9a870', 0.028, -0.18 + r() * 0.1, 0.09, 0.1 + r() * 0.12).scale.set(1.3, 0.6, 1);
};
/** A wetland: open water with reeds. */
const wetland: Figure = (g) => {
  /**
   * A haor: open water in the middle, reed beds round the rim.
   *
   * The reeds used to stand scattered evenly across the whole pond at up to
   * half its radius in height - not a wetland but a pin cushion, eleven bare
   * sticks in a puddle. The lily pads were lost underneath them, and the
   * wading bird, a sixth of a reed tall, disappeared among the stems. Reeds
   * grow where they can root, which is the margin, and leaving the middle
   * open is what makes the water read as water.
   */
  const rr = rng(0x3e71a);
  disc(g, '#3b7a8f', 0.6, 0, 0.02);
  // paler shallows round the rim, so the water has a depth to it
  ring(g, std('#4f93a6'), 0.5, 0.09, 0, 0.024, 0, 36).scale.set(1, 1, 0.1);
  // lily pads, big enough to be leaves rather than confetti
  for (let i = 0; i < 7; i++) {
    const a = rr() * 6.28, rad = rr() * 0.28;
    const pad = disc(g, i % 3 ? '#3f7a46' : '#4a8a4e', 0.085 + rr() * 0.05, Math.cos(a) * rad, 0.03 + i * 0.001, Math.sin(a) * rad);
    pad.rotation.z = rr() * 0.3;
  }
  for (const [fx, fz] of [[0.14, 0.1], [-0.19, -0.06]] as const) {
    ball(g, '#e8a0b4', 0.038, fx, 0.055, fz).scale.set(1, 0.8, 1);
    ball(g, '#f4d0a8', 0.016, fx, 0.08, fz);
  }
  // three clumps at the margin rather than a wash of single stems
  for (let c = 0; c < 3; c++) {
    const ca = 0.7 + c * 2.1 + rr() * 0.4;
    const cx = Math.cos(ca) * 0.42, cz = Math.sin(ca) * 0.42;
    for (let i = 0; i < 5; i++) {
      const x = cx + (rr() - 0.5) * 0.2, z = cz + (rr() - 0.5) * 0.17;
      const h = 0.2 + rr() * 0.13, lean = (rr() - 0.5) * 0.24;
      rod(g, '#7f9e4a', 0.013, h, x, 0.02 + h / 2, z, lean);
      // the stem leans, so the head belongs over the *tip*, not over the root
      const tx = x - Math.sin(lean) * h / 2, ty = 0.02 + h / 2 + Math.cos(lean) * h / 2;
      if (i % 2 === 0) {
        // the brown cattail, which is the one thing that names the plant
        put(g, new Mesh(new CylinderGeometry(0.027, 0.023, 0.11, 12), std('#7a5a35')), tx, ty + 0.045, z, 0, 0, lean);
        cone(g, '#8fae5a', 0.011, 0.05, tx, ty + 0.12, z, lean);
      } else {
        const bl = put(g, new Mesh(new ConeGeometry(0.024, 0.17, 3), std('#8fae5a')), x + 0.035, 0.02 + h * 0.72, z, 0, 0, -0.55);
        bl.scale.set(1, 1, 0.3);
      }
    }
  }
  // a wading bird standing in the open, at a size that can actually be seen
  const bx = 0.04, bz = 0.29;
  for (const s of [1, -1]) rod(g, '#d9a24a', 0.011, 0.18, bx + s * 0.032, 0.1, bz + s * 0.012);
  const body = ball(g, '#f4f6f8', 0.082, bx, 0.24, bz); body.scale.set(1.45, 0.9, 0.85);
  const wing = ball(g, '#e4e9ee', 0.062, bx + 0.022, 0.248, bz); wing.scale.set(1.3, 0.55, 1.15);
  void wing;
  // the neck and the lifted head are the whole silhouette of a waterbird
  taper(g, '#f4f6f8', 0.021, 0.034, 0.14, bx - 0.08, 0.31, bz, 0.34);
  const hd = ball(g, '#f4f6f8', 0.045, bx - 0.132, 0.383, bz); hd.scale.set(1.15, 1, 0.95);
  void hd;
  cone(g, '#d9a24a', 0.016, 0.095, bx - 0.212, 0.378, bz, Math.PI / 2 + 0.14);
  for (const s of [1, -1]) disc(g, '#1b2129', 0.009, bx - 0.145, 0.396, bz + s * 0.044, 0).rotation.y = s > 0 ? 0 : Math.PI;
  const tail = put(g, new Mesh(new ConeGeometry(0.045, 0.13, 6), std('#e4e9ee')), bx + 0.15, 0.255, bz, 0, 0, -1.9);
  tail.scale.set(1, 1, 0.6);
};
/** Terraced rows on a slope: the tea garden. */
const teaGarden: Figure = (g) => {
  /**
   * A rounded slope with rows of bushes curving round the contour.
   *
   * Four boxes stacked back and up, each narrower than the last, is a
   * ziggurat: it read as a tiered wedding cake, or at best as Balinese rice
   * terraces, which is a different country and a different crop. A Sylhet tea
   * garden is a *rounded* hill with the rows following its contour lines and a
   * shade tree standing over them. Every bush is placed at the height the dome
   * actually has beneath it, so the rows sit on the slope instead of hovering
   * in steps above it.
   */
  const r = rng(0x7ea0);
  const HW = 0.62, HH = 0.3, HD = 0.5;
  const hill = put(g, new Mesh(new SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), std('#5f8a4a')), 0, 0, 0);
  hill.scale.set(HW, HH, HD);
  const domeY = (x: number, z: number) => {
    const u = x / HW, v = z / HD;
    return HH * Math.sqrt(Math.max(0, 1 - u * u - v * v));
  };
  for (let row = 0; row < 4; row++) {
    const rad = 0.16 + row * 0.12, n = 4 + row * 2;
    for (let k = 0; k < n; k++) {
      const a = -1.0 + (k / (n - 1)) * 2.0;
      const x = Math.sin(a) * rad * 1.5, z = 0.08 + Math.cos(a) * rad * 0.9;
      const b = ball(g, new Color('#3f7a3f').offsetHSL(r() * 0.03 - 0.015, 0, r() * 0.1 - 0.05),
        0.046 + r() * 0.022, x, domeY(x, z) + 0.016, z);
      b.scale.set(1, 0.8, 1);
    }
  }
  // the shade tree every garden keeps standing over the rows
  const tx = -0.34, tz = -0.14;
  taper(g, '#6b4a2a', 0.022, 0.038, 0.3, tx, domeY(tx, tz) + 0.1, tz);
  for (let i = 0; i < 3; i++) {
    ball(g, '#2f6b3f', 0.095 - i * 0.016, tx + (r() - 0.5) * 0.09, domeY(tx, tz) + 0.28 + i * 0.05, tz + (r() - 0.5) * 0.09);
  }
};
/** Layered hills. */
const hills: Figure = (g) => {
  /**
   * Rounded ridges, not cones.
   *
   * Five five-sided cones in a row each present one big flat facet to the
   * light, so the whole figure read as paper triangles stood up in a row and
   * overlapping: mountains in a school play rather than the green hills behind
   * Sylhet. A hill is wider than it is tall and its top is round. These are
   * hemispheres, so nothing shows under the ground line.
   */
  const r = rng(0x4111);
  for (let i = 0; i < 5; i++) {
    const c = ['#6b8a68', '#5b7a5a', '#4a6b52', '#41604a', '#3c5a49'][i]!;
    const w = 0.22 + r() * 0.1, h = 0.24 + r() * 0.16;
    const x = (i - 2) * 0.24 + (r() - 0.5) * 0.1, z = -i * 0.13;
    const m = put(g, new Mesh(new SphereGeometry(1, 22, 11, 0, Math.PI * 2, 0, Math.PI / 2), std(c)), x, 0, z);
    m.scale.set(w, h, w * 0.72);
    m.rotation.y = r() * 3;
    // a little tree cover on the nearer slopes, so the green has texture in it
    if (i >= 3) continue;
    for (let k = 0; k < 3; k++) {
      const a = (r() - 0.5) * 1.6;
      ball(g, new Color(c).multiplyScalar(0.82), 0.032 + r() * 0.016,
        x + Math.sin(a) * w * 0.6, h * 0.55 + r() * 0.08, z + Math.cos(a) * w * 0.4).scale.set(1, 0.85, 1);
    }
  }
};
/** A dense patch of forest. */
const forest: Figure = (g) => {
  // a stand of trees at different heights and greens rather than five copies
  // of one lollipop standing in a ring
  const r = rng(0x0f0e57);
  const ground = put(g, new Mesh(new CylinderGeometry(0.38, 0.34, 0.06, 26), std('#4a5d3a')), 0, 0.03);
  void ground;
  for (let i = 0; i < 7; i++) {
    const a = i * 1.25 + r() * 0.4, rad = 0.09 + r() * 0.2;
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad;
    const h = 0.26 + r() * 0.2;
    taper(g, '#6b4a2a', 0.022, 0.035, h, x, 0.03 + h / 2, z);
    const crown = put(g, new Mesh(new IcosahedronGeometry(0.13 + r() * 0.07, 1), std(new Color('#2f6b3f').offsetHSL(r() * 0.04 - 0.02, 0, r() * 0.12 - 0.05), { flatShading: true })), x, 0.06 + h + 0.08, z);
    crown.rotation.set(r() * 3, r() * 3, 0);
  }
};
/** A road bridge on piers over water. */
const bridge: Figure = (g) => {
  disc(g, '#3b6b8f', 0.7, 0, 0.02);
  box(g, '#c3ccd6', 1.2, 0.07, 0.24, 0, 0.44);
  for (let i = 0; i < 4; i++) {
    rod(g, '#9aa5b1', 0.05, 0.42, (i - 1.5) * 0.32, 0.22);
    // a pier cap, so the deck rests on the piers instead of hovering over them
    box(g, '#b3bcc6', 0.14, 0.04, 0.28, (i - 1.5) * 0.32, 0.41);
  }
  /**
   * Railings on both sides.
   *
   * There were posts along z = +0.1 only, so the bridge had a parapet on one
   * edge and a drop on the other - which is the kind of thing nobody notices
   * until they turn the model round, and the collection scene turns everything.
   */
  for (const z of [0.1, -0.1]) {
    for (let i = 0; i < 5; i++) box(g, '#8a94a0', 0.03, 0.2, 0.03, (i - 2) * 0.27, 0.57, z);
    box(g, '#9aa5b1', 1.14, 0.025, 0.025, 0, 0.67, z);
  }
};

/* ---------- dishes ---------- */
/** A plate with a mound and a side. */
const dish = (main: string, side: string, extra?: string): Figure => (g) => {
  // a rim and a foot on the plate, and food that sits in the well rather than
  // balancing on a flat disc
  put(g, new Mesh(new CylinderGeometry(0.22, 0.26, 0.03, 28), std('#e2e7ec')), 0, 0.015);
  put(g, new Mesh(new CylinderGeometry(0.4, 0.34, 0.06, 32), std('#f4f7fa')), 0, 0.055);
  ring(g, std('#e6ebf0'), 0.4, 0.016, 0, 0.08, 0, 34);
  const r = rng(hash(main + side));
  const m = put(g, new Mesh(new SphereGeometry(0.2, 24, 16), std(main)), -0.08, 0.13);
  m.scale.set(1, 0.55, 1);
  // loose grains and pieces, so the mound is food and not a scoop of paint
  for (let i = 0; i < 8; i++) {
    const a = r() * 6.28, rad = r() * 0.17;
    ball(g, new Color(main).offsetHSL(0, 0, r() * 0.1 - 0.04), 0.022, -0.08 + Math.cos(a) * rad, 0.2 + r() * 0.02, Math.sin(a) * rad).scale.set(1.4, 0.8, 1);
  }
  const s2 = put(g, new Mesh(new SphereGeometry(0.12, 20, 14), std(side)), 0.19, 0.11, 0.05);
  s2.scale.set(1, 0.6, 1);
  for (let i = 0; i < 3; i++) ball(g, new Color(side).multiplyScalar(0.88), 0.03, 0.19 + (r() - 0.5) * 0.12, 0.165, 0.05 + (r() - 0.5) * 0.12);
  if (extra) ball(g, extra, 0.062, 0.12, 0.13, -0.17);
};
/** A fried fish on a plate: মাছ ভাজা. */
const fishDish = (skin = '#c98a3e'): Figure => (g) => {
  /**
   * The fish itself, not a mound of colour.
   *
   * মাছ ভাজা was the generic `dish()`, which is a dome with grains scattered
   * over it: on a white plate that is mashed potato, and it was the one item
   * in the food world whose figure said nothing at all about what it was. A
   * fried fish reads from three things, and the plate is none of them: the
   * body curls as it fries, the tail fin lifts clear of the plate, and the
   * cook's scores are cut across the flank before it goes into the oil.
   */
  put(g, new Mesh(new CylinderGeometry(0.22, 0.26, 0.03, 28), std('#e2e7ec')), 0, 0.015);
  put(g, new Mesh(new CylinderGeometry(0.4, 0.34, 0.06, 32), std('#f4f7fa')), 0, 0.055);
  ring(g, std('#e6ebf0'), 0.4, 0.016, 0, 0.08, 0, 34);
  const base = new Color(skin), crust = new Color(skin).multiplyScalar(0.7);
  const A = 0.3, dir = 0.32, dx = Math.cos(dir), dz = -Math.sin(dir);
  const cx = -0.02, cy = 0.168, cz = 0.03;
  const body = put(g, new Mesh(new SphereGeometry(0.2, 24, 16), std(base)), cx, cy, cz, 0, dir, 0.1);
  body.scale.set(1.5, 0.44, 0.62);
  // the head end tapers and the belly is paler where it sat in the pan
  const head = put(g, new Mesh(new SphereGeometry(0.12, 18, 12), std(base)), cx + dx * 0.24, cy - 0.004, cz + dz * 0.24, 0, dir, 0.1);
  head.scale.set(1.05, 0.42, 0.52);
  const gill = box(g, crust, 0.022, 0.03, 0.13, cx + dx * 0.16, cy + 0.055, cz + dz * 0.16);
  gill.rotation.set(0, dir, 0);
  // the tail, lifted off the plate the way a fried fish curls
  const tail = put(g, new Mesh(new ConeGeometry(0.09, 0.17, 3), std(base.clone().multiplyScalar(0.84))), cx - dx * 0.3, cy + 0.03, cz - dz * 0.3, 0, dir, -Math.PI / 2 - 0.5);
  tail.scale.set(1, 1, 0.2);
  // three scores across the flank, each sat on the body's own curve
  for (let i = 0; i < 3; i++) {
    const t = (i - 1) * 0.115;
    const k = Math.sqrt(Math.max(0.08, 1 - (t / (A * 0.92)) ** 2));
    const sc = box(g, crust, 0.022, 0.026, 0.13 * k + 0.03, cx + dx * t, cy + 0.088 * k, cz + dz * t);
    sc.rotation.set(0, dir, 0);
  }
  ball(g, '#f6f2e8', 0.026, cx + dx * 0.27, cy + 0.06, cz + dz * 0.27).scale.set(1, 0.5, 1);
  ball(g, '#1d1710', 0.014, cx + dx * 0.272, cy + 0.078, cz + dz * 0.272).scale.set(1, 0.5, 1);
  // a wedge of lemon, a chilli and rings of onion, which is how it is served
  // the wedge is the flesh only: a separate rind shell wrapped the curved half
  // in near-white and, seen edge on, the lemon read as a slab of butter
  const lem = put(g, new Mesh(new CylinderGeometry(0.088, 0.088, 0.05, 16, 1, false, 0, Math.PI), std('#f0cd2e')), 0.19, 0.11, 0.2, 0, 1.35, 0);
  void lem;
  for (let i = 0; i < 4; i++) {
    const a = -Math.PI / 2 + 0.3 + (i / 3) * (Math.PI - 0.6);
    box(g, '#f9ecac', 0.055, 0.052, 0.01, 0.19 + Math.cos(a + 1.35) * 0.04, 0.112, 0.2 - Math.sin(a + 1.35) * 0.04).rotation.set(0, -(a + 1.35), 0);
  }
  const ch = put(g, new Mesh(new ConeGeometry(0.023, 0.17, 10), std('#4f8f3f')), -0.14, 0.104, 0.23, 0, 0, Math.PI / 2 + 0.35);
  ch.scale.set(1, 1, 0.9);
  ball(g, '#3f7a32', 0.016, -0.215, 0.112, 0.225);
  for (let i = 0; i < 2; i++) ring(g, std('#efe9f2'), 0.052 + i * 0.014, 0.011, 0.14 - i * 0.05, 0.097, -0.24 - i * 0.03, 18);
};
/** A bowl of something thick. */
const bowlDish = (color: string): Figure => (g) => {
  // a foot, a rim and a spoon: a bowl of dal is not a cylinder with a dome
  put(g, new Mesh(new CylinderGeometry(0.13, 0.15, 0.035, 24), std('#dde3ea')), 0, 0.018);
  put(g, new Mesh(new CylinderGeometry(0.3, 0.2, 0.22, 28), std('#eef2f6')), 0, 0.14);
  ring(g, std('#e0e6ec'), 0.3, 0.014, 0, 0.25, 0, 30);
  const h = put(g, new Mesh(new SphereGeometry(0.27, 24, 16), std(color)), 0, 0.26);
  h.scale.set(1, 0.4, 1);
  disc(g, new Color(color).lerp(new Color('#ffffff'), 0.18), 0.275, 0, 0.268);
  // steam, because a bowl of something thick is served hot
  const r = rng(hash(color));
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 0.08;
    for (let k = 0; k < 3; k++) ball(g, '#ffffff', 0.018 - k * 0.003, x + Math.sin(k * 1.6 + i) * 0.03, 0.33 + k * 0.07, r() * 0.04 - 0.02).scale.setScalar(1);
  }
};
/** A stack of flat cakes. */
const pitha: Figure = (g) => {
  /**
   * Rice cakes on a plate, stacked askew.
   *
   * They were three tiers of *decreasing* radius with scalloped edges and a
   * golden ball on top, which is the shape of a wedding cake and read as one.
   * Pitha are flat and all much of a size; what makes a stack of them read is
   * that no two sit square with each other, and that the top one shows the
   * pattern pressed into its face by the mould.
   */
  const r = rng(0x9174a);
  put(g, new Mesh(new CylinderGeometry(0.34, 0.3, 0.035, 30), std('#f4f7fa')), 0, 0.018);
  ring(g, std('#e6ebf0'), 0.34, 0.014, 0, 0.032, 0, 32);
  for (let i = 0; i < 3; i++) {
    const a = r() * 6.28, off = 0.035 + i * 0.014;
    const cx = Math.cos(a) * off, cz = Math.sin(a) * off, y = 0.068 + i * 0.062;
    const c = put(g, new Mesh(new CylinderGeometry(0.2, 0.205, 0.058, 26), std(i % 2 ? '#f0e2c8' : '#e8d6b4')), cx, y, cz);
    c.rotation.y = r() * 3;
    // the browned rim a hot pan leaves round the edge
    ring(g, std(i % 2 ? '#dcc9a4' : '#d3bd92'), 0.2, 0.013, cx, y, cz, 26);
    if (i !== 2) continue;
    for (let k = 0; k < 8; k++) {
      const ka = (k / 8) * Math.PI * 2;
      box(g, '#e0cda6', 0.08, 0.009, 0.024, cx + Math.cos(ka) * 0.105, y + 0.031, cz + Math.sin(ka) * 0.105)
        .rotation.set(0, -ka, 0);
    }
    ball(g, '#d8c39a', 0.032, cx, y + 0.032, cz).scale.set(1, 0.45, 1);
  }
  // a spoon of date molasses beside them, which is how they are eaten
  ball(g, '#6b4a2a', 0.052, 0.2, 0.057, 0.17).scale.set(1.2, 0.35, 1.1);
};
/** A round sweet in syrup. */
const sweet: Figure = (g) => {
  // syrup with a surface, and sweets that sit *in* it rather than on a lid
  put(g, new Mesh(new CylinderGeometry(0.3, 0.26, 0.1, 28), std('#e8eef5')), 0, 0.05);
  ring(g, std('#dde4ec'), 0.3, 0.014, 0, 0.1, 0, 30);
  const syrup = put(g, new Mesh(new CylinderGeometry(0.285, 0.25, 0.07, 28), std('#b5762f', { transparent: true, opacity: 0.72, roughness: 0.18 })), 0, 0.055);
  void syrup;
  const r = rng(0x57ee7);
  for (let i = 0; i < 4; i++) {
    const a = i * 1.7 + r();
    const rad = 0.05 + r() * 0.07;
    const b = ball(g, '#b5762f', 0.1 + r() * 0.02, Math.cos(a) * rad, 0.12, Math.sin(a) * rad);
    b.scale.set(1, 0.92, 1);
    // the highlight that makes a rosogolla look wet
    ball(g, '#e0a862', 0.03, Math.cos(a) * rad - 0.04, 0.19, Math.sin(a) * rad + 0.03).scale.set(1, 0.6, 1);
  }
};

/* ---------- geology ---------- */
/** A rough rock. */
const rock = (color = '#7d848c'): Figure => (g) => {
  // A rock is a lump with chips around it, not one platonic solid sitting on
  // its point. The main mass is squashed so it beds into the ground, and the
  // underside is darker because that is the face that never sees the sky.
  const r = rng(hash(color));
  const base = new Color(color);
  const main = put(g, new Mesh(new IcosahedronGeometry(0.3, 0), std(base, { flatShading: true })), 0, 0.22);
  main.rotation.set(0.5, 0.8, 0.2); main.scale.set(1.1, 0.82, 1);
  const under = put(g, new Mesh(new IcosahedronGeometry(0.26, 0), std(base.clone().multiplyScalar(0.72), { flatShading: true })), 0, 0.1);
  under.rotation.set(1.1, 0.3, 0.6); under.scale.set(1.15, 0.5, 1.05);
  for (let i = 0; i < 3; i++) {
    const a = i * 2.2 + r();
    const chip = put(g, new Mesh(new IcosahedronGeometry(0.06 + r() * 0.05, 0), std(base.clone().offsetHSL(0, 0, r() * 0.12 - 0.06), { flatShading: true })),
      Math.cos(a) * (0.26 + r() * 0.08), 0.04 + r() * 0.03, Math.sin(a) * (0.26 + r() * 0.08));
    chip.rotation.set(r() * 3, r() * 3, r() * 3);
  }
};
/** A shell pressed into stone. */
const fossil: Figure = (root) => {
  // stood up like a specimen on a museum shelf, which is the only way the
  // spiral on its face is ever seen
  const g = upright(root, 1.24, 0.42);
  const r = rng(0xf055);
  // a broken slab, not a turned disc: 14 sides at this size reads as a coin
  const slab = put(g, new Mesh(new CylinderGeometry(0.34, 0.32, 0.12, 9), std('#a89a86', { flatShading: true, roughness: 0.95 })), 0, 0.06);
  slab.rotation.y = 0.3;
  put(g, new Mesh(new CylinderGeometry(0.345, 0.345, 0.02, 9), std('#8d8073', { flatShading: true })), 0, 0.115, 0, 0, 0.3, 0);
  /**
   * A real logarithmic spiral for the shell, rather than concentric arcs.
   *
   * Five rings of growing radius all centred on the same point are a target,
   * not an ammonite. A spiral has one continuous curve whose radius grows as
   * it turns, so the whorls sit inside one another and the chambers get wider
   * toward the opening.
   */
  const N = 34;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const a = t * Math.PI * 4.2;
    const rad = 0.022 + Math.pow(t, 1.35) * 0.2;
    const seg = put(g, new Mesh(new SphereGeometry(0.012 + t * 0.022, 10, 8), std('#6b6257')),
      Math.cos(a) * rad, 0.125, Math.sin(a) * rad);
    seg.scale.set(1, 0.6, 1);
  }
  // the ribs across the whorl, which is what says shell rather than snail trail
  for (let i = 0; i < 9; i++) {
    const a = 1.2 + (i / 8) * Math.PI * 1.8;
    const rad = 0.05 + (i / 8) * 0.16;
    const rib = put(g, new Mesh(new BoxGeometry(0.05 + (i / 8) * 0.05, 0.012, 0.012), std('#57503f')),
      Math.cos(a) * rad, 0.132, Math.sin(a) * rad, 0, -a, 0);
    void rib;
  }
  for (let i = 0; i < 4; i++) {
    const a = r() * 6.28;
    ball(g, '#9c907f', 0.02 + r() * 0.015, Math.cos(a) * 0.26, 0.125, Math.sin(a) * 0.26).scale.set(1, 0.5, 1);
  }
};
/** A long-necked dinosaur. */
const dino: Figure = (g) => {
  /**
   * A sauropod: a barrel slung between four columns, a neck up one end and a
   * longer tail off the other.
   *
   * It was a round green body with one thick rod for a neck and a plain ball
   * stuck on the end of it, three stubby cones behind for a tail, and a row of
   * triangular plates along the whole back. None of that is this animal. The
   * plates are a stegosaurus; the rod and ball is a lollipop; and the tail was
   * shorter than the animal's own leg, so the silhouette read as a hedgehog.
   * Neck and tail are tapering chains walking along a curve now, which is the
   * only thing that reads as *long* at this size, and the tail is the longest
   * part of the animal because on a sauropod it is.
   */
  const skin = '#5f7a4a', dark = '#4f6a3a';
  /** A tapering chain of segments walking from (x, y) along a turning curve. */
  const chain = (n: number, x: number, y: number, a0: number, a1: number, len: number, r0: number, r1: number) => {
    let px = x, py = y;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const a = a0 + (a1 - a0) * t, rad = r0 + (r1 - r0) * t;
      px += Math.cos(a) * len / 2; py += Math.sin(a) * len / 2;
      // a cylinder points along +Y, so an axis at angle a needs a - 90 degrees
      taper(g, skin, rad * 0.88, rad, len + 0.014, px, py, 0, a - Math.PI / 2);
      px += Math.cos(a) * len / 2; py += Math.sin(a) * len / 2;
    }
    return [px, py] as const;
  };

  const b = put(g, new Mesh(new SphereGeometry(0.22, 26, 18), std(skin)), 0, 0.44);
  b.scale.set(1.45, 0.95, 1);
  // hips and shoulders, so the barrel is not one smooth egg
  ball(g, skin, 0.175, -0.19, 0.45).scale.set(1, 1, 0.95);
  ball(g, skin, 0.15, 0.21, 0.46).scale.set(1, 0.95, 0.92);

  const [hx, hy] = chain(6, 0.25, 0.56, 1.24, 0.94, 0.095, 0.056, 0.032);
  const head = put(g, new Mesh(new SphereGeometry(0.055, 18, 14), std(skin)), hx + 0.015, hy + 0.015);
  head.scale.set(1.45, 1, 0.92);
  const snout = put(g, new Mesh(new SphereGeometry(0.036, 16, 12), std(skin)), hx + 0.085, hy - 0.002);
  snout.scale.set(1.2, 0.78, 0.85);
  // a jaw slung under the snout, whose seam is the mouth line
  const jaw = put(g, new Mesh(new SphereGeometry(0.03, 14, 10), std(dark)), hx + 0.085, hy - 0.022);
  jaw.scale.set(1.25, 0.55, 0.8);
  for (const s of [1, -1]) {
    // flat discs on the side of the head. A small sphere set against a larger
    // one is swallowed by it: the head is only 0.05 deep, so an eyeball at
    // that scale sits entirely inside the skull and the animal reads blind.
    const ex = hx + 0.035, ey = hy + 0.032, ez = s * 0.055;
    const ry = s > 0 ? 0.35 : Math.PI - 0.35;
    disc(g, '#f2efe4', 0.019, ex, ey, ez, 0).rotation.y = ry;
    disc(g, '#15120c', 0.0095, ex + 0.004, ey, ez + s * 0.004, 0).rotation.y = ry;
  }

  // the tail sweeps back and up, clear of the ground rather than dragging
  chain(6, -0.26, 0.47, Math.PI + 0.12, Math.PI - 0.45, 0.095, 0.058, 0.013);

  // four columns, the back pair heavier, each on a broad foot
  for (const [dx, dz, rTop, rBot, h] of [
    [0.19, 0.13, 0.042, 0.055, 0.3], [0.19, -0.13, 0.042, 0.055, 0.3],
    [-0.17, 0.145, 0.05, 0.066, 0.32], [-0.17, -0.145, 0.05, 0.066, 0.32],
  ] as const) {
    taper(g, dark, rTop, rBot, h, dx, h / 2, dz);
    const f = ball(g, '#435c32', rBot * 1.15, dx, 0.032, dz + 0.012);
    f.scale.set(1.15, 0.5, 1.25);
  }
  // a low ridge along the spine. A sauropod has one; a row of plates is a
  // different animal entirely.
  for (let i = 0; i < 7; i++) {
    const rx = 0.2 - i * 0.075;
    const k = put(g, new Mesh(new SphereGeometry(0.026, 10, 8), std(dark)), rx, 0.645 - Math.abs(rx) * 0.16, 0);
    k.scale.set(1.1, 0.8, 0.5);
  }
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
    put(g, new Mesh(new CylinderGeometry(0.34, 0.34, 0.12, 26), std(cols[i]!)), 0, 0.06 + i * 0.12);
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
    const p = put(g, new Mesh(new SphereGeometry(0.14, 20, 14), std('#4f8f4a')), Math.cos(a) * 0.24, 0.36 + Math.sin(a) * 0.16, 0.2);
    p.scale.set(1, 0.7, 0.4);
  }
};

/* ---------- safety and everyday ---------- */
/** An open palm: touch, and saying no. */
const palmHand = (color = '#e8b98e'): Figure => (g) => {
  const p = put(g, new Mesh(new SphereGeometry(0.2, 24, 16), std(color)), 0, 0.34);
  p.scale.set(1, 1.15, 0.45);
  for (let i = 0; i < 4; i++) put(g, new Mesh(new CylinderGeometry(0.035, 0.035, 0.2, 14), std(color)), (i - 1.5) * 0.09, 0.58, 0);
  put(g, new Mesh(new CylinderGeometry(0.038, 0.038, 0.16, 14), std(color)), -0.2, 0.36, 0, 0, 0, 0.9);
};
/** A red octagon on a post. */
const stopSign: Figure = (g) => {
  rod(g, '#8a94a0', 0.03, 0.5, 0, 0.25);
  const s = put(g, new Mesh(new CylinderGeometry(0.26, 0.26, 0.05, 14), std('#c0392b')), 0, 0.62, 0, Math.PI / 2);
  s.rotation.z = Math.PI / 8;
  box(g, '#f8fbff', 0.26, 0.05, 0.02, 0, 0.62, 0.04);
};
/** Black and white bars: the crossing. */
const crossing: Figure = (root) => {
  // the road tipped up so the stripes face the viewer, and a signal standing
  // beside it: 'রাস্তা পার' is about the signal as much as the paint
  const g = upright(root, 0.95, 0.3);
  box(g, '#33383f', 0.9, 0.04, 0.62, 0, 0.02);
  for (let i = 0; i < 4; i++) box(g, '#f4f7fa', 0.12, 0.05, 0.56, (i - 1.5) * 0.2, 0.04);
  // the kerbs, which are what make a dark slab read as a road
  for (const s of [1, -1]) box(g, '#9aa5b1', 0.94, 0.07, 0.05, 0, 0.035, s * 0.33);
  rod(root, '#b9c3ce', 0.02, 0.5, -0.42, 0.25, 0.12);
  put(root, new Mesh(roundedCard(0.14, 0.3, 0.05, 0.03), std('#2b333d')), -0.42, 0.62, 0.13);
  for (let i = 0; i < 2; i++) ball(root, i ? '#4f9e4a' : '#c0392b', 0.035, -0.42, 0.71 - i * 0.1, 0.16).scale.set(1, 1, 0.5);
};
/** A flame. */
const flame: Figure = (g) => {
  /**
   * A teardrop that leans, not a cone.
   *
   * Three nested cones with straight sides and a sharp point is a traffic
   * cone, and that is what it read as. A flame is round and heavy at the base,
   * narrows as it rises and tips over at the top, and it has a paler core
   * inside a darker envelope.
   */
  const coat = (c: string, w: number, h: number, lean: number, x = 0) => {
    // one turned profile, not a column of balls: stacked spheres leave a
    // visible bump at every joint, which is a pine cone or a soft ice cream
    const pts: Vector2[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const rad = w * Math.sin(Math.PI * Math.pow(t, 0.5)) * (1 - t * 0.12);
      pts.push(new Vector2(Math.max(0.0015, rad), t * h));
    }
    // the base is a point, so a tilt about it swings the tip and leaves the
    // flame standing where it stood
    const m = put(g, new Mesh(new LatheGeometry(pts, 22), std(c, { emissive: c, emissiveIntensity: 0.42 })), x, 0.005, 0, 0, 0, lean);
    m.scale.set(1, 1, 0.95);
  };
  /**
   * Three tongues side by side, not three shells one inside another.
   *
   * Nesting a yellow core inside an orange envelope is how a flame is drawn on
   * paper and useless in three dimensions: the envelope is opaque, so the core
   * is never seen from any angle and the figure is a plain orange blob. Real
   * tongues of flame lean different ways and each one shows.
   */
  coat('#e8622b', 0.16, 0.56, -0.06);
  coat('#f0a52b', 0.08, 0.36, 0.45, 0.13);
  coat('#f7d84a', 0.062, 0.27, -0.5, -0.12);
};
/** A medicine bottle with a cap. */
const medicine: Figure = (g) => {
  put(g, new Mesh(new CylinderGeometry(0.17, 0.17, 0.4, 24), std('#c9603f', { transparent: true, opacity: 0.9 })), 0, 0.22);
  put(g, new Mesh(new CylinderGeometry(0.12, 0.12, 0.1, 20), std('#e8eef5')), 0, 0.46);
  box(g, '#f8fbff', 0.2, 0.14, 0.02, 0, 0.24, 0.17);
};
/** Waves with a warning buoy. */
const water: Figure = (g) => {
  /**
   * 'পানিতে সাবধানতা': a warning post at the water's edge.
   *
   * The whole figure was a flat disc of water with a ball floating on it, and
   * the shelf looks at a figure dead level, so what a child saw was a line
   * with an orange dot on it. The post is what gives the figure height, and it
   * is also what the item is actually about: the water is the hazard, the sign
   * is the lesson.
   */
  disc(g, '#3b7a9e', 0.6, 0, 0.02);
  for (let i = 0; i < 3; i++) ring(g, std('#7fc2e0'), 0.16 + i * 0.13, 0.018, 0, 0.055, 0.05, 28);
  ball(g, '#e8622b', 0.07, 0.24, 0.07, 0.16).scale.set(1, 0.8, 1);
  rod(g, '#c9d2da', 0.024, 0.66, -0.3, 0.33, 0.2);
  const sign = put(g, new Mesh(roundedCard(0.32, 0.3, 0.04, 0.04), std('#e8c33d')), -0.3, 0.72, 0.215);
  void sign;
  box(g, '#2b2418', 0.05, 0.13, 0.05, -0.3, 0.755, 0.24);
  ball(g, '#2b2418', 0.03, -0.3, 0.655, 0.24).scale.set(1, 1, 0.6);
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
  put(g, new Mesh(new TorusGeometry(0.06, 0.014, 10, 22, Math.PI), std('#9aa5b1')), 0, 0.6, 0);
};
/** A bus, for the words about vehicles. */
const bus = (color = '#c8a24a'): Figure => (g) => {
  box(g, color, 0.8, 0.34, 0.34, 0, 0.3);
  box(g, '#9fd8ff', 0.6, 0.14, 0.36, 0.02, 0.38);
  for (const dx of [-0.25, 0.25]) put(g, new Mesh(new CylinderGeometry(0.11, 0.11, 0.36, 20), std('#2b2b2e')), dx, 0.11, 0, Math.PI / 2);
};
/** A pair of figures side by side: family, and words about people. */
const family: Figure = (g) => {
  const one = (x: number, h: number, coat: string) => {
    ball(g, '#e8b98e', 0.11 * h, x, 0.56 * h);
    put(g, new Mesh(new CylinderGeometry(0.13 * h, 0.17 * h, 0.36 * h, 20), std(coat)), x, 0.3 * h);
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
  put(g, new Mesh(new ConeGeometry(0.36, 0.44, 22, 1, true), std('#7a5a45', { side: DoubleSide })), 0, 0.22);
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
  /**
   * The strip standing in the glass it is dipped in.
   *
   * On its own the paper is a 0.02 slab, and the shelf turns everything it
   * holds: twice a revolution it went edge on and the figure all but vanished.
   * The experiment is the paper *in the water* anyway, and the glass gives the
   * figure the body it needs to survive being turned.
   */
  const gm = () => new MeshStandardMaterial({ color: '#dce8f5', transparent: true, opacity: 0.26, side: DoubleSide, roughness: 0.1, depthWrite: false });
  put(g, new Mesh(new CylinderGeometry(0.2, 0.17, 0.3, 26, 1, true), gm()), 0, 0.16);
  put(g, new Mesh(new CylinderGeometry(0.172, 0.172, 0.03, 26), gm()), 0, 0.02);
  ring(g, gm(), 0.2, 0.011, 0, 0.31, 0, 26);
  put(g, new Mesh(new CylinderGeometry(0.185, 0.165, 0.12, 26), std('#9fcbe8', { transparent: true, opacity: 0.75, roughness: 0.18 })), 0, 0.08);
  disc(g, '#b4dbf0', 0.183, 0, 0.141);
  const strip = box(g, '#f8fbff', 0.17, 0.62, 0.035, 0.01, 0.4, 0.02);
  strip.rotation.z = 0.07;
  const cols = ['#3d6b8f', '#2f8f5b', '#f7d84a', '#f0a52b', '#c0392b'];
  // the colours climb the strip, wettest and reddest at the bottom
  for (let i = 0; i < cols.length; i++) {
    const b = box(g, cols[i]!, 0.175, 0.075, 0.045, 0.01, 0.16 + i * 0.085, 0.02);
    b.rotation.z = 0.07;
  }
};
/** A glass of separated layers. */
const layers: Figure = (g) => {
  put(g, new Mesh(new CylinderGeometry(0.19, 0.16, 0.48, 26, 1, true), new MeshStandardMaterial({ color: '#dce8f5', transparent: true, opacity: 0.32, side: DoubleSide })), 0, 0.26);
  const cols = ['#b5762f', '#3d6b8f', '#e8c86a'];
  for (let i = 0; i < 3; i++) put(g, new Mesh(new CylinderGeometry(0.17, 0.16, 0.14, 26), std(cols[i]!, { transparent: true, opacity: 0.9 })), 0, 0.1 + i * 0.14);
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
  put(g, new Mesh(new CylinderGeometry(0.21, 0.18, 0.5, 26, 1, true), new MeshStandardMaterial({ color: '#dce8f5', transparent: true, opacity: 0.32, side: DoubleSide })), 0, 0.27);
  put(g, new Mesh(new CylinderGeometry(0.19, 0.18, 0.3, 26), std('#9fd0ea', { transparent: true, opacity: 0.6 })), 0, 0.18);
  const e = ball(g, '#f6efe2', 0.11, 0, 0.34);
  e.scale.set(1, 1.25, 1);
};
/** A gnomon casting a shadow on a dial. */
const sundial: Figure = (g) => {
  put(g, new Mesh(new CylinderGeometry(0.36, 0.36, 0.06, 28), std('#d9cdb4')), 0, 0.03);
  const gn = put(g, new Mesh(new ConeGeometry(0.06, 0.4, 3), std('#8a6a44')), 0, 0.24, 0, 0, 0, 0.35);
  void gn;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    box(g, '#8a7a5a', 0.02, 0.01, 0.08, Math.cos(a) * 0.27, 0.07, Math.sin(a) * 0.27, a);
  }
};
/** A bar magnet with iron filings. */
const magnet: Figure = (g) => {
  /**
   * A horseshoe, which is the one shape nobody has to be told is a magnet.
   *
   * It was two upright blocks side by side on a grey slab, and it read as two
   * bricks: nothing joined the poles, so there was no magnet, just a red brick
   * next to a blue one. The arch is the whole idea. Here the torus genuinely
   * does belong upright, standing in the same plane as the legs.
   */
  const RED = '#c0392b', BLUE = '#3d6b8f', TIP = '#b9c3ce';
  const AR = 0.23, TUBE = 0.075, ARCH = 0.46, FOOT = 0.1;
  for (const [s, c] of [[-1, RED], [1, BLUE]] as const) {
    // half the arch each, so the two poles are two colours all the way round
    const half = put(g, new Mesh(new TorusGeometry(AR, TUBE, 12, 20, Math.PI / 2), std(c)), 0, ARCH, 0);
    half.rotation.z = s < 0 ? Math.PI / 2 : 0;
    rod(g, c, TUBE, ARCH - FOOT, s * AR, FOOT + (ARCH - FOOT) / 2, 0);
    put(g, new Mesh(new CylinderGeometry(TUBE, TUBE, FOOT, 18), std(TIP, { metalness: 0.5, roughness: 0.35 })), s * AR, FOOT / 2, 0);
  }
  // the field looping from one pole to the other, drawn low between the tips
  for (let i = 0; i < 3; i++) {
    const f = put(g, new Mesh(new TorusGeometry(AR * (0.5 + i * 0.26), 0.008, 6, 20, Math.PI), std('#8a94a0', { transparent: true, opacity: 0.5 })), 0, FOOT * 0.5, 0);
    f.rotation.z = Math.PI;
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
  riceDal: dish('#fbfbf6', '#e8c05a'), friedFish: fishDish(),
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
  tiger: quadruped('#e08a2b', { stripe: '#2a2118', tail: 0.34, ear: 'round' }),
  elephant: quadruped('#9aa0a8', { big: true, trunk: true, tail: 0.2, ear: 'flap' }),
  leopardCat: quadruped('#d8b070', { spot: '#5b4630', tail: 0.32, ear: 'round' }),
  hilsa: fish('#c9d3dc', '#9fb0c0'), fishSmall: fish('#8fae5a'), doel: bird('#1d232b', '#f4f8fc'),
  kingfisher: bird('#2f6b9e', '#e8a33d'), vulture,
  dolphin, croc, turtle, bee, monkey,
  flyingBird: flyingBird(), coral: coral(),
  // food and kitchen
  riceBowl, pot: pot(), glassWater: glass(), oilDrop: drop('#e8c86a'), waterDrop: drop('#79b6e8'),
  salt: crystal('#f4f8fc'), sugarFruit: fruit('#f0b429'), mangoFruit: fruit('#f5a623'),
  greenFruit: fruit('#5f9e4a'), redFruit: fruit('#c0392b'),
  turmeric: bowl('#e8a33d'), chilliPowder: bowl('#c0392b'), cumin: seeds('#8a6a44'),
  coriander: seeds('#c9b98f'), mustard: seeds('#d9b44a'), fenugreek: seeds('#c8a24a'),
  cinnamon: quills('#8a5a33'), bayLeaf: leaves('#4b7a3a'),
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
/**
 * How many stand shoulder to shoulder before a new row starts behind them.
 *
 * Four, not five. The camera now stands at the front of the crowd rather than
 * far enough back to hold all of it, so a wide row puts its ends outside the
 * picture; a narrower, deeper arrangement keeps the front row whole and turns
 * the rest into depth, which is the thing worth having.
 *
 * Three on a phone. A portrait frame is about a third as wide for its height,
 * and a row that reads comfortably on a laptop has both its ends outside a
 * phone's frame - which is not only an ugly picture but an unwinnable round of
 * খোঁজার খেলা, since the badge it asks you to find is off the screen. The
 * crowd goes deeper instead of wider, which a narrow frame has room for.
 */
export const arcPerRow = (n: number, narrow = false): number =>
  (narrow ? (n <= 3 ? n : 3) : n <= 4 ? n : n <= 9 ? Math.ceil(n / 2) : 4);

export function arc(n: number, i: number, narrow = false): Vector3 {
  const perRow = arcPerRow(n, narrow);
  const rows = Math.ceil(n / perRow);
  const row = Math.floor(i / perRow);
  const inRow = Math.min(perRow, n - row * perRow);
  const k = i - row * perRow;
  /**
   * Capped, because খোঁজার খেলা has to be winnable.
   *
   * The crowd is now allowed to run off the sides of the frame, which is right
   * for the picture and wrong for the game: the find-it round names an item and
   * waits for its badge to be clicked, and a badge outside the frame cannot be.
   * Five to a row at full spacing put the end of a nine-item row just past the
   * edge. 3.6 keeps the widest row inside the shot even when the cast fans out
   * to make room for the chosen one.
   */
  const spanX = Math.min(3.6, Math.max(2.2, (perRow - 1) * 1.16));
  // Half-step stagger on alternate rows: the single change that turns a grid
  // into something that looks grown rather than planted by a machine.
  const offset = row % 2 ? spanX / (perRow - 1 || 1) * 0.5 : 0;
  const x = inRow === 1 && rows === 1 ? 0 : (k / Math.max(1, perRow - 1) - 0.5) * spanX + offset;
  // 1.95 rather than 1.55: with the camera close, the gap between rows is what
  // separates the subject from the crowd, and it has to be felt.
  const z = -row * 1.95;
  const y = -0.55 + row * 0.05;
  // A gentle bow, so the ends of a row turn toward the camera instead of
  // trailing off sideways.
  return new Vector3(x, y, z + Math.abs(x) * 0.22);
}

export { std as figMaterial };
export type { Object3D };
