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
