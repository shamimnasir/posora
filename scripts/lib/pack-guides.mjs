/**
 * The bundle-wide files: the parent guide, the 30-day plan (built from the
 * real page numbers the world packs came out with), the certificates and the
 * wall charts. Guidance copy is written here; every fact on a chart still
 * comes from the snapshot.
 */
import { esc, bn, block, keep, group } from './pack-kit.mjs';
import { secHead } from './pack-world.mjs';

const BRAND = '#3f8f6b';
const p = (t) => `<p>${t}</p>`;
const box = (title, body) => block(`<div class="gbox"><p class="h3">${esc(title)}</p>${body}</div>`);
const steps = (items) => group('steps', items.map(([t, d], i) => block(`<div class="step"><span class="stepn">${bn(i + 1)}</span><div><p class="h3">${esc(t)}</p><p>${esc(d)}</p></div></div>`)));

const GUIDE_CSS = String.raw`
.gbox{border:1pt solid #d7dbe3;border-radius:3mm;padding:3.4mm 4.4mm;display:flex;flex-direction:column;gap:1.4mm}
.gbox ul{margin:0;padding-left:5mm}
.gbox li{margin:.6mm 0}
.g.steps{display:flex;flex-direction:column;gap:3mm}
.step{display:grid;grid-template-columns:11mm 1fr;gap:3mm;align-items:start;border-left:1.2pt solid color-mix(in srgb,var(--c) 40%,#fff);padding-left:3mm}
.stepn{width:10mm;height:10mm;border-radius:50%;background:var(--c);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:13pt}
.g.files{display:flex;flex-direction:column;border:.8pt solid #d7dbe3;border-radius:2mm;overflow:hidden}
.frow{display:grid;grid-template-columns:1fr 46mm 24mm;border-top:.8pt solid #e1e4ea}
.frow>*{padding:1.6mm 2.6mm}
.frow.th{background:color-mix(in srgb,var(--c) 10%,#fff);font-weight:800;border-top:0}
.frow .n{text-align:center;font-weight:700}
.swatch{display:inline-block;width:3mm;height:3mm;border-radius:50%;margin-right:2mm;vertical-align:middle}
.g.plan{display:flex;flex-direction:column;border:.8pt solid #d7dbe3;border-radius:2mm;overflow:hidden}
.prow{display:grid;grid-template-columns:13mm 47mm 1fr 21mm 10mm;border-top:.8pt solid #e1e4ea;align-items:center}
.prow>*{padding:1.5mm 2.2mm}
.prow.th{background:color-mix(in srgb,var(--c) 10%,#fff);font-weight:800;border-top:0;font-size:10.5pt}
.prow.wk{background:#f5f6f8;font-weight:800;grid-template-columns:1fr}
.prow .d{font-weight:800;color:var(--c);text-align:center}
.prow .pg{text-align:center;font-weight:700}
.prow .tk{display:flex;justify-content:center}
.g.chart{display:grid;grid-template-columns:repeat(5,1fr);gap:3mm}
.day{border:1pt solid #c9ced8;border-radius:3mm;height:30mm;padding:2mm;display:flex;flex-direction:column;justify-content:space-between}
.day b{font-size:13pt;color:var(--c)}
.day .star{align-self:flex-end;width:9mm;height:9mm}
.day small{font-size:9pt;color:#5b6475;line-height:1.3}
.lines{display:flex;flex-direction:column;gap:7mm;margin-top:3mm}
.lines i{display:block;border-bottom:1pt solid #9aa3b3;height:1mm}
/* certificates */
.cert{position:relative;height:100%;padding:18mm 24mm 14mm;display:flex;flex-direction:column;align-items:center;text-align:center}
.cert::before{content:'';position:absolute;inset:8mm;border:2.4pt solid var(--cc);border-radius:5mm}
.cert::after{content:'';position:absolute;inset:11mm;border:.8pt solid var(--cc);border-radius:3.5mm;opacity:.6}
.cert .brand{font-size:16pt;font-weight:800;color:var(--cc)}
.cert .title{font-size:40pt;font-weight:800;margin-top:3mm;color:#141b2b;line-height:1.2}
.cert .world{font-size:15pt;font-weight:700;color:var(--cc);margin-top:1mm}
.cert .give{font-size:14pt;margin-top:12mm;color:#3a4356}
.cert .name{width:170mm;border-bottom:1.4pt solid #4c5568;height:22mm;margin-top:2mm}
.cert .what{font-size:13pt;margin-top:12mm;max-width:215mm;color:#2c3445;line-height:1.6}
.cert .cats{margin-top:5mm;max-width:235mm;line-height:1.3}
.cert .cats .pill{font-size:11pt}
.cert .sig{margin-top:auto;display:grid;grid-template-columns:1fr 1fr;gap:30mm;width:200mm;font-size:11pt;color:#3a4356}
.cert .sig div{border-top:1pt solid #4c5568;padding-top:1.4mm}
.cert .seal{position:absolute;right:22mm;top:20mm;width:30mm;height:30mm}
/* wall charts */
.g.wl{display:grid;grid-template-columns:repeat(6,1fr);gap:2.4mm}
.wl-t{border:1pt solid #d7dbe3;border-radius:2.4mm;padding:1.6mm 1mm;display:flex;flex-direction:column;align-items:center;line-height:1.25}
.wl-t .ch{font-size:30pt;font-weight:700;color:#141b2b;line-height:1.3}
.wl-t .w{font-size:11pt}
.wl-t .nm{font-size:9pt;color:#5b6475}
.wl-t.v .ch{color:var(--c)}
.g.wc{display:grid;grid-template-columns:repeat(5,1fr);gap:2.4mm}
.hundred{display:grid;grid-template-columns:repeat(10,1fr);border:1.2pt solid #4c5568}
.hundred span{border:.6pt solid #c9ced8;height:19mm;display:flex;align-items:center;justify-content:center;font-size:17pt;font-weight:700}
.hundred span.ten{background:color-mix(in srgb,var(--c) 12%,#fff);color:#141b2b}
table.sol td,table.sol th{font-size:10.5pt;padding:1.6mm 1.8mm}
`;

