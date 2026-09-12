/**
 * Procedural 3D heroes for every category. One renderer, ~30 small scene builders,
 * all built from Three.js primitives - no models, no textures shipped.
 * Each scene reads a 0–1 `param` from the page slider so every hero is something to play with.
 */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, Object3D, Color, Vector3, MathUtils,
  SphereGeometry, BoxGeometry, CylinderGeometry, TorusGeometry, ConeGeometry, PlaneGeometry, CircleGeometry,
  IcosahedronGeometry, OctahedronGeometry, TetrahedronGeometry, DodecahedronGeometry, TubeGeometry, ExtrudeGeometry,
  Shape, CatmullRomCurve3, BufferGeometry, Float32BufferAttribute, Points, PointsMaterial, Line, LineBasicMaterial,
  MeshStandardMaterial, MeshBasicMaterial, AmbientLight, DirectionalLight, PointLight, CanvasTexture, Sprite, SpriteMaterial,
  DoubleSide, InstancedMesh, Matrix4, Quaternion, Euler,
} from 'three';

export type HeroSpec = { type: string; hue: string; v?: string; p?: number };
type Ctx = { root: Group; hue: Color; v: string; font: string };
type SceneObj = { update(t: number, dt: number, p: number): void; label: string };
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
function ring(rOut: number, rIn: number, color: Color | string, o: Record<string, unknown> = {}) {
  const m = new Mesh(new TorusGeometry((rOut + rIn) / 2, (rOut - rIn) / 2, 8, 64), std(color, o)); return m;
}
function sector(r: number, start: number, len: number, color: Color | string, h = 0.25) {
  return new Mesh(new CylinderGeometry(r, r, h, 48, 1, false, start, len), std(color));
}

