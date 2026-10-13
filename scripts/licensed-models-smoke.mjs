import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const base = (process.env.MODEL_SMOKE_BASE ?? 'http://127.0.0.1:4321').replace(/\/$/, '');
const screenshotDir = process.env.MODEL_SCREENSHOT_DIR ?? '/tmp/posora-licensed-models';
const executablePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
await mkdir(screenshotDir, { recursive: true });
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };
const cases = [
  { world: 'food', selector: '#world .rail-list [data-i="3"]', expected: ['food_lychee_01/food_lychee_01.glb'], shot: 'food-fruit-wheel.png' },
  { world: 'food', selector: '#world .rail-list [data-i="5"]', expected: ['food_ginger_01/food_ginger_01.glb'], shot: 'food-ginger.png' },
  { world: 'life', selector: 'button.grow:has-text("ঔষধি")', expected: ['food_ginger_01/food_ginger_01.glb'], shot: 'life-ginger.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="2"]', expected: ['rock_07/rock_07.glb'], shot: 'discovery-rock.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="3"]', expected: ['korean_public_payphone_01/korean_public_payphone_01.glb'], shot: 'discovery-telephone.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="6"]', expected: ['industrial_microscope/industrial_microscope.glb', 'seadogs_compass/seadogs_compass.glb', 'alarm_clock_01/alarm_clock_01.glb'], shot: 'discovery-instruments.png' },
  { world: 'social', selector: '#world .rail-list [data-i="7"]', expected: ['alarm_clock_01/alarm_clock_01.glb'], shot: 'social-screen-time.png' },
  { world: 'language', selector: '#world .rail-list [data-i="3"]', expected: ['bananas/bananas.glb'], shot: 'language-fruit.png' },
];

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let currentWorld = '';
  for (const test of cases) {
    if (currentWorld !== test.world) {
      currentWorld = test.world;
      await page.goto(`${base}/${currentWorld}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.locator('#hero-host').waitFor({ state: 'attached', timeout: 15000 });
      await page.waitForFunction(() => !!document.querySelector('#hero-host canvas'), null, { timeout: 15000 });
      // The island can replace the host during initial hydration; scroll the
      // current node from page context instead of retaining a stale locator.
      await page.evaluate(() => document.querySelector('#hero-host')?.scrollIntoView({ block: 'center' }));
    }
    const responses = test.expected.map((asset) => page.waitForResponse((response) =>
      new URL(response.url()).pathname.endsWith(`/models/${asset}`), { timeout: 10000 })
      .then((response) => ({ asset, status: response.status() }))
      .catch(() => ({ asset, status: 0 })));
    await page.locator(test.selector).evaluate((element) => { if (element instanceof HTMLElement) element.click(); });
    if (test.shot === 'food-fruit-wheel.png') {
      await page.locator('.chip[data-di="1"]').evaluate((element) => { if (element instanceof HTMLElement) element.click(); });
    }
    if (test.shot === 'life-ginger.png') {
      await page.locator('.chip[data-di="3"]').evaluate((element) => { if (element instanceof HTMLElement) element.click(); });
    }
    if (test.shot === 'discovery-instruments.png') {
      await page.locator('.chip[data-di="3"]').evaluate((element) => { if (element instanceof HTMLElement) element.click(); });
    }
    if (test.shot === 'discovery-telephone.png') {
      await page.locator('.chip[data-di="6"]').evaluate((element) => { if (element instanceof HTMLElement) element.click(); });
    }
    if (test.shot === 'language-fruit.png') {
      await page.locator('.chip[data-di="2"]').evaluate((element) => { if (element instanceof HTMLElement) element.click(); });
    }
    if (test.shot === 'social-screen-time.png') {
      await page.locator('.chip[data-di="5"]').evaluate((element) => { if (element instanceof HTMLElement) element.click(); });
    }
    for (const result of await Promise.all(responses)) check(result.status === 200, `${test.world}: ${result.asset} request was ${result.status || 'not observed'}`);
    // Let the GLTF parser finish attaching the successful response before the
    // visual capture; an HTTP 200 alone does not prove the scene can use it.
    // GLTFLoader must parse the GLB and its image textures after the transfer;
    // give that asynchronous attachment a visible frame before screenshotting.
    await page.waitForTimeout(1800);
    const canvas = page.locator('#hero-host canvas');
    check(await canvas.count() === 1, `${test.world}: focused scene canvas missing after selecting ${test.selector}`);
    await canvas.screenshot({ path: `${screenshotDir}/${test.shot}` }).catch((error) => failures.push(`${test.world}: could not capture ${test.shot}: ${error.message}`));
    console.log(`PASS /${test.world}/ ${test.expected.join(', ')}`);
  }
  check(errors.length === 0, `uncaught page errors: ${errors.slice(0, 3).join(' | ')}`);
  await page.close();
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`Licensed-model smoke failed (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Licensed-model smoke passed: ${cases.length} collection states. Canvas captures: ${screenshotDir}`);
}
