import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.PORTFOLIO_QA_URL || 'http://127.0.0.1:3000';
const output = path.resolve(process.env.PORTFOLIO_QA_OUTPUT || 'docs/qa/screenshots');
const routes = [
  ['home', '/', 'Thoughtful code.'],
  ['garage-tahmeen', '/projects/garage-tahmeen/', 'Garage Tahmeen'],
  ['munjiz', '/projects/munjiz/', 'Munjiz'],
  ['aqar-ai', '/projects/aqar-ai/', 'AqarAI'],
  ['cismate', '/projects/cismate/', 'CISmate'],
];
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const report = { viewport: { width: 1440, height: 1000 }, pages: [], interactions: [] };
try {
  const context = await browser.newContext({ viewport: report.viewport, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    window.qaShifts = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        if (!entry.hadRecentInput) window.qaShifts.push(entry.value);
    }).observe({ type: 'layout-shift', buffered: true });
  });
  for (const [slug, route, heading] of routes) {
    const page = await context.newPage();
    await page.bringToFront();
    const videos = [],
      errors = [],
      failures = [];
    page.on('request', (request) => {
      if (request.url().endsWith('.mp4')) videos.push(request.url());
    });
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('response', (response) => {
      if (response.status() >= 400) failures.push(response.url());
    });
    const response = await page.goto(base + route, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    assert.equal(await page.locator('h1').count(), 1);
    assert.ok((await page.locator('h1').innerText()).includes(heading));
    assert.deepEqual(videos, [], 'Videos must not download on navigation');
    await page.evaluate(() => document.fonts.ready);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 650) {
      await page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), y);
      await page.waitForTimeout(100);
    }
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(1100);
    if (slug === 'garage-tahmeen' || slug === 'munjiz') {
      // Regression: jumping above the sequence must restore its first poster.
      await page.waitForFunction(() =>
        document.querySelector('.sequence-counter').textContent.includes('01 / 03'),
      );
      const current = await page.locator('.sequence-screen img').getAttribute('src');
      assert.ok(current.includes(slug === 'munjiz' ? 'arrival' : 'rotation'));
    }
    await page
      .locator('img')
      .evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
    const broken = await page
      .locator('img')
      .evaluateAll((images) =>
        images.filter((image) => !image.complete || !image.naturalWidth).map((image) => image.src),
      );
    assert.deepEqual(broken, []);
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      cls: window.qaShifts.reduce((sum, value) => sum + value, 0),
    }));
    assert.equal(dimensions.scrollWidth, 1440);
    assert.equal(dimensions.cls, 0);
    const links = await page
      .locator('a')
      .evaluateAll((items) =>
        items.map((a) => ({ href: a.getAttribute('href'), target: a.target, rel: a.rel })),
      );
    for (const link of links.filter((link) => link.target === '_blank')) {
      assert.ok(link.rel.includes('noopener') && link.rel.includes('noreferrer'));
    }
    if (slug === 'home') {
      for (const expected of [
        'mailto:ahmadabulhawar6@gmail.com',
        'https://github.com/AhmadAbulhawa',
        'https://www.linkedin.com/in/ahmad-abulhawa-1a8835338',
      ]) {
        assert.ok(links.some((link) => link.href === expected));
      }
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(failures, []);
    assert.deepEqual(videos, []);
    await page.screenshot({ path: path.join(output, `${slug}-1440.png`), fullPage: true });
    report.pages.push({
      slug,
      ...dimensions,
      brokenImages: 0,
      runtimeErrors: 0,
      failedResources: 0,
      initialVideoRequests: 0,
    });
    console.log(`Captured ${slug} at 1440px; CLS ${dimensions.cls}`);
    if (slug === 'garage-tahmeen' || slug === 'munjiz') {
      for (let index = 0; index < 3; index++) {
        await page
          .locator(`[data-scene="${index}"]`)
          .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
        // Programmatic scroll events and screenshot viewport restoration flush
        // asynchronously. Wait for two paints before reading scene state.
        await page.evaluate(
          () =>
            new Promise((resolve) => {
              requestAnimationFrame(() => requestAnimationFrame(resolve));
            }),
        );
        await page.waitForFunction(
          (value) =>
            document.querySelector('.sequence-counter').textContent.includes(`0${value + 1} / 03`),
          index,
        );
        console.log(`Playing ${slug} scene ${index + 1}`);
        await page.getByRole('button', { name: /^Play scene —/ }).click();
        await page
          .waitForFunction(
            () => document.querySelector('.sequence-screen video')?.currentTime > 0,
            null,
            { timeout: 10000 },
          )
          .catch(async (error) => {
            console.error(
              await page.evaluate(() => {
                const v = document.querySelector('.sequence-screen video');
                return {
                  visible: document.visibilityState,
                  counter: document.querySelector('.sequence-counter')?.textContent,
                  scrollY,
                  height: innerHeight,
                  chapters: [...document.querySelectorAll('[data-scene]')].map(
                    (el) => el.getBoundingClientRect().top,
                  ),
                  video: v
                    ? {
                        src: v.src,
                        paused: v.paused,
                        time: v.currentTime,
                        ready: v.readyState,
                        error: v.error?.message,
                      }
                    : null,
                };
              }),
            );
            throw error;
          });
        const video = await page.locator('.sequence-screen video').evaluate((el) => {
          const rect = el.getBoundingClientRect();
          return {
            width: el.videoWidth,
            height: el.videoHeight,
            controls: el.controls,
            muted: el.muted,
            ratio: rect.width / rect.height,
          };
        });
        assert.equal(video.width, slug === 'munjiz' ? 464 : 1434);
        assert.equal(video.height, slug === 'munjiz' ? 848 : 618);
        assert.ok(video.controls && video.muted);
        assert.ok(
          Math.abs(video.ratio - video.width / video.height) < 0.005,
          'Media must not stretch',
        );
        if (index > 0) {
          // Capture an authentic mid-scene frame by playing through the clip;
          // never substitute or synthesize project footage for the screenshots.
          await page.waitForFunction(() => {
            const video = document.querySelector('.sequence-screen video');
            return video && video.currentTime >= video.duration / 2;
          });
        }
        await page.locator('.sequence-screen video').evaluate((el) => el.pause());
        if (index > 0) {
          // Viewport views complement the full-page image of a sticky stage.
          await page.screenshot({ path: path.join(output, `${slug}-scene-${index + 1}-1440.png`) });
        }
      }
      await page.getByRole('button', { name: 'Previous scene' }).click();
      await page.waitForFunction(() =>
        document.querySelector('.sequence-counter').textContent.includes('02 / 03'),
      );
      assert.equal(await page.locator('video[src]').count(), 0);
      await page.getByRole('button', { name: 'Next scene' }).click();
      await page.waitForFunction(() =>
        document.querySelector('.sequence-counter').textContent.includes('03 / 03'),
      );
      report.interactions.push(
        `${slug}: all three scenes play at their native ratio; scroll, previous/next, source release and jump-to-top regression pass.`,
      );
    }
    if (slug === 'home' || slug === 'aqar-ai') {
      const trigger = page.locator('.media-trigger').first();
      await trigger.click();
      await page.getByRole('dialog').waitFor({ state: 'visible' });
      await page.waitForFunction(
        () => document.querySelector('dialog[open] video')?.currentTime > 0,
      );
      await page.keyboard.press('Escape');
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      assert.equal(await page.locator('video[src]').count(), 0);
      assert.equal(await trigger.evaluate((el) => document.activeElement === el), true);
      report.interactions.push(
        `${slug}: dialog playback, Escape, video release and focus restoration pass.`,
      );
    }
    if (slug === 'home') {
      for (const [, destination] of routes.slice(1)) {
        const link = page.locator(`a[href="${destination}"]`).first();
        await link.click();
        await page.waitForURL(base + destination);
        await page.locator('.back-link').click();
        await page.waitForURL(base + '/#work');
      }
      report.interactions.push(
        'Homepage: all four project entry links navigate and return to selected work.',
      );
    }
    if (slug !== 'home') {
      const next = page.locator('.next-project');
      const href = await next.getAttribute('href');
      await next.click();
      await page.waitForURL(base + href);
      await page.locator('.back-link').click();
      await page.waitForURL(base + '/#work');
      report.interactions.push(
        `${slug}: next-project and back-to-work links navigate successfully.`,
      );
    }
    assert.deepEqual(errors, [], 'Runtime errors after playback/navigation');
    assert.deepEqual(failures, [], 'Failed resources after playback/navigation');
    await page.close();
  }
  const reduced = await browser.newContext({ viewport: report.viewport, reducedMotion: 'reduce' });
  const page = await reduced.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  assert.equal(
    await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior),
    'auto',
  );
  assert.equal(await page.locator('h1').isVisible(), true);
  report.interactions.push('Reduced-motion desktop: immediate content and no smooth scrolling.');
  await reduced.close();
  await context.close();
  await fs.writeFile(
    path.join(output, '..', 'browser-report.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
} finally {
  await browser.close();
}
console.log('Desktop approval capture and interaction checks passed.');
