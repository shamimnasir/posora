import { chromium } from 'playwright-core';

/**
 * The explosion runtime is shared, but the teaching record belongs to each
 * world/category/item.  Check both halves: every visual item must have a
 * reviewed detail record, and every item in every category must surface
 * that record beside the canvas after the reveal control moves. Every item's
 * copy is validated; one real item per category exercises the rendered flow.
 *
 * Space has its own explorer and Food has its authored tabletop callouts, so
 * those are intentionally covered by their dedicated smoke suites.
 */
const base = (process.env.SMOKE_BASE ?? 'http://127.0.0.1:4321').replace(/\/$/, '');
const executablePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const worlds = ['physics', 'chemistry', 'life', 'nature', 'math', 'money', 'language', 'social', 'discovery'];
const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };
let checkedItems = 0;

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  for (const world of worlds) {
    await page.goto(`${base}/${world}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#world-data', { state: 'attached' });
    const cats = await page.locator('#world-data').evaluate((node) => JSON.parse(node.textContent ?? '[]'));
    for (const [index, cat] of cats.entries()) {
      check(Array.isArray(cat.detail) && cat.detail.length === cat.items.length,
        `${world}/${cat.n}: ${cat.items.length} canvas items do not all have a detail record`);
      for (const [itemIndex, detail] of (cat.detail ?? []).entries()) {
        check((detail?.l1?.trim().length ?? 0) > 20,
          `${world}/${cat.n}/${cat.items[itemIndex]}: missing explanation`);
        check((detail?.fun?.trim().length ?? 0) > 12,
          `${world}/${cat.n}/${cat.items[itemIndex]}: missing interesting fact`);
      }
      if (!Array.isArray(cat.detail) || !cat.detail.length) continue;
      await page.locator(`.rail-list [data-i="${index}"]`).evaluate((el) => { if (el instanceof HTMLElement) el.click(); });
      for (const [itemIndex, item] of cat.items.slice(0, 1).entries()) {
        if (itemIndex > 0) await page.locator(`.chip[data-di="${itemIndex}"]`).evaluate((el) => { if (el instanceof HTMLElement) el.click(); });
        await page.locator('#ctl-x').evaluate((el) => { el.value = '55'; el.dispatchEvent(new Event('input', { bubbles: true })); });
        const note = page.locator('#explode-note');
        const noteVisible = await note.isVisible();
        check(noteVisible, `${world}/${cat.n}/${item}: exploded-view fact panel is hidden`);
        check((await page.locator('#explode-note-title').innerText()).includes(item), `${world}/${cat.n}/${item}: fact panel title does not name the selected item`);
        check((await page.locator('#explode-note-copy').innerText()).trim().length > 20, `${world}/${cat.n}/${item}: fact panel explanation is empty`);
        check((await page.locator('#explode-note-fun').innerText()).trim().length > 12, `${world}/${cat.n}/${item}: fact panel interesting fact is empty`);
        checkedItems++;
        if (noteVisible) {
          await page.locator('#explode-note-return').evaluate((el) => { if (el instanceof HTMLElement) el.click(); });
          check(await note.isHidden(), `${world}/${cat.n}/${item}: return control did not hide fact panel`);
        }
      }
    }
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `${world}: horizontal overflow`);
  }
  await page.close();
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`Exploded-facts smoke failed (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Exploded-facts smoke passed: ${worlds.length} generic worlds; ${checkedItems} individual objects opened with facts and return controls`);
}
