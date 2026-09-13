/**
 * The pieces a hands-on page is built from.
 *
 * পরিমাপ (`/math/measurement/`) was the first of these and was written whole:
 * eight widgets, each with its own tick loop, its own drag handling and its own
 * idea of what a value is. Four of them drew the same tick scale four ways and
 * two of them implemented dragging twice, differently. Neither drag could be
 * worked with a keyboard, and neither listened for `pointercancel`, so an
 * interrupted touch left the handle stuck to the finger.
 *
 * So the parts that every later lab needs live here instead, and the
 * accessibility is fixed once rather than per widget. Nothing in this file
 * knows what it is measuring.
 */
import { markSeen, addXp } from './progress';

export const SVGNS = 'http://www.w3.org/2000/svg';

export function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K, attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const n = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n as SVGElementTagNameMap[K];
}

export const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));

/** Round to a step, keeping the decimals the step implies rather than 0.30000000000000004. */
export const snap = (v: number, step: number): number =>
  Number((Math.round(v / step) * step).toFixed(Math.max(0, String(step).split('.')[1]?.length ?? 0)));

/* ---------- drawing ---------- */

export type ScaleTicks = {
  /** Where the scale starts, in the SVG's own units. */
  x: number; y: number;
  /** How long the scale is across, and which way the ticks hang. */
  len: number; down?: boolean;
  from: number; to: number; step: number;
  /** Every `big`th tick is long and carries a label. */
  big?: number;
  short?: number; long?: number;
  stroke?: string;
  label?: (v: number) => string | null;
  labelOffset?: number;
  labelSize?: number;
  labelFill?: string;
};

/** A straight row of ticks. Rulers, beakers, thermometers, number lines. */
export function scaleTicks(parent: SVGElement, o: ScaleTicks): void {
  const { x, y, len, from, to, step, big = 5, short = 14, long = 24 } = o;
  const down = o.down ?? true;
  const span = to - from;
  const steps = Math.round(span / step);
  for (let k = 0; k <= steps; k++) {
    const v = from + k * step;
    const tx = x + (span === 0 ? 0 : ((v - from) / span) * len);
    const isBig = k % big === 0;
    const h = isBig ? long : short;
    parent.appendChild(svgEl('line', {
      x1: tx, y1: y, x2: tx, y2: down ? y + h : y - h,
      stroke: o.stroke ?? '#333', 'stroke-width': isBig ? 1.4 : 0.8,
    }));
    const text = isBig ? o.label?.(v) : null;
    if (text) {
      const t = svgEl('text', {
        x: tx, y: y + (down ? long + (o.labelOffset ?? 14) : -(long + (o.labelOffset ?? 8))),
        'font-size': o.labelSize ?? 11, 'text-anchor': 'middle', fill: o.labelFill ?? 'var(--ink-2)',
      });
      t.textContent = text;
      parent.appendChild(t);
    }
  }
}

/** Ticks and numerals round a dial. Clocks, compasses, protractors, gauges. */
export function dialTicks(
  parent: SVGElement,
  o: { cx: number; cy: number; r: number; count: number; inset?: number; labelInset?: number; label?: (i: number) => string | null; stroke?: string },
): void {
  const { cx, cy, r, count, inset = 10, labelInset = 32 } = o;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    parent.appendChild(svgEl('line', {
      x1: cx + Math.cos(a) * (r - inset), y1: cy + Math.sin(a) * (r - inset),
      x2: cx + Math.cos(a) * (r - inset - 10), y2: cy + Math.sin(a) * (r - inset - 10),
      stroke: o.stroke ?? '#556', 'stroke-width': 2,
    }));
    const text = o.label?.(i);
    if (text) {
      const t = svgEl('text', {
        x: cx + Math.cos(a) * (r - labelInset), y: cy + Math.sin(a) * (r - labelInset) + 4,
        'font-size': 12, 'text-anchor': 'middle', fill: 'var(--ink-2)',
      });
      t.textContent = text;
      parent.appendChild(t);
    }
  }
}

/**
 * A column that fills from the bottom: beaker, thermometer, rain gauge, fuel,
 * battery. The rect grows upward, so `top` is the full mark and `bottom` empty.
 */
export function fillGauge(
  rect: SVGRectElement, o: { min: number; max: number; top: number; bottom: number },
): (v: number) => void {
  const height = o.bottom - o.top;
  return (v: number) => {
    const f = clamp((v - o.min) / (o.max - o.min), 0, 1);
    const h = f * height;
    rect.setAttribute('y', String(o.bottom - h));
    rect.setAttribute('height', String(h));
  };
}

