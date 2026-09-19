import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { digitalPacks, bundle } from '../src/data/digital-packs.ts';

const run = promisify(execFile);
const root = process.cwd();
const outDir = path.join(root, 'private-downloads', 'digital-packs');
const htmlDir = path.join(outDir, '_html');
const fontUrl = `file://${path.join(root, 'public/fonts/noto-sans-bengali-400-800.95b2d88278.woff2')}`;
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const esc = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

const bn = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);

const palette = ['#ffcc4d', '#67d4c5', '#9b8cff', '#ff8e70', '#79b8ff', '#f28ab2'];

const activityCopy = (title, world, index) => {
  const action = title.includes('ট্রেস') ? 'দেখো, আঙুল দিয়ে পথটা একবার অনুসরণ করো, তারপর পেন্সিলে ধীরে ধীরে টানো।'
    : title.includes('সোর্ট') || title.includes('বাছাই') || title.includes('মেলাও') ? 'কার্ড বা ছবিগুলো কেটে/আঁকো, তারপর মিল আছে এমন জোড়া বা দলে সাজাও।'
      : title.includes('মাপ') || title.includes('তুলনা') || title.includes('ডায়েরি') ? 'একটি জিনিস বেছে মাপ/দেখে নাও। ফলটি নিচের ছকে লিখে বা চিহ্ন এঁকে রাখো।'
        : title.includes('ডিজাইন') || title.includes('বানাও') || title.includes('কাটো') ? 'নিজের নকশা আঁকো, ধাপে ধাপে বানাও, শেষে কী বদলাতে চাও তা চিহ্নিত করো।'
          : 'প্রথমে অনুমান করো। তারপর কাজটি করে কী দেখলে তা ছবি, দাগ বা ছোট কথায় লিখে রাখো।';
  const prompt = title.includes('গাছ') || world.includes('উদ্ভিদ') ? 'এই অংশটি গাছের কোথায় থাকে? নিজের দেখা কোনো গাছের সঙ্গে মিলিয়ে দেখো।'
    : title.includes('গ্রহ') || world.includes('মহাকাশ') ? 'ক্রম বা আকারের কোন নিয়মটি তুমি লক্ষ্য করলে? নিজের ভাষায় বলো।'
      : title.includes('টাকা') || world.includes('টাকা') ? 'কোন পছন্দটি দরকারি, আর কোনটি অপেক্ষা করতে পারে? কারণ দাও।'
        : title.includes('অনুভূতি') || world.includes('সামাজিক') ? 'এই অবস্থায় শরীরের কোন সংকেতটি আগে টের পাও? সাহায্য চাইতে কাকে বলবে?'
          : 'তুমি কী ভাবছ? একটি অনুমান লেখো, তারপর কাজটি করে প্রমাণ খুঁজে দেখো।';
  return { action, prompt, index };
};

const packMotifs = {
  'bangla-starter': ['অ', 'ক', 'মা', 'ফুল', 'ঘর', 'জল'],
  'math-play': ['১', '২', '৩', '৪', '৫', '৬'],
  'space-explorer': ['সূর্য', 'বুধ', 'শুক্র', 'পৃথিবী', 'মঙ্গল', 'চাঁদ'],
  'physics-makers': ['ঠেলা', 'টান', 'আলো', 'ছায়া', 'চুম্বক', 'শব্দ'],
  'chemistry-lab': ['কঠিন', 'তরল', 'গ্যাস', 'মিশ্রণ', 'তাপ', 'রঙ'],
  'life-science': ['মূল', 'কাণ্ড', 'পাতা', 'ফুল', 'ফল', 'বীজ'],
  'nature-guardian': ['মেঘ', 'বৃষ্টি', 'নদী', 'মাটি', 'গাছ', 'পাখি'],
  'food-health': ['ভাত', 'ডাল', 'সবজি', 'মাছ', 'ফল', 'পানি'],
  'money-life-skills': ['প্রয়োজন', 'ইচ্ছা', 'সঞ্চয়', 'দাম', 'আয়', 'ব্যয়'],
  'social-emotional': ['খুশি', 'রাগ', 'ভয়', 'শান্ত', 'বন্ধু', 'সাহায্য'],
  'discovery-projects': ['প্রশ্ন', 'অনুমান', 'পরীক্ষা', 'দেখা', 'ফল', 'আবার'],
};

const cards = (items, cls = '') => items.map((x, n) => `<div class="task-card ${cls}"><span>${esc(x)}</span><i>${bn(n + 1)}</i></div>`).join('');

