/**
 * সংগ্রহশালা - the shelf.
 *
 * Progress on this site was a number and a bar: honest, but nothing a child
 * wants to show anybody. This puts the same fact in a room. Every item opened
 * becomes an object standing on a shelf, and every item not yet opened stays
 * an empty pedestal beside it, so the collection is visibly incomplete without
 * anything being locked, sold, or taken away.
 *
 * The objects are the ones the site already draws. Where an item names a
 * figure in figures.ts, the real figure stands there. Where it does not, the
 * item's own emoji is drawn onto a small standing tile, so no slot is ever a
 * grey cube and nothing new had to be modelled.
 *
 * One category at a time, so the scene is twenty objects rather than eight
 * hundred and the page stays light on a cheap tablet.
 */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, Color, Vector2, Vector3, Box3, Raycaster, MathUtils,
  CylinderGeometry, MeshStandardMaterial, MeshBasicMaterial,
  CanvasTexture, Sprite, SpriteMaterial, BoxGeometry, DoubleSide, PlaneGeometry,
} from 'three';
import { FIGURES } from './figures';
import { dressScene, castShadows } from './render';

export type ShelfSlot = {
  label: string;
  /** A key into FIGURES, when this item has a real figure. */
  figure?: string;
  emoji?: string;
  got: boolean;
};
export type ShelfHandle = {
  set(slots: ShelfSlot[], hue: string): void;
  focus(i: number): void;
  destroy(): void;
};

const COLS = 5;
const GAP_X = 2.2, GAP_Y = 2.5;

