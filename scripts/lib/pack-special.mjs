/**
 * The pages only one world has: letter tracing, kar, fola and conjunct pages
 * for language; the number chart, digit tracing, number words, clocks and the
 * shop game for math; the solar-system bodies and the activities built on
 * their real figures for space. Every figure and word comes from the snapshot
 * (language.ts, math.ts, space.ts); answers are computed, never typed.
 */
import { esc, bn, fromBn, OPT, shuffle, shuffleMoved, block, keep, group, cutFrame } from './pack-kit.mjs';
import { secHead, nameBar, traceGlyph } from './pack-world.mjs';

const subHead = (t, inst = '') => keep(`<p class="h2">${esc(t)}</p>${inst ? `<p class="inst">${esc(inst)}</p>` : ''}`);

/* ================= LANGUAGE ================= */
function letterRow(l) {
  const traces = [0, 1, 2].map(() => traceGlyph(l.ch)).join('');
  return block(`<div class="lrow"><div class="lmodel">${traceGlyph(l.ch, { solid: true })}<div class="lmeta"><b>${esc(l.name)}</b><span>${l.emoji ? `${esc(l.emoji)} ` : ''}${esc(l.word)}</span></div></div><div class="ltr">${traces}${traceGlyph('', {})}</div><div class="lword">${traceGlyph(l.word, { w: 38, h: 20, size: 10 })}</div></div>${l.note ? `<p class="lnote">${esc(l.ch)}: ${esc(l.note)}</p>` : ''}`);
}