/* ---------- dragging ---------- */

/** How small a thing you have to hit may get, in real screen pixels. */
const MIN_TOUCH = 44;

/**
 * Grow a handle's invisible hit area until it is a real finger wide.
 *
 * Handles are drawn in the SVG's own units, so a pad that is a comfortable 48
 * units on a desktop shrinks with the drawing: the same pad is 20 pixels on a
 * phone, which is smaller than a fingertip and turns every one of these pages
 * into something only a mouse can use. The pad only ever grows, and grows
 * about its own centre, so a handle that deliberately sits off-centre stays
 * where its author put it.
 *
 * The pad is the child marked `data-pad`, or failing that the first
 * transparent shape inside the handle, or the handle itself when it is one.
 */
function fitPad(surface: SVGSVGElement, handle: SVGElement): void {
  const isPad = (e: Element) => e.getAttribute('fill') === 'transparent';
  const pad = handle.querySelector<SVGElement>('[data-pad]')
    ?? [...handle.children].find(isPad) as SVGElement | undefined
    ?? (isPad(handle) ? handle : null);
  if (!pad) return;
  const vb = surface.viewBox.baseVal;
  const box = surface.getBoundingClientRect();
  if (!box.width || !vb || !vb.width) return;
  const perUnit = box.width / vb.width;           // screen pixels per SVG unit
  if (!perUnit) return;
  const need = MIN_TOUCH / perUnit;               // units that make 44 pixels

  if (pad.tagName === 'circle') {
    const base = Number(pad.dataset.baseR ?? pad.getAttribute('r') ?? 0);
    pad.dataset.baseR = String(base);
    pad.setAttribute('r', String(Math.max(base, need / 2)));
    return;
  }
  const bw = Number(pad.dataset.baseW ?? pad.getAttribute('width') ?? 0);
  const bh = Number(pad.dataset.baseH ?? pad.getAttribute('height') ?? 0);
  if (!bw || !bh) return;
  pad.dataset.baseW = String(bw); pad.dataset.baseH = String(bh);
  const cx = Number(pad.dataset.baseX ?? pad.getAttribute('x') ?? 0) + bw / 2;
  const cy = Number(pad.dataset.baseY ?? pad.getAttribute('y') ?? 0) + bh / 2;
  pad.dataset.baseX = String(cx - bw / 2); pad.dataset.baseY = String(cy - bh / 2);
  const w = Math.max(bw, need), h = Math.max(bh, need);
  pad.setAttribute('width', String(w)); pad.setAttribute('height', String(h));
  pad.setAttribute('x', String(cx - w / 2)); pad.setAttribute('y', String(cy - h / 2));
}

/** Keep the hit area right through a rotation or a resize. */
function watchPad(surface: SVGSVGElement, handle: SVGElement): void {
  fitPad(surface, handle);
  // The first measurement can land before layout has settled, so take another.
  requestAnimationFrame(() => fitPad(surface, handle));
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(() => fitPad(surface, handle)).observe(surface);
  }
}

export type TrackOpts = {
  /** Where pointer events are watched. Usually the whole `<svg>`. */
  surface: SVGSVGElement;
  /**
   * A smaller thing to grab. When given, a drag has to start on it, and it is
   * what takes keyboard focus; without one the whole surface is the handle and
   * pressing anywhere jumps straight to that value.
   */
  handle?: SVGElement;
  min: number; max: number; step: number;
  value: number;
  /** Where the pointer is, as a value. */
  toValue: (clientX: number, clientY: number) => number;
  onChange: (v: number) => void;
  /** Spoken name of what is being set. */
  label: string;
  /** How the value should be read out, if a bare number is not it. */
  text?: (v: number) => string;
  /** A dial wraps: one past the last is the first again. */
  wrap?: boolean;
};

export type Track = { set: (v: number) => void; get: () => number };

/**
 * Drag a handle along a track, with a keyboard, a screen reader and an
 * interrupted touch all behaving.
 *
 * The drag itself is the easy half. The half that keeps being left out is that
 * a slider you can only reach with a pointer is a slider a lot of people
 * cannot reach at all, so the handle here is focusable, announces itself, and
 * answers the arrow keys.
 */