/* ---------------- start here ---------------- */
export function buildStartHere(data, packInfo) {
  const packRows = data.packs.map((pk) => block(`<div class="frow"><span><span class="swatch" style="background:${pk.color}"></span><b>${esc(pk.title)}</b></span><span>${esc(pk.world)}</span><span class="n">${bn(packInfo[pk.slug]?.pages ?? 0)}</span></div>`));
  const totalPages = data.packs.reduce((n, pk) => n + (packInfo[pk.slug]?.pages ?? 0), 0);
  const sections = [
    {
      id: 'welcome', cont: 'শুরু করার গাইড',
      parts: [
        secHead('অভিভাবক ও শিক্ষকের জন্য', 'শুরু করার গাইড', `এই বান্ডলে ১১টি ভুবনের ১১টি প্যাক, মোট ${bn(totalPages)} পাতা। প্রতিটি পাতা পসরার সাইটের আসল, যাচাই করা পড়া থেকে তৈরি: তথ্য-কার্ড, অনুশীলনী, যাচাই, কাগজের মিশন আর শেষে উত্তরপত্র।`),
        box('কোথা থেকে শুরু করবেন', `<ul><li>প্রথমে <b>৩০ দিনের পরিকল্পনা</b> খুলুন। প্রতিদিন কোন প্যাকের কোন পৃষ্ঠা, তা লেখা আছে।</li><li>শুধু সেই দিনের ৩-৫টি পাতা ছাপুন। পুরো প্যাক একবারে ছাপার দরকার নেই।</li><li>ছোটদের (৫-৭ বছর) জন্য ভাষা আর গণিত প্যাকের ★ চিহ্নের পাতা দিয়ে শুরু করুন: বর্ণ ট্রেসিং, সংখ্যা, ঘড়ি, দোকান খেলা।</li><li>বড়দের (৮-১৩ বছর) জন্য যেকোনো ভুবনের বিভাগ ১ থেকে শুরু করুন।</li></ul>`),
        subhead('বান্ডলের ফাইল'),
        group('files', packRows, `<div class="frow th"><span>প্যাক</span><span>ভুবন</span><span class="n">পাতা</span></div>`),
        box('আরও যা আছে', `<ul><li><b>৩০ দিনের পরিকল্পনা:</b> প্রতিদিনের কাজ আর টিক দেওয়ার চার্ট।</li><li><b>দেয়াল-চার্ট:</b> বর্ণমালা, কার-ফলা, যুক্তবর্ণ, ১ থেকে ১০০, সৌরজগৎ আর টাকার চার্ট।</li><li><b>সনদপত্র:</b> প্রতিটি ভুবনের একটি করে, আর সব ভুবন শেষ করার একটি বড় সনদ।</li></ul>`),
      ],
    },
    {
      id: 'inside', cont: 'প্যাকের ভেতরে',
      parts: [
        secHead('প্রতিটি প্যাকের গঠন', 'প্যাকের ভেতরে কী আছে', 'সব প্যাক একই ছাঁচে সাজানো, তাই একটা চিনলে বাকিগুলো সহজ।'),
        steps([
          ['প্রচ্ছদ ও সূচিপত্র', 'প্রথম দুই পাতা। সূচিপত্রে প্রতিটি বিভাগের পড়ো, অনুশীলনী আর যাচাইয়ের পৃষ্ঠা নম্বর আলাদা করে দেওয়া।'],
          ['★ বিশেষ পাতা', 'ভাষায় বর্ণ, কার, ফলা আর যুক্তবর্ণ; গণিতে সংখ্যা, ঘড়ি আর দোকান খেলা; মহাকাশে গ্রহের আসল মাপ দিয়ে কাজ।'],
          ['পড়ো', 'প্রতিটি জিনিসের একটি কার্ড: নাম, মূল কথা আর একটি মজার তথ্য। দাগ ধরে কেটে নিলে খেলার কার্ড হয়।'],
          ['অনুশীলনী', 'শব্দের ঝুড়ি থেকে শূন্যস্থান পূরণ, আর দাগ টেনে মেলানো। ওপরে নাম আর তারিখ লেখার জায়গা।'],
          ['যাচাই', 'বহুনির্বাচনী প্রশ্ন, চারটি করে উত্তর। নিচে নম্বর লেখার ঘর।'],
          ['কাগজের মিশন', 'সাইটের মিশনগুলো কাগজে: ক্রমে সাজাও, হিসাব করো, দলে ভাগ করো, ঠিক সিদ্ধান্ত বাছো।'],
          ['উত্তরপত্র', 'প্যাকের একদম শেষে, সব কাজের উত্তর এক জায়গায়, পাশে কাজের পৃষ্ঠা নম্বর। কাজের পাতার পেছনে উত্তর নেই, তাই দুই পিঠে ছাপলেও সমস্যা নেই।'],
        ]),
        box('ছাপার পরামর্শ', `<ul><li>A4 কাগজে, "Actual size" বা "100%" দিয়ে ছাপুন।</li><li>সাদা-কালোতেও সব পাতা পরিষ্কার পড়া যায়। রঙ শুধু সাজের জন্য।</li><li>ট্রেসিংয়ের ধূসর অক্ষর খুব হালকা এলে প্রিন্টারের "Draft" মোড বন্ধ রাখুন।</li><li>কার্ড শক্ত করতে চাইলে মোটা কাগজে ছাপুন বা পুরোনো ক্যালেন্ডারের পেছনে আঠা দিয়ে লাগান।</li></ul>`),
      ],
    },
    {
      id: 'loop', cont: '১৫ মিনিটের লুপ',
      parts: [
        secHead('প্রতিদিন', '১৫ মিনিটের শেখার লুপ', 'ছোট আর নিয়মিত সময় লম্বা এক দিনের চেয়ে বেশি কাজে দেয়। প্রতিদিন একই সময়ে, একই জায়গায় বসলে অভ্যাস তৈরি হয়।'),
        steps([
          ['২ মিনিট · কী শিখব', 'আজকের পাতাটা একসঙ্গে দেখুন। শিশুকে নিজের ভাষায় বলতে দিন আজ কী নিয়ে কাজ।'],
          ['৫ মিনিট · পড়ো', 'কার্ডগুলো জোরে পড়া। ছোটরা শুনবে আর ছবি আঁকবে, বড়রা নিজে পড়বে। প্রতিটি কার্ডের মজার তথ্যটা নিয়ে একটা প্রশ্ন করুন।'],
          ['৫ মিনিট · লেখো', 'অনুশীলনী বা ট্রেসিং। ভুল হলে উত্তর বলে না দিয়ে কার্ডটা আবার দেখতে বলুন।'],
          ['৩ মিনিট · যাচাই ও উদযাপন', 'কয়েকটা যাচাই প্রশ্ন, তারপর উত্তরপত্রে মিলিয়ে দেখা। পরিকল্পনার চার্টে টিক বা তারা দিন।'],
        ]),
        box('যে কথাগুলো কাজে দেয়', `<ul><li>"তুমি কীভাবে বুঝলে?" উত্তরের চেয়ে ভাবনার পথটা বেশি জরুরি।</li><li>"চলো কার্ডে দেখি।" ভুলকে খোঁজার খেলায় বদলে দিন।</li><li>"কাল কোনটা আবার করবে?" শিশুকে নিজের পছন্দ বেছে নিতে দিন।</li><li>ক্লান্ত বা বিরক্ত হলে থামুন। পরের দিন আবার।</li></ul>`),
        box('বয়স অনুযায়ী', `<ul><li><b>৫-৭ বছর:</b> বড়রা পড়ে শোনান, শিশু কার্ড কাটে, মেলায়, ট্রেস করে। যাচাই মুখে মুখে।</li><li><b>৮-১০ বছর:</b> নিজে পড়ে অনুশীলনী করে, বড়রা উত্তর মেলান।</li><li><b>১১-১৩ বছর:</b> পুরো বিভাগ একা করে, তারপর ছোট ভাই-বোনকে একটা কার্ড বুঝিয়ে বলে।</li></ul>`),
      ],
    },
    {
      id: 'safety', cont: 'নিরাপত্তা ও ডাউনলোড',
      parts: [
        secHead('আগে পড়ে নিন', 'নিরাপত্তা', 'বেশিরভাগ কাজ শুধু কাগজ আর পেন্সিলের। কয়েকটা জায়গায় বড়দের চোখ রাখা দরকার।'),
        box('কাটা ও আঠা', `<ul><li>ছোটদের হাতে গোল মাথার শিশু-কাঁচি দিন, আর কাটার সময় পাশে থাকুন।</li><li>কাটা কার্ড আর কাগজের নোট-কয়েন তিন বছরের কম বয়সী ভাই-বোনের নাগালের বাইরে রাখুন।</li></ul>`),
        box('রসায়ন, খাদ্য আর পদার্থবিজ্ঞানের পাতা', `<ul><li>এই প্যাকগুলোর পাতা পড়া, লেখা আর ভাবার জন্য। পড়া থেকে কোনো পরীক্ষা ঘরে করতে চাইলে বড় কাউকে সঙ্গে নিয়ে করুন।</li><li>আগুন, চুলা, গরম পানি, ধারালো জিনিস, রাসায়নিক, ওষুধ বা বিদ্যুতের লাইন শিশু একা ছোঁবে না।</li><li>অচেনা কিছু চেখে বা শুঁকে দেখা নয়।</li></ul>`),
        box('সামাজিক দক্ষতা আর নিরাপত্তার পাতা', `<ul><li>আবেগ, সীমারেখা আর অনলাইন নিরাপত্তার পাতাগুলো শান্ত সময়ে একসঙ্গে করুন।</li><li>শিশু যদি কোনো খারাপ অভিজ্ঞতার কথা বলে, মন দিয়ে শুনুন, দোষ দেবেন না, আর দরকারে বিশ্বস্ত বড় বা বিশেষজ্ঞের সাহায্য নিন।</li></ul>`),
        secHead('ফাইল হারালে', 'আবার ডাউনলোড', ''),
        box('যেভাবে আবার পাবেন', `<ul><li>যে অ্যাকাউন্ট দিয়ে কিনেছেন, সেটিতে লগইন করে <b>posora.com/account</b> পাতায় যান।</li><li>সেখানে সব প্যাক একসঙ্গে ZIP হিসেবে, আর প্রতিটি প্যাক আলাদা করে নামানো যায়।</li><li>নতুন সংস্করণ এলে একই জায়গা থেকে নামাতে পারবেন।</li><li>এই ফাইলগুলো আপনার পরিবার বা নিজের ক্লাসের ব্যবহারের জন্য। অনুগ্রহ করে অনলাইনে ছড়াবেন না।</li></ul>`),
      ],
    },
  ];
  return { title: 'শুরু করার গাইড', world: 'শুরু করার গাইড', color: BRAND, css: GUIDE_CSS, sections };
}
const subhead = (t) => keep(`<p class="h2">${esc(t)}</p>`);

