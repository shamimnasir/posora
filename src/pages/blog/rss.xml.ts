/** A machine-readable, human-subscribeable feed for the Bangla article library. */
import type { APIRoute } from 'astro';
import { POSTS } from '../../data/blog';

export const prerender = false;

const escapeXml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
}[char]!));

export const GET: APIRoute = ({ site }) => {
  const origin = (site ?? new URL('https://posora.com')).origin;
  const feedUrl = `${origin}/blog/rss.xml`;
  const sorted = [...POSTS].sort((a, b) => b.updated.localeCompare(a.updated) || a.slug.localeCompare(b.slug));
  const items = sorted.slice(0, 40).map((post) => {
    const url = `${origin}/blog/${post.slug}/`;
    const pubDate = new Date(`${post.updated}T00:00:00Z`).toUTCString();
    const description = `${post.featuredAnswer ?? ''}\n\n${post.description}`.trim();
    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
      <category>${escapeXml(post.cluster)}</category>
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>পসরা - বাংলায় শেখার লেখা</title>
    <link>${escapeXml(`${origin}/blog/`)}</link>
    <description>বিজ্ঞান, প্রকৃতি, গণিত, ভাষা ও দৈনন্দিন শেখা নিয়ে পসরার বাংলায় লেখা।</description>
    <language>bn-BD</language>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date(`${sorted[0]?.updated ?? new Date().toISOString().slice(0, 10)}T00:00:00Z`).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=900, stale-while-revalidate=86400',
      'x-content-type-options': 'nosniff',
    },
  });
};