const activityWorkspace = (pack, title, i) => {
  const m = packMotifs[pack.slug] ?? ['দেখো', 'ভাবো', 'করো', 'বলো', 'আঁকো', 'আবার'];
  const lower = title.toLowerCase();
  if (/ট্রেস|লিখো|ডিকটেশন|বাক্য/.test(lower)) return `<div class="activity-board trace-board">
    <div class="visual-title"><b>চোখে দেখো → আঙুলে চালাও → পেন্সিলে লেখো</b><span>স্ট্রোক লেন</span></div>
    <div class="trace-grid">${m.slice(0, 4).map((x) => `<div><strong>${esc(x)}</strong><span>${esc(x)}　${esc(x)}　${esc(x)}</span><i></i></div>`).join('')}</div>
    <div class="mini-reflect"><b>আজ সবচেয়ে সহজ ছিল</b><span></span><b>আরেকবার করব</b><span></span></div></div>`;
  if (/সোর্ট|বাছাই|মেলাও|শ্রেণি|জীবিত|কঠিন|তরল|গ্যাস/.test(lower)) return `<div class="activity-board sort-board">
    <div class="visual-title"><b>কাটো, ভাবো, সঠিক ঘরে রাখো</b><span>সাজানোর খেলা</span></div>
    <div class="sort-bins"><section><h3>দল ক</h3><div></div></section><section><h3>দল খ</h3><div></div></section></div>
    <div class="cut-line"><small>✂ কাটার কার্ড</small>${cards(m)}</div></div>`;
  if (/ক্রম|জীবনচক্র|ধাপ|রুটিন|কলা|চক্র|শৃঙ্খল|সিরিজ/.test(lower)) return `<div class="activity-board flow-board">
    <div class="visual-title"><b>ঘটনাগুলো সঠিক ক্রমে সাজাও</b><span>পথ খোঁজা</span></div>
    <div class="flow">${m.slice(0, 5).map((x, n) => `<div><i>${bn(n + 1)}</i><strong>${esc(x)}</strong><span>${n < 4 ? '→' : '✓'}</span></div>`).join('')}</div>
    <div class="wide-note"><b>ক্রমটি এমন হলো কারণ</b><span></span></div></div>`;
  if (/মাপ|তুলনা|ডায়েরি|লগ|ছক|রেকর্ড|তাপ|দৈর্ঘ্য/.test(lower)) return `<div class="activity-board data-board">
    <div class="visual-title"><b>আগে অনুমান, তারপর মাপ</b><span>গবেষকের নোট</span></div>
    <table><thead><tr><th>কী দেখলাম</th><th>অনুমান</th><th>মাপ / ফল</th><th>বদল</th></tr></thead><tbody>${m.slice(0, 4).map((x) => `<tr><td>${esc(x)}</td><td></td><td></td><td>○ বেশি　○ কম</td></tr>`).join('')}</tbody></table>
    <div class="meter"><span style="width:${35 + i * 6}%"></span></div><div class="wide-note"><b>আমার আবিষ্কার</b><span></span></div></div>`;
  if (/ডিজাইন|বানাও|কাটো|ফোল্ড|মানচিত্র|মডেল|প্লেট|সাজাও|আঁকো/.test(lower)) return `<div class="activity-board maker-board">
    <div class="visual-title"><b>নিজের নকশা বানাও</b><span>মেকার স্টুডিও</span></div>
    <div class="maker"><div class="canvas"><span>এখানে নকশা আঁকো</span><i></i><i></i><i></i></div><aside><b>যা লাগবে</b>${m.slice(0, 4).map((x) => `<span>□ ${esc(x)}</span>`).join('')}<b>পরের বদল</b><em></em></aside></div></div>`;
  if (/নিরাপত্তা|সিদ্ধান্ত|অভ্যাস|অনুভূতি|বন্ধুত্ব|প্রয়োজন|ইচ্ছা|আবর্জনা|সঞ্চয়/.test(lower)) return `<div class="activity-board choice-board">
    <div class="visual-title"><b>পরিস্থিতি পড়ো, নিজের সিদ্ধান্ত দাও</b><span>সিদ্ধান্তের খেলা</span></div>
    <div class="scenario-grid">${m.slice(0, 4).map((x, n) => `<div><small>পরিস্থিতি ${bn(n + 1)}</small><strong>${esc(x)}</strong><p>○ এখন করব　○ সাহায্য নেব　○ অপেক্ষা করব</p><span>কারণ:</span></div>`).join('')}</div></div>`;
  if (/পরীক্ষা|পর্যবেক্ষণ|অনুমান|আলো|ছায়া|চুম্বক|দ্রবণ|কম্পন|ফিল্টার/.test(lower)) return `<div class="activity-board lab-board">
    <div class="visual-title"><b>অনুমান → পরীক্ষা → প্রমাণ</b><span>ছোট ল্যাব</span></div>
    <div class="lab-steps"><section><i>?</i><b>আমার অনুমান</b><span></span></section><section><i>▶</i><b>আমি যা বদলাব</b>${m.slice(0, 3).map((x) => `<small>□ ${esc(x)}</small>`).join('')}</section><section><i>✓</i><b>আমি যা দেখলাম</b><span></span></section></div>
    <div class="wide-note"><b>প্রমাণ থেকে আমার কথা</b><span></span></div></div>`;
  return `<div class="activity-board puzzle-board"><div class="visual-title"><b>দেখো, মিল খুঁজে দাগ টানো</b><span>চ্যালেঞ্জ</span></div><div class="match-grid"><div>${cards(m.slice(0, 3), 'round')}</div><div>${cards(m.slice(3), 'round')}</div></div><div class="wide-note"><b>আমি যে নিয়মটি পেলাম</b><span></span></div></div>`;
};

