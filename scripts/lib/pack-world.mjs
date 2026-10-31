/**
 * One world's PDF: cover, contents, the world's own special pages (letters for
 * language, numbers, clocks and money for math, the bodies for space), then
 * for every readable category a পড়ো card page, the অনুশীলনী and the যাচাই,
 * then the world's missions on paper, and every answer collected at the end.
 * All content comes from the snapshot; this file only lays it out.
 */
import { esc, bn, fromBn, OPT, shuffle, shuffleMoved, block, keep, group, cutFrame } from './pack-kit.mjs';

const BLANK = '______';

export const secHead = (eyebrow, title, lede = '', extra = '') => keep(`<div class="sec-head"><span class="eyebrow">${esc(eyebrow)}</span><span class="h1">${esc(title)}</span>${lede ? `<p class="lede">${esc(lede)}</p>` : ''}</div>${extra}`);
export const nameBar = () => `<div class="namebar"><span>নাম <i></i></span><span style="flex:.6">তারিখ <i></i></span></div>`;
const subHead = (t, inst = '') => keep(`<p class="h2">${esc(t)}</p>${inst ? `<p class="inst">${esc(inst)}</p>` : ''}`);

/* ---------------- dotted tracing glyphs ---------------- */
/**
 * A tracing cell: the glyph in pale grey for a child to write over (or solid
 * for the model). HTML, not SVG, so a wide letter or a long word grows its
 * cell instead of being clipped; `w` is only the minimum width.
 */
export function traceGlyph(text, { w = 19, h = 19, size = 16, solid = false } = {}) {
  return `<span class="tg${solid ? ' solid' : ''}" style="min-width:${w}mm;height:${h}mm;font-size:${(size * 2.2).toFixed(1)}pt">${esc(text)}</span>`;
}

/* ---------------- category pages ---------------- */
function factCard(it) {
  const chips = (it.chips ?? []).filter((c) => c && c !== it.name).slice(0, 3);
  return `<div class="blk card">${cutFrame}<span class="snip">✂</span><div class="nm">${esc(it.name)}</div>${chips.length ? `<div class="chips">${chips.map((c) => `<span class="pill">${esc(c)}</span>`).join('')}</div>` : ''}<p class="l1">${esc(it.l1)}</p>${it.fun ? `<p class="fun"><b>মজার তথ্য:</b> ${esc(it.fun)}</p>` : ''}</div>`;
}

function promptHtml(prompt) {
  const parts = String(prompt).split(BLANK);
  if (parts.length === 1) return { html: esc(prompt), inline: false };
  return { html: parts.map(esc).join('<span class="blank"></span>'), inline: true };
}

