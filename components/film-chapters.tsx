'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { filmSources } from '@/lib/film-sources';
import { filmPosters } from '@/lib/film-posters';

const projects = [
  { name: 'Munjiz', tag: 'AI / PRODUCT DESIGN', slug: 'munjiz', image: '/projects/munjiz-arrival.webp' },
  { name: 'Garage Tahmeen', tag: 'FRONTEND / MOTION', slug: 'garage-tahmeen', image: '/projects/garage-tahmeen-drive.webp' },
  { name: 'AqarAI', tag: 'SPATIAL AI', slug: 'aqar-ai', image: '/projects/aqar-poster.webp' },
  { name: 'CISmate', tag: 'MOBILE / STUDENT PLANNING', slug: 'cismate', image: '/projects/cismate-planner.webp' },
] as const;

const chapters = [
  { eyebrow: 'FULL-STACK DEVELOPER · AI ENGINEER', line: 'AHMAD', emphasis: 'ABULHAWA.', description: '' },
  { eyebrow: 'THE DESIGN PHILOSOPHY', line: 'DESIGN WITH', emphasis: 'PURPOSE.', description: 'Great design makes complex things feel effortless.' },
  { eyebrow: 'THE TRANSFORMATION', line: 'BREAK THE', emphasis: 'EXPECTED.', description: 'One vision. Endless possibilities.' },
] as const;

const SCENE_COUNT = 7; // three film chapters + four discrete project stops
const clamp = (n: number) => Math.max(0, Math.min(1, n));

function placeCards(cards: (HTMLAnchorElement | null)[], selected: number, reduced: boolean) {
  const mobile = window.innerWidth < 700;
  const radius = mobile ? Math.min(window.innerWidth * .53, 180) : Math.min(window.innerWidth * .29, 365);
  cards.forEach((card, index) => {
    if (!card) return;
    // The selected project is FULLY frontal, level, centered, and closest to
    // camera. Others descend behind it as steps of a 3D circular staircase.
    const level = (index - selected + projects.length) % projects.length;
    const angle = level * 1.22;
    const x = level === 0 ? 0 : Math.sin(angle) * radius * .46;
    const y = level === 0 ? 0 : level * (mobile ? 105 : 132);
    const z = level === 0 ? radius : Math.cos(angle) * radius * .46 - level * 86;
    const ry = level === 0 ? 0 : -angle * 180 / Math.PI * .38;
    const scale = level === 0 ? 1 : Math.max(.54, .78 - level * .07);
    card.style.transform =
      'translate3d(calc(-50% + ' + x.toFixed(1) + 'px),calc(-50% + ' +
      y.toFixed(1) + 'px),' + z.toFixed(1) + 'px) rotateY(' +
      ry.toFixed(1) + 'deg) scale(' + scale.toFixed(3) + ')';
    card.style.zIndex = String(1000 - level * 100);
    card.style.opacity = level === 0 ? '1' : level === 1 ? '.92' : level === 2 ? '.7' : '.45';
    card.style.transitionDuration = reduced ? '0ms' : '1050ms';
  });
}

