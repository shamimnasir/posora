/**
 * Build the share card that every page points at as og:image.
 *
 * Run with `npm run og` after changing the wordmark or the palette. The PNG is
 * committed, because a share card has to exist as a plain file on the CDN: the
 * crawlers that fetch it run no JavaScript and follow no build step.
 *
 * The Bangla is set in a system Bengali face rather than the site's own Baloo
 * Da 2, because Astro's font pipeline only ever produces subset woff2 files and
 * the SVG rasteriser here cannot read those. Check the conjuncts by eye after
 * any wording change: ন্ট and ক্ট in ইন্টারঅ্যাকটিভ are the ones that break first.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const outDir = join(root, 'public');

const BN = 'Kohinoor Bangla, Bangla MN, Bangla Sangam MN, sans-serif';
const W = 1200, H = 630;

const stars = Array.from({ length: 80 }, (_v, i) => {
  const x = (i * 137.5) % W, y = (i * 241.7) % H, r = (i % 5) * 0.5 + 0.8;
  return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r}" fill="#ffffff" opacity="${(0.15 + (i % 4) * 0.14).toFixed(2)}"/>`;
}).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#16305a"/>
      <stop offset="0.55" stop-color="#0d1322"/>
      <stop offset="1" stop-color="#070a12"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.78" cy="0.62" r="0.55">
      <stop offset="0" stop-color="#3E8E5A" stop-opacity="0.42"/>
      <stop offset="1" stop-color="#3E8E5A" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="ball" cx="0.34" cy="0.3" r="0.85">
      <stop offset="0" stop-color="#8fd6a6"/>
      <stop offset="0.45" stop-color="#3E8E5A"/>
      <stop offset="1" stop-color="#1c4a2c"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${stars}
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <circle cx="960" cy="400" r="132" fill="url(#ball)"/>
  <ellipse cx="960" cy="400" rx="205" ry="48" fill="none" stroke="#ffd76a" stroke-width="8" opacity="0.9" transform="rotate(-20 960 400)"/>
  <circle cx="1136" cy="318" r="15" fill="#ffd76a"/>
  <g font-family="${BN}" fill="#f4f8fc">
    <text x="86" y="176" font-size="104" font-weight="700">পসরা</text>
    <text x="90" y="232" font-size="34" fill="#9fb6d4">posora.com</text>
    <text x="86" y="366" font-size="60" font-weight="700">শেখা হোক খেলার মতো</text>
    <text x="86" y="432" font-size="33" fill="#cfe0f2">বাংলায় ইন্টারঅ্যাকটিভ শেখার জায়গা</text>
    <text x="86" y="492" font-size="29" fill="#9fb6d4">১১টি ভুবন · থ্রিডি মডেল · মিশন · তিন গভীরতার লেখা</text>
  </g>
  <rect x="86" y="530" width="330" height="9" rx="4" fill="#ffd76a" opacity="0.92"/>
</svg>`;

mkdirSync(outDir, { recursive: true });
const png = join(outDir, 'og.png');
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(png);
// A square crop for the places that want one (WhatsApp previews, some readers).
await sharp(Buffer.from(svg)).extract({ left: 0, top: 0, width: 630, height: 630 }).resize(600, 600).png({ compressionLevel: 9 }).toFile(join(outDir, 'og-square.png'));
writeFileSync(join(outDir, 'og.svg'), svg);
console.log(`wrote ${png}`);
