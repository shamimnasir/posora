/**
 * Playable missions, keyed by world slug and index-aligned with `missions`
 * in worlds.ts. A `null` means that mission is not built yet, and the page
 * says so. Every mission is one of three game types the engine in
 * components/explorer/missions.ts knows how to run.
 */
export type OrderRound = { title: string; chain: string[]; emoji: string[]; note: string };
export type PathStop = { name: string; emoji: string; fact: string; choices: string[] };
export type IdRound = { answer: string; art: string; clue: string; options: string[]; fact: string };
export type Mission =
  | { type: 'order'; intro: string; rounds: OrderRound[] }
  | { type: 'path'; intro: string; token: string; tokenName: string; stops: PathStop[] }
  | { type: 'identify'; intro: string; caption: string; rounds: IdRound[] };

/* ---- simplified leaf drawings, 100 x 100, dark on transparent ---- */
const midrib = (d: string) => `<path d="${d}" fill="none" stroke="currentColor" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round"/>`;
const LEAF = {
  // আম: long, narrow, pointed at both ends
  aam: `<path d="M50 4 C72 26 74 62 50 96 C26 62 28 26 50 4Z"/>${midrib('M50 8 L50 92')}`,
  // কাঁঠাল: thick oval, widest above the middle, rounded tip
  kathal: `<path d="M50 6 C34 22 22 40 24 64 C26 84 38 95 50 95 C62 95 74 84 76 64 C78 40 66 22 50 6Z"/>${midrib('M50 10 L50 90')}`,
  // বট: broad oval with a long drip tip at the bottom
  bot: `<path d="M50 6 C76 12 84 46 62 76 C58 82 54 90 50 97 C46 90 42 82 38 76 C16 46 24 12 50 6Z"/>${midrib('M50 10 L50 92')}`,
  // তাল: a fan of stiff blades from one stalk
  taal: `<path d="M50 96 L14 44 L24 48 L18 22 L32 40 L36 10 L46 36 L50 4 L54 36 L64 10 L68 40 L82 22 L76 48 L86 44Z"/>`,
  // কৃষ্ণচূড়া: a feather of tiny leaflets along one stem
  krishnachura: `<path d="M50 6 L50 96" fill="none" stroke="currentColor" stroke-width="2"/>` +
    Array.from({ length: 11 }, (_v, i) => { const y = 14 + i * 7.4, w = 9 + Math.sin((i / 10) * Math.PI) * 26; return `<ellipse cx="${50 - w / 2 - 3}" cy="${y}" rx="${w / 2}" ry="2.6" transform="rotate(-18 ${50 - w / 2 - 3} ${y})"/><ellipse cx="${50 + w / 2 + 3}" cy="${y}" rx="${w / 2}" ry="2.6" transform="rotate(18 ${50 + w / 2 + 3} ${y})"/>`; }).join(''),
  // বাঁশ: three narrow grass blades from one node
  bansh: `<path d="M18 92 C26 58 40 32 80 10 C56 40 40 66 18 92Z"/><path d="M22 94 C36 70 56 50 92 40 C62 56 44 74 22 94Z"/><path d="M14 90 C12 60 20 34 46 8 C30 38 20 62 14 90Z"/>`,
  // শাপলা: a round floating pad with a notch to the middle
  shapla: `<path d="M50 50 L50 6 A44 44 0 1 1 20 18Z" transform="rotate(-20 50 50)"/>${midrib('M50 50 L50 92')}`,
};

const TREE_OPTIONS = ['আম', 'কাঁঠাল', 'বট', 'তাল', 'কৃষ্ণচূড়া', 'বাঁশ', 'শাপলা'];
const pick4 = (answer: string, ...others: string[]) => [answer, ...others.slice(0, 3)];

