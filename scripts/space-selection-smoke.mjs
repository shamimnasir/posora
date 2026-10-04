import { chromium } from 'playwright-core';

const base = (process.env.SMOKE_BASE ?? 'http://127.0.0.1:4321').replace(/\/$/, '');
const executablePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };
const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

try {
  for (const viewport of [{ name: 'mobile', width: 390, height: 844 }, { name: 'desktop', width: 1280, height: 900 }]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const response = await page.goto(`${base}/space/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    check(response?.status() === 200, `${viewport.name}: /space/ did not return 200`);
    await page.waitForSelector('#space-data', { state: 'attached' });
    const bodies = await page.locator('#space-data').evaluate((node) => JSON.parse(node.textContent ?? '[]'));

    if (viewport.name === 'mobile') {
      const start = page.locator('#space-start');
      if (await start.isVisible()) await start.click({ force: true });
    }
    await page.waitForFunction(() => {
      const canvas = document.querySelector('#planet-host canvas');
      return canvas && canvas.width > 100 && canvas.height > 100;
    }, { timeout: 15000 }).catch(() => {});

    // Regression for /space/: Earth is the default record. Re-entering the
    // system and choosing that same record used to leave the globe at system
    // scale with its layer/exploration controls hidden (the rail click was a
    // no-op, while a canvas click only changed the camera).
    await page.locator('#crumb-system').click();
    await page.waitForFunction(() => document.querySelector('#crumb-system')?.classList.contains('cur'));
    await page.locator('.rail-list [data-id="earth"]').click();
    await page.waitForFunction(() => document.querySelector('#crumb-body')?.classList.contains('cur'));
    check(!(await page.locator('#branchbar').isHidden()), `${viewport.name}: same-selected Earth did not reveal its component explorer`);
    check((await page.locator('#b-name').innerText()) === 'পৃথিবী', `${viewport.name}: Earth heading did not remain selected`);
    check((await page.locator('#spec .row').count()) >= 5, `${viewport.name}: Earth measurements are missing`);
    check((await page.locator('#b-text').innerText()).length > 30, `${viewport.name}: Earth reading is missing`);
    await page.locator('#branch-chips [data-br="plates"]').click();
    check(await page.locator('#subtopic').isVisible(), `${viewport.name}: Earth plate feature did not open its detail`);
    check((await page.locator('#sub-text').innerText()).length > 30, `${viewport.name}: Earth feature information is empty`);
    await page.locator('#sub-close').click();

    // Every system body must be selectable from the rail and expose its own
    // facts, measurements and at least one explorable feature.
    for (const body of bodies) {
      await page.locator(`.rail-list [data-id="${body.id}"]`).click();
      await page.waitForFunction((name) => document.querySelector('#b-name')?.textContent === name, body.bn);
      check((await page.locator('#b-text').innerText()).length > 20, `${viewport.name}/${body.id}: reading did not update`);
      check((await page.locator('#b-fun').innerText()).length > 10, `${viewport.name}/${body.id}: interesting fact did not update`);
      check((await page.locator('#spec .row').count()) >= 3, `${viewport.name}/${body.id}: stats did not update`);
      check(!(await page.locator('#branchbar').isHidden()), `${viewport.name}/${body.id}: feature explorer is hidden`);
      const firstBranch = page.locator('#branch-chips button').first();
      check(await firstBranch.count() > 0, `${viewport.name}/${body.id}: no explorable feature`);
      if (await firstBranch.count()) {
        await firstBranch.click();
        check(await page.locator('#subtopic').isVisible(), `${viewport.name}/${body.id}: feature detail panel did not open`);
        check((await page.locator('#sub-text').innerText()).trim().length > 25, `${viewport.name}/${body.id}: feature detail has no explanatory copy`);
      }
    }
    check(errors.length === 0, `${viewport.name}: uncaught errors: ${errors.slice(0, 3).join(' | ')}`);
    console.log(`${viewport.name}: Earth same-selection regression + ${bodies.length} bodies' reading, stats and detail controls passed`);
    await page.close();
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`Space selection smoke failed (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('Space selection smoke passed at mobile and desktop sizes.');
}
