import type { Lab } from '../lab-types';

/** A leaf drawn once, used by the plant scenes. */
const leaf = (cx: number, cy: number, rot: number, fill = '#5aa356') =>
  `<g transform="translate(${cx} ${cy}) rotate(${rot})"><path d="M0 0 C34 -16 62 4 58 24 C30 38 2 22 0 0Z" fill="${fill}"/><path d="M2 2 L56 22" stroke="#2f6b32" stroke-width="1.6" fill="none" stroke-opacity=".7"/></g>`;

const labs: Lab[] = [
  {
    world: 'life', cat: 0,
    lede: 'একটা গাছের প্রতিটা অংশের আলাদা কাজ আছে - কোনোটা পানি টানে, কোনোটা খাবার বানায়, কোনোটা পরের গাছটাকে বয়ে নিয়ে যায়। নিচের ছবিতে নামগুলো নিজের হাতে বসাও।',
    cards: [
      {
        kind: 'place',
        item: 'কাণ্ড',
        n: 'গাছের নয়টা অংশ',
        how: 'ডান পাশ থেকে একটা নাম বাছো, তারপর ছবিতে চাপো সেটা যেখানে আছে। ভুল জায়গায় চাপলে ছবিটা বলে দেবে সেখানে আসলে কী আছে।',
        view: [440, 320],
        art: `
          <path d="M6 258 H238" stroke="var(--line)" stroke-width="2" fill="none"/>
          <path d="M118 258 C112 278 96 288 72 298" stroke="#8a6a46" stroke-width="6" stroke-linecap="round" fill="none"/>
          <path d="M126 258 C124 282 116 296 106 312" stroke="#8a6a46" stroke-width="6" stroke-linecap="round" fill="none"/>
          <path d="M134 258 C142 278 158 288 180 296" stroke="#8a6a46" stroke-width="6" stroke-linecap="round" fill="none"/>
          <path d="M114 258 L119 150 L137 150 L142 258 Z" fill="#8a6a46"/>
          <path d="M124 180 L80 148" stroke="#8a6a46" stroke-width="8" stroke-linecap="round" fill="none"/>
          <path d="M132 170 L184 140" stroke="#8a6a46" stroke-width="8" stroke-linecap="round" fill="none"/>
          <circle cx="128" cy="104" r="54" fill="#4d8f4a"/>
          <circle cx="82" cy="128" r="32" fill="#59a055"/>
          <circle cx="180" cy="124" r="34" fill="#59a055"/>
          <g transform="translate(152 84)"><circle r="9" fill="#f2d049"/><circle cx="-13" r="7" fill="#e88fb0"/><circle cx="13" r="7" fill="#e88fb0"/><circle cy="-13" r="7" fill="#e88fb0"/><circle cy="13" r="7" fill="#e88fb0"/><circle r="4.5" fill="#c98f1f"/></g>
          <circle cx="192" cy="140" r="12" fill="#e0a33c" stroke="#b8842c" stroke-width="2"/>
          <path d="M192 128 L196 120" stroke="#6b4a2a" stroke-width="2.5" stroke-linecap="round"/>
          <text x="292" y="20" font-size="10.5" text-anchor="middle" fill="var(--muted)">পাতা কাছ থেকে</text>
          <path d="M262 34 C312 50 328 96 296 120 C262 100 250 58 262 34Z" fill="#5aa356"/>
          <path d="M265 38 L294 116" stroke="#2f6b32" stroke-width="2.4" fill="none"/>
          <path d="M271 56 L296 50 M277 74 L306 70 M283 92 L308 90" stroke="#2f6b32" stroke-width="1.4" fill="none" stroke-opacity=".8"/>
          <text x="300" y="140" font-size="10.5" text-anchor="middle" fill="var(--muted)">ফল কেটে দেখা</text>
          <circle cx="300" cy="184" r="34" fill="#e8b04a"/>
          <circle cx="300" cy="184" r="25" fill="#f5dfa8"/>
          <ellipse cx="300" cy="180" rx="6" ry="9" fill="#6b4a2a"/>
          <ellipse cx="288" cy="194" rx="6" ry="9" fill="#6b4a2a" transform="rotate(-24 288 194)"/>
          <ellipse cx="312" cy="194" rx="6" ry="9" fill="#6b4a2a" transform="rotate(24 312 194)"/>
          <text x="302" y="240" font-size="10.5" text-anchor="middle" fill="var(--muted)">কাণ্ডের গা</text>
          <rect x="262" y="248" width="80" height="60" rx="8" fill="#8a6a46"/>
          <path d="M276 252 L272 304 M292 250 L296 306 M312 252 L308 304 M326 254 L330 302" stroke="#6b4a2a" stroke-width="3" stroke-linecap="round" fill="none"/>
        `,
        zones: [
          { n: 'মূল', item: 'মূল', x: 104, y: 288, r: 24, note: 'মাটির নিচে ছড়িয়ে থাকে। পানি আর খনিজ টেনে তোলে, আর গাছটাকে ঝড়ে পড়ে যেতে দেয় না।' },
          { n: 'কাণ্ড', item: 'কাণ্ড', x: 128, y: 214, r: 22, note: 'গাছের পাইপলাইন। নিচ থেকে পানি উপরে যায়, পাতা থেকে বানানো খাবার নিচে নামে।' },
          { n: 'শাখা', item: 'শাখা', x: 92, y: 156, r: 18, note: 'কাণ্ড থেকে বেরোনো ডাল। পাতাগুলোকে ছড়িয়ে রাখে যাতে প্রত্যেকটা রোদ পায়।' },
          { n: 'ফুল', item: 'ফুল', x: 152, y: 84, r: 18, note: 'গাছের বংশবিস্তারের অংশ। পরাগ এখানেই তৈরি হয়, আর এখানেই এসে বসে মৌমাছি।' },
          { n: 'ফল', item: 'ফল', x: 192, y: 140, r: 18, note: 'ফুল থেকেই ফল হয়। ফলের কাজ বীজটাকে ঢেকে রাখা আর কাউকে দিয়ে দূরে পাঠানো।' },
          { n: 'পাতা', item: 'পাতা', x: 278, y: 52, r: 18, note: 'গাছের রান্নাঘর। রোদ, পানি আর বাতাসের কার্বন ডাই-অক্সাইড দিয়ে এখানে খাবার তৈরি হয়।' },
          { n: 'শিরা', item: 'শিরা', x: 306, y: 96, r: 16, note: 'পাতার ভেতরের সরু নালি। পানি এখান দিয়েই পাতার প্রতিটি কোণে পৌঁছায়, আর পাতাটাকে শক্তও রাখে।' },
          { n: 'বীজ', item: 'বীজ', x: 300, y: 184, r: 16, note: 'ফলের ভেতরের ছোট্ট প্যাকেট। এর ভেতরে পরের গাছটা আর তার প্রথম কয়েক দিনের খাবার গোছানো থাকে।' },
          { n: 'ছাল', item: 'ছাল', x: 302, y: 272, r: 18, note: 'কাণ্ডের বাইরের শক্ত আবরণ। রোদ, পোকা আর আঘাত থেকে ভেতরের নরম অংশটা বাঁচায়।' },
        ],
      },
    ],
  },
  {
    world: 'life', cat: 1,
    lede: 'গাছ নড়ে না বলে মনে হয় কিছুই করছে না। আসলে সারাক্ষণ পানি টানছে, খাবার বানাচ্ছে, বাতাস ছাড়ছে আর আলোর দিকে ঘুরছে। কোন কাজটা গাছের কোন জায়গায় হয়, সেটাই নিচে বসাতে হবে।',
    cards: [
      {
        kind: 'place',
        item: 'খাদ্য তৈরি',
        n: 'কোন কাজ কোথায় হয়',
        how: 'একটা কাজের নাম বাছো, তারপর চারাটার যে জায়গায় সেটা হয় সেখানে চাপো।',
        view: [420, 320],
        art: `
          <circle cx="352" cy="44" r="24" fill="#f2c33c"/>
          <path d="M352 8 V-2 M352 90 V100 M316 44 H306 M398 44 H388 M327 19 L320 12 M377 69 L384 76 M377 19 L384 12 M327 69 L320 76" stroke="#f2c33c" stroke-width="3" stroke-linecap="round" fill="none"/>
          <path d="M330 66 L268 100 M330 74 L250 132" stroke="#f2c33c" stroke-width="2" stroke-dasharray="5 5" fill="none" stroke-opacity=".8"/>
          <rect x="0" y="250" width="420" height="70" fill="#a98357" fill-opacity=".35"/>
          <path d="M6 250 H414" stroke="var(--line)" stroke-width="2" fill="none"/>
          <path d="M200 252 C198 200 190 130 210 74" stroke="#5f8f43" stroke-width="9" stroke-linecap="round" fill="none"/>
          <path d="M198 252 C176 268 142 276 96 282" stroke="#8a6a46" stroke-width="5" stroke-linecap="round" fill="none"/>
          <path d="M202 252 C206 274 214 290 208 312" stroke="#8a6a46" stroke-width="5" stroke-linecap="round" fill="none"/>
          <path d="M204 252 C228 266 262 276 292 284" stroke="#8a6a46" stroke-width="5" stroke-linecap="round" fill="none"/>
          ${leaf(196, 148, 168)}
          ${leaf(216, 100, -18)}
          ${leaf(214, 180, -6)}
          <path d="M282 158 C288 144 282 132 288 120 M300 162 C306 148 300 136 306 124" stroke="#8fc2e8" stroke-width="2.4" stroke-linecap="round" fill="none"/>
          <path d="M206 132 L206 200" stroke="#c98f1f" stroke-width="2" stroke-dasharray="4 4" fill="none"/>
          <path d="M206 200 l-4 -8 l8 0 Z" fill="#c98f1f"/>
          <text x="60" y="300" font-size="10.5" fill="var(--muted)">মাটি</text>
        `,
        zones: [
          { n: 'পানি টানা', item: 'পানি টানা', x: 106, y: 278, r: 20, note: 'মূলের সরু লোমগুলো মাটি থেকে পানি চুষে নেয়, আর সেই পানি কাণ্ড বেয়ে উপরে ওঠে।' },
          { n: 'শিকড় কেন ছড়ায়', item: 'শিকড় কেন ছড়ায়', x: 264, y: 280, r: 20, note: 'যত চওড়া শিকড়, তত বেশি মাটি থেকে পানি পাওয়া যায় - আর ঝড়ে গাছটা তত শক্ত করে দাঁড়িয়ে থাকে।' },
          { n: 'সালোকসংশ্লেষণ', item: 'সালোকসংশ্লেষণ', x: 252, y: 100, r: 20, note: 'রোদ পড়ছে যে পাতায়, সেখানেই। সবুজ ক্লোরোফিল আলো ধরে, আর পানি ও কার্বন ডাই-অক্সাইড মিলে চিনি তৈরি হয়।' },
          { n: 'খাদ্য তৈরি', item: 'খাদ্য তৈরি', x: 206, y: 196, r: 18, note: 'বানানো চিনি কাণ্ড বেয়ে নিচে নামে - শিকড়, ফুল আর ফল সবাই এই খাবারেই বাঁচে।' },
          { n: 'শ্বসন', item: 'শ্বসন', x: 168, y: 152, r: 18, note: 'গাছও শ্বাস নেয়, দিনরাত। বানানো খাবার পুড়িয়ে শক্তি বের করে - এই কাজে অক্সিজেন লাগে, ঠিক আমাদের মতো।' },
          { n: 'প্রস্বেদন', item: 'প্রস্বেদন', x: 296, y: 142, r: 18, note: 'পাতার গায়ের ছোট ফুটো দিয়ে পানি বাষ্প হয়ে উড়ে যায়। এই টানেই নিচ থেকে নতুন পানি উঠে আসে।' },
          { n: 'আলোর দিকে বাঁকা', item: 'আলোর দিকে বাঁকা', x: 210, y: 76, r: 18, note: 'কাণ্ডের আগা আলোর দিকে ঘুরে যায়। ছায়ার দিকের কোষগুলো বেশি লম্বা হয়, তাই গাছটা রোদের দিকে হেলে পড়ে।' },
        ],
      },
    ],
  },
  {
    world: 'life', cat: 2,
    lede: 'একটা বীজ থেকে গাছ, গাছ থেকে ফুল, ফুল থেকে আবার বীজ - চক্রটা কোথাও থামে না। চাকাটা ঘুরিয়ে দেখো কোন ধাপের পর কোনটা আসে।',
    cards: [
      {
        kind: 'cycle',
        item: 'বীজ',
        n: 'গাছের জীবনচক্র',
        how: 'পরের ধাপে চাপো, বা চাকার যেকোনো ধাপে সরাসরি চাপো। শেষ ধাপের পর আবার প্রথমটা আসবে - সেটাই চক্র।',
        stages: [
          { n: 'বীজ', item: 'বীজ', e: '🌰', span: 'অপেক্ষা: কয়েক দিন থেকে কয়েক বছর', note: 'ভেতরে ছোট্ট একটা চারা আর তার প্রথম খাবার গুছিয়ে রাখা। পানি, বাতাস আর উষ্ণতা না পাওয়া পর্যন্ত সে ঘুমিয়ে থাকে - কোনো কোনো বীজ বছরের পর বছর।' },
          { n: 'অঙ্কুরোদ্গম', item: 'অঙ্কুরোদ্গম', e: '🌱', span: 'সাধারণত ৩ থেকে ১০ দিন', note: 'বীজ পানি টেনে ফুলে ওঠে, খোসা ফাটে। প্রথমে বেরোয় শিকড়, নিচের দিকে - তারপর কাণ্ড, উপরের দিকে। এই পুরো সময়টা সে বীজের ভেতরের খাবারেই চলে।' },
          { n: 'চারা', item: 'চারা', e: '🪴', span: 'প্রথম পাতা গজানোর পর', note: 'প্রথম সবুজ পাতা বেরোনোর মুহূর্তটাই আসল মোড়: এখন থেকে সে নিজের খাবার নিজে বানায়। বীজের জমানো খাবার শেষ, রোদই এখন ভরসা।' },
          { n: 'পূর্ণ গাছ', item: 'পূর্ণ গাছ', e: '🌳', span: 'আমগাছে ৫ থেকে ৮ বছর', note: 'কাণ্ড মোটা হয়, শিকড় ছড়ায়, ডালে ডালে পাতা। যথেষ্ট বড় হলে তবেই গাছ ফুল ধরার শক্তি পায় - তার আগে নয়।' },
          { n: 'পরাগায়ন', item: 'পরাগায়ন', e: '🌸', span: 'ফুল ফোটার কয়েক দিনের ভেতর', note: 'এক ফুলের পরাগ অন্য ফুলে পৌঁছালে বীজ তৈরি শুরু হয়। বাতাস কিছু কাজ করে, কিন্তু বেশিরভাগ কাজটা করে পোকা আর পাখি।' },
          { n: 'বীজ ছড়ানো', item: 'বীজ ছড়ানো', e: '🍃', span: 'যত দূরে, তত ভালো', note: 'মা-গাছের নিচেই পড়লে চারা ছায়ায় মরে যায়। তাই বীজ ভেসে যায় পানিতে, ওড়ে বাতাসে, বা পাখি খেয়ে দূরে গিয়ে ফেলে - আর সেখান থেকে চক্রটা আবার শুরু।' },
        ],
      },
      {
        kind: 'place',
        item: 'মৌমাছি',
        n: 'পরাগ কে বয়ে নেয়, আর কলম কী',
        how: 'নাম বাছো, তারপর বাগানের ছবিতে দেখাও।',
        view: [420, 260],
        art: `
          <rect x="0" y="196" width="420" height="64" fill="#6a9a4e" fill-opacity=".3"/>
          <path d="M6 196 H414" stroke="var(--line)" stroke-width="2" fill="none"/>
          <path d="M84 196 V120" stroke="#5f8f43" stroke-width="7" stroke-linecap="round" fill="none"/>
          <g transform="translate(84 108)"><circle r="12" fill="#f2d049"/><circle cx="-17" r="9" fill="#e8748f"/><circle cx="17" r="9" fill="#e8748f"/><circle cy="-17" r="9" fill="#e8748f"/><circle cy="17" r="9" fill="#e8748f"/></g>
          <path d="M214 196 V128" stroke="#5f8f43" stroke-width="7" stroke-linecap="round" fill="none"/>
          <g transform="translate(214 116)"><circle r="12" fill="#f2d049"/><circle cx="-17" r="9" fill="#b98fe0"/><circle cx="17" r="9" fill="#b98fe0"/><circle cy="-17" r="9" fill="#b98fe0"/><circle cy="17" r="9" fill="#b98fe0"/></g>
          <g transform="translate(104 74)"><ellipse rx="11" ry="8" fill="#e8b73c"/><path d="M-8 -2 h16" stroke="#3a2b12" stroke-width="2.6"/><path d="M-3 -2 h6" stroke="#3a2b12" stroke-width="2.6"/><ellipse cx="-2" cy="-9" rx="9" ry="5" fill="#dfeaf6" fill-opacity=".85"/></g>
          <g transform="translate(238 84)"><path d="M0 0 C-16 -20 -30 -16 -26 2 C-22 16 -8 12 0 0Z" fill="#e07a4a"/><path d="M0 0 C16 -20 30 -16 26 2 C22 16 8 12 0 0Z" fill="#e07a4a"/><path d="M0 -4 V10" stroke="#3a2b12" stroke-width="2.4"/></g>
          <path d="M332 196 V96" stroke="#8a6a46" stroke-width="10" stroke-linecap="round" fill="none"/>
          <path d="M332 132 L376 100" stroke="#5f8f43" stroke-width="7" stroke-linecap="round" fill="none"/>
          <rect x="318" y="120" width="28" height="26" rx="5" fill="#d8cbb4" stroke="#9c8c70" stroke-width="2"/>
          <path d="M320 124 h24 M320 132 h24 M320 140 h24" stroke="#9c8c70" stroke-width="1.6" fill="none"/>
          ${leaf(376, 92, -22)}
          <text x="332" y="224" font-size="10.5" text-anchor="middle" fill="var(--muted)">জোড়া লাগানো ডাল</text>
        `,
        zones: [
          { n: 'মৌমাছি', item: 'মৌমাছি', x: 104, y: 74, r: 20, note: 'মধু নিতে এসে গায়ে পরাগ মেখে ফেলে, তারপর পরের ফুলে গিয়ে সেটা ঝেড়ে দেয়। পরাগায়নের সবচেয়ে বড় কাজটা এরাই করে - আমাদের খাবারের একটা বড় অংশ এদের উপরেই দাঁড়িয়ে।' },
          { n: 'প্রজাপতি', item: 'প্রজাপতি', x: 238, y: 84, r: 20, note: 'লম্বা শুঁড় দিয়ে ফুলের গভীর থেকে মধু টানে। মৌমাছির চেয়ে কম পরাগ বয়, কিন্তু অনেক দূরের ফুলে যায় - তাই দূরের গাছগুলোকে এরাই মেলায়।' },
          { n: 'কলম করা', item: 'কলম করা', x: 332, y: 132, r: 20, note: 'এক গাছের ডাল কেটে আরেক গাছের কাণ্ডে জোড়া লাগানো। বীজ ছাড়াই নতুন গাছ, আর ফলটা হয় ঠিক যে গাছ থেকে ডাল নেওয়া হয়েছিল তারই মতো - তাই ভালো আমগাছের বংশ হুবহু রাখা যায়।' },
        ],
      },
    ],
  },
];

export default labs;