export const MISSIONS: Record<string, (Mission | null)[]> = {
  life: [
    {
      type: 'order',
      intro: 'সূর্যের শক্তি কে খায়, তাকে কে খায়? নিচের কার্ডগুলো ঠিক ক্রমে ছুঁয়ে শৃঙ্খলটা গড়ো।',
      rounds: [
        { title: 'সুন্দরবনে', chain: ['সূর্য', 'ঘাস', 'চিত্রা হরিণ', 'বাঘ'], emoji: ['☀️', '🌿', '🦌', '🐅'], note: 'প্রতিটি ধাপে শক্তির বড় অংশ হারিয়ে যায়, তাই বাঘের চেয়ে হরিণ অনেক বেশি, হরিণের চেয়ে ঘাস আরও বেশি।' },
        { title: 'পুকুরে', chain: ['সূর্য', 'শৈবাল', 'পুঁটি মাছ', 'বক'], emoji: ['☀️', '🟢', '🐟', '🐦'], note: 'পানির নিচে শৈবালই গাছের কাজ করে: সূর্যের আলো ধরে খাবার বানায়, আর তা থেকেই পুকুরের সব প্রাণী বাঁচে।' },
        { title: 'ধানখেতে', chain: ['সূর্য', 'ধানগাছ', 'ইঁদুর', 'সাপ', 'ঈগল'], emoji: ['☀️', '🌾', '🐭', '🐍', '🦅'], note: 'খেতের সাপ কৃষকের বন্ধু: ইঁদুর খেয়ে ফসল বাঁচায়। শৃঙ্খলের একটা কড়ি সরালে বাকিগুলো টলে যায়।' },
      ],
    },
    {
      type: 'path',
      intro: 'এক টুকরো ভাত মুখে দিলে। প্রতিটি ধাপে বেছে নাও, এরপর সেটা কোথায় যাবে।',
      token: '🍚',
      tokenName: 'ভাতটা',
      stops: [
        { name: 'মুখ', emoji: '👄', fact: 'দাঁত ভাত পিষে ছোট করে, আর লালার একটা রস তখনই ভাতের শ্বেতসার ভাঙতে শুরু করে। তাই বেশিক্ষণ চিবোলে ভাত মিষ্টি লাগে।', choices: ['খাদ্যনালী', 'শ্বাসনালী', 'পাকস্থলী'] },
        { name: 'খাদ্যনালী', emoji: '🧵', fact: 'গলা থেকে পেট পর্যন্ত এই নলটা ঢেউয়ের মতো চেপে চেপে ভাত নিচে ঠেলে দেয়। উল্টো হয়ে ঝুললেও তাই খাবার পেটে পৌঁছায়।', choices: ['ফুসফুস', 'পাকস্থলী', 'বৃহদন্ত্র'] },
        { name: 'পাকস্থলী', emoji: '🫙', fact: 'এখানে কড়া অ্যাসিড আর পেশির মোচড়ে ভাত ঘন স্যুপের মতো হয়ে যায়। ঘণ্টা দুয়েক থাকে।', choices: ['ক্ষুদ্রান্ত্র', 'কিডনি', 'হৃৎপিণ্ড'] },
        { name: 'ক্ষুদ্রান্ত্র', emoji: '🌀', fact: 'পেঁচানো এই নলটা খুললে প্রায় ৬ মিটার! ভাতের পুষ্টি এখানেই রক্তে মিশে সারা শরীরে যায়।', choices: ['মস্তিষ্ক', 'বৃহদন্ত্র', 'খাদ্যনালী'] },
        { name: 'বৃহদন্ত্র', emoji: '🔁', fact: 'যা হজম হলো না, তার থেকে পানি শুষে নেওয়া হয়। বাকিটা মল হয়ে জমে।', choices: ['মলদ্বার', 'ফুসফুস', 'পাকস্থলী'] },
        { name: 'মলদ্বার', emoji: '🚽', fact: 'শেষ ধাপ। মুখ থেকে এখানে আসতে ভাতের লেগেছে প্রায় এক থেকে দুই দিন।', choices: [] },
      ],
    },
    {
      type: 'identify',
      intro: 'পাতার আঁকা ছবি আর একটা ইঙ্গিত দেখে বলো, এটা কোন গাছ।',
      caption: 'ছবিগুলো সরল করে আঁকা রূপরেখা, আসল পাতা নয়।',
      rounds: [
        { answer: 'আম', art: LEAF.aam, clue: 'লম্বা, সরু, দুই মাথা ছুঁচলো পাতা। গরমে গাছভরা হলুদ মিষ্টি ফল।', options: pick4('আম', 'কাঁঠাল', 'বট', 'শাপলা'), fact: 'কচি আমপাতা তামাটে লাল রঙের হয়, বড় হলে সবুজ।' },
        { answer: 'তাল', art: LEAF.taal, clue: 'হাতপাখার মতো এক ডাঁটা থেকে ছড়ানো পাতা। গ্রামে এই পাতায় পাখা বানানো হয়।', options: pick4('তাল', 'বাঁশ', 'আম', 'কৃষ্ণচূড়া'), fact: 'তালপাতায় একসময় বই লেখা হতো, তাকে বলে পুঁথি।' },
        { answer: 'শাপলা', art: LEAF.shapla, clue: 'গোল থালার মতো পাতা, মাঝে একটা খাঁজ, পানির ওপর ভাসে।', options: pick4('শাপলা', 'বট', 'কাঁঠাল', 'তাল'), fact: 'শাপলা বাংলাদেশের জাতীয় ফুল; পাতার নিচে বাতাসভরা কোষ থাকে বলে ভাসে।' },
        { answer: 'বট', art: LEAF.bot, clue: 'চওড়া ডিম্বাকার পাতা, নিচে লম্বা একটা ছুঁচলো মাথা যা দিয়ে বৃষ্টির পানি গড়িয়ে পড়ে।', options: pick4('বট', 'আম', 'শাপলা', 'বাঁশ'), fact: 'বটের ডাল থেকে ঝুরি নেমে মাটিতে ঢুকে নতুন কাণ্ড হয়, তাই এক গাছই একটা বন।' },
        { answer: 'কৃষ্ণচূড়া', art: LEAF.krishnachura, clue: 'পালকের মতো মিহি পাতা, একটা ডাঁটায় অসংখ্য ছোট ছোট পাতা। গ্রীষ্মে গাছ আগুনরঙা ফুলে ঢাকে।', options: pick4('কৃষ্ণচূড়া', 'তাল', 'কাঁঠাল', 'আম'), fact: 'রাতে বা বৃষ্টিতে কৃষ্ণচূড়ার ছোট পাতাগুলো ভাঁজ হয়ে বন্ধ হয়ে যায়।' },
        { answer: 'বাঁশ', art: LEAF.bansh, clue: 'ঘাসের মতো সরু লম্বা পাতা, গিঁট থেকে গুচ্ছ হয়ে বেরোয়। কাণ্ড ভেতরে ফাঁপা।', options: pick4('বাঁশ', 'শাপলা', 'বট', 'তাল'), fact: 'বাঁশ আসলে ঘাস, আর পৃথিবীর দ্রুততম বাড়া গাছ: দিনে প্রায় এক হাত!' },
        { answer: 'কাঁঠাল', art: LEAF.kathal, clue: 'মোটা, শক্ত, চকচকে পাতা, ওপরের দিকে চওড়া। এই গাছের ফলটাই আমাদের জাতীয় ফল।', options: pick4('কাঁঠাল', 'আম', 'বট', 'কৃষ্ণচূড়া'), fact: 'কাঁঠাল পৃথিবীর সবচেয়ে বড় গাছের ফল, একটা ৩০ কেজির বেশিও হতে পারে।' },
      ],
    },
  ],
};

/** The mission spec for world `slug`, index `i`, or null when it is not built. */
export const missionSpec = (slug: string, i: number): Mission | null => MISSIONS[slug]?.[i] ?? null;
export { TREE_OPTIONS };
