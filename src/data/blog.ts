/**
 * The written side of পসরা.
 *
 * Every piece lives in its cluster's module so the index can list them without
 * anyone maintaining a second list, and so a cluster can be added by adding one
 * file. Slugs are checked at load: two pieces with the same slug would make one
 * of them unreachable, and that is the kind of thing nobody notices for months.
 */
import type { Post, Cluster } from './blog-types';
import { worlds } from './worlds';
import physics from './posts/physics';
import nature from './posts/nature';
import language from './posts/language';
import money from './posts/money';
import space from './posts/space';
import chemistry from './posts/chemistry';
import life from './posts/life';
import food from './posts/food';
import math from './posts/math';
import social from './posts/social';
import discovery from './posts/discovery';

export * from './blog-types';

export const CLUSTERS: Cluster[] = [
  {
    id: 'physics',
    world: 'physics',
    n: 'বল, যন্ত্র ও শক্তি',
    blurb: 'সরল যন্ত্র, যান্ত্রিক সুবিধা আর শক্তির রূপান্তর - সংজ্ঞা, সূত্র আর হাতে-কলমে দেখার জায়গা।',
  },
  {
    id: 'nature',
    world: 'nature',
    n: 'ঋতু, নদী ও দুর্যোগ',
    blurb: 'ছয় ঋতু আর বারো মাস, পানিচক্র, বাংলাদেশের নদী, আর ঝড়-বন্যার আগে কী গুছিয়ে রাখতে হয়।',
  },
  {
    id: 'language',
    world: 'language',
    n: 'বর্ণ, যুক্তবর্ণ ও হাতের লেখা',
    blurb: 'বাংলা বর্ণমালা কোন ক্রমে শেখালে দ্রুত কাজ হয়, যুক্তবর্ণ কীভাবে ভাঙে, আর হাতের লেখার তিনটি ভিত্তি।',
  },
  {
    id: 'money',
    world: 'money',
    n: 'টাকা, বাজেট ও সুদ',
    blurb: 'কোন বয়সে টাকার কোন ধারণা, পরিবারের বাজেট, আর সরল ও চক্রবৃদ্ধি সুদের পার্থক্য সংখ্যাসহ।',
  },
  {
    id: 'space',
    world: 'space',
    n: 'গ্রহ, চাঁদ ও তারা',
    blurb: 'সৌরজগতের আটটি গ্রহ, চাঁদের কলা আর গ্রহণ, আলোকবর্ষ কাকে বলে আর তারারা কীভাবে জন্মায় ও মরে।',
  },
  {
    id: 'chemistry',
    world: 'chemistry',
    n: 'পদার্থ, পরমাণু ও বিক্রিয়া',
    blurb: 'কঠিন-তরল-গ্যাসের পার্থক্য অণুর সাজানোয়, পরমাণুর ভেতরের তিন কণা, আর pH স্কেল ঘরে বসে পরীক্ষা করার উপায়।',
  },
  {
    id: 'life',
    world: 'life',
    n: 'গাছ, প্রাণী ও শরীর',
    blurb: 'সালোকসংশ্লেষণ কীভাবে হয়, গাছের কোন অংশের কী কাজ, আর প্রাণীর শ্রেণিবিভাগে শুশুক কেন মাছ নয়।',
  },
  {
    id: 'food',
    world: 'food',
    n: 'খাদ্য, থালা ও নিরাপত্তা',
    blurb: 'খাদ্যের ছয় উপাদান, সুষম থালা কীভাবে সাজাবেন, আর নিরাপদ খাবারের কয়েকটা ঘরোয়া অভ্যাস।',
  },
  {
    id: 'math',
    world: 'math',
    n: 'ভগ্নাংশ, ক্ষেত্রফল ও একক',
    blurb: 'ভগ্নাংশ-দশমিক-শতকরার যাতায়াত, ক্ষেত্রফল আর পরিসীমার পার্থক্য, আর মেট্রিক ও দেশি এককের হিসাব।',
  },
  {
    id: 'social',
    world: 'social',
    n: 'আবেগ, নিরাপত্তা ও অনলাইন',
    blurb: 'শিশুর রাগ সামলানোর কী কাজে দেয়, ভালো ও খারাপ স্পর্শ কীভাবে শেখাবেন, আর অনলাইনের পাঁচটা বিপদ।',
  },
  {
    id: 'discovery',
    world: 'discovery',
    n: 'পরীক্ষা, পদ্ধতি ও যন্ত্র',
    blurb: 'রান্নাঘরের জিনিসে ছয়টা পরীক্ষা, বিজ্ঞানের পদ্ধতির সাত ধাপ, আর পরিমাপের যন্ত্রগুলোর চেনা ভুল।',
  },
];

export const POSTS: Post[] = [
  ...physics, ...nature, ...language, ...money,
  ...space, ...chemistry, ...life, ...food, ...math, ...social, ...discovery,
];

{
  const seen = new Set<string>();
  for (const p of POSTS) {
    if (seen.has(p.slug)) throw new Error(`duplicate blog slug: ${p.slug}`);
    seen.add(p.slug);
  }
}

export const postBySlug = (slug: string): Post | undefined => POSTS.find((p) => p.slug === slug);
export const postsIn = (cluster: string): Post[] =>
  POSTS.filter((p) => p.cluster === cluster).sort((a, b) => Number(!!b.pillar) - Number(!!a.pillar));
export const clusterOf = (id: string): Cluster | undefined => CLUSTERS.find((c) => c.id === id);
/** The accent colour of the world a cluster belongs to, so the two match. */
export const clusterHue = (c: Cluster): string => worlds.find((w) => w.slug === c.world)?.hue ?? '#2E7EA8';
