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
  const width = window.innerWidth;
  const radius = mobile ? Math.min(width * .44, 205) : Math.min(width * .29, 380);
  cards.forEach((card, index) => {
    if (!card) return;
    const level = index - selected;
    // A true spiral staircase: one panel comes squarely to the front centre
    // of the viewport; all others climb/circle the same axis behind it.
    const angle = level * Math.PI * .61;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius - Math.abs(level) * 15;
    const y = level * (mobile ? 155 : 195);
    const scale = level === 0 ? 1 : Math.max(.52, .68 + (z / radius) * .10);
    card.style.transform =
      'translate3d(calc(-50% + ' + x.toFixed(1) + 'px),calc(-50% + ' +
      y.toFixed(1) + 'px),' + z.toFixed(1) + 'px) rotateY(' +
      (-angle * 180 / Math.PI * .72).toFixed(1) + 'deg) scale(' + scale.toFixed(3) + ')';
    card.style.zIndex = level === 0 ? '1000' : String(Math.round(z + radius));
    card.style.opacity = level === 0 ? '1' : Math.abs(level) > 1 ? '.5' : '.8';
    card.style.transitionDuration = reduced ? '0ms' : '1050ms';
  });
}

export function FilmChapters() {
  const root = useRef<HTMLElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
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
    let position = 0;
    let started = false;
    let running = false;
    let released = false;
    let lockedUntil = 0;
    let startY = 0;
    let startX = 0;
    let bridgeTimer: ReturnType<typeof setTimeout> | null = null;
    let bridgeBusy = false;
    const complete = [false, false, false];
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
      if (bridgeTimer) clearTimeout(bridgeTimer);
      bridgeBusy = false;
      node!.dataset.bridge = '';
      node!.dataset.released = 'true';
      document.documentElement.dataset.filmReleased = 'true';
      document.body.style.overflow = previousBody;
      document.documentElement.style.overflow = previousHtml;
      if (!released) delete document.documentElement.dataset.filmReleased;
      videos.current.forEach(v => v?.pause());
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
    const second = videos.current[1];
    const primeSecond = () => {
      if (second && second.readyState >= 1 && second.currentTime < 2.68) {
        try { second.currentTime = 2.68; } catch { /* seek later */ }
      }
    };
    second?.addEventListener('loadedmetadata', primeSecond);
    second?.setAttribute('preload', 'auto');
    primeSecond();
    const endedHandlers: Array<() => void> = [];
    videos.current.forEach((video, i) => {
      if (!video) return;
      video.pause();
      video.playbackRate = i === 0 ? 1 : 1.5;
      const ended = () => {
        complete[i] = true;
        running = false;
        node!.dataset.playing = 'false';
        node!.dataset.finished = String(i);
      };
      video.addEventListener('ended', ended);
      endedHandlers.push(() => video.removeEventListener('ended', ended));
    });
    function playClip(index: number) {
      if (released || running || complete[index]) return;
      const video = videos.current[index];
      if (!video) return;
      started = true;
      running = true;
      node!.dataset.playing = 'true';
      videos.current.forEach((v, i) => { if (i !== index) v?.pause(); });
      video.playbackRate = index === 0 ? 1 : 1.5;
      const begin = () => {
        if (released || position !== index) return;
        try {
          if (index === 1 && video.currentTime < 2.68) video.currentTime = 2.68;
          if (index !== 1 && video.currentTime > .1) video.currentTime = 0;
        } catch { /* wait for playback readiness */ }
        void video.play().catch(() => {
          running = false;
          node!.dataset.playing = 'false';
          node!.dataset.mediaError = 'playback';
        });
      };
      if (video.readyState < 2) video.addEventListener('canplay', begin, { once: true });
      else begin();
    }
    // Critical: advancing never consults scroll progress. A playing clip
    // must finish before ANY further wheel, key, or swipe can change scenes.
    function go(direction: number) {
      if (released) return;
      const now = performance.now();
      if (running || bridgeBusy || now < lockedUntil) return;
      lockedUntil = now + 950;
      if (direction < 0) {
        if (position > 0) {
          const next = position - 1;
          setPosition(next);
          videos.current.forEach(v => v?.pause());
          if (next < 3 && complete[next]) {
            const video = videos.current[next];
            if (video && video.readyState >= 1) {
              try { video.currentTime = Math.max(0, video.duration - .05); } catch { /* ready later */ }
            }
          }
        }
        return;
      }
      if (position === 0 && !started) { playClip(0); return; }
      if (position < 3 && !complete[position]) { playClip(position); return; }
      if (position === 6) {
        release();
        requestAnimationFrame(() => document.getElementById('work')?.scrollIntoView({
          behavior: reduce.matches ? 'instant' : 'smooth'
        }));
        return;
      }
      const next = position + 1;
      if (next === 2) {
        // Source 02 ends with a small sideways goggle; source 03 begins
        // with a larger frontal product shot. Mask the geometry change using
        // a short prismatic dark flash, never a low-quality video re-encode.
        bridgeBusy = true;
        node!.dataset.bridge = 'cover';
        bridgeTimer = setTimeout(() => {
          if (released) return;
          setPosition(2);
          playClip(2);
          node!.dataset.bridge = 'reveal';
          bridgeTimer = setTimeout(() => {
            if (!released) node!.dataset.bridge = '';
            bridgeBusy = false;
          }, 500);
        }, 280);
        return;
      }
      if (next === 3) {
        const video = videos.current[2];
        if (video && video.readyState >= 1) {
          try { video.currentTime = Math.max(0, video.duration - .04); } catch { /* wait */ }
        }
      }
      setPosition(next);
      if (next < 3 && !complete[next]) playClip(next);
    }
    function onWheel(event: WheelEvent) {
      if (released) return;
      if (event.cancelable) event.preventDefault();
      if (Math.abs(event.deltaY) >= 5) go(Math.sign(event.deltaY));
    }
    function onTouchStart(event: TouchEvent) {
      startY = event.touches[0]?.clientY ?? 0;
      startX = event.touches[0]?.clientX ?? 0;
    }
    function onTouchMove(event: TouchEvent) {
      if (!released && event.cancelable) event.preventDefault();
    }
    function onTouchEnd(event: TouchEvent) {
      if (released) return;
      const y = event.changedTouches[0]?.clientY ?? startY;
      const x = event.changedTouches[0]?.clientX ?? startX;
      if (Math.abs(startY - y) > 43 && Math.abs(startY - y) > Math.abs(startX - x)) go(Math.sign(startY - y));
    }
    function onKey(event: KeyboardEvent) {
      if (released || event.altKey || event.metaKey || event.ctrlKey || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (['ArrowDown','ArrowUp','PageDown','PageUp',' '].includes(event.key)) {
        event.preventDefault();
        go(event.key === 'ArrowUp' || event.key === 'PageUp' ? -1 : 1);
      }
      if (event.key === 'End') event.preventDefault();
    }
    function onVisibility() {
      if (released || position >= 3 || complete[position]) return;
      const video = videos.current[position];
      if (document.hidden) video?.pause();
      else if (running) void video?.play().catch(() => {});
    }
    // Header links are explicit navigation and must bypass the gate even
    // while a film is running. Ordinary wheel/touch inputs are still locked.
    function onNavigation(event: MouseEvent) {
      if (released || !(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>('a[href]');
      if (!anchor || !(anchor.closest('.firn-header') || anchor.classList.contains('film-explore-all'))) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname ||
          !url.hash || url.hash === '#intro') return;
      release();
      const destination = decodeURIComponent(url.hash.slice(1));
      requestAnimationFrame(() => requestAnimationFrame(() => {
        document.getElementById(destination)?.scrollIntoView({ behavior: 'instant', block: 'start' });
      }));
    }
    function onHashChange() {
      if (!released && location.hash && location.hash !== '#intro') release();
    }
    const onSkip = () => release();
    document.addEventListener('click', onNavigation, true);
    window.addEventListener('hashchange', onHashChange);
    skip?.addEventListener('click', onSkip);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVisibility);
    node.dataset.playing = 'false';
    setPosition(0);
    return () => {
      if (bridgeTimer) clearTimeout(bridgeTimer);
      document.removeEventListener('click', onNavigation, true);
      window.removeEventListener('hashchange', onHashChange);
      skip?.removeEventListener('click', onSkip);
      second?.removeEventListener('loadedmetadata', primeSecond);
      endedHandlers.forEach(fn => fn());
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisibility);
      document.body.style.overflow = previousBody;
      document.documentElement.style.overflow = previousHtml;
      videos.current.forEach(v => v?.pause());
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
              poster={index === 1 ? undefined : filmPosters[index]}
              preload={index === 0 ? 'auto' : 'metadata'}
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
