import type { Lab, CompareItem } from '../lab-types';
import { bodies } from '../space';
import { bn, bnNum } from '../../lib/bn';

/**
 * The figures that are not already in `space.ts`.
 *
 * Gravity and distance come from `bodies` itself, so the comparison and the
 * body pages cannot disagree. Diameter, day and year are added here, keyed by
 * the same ids, and every one is a published measured value rather than a
 * rounded guess. Moon counts are deliberately absent: confirmed counts keep
 * going up, and a number that dates badly is worse than one fewer column.
 */
const EXTRA: Record<string, { dia: number; day: number; year: number }> = {
  sun: { dia: 1392700, day: 25 * 24, year: 0 },
  mercury: { dia: 4879, day: 1408, year: 0.24 },
  venus: { dia: 12104, day: 5832, year: 0.62 },
  earth: { dia: 12742, day: 24, year: 1 },
  mars: { dia: 6779, day: 24.7, year: 1.88 },
  jupiter: { dia: 139820, day: 9.9, year: 11.86 },
  saturn: { dia: 116460, day: 10.7, year: 29.5 },
  uranus: { dia: 50724, day: 17.2, year: 84 },
  neptune: { dia: 49244, day: 16.1, year: 165 },
  pluto: { dia: 2377, day: 153, year: 248 },
};

/** The comparison runs over the bodies that orbit the Sun, in orbital order. */
const ORDER = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
const items: CompareItem[] = ORDER.map((id) => {
  const b = bodies.find((x) => x.id === id)!;
  const e = EXTRA[id]!;
  return {
    n: b.bn,
    item: b.bn,
    stats: { dia: e.dia, g: b.gravity, au: b.au ?? 0, day: e.day, year: e.year },
    note: b.tagline,
  };
});

const labs: Lab[] = [
  {
    world: 'space', cat: 0,
    n: 'পাশাপাশি রাখো',
    lede: 'একটা গ্রহের ব্যাস ১,৩৯,৮২০ কিলোমিটার - এটা মুখস্থ করার মতো তথ্য। সেটা পৃথিবীর পাশে রাখলে দাঁড়ায় "এগারো গুণ চওড়া", আর সেটা একটা ছবি। দুটো বেছে নাও, বাকিটা সংখ্যাগুলো বলবে।',
    cards: [
      {
        kind: 'compare',
        item: 'সূর্য',
        n: 'দুটো গ্রহ পাশাপাশি',
        how: 'বাঁয়ে একটা আর ডানে একটা বাছো। প্রতিটি সারিতে দুটো দাগ মাঝখান থেকে দুই দিকে বাড়ে, তাই কোনটা কত বড় এক নজরেই বোঝা যায়।',
        source: 'মাধ্যাকর্ষণ আর সূর্য থেকে দূরত্ব সরাসরি সাইটের গ্রহ-পাতাগুলোর নিজের তথ্য থেকে নেওয়া, তাই দুই জায়গায় আলাদা হতে পারে না। ব্যাস, দিন ও বছর প্রকাশিত পরিমাপ; মাধ্যাকর্ষণ পৃথিবীর তুলনায়, আর বছর পৃথিবীর বছরে।',
        stats: [
          { k: 'dia', n: 'ব্যাস', fmt: (v) => `${bnNum(v)} কিমি` },
          { k: 'g', n: 'মাধ্যাকর্ষণ', fmt: (v) => `${bn(v)} g` },
          { k: 'au', n: 'সূর্য থেকে', fmt: (v) => (v === 0 ? 'কেন্দ্রে' : `${bn(v)} AU`) },
          { k: 'day', n: 'এক দিন', fmt: (v) => (v >= 48 ? `${bn(Math.round(v / 24))} দিন` : `${bn(v)} ঘণ্টা`) },
          { k: 'year', n: 'এক বছর', fmt: (v) => (v === 0 ? '-' : v < 1 ? `${bn(Math.round(v * 365))} দিন` : `${bn(v)} বছর`) },
        ],
        items,
        start: [3, 5],
        also: ['বুধ', 'শুক্র', 'পৃথিবী', 'মঙ্গল', 'বৃহস্পতি', 'শনি', 'ইউরেনাস', 'নেপচুন', 'প্লুটো'],
      },
    ],
  },
];

export default labs;
