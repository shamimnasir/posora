import type { Lab } from '../lab-types';
import { bn } from '../../lib/bn';

/** Money is always whole taka here, and always in Bangla numerals. */
const tk = (n: number) => `${bn(Math.round(n))} টাকা`;

const labs: Lab[] = [
  {
    world: 'money', cat: 2,
    n: 'বাজেট বানাও',
    lede: 'বাজেট মানে টাকা কমানো নয়, টাকাটা কোথায় যাবে সেটা আগেই ঠিক করে রাখা। নিচে একটা মাস সাজাও, আর দেখো মাস শেষে কী থাকে।',
    cards: [
      {
        kind: 'balance',
        item: 'মাসিক বাজেট',
        n: 'মাসটা সাজাও',
        how: 'একটা মাস বাছো, তারপর নিচের খরচগুলোয় চাপো - ট্রেতে উঠে যাবে। প্রতিটা ঘর অন্তত একবার ভরতে হবে, আর মোট খরচ আয়ের ভেতরে রাখতে হবে।',
        budget: { amount: 12000, unit: 'টাকা', label: 'মাসের আয়' },
        unit: 'টা',
        groups: [
          { k: 'sthayi', n: 'স্থায়ী খরচ', hue: '#4a7fc1' },
          { k: 'poribortonshil', n: 'পরিবর্তনশীল', hue: '#c9822f' },
          { k: 'sonchoy', n: 'সঞ্চয়', hue: '#3f9a6a' },
        ],
        rounds: [
          { k: 'sadharon', n: 'সাধারণ মাস', item: 'মাসিক বাজেট', want: { sthayi: 2, poribortonshil: 2, sonchoy: 1 }, note: 'স্থায়ী খরচ প্রতি মাসে একই - ভাড়া, বিল, স্কুলের বেতন। পরিবর্তনশীল খরচ কম-বেশি হয়। আর সঞ্চয়টা খরচের পর যা থাকে তা নয়, আগেই সরিয়ে রাখা একটা খরচ।' },
          { k: 'ghatti', n: 'অসুখের মাস', item: 'ঘাটতি', want: { sthayi: 2, poribortonshil: 3, sonchoy: 1 }, note: 'হঠাৎ ওষুধের খরচ যোগ হলে বাজেটে টান পড়ে। খরচ আয়ের বেশি হয়ে গেলে তাকে বলে ঘাটতি - আর ঘাটতি মেটাতেই মানুষ ধার করে।' },
          { k: 'uddritto', n: 'ভালো মাস', item: 'উদ্বৃত্ত', want: { sthayi: 2, poribortonshil: 1, sonchoy: 2 }, note: 'খরচ কম হলে যা বেঁচে যায় তাকে বলে উদ্বৃত্ত। উদ্বৃত্ত পড়ে থাকলে খরচ হয়ে যায় - তাই সেটাকে সঞ্চয়ে সরিয়ে ফেলাই নিয়ম।' },
        ],
        pool: [
          { n: 'বাড়িভাড়া', e: '🏠', g: 'sthayi', cost: 5000 },
          { n: 'বিদ্যুৎ ও পানির বিল', e: '💡', g: 'sthayi', cost: 1200 },
          { n: 'স্কুলের বেতন', e: '🎒', g: 'sthayi', cost: 1500 },
          { n: 'বাজার-সদাই', e: '🛒', g: 'poribortonshil', cost: 3000 },
          { n: 'যাতায়াত', e: '🚌', g: 'poribortonshil', cost: 800 },
          { n: 'ওষুধ', e: '💊', g: 'poribortonshil', cost: 700 },
          { n: 'জামাকাপড়', e: '👕', g: 'poribortonshil', cost: 900 },
          { n: 'বাইরে খাওয়া', e: '🍟', g: 'poribortonshil', cost: 600 },
          { n: 'জরুরি তহবিলে', e: '🫙', g: 'sonchoy', cost: 1000 },
          { n: 'লক্ষ্যের জন্য জমা', e: '🎯', g: 'sonchoy', cost: 800 },
        ],
      },
      {
        kind: 'scrub',
        item: 'ঘাটতি',
        n: 'মাস শেষে কী থাকে',
        how: 'আয় আর খরচের হাতলগুলো টানো। নিচের সংখ্যাগুলো নিজে নিজে বদলে যাবে - সবই সরাসরি হিসাব, আন্দাজ নয়।',
        also: ['স্থায়ী খরচ', 'পরিবর্তনশীল খরচ', 'উদ্বৃত্ত', 'খরচের খাতা'],
        source: 'সব সংখ্যাই তোমার দেওয়া তিনটি হাতল থেকে কষা: বাকি = আয় − স্থায়ী − পরিবর্তনশীল।',
        knobs: [
          { k: 'ay', n: 'মাসের আয়', min: 6000, max: 30000, step: 500, value: 12000, unit: 'টাকা' },
          { k: 'sthayi', n: 'স্থায়ী খরচ', min: 2000, max: 20000, step: 500, value: 7000, unit: 'টাকা' },
          { k: 'chol', n: 'পরিবর্তনশীল খরচ', min: 1000, max: 20000, step: 500, value: 4000, unit: 'টাকা' },
        ],
        compute: (v) => {
          const ay = v.ay!, sthayi = v.sthayi!, chol = v.chol!;
          const khoroch = sthayi + chol;
          const baki = ay - khoroch;
          const har = ay ? (baki / ay) * 100 : 0;
          const mash = baki > 0 ? Math.ceil(20000 / baki) : 0;
          return {
            lines: [
              { n: 'মোট খরচ', v: tk(khoroch) },
              { n: baki >= 0 ? 'মাস শেষে বাকি' : 'ঘাটতি', v: tk(Math.abs(baki)) },
              { n: 'সঞ্চয়ের হার', v: `${bn(har.toFixed(0))}%` },
            ],
            bars: [
              { n: 'স্থায়ী', frac: ay ? sthayi / ay : 0, hue: '#4a7fc1', v: tk(sthayi) },
              { n: 'পরিবর্তনশীল', frac: ay ? chol / ay : 0, hue: '#c9822f', v: tk(chol) },
              { n: baki >= 0 ? 'বাকি' : 'ঘাটতি', frac: ay ? Math.abs(baki) / ay : 0, hue: baki >= 0 ? '#3f9a6a' : '#c2493d', v: tk(Math.abs(baki)) },
            ],
            say: baki < 0
              ? `<b>ঘাটতি ${tk(-baki)}।</b> খরচ আয়ের চেয়ে বেশি, তাই এই মাসটা ধার বা জমানো টাকা ছাড়া চলবে না।<span class="lk-note">ঘাটতি প্রতি মাসে চলতে থাকলে ধারটাই জমে ওঠে। প্রথমে পরিবর্তনশীল খরচ কমানো সহজ - স্থায়ী খরচ কমাতে বড় সিদ্ধান্ত লাগে।</span>`
              : baki === 0
                ? `<b>ঠিক মিলে গেছে।</b> এক টাকাও বাকি নেই।<span class="lk-note">মিলে যাওয়া নিরাপদ শোনায়, কিন্তু একটা অসুখ বা একটা ভাঙা জিনিসই বাজেটটা ভেঙে দেবে। কিছু বাকি থাকা দরকার।</span>`
                : `<b>উদ্বৃত্ত ${tk(baki)}</b>, আয়ের ${bn(har.toFixed(0))} শতাংশ।<span class="lk-note">এই হারে জমালে ${bn(20000)} টাকার একটা লক্ষ্যে পৌঁছাতে ${bn(mash)} মাস লাগবে। উদ্বৃত্ত পড়ে থাকলে খরচ হয়ে যায় - মাসের শুরুতেই সরিয়ে রাখা ভালো।</span>`,
          };
        },
      },
    ],
  },
  {
    world: 'money', cat: 5,
    n: 'সুদ নিজে কষো',
    lede: 'সুদ মানে টাকার ভাড়া। যে ধার দেয় সে ভাড়া নেয়, যে জমা রাখে সে ভাড়া পায়। হাতলগুলো টেনে দেখো সংখ্যাটা কত দ্রুত বদলায় - বিশেষ করে চক্রবৃদ্ধিতে।',
    cards: [
      {
        kind: 'scrub',
        item: 'চক্রবৃদ্ধি সুদ',
        n: 'সরল না চক্রবৃদ্ধি',
        how: 'আসল, হার আর বছর টেনে বদলাও। দুটো হিসাব পাশাপাশি চলবে - সরল সুদে প্রতি বছর একই অঙ্ক, চক্রবৃদ্ধিতে সুদের ওপরেও সুদ।',
        also: ['সরল সুদ'],
        source: 'সরল সুদ = আসল × হার × বছর। চক্রবৃদ্ধি = আসল × (১ + হার)^বছর − আসল।',
        knobs: [
          { k: 'asol', n: 'আসল', min: 500, max: 100000, step: 500, value: 10000, unit: 'টাকা' },
          { k: 'har', n: 'বছরে সুদের হার', min: 1, max: 40, step: 1, value: 12, unit: '%' },
          { k: 'bochor', n: 'কত বছর', min: 1, max: 30, step: 1, value: 5, unit: 'বছর' },
        ],
        compute: (v) => {
          const asol = v.asol!, r = v.har! / 100, n = v.bochor!;
          const sorol = asol * r * n;
          const chokro = asol * Math.pow(1 + r, n) - asol;
          const bhag = sorol ? chokro / sorol : 1;
          return {
            lines: [
              { n: 'সরল সুদ', v: tk(sorol) },
              { n: 'চক্রবৃদ্ধি সুদ', v: tk(chokro) },
              { n: 'চক্রবৃদ্ধিতে মোট', v: tk(asol + chokro) },
            ],
            bars: [
              { n: 'আসল', frac: asol / (asol + chokro), hue: '#6b7a8f', v: tk(asol) },
              { n: 'সরল সুদ', frac: sorol / (asol + chokro), hue: '#c9822f', v: tk(sorol) },
              { n: 'চক্রবৃদ্ধি সুদ', frac: chokro / (asol + chokro), hue: '#3f9a6a', v: tk(chokro) },
            ],
            say: n === 1
              ? `<b>এক বছরে দুটো সমান।</b> চক্রবৃদ্ধির সুবিধা শুরুই হয় দ্বিতীয় বছর থেকে, যখন প্রথম বছরের সুদের ওপরেও সুদ বসে।<span class="lk-note">বছরের হাতলটা টেনে বাড়াও - তফাতটা তখনই খুলতে শুরু করবে।</span>`
              : `${bn(n)} বছরে চক্রবৃদ্ধি সুদ সরল সুদের <b>${bn(bhag.toFixed(2))} গুণ</b>।<span class="lk-note">জমালে চক্রবৃদ্ধি তোমার পক্ষে কাজ করে, ধার করলে তোমার বিপক্ষে। ঋণের হার যত চড়া আর মেয়াদ যত লম্বা, ফাঁদটা তত গভীর।</span>`,
          };
        },
      },
      {
        kind: 'scrub',
        item: 'কিস্তি',
        n: 'কিস্তির আসল দাম',
        how: 'নগদ দাম, কিস্তির সংখ্যা আর প্রতি কিস্তির অঙ্ক টেনে বদলাও। বাড়তি টাকাটাই কিস্তির দাম।',
        also: ['ঋণ কী'],
        source: 'মোট = কিস্তি × সংখ্যা। বাড়তি = মোট − নগদ দাম। বাড়তির হার = বাড়তি ÷ নগদ দাম।',
        knobs: [
          { k: 'nogod', n: 'নগদে দাম', min: 1000, max: 80000, step: 500, value: 12000, unit: 'টাকা' },
          { k: 'kisti', n: 'কয় কিস্তি', min: 2, max: 36, step: 1, value: 12, unit: 'কিস্তি' },
          { k: 'mashik', n: 'প্রতি কিস্তি', min: 100, max: 8000, step: 50, value: 1150, unit: 'টাকা' },
        ],
        compute: (v) => {
          const nogod = v.nogod!, k = v.kisti!, m = v.mashik!;
          const mot = k * m;
          const barti = mot - nogod;
          const har = nogod ? (barti / nogod) * 100 : 0;
          return {
            lines: [
              { n: 'কিস্তিতে মোট', v: tk(mot) },
              { n: barti >= 0 ? 'বাড়তি দিতে হবে' : 'কম পড়ছে', v: tk(Math.abs(barti)) },
              { n: 'নগদের তুলনায়', v: `${bn(har.toFixed(0))}%` },
            ],
            bars: [
              { n: 'নগদ দাম', frac: mot ? nogod / mot : 0, hue: '#6b7a8f', v: tk(nogod) },
              { n: 'বাড়তি', frac: mot ? Math.max(0, barti) / mot : 0, hue: '#c2493d', v: tk(Math.max(0, barti)) },
            ],
            say: barti <= 0
              ? `<b>এই কিস্তিতে মোট ${tk(mot)}</b> - নগদ দামের চেয়ে কম। এমন প্রস্তাব বাস্তবে প্রায় থাকে না; সংখ্যাগুলো একবার মিলিয়ে দেখো।<span class="lk-note">দোকানে কিস্তির হিসাব নিজে কষে নেওয়াটাই সবচেয়ে কাজের অভ্যাস।</span>`
              : `${bn(k)} কিস্তিতে মোট ${tk(mot)} - নগদের চেয়ে <b>${tk(barti)} বেশি</b>, অর্থাৎ ${bn(har.toFixed(0))} শতাংশ।<span class="lk-note">কিস্তি জিনিসটা আজ হাতে এনে দেয়, বিনামূল্যে নয়। "মাসে মাত্র ${bn(m)} টাকা" শুনতে ছোট, কিন্তু গুণ করলেই আসল অঙ্কটা বেরিয়ে আসে।</span>`,
          };
        },
      },
    ],
  },
];

export default labs;