const bonusWorkspace = (title, j) => {
  if (j === 0) return `<div class="bonus-board poster-board"><div class="poster-hero"><small>কেটে টাঙাও</small><strong>${esc(title)}</strong><span>আজকের ছোট মিশন</span></div><div class="poster-checks">${['দেখেছি', 'করেছি', 'বলেছি', 'আবার করেছি'].map((x) => `<span>□ ${x}</span>`).join('')}</div><div class="poster-stars">☆　☆　☆　☆　☆</div></div>`;
  if (j === 1) return `<div class="bonus-board routine-board"><div class="visual-title"><b>১৫ মিনিটের পারিবারিক রুটিন</b><span>কাজের গাইড</span></div><div class="routine">${[['০–২', 'বেছে নাও'], ['৩–১০', 'নিজে করো'], ['১১–১৩', 'কী দেখলে বলো'], ['১৪–১৫', 'তারিখ দাও']].map((x) => `<div><i>${x[0]}</i><b>${x[1]}</b><span></span></div>`).join('')}</div><div class="adult-note"><b>বড়দের একটি প্রশ্ন</b><p>“তুমি কীভাবে বুঝলে?”</p></div></div>`;
  return `<div class="bonus-board answer-board"><div class="visual-title"><b>উত্তর, ইঙ্গিত ও আবার চেষ্টা</b><span>শেখার সঙ্গী</span></div><div class="answer-cards"><section><i>১</i><b>প্রথম চেষ্টা</b><p>শিশুর নিজের উত্তরটি শুনুন।</p></section><section><i>২</i><b>ছোট ইঙ্গিত</b><p>একটি উদাহরণ বা প্রশ্ন দিন।</p></section><section><i>৩</i><b>আবার চেষ্টা</b><p>কী বদলেছে তা বলতে দিন।</p></section></div><div class="reflection-strip">আজকের আবিষ্কার <span></span></div></div>`;
};

const page = ({ pack, title, eyebrow, body, i, bonus = false, bonusIndex = 0 }) => {
  const accent = pack.color;
  const accent2 = palette[i % palette.length];
  return `<section class="page" style="--accent:${accent};--accent2:${accent2}">
    <header class="top"><span class="brand">পসরা · ${esc(pack.world)}</span><span class="page-no">${bn(i + 1)} / ${bn(11)}</span></header>
    <div class="orb orb-a"></div><div class="orb orb-b"></div>
    <main>
      <p class="eyebrow">${esc(eyebrow)}</p>
      <h1>${esc(title)}</h1>
      <p class="body">${esc(body)}</p>
      <div class="meta"><span>বয়স: ${esc(pack.audience.split('·')[0].trim())}</span><span>পেন্সিল · রঙ · ${bonus ? 'অভিভাবক/শিক্ষক' : 'একাই বা জোড়ায়'}</span></div>
      ${bonus ? bonusWorkspace(title, bonusIndex) : activityWorkspace(pack, title, i)}
      <footer><span>পসরা · শেখা হোক খেলার মতো</span><span>নিজের নাম: <i></i></span></footer>
    </main>
  </section>`;
};

