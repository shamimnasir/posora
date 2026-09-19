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

const workspace = (i, bonus = false) => {
  if (bonus) return `<div class="bonus-board"><div class="bonus-row"><span>আজকের তারিখ</span><span class="line"></span></div><div class="bonus-row"><span>আজকের লক্ষ্য</span><span class="line"></span></div><div class="bonus-row tall"><span>আমি কী শিখলাম?</span><span class="line"></span></div><div class="check-grid"><span>☐ নিজে করেছি</span><span>☐ সাহায্য নিয়ে করেছি</span><span>☐ আবার চেষ্টা করব</span></div></div>`;
  const dots = Array.from({ length: 8 }, (_, n) => `<span class="dot ${n === i % 8 ? 'active' : ''}"></span>`).join('');
  return `<div class="activity-board"><div class="choice-row">${dots}</div><div class="draw-area"><span class="ghost">এখানে আঁকো / সাজাও / লিখো</span></div><div class="answer-row"><span>আমার উত্তর</span><span class="line"></span></div><div class="answer-row"><span>কারণ</span><span class="line"></span></div></div>`;
};

const page = ({ pack, title, eyebrow, body, i, bonus = false }) => {
  const accent = palette[i % palette.length];
  return `<section class="page" style="--accent:${accent}">
    <header class="top"><span class="brand">পসরা · ${esc(pack.world)}</span><span class="page-no">${bn(i + 1)} / ${bn(11)}</span></header>
    <div class="orb orb-a"></div><div class="orb orb-b"></div>
    <main>
      <p class="eyebrow">${esc(eyebrow)}</p>
      <h1>${esc(title)}</h1>
      <p class="body">${esc(body)}</p>
      <div class="meta"><span>বয়স: ${esc(pack.audience.split('·')[0].trim())}</span><span>পেন্সিল · রঙ · ${bonus ? 'অভিভাবক/শিক্ষক' : 'একাই বা জোড়ায়'}</span></div>
      ${workspace(i, bonus)}
      <footer><span>পসরা · শেখা হোক খেলার মতো</span><span>নিজের নাম: <i></i></span></footer>
    </main>
  </section>`;
};

const htmlForPack = (pack) => {
  const activities = pack.activities.map((title, i) => {
    const c = activityCopy(title, pack.world, i);
    return page({ pack, title, eyebrow: `কার্যপত্র ${bn(i + 1)} · ${esc(pack.title)}`, body: `${c.action} ${c.prompt}`, i });
  });
  const bonuses = pack.bonus.map((title, j) => page({
    pack, title, eyebrow: `বোনাস ${bn(j + 1)} · ${esc(pack.title)}`,
    body: j === 0 ? 'এই পাতাটি কেটে, টাঙিয়ে বা ফ্রিজে রেখে প্রতিদিনের শেখাকে চোখের সামনে রাখুন।' : j === 1 ? 'একবারে ১৫ মিনিট। শিশুকে আগে চেষ্টা করতে দিন, পরে শুধু একটি প্রশ্ন করুন: “তুমি কী দেখলে?”' : 'উত্তর মিলিয়ে নেওয়ার আগে শিশুর নিজের ব্যাখ্যাটি শুনুন। ভুলকে নতুন চেষ্টা হিসেবে চিহ্নিত করুন।',
    i: pack.activities.length + j,
    bonus: true,
  }));
  return `<!doctype html><html lang="bn"><head><meta charset="utf-8"><style>
    @font-face{font-family:PosoraBangla;src:url('${fontUrl}') format('woff2');font-weight:400 800;font-display:swap}
    @page{size:A4;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#e8edf2;color:#16233d;font-family:PosoraBangla,'Arial Unicode MS',sans-serif}.page{width:210mm;height:297mm;position:relative;overflow:hidden;padding:18mm 17mm 15mm;background:linear-gradient(150deg,#f9fbff 0%,#edf4f8 55%,#f8efe8 100%);page-break-after:always}.page:last-child{page-break-after:auto}.page:before{content:'';position:absolute;inset:8mm;border:1.2px solid color-mix(in srgb,var(--accent),#ffffff 58%);border-radius:8mm;pointer-events:none}.top{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:center;color:#53657f;font-size:10pt;letter-spacing:.02em}.brand{font-weight:700;color:var(--accent)}.page-no{font-size:9pt}.orb{position:absolute;border-radius:50%;filter:blur(.2px);opacity:.2}.orb-a{width:90mm;height:90mm;right:-30mm;top:-24mm;background:var(--accent)}.orb-b{width:55mm;height:55mm;left:-22mm;bottom:18mm;background:#7aa7bf;opacity:.13}main{position:relative;z-index:1;padding-top:23mm}h1{margin:0 0 5mm;font-size:29pt;line-height:1.15;color:#16233d;max-width:155mm}.eyebrow{display:inline-block;margin:0 0 6mm;padding:2mm 4mm;border-radius:99px;background:var(--accent);color:#16233d;font-size:10pt;font-weight:700}.body{font-size:14pt;line-height:1.75;max-width:170mm;margin:0 0 7mm;color:#304561}.meta{display:flex;gap:5mm;flex-wrap:wrap;font-size:9.5pt;color:#53657f;margin-bottom:9mm}.meta span{background:#ffffffaa;padding:2mm 3mm;border-radius:4mm;border:1px solid #dbe4ec}.activity-board,.bonus-board{background:#ffffffd9;border:1.5px solid #b9c9d6;border-radius:7mm;padding:8mm;box-shadow:0 5mm 13mm #546b7b1c;min-height:120mm}.choice-row{display:flex;gap:4mm;margin-bottom:7mm}.dot{width:12mm;height:12mm;border-radius:50%;display:block;border:1.5px solid #9bb0c0;background:#eef4f6}.dot.active{background:var(--accent);border-color:var(--accent);box-shadow:0 0 0 2mm color-mix(in srgb,var(--accent),transparent 70%)}.draw-area{height:69mm;border:2px dashed #b7c9d4;border-radius:5mm;display:grid;place-items:center;background:repeating-linear-gradient(0deg,transparent,transparent 11mm,#e7eef2 11.5mm,#e7eef2 12mm)}.ghost{color:#8ca0b0;font-size:13pt}.answer-row,.bonus-row{display:flex;align-items:end;gap:5mm;margin-top:7mm;font-size:12pt;color:#53657f}.line{height:7mm;flex:1;border-bottom:1.5px solid #8ea5b4}.tall{align-items:start}.tall .line{height:28mm;border:1.5px solid #b7c9d4;border-radius:4mm}.check-grid{margin-top:8mm;display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;font-size:10pt;color:#53657f}.check-grid span{padding:4mm;border:1px solid #d2dee6;border-radius:4mm;background:#fff}.bonus-board{min-height:112mm}.bonus-row{margin-top:0;margin-bottom:10mm}.bonus-row + .bonus-row{margin-top:8mm}footer{position:absolute;left:17mm;right:17mm;bottom:15mm;display:flex;justify-content:space-between;color:#75879a;font-size:9pt}footer i{display:inline-block;width:30mm;border-bottom:1px solid #75879a;height:4mm}
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
