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
];

export const POSTS: Post[] = [...physics, ...nature, ...language, ...money];

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
