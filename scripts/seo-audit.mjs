/**
 * Crawl every canonical URL advertised in Posora's sitemap and audit the
 * rendered HTML that search engines and answer engines can fetch.
 *
 * Usage: SEO_BASE_URL=https://posora.com node scripts/seo-audit.mjs
 */
const base = new URL(process.env.SEO_BASE_URL ?? 'https://posora.com');
const concurrency = 8;
const failures = [];
const warnings = [];
const titleOwners = new Map();
const descriptionOwners = new Map();

async function fetchText(url) {
  const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(25000) });
  return { response, text: await response.text() };
}

async function eachLimit(items, limit, callback) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      await callback(items[index]);
    }
  }));
}

function attrs(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
    .map((match) => [match[1].toLowerCase(), match[2] ?? match[3] ?? '']));
}

function decode(value) {
  return value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function metaValues(html, name) {
  return [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => attrs(match[0]))
    .filter((item) => (item.name ?? item.property ?? '').toLowerCase() === name.toLowerCase())
    .map((item) => item.content ?? '');
}

function pageText(html) {
  return decode(html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();
}

const { response: sitemapResponse, text: sitemap } = await fetchText(new URL('/sitemap.xml', base));
if (!sitemapResponse.ok) throw new Error(`Sitemap returned HTTP ${sitemapResponse.status}`);
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => decode(match[1]));
if (!urls.length) throw new Error('Sitemap contains no <loc> entries');
if (new Set(urls).size !== urls.length) failures.push(`Sitemap has ${urls.length - new Set(urls).size} duplicate URL(s)`);
if (!urls.includes(new URL('/digital-pack/', base).href)) failures.push('Sitemap omits /digital-pack/');
if (urls.length < 200) failures.push(`Sitemap only has ${urls.length} URLs; public world/lab/blog coverage may be missing`);
const blogUrlCount = urls.filter((url) => new URL(url).pathname.startsWith('/blog/')).length;
if (blogUrlCount < 110) failures.push(`Sitemap only has ${blogUrlCount} blog URLs; expected the complete article library`);

const internalLinks = new Set();
let noindexInSitemap = 0;
let pagesChecked = 0;
let imagesChecked = 0;
await eachLimit(urls, concurrency, async (url) => {
  try {
    const { response, text: html } = await fetchText(url);
    pagesChecked++;
    const path = new URL(url).pathname;
    if (!response.ok) failures.push(`${response.status} ${path}`);
    if (!/text\/html/i.test(response.headers.get('content-type') ?? '')) failures.push(`${path} is not served as HTML`);

    const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
    const titles = [...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map((m) => decode(m[1].replace(/<[^>]+>/g, '').trim()));
    const descriptions = metaValues(html, 'description').map((value) => decode(value.trim()));
    const canonicals = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => attrs(m[0]))
      .filter((item) => (item.rel ?? '').split(/\s+/).includes('canonical')).map((item) => item.href ?? '');
    const robots = metaValues(html, 'robots').join(',').toLowerCase();
    const h1s = [...html.matchAll(/<h1\b/gi)].length;
    const lang = html.match(/<html\b[^>]*\blang\s*=\s*["']([^"']+)/i)?.[1];
    const ogTitle = metaValues(html, 'og:title');
    const ogDescription = metaValues(html, 'og:description');
    const ogImage = metaValues(html, 'og:image');
    const ogType = metaValues(html, 'og:type');
    const ldJson = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];

    if (titles.length !== 1 || !titles[0]) failures.push(`${path} has ${titles.length} title tags`);
    if (descriptions.length !== 1 || !descriptions[0]) failures.push(`${path} has ${descriptions.length} meta descriptions`);
    if (canonicals.length !== 1 || canonicals[0] !== url) failures.push(`${path} canonical mismatch: ${canonicals.join(' | ') || 'missing'}`);
    if (robots.includes('noindex')) { noindexInSitemap++; failures.push(`${path} is noindex but appears in sitemap`); }
    if (h1s !== 1) warnings.push(`${path} has ${h1s} H1 headings`);
    if (lang !== 'bn') warnings.push(`${path} html lang is ${lang ?? 'missing'}, expected bn`);
    if (ogTitle.length !== 1 || ogDescription.length !== 1 || ogImage.length !== 1) warnings.push(`${path} is missing/duplicating an Open Graph field`);
    const expectedOgType = path.startsWith('/blog/') && path !== '/blog/' ? 'article' : 'website';
    if (ogType.length !== 1 || ogType[0] !== expectedOgType) failures.push(`${path} has incorrect Open Graph type: ${ogType.join(', ') || 'missing'}`);
    if (!ldJson.length) warnings.push(`${path} has no JSON-LD graph`);
    for (const item of ldJson) {
      try { JSON.parse(item[1]); } catch { failures.push(`${path} has invalid JSON-LD`); }
    }
    if (pageText(html).length < 180) warnings.push(`${path} has very little rendered text`);

    const title = titles[0];
    if (title) titleOwners.set(title, [...(titleOwners.get(title) ?? []), path]);
    const description = descriptions[0];
    if (description) descriptionOwners.set(description, [...(descriptionOwners.get(description) ?? []), path]);

    for (const match of html.matchAll(/<a\b[^>]*>/gi)) {
      const href = attrs(match[0]).href;
      if (!href) continue;
      try {
        const target = new URL(decode(href), url);
        if (target.origin === base.origin && !target.hash && !target.pathname.startsWith('/api/')) {
          target.search = '';
          internalLinks.add(target.href);
        }
      } catch { /* Ignore mailto:, tel:, and invalid/non-URL anchors. */ }
    }
    for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
      imagesChecked++;
      const image = attrs(match[0]);
      if (!('alt' in image) || !image.alt.trim()) warnings.push(`${path} has an image without useful alt text`);
    }
  } catch (error) {
    failures.push(`${url} failed to fetch: ${error instanceof Error ? error.message : error}`);
  }
});

for (const paths of titleOwners.values()) if (paths.length > 1) warnings.push(`Duplicate title (${paths.length}): ${paths.join(', ')}`);
for (const paths of descriptionOwners.values()) if (paths.length > 1) warnings.push(`Duplicate description (${paths.length}): ${paths.join(', ')}`);

const checkedLinks = new Set(urls);
const newLinks = [...internalLinks].filter((url) => !checkedLinks.has(url));
await eachLimit(newLinks, concurrency, async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(20000) });
    if (response.status >= 400) failures.push(`Internal link ${response.status}: ${new URL(url).pathname}`);
  } catch (error) {
    failures.push(`Internal link failed: ${url} (${error instanceof Error ? error.message : error})`);
  }
});

console.log(`SEO crawl ${base.origin}: ${pagesChecked}/${urls.length} sitemap pages, ${internalLinks.size} internal links, ${imagesChecked} images checked, ${noindexInSitemap} noindex URLs`);
console.log(`Unique titles: ${titleOwners.size}; unique descriptions: ${descriptionOwners.size}`);
console.log(`Warnings: ${warnings.length}; failures: ${failures.length}`);
for (const item of warnings) console.log(`WARN ${item}`);
for (const item of failures) console.error(`FAIL ${item}`);
if (failures.length) process.exitCode = 1;