export function languageSections(lang, keys) {
  const { vowels, consonants, kars, folas, conjuncts } = lang;
  const out = [];
  out.push({
    id: 'sp-vowels', cont: 'স্বরবর্ণ ট্রেসিং',
    parts: [
      secHead('হাতের লেখা · ১', `স্বরবর্ণ ট্রেসিং (${bn(vowels.length)}টি)`, 'বাঁয়ের কালো বর্ণটা দেখে নাম বলো। তারপর হালকা ধূসর বর্ণের ওপর পেন্সিল বুলিয়ে লেখো, খালি ঘরে নিজে লেখো। ডানে উদাহরণ শব্দটাও ধূসর অক্ষরের ওপর লেখো।', nameBar()),
      group('letters', vowels.map(letterRow)),
    ],
  });
  out.push({
    id: 'sp-consonants', cont: 'ব্যঞ্জনবর্ণ ট্রেসিং',
    parts: [
      secHead('হাতের লেখা · ২', `ব্যঞ্জনবর্ণ ট্রেসিং (${bn(consonants.length)}টি)`, 'একদিনে সব নয়। প্রতিদিন পাঁচ-ছয়টা বর্ণ ধীরে ধীরে লেখো। যে বর্ণ শব্দের শুরুতে বসে না, তার উদাহরণ শব্দে বর্ণটা মাঝে বা শেষে আছে।', nameBar()),
      group('letters', consonants.map(letterRow)),
    ],
  });
  // কার
  const karRows = kars.map((k) => {
    const joined = `ক${k.sign}`;
    return block(`<div class="krow"><div class="kname"><b>${esc(k.name)}</b></div><div class="kjoin">${k.sign ? `ক + ${esc(k.name.replace(/^(হ্রস্ব |দীর্ঘ )/, '').replace('-কার', ''))}-কার` : 'ক'} = <b>${esc(joined)}</b></div><div class="kword">${esc(k.emoji)} ${esc(k.word)}</div><div class="ktr">${traceGlyph(joined, { w: 17, h: 17, size: 13 })}${traceGlyph(joined, { w: 17, h: 17, size: 13 })}${traceGlyph(k.word, { w: 32, h: 17, size: 9 })}</div></div>`);
  });
  const folaRows = folas.map((f) => {
    const joined = `${f.base}${f.sign}`;
    return block(`<div class="krow"><div class="kname"><b>${esc(f.name)}</b></div><div class="kjoin">${esc(f.base)} + ${esc(f.name)} = <b>${esc(joined)}</b></div><div class="kword">${esc(f.emoji)} ${esc(f.word)}</div><div class="ktr">${traceGlyph(joined, { w: 17, h: 17, size: 13 })}${traceGlyph(joined, { w: 17, h: 17, size: 13 })}${traceGlyph(f.word, { w: 32, h: 17, size: 9 })}</div></div>`);
  });
  out.push({
    id: 'sp-kar', cont: 'কার ও ফলা',
    parts: [
      secHead('হাতের লেখা · ৩', 'কার চিহ্ন: একটাই বর্ণে বসিয়ে', `${bn(kars.length - 1)}টি কার আর কার ছাড়া অ। প্রতিটি কার ক-এর সঙ্গে বসিয়ে দেখানো, যাতে চোখে পড়ে চিহ্নটা বর্ণের কোন পাশে বসে। তারপর উদাহরণ শব্দটা লেখো।`),
      group('kars', karRows),
      subHead(`ফলা (${bn(folas.length)}টি)`, 'ফলা হলো বর্ণের সঙ্গে জুড়ে যাওয়া আরেকটা বর্ণের ছোট রূপ।'),
      group('kars', folaRows),
    ],
  });
  // conjunct chart
  out.push({
    id: 'sp-conj', cont: 'যুক্তবর্ণ ভাঙা চার্ট',
    parts: [
      secHead('যুক্তবর্ণ · ১', `${bn(conjuncts.length)}টি যুক্তবর্ণ ভেঙে দেখো`, 'প্রতিটি যুক্তবর্ণ কোন দুটি বর্ণ মিলে হয়েছে, পাশে তার একটা শব্দ। ধূসর যুক্তবর্ণের ওপর লিখে হাতে বসিয়ে নাও।'),
      group('conj', conjuncts.map((c) => block(`<div class="cj">${cutFrame}<div class="cjbig">${esc(c.ch)}</div><div class="cjparts">${esc(c.parts[0])} + ${esc(c.parts[1])}</div><div class="cjword">${esc(c.emoji)} ${esc(c.word)}</div><div class="cjtr">${traceGlyph(c.ch, { w: 16, h: 16, size: 11 })}${traceGlyph(c.ch, { w: 16, h: 16, size: 11 })}</div></div>`))),
    ],
  });
  // conjunct exercise: join the first half, split the second half
  const order = shuffle(conjuncts, 'language:conj-ex');
  const half = Math.ceil(order.length / 2);
  const join = order.slice(0, half), split = order.slice(half);
  out.push({
    id: 'sp-conj-ex', cont: 'যুক্তবর্ণ জোড়া লাগাও ও ভাঙো',
    parts: [
      secHead('যুক্তবর্ণ · ২', 'জোড়া লাগাও, তারপর ভাঙো', 'চার্ট না দেখে আগে নিজে চেষ্টা করো। আটকে গেলে চার্টে দেখে নাও, তারপর আবার লেখো।', nameBar()),
      subHead('ক. দুটি বর্ণ জুড়ে যুক্তবর্ণ লেখো'),
      group('cjx', join.map((c, i) => block(`<div class="cjq"><span class="num">${bn(i + 1)}.</span><span class="cjeq">${esc(c.parts[0])} + ${esc(c.parts[1])} =</span><span class="box big"></span></div>`))),
      subHead('খ. যুক্তবর্ণ ভেঙে দুটি বর্ণ লেখো', 'শব্দটা পড়ো, তারপর মোটা করে লেখা যুক্তবর্ণটা কোন দুটি বর্ণে তৈরি তা ঘরে লেখো।'),
      group('cjx', split.map((c, i) => block(`<div class="cjq"><span class="num">${bn(i + 1)}.</span><span class="cjeq"><b>${esc(c.ch)}</b> <span class="muted small">(${esc(c.word)})</span> =</span><span class="box big"></span><span>+</span><span class="box big"></span></div>`))),
    ],
  });
  keys.push({
    title: 'যুক্তবর্ণ · জোড়া লাগাও ও ভাঙো', ref: 'sp-conj-ex',
    rows: [
      `<b>ক.</b> ${join.map((c, i) => `${bn(i + 1)}. ${esc(c.parts[0])} + ${esc(c.parts[1])} = ${esc(c.ch)}`).join(' · ')}`,
      `<b>খ.</b> ${split.map((c, i) => `${bn(i + 1)}. ${esc(c.ch)} = ${esc(c.parts[0])} + ${esc(c.parts[1])}`).join(' · ')}`,
    ],
  });
  return out;
}

