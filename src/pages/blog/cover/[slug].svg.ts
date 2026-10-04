import type { APIRoute } from 'astro';
import { postBySlug, clusterOf, clusterHue } from '../../../data/blog';

export const prerender = false;

const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
}[char]!));

export const GET: APIRoute = ({ params }) => {
  const post = postBySlug(params.slug ?? '');
  if (!post || !post.generatedCover) return new Response('Not found', { status: 404 });
  const cluster = clusterOf(post.cluster)!;
  const hue = clusterHue(cluster);
  const seed = [...post.slug].reduce((n, ch) => n + ch.codePointAt(0)!, 0);
  const cx = 860 + (seed % 95);
  const cy = 280 + (seed % 78);
  const title = escape(post.title);
  const label = escape(cluster.n);
  const motif: Record<string, string> = {
    space: '<ellipse cx="870" cy="300" rx="205" ry="72" transform="rotate(-25 870 300)"/><circle cx="870" cy="300" r="62"/><circle cx="1014" cy="220" r="18" fill="#ffd166"/><path d="M825 300h90M870 255v90"/>',
    physics: '<path d="M730 390h330M790 385l165-190 55 190M810 350h190"/><circle cx="953" cy="200" r="23"/><path d="M735 420h330"/>',
    chemistry: '<path d="M835 190h70M850 190v105l-90 145q-14 25 18 25h190q32 0 18-25l-90-145V190M790 375h175"/><circle cx="840" cy="350" r="12"/><circle cx="900" cy="320" r="9"/><circle cx="935" cy="370" r="15"/>',
    life: '<path d="M865 410V245M865 310q-95-105-145-35 28 78 145 72M865 285q72-125 145-76-9 90-145 125"/><path d="M865 410q-10-45-70-55M865 410q16-45 76-56"/>',
    nature: '<path d="M710 355q80-80 160 0t160 0 160 0M710 390q80-80 160 0t160 0 160 0"/><path d="M800 215l-25 48h35l-25 52M1010 205l-25 48h35l-25 52"/><circle cx="890" cy="200" r="34"/>',
    food: '<path d="M735 330q135 190 270 0M735 330h270M785 300q85-95 170 0"/><circle cx="850" cy="260" r="30"/><circle cx="920" cy="245" r="24"/><path d="M1015 210v135M1040 210v135M1005 250h45"/>',
    math: '<path d="M740 215h270v210H740zM830 215v210M920 215v210M740 285h270M740 355h270"/><path d="M1035 230v165M1020 230h30M1020 395h30"/>',
    money: '<circle cx="865" cy="300" r="110"/><path d="M865 220v160M915 250q-12-34-53-34-45 0-45 38 0 34 48 43t48 38q0 40-51 40-39 0-55-30"/><path d="M1010 390l45-55 40 25 55-90"/>',
    language: '<path d="M740 230h265v185H740zM775 275h190M775 320h145M775 365h100"/><text x="1035" y="330" font-size="116" font-weight="700" fill="#fff">অ</text>',
    social: '<path d="M865 390s-150-85-150-175c0-68 90-84 150-20 60-64 150-48 150 20 0 90-150 175-150 175z"/><path d="M770 430h190M815 465h100"/>',
    discovery: '<circle cx="865" cy="275" r="92"/><path d="M830 350h70v55h-70zM840 430h50M865 180v-40M760 275h-42M1012 275h-42M790 200l-30-30M940 200l30-30"/><path d="M835 275q30-55 60 0-30 30-30 70"/>',
  };
  const lines: string[] = [];
  let line = '';
  for (const word of post.title.split(' ')) {
    const candidate = line ? `${line} ${word}` : word;
    if ([...candidate].length > 22 && line) { lines.push(line); line = word; }
    else line = candidate;
  }
  if (line) lines.push(line);
  const titleSvg = lines.slice(0, 3).map((part, index) => `<text x="72" y="${205 + index * 60}" font-size="44" font-weight="700">${escape(part)}</text>`).join('');
  const art = motif[post.cluster] ?? motif.discovery;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-labelledby="title desc">
<title id="title">${title}</title><desc id="desc">পসরা ${label} ভুবনের জন্য তৈরি করা বিষয়ভিত্তিক ধারণাচিত্র</desc>
<defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#111a36"/><stop offset="1" stop-color="#2a2052"/></linearGradient><radialGradient id="orb"><stop stop-color="#fff" stop-opacity=".96"/><stop offset=".63" stop-color="${hue}" stop-opacity=".72"/><stop offset="1" stop-color="${hue}" stop-opacity=".12"/></radialGradient><filter id="glow"><feGaussianBlur stdDeviation="18"/></filter></defs>
<rect width="1200" height="675" fill="url(#bg)"/><circle cx="${cx}" cy="${cy}" r="190" fill="${hue}" opacity=".25" filter="url(#glow)"/><g fill="none" stroke="${hue}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".78">${art}</g><circle cx="${cx+150}" cy="${cy-77}" r="18" fill="#ffd166"/><circle cx="${cx-173}" cy="${cy+73}" r="12" fill="#64dfdf"/>
<g fill="#fff" font-family="Noto Sans Bengali, sans-serif"><text x="72" y="94" font-size="23" fill="#9dd9ed">পসরা · ${label}</text>${titleSvg}<text x="72" y="592" font-size="22" fill="#d1d7f2">বাংলায় বুঝে নাও · তারপর ভুবনে দেখে শেখো</text></g><path d="M72 438h390" stroke="${hue}" stroke-width="8" stroke-linecap="round"/><g fill="#fff" opacity=".5"><circle cx="1064" cy="106" r="4"/><circle cx="1015" cy="513" r="6"/><circle cx="741" cy="118" r="5"/><circle cx="1120" cy="385" r="3"/></g></svg>`;
  return new Response(svg, { headers: {
    'content-type': 'image/svg+xml; charset=utf-8',
    'cache-control': 'public, max-age=86400, s-maxage=604800',
    'x-content-type-options': 'nosniff',
  } });
};