const htmlForPack = (pack) => {
  const activities = pack.activities.map((title, i) => {
    const c = activityCopy(title, pack.world, i);
    return page({ pack, title, eyebrow: `ওয়ার্কশিট ${bn(i + 1)} · ${esc(pack.title)}`, body: `${c.action} ${c.prompt}`, i });
  });
  const bonuses = pack.bonus.map((title, j) => page({
    pack, title, eyebrow: `বোনাস ${bn(j + 1)} · ${esc(pack.title)}`,
    body: j === 0 ? 'এই পাতাটি কেটে, টাঙিয়ে বা ফ্রিজে রেখে প্রতিদিনের শেখাকে চোখের সামনে রাখুন।' : j === 1 ? 'একবারে ১৫ মিনিট। শিশুকে আগে চেষ্টা করতে দিন, পরে শুধু একটি প্রশ্ন করুন: “তুমি কী দেখলে?”' : 'উত্তর মিলিয়ে নেওয়ার আগে শিশুর নিজের ব্যাখ্যাটি শুনুন। ভুলকে নতুন চেষ্টা হিসেবে চিহ্নিত করুন।',
    i: pack.activities.length + j,
    bonus: true,
    bonusIndex: j,
  }));
  return `<!doctype html><html lang="bn"><head><meta charset="utf-8"><style>
    @font-face{font-family:PosoraBangla;src:url('${fontUrl}') format('woff2');font-weight:400 800;font-display:swap}
    @page{size:A4;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#e8edf2;color:#16233d;font-family:PosoraBangla,'Arial Unicode MS',sans-serif}.page{width:210mm;height:297mm;position:relative;overflow:hidden;padding:16mm 17mm 14mm;background:linear-gradient(150deg,#fbfdff 0%,color-mix(in srgb,var(--accent),#f5f8fb 92%) 55%,#fff8ef 100%);page-break-after:always}.page:last-child{page-break-after:auto}.page:before{content:'';position:absolute;inset:7mm;border:1.2px solid color-mix(in srgb,var(--accent),#ffffff 50%);border-radius:8mm;pointer-events:none}.top{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:center;color:#53657f;font-size:10pt;letter-spacing:.02em}.brand{font-weight:800;color:var(--accent)}.page-no{font-size:9pt}.orb{position:absolute;border-radius:50%;opacity:.16}.orb-a{width:90mm;height:90mm;right:-30mm;top:-24mm;background:var(--accent)}.orb-b{width:58mm;height:58mm;left:-22mm;bottom:18mm;background:var(--accent2)}main{position:relative;z-index:1;padding-top:15mm}h1{margin:0 0 4mm;font-size:27pt;line-height:1.15;color:#16233d;max-width:166mm}.eyebrow{display:inline-block;margin:0 0 5mm;padding:2mm 4mm;border-radius:99px;background:var(--accent);color:#fff;font-size:10pt;font-weight:800}.body{font-size:12.5pt;line-height:1.6;max-width:174mm;margin:0 0 5mm;color:#304561}.meta{display:flex;gap:4mm;flex-wrap:wrap;font-size:9pt;color:#53657f;margin-bottom:6mm}.meta span{background:#ffffffbb;padding:1.7mm 3mm;border-radius:4mm;border:1px solid #dbe4ec}.activity-board,.bonus-board{background:#ffffffdf;border:1.5px solid color-mix(in srgb,var(--accent),#b9c9d6 55%);border-radius:7mm;padding:7mm;box-shadow:0 5mm 13mm #546b7b1c;min-height:121mm}.visual-title{display:flex;justify-content:space-between;align-items:center;gap:5mm;margin-bottom:6mm}.visual-title b{font-size:14pt}.visual-title span{padding:1.5mm 3mm;border-radius:99px;background:color-mix(in srgb,var(--accent),#fff 82%);color:#304561;font-size:9pt}.trace-grid{display:grid;grid-template-columns:1fr 1fr;gap:4mm}.trace-grid>div{padding:4mm;border:1px solid #cad8e2;border-radius:5mm;background:linear-gradient(135deg,#fff,color-mix(in srgb,var(--accent2),#fff 91%))}.trace-grid strong{display:block;font-size:22pt;color:var(--accent)}.trace-grid span{display:block;margin:2mm 0;color:#9aabb7;font-size:15pt;letter-spacing:.08em}.trace-grid i{display:block;height:10mm;border-bottom:1px dashed #8fa4b3}.mini-reflect{display:grid;grid-template-columns:auto 1fr auto 1fr;gap:3mm;margin-top:5mm;align-items:end;font-size:9.5pt;color:#53657f}.mini-reflect span,.wide-note span{height:7mm;border-bottom:1.5px solid #8fa4b3}.sort-bins{display:grid;grid-template-columns:1fr 1fr;gap:5mm}.sort-bins section{height:48mm;border:2px dashed color-mix(in srgb,var(--accent),#8fa4b3 45%);border-radius:6mm;background:color-mix(in srgb,var(--accent),#fff 94%)}.sort-bins h3{margin:0;padding:3mm;font-size:12pt;color:var(--accent);border-bottom:1px solid #dce6ec}.cut-line{margin-top:5mm;padding-top:4mm;border-top:1.5px dashed #8fa4b3;display:grid;grid-template-columns:repeat(6,1fr);gap:2mm}.cut-line small{grid-column:1/-1;color:#687d8e}.task-card{min-height:22mm;padding:2mm;border:1px dashed #9bb0c0;border-radius:3mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:#fff;font-size:9pt}.task-card i{font-style:normal;font-size:7pt;color:#91a3b1}.flow{display:flex;align-items:stretch;gap:2mm;margin-top:10mm}.flow>div{flex:1;min-width:0;padding:4mm 2mm;border-radius:5mm;background:color-mix(in srgb,var(--accent2),#fff 82%);text-align:center;position:relative}.flow i{display:grid;margin:-9mm auto 2mm;width:9mm;height:9mm;place-items:center;border-radius:50%;background:var(--accent);color:#fff;font-style:normal}.flow strong{display:block;font-size:10pt}.flow span{position:absolute;right:-4mm;top:16mm;color:var(--accent);font-size:16pt}.flow>div:last-child span{right:2mm}.wide-note{display:grid;grid-template-columns:auto 1fr;gap:4mm;margin-top:8mm;align-items:end;font-size:10pt;color:#53657f}.data-board table{width:100%;border-collapse:separate;border-spacing:0;overflow:hidden;border:1px solid #bdccd7;border-radius:4mm;font-size:9pt}.data-board th{background:color-mix(in srgb,var(--accent),#fff 78%);padding:3mm}.data-board td{height:14mm;padding:2mm;border-top:1px solid #d7e1e8;border-right:1px solid #d7e1e8}.meter{height:5mm;border-radius:99px;background:#e4edf2;margin-top:5mm;overflow:hidden}.meter span{display:block;height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:inherit}.maker{display:grid;grid-template-columns:1.5fr .7fr;gap:5mm}.canvas{height:84mm;border:2px dashed #aabcc8;border-radius:6mm;display:grid;place-items:center;position:relative;background:repeating-linear-gradient(0deg,transparent,transparent 9mm,#edf2f5 9.3mm,#edf2f5 9.7mm)}.canvas>span{color:#8ca0b0}.canvas i{position:absolute;width:15mm;height:15mm;border:2px solid var(--accent2);border-radius:50%}.canvas i:nth-of-type(1){left:8mm;top:8mm}.canvas i:nth-of-type(2){right:12mm;top:23mm;border-radius:3mm;transform:rotate(18deg)}.canvas i:nth-of-type(3){left:40%;bottom:8mm;width:28mm;border-radius:99px}.maker aside{display:flex;flex-direction:column;gap:3mm;padding:4mm;border-radius:5mm;background:color-mix(in srgb,var(--accent),#fff 92%);font-size:9pt}.maker aside b{color:var(--accent);margin-top:2mm}.maker aside em{height:22mm;border:1px dashed #9bb0c0;border-radius:3mm;background:#fff}.scenario-grid{display:grid;grid-template-columns:1fr 1fr;gap:4mm}.scenario-grid>div{min-height:48mm;padding:4mm;border-radius:5mm;border:1px solid #d0dce4;background:linear-gradient(145deg,#fff,color-mix(in srgb,var(--accent2),#fff 92%))}.scenario-grid small{color:var(--accent);font-weight:800}.scenario-grid strong{display:block;font-size:14pt;margin:2mm 0}.scenario-grid p{font-size:8.5pt;color:#53657f}.scenario-grid span{display:block;height:8mm;border-bottom:1px solid #9bb0c0;font-size:8pt}.lab-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm}.lab-steps section{min-height:78mm;padding:5mm;border-radius:5mm;background:color-mix(in srgb,var(--accent),#fff 93%);border:1px solid #d1dce4;display:flex;flex-direction:column;gap:3mm}.lab-steps i{display:grid;place-items:center;width:12mm;height:12mm;border-radius:50%;background:var(--accent);color:#fff;font-style:normal;font-weight:800}.lab-steps b{font-size:12pt}.lab-steps span{height:32mm;border:1px dashed #9bb0c0;border-radius:3mm;background:#fff}.lab-steps small{padding:2mm;background:#fff;border-radius:2mm}.match-grid{display:grid;grid-template-columns:1fr 1fr;gap:34mm;position:relative}.match-grid:before{content:'মিল খুঁজে রেখা টানো';position:absolute;left:50%;top:40%;transform:translate(-50%,-50%) rotate(-90deg);font-size:9pt;color:#8ca0b0}.match-grid>div{display:grid;gap:3mm}.match-grid .task-card{min-height:20mm;border-style:solid;border-color:color-mix(in srgb,var(--accent),#9bb0c0 50%)}.match-grid .round{border-radius:99px}.poster-hero{height:68mm;border-radius:7mm;background:linear-gradient(145deg,var(--accent),var(--accent2));color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:8mm}.poster-hero small{font-size:10pt}.poster-hero strong{font-size:25pt;line-height:1.25;margin:3mm 0}.poster-hero span{font-size:13pt}.poster-checks{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin-top:5mm}.poster-checks span{padding:4mm;border:1px solid #d2dee6;border-radius:4mm;text-align:center}.poster-stars{text-align:center;font-size:24pt;color:var(--accent2);margin-top:4mm}.routine{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin-top:8mm}.routine>div{min-height:57mm;padding:4mm 3mm;background:color-mix(in srgb,var(--accent),#fff 92%);border-radius:5mm;display:flex;flex-direction:column;align-items:center;text-align:center;gap:4mm}.routine i{display:grid;place-items:center;width:15mm;height:15mm;border-radius:50%;background:var(--accent);color:#fff;font-style:normal;font-size:9pt}.routine span{width:100%;height:15mm;border-bottom:1px dashed #9bb0c0}.adult-note{margin-top:5mm;padding:4mm;border-radius:4mm;background:color-mix(in srgb,var(--accent2),#fff 88%);display:flex;justify-content:space-between}.adult-note p{margin:0;font-size:12pt}.answer-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm}.answer-cards section{min-height:75mm;padding:5mm;border-radius:6mm;border:1px solid #d2dee6;background:linear-gradient(150deg,#fff,color-mix(in srgb,var(--accent2),#fff 92%))}.answer-cards i{display:grid;place-items:center;width:11mm;height:11mm;border-radius:50%;background:var(--accent);color:#fff;font-style:normal}.answer-cards b{display:block;margin:4mm 0;font-size:13pt}.answer-cards p{font-size:10pt;line-height:1.6;color:#53657f}.reflection-strip{display:grid;grid-template-columns:auto 1fr;gap:4mm;margin-top:6mm;align-items:end}.reflection-strip span{height:8mm;border-bottom:1px solid #8fa4b3}footer{position:absolute;left:17mm;right:17mm;bottom:14mm;display:flex;justify-content:space-between;color:#75879a;font-size:9pt}footer i{display:inline-block;width:30mm;border-bottom:1px solid #75879a;height:4mm}
  </style></head><body>${[...activities, ...bonuses].join('')}</body></html>`;
};

