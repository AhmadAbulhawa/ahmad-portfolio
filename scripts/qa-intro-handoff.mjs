import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

// Regression for the supplied landscape recording: the 01/02 source poses
// differ, so loading continuity alone cannot verify their visible transition.
const output = path.resolve(process.env.PORTFOLIO_QA_OUTPUT || 'work/intro-handoff');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const report = [];
try {
  for (const setup of [
    { name: 'recording-landscape', width: 1536, height: 720 },
    { name: 'portrait-touch', width: 390, height: 844, isMobile: true, hasTouch: true },
    { name: 'short-landscape', width: 844, height: 390, isMobile: true, hasTouch: true },
    { name: 'reduced-motion', width: 1536, height: 720, reducedMotion: 'reduce' },
  ]) {
    const context = await browser.newContext({ ...setup, viewport: setup, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(process.env.PORTFOLIO_QA_URL || 'http://127.0.0.1:3000');
    await page.waitForFunction(() => document.querySelector('.film-hold')?.dataset.frame === 'live');
    await page.keyboard.press('ArrowDown');
    await page.waitForFunction(() => document.querySelector('.film-journey')?.dataset.phase === 'completed');
    await page.waitForFunction(() => {
      const video = document.querySelector('.film-video');
      return video.readyState >= 2 && !video.seeking && video.currentTime >= 1.5;
    });
    await page.evaluate(() => {
      const hold = document.querySelector('.film-hold');
      const hash = () => {
        const data = hold.getContext('2d').getImageData(0, 0, hold.width, hold.height).data;
        let sum = 0;
        for (let i = 0; i < data.length; i += 997) sum = (sum * 31 + data[i]) >>> 0;
        return sum;
      };
      const original = hash();
      window.introHandoff = { samples: [], holdPreserved: false, firstExposure: null };
      const observer = new MutationObserver(() => {
        if (hold.dataset.frame === 'blending') {
          window.introHandoff.holdPreserved = original === hash();
          window.introHandoff.firstExposure = document.querySelector('.film-video').currentTime;
        }
      });
      observer.observe(hold, { attributes: true, attributeFilter: ['data-frame'] });
      const sample = (time) => {
        window.introHandoff.samples.push({ time, frame: hold.dataset.frame,
          opacity: Number(getComputedStyle(hold).opacity) });
        if (hold.dataset.frame !== 'live') requestAnimationFrame(sample);
        else observer.disconnect();
      };
      requestAnimationFrame(sample);
    });
    await page.screenshot({ path: path.join(output, `${setup.name}-outgoing.png`) });
    await page.keyboard.press('ArrowDown');
    if (!setup.reducedMotion) {
      await page.waitForFunction(() => document.querySelector('.film-hold')?.dataset.frame === 'blending');
      await page.waitForTimeout(120);
      await page.screenshot({ path: path.join(output, `${setup.name}-transition.png`) });
    }
    await page.waitForFunction(() => document.querySelector('.film-hold')?.dataset.frame === 'live');
    const result = await page.evaluate(() => window.introHandoff);
    const blend = result.samples.filter((sample) => sample.frame === 'blending');
    if (setup.reducedMotion) assert.equal(blend.length, 0);
    else {
      assert.ok(result.holdPreserved, 'Incoming capture must not overwrite the outgoing pose');
      assert.ok(result.firstExposure >= 1.5 - 1 / 48 && result.firstExposure < 1.5 + 1 / 12,
        'Expose the actual first frame, without hidden advancing footage');
      assert.ok(blend.filter((sample) => sample.opacity > 0.02 && sample.opacity < 0.98).length >= 4,
        'The rendered transition must have intermediate frames, not a cut');
      for (let i = 1; i < blend.length; i++)
        assert.ok(blend[i].opacity <= blend[i - 1].opacity + 0.0001);
      assert.ok(blend.at(-1).time - blend[0].time >= 400, 'Complete the bounded half-second dissolve');
    }
    assert.equal(await page.locator('.film-incoming').evaluate((canvas) => getComputedStyle(canvas).opacity), '0');
    assert.deepEqual(errors, []);
    await page.screenshot({ path: path.join(output, `${setup.name}-incoming.png`) });
    report.push({ viewport: setup.name, ...result, errors });
    console.log(`PASS ${setup.name}: original hold, first-frame exposure, continuous transition`);
    await context.close();
  }
  await writeFile(path.join(output, 'intro-handoff.json'), JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
