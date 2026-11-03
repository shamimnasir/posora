/**
 * Drawn activity pages for the eight worlds that had only cards, blanks and
 * multiple choice: a diagram to label, colour, draw on or read. Two per
 * world, each built around one of the world's own categories, so a child who
 * has read that category's cards can do it. The drawings are plain SVG line
 * art (printable in black and white, meant to be coloured in), and every
 * answer goes into the pack's উত্তরপত্র like any other page.
 */
import { esc, bn, OPT, shuffle, shuffleMoved, block, keep, group } from './pack-kit.mjs';
import { secHead, nameBar } from './pack-world.mjs';

const subHead = (t, inst = '') => keep(`<p class="h2">${esc(t)}</p>${inst ? `<p class="inst">${esc(inst)}</p>` : ''}`);
const bank = (words, title = 'শব্দের ঝুড়ি') => block(`<div class="bank"><p class="h3">${esc(title)}</p>${words.map((w) => `<span class="pill">${esc(w)}</span>`).join('')}</div>`);
const lines = (n, label = '') => `<div class="wl">${Array.from({ length: n }, (_, i) => `<div class="wline"><span class="num">${label ? esc(label) : bn(i + 1) + '.'}</span><i></i></div>`).join('')}</div>`;
const numberedLines = (n) => `<div class="wgrid">${Array.from({ length: n }, (_, i) => `<div class="wline"><span class="num">${bn(i + 1)}.</span><i></i></div>`).join('')}</div>`;
/** A numbered marker inside a drawing. */
const mark = (x, y, n) => `<g class="mk"><circle cx="${x}" cy="${y}" r="5.2"/><text x="${x}" y="${y + 2.1}" text-anchor="middle">${esc(n)}</text></g>`;
const arrowDefs = '<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#4c5568"/></marker></defs>';
const tickPair = (a, b) => `<span class="tp"><i class="tick"></i>${esc(a)}</span><span class="tp"><i class="tick"></i>${esc(b)}</span>`;

/** Sort rows: a picture and name, one tick column per group. */
function sortTable(items, buckets) {
  const head = `<div class="srow sh" style="--n:${buckets.length}"><span>ছবি ও নাম</span>${buckets.map((b) => `<span>${esc(b)}</span>`).join('')}</div>`;
  return group('sort', items.map((it) => block(`<div class="srow" style="--n:${buckets.length}"><span><b class="sem">${esc(it.emoji)}</b>${esc(it.name)}</span>${buckets.map(() => '<span><i class="tick"></i></span>').join('')}</div>`)), head);
}

/* ================= PHYSICS ================= */
function leverSvg({ f, l, e, up, marks }) {
  const bar = `<rect x="8" y="34" width="164" height="4" rx="1.5" class="ln"/>`;
  const ful = `<polygon points="${f - 9},54 ${f + 9},54 ${f},38" class="ln"/>`;
  const load = `<rect x="${l - 10}" y="16" width="20" height="18" rx="2" class="ln"/><text x="${l}" y="28.5" text-anchor="middle" class="sm">ভার</text>`;
  const eff = up
    ? `<line x1="${e}" y1="62" x2="${e}" y2="41" class="ar" marker-end="url(#ah)"/>`
    : `<line x1="${e}" y1="4" x2="${e}" y2="31" class="ar" marker-end="url(#ah)"/>`;
  const at = { f: [f + 14, 50], l: [l + 15, 14], e: [e + 9, up ? 58 : 10] };
  return `<svg viewBox="0 0 180 66" class="fig lever">${arrowDefs}${bar}${ful}${load}${eff}${['f', 'l', 'e'].map((k) => mark(...at[k], marks[k])).join('')}</svg>`;
}

function circuitSvg({ sw, gap, plastic, two }) {
  const w = 'class="wire"';
  const bat = `<line x1="5" y1="36" x2="25" y2="36" class="plate"/><line x1="10" y1="42" x2="20" y2="42" class="plate thick"/><text x="28" y="35" class="sm">+</text><text x="28" y="47" class="sm">−</text>`;
  const bulb = (cx) => `<circle cx="${cx}" cy="15" r="7.5" class="ln"/><path d="M${cx - 4} 17 q2 -7 4 0 q2 -7 4 0" class="fil"/>`;
  const top = two
    ? `<polyline points="15,36 15,15 35.5,15" ${w}/>${bulb(43)}<line x1="50.5" y1="15" x2="69.5" y2="15" ${w}/>${bulb(77)}<polyline points="84.5,15 105,15 105,${gap ? 34 : 65}" ${w}/>`
    : `<polyline points="15,36 15,15 52.5,15" ${w}/>${bulb(60)}<polyline points="67.5,15 105,15 105,${gap ? 34 : plastic ? 30 : 65}" ${w}/>`;
  const right = gap ? `<line x1="105" y1="46" x2="105" y2="65" ${w}/>`
    : plastic ? `<rect x="96" y="30" width="18" height="16" rx="2" class="ln plastic"/><text x="105" y="40.5" text-anchor="middle" class="xs">প্লাস্টিক</text><line x1="105" y1="46" x2="105" y2="65" ${w}/>` : '';
  const bottom = sw === 'open'
    ? `<polyline points="105,65 70,65" ${w}/><circle cx="70" cy="65" r="1.6" class="pin"/><line x1="50" y1="65" x2="67" y2="54" ${w}/><circle cx="50" cy="65" r="1.6" class="pin"/><polyline points="50,65 15,65 15,42" ${w}/>`
    : sw === 'closed'
      ? `<polyline points="105,65 70,65" ${w}/><circle cx="70" cy="65" r="1.6" class="pin"/><line x1="50" y1="65" x2="70" y2="65" ${w}/><circle cx="50" cy="65" r="1.6" class="pin"/><polyline points="50,65 15,65 15,42" ${w}/>`
      : `<polyline points="105,65 15,65 15,42" ${w}/>`;
  const label = sw ? `<text x="60" y="73" text-anchor="middle" class="xs">সুইচ ${sw === 'open' ? '(খোলা)' : '(চালু)'}</text>` : '';
  return `<svg viewBox="0 0 120 76" class="fig circ">${top}${right}${bottom}${bat}${label}</svg>`;
}

