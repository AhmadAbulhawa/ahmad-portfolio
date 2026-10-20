import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.PORTFOLIO_QA_URL || 'http://127.0.0.1:3000';
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const report = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const held = [];
  await page.route('**/films/01-goggles-on-aligned.mp4', (route) => {
    held.push(route);
  });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  async function wheel(p, d = 1) {
    await p.waitForTimeout(250);
    await p.mouse.move(700, 600);
    await p.mouse.wheel(0, d * 100);
    await p.waitForTimeout(100);
  }
  for (let i = 0; i < 4; i++) await wheel(page);
  assert.equal(await page.locator('.film-journey').getAttribute('data-chapter'), '0');
  assert.ok(
    ['loading', 'stalled'].includes(await page.locator('.film-journey').getAttribute('data-phase')),
  );
  await page.unroute('**/films/01-goggles-on-aligned.mp4');
  for (const route of held) await route.continue().catch(() => {});
  await page.waitForFunction(
    () => document.querySelector('.film-journey').dataset.phase === 'completed',
    null,
    { timeout: 15000 },
  );
  report.push('Delayed video response stays gated, then plays the same film to completion');
  await page.getByRole('link', { name: 'Ahmad Abulhawa home' }).click();
  await page.locator('video').evaluate((v) => {
    v.play = () =>
      Promise.reject(new DOMException('Simulated user activation loss', 'NotAllowedError'));
  });
  await wheel(page);
  assert.equal(await page.locator('.film-journey').getAttribute('data-phase'), 'stalled');
  await page.locator('video').evaluate((v) => {
    delete v.play;
  });
  await wheel(page);
  await page.waitForFunction(
    () => document.querySelector('.film-journey').dataset.phase === 'completed',
    null,
    { timeout: 15000 },
  );
  assert.equal(await page.locator('.film-journey').getAttribute('data-chapter'), '0');
  assert.equal(await page.getByText('TAP TO CONTINUE FILM', { exact: true }).count(), 0);
  report.push('Rejected play recovers on a real wheel gesture without a bypass button');
  await page.close();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  await context.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return /webgl/.test(type) ? null : get.call(this, type, ...args);
    };
  });
  const fallback = await context.newPage();
  const errors = [];
  fallback.on('pageerror', (e) => errors.push(e.message));
  await fallback.goto(base, { waitUntil: 'networkidle' });
  async function enterGallery() {
    await fallback.goto(base, { waitUntil: 'networkidle' });
    for (let i = 0; i < 3; i++) {
      await wheel(fallback);
      for (let attempt = 0; attempt < 3; attempt++) {
        await fallback.waitForFunction(() => ['completed', 'stalled'].includes(
          document.querySelector('.film-journey').dataset.phase), null, { timeout: 22000 });
        if (await fallback.locator('.film-journey').getAttribute('data-phase') === 'completed') break;
        await wheel(fallback);
      }
      await fallback.waitForFunction(
        () => document.querySelector('.film-journey').dataset.phase === 'completed',
        null, { timeout: 22000 },
      );
    }
    await wheel(fallback);
    await fallback.waitForSelector('.spiral-scene[data-webgl="unavailable"]');
  }
  for (let i = 0; i < 4; i++) {
    await enterGallery();
    for (let j = 0; j < i; j++)
      await fallback.getByRole('button', { name: 'Next project', exact: true }).click();
    const card = fallback.locator('.glass-project').nth(i);
    await fallback.waitForFunction(
      (i) =>
        Math.abs(Number(document.querySelectorAll('.glass-project')[i]?.dataset.relative)) < 0.001,
      i,
    );
    const href = await card.getAttribute('href');
    await card.click();
    await fallback.waitForURL(`**${href}`, { timeout: 8000 });
    assert.equal(await fallback.locator('h1').count(), 1);
  }
  assert.deepEqual(errors, []);
  report.push(
    'WebGL unavailable: CSS3D gallery renders, all four real card links open, reduced-motion controls work',
  );
  await context.close();
  console.log(JSON.stringify({ passed: true, checks: report }, null, 2));
} finally {
  await browser.close();
}