/** Text drawn to a canvas and hung in the scene as a sprite. */
function textSprite(text: string, font: string, colour: string, px = 44, w = 256): Sprite {
  const c = document.createElement('canvas');
  const h = Math.round(px * 1.6);
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  g.font = `600 ${px}px ${font}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = colour;
  // Bangla labels are long; squeeze rather than clip, the way a shelf card does.
  const m = g.measureText(text).width;
  if (m > w - 12) g.setTransform((w - 12) / m, 0, 0, 1, (w - (w - 12)) / 2, 0);
  g.fillText(text, m > w - 12 ? (w / 2) * (m / (w - 12)) : w / 2, h / 2);
  const t = new CanvasTexture(c);
  t.anisotropy = 4;
  const s = new Sprite(new SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.set(w / 130, h / 130, 1);
  return s;
}

/** An emoji on a standing tile, for the items that have no figure of their own. */
function emojiTile(emoji: string, hue: Color): Group {
  const g = new Group();
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  x.font = '92px "Apple Color Emoji", "Noto Color Emoji", "Segoe UI Emoji", sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(emoji, 64, 70);
  const tex = new CanvasTexture(c);
  const face = new Mesh(
    new PlaneGeometry(0.82, 0.82),
    new MeshBasicMaterial({ map: tex, transparent: true, side: DoubleSide }),
  );
  face.position.y = 0.62;
  const back = new Mesh(
    new BoxGeometry(0.94, 0.94, 0.07),
    new MeshStandardMaterial({ color: hue.clone().lerp(new Color('#ffffff'), 0.72), roughness: 0.75 }),
  );
  back.position.set(0, 0.62, -0.05);
  g.add(back, face);
  return g;
}

export function mountShelf(host: HTMLElement, onPick?: (i: number) => void): ShelfHandle {
  const canvas = host.querySelector('canvas')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const font = getComputedStyle(document.body).fontFamily;
  const ink = getComputedStyle(document.body).getPropertyValue('--ink-2').trim() || '#3c4854';
  const muted = getComputedStyle(document.body).getPropertyValue('--muted').trim() || '#6b7987';

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  const scene = new Scene();
  const camera = new PerspectiveCamera(40, 1, 0.1, 120);
  const stage = new Group(); scene.add(stage);
  // The same shadows, tone mapping and sky environment as the world stages, so
  // a figure looks like itself in both places. No ground: these stand on their
  // own pedestals and a disc under the whole shelf would fight them.
  const look = dressScene(renderer, scene, { radius: 7, exposure: 1.02 });

  type Cell = { g: Group; body: Group | null; got: boolean; y0: number; spin: number };
  let cells: Cell[] = [];
  let rows = 1, hue = new Color('#15544c'), active = -1;

  const plankGeo = new CylinderGeometry(0.72, 0.78, 0.16, 18);
  const ghostMat = new MeshStandardMaterial({ color: '#b9c4d0', roughness: 0.9, transparent: true, opacity: 0.32 });

  /** Drain a built figure to one pale translucent material, in place. */
  function ghostify(g: Group) {
    g.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      const old = m.material as MeshStandardMaterial | MeshStandardMaterial[];
      if (Array.isArray(old)) old.forEach((x) => x.dispose()); else old?.dispose();
      m.material = new MeshStandardMaterial({
        color: '#aab6c4', roughness: 1, metalness: 0,
        transparent: true, opacity: 0.3, depthWrite: false,
      });
    });
  }

  function clear() {
    stage.traverse((o) => {
      const m = o as Mesh;
      if (m.geometry && m.geometry !== plankGeo) m.geometry.dispose();
      const mat = (m as unknown as { material?: MeshStandardMaterial | MeshStandardMaterial[] }).material;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else if (mat && mat !== ghostMat) mat.dispose();
      const sp = o as Sprite;
      if (sp.isSprite) sp.material.map?.dispose();
    });
    stage.clear();
    cells = [];
  }

  /** Scale a figure so it stands about one unit tall on its pedestal. */
  function fit(g: Group): Group {
    const wrap = new Group();
    const box = new Box3().setFromObject(g);
    const size = new Vector3(); box.getSize(size);
    const centre = new Vector3(); box.getCenter(centre);
    const big = Math.max(size.x, size.y, size.z) || 1;
    const s = 1.05 / big;
    g.scale.setScalar(s);
    g.position.set(-centre.x * s, -box.min.y * s, -centre.z * s);
    wrap.add(g);
    return wrap;
  }

  function set(slots: ShelfSlot[], hueHex: string) {
    clear();
    hue = new Color(hueHex);
    rows = Math.max(1, Math.ceil(slots.length / COLS));
    const w = (COLS - 1) * GAP_X;
    slots.forEach((slot, i) => {
      const col = i % COLS, row = Math.floor(i / COLS);
      const cell = new Group();
      cell.position.set(col * GAP_X - w / 2, -row * GAP_Y, 0);

      const plank = new Mesh(plankGeo, slot.got
        ? new MeshStandardMaterial({ color: hue.clone().lerp(new Color('#ffffff'), 0.55), roughness: 0.85 })
        : ghostMat);
      plank.position.y = -0.08;
      plank.receiveShadow = true;
      cell.add(plank);

      const build = slot.figure ? FIGURES[slot.figure] : undefined;
      let body: Group | null = null;
      if (build) {
        const g = new Group();
        build(g);
        // Not yet collected: the same figure, drained to a pale ghost. Seeing
        // the shape of what is waiting pulls harder than a question mark, and
        // it is still unmistakably not yours yet. Nothing is locked either way.
        if (!slot.got) ghostify(g);
        body = fit(g);
      } else if (slot.got) {
        body = emojiTile(slot.emoji || '✨', hue);
      }
      if (body) { castShadows(body); cell.add(body); }
      else {
        // No figure of its own and not collected: an empty pedestal.
        const q = textSprite('?', font, muted, 60, 96);
        q.position.y = 0.6;
        cell.add(q);
      }

      const label = textSprite(slot.label, font, slot.got ? ink : muted, 40, 300);
      label.position.y = -0.52;
      label.scale.multiplyScalar(0.62);
      if (!slot.got) label.material.opacity = 0.5;
      cell.add(label);

      cell.userData.i = i;
      stage.add(cell);
      cells.push({ g: cell, body, got: slot.got, y0: cell.position.y, spin: Math.random() * Math.PI * 2 });
    });
    frame();
  }

  /**
   * Put the whole grid in view, however many rows it has.
   *
   * A cell reaches about 1.3 up (the figure) and 0.6 down (its label), so the
   * content is taller than the row pitch and sits above the row origins. Both
   * have to be in the arithmetic or the top row loses its heads.
   */
  const TOP = 1.35, BOTTOM = 0.7;
  function frame() {
    const h = (rows - 1) * GAP_Y;
    stage.position.y = (h + TOP - BOTTOM) / 2;
    const spanY = h + TOP + BOTTOM, spanX = (COLS - 1) * GAP_X + 1.7;
    const r = host.getBoundingClientRect();
    const aspect = Math.max(0.4, r.width / Math.max(1, r.height || 1));
    // distance that just fits a span at this field of view, in each axis
    const half = Math.tan(MathUtils.degToRad(camera.fov) / 2);
    const dV = spanY / 2 / half;
    const dH = spanX / 2 / (half * aspect);
    camera.position.set(0, 0, Math.max(dV, dH) * 1.06 + 0.9);
    camera.lookAt(0, 0, 0);
  }

  function focus(i: number) { active = i; }

  /* ---- picking ---- */
  const ray = new Raycaster(), ndc = new Vector2();
  function pick(clientX: number, clientY: number): number {
    const r = host.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(stage.children, true)[0];
    if (!hit) return -1;
    let o = hit.object as unknown as { parent: unknown; userData: { i?: number } } | null;
    while (o && o.userData?.i === undefined) o = o.parent as typeof o;
    return o?.userData?.i ?? -1;
  }
  let downAt = { x: 0, y: 0, t: 0 };
  const onDown = (e: PointerEvent) => { downAt = { x: e.clientX, y: e.clientY, t: performance.now() }; };
  const onUp = (e: PointerEvent) => {
    if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 8 || performance.now() - downAt.t > 700) return;
    const i = pick(e.clientX, e.clientY);
    if (i >= 0) { focus(i); onPick?.(i); }
  };
  host.addEventListener('pointerdown', onDown);
  host.addEventListener('pointerup', onUp);

  /* ---- loop ---- */
  let raf = 0, last = performance.now(), t = 0;
  const ro = new ResizeObserver(() => {
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    frame();
  });
  ro.observe(host);

  function tick(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    cells.forEach((c, i) => {
      if (c.body) {
        // Collected things turn slowly, so the shelf is alive without being
        // busy. The ghosts stay still: they are not yours to play with yet.
        if (!reduced && c.got) c.body.rotation.y = c.spin + t * 0.35;
        const lift = i === active ? 0.18 : 0;
        c.body.position.y = MathUtils.lerp(c.body.position.y, lift, 0.12);
        const s = i === active ? 1.14 : 1;
        c.body.scale.setScalar(MathUtils.lerp(c.body.scale.x, s, 0.14));
      }
    });
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  return {
    set,
    focus,
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener('pointerdown', onDown);
      host.removeEventListener('pointerup', onUp);
      clear();
      plankGeo.dispose(); ghostMat.dispose(); look.dispose();
      renderer.dispose();
    },
  };
}
