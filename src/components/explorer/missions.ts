/**
 * The mission player: one full-screen panel that runs any mission from
 * data/missions.ts. Mechanics, all of them real and all of them on screen:
 *   - a progress bar across the steps of the mission
 *   - three hearts; a mistake costs one, none left ends the run
 *   - points per correct step, plus a speed bonus that drains over six seconds
 *   - a combo that doubles points after three correct in a row
 *   - a finish screen with stars from the hearts kept, a stamp and confetti
 * It builds its own DOM, so its styles live in a global block on the page
 * (Astro's scoped CSS never reaches nodes made at runtime).
 */
import type { Mission, OrderRound, IdRound, PathStop, SortItem, ChoiceRound, CalcRound, BuildItem } from '../../data/missions';
import { varyMission, varies } from '../../data/missions';
import { bn } from '../../lib/bn';
import { confetti, chime } from '../../lib/game';

export type MissionResult = { stars: number; points: number; mistakes: number; seconds: number; perfect: boolean };
type Opts = { name: string; no: string; hue: string; onDone(r: MissionResult): void; onClose(): void };

const HEARTS = 3, STEP_BASE = 10, SPEED_MAX = 10, SPEED_MS = 6000, COMBO_AT = 3, PERFECT_BONUS = 25;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = '') => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
const shuffle = <T,>(a: T[]) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j]!, b[i]!]; } return b; };

// Astro gathers the CSS of everything a page can reach and links it in the
// head, dynamic imports included, so there is no way to defer this from here.
// It is 3KB over the wire and immutable-cached, which is a fair price for the
// panel never appearing unstyled.
import '../../styles/mission-panel.css';