export function dragTrack(o: TrackOpts): Track {
  const { surface, min, max, step, wrap = false } = o;
  const grab = o.handle ?? surface;
  let value = o.value;

  const fix = (v: number): number => {
    if (wrap) {
      const span = max - min + step;
      return snap(((((v - min) % span) + span) % span) + min, step);
    }
    return snap(clamp(v, min, max), step);
  };

  const announce = () => {
    grab.setAttribute('aria-valuenow', String(value));
    grab.setAttribute('aria-valuetext', o.text ? o.text(value) : String(value));
  };
  const apply = (v: number, tell = true) => {
    const next = fix(v);
    if (next === value && tell) return;
    value = next;
    // Tell the page first, then announce. A read-out often describes more than
    // this one track - the clock says the whole time, not just the hand being
    // moved - so announcing first would say the state as it was a moment ago.
    if (tell) o.onChange(value);
    announce();
  };

  watchPad(surface, grab);
  grab.setAttribute('role', 'slider');
  grab.setAttribute('tabindex', '0');
  grab.setAttribute('aria-label', o.label);
  grab.setAttribute('aria-valuemin', String(min));
  grab.setAttribute('aria-valuemax', String(max));
  announce();
  if (!grab.getAttribute('style')?.includes('cursor')) grab.setAttribute('style', `${grab.getAttribute('style') ?? ''};cursor:grab`);

  let dragging = false;
  const stop = () => { dragging = false; grab.setAttribute('style', (grab.getAttribute('style') ?? '').replace('grabbing', 'grab')); };

  grab.addEventListener('pointerdown', (e) => {
    const ev = e as PointerEvent;
    dragging = true;
    grab.setAttribute('style', (grab.getAttribute('style') ?? '').replace('grab', 'grabbing'));
    grab.setPointerCapture(ev.pointerId);
    // Pressing the bare track means "go there"; pressing a handle means "hold this".
    if (!o.handle) apply(o.toValue(ev.clientX, ev.clientY));
    ev.preventDefault();
  });
  grab.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const ev = e as PointerEvent;
    apply(o.toValue(ev.clientX, ev.clientY));
  });
  grab.addEventListener('pointerup', stop);
  // Without this a touch interrupted by a call or a notification leaves the
  // handle glued to the finger, and the next stray move drags it away.
  grab.addEventListener('pointercancel', stop);
  grab.addEventListener('lostpointercapture', stop);

  grab.addEventListener('keydown', (e) => {
    const ev = e as KeyboardEvent;
    const jump = ev.shiftKey ? step * 10 : step;
    const moves: Record<string, number> = {
      ArrowRight: jump, ArrowUp: jump, ArrowLeft: -jump, ArrowDown: -jump,
      PageUp: step * 10, PageDown: -step * 10,
    };
    if (ev.key in moves) { apply(value + moves[ev.key]!); ev.preventDefault(); return; }
    if (ev.key === 'Home') { apply(min); ev.preventDefault(); return; }
    if (ev.key === 'End') { apply(max); ev.preventDefault(); }
  });

  return { set: (v) => apply(v, false), get: () => value };
}

export type PointOpts = {
  surface: SVGSVGElement;
  /** The thing being dragged. It takes focus and answers the arrow keys. */
  handle: SVGElement;
  /** The SVG's own width and height, for turning a client point into one of its own. */
  view: { w: number; h: number };
  x: number; y: number;
  /** Where the point may go, in the SVG's units. */
  bounds: { x0: number; y0: number; x1: number; y1: number };
  /** How far one arrow key press moves it. */
  step?: number;
  onChange: (x: number, y: number) => void;
  label: string;
};

export type Point = { set: (x: number, y: number) => void; get: () => { x: number; y: number } };

/**
 * A handle that moves in two directions rather than along a track.
 *
 * A slider announces itself with a single number, and a point has two, so this
 * is not a slider and does not pretend to be one. What a person actually needs
 * is not the coordinates but what the drawing now measures, so the handle is
 * focusable and answers the arrow keys, and the card's read-out is the live
 * region that speaks. Pair this with `aria-live="polite"` on that read-out.
 */
