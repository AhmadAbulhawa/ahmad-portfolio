import { chromium, devices } from 'playwright';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

await mkdir('qa-screenshots', { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const cases = [
  { name: 'iphone', settings: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  { name: 'desktop', settings: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
];
for (const scenario of cases) {
  const context = await browser.newContext(scenario.settings);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle' });
  const image = await page.request.get('http://127.0.0.1:3000/projects/ahmad-firnlight-hero.webp');
  assert.equal(image.status(),200);
  const bytes = (await image.body()).length;
  assert.ok(bytes > 50000,'Source photo unexpectedly small: '+bytes);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2);
  assert.equal(overflow,false,scenario.name+' has horizontal overflow');
  await page.screenshot({ path: 'qa-screenshots/'+scenario.name+'-hero.png' });
  for (const [label, multiple] of [['dissolve',1.2],['gallery',2.5],['work',4.1]]) {
    await page.evaluate(y => window.scrollTo(0,y),Math.round((await page.evaluate(()=>innerHeight))*multiple));
    await page.waitForTimeout(800);
    await page.screenshot({path:'qa-screenshots/'+scenario.name+'-'+label+'.png'});
  }

  // Verify the actual floating-gallery links, not just decorative screenshots.
  const galleryPosition = await page.evaluate(() => {
    const journey = document.querySelector('.film-journey');
    if (!journey) throw Error('Missing cinematic journey');
    return journey.offsetTop + (journey.offsetHeight - innerHeight) * .92;
  });
  await page.evaluate(y => window.scrollTo(0, y), galleryPosition);
  await page.waitForTimeout(900);
  const gallery = page.locator('.film-gallery');
  assert.equal(await gallery.locator('a[href^="/projects/"]').count(),4, 'All four projects must be selectable');
  await gallery.getByRole('link',{name:'Explore Munjiz project'}).click();
  await page.waitForURL(/\/projects\/munjiz\/?$/, {timeout:10000});
  assert.match(page.url(), /\/projects\/munjiz\/?$/, 'Floating card must open its project');
  await page.goto('http://127.0.0.1:3000/', {waitUntil:'networkidle'});

  if (scenario.name === 'iphone') {
    await page.evaluate(() => window.scrollTo(0,0));
    await page.getByRole('button',{name:'Open navigation'}).click();
    await page.screenshot({path:'qa-screenshots/iphone-menu-open.png'});
    const expanded = await page.getByRole('button',{name:'Close navigation'}).getAttribute('aria-expanded');
    assert.equal(expanded,'true');
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('button',{name:'Open navigation'}).getAttribute('aria-expanded'),'false');
  }
  const report={scenario:scenario.name,imageBytes:bytes,errors,href:page.url()};
  console.log(JSON.stringify(report));
  assert.deepEqual(errors,[],'Page JavaScript exceptions detected');
  await context.close();
}
await browser.close();