function physicsSections(keys) {
  const roles = { f: 'আলম্ব', l: 'ভার', e: 'বল' };
  const levers = [
    { f: 92, l: 26, e: 160, up: false, marks: { l: 'ক', f: 'খ', e: 'গ' }, mid: 'আলম্ব', ex: 'ঢেঁকি' },
    { f: 18, l: 92, e: 162, up: true, marks: { e: 'ক', l: 'খ', f: 'গ' }, mid: 'ভার', ex: 'ঠেলাগাড়ি' },
    { f: 18, l: 160, e: 88, up: true, marks: { f: 'ক', e: 'খ', l: 'গ' }, mid: 'বল', ex: 'চিমটা' },
  ];
  const lev = levers.map((v, i) => block(`<div class="figrow"><div class="figbox"><p class="h3">${bn(i + 1)}.</p>${leverSvg(v)}</div><div class="figans"><div class="wline"><span>ক =</span><i></i></div><div class="wline"><span>খ =</span><i></i></div><div class="wline"><span>গ =</span><i></i></div><div class="wline"><span>মাঝখানে আছে</span><i></i></div><div class="wline"><span>উদাহরণ</span><i></i></div></div></div>`));
  keys.push({
    title: 'লিভারের তিন রকম', ref: 'sp-lever',
    rows: levers.map((v, i) => `${bn(i + 1)}. ${Object.entries(v.marks).sort((a, b) => a[1].localeCompare(b[1], 'bn')).map(([k, m]) => `${m} = ${roles[k]}`).join(', ')}; মাঝখানে <b>${v.mid}</b>; উদাহরণ <b>${v.ex}</b>`)
      .concat('<span class="why">ঢেঁকিতে আলম্ব মাঝে, পায়ের চাপ এক মাথায়, ভার অন্য মাথায়। ঠেলাগাড়িতে চাকা আলম্ব, বোঝা মাঝে, হাত হাতলে। চিমটায় জোড়া মাথা আলম্ব, আঙুলের চাপ মাঝে, ভার ডগায়।</span>'),
  });

  const circuits = [
    { sw: null, ans: true, why: 'ব্যাটারির এক মাথা থেকে বাতি হয়ে অন্য মাথায় পথ পুরো বন্ধ।' },
    { sw: 'open', ans: false, why: 'সুইচ খোলা, পথ মাঝখানে ভাঙা।' },
    { sw: null, two: true, ans: true, why: 'দুটো বাতি এক পথে (শ্রেণি সংযোগে), পথ পুরো বন্ধ, তাই দুটোই জ্বলবে।' },
    { sw: null, gap: true, ans: false, why: 'ডান দিকের তার ছেঁড়া, বিদ্যুৎ যাওয়ার পথ নেই।' },
    { sw: null, plastic: true, ans: false, why: 'প্লাস্টিক অন্তরক, তার ভেতর দিয়ে বিদ্যুৎ চলে না।' },
    { sw: 'closed', ans: true, why: 'সুইচ বন্ধ (চালু), পথ পুরো।' },
  ];
  keys.push({ title: 'বাতি জ্বলবে কি?', ref: 'sp-circuit', rows: circuits.map((c, i) => `${bn(i + 1)}. <b>${c.ans ? 'জ্বলবে' : 'জ্বলবে না'}</b> <span class="why">${esc(c.why)}</span>`) });

  return {
    sections: [
      {
        id: 'sp-lever', cont: 'লিভারের তিন রকম',
        parts: [
          secHead('আঁকা পাতা · সরল যন্ত্র', 'লিভারের তিন রকম', 'প্রতিটি ছবিতে একটা দণ্ড, একটা আলম্ব (ত্রিভুজ, যার ওপর দণ্ড ভর করে), একটা ভার (বাক্স) আর একটা বল (তীর, যেখানে তুমি চাপ দাও)। ক, খ, গ কোনটা, পাশে লেখো। তারপর লেখো মাঝখানে কী আছে আর উদাহরণটা কোনটা।', nameBar()),
          bank(['আলম্ব', 'ভার', 'বল', 'ঢেঁকি', 'ঠেলাগাড়ি', 'চিমটা']),
          group('figs', lev),
          block('<p class="inst">নিজে করে দেখো: একটা স্কেল আর একটা পেন্সিল দিয়ে লিভার বানাও। পেন্সিল (আলম্ব) বইয়ের দিকে সরালে চাপ দিতে সহজ লাগে কি না দেখো।</p>'),
        ],
      },
      {
        id: 'sp-circuit', cont: 'বাতি জ্বলবে কি?',
        parts: [
          secHead('আঁকা পাতা · বিদ্যুৎ ও চুম্বক', 'বাতি জ্বলবে কি?', 'বাঁয়ে ব্যাটারি (লম্বা দাগ +, খাটো দাগ −), ওপরে বাতি, নিচে কোথাও সুইচ। বিদ্যুৎ ব্যাটারির এক মাথা থেকে বেরিয়ে পুরো পথ ঘুরে অন্য মাথায় ফিরতে পারলে তবেই বাতি জ্বলে। প্রতিটি বর্তনী দেখে টিক দাও, তারপর কেন লেখো।', nameBar()),
          group('circs', circuits.map((c, i) => block(`<div class="circ-card"><p class="h3">${bn(i + 1)}.</p>${circuitSvg(c)}<div class="tps">${tickPair('জ্বলবে', 'জ্বলবে না')}</div><div class="wline"><span>কেন?</span><i></i></div></div>`))),
          block('<p class="inst">যে বর্তনীগুলোতে বাতি জ্বলবে, সেগুলোর বাতির চারপাশে হলুদ আলোর রেখা আঁকো।</p>'),
          block('<div class="drawbox"><span>এবার তুমি আঁকো: একটা ব্যাটারি, দুটো বাতি আর একটা সুইচ দিয়ে এমন বর্তনী, যাতে সুইচ চালু করলে দুটো বাতিই জ্বলে।</span></div>'),
        ],
      },
    ],
    toc: [['sp-lever', 'লিভারের তিন রকম: ছবিতে আলম্ব, ভার আর বল চেনো'], ['sp-circuit', 'বাতি জ্বলবে কি? ৬টি বর্তনী দেখে বলো']],
    preview: 'sp-circuit',
  };
}

/* ================= CHEMISTRY ================= */
function statesSvg() {
  const box = (x, y, t) => `<rect x="${x}" y="${y}" width="46" height="38" rx="3" class="ln"/><text x="${x + 23}" y="${y + 47}" text-anchor="middle" class="lb">${esc(t)}</text>`;
  return `<svg viewBox="0 0 190 150" class="fig states">${arrowDefs}
${box(72, 4, 'গ্যাস')}${box(8, 96, 'কঠিন')}${box(136, 96, 'তরল')}
<line x1="58" y1="108" x2="132" y2="108" class="ar" marker-end="url(#ah)"/>${mark(95, 101, '১')}
<line x1="132" y1="124" x2="58" y2="124" class="ar" marker-end="url(#ah)"/>${mark(95, 131, '২')}
<line x1="150" y1="92" x2="122" y2="46" class="ar" marker-end="url(#ah)"/>${mark(146, 66, '৩')}
<line x1="112" y1="48" x2="140" y2="92" class="ar" marker-end="url(#ah)"/>${mark(117, 74, '৪')}
<line x1="30" y1="92" x2="70" y2="36" class="ar" marker-end="url(#ah)"/>${mark(40, 62, '৫')}
</svg>`;
}

