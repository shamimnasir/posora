import type { GridCell, GridCard } from '../lab-types';

/**
 * The periodic table, in its real shape.
 *
 * Drawn as a dense list of 118 boxes a periodic table teaches nothing. Drawn
 * with its holes where they belong, the arrangement itself is the lesson: a
 * child can see that the columns are families and that the two long rows at
 * the bottom were lifted out to keep the thing on a page, long before anyone
 * uses the word "group".
 *
 * So the positions are computed from the standard rules rather than typed out,
 * and every one of the 118 boxes is drawn. Eighteen of them have something
 * written about them - the eighteen পসরা names in `worlds.ts` - and the rest
 * are shown as position and symbol only, unclickable. That is the honest way
 * to say "এখানে ১১৮টা ঘর আছে, আঠারোটার কথা লেখা হয়েছে".
 */
const SYMBOLS = (
  'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn ' +
  'Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd ' +
  'Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th ' +
  'Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'
).split(' ');

/** Where atomic number `z` sits in the eighteen-column table. */
function place(z: number): { row: number; col: number } {
  if (z === 1) return { row: 1, col: 1 };
  if (z === 2) return { row: 1, col: 18 };
  if (z <= 4) return { row: 2, col: z - 2 };
  if (z <= 10) return { row: 2, col: z + 8 };
  if (z <= 12) return { row: 3, col: z - 10 };
  if (z <= 18) return { row: 3, col: z };
  if (z <= 36) return { row: 4, col: z - 18 };
  if (z <= 54) return { row: 5, col: z - 36 };
  if (z <= 56) return { row: 6, col: z - 54 };
  // the f-block is lifted out and set below, which is what every printed table does
  if (z <= 71) return { row: 8, col: z - 54 };
  if (z <= 86) return { row: 6, col: z - 68 };
  if (z <= 88) return { row: 7, col: z - 86 };
  if (z <= 103) return { row: 9, col: z - 86 };
  return { row: 7, col: z - 100 };
}

const NOBLE = new Set([2, 10, 18, 36, 54, 86, 118]);
const NONMETAL = new Set([1, 6, 7, 8, 9, 15, 16, 17, 34, 35, 53]);
const METALLOID = new Set([5, 14, 32, 33, 51, 52, 84]);
const band = (z: number) =>
  NOBLE.has(z) ? 'noble' : NONMETAL.has(z) ? 'nonmetal' : METALLOID.has(z) ? 'metalloid' : 'metal';

