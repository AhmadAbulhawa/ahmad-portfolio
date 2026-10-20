'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const clips = [
  {src:'/films/01-goggles-on.mp4',poster:'/projects/ahmad-firnlight-hero.webp',start:.00,end:.23, duration:3.1767},
  {src:'/films/02-dissolve.mp4',poster:'/projects/ahmad-firnlight-hero.webp',start:.23,end:.53,duration:8},
  {src:'/films/03-shatter.mp4',poster:'/projects/ahmad-firnlight-hero.webp',start:.53,end:.83,duration:8},
];
const projects=[
 {name:'Munjiz',tag:'AI / PRODUCT DESIGN',slug:'munjiz',image:'/projects/munjiz-arrival.webp'},
 {name:'Garage Tahmeen',tag:'FRONTEND / MOTION',slug:'garage-tahmeen',image:'/projects/garage-tahmeen-drive.webp'},
 {name:'AqarAI',tag:'SPATIAL AI',slug:'aqar-ai',image:'/projects/aqar-poster.webp'},
 {name:'CISmate',tag:'MOBILE / ACADEMIC PLANNING',slug:'cismate',image:'/projects/cismate-planner.webp'},
] as const;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>{const x=clamp(n);return x*x*(3-2*x);};
const segment=(n:number,a:number,b:number)=>smooth((n-a)/(b-a));

