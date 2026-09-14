/**
 * The hands-on cards, drawn from data.
 *
 * `handson.ts` holds the primitives and deliberately knows nothing about what
 * it is measuring. This knows: it takes a `LabCard` and builds the whole card,
 * so a new hands-on category is a content file rather than a page.
 *
 * Everything here builds its DOM at runtime, so its styles are in a real
 * stylesheet rather than an Astro scoped block, and every read-out is a live
 * region: these cards say their state in words, which is the only version of
 * them a screen reader gets.
 *
 * Credit works exactly as it does in the hand-built labs - using a card counts
 * the same as reading the item it stands for, because the card IS that item's
 * content and not a toy beside it.
 */
import type { LabCard, CycleCard, PlaceCard, BalanceCard, ScrubCard, CompareCard, GraphCard, ScrubKnob } from '../data/lab-types';
import { bn, bnOf } from './bn';
import { svgEl, clamp } from './handson';
import { praise } from './praise';
import { rewardCorrect } from './handson';
import './../styles/lab-kit.css';

export type Credit = (item: string) => void;

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text) n.textContent = text;
  return n;
};

/** A read-out that speaks. Every card has exactly one. */
function readout(): HTMLParagraphElement {
  const p = el('p', 'lk-out');
  p.setAttribute('role', 'status');
  p.setAttribute('aria-live', 'polite');
  return p;
}

/** A row of pressable choices, with the pressed one marked for a reader too. */
function picker(names: string[], onPick: (i: number) => void): { host: HTMLElement; mark: (i: number) => void; done: (i: number) => void } {
  const host = el('div', 'lk-pick');
  host.setAttribute('role', 'group');
  const btns = names.map((n, i) => {
    const b = el('button', '', n);
    b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => onPick(i));
    host.append(b);
    return b;
  });
  return {
    host,
    mark: (i) => btns.forEach((b, j) => b.setAttribute('aria-pressed', String(i === j))),
    done: (i) => { btns[i]?.setAttribute('data-done', '1'); },
  };
}

/* ---------------- cycle ---------------- */

/**
 * An ordered ring you step through.
 *
 * The ring is the argument: a life cycle drawn as a list is a list, and the
 * thing a child has to end up believing is that the last stage leads back to
 * the first. A sequence that genuinely ends (`loop: false`) is drawn as an arc
 * instead, because closing a line that does not close would be a lie told in
 * geometry.
 */
