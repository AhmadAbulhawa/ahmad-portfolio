import { chromium, devices } from 'playwright';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

await mkdir('qa-screenshots', { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const scenarios = [
  { name: 'iphone', settings: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  { name: 'desktop', settings: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
];
const chapterCount=17;
for(const scenario of scenarios){
 const ctx=await browser.newContext(scenario.settings);
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3000/',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(700);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
 assert.equal(overflow,false,scenario.name+' has horizontal overflow');
 const videoEls=page.locator('section.film-journey video');
 assert.equal(await videoEls.count(),3,'All three source videos must be attached');
 const urls=await videoEls.evaluateAll(items=>items.map(v=>v.getAttribute('src')));
 assert.ok(urls.every(u=>u?.startsWith('https://')&&u?.includes('.mp4')),'Expected three real hosted MP4 files');
 const first=await videoEls.first().evaluate(v=>({width:v.videoWidth,height:v.videoHeight,rate:v.playbackRate,src:v.currentSrc}));
 console.log(scenario.name+' videos '+JSON.stringify({urls:urls.map(v=>v.split('?')[0]),first}));
 await page.screenshot({path:'qa-screenshots/'+scenario.name+'-hero.png'});
 const goToStep=async step=>{
  await page.evaluate(({i,max})=>{
   const r=document.querySelector('.film-journey');
   window.scrollTo(0,r.offsetTop+(r.offsetHeight-innerHeight)*Math.min(.999,(i+.35)/max));
  },{i:step,max:chapterCount});
  await page.waitForTimeout(950);
 };
 await goToStep(4);
 assert.equal(await page.locator('.film-journey').getAttribute('data-chapter'),'1','Design quote chapter');
 assert.ok((await page.locator('.film-sentence h1').innerText()).includes('BEYOND'),'Step-specific quote visible');
 await page.screenshot({path:'qa-screenshots/'+scenario.name+'-quote.png'});
 await goToStep(7);
 assert.equal(await page.locator('.film-journey').getAttribute('data-chapter'),'2','Goggle shatter chapter');
 await page.screenshot({path:'qa-screenshots/'+scenario.name+'-shatter.png'});
 await goToStep(14);
 assert.equal(await page.locator('.film-journey').getAttribute('data-chapter'),'3','Spiral gallery chapter');
 await page.screenshot({path:'qa-screenshots/'+scenario.name+'-helix.png'});
 const gallery=page.locator('.film-gallery');
 assert.equal(await gallery.locator('a[href^="/projects/"]').count(),4,'All four project panels present');
 await gallery.getByRole('link',{name:'Explore Munjiz project'}).click({force:true});
 await page.waitForURL(/\/projects\/munjiz\/?$/, {timeout:10000});
 if(scenario.name==='iphone'){
  await page.goto('http://127.0.0.1:3000/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.getByRole('button',{name:'Open navigation'}).click();
  await page.screenshot({path:'qa-screenshots/iphone-menu.png'});
  await page.keyboard.press('Escape');
 }
 assert.deepEqual(errors,[],'Browser javascript errors');
 console.log(JSON.stringify({scenario:scenario.name,videoCount:urls.length,steps:chapterCount,errors}));
 await ctx.close();
}
await browser.close();