/* ---------- scenes ---------- */
const SCENES: Record<string, Builder> = {
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
    return { label: 'কম্পাঙ্ক', update(t, _dt, p) {
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
    return { label: 'বিচ্ছুরণ', update(t, _dt, p) { cols.forEach((c, i) => { c.rotation.z = -(i - 3) * (0.04 + p * 0.09); }); (beam.material as MeshBasicMaterial).opacity = 0.75 + Math.sin(t * 6) * 0.15; } };
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
    cols.forEach((c, i) => { const s = sector(2.6, (i / 6) * Math.PI * 2, Math.PI / 3, c, 0.2); wheel.add(s); const a = (i + 0.5) / 6 * Math.PI * 2; const sp = v === 'fruit' ? emojiSprite(fruits[i], 0.9) : textSprite(names[i], font, '#111820', 1.1); sp.position.set(Math.cos(a) * 2, 0.4, -Math.sin(a) * 2); wheel.add(sp); });
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
    return { label: 'থ্রটল', update(t, dt, p) { r.position.y = -1 + p * 3 + Math.sin(t * 8) * 0.02 * p; r.rotation.z = Math.sin(t * 2) * 0.02; flame.scale.set(1, 0.6 + p * 1.4 + Math.random() * 0.3, 1); flame.visible = p > 0.05; const pa = pg.attributes.position as Float32BufferAttribute; for (let i = 0; i < N; i++) { let y = pa.getY(i) - dt * 2; if (y < r.position.y - 4 || pa.getX(i) === 0) { y = r.position.y - 2; pa.setX(i, rnd(-0.3, 0.3)); pa.setZ(i, rnd(-0.3, 0.3)); } pa.setX(i, pa.getX(i) * 1.02); pa.setY(i, p > 0.05 ? y : 99); } pa.needsUpdate = true; } };
  },

  letters({ root, hue, v, font }) {
    const set = v === 'en' ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') : v === 'words' ? ['মা', 'বাবা', 'বই', 'ফুল', 'পাখি', 'নদী', 'চাঁদ', 'ঘর', 'মাছ', 'গাছ'] : v === 'jukto' ? ['ক্ষ', 'জ্ঞ', 'ঙ্গ', 'ন্ত', 'স্থ', 'ষ্ট', 'ত্র', 'দ্ধ', 'ম্ব', 'শ্র'] : v === 'num' ? '০১২৩৪৫৬৭৮৯'.split('') : 'অআইঈউঊঋএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ'.split('');
    const N = Math.min(set.length, 26); const sps = set.slice(0, N).map((ch, i) => { const s = textSprite(ch, font, '#' + (i % 2 ? hue.getHexString() : darken(hue, 0.35).getHexString()), 1.1); root.add(s); return s; });
    const big = textSprite(set[0], font, '#' + hue.getHexString(), 3); root.add(big); let cur = 0;
    return { label: 'বর্ণ বাছো', update(t, _dt, p) { const sel = Math.min(N - 1, Math.floor(p * N)); if (sel !== cur) { cur = sel; big.material.map?.dispose(); big.material.dispose(); root.remove(big); const nb = textSprite(set[sel], font, '#' + hue.getHexString(), 3); root.add(nb); Object.assign(big, { material: nb.material }); root.remove(nb); root.add(big); } sps.forEach((s, i) => { const a = (i / N) * Math.PI * 2 + t * 0.12; s.position.set(Math.cos(a) * 3.2, Math.sin(a * 3 + t) * 0.5, Math.sin(a) * 1.5); s.scale.setScalar(i === sel ? 0.2 : 1.1); }); big.position.y = Math.sin(t * 1.2) * 0.15; } };
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
  setParam(v: number): void;
  /** Start or stop the idle turntable. Dragging works either way. */
  setAuto(on: boolean): void;
  isAuto(): boolean;
  /** Ease the model back to its default orientation. */
  resetView(): void;
  destroy(): void;
};

export function mountHero(
  host: HTMLElement,
  spec: HeroSpec,
  onFrame?: (info: { yawDeg: number; auto: boolean }) => void,
): HeroHandle {
  const canvas = host.querySelector('canvas')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const font = getComputedStyle(document.body).fontFamily;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new Scene(); const camera = new PerspectiveCamera(42, 1, 0.1, 100); camera.position.set(0, 1.9, 6.2); camera.lookAt(0, 0.1, 0);
  scene.add(new AmbientLight('#ffffff', 0.55)); const key = new DirectionalLight('#ffffff', 1.75); key.position.set(3, 6, 4); scene.add(key); const fill = new DirectionalLight('#cfe2ff', 0.4); fill.position.set(-4, 2, -3); scene.add(fill); const rim = new DirectionalLight('#ffe8c2', 0.55); rim.position.set(-2, 1.5, -5); scene.add(rim);
  const user = new Group(); scene.add(user); let root = new Group(); user.add(root);
  let cur: SceneObj | null = null, param = spec.p ?? 0.5, popStart = performance.now();

  function build(s: HeroSpec) {
    root.traverse((o) => { const m = o as Mesh; m.geometry?.dispose?.(); const mats = Array.isArray(m.material) ? m.material : [m.material]; mats.forEach((mt) => { (mt as MeshStandardMaterial)?.map?.dispose?.(); mt?.dispose?.(); }); });
    user.remove(root); root = new Group(); user.add(root);
    const builder = SCENES[s.type] ?? SCENES.atom; cur = builder({ root, hue: new Color(s.hue), v: s.v ?? '', font }); param = s.p ?? 0.5; popStart = performance.now(); return cur.label;
  }
  const firstLabel = build(spec);

  const IDLE_YAW = 0.22; // rad/s - a full turn every ~28s: enough to read as alive within a glance, never dizzying
  let dragging = false, lx = 0, ly = 0, vx = 0, vy = 0, yaw = 0, pitch = 0;
  // The turntable is a switchable camera behaviour, not decoration: visitors who
  // ask for reduced motion start still, and anyone can pause or reset it.
  let auto = !reduced, yawTo: number | null = null;
  const yawDeg = () => { const d = ((yaw * 180) / Math.PI) % 360; return d < 0 ? d + 360 : d; };
  host.addEventListener('pointerdown', (e) => { dragging = true; yawTo = null; lx = e.clientX; ly = e.clientY; vx = vy = 0; host.setPointerCapture(e.pointerId); host.classList.add('dragging'); });
  host.addEventListener('pointermove', (e) => { if (!dragging) return; vx = (e.clientX - lx) * 0.006; vy = (e.clientY - ly) * 0.006; lx = e.clientX; ly = e.clientY; yaw += vx; pitch = MathUtils.clamp(pitch + vy, -0.8, 0.8); });
  const up = () => { dragging = false; host.classList.remove('dragging'); }; host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);

  let w = 1, h = 1, visible = true, raf = 0, last = performance.now(), t = 0;
  function resize() { const r = host.getBoundingClientRect(); w = Math.max(1, r.width); h = Math.max(1, r.height); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); camera.position.z = w < 600 ? 7.4 : 6.2; camera.lookAt(0, 0.1, 0); }
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
    const pop = Math.min(1, (now - popStart) / 450); root.scale.setScalar(1 - Math.pow(1 - pop, 3));
    cur?.update(t, run ? dt : 0, param); renderer.render(scene, camera);
    onFrame?.({ yawDeg: yawDeg(), auto });
    raf = visible && !document.hidden ? requestAnimationFrame(frame) : 0;
  }
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); }); io.observe(host);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); }); start();
  void firstLabel;
  return {
    set: (s) => { const l = build(s); start(); return l; },
    setParam: (v) => { param = v; start(); },
    setAuto: (on) => { auto = on; start(); },
    isAuto: () => auto,
    resetView: () => { vx = vy = 0; pitch = 0; yawTo = Math.round(yaw / (Math.PI * 2)) * Math.PI * 2; start(); },
    destroy() { cancelAnimationFrame(raf); io.disconnect(); renderer.dispose(); },
  };
}