function chemistrySections(keys) {
  const arrows = ['গলন', 'জমাট বাঁধা', 'বাষ্পীভবন', 'ঘনীভবন', 'ঊর্ধ্বপাতন'];
  const examples = [
    { q: 'বরফ রোদে রাখলে পানি হয়ে যায়', a: 'গলন' },
    { q: 'ভেজা কাপড় রোদে শুকিয়ে যায়', a: 'বাষ্পীভবন' },
    { q: 'ঠান্ডা গ্লাসের গায়ে পানির ফোঁটা জমে', a: 'ঘনীভবন' },
    { q: 'ফ্রিজে রাখা পানি বরফ হয়', a: 'জমাট বাঁধা' },
    { q: 'আলমারির ন্যাপথলিন গলে না, ধীরে ধীরে উবে যায়', a: 'ঊর্ধ্বপাতন' },
  ];
  keys.push({
    title: 'কঠিন, তরল, গ্যাস: তীরের নাম', ref: 'sp-states',
    rows: [arrows.map((a, i) => `${bn(i + 1)}. ${a}`).join(' · '), `<b>উদাহরণ:</b> ${examples.map((e, i) => `${bn(i + 1)}. ${e.a}`).join(' · ')}`,
      '<span class="why">কঠিনে কণা গা ঘেঁষে সারি সারি, তরলে কাছাকাছি কিন্তু এলোমেলো, গ্যাসে অনেক দূরে দূরে ছড়ানো।</span>'],
  });

  const ph = [
    { emoji: '🍋', name: 'লেবুর রস', v: 2 },
    { emoji: '🫙', name: 'ভিনেগার (সিরকা)', v: 3 },
    { emoji: '💧', name: 'বিশুদ্ধ পানি', v: 7 },
    { emoji: '🧁', name: 'বেকিং সোডা গোলানো পানি', v: 9 },
    { emoji: '🧼', name: 'সাবান পানি', v: 10 },
    { emoji: '🪣', name: 'চুনের পানি', v: 12 },
  ];
  const order = shuffleMoved(ph, 'ph');
  const kind = (v) => v < 7 ? 'অ্যাসিড' : v === 7 ? 'নিরপেক্ষ' : 'ক্ষার';
  const strip = `<div class="phstrip">${Array.from({ length: 15 }, (_, i) => `<div class="phc"><span>${bn(i)}</span></div>`).join('')}</div><div class="phlab"><span>← বেশি অ্যাসিড</span><span>নিরপেক্ষ</span><span>বেশি ক্ষার →</span></div>`;
  keys.push({
    title: 'pH স্কেল রং করো', ref: 'sp-ph',
    rows: [order.map((p, i) => `${bn(i + 1)}. ${esc(p.name)}: প্রায় ${bn(p.v)}, <b>${kind(p.v)}</b>`).join(' · '),
      '<span class="why">মানগুলো আনুমানিক; কতটা গাঢ় করে গোলানো তার ওপর একটু বদলায়। ৭-এর কম অ্যাসিড, ঠিক ৭ নিরপেক্ষ, ৭-এর বেশি ক্ষার।</span>'],
  });

  return {
    sections: [
      {
        id: 'sp-states', cont: 'কঠিন, তরল, গ্যাস',
        parts: [
          secHead('আঁকা পাতা · পদার্থের অবস্থা', 'কঠিন, তরল, গ্যাস', 'তিনটি বাক্সে কণা আঁকো (ছোট ছোট গোল): কঠিনে গা ঘেঁষে সারি সারি, তরলে কাছাকাছি কিন্তু এলোমেলো, গ্যাসে অনেক দূরে দূরে। তারপর প্রতিটি নম্বর দেওয়া তীরের নাম ঝুড়ি থেকে বেছে লেখো।', nameBar()),
          bank(arrows),
          block(`<div class="figrow"><div class="figbox wide">${statesSvg()}</div><div class="figans">${lines(5)}</div></div>`),
          subHead('কোন বদল?', 'প্রতিটি ঘটনা ওপরের কোন তীরের মতো? নামটা লেখো।'),
          group('blanks', examples.map((e, i) => block(`<div class="bl"><span class="num">${bn(i + 1)}.</span><div>${esc(e.q)}<div class="ansline">কোন বদল? <i></i></div></div></div>`))),
        ],
      },
      {
        id: 'sp-ph', cont: 'pH স্কেল',
        parts: [
          secHead('আঁকা পাতা · অ্যাসিড, ক্ষার ও লবণ', 'pH স্কেল রং করো', 'pH স্কেল ০ থেকে ১৪। ৭-এর কম মানে অ্যাসিড, ঠিক ৭ নিরপেক্ষ, ৭-এর বেশি ক্ষার। সার্বজনীন নির্দেশক কাগজের মতো রং করো: ০-৩ লাল, ৪-৬ কমলা-হলুদ, ৭ সবুজ, ৮-১০ নীল, ১১-১৪ বেগুনি।', nameBar()),
          block(strip),
          subHead('কোনটা কোথায়?', 'প্রতিটি জিনিস থেকে স্কেলের আন্দাজ ঘর পর্যন্ত একটা দাগ টানো। তারপর টিক দাও: অ্যাসিড, নিরপেক্ষ না ক্ষার।'),
          sortTable(order, ['অ্যাসিড', 'নিরপেক্ষ', 'ক্ষার']),
          block('<p class="inst">বড়দের সঙ্গে করো: লাল বাঁধাকপি সেদ্ধ করা বেগুনি পানিতে লেবুর রস দিলে লালচে, সাবান পানি দিলে সবুজ-নীল হয়। রং দেখে ওপরের স্কেলের সঙ্গে মিলাও।</p>'),
        ],
      },
    ],
    toc: [['sp-states', 'কঠিন, তরল, গ্যাস: কণা আঁকো, তীরের নাম লেখো'], ['sp-ph', 'pH স্কেল রং করো, ঘরের জিনিস বসাও']],
    preview: 'sp-states',
  };
}

/* ================= LIFE ================= */
function plantSvg() {
  return `<svg viewBox="0 0 170 180" class="fig plant">
<line x1="6" y1="128" x2="164" y2="128" class="ground"/>
<path d="M85 128 C84 100 86 70 85 34" class="stem"/>
<path d="M85 92 C96 84 108 80 118 70" class="stem thin"/>
<path d="M85 78 C74 70 64 66 54 60" class="stem thin"/><path d="M85 107 L74 101.5 M85 113 L98 109.5" class="stem thin"/>
<ellipse cx="44" cy="58" rx="13" ry="6.5" transform="rotate(-20 44 58)" class="leaf"/><path d="M33 61 L56 54" class="vein"/>
<ellipse cx="62" cy="96" rx="13" ry="6.5" transform="rotate(25 62 96)" class="leaf"/><path d="M51 91 L73 101" class="vein"/>
<ellipse cx="110" cy="104" rx="13" ry="6.5" transform="rotate(-25 110 104)" class="leaf"/><path d="M99 109 L121 99" class="vein"/>
<circle cx="122" cy="80" r="9" class="fruit"/><path d="M120 70 q2 -3 5 -2" class="vein"/>
${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="${85 + 8 * Math.cos(a * Math.PI / 180)}" cy="${26 + 8 * Math.sin(a * Math.PI / 180)}" rx="6" ry="4.4" transform="rotate(${a} ${85 + 8 * Math.cos(a * Math.PI / 180)} ${26 + 8 * Math.sin(a * Math.PI / 180)})" class="petal"/>`).join('')}
<circle cx="85" cy="26" r="4" class="centre"/>
<path d="M85 128 C80 140 70 148 60 158 M85 128 C88 142 96 152 108 162 M85 128 L86 168 M75 146 C70 150 64 151 58 150 M95 150 C100 154 106 154 112 152" class="root"/>
${mark(100, 14, '১')}${mark(140, 80, '২')}${mark(30, 74, '৩')}${mark(70, 120, '৪')}${mark(120, 160, '৫')}
</svg>`;
}

function lifeSections(keys) {
  const parts = ['ফুল', 'ফল', 'পাতা', 'কাণ্ড', 'মূল'];
  const jobs = [
    { p: 'মূল', j: 'মাটি থেকে পানি আর খনিজ টেনে নেয়, গাছকে মাটিতে আটকে রাখে' },
    { p: 'কাণ্ড', j: 'গাছকে খাড়া রাখে, পানি ওপরে আর খাবার নিচে বয়ে নেয়' },
    { p: 'পাতা', j: 'সূর্যের আলোয় গাছের খাবার তৈরি করে (সালোকসংশ্লেষণ)' },
    { p: 'ফুল', j: 'পরাগায়নের পরে এখান থেকেই ফল আর বীজ তৈরি হয়' },
    { p: 'ফল', j: 'ভেতরের বীজকে রক্ষা করে, ছড়াতে সাহায্য করে' },
  ];
  const right = shuffleMoved(jobs.map((x) => x.j), 'plant-jobs');
  keys.push({
    title: 'গাছের অংশ চেনো', ref: 'sp-plant',
    rows: [parts.map((p, i) => `${bn(i + 1)}. ${p}`).join(' · '), `<b>কাজ:</b> ${jobs.map((x) => `${x.p} → ${esc(x.j)}`).join(' · ')}`],
  });

  const cycle = [
    { e: '🌰', n: 'বীজ' }, { e: '🌱', n: 'অঙ্কুরোদ্গম' }, { e: '🪴', n: 'চারা' },
    { e: '🌳', n: 'পূর্ণ গাছ' }, { e: '🌸', n: 'ফুল ও পরাগায়ন' }, { e: '🥭', n: 'ফল ও নতুন বীজ' },
  ];
  const cards = shuffleMoved(cycle, 'cycle');
  const ring = cycle.map((_, i) => {
    const a = (i / cycle.length) * 2 * Math.PI - Math.PI / 2;
    const x = 90 + 62 * Math.cos(a), y = 80 + 62 * Math.sin(a);
    const a2 = ((i + 0.5) / cycle.length) * 2 * Math.PI - Math.PI / 2;
    const ax = 90 + 62 * Math.cos(a2), ay = 80 + 62 * Math.sin(a2);
    const deg = (a2 * 180) / Math.PI + 90;
    const nx = 90 + 87 * Math.cos(a), ny = 80 + 87 * Math.sin(a);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="17" class="ln"/><circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="5" class="numdot"/><text x="${nx.toFixed(1)}" y="${(ny + 2.2).toFixed(1)}" text-anchor="middle" class="numt">${bn(i + 1)}</text><path d="M-6 -5 L4 0 L-6 5" transform="translate(${ax.toFixed(1)} ${ay.toFixed(1)}) rotate(${deg.toFixed(0)})" class="chev"/>`;
  }).join('');
  keys.push({
    title: 'গাছের জীবনচক্র', ref: 'sp-cycle',
    rows: [cycle.map((c, i) => `${bn(i + 1)}. ${OPT[cards.indexOf(c)]} ${c.n}`).join(' → '), '<span class="why">ফলের ভেতরের নতুন বীজ মাটিতে পড়লে চক্র আবার ১ থেকে শুরু হয়।</span>'],
  });

  return {
    sections: [
      {
        id: 'sp-plant', cont: 'গাছের অংশ চেনো',
        parts: [
          secHead('আঁকা পাতা · গাছের অংশ', 'গাছের অংশ চেনো', 'ছবির ১ থেকে ৫ নম্বর অংশের নাম ঝুড়ি থেকে বেছে পাশে লেখো। তারপর গাছটা রং করো: পাতা সবুজ, ফুল আর ফল তোমার পছন্দমতো, মূল বাদামি।', nameBar()),
          bank(parts),
          block(`<div class="figrow"><div class="figbox wide">${plantSvg()}</div><div class="figans">${lines(5)}</div></div>`),
          block(`<p class="h2">কোন অংশের কী কাজ?</p><p class="inst">বাঁয়ের অংশের সঙ্গে ডানের ঠিক কাজটা দাগ টেনে মেলাও।</p><div class="match">${jobs.map((x, i) => `<div class="mrow"><div class="l">${esc(x.p)}</div><div></div><div class="r">${esc(right[i])}</div></div>`).join('')}</div>`),
        ],
      },
      {
        id: 'sp-cycle', cont: 'গাছের জীবনচক্র',
        parts: [
          secHead('আঁকা পাতা · জীবনচক্র', 'গাছের জীবনচক্র', 'নিচের ছয়টা ছবি এলোমেলো। চক্রের ১ নম্বর গোল থেকে শুরু করে তীর ধরে ঠিক ক্রমে প্রতিটি গোলের ভেতরে ছবিটা আঁকো, পাশে তার অক্ষর (ক, খ...) লেখো।', nameBar()),
          block(`<div class="cycwrap"><svg viewBox="0 -14 180 188" class="fig cyc">${ring}</svg></div>`),
          group('cyccards', cards.map((c, i) => block(`<div class="cyccard"><span class="o">${OPT[i]}</span><span class="cem">${esc(c.e)}</span><span>${esc(c.n)}</span></div>`))),
          block('<p class="inst">নিজে করে দেখো: ভেজা তুলোর ওপর একটা ছোলা বা মুগ রেখে রোজ দেখো। কত দিনে অঙ্কুর বের হলো, এখানে লেখো: <span class="blank"></span> দিন।</p>'),
        ],
      },
    ],
    toc: [['sp-plant', 'গাছের অংশ চেনো: ছবিতে নাম লেখো, রং করো'], ['sp-cycle', 'গাছের জীবনচক্র: ছবি সাজাও']],
    preview: 'sp-plant',
  };
}