export function FilmChapters(){
 const root=useRef<HTMLElement>(null);
 const videos=useRef<(HTMLVideoElement|null)[]>([]);
 const cards=useRef<(HTMLAnchorElement|null)[]>([]);
 const [missing,setMissing]=useState<boolean[]>([false,false,false]);
 useEffect(()=>{
  const node=root.current;if(!node)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let raf=0,current=0,target=0,lastActive=-1,visible=true;
  const update=()=>{
   const rect=node.getBoundingClientRect();
   target=clamp(-rect.top/Math.max(1,rect.height-innerHeight));
   if(!raf)raf=requestAnimationFrame(render);
  };
  const render=()=>{
   raf=0;
   if(!visible||document.hidden)return;
   current=reduced.matches?0:current+(target-current)*.24;
   if(Math.abs(target-current)<.0009)current=target;
   const p=current;
   node.style.setProperty('--film-scroll',String(p));
   const chapter=p<.23?0:p<.53?1:p<.83?2:3;
   node.dataset.chapter=String(chapter);
   clips.forEach((clip,i)=>{
    const v=videos.current[i];if(!v||v.readyState<1)return;
    const phase=clamp((p-clip.start)/(clip.end-clip.start));
    // Scroll is the timeline. Speeding a clip here means shortening its scroll distance, not autoplay.
    const wanted=Math.min(Math.max(0,v.duration-.045),phase*clip.duration);
    if(Math.abs(v.currentTime-wanted)>.06){
      try {v.currentTime=wanted;}catch {/* browser not seekable yet */ }
    }
    if(!v.paused)v.pause();
   });
   node.style.setProperty('--scene-1',String((1-segment(p,.20,.27))));
   node.style.setProperty('--scene-2',String(segment(p,.19,.26)*(1-segment(p,.50,.56))));
   node.style.setProperty('--scene-3',String(segment(p,.49,.56)*(1-segment(p,.80,.86))));
   node.style.setProperty('--film-name',String(1-segment(p,.14,.22)));
   node.style.setProperty('--film-quote',String(segment(p,.29,.36)*(1-segment(p,.46,.52))));
   node.style.setProperty('--film-break',String(segment(p,.60,.69)*(1-segment(p,.77,.83))));
   const gallery=segment(p,.80,.87);
   node.style.setProperty('--film-gallery',String(gallery));
   const arc=segment(p,.83,1);
   const vw=Math.min(innerWidth,1200);
   const radius=Math.min(vw*.4,440);
   cards.current.forEach((card,i)=>{
    if(!card)return;
    // Cards advance around a true cylindrical helix rather than scaling in a flat row.
    const angle=i*Math.PI*.54+arc*Math.PI*2.25-Math.PI*.55;
    const x=Math.sin(angle)*radius;
    const z=Math.cos(angle)*radius;
    const y=(i-1.5)*150-(arc*550);
    const scale=.55+(z+radius)/(2*radius)*.55;
    card.style.transform='translate3d(calc(-50% + '+x.toFixed(1)+'px),calc(-50% + '+y.toFixed(1)+'px),'+z.toFixed(1)+'px) rotateY('+(-angle*180/Math.PI).toFixed(1)+'deg) scale('+scale.toFixed(3)+')';
    card.style.zIndex=String(Math.round(z+radius));
    card.tabIndex=gallery>.94?0:-1;
    card.style.pointerEvents=gallery>.94?'auto':'none';
   });
   if(chapter!==lastActive){lastActive=chapter;}
   if(Math.abs(target-current)>.0009)raf=requestAnimationFrame(render);
  };
  const observer=new IntersectionObserver(([entry])=>{
   visible=entry.isIntersecting;
   if(visible)update();
   else {cancelAnimationFrame(raf);raf=0;}
  },{rootMargin:'200px'});
  observer.observe(node);
  window.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update);
  const onVisibility=()=>{if(!document.hidden)update()};
  document.addEventListener('visibilitychange',onVisibility);
  update();
  return()=>{cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener('scroll',update);window.removeEventListener('resize',update);document.removeEventListener('visibilitychange',onVisibility);};
 },[]);
 return <section ref={root} className="film-journey" id="intro" aria-label="Ahmad's cinematic project story">
  <div className="film-sticky">
   <div className="film-videos" aria-hidden="true">
    {clips.map((clip,i)=><video key={clip.src} ref={el=>{videos.current[i]=el}} className={'film-video film-video-'+i} muted playsInline preload="auto" poster={clip.poster} src={clip.src}
      onError={()=>setMissing(prev=>prev.map((x,k)=>k===i?true:x))}/>)}
   </div>
   <div className="film-ambient" aria-hidden="true"/>
   <div className="film-name">
    <span className="film-micro">FULL-STACK ENGINEER · AI · CREATIVE DEVELOPMENT</span>
    <h1>AHMAD <em>ABULHAWA.</em></h1>
    <span className="film-scroll-cue">SCROLL TO BEGIN ↓</span>
   </div>
   <div className="film-quote">
    <span className="film-micro">01 / DESIGN PHILOSOPHY</span>
    <blockquote>“Design isn&apos;t just what you see.<br/><em>It&apos;s what you make possible.</em>”</blockquote>
    <p>From meaningful interfaces to intelligent products — each project is a new way to solve something real.</p>
   </div>
   <div className="film-break">
     <span className="film-micro">02 / THE BREAKTHROUGH</span>
     <p>BREAK THE EXPECTED.<br/><em>BUILD THE NEXT.</em></p>
   </div>
   <div className="film-gallery">
     <header><span>03 / SELECTED WORK</span><span>SCROLL THROUGH THE HELIX ↓</span></header>
     <div className="film-helix" role="group" aria-label="Choose a project">
      {projects.map((project,i)=><Link key={project.slug} href={'/projects/'+project.slug+'/'} prefetch={false}
       ref={el=>{cards.current[i]=el}}
       className="film-glass-card" tabIndex={-1} aria-label={'Explore '+project.name+' project'}>
        <div className="film-card-art" style={{backgroundImage:'url('+project.image+')'}}/>
        <div className="film-card-info"><span>{project.tag}</span><strong>{project.name}</strong><span>VIEW PROJECT ↗</span></div>
       </Link>)}
     </div>
     <Link href="#work" className="film-explore-all">ALL PROJECTS ↘</Link>
   </div>
   {(missing.some(Boolean))&&<p className="film-media-warning" role="status">The cinematic video files are still being attached to this preview. The interactive work gallery is available below.</p>}
   <div className="film-dots" aria-hidden="true"><span>01</span><span>02</span><span>03</span><span>04</span></div>
   <a className="film-skip" href="#work">SKIP INTRO ↗</a>
  </div>
  <div className="film-sr-notes sr-only">
   <p>Scroll chapter one: Ahmad Abulhawa puts on his goggles.</p>
   <p>Scroll chapter two: a quote about design and a transition into the project philosophy.</p>
   <p>Scroll chapter three: the goggles shatter into iridescent glass.</p>
   <p>Scroll chapter four: select from four interactive project case studies in a 3D spiral gallery.</p>
  </div>
 </section>;
}
