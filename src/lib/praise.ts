/**
 * Saying well done, in one place.
 *
 * The celebration machinery already existed in `game.ts` - confetti, a few
 * synthesised tones - but only the quiz and quest games ever reached for it.
 * Ten hands-on labs shipped completely silent: a child could balance a plate,
 * find a line of symmetry or trace a letter at full marks and get back a line
 * of grey text. This is the piece that lets any page mark a win without
 * building its own canvas, its own toast and its own idea of what a win is.
 *
 * Two rules hold it together. It fires on the moment that is actually an
 * achievement, never on every drag, because a sound that happens constantly
 * stops meaning anything. And it never awards points itself: the page decides
 * what was earned and passes the number here only so it can be seen leaving
 * the spot where it was won.
 */
import { confetti, chime } from './game';
import { bn } from './bn';

type Spot = { x: number; y: number };
type At = Element | Spot;

let fx: ReturnType<typeof confetti> | null = null;
let toastEl: HTMLElement | null = null;
let toastTimer = 0;

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * One fixed canvas over the whole viewport, made on first use.
 *
 * Fixed rather than in-page so a burst can be thrown at any coordinate the
 * caller already has from `getBoundingClientRect`, with no arithmetic and no
 * markup for a page to remember to include.
 */
function layer(): ReturnType<typeof confetti> {
  if (fx) return fx;
  const c = document.createElement('canvas');
  c.setAttribute('aria-hidden', 'true');
  Object.assign(c.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '60',
  });
  document.body.appendChild(c);
  fx = confetti(c);
  return fx;
}

const spotOf = (at: At | undefined): Spot | null => {
  if (!at) return null;
  if (at instanceof Element) {
    const r = at.getBoundingClientRect();
    if (!r.width && !r.height) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return at;
};

/** The world's own colour if the page has one, else the brand. */
function hue(): string {
  const s = getComputedStyle(document.body);
  return (s.getPropertyValue('--w') || s.getPropertyValue('--brand') || '#3f7fc4').trim();
}

/** The points, drifting up from where they were earned. */
function floatPoints(at: Spot, n: number): void {
  const el = document.createElement('div');
  el.textContent = `+${bn(n)}`;
  el.setAttribute('aria-hidden', 'true');
  Object.assign(el.style, {
    position: 'fixed', left: `${at.x}px`, top: `${at.y}px`,
    transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: '61',
    font: '700 20px var(--font-display, system-ui)', color: hue(),
    textShadow: '0 1px 0 rgba(255,255,255,0.85), 0 0 10px rgba(255,255,255,0.7)',
  });
  document.body.appendChild(el);
  const done = () => el.remove();
  if (reduced()) { setTimeout(done, 900); return; }
  el.animate(
    [
      { transform: 'translate(-50%, -50%) scale(0.7)', opacity: 0 },
      { transform: 'translate(-50%, -110%) scale(1.1)', opacity: 1, offset: 0.25 },
      { transform: 'translate(-50%, -230%) scale(1)', opacity: 0 },
    ],
    { duration: 1100, easing: 'cubic-bezier(.22,.9,.3,1)' },
  ).addEventListener('finish', done);
}

/** A line along the bottom, for the wins that deserve words. */
function toast(text: string): void {
  if (!toastEl) {
    toastEl = document.createElement('p');
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    Object.assign(toastEl.style, {
      position: 'fixed', left: '50%', bottom: '22px', transform: 'translateX(-50%)',
      maxWidth: 'min(92vw, 34rem)', margin: '0', padding: '0.7rem 1.1rem',
      borderRadius: '999px', zIndex: '62', pointerEvents: 'none',
      background: 'var(--ink, #1d2430)', color: 'var(--panel, #fff)',
      font: '600 14.5px var(--font-body, system-ui)', textAlign: 'center',
      boxShadow: '0 8px 26px rgba(0,0,0,0.22)', opacity: '0',
    });
    document.body.appendChild(toastEl);
  }
  const el = toastEl;
  el.textContent = text;
  el.style.opacity = '1';
  clearTimeout(toastTimer);
  if (!reduced()) {
    el.animate(
      [{ transform: 'translate(-50%, 14px)', opacity: 0 }, { transform: 'translate(-50%, 0)', opacity: 1 }],
      { duration: 220, easing: 'ease-out' },
    );
  }
  toastTimer = window.setTimeout(() => {
    if (reduced()) { el.style.opacity = '0'; return; }
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-in' })
      .addEventListener('finish', () => { el.style.opacity = '0'; });
  }, 3200);
}

export type Praise = {
  /** Where it happened. An element is used by its centre. */
  at?: At;
  /** A round won rather than one right answer: more confetti, a longer chime. */
  big?: boolean;
  /**
   * Points to show drifting up from the spot. This does NOT award them - the
   * page awards its own, so that the number shown and the number stored can
   * never drift apart.
   */
  xp?: number;
  /** Words, for a win worth naming. */
  say?: string;
  /** 'tick' is the quiet one, 'no' marks a miss, null stays silent. */
  sound?: 'ok' | 'win' | 'no' | 'tick' | null;
};

/** Mark a win: a burst where it happened, a sound, the points, maybe a line. */
export function praise(o: Praise = {}): void {
  const at = spotOf(o.at);
  const miss = o.sound === 'no';
  if (at && !miss) layer().burst(at.x, at.y, hue(), o.big ?? false);
  const sound = o.sound === undefined ? (o.big ? 'win' : 'ok') : o.sound;
  if (sound) chime(sound);
  if (o.xp && at) floatPoints(at, o.xp);
  if (o.say) toast(o.say);
}
