'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { filmSources } from '@/lib/film-sources';
import { filmPosters } from '@/lib/film-posters';

const projects = [
  { name: 'Munjiz', tag: 'AI / PRODUCT DESIGN', slug: 'munjiz', image: '/projects/munjiz-arrival.webp' },
  { name: 'Garage Tahmeen', tag: 'FRONTEND / MOTION', slug: 'garage-tahmeen', image: '/projects/garage-tahmeen-drive.webp' },
  { name: 'AqarAI', tag: 'SPATIAL AI', slug: 'aqar-ai', image: '/projects/aqar-poster.webp' },
  { name: 'CISmate', tag: 'MOBILE / STUDENT PLANNING', slug: 'cismate', image: '/projects/cismate-login.jpeg' },
] as const;

const chapters = [
  { eyebrow: 'FULL-STACK DEVELOPER · AI ENGINEER', line: 'AHMAD', emphasis: 'ABULHAWA.', description: '' },
  { eyebrow: 'THE DESIGN PHILOSOPHY', line: 'DESIGN WITH', emphasis: 'PURPOSE.', description: 'Great design makes complex things feel effortless.' },
  { eyebrow: 'THE TRANSFORMATION', line: 'BREAK THE', emphasis: 'EXPECTED.', description: 'One vision. Endless possibilities.' },
] as const;

const SCENE_COUNT = 7; // three film chapters + four discrete project stops
const clamp = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Render one continuous non-wrapping helix path.
 * A fractional index is used ONLY by the internal 1200ms animation clock.
 * User scrolling never directly sets this position.
 * +1 climbs to the next card; -1 follows exactly the same path backwards.
 */
/**
 * Cinematic full-bleed project cinema: a large horizontal leading plane and
 * asymmetric secondary panes circling it like the owner's image reference.
 * Scroll changes only the target integer: the rAF scene motion remains 1.2s.
 */
function drawHelix(cards: (HTMLAnchorElement | null)[], position: number) {
  const mobile = window.innerWidth < 700;
  const radius = mobile ? Math.min(window.innerWidth * .43, 170) : Math.min(window.innerWidth * .395, 720);
  const step = mobile ? 105 : 132;
  cards.forEach((card, index) => {
    if (!card) return;
    const relative = index - position; // Signed means exact reverse path, no modulo skips.
    const angle = relative * 1.10;
    const distance = Math.abs(relative);
    const x = Math.sin(angle) * radius * (mobile ? .43 : 1);
    const y = relative * step;
    const z = mobile
      ? (Math.cos(angle) - 1) * radius * .66 - distance * 82
      : (Math.cos(angle) - 1) * radius * .29 - distance * 95;
    const rotation = -Math.sin(angle) * (mobile ? 37 : 62);
    const scale = Math.max(mobile ? .54 : .62, 1 - distance * (mobile ? .16 : .13));
    // Laptop: large editorial frame with visible planes left and right.
    // Mobile: retain the tighter descending staircase the owner approved.
    const alpha = mobile
      ? (relative < 0 ? Math.max(0, 1 - distance * 1.10) : Math.max(.56, 1 - distance * .13))
      : (distance < .01 ? 1 : Math.max(.20, 1 - distance * .32));
    card.style.transform =
      'translate3d(calc(-50% + ' + x.toFixed(2) + 'px),calc(-50% + ' +
      y.toFixed(2) + 'px),' + z.toFixed(2) + 'px) rotateY(' +
      rotation.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
    card.style.opacity = alpha.toFixed(3);
    card.style.zIndex = String(1000 - Math.round(distance * 100));
    card.dataset.helixRelative = relative.toFixed(3);
  });
}

function WrittenPhrase({ value, tone = 'plain', delay = 0 }: {
  value: string; tone?: 'plain' | 'accent' | 'project'; delay?: number;
}) {
  return (
    <span className={'film-typed film-typed-' + tone} aria-label={value}>
      {Array.from(value).map((char, index) => (
        <span
          key={index}
          className="film-typed-letter"
          aria-hidden="true"
          style={{ animationDelay: (delay + index * 50) + 'ms' }}
        >{char === ' ' ? '\u00a0' : char}</span>
      ))}
    </span>
  );
}