export const LANGUAGE_CSS = String.raw`
.g.letters{display:flex;flex-direction:column;gap:0}
.lrow{display:grid;grid-template-columns:46mm 1fr auto;align-items:center;gap:2mm;border-bottom:.8pt solid #e1e4ea;padding:1.2mm 0}
.lmodel{display:flex;align-items:center;gap:2mm}
.lmeta{display:flex;flex-direction:column;line-height:1.35}
.lmeta b{font-size:11pt;color:var(--c)}
.lmeta span{font-size:11pt}
.ltr{display:flex;gap:1.4mm}
.tg{display:inline-flex;align-items:center;justify-content:center;padding:0 1.6mm;border:.6pt solid #d7dbe3;border-radius:1.2mm;background:linear-gradient(#fff 49.6%,#eef0f4 49.6%,#eef0f4 50.4%,#fff 50.4%);color:#c1c7d1;line-height:1;font-weight:500;flex:none;white-space:nowrap}
.tg.solid{color:#1d2433;font-weight:600;background:#fff}
.lnote{font-size:10pt;color:#5b6475;margin:-.4mm 0 .6mm 46mm}
.g.kars{display:flex;flex-direction:column}
.krow{display:grid;grid-template-columns:30mm 40mm 34mm 1fr;align-items:center;gap:2mm;border-bottom:.8pt solid #e1e4ea;padding:1.2mm 0}
.kjoin b{font-size:15pt}
.ktr{display:flex;gap:1.4mm;justify-content:flex-end}
.g.conj{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm}
.cj{position:relative;border-radius:3mm;padding:2mm 3mm;display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto auto;column-gap:3mm;align-items:center}
.cjbig{grid-row:1/3;font-size:28pt;font-weight:700;color:#141b2b;line-height:1.25}
.cjparts{font-size:13pt;font-weight:700;color:var(--c)}
.cjword{font-size:11.5pt}
.cjtr{grid-column:1/3;display:flex;gap:1.6mm;margin-top:1mm}
.g.cjx{display:grid;grid-template-columns:1fr 1fr;gap:3mm 8mm}
.cjq{display:flex;align-items:center;gap:2.4mm;font-size:14pt}
.box.big{width:12mm;height:12mm}
`;

/* ================= MATH ================= */
function clockSvg(h, m, { hands = true, size = 44 } = {}) {
  const cx = 50, cy = 50;
  const parts = [`<circle cx="50" cy="50" r="47" fill="#fff" stroke="#1d2433" stroke-width="2.2"/>`];
  for (let i = 0; i < 60; i++) {
    const a = (i * 6 * Math.PI) / 180;
    const major = i % 5 === 0;
    const r1 = major ? 39.5 : 42.5, r2 = 45;
    parts.push(`<line x1="${(cx + r1 * Math.sin(a)).toFixed(2)}" y1="${(cy - r1 * Math.cos(a)).toFixed(2)}" x2="${(cx + r2 * Math.sin(a)).toFixed(2)}" y2="${(cy - r2 * Math.cos(a)).toFixed(2)}" stroke="#1d2433" stroke-width="${major ? 1.8 : .7}" stroke-linecap="round"/>`);
  }
  for (let n = 1; n <= 12; n++) {
    const a = (n * 30 * Math.PI) / 180;
    parts.push(`<text x="${(cx + 31 * Math.sin(a)).toFixed(2)}" y="${(cy - 31 * Math.cos(a) + 3.3).toFixed(2)}" text-anchor="middle" font-size="${n > 9 ? 8.6 : 9.6}" font-weight="700" font-family="PosoraBangla" fill="#1d2433">${bn(n)}</text>`);
  }
  if (hands) {
    const ma = (m * 6 * Math.PI) / 180;
    const ha = (((h % 12) * 30 + m * 0.5) * Math.PI) / 180;
    parts.push(`<line x1="50" y1="50" x2="${(cx + 21 * Math.sin(ha)).toFixed(2)}" y2="${(cy - 21 * Math.cos(ha)).toFixed(2)}" stroke="#1d2433" stroke-width="4.2" stroke-linecap="round"/>`);
    parts.push(`<line x1="50" y1="50" x2="${(cx + 33 * Math.sin(ma)).toFixed(2)}" y2="${(cy - 33 * Math.cos(ma)).toFixed(2)}" stroke="var(--c)" stroke-width="2.4" stroke-linecap="round"/>`);
  }
  parts.push(`<circle cx="50" cy="50" r="2.6" fill="#1d2433"/>`);
  return `<svg viewBox="0 0 100 100" width="${size}mm" height="${size}mm">${parts.join('')}</svg>`;
}

/** How a Bangla speaker says a clock time: সোয়া, সাড়ে, পৌনে, দেড়টা, আড়াইটা. */
function timeWords(h, m) {
  const next = h === 12 ? 1 : h + 1;
  if (m === 0) return `${bn(h)}টা`;
  if (m === 15) return `সোয়া ${bn(h)}টা`;
  if (m === 30) return h === 1 ? 'দেড়টা' : h === 2 ? 'আড়াইটা' : `সাড়ে ${bn(h)}টা`;
  if (m === 45) return `পৌনে ${bn(next)}টা`;
  return `${bn(h)}টা বেজে ${bn(m)} মিনিট`;
}
const digital = (h, m) => `${bn(h)}:${bn(String(m).padStart(2, '0'))}`;