/* ================= NATURE ================= */
function waterCycleSvg() {
  return `<svg viewBox="0 0 190 120" class="fig water">${arrowDefs}
<circle cx="22" cy="20" r="10" class="sun"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => { const r = a * Math.PI / 180; return `<line x1="${22 + 13 * Math.cos(r)}" y1="${20 + 13 * Math.sin(r)}" x2="${22 + 17 * Math.cos(r)}" y2="${20 + 17 * Math.sin(r)}" class="ray"/>`; }).join('')}
<path d="M110 16 a10 10 0 0 1 18 -6 a12 12 0 0 1 22 2 a9 9 0 0 1 4 17 h-42 a8 8 0 0 1 -2 -13z" class="cloud"/>
${[118, 128, 138, 148].map((x) => `<line x1="${x}" y1="34" x2="${x - 3}" y2="46" class="rain"/>`).join('')}
<polygon points="95,96 142,54 186,96" class="hill"/>
<path d="M0 92 q10 -4 20 0 t20 0 t20 0 t20 0 L95 96 L95 120 L0 120z" class="sea"/>
<path d="M124 70 C116 80 106 88 88 94" class="river"/>
<rect x="95" y="96" width="95" height="24" class="soil"/>
<line x1="30" y1="86" x2="44" y2="46" class="ar wavy" marker-end="url(#ah)"/><line x1="48" y1="86" x2="62" y2="46" class="ar wavy" marker-end="url(#ah)"/>
<line x1="170" y1="99" x2="170" y2="116" class="ar dash" marker-end="url(#ah)"/><line x1="160" y1="99" x2="160" y2="116" class="ar dash" marker-end="url(#ah)"/>
${mark(62, 66, '১')}${mark(166, 20, '২')}${mark(108, 42, '৩')}${mark(180, 108, '৪')}
</svg>`;
}

function seasonWheelSvg(seasons) {
  const R = 96, cx = 100, cy = 100;
  const pt = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const out = seasons.map((s, i) => {
    const a0 = (i / 6) * 2 * Math.PI - Math.PI / 2 - Math.PI / 6, a1 = a0 + Math.PI / 3, am = (a0 + a1) / 2;
    const [x0, y0] = pt(R, a0), [x1, y1] = pt(R, a1);
    const [tx, ty] = pt(36, am), [lx, ly] = pt(66, am);
    return `<path d="M${cx} ${cy} L${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}Z" class="seg"/>
<text x="${tx.toFixed(1)}" y="${(ty - 1).toFixed(1)}" text-anchor="middle" class="em">${esc(s.emoji)}</text><text x="${tx.toFixed(1)}" y="${(ty + 9).toFixed(1)}" text-anchor="middle" class="lb">${esc(s.name)}</text>
<line x1="${(lx - 17).toFixed(1)}" y1="${(ly - 2).toFixed(1)}" x2="${(lx + 17).toFixed(1)}" y2="${(ly - 2).toFixed(1)}" class="wl2"/><line x1="${(lx - 17).toFixed(1)}" y1="${(ly + 10).toFixed(1)}" x2="${(lx + 17).toFixed(1)}" y2="${(ly + 10).toFixed(1)}" class="wl2"/>`;
  }).join('');
  return `<svg viewBox="0 0 200 200" class="fig wheel">${out}<circle cx="${cx}" cy="${cy}" r="14" class="hub"/><text x="${cx}" y="${cy + 3}" text-anchor="middle" class="sm">বছর</text></svg>`;
}