export function FilmChapters() {
  const root = useRef<HTMLElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const reversed = useRef<(HTMLVideoElement | null)[]>([]);
  const cards = useRef<(HTMLAnchorElement | null)[]>([]);
  const [scene, setScene] = useState(0);
  const [introTriggered, setIntroTriggered] = useState(false);
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
    let helixFrame = 0;
    let helixPose = 0;
    let helixBusy = false;
    const disposers: Array<() => void> = [];
    const helixDuration = reduce.matches ? 0 : 1200;
    function cancelHelix() {
      cancelAnimationFrame(helixFrame);
      helixFrame = 0;
      helixBusy = false;
    }
    function tweenHelix(destination: number) {
      cancelHelix();
      const source = helixPose;
      if (helixDuration === 0 || Math.abs(destination - source) < .0001) {
        helixPose = destination;
        drawHelix(cards.current, destination);
        return;
      }
      helixBusy = true;
      node!.dataset.helixMoving = 'true';
      let started = -1;
      const tick = (time: number) => {
        if (released) { cancelHelix(); return; }
        if (started < 0) started = time;
        const t = Math.min(1, (time - started) / helixDuration);
        // Symmetric ease-in-out, identical trajectory forward and backward.
        const eased = t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
        helixPose = source + (destination-source)*eased;
        drawHelix(cards.current, helixPose);
        if (t < 1) {
          helixFrame = requestAnimationFrame(tick);
        } else {
          helixPose = destination;
          drawHelix(cards.current, destination);
          helixFrame = 0;
          helixBusy = false;
          node!.dataset.helixMoving = 'false';
        }
      };
      helixFrame = requestAnimationFrame(tick);
    }

    function setPosition(next: number) {
      position = next;
      node!.dataset.scene = String(next);
      node!.dataset.chapter = String(Math.min(next, 3));
      setScene(next);
      if (next >= 3) tweenHelix(next - 3);
      else if (helixBusy) cancelHelix();
    }
    function release() {
      if (released) return;
      released = true;
      cancelHelix();
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
      if (i === 0 && !reverse) setIntroTriggered(true);
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
      if (released || running || bridgeBusy || helixBusy || performance.now()<lockedUntil) return;
      lockedUntil=performance.now()+(position>=3?1250:850);
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
    drawHelix(cards.current,0);
    node.dataset.helixMoving='false';
    node.dataset.playing='false';
    node.dataset.direction='forward';
    setPosition(0);

    return()=>{
      if(bridgeTimer)clearTimeout(bridgeTimer);
      if(bridgeRevealTimer)clearTimeout(bridgeRevealTimer);
      cancelHelix();
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
          <div className={'film-sentence' + (currentChapter === 0 && !introTriggered ? ' film-sentence-idle' : '')}
            key={currentChapter + '-' + (introTriggered ? 'written' : 'idle')} aria-live="polite">
            <span className="film-micro">{content.eyebrow}</span>
            <h1>
              {currentChapter === 0 && !introTriggered
                ? <><span className="film-static-intro">AHMAD</span><br /><em>ABULHAWA.</em></>
                : <><WrittenPhrase value={content.line} /><br />
                    <em><WrittenPhrase value={content.emphasis} tone="accent" delay={content.line.length * 50 + 190} /></em></>}
            </h1>
            {content.description && <p>{content.description}</p>}
            <span className="film-next">{currentChapter === 0 && !introTriggered ? 'SCROLL TO WRITE THE STORY ↓' : 'SCROLL TO CONTINUE ↓'}</span>
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
                <div className="film-card-art" style={{ backgroundImage: 'url(' + project.image + ')' }}>
                  <div className="film-card-art-full" style={{ backgroundImage: 'url(' + project.image + ')' }} />
                </div>
                <div className="film-card-info">
                  <span>{project.tag}</span>
                  <strong>{project.name}</strong>
                  <span>EXPLORE CASE STUDY ↗</span>
                </div>
              </Link>
            ))}
          </div>
          <span className="film-gallery-hint">
            <span key={currentProject} className="film-project-typed"><WrittenPhrase value={projects[currentProject].name} tone="project" /></span>
            <span className="film-project-counter">— SELECTED PROJECT {currentProject + 1} OF 4</span>
          </span>
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