/* ---------------- 30-day plan ---------------- */
function unitsFor(info) {
  const { doc, toc, pages } = info;
  const ids = doc.sections.map((s) => s.id);
  const range = (first, last) => {
    const a = toc[first];
    const li = ids.indexOf(last);
    const next = doc.sections.slice(li + 1).find((x) => toc[x.id]);
    if (!next) return [a, pages];
    const nt = toc[next.id];
    return [a, Math.max(a, next.flow ? nt : nt - 1)];
  };
  const units = [];
  const has = (id) => ids.includes(id);
  const add = (label, first, last = first) => { if (has(first) && has(last)) units.push({ label, range: range(first, last) }); };
  add('স্বরবর্ণ ট্রেসিং', 'sp-vowels');
  add('ব্যঞ্জনবর্ণ ট্রেসিং', 'sp-consonants');
  add('কার, ফলা আর যুক্তবর্ণ', 'sp-kar', 'sp-conj-ex');
  add('সংখ্যা ০-১০০ আর অঙ্ক ট্রেসিং', 'sp-numbers', 'sp-numwords');
  add('ঘড়ি পড়া আর দোকান খেলা', 'sp-clock', 'sp-shop');
  add('সৌরজগতের কার্ড পড়ো', 'sp-bodies');
  add('আসল সংখ্যা দিয়ে সাজাও আর যাচাই', 'sp-order', 'sp-quiz');
  for (const cat of info.world.readable) {
    const qz = has(`qz-${cat.index}`) ? `qz-${cat.index}` : `rd-${cat.index}`;
    add(`${cat.name}: পড়ো, অনুশীলনী, যাচাই`, `rd-${cat.index}`, qz);
  }
  const ms = doc.sections.filter((s) => s.id.startsWith('ms-'));
  if (ms.length) units.push({ label: 'কাগজের মিশন (যেকোনো দুটি)', range: range(ms[0].id, ms[ms.length - 1].id), mission: true });
  return units;
}