function natureSections(keys, world) {
  const steps = ['বাষ্পীভবন', 'ঘনীভবন', 'বৃষ্টিপাত', 'ভূগর্ভস্থ পানি'];
  keys.push({
    title: 'পানিচক্র', ref: 'sp-water',
    rows: [steps.map((s, i) => `${bn(i + 1)}. ${s}`).join(' · '), '<span class="why">সূর্যের তাপে সাগর-নদীর পানি বাষ্প হয়ে ওঠে, ওপরে ঠান্ডায় জমে মেঘ হয়, মেঘ থেকে বৃষ্টি নামে, কিছু পানি মাটি চুঁইয়ে নিচে জমে, বাকিটা নদী দিয়ে আবার সাগরে ফেরে।</span>'],
  });
  const pic = new Map(world.readable.flatMap((c) => c.items.map((it) => [it.name, it.emoji])));
  const seasons = [
    ['গ্রীষ্ম', 'বৈশাখ', 'জ্যৈষ্ঠ'], ['বর্ষা', 'আষাঢ়', 'শ্রাবণ'], ['শরৎ', 'ভাদ্র', 'আশ্বিন'],
    ['হেমন্ত', 'কার্তিক', 'অগ্রহায়ণ'], ['শীত', 'পৌষ', 'মাঘ'], ['বসন্ত', 'ফাল্গুন', 'চৈত্র'],
  ].map(([name, a, b]) => ({ name, months: [a, b], emoji: pic.get(name) || '•' }));
  const months = shuffle(seasons.flatMap((s) => s.months), 'months');
  keys.push({ title: 'ছয় ঋতুর চাকা', ref: 'sp-seasons', rows: [seasons.map((s) => `<b>${s.name}:</b> ${s.months.join(', ')}`).join(' · ')] });

  return {
    sections: [
      {
        id: 'sp-water', cont: 'পানিচক্র',
        parts: [
          secHead('আঁকা পাতা · পানিচক্র ও নদী', 'পানিচক্র', 'ছবিতে ১ থেকে ৪ নম্বর ধাপের নাম ঝুড়ি থেকে বেছে লেখো। তারপর রং করো: সাগর আর নদী নীল, পাহাড় সবুজ, মাটি বাদামি, সূর্য হলুদ।', nameBar()),
          bank(steps),
          block(`<div class="figbox full">${waterCycleSvg()}</div>`),
          block(`<div class="wgrid">${steps.map((_, i) => `<div class="wline"><span class="num">${bn(i + 1)}.</span><i></i></div>`).join('')}</div>`),
          subHead('নিজের ভাষায় লেখো', 'বৃষ্টির এক ফোঁটা পানি সাগর থেকে আকাশে উঠে আবার সাগরে ফিরল। পথে কোথায় কোথায় গেল?'),
          block(lines(3, '✎')),
        ],
      },
      {
        id: 'sp-seasons', cont: 'ছয় ঋতুর চাকা',
        parts: [
          secHead('আঁকা পাতা · ছয় ঋতু ও বারো মাস', 'ছয় ঋতুর চাকা', 'বাংলা বছরে ছয় ঋতু, প্রতিটিতে দুই মাস। ঝুড়ির বারো মাস ঠিক ঋতুর ঘরের দুই দাগে লেখো। বছর শুরু হয় বৈশাখে, গ্রীষ্ম দিয়ে। তারপর প্রতিটি ঘর সেই ঋতুর রঙে রং করো।', nameBar()),
          bank(months, 'মাসের ঝুড়ি'),
          block(`<div class="wheelwrap">${seasonWheelSvg(seasons)}</div>`),
          block('<div class="drawbox"><span>আমার প্রিয় ঋতুর ছবি আঁকো। কেন প্রিয়, নিচে এক লাইনে লেখো।</span></div>'),
        ],
      },
    ],
    toc: [['sp-water', 'পানিচক্র: ছবিতে ধাপের নাম লেখো, রং করো'], ['sp-seasons', 'ছয় ঋতুর চাকা: বারো মাস বসাও']],
    preview: 'sp-water',
  };
}

/* ================= FOOD ================= */
function plateSvg() {
  return `<svg viewBox="0 0 200 150" class="fig plate">
<circle cx="80" cy="75" r="70" class="rim"/><circle cx="80" cy="75" r="62" class="ln"/>
<line x1="80" y1="13" x2="80" y2="137" class="ln"/><line x1="80" y1="75" x2="142" y2="75" class="ln"/>
<text x="48" y="72" text-anchor="middle" class="lb">শাকসবজি</text><text x="48" y="84" text-anchor="middle" class="lb">ও ফল</text>
<text x="110" y="46" text-anchor="middle" class="lb">ভাত, রুটি</text>
<text x="110" y="104" text-anchor="middle" class="lb">মাছ, ডিম,</text><text x="110" y="115" text-anchor="middle" class="lb">মাংস, ডাল</text>
<path d="M165 40 L190 40 L186 110 L169 110 Z" class="ln"/><line x1="167" y1="58" x2="188" y2="58" class="ln thin"/><text x="177.5" y="124" text-anchor="middle" class="lb">পানি</text>
</svg>`;
}

function foodSections(keys) {
  const foods = [
    { emoji: '🍚', name: 'ভাত', g: 0 }, { emoji: '🫓', name: 'রুটি', g: 0 }, { emoji: '🥔', name: 'আলু', g: 0 },
    { emoji: '🐟', name: 'মাছ', g: 1 }, { emoji: '🥚', name: 'ডিম', g: 1 }, { emoji: '🫘', name: 'ডাল', g: 1 },
    { emoji: '🧈', name: 'মাখন', g: 2 }, { emoji: '🫗', name: 'সয়াবিন তেল', g: 2 },
    { emoji: '🥕', name: 'গাজর', g: 3 }, { emoji: '🍊', name: 'কমলা', g: 3 }, { emoji: '🥬', name: 'পালং শাক', g: 3 }, { emoji: '🍅', name: 'টমেটো', g: 3 },
  ];
  const groups = ['শর্করা', 'আমিষ', 'স্নেহ', 'ভিটামিন ও খনিজ'];
  const order = shuffleMoved(foods, 'foods');
  keys.push({
    title: 'কোন খাবার কোন দলে', ref: 'sp-sort',
    rows: groups.map((g, gi) => `<b>${g}:</b> ${foods.filter((f) => f.g === gi).map((f) => f.name).join(', ')}`)
      .concat('<span class="why">বেশির ভাগ খাবারে একাধিক উপাদান থাকে (ডালে কিছু শর্করাও আছে); এখানে প্রতিটির প্রধান উপাদান ধরা হয়েছে।</span>'),
  });
  return {
    sections: [
      {
        id: 'sp-plate', cont: 'আমার থালা',
        parts: [
          secHead('আঁকা পাতা · আমার থালা', 'আমার থালা সাজাও', 'একটা জনপ্রিয় নিয়ম (হার্ভার্ডের Healthy Eating Plate): থালার অর্ধেক শাকসবজি ও ফল, এক ভাগ ভাত-রুটি, এক ভাগ মাছ-ডিম-মাংস-ডাল, পাশে এক গ্লাস পানি। আজকের দুপুরের খাবার ঠিক ঘরে আঁকো বা লেখো, তারপর রং করো।', nameBar()),
          block(`<div class="figbox full">${plateSvg()}</div>`),
          subHead('আমার থালা কেমন হলো?', 'প্রতিটি প্রশ্নে টিক দাও।'),
          group('mcq', [
            'থালার অর্ধেকটা কি শাকসবজি আর ফলে ভরেছে?',
            'আমিষের ঘরে কিছু আছে কি (মাছ, ডিম, মাংস বা ডাল)?',
            'ভাত-রুটি কি এক ভাগের মধ্যে আছে, পুরো থালা জুড়ে নয়?',
            'পাশে পানি আছে কি, মিষ্টি পানীয় নয়?',
          ].map((q, i) => block(`<div class="q"><span class="num">${bn(i + 1)}.</span><div>${esc(q)}<div class="tps">${tickPair('হ্যাঁ', 'এখনো না')}</div></div></div>`))),
        ],
      },
      {
        id: 'sp-sort', cont: 'কোন খাবার কোন দলে',
        parts: [
          secHead('আঁকা পাতা · খাদ্যের ছয় উপাদান', 'কোন খাবার কোন দলে', 'প্রতিটি খাবারের প্রধান উপাদান কোনটা? ঠিক ঘরে টিক দাও।', nameBar()),
          sortTable(order, groups),
          block('<div class="drawbox short"><span>ঘরে আর কোন খাবার আছে? একটা শর্করা, একটা আমিষ আর একটা ভিটামিনের খাবার আঁকো।</span></div>'),
        ],
      },
    ],
    toc: [['sp-plate', 'আমার থালা সাজাও: আঁকো আর যাচাই করো'], ['sp-sort', 'কোন খাবার কোন দলে: ১২টি ছবি সাজাও']],
    preview: 'sp-plate',
  };
}

/* ================= MONEY ================= */
function jarSvg() {
  const coins = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 6; c++) coins.push(`<circle cx="${48 + c * 19 + (r % 2 ? 9 : 0)}" cy="${176 - r * 15}" r="7" class="coin"/>`);
  return `<svg viewBox="0 0 200 200" class="fig jar"><path d="M50 22 h100 v12 q24 10 24 40 v108 q0 12 -12 12 h-124 q-12 0 -12 -12 v-108 q0 -30 24 -40z" class="ln"/><rect x="80" y="26" width="40" height="5" rx="2" class="ln"/>${coins.join('')}</svg>`;
}

