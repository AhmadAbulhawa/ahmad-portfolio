import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, webkit } from 'playwright';
const base = process.env.PORTFOLIO_QA_URL || 'http://127.0.0.1:3000';
const output = path.resolve(process.env.PORTFOLIO_QA_OUTPUT || 'work/qa');
await mkdir(output, { recursive: true });
const report = {
  browser: process.env.QA_BROWSER || 'chromium',
  results: [],
  stallRecoveries: [],
  screenshots: [],
};
const engine = process.env.QA_BROWSER === 'webkit' ? webkit : chromium;
const browser = await engine.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH && engine === chromium
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
  args: engine === chromium ? ['--no-sandbox', '--disable-dev-shm-usage'] : [],
});
try {
  for (const setup of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true },
  ].filter((setup) => !process.env.QA_VIEWPORT || setup.name === process.env.QA_VIEWPORT)) {
    const context = await browser.newContext({
      viewport: { width: setup.width, height: setup.height },
      isMobile: !!setup.isMobile,
      hasTouch: !!setup.hasTouch,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const touchProtocol =
      setup.hasTouch && engine === chromium ? await context.newCDPSession(page) : null;
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const section = page.locator('.film-journey'),
      video = page.locator('.film-video');
    const shot = async (name) => {
      const file = `${setup.name}-${name}.png`;
      await page.screenshot({ path: path.join(output, file) });
      report.screenshots.push(file);
    };
    const phase = async (p) =>
      page.waitForFunction((p) => document.querySelector('.film-journey')?.dataset.phase === p, p, {
        timeout: 22000,
      });
    const settledProject = async (index) =>
      page.waitForFunction(
        (index) => {
          const card = document.querySelectorAll('.glass-project')[index];
          return (
            card &&
            Math.abs(Number(card.dataset.relative)) < 0.0001 &&
            document.querySelector('.spiral-scene')?.dataset.moving === 'false'
          );
        },
        index,
        { timeout: 8000 },
      );
    const chapter = async (n) =>
      assert.equal(await section.getAttribute('data-chapter'), String(n));
    const gesture = async (direction = 1) => {
      await page.waitForTimeout(230);
      if (touchProtocol) {
        const start = direction > 0 ? 500 : 300;
        await touchProtocol.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ x: 195, y: start }],
        });
        for (let i = 1; i <= 5; i++) {
          await touchProtocol.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x: 195, y: start - direction * i * 40 }],
          });
          await page.waitForTimeout(20);
        }
        await touchProtocol.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else if (setup.hasTouch) {
        await section.dispatchEvent('touchstart', {
          touches: [{ clientY: direction > 0 ? 500 : 300, clientX: 195 }],
        });
        await section.dispatchEvent('touchend', {
          changedTouches: [{ clientY: direction > 0 ? 300 : 500, clientX: 195 }],
        });
      } else await page.mouse.wheel(0, 100 * direction);
    };
    const finishFilm = async () => {
      try {
        for (let attempt = 0; attempt < 3; attempt++) {
          await page.waitForFunction(
            () =>
              ['completed', 'stalled'].includes(
                document.querySelector('.film-journey')?.dataset.phase,
              ),
            null,
            { timeout: 22000 },
          );
          if ((await section.getAttribute('data-phase')) === 'completed') break;
          const media = await video.evaluate((v) => ({
            src: v.currentSrc,
            time: v.currentTime,
            duration: v.duration,
            seeking: v.seeking,
          }));
          if (media.seeking || !Number.isFinite(media.duration)) {
            await page.waitForFunction(
              () => {
                const v = document.querySelector('.film-video');
                return Number.isFinite(v?.duration) && !v.seeking;
              },
              null,
              { timeout: 10000 },
            );
            continue;
          }
          if (media.duration - media.time <= 0.05) {
            await phase('completed');
            break;
          }
          const chapterBefore = await section.getAttribute('data-chapter');
          report.stallRecoveries.push({ viewport: setup.name, ...media });
          await gesture(media.src.includes('-reverse') ? -1 : 1);
          assert.equal(
            await section.getAttribute('data-chapter'),
            chapterBefore,
            'Stall retry must keep the unfinished chapter',
          );
        }
        await phase('completed');
      } catch (error) {
        console.error(
          JSON.stringify({
            url: page.url(),
            stallRecoveries: report.stallRecoveries,
            state: await section.getAttribute('data-phase').catch(() => null),
            media: await video
              .evaluate((v) => ({
                src: v.currentSrc,
                time: v.currentTime,
                duration: v.duration,
                paused: v.paused,
                seeking: v.seeking,
                ready: v.readyState,
                network: v.networkState,
                buffered: Array.from({ length: v.buffered.length }, (_, i) => [
                  v.buffered.start(i),
                  v.buffered.end(i),
                ]),
                error: v.error?.code,
              }))
              .catch(() => null),
          }),
        );
        throw error;
      }
      assert.ok(await video.evaluate((v) => v.paused));
    };
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    assert.equal(await video.count(), 1, 'One cinematic decoder');
    assert.equal(await section.getAttribute('data-phase'), 'idle');
    assert.ok(await video.evaluate((v) => v.paused && v.currentTime < 0.12));
    await shot('intro');
    assert.match(await page.locator('.film-sentence h1').innerText(), /AHMAD/);
    if (!setup.hasTouch) {
      for (const delta of [2, 4, 7]) {
        await page.mouse.wheel(0, delta);
        await page.waitForTimeout(16);
      }
    } else await gesture();
    await page.waitForFunction(() =>
      document.querySelector('.film-sentence h1')?.textContent.includes('PERSPECTIVE.'));
    await chapter(0);
    assert.equal(await video.evaluate((v) => v.playbackRate), 1);
    await gesture();
    await chapter(0);
    await page.waitForTimeout(550);
    await shot('intro-started');
    await finishFilm();
    await gesture();
    await chapter(1);
    assert.equal(await video.evaluate((v) => v.playbackRate), 1);
    await page.waitForTimeout(1800);
    await shot('philosophy');
    // Pause well before final frame, then swipe: must retry this chapter.
    await video.evaluate((v) => v.pause());
    await gesture();
    await chapter(1);
    assert.ok(await video.evaluate((v) => !v.paused), 'Gesture resumes same unfinished film');
    await finishFilm();
    await shot('philosophy-final');
    // Restore the real reported Safari final-sample state with no media events.
    await video.evaluate((v) => {
      Object.defineProperty(v, 'ended', { configurable: true, get: () => false });
      Object.defineProperty(v, 'currentTime', {
        configurable: true,
        get: () => v.duration - 0.025,
      });
      Object.defineProperty(v, 'paused', { configurable: true, get: () => true });
    });
    await gesture();
    await chapter(2);
    await video.evaluate((v) => {
      delete v.ended;
      delete v.currentTime;
      delete v.paused;
    });
    await page.waitForTimeout(300);
    assert.ok(
      await video.evaluate((v) => v.currentTime < 1.3),
      'No hidden shatter playback interval',
    );
    await shot('transformation');
    await finishFilm();
    await gesture();
    await phase('gallery');
    await page.waitForSelector('.glass-project');
    await settledProject(0);
    assert.equal(await page.locator('.glass-project').count(), 4);
    await shot('gallery-01');
    // A second intentional input during movement is remembered once. Both
    // cards must land promptly rather than discard input for a full second.
    const responsiveStart = performance.now();
    await gesture();
    await page.waitForFunction(() =>
      Math.abs(Number(document.querySelectorAll('.glass-project')[1]?.dataset.relative)) < 0.98,
    null, { timeout: 250 });
    await page.getByRole('button', { name: 'Next project', exact: true }).click();
    await settledProject(2);
    assert.ok(performance.now() - responsiveStart < 1500, 'Two project moves respond promptly');
    await gesture(-1);
    await page.getByRole('button', { name: 'Previous project', exact: true }).click();
    await settledProject(0);
    for (let i = 0; i < 4; i++) {
      const card = page.locator('.glass-project').nth(i);
      assert.ok(Math.abs(Number(await card.getAttribute('data-facing'))) < 0.0001);
      const bounds = await card.boundingBox();
      assert.ok(Math.abs(bounds.x + bounds.width / 2 - setup.width / 2) < 3, 'Card centered');
      assert.ok(
        bounds.width > setup.width * (setup.isMobile ? 0.84 : 0.55),
        'Dominant card large enough',
      );
      const link = await card.getAttribute('href');
      assert.ok(link.includes(['munjiz', 'garage-tahmeen', 'aqar-ai', 'cismate'][i]));
      if (i < 3) {
        await gesture();
        await settledProject(i + 1);
      } else await shot('gallery-04');
    }
    for (let i = 2; i >= 0; i--) {
      await gesture(-1);
      await settledProject(i);
      assert.ok(
        Math.abs(Number(await page.locator('.glass-project').nth(i).getAttribute('data-facing'))) <
          0.0001,
      );
    }
    await gesture(-1);
    await chapter(2);
    assert.match(await video.getAttribute('src'), /shatter-reverse/);
    await finishFilm();
    await gesture(-1);
    await chapter(1);
    assert.match(await video.getAttribute('src'), /dissolve-reverse/);
    await finishFilm();
    await gesture(-1);
    await chapter(0);
    assert.match(await video.getAttribute('src'), /goggles-on-reverse/);
    await finishFilm();
    await gesture(-1);
    await phase('idle');
    // Every navigation destination must release the active cinema.
    for (const target of ['work', 'about', 'skills', 'contact']) {
      if (setup.isMobile) {
        await page.getByRole('button', { name: 'Open navigation' }).click();
        await page
          .getByRole('navigation', { name: 'Mobile navigation' })
          .locator(`a[href="/#${target}"]`)
          .click();
      } else
        await page
          .getByRole('navigation', { name: 'Primary' })
          .locator(`a[href="/#${target}"]`)
          .click();
      assert.equal(await section.getAttribute('data-released'), 'true');
      await page.waitForTimeout(350);
      await shot(target);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
        'No horizontal overflow',
      );
      await page.getByRole('link', { name: 'Ahmad Abulhawa home' }).click();
      await phase('idle');
      assert.equal(await section.getAttribute('data-released'), 'false');
    }
    await page.locator('.film-skip').click();
    await page.waitForTimeout(300);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.evaluate(() => location.hash), '');
    assert.ok(await page.evaluate(() => scrollY < 3));
    await phase('idle');
    // Deliberately remove ended delivery for one real playback (watchdog must finish).
    await video.evaluate((v) =>
      v.addEventListener('ended', (e) => e.stopImmediatePropagation(), true),
    );
    await gesture();
    await finishFilm();
    await chapter(0);
    // Lower sections stay functional with reduced motion; tab system is keyboard operable.
    await page.locator('.film-skip').click();
    await page.locator('#skills').scrollIntoViewIfNeeded();
    await page.getByRole('tab', { name: /Backend/ }).click();
    await page.getByRole('tab', { name: /Backend/ }).press('ArrowRight');
    assert.equal(
      await page.getByRole('tab', { name: /AI & workflow/ }).getAttribute('aria-selected'),
      'true',
    );
    assert.equal(
      await page.locator('a[download]').first().getAttribute('href'),
      '/ahmad-abulhawa-cv.pdf',
    );
    const pages = ['munjiz', 'garage-tahmeen', 'aqar-ai', 'cismate'];
    for (const slug of pages) {
      const response = await page.goto(`${base}/projects/${slug}/`, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      await shot(`case-${slug}`);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
      );
      const missing = await page
        .locator('img')
        .evaluateAll((imgs) =>
          imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
        );
      assert.deepEqual(missing, []);
    }
    assert.deepEqual(errors, [], 'No uncaught runtime errors');
    report.results.push({
      viewport: setup.name,
      passed: true,
      realPlayback: true,
      touchInput: setup.hasTouch
        ? touchProtocol
          ? 'Chromium protocol touch sequence'
          : 'synthetic touch events'
        : 'desktop wheel',
      errors,
    });
    await context.close();
  }
  const reduced = await browser.newContext({
    viewport: { width: 360, height: 740 },
    reducedMotion: 'reduce',
  });
  const p = await reduced.newPage();
  await p.goto(base);
  await p.locator('.film-skip').click();
  await p.locator('#skills').scrollIntoViewIfNeeded();
  assert.equal(await p.locator('.liquid-form canvas').count(), 0);
  assert.equal(
    await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
    false,
  );
  await reduced.close();
  await writeFile(path.join(output, 'browser-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