export function mathSections(math, keys) {
  const { numberWords, denominations, shopItems } = math;
  const out = [];
  // number chart
  const cell = (n) => block(`<div class="ncell"><b>${bn(n)}</b><span>${esc(numberWords[n])}</span></div>`);
  out.push({
    id: 'sp-numbers', cont: 'সংখ্যা ০ থেকে ১০০',
    parts: [
      secHead('সংখ্যা · ১', 'সংখ্যা ০ থেকে ১০০, কথায়', 'প্রতিটি ঘরে বাংলা অঙ্ক আর তার নাম। প্রতিদিন একটা সারি জোরে পড়ো। দশের ঘরগুলো রঙ করে রাখলে গোনা সহজ হয়।'),
      group('nchart', numberWords.map((_, n) => cell(n))),
    ],
  });
  // digit tracing
  out.push({
    id: 'sp-digits', cont: 'অঙ্ক ট্রেসিং',
    parts: [
      secHead('সংখ্যা · ২', 'বাংলা অঙ্ক ট্রেসিং ০ থেকে ৯', 'কালো অঙ্কটা দেখে নাম বলো, ধূসর অঙ্কের ওপর পেন্সিল বুলিয়ে লেখো, শেষের দুই খালি ঘরে নিজে লেখো।', nameBar()),
      group('letters', Array.from({ length: 10 }, (_, d) => block(`<div class="lrow"><div class="lmodel">${traceGlyph(bn(d), { solid: true })}<div class="lmeta"><b>${bn(d)}</b><span>${esc(numberWords[d])}</span></div></div><div class="ltr">${[0, 1, 2, 3].map(() => traceGlyph(bn(d))).join('')}</div><div class="lword">${traceGlyph('', {})}${traceGlyph('', {})}</div></div>`))),
    ],
  });
  // number words both ways
  const pool = shuffle(Array.from({ length: 89 }, (_, i) => i + 11), 'math:numwords');
  const toWords = pool.slice(0, 10).sort((a, b) => a - b);
  const toDigits = pool.slice(10, 20);
  out.push({
    id: 'sp-numwords', cont: 'সংখ্যা কথায় লেখো',
    parts: [
      secHead('সংখ্যা · ৩', 'অঙ্ক থেকে কথা, কথা থেকে অঙ্ক', 'চার্ট না দেখে আগে চেষ্টা করো। বানান মেলাতে পরে চার্ট দেখো।', nameBar()),
      subHead('ক. সংখ্যাটা কথায় লেখো'),
      group('nw', toWords.map((n, i) => block(`<div class="nwq"><span class="num">${bn(i + 1)}.</span><b class="nwbig">${bn(n)}</b><span>=</span><i></i></div>`))),
      subHead('খ. কথাটা অঙ্কে লেখো'),
      group('nw', toDigits.map((n, i) => block(`<div class="nwq"><span class="num">${bn(i + 1)}.</span><b>${esc(numberWords[n])}</b><span>=</span><span class="box big"></span></div>`))),
    ],
  });
  keys.push({
    title: 'সংখ্যা · অঙ্ক থেকে কথা, কথা থেকে অঙ্ক', ref: 'sp-numwords',
    rows: [
      `<b>ক.</b> ${toWords.map((n, i) => `${bn(i + 1)}. ${bn(n)} = ${esc(numberWords[n])}`).join(' · ')}`,
      `<b>খ.</b> ${toDigits.map((n, i) => `${bn(i + 1)}. ${esc(numberWords[n])} = ${bn(n)}`).join(' · ')}`,
    ],
  });
  // clocks
  const readTimes = [[3, 0], [6, 30], [9, 15], [4, 45], [12, 0], [7, 20], [10, 30], [1, 30], [2, 30], [11, 15], [5, 45], [8, 10]];
  const drawTimes = [[2, 0], [5, 30], [8, 15], [11, 45], [3, 30], [6, 40]];
  out.push({
    id: 'sp-clock', cont: 'ঘড়ি পড়া',
    parts: [
      secHead('সময় · ১', 'ঘড়ি দেখে সময় বলো', 'ছোট মোটা কাঁটা ঘণ্টা দেখায়, লম্বা রঙিন কাঁটা মিনিট। লম্বা কাঁটা একটা বড় দাগ থেকে পরের বড় দাগে যেতে ৫ মিনিট লাগে। প্রতিটি ঘড়ির নিচে সময় লেখো, যেমন ৩টা বা সাড়ে ৬টা।', nameBar()),
      group('clocks', readTimes.map(([h, m], i) => block(`<div class="clk"><span class="num">${bn(i + 1)}.</span>${clockSvg(h, m, { size: 40 })}<div class="ansline"><i></i></div></div>`))),
    ],
  });
  out.push({
    id: 'sp-clock-draw', cont: 'ঘড়িতে কাঁটা আঁকো',
    parts: [
      secHead('সময় · ২', 'ঘড়িতে কাঁটা আঁকো', 'লেখা সময় অনুযায়ী কাঁটা আঁকো। ছোট কাঁটা ঘণ্টার, লম্বা কাঁটা মিনিটের। মনে রেখো: সাড়ে ৫টায় ছোট কাঁটা ৫ আর ৬-এর ঠিক মাঝখানে থাকে।', nameBar()),
      group('clocks big', drawTimes.map(([h, m], i) => block(`<div class="clk"><span class="num">${bn(i + 1)}.</span>${clockSvg(h, m, { hands: false, size: 52 })}<p class="clk-l"><b>${esc(timeWords(h, m))}</b> <span class="muted">(${digital(h, m)})</span></p></div>`))),
    ],
  });
  keys.push({
    title: 'সময় · ঘড়ি দেখে সময় বলো', ref: 'sp-clock',
    rows: [readTimes.map(([h, m], i) => `${bn(i + 1)}. <b>${esc(timeWords(h, m))}</b> (${digital(h, m)})`).join(' · ')],
  });
  keys.push({
    title: 'সময় · ঘড়িতে কাঁটা আঁকো', ref: 'sp-clock-draw',
    rows: [`<span class="keyclocks">${drawTimes.map(([h, m], i) => `<span>${clockSvg(h, m, { size: 24 })}<br>${bn(i + 1)}. ${esc(timeWords(h, m))}</span>`).join('')}</span>`],
  });
  // money
  const notes = denominations.filter((d) => d.kind === 'note').map((d) => d.v).sort((a, b) => a - b);
  const greedy = (amt) => { const out = []; for (const d of denominations) { while (amt >= d.v) { out.push(d.v); amt -= d.v; } } return out; };
  const byName = Object.fromEntries(shopItems.map((s) => [s.name, s]));
  const pairs = shuffle(shopItems.flatMap((a, i) => shopItems.slice(i + 1).map((b) => [a, b])), 'math:shop:pairs')
    .filter(([a, b]) => a.price + b.price < 200).slice(0, 4);
  const changeQs = shuffle(shopItems, 'math:shop:change').slice(0, 4).map((it) => {
    const note = notes.find((n) => n > it.price);
    return { it, note, change: note - it.price };
  });
  const exactQs = shuffle(shopItems, 'math:shop:exact').slice(0, 4).map((it) => ({ it, coins: greedy(it.price) }));
  const shop = shopItems.map((s) => `<div class="shopi"><span class="em">${esc(s.emoji)}</span><span>${esc(s.name)}</span><b>৳${bn(s.price)}</b></div>`).join('');
  const money = denominations.map((d) => d.kind === 'note'
    ? `<span class="note">৳${bn(d.v)}<small>নোট</small></span>`
    : `<span class="coin">৳${bn(d.v)}<small>কয়েন</small></span>`).join('');
  out.push({
    id: 'sp-shop', cont: 'দোকান খেলা',
    parts: [
      secHead('টাকা · ১', 'দোকান খেলা: দাম মেলাও', 'বাংলাদেশের নোট আর কয়েন চেনো, তারপর দোকানের দাম দেখে হিসাব করো। চাইলে কাগজে নোট এঁকে কেটে নিয়ে সত্যিকারের দোকান খেলো।', nameBar()),
      block(`<p class="h3">আমাদের নোট ও কয়েন</p><div class="money">${money}</div>`),
      block(`<p class="h3">দোকানের দামের তালিকা</p><div class="shop">${shop}</div>`),
      subHead('ক. দুটি জিনিস কিনলে মোট কত?'),
      group('calc', pairs.map(([a, b], i) => block(`<div class="calc-q"><span class="num">${bn(i + 1)}.</span><span>${esc(a.name)} আর ${esc(b.name)}</span><span class="calc-a">৳<i></i></span></div>`))),
      subHead('খ. কত টাকা ফেরত পাবে?'),
      group('calc', changeQs.map((q, i) => block(`<div class="calc-q"><span class="num">${bn(i + 1)}.</span><span>${esc(q.it.name)} কিনে ৳${bn(q.note)}-এর নোট দিলে</span><span class="calc-a">৳<i></i></span></div>`))),
      subHead('গ. সবচেয়ে কম নোট-কয়েনে ঠিক দাম দাও', 'কোন কোন নোট আর কয়েন দেবে লেখো, যাতে গুনতিতে সবচেয়ে কম লাগে।'),
      group('calc', exactQs.map((q, i) => block(`<div class="calc-q wide"><span class="num">${bn(i + 1)}.</span><span>${esc(q.it.name)} (৳${bn(q.it.price)})</span><span class="calc-a"><i></i></span></div>`))),
    ],
  });
  keys.push({
    title: 'টাকা · দোকান খেলা', ref: 'sp-shop',
    rows: [
      `<b>ক.</b> ${pairs.map(([a, b], i) => `${bn(i + 1)}. ৳${bn(a.price)} + ৳${bn(b.price)} = <b>৳${bn(a.price + b.price)}</b>`).join(' · ')}`,
      `<b>খ.</b> ${changeQs.map((q, i) => `${bn(i + 1)}. ৳${bn(q.note)} − ৳${bn(q.it.price)} = <b>৳${bn(q.change)}</b>`).join(' · ')}`,
      `<b>গ.</b> ${exactQs.map((q, i) => `${bn(i + 1)}. ${q.coins.map((c) => `৳${bn(c)}`).join(' + ')} (${bn(q.coins.length)}টি)`).join(' · ')}`,
    ],
  });
  void byName;
  return out;
}

