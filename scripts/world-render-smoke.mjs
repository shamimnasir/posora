import { chromium } from 'playwright-core';

const base = (process.env.WORLD_SMOKE_BASE ?? 'https://posora.com').replace(/\/$/, '');
const executablePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const allWorlds = ['space', 'physics', 'chemistry', 'life', 'nature', 'food', 'math', 'money', 'language', 'social', 'discovery'];
const worlds = process.env.WORLD_SMOKE_ONLY ? allWorlds.filter((world) => world === process.env.WORLD_SMOKE_ONLY) : allWorlds;
if (!worlds.length) throw new Error(`Unknown WORLD_SMOKE_ONLY value: ${process.env.WORLD_SMOKE_ONLY}`);
const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];

const browser = await chromium.launch({
  executablePath,
  headless: true,
  // Use real software WebGL instead of --disable-gpu. The old smoke command
  // disabled the renderer, so it never exercised the experiences it claimed
  // to test.
  args: ['--no-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const failures = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    for (const slug of worlds) {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error' && !message.text().includes('Content Security Policy')) errors.push(message.text());
      });
      try {
        const response = await page.goto(`${base}/${slug}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (!response?.ok()) failures.push(`${viewport.name} /${slug}/: HTTP ${response?.status() ?? 0}`);
        const host = slug === 'space' ? '#planet-host' : '#hero-host';
        await page.evaluate((selector) => document.querySelector(selector)?.scrollIntoView({ block: 'center' }), host);

        if (viewport.name === 'mobile') {
          const starter = slug === 'space' ? '#space-start' : '#world-start';
          const button = page.locator(starter);
          if (await button.count()) {
            await button.waitFor({ state: 'visible', timeout: 8000 });
            if (slug !== 'space') {
              // The readiness marker is emitted by newer bundles, but the
              // production site may still be serving an older cached build
              // without it. Give the module a short chance to attach, then
              // exercise the actual button; the canvas-mount assertion below
              // remains the authoritative success signal.
              await page.waitForFunction(() => document.querySelector('#world-start')?.getAttribute('data-interactive') === 'true', null, { timeout: 2500 }).catch(() => undefined);
              await page.waitForTimeout(400);
            }
            await button.click();
          }
        }

        try {
          await page.waitForFunction((world) => {
            if (world === 'space') {
              const start = document.querySelector('#space-start');
              const canvas = document.querySelector('#planet-host canvas');
              return !start || start.hidden || Boolean(canvas?.getAttribute('data-engine'));
            }
            return !!document.querySelector('#hero-host canvas')?.getAttribute('data-engine');
          }, slug, { timeout: 15000 });
        } catch {
          const state = await page.evaluate((world) => ({
            fallback: document.querySelector('#hero-loading')?.textContent?.trim(),
            spaceStart: document.querySelector('#space-start')?.hidden,
            worldStart: document.querySelector('#world-start')?.textContent?.trim(),
            canvas: (() => {
              const element = document.querySelector(world === 'space' ? '#planet-host canvas' : '#hero-host canvas');
              return element ? { engine: element.getAttribute('data-engine'), width: element.width, height: element.height } : null;
            })(),
          }), slug);
          const readyAfterTimeout = slug === 'space'
            ? state.spaceStart === true || Boolean(state.canvas?.engine)
            : Boolean(state.canvas?.engine);
          if (!readyAfterTimeout) {
            failures.push(`${viewport.name} /${slug}/: 3D scene did not mount (${JSON.stringify(state)}${errors.length ? `, errors=${errors.slice(0, 2).join(' | ')}` : ''})`);
          }
        }

        if (slug === 'nature') {
          for (const control of ['#nc-overview', '#nc-close', '#nc-detail']) await page.locator(control).click();
          if (!(await page.locator('#nc-caption').textContent())) failures.push(`${viewport.name} /nature/: scene controls produced no caption`);
        } else if (slug !== 'space') {
          const category = page.locator('#world .rail-list button').nth(1);
          if (await category.count()) await category.evaluate((element) => { if (element instanceof HTMLElement) element.click(); });
        }
        console.log(`PASS ${viewport.name} /${slug}/`);
        if (errors.length) failures.push(`${viewport.name} /${slug}/: ${errors.slice(0, 2).join(' | ')}`);
      } catch (error) {
        failures.push(`${viewport.name} /${slug}/: ${error instanceof Error ? error.message : error}`);
      } finally {
        await page.close();
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`World render smoke failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`World render smoke passed: ${worlds.length} worlds × ${viewports.length} viewports; WebGL mounted and available controls were exercised.`);
}
