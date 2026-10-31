/**
 * Shared building blocks for the paid PDF packs: escaping, Bangla digits, the
 * seeded shuffle, the print stylesheet and the in-page paginator.
 *
 * Every document is written as a flat list of sections. A section is a list
 * of blocks and block groups. The paginator runs inside headless Chrome after
 * the Bangla font has loaded, pours the blocks into fixed A4 pages and opens a
 * new page whenever the next block would not fit, so nothing is ever cut off
 * at a page edge however long a category's reading is. It then numbers every
 * page and fills the table of contents from where each section really landed.
 */
import path from 'node:path';

export const esc = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const bn = (n) => String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
/** Bangla digits back to a JS number, for the figures stored as display text. */
export const fromBn = (s) => Number(String(s).replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d))).replace(/,/g, ''));

export const OPT = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'];

export function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function rng(seed) {
  let a = (typeof seed === 'string' ? hash(seed) : seed) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle(arr, seed) {
  const r = rng(seed);
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
/** A shuffle that never leaves the list in its original order (so an ordering task is never pre-solved). */
export function shuffleMoved(arr, seed) {
  if (arr.length < 2) return arr.slice();
  for (let k = 0; k < 20; k++) {
    const s = shuffle(arr, `${seed}:${k}`);
    if (s.some((v, i) => v !== arr[i])) return s;
  }
  return arr.slice().reverse();
}

/* ---------- document model ----------
 * doc = { lang, title, world, color, landscape?, sections: [section] }
 * section = { id, toc?, label?, cont?, cover?, flow?: boolean, parts: [part] }
 *   cover: raw HTML of a full page (not paginated).
 *   flow: true lets the section continue on the current page instead of a new one.
 *   cont: short running title shown on continuation pages.
 * part = string (one block) | { group: 'cls', head?: html, blocks: [html] }
 * A block whose HTML has class "keep" travels to the next page with whatever follows it.
 */
export const block = (html, cls = '') => `<div class="blk ${cls}">${html}</div>`;
export const keep = (html, cls = '') => `<div class="blk keep ${cls}">${html}</div>`;
export const group = (cls, blocks, head = '') => ({ group: cls, head, blocks });
/**
 * A dashed cut line around a card. CSS dashed borders print as thousands of
 * tiny path segments (a few MB per pack); one dashed SVG rect costs bytes.
 */
export const cutFrame = '<svg class="cut" aria-hidden="true"><rect x="0" y="0" width="100%" height="100%" rx="10" ry="10" fill="none" stroke="#9aa3b3" stroke-width="1.2" stroke-dasharray="5 4"/></svg>';

export function renderDoc(doc, root) {
  const fontUrl = `file://${path.join(root, 'public/fonts/noto-sans-bengali-400-800.95b2d88278.woff2')}`;
  const secs = doc.sections.map((s) => {
    if (s.cover) return `<section class="src-sec" data-id="${esc(s.id)}" data-cover="1">${s.cover}</section>`;
    const parts = s.parts.map((p) => typeof p === 'string' ? p
      : `<div class="grp" data-cls="${esc(p.group)}">${p.head ? `<template class="ghead">${p.head}</template>` : ''}${p.blocks.join('')}</div>`).join('');
    return `<section class="src-sec" data-id="${esc(s.id)}" data-flow="${s.flow ? 1 : 0}" data-cont="${esc(s.cont ?? '')}">${parts}</section>`;
  }).join('\n');
  return `<!doctype html><html lang="bn"><head><meta charset="utf-8"><title>${esc(doc.title)}</title>
<style>@font-face{font-family:PosoraBangla;src:url('${fontUrl}') format('woff2');font-weight:400 800;font-display:block}
${CSS}
:root{--c:${doc.color};}
${doc.landscape ? '@page{size:A4 landscape;margin:0}.page{width:297mm;height:210mm}' : ''}
${doc.css ?? ''}
</style></head><body>
<div id="src">${secs}</div>
<div id="out"></div>
<template id="tpl-page"><div class="page"><div class="run"><span class="run-l"><b>পসরা</b> · ${esc(doc.world)}</span><span class="run-r"></span></div><div class="body"></div><div class="foot"><span>পসরা · ${esc(doc.world)}</span><span class="pno"></span></div></div></template>
<script>${PAGINATOR}</script>
</body></html>`;
}

const PAGINATOR = String.raw`
window.__paginate = function () {
  const src = document.getElementById('src');
  const out = document.getElementById('out');
  const tpl = document.getElementById('tpl-page');
  const toc = {};
  const errors = [];
  let page = null, body = null;
  const fits = () => body.scrollHeight <= body.clientHeight + 1 && body.scrollWidth <= body.clientWidth + 1;
  function newPage(cont) {
    page = tpl.content.firstElementChild.cloneNode(true);
    body = page.querySelector('.body');
    page.querySelector('.run-r').textContent = cont || '';
    out.append(page);
  }
  // Move trailing "keep" blocks (headings, instructions) along with the block that did not fit.
  function carry() {
    const moved = [];
    let last = body.lastElementChild;
    while (last && last.classList.contains('keep') && last !== body.firstElementChild) { moved.unshift(last); last.remove(); last = body.lastElementChild; }
    return moved;
  }
  for (const sec of Array.from(src.children)) {
    const id = sec.dataset.id;
    if (sec.dataset.cover) {
      const p = document.createElement('div'); p.className = 'page cover-page'; p.innerHTML = sec.innerHTML; out.append(p);
      page = null; body = null; toc[id] = out.children.length; continue;
    }
    const cont = sec.dataset.cont;
    if (!page || sec.dataset.flow !== '1') newPage(cont);
    toc[id] = out.children.length;
    for (const part of Array.from(sec.children)) {
      if (part.classList.contains('grp')) {
        const cls = part.dataset.cls;
        const headTpl = part.querySelector('template.ghead');
        const mk = () => { const w = document.createElement('div'); w.className = 'g ' + cls; if (headTpl) w.append(headTpl.content.cloneNode(true)); return w; };
        let wrap = mk(); body.append(wrap);
        let count = 0;
        for (const b of Array.from(part.children).filter((x) => !x.matches('template'))) {
          wrap.append(b); count++;
          if (!fits()) {
            b.remove(); count--;
            let carried = [];
            if (count === 0) { wrap.remove(); carried = carry(); }
            newPage(cont);
            for (const c of carried) body.append(c);
            wrap = mk(); body.append(wrap); wrap.append(b); count = 1;
            if (!fits()) errors.push('block too tall in ' + id + ': ' + b.textContent.slice(0, 60));
          }
        }
        if (count === 0) wrap.remove();
      } else {
        body.append(part);
        if (!fits()) {
          part.remove();
          const carried = carry();
          newPage(cont);
          for (const c of carried) body.append(c);
          body.append(part);
          if (!fits()) errors.push('block too tall in ' + id + ': ' + part.textContent.slice(0, 60));
        }
      }
    }
  }
  src.remove();
  const pages = Array.from(out.children);
  const bnd = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
  pages.forEach((p, i) => { const n = p.querySelector('.pno'); if (n) n.textContent = 'পৃষ্ঠা ' + bnd(i + 1) + ' / ' + bnd(pages.length); });
  document.querySelectorAll('[data-toc]').forEach((el) => { const n = toc[el.dataset.toc]; el.textContent = n ? bnd(n) : '?'; if (!n) errors.push('toc target missing: ' + el.dataset.toc); });
  document.querySelectorAll('[data-toc-range]').forEach((el) => {
    const [a, b] = el.dataset.tocRange.split('|');
    const s = toc[a]; const e = b ? (toc[b] ? toc[b] - 1 : pages.length) : null;
    el.textContent = s ? (e && e > s ? bnd(s) + '-' + bnd(e) : bnd(s)) : '?';
  });
  // A final overflow sweep over every page, covers included.
  pages.forEach((p, i) => {
    const bd = p.querySelector('.body') || p;
    if (bd.scrollHeight > bd.clientHeight + 1) errors.push('overflow on page ' + (i + 1));
  });
  return { pages: pages.length, toc, errors };
};`;

const CSS = String.raw`
@page{size:A4;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff;color:#1d2433;font-family:PosoraBangla,'Noto Sans Bengali',sans-serif;font-size:11.5pt;line-height:1.55;-webkit-print-color-adjust:exact;print-color-adjust:exact}
#src{position:absolute;left:-9999px;top:0;width:180mm;visibility:hidden}
.page{width:210mm;height:297mm;position:relative;overflow:hidden;display:flex;flex-direction:column;padding:11mm 14mm 9mm;background:#fff;break-after:page;page-break-after:always}
.page:last-child{break-after:auto;page-break-after:auto}
.run{display:flex;justify-content:space-between;align-items:center;font-size:9pt;color:#5b6475;border-bottom:1.2pt solid var(--c);padding-bottom:1.6mm;margin-bottom:4mm;min-height:6mm}
.run b{color:var(--c)}
.body{flex:1;overflow:hidden;display:flex;flex-direction:column;gap:3.2mm;min-height:0}
.foot{display:flex;justify-content:space-between;font-size:9pt;color:#5b6475;border-top:.6pt solid #d7dbe3;padding-top:1.6mm;margin-top:3mm}
.blk{break-inside:avoid}
.body>*{flex-shrink:0}
h1,h2,h3,p{margin:0}
.eyebrow{font-size:10pt;font-weight:700;color:var(--c);letter-spacing:.02em}
.h1{font-size:21pt;font-weight:800;line-height:1.25;color:#141b2b}
.h2{font-size:15pt;font-weight:800;line-height:1.3;color:#141b2b}
.h3{font-size:12.5pt;font-weight:800;color:#141b2b}
.lede{font-size:11.5pt;color:#3a4356}
.muted{color:#5b6475}
.small{font-size:10pt}
.tint{background:color-mix(in srgb,var(--c) 9%,#fff)}
.sec-head{border-left:2.4mm solid var(--c);padding:1mm 0 1mm 4mm;display:flex;flex-direction:column;gap:1mm}
.namebar{display:flex;gap:6mm;font-size:10.5pt;color:#3a4356;align-items:flex-end}
.namebar span{flex:1;display:flex;gap:2mm;align-items:flex-end}
.namebar i{flex:1;border-bottom:.8pt solid #9aa3b3;height:5mm}
.pill{display:inline-block;border:.8pt solid color-mix(in srgb,var(--c) 55%,#fff);color:#2c3445;border-radius:99px;padding:.2mm 2.6mm;font-size:10pt;line-height:1.5;margin:0 1.4mm 1.4mm 0;background:#fff}
.tag{display:inline-block;background:var(--c);color:#fff;border-radius:2mm;padding:.3mm 2.4mm;font-size:9.5pt;font-weight:700}
/* fact cards */
.g.cards{display:grid;grid-template-columns:1fr 1fr;gap:4mm}
.cut{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.card{border-radius:3mm;padding:3.4mm 4mm;display:flex;flex-direction:column;gap:1.6mm;position:relative}
.card .nm{font-size:14pt;font-weight:800;color:#141b2b;line-height:1.3;border-bottom:1.6pt solid var(--c);padding-bottom:1mm}
.card .l1{font-size:11.5pt;line-height:1.55}
.card .fun{font-size:11pt;line-height:1.5;background:color-mix(in srgb,var(--c) 9%,#fff);border-radius:2mm;padding:1.6mm 2.4mm}
.card .fun b{color:var(--c)}
.card .chips{line-height:1.3}
.card .snip{position:absolute;top:-3.2mm;right:4mm;background:#fff;padding:0 1mm;font-size:9pt;color:#8a93a3}
/* worksheet */
.bank{border:1.2pt solid var(--c);border-radius:3mm;padding:2.4mm 3.4mm}
.bank .h3{font-size:11pt;margin-bottom:1mm}
.bl{display:grid;grid-template-columns:7mm 1fr;gap:2mm;padding:1.4mm 0}
.num{font-weight:800;color:var(--c)}
.blank{display:inline-block;min-width:32mm;border-bottom:1pt solid #4c5568;height:1em;vertical-align:baseline}
.ansline{display:flex;gap:2mm;align-items:flex-end;margin-top:1.2mm;font-size:10.5pt;color:#5b6475}
.ansline i{flex:1;border-bottom:1pt solid #4c5568;height:6mm;max-width:85mm}
.match{display:flex;flex-direction:column;gap:2.4mm;margin-top:2.4mm}
.mrow{display:grid;grid-template-columns:1fr 40mm 1fr;align-items:center;min-height:11mm}
.mrow .l,.mrow .r{border:1pt solid #c9ced8;border-radius:2mm;padding:1.4mm 3mm;display:flex;align-items:center;gap:2mm;font-size:11.5pt}
.mrow .l::after{content:'';margin-left:auto;width:2.4mm;height:2.4mm;border-radius:50%;background:var(--c);flex:none}
.mrow .r::before{content:'';width:2.4mm;height:2.4mm;border-radius:50%;background:var(--c);flex:none}
.g.mcq{display:flex;flex-direction:column;gap:3.2mm}
.q{display:grid;grid-template-columns:8mm 1fr;gap:1.6mm}
.q .opts{display:grid;grid-template-columns:1fr 1fr;gap:1.2mm 6mm;margin-top:1.4mm}
.q .opt{display:flex;gap:2mm;align-items:center;font-size:11.5pt}
.q .opt .o{width:5.6mm;height:5.6mm;border:1pt solid #4c5568;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:9pt;flex:none}
.score{display:flex;justify-content:flex-end;gap:2mm;font-weight:700;align-items:center}
.score i{display:inline-block;width:22mm;border-bottom:1pt solid #4c5568;height:6mm}
.box{display:inline-block;width:9mm;height:9mm;border:1.2pt solid #4c5568;border-radius:1.6mm;vertical-align:middle;flex:none}
.inst{font-size:11pt;color:#3a4356;background:#f5f6f8;border-radius:2mm;padding:1.8mm 3mm}
/* tables */
table{border-collapse:collapse;width:100%}
td,th{border:.8pt solid #c9ced8;padding:1.4mm 2.4mm;text-align:left;vertical-align:middle;font-size:11pt}
th{background:color-mix(in srgb,var(--c) 10%,#fff);font-weight:800}
/* answer key */
.key{border-top:.8pt solid #d7dbe3;padding-top:2mm;font-size:11pt;line-height:1.6}
.key .h3{font-size:11.5pt;margin-bottom:.6mm}
.key .row{margin:.4mm 0}
.key .row b{color:var(--c)}
.key .why{color:#3a4356}
/* cover */
.cover-page{padding:0;display:block}
`;