export function categorySections(world, cat, n, keys) {
  const label = `বিভাগ ${bn(n)}`;
  const sections = [];
  sections.push({
    id: `rd-${cat.index}`, cont: `${cat.name} · পড়ো`,
    parts: [
      secHead(`${label} · পড়ো`, cat.name, `${bn(cat.items.length)}টি কার্ড। জোরে পড়ো, তারপর দাগ ধরে কেটে নাও। কার্ড উল্টে রেখে একজন নাম বলবে, আরেকজন মনে করে বলবে কার্ডে কী লেখা ছিল।`),
      group('cards', cat.items.map(factCard)),
    ],
  });
  const ws = cat.worksheet;
  if (ws) {
    const blanks = ws.blanks.map((b) => {
      const p = promptHtml(b.prompt);
      return block(`<div class="bl"><span class="num">${bn(b.n)}.</span><div>${p.html}${p.inline ? '' : `<div class="ansline">কোনটির কথা? <i></i></div>`}</div></div>`);
    });
    const rows = ws.matchLeft.map((l, i) => `<div class="mrow"><div class="l">${esc(l)}</div><div></div><div class="r">${esc(ws.matchRight[i])}</div></div>`).join('');
    sections.push({
      id: `ws-${cat.index}`, cont: `${cat.name} · অনুশীলনী`,
      parts: [
        secHead(`${label} · অনুশীলনী`, cat.name, '', nameBar()),
        block(`<div class="bank"><p class="h3">শব্দের ঝুড়ি</p>${ws.bank.map((w) => `<span class="pill">${esc(w)}</span>`).join('')}</div>`),
        subHead('ক. শূন্যস্থান পূরণ করো', 'প্রতিটি বাক্য পড়ো। ঝুড়ি থেকে ঠিক নামটা বেছে খালি দাগে লেখো। যে বাক্যে খালি দাগ নেই, তার নিচের দাগে লেখো বাক্যটা কোনটির কথা বলছে।'),
        group('blanks', blanks),
        block(`<p class="h2">খ. দাগ টেনে মেলাও</p><p class="inst">বাঁ দিকের প্রতিটি নামের সঙ্গে ডান দিকের ঠিক শব্দটা একটা দাগ টেনে জোড়ো।</p><div class="match">${rows}</div>`),
      ],
    });
    keys.push({
      title: `${label} · ${cat.name} · অনুশীলনী`, ref: `ws-${cat.index}`,
      rows: [
        `<b>ক.</b> ${ws.blanks.map((b) => `${bn(b.n)}. ${esc(b.answer)}`).join(' · ')}`,
        `<b>খ.</b> ${ws.matchKey.map((m) => `${esc(m.left)} → ${esc(m.right)}`).join(' · ')}`,
      ],
    });
  }
  if (cat.quiz?.length) {
    const qs = cat.quiz.map((q, i) => {
      const p = promptHtml(q.prompt);
      return block(`<div class="q"><span class="num">${bn(i + 1)}.</span><div><div>${p.html}</div><div class="opts">${q.options.map((o, k) => `<span class="opt"><span class="o">${OPT[k]}</span>${esc(o)}</span>`).join('')}</div></div></div>`);
    });
    sections.push({
      id: `qz-${cat.index}`, cont: `${cat.name} · যাচাই`,
      parts: [
        secHead(`${label} · যাচাই`, cat.name, 'প্রতিটি বর্ণনা কোনটির, চারটি নামের মধ্য থেকে বেছে গোলটা ভরাট করো। আগে কার্ড না দেখে চেষ্টা করো।', nameBar()),
        group('mcq', qs),
        block(`<div class="score">পেলাম <i></i> / ${bn(cat.quiz.length)}</div>`),
      ],
    });
    keys.push({
      title: `${label} · ${cat.name} · যাচাই`, ref: `qz-${cat.index}`,
      rows: [cat.quiz.map((q, i) => `${bn(i + 1)}. <b>${OPT[q.answer]}</b> ${esc(q.options[q.answer])}`).join(' · ')],
    });
  }
  return sections;
}

/* ---------------- missions on paper ---------------- */
function solveBuild(spec) {
  const pool = spec.pool.map((p, i) => ({ ...p, i })).filter((p) => p.tags.length);
  const need = spec.need.map((x) => x.tag);
  let best = null;
  const n = pool.length;
  for (let mask = 1; mask < (1 << n); mask++) {
    const pick = pool.filter((_, k) => mask & (1 << k));
    const cost = pick.reduce((s, p) => s + p.cost, 0);
    if (cost > spec.budget) continue;
    const tags = new Set(pick.flatMap((p) => p.tags));
    if (!need.every((t) => tags.has(t))) continue;
    // Use the budget well (a whole day, a full bag) but never pay for an item twice over.
    if (!best || cost > best.cost || (cost === best.cost && pick.length < best.pick.length)) best = { pick, cost };
  }
  return best;
}

const optList = (opts) => `<div class="opts">${opts.map((o, k) => `<span class="opt"><span class="o">${OPT[k]}</span>${esc(o)}</span>`).join('')}</div>`;