export const MATH_CSS = String.raw`
.g.nchart{display:grid;grid-template-columns:repeat(5,1fr);gap:1.6mm}
.ncell{border:.8pt solid #d7dbe3;border-radius:1.6mm;padding:.8mm 2mm;display:flex;align-items:baseline;gap:2mm}
.ncell b{font-size:14pt;color:var(--c);min-width:9mm}
.ncell span{font-size:11pt}
.g.nw{display:grid;grid-template-columns:1fr 1fr;gap:3mm 8mm}
.nwq{display:flex;align-items:center;gap:2.4mm;font-size:12pt}
.nwq i{flex:1;border-bottom:1pt solid #4c5568;height:8mm}
.nwbig{font-size:16pt}
.g.clocks{display:grid;grid-template-columns:repeat(4,1fr);gap:7mm 4mm}
.g.clocks.big{grid-template-columns:repeat(3,1fr);gap:5mm}
.clk{display:flex;flex-direction:column;align-items:center;gap:1mm;position:relative}
.clk .num{position:absolute;left:0;top:0}
.clk .ansline{width:100%}
.clk .ansline i{max-width:none}
.clk-l{font-size:12pt;text-align:center}
.keyclocks{display:flex;flex-wrap:wrap;gap:4mm}
.keyclocks span{text-align:center;font-size:10.5pt}
.money{display:flex;flex-wrap:wrap;gap:2.4mm;align-items:center;margin-top:1mm}
.note{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;width:26mm;height:13mm;border:1.2pt solid var(--c);border-radius:1.6mm;font-weight:800;font-size:12pt;line-height:1.1}
.coin{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;width:14mm;height:14mm;border:1.2pt solid #8a93a3;border-radius:50%;font-weight:800;font-size:10.5pt;line-height:1.1}
.note small,.coin small{font-size:8pt;font-weight:400;color:#5b6475}
.shop{display:grid;grid-template-columns:repeat(4,1fr);gap:2mm;margin-top:1mm}
.shopi{border:.8pt solid #d7dbe3;border-radius:2mm;padding:1.6mm 2.4mm;display:flex;flex-direction:column;align-items:center;line-height:1.35}
.shopi .em{font-size:16pt}
.calc-q.wide{grid-template-columns:7mm 52mm 1fr}
`;

