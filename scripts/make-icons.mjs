/**
 * Build the home-screen icons.
 *
 * A website is the one kind of app a child cannot be sent a notification by,
 * and that is correct. What is left as a way back in is an icon on the tablet
 * home screen: pull, not push, and nothing a parent objects to. Android and
 * iOS both want real PNGs at fixed sizes, so this renders the wordmark glyph
 * from public/favicon.svg at each of them.
 *
 * The maskable variants carry the extra padding Android crops into a circle
 * or a squircle; without it the ring gets its edges shaved off.
 *
 *     node scripts/make-icons.mjs
 *
 * The PNGs are committed, like the share card, because the systems that fetch
 * them run no build step.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'public', 'icons');

const BRAND = '#15544C', INK = '#F4FBF9', SUN = '#F0B429';

/** The mark on its own, filling the box. `pad` leaves room for a mask to crop. */
const mark = (size, pad) => {
  const s = 64, inset = pad ? 8 : 0, r = pad ? 0 : 16;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${s} ${s}">
    <rect width="${s}" height="${s}" rx="${r}" fill="${BRAND}"/>
    <g transform="translate(${inset} ${inset}) scale(${(s - inset * 2) / s})">
      <circle cx="32" cy="32" r="13" fill="${INK}"/>
      <ellipse cx="32" cy="32" rx="26" ry="8" fill="none" stroke="${INK}" stroke-width="3" transform="rotate(-22 32 32)"/>
      <circle cx="52" cy="24" r="4" fill="${SUN}"/>
    </g>
  </svg>`;
};

mkdirSync(outDir, { recursive: true });

const jobs = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['maskable-192.png', 192, true],
  ['maskable-512.png', 512, true],
  // iOS ignores the manifest and reads this one, and it must not be transparent.
  ['apple-touch-icon.png', 180, false],
];

for (const [name, size, pad] of jobs) {
  const png = await sharp(Buffer.from(mark(size, pad))).png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(join(outDir, name), png);
  console.log(`icons/${name}  ${size}x${size}  ${png.length} bytes`);
}
