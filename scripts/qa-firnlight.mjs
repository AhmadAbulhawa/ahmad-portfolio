import { chromium, devices } from 'playwright';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('qa-screenshots',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
for(const s of [
{name:'iphone',settings:{...devices['iPhone 13'],defaultBrowserType:'chromium'}},
{name:'desktop',settings:{viewport:{width:1440,height:900},deviceScaleFactor:1}}
]){
const ctx=await browser.newContext(s.settings);
const page=await ctx.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:3000/',{waitUntil:'domcontentloaded'});
const section=page.locator('.film-journey');
const videos=page.locator('.film-video');
assert.equal(await videos.count(),3);
assert.equal(await section.getAttribute('data-scene'),'0');
const first=await videos.nth(0).evaluate(v=>({paused:v.paused,rate:v.playbackRate,frame:v.currentTime}));
assert.equal(first.paused,true,'First video must be paused before the first scroll');
assert.equal(first.rate,1,'First video must be 1x');
assert.ok(first.frame<.1);
await page.screenshot({path:'qa-screenshots/'+s.name+'-hero.png'});
const down=async()=>{
  await page.evaluate(()=>window.dispatchEvent(new WheelEvent('wheel',{deltaY:160,cancelable:true,bubbles:true})));
  await page.waitForTimeout(180);
};
await down();
assert.equal(await section.getAttribute('data-scene'),'0','First scroll must start intro, not skip it');
assert.equal(await section.getAttribute('data-playing'),'true');
for(let i=0;i<6;i++) await down();
assert.equal(await section.getAttribute('data-scene'),'0','Extra input while clip plays cannot skip it');
await videos.nth(0).evaluate(v=>v.dispatchEvent(new Event('ended')));
await page.waitForTimeout(1050);
await down();
assert.equal(await section.getAttribute('data-scene'),'1','Second film only after first ended');
assert.equal(await section.getAttribute('data-playing'),'true');
await page.screenshot({path:'qa-screenshots/'+s.name+'-dissolve.png'});
for(let i=0;i<3;i++)await down();
assert.equal(await section.getAttribute('data-scene'),'1','Second film protected from skipping');
await videos.nth(1).evaluate(v=>v.dispatchEvent(new Event('ended')));
await page.waitForTimeout(1050);
await down();
assert.equal(await section.getAttribute('data-scene'),'2','Third film only after second finished');
await page.screenshot({path:'qa-screenshots/'+s.name+'-shatter.png'});
await videos.nth(2).evaluate(v=>v.dispatchEvent(new Event('ended')));
await page.waitForTimeout(1050);
await down();
assert.equal(await section.getAttribute('data-scene'),'3','Helix unlocked only after all three clips finished');
await page.screenshot({path:'qa-screenshots/'+s.name+'-helix.png'});
const cards=page.locator('.film-glass-card');
assert.equal(await cards.count(),4);
const firstPos=await cards.nth(0).evaluate(e=>e.style.transform);
await page.waitForTimeout(1050);
await down();
assert.equal(await section.getAttribute('data-scene'),'4');
const secondPos=await cards.nth(0).evaluate(e=>e.style.transform);
assert.notEqual(firstPos,secondPos,'A wheel step must animate to the next discrete glass card');
await page.screenshot({path:'qa-screenshots/'+s.name+'-glass-next.png'});
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
assert.equal(overflow,false,'No horizontal overflow');
await page.locator('.film-skip').click();
assert.equal(await section.getAttribute('data-released'),'true','Skip intro must release scroll gate');
await cards.nth(1).click({force:true});
await page.waitForURL(/\/projects\/garage-tahmeen\/?$/,{timeout:10000});
if(s.name==='iphone'){
await page.goto('http://127.0.0.1:3000/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Open navigation'}).click();
await page.screenshot({path:'qa-screenshots/iphone-menu.png'});
await page.keyboard.press('Escape');
}
assert.deepEqual(errors,[],'Unexpected JS exceptions');
console.log(JSON.stringify({name:s.name,firstVideo:first,sceneSkippingPrevented:true}));
await ctx.close();
}
await browser.close();
