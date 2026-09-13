/**
 * Procedural 3D heroes for every category. One renderer, ~30 small scene builders,
 * all built from Three.js primitives - no models, no textures shipped.
 * Each scene reads a 0–1 `param` from the page slider so every hero is something to play with.
 */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, Object3D, Color, Vector3, MathUtils, Raycaster, Vector2,
  SphereGeometry, BoxGeometry, CylinderGeometry, TorusGeometry, ConeGeometry, PlaneGeometry, CircleGeometry,
  IcosahedronGeometry, OctahedronGeometry, TetrahedronGeometry, DodecahedronGeometry, TubeGeometry, ExtrudeGeometry,
  Shape, CatmullRomCurve3, BufferGeometry, Float32BufferAttribute, Points, PointsMaterial, Line, LineBasicMaterial, Box3, Sphere,
  MeshStandardMaterial, MeshBasicMaterial, PointLight, CanvasTexture, Sprite, SpriteMaterial,
  DoubleSide, BackSide, InstancedMesh, Matrix4,
} from 'three';
import { FIGURES, arc } from './figures';
import { dressScene, castShadows } from './render';

export type HeroSpec = { type: string; hue: string; v?: string; p?: number;
  /** For the `collection` scene: item label -> figure name, in order. */
  figures?: { label: string; figure: string }[] };
/** One thing in the category, shown as a badge orbiting the category's model. */
export type HeroItem = { label: string; emoji?: string };
type Ctx = { root: Group; hue: Color; v: string; font: string; figures: { label: string; figure: string }[] };
/**
 * A scene may expose `anchors`: a marker object per item label, attached to the
 * part of the model that item is about. Badges then sit on the model instead of
 * orbiting it, and follow the part when the scene explodes.
 */
/**
 * `groundY` says this scene stands on something, and at what height, so the
 * shared shadow-catching ground can be moved under it. A scene that leaves it
 * out is one that floats - an atom, an orbit, a water cycle - and gets no
 * ground at all, because a disc under a floating molecule is worse than none.
 */
type SceneObj = {
  update(t: number, dt: number, p: number): void;
  label: string;
  anchors?: Record<string, Object3D>;
  groundY?: number;
  /**
   * Where the camera should look, and from what height. Most scenes are one
   * object centred on the origin and the default is right for them. A scene
   * that spreads backwards, like a grove of fourteen trees, has its centre of
   * interest somewhere else, and aiming at the origin regardless leaves the
   * subject stranded in a corner with the frame full of empty ground.
   */
  aim?: { y?: number; z?: number; eye?: number; dolly?: number };
};
type Builder = (c: Ctx) => SceneObj;

/* ---------- helpers ---------- */
const WHITE = new Color('#ffffff'), BLACK = new Color('#000000'), GOLD = new Color('#f0b429');
const lighten = (c: Color, k: number) => c.clone().lerp(WHITE, k);
const darken = (c: Color, k: number) => c.clone().lerp(BLACK, k);
/**
 * The default surface. Roughness 0.78 and no metalness, matching figures.ts.
 *
 * This used to be 0.55/0.05, which was invisible while there was no environment
 * map: a faint specular sheen with nothing to reflect is just a slightly
 * lighter colour. The moment render.ts gave every material a sky to reflect,
 * that sheen turned into a hard plastic highlight, and thirty scenes started
 * looking like toys mis-moulded from the same shiny polymer - a wooden plank, a
 * cloth shirt and a clay pot all catching the same glint.
 */
const std = (color: Color | string, o: Record<string, unknown> = {}) => new MeshStandardMaterial({ color: color as Color, roughness: 0.78, metalness: 0, ...o });
/** Things that genuinely are metal now have to say so, which is the point. */
const metal = (color: Color | string, o: Record<string, unknown> = {}) => new MeshStandardMaterial({ color: color as Color, roughness: 0.28, metalness: 0.85, ...o });
/**
 * Glass: smooth enough to catch the sky, thin enough to see the contents.
 *
 * The first cut used opacity 0.28 and envMapIntensity 1.8, which looked right
 * on a single pane and turned a jar into a frosted white tube: a vessel is
 * several double-sided layers deep, so front wall, back wall, base and rim all
 * composite together and a bright sky reflection lands on every one of them.
 * What is inside has to stay the point of a jar.
 */
const glassy = (color: Color | string = '#d8ecf6', opacity = 0.16) => new MeshStandardMaterial({ color: color as Color, roughness: 0.06, metalness: 0.1, transparent: true, opacity, side: DoubleSide, depthWrite: false, envMapIntensity: 1.1 });
const glow = (color: Color | string, opacity = 0.35) => new MeshBasicMaterial({ color: color as Color, transparent: true, opacity, depthWrite: false });
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
/**
 * A seeded random, for scenes that were using Math.random() at build time.
 * A tree that grew a different shape on every reload is not a tree the child
 * can come back to, and it made every screenshot un-reproducible.
 */
function srand(seed: number) {
  let s = seed >>> 0 || 1;
  return (a = 0, b = 1) => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return a + ((s >>> 0) / 4294967296) * (b - a); };
}
/**
 * A box with its edges taken off.
 *
 * Nothing in the real world has a geometrically perfect edge, and a raw
 * BoxGeometry reads as a debug cube for exactly that reason: the edge is a
 * single hard line with no highlight running along it. A 2-segment bevel costs
 * almost nothing and gives every edge a catch-light, which is most of the
 * difference between "programmer art" and "stylised on purpose". Geometries are
 * cached because the block and bar scenes build dozens at the same size.
 */
