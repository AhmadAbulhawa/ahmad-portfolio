import { chromium, devices } from 'playwright';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('qa-screenshots',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const setups=[
{name:'iphone',context:{...devices['iPhone 13'],defaultBrowserType:'chromium'}},
{name:'desktop',context:{viewport:{width:1440,height:900},deviceScaleFactor:1}}
];
for (const setup of setups) {
 const ctx=await browser.newContext(setup.context);
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:3000/',{waitUntil:'domcontentloaded'});
 const section=page.locator('.film-journey');
 const originals=page.locator('.film-video:not([class*="reverse"])');
 const reversed=page.locator('[class*="film-video-reverse-"]');
 assert.equal(await originals.count(),3,'Original films missing');
 assert.equal(await reversed.count(),3,'Three reverse 1080p films must be present');
 await page.waitForTimeout(500);
 assert.equal(await section.getAttribute('data-scene'),'0');
 assert.ok(await originals.nth(0).evaluate(v=>v.paused),'No autoplay before scroll');
 const sizes=await originals.nth(0).evaluate(v=>({width:v.getBoundingClientRect().width,viewport:innerWidth}));
 assert.ok(sizes.width>=sizes.viewport-2,'Video must fill screen width');
 const menu=await page.locator('.firn-header-inner').evaluate(el=>getComputedStyle(el).backgroundColor);
 assert.ok(menu.startsWith('rgba(') || menu==='transparent','Navigation must have transparent background: '+menu);
 const artwork=await page.locator('.film-card-art-full').first().evaluate(el=>getComputedStyle(el).backgroundSize);
 const cardWidth=await page.locator('.film-glass-card').first().evaluate(el=>el.getBoundingClientRect().width);
 if(setup.name==='desktop')assert.ok(cardWidth>=sizes.viewport*.45,'Laptop hero card must be wide and prominent');
 const cismateArt=await page.locator('.film-glass-card[aria-label="Explore CISmate project"] .film-card-art-full').evaluate(el=>getComputedStyle(el).backgroundImage);
 assert.ok(cismateArt.includes('cismate-login.jpeg'),'CISmate card must show the real login screenshot');

 assert.equal(artwork,'contain','Project media must be entirely visible, no crop');
 const down=async()=>{
   await page.evaluate(()=>window.dispatchEvent(new WheelEvent('wheel',{deltaY:140,cancelable:true,bubbles:true})));
   await page.waitForTimeout(130);
 };
 const up=async()=>{
   await page.evaluate(()=>window.dispatchEvent(new WheelEvent('wheel',{deltaY:-140,cancelable:true,bubbles:true})));
   await page.waitForTimeout(130);
 };
 const delay=async()=>await page.waitForTimeout(960);
 const ended=async(index,reverse=false)=>{
   await (reverse?reversed:originals).nth(index).evaluate(v=>v.dispatchEvent(new Event('ended')));
   await delay();
 };
 await page.screenshot({path:'qa-screenshots/'+setup.name+'-hero.png'});
 await down();
 assert.equal(await section.getAttribute('data-scene'),'0','First input only starts first film');
 assert.ok(await page.locator('.film-sentence .film-typed-letter').count()>=14,'First scroll writes each headline letter');
 assert.equal(await section.getAttribute('data-playing'),'true');
 assert.equal(await originals.nth(0).evaluate(v=>v.playbackRate),1);
 await down(); await down(); await down();
 assert.equal(await section.getAttribute('data-scene'),'0','Repeated input cannot skip intro');
 await ended(0);
 await down();
 assert.equal(await section.getAttribute('data-scene'),'1','Second film starts after first ends');
 assert.ok(await page.locator('.film-sentence .film-typed-letter').count()>12,'Design quote writes on second scroll');
 assert.equal(await originals.nth(1).evaluate(v=>v.playbackRate),1,'Second film must be normal speed');
 await page.screenshot({path:'qa-screenshots/'+setup.name+'-dissolve.png'});
 await ended(1);
 await down();
 await page.waitForFunction(() => document.querySelector('.film-journey')?.dataset.scene === '2',{timeout:4500});
 assert.equal(await section.getAttribute('data-scene'),'2','Third film follows a frame-aligned direct cut');
 assert.equal(await section.getAttribute('data-bridge'),'', 'No dark cover may hide early frames of shatter clip');
 const thirdBegin = await originals.nth(2).evaluate(v => v.currentTime);
 assert.ok(thirdBegin < 1, 'Shatter video must be shown near its first frame, not after a hidden playback interval: '+thirdBegin);
 await page.screenshot({path:'qa-screenshots/'+setup.name+'-shatter.png'});
 await ended(2);
 await down();
 assert.equal(await section.getAttribute('data-scene'),'3','Gallery only after three finished videos');
 const cards=page.locator('.film-glass-card');
 assert.equal(await cards.count(),4);
 await page.waitForTimeout(1250);
 const first=await cards.nth(0).evaluate(el=>el.style.transform);
 assert.ok(first.includes('rotateY(0.00deg)')||first.includes('rotateY(0deg)'), 'Selected panel must face user dead straight '+first);
 assert.match(first,/calc\(-50% \+ 0(?:\.0)?px\)/,'Selected project must be horizontally centered');
 await page.screenshot({path:'qa-screenshots/'+setup.name+'-glass-front.png'});
 await page.waitForTimeout(1250);
 await down();
 assert.equal(await section.getAttribute('data-scene'),'4','One scroll -> one selected project');
 assert.equal(await section.getAttribute('data-helix-moving'),'true','Helix should animate on its own clock, not scrub');
 const halfway=await cards.nth(1).evaluate(el=>el.dataset.helixRelative);
 await page.waitForTimeout(450);
 const midway=await cards.nth(1).evaluate(el=>el.dataset.helixRelative);
 assert.ok(Number(midway)<Number(halfway),'Next card must actually travel toward center along helix');
 await page.waitForTimeout(820);
 assert.equal(await section.getAttribute('data-helix-moving'),'false','Helix must finish at a precise stop');
 const next=await cards.nth(1).evaluate(el=>el.style.transform);
 assert.ok(next.includes('rotateY(0.00deg)')||next.includes('rotateY(0deg)'));
 assert.match(next,/calc\(-50% \+ 0(?:\.0+)?px\)/,'Second project must be precisely centered');
 const past=await cards.nth(0).evaluate(el=>Number(el.dataset.helixRelative));
 assert.ok(past<-.98&&past> -1.02,'Prior project must move above and behind, not wrap below');
 const oldOpacity=await cards.nth(0).evaluate(el=>Number(el.style.opacity));
 if(setup.name==='desktop') assert.ok(oldOpacity>=0.5&&oldOpacity<1,'Desktop should show dim side planes like reference');
 else assert.equal(oldOpacity,0,'Mobile should keep previous hidden to avoid clutter');
 const future=await cards.nth(2).evaluate(el=>({x:el.style.transform,relative:Number(el.dataset.helixRelative)}));
 assert.ok(future.relative>.98,'Upcoming project should be one descending stair lower');

 await page.waitForTimeout(1150);
 await page.screenshot({path:'qa-screenshots/'+setup.name+'-glass-stair.png'});
 // Verify the authentic CisMate login image fully visible on the last stop.
 await page.waitForTimeout(1250);
 await down();
 assert.equal(await section.getAttribute('data-scene'),'5');
 await page.waitForTimeout(1250);
 await down();
 assert.equal(await section.getAttribute('data-scene'),'6');
 await page.waitForTimeout(1350);
 assert.match(await cards.nth(3).evaluate(el=>el.style.transform),/rotateY\(0(?:\.0+)?deg\)/,'CISmate must reach a frontal straight-on orientation');
 await page.screenshot({path:'qa-screenshots/'+setup.name+'-cismate-login.png'});
 await page.waitForTimeout(1250);
 await up();
 assert.equal(await section.getAttribute('data-scene'),'5');
 await page.waitForTimeout(1250);
 await up();
 assert.equal(await section.getAttribute('data-scene'),'4');
 await page.waitForTimeout(1250);
 await up();
 assert.equal(await section.getAttribute('data-scene'),'3','Scroll up returns first project');
 await page.waitForTimeout(1250);
 const restored=await cards.nth(0).evaluate(el=>el.style.transform);
 assert.equal(restored,first,'Reverse gallery motion must restore EXACT original transform without a teleport');
 await page.waitForTimeout(150);
 await up();
 assert.equal(await section.getAttribute('data-scene'),'2','Scroll back from gallery starts reverse shatter');
 assert.equal(await section.getAttribute('data-direction'),'reverse');
 assert.equal(await section.getAttribute('data-playing'),'true');
 await page.screenshot({path:'qa-screenshots/'+setup.name+'-reverse-shatter.png'});
 await ended(2,true);
 await up();
 await page.waitForFunction(() => document.querySelector('.film-journey')?.dataset.scene === '1',{timeout:4500});
 assert.equal(await section.getAttribute('data-scene'),'1','Reverse transition must return through the matching dissolve endpoint');
 assert.equal(await section.getAttribute('data-bridge'),'', 'Reverse scene must also cut directly without an opaque wipe');
 assert.equal(await section.getAttribute('data-direction'),'reverse');
 await ended(1,true);
 await up();
 assert.equal(await section.getAttribute('data-scene'),'0','Reverse travel returns to goggles on face');
 assert.equal(await section.getAttribute('data-direction'),'reverse');
 await ended(0,true);
 const noOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
 assert.equal(noOverflow,false,'Horizontal overflow');
 if(setup.name==='iphone'){
   await page.getByRole('button',{name:'Open navigation'}).click();
   await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:/About/}).click();
   await page.waitForTimeout(400);
   assert.equal(await section.getAttribute('data-released'),'true','Mobile menu must bypass intro gate');
   assert.ok(page.url().includes('#about'),'Mobile About link navigated');
 } else {
   await page.getByRole('navigation',{name:'Primary'}).getByRole('link',{name:'Work'}).click();
   await page.waitForTimeout(400);
   assert.equal(await section.getAttribute('data-released'),'true','Desktop menu must bypass intro gate');
   assert.ok(page.url().includes('#work'),'Work link navigated');
 }
 // Refresh from a deeper section must wipe the URL fragment and scroll state.
 await page.reload({ waitUntil: 'domcontentloaded' });
 await page.waitForTimeout(650);
 assert.equal(await page.evaluate(() => location.hash), '', 'Hard refresh must remove stale work/about anchor');
 assert.ok((await page.evaluate(() => window.scrollY)) < 3, 'Hard refresh must start from the very top');
 assert.equal(await section.getAttribute('data-scene'), '0', 'Reload must reset cinematic state to scene 0');
 assert.equal(await originals.first().evaluate(v => v.paused), true, 'Reload must show paused first video');
 assert.ok((await originals.first().evaluate(v => v.currentTime)) < .1, 'Reload begins at first video frame');
 await page.screenshot({path:'qa-screenshots/'+setup.name+'-reload-first-frame.png'});
 // Manual Skip, then AHMAD must restart the complete sequence, not just scroll.
 await page.locator('.film-skip').click();
 await page.waitForTimeout(320);
 assert.equal(await section.getAttribute('data-released'),'true');
 if (setup.name === 'iphone') {
   await page.getByRole('button',{name:'Open navigation'}).click();
   await page.getByRole('link',{name:'Ahmad Abulhawa home'}).click();
 } else {
   await page.getByRole('link',{name:'Ahmad Abulhawa home'}).click();
 }
 await page.waitForTimeout(550);
 assert.equal(await section.getAttribute('data-released'),'false','AHMAD home must re-arm intro');
 assert.equal(await section.getAttribute('data-scene'),'0','AHMAD home must rewind all cinematic states');
 assert.ok((await page.evaluate(()=>scrollY))<3,'AHMAD home must return to top');
 assert.ok(await originals.first().evaluate(v=>v.paused&&v.currentTime<.12),'AHMAD must restore paused frame zero');
 const locked=await page.evaluate(()=>document.body.style.overflow);
 assert.equal(locked,'hidden','Intro gate must be re-locked when AHMAD returns home');
 await page.screenshot({path:'qa-screenshots/'+setup.name+'-brand-restarted.png'});
 assert.deepEqual(errors,[],'No page JS exceptions');
 console.log(JSON.stringify({scenario:setup.name,originals:3,reverse:3,fullWidth:sizes,cardWidth,transparentMenu:menu,uncroppedArt:artwork,errors}));
 await ctx.close();
}
await browser.close();
