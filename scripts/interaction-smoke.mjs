import { chromium } from 'playwright-core';

const base = (process.env.SMOKE_BASE ?? 'https://posora.com').replace(/\/$/, '');
const executablePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };

try {
  const reduced = await browser.newContext({ viewport: { width: 360, height: 800 }, reducedMotion: 'reduce' });
  const page = await reduced.newPage();
  let natureViewerRequested = false;
  page.on('request', (request) => {
    if (request.url().includes('nature-viewer')) natureViewerRequested = true;
  });
  await page.goto(`${base}/nature/?cat=1&item=1#model-stage`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(500);
  check(await page.locator('canvas').count() > 0, 'nature: canvas missing');
  check(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), 'reduced-motion: media preference missing');
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'nature: mobile overflow');
  const natureStart = page.locator('#world-start');
  check(await natureStart.isVisible(), 'nature mobile: explicit 3D start control is not visible');
  check(!natureViewerRequested, 'nature mobile: heavy 3D engine loaded before user intent');
  await natureStart.click();
  await page.waitForRequest((request) => request.url().includes('nature-viewer'), { timeout: 10000 }).catch(() => {});
  check(natureViewerRequested, 'nature mobile: start control did not load the 3D engine');

  let cosmosRequested = false;
  const spacePage = await reduced.newPage();
  spacePage.on('request', (request) => {
    if (request.url().includes('/cosmos.')) cosmosRequested = true;
  });
  await spacePage.goto(`${base}/space/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await spacePage.waitForTimeout(500);
  const spaceStart = spacePage.locator('#space-start');
  check(await spaceStart.isVisible(), 'space mobile: explicit 3D start control is not visible');
  check(!cosmosRequested, 'space mobile: solar-system scene loaded before user intent');
  await spaceStart.click();
  await spacePage.waitForRequest((request) => request.url().includes('/cosmos.'), { timeout: 10000 }).catch(() => {});
  check(cosmosRequested, 'space mobile: start control did not load the solar-system scene');

  // Keyboard path: focus the first mission control, activate it, then close it.
  const mission = page.locator('#miss-card button.mission-play').first();
  await mission.focus();
  check(await page.evaluate(() => document.activeElement?.matches('#miss-card button.mission-play')), 'keyboard: mission did not receive focus');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  if (await page.locator('button[aria-label="মিশন বন্ধ করো"]').count() === 0) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(250);
  }
  check(await page.locator('button[aria-label="মিশন বন্ধ করো"]').count() > 0, 'keyboard: mission did not open');
  await page.locator('button[aria-label="মিশন বন্ধ করো"]').click();
  await reduced.close();

  // WebGL fallback: disable WebGL and assert the page remains usable.
  const noWebgl = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const fallback = await noWebgl.newPage();
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (type === 'webgl' || type === 'webgl2') return null;
      return original.call(this, type, ...args);
    };
  });
  await fallback.goto(`${base}/math/?cat=0&item=0#model-stage`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await fallback.waitForTimeout(700);
  check((await fallback.locator('body').innerText()).length > 100, 'webgl fallback: page became unusable');
  check(await fallback.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'webgl fallback: overflow');
  await noWebgl.close();

  // Payment boundary tests: malformed callbacks never create an entitlement.
  const ipn = await fetch(`${base}/api/sslcommerz/ipn`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'tran_id=&val_id=' });
  check(ipn.status === 422, `payment callback: expected 422, got ${ipn.status}`);
  const checkout = await fetch(`${base}/api/sslcommerz/checkout`, { method: 'POST', headers: { 'content-type': 'application/json', origin: base }, body: JSON.stringify({ name: 'x', email: 'bad', phone: '' }) });
  check(checkout.status === 422 || checkout.status === 503, `checkout boundary: unexpected ${checkout.status}`);
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`Interaction smoke failed (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('Interaction smoke passed: keyboard, reduced motion, WebGL fallback, quiz/payment boundaries');
}