export function missionSections(world, keys) {
  const out = [];
  world.missions.forEach((m, mi) => {
    const s = m.spec;
    const id = `ms-${m.index}`;
    const seed = `${world.slug}:m${m.index}`;
    const head = secHead(`মিশন ${bn(mi + 1)} · কাগজে খেলো`, m.name, s.intro);
    const parts = [head];
    const krows = [];
    if (s.type === 'order') {
      parts.push(keep(`<p class="inst">প্রতিটি সারিতে ঠিক ক্রমে সাজাও: যেটা প্রথমে আসে তার ঘরে ১, তারপরেরটায় ২, এভাবে লেখো।</p>`));
      s.rounds.forEach((r, ri) => {
        const sh = shuffleMoved(r.chain, `${seed}:${ri}`);
        parts.push(block(`<p class="h3">${bn(ri + 1)}. ${esc(r.title)}</p><div class="ord">${sh.map((c) => `<span class="ordi"><span class="box"></span>${esc(c)}</span>`).join('')}</div>`));
        krows.push(`${bn(ri + 1)}. ${r.chain.map(esc).join(' → ')}${r.note ? `<br><span class="why">${esc(r.note)}</span>` : ''}`);
      });
    } else if (s.type === 'calc') {
      parts.push(keep(`<p class="inst">হিসাব করে উত্তর ঘরে লেখো। খসড়া করার জায়গা পাশে আছে।</p>`));
      parts.push(group('calc', s.rounds.map((r, ri) => block(`<div class="calc-q"><span class="num">${bn(ri + 1)}.</span><span>${esc(r.q)}</span><span class="calc-a"><i></i>${esc(r.unit ?? s.unit)}</span></div>`))));
      s.rounds.forEach((r, ri) => krows.push(`${bn(ri + 1)}. <b>${bn(r.a)} ${esc(r.unit ?? s.unit)}</b>${r.fact ? ` <span class="why">${esc(r.fact)}</span>` : ''}`));
    } else if (s.type === 'sort') {
      const items = shuffle(s.items, `${seed}:sort`);
      parts.push(keep(`<p class="inst">প্রতিটি জিনিস কোন দলে পড়ে, সেই ঘরে টিক দাও।</p>`));
      const head = `<div class="srow sh" style="--n:${s.buckets.length}"><span>জিনিস</span>${s.buckets.map((b) => `<span>${esc(b.name)}</span>`).join('')}</div>`;
      parts.push(group('sort', items.map((it) => block(`<div class="srow" style="--n:${s.buckets.length}"><span>${esc(it.name)}</span>${s.buckets.map(() => '<span><i class="tick"></i></span>').join('')}</div>`)), head));
      s.buckets.forEach((b, bi) => krows.push(`<b>${esc(b.name)}:</b> ${s.items.filter((it) => it.bucket === bi).map((it) => esc(it.name)).join(', ')}`));
      s.items.forEach((it) => krows.push(`<span class="why">${esc(it.name)}: ${esc(it.fact)}</span>`));
    } else if (s.type === 'identify') {
      parts.push(keep(`<p class="inst">সূত্র পড়ো${s.rounds.some((r) => r.art || r.big) ? ' আর ছবিটা দেখো' : ''}, তারপর ঠিক উত্তরের গোলটা ভরাট করো।</p>`));
      parts.push(group('ident', s.rounds.map((r, ri) => {
        const art = r.art ? `<svg viewBox="0 0 100 100" class="art">${r.art}</svg>`
          : r.big ? `<span class="big${r.shadow ? ' shadow' : ''}${Array.from(r.big).length > 2 ? ' word' : ''}">${esc(r.big)}</span>` : '';
        return block(`<div class="idq">${art ? `<div class="artbox">${art}</div>` : ''}<div><p><span class="num">${bn(ri + 1)}.</span> ${esc(r.clue)}</p>${optList(r.options)}</div></div>`);
      })));
      s.rounds.forEach((r, ri) => krows.push(`${bn(ri + 1)}. <b>${OPT[r.options.indexOf(r.answer)] ?? ''} ${esc(r.answer)}</b>${r.fact ? ` <span class="why">${esc(r.fact)}</span>` : ''}`));
      if (s.caption) parts.push(block(`<p class="small muted">${esc(s.caption)}</p>`));
    } else if (s.type === 'choice') {
      parts.push(keep(`<p class="inst">প্রতিটি অবস্থায় সবচেয়ে ভালো উত্তরটা বেছে গোল ভরাট করো। কেন বেছে নিলে, বড় কাউকে বলো।</p>`));
      parts.push(group('mcq', s.rounds.map((r, ri) => {
        const opts = shuffle(r.options, `${seed}:${ri}`);
        const good = opts.findIndex((o) => o.good);
        krows.push(`${bn(ri + 1)}. <b>${OPT[good]} ${esc(opts[good].text)}</b> <span class="why">${esc(opts[good].why)}</span>`);
        return block(`<div class="q"><span class="num">${bn(ri + 1)}.</span><div><div>${esc(r.situation)}</div><div class="opts one">${opts.map((o, k) => `<span class="opt"><span class="o">${OPT[k]}</span>${esc(o.text)}</span>`).join('')}</div></div></div>`);
      })));
    } else if (s.type === 'path') {
      const sh = shuffleMoved(s.stops.map((x) => x.name), `${seed}:path`);
      parts.push(keep(`<p class="inst">${esc(s.tokenName)} কোন পথে যায়? ধাপগুলো ঠিক ক্রমে সাজাও: প্রথম ধাপের ঘরে ১, তারপর ২, এভাবে।</p>`));
      parts.push(block(`<div class="ord">${sh.map((c) => `<span class="ordi"><span class="box"></span>${esc(c)}</span>`).join('')}</div>`));
      krows.push(`<b>${s.stops.map((x) => esc(x.name)).join(' → ')}</b>`);
      s.stops.forEach((x, i) => krows.push(`<span class="why">${bn(i + 1)}. ${esc(x.name)}: ${esc(x.fact)}</span>`));
    } else if (s.type === 'build') {
      parts.push(block(`<p class="inst">সীমা: <b>${esc(s.budgetLabel)} ${bn(s.budget)} ${esc(s.unit)}</b>। নিচের সব দরকার মেটাতে হবে: ${s.need.map((x) => esc(x.label)).join(', ')}। যা নেবে তার পাশে টিক দাও, তারপর মোট যোগ করো।</p>`));
      parts.push(group('build', s.pool.map((p) => block(`<div class="brow"><i class="tick"></i><span>${esc(p.name)}</span><b>${bn(p.cost)} ${esc(s.unit)}</b></div>`))));
      parts.push(block(`<div class="score">মোট <i></i> ${esc(s.unit)}</div>`));
      const best = solveBuild(s);
      s.need.forEach((nd) => krows.push(`<b>${esc(nd.label)}:</b> ${s.pool.filter((x) => x.tags.includes(nd.tag)).map((x) => esc(x.name)).join(' বা ')}`));
      if (best) krows.push(`একটি ঠিক উত্তর: <b>${best.pick.map((p) => esc(p.name)).join(', ')}</b> (মোট ${bn(best.cost)} ${esc(s.unit)})। সীমার মধ্যে থেকে সব দরকার মেটালে অন্য সাজও ঠিক।`);
      s.pool.filter((p) => p.warn).forEach((p) => krows.push(`<span class="why">${esc(p.name)}: ${esc(p.warn)}</span>`));
      if (s.note) krows.push(`<span class="why">${esc(s.note)}</span>`);
    } else {
      return;
    }
    out.push({ id, cont: `মিশন · ${m.name}`, flow: mi > 0, parts: mi > 0 ? [block('<div class="sep"></div>'), ...parts] : parts });
    keys.push({ title: `মিশন ${bn(mi + 1)} · ${m.name}`, ref: id, rows: krows });
  });
  return out;
}

