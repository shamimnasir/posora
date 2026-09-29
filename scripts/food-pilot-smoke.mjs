import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const base = (process.env.SMOKE_BASE ?? 'http://127.0.0.1:4321').replace(/\/$/, '');
const screenshotDir = process.env.FOOD_SCREENSHOT_DIR ?? 'docs/animation-remake/evidence/food-93e5f02c';
const executablePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
await mkdir(screenshotDir, { recursive: true });
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };
const foodCaptureIds = ['carbohydrate', 'protein', 'fat', 'vitamin', 'minerals', 'water', 'fiber', 'energy'];
const frameHostBelowStickyHeader = async (page) => page.evaluate(() => {
  const host = document.querySelector('#hero-host');
  const header = document.querySelector('.hdr');
  if (!host) return;
  const top = host.getBoundingClientRect().top + window.scrollY;
  const offset = (header?.getBoundingClientRect().height ?? 0) + 12;
  window.scrollTo({ top: Math.max(0, top - offset), behavior: 'instant' });
});

try {
  for (const viewport of [
    { name: 'mobile', width: 360, height: 800, start: true },
    { name: 'tablet', width: 768, height: 1024, start: false },
    { name: 'desktop', width: 1440, height: 900, start: false },
  ]) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      // Astro's local dev toolbar intentionally injects inline scripts while
      // the test site uses the production CSP. This warning is dev-only; retain
      // all application errors, including module/network/load failures.
      const text = message.text();
      const telemetryNoise = text.includes('google.com/g/collect') || text.includes('google-analytics.com/g/collect');
      if (message.type() === 'error' && !telemetryNoise && !text.includes('Executing inline script violates the following Content Security Policy')) errors.push(`console: ${text}`);
    });
    const response = await page.goto(`${base}/food/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Viewing every lesson can legitimately grant awards and fire confetti.
    // Suppress only that transient celebration in captures so the 3D model,
    // crop and control clearance remain assessable; no production source or
    // interaction behavior is changed by this test-only style.
    await page.addStyleTag({ content: '#fx { visibility: hidden !important; }' });
    check((response?.status() ?? 0) === 200, `${viewport.name}: /food/ did not return 200`);
    const labels = await page.locator('.chip[data-di]').allInnerTexts();
    const expected = ['শর্করা', 'আমিষ', 'স্নেহ', 'ভিটামিন', 'খনিজ লবণ', 'পানি', 'আঁশ', 'ক্যালরি'];
    check(labels.length === expected.length && expected.every((label, i) => labels[i]?.includes(label)), `${viewport.name}: the eight lesson labels/order changed`);

    if (viewport.start) {
      await page.locator('#world-start').waitFor({ state: 'visible', timeout: 10000 });
      await page.locator('#world-start').click({ force: true });
    }
    await page.waitForFunction(() => {
      const canvas = document.querySelector('#hero-host canvas');
      return canvas && canvas.width > 300 && canvas.height > 500;
    }, { timeout: 15000 }).catch(() => {});
    const drawingBuffer = await page.locator('#hero-host canvas').evaluate((canvas) => [canvas.width, canvas.height]).catch(() => [0, 0]);
    check(drawingBuffer[0] > 300 && drawingBuffer[1] > 500, `${viewport.name}: interactive Food scene did not initialize (${drawingBuffer.join('×')})`);
    await page.waitForFunction(() => document.documentElement.dataset.foodFishAsset === 'ready', { timeout: 15000 }).catch(() => {});
    const fishAssetState = await page.evaluate(() => document.documentElement.dataset.foodFishAsset ?? 'pending');
    check(fishAssetState === 'ready', `${viewport.name}: licensed fish asset did not become ready (${fishAssetState})`);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `${viewport.name}: horizontal overflow`);
    check((await page.locator('#hero-hint').innerText()).includes('খাবার বেছে নাও'), `${viewport.name}: Food-specific interaction instructions are missing`);
    check((await page.locator('#ctl-x-label').innerText()) === 'খুঁটিনাটি', `${viewport.name}: authored-detail control label is missing`);
    await frameHostBelowStickyHeader(page);
    await page.screenshot({ path: join(screenshotDir, `food-${viewport.name}-overview.png`) });

    // Rice is the first geometry gate in the pilot brief: review its focus and
    // authored close-up before moving to the fish/detail case.
    await page.locator('.chip[data-di="0"]').evaluate((el) => { if (el instanceof HTMLButtonElement) el.click(); });
    await page.waitForTimeout(800);
    await frameHostBelowStickyHeader(page);
    await page.screenshot({ path: join(screenshotDir, `food-${viewport.name}-rice-focus.png`) });
    await page.locator('#ctl-x').evaluate((el) => { el.value = '66'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: join(screenshotDir, `food-${viewport.name}-rice-detail-mid.png`) });
    await page.locator('#ctl-x').evaluate((el) => { el.value = '100'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForTimeout(2600);
    check(await page.locator('#food-detail-note').isVisible(), `${viewport.name}: rice close-up explanation is missing`);
    await page.screenshot({ path: join(screenshotDir, `food-${viewport.name}-rice-detail.png`) });
    await page.locator('#food-detail-return').click();
    check(await page.locator('#food-detail-note').isHidden(), `${viewport.name}: detail return did not restore the regular view`);
    await frameHostBelowStickyHeader(page);

    // Capture the focused fish before touring the rest of the catalog, so the
    // review image is not covered by category-completion confetti.
    await page.locator('.chip[data-di="1"]').evaluate((el) => { if (el instanceof HTMLButtonElement) el.click(); });
    check((await page.locator('#item-name').innerText()) === 'আমিষ', `${viewport.name}: fish selection did not update the lesson`);
    await page.waitForTimeout(3200);
    await frameHostBelowStickyHeader(page);
    await page.screenshot({ path: join(screenshotDir, `food-${viewport.name}-fish-focus.png`) });
    // Tilt the composed tableau down slightly to inspect that the fish is
    // supported by the platter rather than appearing suspended in a top view.
    const heroBox = await page.locator('#hero-host').boundingBox();
    if (heroBox) {
      const x = heroBox.x + heroBox.width / 2, y = heroBox.y + heroBox.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x, y - 28, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(500);
      await frameHostBelowStickyHeader(page);
      await page.screenshot({ path: join(screenshotDir, `food-${viewport.name}-fish-contact-angle.png`) });
      await page.locator('#h-reset').click();
      await page.waitForTimeout(500);
    }
    await page.locator('#ctl-x').evaluate((el) => { el.value = '66'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: join(screenshotDir, `food-${viewport.name}-fish-detail-mid.png`) });
    await page.locator('#ctl-x').evaluate((el) => { el.value = '100'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    // Let one-shot award/confetti effects clear so the review image shows the
    // authored model, not transient UI feedback.
    await page.waitForTimeout(3200);
    check(await page.locator('#food-detail-note').isVisible(), `${viewport.name}: the focused-detail explanation is missing`);
    check((await page.locator('#food-detail-copy').innerText()).includes('আরও কাছে দেখো'), `${viewport.name}: the fish gill/eye macro explanation is missing`);
    const toastOverlap = await page.evaluate(() => {
      const toast = document.querySelector('#award-toast');
      if (!toast || toast.hidden) return [];
      const a = toast.getBoundingClientRect();
      return ['.zoombar', '.hint', '.model-note', '.scenebar'].filter((selector) => {
        const node = document.querySelector(selector);
        if (!node) return false;
        const b = node.getBoundingClientRect();
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      });
    });
    check(toastOverlap.length === 0, `${viewport.name}: Food award feedback overlaps ${toastOverlap.join(', ')}`);
    await frameHostBelowStickyHeader(page);
    await page.screenshot({ path: join(screenshotDir, `food-${viewport.name}-fish-detail.png`) });
    await page.screenshot({ path: join(screenshotDir, `food-${viewport.name}-fish-gill-macro.png`) });
    await page.locator('#food-detail-return').click();
    check(await page.locator('#food-detail-note').isHidden(), `${viewport.name}: fish detail return did not restore focus`);

    // The rest of the picker is still covered after a clean review capture.
    for (const [i, label] of expected.entries()) {
      await page.locator(`.chip[data-di="${i}"]`).evaluate((el) => { if (el instanceof HTMLButtonElement) el.click(); });
      check((await page.locator('#item-name').innerText()) === label, `${viewport.name}: lesson target ${i} did not update to ${label}`);
      if (i >= 2 && i <= 6) {
        await page.waitForTimeout(1200);
        await frameHostBelowStickyHeader(page);
        await page.screenshot({ path: join(screenshotDir, `food-${viewport.name}-${foodCaptureIds[i]}-focus.png`) });
        await page.locator('#ctl-x').evaluate((el) => { el.value = '100'; el.dispatchEvent(new Event('input', { bubbles: true })); });
        await page.waitForTimeout(1500);
        check(await page.locator('#food-detail-note').isVisible(), `${viewport.name}: ${foodCaptureIds[i]} detail explanation is missing`);
        await frameHostBelowStickyHeader(page);
        await page.screenshot({ path: join(screenshotDir, `food-${viewport.name}-${foodCaptureIds[i]}-detail.png`) });
        await page.locator('#food-detail-return').click();
        check(await page.locator('#food-detail-note').isHidden(), `${viewport.name}: ${foodCaptureIds[i]} detail return did not restore focus`);
        await frameHostBelowStickyHeader(page);
      }
    }

    // The scene picker retains lesson state, including the conceptual calorie
    // panel; it is not a numeric nutrition recommendation.
    await page.locator('#ctl').evaluate((el) => { el.value = '100'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    check((await page.locator('#item-name').innerText()) === 'ক্যালরি', `${viewport.name}: item slider did not select the eighth item`);
    check(await page.locator('#food-energy').isVisible(), `${viewport.name}: calorie concept panel did not appear`);
    await page.locator('#ctl').evaluate((el) => { el.value = '0'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    check((await page.locator('#item-name').innerText()) === 'শর্করা', `${viewport.name}: item slider did not return to the first item`);
    check(errors.length === 0, `${viewport.name}: uncaught page errors: ${errors.slice(0, 3).join(' | ')}`);
    console.log(`${viewport.name}: buffer=${drawingBuffer.join('×')}, 8 items, selection/detail/calorie controls passed, page errors=${errors.length}`);
    await page.close();
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`Food pilot smoke failed (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Food pilot smoke passed. Captures: ${screenshotDir}`);
}
