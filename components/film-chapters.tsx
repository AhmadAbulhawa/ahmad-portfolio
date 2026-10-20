'use client';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { CinematicController, type Snapshot } from '@/lib/cinematic/controller';
import { FrameHandoff } from '@/lib/cinematic/frame-handoff';
import { WheelIntent } from '@/lib/cinematic/wheel-intent';
import { Arrow } from './icons';
const SpiralGallery = dynamic(() => import('./spiral-gallery'), { ssr: false });
const initial: Snapshot = { chapter: 0, phase: 'idle', direction: 1, progress: 0, hasFrame: false };
const introduction = [
  'FULL-STACK DEVELOPER · AI ENGINEER',
  'AHMAD',
  'ABULHAWA.',
  'Thoughtful code. Unforgettable experiences.',
];
const chapters = [
  ['THE STORY BEGINS', 'A NEW', 'PERSPECTIVE.', 'Thoughtful code. A different way to see what’s possible.'],
  [
    'THE DESIGN PHILOSOPHY',
    'DESIGN WITH',
    'PURPOSE.',
    'Great design makes complex things feel effortless.',
  ],
  ['THE TRANSFORMATION', 'BREAK THE', 'EXPECTED.', 'A different perspective changes everything.'],
];
export function FilmChapters() {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const heldFrame = useRef<HTMLCanvasElement>(null);
  const controller = useRef<CinematicController | null>(null);
  const galleryStep = useRef(0);
  const galleryBusy = useRef(false);
  const pendingGalleryStep = useRef<1 | -1 | 0>(0);
  const [snapshot, setSnapshot] = useState(initial);
  const [project, setProject] = useState(0);
  const [released, setReleased] = useState(false);
  const gallery = snapshot.phase === 'gallery';
  const welcome = snapshot.chapter === 0 && snapshot.phase === 'idle';
  const content = welcome ? introduction : chapters[Math.min(snapshot.chapter, 2)];

  useEffect(() => {
    const node = root.current,
      media = video.current;
    const canvas = heldFrame.current;
    if (!node || !media || !canvas) return;
    let disposed = false;
    let isReleased = false;
    const wheelIntent = new WheelIntent();
    let touchY = 0,
      touchX = 0;
    let resetFrame = 0;
    let previousPhase = 'idle';
    const player = new CinematicController(
      media,
      (state) => {
        if (disposed) return;
        // A fresh gesture is needed after completion, including trackpad momentum.
        if (state.phase === 'completed' && previousPhase !== 'completed')
          wheelIntent.blockMomentum(performance.now());
        previousPhase = state.phase;
        setSnapshot(state);
        node.dataset.phase = state.phase;
        node.dataset.chapter = String(state.chapter);
      },
      undefined,
      new FrameHandoff(media, canvas),
    );
    controller.current = player;
    const pageContent = document.querySelector<HTMLElement>('[data-portfolio-content]');
    const footer = document.querySelector<HTMLElement>('footer');
    const gateContent = (gated: boolean) => {
      if (pageContent) pageContent.inert = gated;
      if (footer) footer.inert = gated;
    };
    gateContent(true);
    function release() {
      if (isReleased) return;
      isReleased = true;
      galleryBusy.current = false;
      pendingGalleryStep.current = 0;
      gateContent(false);
      setReleased(true);
      player.release();
      node!.dataset.released = 'true';
    }
    function destination(id: string) {
      release();
      requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView({ behavior: 'instant' }),
      );
    }
    function step(direction: 1 | -1) {
      if (document.querySelector('.firn-menu-toggle[aria-expanded="true"]')) return;
      if (isReleased) {
        if (scrollY > 2 || direction > 0) return;
        isReleased = false;
        setReleased(false);
        gateContent(true);
        galleryStep.current = 3;
        setProject(3);
        galleryBusy.current = false;
        pendingGalleryStep.current = 0;
        player.returnToGallery();
        node!.dataset.released = 'false';
        return;
      }
      if (player.state.phase === 'gallery') {
        if (galleryBusy.current) {
          pendingGalleryStep.current = direction;
          return;
        }
        if (direction < 0 && galleryStep.current === 0) {
          player.reverseFromGallery();
          return;
        }
        if (direction > 0 && galleryStep.current === 3) {
          destination('work');
          return;
        }
        galleryStep.current += direction;
        setProject(galleryStep.current);
        galleryBusy.current = true;
        return;
      }
      player.gesture(direction);
    }
    function wheel(event: WheelEvent) {
      if ((event.target as Element).closest('.firn-header')) return;
      if (isReleased && (scrollY > 2 || event.deltaY > 0)) return;
      if (event.ctrlKey || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
      if (event.cancelable) event.preventDefault();
      const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      const direction = wheelIntent.read(pixels, performance.now(), player.state.phase === 'gallery');
      if (direction) step(direction);
    }
    function touchStart(event: TouchEvent) {
      touchY = event.touches[0]?.clientY ?? 0;
      touchX = event.touches[0]?.clientX ?? 0;
    }
    function touchEnd(event: TouchEvent) {
      const target = event.target as Element;
      if (
        target.closest('button,nav') ||
        (target.closest('a') && !target.closest('.glass-project'))
      )
        return;
      const y = touchY - (event.changedTouches[0]?.clientY ?? touchY);
      const x = touchX - (event.changedTouches[0]?.clientX ?? touchX);
      if (Math.abs(y) > 40 && Math.abs(y) > Math.abs(x) * 1.2) {
        // A swipe starting on a glass link must not synthesize a click after
        // React removes that card for reverse playback. Ordinary taps stay native.
        if (!isReleased && event.cancelable) event.preventDefault();
        step(y > 0 ? 1 : -1);
      }
    }
    function key(event: KeyboardEvent) {
      if (
        isReleased ||
        event.altKey ||
        event.metaKey ||
        event.ctrlKey ||
        (event.target as Element).closest('button,a,input,textarea,select')
      )
        return;
      if (['Home', 'End'].includes(event.key)) event.preventDefault();
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' '].includes(event.key)) {
        event.preventDefault();
        step(['ArrowUp', 'PageUp'].includes(event.key) ? -1 : 1);
      }
    }
    function navigation(event: MouseEvent) {
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
      if (!link) return;
      const url = new URL(link.href, location.href);
      if (
        url.origin === location.origin &&
        url.pathname === '/' &&
        !url.hash &&
        link.closest('footer')
      ) {
        event.preventDefault();
        restart();
        return;
      }
      if (
        url.origin === location.origin &&
        url.pathname === '/' &&
        ['#work', '#about', '#skills', '#contact'].includes(url.hash)
      )
        destination(url.hash.slice(1));
    }
    function restart() {
      player.reset();
      galleryStep.current = 0;
      galleryBusy.current = false;
      pendingGalleryStep.current = 0;
      setProject(0);
      isReleased = false;
      setReleased(false);
      gateContent(true);
      node!.dataset.released = 'false';
      history.replaceState(history.state, '', location.pathname);
      scrollTo({ top: 0, behavior: 'instant' });
      resetFrame = requestAnimationFrame(() => scrollTo({ top: 0, behavior: 'instant' }));
    }
    function visibility() {
      if (document.hidden) player.suspend();
      else player.resume();
    }
    function pageshow() {
      if (!isReleased) {
        scrollTo({ top: 0, behavior: 'instant' });
        player.resume();
      }
    }
    const onStep = (event: Event) => step((event as CustomEvent<1 | -1>).detail);
    window.addEventListener('wheel', wheel, { passive: false });
    node.addEventListener('touchstart', touchStart, { passive: true });
    node.addEventListener('touchend', touchEnd, { passive: false });
    document.addEventListener('keydown', key);
    document.addEventListener('click', navigation, true);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('portfolio:restart-intro', restart);
    window.addEventListener('portfolio:step', onStep);
    window.addEventListener('pageshow', pageshow);
    if (location.hash && location.hash !== '#intro') destination(location.hash.slice(1));
    else scrollTo({ top: 0, behavior: 'instant' });
    return () => {
      disposed = true;
      cancelAnimationFrame(resetFrame);
      player.destroy();
      controller.current = null;
      gateContent(false);
      window.removeEventListener('wheel', wheel);
      node.removeEventListener('touchstart', touchStart);
      node.removeEventListener('touchend', touchEnd);
      document.removeEventListener('keydown', key);
      document.removeEventListener('click', navigation, true);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pageshow', pageshow);
      window.removeEventListener('portfolio:restart-intro', restart);
      window.removeEventListener('portfolio:step', onStep);
    };
  }, []);
  const send = (direction: 1 | -1) =>
    window.dispatchEvent(new CustomEvent('portfolio:step', { detail: direction }));
  return (
    <section
      ref={root}
      id="intro"
      className="film-journey"
      data-phase="idle"
      data-chapter="0"
      data-released={released}
      style={{ touchAction: released ? 'auto' : 'pan-x pinch-zoom' }}
      aria-label="Cinematic introduction"
    >
      <div className="film-stage">
        <Image
          className="film-surface film-poster"
          src="/films/01-goggles-on-poster.jpg"
          alt=""
          fill
          sizes="100vw"
          priority
          unoptimized
          aria-hidden="true"
        />
        <video
          ref={video}
          className="film-surface film-video"
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
        <canvas ref={heldFrame} className="film-surface film-hold" aria-hidden="true" />
        <div className="film-shade" aria-hidden="true" />
        <div className="film-coordinate" aria-hidden="true">
          <span>A DIFFERENT PERSPECTIVE</span>
          <span>CREATIVE DEVELOPMENT / AI</span>
        </div>
        {!gallery && (
          <div
            key={`${welcome ? 'welcome' : snapshot.chapter}-${snapshot.direction}`}
            className="film-sentence"
          >
            <span className="section-label film-micro">{content[0]}</span>
            <h1>
              <span>{content[1]}</span>
              <em>{content[2]}</em>
            </h1>
            <p>{content[3]}</p>
            <span className="film-cue" role="status">
              {snapshot.phase === 'stalled'
                ? 'FILM PAUSED · SWIPE TO RESUME ↓'
                : snapshot.phase === 'loading'
                  ? 'LOADING THE NEXT FRAME'
                  : snapshot.phase === 'playing'
                    ? 'THE STORY IS UNFOLDING'
                    : 'SCROLL TO CONTINUE ↓'}
            </span>
          </div>
        )}
        {gallery && (
          <div className="film-gallery">
            <SpiralGallery
              selected={project}
              onSettled={() => {
                galleryBusy.current = false;
                const direction = pendingGalleryStep.current;
                pendingGalleryStep.current = 0;
                if (direction) send(direction);
              }}
            />
            <div className="gallery-controls">
              <button onClick={() => send(-1)} aria-label="Previous project">
                ←
              </button>
              <span>
                0{project + 1} <i>/ 04</i>
              </span>
              <button onClick={() => send(1)} aria-label="Next project">
                →
              </button>
            </div>
          </div>
        )}
        <div className="film-bottom">
          <Link prefetch={false} href="/#work" className="film-skip">
            SKIP INTRO <Arrow diagonal />
          </Link>
          <div
            className="film-chapter-dots"
            aria-label={`Chapter ${Math.min(snapshot.chapter + 1, 4)} of 4`}
          >
            {['INTRODUCTION', 'PHILOSOPHY', 'TRANSFORMATION', 'SELECTED WORK'].map((label, i) => (
              <span key={label} className={snapshot.chapter === i ? 'is-active' : ''}>
                <b>0{i + 1}</b>
                <small>{label}</small>
              </span>
            ))}
          </div>
        </div>
        <div
          className="film-progress"
          style={{ transform: `scaleX(${snapshot.progress})` }}
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