export function playMission(base: Mission, o: Opts): { close(): void } {
  /**
   * Each attempt gets its own deal: which rounds come, and in what order.
   * The seed changes on every restart, so "আবার খেলো" is a new game rather
   * than the same seven puzzles in the same seven places. Held in a variable
   * rather than recomputed, so a mid-mission repaint cannot reshuffle the
   * board under the player.
   */
  let attempt = 0;
  let spec = varyMission(base, `${Date.now()}:${attempt}`);
  const varyNote = varies(base);

  /* ---- shell ---- */
  // only ever one mission panel on screen: a second one would stack on the first
  document.querySelectorAll('.mz').forEach((n) => n.remove());
  const wrap = el('div', 'mz'); wrap.style.setProperty('--w', o.hue);
  wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-label', o.name);
  const panel = el('div', 'mz-panel');
  const top = el('div', 'mz-top');
  const title = el('div', 'mz-title'); title.append(el('span', 'mz-no', `মিশন ${o.no}`), el('b', '', o.name));
  const hearts = el('div', 'mz-hearts'); hearts.setAttribute('aria-label', 'জীবন');
  const score = el('div', 'mz-score'); const scoreN = el('b', '', '০'); const combo = el('span', 'mz-combo', 'কম্বো ×২'); combo.hidden = true; score.append(scoreN, el('span', '', 'পয়েন্ট'), combo);
  const close = el('button', 'mz-close', '✕'); close.type = 'button'; close.setAttribute('aria-label', 'মিশন বন্ধ করো');
  top.append(title, hearts, score, close);
  const bar = el('div', 'mz-bar'); const barI = el('i'); bar.append(barI);
  const body = el('div', 'mz-body');
  const foot = el('p', 'mz-foot'); foot.setAttribute('role', 'status'); foot.setAttribute('aria-live', 'polite');
  const fxc = document.createElement('canvas'); fxc.className = 'mz-fx';
  panel.append(top, bar, body, foot, fxc); wrap.append(panel); document.body.append(wrap);
  document.body.classList.add('mz-open');
  const fx = confetti(fxc);
  const burstAt = (node: Element, big = false) => { const r = node.getBoundingClientRect(), p = panel.getBoundingClientRect(); fx.burst(r.left - p.left + r.width / 2, r.top - p.top + r.height / 2, o.hue, big); };

  /* ---- state ---- */
  let lives = HEARTS, points = 0, streak = 0, mistakes = 0, stepStart = 0, steps = 0, done = 0, over = false;
  const t0 = performance.now();
  function renderHearts() { hearts.replaceChildren(...Array.from({ length: HEARTS }, (_v, i) => el('span', i < lives ? 'on' : 'off', '♥'))); }
  function setProgress() { barI.style.width = `${(done / Math.max(1, steps)) * 100}%`; }
  function addPoints(n: number, at?: Element) {
    points += n; scoreN.textContent = bn(points);
    if (!reduced()) scoreN.animate([{ transform: 'scale(1.35)' }, { transform: 'none' }], { duration: 280, easing: 'ease-out' });
    if (at) { const f = el('span', 'mz-plus', `+${bn(n)}`); const r = at.getBoundingClientRect(), p = panel.getBoundingClientRect(); f.style.left = `${r.left - p.left + r.width / 2}px`; f.style.top = `${r.top - p.top}px`; panel.append(f); setTimeout(() => f.remove(), 1000); }
  }
  /** One correct step: base, speed bonus, combo. */
  function correct(at: Element) {
    const speed = Math.round(SPEED_MAX * Math.max(0, 1 - (performance.now() - stepStart) / SPEED_MS));
    streak++;
    const mult = streak >= COMBO_AT ? 2 : 1;
    combo.hidden = mult === 1;
    addPoints((STEP_BASE + speed) * mult, at);
    done++; setProgress(); chime('ok'); burstAt(at);
    stepStart = performance.now();
  }
  /** One mistake: a heart, the combo, and maybe the run. */
  function wrong(at: Element): boolean {
    mistakes++; streak = 0; combo.hidden = true; lives--; renderHearts(); chime('no');
    if (!reduced()) { at.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(-4px)' }, { transform: 'none' }], { duration: 380 }); hearts.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 300 }); }
    if (lives <= 0) { fail(); return false; }
    return true;
  }
  function fail() {
    over = true;
    body.replaceChildren();
    const card = el('div', 'mz-end mz-fail');
    card.append(el('p', 'mz-stamp', 'হৃদয় শেষ'), el('h3', '', 'এবার হলো না'), el('p', 'mz-sum',
      done === 0
        ? 'তিনটি হৃদয়ই চলে গেল, একটা ধাপও পার হয়নি। মিশন শেষ করলে তবেই পয়েন্ট জমা হয়, তাই আরেকবার নামো।'
        : `${bn(done)}টি ধাপ পার করেছিলে, ${bn(points)} পয়েন্ট জমেছিল। মিশন শেষ করলে তবেই পয়েন্ট জমা হয়, তাই আবার নামো।`));
    const again = el('button', 'mz-btn mz-primary', 'আবার চেষ্টা করো'); again.type = 'button'; again.addEventListener('click', () => restart());
    const quit = el('button', 'mz-btn', 'বেরিয়ে যাও'); quit.type = 'button'; quit.addEventListener('click', () => shut());
    const btns = el('div', 'mz-btns'); btns.append(again, quit); card.append(btns); body.append(card);
    foot.textContent = '';
  }
  function finish() {
    over = true;
    const perfect = lives === HEARTS;
    if (perfect) points += PERFECT_BONUS;
    const stars = lives;
    const seconds = Math.round((performance.now() - t0) / 1000);
    body.replaceChildren();
    const card = el('div', 'mz-end');
    const stamp = el('p', 'mz-stamp mz-stamp-ok', 'মিশন সম্পূর্ণ');
    const st = el('p', 'mz-stars', '★'.repeat(stars) + '☆'.repeat(HEARTS - stars));
    card.append(stamp, st, el('h3', '', perfect ? 'নিখুঁত!' : stars === 2 ? 'দারুণ!' : 'শেষ করেছ!'),
      el('p', 'mz-sum', `${bn(points)} পয়েন্ট, ${bn(seconds)} সেকেন্ডে, ${mistakes ? `ভুল ${bn(mistakes)}টি` : 'একটাও ভুল না করে'}।${perfect ? ` সব হৃদয় বাঁচিয়ে রাখার বোনাস +${bn(PERFECT_BONUS)}।` : ''} পুরোটাই জ্ঞানবিন্দুতে যোগ হলো।`));
    const okBtn = el('button', 'mz-btn mz-primary', 'দারুণ, ফিরে যাই'); okBtn.type = 'button'; okBtn.addEventListener('click', () => shut());
    const again = el('button', 'mz-btn', 'আবার খেলো'); again.type = 'button'; again.addEventListener('click', () => restart());
    const btns = el('div', 'mz-btns'); btns.append(okBtn, again); card.append(btns); body.append(card);
    foot.textContent = '';
    scoreN.textContent = bn(points);
    chime('win'); burstAt(stamp, true);
    o.onDone({ stars, points, mistakes, seconds, perfect });
  }
  function restart() {
    attempt++;
    spec = varyMission(base, `${Date.now()}:${attempt}`);
    lives = HEARTS; points = 0; streak = 0; mistakes = 0; done = 0; over = false;
    combo.hidden = true; scoreN.textContent = '০'; renderHearts(); setProgress(); run();
  }
  function shut() { document.body.classList.remove('mz-open'); wrap.remove(); document.removeEventListener('keydown', onKey); o.onClose(); }
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') shut(); };
  document.addEventListener('keydown', onKey);
  close.addEventListener('click', shut);
  wrap.addEventListener('click', (e) => { if (e.target === wrap) shut(); });

  /* ---- an intro card before the first step, so the child knows the rule ---- */
  function intro(text: string, start: () => void) {
    body.replaceChildren();
    const card = el('div', 'mz-intro');
    card.append(el('p', 'mz-rule', text), el('p', 'mz-rule-s', `তিনটি হৃদয় ♥♥♥ আছে, ভুল হলে একটা যায়। যত তাড়াতাড়ি, তত বেশি পয়েন্ট; পরপর ${bn(COMBO_AT)}টি ঠিক হলে কম্বো ×২।`));
    // The child should know the second attempt is a different game, or they
    // will not take one.
    if (varyNote) card.append(el('p', 'mz-vary', `🎲 ${varyNote}, তাই প্রতিবার নতুন খেলা।`));
    const go = el('button', 'mz-btn mz-primary mz-go', 'শুরু করো ▶'); go.type = 'button'; go.addEventListener('click', () => { chime('tick'); start(); });
    card.append(go); body.append(card); go.focus();
    foot.textContent = '';
  }

  /* ---- game type: order the chain ---- */
  function runOrder(rounds: OrderRound[], askFirst?: string, askNext?: string, wrongMsg?: string) {
    const fill = (tpl: string, first: string, prev: string) => tpl.replace('{first}', first).replace('{prev}', prev);
    steps = rounds.reduce((s, r) => s + r.chain.length - 1, 0); setProgress();
    let ri = 0;
    const round = () => {
      const r = rounds[ri]!; let pos = 1;
      body.replaceChildren();
      body.append(el('p', 'mz-round', `${bn(ri + 1)} / ${bn(rounds.length)} · ${r.title}`));
      const chain = el('div', 'mz-chain');
      const slots = r.chain.map((_n, i) => { const s = el('div', 'mz-slot'); if (i === 0) { s.classList.add('on'); s.append(el('span', 'mz-em', r.emoji[0]!), el('span', '', r.chain[0]!)); } else s.append(el('span', 'mz-em', '?')); return s; });
      slots.forEach((s, i) => { chain.append(s); if (i < slots.length - 1) chain.append(el('span', 'mz-arrow', '→')); });
      const hand = el('div', 'mz-hand');
      const cards = shuffle(r.chain.slice(1).map((n, i) => ({ n, e: r.emoji[i + 1]! })));
      for (const c of cards) {
        const b = el('button', 'mz-card'); b.type = 'button'; b.append(el('span', 'mz-em', c.e), el('span', '', c.n));
        b.addEventListener('click', () => {
          if (over || b.disabled) return;
          if (c.n === r.chain[pos]) {
            b.disabled = true; b.classList.add('used');
            const s = slots[pos]!; s.replaceChildren(el('span', 'mz-em', c.e), el('span', '', c.n)); s.classList.add('on');
            if (!reduced()) s.animate([{ transform: 'scale(0.6)' }, { transform: 'scale(1.12)' }, { transform: 'none' }], { duration: 320 });
            correct(s); pos++;
            foot.textContent = pos < r.chain.length ? fill(askNext ?? 'এরপর কোনটা?', r.chain[0]!, c.n) : '';
            if (pos >= r.chain.length) {
              foot.textContent = r.note;
              const next = el('button', 'mz-btn mz-primary mz-next', ri + 1 < rounds.length ? 'পরের শৃঙ্খল ▶' : 'শেষ করো ✔'); next.type = 'button';
              next.addEventListener('click', () => { ri++; if (ri < rounds.length) round(); else finish(); });
              hand.replaceChildren(next); next.focus();
            }
          } else {
            foot.textContent = fill(wrongMsg ?? 'উঁহু, ওটা এখানে বসে না। আরেকবার ভাবো।', r.chain[0]!, r.chain[pos - 1]!);
            wrong(b);
          }
        });
        hand.append(b);
      }
      body.append(chain, hand);
      // a round that orders things differently from the rest asks its own way
      foot.textContent = fill(r.ask ?? askFirst ?? 'প্রথমে কোনটা আসবে?', r.chain[0]!, r.chain[0]!);
      stepStart = performance.now();
    };
    round();
  }

  /* ---- game type: the journey, station by station ---- */
  function runPath(token: string, tokenName: string, stops: PathStop[]) {
    steps = stops.length - 1; setProgress();
    let at = 0;
    body.replaceChildren();
    const track = el('div', 'mz-track');
    /**
     * A stop the token has not reached shows neither its name nor its picture.
     *
     * The name was hidden behind a `?` and the emoji left on, which hands the
     * journey over: the six stops sat there in the right order with a picture
     * on each, and for the water cycle the pictures are legible enough that a
     * child could pick 🌊 as the next stop without knowing the word নদী. The
     * `?` said the stop was unknown; the emoji said otherwise.
     */
    const nodes = stops.map((s, i) => {
      const n = el('div', 'mz-stop');
      n.append(el('span', 'mz-em', i === 0 ? s.emoji : '•'), el('span', 'mz-stop-n', i === 0 ? s.name : '?'));
      if (i === 0) n.classList.add('here');
      return n;
    });
    nodes.forEach((n, i) => { track.append(n); if (i < nodes.length - 1) track.append(el('span', 'mz-link')); });
    const tok = el('span', 'mz-token', token); track.append(tok);
    const fact = el('p', 'mz-fact', stops[0]!.fact);
    const ask = el('p', 'mz-ask'); const choices = el('div', 'mz-choices');
    body.append(track, fact, ask, choices);
    const place = () => {
      const n = nodes[at]!;
      tok.style.left = `${n.offsetLeft + n.offsetWidth / 2}px`; tok.style.top = `${n.offsetTop - 8}px`;
      // on a narrow screen the track scrolls, so keep the stop we are on in view
      n.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduced() ? 'auto' : 'smooth' });
    };
    const step = () => {
      const s = stops[at]!;
      if (!s.choices.length) { ask.textContent = ''; choices.replaceChildren(); const fin = el('button', 'mz-btn mz-primary mz-next', 'যাত্রা শেষ ✔'); fin.type = 'button'; fin.addEventListener('click', finish); choices.append(fin); fin.focus(); return; }
      ask.textContent = `${s.name} থেকে ${tokenName} এরপর কোথায় যাবে?`;
      choices.replaceChildren(...shuffle(s.choices).map((c) => {
        const b = el('button', 'mz-choice', c); b.type = 'button';
        b.addEventListener('click', () => {
          if (over) return;
          if (c === stops[at + 1]!.name) {
            correct(b); at++;
            nodes[at - 1]!.classList.remove('here'); nodes[at]!.classList.add('here');
            nodes[at]!.querySelector('.mz-stop-n')!.textContent = stops[at]!.name;
            nodes[at]!.querySelector('.mz-em')!.textContent = stops[at]!.emoji;
            place(); fact.textContent = stops[at]!.fact;
            if (!reduced()) fact.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 300 });
            step();
          } else {
            // This used to say "খাবারের পথে পড়ে না" - "does not lie on the
            // food's path" - with the food hardcoded. Two missions run this
            // engine, and the other one is a raindrop going round the water
            // cycle, so every wrong answer there told the child about food.
            foot.textContent = `${tokenName} ওখানে যায় না। আরেকবার ভাবো।`;
            wrong(b);
          }
        });
        return b;
      }));
      stepStart = performance.now();
    };
    requestAnimationFrame(place); new ResizeObserver(place).observe(track);
    foot.textContent = '';
    step();
  }

  /* ---- game type: identify from a drawing ---- */
  function runIdentify(caption: string, rounds: IdRound[]) {
    steps = rounds.length; setProgress();
    let ri = 0;
    const round = () => {
      const r = rounds[ri]!;
      body.replaceChildren();
      body.append(el('p', 'mz-round', `${bn(ri + 1)} / ${bn(rounds.length)}`));
      // a drawing where one is worth drawing, otherwise one big glyph
      const art = el('div', 'mz-art');
      if (r.art) art.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true">${r.art}</svg>`;
      // one class per call: classList.add throws on a string containing a space
      else {
        const glyph = r.big ?? '?';
        art.classList.add('mz-art-big');
        if (r.shadow) art.classList.add('mz-art-shadow');
        // a whole word needs a card that grows sideways, not a square tile
        else if (Array.from(glyph).length > 2) art.classList.add('mz-art-word');
        art.append(el('span', '', glyph));
      }
      const clue = el('p', 'mz-clue', r.clue);
      const opts = el('div', 'mz-choices');
      let locked = false;
      for (const oName of shuffle(r.options)) {
        const b = el('button', 'mz-choice', oName); b.type = 'button';
        b.addEventListener('click', () => {
          if (over || locked) return;
          if (oName === r.answer) {
            locked = true; b.classList.add('ok'); correct(b);
            foot.textContent = r.fact;
            const next = el('button', 'mz-btn mz-primary mz-next', ri + 1 < rounds.length ? 'পরের পাতা ▶' : 'শেষ করো ✔'); next.type = 'button';
            next.addEventListener('click', () => { ri++; if (ri < rounds.length) round(); else finish(); });
            opts.append(next); next.focus();
          } else { b.classList.add('bad'); b.disabled = true; foot.textContent = `${oName} নয়। ইঙ্গিতটা আবার পড়ো।`; wrong(b); }
        });
        opts.append(b);
      }
      body.append(art, clue, opts, el('p', 'mz-cap', caption));
      foot.textContent = '';
      stepStart = performance.now();
    };
    round();
  }

  /* ---- game type: put each thing in the right bucket ---- */
  function runSort(buckets: { name: string; emoji: string }[], items: SortItem[]) {
    steps = items.length; setProgress();
    const order = shuffle(items);
    let ri = 0;
    body.replaceChildren();
    const counter = el('p', 'mz-round');
    const card = el('div', 'mz-thing');
    const bar = el('div', 'mz-buckets');
    const btns = buckets.map((b, bi) => {
      const x = el('button', 'mz-bucket'); x.type = 'button';
      x.append(el('span', 'mz-em', b.emoji), el('span', '', b.name));
      x.addEventListener('click', () => {
        if (over) return;
        const it = order[ri]!;
        if (bi === it.bucket) {
          x.classList.add('hit'); setTimeout(() => x.classList.remove('hit'), 400);
          correct(x); foot.textContent = it.fact;
          ri++; if (ri >= order.length) { setTimeout(finish, 550); return; }
          setTimeout(show, 480);
        } else { foot.textContent = `${it.name} ${buckets[bi]!.name} নয়।`; wrong(x); }
      });
      bar.append(x); return x;
    });
    const show = () => {
      if (over) return;
      const it = order[ri]!;
      counter.textContent = `${bn(ri + 1)} / ${bn(order.length)}`;
      card.replaceChildren(el('span', 'mz-em mz-em-xl', it.emoji), el('b', '', it.name));
      if (!reduced()) card.animate([{ transform: 'translateY(-14px) scale(0.85)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, easing: 'cubic-bezier(.2,.9,.3,1.3)' });
      stepStart = performance.now();
    };
    body.append(counter, card, el('p', 'mz-ask', 'কোন ঘরে যাবে?'), bar);
    void btns; show();
  }

  /* ---- game type: a situation, three ways to answer ---- */
  function runChoice(rounds: ChoiceRound[]) {
    steps = rounds.length; setProgress();
    let ri = 0;
    const round = () => {
      const r = rounds[ri]!;
      body.replaceChildren();
      body.append(el('p', 'mz-round', `${bn(ri + 1)} / ${bn(rounds.length)}`));
      const sit = el('div', 'mz-sit');
      sit.append(el('span', 'mz-em mz-em-xl', r.emoji), el('p', '', r.situation));
      const opts = el('div', 'mz-opts');
      let locked = false;
      for (const opt of shuffle(r.options)) {
        const b = el('button', 'mz-opt', opt.text); b.type = 'button';
        b.addEventListener('click', () => {
          if (over || locked) return;
          if (opt.good) {
            locked = true; b.classList.add('ok'); correct(b); foot.textContent = opt.why;
            const next = el('button', 'mz-btn mz-primary mz-next', ri + 1 < rounds.length ? 'পরের পরিস্থিতি ▶' : 'শেষ করো ✔'); next.type = 'button';
            next.addEventListener('click', () => { ri++; if (ri < rounds.length) round(); else finish(); });
            opts.append(next); next.focus();
          } else { b.classList.add('bad'); b.disabled = true; foot.textContent = opt.why; wrong(b); }
        });
        opts.append(b);
      }
      body.append(sit, opts);
      foot.textContent = '';
      stepStart = performance.now();
    };
    round();
  }

  /* ---- game type: numbers on a Bangla keypad ---- */
  const BN_D = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  function runCalc(unit: string, rounds: CalcRound[]) {
    steps = rounds.length; setProgress();
    let ri = 0, typed = '';
    body.replaceChildren();
    const counter = el('p', 'mz-round');
    const q = el('p', 'mz-q');
    const out = el('div', 'mz-out'); const outN = el('b', '', '-'); const outU = el('span', 'mz-unit', unit);
    out.append(outN, outU);
    const pad = el('div', 'mz-pad');
    const paint = () => { outN.textContent = typed ? typed.split('').map((d) => BN_D[+d]).join('') : '-'; out.classList.toggle('empty', !typed); };
    const submit = (btn: Element) => {
      if (over) return;
      // pressing ✔ on an empty box used to do nothing at all, which reads as a
      // broken button rather than as "you have not answered yet"
      if (!typed) { foot.textContent = 'আগে সংখ্যাটা লেখো, তারপর ঠিক আছে চাপো।'; chime('tick'); return; }
      if (+typed === rounds[ri]!.a) {
        correct(btn); foot.textContent = rounds[ri]!.fact ?? '';
        ri++; typed = ''; paint();
        if (ri >= rounds.length) { setTimeout(finish, 450); return; }
        setTimeout(show, 420);
      } else {
        foot.textContent = `${outN.textContent} ঠিক নয়। আরেকবার হিসাব করো।`;
        typed = ''; paint(); wrong(out);
      }
    };
    for (let d = 1; d <= 10; d++) {
      const n = d % 10;
      const b = el('button', 'mz-key', BN_D[n]!); b.type = 'button';
      b.addEventListener('click', () => { if (typed.length < 6) { typed += String(n); paint(); chime('tick'); } });
      pad.append(b);
    }
    const del = el('button', 'mz-key mz-key-w', '⌫'); del.type = 'button';
    del.addEventListener('click', () => { typed = typed.slice(0, -1); paint(); });
    const ok = el('button', 'mz-key mz-key-ok', 'ঠিক আছে ✔'); ok.type = 'button';
    ok.addEventListener('click', () => submit(ok));
    pad.append(del, ok);
    const show = () => { if (over) return; counter.textContent = `${bn(ri + 1)} / ${bn(rounds.length)}`; q.textContent = rounds[ri]!.q; stepStart = performance.now(); };
    body.append(counter, q, out, pad);
    paint(); show();
  }

  /* ---- game type: fill a basket under a budget ---- */
  function runBuild(budget: number, budgetLabel: string, unit: string, need: { tag: string; label: string }[], pool: BuildItem[], submit: string, note: string) {
    steps = need.length; setProgress();
    const chosen = new Set<BuildItem>();
    body.replaceChildren();
    const top = el('div', 'mz-budget');
    const spentN = el('b', '', '০'); const left = el('span', 'mz-left', '');
    top.append(el('span', 'mz-blabel', budgetLabel), spentN, el('span', '', `/ ${bn(budget)} ${unit}`), left);
    const track = el('span', 'mz-btrack'); const trackI = el('i'); track.append(trackI);
    const needBar = el('div', 'mz-needs');
    const needEls = need.map((n) => { const x = el('span', 'mz-need', n.label); needBar.append(x); return x; });
    /** Which requirements are already covered, so a payout lands on the right chip. */
    const covered = need.map(() => false);
    const grid = el('div', 'mz-pool');
    const doneBtn = el('button', 'mz-btn mz-primary mz-next', submit); doneBtn.type = 'button';
    const spent = () => [...chosen].reduce((s, i) => s + i.cost, 0);
    const repaint = () => {
      const s = spent();
      spentN.textContent = bn(s);
      trackI.style.width = `${Math.min(100, (s / budget) * 100)}%`;
      track.classList.toggle('over', s > budget);
      left.textContent = s > budget ? `${bn(s - budget)} ${unit} বেশি` : `বাকি ${bn(budget - s)} ${unit}`;
      /**
       * Each newly covered requirement is one step of progress and one payout,
       * and the payout has to land on the requirement that was actually just
       * covered. The old version counted how many were met and then burst on
       * `needEls[count - 1]`, so covering the third requirement first threw the
       * confetti and the +10 onto the first chip, which was still unlit.
       */
      let met = 0;
      need.forEach((n, i) => {
        const on = [...chosen].some((it) => it.tags.includes(n.tag));
        needEls[i]!.classList.toggle('on', on);
        if (on) met++;
        if (on && !covered[i]) { covered[i] = true; done++; setProgress(); addPoints(STEP_BASE, needEls[i]!); chime('ok'); burstAt(needEls[i]!); }
        else if (!on && covered[i]) { covered[i] = false; done = Math.max(0, done - 1); setProgress(); }
      });
      doneBtn.disabled = !(met === need.length && s <= budget);
      doneBtn.textContent = met < need.length ? `আরও ${bn(need.length - met)}টি বাকি` : s > budget ? `${bn(s - budget)} ${unit} কমাতে হবে` : submit;
    };
    for (const it of pool) {
      const b = el('button', 'mz-pick'); b.type = 'button';
      b.append(el('span', 'mz-em', it.emoji), el('span', 'mz-pick-n', it.name), el('span', 'mz-pick-c', `${bn(it.cost)} ${unit}`));
      b.addEventListener('click', () => {
        if (over) return;
        if (chosen.has(it)) { chosen.delete(it); b.classList.remove('on'); repaint(); return; }
        chosen.add(it); b.classList.add('on');
        // an item that covers no requirement is a real mistake here: it eats the
        // budget and feeds nothing, so it costs a heart like any wrong answer
        if (!it.tags.length) { foot.textContent = it.warn ?? `${it.name} কোনো দরকারি ঘর ভরায় না, শুধু ${bn(it.cost)} ${unit} নিয়ে নেয়।`; if (!wrong(b)) return; }
        else chime('tick');
        repaint();
      });
      grid.append(b);
    }
    doneBtn.addEventListener('click', () => { if (!doneBtn.disabled) finish(); });
    body.append(top, track, needBar, grid, doneBtn);
    foot.textContent = note;
    stepStart = performance.now();
    repaint();
  }

  function run() {
    // This attempt's deal, pinned to a const so the narrowing holds inside the
    // callbacks; `spec` itself is reassigned on every restart.
    const s = spec;
    if (s.type === 'order') intro(s.intro, () => runOrder(s.rounds, s.askFirst, s.askNext, s.wrong));
    else if (s.type === 'path') intro(s.intro, () => runPath(s.token, s.tokenName, s.stops));
    else if (s.type === 'sort') intro(s.intro, () => runSort(s.buckets, s.items));
    else if (s.type === 'choice') intro(s.intro, () => runChoice(s.rounds));
    else if (s.type === 'calc') intro(s.intro, () => runCalc(s.unit, s.rounds));
    else if (s.type === 'build') intro(s.intro, () => runBuild(s.budget, s.budgetLabel, s.unit, s.need, s.pool, s.submit, s.note));
    else intro(s.intro, () => runIdentify(s.caption, s.rounds));
  }
  renderHearts(); setProgress(); run();
  return { close: shut };
}