export function dragPoint(o: PointOpts): Point {
  const { surface, handle, view, bounds } = o;
  const step = o.step ?? 4;
  let x = o.x, y = o.y;

  const put = (nx: number, ny: number, tell = true) => {
    x = clamp(nx, bounds.x0, bounds.x1);
    y = clamp(ny, bounds.y0, bounds.y1);
    handle.setAttribute('aria-label', `${o.label}: ${Math.round(x)}, ${Math.round(y)}`);
    if (tell) o.onChange(x, y);
  };

  watchPad(surface, handle);
  handle.setAttribute('tabindex', '0');
  handle.setAttribute('role', 'button');
  handle.setAttribute('aria-label', o.label);
  if (!handle.getAttribute('style')?.includes('cursor')) {
    handle.setAttribute('style', `${handle.getAttribute('style') ?? ''};cursor:grab`);
  }

  let dragging = false;
  const stop = () => { dragging = false; handle.setAttribute('style', (handle.getAttribute('style') ?? '').replace('grabbing', 'grab')); };
  const at = (clientX: number, clientY: number) => {
    const r = surface.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * view.w, y: ((clientY - r.top) / r.height) * view.h };
  };

  handle.addEventListener('pointerdown', (e) => {
    const ev = e as PointerEvent;
    dragging = true;
    handle.setAttribute('style', (handle.getAttribute('style') ?? '').replace('grab', 'grabbing'));
    handle.setPointerCapture(ev.pointerId);
    ev.preventDefault();
  });
  handle.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const ev = e as PointerEvent;
    const p = at(ev.clientX, ev.clientY);
    put(p.x, p.y);
  });
  handle.addEventListener('pointerup', stop);
  handle.addEventListener('pointercancel', stop);
  handle.addEventListener('lostpointercapture', stop);
  handle.addEventListener('keydown', (e) => {
    const ev = e as KeyboardEvent;
    const d = ev.shiftKey ? step * 4 : step;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d],
    };
    const m = moves[ev.key];
    if (m) { put(x + m[0], y + m[1]); ev.preventDefault(); }
  });

  put(x, y, false);
  return { set: (nx, ny) => put(nx, ny, false), get: () => ({ x, y }) };
}

/**
 * Turn a pointer position into a value along a straight track.
 *
 * The SVG is drawn in its own units and then scaled to whatever width it got,
 * so a client x has to come back through that scale. Doing it from the live
 * bounding box rather than a stored ratio means it stays right after a resize,
 * a zoom, or a phone turning sideways.
 */
export const alongX = (surface: SVGSVGElement, viewW: number, pad: number, per: number) =>
  (clientX: number): number => {
    const r = surface.getBoundingClientRect();
    return (((clientX - r.left) / r.width) * viewW - pad) / per;
  };

/** The same, down the other axis. Note that SVG y grows downward. */
export const alongY = (surface: SVGSVGElement, viewH: number, pad: number, per: number) =>
  (clientY: number): number => {
    const r = surface.getBoundingClientRect();
    return (((clientY - r.top) / r.height) * viewH - pad) / per;
  };

/** Turn a pointer position into an angle in degrees, clockwise from twelve. */
export const aroundCentre = (surface: SVGSVGElement, viewW: number, cx: number, cy: number) =>
  (clientX: number, clientY: number): number => {
    const r = surface.getBoundingClientRect();
    const s = viewW / r.width;
    const a = (Math.atan2((clientY - r.top) * s - cy, (clientX - r.left) * s - cx) * 180) / Math.PI + 90;
    return a < 0 ? a + 360 : a;
  };

/* ---------- laying a scene out ---------- */

/** True when the screen is a phone held upright. */
export const isNarrow = (): boolean => matchMedia('(max-width: 640px)').matches;

/**
 * Choose the shape of a scene, wide or portrait, and return its size.
 *
 * A landscape drawing does not become a portrait one by being scaled down. At
 * 288 CSS pixels a 620-unit scene renders at 0.46, which turns every twelve
 * unit label into six pixels of unreadable text, so the scenes used to sit in
 * a sideways scroller instead. That works but hides half the drawing behind a
 * swipe.
 *
 * Instead each scene declares two shapes and lays itself out from the one it
 * gets. Everything inside must be written in terms of the returned width and
 * height rather than hard numbers, which is the whole discipline here: a scene
 * that measures itself can be given a different box.
 */
export function fitScene(
  svg: SVGSVGElement, wide: readonly [number, number], portrait: readonly [number, number],
): { w: number; h: number; narrow: boolean } {
  const narrow = isNarrow();
  const [w, h] = narrow ? portrait : wide;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  return { w, h, narrow };
}

/* ---------- tracing ---------- */

export type TraceOpts = {
  canvas: HTMLCanvasElement;
  /** Everything the tracer should see: ruled lines, the pale letter, arrows. */
  drawGuide: (g: CanvasRenderingContext2D) => void;
  /** Only the shape that has to be covered, in any solid colour. */
  drawTarget: (g: CanvasRenderingContext2D) => void;
  /** Thickness of the tracing line. */
  lineWidth?: number;
  /** Ink colour. */
  colour?: string;
  onScore: (r: { covered: number; accurate: number; strokes: number }) => void;
};

export type Trace = { clear: () => void; refresh: () => void; strokes: () => number };