export function buildPlan(data, packInfo) {
  // Rotation: the two foundation worlds come round most often.
  const rot = ['bangla-starter', 'math-play', 'space-explorer', 'life-science', 'bangla-starter', 'math-play', 'nature-guardian', 'food-health', 'physics-makers', 'chemistry-lab', 'money-life-skills', 'social-emotional', 'discovery-projects'];
  const cursor = Object.fromEntries(data.packs.map((pk) => [pk.slug, 0]));
  const units = Object.fromEntries(data.packs.map((pk) => [pk.slug, unitsFor(packInfo[pk.slug]).filter((u) => !u.mission)]));
  const missionUnit = Object.fromEntries(data.packs.map((pk) => [pk.slug, unitsFor(packInfo[pk.slug]).find((u) => u.mission)]));
  const days = [];
  let r = 0;
  const weekPacks = [];
  for (let d = 1; d <= 30; d++) {
    if (d % 7 === 0) {
      // Mission day: replay one of the worlds from this week on paper.
      const slug = weekPacks[weekPacks.length - 1] ?? 'math-play';
      const pk = data.packs.find((x) => x.slug === slug);
      days.push({ d, pk, label: 'মিশন দিন: ' + missionUnit[slug].label, range: missionUnit[slug].range, mission: true });
      weekPacks.length = 0;
      continue;
    }
    if (d === 30) {
      days.push({ d, pk: null, label: 'শেষ দিন: পছন্দের একটা পাতা আবার করো, পরিবারকে একটা কার্ড বুঝিয়ে বলো, তারপর সনদপত্র!', range: null });
      continue;
    }
    let slug, u;
    for (let k = 0; k < rot.length; k++) {
      slug = rot[(r + k) % rot.length];
      u = units[slug][cursor[slug]];
      if (u) { r = (r + k + 1) % rot.length; break; }
    }
    cursor[slug]++;
    weekPacks.push(slug);
    days.push({ d, pk: data.packs.find((x) => x.slug === slug), label: u.label, range: u.range });
  }
  const rows = [];
  days.forEach((day) => {
    if ((day.d - 1) % 7 === 0) rows.push(block(`<div class="prow wk"><span>সপ্তাহ ${bn(Math.floor((day.d - 1) / 7) + 1)}</span></div>`));
    const pg = day.range ? (day.range[1] > day.range[0] ? `${bn(day.range[0])}-${bn(day.range[1])}` : bn(day.range[0])) : '';
    rows.push(block(`<div class="prow"><span class="d">${bn(day.d)}</span><span>${day.pk ? `<span class="swatch" style="background:${day.pk.color}"></span>${esc(day.pk.title)}` : '<b>সব প্যাক</b>'}</span><span>${esc(day.label)}</span><span class="pg">${pg}</span><span class="tk"><i class="tick"></i></span></div>`));
  });
  const chart = Array.from({ length: 30 }, (_, i) => block(`<div class="day"><b>দিন ${bn(i + 1)}</b><small>${esc(days[i].pk?.world ?? 'শেষ দিন')}</small><svg class="star" viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="none" stroke="#9aa3b3" stroke-width="1.2" stroke-linejoin="round"/></svg></div>`));
  const sections = [
    {
      id: 'plan', cont: '৩০ দিনের পরিকল্পনা',
      parts: [
        secHead('প্রতিদিন ১৫ মিনিট', '৩০ দিনের পরিকল্পনা', 'প্রতিটি সারিতে কোন প্যাকের কোন পৃষ্ঠাগুলো ছাপবেন আর করবেন, তা লেখা। প্রতি সপ্তম দিন মিশন দিন: সেই সপ্তাহের একটা ভুবনের কাগজের মিশন। নিজের গতিতে চলুন; একদিন বাদ গেলে পরের দিন সেখান থেকেই শুরু।'),
        group('plan', rows, `<div class="prow th"><span>দিন</span><span>প্যাক</span><span>আজকের কাজ</span><span class="pg">পৃষ্ঠা</span><span>✓</span></div>`),
      ],
    },
    {
      id: 'chart', cont: 'অগ্রগতির চার্ট',
      parts: [
        secHead('দেয়ালে লাগাও', 'আমার ৩০ দিনের চার্ট', 'প্রতিদিনের কাজ শেষ হলে সেই দিনের তারাটা রঙ করো। সাত দিন টানা হলে নিজেকে একটা ছোট পুরস্কার দাও!'),
        keep('<div class="namebar"><span>নাম <i></i></span><span style="flex:.6">শুরুর তারিখ <i></i></span></div>'),
        group('chart', chart),
      ],
    },
    {
      id: 'notes', cont: 'আমি যা শিখলাম',
      parts: [
        secHead('প্রতি সপ্তাহের শেষে', 'আমি যা শিখলাম', 'সপ্তাহ শেষে তিনটি প্রশ্নের উত্তর লেখো বা আঁকো। ছোটরা বলবে, বড়রা লিখে দেবেন।'),
        ...[1, 2, 3, 4].map((w) => block(`<div class="gbox"><p class="h3">সপ্তাহ ${bn(w)}</p><p>সবচেয়ে মজার তথ্য কোনটা ছিল?</p><div class="lines"><i></i></div><p>কোনটা কঠিন লেগেছিল, আর কীভাবে পারলে?</p><div class="lines"><i></i></div><p>পরের সপ্তাহে কোন ভুবনে যেতে চাও?</p><div class="lines"><i></i></div></div>`)),
      ],
    },
  ];
  return { title: '৩০ দিনের পরিকল্পনা', world: '৩০ দিনের পরিকল্পনা', color: BRAND, css: GUIDE_CSS + '.tick{display:inline-block;width:6mm;height:6mm;border:1pt solid #4c5568;border-radius:1.2mm}', sections };
}