/* ---------------- answer key ---------------- */
export function keySection(keys) {
  return {
    id: 'key', cont: 'উত্তরপত্র',
    parts: [
      secHead('বড়দের জন্য', 'উত্তরপত্র', 'শিশু নিজে চেষ্টা করার পরে মেলান। প্রতিটি অংশের পাশে লেখা পৃষ্ঠায় কাজটি আছে।'),
      ...keys.map((k) => block(`<div class="key"><p class="h3">${esc(k.title)} <span class="muted small">(পৃষ্ঠা <span data-toc="${esc(k.ref)}"></span>)</span></p>${k.rows.map((r) => `<p class="row">${r}</p>`).join('')}</div>`)),
    ],
  };
}

/* ---------------- cover & contents ---------------- */
export function coverHtml(pack, world, stats) {
  const deco = `<svg class="cv-deco" viewBox="0 0 200 200"><circle cx="150" cy="50" r="70" fill="none" stroke="var(--c)" stroke-width="2.5" opacity=".55"/><circle cx="150" cy="50" r="48" fill="none" stroke="var(--c)" stroke-width="1.4" opacity=".4"/><circle cx="150" cy="50" r="26" fill="var(--c)" opacity=".14"/></svg>`;
  return `<div class="cv">${deco}
  <div class="cv-top"><span class="cv-brand">পসরা</span><span class="cv-site">posora.com</span></div>
  <div class="cv-main">
    <p class="cv-world">${esc(world.bn)} ভুবন</p>
    <h1 class="cv-title">${esc(pack.title)}</h1>
    <p class="cv-hook">${esc(pack.hook)}</p>
    <p class="cv-age"><span class="tag">বয়স ${esc(pack.audience.split('·')[0].trim())}</span> <span class="muted">${esc(pack.audience.split('·').slice(1).join('·').trim())}</span></p>
    <div class="cv-stats">${stats.map(([n, l]) => `<div><b>${esc(n)}</b><span>${esc(l)}</span></div>`).join('')}</div>
  </div>
  <div class="cv-owner"><span>এই প্যাকটি যার</span><i></i></div>
  <div class="cv-foot"><span>পসরা · ${esc(world.bn)}</span><span>পৃষ্ঠা ১</span></div>
</div>`;
}

