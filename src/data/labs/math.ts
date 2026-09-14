import type { Lab } from '../lab-types';
import { bn } from '../../lib/bn';

/** Greatest common divisor, for showing a fraction in its simplest form. */
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const frac = (l: number, h: number) => `${bn(l)}/${bn(h)}`;

const labs: Lab[] = [
  {
    world: 'math', cat: 2,
    n: 'ভগ্নাংশ নেড়ে দেখো',
    lede: 'ভগ্নাংশ, দশমিক আর শতকরা - তিনটা আলাদা জিনিস নয়, একই জিনিস বলার তিন রকম উপায়। হাতল টেনে দেখো তিনটাই একসঙ্গে বদলায়।',
    cards: [
      {
        kind: 'scrub',
        item: 'অর্ধেক',
        n: 'এক টুকরো কতটা',
        how: 'হরটা বদলালে গোটাটা কয় টুকরো হবে ঠিক হয়, লবটা বদলালে তুমি কয় টুকরো নিচ্ছ। নিচে একই জিনিস তিনভাবে লেখা দেখবে।',
        also: ['এক-তৃতীয়াংশ', 'সমতুল ভগ্নাংশ', 'দশমিক', 'শতকরা'],
        source: 'দশমিক = লব ÷ হর। শতকরা = দশমিক × ১০০। সরলতম রূপ বের করা হয়েছে গসাগু দিয়ে ভাগ করে।',
        knobs: [
          { k: 'hor', n: 'গোটাটা কয় টুকরো (হর)', min: 2, max: 12, step: 1, value: 2, unit: 'টুকরো' },
          { k: 'lob', n: 'তুমি নিচ্ছ (লব)', min: 0, max: 12, step: 1, value: 1, unit: 'টুকরো' },
        ],
        compute: (v) => {
          const hor = v.hor!;
          const lob = Math.min(v.lob!, hor);
          const d = lob / hor;
          const g = gcd(lob || hor, hor) || 1;
          const simple = frac(lob / g, hor / g);
          const name = lob / hor === 0.5 ? 'অর্ধেক' : lob / hor === 1 / 3 ? 'এক-তৃতীয়াংশ' : lob / hor === 0.25 ? 'এক-চতুর্থাংশ' : lob === hor ? 'গোটাটাই' : null;
          return {
            lines: [
              { n: 'ভগ্নাংশ', v: frac(lob, hor) },
              { n: 'দশমিক', v: bn(d.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')) },
              { n: 'শতকরা', v: `${bn((d * 100).toFixed(1).replace(/\.0$/, ''))}%` },
            ],
            bars: [
              { n: 'নেওয়া', frac: d, hue: 'var(--w)', v: frac(lob, hor) },
              { n: 'বাকি', frac: 1 - d, hue: '#8a8f99', v: frac(hor - lob, hor) },
            ],
            say: lob === 0
              ? `<b>কিছুই নাওনি।</b> লব শূন্য মানে শূন্য - হর যাই হোক।<span class="lk-note">লবের হাতলটা টানো।</span>`
              : simple !== frac(lob, hor)
                ? `${frac(lob, hor)} আর <b>${simple}</b> একই জিনিস - এদের বলে সমতুল ভগ্নাংশ।${name ? ` একেই বলে ${name}।` : ''}<span class="lk-note">লব আর হরকে একই সংখ্যা দিয়ে ভাগ করলে ভগ্নাংশের মান বদলায় না, শুধু লেখাটা ছোট হয়। এখানে দুটোকেই ${bn(g)} দিয়ে ভাগ করা হয়েছে।</span>`
                : `<b>${frac(lob, hor)}</b> এটাই সবচেয়ে সরল রূপ${name ? `, আর একেই বলে ${name}` : ''}।<span class="lk-note">লব আর হরের সাধারণ ভাজক ১ ছাড়া কিছু নেই, তাই আর ছোট করা যায় না।</span>`,
          };
        },
      },
      {
        kind: 'scrub',
        item: 'তুলনা',
        n: 'দুটো ভগ্নাংশ পাশাপাশি',
        how: 'দুটো ভগ্নাংশ বানাও। কোনটা বড়, আর যোগ-বিয়োগ করলে কত হয় - দুটোই নিচে দেখা যাবে।',
        also: ['যোগ-বিয়োগ'],
        source: 'তুলনা আর যোগ-বিয়োগ দুটোই করা হয়েছে হর দুটোর গুণফলকে সাধারণ হর ধরে।',
        knobs: [
          { k: 'l1', n: 'প্রথমটির লব', min: 1, max: 9, step: 1, value: 1, unit: '' },
          { k: 'h1', n: 'প্রথমটির হর', min: 2, max: 10, step: 1, value: 2, unit: '' },
          { k: 'l2', n: 'দ্বিতীয়টির লব', min: 1, max: 9, step: 1, value: 1, unit: '' },
          { k: 'h2', n: 'দ্বিতীয়টির হর', min: 2, max: 10, step: 1, value: 3, unit: '' },
        ],
        compute: (v) => {
          const l1 = v.l1!, h1 = v.h1!, l2 = v.l2!, h2 = v.h2!;
          const a = l1 / h1, b = l2 / h2;
          const hor = h1 * h2;
          const sumL = l1 * h2 + l2 * h1, difL = l1 * h2 - l2 * h1;
          const gs = gcd(Math.abs(sumL) || hor, hor) || 1, gd = gcd(Math.abs(difL) || hor, hor) || 1;
          return {
            lines: [
              { n: 'প্রথমটি', v: `${frac(l1, h1)} = ${bn(a.toFixed(2))}` },
              { n: 'দ্বিতীয়টি', v: `${frac(l2, h2)} = ${bn(b.toFixed(2))}` },
              { n: 'যোগফল', v: frac(sumL / gs, hor / gs) },
              { n: 'বিয়োগফল', v: (difL < 0 ? '−' : '') + frac(Math.abs(difL) / gd, hor / gd) },
            ],
            bars: [
              { n: 'প্রথমটি', frac: a, hue: 'var(--w)', v: frac(l1, h1) },
              { n: 'দ্বিতীয়টি', frac: b, hue: '#c9822f', v: frac(l2, h2) },
            ],
            say: a === b
              ? `<b>${frac(l1, h1)} আর ${frac(l2, h2)} সমান।</b> দেখতে আলাদা, মান এক - সমতুল ভগ্নাংশ।<span class="lk-note">দাগ দুটোর দৈর্ঘ্যও সমান, সেটাই প্রমাণ।</span>`
              : `<b>${a > b ? frac(l1, h1) : frac(l2, h2)} বড়।</b><span class="lk-note">হর আলাদা হলে চোখে দেখে বলা যায় না। দুটোকে একই হরে আনতে হয়: এখানে ${frac(l1, h1)} = ${frac(l1 * h2, hor)} আর ${frac(l2, h2)} = ${frac(l2 * h1, hor)}। এখন শুধু লব দুটো মিলিয়ে দেখো।</span>`,
          };
        },
      },
      {
        kind: 'scrub',
        item: 'অনুপাত',
        n: 'অনুপাতে ভাগ',
        how: 'মোট কতটা আর কোন অনুপাতে ভাগ হবে, টেনে ঠিক করো। দুই ভাগে কত পড়ে তা নিচে।',
        source: 'এক ভাগ = মোট ÷ (ক + খ)। তারপর যে যত ভাগ, তাকে তত গুণ।',
        knobs: [
          { k: 'mot', n: 'মোট', min: 10, max: 500, step: 5, value: 60, unit: 'টা' },
          { k: 'ka', n: 'প্রথম জনের ভাগ', min: 1, max: 9, step: 1, value: 3, unit: 'ভাগ' },
          { k: 'kha', n: 'দ্বিতীয় জনের ভাগ', min: 1, max: 9, step: 1, value: 2, unit: 'ভাগ' },
        ],
        compute: (v) => {
          const mot = v.mot!, ka = v.ka!, kha = v.kha!;
          const ekbhag = mot / (ka + kha);
          const a = ekbhag * ka, b = ekbhag * kha;
          const clean = Number.isInteger(ekbhag);
          return {
            lines: [
              { n: 'অনুপাত', v: `${bn(ka)} ঃ ${bn(kha)}` },
              { n: 'প্রথম জন', v: bn(clean ? a : a.toFixed(1)) },
              { n: 'দ্বিতীয় জন', v: bn(clean ? b : b.toFixed(1)) },
            ],
            bars: [
              { n: 'প্রথম জন', frac: ka / (ka + kha), hue: 'var(--w)', v: bn(clean ? a : a.toFixed(1)) },
              { n: 'দ্বিতীয় জন', frac: kha / (ka + kha), hue: '#c9822f', v: bn(clean ? b : b.toFixed(1)) },
            ],
            say: clean
              ? `মোট ভাগ ${bn(ka)} + ${bn(kha)} = <b>${bn(ka + kha)}</b>, তাই এক ভাগ = ${bn(mot)} ÷ ${bn(ka + kha)} = <b>${bn(ekbhag)}</b>।<span class="lk-note">অনুপাত ভাগের নিয়ম সব সময় এই দুই ধাপ: আগে মোট ভাগ গোনো, তারপর এক ভাগ বের করো।</span>`
              : `${bn(mot)}-কে ${bn(ka + kha)} ভাগে ঠিকঠাক ভাগ করা যায় না - এক ভাগ দাঁড়ায় ${bn(ekbhag.toFixed(2))}।<span class="lk-note">বাস্তবে মার্বেল বা টাকার মতো জিনিস আধা ভাগ করা যায় না। মোট বা অনুপাত একটু বদলে দেখো কোথায় মিলে যায়।</span>`,
          };
        },
      },
    ],
  },
];

export default labs;