/* ---------------- certificates ---------------- */
const seal = (c) => `<svg class="seal" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="none" stroke="${c}" stroke-width="3"/><circle cx="50" cy="50" r="36" fill="none" stroke="${c}" stroke-width="1.2" stroke-dasharray="3 3"/><path d="M50 26l6.8 14 15.4 2.2-11.1 10.9 2.6 15.3L50 61.2l-13.7 7.2 2.6-15.3-11.1-10.9 15.4-2.2z" fill="${c}" opacity=".85"/></svg>`;

export function buildCertificates(data, packInfo) {
  const sections = data.packs.map((pk) => {
    const w = packInfo[pk.slug].world;
    const cats = w.readable.map((c) => c.name);
    return {
      id: `cert-${pk.slug}`,
      cover: `<div class="cert" style="--cc:${pk.color}">${seal(pk.color)}<span class="brand">পসরা</span><span class="title">সনদপত্র</span><span class="world">${esc(w.bn)} ভুবন · ${esc(pk.title)}</span><span class="give">এই সনদ গর্বের সঙ্গে দেওয়া হলো</span><div class="name"></div><p class="what">যে ${esc(w.bn)} ভুবনের ${bn(cats.length)}টি বিভাগের কার্ড পড়েছে, অনুশীলনী আর যাচাই শেষ করেছে:</p><div class="cats">${cats.map((c) => `<span class="pill">${esc(c)}</span>`).join('')}</div><div class="sig"><div>তারিখ</div><div>অভিভাবক বা শিক্ষকের স্বাক্ষর</div></div></div>`,
    };
  });
  sections.push({
    id: 'cert-all',
    cover: `<div class="cert" style="--cc:${BRAND}">${seal(BRAND)}<span class="brand">পসরা</span><span class="title">মহা-সনদপত্র</span><span class="world">এগারো ভুবনের অভিযাত্রী</span><span class="give">এই সনদ গর্বের সঙ্গে দেওয়া হলো</span><div class="name"></div><p class="what">যে পসরার এগারোটি ভুবন ঘুরে প্রতিটির পড়া, অনুশীলনী আর যাচাই শেষ করেছে:</p><div class="cats">${data.packs.map((pk) => `<span class="pill" style="border-color:${pk.color}">${esc(pk.world)}</span>`).join('')}</div><div class="sig"><div>তারিখ</div><div>অভিভাবক বা শিক্ষকের স্বাক্ষর</div></div></div>`,
  });
  return { title: 'সনদপত্র', world: 'সনদপত্র', color: BRAND, landscape: true, css: GUIDE_CSS, sections };
}

