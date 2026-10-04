import { chromium } from 'playwright-core';

const base = (process.env.BLOG_BASE ?? 'http://127.0.0.1:4321').replace(/\/$/, '');
const executablePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const failures = [];
const counts = new Map();

try {
  const index = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const response = await index.goto(`${base}/blog/`, { waitUntil: 'domcontentloaded' });
  if (response?.status() !== 200) throw new Error(`blog index returned HTTP ${response?.status()}`);
  const inventory = await index.locator('a.post').evaluateAll((links) => links.map((link) => ({
    href: link.getAttribute('href'),
    title: link.querySelector('b')?.textContent?.trim() ?? '',
    image: link.querySelector('img')?.getAttribute('src') ?? '',
    cluster: link.closest('.cluster')?.querySelector('h2')?.textContent?.trim() ?? '',
  })));
  for (const article of inventory) counts.set(article.cluster, (counts.get(article.cluster) ?? 0) + 1);
  if (inventory.length < 110) failures.push(`only ${inventory.length} articles are listed; expected at least 110`);
  for (const [cluster, count] of counts) if (count < 10) failures.push(`${cluster}: only ${count} articles`);

  const queue = [...inventory];
  const workers = Array.from({ length: 5 }, async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    while (queue.length) {
      const article = queue.shift();
      if (!article) break;
      try {
        const postResponse = await page.goto(`${base}${article.href}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        if (postResponse?.status() !== 200) failures.push(`${article.href}: HTTP ${postResponse?.status()}`);
        await page.waitForFunction(() => [...document.querySelectorAll('article img')].some((img) => img.complete && img.naturalWidth > 0), { timeout: 10000 }).catch(() => {});
        const result = await page.evaluate(() => ({
          title: document.querySelector('h1')?.textContent?.trim() ?? '',
          answer: document.querySelector('.featured-answer p')?.textContent?.trim() ?? '',
          structuredAnswer: (() => {
            const script = document.querySelector('script[type="application/ld+json"]');
            try {
              const graph = JSON.parse(script?.textContent ?? '{}')['@graph'] ?? [];
              return graph.find((node) => node['@type'] === 'Article')?.abstract ?? '';
            } catch { return ''; }
          })(),
          answerBeforeCover: (() => {
            const answer = document.querySelector('.featured-answer');
            const cover = document.querySelector('figure.cover');
            return Boolean(answer && cover && (answer.compareDocumentPosition(cover) & Node.DOCUMENT_POSITION_FOLLOWING));
          })(),
          metaDescription: Boolean(document.querySelector('meta[name="description"]')?.content),
          worldLink: Boolean(document.querySelector('.refs a[href^="/"]')),
          image: [...document.querySelectorAll('article img')].some((img) => img.complete && img.naturalWidth > 0),
          overflow: document.documentElement.scrollWidth > innerWidth + 2,
          bodyLength: document.querySelector('article')?.innerText.trim().length ?? 0,
        }));
        if (!result.title || result.answer.length < 70 || result.structuredAnswer !== result.answer || !result.answerBeforeCover || !result.metaDescription || !result.worldLink || !result.image || result.bodyLength < 600) {
          failures.push(`${article.href}: incomplete article output (${JSON.stringify(result)})`);
        }
        if (result.overflow) failures.push(`${article.href}: horizontal overflow at 390px`);
      } catch (error) {
        failures.push(`${article.href}: ${error.message}`);
      }
    }
    await page.close();
  });
  await Promise.all(workers);
  await index.close();
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`Blog coverage smoke failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Blog coverage smoke passed: ${inventoryCountMessage(counts)}; ${[...counts.values()].join('+')} articles across ${counts.size} worlds.`);
}

function inventoryCountMessage(worldCounts) {
  return `${[...worldCounts.values()].reduce((sum, count) => sum + count, 0)} articles`;
}
