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
import type { LabCard, CycleCard, PlaceCard, BalanceCard, ScrubCard } from '../data/lab-types';
import { bn } from './bn';
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

  const V = 300, C = V / 2, R = 104;
  const svg = svgEl('svg', { viewBox: `0 0 ${V} ${V}`, role: 'img', 'aria-label': `${c.n}: ${bn(n)}টি ধাপ` });
  const at = (i: number) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: C + Math.cos(a) * R, y: C + Math.sin(a) * R, a };
  };

  // the path between the stages, drawn before the stages so it sits under them
  for (let i = 0; i < (loop ? n : n - 1); i++) {
    const p0 = at(i), p1 = at((i + 1) % n);
    const mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
    const pull = 1.18;
    svg.append(svgEl('path', {
      d: `M ${p0.x} ${p0.y} Q ${C + (mid.x - C) * pull} ${C + (mid.y - C) * pull} ${p1.x} ${p1.y}`,
      fill: 'none', stroke: 'var(--line)', 'stroke-width': 2,
    }));
  }

  const nodes = c.stages.map((s, i) => {
    const p = at(i);
    const g = svgEl('g', { role: 'button', tabindex: '0', 'aria-label': s.n });
    const ring = svgEl('circle', { cx: p.x, cy: p.y, r: 30, fill: 'var(--panel-2)', stroke: 'var(--line)', 'stroke-width': 2 });
    const glyph = svgEl('text', { x: p.x, y: p.y + 9, 'font-size': 25, 'text-anchor': 'middle' });
    glyph.textContent = s.e;
    const cap = svgEl('text', {
      x: C + (p.x - C) * 1.46, y: C + (p.y - C) * 1.46 + 4,
      'font-size': 11.5, 'text-anchor': 'middle', fill: 'var(--ink-2)',
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
      x.ring.setAttribute('r', on ? '34' : '30');
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

  const shown: HTMLElement[] = [];
  for (const k of c.knobs) {
    vals[k.k] = k.value;
    const row = el('label', 'lk-knob');
    const head = el('div', 'lk-kh');
    const name = el('span', '', k.n);
    const v = el('b');
    head.append(name, v);
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
    input.addEventListener('input', () => { vals[k.k] = +input.value; print(); render(); });
    row.append(head, input);
    knobs.append(row);
    shown.push(row);
    print();
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
          : buildScrub(card, credit),
  );
}