function moneySections(keys) {
  const items = [
    { emoji: '🍚', name: 'ঘরের চাল', g: 0 }, { emoji: '💊', name: 'অসুখে ওষুধ', g: 0 }, { emoji: '📚', name: 'স্কুলের বই', g: 0 },
    { emoji: '🎮', name: 'নতুন ভিডিও গেম', g: 1 }, { emoji: '🍭', name: 'ললিপপ', g: 1 }, { emoji: '👟', name: 'স্কুলে যাওয়ার জুতা', g: 0 },
    { emoji: '🧸', name: 'আরেকটা খেলনা', g: 1 }, { emoji: '💧', name: 'খাওয়ার পানি', g: 0 }, { emoji: '🍦', name: 'আইসক্রিম', g: 1 },
    { emoji: '📱', name: 'নতুন মডেলের ফোন', g: 1 },
  ];
  keys.push({
    title: 'দরকার না শুধু চাই?', ref: 'sp-needs',
    rows: [`<b>দরকার:</b> ${items.filter((i) => !i.g).map((i) => i.name).join(', ')}`, `<b>চাই:</b> ${items.filter((i) => i.g).map((i) => i.name).join(', ')}`,
      '<span class="why">দরকার মানে যা ছাড়া চলা কঠিন; চাই মানে থাকলে ভালো লাগে। কোনো পরিবারে একটা জিনিস অন্য ঘরে যেতে পারে, তখন কেন, সেটা নিয়ে কথা বলুন।</span>'],
  });
  return {
    sections: [
      {
        id: 'sp-needs', cont: 'দরকার না শুধু চাই?',
        parts: [
          secHead('আঁকা পাতা · খরচ ও বাজেট', 'দরকার না শুধু চাই?', 'দরকার মানে যা ছাড়া চলা কঠিন। চাই মানে থাকলে ভালো লাগে, না থাকলেও চলে। প্রতিটি ছবি দেখে ঠিক ঘরে টিক দাও।', nameBar()),
          sortTable(items, ['দরকার', 'চাই']),
          subHead('আমার ১০০ টাকা', 'তোমার হাতে ১০০ টাকা। আগে দরকারের জিনিস, তারপর জমানো, শেষে চাই। কোথায় কত রাখবে লেখো, মোট যেন ১০০ হয়।'),
          block(`<div class="budget"><div><span>দরকারে</span><i></i><b>টাকা</b></div><div><span>জমাব</span><i></i><b>টাকা</b></div><div><span>চাই-এ</span><i></i><b>টাকা</b></div><div class="tot"><span>মোট</span><i></i><b>টাকা</b></div></div>`),
        ],
      },
      {
        id: 'sp-jar', cont: 'আমার মাটির ব্যাংক',
        parts: [
          secHead('আঁকা পাতা · সঞ্চয় ও লক্ষ্য', 'আমার মাটির ব্যাংক', 'একটা লক্ষ্য ঠিক করো। প্রতিবার টাকা জমালে ব্যাংকের একটা কয়েন রং করো। সব কয়েন রং হলে লক্ষ্য পূরণ!', nameBar()),
          block(`<div class="goal"><div class="wline"><span>আমি জমাচ্ছি যার জন্য</span><i></i></div><div class="wline"><span>প্রতিটি কয়েন = ৳</span><i></i></div><div class="wline"><span>লক্ষ্য (৪৮ কয়েন) = ৳</span><i></i></div><div class="wline"><span>শুরু করলাম (তারিখ)</span><i></i></div></div>`),
          block(`<div class="figbox full">${jarSvg()}</div>`),
          block('<p class="inst">হিসাব করো: প্রতিটি কয়েন ৳১০ হলে পুরো ব্যাংক কত টাকা? <span class="blank"></span> সপ্তাহে ৩টি কয়েন রং করলে কত সপ্তাহ লাগবে? <span class="blank"></span></p>'),
        ],
      },
    ],
    toc: [['sp-needs', 'দরকার না শুধু চাই? ছবি সাজাও, ১০০ টাকা ভাগ করো'], ['sp-jar', 'আমার মাটির ব্যাংক: কয়েন রং করে লক্ষ্য পূরণ']],
    preview: 'sp-needs',
    extraKey: { title: 'আমার মাটির ব্যাংক', ref: 'sp-jar', rows: ['৪৮টি কয়েন × ৳১০ = <b>৳৪৮০</b> · সপ্তাহে ৩টি করে হলে ৪৮ ÷ ৩ = <b>১৬ সপ্তাহ</b>'] },
  };
}

/* ================= SOCIAL ================= */
function faceSvg() {
  return '<svg viewBox="0 0 40 40" class="face"><circle cx="20" cy="20" r="18" class="ln"/></svg>';
}

function thermoSvg(levels) {
  const n = levels.length;
  const h = 26;
  const rows = levels.map((l, i) => {
    const y = 10 + (n - 1 - i) * h;
    return `<rect x="22" y="${y}" width="22" height="${h}" class="lvl"/><text x="50" y="${y + h / 2 + 3}" class="lb">${bn(i + 1)}. ${esc(l)}</text>`;
  }).join('');
  return `<svg viewBox="0 0 120 ${10 + n * h + 30}" class="fig thermo">${rows}<circle cx="33" cy="${10 + n * h + 13}" r="15" class="ln"/></svg>`;
}

function socialSections(keys, world) {
  const pic = new Map(world.readable.flatMap((c) => c.items.map((it) => [it.name, it.emoji])));
  const feelings = ['খুশি', 'দুঃখ', 'রাগ', 'ভয়', 'লজ্জা', 'গর্ব', 'উত্তেজনা', 'হতাশা'];
  const levels = ['শান্ত', 'একটু বিরক্ত', 'রাগ বাড়ছে', 'অনেক রাগ', 'ফেটে পড়ছি'];
  return {
    sections: [
      {
        id: 'sp-faces', cont: 'মুখ এঁকে আবেগ চেনো',
        parts: [
          secHead('আঁকা পাতা · আবেগ চেনা', 'মুখ এঁকে আবেগ চেনো', 'প্রতিটি গোলের ভেতরে সেই আবেগের মুখ আঁকো: চোখ, ভুরু আর মুখের আকার কেমন হয়? আয়নায় নিজের মুখ বানিয়ে দেখে নিতে পারো। নিচে লেখো কখন তোমার এমন লাগে।', nameBar()),
          group('faces', feelings.map((f) => block(`<div class="facecard">${faceSvg()}<p class="h3">${pic.get(f) ? `<span class="hint">${esc(pic.get(f))}</span> ` : ''}${esc(f)}</p><div class="wline"><span>কখন?</span><i></i></div></div>`))),
          subHead('এই সপ্তাহে আমার মন', 'প্রতিদিন রাতে সেদিনের মনের একটা ছোট মুখ আঁকো, নিচে আবেগের নাম লেখো।'),
          block(`<div class="week">${['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র'].map((d) => `<div class="day"><b>${d}</b>${faceSvg()}<i></i></div>`).join('')}</div>`),
        ],
      },
      {
        id: 'sp-thermo', cont: 'আমার রাগের থার্মোমিটার',
        parts: [
          secHead('আঁকা পাতা · আবেগ সামলানো', 'আমার রাগের থার্মোমিটার', 'নিচ থেকে ওপরে রং করো: ১ সবুজ, ২ হলুদ, ৩ কমলা, ৪ লাল, ৫ গাঢ় লাল। প্রতিটি ধাপে তোমার শরীরে কী হয় আর তখন তুমি কী করবে, পাশে লেখো। ঝুড়ির উপায়গুলো কাজে লাগাও।', nameBar()),
          bank(['গভীর শ্বাস', '১০ পর্যন্ত গোনা', 'বিরতি নেওয়া', 'কাউকে বলা', 'লিখে রাখা', 'হাঁটা', 'শান্ত হওয়ার কোণ'], 'শান্ত হওয়ার উপায়'),
          block(`<div class="figrow"><div class="figbox">${thermoSvg(levels)}</div><div class="throws">${levels.slice().reverse().map((l, i) => `<div class="thr"><b>${bn(levels.length - i)}. ${esc(l)}</b><div class="wline"><span>শরীরে কী হয়</span><i></i></div><div class="wline"><span>আমি করব</span><i></i></div></div>`).join('')}</div></div>`),
          block('<p class="inst">বড়দের জন্য: থার্মোমিটারটা ফ্রিজের দরজায় লাগিয়ে রাখুন। রাগের মুহূর্তে শিশু আঙুল দিয়ে দেখাবে সে কোন ধাপে, তারপর নিজের লেখা উপায়টা পড়বে।</p>'),
        ],
      },
    ],
    toc: [['sp-faces', 'মুখ এঁকে আবেগ চেনো: ৮টি আবেগ'], ['sp-thermo', 'আমার রাগের থার্মোমিটার: রং করো, উপায় লেখো']],
    preview: 'sp-faces',
  };
}