/** The eighteen পসরা writes about, by atomic number. */
const NAMED: Record<number, { n: string; note: string }> = {
  1: { n: 'হাইড্রোজেন', note: 'সবচেয়ে হালকা আর সবচেয়ে সাধারণ মৌল - মহাবিশ্বের প্রায় তিন-চতুর্থাংশই এটা। সূর্যের ভেতরে হাইড্রোজেন জুড়ে হিলিয়াম হয়, আর সেখান থেকেই আসে সব আলো।' },
  2: { n: 'হিলিয়াম', note: 'বাতাসের চেয়ে হালকা, তাই বেলুন ওড়ে। রাসায়নিকভাবে প্রায় কিছুর সঙ্গেই জোড়া লাগে না - এই নিষ্ক্রিয়তাই ডান দিকের পুরো কলামটার পরিচয়।' },
  6: { n: 'কার্বন', note: 'প্রাণের ভিত। প্রতিটি জীবিত জিনিসের কাঠামো কার্বনের শেকল দিয়ে গড়া। একই পরমাণু সাজানোর তফাতে হয় হিরা, নয়তো পেনসিলের সিসা।' },
  7: { n: 'নাইট্রোজেন', note: 'বাতাসের ৭৮ শতাংশ। গাছের বাড়তে লাগে, কিন্তু বাতাস থেকে সরাসরি নিতে পারে না - তাই সারে নাইট্রোজেন দেওয়া হয়।' },
  8: { n: 'অক্সিজেন', note: 'বাতাসের ২১ শতাংশ, আর শ্বাসের পুরোটাই এর জন্য। পানির অণুর অর্ধেকও এটাই। আগুন জ্বলতেও এটা লাগে।' },
  11: { n: 'সোডিয়াম', note: 'পানিতে ফেললে জ্বলে ওঠে এমন নরম ধাতু। অথচ ক্লোরিনের সঙ্গে জুড়ে হয় খাবার লবণ - যৌগের গুণ যে উপাদানের মতো হয় না, এটাই তার সেরা উদাহরণ।' },
  12: { n: 'ম্যাগনেসিয়াম', note: 'হালকা ধাতু, আর পাতার সবুজ ক্লোরোফিলের কেন্দ্রে ঠিক এই পরমাণুটাই বসে থাকে। জ্বললে চোখধাঁধানো সাদা আলো দেয়।' },
  13: { n: 'অ্যালুমিনিয়াম', note: 'ভূত্বকের সবচেয়ে সাধারণ ধাতু। হালকা, মরিচা ধরে না, তাই রান্নার হাঁড়ি থেকে উড়োজাহাজ পর্যন্ত সবেতে।' },
  14: { n: 'সিলিকন', note: 'বালু আর কাচের মূল উপাদান, আর প্রতিটি কম্পিউটার চিপের ভিত্তি। ধাতু আর অধাতুর মাঝামাঝি - এই মাঝামাঝি গুণই একে চিপের উপযোগী করেছে।' },
  17: { n: 'ক্লোরিন', note: 'বিষাক্ত সবুজাভ গ্যাস, অল্প পরিমাণে পানি জীবাণুমুক্ত করতে ব্যবহার হয়। সোডিয়ামের সঙ্গে জুড়ে খাবার লবণ।' },
  26: { n: 'লোহা', note: 'পৃথিবীর কেন্দ্র মূলত লোহার, আর তার ঘূর্ণিই চৌম্বক ক্ষেত্র বানায় - যার জন্য কম্পাস কাজ করে। রক্তের লাল রংও লোহার জন্যই।' },
  29: { n: 'তামা', note: 'বিদ্যুৎ আর তাপ দুটোই দারুণ বয়। ঘরের তারের ভেতরে যা আছে তা প্রায় সবই তামা। খোলা বাতাসে সবুজ আস্তরণ পড়ে।' },
  30: { n: 'দস্তা', note: 'লোহার উপর দস্তার প্রলেপ দিলে মরিচা ধরে না - ঢেউটিনের গায়ের চকচকে ভাবটা এই কারণেই। শরীরেও সামান্য দস্তা লাগে।' },
  47: { n: 'রুপা', note: 'সব মৌলের মধ্যে বিদ্যুৎ সবচেয়ে ভালো বয় রুপা, তামার চেয়েও ভালো - কিন্তু দাম বেশি বলে তারে তামাই ব্যবহার হয়।' },
  79: { n: 'সোনা', note: 'মরিচা ধরে না, রং বদলায় না, প্রায় কিছুর সঙ্গেই বিক্রিয়া করে না। হাজার বছরের পুরনো সোনার গয়নাও নতুনের মতো থাকে - এই স্থায়িত্বই তার দামের কারণ।' },
  80: { n: 'পারদ', note: 'ঘরের তাপমাত্রায় তরল থাকা একমাত্র ধাতু। পুরনো থার্মোমিটারে ব্যবহার হতো, কিন্তু বিষাক্ত বলে এখন বেশিরভাগ জায়গায় বাদ দেওয়া হয়েছে।' },
  82: { n: 'সিসা', note: 'ভারী আর নরম ধাতু। একসময় রং আর পাইপে ব্যবহার হতো, পরে জানা যায় এটা বিষাক্ত - বিশেষ করে শিশুদের জন্য। এখন ব্যবহার কড়াভাবে নিয়ন্ত্রিত।' },
  92: { n: 'ইউরেনিয়াম', note: 'প্রকৃতিতে পাওয়া সবচেয়ে ভারী মৌলগুলোর একটা, আর তেজস্ক্রিয়। এর নিউক্লিয়াস ভেঙে যে শক্তি বেরোয়, পারমাণবিক বিদ্যুৎকেন্দ্র তাতেই চলে।' },
};

const cells: GridCell[] = Array.from({ length: 118 }, (_v, i) => {
  const z = i + 1;
  const at = place(z);
  const named = NAMED[z];
  return {
    row: at.row, col: at.col, k: SYMBOLS[i]!, no: z,
    band: band(z),
    ...(named ? { n: named.n, note: named.note, item: named.n } : {}),
  };
});

export const periodicTable: GridCard = {
  kind: 'grid',
  item: '… ১১৮টি মৌল',
  n: 'পর্যায় সারণি',
  how: 'যে ঘরগুলোর রং গাঢ়, সেগুলোয় চাপো - নিচে সেই মৌলের কথা আসবে। ফাঁকফোকরগুলো ভুল নয়, ওগুলোই সারণির আসল আকার।',
  rows: 9,
  cols: 18,
  cells,
  bands: [
    { k: 'metal', n: 'ধাতু', hue: '#c9822f' },
    { k: 'nonmetal', n: 'অধাতু', hue: '#3f9a6a' },
    { k: 'metalloid', n: 'অর্ধধাতু', hue: '#8a63c4' },
    { k: 'noble', n: 'নিষ্ক্রিয় গ্যাস', hue: '#4a7fc1' },
  ],
  intro: 'সারণিটা সাজানো পারমাণবিক সংখ্যার ক্রমে, বাঁ থেকে ডানে আর উপর থেকে নিচে। একই কলামের মৌলগুলো একই রকম আচরণ করে - ডান দিকের শেষ কলামটা পুরোটাই নিষ্ক্রিয় গ্যাস, আর বাঁ দিকের প্রথম কলামটা পানিতে ফেললে জ্বলে ওঠা ধাতু। নিচের দুটো আলাদা সারি আসলে ষষ্ঠ ও সপ্তম সারিরই অংশ, পাতায় আঁটাতে তুলে নামিয়ে রাখা হয়েছে।',
  source: 'অবস্থানগুলো প্রমিত আঠারো-কলামের সারণির নিয়ম থেকে হিসাব করা, হাতে বসানো নয়। ১১৮টি ঘরের সবকটাই আঁকা; এখন পর্যন্ত ১৮টির কথা লেখা হয়েছে, বাকিগুলো শুধু প্রতীক ও সংখ্যা।',
  also: ['মৌল'],
};