/* ---------------- wall charts ---------------- */
export function buildWallCharts(data) {
  const { vowels, consonants, kars, folas, conjuncts } = data.language;
  const tile = (l, v) => block(`<div class="wl-t${v ? ' v' : ''}"><span class="ch">${esc(l.ch)}</span><span class="w">${esc(l.emoji)} ${esc(l.word)}</span></div>`);
  const kt = (k) => block(`<div class="wl-t"><span class="ch">ক${esc(k.sign)}</span><span class="nm">${esc(k.name)}</span><span class="w">${esc(k.emoji)} ${esc(k.word)}</span></div>`);
  const ft = (f) => block(`<div class="wl-t"><span class="ch">${esc(f.base)}${esc(f.sign)}</span><span class="nm">${esc(f.name)}</span><span class="w">${esc(f.emoji)} ${esc(f.word)}</span></div>`);
  const ct = (c) => block(`<div class="wl-t"><span class="ch">${esc(c.ch)}</span><span class="nm">${esc(c.parts[0])} + ${esc(c.parts[1])}</span><span class="w">${esc(c.emoji)} ${esc(c.word)}</span></div>`);
  const hundred = Array.from({ length: 100 }, (_, i) => `<span class="${(i + 1) % 10 === 0 ? 'ten' : ''}">${bn(i + 1)}</span>`).join('');
  const keysWanted = ['মাধ্যাকর্ষণ', 'তাপমাত্রা', 'চাঁদ', 'এক দিন', 'এক বছর', 'সূর্য থেকে দূরত্ব'];
  const solRows = data.bodies.map((b) => `<tr><td><b>${esc(b.bn)}</b></td>${keysWanted.map((k) => `<td>${esc(b.stats.find((s) => s.k === k)?.v ?? '-')}</td>`).join('')}</tr>`).join('');
  const money = data.math.denominations.map((d) => `<div class="wl-t"><span class="ch" style="font-size:24pt">৳${bn(d.v)}</span><span class="nm">${d.kind === 'note' ? 'নোট' : 'কয়েন'}</span></div>`).join('');
  const sections = [
    { id: 'wc-vowels', cont: 'বর্ণমালা', parts: [secHead('দেয়াল-চার্ট · ১', 'বাংলা বর্ণমালা', `${bn(vowels.length)}টি স্বরবর্ণ (রঙিন) আর ${bn(consonants.length)}টি ব্যঞ্জনবর্ণ, প্রতিটির সঙ্গে একটি শব্দ।`), group('wl', [...vowels.map((l) => tile(l, true)), ...consonants.map((l) => tile(l, false))])] },
    { id: 'wc-kar', cont: 'কার ও ফলা', parts: [secHead('দেয়াল-চার্ট · ২', 'কার আর ফলা', 'প্রতিটি কার ক-এর সঙ্গে, প্রতিটি ফলা তার উদাহরণ বর্ণের সঙ্গে বসানো।'), group('wc', kars.map(kt)), keep('<p class="h2">ফলা</p>'), group('wc', folas.map(ft))] },
    { id: 'wc-conj', cont: 'যুক্তবর্ণ', parts: [secHead('দেয়াল-চার্ট · ৩', `${bn(conjuncts.length)}টি যুক্তবর্ণ`, 'কোন দুটি বর্ণ মিলে কোন যুক্তবর্ণ, আর তার একটা শব্দ।'), group('wc', conjuncts.map(ct))] },
    { id: 'wc-100', cont: '১ থেকে ১০০', parts: [secHead('দেয়াল-চার্ট · ৪', '১ থেকে ১০০', 'রঙিন ঘরগুলো দশের ঘর। দশ দশ করে গোনো, তারপর যেকোনো সারির সংখ্যাগুলোয় কী মিল, খুঁজে বের করো।'), block(`<div class="hundred">${hundred}</div>`)] },
    { id: 'wc-sol', cont: 'সৌরজগৎ', parts: [secHead('দেয়াল-চার্ট · ৫', 'সৌরজগৎ এক নজরে', 'মাধ্যাকর্ষণ পৃথিবীর তুলনায় (পৃথিবী = ১ g)। দূরত্ব AU-তে: ১ AU মানে সূর্য থেকে পৃথিবীর দূরত্ব।'), block(`<table class="sol"><thead><tr><th></th>${keysWanted.map((k) => `<th>${esc(k)}</th>`).join('')}</tr></thead><tbody>${solRows}</tbody></table>`), secHead('দেয়াল-চার্ট · ৬', 'বাংলাদেশের টাকা', 'যে নোট আর কয়েনগুলো চলে।'), block(`<div class="g wc">${money}</div>`)] },
  ];
  return { title: 'দেয়াল-চার্ট', world: 'দেয়াল-চার্ট', color: '#e0962d', css: GUIDE_CSS + '.wc{display:grid;grid-template-columns:repeat(5,1fr);gap:2.4mm}', sections };
}