const boxCache = new Map<string, ExtrudeGeometry>();
function roundedBox(w: number, h: number, d: number, r = 0.05): ExtrudeGeometry {
  const key = `${w}|${h}|${d}|${r}`;
  const hit = boxCache.get(key);
  if (hit) return hit;
  // Quarter, not half: the shape is inset by `b` and then given corners of
  // radius `b`, so at w/2 the corner radius exceeds the half-width left over
  // and the curves cross into a folded, degenerate outline. A clock tick at
  // 0.1 x 0.06 hits this immediately.
  const b = Math.max(0.004, Math.min(r, w / 4, h / 4, d / 2 - 1e-3));
  const W = w / 2 - b, H = h / 2 - b;
  const s = new Shape();
  s.moveTo(-W + b, -H);
  s.lineTo(W - b, -H); s.quadraticCurveTo(W, -H, W, -H + b);
  s.lineTo(W, H - b); s.quadraticCurveTo(W, H, W - b, H);
  s.lineTo(-W + b, H); s.quadraticCurveTo(-W, H, -W, H - b);
  s.lineTo(-W, -H + b); s.quadraticCurveTo(-W, -H, -W + b, -H);
  const g = new ExtrudeGeometry(s, { depth: d - b * 2, bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelSegments: 2, curveSegments: 2 });
  g.translate(0, 0, -(d - b * 2) / 2);
  g.computeVertexNormals();
  // Shared between scenes, so the teardown in `build()` must leave it alone:
  // disposing it when one category unmounts would pull the buffers out from
  // under the next category that asks for the same size.
  g.userData.shared = true;
  boxCache.set(key, g);
  return g;
}
/** A bevelled box as a mesh, positioned. The workhorse of the box-heavy scenes. */
const rbox = (c: Color | string, w: number, h: number, d: number, r = 0.05, o: Record<string, unknown> = {}) => new Mesh(roundedBox(w, h, d, r), std(c, o));
const hash = (x: number, y: number) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
function noise2(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm2 = (x: number, y: number) => { let f = 0, a = 0.5; for (let i = 0; i < 4; i++) { f += a * noise2(x, y); x *= 2.1; y *= 2.1; a *= 0.5; } return f; };
function textSprite(text: string, font: string, color: string, size = 1): Sprite {
  const c = document.createElement('canvas'); c.width = c.height = 192; const g = c.getContext('2d')!;
  g.font = `700 ${text.length > 2 ? 64 : 120}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = color; g.fillText(text, 96, 104);
  const tex = new CanvasTexture(c); const s = new Sprite(new SpriteMaterial({ map: tex, transparent: true })); s.scale.setScalar(size); return s;
}
const emojiSprite = (e: string, size = 0.8) => textSprite(e, 'system-ui', '#000', size);
/** A round badge carrying an emoji, or the first letter of the label when there is none. */
function badgeSprite(item: HeroItem, hue: Color, font: string): Sprite {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d')!;
  const cx = 128, r = 112;
  g.beginPath(); g.arc(cx, cx, r, 0, Math.PI * 2);
  const grad = g.createRadialGradient(cx - 30, cx - 36, 10, cx, cx, r);
  grad.addColorStop(0, '#' + lighten(hue, 0.55).getHexString()); grad.addColorStop(1, '#' + hue.getHexString());
  g.fillStyle = grad; g.fill();
  g.lineWidth = 8; g.strokeStyle = 'rgba(255,255,255,0.85)'; g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  if (item.emoji) { g.font = '120px system-ui, "Apple Color Emoji", "Segoe UI Emoji"'; g.fillStyle = '#000'; g.fillText(item.emoji, cx, cx + 8); }
  else { const ch = Array.from(item.label.trim())[0] ?? '?'; g.font = `800 130px ${font}`; g.fillStyle = '#ffffff'; g.fillText(ch, cx, cx + 14); }
  const tex = new CanvasTexture(c); const sp = new Sprite(new SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sp.renderOrder = 10; return sp;
}
/** A pill with the item's name, sized to the text. */
function labelSprite(text: string, font: string): Sprite {
  const c = document.createElement('canvas'); c.width = 640; c.height = 128; const g = c.getContext('2d')!;
  g.font = `700 44px ${font}`; const w = Math.min(600, g.measureText(text).width + 56);
  const x = (640 - w) / 2, y = 24, h = 80, rr = 40;
  g.beginPath(); g.moveTo(x + rr, y); g.lineTo(x + w - rr, y); g.arc(x + w - rr, y + rr, rr, -Math.PI / 2, Math.PI / 2); g.lineTo(x + rr, y + h); g.arc(x + rr, y + rr, rr, Math.PI / 2, -Math.PI / 2); g.closePath();
  g.fillStyle = 'rgba(9,14,24,0.86)'; g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.3)'; g.stroke();
  g.fillStyle = '#f4f8fc'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 320, 66);
  const tex = new CanvasTexture(c); const sp = new Sprite(new SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sp.scale.set(2.6, 0.52, 1); sp.renderOrder = 11; return sp;
}
function ring(rOut: number, rIn: number, color: Color | string, o: Record<string, unknown> = {}) {
  const m = new Mesh(new TorusGeometry((rOut + rIn) / 2, (rOut - rIn) / 2, 8, 64), std(color, o)); return m;
}
function sector(r: number, start: number, len: number, color: Color | string, h = 0.25) {
  return new Mesh(new CylinderGeometry(r, r, h, 48, 1, false, start, len), std(color));
}

/* ---------- scenes ---------- */
const SCENES: Record<string, Builder> = {
  /** গাছের অংশ: every part is its own group with a direction to explode along, and an anchor for its badge. */
  treeparts({ root, hue }) {
    const brown = new Color('#7a4f2a'), bark = new Color('#5c3a1e'), leaf = hue, leaf2 = lighten(hue, 0.25);
    const parts: { g: Group; base: Vector3; dir: Vector3 }[] = [];
    const anchors: Record<string, Object3D> = {};
    const part = (base: Vector3, dir: Vector3) => { const g = new Group(); g.position.copy(base); root.add(g); parts.push({ g, base: base.clone(), dir: dir.clone().normalize() }); return g; };
    const mark = (name: string, parent: Object3D, x: number, y: number, z: number) => { const m = new Object3D(); m.position.set(x, y, z); parent.add(m); anchors[name] = m; };

    // The soil the tree is rooted in. It is a low mound rather than the flat
    // dark disc it was: that disc sat at a different height from the shared
    // ground added later, so the tree stood on two floors at once and the
    // second one read as a sticker under the first.
    root.position.y = -0.35;   // the tree stands a little low so the exploded canopy stays in frame
    const ground = new Mesh(new SphereGeometry(2.65, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.5), std('#4a6b45', { roughness: 1, flatShading: true }));
    ground.scale.y = 0.13; ground.position.y = -1.76; root.add(ground);
    // roots
    const roots = part(new Vector3(0, -1.75, 0), new Vector3(0, -1, 0));
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const r = new Mesh(new CylinderGeometry(0.05, 0.13, 1.3, 8), std(brown)); r.position.set(Math.cos(a) * 0.55, -0.45, Math.sin(a) * 0.55); r.rotation.z = Math.cos(a) * 0.9; r.rotation.x = -Math.sin(a) * 0.9; roots.add(r); }
    mark('মূল', roots, 0, -0.55, 0.9);
    // trunk + bark
    const trunk = part(new Vector3(0, -0.6, 0), new Vector3(0, 0, 1));
    trunk.add(new Mesh(new CylinderGeometry(0.28, 0.42, 2.3, 16), std(brown)));
    mark('কাণ্ড', trunk, 0.6, -0.55, 0.35);
    const barkG = part(new Vector3(0, -0.6, 0), new Vector3(-1, 0, 0.3));
    for (let i = 0; i < 7; i++) { const b = new Mesh(new BoxGeometry(0.1, 0.35, 0.06), std(bark)); const a = i * 0.9; b.position.set(Math.cos(a) * 0.4, -0.9 + i * 0.3, Math.sin(a) * 0.4); b.lookAt(0, b.position.y, 0); barkG.add(b); }
    mark('ছাল', barkG, -0.65, 0.25, 0.3);
    // branches
    const branches = part(new Vector3(0, 0.55, 0), new Vector3(1, 0.4, 0));
    [[0.7, 0.9, 0.2], [-0.8, 0.8, -0.3], [0.1, 1.0, 0.8], [-0.3, 0.9, -0.8]].forEach(([x, y, z]) => {
      const dir = new Vector3(x, y, z); const len = dir.length(); const b = new Mesh(new CylinderGeometry(0.06, 0.13, len, 8), std(brown));
      b.position.copy(dir.clone().multiplyScalar(0.5)); b.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize()); branches.add(b);
    });
    mark('শাখা', branches, 1.05, 0.55, 0.45);
    // canopy clusters
    const canopy = part(new Vector3(0, 1.6, 0), new Vector3(0, 1, 0));
    [[0, 0.3, 0], [0.8, 0, 0.2], [-0.8, 0.05, -0.2], [0.2, -0.1, 0.85], [-0.3, 0, -0.85], [0.5, 0.55, -0.4], [-0.5, 0.5, 0.4]].forEach(([x, y, z], i) => {
      const c = new Mesh(new SphereGeometry(0.62, 18, 14), std(i % 2 ? leaf : leaf2)); c.position.set(x, y, z); canopy.add(c);
    });
    mark('পাতা', canopy, -1.1, 0.2, 0.5);
    // one big leaf with veins
    const leafG = part(new Vector3(1.7, 1.1, 0.9), new Vector3(1, 0.2, 0.6));
    const blade = new Mesh(new CircleGeometry(0.42, 24), std(leaf2, { side: DoubleSide })); blade.scale.set(0.6, 1, 1); leafG.add(blade);
    for (let i = -3; i <= 3; i++) { const v = new Mesh(new BoxGeometry(0.28, 0.015, 0.01), std(darken(leaf, 0.35))); v.position.set(i * 0.05, i * 0.1, 0.01); v.rotation.z = i * 0.35; leafG.add(v); }
    const mid = new Mesh(new BoxGeometry(0.015, 0.8, 0.01), std(darken(leaf, 0.4))); mid.position.z = 0.012; leafG.add(mid);
    mark('শিরা', leafG, 0.1, 0.3, 0.1);
    // flowers
    const flowers = part(new Vector3(0, 1.6, 0), new Vector3(0.3, 0.6, 1));
    for (let i = 0; i < 7; i++) { const f = new Mesh(new SphereGeometry(0.11, 10, 8), std('#f4a7c3', { emissive: '#f4a7c3', emissiveIntensity: 0.25 })); const a = i * 1.7; f.position.set(Math.cos(a) * 0.9, Math.sin(a * 1.3) * 0.4, 0.7 + Math.sin(a) * 0.3); flowers.add(f); }
    mark('ফুল', flowers, 0.9, 0.2, 0.9);
    // fruit
    const fruit = part(new Vector3(0, 1.3, 0), new Vector3(1, -0.4, 0.6));
    for (let i = 0; i < 5; i++) { const fr = new Mesh(new SphereGeometry(0.15, 12, 10), std('#d94a3a')); const a = i * 1.4; fr.position.set(Math.cos(a) * 0.95, -0.35 + Math.sin(a) * 0.2, Math.sin(a) * 0.95); fruit.add(fr); }
    mark('ফল', fruit, 0.95, -0.35, 0.0);
    // seeds on the ground
    const seeds = part(new Vector3(0, -1.6, 0), new Vector3(0.6, -0.2, 1));
    for (let i = 0; i < 6; i++) { const sd = new Mesh(new SphereGeometry(0.07, 8, 6), std('#8b5a2b')); sd.position.set(1.1 + Math.cos(i * 1.1) * 0.35, 0.06, 1.0 + Math.sin(i * 1.1) * 0.35); sd.scale.y = 0.7; seeds.add(sd); }
    mark('বীজ', seeds, 1.1, 0.1, 1.0);

    // the slider grows the tree; the engine's খুলে দেখো control pulls it apart.
    // No shared ground: this scene brought its own mound, and two floors a hair
    // apart is the z-fighting stripe that spoiled the collection scene.
    return { label: 'বড় হও', anchors, aim: { y: 0.3, eye: 1.25 }, update(t, _dt, p) {
      const g = 0.3 + p * 0.7;
      canopy.scale.setScalar(g); flowers.scale.setScalar(Math.max(0.001, (p - 0.35) / 0.65));
      fruit.scale.setScalar(Math.max(0.001, (p - 0.6) / 0.4)); leafG.scale.setScalar(0.4 + p * 0.6);
      trunk.scale.set(0.55 + p * 0.45, 0.5 + p * 0.5, 0.55 + p * 0.45);
      branches.scale.setScalar(0.45 + p * 0.55);
      canopy.rotation.y = Math.sin(t * 0.3) * 0.05; leafG.rotation.z = Math.sin(t * 1.1) * 0.08;
    } };
  },

  /**
   * মানবদেহ: a figure with a see-through skin and every organ system as its
   * own part. The slider peels the skin and skeleton to the sides and lifts
   * each organ out along its own direction, badge riding with it.
   */
  bodyparts({ root }) {
    const parts: { g: Group; base: Vector3; dir: Vector3; k: number }[] = [];
    const anchors: Record<string, Object3D> = {};
    const part = (base: Vector3, dir: Vector3, k = 1) => { const g = new Group(); g.position.copy(base); root.add(g); parts.push({ g, base: base.clone(), dir: dir.clone().normalize(), k }); return g; };
    const mark = (name: string, parent: Object3D, x: number, y: number, z: number) => { const m = new Object3D(); m.position.set(x, y, z); parent.add(m); anchors[name] = m; };
    const ell = (parent: Object3D, mat: MeshStandardMaterial, x: number, y: number, z: number, sx: number, sy: number, sz: number) => { const m = new Mesh(new SphereGeometry(1, 20, 16), mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); parent.add(m); return m; };
    const rod = (parent: Object3D, mat: MeshStandardMaterial, a: Vector3, b: Vector3, r: number) => { const d = b.clone().sub(a); const m = new Mesh(new CylinderGeometry(r, r, d.length(), 10), mat); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), d.normalize()); parent.add(m); return m; };
    const tube = (parent: Object3D, mat: MeshStandardMaterial, pts: number[][], r: number) => { const m = new Mesh(new TubeGeometry(new CatmullRomCurve3(pts.map(([x, y, z]) => new Vector3(x, y, z))), 40, r, 6, false), mat); parent.add(m); return m; };
    root.position.y = -0.1;   // the figure stands a touch low so the lifted brain stays in frame

    // ত্বক: the see-through shell of the whole figure; the slider slides it off to the left
    const skinM = std('#e9b58f', { transparent: true, opacity: 0.3, depthWrite: false, roughness: 0.75 });
    const skin = part(new Vector3(0, 0, 0), new Vector3(-1, 0, 0.25), 1.9);
    ell(skin, skinM, 0, 1.55, 0, 0.4, 0.44, 0.4);                                   // head
    rod(skin, skinM, new Vector3(0, 1.1, 0), new Vector3(0, 1.32, 0), 0.13);        // neck
    const torso = new Mesh(new CylinderGeometry(0.42, 0.36, 1.45, 22), skinM); torso.position.y = 0.42; torso.scale.z = 0.65; skin.add(torso);
    ell(skin, skinM, 0, 1.12, 0, 0.5, 0.16, 0.32);                                   // shoulders
    ell(skin, skinM, 0, -0.3, 0, 0.38, 0.14, 0.24);                                  // hips
    for (const s of [-1, 1]) {
      rod(skin, skinM, new Vector3(s * 0.52, 1.05, 0), new Vector3(s * 0.82, -0.35, 0.05), 0.11);   // arm
      ell(skin, skinM, s * 0.84, -0.45, 0.06, 0.08, 0.11, 0.06);                                    // hand
      rod(skin, skinM, new Vector3(s * 0.22, -0.35, 0), new Vector3(s * 0.28, -1.85, 0), 0.15);     // leg
      ell(skin, skinM, s * 0.3, -1.92, 0.1, 0.11, 0.06, 0.2);                                       // foot
    }
    mark('ত্বক', skin, -0.95, 0.35, 0.2);

    // কঙ্কাল: spine, ribs, pelvis and limb bones; slides off to the right and back
    const boneM = std('#f3eee2', { roughness: 0.5 });
    const skel = part(new Vector3(0, 0, 0), new Vector3(1, 0, -0.5), 1.55);
    for (let i = 0; i < 12; i++) rod(skel, boneM, new Vector3(0, 1.18 - i * 0.125, -0.12), new Vector3(0, 1.1 - i * 0.125, -0.12), 0.055);
    for (let i = 0; i < 4; i++) { const rib = new Mesh(new TorusGeometry(0.34 - i * 0.015, 0.022, 6, 32), boneM); rib.position.set(0, 0.98 - i * 0.17, -0.02); rib.rotation.x = Math.PI / 2; rib.scale.z = 0.7; skel.add(rib); }
    const pelvis = new Mesh(new TorusGeometry(0.3, 0.05, 8, 24), boneM); pelvis.position.set(0, -0.3, -0.04); pelvis.rotation.x = Math.PI / 2 - 0.4; skel.add(pelvis);
    for (const s of [-1, 1]) {
      rod(skel, boneM, new Vector3(s * 0.52, 1.05, 0), new Vector3(s * 0.66, 0.35, 0.02), 0.04);
      rod(skel, boneM, new Vector3(s * 0.66, 0.35, 0.02), new Vector3(s * 0.82, -0.35, 0.05), 0.035);
      rod(skel, boneM, new Vector3(s * 0.22, -0.35, 0), new Vector3(s * 0.25, -1.1, 0), 0.055);
      rod(skel, boneM, new Vector3(s * 0.25, -1.1, 0), new Vector3(s * 0.28, -1.85, 0), 0.045);
      rod(skel, boneM, new Vector3(s * 0.2, 1.08, 0.1), new Vector3(s * 0.5, 1.06, 0.02), 0.03);   // collarbone
    }
    ell(skel, boneM, 0, 1.55, -0.02, 0.3, 0.32, 0.3).material = std('#f3eee2', { transparent: true, opacity: 0.35, depthWrite: false });   // skull, faint so the brain shows
    mark('কঙ্কাল', skel, 0.62, 0.02, 0.1);

    // পেশি: the big muscle groups, pulled to the right and forward
    const muscM = std('#c4463b', { roughness: 0.6 });
    const musc = part(new Vector3(0, 0, 0), new Vector3(1, 0, 0.6), 1.3);
    for (const s of [-1, 1]) {
      ell(musc, muscM, s * 0.6, 0.72, 0.03, 0.1, 0.22, 0.1);         // upper arm
      ell(musc, muscM, s * 0.74, 0.02, 0.05, 0.08, 0.2, 0.08);        // forearm
      ell(musc, muscM, s * 0.24, -0.78, 0.0, 0.14, 0.34, 0.14);       // thigh
      ell(musc, muscM, s * 0.27, -1.5, -0.03, 0.1, 0.25, 0.1);        // calf
      ell(musc, muscM, s * 0.18, 0.82, 0.24, 0.19, 0.13, 0.07);       // chest
    }
    ell(musc, muscM, 0, 0.25, 0.22, 0.2, 0.3, 0.06);                  // abdomen
    mark('পেশি', musc, 0.24, -0.78, 0.25);

    // মস্তিষ্ক: lifts straight up out of the head
    const brainM = std('#f0a6b4', { roughness: 0.7 });
    const brain = part(new Vector3(0, 1.6, 0), new Vector3(0.3, 1, 0), 0.6);
    ell(brain, brainM, 0, 0, 0, 0.27, 0.23, 0.3);
    for (let i = 0; i < 5; i++) { const gr = new Mesh(new TorusGeometry(0.22 - i * 0.03, 0.02, 5, 24, Math.PI), std('#d98594')); gr.position.set(0, 0.05 + i * 0.03, 0); gr.rotation.set(-Math.PI / 2, 0, i * 0.5); brain.add(gr); }
    mark('মস্তিষ্ক', brain, 0, 0.3, 0);

    // স্নায়ু: spinal cord and nerve branches, pulled straight back
    const nerveM = std('#f2d15c', { emissive: '#f2d15c', emissiveIntensity: 0.35 });
    const nerves = part(new Vector3(0, 0, 0), new Vector3(0, 0.15, -1), 1.5);
    rod(nerves, nerveM, new Vector3(0, 1.35, -0.1), new Vector3(0, -0.4, -0.1), 0.028);
    for (const s of [-1, 1]) {
      tube(nerves, nerveM, [[0, 1.0, -0.1], [s * 0.5, 1.02, -0.05], [s * 0.66, 0.35, 0.0], [s * 0.82, -0.35, 0.03]], 0.012);
      tube(nerves, nerveM, [[0, -0.3, -0.1], [s * 0.22, -0.4, -0.05], [s * 0.25, -1.1, 0.0], [s * 0.28, -1.8, 0.0]], 0.012);
      for (let i = 0; i < 4; i++) tube(nerves, nerveM, [[0, 0.95 - i * 0.2, -0.1], [s * 0.2, 0.93 - i * 0.2, 0.05], [s * 0.3, 0.9 - i * 0.2, 0.15]], 0.008);
    }
    mark('স্নায়ু', nerves, 0, 0.55, -0.35);

    // চোখ, কান, দাঁত, জিভ: the face, each on its own direction
    const eyes = part(new Vector3(0, 1.62, 0.33), new Vector3(0.2, 0.35, 1), 1);
    for (const s of [-1, 1]) { ell(eyes, std('#ffffff'), s * 0.14, 0, 0, 0.065, 0.065, 0.05); ell(eyes, std('#2a2f3a'), s * 0.14, 0, 0.045, 0.03, 0.03, 0.02); }
    mark('চোখ', eyes, 0.36, 0.0, 0);
    const ears = part(new Vector3(0, 1.55, 0), new Vector3(-0.6, 0.5, -0.5), 1);
    for (const s of [-1, 1]) ell(ears, std('#d9a17b'), s * 0.41, 0, 0, 0.04, 0.1, 0.07);
    mark('কান', ears, -0.62, 0.0, 0);
    const teeth = part(new Vector3(0, 1.38, 0.3), new Vector3(0.4, -0.25, 1), 1.1);
    for (let i = 0; i < 8; i++) { const a = -0.9 + (i / 7) * 1.8; const t = new Mesh(new BoxGeometry(0.035, 0.05, 0.03), std('#fbfbf7')); t.position.set(Math.sin(a) * 0.16, 0, Math.cos(a) * 0.1 - 0.02); teeth.add(t); }
    mark('দাঁত', teeth, 0.36, -0.08, 0.05);
    const tongue = part(new Vector3(0, 1.32, 0.24), new Vector3(-0.5, -0.6, 1), 1.1);
    ell(tongue, std('#e05a75'), 0, 0, 0, 0.08, 0.03, 0.12);
    mark('জিভ', tongue, -0.34, -0.14, 0.08);

    // ফুসফুস and হৃৎপিণ্ড: the chest, lungs to the front-left, heart to the front-right
    const lungM = std('#e88a9a', { roughness: 0.75 });
    const lungs = part(new Vector3(0, 0.72, 0), new Vector3(-0.9, 0.35, 1), 1);
    const lungL = ell(lungs, lungM, -0.22, 0, 0, 0.16, 0.3, 0.13), lungR = ell(lungs, lungM, 0.24, 0.02, 0, 0.15, 0.28, 0.13);
    rod(lungs, std('#f4c7d0'), new Vector3(0, 0.55, 0.02), new Vector3(0, 0.22, 0.02), 0.035);
    mark('ফুসফুস', lungs, -0.45, 0.15, 0.1);
    const heartM = std('#c0263a', { emissive: '#c0263a', emissiveIntensity: 0.25 });
    const heart = part(new Vector3(0.06, 0.7, 0.14), new Vector3(0.9, 0.05, 1), 1.1);
    const heartB = new Group(); heart.add(heartB);
    ell(heartB, heartM, 0, 0, 0, 0.15, 0.17, 0.13).rotation.z = -0.3;
    ell(heartB, heartM, -0.06, 0.1, 0, 0.08, 0.08, 0.08); ell(heartB, heartM, 0.07, 0.1, 0, 0.08, 0.08, 0.08);
    mark('হৃৎপিণ্ড', heart, 0.32, 0.18, 0.1);

    // রক্ত: vessels from the heart to head, arms and legs, pulled straight forward
    const bloodM = std('#d7263d', { emissive: '#8a1020', emissiveIntensity: 0.4 });
    const blood = part(new Vector3(0, 0, 0), new Vector3(0.1, -0.15, 1), 1.7);
    tube(blood, bloodM, [[0.06, 0.75, 0.12], [0.04, 1.1, 0.08], [0.05, 1.4, 0.06], [0.1, 1.7, 0.1]], 0.02);
    for (const s of [-1, 1]) {
      tube(blood, bloodM, [[0.06, 0.78, 0.12], [s * 0.4, 1.0, 0.06], [s * 0.66, 0.38, 0.06], [s * 0.82, -0.35, 0.08]], 0.016);
      tube(blood, bloodM, [[0.06, 0.62, 0.12], [0.02, 0.1, 0.06], [s * 0.22, -0.4, 0.05], [s * 0.27, -1.2, 0.06], [s * 0.3, -1.8, 0.08]], 0.018);
    }
    mark('রক্ত', blood, 0.02, -0.12, 0.3);

    // পাচনতন্ত্র: food pipe, stomach and the coiled gut, out and down
    const gutM = std('#e0996a', { roughness: 0.7 });
    const gut = part(new Vector3(0, 0.15, 0.08), new Vector3(0, -0.9, 1), 1.1);
    rod(gut, std('#f0b58c'), new Vector3(0, 1.15, -0.02), new Vector3(-0.1, 0.25, 0.02), 0.03);
    ell(gut, gutM, -0.12, 0.16, 0.02, 0.2, 0.14, 0.12);
    const coil: number[][] = []; for (let i = 0; i < 9; i++) coil.push([(i % 2 ? 0.2 : -0.2), 0.0 - i * 0.055, 0.06 + Math.sin(i) * 0.03]);
    tube(gut, gutM, coil, 0.045);
    mark('পাচনতন্ত্র', gut, -0.32, -0.05, 0.2);

    // কিডনি: the pair at the back, out and down behind the figure
    const kid = part(new Vector3(0, 0.12, -0.16), new Vector3(0, -0.5, -1), 1.2);
    for (const s of [-1, 1]) ell(kid, std('#8b3a3a'), s * 0.19, 0, 0, 0.085, 0.13, 0.065);
    mark('কিডনি', kid, -0.36, 0.0, -0.1);

    // the slider sets the pulse: resting on the left, hard exercise on the
    // right. `groundY` puts the floor under the soles, so the figure stands.
    return { label: 'হৃৎস্পন্দন', anchors, groundY: -2.02, aim: { y: 0.15, eye: 1.3 }, update(t, _dt, p) {
      void parts;
      const rate = 3 + p * 7;                                   // roughly 60 to 200 beats a minute
      const beat = 1 + Math.max(0, Math.sin(t * rate)) * (0.1 + p * 0.08);
      heartB.scale.setScalar(beat);
      const br = 1 + Math.sin(t * (1.1 + p * 2.4)) * (0.05 + p * 0.05);
      lungL.scale.set(0.16 * br, 0.3 * br, 0.13 * br); lungR.scale.set(0.15 * br, 0.28 * br, 0.13 * br);
      bloodM.emissiveIntensity = 0.3 + Math.max(0, Math.sin(t * rate)) * (0.4 + p * 0.4);
      nerveM.emissiveIntensity = 0.25 + Math.max(0, Math.sin(t * 9 + 1)) * 0.35;
    } };
  },

  /**
   * A category that is a list of different things: each item gets its own
   * little model, laid out on an arc, and its badge pins to it. The slider
   * makes them take a turn in front, one at a time, so a child can look at
   * any one of them close up without dragging.
   */
  collection({ root, figures }) {
    const anchors: Record<string, Object3D> = {};
    const made: { g: Group; home: Vector3 }[] = [];
    let firstDone = false;
    // the figures stand around eye level rather than at the bottom of the stage
    root.position.y = 0.55;
    for (let i = 0; i < figures.length; i++) {
      const spec = figures[i]!;
      const build = FIGURES[spec.figure] ?? FIGURES[Object.keys(FIGURES)[0]!]!;
      const g = new Group();
      build(g);
      const home = arc(figures.length, i);
      g.position.copy(home);
      g.scale.setScalar(figures.length > 10 ? 1.0 : 1.2);
      root.add(g);
      made.push({ g, home: home.clone() });
      const m = new Object3D(); m.position.set(0, 0.55, 0); g.add(m);
      anchors[spec.label] = m;
    }
    // No ground of its own any more: the shared one in render.ts catches the
    // key light's shadow, and two grounds at slightly different heights was
    // exactly the dark second ellipse that made this look like a sticker.
    // `root.position.y` is 0.55 and the figures sit at -0.55, so their feet
    // are at world zero.
    /**
     * Hero and supporting cast, rather than a row of equals.
     *
     * Fourteen things laid flat across a 700px stage gave every one of them
     * about forty pixels, which is why the trees read as a hedge of lollipops
     * no matter how well each one was built. The chosen one now comes a long
     * way forward and gets nearly twice the size, and the rest stay back as a
     * grove that the fog softens. Same information, but there is something to
     * actually look at, and the slider is now a camera move rather than a
     * highlight.
     */
    // The grove runs backwards from the origin, so the camera aims into it and
    // sits at about the height of a crown rather than looking down on a
    // diorama. Without this the subject sat in the top corner of the frame with
    // the bottom third empty ground.
    return { label: 'সামনে আনো', anchors, groundY: 0, aim: { y: 0.55, z: -0.9, eye: 1.0, dolly: 0.46 }, update(t, _dt, p) {
      const n = made.length;
      if (!n) return;
      const pick = Math.min(n - 1, Math.round(p * (n - 1)));
      const base = n > 10 ? 1.05 : 1.25;
      const settled = firstDone; firstDone = true;
      made.forEach((m, i) => {
        const on = i === pick;
        const want = on ? 1 : 0;
        // Snap on the first frame, ease after: same reason as the badges.
        m.g.userData.k = settled ? (m.g.userData.k ?? 0) + (want - (m.g.userData.k ?? 0)) * 0.1 : want;
        const k = m.g.userData.k as number;
        m.g.position.set(m.home.x * (1 - k * 0.92), m.home.y + k * 0.06, m.home.z + k * 1.55);
        // The chosen one turns slowly so its whole silhouette is read; the
        // others breathe rather than spin, which would make the grove jitter.
        m.g.rotation.y = on ? t * 0.45 : Math.sin(t * 0.35 + i * 1.7) * 0.12;
        m.g.scale.setScalar(base * (1 + k * 1.05));
      });
    } };
  },

  atom({ root, hue }) {
    // Seeded, so the same element is the same atom every time the page loads.
    const r = srand(0x4a70);
    const nuc = new Group(); root.add(nuc);
    // Nucleons packed on a small sphere rather than scattered in a cube: a
    // nucleus is a cluster held together, and a loose cloud of balls read as
    // neither a cluster nor a lattice.
    for (let i = 0; i < 12; i++) {
      const proton = i % 2 === 0;
      const m = new Mesh(new SphereGeometry(0.21, 20, 16), std(proton ? hue : lighten(hue, 0.55)));
      const y = 1 - (i / 11) * 2, rad = Math.sqrt(Math.max(0, 1 - y * y)), th = i * 2.399963;
      m.position.set(Math.cos(th) * rad, y, Math.sin(th) * rad).multiplyScalar(0.19 + r(0, 0.04));
      nuc.add(m);
    }
    const shells: { g: Group; es: Mesh[]; r: number }[] = [];
    [1.1, 1.7, 2.3].forEach((rad, i) => {
      const g = new Group(); g.rotation.set(r(0, 3), r(0, 3), i * 1.1); root.add(g);
      g.add(ring(rad + 0.015, rad - 0.015, darken(hue, 0.2), { transparent: true, opacity: 0.5 }));
      const es: Mesh[] = []; for (let k = 0; k < 4; k++) { const e = new Mesh(new SphereGeometry(0.11, 16, 12), std(GOLD, { emissive: GOLD, emissiveIntensity: 0.8 })); g.add(e); es.push(e); }
      shells.push({ g, es, r: rad });
    });
    return { label: 'ইলেকট্রন', update(t, _dt, p) {
      nuc.rotation.y = t * 0.3; const n = 2 + Math.round(p * 10);
      let k = 0; shells.forEach((s, i) => { s.g.rotation.z += 0.002 * (i + 1); s.es.forEach((e, j) => { const on = k++ < n; e.visible = on; const a = t * (1.6 - i * 0.4) + j * Math.PI / 2; e.position.set(Math.cos(a) * s.r, Math.sin(a) * s.r, 0); }); });
    } };
  },

  particles({ root, hue, v }) {
    const N = 140, half = 2.2;
    /**
     * A glass case with real edges, rather than a wireframe box.
     *
     * `wireframe: true` is a debug view. It reads as one instantly: no
     * thickness, no highlight, and the diagonals of every triangle showing
     * through. Twelve bevelled bars and a faint pane cost twelve meshes and
     * turn the same volume into a sealed vessel you could pick up.
     */
    const shell = new Mesh(new BoxGeometry(half * 2, half * 2, half * 2), glassy('#cfe4f2', 0.09)); root.add(shell);
    const edgeMat = metal(lighten(hue, 0.2), { roughness: 0.36, metalness: 0.5 });
    const span = half * 2, th = 0.075;
    for (const axis of [0, 1, 2] as const) {
      for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) {
        const bar = new Mesh(roundedBox(axis === 0 ? span : th, axis === 1 ? span : th, axis === 2 ? span : th, 0.03), edgeMat);
        const q = [0, 0, 0]; const other = [0, 1, 2].filter((k) => k !== axis);
        q[other[0]!] = s1 * half; q[other[1]!] = s2 * half;
        bar.position.set(q[0]!, q[1]!, q[2]!);
        root.add(bar);
      }
    }
    const geo = new SphereGeometry(0.13, 12, 10);
    // the particle colour carries the temperature too, so the slider reads as
    // heat and not only as speed
    const pm = std(hue, { emissive: new Color('#ff5722'), emissiveIntensity: 0 });
    const im = new InstancedMesh(geo, pm, N); root.add(im);
    const colorB = v === 'mix' ? GOLD : hue; const im2 = v === 'mix' ? new InstancedMesh(geo, std(colorB), N) : null; if (im2) root.add(im2);
    const cold = hue.clone(), hot = new Color('#ff8a4c');
    /**
     * Where the liquid state settles.
     *
     * The old one kept x and z on the gas lattice and randomised only y, so
     * "liquid" came out as a coarse grid of vertical strings filling most of
     * the box - the one state of matter the scene exists to contrast, and it
     * did not read as a liquid at all. This is a dense pack in the bottom of
     * the vessel with a level surface, which is what a liquid looks like.
     */
    const liq: Vector3[] = [];
    const per = 7, sp = 3.9 / per;
    for (let i = 0; i < N; i++) {
      const layer = Math.floor(i / (per * per)), k = i % (per * per);
      liq.push(new Vector3(((k % per) - (per - 1) / 2) * sp, -half + 0.25 + layer * 0.34, (Math.floor(k / per) - (per - 1) / 2) * sp));
    }
    const home: Vector3[] = [], pos: Vector3[] = [], vel: Vector3[] = []; const side = Math.ceil(Math.cbrt(N));
    for (let i = 0; i < N; i++) { const x = (i % side) - side / 2 + 0.5, y = Math.floor(i / side) % side - side / 2 + 0.5, z = Math.floor(i / side / side) - side / 2 + 0.5; home.push(new Vector3(x, y, z).multiplyScalar(0.62)); pos.push(home[i].clone()); vel.push(new Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1))); }
    const m4 = new Matrix4();
    return { label: v === 'mix' ? 'মেশাও' : 'তাপমাত্রা', update(t, dt, p) {
      for (let i = 0; i < N; i++) {
        const P = pos[i];
        if (v === 'mix') { const target = home[i].clone(); if (p < 0.5) target.x += i % 2 ? 1.2 : -1.2; P.lerp(target, 0.05); P.x += Math.sin(t * 3 + i) * 0.004 * (1 + p); }
        else if (p < 0.35) { P.lerp(home[i], 0.1); P.x += (Math.random() - 0.5) * 0.02 * (p + 0.1); P.y += (Math.random() - 0.5) * 0.02 * (p + 0.1); }
        else if (p < 0.7) { P.lerp(liq[i]!, 0.045); P.add(new Vector3(Math.sin(t * 2 + i), Math.cos(t * 1.7 + i * 2), Math.sin(t * 2.3 + i * 3)).multiplyScalar(0.014)); }
        else { P.addScaledVector(vel[i], dt * (p * 3)); for (const k of ['x', 'y', 'z'] as const) { if (P[k] > half - 0.2 || P[k] < -half + 0.2) { vel[i][k] *= -1; P[k] = MathUtils.clamp(P[k], -half + 0.2, half - 0.2); } } }
        const target = (im2 && i % 2) ? im2 : im; m4.makeTranslation(P.x, P.y, P.z); target.setMatrixAt(i, m4);
        if (im2) (i % 2 ? im : im2).setMatrixAt(i, m4.makeScale(0, 0, 0));
      }
      im.instanceMatrix.needsUpdate = true; if (im2) im2.instanceMatrix.needsUpdate = true;
      // cold stays the category's own colour; the warming only starts once the
      // solid has begun to give, so the tint reads as heat and not as a filter
      if (v !== 'mix') { pm.color.copy(cold).lerp(hot, Math.max(0, p - 0.3) / 0.7 * 0.75); pm.emissiveIntensity = Math.max(0, p - 0.65) * 0.8; }
    } };
  },

  wave({ root, hue }) {
    const geo = new PlaneGeometry(7, 1.4, 160, 8);
    const m = new Mesh(geo, std(hue, { side: DoubleSide, roughness: 0.42, metalness: 0.12 }));
    m.rotation.x = -0.35; root.add(m);
    /**
     * A rest line and a rule behind the ribbon.
     *
     * The slider changes the wavelength, and with nothing fixed to measure it
     * against the change was almost invisible: the ribbon just looked busier.
     * The marks do not move, so the wave visibly packs more crests between
     * them as the pitch rises.
     */
    const guide = std('#ffffff', { transparent: true, opacity: 0.22, roughness: 0.9 });
    const rest = new Mesh(new BoxGeometry(7.4, 0.015, 0.015), guide); rest.position.y = -0.02; root.add(rest);
    for (let i = -3; i <= 3; i++) {
      const tick = new Mesh(new BoxGeometry(0.02, 1.0, 0.02), guide);
      tick.position.set(i * 1.1, 0, -0.5); root.add(tick);
    }
    const pos = geo.attributes.position as Float32BufferAttribute; const base = Float32Array.from(pos.array as Float32Array);
    return { label: 'সুর', aim: { y: 0, eye: 1.15 }, update(t, _dt, p) {
      const k = 1 + p * 4;
      // the crest is taller at the middle of the ribbon and fades to the edges,
      // so it reads as a travelling wave rather than a corrugated sheet
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3]!, y = base[i * 3 + 1]!;
        pos.setZ(i, Math.sin(x * k - t * 3) * 0.45 * Math.cos((y / 0.7) * 0.9));
      }
      pos.needsUpdate = true; geo.computeVertexNormals();
    } };
  },

  /** A geared train, mounted on a back plate so it reads as a mechanism rather than three coins floating in a row. */
  gears({ root, hue }) {
    const mk = (r: number, teeth: number, color: Color) => {
      const g = new Group();
      g.add(new Mesh(new CylinderGeometry(r, r, 0.3, 44), metal(color, { roughness: 0.42, metalness: 0.55 })));
      // A recessed face and a raised hub. A gear is a machined part: it has a
      // web, a boss and lightening holes, and the flat disc it used to be read
      // as a token.
      const dish = new Mesh(new CylinderGeometry(r * 0.68, r * 0.68, 0.36, 32), metal(darken(color, 0.24), { roughness: 0.5, metalness: 0.5 }));
      g.add(dish);
      const holes = Math.max(3, Math.round(teeth / 2));
      for (let i = 0; i < holes; i++) {
        const h = new Mesh(new CylinderGeometry(r * 0.15, r * 0.15, 0.4, 14), std(darken(color, 0.55)));
        const a = (i / holes) * Math.PI * 2;
        h.position.set(Math.cos(a) * r * 0.44, 0, Math.sin(a) * r * 0.44);
        g.add(h);
      }
      for (let i = 0; i < teeth; i++) {
        const b = new Mesh(roundedBox(0.26, 0.3, 0.22, 0.045), metal(color, { roughness: 0.42, metalness: 0.55 }));
        const a = (i / teeth) * Math.PI * 2;
        // roundedBox lays out w on x, h on y and d on z, exactly like the
        // BoxGeometry it replaces, so the tooth needs the same single turn
        b.position.set(Math.cos(a) * (r + 0.09), 0, Math.sin(a) * (r + 0.09));
        b.rotation.y = -a;
        g.add(b);
      }
      g.add(new Mesh(new CylinderGeometry(0.17, 0.17, 0.46, 20), metal('#aab2bb')));
      g.rotation.x = Math.PI / 2;
      return g;
    };
    const a = mk(1.2, 12, hue), b = mk(0.8, 8, lighten(hue, 0.3)), c = mk(0.55, 6, GOLD);
    a.position.set(-0.9, 0, 0); b.position.set(1.25, 0, 0); c.position.set(1.25, 1.5, 0);
    // the plate the shafts run through, set back so the gears stand proud of it
    const plate = rbox('#79838f', 5.2, 4.4, 0.22, 0.14); plate.position.set(0.1, 0.2, -0.42); root.add(plate);
    for (const g of [a, b, c]) {
      const shaft = new Mesh(new CylinderGeometry(0.1, 0.1, 0.7, 14), metal('#8d959e'));
      shaft.rotation.x = Math.PI / 2; shaft.position.copy(g.position).setZ(-0.25);
      root.add(shaft);
    }
    root.add(a, b, c);
    return { label: 'গতি', aim: { y: 0.2, eye: 1.2 }, update(_t, dt, p) { const s = dt * (0.4 + p * 2.5); a.rotation.y += s; b.rotation.y -= s * 12 / 8; c.rotation.y += s * 12 / 6; } };
  },

  /** A pendulum on a stand that stands on the floor, which the old floating crossbar did not. */
  pendulum({ root, hue }) {
    const GY = -2.0;
    const wood = darken(hue, 0.22), woodDark = darken(hue, 0.44);
    const beam = rbox(wood, 3.1, 0.2, 0.34, 0.06); beam.position.y = 2.2; root.add(beam);
    for (const s of [-1, 1]) {
      const legLen = 2.2 - GY;
      const leg = rbox(woodDark, 0.17, legLen, 0.17, 0.05);
      leg.position.set(s * 1.3, GY + legLen / 2, 0); leg.rotation.z = -s * 0.08;
      const brace = rbox(woodDark, 0.13, 0.95, 0.13, 0.04);
      brace.position.set(s * 1.02, 1.68, 0); brace.rotation.z = s * 0.76;
      const foot = rbox(woodDark, 0.54, 0.14, 1.05, 0.05);
      foot.position.set(s * 1.45, GY + 0.07, 0);
      root.add(leg, brace, foot);
    }
    const pivot = new Mesh(new CylinderGeometry(0.09, 0.09, 0.44, 18), metal('#b9c0c8'));
    pivot.rotation.x = Math.PI / 2; pivot.position.y = 2.2; root.add(pivot);

    const arm = new Group(); arm.position.y = 2.2; root.add(arm);
    const rod = new Mesh(new CylinderGeometry(0.028, 0.028, 1, 12), metal('#aeb6bf'));
    // A brass bob, lens-shaped with a collar where the rod enters it, rather
    // than a ball: the shape is what tells you it is a weight and not a balloon.
    const bob = new Group();
    const body = new Mesh(new SphereGeometry(0.4, 30, 20), metal(GOLD, { roughness: 0.32 }));
    body.scale.set(1, 1.15, 0.62); bob.add(body);
    const collar = new Mesh(new CylinderGeometry(0.075, 0.11, 0.18, 16), metal('#c9a227'));
    collar.position.y = 0.4; bob.add(collar);
    arm.add(rod, bob);
    return { label: 'দৈর্ঘ্য', groundY: GY, aim: { y: 0.3, eye: 1.1 }, update(t, _dt, p) {
      const L = 1.4 + p * 2.2;
      rod.scale.y = L; rod.position.y = -L / 2; bob.position.y = -L;
      // the period really does go with the square root of the length, which is
      // the whole point of the slider
      arm.rotation.z = 0.6 * Math.cos(t * Math.sqrt(9.8 / L));
    } };
  },

  ramp({ root, hue }) {
    const GY = -1.75, len = 5;
    const g = new Group(); g.position.y = -0.35; root.add(g);
    const plank = rbox(darken(hue, 0.3), len, 0.2, 1.5, 0.06); g.add(plank);
    // a lip down each edge, so the ball is running in a channel and not
    // balancing on a slab, and battens across it so the plank has a length
    for (const s of [-1, 1]) { const rail = rbox(darken(hue, 0.46), len, 0.17, 0.12, 0.04); rail.position.set(0, 0.13, s * 0.69); g.add(rail); }
    for (let i = -2; i <= 2; i++) { const b = rbox(darken(hue, 0.52), 0.1, 0.07, 1.36, 0.02); b.position.set(i * 0.95, 0.12, 0); g.add(b); }
    const ball = new Mesh(new SphereGeometry(0.35, 32, 24), metal(GOLD, { roughness: 0.3 })); g.add(ball);
    const pivot = new Mesh(new CylinderGeometry(0.17, 0.24, 1.3, 20), std('#8a8f96')); pivot.position.y = -1.1; root.add(pivot);
    let s = 0;
    return { label: 'ঢাল', groundY: GY, aim: { y: 0.1, eye: 1.15 }, update(_t, dt, p) {
      const ang = 0.15 + p * 0.55;
      // Downhill is +x. It used to be the other way round, so for every value
      // of the slider the ball rolled steadily up the slope and gravity read
      // backwards - the one thing this scene exists to show.
      g.rotation.z = -ang;
      const acc = 9.8 * Math.sin(ang) * 0.25; s += acc * dt * 1.6;
      ball.position.x = -len / 2 + 0.3 + s; ball.position.y = 0.45;
      ball.rotation.z -= dt * 3 * (1 + p);
      if (ball.position.x > len / 2 - 0.3) s = 0;
    } };
  },

  prism({ root, hue }) {
    // Real glass: smooth, and with the environment turned up so the sky bends
    // across its faces. At roughness 0.1 with nothing to reflect it was a
    // translucent grey wedge.
    const prism = new Mesh(new CylinderGeometry(1.2, 1.2, 1.6, 3), glassy(lighten(hue, 0.72), 0.42));
    prism.rotation.x = Math.PI / 2; prism.rotation.z = Math.PI; root.add(prism);
    // the edges, which is where a real prism catches the light
    const edge = new Mesh(new CylinderGeometry(1.21, 1.21, 1.62, 3, 1, true), std(lighten(hue, 0.5), { transparent: true, opacity: 0.35, side: DoubleSide, roughness: 0.15, metalness: 0.2 }));
    edge.rotation.copy(prism.rotation); root.add(edge);
    const beam = new Mesh(new BoxGeometry(3, 0.09, 0.09), glow('#ffffff', 0.9)); beam.position.set(-2.3, 0.2, 0); root.add(beam);
    const cols = ['#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#0a84ff', '#5e5ce6', '#bf5af2'].map((c) => { const r = new Mesh(new BoxGeometry(3.2, 0.08, 0.08), glow(c, 0.95)); r.position.x = 1.6; const p = new Group(); p.position.set(0.7, -0.05, 0); p.add(r); root.add(p); return p; });
    return { label: 'রং ছড়াও', update(t, _dt, p) { cols.forEach((c, i) => { c.rotation.z = -(i - 3) * (0.04 + p * 0.09); }); (beam.material as MeshBasicMaterial).opacity = 0.75 + Math.sin(t * 6) * 0.15; } };
  },

  circuit({ root, hue, v }) {
    const pts = [new Vector3(-2.5, -1.2, 0), new Vector3(2.5, -1.2, 0), new Vector3(2.5, 1.2, 0), new Vector3(-2.5, 1.2, 0)];
    const curve = new CatmullRomCurve3(pts, true, 'catmullrom', 0.05);
    root.add(new Mesh(new TubeGeometry(curve, 120, 0.055, 10, true), metal('#8e979f', { roughness: 0.4 })));
    /**
     * A battery that looks like a battery and a bulb that looks like a bulb.
     *
     * A coloured box and a tinted ball told a child nothing: the parts of a
     * circuit are the one thing this scene is teaching, and they have to be
     * recognisable as themselves before the moving dots mean anything.
     */
    const batt = new Group(); batt.position.set(0, -1.2, 0); root.add(batt);
    const cell = new Mesh(new CylinderGeometry(0.3, 0.3, 1.05, 26), std(hue));
    cell.rotation.z = Math.PI / 2; batt.add(cell);
    batt.add(new Mesh(new CylinderGeometry(0.305, 0.305, 0.26, 26), std(darken(hue, 0.45))).rotateZ(Math.PI / 2));
    const nub = new Mesh(new CylinderGeometry(0.1, 0.1, 0.16, 16), metal('#c8ced4'));
    nub.rotation.z = Math.PI / 2; nub.position.x = 0.6; batt.add(nub);
    const flat = new Mesh(new CylinderGeometry(0.3, 0.3, 0.06, 26), metal('#c8ced4'));
    flat.rotation.z = Math.PI / 2; flat.position.x = -0.55; batt.add(flat);

    const lamp = new Group(); lamp.position.set(0, 1.2, 0); root.add(lamp);
    const envelope = new Mesh(new SphereGeometry(0.42, 28, 22), glassy('#fff8e0', 0.34));
    envelope.position.y = 0.16; lamp.add(envelope);
    const filament = new Mesh(new TorusGeometry(0.11, 0.022, 8, 20, Math.PI * 1.3), std(GOLD, { emissive: GOLD, emissiveIntensity: 0.2 }));
    filament.position.y = 0.16; filament.rotation.x = Math.PI / 2; lamp.add(filament);
    const screw = new Mesh(new CylinderGeometry(0.19, 0.22, 0.3, 20), metal('#b0a36a', { roughness: 0.45 }));
    screw.position.y = -0.24; lamp.add(screw);
    for (let i = 0; i < 3; i++) { const t = new Mesh(new TorusGeometry(0.2 - i * 0.006, 0.022, 6, 20), metal('#9c9060', { roughness: 0.5 })); t.position.y = -0.15 - i * 0.08; t.rotation.x = Math.PI / 2; lamp.add(t); }

    const light = new PointLight(GOLD, 0, 6); light.position.set(0, 1.36, 0); root.add(light);
    const N = v === 'network' ? 24 : 14; const es: Mesh[] = []; for (let i = 0; i < N; i++) { const e = new Mesh(new SphereGeometry(0.085, 12, 10), std('#7cf', { emissive: '#7cf', emissiveIntensity: 0.9 })); root.add(e); es.push(e); }
    return { label: 'বিদ্যুৎ প্রবাহ', update(t, _dt, p) {
      es.forEach((e, i) => e.position.copy(curve.getPointAt(((t * (0.05 + p * 0.25)) + i / N) % 1)));
      (filament.material as MeshStandardMaterial).emissiveIntensity = 0.15 + p * 5;
      (envelope.material as MeshStandardMaterial).emissive.copy(GOLD);
      (envelope.material as MeshStandardMaterial).emissiveIntensity = p * 0.5;
      light.intensity = p * 4;
    } };
  },

  beaker({ root, hue, v }) {
    const GY = -1.32;
    // real glass, plus the two things that say "laboratory": a rolled rim and
    // a thicker base the vessel actually stands on
    const glass = new Mesh(new CylinderGeometry(1.1, 1, 2.6, 40, 1, true), glassy('#d8ecf6', 0.24)); root.add(glass);
    const rim = new Mesh(new TorusGeometry(1.1, 0.05, 8, 44), glassy('#e6f4fb', 0.5)); rim.position.y = 1.3; rim.rotation.x = Math.PI / 2; root.add(rim);
    const base = new Mesh(new CylinderGeometry(1.02, 1.02, 0.09, 40), glassy('#d8ecf6', 0.4)); base.position.y = -1.27; root.add(base);
    // graduation marks, so the level means something
    for (let i = 1; i <= 4; i++) {
      const mark = new Mesh(new BoxGeometry(0.02, 0.03, 0.26), std('#ffffff', { transparent: true, opacity: 0.55 }));
      mark.position.set(0, -1.15 + i * 0.46, 1.02); root.add(mark);
    }
    const liquid = new Mesh(new CylinderGeometry(1.02, 0.94, 1.6, 40), std(hue, { transparent: true, opacity: 0.8, roughness: 0.18, metalness: 0.05 }));
    liquid.position.y = -0.45; root.add(liquid);
    // the surface: slightly brighter and flatter than the body, which is what
    // makes a liquid read as having a top rather than being a coloured solid
    const surf = new Mesh(new CircleGeometry(1.015, 40), std(lighten(hue, 0.22), { transparent: true, opacity: 0.92, roughness: 0.1, metalness: 0.2, side: DoubleSide }));
    surf.rotation.x = -Math.PI / 2; surf.position.y = 0.35; root.add(surf);
    const rb = srand(0x51ac);
    const bubbles: Mesh[] = []; for (let i = 0; i < 26; i++) { const b = new Mesh(new SphereGeometry(rb(0.05, 0.13), 10, 8), glassy('#ffffff', 0.7)); b.position.set(rb(-0.7, 0.7), rb(-1.2, 0.3), rb(-0.7, 0.7)); root.add(b); bubbles.push(b); }
    const acid = new Color('#e5484d'), base2 = new Color('#3b82f6');
    return { label: v === 'ph' ? 'pH' : 'বিক্রিয়ার হার', groundY: GY, aim: { y: 0.05, eye: 1.1 }, update(t, dt, p) {
      if (v === 'ph') {
        (liquid.material as MeshStandardMaterial).color.copy(acid).lerp(base2, p);
        (surf.material as MeshStandardMaterial).color.copy(acid).lerp(base2, p).lerp(WHITE, 0.22);
      }
      const rate = v === 'ph' ? 0.5 : p;
      bubbles.forEach((b, i) => { b.position.y += dt * (0.4 + rate * 1.6) * (0.6 + (i % 3) * 0.3); b.position.x += Math.sin(t * 3 + i) * 0.003; if (b.position.y > 0.35) b.position.y = -1.2; b.visible = i < 6 + rate * 20; });
      surf.position.y = 0.35 + Math.sin(t * 1.6) * 0.012 * (0.3 + rate);
    } };
  },

  molecule({ root, hue }) {
    const g = new Group(); root.add(g);
    const c = new Mesh(new SphereGeometry(0.55, 32, 24), std(hue)); g.add(c);
    const dirs = [new Vector3(1, 1, 1), new Vector3(-1, -1, 1), new Vector3(-1, 1, -1), new Vector3(1, -1, -1)];
    const outer: Mesh[] = [];
    dirs.forEach((d, i) => {
      d.normalize().multiplyScalar(1.5);
      const a = new Mesh(new SphereGeometry(0.36, 26, 20), std(i % 2 ? GOLD : lighten(hue, 0.5)));
      a.position.copy(d); g.add(a); outer.push(a);
      // a bond with a collar at each end, so the stick joins the balls instead
      // of disappearing into them
      const bond = new Mesh(new CylinderGeometry(0.075, 0.075, 1.5, 12), metal('#9aa3ab', { roughness: 0.5 }));
      bond.position.copy(d.clone().multiplyScalar(0.5));
      bond.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), d.clone().normalize());
      g.add(bond);
    });
    return { label: 'ঘূর্ণন', update(t, dt, p) {
      g.rotation.y += dt * (0.2 + p); g.rotation.x += dt * 0.15;
      // the bonds are springs: a molecule at rest still vibrates
      outer.forEach((a, i) => a.scale.setScalar(1 + Math.sin(t * 3 + i * 1.6) * 0.035 * (0.4 + p)));
    } };
  },

  /**
   * The growing tree.
   *
   * It was seeded with Math.random(), so it grew into a different tree on every
   * reload: a child could not come back to the same tree twice, and no two
   * screenshots of the page ever matched. It is now seeded, has a root flare
   * where it meets the ground, and carries a crown of varied leaf clumps
   * rather than forty identical balls at eight segments each.
   */
  tree({ root, v }) {
    const GY = -1.6;
    const rr = srand(0x7ee5);
    const trunkMat = std('#6b4a2b', { roughness: 0.92 });
    const leafCols = { green: new Color('#3e8e5a'), autumn: new Color('#d9822b'), spring: new Color('#e88fb0') };
    const leafMat = std(leafCols.green, { roughness: 0.86, flatShading: true });
    const tips: Vector3[] = []; const tree = new Group(); root.add(tree); tree.position.y = GY;
    const grow = (from: Vector3, dir: Vector3, len: number, r: number, depth: number) => {
      const b = new Mesh(new CylinderGeometry(r * 0.62, r, len, depth > 1 ? 10 : 6), trunkMat);
      b.position.copy(from.clone().addScaledVector(dir, len / 2));
      b.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir); tree.add(b);
      const end = from.clone().addScaledVector(dir, len);
      if (depth === 0) { tips.push(end); return; }
      // a knuckle where the branch forks, so the joins are not open tube ends
      const joint = new Mesh(new SphereGeometry(r * 0.72, 8, 6), trunkMat);
      joint.position.copy(end); tree.add(joint);
      for (let i = 0; i < 3; i++) {
        const nd = dir.clone().add(new Vector3(rr(-0.7, 0.7), rr(0.2, 0.6), rr(-0.7, 0.7))).normalize();
        grow(end, nd, len * 0.68, r * 0.62, depth - 1);
      }
    };
    grow(new Vector3(0, 0, 0), new Vector3(0, 1, 0), 1.3, 0.22, 3);
    // the flare where trunk meets soil: without it a tree is a pole pushed into
    // the ground, and that reads wrong even to someone who cannot say why
    const flare = new Mesh(new CylinderGeometry(0.23, 0.44, 0.34, 12), trunkMat);
    flare.position.y = 0.14; tree.add(flare);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + rr(0, 0.5);
      const rt = new Mesh(new CylinderGeometry(0.04, 0.1, 0.5, 6), trunkMat);
      rt.position.set(Math.cos(a) * 0.26, 0.06, Math.sin(a) * 0.26);
      rt.rotation.z = Math.cos(a) * 1.1; rt.rotation.x = -Math.sin(a) * 1.1; tree.add(rt);
    }
    // Leaf clumps, each a different size, tilt and green. Flat-shaded
    // icosahedra rather than 8-segment spheres: the facets are the style, and
    // they cost fewer triangles than the smooth balls they replace.
    const leaves = new InstancedMesh(new IcosahedronGeometry(0.3, 0), leafMat, tips.length);
    tree.add(leaves);
    const m4 = new Matrix4(), sv = new Vector3();
    tips.forEach((tp, i) => {
      const s = rr(0.82, 1.35);
      m4.makeRotationY(rr(0, 6.28)); m4.scale(sv.set(s * 1.15, s * 0.86, s * 1.15));
      m4.setPosition(tp.x, tp.y, tp.z);
      leaves.setMatrixAt(i, m4);
      leaves.setColorAt(i, leafCols.green.clone().offsetHSL(rr(-0.035, 0.035), rr(-0.06, 0.06), rr(-0.07, 0.07)));
    });
    if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
    let sun: Mesh | null = null; const o2: Mesh[] = [];
    if (v === 'photo') {
      sun = new Mesh(new SphereGeometry(0.5, 24, 18), std(GOLD, { emissive: GOLD, emissiveIntensity: 1 }));
      sun.position.set(2.6, 3.6, -1); root.add(sun);
      for (let i = 0; i < 10; i++) { const b = new Mesh(new SphereGeometry(0.08, 10, 8), glassy('#bfe9ff', 0.85)); root.add(b); o2.push(b); }
    }
    return { label: v === 'photo' ? 'সূর্যের আলো' : 'বড় হওয়া', groundY: GY, aim: { y: 0.35, eye: 1.2 }, update(t, dt, p) {
      if (v === 'photo') {
        const s = 0.3 + p; sun!.scale.setScalar(s);
        (sun!.material as MeshStandardMaterial).emissiveIntensity = 0.3 + p * 1.5;
        leafMat.color.copy(darken(leafCols.green, 0.4)).lerp(leafCols.green, p);
        o2.forEach((b, i) => { b.visible = i < p * 10; b.position.y += dt * 0.8; if (b.position.y > 3.2) { const tip = tips[i % tips.length]!; b.position.set(tip.x, tip.y + GY, tip.z); } });
        tree.rotation.z = Math.sin(t * 0.8) * 0.02;
      } else {
        const s = 0.08 + p * 0.92; tree.scale.setScalar(s);
        leaves.visible = p > 0.35; tree.rotation.z = Math.sin(t * 0.8) * 0.02 * s;
      }
    } };
  },

  flock({ root, hue, v }) {
    const N = 42; const bodies: { m: Mesh; ph: number; sp: number }[] = []; const cols = [hue, lighten(hue, 0.35), GOLD];
    for (let i = 0; i < N; i++) { const m = new Mesh(new ConeGeometry(0.12, 0.42, 6), std(cols[i % 3])); m.geometry.rotateX(Math.PI / 2); root.add(m); bodies.push({ m, ph: rnd(0, 6.28), sp: rnd(0.7, 1.3) }); }
    const dir = new Vector3(), prev = new Vector3();
    return { label: 'গতি', update(t, _dt, p) { bodies.forEach((b, i) => { const s = t * (0.3 + p * 0.9) * b.sp + b.ph; const x = Math.sin(s) * 2.8 + Math.sin(s * 2.1 + i) * 0.4, y = Math.sin(s * 1.3 + i) * 1.1 + (v === 'fish' ? -0.4 : 0.4), z = Math.cos(s) * 1.8; prev.copy(b.m.position); b.m.position.set(x, y, z); dir.subVectors(b.m.position, prev); if (dir.lengthSq() > 1e-6) b.m.lookAt(b.m.position.clone().add(dir)); }); } };
  },

  heart({ root, hue, v }) {
    let core: Mesh;
    if (v === 'breath') core = new Mesh(new SphereGeometry(1, 32, 32), std(hue, { transparent: true, opacity: 0.85 }));
    else { const s = new Shape(); s.moveTo(0, 0.6); s.bezierCurveTo(0, 1.2, -1.2, 1.2, -1.2, 0.4); s.bezierCurveTo(-1.2, -0.3, 0, -0.8, 0, -1.3); s.bezierCurveTo(0, -0.8, 1.2, -0.3, 1.2, 0.4); s.bezierCurveTo(1.2, 1.2, 0, 1.2, 0, 0.6); core = new Mesh(new ExtrudeGeometry(s, { depth: 0.6, bevelEnabled: true, bevelSize: 0.15, bevelThickness: 0.15, bevelSegments: 4 }), std('#d23b4b')); core.position.z = -0.3; }
    root.add(core); const halo = new Mesh(new SphereGeometry(1.6, 24, 24), glow(v === 'breath' ? hue : '#d23b4b', 0.12)); root.add(halo);
    return { label: v === 'breath' ? 'শ্বাসের গতি' : 'হৃৎস্পন্দন', update(t, _dt, p) { if (v === 'breath') { const s = 0.7 + 0.35 * (0.5 + 0.5 * Math.sin(t * (0.4 + p * 0.8))); core.scale.setScalar(s); halo.scale.setScalar(s * 1.05); } else { const bpm = 50 + p * 110; const beat = Math.pow(Math.max(0, Math.sin(t * bpm / 60 * Math.PI * 2)), 6); core.scale.setScalar(1 + beat * 0.14); halo.scale.setScalar(1 + beat * 0.3); (halo.material as MeshBasicMaterial).opacity = 0.05 + beat * 0.2; } } };
  },

  weather({ root, hue, v }) {
    const cloud = new Group(); cloud.position.y = 1.8; root.add(cloud); const cm = std('#e8eef4', { roughness: 1, flatShading: true });
    // Seeded, and two tiers: a flat grey base and puffier tops. A cloud read
    // from below is mostly a flat underside, and nine equal balls did not.
    const rw = srand(0x3c10);
    for (let i = 0; i < 11; i++) {
      const top = i > 5;
      const s = new Mesh(new SphereGeometry(rw(top ? 0.42 : 0.55, top ? 0.72 : 0.92), 16, 12), cm);
      s.position.set(rw(-1.65, 1.65), top ? rw(0.18, 0.5) : rw(-0.18, 0.06), rw(-0.5, 0.5));
      s.scale.y = top ? 0.85 : 0.55;
      cloud.add(s);
    }
    const N = 260; const arr = new Float32Array(N * 3); for (let i = 0; i < N; i++) { arr[i * 3] = rnd(-2, 2); arr[i * 3 + 1] = rnd(-2.5, 1.5); arr[i * 3 + 2] = rnd(-0.8, 0.8); }
    const rg = new BufferGeometry(); rg.setAttribute('position', new Float32BufferAttribute(arr, 3)); const rain = new Points(rg, new PointsMaterial({ color: lighten(hue, 0.3), size: 0.07, transparent: true, opacity: 0.9 })); root.add(rain);
    const bolt = new Line(new BufferGeometry().setFromPoints([new Vector3(0.2, 1.4, 0), new Vector3(-0.2, 0.6, 0), new Vector3(0.25, 0.2, 0), new Vector3(-0.15, -0.9, 0)]), new LineBasicMaterial({ color: '#fff3a0' })); bolt.visible = false; root.add(bolt);
    const flash = new PointLight('#fff3a0', 0, 8); flash.position.set(0, 1, 1); root.add(flash); let next = 2;
    // the rain resets at y = -2.5, so the ground sits just under that and the
    // drops land on something instead of vanishing in mid air
    return { label: 'ঝড়ের তীব্রতা', groundY: -2.55, aim: { y: 0.25, eye: 1.3 }, update(t, dt, p) {
      const pa = rg.attributes.position as Float32BufferAttribute; const n = Math.floor(N * (0.15 + p * 0.85)); for (let i = 0; i < N; i++) { let y = pa.getY(i) - dt * (2 + p * 6); if (y < -2.5) y = 1.5; pa.setY(i, i < n ? y : 99); } pa.needsUpdate = true;
      cloud.position.x = Math.sin(t * 0.3) * 0.3; cm.color.copy(new Color('#e8eef4')).lerp(new Color('#5b6675'), p * (v === 'storm' ? 1 : 0.7));
      if (t > next) { bolt.visible = true; flash.intensity = 6 * p; next = t + rnd(1.5, 5) / (0.2 + p); } else { flash.intensity *= 0.85; if (flash.intensity < 0.2) bolt.visible = false; }
    } };
  },

  terrain({ root, hue, v }) {
    const S = 8, seg = 70; const geo = new PlaneGeometry(S, S, seg, seg); geo.rotateX(-Math.PI / 2); const pos = geo.attributes.position as Float32BufferAttribute; const colors = new Float32Array(pos.count * 3); const c = new Color();
    const water = new Color('#2b7bd6'), sand = new Color('#d9c08a'), grass = new Color('#3e8e5a'), rock = new Color('#7a6a58'), snow = new Color('#f3f6f8');
    const paint = (p: number) => { for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i); let h = fbm2(x * 0.35 + 3, z * 0.35 + 7) * 2.6 - 1.1; if (v === 'farm') h = Math.sin(x * 3) * 0.08 + 0.1; if (v === 'delta') h = h * 0.4 - 0.15 + Math.max(0, Math.abs(Math.sin(x * 0.6 + z * 0.3)) - 0.7) * -1; h *= 0.4 + p * 1.2; pos.setY(i, h); c.copy(h < 0 ? water : h < 0.15 ? sand : h < 0.9 ? grass : h < 1.5 ? rock : snow); if (v === 'farm') c.copy(grass).lerp(new Color('#7bb661'), (Math.sin(x * 3) + 1) / 2); colors.set([c.r, c.g, c.b], i * 3); } pos.needsUpdate = true; geo.setAttribute('color', new Float32BufferAttribute(colors, 3)); geo.computeVertexNormals(); };
    paint(0.5); const m = new Mesh(geo, std('#fff', { vertexColors: true, flatShading: true, roughness: 0.95 })); m.position.y = -1; root.add(m);
    // Water that reflects. At roughness 0.78 the sea was the same matte
    // material as the hillside next to it, in a different colour; smooth and
    // faintly metallic, it picks up the sky and reads as water.
    const sea = new Mesh(new PlaneGeometry(S, S), std(water, { transparent: true, opacity: 0.72, roughness: 0.08, metalness: 0.3, envMapIntensity: 1.5 }));
    sea.rotation.x = -Math.PI / 2; sea.position.y = -1 + 0.01; root.add(sea);
    let last = 0.5;
    // The terrain is its own ground, so the shared shadow disc stays away:
    // two grounds a hair apart is exactly the z-fighting stripe that ruined
    // the collection scene before it got one ground instead of two.
    return { label: v === 'farm' ? 'ফসল' : 'উচ্চতা', aim: { y: -0.15, eye: 1.55 }, update(t, _dt, p) { if (Math.abs(p - last) > 0.01) { paint(p); last = p; } root.rotation.y += 0.0015; sea.position.y = -1 + 0.01 + Math.sin(t) * 0.02; } };
  },

  seasonwheel({ root, hue, v, font }) {
    const cols = ['#f0b429', '#3b82f6', '#9fd3e6', '#d9822b', '#cfd8e3', '#e88fb0']; const names = ['গ্রীষ্ম', 'বর্ষা', 'শরৎ', 'হেমন্ত', 'শীত', 'বসন্ত'];
    const fruits = ['🥭', '🍈', '🍌', '🥥', '🥕', '🍓'];
    const wheel = new Group(); wheel.rotation.x = 0.5; root.add(wheel);
    cols.forEach((c, i) => { const s = sector(2.6, (i / 6) * Math.PI * 2, Math.PI / 3, c, 0.2); wheel.add(s); const a = (i + 0.5) / 6 * Math.PI * 2; const sp = v === 'fruit' ? emojiSprite(fruits[i]!, 0.9) : textSprite(names[i]!, font, '#eef4fb', 1.1); sp.position.set(Math.cos(a) * 2, 0.4, -Math.sin(a) * 2); wheel.add(sp); });
    // a rim and a raised hub, so the wheel is a made object and not six flat
    // pie slices sharing an edge
    wheel.add(new Mesh(new TorusGeometry(2.61, 0.075, 8, 64), std('#f0f4f8', { roughness: 0.5 })).rotateX(Math.PI / 2));
    wheel.add(new Mesh(new CylinderGeometry(0.52, 0.6, 0.34, 36), std('#ffffff', { roughness: 0.45 })));
    wheel.add(new Mesh(new CylinderGeometry(0.2, 0.2, 0.42, 24), metal('#b6bec6')));
    // the marker that says which season is at the front right now
    const pointer = new Mesh(new ConeGeometry(0.22, 0.5, 4), std(GOLD, { roughness: 0.4, metalness: 0.4 }));
    pointer.position.set(0, 0.42, 2.95); pointer.rotation.x = Math.PI; root.add(pointer);
    return { label: 'ঋতু ঘোরাও', aim: { y: 0.05, eye: 1.45 }, update(t, _dt, p) { wheel.rotation.y += (p * Math.PI * 2 - wheel.rotation.y) * 0.08; wheel.rotation.z = 0.5 + Math.sin(t * 0.4) * 0.025; pointer.position.y = 0.42 + Math.sin(t * 2) * 0.04; } };
  },

  plate({ root, hue, v }) {
    void hue; void v;
    const plate = new Group(); plate.rotation.x = 0.55; root.add(plate);
    // a real plate: a well, a raised rim and a foot, rather than one disc
    plate.add(new Mesh(new CylinderGeometry(2.7, 2.45, 0.15, 56), std('#f4f6f8', { roughness: 0.42 })));
    plate.add(new Mesh(new TorusGeometry(2.68, 0.1, 8, 60), std('#e8ecf1', { roughness: 0.4 })).translateY(0.06).rotateX(Math.PI / 2));
    plate.add(new Mesh(new CylinderGeometry(1.6, 1.6, 0.06, 40), std('#eceff3', { roughness: 0.48 })).translateY(-0.12));
    const groups = [['#e6c87a', 'শর্করা', '🍚'], ['#d97b6c', 'আমিষ', '🐟'], ['#6fbf73', 'সবজি', '🥬'], ['#f0b429', 'ফল', '🍌'], ['#8fb9e8', 'দুধ', '🥛']];
    const secs = groups.map(([c, , e]) => { const s = sector(2.3, 0, 1, c!, 0.1); s.position.y = 0.12; plate.add(s); const sp = emojiSprite(e!, 0.8); sp.position.y = 0.6; plate.add(sp); return { s, sp }; });
    return { label: 'সুষম করো', groundY: -0.55, aim: { y: 0.1, eye: 1.45 }, update(t, _dt, p) {
      const w = [0.35 - p * 0.15, 0.2, 0.15 + p * 0.15, 0.15, 0.15]; const tot = w.reduce((a, b) => a + b); let start = 0;
      secs.forEach(({ s, sp }, i) => { const len = (w[i] / tot) * Math.PI * 2; s.geometry.dispose(); s.geometry = new CylinderGeometry(2.3, 2.3, 0.1, 48, 1, false, start, len); const a = start + len / 2; sp.position.set(Math.sin(a) * 1.5, 0.6, Math.cos(a) * 1.5); start += len; }); plate.rotation.y = t * 0.15;
    } };
  },

  blocks({ root, hue, v }) {
    const g = new Group(); root.add(g);
    // Bevelled, so a hundred-flat reads as a moulded block and not a raw
    // BoxGeometry. Every edge now carries a highlight, which is the whole
    // difference at this size.
    const cubeG = roundedBox(0.36, 0.36, 0.36, 0.045); const m4 = new Matrix4();
    if (v === 'wave') { const N = 12; const im = new InstancedMesh(cubeG, std(hue), N * N); g.add(im); return { label: 'ঢেউ', groundY: -1.05, aim: { y: 0.1, eye: 1.2 }, update(t, _dt, p) { for (let i = 0; i < N * N; i++) { const x = i % N - N / 2 + 0.5, z = Math.floor(i / N) - N / 2 + 0.5; const h = 0.5 + Math.sin(x * 0.6 + t * 2) * Math.cos(z * 0.6 * (0.5 + p) + t) * (0.5 + p); m4.makeScale(1, h * 3, 1); m4.setPosition(x * 0.4, h * 0.55 - 1, z * 0.4); im.setMatrixAt(i, m4); } im.instanceMatrix.needsUpdate = true; } }; }
    const GY = -1.715;   // the tray lip's underside, once the 0.85 scale below is applied
    const units = new InstancedMesh(cubeG, std(GOLD), 9),
      rods = new InstancedMesh(roundedBox(0.36, 3.6, 0.36, 0.045), std(hue), 9),
      flats = new InstancedMesh(roundedBox(3.6, 0.36, 3.6, 0.045), std(darken(hue, 0.3)), 9);
    /**
     * Centred on x, because the frame is what was cutting this scene in half.
     *
     * Hundreds, tens and ones are laid out left to right across nearly seven
     * units, and the stage only shows about five across: both ends were off
     * the edge of the picture. The group is shifted so its middle is the
     * middle of the shot, the tens are tucked closer to the hundreds, and
     * `dolly` steps the camera back far enough to hold the whole row.
     */
    g.add(units, rods, flats); g.position.set(-1.73, -1.6, 0);
    /**
     * Sized to the footprint the turntable actually sweeps.
     *
     * Hundreds, tens and ones run about 6.3 units across and the hundreds tray
     * is 4 units deep, so once the scene turns 45 degrees the diagonal is
     * nearer 7.5 - wider than the stage shows at any sane camera distance, and
     * both ends were off the edge of the picture for half of every rotation.
     * Centring fixed the left; this is what fixes the sweep.
     */
    g.scale.setScalar(0.85);
    /**
     * A tray under each denomination.
     *
     * The three heaps sat on nothing in a row, so a child had to be told which
     * pile was hundreds and which was ones. A sunk tray under each says
     * "this is a place" without a word of text, and gives the shadows
     * somewhere to land.
     */
    const tray = (x: number, z: number, w: number, d: number, c: Color | string) => {
      const t = rbox(c, w, 0.1, d, 0.05); t.position.set(x, -0.05, z); g.add(t);
      const lip = rbox(darken(new Color(c as string), 0.25), w + 0.1, 0.05, d + 0.1, 0.02); lip.position.set(x, -0.11, z); g.add(lip);
    };
    tray(0.5, 0, 4.1, 4.1, '#6d7680'); tray(3.3, 0, 2.0, 1.6, '#6d7680'); tray(3.3, 1.35, 1.6, 1.1, '#5d666f');
    return { label: 'সংখ্যা', groundY: GY, aim: { y: 0.1, z: 0.2, eye: 1.3, dolly: 1.3 }, update(t, _dt, p) {
      const n = Math.round(p * 999); const h = Math.floor(n / 100), tn = Math.floor(n / 10) % 10, u = n % 10;
      for (let i = 0; i < 9; i++) { flats.setMatrixAt(i, i < h ? m4.makeTranslation(0.5, i * 0.4 + 0.22, 0) : m4.makeScale(0, 0, 0)); rods.setMatrixAt(i, i < tn ? m4.makeTranslation(2.55 + i * 0.38, 1.84, 0) : m4.makeScale(0, 0, 0)); units.setMatrixAt(i, i < u ? m4.makeTranslation(2.85 + (i % 3) * 0.4, Math.floor(i / 3) * 0.4 + 0.22, 1.35) : m4.makeScale(0, 0, 0)); }
      flats.instanceMatrix.needsUpdate = rods.instanceMatrix.needsUpdate = units.instanceMatrix.needsUpdate = true;
      g.rotation.y = Math.sin(t * 0.35) * 0.05; g.position.y = -1.6 + Math.sin(t * 0.9) * 0.015; // idle sway - the stack never sits dead still
    } };
  },

  pie({ root, hue }) {
    const g = new Group(); g.rotation.x = 0.6; root.add(g); const n = 8; const secs: Mesh[] = [];
    // a dish under the pie, so the slices are lifted off something when they
    // come out rather than drifting away from an invisible centre
    const dish = new Mesh(new CylinderGeometry(2.65, 2.5, 0.12, 52), std('#e6e9ed', { roughness: 0.5 }));
    dish.position.y = -0.24; g.add(dish);
    g.add(new Mesh(new TorusGeometry(2.62, 0.07, 8, 52), std('#d2d7dd', { roughness: 0.45 })).translateY(-0.2).rotateX(Math.PI / 2));
    for (let i = 0; i < n; i++) { const s = sector(2.2, (i / n) * Math.PI * 2, Math.PI * 2 / n, i % 2 ? hue : lighten(hue, 0.3), 0.35); g.add(s); secs.push(s); }
    return { label: 'টুকরো নাও', update(t, _dt, p) { const k = Math.round(p * n); secs.forEach((s, i) => { const a = (i + 0.5) / n * Math.PI * 2; const out = i < k ? 0.45 : 0; s.position.set(Math.sin(a) * out, i < k ? 0.25 : 0, Math.cos(a) * out); }); g.rotation.y = t * 0.2; } };
  },

  shapes({ root, hue }) {
    const geos = [new BoxGeometry(1.6, 1.6, 1.6), new SphereGeometry(1, 40, 28), new ConeGeometry(1, 1.8, 40), new CylinderGeometry(0.8, 0.8, 1.8, 40), new TetrahedronGeometry(1.3), new OctahedronGeometry(1.2), new DodecahedronGeometry(1.1), new IcosahedronGeometry(1.1)];
    const ms = geos.map((gm, i) => { const m = new Mesh(gm, std(i % 2 ? hue : GOLD, { flatShading: i > 3 })); root.add(m); return m; });
    return { label: 'আকৃতি', update(t, _dt, p) { const sel = Math.min(ms.length - 1, Math.floor(p * ms.length)); ms.forEach((m, i) => { if (i === sel) { m.position.set(0, 0, 0); m.scale.setScalar(1.3); m.rotation.set(t * 0.4, t * 0.6, 0); } else { const a = (i / ms.length) * Math.PI * 2 + t * 0.15; m.position.set(Math.cos(a) * 3.1, Math.sin(a * 2) * 0.3, Math.sin(a) * 1.6); m.scale.setScalar(0.32); m.rotation.y = t; } }); } };
  },

  /** A balance that stands on the floor, with the pans hung on real cords. */
  scale({ root, hue }) {
    const GY = -2.2;
    const post = new Mesh(new CylinderGeometry(0.12, 0.18, 2.2, 20), std(darken(hue, 0.3)));
    post.position.y = -1.3; root.add(post);
    const foot = new Mesh(new CylinderGeometry(0.95, 1.05, 0.16, 36), std(darken(hue, 0.45)));
    foot.position.y = GY + 0.08; root.add(foot);
    root.add(new Mesh(new TorusGeometry(0.95, 0.06, 8, 40), std(darken(hue, 0.55))).translateY(GY + 0.14).rotateX(Math.PI / 2));
    // the knife edge the beam pivots on, which is what a balance actually has
    const knife = new Mesh(new ConeGeometry(0.2, 0.3, 4), metal('#9aa3ab')); knife.position.y = -0.32; root.add(knife);

    const beam = new Group(); beam.position.y = -0.2; root.add(beam);
    beam.add(new Mesh(roundedBox(4.6, 0.14, 0.3, 0.06), metal('#9aa3ab', { roughness: 0.42 })));
    const needle = new Mesh(roundedBox(0.07, 0.8, 0.07, 0.03), metal(GOLD, { roughness: 0.35 }));
    needle.position.y = 0.44; beam.add(needle);
    const pan = (x: number) => {
      const g = new Group(); g.position.x = x;
      const p = new Mesh(new CylinderGeometry(0.82, 0.72, 0.1, 32), metal(lighten(hue, 0.4), { roughness: 0.4, metalness: 0.5 }));
      p.position.y = -1.1; g.add(p);
      p.add(new Mesh(new TorusGeometry(0.8, 0.04, 8, 32), metal(lighten(hue, 0.25), { roughness: 0.4, metalness: 0.5 })).translateY(0.05).rotateX(Math.PI / 2));
      // three cords, not two struts: a pan hangs, it is not bolted on
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const cord = new Mesh(new CylinderGeometry(0.016, 0.016, 1.12, 6), std('#8f959c'));
        cord.position.set(Math.cos(a) * 0.34, -0.55, Math.sin(a) * 0.34);
        cord.rotation.z = -Math.cos(a) * 0.28; cord.rotation.x = Math.sin(a) * 0.28;
        g.add(cord);
      }
      beam.add(g); return { g, p };
    };
    const L = pan(-2), R = pan(2);
    const wL = rbox(GOLD, 0.6, 0.6, 0.6, 0.06); wL.position.y = -0.75; L.g.add(wL);
    const wR = rbox(hue, 0.6, 0.6, 0.6, 0.06); wR.position.y = -0.75; R.g.add(wR);
    return { label: 'ওজন', groundY: GY, aim: { y: -0.15, eye: 1.2 }, update(t, _dt, p) {
      const diff = p - 0.5; wR.scale.setScalar(0.6 + p * 0.9);
      const target = -diff * 0.5 + Math.sin(t * 1.1) * 0.015;
      beam.rotation.z += (target - beam.rotation.z) * 0.08;
      L.g.rotation.z = -beam.rotation.z; R.g.rotation.z = -beam.rotation.z;
    } };
  },

  coins({ root, hue, v }) {
    void v;
    const GY = -1.45;
    // thinner than the beaker's glass: a jar is wall, wall, base and rim deep,
    // and at 0.22 each those layers composited into a frosted white tube with
    // the coins barely showing through
    const jar = new Mesh(new CylinderGeometry(1.3, 1.1, 2.8, 40, 1, true), glassy('#d8ecf6', 0.14)); root.add(jar);
    const jarBase = new Mesh(new CylinderGeometry(1.11, 1.11, 0.1, 40), glassy('#d8ecf6', 0.3)); jarBase.position.y = -1.42; root.add(jarBase);
    const neck = new Mesh(new CylinderGeometry(1.16, 1.3, 0.22, 40, 1, true), glassy('#e6f4fb', 0.26)); neck.position.y = 1.5; root.add(neck);
    const lip = new Mesh(new TorusGeometry(1.17, 0.06, 8, 44), glassy('#eaf6fc', 0.42)); lip.position.y = 1.6; lip.rotation.x = Math.PI / 2; root.add(lip);
    const N = 40;
    const rc = srand(0x0c01);
    const coinG = new CylinderGeometry(0.42, 0.42, 0.08, 30);
    const im = new InstancedMesh(coinG, metal(GOLD, { roughness: 0.32 }), N); root.add(im);
    // a raised face on each coin: the rim is what makes a disc read as coinage
    const faceG = new CylinderGeometry(0.33, 0.33, 0.095, 26);
    const im2 = new InstancedMesh(faceG, metal(darken(GOLD, 0.22), { roughness: 0.4 }), N); root.add(im2);
    const m4 = new Matrix4(), tilt = new Matrix4();
    /**
     * Where each coin lands.
     *
     * The old slots were `x: (i % 3 - 1) * 0.75` and `z: ((i * 7) % 3 - 1) * 0.55`
     * - and since 7 is 1 modulo 3, that second expression is just `i % 3`
     * again. Both coordinates came from the same value, so all forty coins
     * landed on three spots along a diagonal and stacked into three tidy
     * columns: a coin sorter, not a piggy bank. These are scattered over the
     * floor of the jar, four to a layer, each tipped a little.
     */
    const slots = Array.from({ length: N }, (_, i) => {
      const a = rc(0, Math.PI * 2), r = Math.sqrt(rc(0, 1)) * 0.6;
      return { x: Math.cos(a) * r, z: Math.sin(a) * r, y: -1.32 + Math.floor(i / 4) * 0.13, r: rc(0, 6), tip: rc(-0.17, 0.17) };
    });
    const falling = new Map<number, number>();
    return { label: 'জমাও', groundY: GY, aim: { y: 0.05, eye: 1.1 }, update(t, dt, p) {
      const n = Math.round(p * N);
      for (let i = 0; i < N; i++) {
        const s = slots[i]!;
        if (i < n) { let y = falling.get(i); if (y === undefined) y = 2.5; y = Math.max(s.y, y - dt * 6); falling.set(i, y); m4.makeRotationY(s.r); m4.multiply(tilt.makeRotationX(s.tip)); m4.setPosition(s.x, y, s.z); }
        else { falling.delete(i); m4.makeScale(0, 0, 0); }
        im.setMatrixAt(i, m4); im2.setMatrixAt(i, m4);
      }
      im.instanceMatrix.needsUpdate = true; im2.instanceMatrix.needsUpdate = true;
      root.rotation.y = Math.sin(t * 0.3) * 0.25;
    } };
  },

  bars({ root, hue, v }) {
    const GY = -1.62, N = 7;
    const bars: Mesh[] = [];
    for (let i = 0; i < N; i++) {
      // a small bevel on purpose: these are scaled in y by up to 3.6, and a
      // generous one would stretch into a visible dome at the top of a tall bar
      const b = new Mesh(roundedBox(0.55, 1, 0.55, 0.032), std(i === N - 1 ? GOLD : hue));
      b.position.x = (i - N / 2 + 0.5) * 0.8; root.add(b); bars.push(b);
    }
    const plinth = rbox('#79838f', 6.3, 0.14, 1.25, 0.06); plinth.position.y = -1.55; root.add(plinth);
    /**
     * Gridlines behind the bars.
     *
     * Without them a growing bar chart is just boxes getting taller and there
     * is no way to see by how much. Four rules at a fixed height turn the same
     * animation into a reading.
     */
    const rule = std('#ffffff', { transparent: true, opacity: 0.16, roughness: 0.9 });
    for (let i = 1; i <= 4; i++) { const l = new Mesh(new BoxGeometry(6.1, 0.018, 0.018), rule); l.position.set(0, -1.48 + i * 0.85, -0.45); root.add(l); }
    return { label: v === 'compound' ? 'বছর' : 'বাড়ো', groundY: GY, aim: { y: 0.35, eye: 1.3 }, update(t, _dt, p) {
      bars.forEach((b, i) => {
        const h = v === 'compound' ? 0.3 + Math.pow(1 + p * 0.6, i) * 0.4 : 0.3 + (0.4 + Math.sin(i * 1.3) * 0.3) * p * 3.5;
        const hh = Math.min(h, 3.6) + Math.sin(t * 1.3 + i) * 0.025;
        b.scale.y += (hh - b.scale.y) * 0.1; b.position.y = -1.48 + b.scale.y / 2;
      });
    } };
  },

  rocket({ root, hue }) {
    const r = new Group(); root.add(r);
    r.add(new Mesh(new CylinderGeometry(0.4, 0.4, 2, 32), std('#f4f6f8', { roughness: 0.5 })));
    // the details that make a tube a rocket: a shoulder where the cone meets
    // the body, a painted band, a porthole, and a flared engine bell
    const nose = new Mesh(new ConeGeometry(0.4, 0.9, 32), std(hue)); nose.position.y = 1.45; r.add(nose);
    r.add(new Mesh(new TorusGeometry(0.4, 0.05, 8, 32), metal('#c4ccd4', { roughness: 0.4 })).translateY(1));
    r.add(new Mesh(new CylinderGeometry(0.415, 0.415, 0.28, 32), std(darken(hue, 0.2))).translateY(0.15));
    const port = new Mesh(new CylinderGeometry(0.15, 0.15, 0.1, 20), glassy('#9fd8ff', 0.6));
    port.rotation.x = Math.PI / 2; port.position.set(0, 0.62, 0.37); r.add(port);
    // a torus already lies in the xy plane, so it faces the same way as the port
    const portRing = new Mesh(new TorusGeometry(0.16, 0.035, 8, 22), metal('#c4ccd4', { roughness: 0.4 }));
    portRing.position.set(0, 0.62, 0.37); r.add(portRing);
    const bell = new Mesh(new CylinderGeometry(0.22, 0.36, 0.42, 26, 1, true), metal('#8d959e', { roughness: 0.45 }));
    bell.position.y = -1.18; r.add(bell);
    [0, 1, 2].forEach((i) => { const f = new Mesh(new BoxGeometry(0.08, 0.7, 0.6), std(hue)); const a = (i / 3) * Math.PI * 2; f.position.set(Math.cos(a) * 0.5, -0.8, Math.sin(a) * 0.5); f.rotation.y = -a; r.add(f); });
    const flame = new Mesh(new ConeGeometry(0.32, 1.2, 20), glow('#ff8c1a', 0.95)); flame.rotation.x = Math.PI; flame.position.y = -1.6; r.add(flame);
    const core = new Mesh(new ConeGeometry(0.17, 0.8, 16), glow('#ffe9a8', 0.95)); core.rotation.x = Math.PI; core.position.y = -1.45; r.add(core);
    const N = 120; const arr = new Float32Array(N * 3); const pg = new BufferGeometry(); pg.setAttribute('position', new Float32BufferAttribute(arr, 3)); const smoke = new Points(pg, new PointsMaterial({ color: '#c9ced4', size: 0.12, transparent: true, opacity: 0.7 })); root.add(smoke);
    return { label: 'জোর', update(t, dt, p) { r.position.y = -1 + p * 3 + Math.sin(t * 8) * 0.02 * p; r.rotation.z = Math.sin(t * 2) * 0.02; flame.scale.set(1, 0.6 + p * 1.4 + Math.random() * 0.3, 1); flame.visible = p > 0.05; core.scale.set(1, 0.6 + p * 1.5 + Math.random() * 0.25, 1); core.visible = p > 0.05; const pa = pg.attributes.position as Float32BufferAttribute; for (let i = 0; i < N; i++) { let y = pa.getY(i) - dt * 2; if (y < r.position.y - 4 || pa.getX(i) === 0) { y = r.position.y - 2; pa.setX(i, rnd(-0.3, 0.3)); pa.setZ(i, rnd(-0.3, 0.3)); } pa.setX(i, pa.getX(i) * 1.02); pa.setY(i, p > 0.05 ? y : 99); } pa.needsUpdate = true; } };
  },

  /**
   * The letter scenes - six categories, more than any other builder here.
   *
   * The chosen letter was a flat sprite hanging in the middle: a picture of a
   * letter, with no thickness, no shadow and nothing to turn. It is now a
   * moulded tile that catches the key light and rotates, which is the object a
   * child is actually being asked to look at. The ring stays as sprites,
   * because those have to stay readable from every angle.
   */
  letters({ root, hue, v, font }) {
    const set = v === 'en' ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') : v === 'words' ? ['মা', 'বাবা', 'বই', 'ফুল', 'পাখি', 'নদী', 'চাঁদ', 'ঘর', 'মাছ', 'গাছ'] : v === 'jukto' ? ['ক্ষ', 'জ্ঞ', 'ঙ্গ', 'ন্ত', 'স্থ', 'ষ্ট', 'ত্র', 'দ্ধ', 'ম্ব', 'শ্র'] : v === 'num' ? '০১২৩৪৫৬৭৮৯'.split('') : 'অআইঈউঊঋএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ'.split('');
    const N = Math.min(set.length, 26);
    const sps = set.slice(0, N).map((ch, i) => { const s = textSprite(ch, font, '#' + (i % 2 ? lighten(hue, 0.3).getHexString() : lighten(hue, 0.6).getHexString()), 1.1); root.add(s); return s; });

    /** The face of the tile: the glyph painted onto a texture, on both sides. */
    const faceTex = (ch: string) => {
      const c = document.createElement('canvas'); c.width = c.height = 512;
      const g = c.getContext('2d')!;
      g.fillStyle = '#' + lighten(hue, 0.78).getHexString(); g.fillRect(0, 0, 512, 512);
      g.font = `800 ${ch.length > 2 ? 190 : 330}px ${font}`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#' + darken(hue, 0.55).getHexString();
      g.fillText(ch, 256, 280);
      return new CanvasTexture(c);
    };
    const tile = new Group(); root.add(tile);
    const body = new Mesh(roundedBox(2.5, 2.5, 0.42, 0.16), std(lighten(hue, 0.62), { roughness: 0.62 }));
    tile.add(body);
    let tex = faceTex(set[0]!);
    const faceMat = new MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0 });
    const front = new Mesh(new PlaneGeometry(2.16, 2.16), faceMat); front.position.z = 0.215; tile.add(front);
    const backM = new Mesh(new PlaneGeometry(2.16, 2.16), faceMat); backM.position.z = -0.215; backM.rotation.y = Math.PI; tile.add(backM);
    let cur = 0;
    return { label: 'বর্ণ বাছো', groundY: -1.65, aim: { y: 0.15, eye: 1.25 }, update(t, _dt, p) {
      const sel = Math.min(N - 1, Math.floor(p * N));
      if (sel !== cur) { cur = sel; tex.dispose(); tex = faceTex(set[sel]!); faceMat.map = tex; faceMat.needsUpdate = true; }
      sps.forEach((s, i) => { const a = (i / N) * Math.PI * 2 + t * 0.12; s.position.set(Math.cos(a) * 3.2, Math.sin(a * 3 + t) * 0.5, Math.sin(a) * 1.5); s.scale.setScalar(i === sel ? 0.2 : 1.1); });
      tile.position.y = Math.sin(t * 1.2) * 0.12;
      // a slow rock rather than a full turn, so the glyph is never edge-on
      tile.rotation.y = Math.sin(t * 0.5) * 0.42;
      tile.rotation.z = Math.sin(t * 0.7) * 0.03;
    } };
  },

  /**
   * Faces, for the four categories about feelings.
   *
   * This was a gold ball with two black balls, a black stick over each and half
   * a torus for a mouth - the drawing a five-year-old makes, which is a strange
   * thing to put in front of a five-year-old and call a face. Now it is a bust:
   * head, jaw, hair, ears, nose, eyes with sclera, iris, pupil and a lid that
   * blinks, and shoulders that stand it on the ground.
   */
  face({ root, v }) {
    const GY = -2.3;
    // not quite black: a true-black mass loses all its form under ACES and the
    // head reads as a silhouette with a face stuck on it
    const skin = new Color('#e0aa80'), hair = new Color('#3a2c20');
    const skinMat = std(skin, { roughness: 0.74 }), hairMat = std(hair, { roughness: 0.95 });
    const mk = (x: number, shirt: string) => {
      const g = new Group(); g.position.set(x, 0.35, 0); root.add(g);
      const head = new Mesh(new SphereGeometry(1.2, 40, 30), skinMat); head.scale.set(0.94, 1.05, 0.92); g.add(head);
      // a jaw, narrower than the cranium: the single change that stops a head being a ball
      const jaw = new Mesh(new SphereGeometry(0.95, 28, 22), skinMat); jaw.position.set(0, -0.5, 0.07); jaw.scale.set(0.9, 0.78, 0.9); g.add(jaw);
      /**
       * Hair in two pieces: a crown that stops above the brow, and a back half
       * that comes down past the ear.
       *
       * A single cap covering 99 degrees from the crown came down over the
       * brow and buried both eyes - in the one scene whose whole subject is
       * the expression. A whole sphere a little larger than the skull was
       * worse: the face only showed through the small lens where the head
       * poked out of it. Splitting the two jobs is what makes both work, and
       * the crown flares a little wider than the skull so the hair has volume.
       *
       * (three's sphere sweeps `phi` horizontally from the -x axis, so the
       * rear half is phi in [PI, 2PI], and `theta` runs down from the crown.)
       */
      const crown = new Mesh(new SphereGeometry(1.27, 34, 18, 0, Math.PI * 2, 0, Math.PI * 0.27), hairMat);
      crown.position.set(0, 0, -0.04); crown.scale.set(1, 1.03, 1); g.add(crown);
      const back = new Mesh(new SphereGeometry(1.26, 26, 20, Math.PI, Math.PI, 0, Math.PI * 0.62), hairMat);
      back.position.set(0, 0, -0.04); back.scale.set(1, 1.03, 0.99); g.add(back);
      for (const s of [-1, 1]) { const ear = new Mesh(new SphereGeometry(0.21, 16, 12), skinMat); ear.position.set(s * 1.08, -0.1, 0.02); ear.scale.set(0.45, 1, 0.66); g.add(ear); }
      const nose = new Mesh(new SphereGeometry(0.2, 18, 14), skinMat); nose.position.set(0, -0.12, 1.08); nose.scale.set(0.8, 1.1, 1.05); g.add(nose);
      /**
       * The eye sits on the face, not in it.
       *
       * A round eyeball centred at z 0.9 was almost entirely inside the skull:
       * the cheek ellipsoid crosses z = 0.995 at that spot, so all that
       * emerged was a white speck a few pixels across, and the face read as
       * having no eyes at all. Flattened front-to-back and pushed out to
       * z = 1.0, better than half of it clears the surface across its whole
       * width, which is the usual way a stylised face is built.
       */
      const eye = (dx: number) => {
        const e = new Group(); e.position.set(dx, 0.28, 1.0); g.add(e);
        const ball = new Group(); e.add(ball);
        const white = new Mesh(new SphereGeometry(0.24, 26, 18), std('#fbfdff', { roughness: 0.22 })); white.scale.set(1, 0.88, 0.45); ball.add(white);
        /**
         * Iris and pupil are flat discs in front of the eyeball, not small
         * spheres inside it.
         *
         * A sphere placed on another sphere's surface only clears it at the
         * very centre: the host surface curves away, so at the iris's own edge
         * the eyeball had already come forward past it and swallowed it. What
         * rendered was a dark pinprick, and the face read as having no eyes at
         * all - which is why it took three passes to see. A flat disc past the
         * eyeball's frontmost point cannot intersect it at any radius.
         */
        const iris = new Mesh(new CircleGeometry(0.115, 26), std('#4a3524', { roughness: 0.3 })); iris.position.z = 0.113; ball.add(iris);
        const pupil = new Mesh(new CircleGeometry(0.055, 20), std('#130d07', { roughness: 0.2 })); pupil.position.z = 0.118; ball.add(pupil);
        // the catchlight, which is most of what makes an eye look alive
        const spark = new Mesh(new CircleGeometry(0.03, 12), new MeshBasicMaterial({ color: '#ffffff' }));
        spark.position.set(-0.04, 0.045, 0.122); ball.add(spark);
        // the top quarter only: a lid shades the eye, it does not cover it
        const lid = new Mesh(new SphereGeometry(0.252, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.34), skinMat);
        lid.scale.set(1, 0.92, 0.5); lid.position.y = 0.06; e.add(lid);
        const brow = new Mesh(roundedBox(0.46, 0.1, 0.1, 0.04), hairMat); brow.position.set(0, 0.32, 0.06); e.add(brow);
        return { ball, lid, brow };
      };
      const L = eye(-0.42), R = eye(0.42);
      const mouth = new Mesh(new TorusGeometry(0.4, 0.075, 10, 26, Math.PI), std('#9b4a41', { roughness: 0.5 }));
      mouth.position.set(0, -0.44, 0.98); mouth.rotation.z = Math.PI; g.add(mouth);
      // a neck and the top of a shoulder line, cropped like a portrait: a full
      // torso doubled the height of the scene for a subject that is the face
      const neck = new Mesh(new CylinderGeometry(0.36, 0.44, 0.7, 22), skinMat); neck.position.y = -1.36; g.add(neck);
      const body = new Mesh(new SphereGeometry(1, 28, 20), std(shirt, { roughness: 0.9 }));
      body.position.y = -2.0; body.scale.set(1.45, 0.62, 1.05); g.add(body);
      return { g, L, R, mouth };
    };
    const faces = v === 'pair' ? [mk(-1.6, '#4a7ba8'), mk(1.6, '#b5654a')] : [mk(0, '#4a7ba8')];
    if (v === 'pair') { faces[0]!.g.rotation.y = 0.42; faces[1]!.g.rotation.y = -0.42; }
    /**
     * A low, almost level eye line.
     *
     * At eye 0.55 the camera sat above the head's centre and looked down on
     * it, which foreshortens the forehead to nothing and hands most of the
     * frame to the crown - the face was mostly hair before a single strand
     * was drawn wrong. Standing at 0.1 and looking slightly up puts the
     * viewer in front of the person instead of over them.
     */
    return { label: 'মেজাজ', groundY: GY, aim: { y: -0.3, eye: 0.1, dolly: v === 'pair' ? 1.1 : 0.95 }, update(t, _dt, p) {
      faces.forEach((f, k) => {
        const mood = v === 'pair' && k === 1 ? 1 - p : p;
        /**
         * One number drives the whole expression: −1 miserable, +1 delighted.
         *
         * The mouth used to be rotated by `PI * (1 - mood)`, which drew a frown
         * at maximum happiness and a smile at zero - the slider ran backwards
         * for the whole scene - and passed through a sideways bracket at the
         * halfway point. Flipping it by the sign of a scale instead gives a
         * real flat mouth in the middle and never a rotated one.
         */
        const kk = (mood - 0.5) * 2;
        const bend = Math.max(0.13, Math.abs(kk));
        f.mouth.scale.set(0.72 + Math.abs(kk) * 0.45, bend * (kk < 0 ? -1 : 1), 1);
        f.mouth.position.y = -0.4 - (1 - mood) * 0.14;
        f.L.brow.rotation.z = kk * 0.32; f.R.brow.rotation.z = -kk * 0.32;
        f.L.brow.position.y = f.R.brow.position.y = 0.34 + kk * 0.05;
        // the lids come down when the mood does, which is most of what reads as sad
        const droop = Math.max(0, -kk) * 0.5;
        f.L.lid.rotation.x = f.R.lid.rotation.x = -droop;
        const blink = ((t + k * 1.7) % 4.2) < 0.13;
        f.L.ball.scale.y = f.R.ball.scale.y = blink ? 0.08 : 1;
        f.g.rotation.z = Math.sin(t * 1.3 + k) * 0.04;
        f.g.position.y = 0.35 + Math.sin(t * 0.9 + k) * 0.02;
      });
    } };
  },

  shield({ root, hue }) {
    const hex = new Mesh(new CylinderGeometry(1.9, 1.9, 0.3, 6), std(hue, { transparent: true, opacity: 0.5, roughness: 0.25, metalness: 0.35 }));
    hex.rotation.x = Math.PI / 2; root.add(hex);
    // a raised border on the plate, so it reads as a shield and not a tinted tile
    const edge = new Mesh(new CylinderGeometry(1.95, 1.95, 0.36, 6, 1, true), metal(lighten(hue, 0.3), { roughness: 0.35 }));
    edge.rotation.x = Math.PI / 2; root.add(edge);
    const core = new Mesh(new SphereGeometry(0.8, 32, 24), std(GOLD, { emissive: GOLD, emissiveIntensity: 0.4 })); root.add(core);
    const rings = [1.2, 1.5].map((r) => { const m = ring(r + 0.03, r - 0.03, lighten(hue, 0.4), { roughness: 0.3, metalness: 0.5 }); root.add(m); return m; });
    return { label: 'সুরক্ষা', update(t, _dt, p) { hex.rotation.z = t * 0.2; edge.rotation.z = t * 0.2; rings.forEach((r, i) => { r.rotation.x = t * (0.5 + i * 0.3); r.rotation.y = t * 0.4; r.visible = p > i * 0.4; }); (core.material as MeshStandardMaterial).emissiveIntensity = 0.2 + p; core.scale.setScalar(0.8 + p * 0.3); } };
  },

  clock({ root, hue }) {
    const g = new Group(); root.add(g);
    // a case with a bezel and a glass over the dial, rather than a bare disc
    g.add(new Mesh(new CylinderGeometry(2.2, 2.2, 0.2, 56), std('#f4f6f8', { roughness: 0.5 })));
    g.add(new Mesh(new CylinderGeometry(2.35, 2.3, 0.42, 56, 1, true), metal('#aab2bb', { roughness: 0.36 })));
    g.add(new Mesh(new CylinderGeometry(2.22, 2.22, 0.03, 56), glassy('#e8f3fa', 0.16)).translateY(0.25));
    g.rotation.x = Math.PI / 2;
    for (let i = 0; i < 12; i++) { const t = new Mesh(roundedBox(0.1, 0.06, i % 3 ? 0.25 : 0.4, 0.025), std(i % 3 ? '#8a8f96' : hue)); const a = (i / 12) * Math.PI * 2; t.position.set(Math.sin(a) * 1.85, 0.13, -Math.cos(a) * 1.85); t.rotation.y = -a; g.add(t); }
    const hand = (len: number, w: number, c: Color | string, thin = false) => {
      const h = new Group();
      const mat = () => (thin ? metal(c, { roughness: 0.35 }) : std(c));
      const m = new Mesh(roundedBox(w, 0.06, len, 0.02), mat()); m.position.z = -len / 2; h.add(m);
      // a counterweight past the pivot, which every real hand has and which is
      // what stops the three of them reading as loose splinters
      const tail = new Mesh(roundedBox(w * 0.85, 0.055, len * 0.22, 0.02), mat()); tail.position.z = len * 0.11; h.add(tail);
      h.position.y = 0.2; g.add(h); return h;
    };
    const hr = hand(1.0, 0.14, hue), mn = hand(1.5, 0.1, darken(hue, 0.3)), sc = hand(1.7, 0.04, GOLD, true);
    g.add(new Mesh(new CylinderGeometry(0.11, 0.11, 0.48, 20), metal('#8d959e')).translateY(0.2));
    return { label: 'সময়', aim: { y: 0.05, eye: 1.25 }, update(t, _dt, p) { const hours = p * 12; hr.rotation.y = -hours / 12 * Math.PI * 2; mn.rotation.y = -(hours % 1) * Math.PI * 2; sc.rotation.y = -t * 0.5; } };
  },

  /**
   * The Shaheed Minar.
   *
   * The flanking columns used to bend *away* from the centre. Their inward
   * lean toward the tallest column is the one thing about this monument's
   * silhouette that everyone in the country can draw from memory, and getting
   * it backwards is the sort of mistake that is invisible in code review and
   * obvious to every single visitor. It now also stands on the stepped plinth
   * it actually has, rather than one slab.
   */
  minar({ root, hue }) {
    void hue;
    const GY = -1.86;
    const g = new Group(); root.add(g);
    const white = std('#f2f5f8', { roughness: 0.7 });
    // `lean` is +1 for a column standing left of centre, which bends right
    const col = (x: number, h: number, lean: number) => {
      const m = new Mesh(roundedBox(0.45, h, 0.4, 0.035), white);
      m.position.set(x, h / 2 - 1.3, 0); g.add(m);
      const top = new Mesh(roundedBox(0.45, 0.95, 0.4, 0.035), white);
      const a = -lean * 0.42;
      top.position.set(x + Math.sin(-a) * 0.47, h - 1.3 + Math.cos(a) * 0.45, 0);
      top.rotation.z = a; g.add(top);
    };
    col(0, 3.4, 0); col(-1.12, 2.5, 1); col(1.12, 2.5, -1); col(-2.12, 1.85, 1); col(2.12, 1.85, -1);
    const step = (w: number, d: number, y: number, c: string) => { const s = rbox(c, w, 0.22, d, 0.03); s.position.set(0, y, 0); g.add(s); };
    step(5.9, 2.5, -1.41, '#dfe4ea'); step(6.5, 3.0, -1.63, '#d3d9e0'); step(7.1, 3.5, -1.85, '#c7cdd5');
    const sun = new Mesh(new CircleGeometry(1.1, 56), glow('#d23b4b', 0.95)); sun.position.set(0, 1.4, -0.95); g.add(sun);
    return { label: 'ঘোরাও', groundY: GY, aim: { y: 0.35, eye: 1.2 }, update(t, _dt, p) { g.rotation.y = (p - 0.5) * 1.2 + Math.sin(t * 0.4) * 0.05; sun.position.y = 1.2 + p * 0.6; } };
  },

  earth({ root, hue }) {
    void hue;
    const geo = new SphereGeometry(1.9, 64, 48); const pos = geo.attributes.position; const colors = new Float32Array(pos.count * 3);
    const sea = new Color('#1c5fb8'), shelf = new Color('#2f7fc9'), land = new Color('#3f9a4a'), arid = new Color('#9c8a52'), c = new Color();
    for (let i = 0; i < pos.count; i++) {
      const n = fbm2(pos.getX(i) * 1.3 + 9, pos.getY(i) * 1.3 + pos.getZ(i) * 0.9);
      // four bands rather than two: coasts get a shelf and the land gets dry
      // ground, where a two-colour globe reads as a beach ball
      c.copy(n > 0.62 ? arid : n > 0.52 ? land : n > 0.48 ? shelf : sea);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
    const globe = new Mesh(geo, std('#fff', { vertexColors: true, roughness: 0.86 })); root.add(globe);
    // the atmosphere: a shell lit from the inside, so it only shows at the rim
    const air = new Mesh(new SphereGeometry(2.02, 40, 28), new MeshBasicMaterial({ color: '#8fc4f0', transparent: true, opacity: 0.16, side: BackSide, depthWrite: false }));
    root.add(air);
    const haze = new Mesh(new SphereGeometry(2.06, 32, 24), glow('#6b6b6b', 0)); root.add(haze);
    return { label: 'দূষণ', update(t, _dt, p) { globe.rotation.y = t * 0.15; haze.rotation.y = t * 0.1; (haze.material as MeshBasicMaterial).opacity = p * 0.6; (globe.material as MeshStandardMaterial).color.copy(WHITE).lerp(new Color('#9a8f80'), p * 0.5); } };
  },
};

/* ---------- engine ---------- */
export type HeroHandle = {
  set(spec: HeroSpec): string;
  /** Put the category's items around the model as clickable badges. `active` is highlighted. */
  setItems(items: HeroItem[], active: number): void;
  /** Bring one item to the front and light it up. */
  focus(i: number): void;
  setParam(v: number): void;
  /** Start or stop the idle turntable. Dragging works either way. */
  setAuto(on: boolean): void;
  isAuto(): boolean;
  /**
   * Pull the model apart, 0 whole to 1 fully exploded. Every scene supports
   * this: the engine moves the model's own parts outward, and the item badges
   * pinned to those parts ride along.
   */
  setExplode(v: number): void;
  /** Ease the model back to its default orientation. */
  resetView(): void;
  /** Where badge `i` currently sits on the canvas, in CSS pixels from the host's top-left. */
  badgeAt(i: number): { x: number; y: number } | null;
  destroy(): void;
};

export function mountHero(
  host: HTMLElement,
  spec: HeroSpec,
  onFrame?: (info: { yawDeg: number; auto: boolean }) => void,
  onPick?: (index: number) => void,
): HeroHandle {
  const canvas = host.querySelector('canvas')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const font = getComputedStyle(document.body).fontFamily;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const scene = new Scene();
  // A slightly longer lens and a lower eye line. 42mm from up at 1.9 was a
  // grown-up looking down at a diorama; this stands the viewer in front of the
  // thing instead, which is most of why it now reads as a place.
  const camera = new PerspectiveCamera(36, 1, 0.1, 100); camera.position.set(0, 1.35, 6.4);
  /** The scene's own framing, or the default one object at the origin. */
  // `dolly` pulls the camera in for scenes whose badges are pinned on the
  // model rather than orbiting it: the default distance exists to clear that
  // ring, and a scene without one should not be framed as if it had one.
  let aimY = 0.1, aimZ = 0, eyeY = 1.35, dolly = 1;
  /**
   * Badges and labels are sprites measured in world units, so pulling the
   * camera in for a close scene magnifies them along with everything else -
   * and a name tag is not part of the scenery, it should hold the same size
   * on screen wherever the camera stands. Scaling them by the dolly keeps
   * the angle they subtend constant.
   */
  const sprK = () => dolly;
  // `resize` reads `w` and `camZBase`, which are declared far below this, so
  // the first build cannot call it: that is a dead-zone throw, not a type
  // error, and it takes the whole scene out. The initial resize runs on its
  // own a moment later; every later scene change goes through this flag.
  let framed = false;
  const aimCamera = () => { camera.position.y = eyeY; camera.lookAt(0, aimY, aimZ); };
  aimCamera();
  // Shadows, filmic tone mapping, a sky/ground environment and fog. See
  // render.ts for why those four and not a pile of downloaded models.
  const stage = dressScene(renderer, scene, { groundY: -0.56, radius: 4.2 });
  scene.add(stage.ground);
  const user = new Group(); scene.add(user); let root = new Group(); user.add(root);
  let cur: SceneObj | null = null, param = spec.p ?? 0.5, popStart = performance.now();

  /* ---- the item orbit: every item of the category as a badge around the model ---- */
  const ORBIT_R = 3.05;
  const orbit = new Group(); user.add(orbit);
  let badges: { sp: Sprite; label: Sprite; a0: number; marker?: Object3D }[] = [];
  const pins = new Group(); user.add(pins);
  let anchoredCount = 0;
  // the model sits half size inside a ring of badges, full size when the badges are pinned on it
  let baseScale = 1, pinScale = 0.55;
  let active = -1, orbitYawTo = 0, orbitYaw = 0, hueNow = new Color(spec.hue);
  function clearItems() {
    for (const b of badges) { b.sp.material.map?.dispose(); b.sp.material.dispose(); b.label.material.map?.dispose(); b.label.material.dispose(); }
    orbit.clear(); pins.clear(); badges = []; anchoredCount = 0;
  }
  function setItems(items: HeroItem[], act: number) {
    clearItems();
    const n = items.length;
    // A scene may name its own parts, and then each badge lands on the part it
    // is actually about. Where it does not, the engine spreads the badges over
    // the model's own pieces, so every category reads the same way.
    const named = cur?.anchors ?? {};
    collectParts(n);
    const generic = genericAnchors(n);
    // pinned badges shrink as a model carries more of them, so fourteen organs do not bury the figure
    pinScale = MathUtils.clamp(0.66 - n * 0.018, 0.4, 0.55);
    badges = items.map((it, i) => {
      const sp = badgeSprite(it, hueNow, font); const label = labelSprite(it.label, font);
      const a0 = (i / Math.max(1, n)) * Math.PI * 2;
      const marker = named[it.label] ?? generic[i];
      // Start at the resting size rather than easing down to it: the frame
      // loop stops while the tab is in the background, so a scene loaded out
      // of view would be frozen mid-transition when the visitor arrives.
      if (marker) { anchoredCount++; sp.scale.setScalar(pinScale * 0.72 * dolly); pins.add(sp); pins.add(label); }
      else { sp.scale.setScalar(0.85); orbit.add(sp); orbit.add(label); }
      return { sp, label, a0, marker };
    });
    // when the items live on the model, the model stays full size; otherwise it
    // sits smaller in the middle of the ring
    baseScale = n && anchoredCount < n / 2 ? 0.5 : 1;
    focus(act);
  }
  function focus(i: number) {
    active = i;
    if (i < 0 || !badges[i] || badges[i]!.marker) return;
    // turn the ring so the chosen badge comes to the front (toward the camera, +z)
    orbitYawTo = Math.PI / 2 - badges[i]!.a0;
    // keep the shortest turn
    while (orbitYawTo - orbitYaw > Math.PI) orbitYawTo -= Math.PI * 2;
    while (orbitYawTo - orbitYaw < -Math.PI) orbitYawTo += Math.PI * 2;
  }
  const ray = new Raycaster(), ndc = new Vector2();
  function pick(clientX: number, clientY: number): number {
    if (!badges.length) return -1;
    const r = host.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(badges.map((b) => b.sp), false)[0];
    if (hit) { /* nearest sprite wins */ }
    return hit ? badges.findIndex((b) => b.sp === hit.object) : -1;
  }

  /* ---- the exploded view, for any scene ----
   * A scene does not have to know how to come apart. After it is built the
   * engine walks its own objects, wraps each one in a group that nothing else
   * touches, and slides those groups outward along the direction each part
   * already sits in. The scene keeps animating inside its wrapper, so the
   * explode never fights the scene's own motion.
   */
  type Part = { wrap: Group; dir: Vector3; centre: Vector3; radius: number; obj: Object3D };
  let parts: Part[] = [];
  let spread = 1, explodeTo = 0, explodeNow = 0;
  const boxTmp = new Box3(), sphTmp = new Sphere(), vTmp = new Vector3();
  /** Model centre and radius, measured once with the view transforms neutral. */
  let modelCentre = new Vector3(), modelRadius = 1;
  /**
   * Measure and wrap the scene's parts. The user's turntable rotation and the
   * pop-in scale are both parked first: measuring through them would read a
   * moving, and at the first frame a zero-sized, model.
   */
  function collectParts(want: number) {
    parts = [];
    const keepRot = user.rotation.clone(), keepPos = user.position.clone(), keepScale = root.scale.clone();
    user.rotation.set(0, 0, 0); user.position.set(0, 0, 0); root.scale.setScalar(1);
    root.updateMatrixWorld(true);
    try {
      // start from the scene's own top-level objects, splitting groups until
      // there are enough distinct pieces to carry the category's items
      let nodes: Object3D[] = root.children.filter((c) => !(c as { isLight?: boolean }).isLight);
      for (let pass = 0; pass < 3 && nodes.length < want; pass++) {
        const next: Object3D[] = [];
        for (const n of nodes) next.push(...(n.children.length > 1 ? n.children : [n]));
        if (next.length <= nodes.length) break;
        nodes = next;
      }
      boxTmp.setFromObject(root);
      if (boxTmp.isEmpty()) return;
      boxTmp.getBoundingSphere(sphTmp);
      modelCentre = sphTmp.center.clone(); modelRadius = Math.max(0.4, sphTmp.radius);
      spread = modelRadius * 0.5;
      for (const n of nodes) {
        const parent = n.parent;
        if (!parent) continue;
        boxTmp.setFromObject(n);
        if (boxTmp.isEmpty()) continue;
        const centre = boxTmp.getCenter(new Vector3());
        const radius = Math.max(0.08, boxTmp.getSize(vTmp).length() * 0.3);
        // the direction to fly out along, expressed where the wrapper lives
        const here = parent.worldToLocal(centre.clone());
        const hub = parent.worldToLocal(modelCentre.clone());
        const dir = here.sub(hub);
        // a part sitting dead centre has no direction of its own, so send it up
        if (dir.lengthSq() < 1e-4) dir.set(0, 1, 0); else dir.normalize();
        const wrap = new Group();
        parent.add(wrap); wrap.add(n);
        parts.push({ wrap, dir, centre, radius, obj: n });
      }
    } finally {
      user.rotation.copy(keepRot); user.position.copy(keepPos); root.scale.copy(keepScale);
      root.updateMatrixWorld(true);
    }
  }
  /**
   * One marker per item when the scene names none of its own. The markers sit
   * on an even spiral over the model's own surface and each attaches to the
   * nearest piece, so they read as pins on the thing and travel with it when
   * the model comes apart.
   */
  function genericAnchors(n: number): Object3D[] {
    if (!parts.length || !n) return [];
    const keepRot = user.rotation.clone(), keepPos = user.position.clone(), keepScale = root.scale.clone();
    user.rotation.set(0, 0, 0); user.position.set(0, 0, 0); root.scale.setScalar(1);
    root.updateMatrixWorld(true);
    const out: Object3D[] = [];
    try {
      for (let i = 0; i < n; i++) {
        // a Fibonacci spiral: n points spaced as evenly as a sphere allows
        const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const th = i * 2.399963;
        const at = new Vector3(Math.cos(th) * r, y, Math.sin(th) * r)
          .multiplyScalar(modelRadius * 0.92).add(modelCentre);
        // hang it off whichever piece of the model it is closest to
        let best = parts[0]!, bestD = Infinity;
        for (const p of parts) { const d = p.centre.distanceToSquared(at); if (d < bestD) { bestD = d; best = p; } }
        const m = new Object3D();
        m.position.copy(best.obj.worldToLocal(at.clone()));
        best.obj.add(m);
        out.push(m);
      }
    } finally {
      user.rotation.copy(keepRot); user.position.copy(keepPos); root.scale.copy(keepScale);
      root.updateMatrixWorld(true);
    }
    return out;
  }

  function build(s: HeroSpec) {
    root.traverse((o) => { const m = o as Mesh; if (!m.geometry?.userData?.shared) m.geometry?.dispose?.(); const mats = Array.isArray(m.material) ? m.material : [m.material]; mats.forEach((mt) => { (mt as MeshStandardMaterial)?.map?.dispose?.(); mt?.dispose?.(); }); });
    user.remove(root); root = new Group(); user.add(root); parts = [];
    hueNow = new Color(s.hue);
    const builder = SCENES[s.type] ?? SCENES.atom; cur = builder({ root, hue: hueNow, v: s.v ?? '', font, figures: s.figures ?? [] }); param = s.p ?? 0.5; popStart = performance.now();
    // One call after the scene is built, rather than a flag inside ninety
    // builders that a ninety-first would forget.
    castShadows(root);
    // The ground belongs to the world, not to the model, so it sits outside
    // the turntable group: the figures turn on it and their shadows sweep
    // across it, which is what the eye expects. A floating scene gets none.
    stage.ground.visible = cur.groundY !== undefined;
    if (cur.groundY !== undefined) stage.ground.position.y = cur.groundY;
    aimY = cur.aim?.y ?? 0.1; aimZ = cur.aim?.z ?? 0; eyeY = cur.aim?.eye ?? 1.35; dolly = cur.aim?.dolly ?? 1;
    if (framed) resize(); else aimCamera();
    return cur.label;
  }
  const firstLabel = build(spec);

  const IDLE_YAW = 0.22; // rad/s - a full turn every ~28s: enough to read as alive within a glance, never dizzying
  let dragging = false, lx = 0, ly = 0, vx = 0, vy = 0, yaw = 0, pitch = 0;
  // The turntable is a switchable camera behaviour, not decoration: visitors who
  // ask for reduced motion start still, and anyone can pause or reset it.
  let auto = !reduced, yawTo: number | null = null;
  const yawDeg = () => { const d = ((yaw * 180) / Math.PI) % 360; return d < 0 ? d + 360 : d; };
  let downX = 0, downY = 0;
  host.addEventListener('pointerdown', (e) => { dragging = true; yawTo = null; lx = e.clientX; ly = e.clientY; downX = e.clientX; downY = e.clientY; vx = vy = 0; host.setPointerCapture(e.pointerId); host.classList.add('dragging'); });
  host.addEventListener('pointerup', (e) => {
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;   // that was a drag, not a click
    const i = pick(e.clientX, e.clientY);
    if (i >= 0) { focus(i); onPick?.(i); }
  });
  host.addEventListener('pointermove', (e) => { if (!dragging) return; vx = (e.clientX - lx) * 0.006; vy = (e.clientY - ly) * 0.006; lx = e.clientX; ly = e.clientY; yaw += vx; pitch = MathUtils.clamp(pitch + vy, -0.8, 0.8); });
  const up = () => { dragging = false; host.classList.remove('dragging'); }; host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);

  let w = 1, h = 1, visible = true, raf = 0, last = performance.now(), t = 0;
  let camZBase = 6.2;
  function resize() { const r = host.getBoundingClientRect(); w = Math.max(1, r.width); h = Math.max(1, r.height); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); camZBase = ((w < 600 ? 7.4 : 6.2) + (badges.length ? (anchoredCount ? 1.2 : 1.9) : 0)) * dolly; camera.position.z = camZBase; aimCamera(); }
  new ResizeObserver(resize).observe(host); resize(); framed = true;
  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const run = auto || dragging; if (run) t += dt;
    if (!dragging) {
      yaw += vx; pitch = MathUtils.clamp(pitch + vy, -0.8, 0.8); vx *= 0.92; vy *= 0.92;
      if (yawTo !== null) {
        yaw += (yawTo - yaw) * 0.18;
        if (Math.abs(yawTo - yaw) < 0.002) { yaw = yawTo; yawTo = null; }
      } else if (auto && Math.abs(vx) < 0.002) yaw += dt * IDLE_YAW; // drag momentum fades into a steady idle turntable
    }
    user.rotation.set(pitch, yaw, 0);
    user.position.y = run ? Math.sin(t * 0.55) * 0.045 : 0; // faint breathing bob - a still photo never does this
    if (badges.length) {
      // the ring drifts slowly, and eases round when an item is chosen
      orbitYaw += (orbitYawTo - orbitYaw) * 0.08;
      if (!dragging && auto && Math.abs(orbitYawTo - orbitYaw) < 0.01) { orbitYawTo += dt * 0.05; }
      // the ring counter-rotates the user's yaw so badges stay readable from the front
      orbit.rotation.y = orbitYaw - yaw;
      const wp = new Vector3();
      badges.forEach((b, i) => {
        const on = i === active;
        if (b.marker) {
          // pinned to its part: follow the part, hover slightly, face the camera
          b.marker.getWorldPosition(wp); user.worldToLocal(wp);
          b.sp.position.copy(wp); b.sp.position.y += pinScale * 0.33 + Math.sin(t * 1.3 + i) * 0.04;
          /**
           * One label at a time.
           *
           * Fourteen pinned badges, each with its name under it, covered more
           * of the screen than the models did: the thing the page exists to
           * show was behind its own annotations. Now the chosen one carries a
           * full badge and its name, and the rest shrink back to quiet markers
           * that say "there is something here" without saying what. The name
           * of every one of them is a tap or a slider nudge away, and the
           * reading panel beside the stage has it in full.
           */
          const target = (on ? 1 : pinScale * 0.72) * sprK();
          b.sp.scale.setScalar(b.sp.scale.x + (target - b.sp.scale.x) * 0.14);
          (b.sp.material as SpriteMaterial).opacity = on || active < 0 ? 1 : 0.42;
          b.label.position.copy(b.sp.position); b.label.position.y -= 0.42 * sprK() + 0.3;
          // Set, not eased. An eased opacity here depends on the frame loop
          // having run enough times, and this loop idles when the turntable is
          // paused and is throttled outright when the tab is in the background:
          // the labels would then be caught half faded, or not faded at all.
          // Visibility of a label is a fact about which item is chosen, so it
          // is written as one.
          b.label.visible = on;
          (b.label.material as SpriteMaterial).opacity = 1;
          b.label.scale.set(2.6 * sprK(), 0.52 * sprK(), 1);
          return;
        }
        const a = b.a0 + orbit.rotation.y; const depth = Math.sin(a);           // +1 = nearest the camera
        const target = on ? 1.45 : 0.8 + 0.18 * depth;
        b.sp.scale.setScalar(b.sp.scale.x + (target - b.sp.scale.x) * 0.12);
        b.sp.position.set(Math.cos(b.a0) * ORBIT_R, Math.sin(t * 0.9 + i) * 0.12 + (on ? 0.15 : 0), Math.sin(b.a0) * ORBIT_R);
        (b.sp.material as SpriteMaterial).opacity = on ? 1 : 0.7 + 0.3 * Math.max(0, depth);
        b.label.position.copy(b.sp.position); b.label.position.y -= on ? 1.15 : 0.8;
        const lo = on ? 1 : depth > 0.35 ? (depth - 0.35) * 0.9 : 0;
        (b.label.material as SpriteMaterial).opacity = lo; b.label.visible = lo > 0.02;
        const ls = on ? 1 : 0.72; b.label.scale.set(2.6 * ls, 0.52 * ls, 1);
      });
    }
    const pop = Math.min(1, (now - popStart) / 450); root.scale.setScalar(baseScale * (1 - Math.pow(1 - pop, 3)));
    cur?.update(t, run ? dt : 0, param);
    // the explode rides on top of whatever the scene just did to its own parts
    explodeNow += (explodeTo - explodeNow) * 0.16;
    if (parts.length) for (const p of parts) p.wrap.position.copy(p.dir).multiplyScalar(explodeNow * spread);
    // the camera eases back as the model opens up, so nothing leaves the frame
    camera.position.z = camZBase + explodeNow * spread * 2.1;
    aimCamera();
    renderer.render(scene, camera);
    onFrame?.({ yawDeg: yawDeg(), auto });
    raf = visible && !document.hidden ? requestAnimationFrame(frame) : 0;
  }
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); }); io.observe(host);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); }); start();
  void firstLabel;
  return {
    set: (s) => { const l = build(s); start(); return l; },
    setItems: (items, act) => { setItems(items, act); resize(); start(); },
    focus: (i) => { focus(i); start(); },
    setParam: (v) => { param = v; start(); },
    setExplode: (v) => { explodeTo = MathUtils.clamp(v, 0, 1); start(); },
    setAuto: (on) => { auto = on; start(); },
    isAuto: () => auto,
    resetView: () => { vx = vy = 0; pitch = 0; yawTo = Math.round(yaw / (Math.PI * 2)) * Math.PI * 2; start(); },
    badgeAt(i) {
      const b = badges[i]; if (!b) return null;
      const v = new Vector3(); b.sp.getWorldPosition(v); v.project(camera);
      return { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h };
    },
    destroy() { cancelAnimationFrame(raf); io.disconnect(); clearItems(); renderer.dispose(); },
  };
}
