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
  MeshStandardMaterial, MeshBasicMaterial, AmbientLight, DirectionalLight, PointLight, CanvasTexture, Sprite, SpriteMaterial,
  DoubleSide, InstancedMesh, Matrix4,
} from 'three';

export type HeroSpec = { type: string; hue: string; v?: string; p?: number };
/** One thing in the category, shown as a badge orbiting the category's model. */
export type HeroItem = { label: string; emoji?: string };
type Ctx = { root: Group; hue: Color; v: string; font: string };
/**
 * A scene may expose `anchors`: a marker object per item label, attached to the
 * part of the model that item is about. Badges then sit on the model instead of
 * orbiting it, and follow the part when the scene explodes.
 */
type SceneObj = { update(t: number, dt: number, p: number): void; label: string; anchors?: Record<string, Object3D> };
type Builder = (c: Ctx) => SceneObj;

/* ---------- helpers ---------- */
const WHITE = new Color('#ffffff'), BLACK = new Color('#000000'), GOLD = new Color('#f0b429');
const lighten = (c: Color, k: number) => c.clone().lerp(WHITE, k);
const darken = (c: Color, k: number) => c.clone().lerp(BLACK, k);
const std = (color: Color | string, o: Record<string, unknown> = {}) => new MeshStandardMaterial({ color: color as Color, roughness: 0.55, metalness: 0.05, ...o });
const glow = (color: Color | string, opacity = 0.35) => new MeshBasicMaterial({ color: color as Color, transparent: true, opacity, depthWrite: false });
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
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

    // ground
    root.position.y = -0.35;   // the tree stands a little low so the exploded canopy stays in frame
    const ground = new Mesh(new CylinderGeometry(2.6, 2.6, 0.12, 48), std('#3b5a3a', { roughness: 1 })); ground.position.y = -1.7; root.add(ground);
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

    // the slider grows the tree; the engine's খুলে দেখো control pulls it apart
    return { label: 'বড় হও', anchors, update(t, _dt, p) {
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

    // the slider sets the pulse: resting on the left, hard exercise on the right
    return { label: 'হৃৎস্পন্দন', anchors, update(t, _dt, p) {
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

  atom({ root, hue }) {
    const nuc = new Group(); root.add(nuc);
    for (let i = 0; i < 10; i++) { const m = new Mesh(new SphereGeometry(0.22, 16, 16), std(i % 2 ? hue : lighten(hue, 0.5))); m.position.set(rnd(-0.22, 0.22), rnd(-0.22, 0.22), rnd(-0.22, 0.22)); nuc.add(m); }
    const shells: { g: Group; es: Mesh[]; r: number }[] = [];
    [1.1, 1.7, 2.3].forEach((r, i) => {
      const g = new Group(); g.rotation.set(rnd(0, 3), rnd(0, 3), i * 1.1); root.add(g);
      g.add(ring(r + 0.02, r - 0.02, darken(hue, 0.2), { transparent: true, opacity: 0.55 }));
      const es: Mesh[] = []; for (let k = 0; k < 4; k++) { const e = new Mesh(new SphereGeometry(0.11, 12, 12), std(GOLD, { emissive: GOLD, emissiveIntensity: 0.6 })); g.add(e); es.push(e); }
      shells.push({ g, es, r });
    });
    return { label: 'ইলেকট্রন', update(t, _dt, p) {
      nuc.rotation.y = t * 0.3; const n = 2 + Math.round(p * 10);
      let k = 0; shells.forEach((s, i) => { s.g.rotation.z += 0.002 * (i + 1); s.es.forEach((e, j) => { const on = k++ < n; e.visible = on; const a = t * (1.6 - i * 0.4) + j * Math.PI / 2; e.position.set(Math.cos(a) * s.r, Math.sin(a) * s.r, 0); }); });
    } };
  },

  particles({ root, hue, v }) {
    const N = 140, half = 2.2; const box = new Mesh(new BoxGeometry(half * 2, half * 2, half * 2), new MeshBasicMaterial({ color: hue, wireframe: true, transparent: true, opacity: 0.25 })); root.add(box);
    const geo = new SphereGeometry(0.13, 10, 10); const im = new InstancedMesh(geo, std(hue), N); root.add(im);
    const colorB = v === 'mix' ? GOLD : hue; const im2 = v === 'mix' ? new InstancedMesh(geo, std(colorB), N) : null; if (im2) root.add(im2);
    const home: Vector3[] = [], pos: Vector3[] = [], vel: Vector3[] = []; const side = Math.ceil(Math.cbrt(N));
    for (let i = 0; i < N; i++) { const x = (i % side) - side / 2 + 0.5, y = Math.floor(i / side) % side - side / 2 + 0.5, z = Math.floor(i / side / side) - side / 2 + 0.5; home.push(new Vector3(x, y, z).multiplyScalar(0.62)); pos.push(home[i].clone()); vel.push(new Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1))); }
    const m4 = new Matrix4();
    return { label: v === 'mix' ? 'মেশাও' : 'তাপমাত্রা', update(t, dt, p) {
      for (let i = 0; i < N; i++) {
        const P = pos[i];
        if (v === 'mix') { const target = home[i].clone(); if (p < 0.5) target.x += i % 2 ? 1.2 : -1.2; P.lerp(target, 0.05); P.x += Math.sin(t * 3 + i) * 0.004 * (1 + p); }
        else if (p < 0.35) { P.lerp(home[i], 0.1); P.x += (Math.random() - 0.5) * 0.02 * (p + 0.1); P.y += (Math.random() - 0.5) * 0.02 * (p + 0.1); }
        else if (p < 0.7) { const liq = home[i].clone(); liq.y = -half + 0.3 + ((i * 7) % 20) * 0.1; P.lerp(liq, 0.04); P.add(new Vector3(Math.sin(t * 2 + i), Math.cos(t * 1.7 + i * 2), Math.sin(t * 2.3 + i * 3)).multiplyScalar(0.012)); }
        else { P.addScaledVector(vel[i], dt * (p * 3)); for (const k of ['x', 'y', 'z'] as const) { if (P[k] > half - 0.2 || P[k] < -half + 0.2) { vel[i][k] *= -1; P[k] = MathUtils.clamp(P[k], -half + 0.2, half - 0.2); } } }
        const target = (im2 && i % 2) ? im2 : im; m4.makeTranslation(P.x, P.y, P.z); target.setMatrixAt(i, m4);
        if (im2) (i % 2 ? im : im2).setMatrixAt(i, m4.makeScale(0, 0, 0));
      }
      im.instanceMatrix.needsUpdate = true; if (im2) im2.instanceMatrix.needsUpdate = true;
    } };
  },

  wave({ root, hue }) {
    const geo = new PlaneGeometry(7, 1.4, 140, 8); const m = new Mesh(geo, std(hue, { side: DoubleSide })); m.rotation.x = -0.35; root.add(m);
    const pos = geo.attributes.position as Float32BufferAttribute; const base = Float32Array.from(pos.array as Float32Array);
    return { label: 'সুর', update(t, _dt, p) {
      const k = 1 + p * 4; for (let i = 0; i < pos.count; i++) { const x = base[i * 3]; pos.setZ(i, Math.sin(x * k - t * 3) * 0.45); } pos.needsUpdate = true; geo.computeVertexNormals();
    } };
  },

  gears({ root, hue }) {
    const mk = (r: number, teeth: number, color: Color) => { const g = new Group(); g.add(new Mesh(new CylinderGeometry(r, r, 0.3, 32), std(color))); for (let i = 0; i < teeth; i++) { const b = new Mesh(new BoxGeometry(0.28, 0.3, 0.22), std(color)); const a = (i / teeth) * Math.PI * 2; b.position.set(Math.cos(a) * (r + 0.1), 0, Math.sin(a) * (r + 0.1)); b.rotation.y = -a; g.add(b); } g.add(new Mesh(new CylinderGeometry(0.15, 0.15, 0.4, 16), std(darken(color, 0.4)))); g.rotation.x = Math.PI / 2; return g; };
    const a = mk(1.2, 12, hue), b = mk(0.8, 8, lighten(hue, 0.3)), c = mk(0.55, 6, GOLD); a.position.x = -0.9; b.position.set(1.25, 0, 0); c.position.set(1.25, 1.5, 0); root.add(a, b, c);
    return { label: 'গতি', update(_t, dt, p) { const s = dt * (0.4 + p * 2.5); a.rotation.y += s; b.rotation.y -= s * 12 / 8; c.rotation.y += s * 12 / 6; } };
  },

  pendulum({ root, hue }) {
    root.add(new Mesh(new BoxGeometry(3, 0.15, 0.3), std(darken(hue, 0.3))).translateY(2.2));
    const arm = new Group(); arm.position.y = 2.2; root.add(arm);
    const rod = new Mesh(new CylinderGeometry(0.03, 0.03, 1, 8), std('#888')); const bob = new Mesh(new SphereGeometry(0.4, 24, 24), std(hue)); arm.add(rod, bob);
    return { label: 'দৈর্ঘ্য', update(t, _dt, p) { const L = 1.4 + p * 2.2; rod.scale.y = L; rod.position.y = -L / 2; bob.position.y = -L; arm.rotation.z = 0.6 * Math.cos(t * Math.sqrt(9.8 / L)); } };
  },

  ramp({ root, hue }) {
    const g = new Group(); root.add(g); const len = 5; const plank = new Mesh(new BoxGeometry(len, 0.2, 1.6), std(darken(hue, 0.25))); g.add(plank);
    const ball = new Mesh(new SphereGeometry(0.35, 24, 24), std(GOLD)); g.add(ball); let s = 0;
    return { label: 'ঢাল', update(_t, dt, p) { const ang = 0.15 + p * 0.55; g.rotation.z = ang; const acc = 9.8 * Math.sin(ang) * 0.25; s += acc * dt * 1.6; ball.position.x = -len / 2 + 0.3 + s; ball.position.y = 0.45; ball.rotation.z -= dt * 3 * (1 + p); if (ball.position.x > len / 2 - 0.3) s = 0; } };
  },

  prism({ root, hue }) {
    const prism = new Mesh(new CylinderGeometry(1.2, 1.2, 1.6, 3), std(lighten(hue, 0.6), { transparent: true, opacity: 0.55, roughness: 0.1 })); prism.rotation.x = Math.PI / 2; prism.rotation.z = Math.PI; root.add(prism);
    const beam = new Mesh(new BoxGeometry(3, 0.08, 0.08), glow('#ffffff', 0.9)); beam.position.set(-2.3, 0.2, 0); root.add(beam);
    const cols = ['#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#0a84ff', '#5e5ce6', '#bf5af2'].map((c, i) => { const r = new Mesh(new BoxGeometry(3.2, 0.07, 0.07), glow(c, 0.95)); r.position.x = 1.6; const p = new Group(); p.position.set(0.7, -0.05, 0); p.add(r); root.add(p); return p; });
    return { label: 'রং ছড়াও', update(t, _dt, p) { cols.forEach((c, i) => { c.rotation.z = -(i - 3) * (0.04 + p * 0.09); }); (beam.material as MeshBasicMaterial).opacity = 0.75 + Math.sin(t * 6) * 0.15; } };
  },

  circuit({ root, hue, v }) {
    const pts = [new Vector3(-2.5, -1.2, 0), new Vector3(2.5, -1.2, 0), new Vector3(2.5, 1.2, 0), new Vector3(-2.5, 1.2, 0)];
    const curve = new CatmullRomCurve3(pts, true, 'catmullrom', 0.05); root.add(new Mesh(new TubeGeometry(curve, 120, 0.05, 8, true), std('#556')));
    const batt = new Mesh(new BoxGeometry(0.9, 0.45, 0.45), std(hue)); batt.position.set(0, -1.2, 0); root.add(batt);
    const bulb = new Mesh(new SphereGeometry(0.42, 24, 24), std(GOLD, { emissive: GOLD, emissiveIntensity: 0.2, transparent: true, opacity: 0.9 })); bulb.position.set(0, 1.2, 0); root.add(bulb);
    const light = new PointLight(GOLD, 0, 6); light.position.copy(bulb.position); root.add(light);
    const N = v === 'network' ? 24 : 14; const es: Mesh[] = []; for (let i = 0; i < N; i++) { const e = new Mesh(new SphereGeometry(0.09, 10, 10), std('#7cf', { emissive: '#7cf', emissiveIntensity: 0.8 })); root.add(e); es.push(e); }
    return { label: 'বিদ্যুৎ প্রবাহ', update(t, _dt, p) { es.forEach((e, i) => e.position.copy(curve.getPointAt(((t * (0.05 + p * 0.25)) + i / N) % 1))); (bulb.material as MeshStandardMaterial).emissiveIntensity = 0.1 + p * 1.6; light.intensity = p * 4; } };
  },

  beaker({ root, hue, v }) {
    const glass = new Mesh(new CylinderGeometry(1.1, 1, 2.6, 32, 1, true), std('#cfe6f2', { transparent: true, opacity: 0.35, side: DoubleSide, roughness: 0.1 })); root.add(glass);
    const liquid = new Mesh(new CylinderGeometry(1.02, 0.94, 1.6, 32), std(hue, { transparent: true, opacity: 0.85 })); liquid.position.y = -0.45; root.add(liquid);
    const bubbles: Mesh[] = []; for (let i = 0; i < 26; i++) { const b = new Mesh(new SphereGeometry(rnd(0.05, 0.13), 8, 8), std('#fff', { transparent: true, opacity: 0.8 })); b.position.set(rnd(-0.7, 0.7), rnd(-1.2, 0.3), rnd(-0.7, 0.7)); root.add(b); bubbles.push(b); }
    const acid = new Color('#e5484d'), base = new Color('#3b82f6');
    return { label: v === 'ph' ? 'pH' : 'বিক্রিয়ার হার', update(t, dt, p) {
      if (v === 'ph') (liquid.material as MeshStandardMaterial).color.copy(acid).lerp(base, p);
      const rate = v === 'ph' ? 0.5 : p; bubbles.forEach((b, i) => { b.position.y += dt * (0.4 + rate * 1.6) * (0.6 + (i % 3) * 0.3); b.position.x += Math.sin(t * 3 + i) * 0.003; if (b.position.y > 0.35) b.position.y = -1.2; b.visible = i < 6 + rate * 20; });
    } };
  },

  molecule({ root, hue }) {
    const g = new Group(); root.add(g); const c = new Mesh(new SphereGeometry(0.55, 24, 24), std(hue)); g.add(c);
    const dirs = [new Vector3(1, 1, 1), new Vector3(-1, -1, 1), new Vector3(-1, 1, -1), new Vector3(1, -1, -1)];
    dirs.forEach((d, i) => { d.normalize().multiplyScalar(1.5); const a = new Mesh(new SphereGeometry(0.36, 20, 20), std(i % 2 ? GOLD : lighten(hue, 0.5))); a.position.copy(d); g.add(a); const bond = new Mesh(new CylinderGeometry(0.08, 0.08, 1.5, 8), std('#9aa')); bond.position.copy(d.clone().multiplyScalar(0.5)); bond.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), d.clone().normalize()); g.add(bond); });
    return { label: 'ঘূর্ণন', update(_t, dt, p) { g.rotation.y += dt * (0.2 + p); g.rotation.x += dt * 0.15; } };
  },

  tree({ root, hue, v }) {
    const trunkMat = std('#6b4a2b'); const leafCols = { green: new Color('#3e8e5a'), autumn: new Color('#d9822b'), bare: new Color('#3e8e5a'), spring: new Color('#e88fb0') };
    const leafMat = std(leafCols.green); const tips: Vector3[] = []; const tree = new Group(); root.add(tree); tree.position.y = -1.6;
    const grow = (from: Vector3, dir: Vector3, len: number, r: number, depth: number) => {
      const b = new Mesh(new CylinderGeometry(r * 0.65, r, len, 7), trunkMat); b.position.copy(from.clone().addScaledVector(dir, len / 2)); b.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir); tree.add(b);
      const end = from.clone().addScaledVector(dir, len); if (depth === 0) { tips.push(end); return; }
      for (let i = 0; i < 3; i++) { const nd = dir.clone().add(new Vector3(rnd(-0.7, 0.7), rnd(0.2, 0.6), rnd(-0.7, 0.7))).normalize(); grow(end, nd, len * 0.68, r * 0.62, depth - 1); }
    };
    grow(new Vector3(0, 0, 0), new Vector3(0, 1, 0), 1.3, 0.22, 3);
    const leaves = new InstancedMesh(new SphereGeometry(0.28, 8, 8), leafMat, tips.length); tree.add(leaves); const m4 = new Matrix4(); tips.forEach((t, i) => leaves.setMatrixAt(i, m4.makeTranslation(t.x, t.y, t.z)));
    let sun: Mesh | null = null, o2: Mesh[] = [];
    if (v === 'photo') { sun = new Mesh(new SphereGeometry(0.5, 20, 20), std(GOLD, { emissive: GOLD, emissiveIntensity: 1 })); sun.position.set(2.6, 3.6, -1); root.add(sun); for (let i = 0; i < 10; i++) { const b = new Mesh(new SphereGeometry(0.08, 8, 8), std('#bfe9ff', { transparent: true, opacity: 0.9 })); root.add(b); o2.push(b); } }
    return { label: v === 'season' ? 'ঋতু' : v === 'photo' ? 'সূর্যের আলো' : 'বড় হওয়া', update(t, dt, p) {
      if (v === 'season') { const c = p < 0.33 ? leafCols.green.clone().lerp(leafCols.autumn, p * 3) : p < 0.66 ? leafCols.autumn : leafCols.spring; leafMat.color.copy(c); leaves.visible = !(p >= 0.33 && p < 0.66 && ((t * 2) | 0) % 1 === 1) ; leaves.scale.setScalar(p >= 0.33 && p < 0.66 ? 0.35 : 1); tree.rotation.z = Math.sin(t) * 0.03; }
      else if (v === 'photo') { const s = 0.3 + p; sun!.scale.setScalar(s); (sun!.material as MeshStandardMaterial).emissiveIntensity = 0.3 + p * 1.5; leafMat.color.copy(darken(leafCols.green, 0.4)).lerp(leafCols.green, p); o2.forEach((b, i) => { b.visible = i < p * 10; b.position.y += dt * 0.8; if (b.position.y > 3.2) { const tip = tips[i % tips.length]; b.position.set(tip.x, tip.y - 1.6, tip.z); } }); tree.rotation.z = Math.sin(t * 0.8) * 0.02; }
      else { const s = 0.08 + p * 0.92; tree.scale.setScalar(s); leaves.visible = p > 0.35; tree.rotation.z = Math.sin(t * 0.8) * 0.02 * s; }
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
    const cloud = new Group(); cloud.position.y = 1.8; root.add(cloud); const cm = std('#e8eef4');
    for (let i = 0; i < 9; i++) { const s = new Mesh(new SphereGeometry(rnd(0.45, 0.8), 16, 16), cm); s.position.set(rnd(-1.6, 1.6), rnd(-0.2, 0.35), rnd(-0.5, 0.5)); cloud.add(s); }
    const N = 260; const arr = new Float32Array(N * 3); for (let i = 0; i < N; i++) { arr[i * 3] = rnd(-2, 2); arr[i * 3 + 1] = rnd(-2.5, 1.5); arr[i * 3 + 2] = rnd(-0.8, 0.8); }
    const rg = new BufferGeometry(); rg.setAttribute('position', new Float32BufferAttribute(arr, 3)); const rain = new Points(rg, new PointsMaterial({ color: lighten(hue, 0.3), size: 0.07, transparent: true, opacity: 0.9 })); root.add(rain);
    const bolt = new Line(new BufferGeometry().setFromPoints([new Vector3(0.2, 1.4, 0), new Vector3(-0.2, 0.6, 0), new Vector3(0.25, 0.2, 0), new Vector3(-0.15, -0.9, 0)]), new LineBasicMaterial({ color: '#fff3a0' })); bolt.visible = false; root.add(bolt);
    const flash = new PointLight('#fff3a0', 0, 8); flash.position.set(0, 1, 1); root.add(flash); let next = 2;
    return { label: 'ঝড়ের তীব্রতা', update(t, dt, p) {
      const pa = rg.attributes.position as Float32BufferAttribute; const n = Math.floor(N * (0.15 + p * 0.85)); for (let i = 0; i < N; i++) { let y = pa.getY(i) - dt * (2 + p * 6); if (y < -2.5) y = 1.5; pa.setY(i, i < n ? y : 99); } pa.needsUpdate = true;
      cloud.position.x = Math.sin(t * 0.3) * 0.3; cm.color.copy(new Color('#e8eef4')).lerp(new Color('#5b6675'), p * (v === 'storm' ? 1 : 0.7));
      if (t > next) { bolt.visible = true; flash.intensity = 6 * p; next = t + rnd(1.5, 5) / (0.2 + p); } else { flash.intensity *= 0.85; if (flash.intensity < 0.2) bolt.visible = false; }
    } };
  },

  terrain({ root, hue, v }) {
    const S = 8, seg = 70; const geo = new PlaneGeometry(S, S, seg, seg); geo.rotateX(-Math.PI / 2); const pos = geo.attributes.position as Float32BufferAttribute; const colors = new Float32Array(pos.count * 3); const c = new Color();
    const water = new Color('#2b7bd6'), sand = new Color('#d9c08a'), grass = new Color('#3e8e5a'), rock = new Color('#7a6a58'), snow = new Color('#f3f6f8');
    const paint = (p: number) => { for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i); let h = fbm2(x * 0.35 + 3, z * 0.35 + 7) * 2.6 - 1.1; if (v === 'farm') h = Math.sin(x * 3) * 0.08 + 0.1; if (v === 'delta') h = h * 0.4 - 0.15 + Math.max(0, Math.abs(Math.sin(x * 0.6 + z * 0.3)) - 0.7) * -1; h *= 0.4 + p * 1.2; pos.setY(i, h); c.copy(h < 0 ? water : h < 0.15 ? sand : h < 0.9 ? grass : h < 1.5 ? rock : snow); if (v === 'farm') c.copy(grass).lerp(new Color('#7bb661'), (Math.sin(x * 3) + 1) / 2); colors.set([c.r, c.g, c.b], i * 3); } pos.needsUpdate = true; geo.setAttribute('color', new Float32BufferAttribute(colors, 3)); geo.computeVertexNormals(); };
    paint(0.5); const m = new Mesh(geo, std('#fff', { vertexColors: true, flatShading: true })); m.position.y = -1; root.add(m);
    const sea = new Mesh(new PlaneGeometry(S, S), std(water, { transparent: true, opacity: 0.6 })); sea.rotation.x = -Math.PI / 2; sea.position.y = -1 + 0.01; root.add(sea);
    let last = 0.5;
    return { label: v === 'farm' ? 'ফসল' : 'উচ্চতা', update(t, _dt, p) { if (Math.abs(p - last) > 0.01) { paint(p); last = p; } root.rotation.y += 0.0015; sea.position.y = -1 + 0.01 + Math.sin(t) * 0.02; } };
  },

  seasonwheel({ root, hue, v, font }) {
    const cols = ['#f0b429', '#3b82f6', '#9fd3e6', '#d9822b', '#cfd8e3', '#e88fb0']; const names = ['গ্রীষ্ম', 'বর্ষা', 'শরৎ', 'হেমন্ত', 'শীত', 'বসন্ত'];
    const fruits = ['🥭', '🍈', '🍌', '🥥', '🥕', '🍓'];
    const wheel = new Group(); wheel.rotation.x = 0.5; root.add(wheel);
    cols.forEach((c, i) => { const s = sector(2.6, (i / 6) * Math.PI * 2, Math.PI / 3, c, 0.2); wheel.add(s); const a = (i + 0.5) / 6 * Math.PI * 2; const sp = v === 'fruit' ? emojiSprite(fruits[i], 0.9) : textSprite(names[i], font, '#eef4fb', 1.1); sp.position.set(Math.cos(a) * 2, 0.4, -Math.sin(a) * 2); wheel.add(sp); });
    wheel.add(new Mesh(new CylinderGeometry(0.5, 0.5, 0.3, 32), std('#ffffff')));
    return { label: 'ঋতু ঘোরাও', update(t, _dt, p) { wheel.rotation.y += (p * Math.PI * 2 - wheel.rotation.y) * 0.08; wheel.rotation.z = 0.5 + Math.sin(t * 0.4) * 0.025; } };
  },

  plate({ root, hue, v }) {
    const plate = new Group(); plate.rotation.x = 0.55; root.add(plate); plate.add(new Mesh(new CylinderGeometry(2.7, 2.7, 0.15, 48), std('#f4f6f8')));
    const groups = [['#e6c87a', 'শর্করা', '🍚'], ['#d97b6c', 'আমিষ', '🐟'], ['#6fbf73', 'সবজি', '🥬'], ['#f0b429', 'ফল', '🍌'], ['#8fb9e8', 'দুধ', '🥛']];
    const secs = groups.map(([c, , e], i) => { const s = sector(2.3, 0, 1, c, 0.1); s.position.y = 0.12; plate.add(s); const sp = emojiSprite(e, 0.8); sp.position.y = 0.6; plate.add(sp); return { s, sp }; });
    return { label: 'সুষম করো', update(t, _dt, p) {
      const w = [0.35 - p * 0.15, 0.2, 0.15 + p * 0.15, 0.15, 0.15]; const tot = w.reduce((a, b) => a + b); let start = 0;
      secs.forEach(({ s, sp }, i) => { const len = (w[i] / tot) * Math.PI * 2; s.geometry.dispose(); s.geometry = new CylinderGeometry(2.3, 2.3, 0.1, 48, 1, false, start, len); const a = start + len / 2; sp.position.set(Math.sin(a) * 1.5, 0.6, Math.cos(a) * 1.5); start += len; }); plate.rotation.y = t * 0.15;
    } };
  },

  blocks({ root, hue, v }) {
    const g = new Group(); root.add(g); const cubeG = new BoxGeometry(0.36, 0.36, 0.36); const m4 = new Matrix4();
    if (v === 'wave') { const N = 12; const im = new InstancedMesh(cubeG, std(hue), N * N); g.add(im); return { label: 'ঢেউ', update(t, _dt, p) { for (let i = 0; i < N * N; i++) { const x = i % N - N / 2 + 0.5, z = Math.floor(i / N) - N / 2 + 0.5; const h = 0.5 + Math.sin(x * 0.6 + t * 2) * Math.cos(z * 0.6 * (0.5 + p) + t) * (0.5 + p); m4.makeScale(1, h * 3, 1); m4.setPosition(x * 0.4, h * 0.55 - 1, z * 0.4); im.setMatrixAt(i, m4); } im.instanceMatrix.needsUpdate = true; } }; }
    const units = new InstancedMesh(cubeG, std(GOLD), 9), rods = new InstancedMesh(new BoxGeometry(0.36, 3.6, 0.36), std(hue), 9), flats = new InstancedMesh(new BoxGeometry(3.6, 0.36, 3.6), std(darken(hue, 0.3)), 9); g.add(units, rods, flats); g.position.set(-1.5, -1.6, 0);
    return { label: 'সংখ্যা', update(t, _dt, p) {
      const n = Math.round(p * 999); const h = Math.floor(n / 100), tn = Math.floor(n / 10) % 10, u = n % 10;
      for (let i = 0; i < 9; i++) { flats.setMatrixAt(i, i < h ? m4.makeTranslation(0.5, i * 0.4 + 0.18, 0) : m4.makeScale(0, 0, 0)); rods.setMatrixAt(i, i < tn ? m4.makeTranslation(3 + i * 0.4, 1.8, 0) : m4.makeScale(0, 0, 0)); units.setMatrixAt(i, i < u ? m4.makeTranslation(3 + (i % 3) * 0.4, Math.floor(i / 3) * 0.4 + 0.18, 1.2) : m4.makeScale(0, 0, 0)); }
      flats.instanceMatrix.needsUpdate = rods.instanceMatrix.needsUpdate = units.instanceMatrix.needsUpdate = true;
      g.rotation.y = Math.sin(t * 0.35) * 0.05; g.position.y = Math.sin(t * 0.9) * 0.015; // idle sway - the stack never sits dead still
    } };
  },

  pie({ root, hue }) {
    const g = new Group(); g.rotation.x = 0.6; root.add(g); const n = 8; const secs: Mesh[] = [];
    for (let i = 0; i < n; i++) { const s = sector(2.2, (i / n) * Math.PI * 2, Math.PI * 2 / n, i % 2 ? hue : lighten(hue, 0.3), 0.35); g.add(s); secs.push(s); }
    return { label: 'টুকরো নাও', update(t, _dt, p) { const k = Math.round(p * n); secs.forEach((s, i) => { const a = (i + 0.5) / n * Math.PI * 2; const out = i < k ? 0.45 : 0; s.position.set(Math.sin(a) * out, i < k ? 0.25 : 0, Math.cos(a) * out); }); g.rotation.y = t * 0.2; } };
  },

  shapes({ root, hue }) {
    const geos = [new BoxGeometry(1.6, 1.6, 1.6), new SphereGeometry(1, 32, 32), new ConeGeometry(1, 1.8, 32), new CylinderGeometry(0.8, 0.8, 1.8, 32), new TetrahedronGeometry(1.3), new OctahedronGeometry(1.2), new DodecahedronGeometry(1.1), new IcosahedronGeometry(1.1)];
    const ms = geos.map((gm, i) => { const m = new Mesh(gm, std(i % 2 ? hue : GOLD, { flatShading: i > 3 })); root.add(m); return m; });
    return { label: 'আকৃতি', update(t, _dt, p) { const sel = Math.min(ms.length - 1, Math.floor(p * ms.length)); ms.forEach((m, i) => { if (i === sel) { m.position.set(0, 0, 0); m.scale.setScalar(1.3); m.rotation.set(t * 0.4, t * 0.6, 0); } else { const a = (i / ms.length) * Math.PI * 2 + t * 0.15; m.position.set(Math.cos(a) * 3.1, Math.sin(a * 2) * 0.3, Math.sin(a) * 1.6); m.scale.setScalar(0.32); m.rotation.y = t; } }); } };
  },

  scale({ root, hue }) {
    root.add(new Mesh(new ConeGeometry(0.5, 1.6, 16), std(darken(hue, 0.3))).translateY(-1));
    const beam = new Group(); beam.position.y = -0.2; root.add(beam); beam.add(new Mesh(new BoxGeometry(4.6, 0.12, 0.3), std('#8a8f96')));
    const pan = (x: number) => { const g = new Group(); g.position.x = x; const p = new Mesh(new CylinderGeometry(0.8, 0.7, 0.1, 24), std(lighten(hue, 0.4))); p.position.y = -1.1; g.add(p); [-0.3, 0.3].forEach((dx) => { const s = new Mesh(new CylinderGeometry(0.02, 0.02, 1.1, 6), std('#999')); s.position.set(dx, -0.55, 0); g.add(s); }); beam.add(g); return { g, p }; };
    const L = pan(-2), R = pan(2); const wL = new Mesh(new BoxGeometry(0.6, 0.6, 0.6), std(GOLD)); wL.position.y = -0.75; L.g.add(wL); const wR = new Mesh(new BoxGeometry(0.6, 0.6, 0.6), std(hue)); wR.position.y = -0.75; R.g.add(wR);
    return { label: 'ওজন', update(t, _dt, p) { const diff = p - 0.5; wR.scale.setScalar(0.6 + p * 0.9); const target = -diff * 0.5 + Math.sin(t * 1.1) * 0.015; beam.rotation.z += (target - beam.rotation.z) * 0.08; L.g.rotation.z = -beam.rotation.z; R.g.rotation.z = -beam.rotation.z; } };
  },

  coins({ root, hue, v }) {
    const jar = new Mesh(new CylinderGeometry(1.3, 1.1, 2.8, 32, 1, true), std('#cfe6f2', { transparent: true, opacity: 0.3, side: DoubleSide, roughness: 0.1 })); root.add(jar);
    const N = 40; const im = new InstancedMesh(new CylinderGeometry(0.42, 0.42, 0.08, 24), std(GOLD, { metalness: 0.6, roughness: 0.3 }), N); root.add(im); const m4 = new Matrix4(); const slots = Array.from({ length: N }, (_, i) => ({ x: (i % 3 - 1) * 0.75, z: ((i * 7) % 3 - 1) * 0.55, y: -1.35 + Math.floor(i / 3) * 0.09, r: rnd(0, 6) }));
    const falling = new Map<number, number>();
    return { label: 'জমাও', update(t, dt, p) { const n = Math.round(p * N); for (let i = 0; i < N; i++) { const s = slots[i]; if (i < n) { let y = falling.get(i); if (y === undefined) y = 2.5; y = Math.max(s.y, y - dt * 6); falling.set(i, y); m4.makeRotationY(s.r); m4.setPosition(s.x, y, s.z); } else { falling.delete(i); m4.makeScale(0, 0, 0); } im.setMatrixAt(i, m4); } im.instanceMatrix.needsUpdate = true; root.rotation.y = Math.sin(t * 0.3) * 0.25; } };
  },

  bars({ root, hue, v }) {
    const N = 7; const bars: Mesh[] = []; for (let i = 0; i < N; i++) { const b = new Mesh(new BoxGeometry(0.55, 1, 0.55), std(i === N - 1 ? GOLD : hue)); b.position.x = (i - N / 2 + 0.5) * 0.8; root.add(b); bars.push(b); }
    root.add(new Mesh(new BoxGeometry(6.2, 0.06, 1.2), std('#8a8f96')).translateY(-1.5));
    return { label: v === 'compound' ? 'বছর' : 'বাড়ো', update(t, _dt, p) { bars.forEach((b, i) => { const h = v === 'compound' ? 0.3 + Math.pow(1 + p * 0.6, i) * 0.4 : 0.3 + (0.4 + Math.sin(i * 1.3) * 0.3) * p * 3.5; const hh = Math.min(h, 3.6) + Math.sin(t * 1.3 + i) * 0.025; b.scale.y += (hh - b.scale.y) * 0.1; b.position.y = -1.5 + b.scale.y / 2; }); } };
  },

  rocket({ root, hue }) {
    const r = new Group(); root.add(r); r.add(new Mesh(new CylinderGeometry(0.4, 0.4, 2, 24), std('#f4f6f8'))); const nose = new Mesh(new ConeGeometry(0.4, 0.9, 24), std(hue)); nose.position.y = 1.45; r.add(nose);
    [0, 1, 2].forEach((i) => { const f = new Mesh(new BoxGeometry(0.08, 0.7, 0.6), std(hue)); const a = (i / 3) * Math.PI * 2; f.position.set(Math.cos(a) * 0.5, -0.8, Math.sin(a) * 0.5); f.rotation.y = -a; r.add(f); });
    const flame = new Mesh(new ConeGeometry(0.32, 1.2, 16), glow('#ff8c1a', 0.95)); flame.rotation.x = Math.PI; flame.position.y = -1.6; r.add(flame);
    const N = 120; const arr = new Float32Array(N * 3); const pg = new BufferGeometry(); pg.setAttribute('position', new Float32BufferAttribute(arr, 3)); const smoke = new Points(pg, new PointsMaterial({ color: '#c9ced4', size: 0.12, transparent: true, opacity: 0.7 })); root.add(smoke);
    return { label: 'জোর', update(t, dt, p) { r.position.y = -1 + p * 3 + Math.sin(t * 8) * 0.02 * p; r.rotation.z = Math.sin(t * 2) * 0.02; flame.scale.set(1, 0.6 + p * 1.4 + Math.random() * 0.3, 1); flame.visible = p > 0.05; const pa = pg.attributes.position as Float32BufferAttribute; for (let i = 0; i < N; i++) { let y = pa.getY(i) - dt * 2; if (y < r.position.y - 4 || pa.getX(i) === 0) { y = r.position.y - 2; pa.setX(i, rnd(-0.3, 0.3)); pa.setZ(i, rnd(-0.3, 0.3)); } pa.setX(i, pa.getX(i) * 1.02); pa.setY(i, p > 0.05 ? y : 99); } pa.needsUpdate = true; } };
  },

  letters({ root, hue, v, font }) {
    const set = v === 'en' ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') : v === 'words' ? ['মা', 'বাবা', 'বই', 'ফুল', 'পাখি', 'নদী', 'চাঁদ', 'ঘর', 'মাছ', 'গাছ'] : v === 'jukto' ? ['ক্ষ', 'জ্ঞ', 'ঙ্গ', 'ন্ত', 'স্থ', 'ষ্ট', 'ত্র', 'দ্ধ', 'ম্ব', 'শ্র'] : v === 'num' ? '০১২৩৪৫৬৭৮৯'.split('') : 'অআইঈউঊঋএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ'.split('');
    const N = Math.min(set.length, 26); const sps = set.slice(0, N).map((ch, i) => { const s = textSprite(ch, font, '#' + (i % 2 ? lighten(hue, 0.3).getHexString() : lighten(hue, 0.6).getHexString()), 1.1); root.add(s); return s; });
    const big = textSprite(set[0], font, '#' + lighten(hue, 0.35).getHexString(), 3); root.add(big); let cur = 0;
    return { label: 'বর্ণ বাছো', update(t, _dt, p) { const sel = Math.min(N - 1, Math.floor(p * N)); if (sel !== cur) { cur = sel; big.material.map?.dispose(); big.material.dispose(); root.remove(big); const nb = textSprite(set[sel], font, '#' + lighten(hue, 0.35).getHexString(), 3); root.add(nb); Object.assign(big, { material: nb.material }); root.remove(nb); root.add(big); } sps.forEach((s, i) => { const a = (i / N) * Math.PI * 2 + t * 0.12; s.position.set(Math.cos(a) * 3.2, Math.sin(a * 3 + t) * 0.5, Math.sin(a) * 1.5); s.scale.setScalar(i === sel ? 0.2 : 1.1); }); big.position.y = Math.sin(t * 1.2) * 0.15; } };
  },

  face({ root, hue, v }) {
    const mk = (x: number) => { const g = new Group(); g.position.x = x; root.add(g); g.add(new Mesh(new SphereGeometry(1.2, 32, 32), std(GOLD))); const eye = (dx: number) => { const e = new Mesh(new SphereGeometry(0.16, 16, 16), std('#111')); e.position.set(dx, 0.3, 1.08); g.add(e); const brow = new Mesh(new BoxGeometry(0.4, 0.07, 0.07), std('#111')); brow.position.set(dx, 0.62, 1.08); g.add(brow); return { e, brow }; }; const L = eye(-0.42), R = eye(0.42); const mouth = new Mesh(new TorusGeometry(0.42, 0.06, 8, 24, Math.PI), std('#111')); mouth.position.set(0, -0.3, 1.1); mouth.rotation.z = Math.PI; g.add(mouth); return { g, L, R, mouth }; };
    const faces = v === 'pair' ? [mk(-1.7), mk(1.7)] : [mk(0)]; if (v === 'pair') { faces[0].g.rotation.y = 0.5; faces[1].g.rotation.y = -0.5; }
    return { label: 'মেজাজ', update(t, _dt, p) { faces.forEach((f, k) => { const mood = v === 'pair' && k === 1 ? 1 - p : p; f.mouth.rotation.z = Math.PI * (1 - mood) + (mood > 0.5 ? 0 : 0); f.mouth.scale.setScalar(0.6 + Math.abs(mood - 0.5) * 1.2); f.mouth.position.y = mood > 0.5 ? -0.3 : -0.55; f.L.brow.rotation.z = (mood - 0.5) * -0.6; f.R.brow.rotation.z = (mood - 0.5) * 0.6; const blink = ((t + k) % 3.5) < 0.12; f.L.e.scale.y = f.R.e.scale.y = blink ? 0.1 : 1; f.g.rotation.z = Math.sin(t * 1.3 + k) * 0.05; }); } };
  },

  shield({ root, hue }) {
    const hex = new Mesh(new CylinderGeometry(1.9, 1.9, 0.3, 6), std(hue, { transparent: true, opacity: 0.55 })); hex.rotation.x = Math.PI / 2; root.add(hex);
    const core = new Mesh(new SphereGeometry(0.8, 24, 24), std(GOLD, { emissive: GOLD, emissiveIntensity: 0.4 })); root.add(core); const rings = [1.2, 1.5].map((r) => { const m = ring(r + 0.03, r - 0.03, lighten(hue, 0.4)); root.add(m); return m; });
    return { label: 'সুরক্ষা', update(t, _dt, p) { hex.rotation.z = t * 0.2; rings.forEach((r, i) => { r.rotation.x = t * (0.5 + i * 0.3); r.rotation.y = t * 0.4; r.visible = p > i * 0.4; }); (core.material as MeshStandardMaterial).emissiveIntensity = 0.2 + p; core.scale.setScalar(0.8 + p * 0.3); } };
  },

  clock({ root, hue }) {
    const g = new Group(); root.add(g); g.add(new Mesh(new CylinderGeometry(2.2, 2.2, 0.2, 48), std('#f4f6f8'))); g.rotation.x = Math.PI / 2;
    for (let i = 0; i < 12; i++) { const t = new Mesh(new BoxGeometry(0.1, i % 3 ? 0.25 : 0.4, 0.06), std(i % 3 ? '#8a8f96' : hue)); const a = (i / 12) * Math.PI * 2; t.position.set(Math.sin(a) * 1.85, 0.13, -Math.cos(a) * 1.85); t.rotation.y = -a; g.add(t); }
    const hand = (len: number, w: number, c: Color | string) => { const h = new Group(); const m = new Mesh(new BoxGeometry(w, 0.06, len), std(c)); m.position.z = -len / 2; h.add(m); h.position.y = 0.2; g.add(h); return h; };
    const hr = hand(1.0, 0.14, hue), mn = hand(1.5, 0.1, darken(hue, 0.3)), sc = hand(1.7, 0.04, GOLD);
    return { label: 'সময়', update(t, _dt, p) { const hours = p * 12; hr.rotation.y = -hours / 12 * Math.PI * 2; mn.rotation.y = -(hours % 1) * Math.PI * 2; sc.rotation.y = -t * 0.5; } };
  },

  minar({ root, hue }) {
    const g = new Group(); root.add(g); const white = std('#f4f6f8'); const col = (x: number, h: number, tilt: number) => { const m = new Mesh(new BoxGeometry(0.45, h, 0.4), white); m.position.set(x, h / 2 - 1.3, 0); g.add(m); const top = new Mesh(new BoxGeometry(0.45, 0.9, 0.4), white); top.position.set(x + tilt * 0.35, h - 1.3 + 0.35, 0); top.rotation.z = tilt * 0.9; g.add(top); };
    col(0, 3.4, 0); col(-1.1, 2.4, -1); col(1.1, 2.4, 1); col(-2.1, 1.8, -1); col(2.1, 1.8, 1); g.add(new Mesh(new BoxGeometry(5.6, 0.25, 2.2), std('#d9dee5')).translateY(-1.45));
    const sun = new Mesh(new CircleGeometry(1.1, 48), glow('#d23b4b', 0.95)); sun.position.set(0, 1.4, -0.9); g.add(sun);
    return { label: 'ঘোরাও', update(t, _dt, p) { g.rotation.y = (p - 0.5) * 1.2 + Math.sin(t * 0.4) * 0.05; sun.position.y = 1.2 + p * 0.6; } };
  },

  earth({ root, hue }) {
    const geo = new SphereGeometry(1.9, 48, 48); const pos = geo.attributes.position; const colors = new Float32Array(pos.count * 3); const sea = new Color('#1c5fb8'), land = new Color('#3f9a4a'), c = new Color();
    for (let i = 0; i < pos.count; i++) { const n = fbm2(pos.getX(i) * 1.3 + 9, pos.getY(i) * 1.3 + pos.getZ(i) * 0.9); c.copy(n > 0.52 ? land : sea); colors.set([c.r, c.g, c.b], i * 3); } geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
    const globe = new Mesh(geo, std('#fff', { vertexColors: true })); root.add(globe); const haze = new Mesh(new SphereGeometry(2.05, 32, 32), glow('#6b6b6b', 0)); root.add(haze);
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
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new Scene(); const camera = new PerspectiveCamera(42, 1, 0.1, 100); camera.position.set(0, 1.9, 6.2); camera.lookAt(0, 0.1, 0);
  scene.add(new AmbientLight('#ffffff', 0.55)); const key = new DirectionalLight('#ffffff', 1.75); key.position.set(3, 6, 4); scene.add(key); const fill = new DirectionalLight('#cfe2ff', 0.4); fill.position.set(-4, 2, -3); scene.add(fill); const rim = new DirectionalLight('#ffe8c2', 0.55); rim.position.set(-2, 1.5, -5); scene.add(rim);
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
      if (marker) { anchoredCount++; sp.scale.setScalar(pinScale); pins.add(sp); pins.add(label); }
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
    root.traverse((o) => { const m = o as Mesh; m.geometry?.dispose?.(); const mats = Array.isArray(m.material) ? m.material : [m.material]; mats.forEach((mt) => { (mt as MeshStandardMaterial)?.map?.dispose?.(); mt?.dispose?.(); }); });
    user.remove(root); root = new Group(); user.add(root); parts = [];
    hueNow = new Color(s.hue);
    const builder = SCENES[s.type] ?? SCENES.atom; cur = builder({ root, hue: hueNow, v: s.v ?? '', font }); param = s.p ?? 0.5; popStart = performance.now();
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
  function resize() { const r = host.getBoundingClientRect(); w = Math.max(1, r.width); h = Math.max(1, r.height); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); camZBase = (w < 600 ? 7.4 : 6.2) + (badges.length ? (anchoredCount ? 1.2 : 1.9) : 0); camera.position.z = camZBase; camera.lookAt(0, 0.1, 0); }
  new ResizeObserver(resize).observe(host); resize();
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
          const target = on ? 0.95 : pinScale;
          b.sp.scale.setScalar(b.sp.scale.x + (target - b.sp.scale.x) * 0.14);
          (b.sp.material as SpriteMaterial).opacity = on || active < 0 ? 1 : 0.78;
          b.label.position.copy(b.sp.position); b.label.position.y -= on ? 0.78 : pinScale;
          (b.label.material as SpriteMaterial).opacity = on ? 1 : 0.85; b.label.visible = true;
          const ls = on ? 0.95 : pinScale * 1.1; b.label.scale.set(2.6 * ls, 0.52 * ls, 1);
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
    camera.lookAt(0, 0.1, 0);
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