/* ================= SPACE ================= */
const PLANET_KEYS = ['এক বছর', 'এক দিন', 'চাঁদ', 'সূর্য থেকে দূরত্ব', 'তাপমাত্রা', 'মাধ্যাকর্ষণ'];

function bodyDot(b, size = 16) {
  const [c1, c2] = b.colors;
  return `<svg viewBox="0 0 40 40" width="${size}mm" height="${size}mm"><defs><radialGradient id="g-${b.id}" cx="38%" cy="35%" r="70%"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient></defs>${b.ring ? `<ellipse cx="20" cy="20" rx="19" ry="5.5" fill="none" stroke="${c1}" stroke-width="1.6" transform="rotate(-18 20 20)"/>` : ''}<circle cx="20" cy="20" r="12" fill="url(#g-${b.id})"/></svg>`;
}

export function spaceSections(bodies, beltExtras, keys) {
  const out = [];
  const card = (b) => block(`<div class="bcard">${cutFrame}<div class="bhead">${bodyDot(b, 12)}<div><p class="nm">${esc(b.bn)} <span class="muted small">${esc(b.en)}</span></p><p class="small muted">${esc(b.tagline)}</p></div></div><div class="bst">${b.stats.map((s) => `<span><i>${esc(s.k)}</i><b>${esc(s.v)}</b></span>`).join('')}</div><p class="l1">${esc(b.l1)}</p><p class="fun"><b>মজার তথ্য:</b> ${esc(b.fun)}</p></div>`, 'card');
  const extra = (e) => block(`<div class="bcard">${cutFrame}<p class="nm">${esc(e.name)}</p><div>${e.chips.map((c) => `<span class="pill">${esc(c)}</span>`).join('')}</div><p class="l1">${esc(e.l1)}</p><p class="fun"><b>মজার তথ্য:</b> ${esc(e.fun)}</p></div>`, 'card');
  out.push({
    id: 'sp-bodies', cont: 'সৌরজগতের কার্ড',
    parts: [
      secHead('সৌরজগৎ · পড়ো', `সৌরজগতের ${bn(bodies.length + beltExtras.length)}টি কার্ড`, 'আসল মাপসহ কার্ড। মাধ্যাকর্ষণ পৃথিবীর তুলনায় (পৃথিবী = ১ g); ১ AU = সূর্য থেকে পৃথিবীর দূরত্ব।'),
      group('cards', [...bodies.map(card), ...beltExtras.map(extra)]),
    ],
  });
  // distance order
  const planets = bodies.filter((b) => b.au && b.au > 0 && b.id !== 'moon');
  const byAu = planets.slice().sort((a, b) => a.au - b.au);
  const shuffled = shuffleMoved(planets, 'space:au');
  const auOf = (b) => (b.stats.find((s) => s.k === 'সূর্য থেকে দূরত্ব')?.v ?? `${bn(b.au)} AU`).split(' · ')[0];
  // weights
  const W = 30;
  const weight = (g) => { const v = Math.round(W * g * 10) / 10; return bn(Number.isInteger(v) ? v : v.toFixed(1)); };
  // moons
  const withMoons = bodies.filter((b) => b.stats.some((s) => s.k === 'চাঁদ'));
  const moonsOf = (b) => fromBn(b.stats.find((s) => s.k === 'চাঁদ').v);
  const byMoons = withMoons.slice().sort((a, b) => moonsOf(b) - moonsOf(a));
  out.push({
    id: 'sp-order', cont: 'সাজাও ও তুলনা করো',
    parts: [
      secHead('সৌরজগৎ · কাজ', 'আসল সংখ্যা দিয়ে সাজাও', 'সব সংখ্যা কার্ডের সঙ্গে মেলে। আগে নিজে চেষ্টা করো, তারপর কার্ড দেখে মেলাও।', nameBar()),
      subHead('ক. সূর্য থেকে দূরত্বের ক্রম', 'যে সূর্যের সবচেয়ে কাছে তার ঘরে ১, তারপর ২, এভাবে শেষ পর্যন্ত। দশমিক সংখ্যা তুলনা করতে হবে।'),
      group('ordlist', shuffled.map((b) => block(`<div class="orow"><span class="box"></span><b>${esc(b.bn)}</b><span>${esc(auOf(b))}</span></div>`))),
      subHead(`খ. ${bn(W)} কেজির কেউ কোথায় কত ভারী লাগবে?`, `পৃথিবীতে ${bn(W)} কেজি। মাধ্যাকর্ষণ যত g, ওজন তত গুণ: ${bn(W)} × g। ক্যালকুলেটর বা খাতায় গুণ করে লেখো।`),
      group('wt', bodies.map((b) => block(`<div class="wrow"><b>${esc(b.bn)}</b><span>${bn(b.gravity)} g</span><span class="calc-a"><i></i>কেজি</span></div>`)), `<div class="wrow wh"><span>কোথায়</span><span>মাধ্যাকর্ষণ</span><span>কত ভারী</span></div>`),
      subHead('গ. কার চাঁদ সবচেয়ে বেশি?', 'সবচেয়ে বেশি চাঁদ যার, তার ঘরে ১। যাদের সমান, তাদের একই নম্বর দিতে পারো।'),
      group('ordlist', shuffleMoved(withMoons, 'space:moons').map((b) => block(`<div class="orow"><span class="box"></span><b>${esc(b.bn)}</b><span>${bn(moonsOf(b))}টি চাঁদ</span></div>`))),
    ],
  });
  keys.push({
    title: 'সৌরজগৎ · আসল সংখ্যা দিয়ে সাজাও', ref: 'sp-order',
    rows: [
      `<b>ক.</b> ${byAu.map((b, i) => `${bn(i + 1)}. ${esc(b.bn)}`).join(' → ')}`,
      `<b>খ.</b> ${bodies.map((b) => `${esc(b.bn)} ${weight(b.gravity)} কেজি`).join(' · ')} <span class="why">(দশমিকের পরে এক ঘর পর্যন্ত)</span>`,
      `<b>গ.</b> ${byMoons.map((b) => `${esc(b.bn)} ${bn(moonsOf(b))}`).join(' → ')}`,
    ],
  });
  // quiz from the stats
  const pool = bodies.filter((b) => b.id !== 'sun' && b.id !== 'moon');
  const qs = [];
  const pairs = shuffle(pool.flatMap((b) => PLANET_KEYS.map((k) => [b, k])), 'space:quiz');
  const usedBodies = new Map();
  for (const [b, k] of pairs) {
    if (qs.length >= 10) break;
    if ((usedBodies.get(b.id) ?? 0) >= 2 || qs.some((q) => q.k === k && q.b.id === b.id)) continue;
    const v = b.stats.find((s) => s.k === k)?.v;
    if (!v) continue;
    // Only figures that belong to one body alone, so every question has exactly one right answer.
    if (pool.filter((o) => o.stats.find((s) => s.k === k)?.v === v).length > 1) continue;
    const others = shuffle(pool.filter((o) => o.id !== b.id && o.stats.find((s) => s.k === k)?.v !== v), `space:q:${b.id}:${k}`).slice(0, 3);
    if (others.length < 3) continue;
    const opts = shuffle([b, ...others], `space:q:${b.id}:${k}:o`);
    qs.push({ b, k, v, opts, answer: opts.indexOf(b) });
    usedBodies.set(b.id, (usedBodies.get(b.id) ?? 0) + 1);
  }
  out.push({
    id: 'sp-quiz', cont: 'সৌরজগৎ যাচাই',
    parts: [
      secHead('সৌরজগৎ · যাচাই', 'সংখ্যা দেখে চিনে নাও', 'প্রতিটি সংখ্যা কার, চারটি নামের মধ্য থেকে বেছে গোলটা ভরাট করো।', nameBar()),
      group('mcq', qs.map((q, i) => block(`<div class="q"><span class="num">${bn(i + 1)}.</span><div><div>${q.k === 'চাঁদ' ? `কার চাঁদ <b>${esc(q.v)}টি</b>?` : `কার ${esc(q.k)} <b>${esc(q.v)}</b>?`}</div><div class="opts">${q.opts.map((o, k) => `<span class="opt"><span class="o">${OPT[k]}</span>${esc(o.bn)}</span>`).join('')}</div></div></div>`))),
      block(`<div class="score">পেলাম <i></i> / ${bn(qs.length)}</div>`),
    ],
  });
  keys.push({
    title: 'সৌরজগৎ · সংখ্যা দেখে চিনে নাও', ref: 'sp-quiz',
    rows: [qs.map((q, i) => `${bn(i + 1)}. <b>${OPT[q.answer]}</b> ${esc(q.b.bn)}`).join(' · ')],
  });
  return out;
}