export function tocSection(rows) {
  const row = (r) => r.kind === 'cat'
    ? block(`<div class="trow"><b>${esc(r.n)}</b><span>${esc(r.label)}</span><span class="pg"><span data-toc="rd-${r.index}"></span></span><span class="pg">${r.ws ? `<span data-toc="ws-${r.index}"></span>` : '-'}</span><span class="pg">${r.qz ? `<span data-toc="qz-${r.index}"></span>` : '-'}</span></div>`)
    : block(`<div class="trow"><b>${esc(r.n ?? '')}</b><span>${esc(r.label)}</span><span class="pg"><span data-toc="${esc(r.ref)}"></span></span><span class="pg"></span><span class="pg"></span></div>`);
  return {
    id: 'toc', cont: 'সূচিপত্র',
    parts: [
      secHead('এই প্যাকে যা আছে', 'সূচিপত্র', 'সংখ্যাগুলো পৃষ্ঠা নম্বর। পুরো প্যাক একসঙ্গে ছাপার দরকার নেই, আজ যে পাতাগুলো লাগবে শুধু সেগুলো ছাপুন।'),
      group('toc', rows.map(row), `<div class="trow th"><b></b><span>অংশ</span><span class="pg">পড়ো / শুরু</span><span class="pg">অনুশীলনী</span><span class="pg">যাচাই</span></div>`),
      block(`<div class="legend"><p class="h3">প্রতিটি বিভাগে তিন রকম পাতা</p><p><b>পড়ো:</b> আসল তথ্যের কার্ড। পড়ো, কেটে নাও, খেলো।</p><p><b>অনুশীলনী:</b> শব্দের ঝুড়ি থেকে শূন্যস্থান পূরণ আর দাগ টেনে মেলানো।</p><p><b>যাচাই:</b> বহুনির্বাচনী প্রশ্ন। সব উত্তর প্যাকের শেষে উত্তরপত্রে, কাজের পাতার পেছনে নয়।</p><p><b>★ চিহ্নের পাতা</b> এই ভুবনের বিশেষ কাজ, <b>ম</b> চিহ্নের পাতা কাগজে খেলার মিশন।</p></div>`),
    ],
  };
}