function buildCycle(c: CycleCard, credit: Credit): HTMLElement {
  const wrap = el('div', 'lk lk-cycle');
  const n = c.stages.length;
  const loop = c.loop !== false;

  /**
   * Wide rather than square, because the captions are Bangla words and they
   * sit outside the ring.
   *
   * The first version was a 300 square with every caption centred at 1.46 R.
   * "বাষ্পীভবন" at the top was cut off by the viewBox, "ঘনীভবন" ran off the
   * right edge and "নদী হয়ে সাগরে" off the left - three of five labels
   * unreadable. Side captions now hang outward from their node and are
   * anchored away from it, so a long name grows into the empty half of the box
   * instead of over the edge.
   */
  const VW = 420, VH = 320, CX = VW / 2, CY = 155, R = 100, NODE = 30;
  const svg = svgEl('svg', { viewBox: `0 0 ${VW} ${VH}`, role: 'img', 'aria-label': `${c.n}: ${bn(n)}টি ধাপ` });
  const at = (i: number) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: CX + Math.cos(a) * R, y: CY + Math.sin(a) * R, a };
  };

  // the path between the stages, drawn before the stages so it sits under them
  for (let i = 0; i < (loop ? n : n - 1); i++) {
    const p0 = at(i), p1 = at((i + 1) % n);
    const mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
    const pull = 1.18;
    svg.append(svgEl('path', {
      d: `M ${p0.x} ${p0.y} Q ${CX + (mid.x - CX) * pull} ${CY + (mid.y - CY) * pull} ${p1.x} ${p1.y}`,
      fill: 'none', stroke: 'var(--line)', 'stroke-width': 2,
    }));
  }

  const nodes = c.stages.map((s, i) => {
    const p = at(i);
    const g = svgEl('g', { role: 'button', tabindex: '0', 'aria-label': s.n });
    const ring = svgEl('circle', { cx: p.x, cy: p.y, r: NODE, fill: 'var(--panel-2)', stroke: 'var(--line)', 'stroke-width': 2 });
    const glyph = svgEl('text', { x: p.x, y: p.y + 9, 'font-size': 25, 'text-anchor': 'middle' });
    glyph.textContent = s.e;
    // A node near the top or bottom of the ring gets its caption above or
    // below; everything else gets it hanging outward to the side, anchored so
    // the text grows away from the drawing rather than across it.
    const side = Math.cos(p.a);
    const vertical = Math.abs(side) < 0.35;
    const cap = svgEl('text', {
      x: vertical ? p.x : p.x + (side > 0 ? NODE + 10 : -(NODE + 10)),
      y: vertical ? p.y + (Math.sin(p.a) < 0 ? -(NODE + 14) : NODE + 22) : p.y + 4,
      'font-size': 11.5, fill: 'var(--ink-2)',
      'text-anchor': vertical ? 'middle' : side > 0 ? 'start' : 'end',
    });
    cap.textContent = s.n;
    g.append(ring, glyph);
    g.style.cursor = 'pointer';
    svg.append(g, cap);
    return { g, ring, cap };
  });

  const stage = el('div', 'lk-stage');
  const h = el('h4');
  const span = el('span', 'lk-span');
  const note = el('p');
  note.setAttribute('role', 'status');
  note.setAttribute('aria-live', 'polite');
  const steps = el('div', 'lk-step');
  const back = el('button', '', '← আগের ধাপ'); back.type = 'button';
  const fwd = el('button', '', 'পরের ধাপ →'); fwd.type = 'button';
  steps.append(back, fwd);
  stage.append(h, span, note, steps);

  let cur = 0;
  const show = (i: number, mark = true) => {
    cur = loop ? (i + n) % n : clamp(i, 0, n - 1);
    const s = c.stages[cur]!;
    h.textContent = `${bn(cur + 1)}. ${s.n}`;
    span.textContent = s.span ?? '';
    span.hidden = !s.span;
    note.textContent = s.note;
    nodes.forEach((x, j) => {
      const on = j === cur;
      x.ring.setAttribute('fill', on ? 'color-mix(in oklab, var(--w) 30%, var(--panel))' : 'var(--panel-2)');
      x.ring.setAttribute('stroke', on ? 'var(--w)' : 'var(--line)');
      x.ring.setAttribute('r', on ? String(NODE + 4) : String(NODE));
      x.cap.setAttribute('fill', on ? 'var(--ink)' : 'var(--ink-2)');
      x.cap.setAttribute('font-weight', on ? '700' : '400');
      x.g.setAttribute('aria-current', String(on));
    });
    back.disabled = !loop && cur === 0;
    fwd.disabled = !loop && cur === n - 1;
    if (mark) credit(s.item ?? c.item);
  };

  nodes.forEach((x, i) => {
    x.g.addEventListener('click', () => show(i));
    x.g.addEventListener('keydown', (e) => {
      const k = (e as KeyboardEvent).key;
      if (k === 'Enter' || k === ' ') { show(i); e.preventDefault(); }
    });
  });
  back.addEventListener('click', () => show(cur - 1));
  fwd.addEventListener('click', () => show(cur + 1));

  show(0, false);
  wrap.append(svg, stage);
  return wrap;
}

/* ---------------- place ---------------- */

/**
 * Put the names on the drawing.
 *
 * Tap a name, then tap where it goes. Tap-to-place rather than drag, because a
 * drag on a phone fights the page scroll and gives a keyboard nothing at all;
 * this way the same two presses work with a finger, a mouse or a Tab key.
 *
 * A wrong answer says what IS there instead, rather than only that you were
 * wrong. Being told "no" teaches nothing; being told "that is the root" is the
 * lesson arriving a different way.
 */
