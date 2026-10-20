import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

// Check actual endpoint pixels and geometry, including reverse/reduced motion.
const output = path.resolve(process.env.PORTFOLIO_QA_OUTPUT || 'work/intro-handoff');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true,
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
    const context = await browser.newContext({ ...setup, viewport: setup, deviceScaleFactor: 1,
      ...(setup.name === 'recording-landscape' ? { recordVideo: { dir: output, size: setup } } : {}),
    });
    await context.addInitScript(() => {
      window.firstFrames = {};
      window.readBoundary = () => {
        const canvas = document.querySelector('.film-hold');
        const rect = canvas.getBoundingClientRect();
        const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        const width = canvas.width, height = canvas.height;
        const mask = new Uint8Array(width * height), queue = new Int32Array(width * height);
        // Register the largest saturated component in the face region. Sparse
        // blue mountain pixels are not part of the lens and must not set bounds.
        for (let y = Math.floor(height * 0.15); y < height * 0.5; y++)
          for (let x = Math.floor(width * 0.3); x < width * 0.7; x++) {
          const i = (y * canvas.width + x) * 4;
          const hi = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]);
          const lo = Math.min(pixels[i], pixels[i + 1], pixels[i + 2]);
          if (hi - lo > Math.max(60, hi / 3) && hi > 100) mask[y * width + x] = 1;
        }
        let largest = 0, left = width, right = 0, top = height, bottom = 0;
        for (let seed = 0; seed < mask.length; seed++) {
          if (mask[seed] !== 1) continue;
          let head = 0, tail = 1, l = width, r = 0, t = height, b = 0;
          queue[0] = seed; mask[seed] = 2;
          while (head < tail) {
            const index = queue[head++], x = index % width, y = Math.floor(index / width);
            l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y);
            for (const next of [index - 1, index + 1, index - width, index + width]) {
              if (mask[next] === 1) { mask[next] = 2; queue[tail++] = next; }
            }
          }
          if (tail > largest) { largest = tail; left = l; right = r; top = t; bottom = b; }
        }
        const scale = Math.max(rect.width / canvas.width, rect.height / canvas.height);
        const [px, py] = getComputedStyle(canvas).objectPosition.split(' ').map(parseFloat);
        return { pixels, time: document.querySelector('.film-video').currentTime,
          lens: { x: rect.x + (rect.width - canvas.width * scale) * px / 100 + (left + right) * scale / 2,
            y: rect.y + (rect.height - canvas.height * scale) * py / 100 + (top + bottom) * scale / 2,
            width: (right - left) * scale, height: (bottom - top) * scale },
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        };
      };
      new MutationObserver(() => {
        const canvas = document.querySelector('.film-hold');
        if (canvas?.dataset.frame !== 'presenting') return;
        const source = document.querySelector('.film-video').getAttribute('src');
        window.firstFrames[source] ??= window.readBoundary();
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-frame'] });
    });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.PORTFOLIO_QA_URL || 'http://127.0.0.1:3000');
    const live = () => page.waitForFunction(() => document.querySelector('.film-hold')?.dataset.frame === 'live');
    const complete = () => page.waitForFunction(() => document.querySelector('.film-journey')?.dataset.phase === 'completed', null, { timeout: 22000 });
    const step = async (direction = 1) => {
      await page.waitForTimeout(250);
      await page.keyboard.press(direction > 0 ? 'ArrowDown' : 'ArrowUp');
    };
    const compare = async (name, direction, file, start = 0) => {
      await page.evaluate(() => { window.outgoingBoundary = window.readBoundary(); });
      await page.screenshot({ path: path.join(output, `${setup.name}-${name}-before.png`) });
      await step(direction);
      await live();
      const result = await page.evaluate(file => {
        const a = window.outgoingBoundary, b = window.firstFrames[`/films/${file}`];
        if (!b) throw Error(`First frame not observed: ${file}`);
        let sum = 0, changed = 0;
        for (let i = 0; i < a.pixels.length; i += 4) {
          const delta = Math.max(Math.abs(a.pixels[i] - b.pixels[i]),
            Math.abs(a.pixels[i + 1] - b.pixels[i + 1]), Math.abs(a.pixels[i + 2] - b.pixels[i + 2]));
          sum += delta;
          if (delta > 16) changed++;
        }
        return { before: a.lens, after: b.lens, beforeRect: a.rect, afterRect: b.rect,
          mean: sum / (a.pixels.length / 4), changed: changed / (a.pixels.length / 4),
          firstExposure: b.time };
      }, file);
      assert.deepEqual(result.afterRect, result.beforeRect, 'The media plane must never rescale');
      for (const key of ['x', 'y', 'width', 'height'])
        assert.ok(Math.abs(result.after[key] - result.before[key]) < 3,
          `${setup.name} ${name}: lens ${key} jumps ${JSON.stringify(result)}`);
      assert.ok(result.mean < 6 && result.changed < 0.025,
        `${setup.name} ${name}: endpoint pixels do not match ${JSON.stringify(result)}`);
      assert.ok(result.firstExposure >= start - 1 / 48 && result.firstExposure < start + 1 / 12,
        'The incoming scene must not advance behind a cover');
      await page.screenshot({ path: path.join(output, `${setup.name}-${name}-after.png`) });
      report.push({ viewport: setup.name, boundary: name, ...result });
      console.log(`PASS ${setup.name} ${name}: matched pose, fixed coordinates, no zoom`);
    };
    await live();
    await step(); await complete();
    await compare('01-to-02', 1, '02-dissolve.mp4', 1.5);
    await complete();
    await step(-1); await live(); await complete();
    await compare('02-to-01', -1, '01-goggles-on-aligned-reverse.mp4');
    await complete();
    await step(-1);
    await page.waitForFunction(() => document.querySelector('.film-journey')?.dataset.phase === 'idle');
    assert.deepEqual(errors, []);
    const video = page.video();
    await context.close();
    if (video) await video.saveAs(path.join(output, 'matched-intro-browser.webm'));
  }
  await writeFile(path.join(output, 'intro-handoff.json'), JSON.stringify(report, null, 2));
} finally { await browser.close(); }