export function FilmChapters() {
  const root = useRef<HTMLElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const reversed = useRef<(HTMLVideoElement | null)[]>([]);
  const cards = useRef<(HTMLAnchorElement | null)[]>([]);
  const [scene, setScene] = useState(0);
  const [errors, setErrors] = useState<boolean[]>([false, false, false]);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const previousBody = document.body.style.overflow;
    const previousHtml = document.documentElement.style.overflow;
    const skip = node.querySelector<HTMLAnchorElement>('.film-skip');
    const forwardEnd = [false,false,false];
    let position = 0;
    let running = false;
    let released = false;
    let bridgeBusy = false;
    let bridgeTimer: ReturnType<typeof setTimeout> | null = null;
    let bridgeRevealTimer: ReturnType<typeof setTimeout> | null = null;
    let lockedUntil = 0;
    let touchY = 0;
    let touchX = 0;
    let activeVideo: HTMLVideoElement | null = null;
    const disposers: Array<() => void> = [];

    function setPosition(next: number) {
      position = next;
      node!.dataset.scene = String(next);
      node!.dataset.chapter = String(Math.min(next, 3));
      setScene(next);
      if (next >= 3) placeCards(cards.current, next - 3, reduce.matches);
    }
    function release() {
      if (released) return;
      released = true;
      bridgeBusy = false;
      if (bridgeTimer) clearTimeout(bridgeTimer);
      if (bridgeRevealTimer) clearTimeout(bridgeRevealTimer);
      node!.dataset.bridge = '';
      node!.dataset.released = 'true';
      document.documentElement.dataset.filmReleased = 'true';
      document.body.style.overflow = previousBody;
      document.documentElement.style.overflow = previousHtml;
      [...videos.current, ...reversed.current].forEach(video => video?.pause());
    }
    if (location.hash && location.hash !== '#intro') {
      released = true;
      node.dataset.released = 'true';
      document.documentElement.dataset.filmReleased = 'true';
    } else {
      delete document.documentElement.dataset.filmReleased;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }

    // Only trim the inactive 1.8-second beginning of clip two. Its original
    // source video is still full 1080p and never re-encoded. Play at 1x.
    const dissolve = videos.current[1];
    function primeDissolve() {
      if (dissolve && dissolve.readyState >= 1 && dissolve.currentTime < 1.8) {
        try { dissolve.currentTime = 1.8; } catch { /* pending metadata */ }
      }
    }
    dissolve?.addEventListener('loadedmetadata',primeDissolve);
    dissolve?.setAttribute('preload','auto');
    primeDissolve();

    function bindEnd(video: HTMLVideoElement | null, i: number, reverse: boolean) {
      if (!video) return;
      video.pause();
      video.playbackRate = i === 2 ? 1.5 : 1;
      const finished = () => {
        video.pause();
        forwardEnd[i] = !reverse;
        running = false;
        activeVideo = null;
        node!.dataset.playing = 'false';
        node!.dataset.finished = String(i);
        // Prevent momentum from one wheel gesture triggering the next chapter.
        lockedUntil = performance.now() + 650;
      };
      video.addEventListener('ended',finished);
      disposers.push(()=>video.removeEventListener('ended',finished));
    }
    videos.current.forEach((video,i)=>bindEnd(video,i,false));
    reversed.current.forEach((video,i)=>bindEnd(video,i,true));

    function playChapter(i: number, reverse: boolean) {
      if (released || running) return;
      const video = reverse ? reversed.current[i] : videos.current[i];
      if (!video) return;
      const targetVideo: HTMLVideoElement = video;
      running = true;
      node!.dataset.playing = 'true';
      node!.dataset.direction = reverse ? 'reverse' : 'forward';
      activeVideo = targetVideo;
      [...videos.current, ...reversed.current].forEach(v => {
        if (v && v !== targetVideo) v.pause();
      });
      targetVideo.playbackRate = i === 2 ? 1.5 : 1;
      const desired = !reverse && i === 1 ? 1.8 : 0;
      const start = () => {
        if (released || position !== i || activeVideo !== targetVideo) return;
        void targetVideo.play().catch(()=>{
          if (released) return;
          running = false;
          activeVideo = null;
          node!.dataset.playing = 'false';
          node!.dataset.mediaError = 'playback';
        });
      };
      function ready() {
        if (targetVideo.readyState < 1) {
          targetVideo.addEventListener('loadedmetadata',ready,{once:true});
          return;
        }
        if (Math.abs(targetVideo.currentTime - desired) > .12) {
          const onSeeked=()=>start();
          targetVideo.addEventListener('seeked',onSeeked,{once:true});
          try { targetVideo.currentTime=desired; }
          catch { targetVideo.removeEventListener('seeked',onSeeked); start(); }
        } else start();
      }
      ready();
    }

    // A real short film wipe hides the mismatch of lens position between
    // dissolve's final frame and shatter's first frame (both directions).
    function bridge(next: number, reverse: boolean) {
      bridgeBusy = true;
      node!.dataset.bridge = 'cover';
      bridgeTimer = setTimeout(()=>{
        if (released) return;
        setPosition(next);
        playChapter(next,reverse);
        // Wait until the outgoing film has fully faded behind the dark mask.
        bridgeRevealTimer = setTimeout(()=>{
          if (released) return;
          node!.dataset.bridge = 'reveal';
          bridgeTimer = setTimeout(()=>{
            node!.dataset.bridge = '';
            bridgeBusy = false;
          },570);
        },540);
      },320);
    }

    function advance(direction: number) {
      if (released || running || bridgeBusy || performance.now()<lockedUntil) return;
      lockedUntil=performance.now()+850;
      if (direction>0) {
        if (position < 3) {
          if (!forwardEnd[position]) {
            playChapter(position,false);
          } else if (position === 2) {
            node!.dataset.direction = 'forward';
            setPosition(3);
          } else if (position === 1) {
            bridge(2,false);
          } else {
            setPosition(1);
            playChapter(1,false);
          }
        } else if (position < 6) {
          setPosition(position+1);
        } else {
          release();
          requestAnimationFrame(()=>
            document.getElementById('work')?.scrollIntoView({
              behavior:reduce.matches ? 'instant' : 'smooth',block:'start'
            }));
        }
      } else {
        if (position > 3) {
          setPosition(position-1);
        } else if (position === 3) {
          setPosition(2);
          playChapter(2,true);
        } else if (position < 3) {
          if (forwardEnd[position]) {
            playChapter(position,true);
          } else if (position > 0) {
            if (position === 2) bridge(1,true);
            else {
              setPosition(position-1);
              if (forwardEnd[position]) playChapter(position,true);
            }
          }
        }
      }
    }
    function onWheel(event: WheelEvent) {
      if (released) return;
      if (event.cancelable) event.preventDefault();
      if (Math.abs(event.deltaY) >= 5) advance(Math.sign(event.deltaY));
    }
    function onTouchStart(event: TouchEvent) {
      touchY=event.touches[0]?.clientY??0;
      touchX=event.touches[0]?.clientX??0;
    }
    function onTouchMove(event: TouchEvent) {
      if (!released && event.cancelable) event.preventDefault();
    }
    function onTouchEnd(event: TouchEvent) {
      if (released) return;
      const y=event.changedTouches[0]?.clientY??touchY;
      const x=event.changedTouches[0]?.clientX??touchX;
      if (Math.abs(touchY-y)>43 && Math.abs(touchY-y)>Math.abs(touchX-x)) {
        advance(Math.sign(touchY-y));
      }
    }
    function onKey(event: KeyboardEvent) {
      if (released || event.altKey || event.metaKey || event.ctrlKey ||
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement) return;
      if (['ArrowDown','ArrowUp','PageDown','PageUp',' '].includes(event.key)) {
        event.preventDefault();
        advance(event.key==='ArrowUp'||event.key==='PageUp'?-1:1);
      }
      if(event.key==='End')event.preventDefault();
    }
    function onVisibility() {
      if (released || !activeVideo) return;
      if (document.hidden) activeVideo.pause();
      else if (running) void activeVideo.play().catch(()=>{});
    }
    function onNavigation(event: MouseEvent) {
      if(released || !(event.target instanceof Element))return;
      const anchor=event.target.closest<HTMLAnchorElement>('a[href]');
      if(!anchor || !(anchor.closest('.firn-header') || anchor.classList.contains('film-explore-all')))return;
      const url=new URL(anchor.href,location.href);
      if(url.origin!==location.origin || url.pathname!==location.pathname ||
         !url.hash || url.hash==='#intro')return;
      release();
      const destination=decodeURIComponent(url.hash.slice(1));
      requestAnimationFrame(()=>requestAnimationFrame(()=>
        document.getElementById(destination)?.scrollIntoView({
          behavior:'instant',block:'start'
        })));
    }
    const onHashChange=()=>{
      if(!released && location.hash && location.hash!=='#intro')release();
    };
    const onSkip=()=>release();
    document.addEventListener('click',onNavigation,true);
    window.addEventListener('hashchange',onHashChange);
    skip?.addEventListener('click',onSkip);
    window.addEventListener('wheel',onWheel,{passive:false});
    window.addEventListener('touchstart',onTouchStart,{passive:true});
    window.addEventListener('touchmove',onTouchMove,{passive:false});
    window.addEventListener('touchend',onTouchEnd,{passive:true});
    document.addEventListener('keydown',onKey);
    document.addEventListener('visibilitychange',onVisibility);
    placeCards(cards.current,0,reduce.matches);
    node.dataset.playing='false';
    node.dataset.direction='forward';
    setPosition(0);

    return()=>{
      if(bridgeTimer)clearTimeout(bridgeTimer);
      if(bridgeRevealTimer)clearTimeout(bridgeRevealTimer);
      disposers.forEach(fn=>fn());
      document.removeEventListener('click',onNavigation,true);
      window.removeEventListener('hashchange',onHashChange);
      skip?.removeEventListener('click',onSkip);
      dissolve?.removeEventListener('loadedmetadata',primeDissolve);
      window.removeEventListener('wheel',onWheel);
      window.removeEventListener('touchstart',onTouchStart);
      window.removeEventListener('touchmove',onTouchMove);
      window.removeEventListener('touchend',onTouchEnd);
      document.removeEventListener('keydown',onKey);
      document.removeEventListener('visibilitychange',onVisibility);
      document.body.style.overflow=previousBody;
      document.documentElement.style.overflow=previousHtml;
      if(!released)delete document.documentElement.dataset.filmReleased;
      [...videos.current,...reversed.current].forEach(v=>v?.pause());
    };
  }, []);

  const currentChapter = Math.min(scene, 3);
  const currentProject = Math.max(0, scene - 3);
  const content = chapters[Math.min(2, scene)];
  const gallery = currentChapter === 3;

  return (
    <section ref={root} className="film-journey" id="intro" aria-label="Ahmad's cinematic portfolio" data-chapter="0" data-scene="0">
      <div className="film-sticky">
        <div className="film-videos" aria-hidden="true">
          {filmSources.map((source, index) => (
            <video key={source.role}
              ref={node => { videos.current[index] = node; }}
              className={'film-video film-video-' + index}
              src={source.src}
              poster={filmPosters[index]}
              preload={index < 2 ? 'auto' : 'metadata'}
              playsInline muted
              onError={() => setErrors(previous => previous.map((value, k) => index === k ? true : value))}
            />
          ))}
          {filmSources.map((source,index) => (
            <video key={source.role + '-reverse'}
              ref={node => { reversed.current[index] = node; }}
              className={'film-video film-video-reverse-' + index}
              src={'/films/0' + (index + 1) + '-' + (index === 0 ? 'goggles-on' : index === 1 ? 'dissolve' : 'shatter') + '-reverse.mp4'}
              preload="metadata"
              playsInline muted
              onError={() => setErrors(previous => previous.map((value, k) => index === k ? true : value))}
            />
          ))}
        </div>
        <div className="film-ambient" aria-hidden="true" />
        <div className="film-bridge" aria-hidden="true" />
        {!gallery && (
          <div className="film-sentence" key={currentChapter} aria-live="polite">
            <span className="film-micro">{content.eyebrow}</span>
            <h1>{content.line}<br /><em>{content.emphasis}</em></h1>
            {content.description && <p>{content.description}</p>}
            <span className="film-next">{currentChapter === 0 ? 'SCROLL TO START THE STORY ↓' : 'SCROLL TO CONTINUE ↓'}</span>
          </div>
        )}
        <div className="film-gallery" aria-hidden={!gallery}>
          <header>
            <span>SELECTED WORK / 04</span>
            <span>ONE SCROLL · ONE PROJECT ↗</span>
          </header>
          <div className="film-helix" role="group" aria-label="Interactive glass project helix">
            {projects.map((project, index) => (
              <Link key={project.slug} prefetch={false}
                href={'/projects/' + project.slug + '/'}
                ref={node => { cards.current[index] = node; }}
                className={'film-glass-card' + (gallery && index === currentProject ? ' is-selected' : '')}
                tabIndex={gallery ? 0 : -1}
                aria-label={'Explore ' + project.name + ' project'}>
                <div className="film-card-art" style={{ backgroundImage: 'url(' + project.image + ')' }} />
                <div className="film-card-info">
                  <span>{project.tag}</span>
                  <strong>{project.name}</strong>
                  <span>EXPLORE CASE STUDY ↗</span>
                </div>
              </Link>
            ))}
          </div>
          <span className="film-gallery-hint">{projects[currentProject].name} <span>— SELECTED PROJECT {currentProject + 1} OF 4</span></span>
          <Link href="#work" className="film-explore-all">ALL PROJECTS ↘</Link>
        </div>
        {errors.some(Boolean) && (
          <p className="film-media-warning" role="status">
            A cinematic clip is temporarily unavailable. You can still access the case studies below.
          </p>
        )}
        <div className="film-dots" aria-hidden="true">
          <span className={scene === 0 ? 'active' : ''}>01</span>
          <span className={scene === 1 ? 'active' : ''}>02</span>
          <span className={scene === 2 ? 'active' : ''}>03</span>
          <span className={gallery ? 'active' : ''}>04</span>
        </div>
        <a className="film-skip" href="#work">SKIP INTRO ↗</a>
      </div>
    </section>
  );
}
