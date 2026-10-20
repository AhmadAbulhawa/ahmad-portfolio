import { chromium, devices } from 'playwright';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

await mkdir('qa-screenshots', { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const scenarios=[
  {name:'iphone',settings:{...devices['iPhone 13'],defaultBrowserType:'chromium'}},
  {name:'desktop',settings:{viewport:{width:1440,height:900},deviceScaleFactor:1}},
];
const COUNT=7;
for(const scenario of scenarios){
  const context=await browser.newContext(scenario.settings);
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:3000/',{waitUntil:'domcontentloaded'});
  const video=page.locator('.film-video');
  assert.equal(await video.count(),3,'All three films must be present');
  await page.waitForTimeout(650);
  assert.equal(await page.locator('.film-journey').getAttribute('data-scene'),'0');
  const initial=await video.first().evaluate(v=>({time:v.currentTime,paused:v.paused,rate:v.playbackRate}));
  assert.equal(initial.paused,true,'Intro must be paused until scroll');
  assert.ok(initial.time<.1,'Intro must start at first frame');
  assert.equal(initial.rate,1,'Intro must stay original speed');
  const width=await video.first().evaluate(v=>({width:v.getBoundingClientRect().width,window:innerWidth}));
  assert.ok(width.width>=width.window-2,'Video must be full-bleed');
  await page.screenshot({path:'qa-screenshots/'+scenario.name+'-hero.png'});
  const go=async scene=>{
    await page.evaluate(({scene,count})=>{
      const root=document.querySelector('.film-journey');
      const delta=root.offsetHeight-innerHeight;
      window.scrollTo({top:root.offsetTop+(scene+.3)/count*delta,behavior:'instant'});
    },{scene,count:COUNT});
    await page.waitForTimeout(900);
  };
  await go(1);
  assert.equal(await page.locator('.film-journey').getAttribute('data-chapter'),'1','Design film must show');
  assert.ok((await page.locator('.film-sentence h1').innerText()).includes('DESIGN'));
  await page.screenshot({path:'qa-screenshots/'+scenario.name+'-design.png'});
  await go(2);
  assert.equal(await page.locator('.film-journey').getAttribute('data-chapter'),'2');
  await page.screenshot({path:'qa-screenshots/'+scenario.name+'-shatter.png'});
  await go(3);
  assert.equal(await page.locator('.film-journey').getAttribute('data-chapter'),'3');
  await page.screenshot({path:'qa-screenshots/'+scenario.name+'-helix-first.png'});
  const cards=page.locator('.film-glass-card');
  assert.equal(await cards.count(),4);
  const startTransform=await cards.first().evaluate(el=>el.style.transform);
  await go(4);
  const secondTransform=await cards.first().evaluate(el=>el.style.transform);
  assert.notEqual(secondTransform,startTransform,'Each gallery stop must animate to next fixed target');
  await page.screenshot({path:'qa-screenshots/'+scenario.name+'-helix-next.png'});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
  assert.equal(overflow,false,scenario.name+' must not overflow horizontally');
  await cards.nth(1).click({force:true});
  await page.waitForURL(/\/projects\/garage-tahmeen\/?$/, {timeout:10000});
  if(scenario.name==='iphone'){
    await page.goto('http://127.0.0.1:3000/',{waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:'Open navigation'}).click();
    await page.screenshot({path:'qa-screenshots/iphone-menu.png'});
    await page.keyboard.press('Escape');
  }
  assert.deepEqual(errors,[],'No browser exceptions allowed');
  console.log(JSON.stringify({scenario:scenario.name,fullWidth:width,initial,errors}));
  await context.close();
}
await browser.close();
