import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {chromium,webkit} from 'playwright';
const engine=process.env.QA_BROWSER==='webkit'?webkit:chromium;
const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
await mkdir('work/stable-frames',{recursive:true});
try{
 for(const cfg of [{name:'desktop',width:1440,height:900,touch:false},{name:'iphone',width:390,height:844,touch:true}]){
  const context=await browser.newContext({viewport:{width:cfg.width,height:cfg.height},isMobile:cfg.touch,hasTouch:cfg.touch});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const gesture=async(d=1)=>{
    await page.waitForTimeout(370);
    if(cfg.touch)await page.evaluate(d=>{
      const el=document.querySelector('.film-journey');
      const fire=(event,y,last)=>{
        const t=new Touch({identifier:1,target:el,clientX:195,clientY:y});
        el.dispatchEvent(new TouchEvent(event,{bubbles:true,cancelable:true,
          touches:last?[]:[t],targetTouches:last?[]:[t],changedTouches:[t]}));
      };
      fire('touchstart',480,false);fire('touchend',480-d*165,true);
    },d);
    else await page.mouse.wheel(0,140*d);
  };
  const summary=()=>page.evaluate(()=>{
    const videos=[...document.querySelectorAll('.film-clip')];
    const v=document.querySelector('.film-video');
    return {source:v.getAttribute('src')||v.dataset.src,time:v.currentTime,
      chapter:document.querySelector('.film-journey').dataset.chapter,
      phase:document.querySelector('.film-journey').dataset.phase,
      visible:videos.filter(v=>getComputedStyle(v).opacity==='1').map(v=>v.getAttribute('src')),
      rects:videos.map(v=>{const r=v.getBoundingClientRect();return [r.x,r.y,r.width,r.height]})};
  });
  await page.goto('http://127.0.0.1:3000/',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('.film-clip').count(),6);
  assert.equal(await page.locator('.film-video').count(),1);
  let s=await summary();
  assert.ok(s.rects.every(r=>r.every((v,i)=>Math.abs(v-s.rects[0][i])<1)),'Geometry consistent across all 6 clips');
  for(const [index,file] of ['01-goggles-on.mp4','02-dissolve.mp4','03-shatter.mp4'].entries()){
    await gesture();
    await page.waitForFunction(n=>document.querySelector('.film-journey')?.dataset.chapter===String(n)&&
      document.querySelector('.film-journey')?.dataset.phase==='playing',index,{timeout:19000});
    s=await summary();
    assert.ok(s.visible.some(v=>v?.includes(file)),'Native video must display '+file);
    if(index===2)assert.ok(s.time<1.3,'No hidden shatter playback');
    await page.screenshot({path:path.join('work/stable-frames',cfg.name+'-'+index+'.png')});
    await page.waitForFunction(()=>document.querySelector('.film-journey')?.dataset.phase==='completed',null,{timeout:24000});
    s=await summary();
    assert.ok(s.visible.some(v=>v?.includes(file)),'Last native frame held for '+file);
    await page.screenshot({path:path.join('work/stable-frames',cfg.name+'-hold-'+index+'.png')});
  }
  await gesture();
  await page.waitForFunction(()=>document.querySelector('.film-journey')?.dataset.phase==='gallery',null,{timeout:6500});
  await gesture(-1);
  await page.waitForFunction(()=>document.querySelector('.film-journey')?.dataset.direction==='-1',null,{timeout:6500});
  s=await summary();
  assert.ok(s.source.includes('shatter-reverse.mp4'),'Reverse sequence works');
  assert.deepEqual(errors,[]);
  console.log('PASS '+cfg.name+' native surfaces and all film handoffs');
  await context.close();
 }
}finally{await browser.close();}