/* ================= DISCOVERY ================= */
/** One line to measure, drawn in millimetres so it is true when printed at 100%. */
function measureRow(cm, i) {
  const w = cm * 10;
  return `<div class="mrow2"><span class="num">${bn(i + 1)}.</span><svg viewBox="0 0 ${w + 1} 6" style="width:${w + 1}mm;height:6mm" class="mm"><line x1=".5" y1="3" x2="${w + 0.5}" y2="3" class="mm-l"/><line x1=".5" y1=".5" x2=".5" y2="5.5" class="mm-c"/><line x1="${w + 0.5}" y1=".5" x2="${w + 0.5}" y2="5.5" class="mm-c"/></svg><span class="mans"><i></i> সেমি</span></div>`;
}

function thermometerSvg(t) {
  const top = 8, bottom = 108, max = 50;
  const y = (v) => bottom - (v / max) * (bottom - top);
  const ticks = Array.from({ length: 11 }, (_, i) => i * 5).map((v) => `<line x1="${v % 10 ? 24 : 21}" y1="${y(v)}" x2="28" y2="${y(v)}" class="tk"/>${v % 10 ? '' : `<text x="19" y="${y(v) + 2.4}" text-anchor="end" class="tl">${bn(v)}</text>`}`).join('');
  return `<svg viewBox="0 0 50 130" class="fig therm"><rect x="28" y="4" width="10" height="108" rx="5" class="ln"/><circle cx="33" cy="117" r="9" class="bulbf"/><rect x="30.5" y="${y(t)}" width="5" height="${bottom - y(t) + 4}" class="merc"/>${ticks}</svg>`;
}

function discoverySections(keys) {
  const steps = ['প্রশ্ন করা', 'অনুমান', 'পরীক্ষা', 'পর্যবেক্ষণ', 'তথ্য লেখা', 'সিদ্ধান্ত', 'পুনরাবৃত্তি'];
  const bankWords = shuffleMoved(steps.slice(1), 'method');
  keys.push({ title: 'বিজ্ঞানীর সাত ধাপ', ref: 'sp-method', rows: [steps.map((s, i) => `${bn(i + 1)}. ${s}`).join(' → ')] });
  const lens = [3, 5.5, 7, 9.5, 12];
  const temps = [15, 25, 35, 40];
  keys.push({
    title: 'মাপো আর পড়ো', ref: 'sp-measure',
    rows: [`<b>দাগ:</b> ${lens.map((l, i) => `${bn(i + 1)}. ${bn(l)} সেমি`).join(' · ')} <span class="why">পাতাটা ১০০% মাপে ছাপলে তবেই মিলবে।</span>`, `<b>থার্মোমিটার:</b> ${temps.map((t, i) => `${OPT[i]}. ${bn(t)}°সে`).join(' · ')}`, `<b>জ্বর:</b> ${OPT[temps.indexOf(40)]} (৪০°সে), কারণ শরীরের স্বাভাবিক তাপমাত্রা প্রায় ৩৭°সে।`],
  });
  const flow = steps.map((s, i) => `<div class="fstep"><span class="fn">${bn(i + 1)}</span>${i === 0 ? `<b>${esc(s)}</b>` : '<i></i>'}</div>${i < steps.length - 1 ? '<span class="farrow">→</span>' : ''}`).join('');
  return {
    sections: [
      {
        id: 'sp-method', cont: 'বিজ্ঞানীর সাত ধাপ',
        parts: [
          secHead('আঁকা পাতা · বিজ্ঞানের পদ্ধতি', 'বিজ্ঞানীর সাত ধাপ', 'প্রথম ধাপ দেওয়া আছে। ঝুড়ির বাকি ছয়টা ধাপ ঠিক ক্রমে খালি ঘরে লেখো।', nameBar()),
          bank(bankWords),
          block(`<div class="flow">${flow}</div>`),
          subHead('আমার পরীক্ষার খাতা', 'ঘরে বসে পরীক্ষা বিভাগ থেকে একটা পরীক্ষা বেছে নাও আর ধাপে ধাপে লেখো।'),
          block(`<div class="lab"><div class="wline"><span>আমার প্রশ্ন</span><i></i></div><div class="wline"><span>আমার অনুমান</span><i></i></div><div class="wline"><span>যা যা লাগবে</span><i></i></div><div class="drawbox short"><span>পরীক্ষার ছবি আঁকো</span></div><div class="wline"><span>যা দেখলাম</span><i></i></div><div class="wline"><span>আমার সিদ্ধান্ত</span><i></i></div></div>`),
        ],
      },
      {
        id: 'sp-measure', cont: 'মাপো আর পড়ো',
        parts: [
          secHead('আঁকা পাতা · পরিমাপের যন্ত্র', 'মাপো আর পড়ো', 'স্কেল দিয়ে প্রতিটি দাগ মাপো, সেন্টিমিটারে লেখো। পাতাটা "আসল মাপে" বা ১০০% মাপে ছাপলে তবেই মাপ মিলবে।', nameBar()),
          block(`<div class="measure">${lens.map(measureRow).join('')}</div>`),
          subHead('থার্মোমিটার পড়ো', 'লাল দাগ কোন সংখ্যা পর্যন্ত উঠেছে? প্রতিটি বড় দাগ ১০, ছোট দাগ ৫ ডিগ্রি সেলসিয়াস।'),
          group('therms', temps.map((t, i) => block(`<div class="thcard">${thermometerSvg(t)}<div class="wline"><span>${OPT[i]}.</span><i></i><span>°সে</span></div></div>`))),
          block('<p class="inst">কোনটা জ্বরের মাপ হতে পারে? মানুষের শরীরের স্বাভাবিক তাপমাত্রা প্রায় ৩৭°সে। <span class="blank"></span></p>'),
        ],
      },
    ],
    toc: [['sp-method', 'বিজ্ঞানীর সাত ধাপ আর আমার পরীক্ষার খাতা'], ['sp-measure', 'মাপো আর পড়ো: স্কেল আর থার্মোমিটার']],
    preview: 'sp-method',
  };
}

const BUILDERS = {
  physics: physicsSections, chemistry: chemistrySections, life: lifeSections, nature: natureSections,
  food: foodSections, money: moneySections, social: socialSections, discovery: discoverySections,
};

/** The drawn pages for a world, or null for the three worlds that have their own. */
export function visualSections(world, keys) {
  const make = BUILDERS[world.slug];
  if (!make) return null;
  const v = make(keys, world);
  if (v.extraKey) keys.push(v.extraKey);
  return v;
}

