import { chromium } from 'playwright-core';

const base = (process.env.SMOKE_BASE ?? 'https://posora.com').replace(/\/$/, '');
const executablePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const routes = ['/', '/space/', '/physics/', '/chemistry/', '/life/', '/nature/', '/food/', '/math/', '/money/', '/language/', '/social/', '/discovery/', '/printables/', '/digital-pack/', '/family/', '/blog/', '/blog/sorol-jontro-kake-bole/'];
const viewports = [{ name: 'mobile', width: 360, height: 800 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'desktop', width: 1440, height: 900 }];

const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const failures = [];
try {
  const health = await fetch(`${base}/api/health`);
  if (!health.ok) failures.push(`/api/health: HTTP ${health.status}`);
  const protectedDownload = await fetch(`${base}/api/digital-pack/download/bundle`);
  if (protectedDownload.status !== 401) failures.push(`/api/digital-pack/download/bundle: expected 401, got ${protectedDownload.status}`);
  const malformedIpn = await fetch(`${base}/api/sslcommerz/ipn`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'tran_id=&val_id=' });
  if (malformedIpn.status !== 422) failures.push(`/api/sslcommerz/ipn: expected 422 for malformed callback, got ${malformedIpn.status}`);
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const route of routes) {
      const url = `${base}${route}`;
      try {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const status = response?.status() ?? 0;
        const result = await page.evaluate(() => ({
          title: document.title,
          bodyText: document.body.innerText.trim().length,
          overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
          primary: Boolean(document.querySelector('main, h1, [role="main"]')),
          blogImage: location.pathname.startsWith('/blog/')
            ? Boolean([...document.querySelectorAll('main img')].find((img) => img.complete && img.naturalWidth > 0))
            : true,
        }));
        if (status < 200 || status >= 400) failures.push(`${viewport.name} ${route}: HTTP ${status}`);
        if (!result.title || !result.bodyText || !result.primary) failures.push(`${viewport.name} ${route}: incomplete document`);
        if (!result.blogImage) failures.push(`${viewport.name} ${route}: blog image did not load`);
        if (viewport.name === 'mobile' && result.overflow) failures.push(`${viewport.name} ${route}: horizontal overflow`);
      } catch (error) {
        failures.push(`${viewport.name} ${route}: ${error.message}`);
      }
    }
    if (errors.length) failures.push(`${viewport.name}: page errors: ${errors.slice(0, 3).join(' | ')}`);
    await context.close();
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`Browser smoke failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Browser smoke passed: ${routes.length} routes × ${viewports.length} viewports`);
}
