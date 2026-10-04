import { chromium } from 'playwright-core';

const base = (process.env.BACKLINK_BASE ?? 'http://127.0.0.1:4321').replace(/\/$/, '');
const executablePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const worlds = ['space', 'physics', 'chemistry', 'life', 'nature', 'food', 'math', 'money', 'language', 'social', 'discovery'];
const extraTools = [
  '/chemistry/matter/', '/food/plate/', '/nature/year/', '/physics/light/', '/physics/machines/',
  '/language/handwriting/', '/language/letters/', '/math/geometry/', '/math/measurement/', '/money/saving/',
  '/nature/lab/2/', '/physics/lab/1/', '/nature/quiz/1/', '/food/worksheet/1/',
];
const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const failures = [];
const articles = new Map();
let topicPanels = 0;

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  page.on('pageerror', (error) => failures.push(`browser error: ${error.message}`));

  for (const world of worlds) {
    const response = await page.goto(`${base}/${world}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (response?.status() !== 200) {
      failures.push(`/${world}/ returned HTTP ${response?.status()}`);
      continue;
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2);
    if (overflow) failures.push(`/${world}/ has horizontal overflow at 390px`);
    const result = await page.locator('.index-cat .related-reading a[href^="/blog/"], .body-text .related-reading a[href^="/blog/"]').evaluateAll((anchors, world) => ({
      categories: document.querySelectorAll('.index-cat').length,
      panels: document.querySelectorAll('.index-cat .related-reading, .body-text .related-reading').length,
      links: anchors.map((anchor) => ({ href: anchor.getAttribute('href'), world })),
    }), world);
    topicPanels += result.panels;
    if (world !== 'space' && result.categories > 0 && result.panels !== result.categories) {
      failures.push(`/${world}/ has ${result.panels} reading panels for ${result.categories} categories`);
    }
    if (!result.links.length) failures.push(`/${world}/ has no category-to-article links`);
    for (const link of result.links) articles.set(link.href, link.world);
  }

  for (const [href, world] of articles) {
    const response = await page.goto(new URL(href, base).href, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (response?.status() !== 200) failures.push(`${href} returned HTTP ${response?.status()}`);
    const returnHref = await page.locator('.topic-next').getAttribute('href').catch(() => null);
    if (!returnHref?.startsWith(`/${world}/`)) failures.push(`${href} has no matching topic backlink to /${world}/ (got ${returnHref ?? 'none'})`);
  }

  for (const route of extraTools) {
    const response = await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const count = await page.locator('.related-reading a[href^="/blog/"]').count();
    if (response?.status() !== 200 || count < 1) failures.push(`${route}: HTTP ${response?.status()}, article links ${count}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2);
    if (overflow) failures.push(`${route} has horizontal overflow at 390px`);
  }
  await page.close();
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`Internal backlink smoke failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Internal backlink smoke passed: ${topicPanels} world/category reading panels, ${articles.size} unique articles with reciprocal links, ${extraTools.length} specialist tools.`);
}
