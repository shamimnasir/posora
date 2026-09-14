/**
 * Tell IndexNow which pages changed.
 *
 * IndexNow is a push protocol: instead of waiting to be crawled, a site says
 * "these URLs changed" once and every participating engine hears it - Bing,
 * Yandex, Seznam, Naver. Google does not participate, which is why this sits
 * alongside Search Console rather than replacing it.
 *
 * Ownership is proved by hosting a file named after the key, containing the
 * key, at the site root. That file is in `public/` and must stay there.
 *
 * Submit URLs that actually changed. Re-pushing the whole site on a schedule
 * is what the protocol asks people not to do, and there is no benefit: an
 * engine that already has an unchanged page does nothing with a second ping.
 *
 *   node scripts/indexnow.mjs                     # every URL in the sitemap
 *   node scripts/indexnow.mjs /blog/ /blog/x/     # just these
 *   node scripts/indexnow.mjs --dry-run           # show what would be sent
 */
import { readdirSync, readFileSync } from 'node:fs';

const ORIGIN = 'https://posora.com';
const HOST = 'posora.com';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

/** The key is whatever `<key>.txt` in public/ is named, so the two cannot drift. */
function findKey() {
  const hit = readdirSync('public').filter((f) => /^[a-f0-9]{16,128}\.txt$/.test(f));
  if (hit.length !== 1) throw new Error(`expected exactly one IndexNow key file in public/, found ${hit.length}`);
  const name = hit[0].replace(/\.txt$/, '');
  const body = readFileSync(`public/${hit[0]}`, 'utf8').trim();
  if (body !== name) throw new Error(`public/${hit[0]} must contain exactly its own name`);
  return name;
}

async function sitemapUrls() {
  const xml = await (await fetch(`${ORIGIN}/sitemap.xml`)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const paths = args.filter((a) => !a.startsWith('--'));

const key = findKey();
const urlList = paths.length
  ? paths.map((p) => (p.startsWith('http') ? p : `${ORIGIN}${p.startsWith('/') ? p : `/${p}`}`))
  : await sitemapUrls();

if (!urlList.length) throw new Error('nothing to submit');
if (urlList.length > 10000) throw new Error('IndexNow accepts at most 10000 URLs per request');
const offsite = urlList.filter((u) => !u.startsWith(`${ORIGIN}/`));
if (offsite.length) throw new Error(`refusing to submit URLs off ${HOST}: ${offsite.join(', ')}`);

const body = { host: HOST, key, keyLocation: `${ORIGIN}/${key}.txt`, urlList };
console.log(`${urlList.length} URL(s), key ${key.slice(0, 8)}…`);
if (dry) {
  console.log(urlList.join('\n'));
  process.exit(0);
}

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});
const text = await res.text();
// 200 accepted, 202 accepted but the key is still being checked
console.log(`${res.status} ${res.statusText}${text ? ` - ${text.slice(0, 200)}` : ''}`);
if (![200, 202].includes(res.status)) process.exit(1);