export const WORLD_CSS = String.raw`
.cv{position:relative;height:100%;padding:16mm 16mm 9mm;display:flex;flex-direction:column;border:0}
.cv::before{content:'';position:absolute;inset:7mm;border:1.6pt solid var(--c);border-radius:6mm;pointer-events:none}
.cv-deco{position:absolute;right:7mm;top:7mm;width:95mm;height:95mm}
.cv-top{display:flex;justify-content:space-between;align-items:center;font-size:11pt;position:relative}
.cv-brand{font-size:18pt;font-weight:800;color:var(--c)}
.cv-site{color:#5b6475}
.cv-main{margin-top:52mm;display:flex;flex-direction:column;gap:5mm;position:relative}
.cv-world{font-size:14pt;font-weight:700;color:var(--c)}
.cv-title{font-size:34pt;line-height:1.2;font-weight:800;margin:0;color:#141b2b}
.cv-hook{font-size:15pt;color:#3a4356}
.cv-age{font-size:12pt;display:flex;gap:3mm;align-items:center}
.cv-age .tag{font-size:11pt}
.cv-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-top:8mm}
.cv-stats div{border:1pt solid color-mix(in srgb,var(--c) 45%,#fff);border-radius:3mm;padding:3.4mm 4mm;display:flex;flex-direction:column}
.cv-stats b{font-size:20pt;color:var(--c);line-height:1.2}
.cv-stats span{font-size:11pt;color:#3a4356}
.cv-intro{font-size:12pt;color:#3a4356;line-height:1.65;border-left:1.6mm solid color-mix(in srgb,var(--c) 45%,#fff);padding-left:4mm;margin-top:4mm}
.cv-owner{margin-top:auto;display:flex;gap:4mm;align-items:flex-end;font-size:13pt;font-weight:700;padding:0 2mm 8mm;position:relative}
.cv-owner i{flex:1;border-bottom:1.2pt solid #4c5568;height:9mm}
.cv-foot{display:flex;justify-content:space-between;font-size:9pt;color:#5b6475;padding:0 2mm;position:relative}
.g.toc{display:flex;flex-direction:column;border:.8pt solid #d7dbe3;border-radius:2mm;overflow:hidden}
.trow{display:grid;grid-template-columns:12mm 1fr 24mm 24mm 24mm;border-top:.8pt solid #e1e4ea;align-items:center}
.trow>*{padding:1.6mm 2.4mm}
.trow b{color:var(--c);text-align:center}
.trow .pg{text-align:center;font-weight:700;border-left:.8pt solid #e1e4ea}
.trow.th{background:color-mix(in srgb,var(--c) 10%,#fff);font-weight:800;border-top:0;font-size:10.5pt}
.legend{border:1pt solid #d7dbe3;border-radius:3mm;padding:3mm 4mm;display:flex;flex-direction:column;gap:1mm}
.sep{border-top:1.2pt solid #e1e4ea;margin:1mm 0 2mm}
.ord{display:flex;flex-wrap:wrap;gap:3mm 5mm;margin-top:1.6mm}
.ordi{display:inline-flex;align-items:center;gap:2mm;border:1pt solid #c9ced8;border-radius:2mm;padding:1.4mm 3mm 1.4mm 1.4mm}
.ordi .box{width:8mm;height:8mm}
.g.calc{display:flex;flex-direction:column;gap:2.6mm}
.calc-q{display:grid;grid-template-columns:7mm 1fr 44mm;gap:2mm;align-items:center}
.calc-a{display:flex;gap:2mm;align-items:flex-end}
.calc-a i{flex:1;border:1.2pt solid #4c5568;border-radius:1.6mm;height:9mm}
.g.sort{display:flex;flex-direction:column;border:.8pt solid #c9ced8;border-radius:2mm;overflow:hidden}
.srow{display:grid;grid-template-columns:2fr repeat(var(--n),1fr);border-top:.8pt solid #e1e4ea}
.srow span{padding:1.6mm 2.6mm;display:flex;align-items:center;justify-content:center;border-left:.8pt solid #e1e4ea}
.srow span:first-child{justify-content:flex-start;border-left:0}
.srow.sh{background:color-mix(in srgb,var(--c) 10%,#fff);font-weight:800;border-top:0}
.tick{display:inline-block;width:6mm;height:6mm;border:1pt solid #4c5568;border-radius:1.2mm;flex:none}
.g.ident{display:grid;grid-template-columns:1fr 1fr;gap:4mm}
.idq{display:flex;gap:3mm;border:1pt solid #d7dbe3;border-radius:3mm;padding:3mm}
.idq .opts{display:grid;grid-template-columns:1fr 1fr;gap:1.2mm 3mm;margin-top:1.6mm}
.idq .opt{display:flex;gap:1.6mm;align-items:center}
.idq .opt .o{width:5.6mm;height:5.6mm;border:1pt solid #4c5568;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:9pt;flex:none}
.artbox{width:24mm;height:24mm;flex:none;display:flex;align-items:center;justify-content:center;border-radius:2mm;background:#f6f7f9;color:#2c3445;--muted:#5b6475;--ink:#1d2433;--line:#c9ced8}
.artbox .art{width:22mm;height:22mm;fill:color-mix(in srgb,var(--c) 75%,#1d2433)}
.artbox .big{font-size:26pt;line-height:1}
.artbox .big.word{font-size:13pt;font-weight:800}
.artbox .big.shadow{filter:brightness(0)}
.opts.one{grid-template-columns:1fr !important}
.g.build{display:grid;grid-template-columns:1fr 1fr;gap:2mm 5mm}
.brow{display:flex;gap:2.4mm;align-items:center;border-bottom:.8pt solid #e1e4ea;padding:1.4mm 0}
.brow b{margin-left:auto;white-space:nowrap}
`;
