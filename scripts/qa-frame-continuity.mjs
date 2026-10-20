import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, webkit } from 'playwright';

const engine = process.env.QA_BROWSER === 'webkit' ? webkit : chromium;
const output = path.resolve(process.env.PORTFOLIO_QA_OUTPUT || 'work/qa');
await mkdir(output, { recursive: true });
const browser = await engine.launch({
  headless: true,
  ...(engine === chromium && process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
  args: engine === chromium ? ['--no-sandbox', '--disable-dev-shm-usage'] : [],
});
const report = [];
try {
  for (const setup of [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'mobile', width: 390, height: 844 },
    { name: 'mobile-fallback', width: 390, height: 844, fallback: true },
  ]) {
    const context = await browser.newContext({ viewport: setup, deviceScaleFactor: 1 });
    if (setup.fallback)
      await context.addInitScript(() => {
        Object.defineProperty(HTMLVideoElement.prototype, 'requestVideoFrameCallback', {
          value: undefined,
        });
      });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    let gate;
    await page.route('**/films/*.mp4', async (route) => {
      if (gate && new URL(route.request().url()).pathname.endsWith(gate.file))
        await gate.wait;
      await route.continue();
    });
    await page.goto(process.env.PORTFOLIO_QA_URL || 'http://127.0.0.1:3000');
    await page.waitForFunction(() => document.querySelector('.film-hold')?.dataset.frame);
    // Compare only the cinematic image. Typography and gallery animation have
    // separate visual coverage and must not mask a one-frame poster flash.
    await page.addStyleTag({ content: `
      .film-stage > :not(.film-surface), .firn-header { visibility: hidden !important; }
    ` });
    const gesture = async (direction) => {
      await page.waitForTimeout(240);
      await page.mouse.wheel(0, direction * 120);
    };
    const live = () => page.waitForFunction(() =>
      document.querySelector('.film-hold')?.dataset.frame === 'live', null, { timeout: 15000 });
    const finish = async () => {
      await live();
      // Let the decoder reach its real final frame; do not manufacture an ended
      // event or seek during the source's initial start-position seek.
      for (let attempt = 0; attempt < 3; attempt++) {
        await page.waitForFunction(() => ['completed', 'stalled'].includes(
          document.querySelector('.film-journey')?.dataset.phase), null, { timeout: 22000 });
        const state = await page.evaluate(() => {
          const video = document.querySelector('.film-video');
          const stage = document.querySelector('.film-journey');
          return { phase: stage.dataset.phase, chapter: stage.dataset.chapter,
            time: video.currentTime, duration: video.duration,
            direction: video.src.includes('-reverse') ? -1 : 1 };
        });
        if (state.phase === 'completed' || state.duration - state.time <= 0.05) break;
        console.log(`${setup.name}: retry stationary decoder in chapter ${state.chapter}`);
        await gesture(state.direction);
        assert.equal(await page.locator('.film-journey').getAttribute('data-chapter'), state.chapter);
      }
      await page.waitForFunction(() =>
        document.querySelector('.film-journey')?.dataset.phase === 'completed',
      null, { timeout: 22000 });
      await page.waitForTimeout(130);
    };
    const pixels = async (first, second) => page.evaluate(async ([a, b]) => {
      const decode = async (source) => {
        const image = new Image();
        image.src = source;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, canvas.width, canvas.height).data;
      };
      const [x, y] = await Promise.all([decode(a), decode(b)]);
      let sum = 0, changed = 0;
      for (let i = 0; i < x.length; i += 4) {
        const delta = Math.max(Math.abs(x[i] - y[i]), Math.abs(x[i + 1] - y[i + 1]),
          Math.abs(x[i + 2] - y[i + 2]));
        sum += delta;
        if (delta > 12) changed++;
      }
      return { mean: sum / (x.length / 4), changed: changed / (x.length / 4) };
    }, [first, second].map((buffer) => `data:image/png;base64,${buffer.toString('base64')}`));
    const shot = () => page.screenshot({ clip: {
      x: 0, y: 160, width: setup.width, height: setup.height - 160,
    } });
    const transition = async (file, direction) => {
      console.log(`${setup.name}: hold ${file}`);
      const before = await shot();
      let release;
      gate = { file, wait: new Promise((resolve) => { release = resolve; }) };
      await gesture(direction);
      await page.waitForFunction((file) =>
        document.querySelector('.film-video')?.src.endsWith(file), file);
      for (let sample = 0; sample < 3; sample++) {
        await page.waitForTimeout(160);
        const held = await page.locator('.film-hold').evaluate((canvas) => ({
          frame: canvas.dataset.frame,
          opacity: getComputedStyle(canvas).opacity,
          videoOpacity: getComputedStyle(document.querySelector('.film-video')).opacity,
        }));
        assert.equal(held.frame, 'held', `${file}: outgoing frame lost`);
        assert.equal(held.opacity, '1');
        assert.equal(held.videoOpacity, '0');
        const after = await shot();
        const difference = await pixels(before, after);
        assert.ok(difference.mean < 2 && difference.changed < 0.01,
          `${file}: visible frame changed while loading ${JSON.stringify(difference)}`);
        report.push({ viewport: setup.name, file, sample, ...difference });
        if (sample === 1)
          await page.screenshot({ path: path.join(output, `${setup.name}-${file}-held.png`) });
      }
      // Repeated scrolling while the request is held cannot reset the background
      // or jump over the unfinished source in either direction.
      await gesture(direction);
      console.log(`${setup.name}: release ${file}`);
      assert.ok((await page.locator('.film-video').getAttribute('src')).endsWith(file));
      gate = undefined;
      release();
      await live();
      console.log(`${setup.name}: live ${file}`);
      const time = await page.locator('.film-video').evaluate((video) => video.currentTime);
      const start = file === '02-dissolve.mp4' ? 1.5 : 0;
      assert.ok(time >= start - 1 / 24 && time < start + 0.6,
        `${file}: hidden playback before reveal (${time})`);
    };
    await gesture(1);
    await finish();
    await transition('02-dissolve.mp4', 1);
    await finish();
    await transition('03-shatter.mp4', 1);
    await finish();
    await gesture(1); // gallery keeps the final shatter frame behind its entrance
    await page.waitForFunction(() =>
      document.querySelector('.film-journey')?.dataset.phase === 'gallery');
    await transition('03-shatter-reverse.mp4', -1);
    await finish();
    await transition('02-dissolve-reverse.mp4', -1);
    await finish();
    await transition('01-goggles-on-reverse.mp4', -1);
    await finish();
    await gesture(-1);
    await page.waitForFunction(() =>
      document.querySelector('.film-journey')?.dataset.phase === 'idle');
    assert.notEqual(await page.locator('.film-hold').getAttribute('data-frame'), 'held');
    assert.ok(await page.locator('.film-video').evaluate((video) => video.paused));
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS ${setup.name}: forward, reverse, gallery, reset, delayed frame continuity`);
  }
  await writeFile(path.join(output, 'frame-continuity.json'), JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