export const VISUAL_CSS = String.raw`
.fig{display:block;width:100%;height:auto;font-family:PosoraBangla,PosoraEmoji,sans-serif}
.fig .ln{fill:#fff;stroke:#2c3445;stroke-width:1.2}
.fig .ln.thin{stroke-width:.7}
.fig .ar{stroke:#4c5568;stroke-width:1.4;fill:none}
.fig .ar.dash{stroke-dasharray:3 2}
.fig .mk circle{fill:#fff;stroke:var(--c);stroke-width:1.2}
.fig .mk text{font-size:6.4px;font-weight:800;fill:#141b2b}
.fig .sm{font-size:6px;font-weight:700;fill:#2c3445}
.fig .xs{font-size:4.4px;fill:#2c3445}
.fig .lb{font-size:7px;font-weight:700;fill:#2c3445}
.fig .em{font-size:12px}
.fig .wire{fill:none;stroke:#2c3445;stroke-width:1.3}
.fig .plate{stroke:#2c3445;stroke-width:1.3}
.fig .plate.thick{stroke-width:3}
.fig .fil{fill:none;stroke:#2c3445;stroke-width:.7}
.fig .pin{fill:#2c3445}
.fig .plastic{stroke-dasharray:2 1.4}
.fig .ground{stroke:#6b5a43;stroke-width:1.2}
.fig .stem{fill:none;stroke:#2c3445;stroke-width:3}
.fig .stem.thin{stroke-width:1.8}
.fig .leaf,.fig .petal,.fig .fruit,.fig .centre{fill:#fff;stroke:#2c3445;stroke-width:1}
.fig .vein{fill:none;stroke:#2c3445;stroke-width:.6}
.fig .root{fill:none;stroke:#2c3445;stroke-width:1.1}
.fig .chev{fill:none;stroke:#4c5568;stroke-width:1.3}
.fig .sun,.fig .cloud,.fig .hill,.fig .sea,.fig .soil{fill:#fff;stroke:#2c3445;stroke-width:1}
.fig .ray{stroke:#2c3445;stroke-width:1}
.fig .rain{stroke:#2c3445;stroke-width:.9}
.fig .river{fill:none;stroke:#2c3445;stroke-width:2.4}
.fig .seg{fill:#fff;stroke:#2c3445;stroke-width:1}
.fig .hub{fill:#fff;stroke:#2c3445;stroke-width:1}
.fig .wl2{stroke:#8a93a3;stroke-width:.6}
.fig .rim{fill:#fff;stroke:#2c3445;stroke-width:1.4}
.fig .coin{fill:#fff;stroke:#2c3445;stroke-width:.9}
.fig .lvl{fill:#fff;stroke:#2c3445;stroke-width:1}
.fig .tk{stroke:#2c3445;stroke-width:.6}
.fig .bulbf,.fig .merc{fill:#d1453b;stroke:#2c3445;stroke-width:.6}
.mm .mm-l{stroke:#141b2b;stroke-width:.5}
.mm .mm-c{stroke:#141b2b;stroke-width:.3}
.fig .tl{font-size:7px;font-weight:700;fill:#2c3445}
.fig .numdot{fill:var(--c)}
.fig .numt{font-size:6.4px;font-weight:800;fill:#fff}
.fig .chev{stroke-width:1.8}
.figbox.wide .plant{max-height:68mm}
.measure{display:flex;flex-direction:column;gap:4mm}
.mrow2{display:flex;align-items:center;gap:3mm}
.mrow2 .mans{margin-left:auto;display:flex;gap:2mm;align-items:flex-end;white-space:nowrap}
.mrow2 .mans i{display:inline-block;width:22mm;border-bottom:1pt solid #4c5568;height:6mm}
.g.figs{display:flex;flex-direction:column;gap:3mm}
.figrow{display:grid;grid-template-columns:1.25fr 1fr;gap:5mm;align-items:center}
.figbox{border:1pt solid #d7dbe3;border-radius:3mm;padding:2.4mm 3mm}
.figbox.wide{padding:2mm}
.figbox.full{padding:3mm 6mm}
.figbox.full .fig{max-height:110mm}
.figbox .h3{margin-bottom:1mm}
.figans{display:flex;flex-direction:column;gap:2.4mm}
.figans.narrow{max-width:44mm}
.wl,.wgrid{display:flex;flex-direction:column;gap:3mm}
.wgrid{display:grid;grid-template-columns:1fr 1fr;gap:3mm 8mm}
.wline{display:flex;gap:2mm;align-items:flex-end;font-size:11pt;color:#3a4356}
.wline i{flex:1;border-bottom:1pt solid #4c5568;height:7mm;min-width:12mm}
.wline span{white-space:nowrap}
.g.circs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3mm}
.circ-card{border:1pt solid #d7dbe3;border-radius:3mm;padding:2mm 2.6mm;display:flex;flex-direction:column;gap:1.4mm}
.tps{display:flex;gap:4mm;flex-wrap:wrap;margin-top:1mm}
.tp{display:inline-flex;gap:1.6mm;align-items:center;font-size:10.5pt}
.phstrip{display:grid;grid-template-columns:repeat(15,1fr);border:1.2pt solid #2c3445;border-radius:2mm;overflow:hidden}
.phc{height:18mm;border-left:.8pt solid #2c3445;display:flex;align-items:flex-end;justify-content:center;padding-bottom:1mm;font-weight:800}
.phc:first-child{border-left:0}
.phlab{display:flex;justify-content:space-between;font-size:10pt;color:#3a4356;margin-top:1mm}
.sem{font-size:15pt;margin-right:2mm;font-weight:400}
.cycwrap{display:flex;justify-content:center}
.cycwrap .fig{width:130mm}
.g.cyccards{display:grid;grid-template-columns:repeat(3,1fr);gap:2.4mm}
.cyccard{display:flex;gap:2.4mm;align-items:center;border:1pt solid #d7dbe3;border-radius:2.4mm;padding:1.6mm 2.4mm;font-weight:700}
.cyccard .o{width:6mm;height:6mm;border-radius:50%;background:var(--c);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:9.5pt;flex:none}
.cyccard .cem{font-size:20pt;line-height:1}
.wheelwrap{display:flex;justify-content:center}
.wheelwrap .fig{width:112mm}
.drawbox{border:1.2pt dashed #9aa3b3;border-radius:3mm;min-height:52mm;padding:2.4mm 3mm;font-size:10.5pt;color:#5b6475}
.drawbox.short{min-height:34mm}
.budget{display:grid;grid-template-columns:1fr 1fr;gap:3mm 8mm}
.budget div{display:flex;gap:2mm;align-items:flex-end;font-weight:700}
.budget i{flex:1;border:1.2pt solid #4c5568;border-radius:1.6mm;height:10mm}
.budget .tot{color:var(--c)}
.goal{display:grid;grid-template-columns:1fr 1fr;gap:3mm 8mm}
.figbox.full .jar{max-height:105mm}
.g.faces{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm}
.facecard{border:1pt solid #d7dbe3;border-radius:3mm;padding:2.4mm;display:flex;flex-direction:column;align-items:center;gap:1.4mm;text-align:center}
.facecard .face{width:34mm;height:34mm}
.facecard .face .ln{fill:#fff;stroke:#2c3445;stroke-width:1}
.facecard .hint{font-size:10pt}
.facecard .wline{width:100%}
.thermo{max-height:120mm}
.week{display:grid;grid-template-columns:repeat(7,1fr);gap:2mm}
.day{display:flex;flex-direction:column;align-items:center;gap:1.4mm;border:1pt solid #d7dbe3;border-radius:2.4mm;padding:1.6mm}
.day .face{width:18mm;height:18mm}
.day .face .ln{fill:#fff;stroke:#2c3445;stroke-width:1}
.day i{display:block;width:100%;border-bottom:1pt solid #4c5568;height:6mm}
.throws{display:flex;flex-direction:column;gap:2.6mm}
.thr{display:flex;flex-direction:column;gap:1mm}
.flow{display:flex;flex-wrap:wrap;gap:3mm 2mm;align-items:center}
.fstep{display:flex;flex-direction:column;gap:1mm;align-items:center;border:1.2pt solid var(--c);border-radius:3mm;padding:2mm;width:38mm;min-height:20mm}
.fstep i{display:block;width:100%;border-bottom:1pt solid #4c5568;height:8mm}
.fstep .fn{width:6mm;height:6mm;border-radius:50%;background:var(--c);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:9.5pt;font-weight:800}
.farrow{font-size:16pt;color:#4c5568}
.lab{display:flex;flex-direction:column;gap:2.6mm;border:1pt solid #d7dbe3;border-radius:3mm;padding:3mm 4mm}
.g.therms{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm}
.thcard{display:flex;flex-direction:column;align-items:center;gap:1.4mm;border:1pt solid #d7dbe3;border-radius:3mm;padding:2mm}
.thcard .therm{width:22mm}
.thcard .wline{width:100%}
`;