export const SPACE_CSS = String.raw`
.bcard{border-radius:3mm;padding:2.6mm 3.4mm;display:flex;flex-direction:column;gap:1.2mm;position:relative}
.bcard .nm{font-size:14pt;font-weight:800;line-height:1.3}
.bhead{display:flex;gap:2mm;align-items:center;border-bottom:1.6pt solid var(--c);padding-bottom:1mm}
.bcard .l1{font-size:11pt;line-height:1.5}
.bcard .fun{font-size:11pt;background:color-mix(in srgb,var(--c) 9%,#fff);border-radius:2mm;padding:1.6mm 2.4mm}
.bcard .fun b{color:var(--c)}
.bst{display:grid;grid-template-columns:1fr 1fr;gap:1.2mm 2mm}
.bst span{display:flex;flex-direction:column;border:.6pt solid #e1e4ea;border-radius:1.6mm;padding:.3mm 2mm;line-height:1.3}
.bst i{font-style:normal;font-size:9.5pt;color:#5b6475}
.bst b{font-size:11pt}
.g.ordlist{display:grid;grid-template-columns:repeat(3,1fr);gap:2.4mm 4mm}
.orow{display:flex;gap:2.4mm;align-items:center;border:.8pt solid #d7dbe3;border-radius:2mm;padding:1.4mm 2.4mm}
.orow span:last-child{margin-left:auto;color:#3a4356}
.g.wt{display:grid;grid-template-columns:1fr 1fr;gap:1.6mm 8mm}
.wrow{display:grid;grid-template-columns:24mm 20mm 1fr;align-items:end;gap:2mm;padding:.6mm 0}
.wrow.wh{grid-column:1/-1;font-weight:800;color:#5b6475;font-size:10pt;grid-template-columns:24mm 20mm 1fr}
.wrow .calc-a i{height:7mm}
`;