const guidePage = ({ title, eyebrow, body, items = [], accent = '#ffcc4d', pageNo, total }) => `<section class="page" style="--accent:${accent}">
  <header class="top"><span class="brand">পসরা · শেখা হোক খেলার মতো</span><span class="page-no">${bn(pageNo)} / ${bn(total)}</span></header>
  <div class="orb orb-a"></div><div class="orb orb-b"></div><main>
    <p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1><p class="body">${esc(body)}</p>
    <div class="guide-board">${items.map((item, i) => `<div class="guide-item"><span class="guide-number">${bn(i + 1)}</span><div><strong>${esc(item[0])}</strong><p>${esc(item[1])}</p></div></div>`).join('')}</div>
  </main><footer><span>পসরা · পরিবারের শেখার সঙ্গী</span><span>নাম: <i></i></span></footer>
</section>`;

const htmlForGuide = (kind) => {
  const pages = kind === 'start-here' ? [
    { eyebrow: 'শুরু করার আগে', title: 'এই বান্ডল কীভাবে ব্যবহার করবেন', body: 'প্রতিদিন অল্প সময়ে শিশুকে নিজে চেষ্টা করার সুযোগ দিন। নিখুঁত উত্তর নয়—কৌতূহল, কথা বলা আর আবার চেষ্টা করাই লক্ষ্য।', items: [
      ['একসঙ্গে এক পাতা', 'একটি ওয়ার্কশিট বেছে ১০–১৫ মিনিট সময় দিন। ক্লান্ত হলে থামুন।'],
      ['আগে অনুমান, পরে উত্তর', 'উত্তরপত্র দেখানোর আগে শিশুকে কী ভাবছে তা বলতে দিন।'],
      ['একটি ভালো প্রশ্ন', '“তুমি কী দেখলে?” বা “কীভাবে বুঝলে?”—শুধু একটি প্রশ্ন করুন।'],
      ['আবার চেষ্টা', 'ভুল হলে ছোট ইঙ্গিত দিন, পুরো উত্তর নয়।'],
    ] },
    { eyebrow: 'প্রতিটি সেশনের ছক', title: '১৫ মিনিটের শেখার লুপ', body: 'এই ছোট রুটিনটি ৮৮টি ওয়ার্কশিটেই ব্যবহার করা যায়।', items: [
      ['১ মিনিট · লক্ষ্য', 'আজ কী খুঁজব বা বানাব? শিশুকে নিজের ভাষায় বলতে দিন।'],
      ['৮ মিনিট · কাজ', 'দেখা, আঁকা, মেলানো, মাপা বা বানানোর কাজটি করতে দিন।'],
      ['৩ মিনিট · ব্যাখ্যা', 'শিশু কী দেখেছে এবং কেন এমন হয়েছে—শুনুন।'],
      ['৩ মিনিট · রেখে দিন', 'তারিখ লিখে রাখুন; পরের দিন আবার দেখার জন্য তুলে রাখুন।'],
    ] },
    { eyebrow: 'পরিবারের জন্য', title: 'সহজ প্রস্তুতি ও নিরাপত্তা', body: 'বেশিরভাগ কাজে কাগজ, পেন্সিল, রঙ ও ঘরের নিরাপদ জিনিসই যথেষ্ট।', items: [
      ['আগে দেখে নিন', 'কাঁচি, ছোট অংশ, তাপ বা খাবার থাকলে বড় একজন পাশে থাকুন।'],
      ['শিশুর ভাষা', 'উত্তর বলে দেবেন না; “আর কীভাবে দেখা যায়?” জিজ্ঞেস করুন।'],
      ['ফাইল রাখুন', 'অ্যাকাউন্ট থেকে প্যাক ও গাইড আবার ডাউনলোড করা যাবে।'],
      ['নিজের গতি', '৩০ দিনের পরিকল্পনা একটি নমুনা—পরিবারের সময় অনুযায়ী বদলান।'],
    ] },
  ] : [
    { eyebrow: '৩০ দিনের পথ', title: 'প্রতিদিন ১৫ মিনিটের শেখা', body: 'প্রতিদিন একটি ছোট কাজ বেছে নিন। সপ্তাহ শেষে শিশুকে তার পছন্দের পাতাটি আবার দেখাতে বলুন।', items: [
      ['দিন ১–৩ · বাংলা শুরু', 'ট্রেসিং, শব্দ বানানো ও ছোট গল্প পড়া।'],
      ['দিন ৪–৬ · গণিত খেলাঘর', 'গোনা, যোগ-বিয়োগ, মাপ ও দোকান-খেলা।'],
      ['দিন ৭–৯ · জীবনের ভিতর', 'গাছের অংশ, জীবনচক্র ও ইন্দ্রিয়।'],
      ['দিন ১০–১২ · প্রকৃতি রক্ষক', 'আবহাওয়া, জলচক্র ও নিজের এলাকার মানচিত্র।'],
    ] },
    { eyebrow: 'দিন ১৩–২১', title: 'দেখো, মাপো, ব্যাখ্যা করো', body: 'হাতে-কলমে কাজের পর একটি বাক্যে নিজের আবিষ্কার বলুন।', items: [
      ['দিন ১৩–১৫ · খাবার গোয়েন্দা', 'প্লেট সাজানো, লেবেল পড়া ও পানির অভ্যাস।'],
      ['দিন ১৬–১৮ · ছোট বিজ্ঞানী', 'ধাক্কা-টান, আলো, ছায়া ও চুম্বক।'],
      ['দিন ১৯–২১ · রান্নাঘর কেমিস্ট্রি', 'মিশ্রণ, ছাঁকনি, রঙের পরিবর্তন ও নিরাপত্তা।'],
      ['প্রতিদিনের নোট', 'আজ কী দেখলাম? এক লাইন বা একটি ছবি রাখুন।'],
    ] },
    { eyebrow: 'দিন ২২–৩০', title: 'জ্ঞানকে জীবনে লাগাও', body: 'শেষ সপ্তাহে শিশুকে নিজের মিশন বেছে নিতে দিন এবং পরিবারের কাউকে বুঝিয়ে বলতে দিন।', items: [
      ['দিন ২২–২৪ · মহাকাশ অভিযান', 'গ্রহের ক্রম, চাঁদের কলা ও মিশন লগ।'],
      ['দিন ২৫–২৭ · টাকা ও জীবন', 'দাম মিলানো, প্রয়োজন–ইচ্ছা ও সিদ্ধান্ত।'],
      ['দিন ২৮–২৯ · সামাজিক দক্ষতা', 'অনুভূতি চেনা, কথা বলা ও সাহায্য চাওয়া।'],
      ['দিন ৩০ · আবিষ্কার প্রকল্প', 'নিজের প্রশ্ন, ছোট পরীক্ষা ও পরিবারের সামনে দেখানো।'],
    ] },
  ];
  const total = pages.length;
  return `<!doctype html><html lang="bn"><head><meta charset="utf-8"><style>
  @font-face{font-family:PosoraBangla;src:url('${fontUrl}') format('woff2');font-weight:400 800;font-display:swap}@page{size:A4;margin:0}*{box-sizing:border-box}html,body{margin:0;background:#e8edf2;color:#16233d;font-family:PosoraBangla,'Arial Unicode MS',sans-serif}.page{width:210mm;height:297mm;position:relative;overflow:hidden;padding:18mm 17mm 15mm;background:linear-gradient(150deg,#f9fbff,#edf4f8 55%,#f8efe8);page-break-after:always}.page:last-child{page-break-after:auto}.page:before{content:'';position:absolute;inset:8mm;border:1.2px solid color-mix(in srgb,var(--accent),#fff 58%);border-radius:8mm}.top,main,footer{position:relative;z-index:1}.top,footer{display:flex;justify-content:space-between;color:#53657f;font-size:10pt}.brand{font-weight:700;color:var(--accent)}main{padding-top:23mm}.eyebrow{display:inline-block;padding:2mm 4mm;border-radius:99px;background:var(--accent);font-size:10pt;font-weight:700}.body{font-size:14pt;line-height:1.75;max-width:170mm;color:#304561}.guide-board{background:#ffffffdc;border:1.5px solid #b9c9d6;border-radius:7mm;padding:8mm;box-shadow:0 5mm 13mm #546b7b1c}.guide-item{display:grid;grid-template-columns:14mm 1fr;gap:5mm;padding:5mm 0;border-bottom:1px solid #dbe4ec}.guide-item:last-child{border-bottom:0}.guide-number{width:10mm;height:10mm;border-radius:50%;background:var(--accent);display:grid;place-items:center;font-weight:800}.guide-item strong{font-size:15pt}.guide-item p{margin:2mm 0 0;font-size:11.5pt;line-height:1.65;color:#53657f}.orb{position:absolute;border-radius:50%;opacity:.18}.orb-a{width:90mm;height:90mm;right:-30mm;top:-24mm;background:var(--accent)}.orb-b{width:55mm;height:55mm;left:-22mm;bottom:18mm;background:#7aa7bf}footer{position:absolute;left:17mm;right:17mm;bottom:15mm}.page-no{font-size:9pt}footer i{display:inline-block;width:30mm;border-bottom:1px solid #75879a;height:4mm}</style></head><body>${pages.map((p, i) => guidePage({ ...p, pageNo: i + 1, total, accent: i === 1 ? '#67d4c5' : i === 2 ? '#9b8cff' : '#ffcc4d' })).join('')}</body></html>`;
};