function buildPlace(c: PlaceCard, credit: Credit): HTMLElement {
  const wrap = el('div', 'lk lk-place');
  const [vw, vh] = c.view;
  const svg = svgEl('svg', { viewBox: `0 0 ${vw} ${vh}`, role: 'group', 'aria-label': c.n });
  // Authored art from our own data file, parsed rather than assigned, so a
  // stray tag cannot take the rest of the card down with it.
  const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${c.art}</svg>`, 'image/svg+xml');
  for (const node of [...doc.documentElement.childNodes]) svg.append(node);

  const placed = new Set<number>();
  let held: number | null = null;

  const out = readout();
  const bank = el('div', 'lk-bank');
  const pick = picker(c.zones.map((z) => z.n), (i) => {
    if (placed.has(i)) { held = null; pick.mark(-1); say(`"${c.zones[i]!.n}" বসানো হয়ে গেছে। ${c.zones[i]!.note}`); return; }
    held = i; pick.mark(i);
    say(`"${c.zones[i]!.n}" ধরা আছে - এবার ছবিতে দেখাও কোনটা।`);
  });
  bank.append(pick.host);

  c.zones.forEach((z, i) => {
    const g = svgEl('g', { class: 'lk-zone', role: 'button', tabindex: '0', 'aria-label': `ছবির একটা জায়গা, ${bn(i + 1)}` });
    const ring = svgEl('circle', { cx: z.x, cy: z.y, r: z.r ?? 22, fill: 'var(--w)', 'fill-opacity': 0.14, stroke: 'var(--w)', 'stroke-width': 2, 'stroke-dasharray': '4 4' });
    const tag = svgEl('text', { x: z.x, y: z.y + 4, 'font-size': 11.5, 'text-anchor': 'middle', fill: 'var(--brand-ink)', 'font-weight': 700 });
    g.append(ring, tag);
    svg.append(g);
    const drop = () => {
      if (held === null) { say('আগে ডান পাশ থেকে একটা নাম বাছো, তারপর ছবিতে চাপো।'); return; }
      if (held === i) {
        placed.add(i);
        pick.done(i);
        ring.setAttribute('stroke-dasharray', '');
        ring.setAttribute('fill-opacity', '0.3');
        tag.textContent = z.n;
        g.setAttribute('aria-label', z.n);
        say(`<b>${z.n}</b> - ঠিক জায়গায়। ${z.note}`);
        praise({ at: svg, xp: 5 });
        rewardCorrect(5);
        credit(z.item ?? c.item);
        held = null; pick.mark(-1);
        if (placed.size === c.zones.length) {
          praise({ at: svg, big: true, say: `${c.n} - সবগুলো নাম বসে গেছে!` });
        }
        return;
      }
      const mine = c.zones[held]!;
      g.classList.add('lk-shake');
      setTimeout(() => g.classList.remove('lk-shake'), 340);
      say(`এটা "${mine.n}" নয় - এটা <b>${z.n}</b>। ${z.note}`);
    };
    g.addEventListener('click', drop);
    g.addEventListener('keydown', (e) => {
      const k = (e as KeyboardEvent).key;
      if (k === 'Enter' || k === ' ') { drop(); e.preventDefault(); }
    });
  });

  function say(html: string) { out.innerHTML = html; }
  say('ডান পাশের একটা নাম বাছো, তারপর ছবিতে চাপো যেখানে সেটা আছে।');

  const side = el('div');
  side.append(bank, out);
  wrap.append(svg, side);
  return wrap;
}

/* ---------------- balance ---------------- */

/**
 * A pool of things, and a target to hit with them.
 *
 * A plate, a week's budget, a flood go-bag and a habitat are the same card:
 * pick from a pool, watch meters fill against what this round asks for, and be
 * told what is still missing rather than only whether you won. When a budget
 * is set, spending past it is a real failure with a real number attached,
 * because a budget that cannot be broken is not teaching a budget.
 */
function buildBalance(c: BalanceCard, credit: Credit): HTMLElement {
  const wrap = el('div', 'lk lk-bal');
  const unit = c.unit ?? 'টা';
  const count = new Map<string, number>();
  const cheered = new Set<string>();
  let round = c.rounds[0]!;

  const left = el('div');
  const rounds = picker(c.rounds.map((r) => r.n), (i) => {
    round = c.rounds[i]!;
    rounds.mark(i);
    count.clear();
    render();
  });
  const tray = el('div', 'lk-tray');
  tray.setAttribute('role', 'list');
  tray.setAttribute('aria-label', 'যা যা নেওয়া হয়েছে');
  const pantry = el('div', 'lk-pantry');
  pantry.setAttribute('role', 'group');
  pantry.setAttribute('aria-label', 'বাছার জিনিস');
  left.append(rounds.host, tray, pantry);

  const right = el('div');
  const meters = el('div', 'lk-meters');
  const out = readout();
  right.append(meters, out);

  const groupOf = (n: string) => c.pool.find((p) => p.n === n)!.g;
  const costOf = (n: string) => c.pool.find((p) => p.n === n)!.cost ?? 0;

  pantry.replaceChildren(...c.pool.map((p) => {
    const b = el('button');
    b.type = 'button';
    b.dataset.n = p.n;
    b.append(el('span', '', p.e), document.createTextNode(p.n));
    if (c.budget) b.append(el('span', 'lk-n', ` ${bn(p.cost ?? 0)}`));
    b.addEventListener('click', () => { count.set(p.n, (count.get(p.n) ?? 0) + 1); render(); });
    return b;
  }));

  function render() {
    const have: Record<string, number> = {};
    let spent = 0;
    const chosen: { n: string; e: string }[] = [];
    for (const [n, k] of count) {
      have[groupOf(n)] = (have[groupOf(n)] ?? 0) + k;
      spent += costOf(n) * k;
      const p = c.pool.find((x) => x.n === n)!;
      for (let i = 0; i < k; i++) chosen.push({ n: p.n, e: p.e });
    }

    tray.replaceChildren(...chosen.map((x) => {
      const b = el('button');
      b.type = 'button';
      b.setAttribute('aria-label', `${x.n} সরাও`);
      b.append(el('span', '', x.e), document.createTextNode(x.n), el('span', '', '✕'));
      b.addEventListener('click', () => {
        const k = count.get(x.n) ?? 0;
        if (k <= 1) count.delete(x.n); else count.set(x.n, k - 1);
        render();
      });
      return b;
    }));

    meters.replaceChildren(...c.groups.map((g) => {
      const want = round.want[g.k] ?? 0, got = have[g.k] ?? 0;
      const row = el('div', 'lk-m');
      const track = el('span', 'lk-t');
      const bar = el('i');
      bar.style.width = `${want ? clamp(got / want, 0, 1) * 100 : got ? 100 : 0}%`;
      bar.style.background = g.hue;
      track.append(bar);
      row.append(el('span', '', g.n), track, el('span', 'lk-n', want ? `${bn(got)} / ${bn(want)}` : got ? bn(got) : '-'));
      return row;
    }));

    for (const b of pantry.querySelectorAll<HTMLButtonElement>('button')) {
      const k = count.get(b.dataset.n!) ?? 0;
      b.dataset.on = k ? '1' : '';
    }

    const missing = c.groups.filter((g) => (round.want[g.k] ?? 0) > (have[g.k] ?? 0));
    const over = c.budget ? spent > c.budget.amount : false;
    const money = c.budget ? `<span class="lk-note">খরচ ${bn(spent)} / ${bn(c.budget.amount)} ${c.budget.unit}</span>` : '';

    if (!chosen.length) {
      out.innerHTML = `<b>${round.n}</b> সাজাও - নিচে চাপো।<span class="lk-note">${round.note}</span>${money}`;
    } else if (over) {
      out.innerHTML = `<b>${c.budget!.label} ছাড়িয়ে গেছে।</b> ${bn(spent - c.budget!.amount)} ${c.budget!.unit} বেশি খরচ হয়ে গেছে - কিছু একটা ফেরত দাও।${money}`;
      cheered.delete(round.k);
    } else if (missing.length) {
      out.innerHTML = `এখনো বাদ আছে <b>${missing.map((g) => g.n).join(', ')}</b>।<span class="lk-note">${round.note}</span>${money}`;
      cheered.delete(round.k);
    } else {
      out.innerHTML = `<b>${round.n} মিলে গেছে!</b> ${bn(chosen.length)}${unit} দিয়ে সবটা হয়েছে।<span class="lk-note">${round.note}</span>${money}`;
      if (!cheered.has(round.k)) {
        cheered.add(round.k);
        praise({ at: meters, xp: 10, say: `${round.n} মিলে গেছে!` });
        rewardCorrect(10);
      }
    }
    credit(round.item ?? c.item);
  }

  rounds.mark(0);
  render();
  wrap.append(left, right);
  return wrap;
}

/**
 * One slider, its label and its live value.
 *
 * Shared by `scrub` and `graph`: both are "move a handle, watch real
 * arithmetic answer", and the only difference is whether the answer is printed
 * or plotted. Two copies of this would have drifted within a week.
 */
function knobRow(k: ScrubKnob, vals: Record<string, number>, onInput: () => void): HTMLElement {
  const row = el('label', 'lk-knob');
  const head = el('div', 'lk-kh');
  const v = el('b');
  head.append(el('span', '', k.n), v);
  const input = el('input');
  input.type = 'range';
  input.min = String(k.min); input.max = String(k.max); input.step = String(k.step);
  input.value = String(k.value);
  input.setAttribute('aria-label', k.n);
  const print = () => {
    const t = k.text ? k.text(vals[k.k]!) : `${bn(vals[k.k]!)} ${k.unit}`.trim();
    v.textContent = t;
    input.setAttribute('aria-valuetext', t);
  };
  input.addEventListener('input', () => { vals[k.k] = +input.value; print(); onInput(); });
  row.append(head, input);
  print();
  return row;
}

/* ---------------- compare ---------------- */

/**
 * Two things side by side, and the ratio between them.
 *
 * The ratio line is the point of the card. "বৃহস্পতির ব্যাস ১,৩৯,৮২০ কিলোমিটার"
 * is a fact to be memorised and forgotten; "পৃথিবীর ১১ গুণ চওড়া" is a picture.
 * Both numbers were already on the site - they were just never next to each
 * other.
 */
function buildCompare(c: CompareCard, credit: Credit): HTMLElement {
  const wrap = el('div', 'lk');
  const [a0, b0] = c.start ?? [0, Math.min(1, c.items.length - 1)];
  let ai = a0, bi = b0;

  const rows = el('div', 'lk-cmp-pick');
  const mk = (side: 'a' | 'b', label: string) => {
    const box = el('div');
    box.append(Object.assign(el('span', 'lk-cmp-side'), { textContent: label }));
    const p = picker(c.items.map((i) => `${i.e ? `${i.e} ` : ''}${i.n}`), (i) => {
      if (side === 'a') ai = i; else bi = i;
      p.mark(i);
      render();
    });
    box.append(p.host);
    rows.append(box);
    return p;
  };
  const pa = mk('a', 'বাঁয়ে');
  const pb = mk('b', 'ডানে');

  const table = el('div', 'lk-cmp');
  const out = readout();

  function render() {
    const A = c.items[ai]!, B = c.items[bi]!;
    table.replaceChildren();
    const head = el('div', 'lk-cmp-h');
    head.append(el('b', '', A.n), el('span', '', 'তুলনা'), el('b', '', B.n));
    table.append(head);
    for (const st of c.stats) {
      const va = A.stats[st.k], vb = B.stats[st.k];
      const row = el('div', 'lk-cmp-row');
      const name = el('span', 'lk-cmp-n', st.n);
      const show = (v: number | undefined) =>
        v === undefined ? '-' : st.fmt ? st.fmt(v) : `${bn(v)}${st.unit ? ` ${st.unit}` : ''}`;
      const top = st.max ?? (Math.max(va ?? 0, vb ?? 0) || 1);
      const barA = el('span', 'lk-cmp-bar lk-cmp-l');
      const ia = el('i'); ia.style.width = `${clamp((va ?? 0) / top, 0, 1) * 100}%`;
      barA.append(ia);
      const barB = el('span', 'lk-cmp-bar');
      const ib = el('i'); ib.style.width = `${clamp((vb ?? 0) / top, 0, 1) * 100}%`;
      barB.append(ib);
      row.append(el('span', 'lk-cmp-v', show(va)), barA, name, barB, el('span', 'lk-cmp-v', show(vb)));
      table.append(row);
    }

    // the ratio, on the first stat both of them have
    const st = c.stats.find((x) => A.stats[x.k] !== undefined && B.stats[x.k] !== undefined && B.stats[x.k] !== 0);
    let ratio = '';
    if (st && ai !== bi) {
      const va = A.stats[st.k]!, vb = B.stats[st.k]!;
      const big = va >= vb ? A : B, small = va >= vb ? B : A;
      const k = Math.max(va, vb) / Math.min(va, vb);
      ratio = Number.isFinite(k)
        ? ` <b>${bnOf(big.n)}</b> ${st.n} <b>${bnOf(small.n)}</b> <b>${bn(k >= 10 ? k.toFixed(0) : k.toFixed(1))} গুণ</b>।`
        : '';
    }
    out.innerHTML = ai === bi
      ? `<b>${A.n}</b> - ${A.note}<span class="lk-note">দুই পাশে আলাদা দুটো বাছলে তুলনাটা দেখা যাবে।</span>`
      : `${ratio}<span class="lk-note"><b>${A.n}:</b> ${A.note}<br><b>${B.n}:</b> ${B.note}</span>`;
    if (A.item) credit(A.item);
    if (B.item) credit(B.item);
    credit(c.item);
  }

  pa.mark(ai); pb.mark(bi);
  render();
  wrap.append(rows, table, out);
  if (c.source) wrap.append(el('p', 'lk-src', c.source));
  return wrap;
}

/* ---------------- graph ---------------- */

/**
 * A top-of-scale whose quarters are round numbers.
 *
 * Rounding the peak alone is not enough: a peak of 24 rounds to 25, and the
 * four gridlines below it then read ০, ৬.৩, ১২.৫, ১৮.৮ - which is worse than
 * no labels. Rounding the *step* instead and multiplying by four gives an axis
 * a child can read off.
 */
function niceTop(peak: number): number {
  if (peak <= 0) return 4;
  const rough = peak / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const n = rough / mag;
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  return step * 4;
}

/** Whole numbers lose the decimal point; ০.০ on an axis is noise. */
const axisNum = (v: number): string => bn(Number.isInteger(v) ? String(v) : v.toFixed(1));

/**
 * A curve that bends when you drag a handle.
 *
 * Plotted from the same kind of real formula a `scrub` card computes, sampled
 * across the x range. The y scale refits itself to whatever the formula
 * produces, because a fixed scale either flattens the interesting part or
 * pushes it off the top the moment a slider moves.
 */
function buildGraph(c: GraphCard, credit: Credit): HTMLElement {
  const wrap = el('div', 'lk');
  const vals: Record<string, number> = {};
  const knobs = el('div', 'lk-knobs');
  const out = readout();

  const VW = 460, VH = 280, L = 46, R = 12, T = 14, B = 34;
  const svg = svgEl('svg', { viewBox: `0 0 ${VW} ${VH}`, class: 'lk-plot', role: 'img', 'aria-label': `${c.n}: লেখচিত্র` });
  const plot = svgEl('g', {});
  const axes = svgEl('g', {});
  svg.append(axes, plot);

  const legend = el('div', 'lk-legend');
  for (const ln of c.lines) {
    const chip = el('span', 'lk-leg');
    const dot = el('i'); dot.style.background = ln.hue;
    chip.append(dot, document.createTextNode(ln.n));
    legend.append(chip);
  }

  for (const k of c.knobs) {
    vals[k.k] = k.value;
    knobs.append(knobRow(k, vals, () => render()));
  }

  const SAMPLES = 90;
  const px = (x: number) => L + ((x - c.x.min) / (c.x.max - c.x.min || 1)) * (VW - L - R);
  function render(mark = true) {
    // sample every line first, so the y scale can fit all of them together
    const series = c.lines.map((ln) => {
      const pts: [number, number][] = [];
      for (let i = 0; i <= SAMPLES; i++) {
        const x = c.x.min + ((c.x.max - c.x.min) * i) / SAMPLES;
        const y = ln.f(x, vals);
        if (Number.isFinite(y)) pts.push([x, y]);
      }
      return { ln, pts };
    });
    const peak = Math.max(0, ...series.flatMap((s) => s.pts.map((p) => p[1])));
    const top = c.y.max ?? niceTop(peak || 1);
    const py = (y: number) => VH - B - (clamp(y / top, 0, 1)) * (VH - T - B);

    axes.replaceChildren();
    // gridlines and y labels
    for (let i = 0; i <= 4; i++) {
      const y = (top * i) / 4;
      axes.append(svgEl('line', { x1: L, y1: py(y), x2: VW - R, y2: py(y), stroke: 'var(--line)', 'stroke-width': i === 0 ? 1.6 : 0.8, 'stroke-opacity': i === 0 ? 1 : 0.55 }));
      const t = svgEl('text', { x: L - 6, y: py(y) + 4, 'font-size': 10.5, 'text-anchor': 'end', fill: 'var(--muted)' });
      t.textContent = axisNum(y);
      axes.append(t);
    }
    // x axis ticks
    for (let i = 0; i <= 4; i++) {
      const x = c.x.min + ((c.x.max - c.x.min) * i) / 4;
      axes.append(svgEl('line', { x1: px(x), y1: py(0), x2: px(x), y2: py(0) + 5, stroke: 'var(--line)', 'stroke-width': 1.2 }));
      const t = svgEl('text', { x: px(x), y: py(0) + 18, 'font-size': 10.5, 'text-anchor': 'middle', fill: 'var(--muted)' });
      t.textContent = axisNum(x);
      axes.append(t);
    }
    const xl = svgEl('text', { x: (L + VW - R) / 2, y: VH - 4, 'font-size': 11, 'text-anchor': 'middle', fill: 'var(--ink-2)' });
    xl.textContent = `${c.x.n}${c.x.unit ? ` (${c.x.unit})` : ''}`;
    axes.append(xl);
    const yl = svgEl('text', { x: 12, y: (T + VH - B) / 2, 'font-size': 11, 'text-anchor': 'middle', fill: 'var(--ink-2)', transform: `rotate(-90 12 ${(T + VH - B) / 2})` });
    yl.textContent = `${c.y.n}${c.y.unit ? ` (${c.y.unit})` : ''}`;
    axes.append(yl);

    plot.replaceChildren();
    for (const { ln, pts } of series) {
      if (!pts.length) continue;
      plot.append(svgEl('polyline', {
        points: pts.map(([x, y]) => `${px(x).toFixed(1)},${py(y).toFixed(1)}`).join(' '),
        fill: 'none', stroke: ln.hue, 'stroke-width': 2.6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round',
      }));
    }
    out.innerHTML = c.read(vals);
    if (!mark) return;
    credit(c.item);
    for (const it of c.also ?? []) credit(it);
  }

  render(false);
  wrap.append(knobs, svg, legend, out);
  if (c.source) wrap.append(el('p', 'lk-src', c.source));
  return wrap;
}
/* ---------------- scrub ---------------- */

/**
 * Sliders, and a formula that actually runs.
 *
 * This is the shape most of সরল যন্ত্র is, and the one card type here that
 * carries code, because the arithmetic IS the content: a সুদ card whose
 * interest is not compounded is not a সুদ card. What it saves is everything
 * around the arithmetic - the sliders, the Bangla numerals, the live region,
 * the figures and the bars - which was four hundred of those eight hundred
 * lines.
 */
function buildScrub(c: ScrubCard, credit: Credit): HTMLElement {
  const wrap = el('div', 'lk');
  const vals: Record<string, number> = {};
  const knobs = el('div', 'lk-knobs');
  const figs = el('div', 'lk-figs');
  const bars = el('div', 'lk-meters');
  const out = readout();

  for (const k of c.knobs) {
    vals[k.k] = k.value;
    knobs.append(knobRow(k, vals, () => render()));
  }

  function render(mark = true) {
    const r = c.compute(vals);
    figs.replaceChildren(...r.lines.map((l) => {
      const f = el('div', 'lk-fig');
      f.append(el('span', '', l.n), el('b', '', l.v));
      return f;
    }));
    bars.replaceChildren(...(r.bars ?? []).map((b) => {
      const row = el('div', 'lk-m');
      const track = el('span', 'lk-t');
      const i = el('i');
      i.style.width = `${clamp(b.frac, 0, 1) * 100}%`;
      i.style.background = b.hue ?? 'var(--w)';
      track.append(i);
      row.append(el('span', '', b.n), track, el('span', 'lk-n', b.v ?? ''));
      return row;
    }));
    bars.hidden = !(r.bars ?? []).length;
    out.innerHTML = r.say;
    if (!mark) return;
    credit(c.item);
    for (const it of c.also ?? []) credit(it);
  }

  render(false);
  wrap.append(knobs, figs, bars, out);
  if (c.source) {
    const s = el('p', 'lk-src', c.source);
    wrap.append(s);
  }
  return wrap;
}

/* ---------------- the card ---------------- */

/** Build one card's body into `host`. The heading and number are the page's. */
export function buildCard(host: HTMLElement, card: LabCard, credit: Credit): void {
  const how = el('p', 'lk-how', card.how);
  host.append(how);
  host.append(
    card.kind === 'cycle' ? buildCycle(card, credit)
      : card.kind === 'place' ? buildPlace(card, credit)
        : card.kind === 'balance' ? buildBalance(card, credit)
          : card.kind === 'compare' ? buildCompare(card, credit)
            : card.kind === 'graph' ? buildGraph(card, credit)
              : buildScrub(card, credit),
  );
}
