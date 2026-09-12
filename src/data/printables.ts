/**
 * ছাপার প্যাক - the free printable sheets.
 *
 * Every sheet is generated from data the site already renders (language.ts,
 * math.ts, space.ts), so nothing here is a separate copy that can go stale, and
 * nothing is invented for the sake of having a download. They print from the
 * browser, which is the only mechanism that works identically on a phone in
 * Dhaka and a laptop in Toronto without shipping a PDF library.
 *
 * These are free and stay free. They are the thing a parent can hold before
 * being asked for anything, which is the whole point of them.
 */
export type SheetKind = 'letters' | 'kars' | 'conjuncts' | 'numbers' | 'space' | 'money';

export type Sheet = {
  slug: string;
  kind: SheetKind;
  bn: string;
  /** One line on what the parent or teacher actually gets. */
  tag: string;
  /** Who it is for, in the plainest terms. */
  who: string;
  /** How many pages it prints to, measured by printing it. */
  pages: string;
  emoji: string;
};

export const sheets: Sheet[] = [
  {
    slug: 'bornomala',
    kind: 'letters',
    bn: 'বর্ণমালা হাতের লেখা',
    tag: '৫০টি বর্ণ, প্রতিটির জন্য বড় করে লেখার ঘর আর একটা উদাহরণ শব্দ।',
    who: 'যে শিশু সবে বাংলা লিখতে শিখছে',
    pages: '৭ পাতা',
    emoji: '✍️',
  },
  {
    slug: 'kar',
    kind: 'kars',
    bn: 'কার চিহ্ন চার্ট',
    tag: '১১টি কার একটাই বর্ণে বসিয়ে দেখানো, যাতে চোখে ধরা পড়ে কোনটা কোথায় বসে।',
    who: 'বর্ণ চেনা হয়ে গেছে, এবার শব্দ বানাতে শিখছে',
    pages: '১ পাতা',
    emoji: '🔤',
  },
  {
    slug: 'juktoborno',
    kind: 'conjuncts',
    bn: 'যুক্তবর্ণ ভাঙা চার্ট',
    tag: '৩০টি যুক্তবর্ণ, প্রতিটা কোন দুটো বর্ণ মিলে হয়েছে তা ভেঙে দেখানো।',
    who: 'যুক্তবর্ণে এসে আটকে যাওয়া যেকোনো বয়সের শিক্ষার্থী',
    pages: '২ পাতা',
    emoji: '🧩',
  },
  {
    slug: 'sonkha',
    kind: 'numbers',
    bn: 'সংখ্যা ১ থেকে ১০০',
    tag: 'বাংলা অঙ্ক আর তার কথায় রূপ, একশো পর্যন্ত, এক পাতায় দেয়ালে টাঙানোর মতো।',
    who: 'গোনা শিখছে, বা বাংলা সংখ্যার নাম মনে রাখতে চায়',
    pages: '২ পাতা',
    emoji: '🔢',
  },
  {
    slug: 'sourojogot',
    kind: 'space',
    bn: 'সৌরজগৎ তথ্যপত্র',
    tag: 'এগারোটি বস্তুর আসল মাপ, দূরত্ব, তাপমাত্রা আর চাঁদের সংখ্যা এক পাতায়।',
    who: 'ক্লাসের দেয়াল, বা যে শিশু গ্রহ নিয়ে প্রশ্ন করে',
    pages: '১ পাতা',
    emoji: '🪐',
  },
  {
    slug: 'taka',
    kind: 'money',
    bn: 'টাকা চেনা ও দোকান খেলা',
    tag: 'বাংলাদেশের নোট-কয়েনের তালিকা, আর দাম মিলিয়ে হিসাব করার একটা ছোট খেলা।',
    who: 'যে শিশু সবে টাকা গুনতে শিখছে',
    pages: '২ পাতা',
    emoji: '🏪',
  },
];

export const sheetBySlug = (slug: string): Sheet | undefined => sheets.find((s) => s.slug === slug);