await fs.mkdir(htmlDir, { recursive: true });
const manifest = { version: 2, generatedAt: new Date().toISOString(), priceBdt: bundle.priceBdt, guides: [], packs: [] };
for (const pack of digitalPacks) {
  const slug = pack.slug;
  const htmlPath = path.join(htmlDir, `${slug}.html`);
  const pdfPath = path.join(outDir, `${slug}.pdf`);
  await fs.writeFile(htmlPath, htmlForPack(pack), 'utf8');
  try {
    await run(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--no-pdf-header-footer', `--user-data-dir=/tmp/posora-pdf-${slug}`, `--print-to-pdf=${pdfPath}`, `file://${htmlPath}`], { maxBuffer: 2 * 1024 * 1024, timeout: 8000 });
  } catch (error) {
    // Chrome occasionally leaves a headless helper alive after writing the PDF.
    // Treat that as success only when the output exists and is non-empty.
    const stat = await fs.stat(pdfPath).catch(() => null);
    if (!stat?.size) throw error;
  }
  const stat = await fs.stat(pdfPath);
  if (stat.size < 10_000) throw new Error(`PDF too small: ${pdfPath}`);
  const bytes = await fs.readFile(pdfPath);
  manifest.packs.push({ slug, file: `${slug}.pdf`, title: pack.title, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
}
for (const guide of [{ slug: 'start-here', title: 'শুরু করার গাইড' }, { slug: '30-day-plan', title: '৩০ দিনের ব্যবহার-পরিকল্পনা' }]) {
  const htmlPath = path.join(htmlDir, `${guide.slug}.html`);
  const pdfPath = path.join(outDir, `${guide.slug}.pdf`);
  await fs.writeFile(htmlPath, htmlForGuide(guide.slug), 'utf8');
  try {
    await run(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--no-pdf-header-footer', `--user-data-dir=/tmp/posora-pdf-${guide.slug}`, `--print-to-pdf=${pdfPath}`, `file://${htmlPath}`], { maxBuffer: 2 * 1024 * 1024, timeout: 8000 });
  } catch (error) {
    const stat = await fs.stat(pdfPath).catch(() => null);
    if (!stat?.size) throw error;
  }
  const bytes = await fs.readFile(pdfPath);
  if (bytes.length < 10_000) throw new Error(`PDF too small: ${pdfPath}`);
  manifest.guides.push({ slug: guide.slug, file: `${guide.slug}.pdf`, title: guide.title, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
}
await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
await run('zip', ['-q', '-j', path.join(root, 'private-downloads', 'posora-digital-pack-bundle.zip'), ...[...digitalPacks.map((p) => path.join(outDir, `${p.slug}.pdf`)), path.join(outDir, 'start-here.pdf'), path.join(outDir, '30-day-plan.pdf')]], { timeout: 25000 });
console.log(`Generated ${digitalPacks.length} pack PDFs in ${outDir}`);