/**
 * A surface you trace a shape on, and a score for how well you did.
 *
 * The shape being traced is drawn from the page's own font rather than from
 * hand-authored point paths. Authoring Bangla letterforms by hand is how a
 * handwriting page ends up teaching a letter that is subtly the wrong shape,
 * and the typeface already knows the right one.
 *
 * Scoring compares two coarse grids: how much of the letter got ink on it, and
 * how much of the ink landed on the letter. Both matter - covering the letter
 * by scribbling over the whole box is not tracing.
 *
 * There is no keyboard path here, because tracing is a hand movement and
 * pretending otherwise would be worse than saying so. Pair it with a button
 * that plays the stroke order, which is the part that can be watched.
 */
export function traceBoard(o: TraceOpts): Trace {
  const { canvas } = o;
  const W = canvas.width, H = canvas.height;
  const g = canvas.getContext('2d')!;
  const CELL = 6, cols = Math.ceil(W / CELL), rows = Math.ceil(H / CELL);

  const layer = (draw?: (c: CanvasRenderingContext2D) => void) => {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    if (draw) draw(c.getContext('2d')!);
    return c;
  };
  const ink = layer();
  const inkCtx = ink.getContext('2d')!;
  inkCtx.lineCap = inkCtx.lineJoin = 'round';
  inkCtx.lineWidth = o.lineWidth ?? 14;
  inkCtx.strokeStyle = o.colour ?? '#1d3557';

  /** Which cells of a layer carry any mark at all. */
  const cellsOf = (c: HTMLCanvasElement): Uint8Array => {
    const d = c.getContext('2d')!.getImageData(0, 0, W, H).data;
    const out = new Uint8Array(cols * rows);
    for (let y = 0; y < H; y++) {
      const row = Math.floor(y / CELL) * cols;
      for (let x = 0; x < W; x++) {
        if (d[(y * W + x) * 4 + 3]! > 100) out[row + Math.floor(x / CELL)] = 1;
      }
    }
    return out;
  };
  /** Grow a mask by one cell, which is the tolerance a finger deserves. */
  const grow = (m: Uint8Array): Uint8Array => {
    const out = new Uint8Array(m.length);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!m[r * cols + c]) continue;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const rr = r + dr, cc = c + dc;
            if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) out[rr * cols + cc] = 1;
          }
        }
      }
    }
    return out;
  };

  let target = cellsOf(layer(o.drawTarget));
  let targetFat = grow(target);

  const paint = () => {
    g.clearRect(0, 0, W, H);
    o.drawGuide(g);
    g.drawImage(ink, 0, 0);
  };

  let drawing = false, count = 0;
  const at = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const score = () => {
    const mine = cellsOf(ink);
    let hit = 0, tot = 0, on = 0, all = 0;
    const fat = grow(mine);
    for (let i = 0; i < target.length; i++) {
      if (target[i]) { tot++; if (fat[i]) hit++; }
      if (mine[i]) { all++; if (targetFat[i]) on++; }
    }
    o.onScore({ covered: tot ? hit / tot : 0, accurate: all ? on / all : 0, strokes: count });
  };

  canvas.addEventListener('pointerdown', (e) => {
    drawing = true; count++;
    canvas.setPointerCapture(e.pointerId);
    const p = at(e);
    inkCtx.beginPath();
    inkCtx.moveTo(p.x, p.y);
    inkCtx.lineTo(p.x + 0.01, p.y);
    inkCtx.stroke();
    paint();
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const p = at(e);
    inkCtx.lineTo(p.x, p.y);
    inkCtx.stroke();
    paint();
  });
  const end = () => { if (!drawing) return; drawing = false; score(); };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('lostpointercapture', end);

  paint();
  return {
    clear() { inkCtx.clearRect(0, 0, W, H); count = 0; paint(); score(); },
    refresh() { target = cellsOf(layer(o.drawTarget)); targetFat = grow(target); paint(); },
    strokes: () => count,
  };
}

/* ---------- credit ---------- */

/**
 * Count a hands-on item the same way reading one counts.
 *
 * A lab page is the world's content for that category, not a toy beside it, so
 * playing with the ruler has to fill the same bar that reading about length
 * would. পরিমাপ shipped without this: a child could spend ten minutes setting
 * the clock and the world still said nothing had been opened, which teaches
 * them that the hands-on half does not count.
 *
 * Credit lands on real use, not on arrival, and once per item.
 */
export function useItem(world: string, cat: string, item: string): boolean {
  return markSeen(world, `${cat}:${item}`);
}

/** XP for getting something right. Fiddling earns nothing; being right does. */
export function rewardCorrect(points: number): void {
  if (points > 0) addXp(points);
}
