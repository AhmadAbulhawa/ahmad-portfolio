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
  const radius = mobile ? Math.min(width * .46, 205) : Math.min(width * .29, 355);
  const centralAngle = Math.PI * .26;
  cards.forEach((card, index) => {
    if (!card) return;
    const angle = (index - selected) * (Math.PI * .55) + centralAngle;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    const y = (index - selected) * (mobile ? 120 : 165);
    const scale = .62 + (z + radius) / (2 * radius) * .38;
    card.style.transform =
      'translate3d(calc(-50% + ' + x.toFixed(1) + 'px),calc(-50% + ' +
      y.toFixed(1) + 'px),' + z.toFixed(1) + 'px) rotateY(' +
      (-angle * 180 / Math.PI).toFixed(1) + 'deg) scale(' + scale.toFixed(3) + ')';
    card.style.zIndex = String(Math.round(z + radius));
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
    const section = root.current;
    if (!section) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    let activeScene = -1;
    let interacted = false;
    let visible = true;

    // Playback is self-running after a chapter is reached; no video currentTime scrubbing.
    function activateClip(index: number) {
      videos.current.forEach((video, i) => {
        if (!video) return;
        video.pause();
        video.playbackRate = i === 0 ? 1 : 1.5;
        if (i === index) {
          if (video.ended || video.currentTime > .12) {
            try { video.currentTime = 0; } catch { /* metadata pending */ }
          }
          void video.play().catch(() => { /* a scroll/touch action will retry */ });
        } else if (index === 3 && i === 2 && video.readyState >= 1) {
          try { video.currentTime = Math.max(0, video.duration - .04); } catch { /* metadata pending */ }
        }
      });
    }

    const update = () => {
      raf = 0;
      if (!visible || document.hidden) return;
      const bounds = section.getBoundingClientRect();
      const travel = Math.max(1, bounds.height - window.innerHeight);
      const progress = clamp(-bounds.top / travel);
      const nextScene = Math.min(SCENE_COUNT - 1, Math.floor(progress * SCENE_COUNT));
      const chapter = Math.min(nextScene, 3);
      section.dataset.chapter = String(chapter);
      section.dataset.scene = String(nextScene);
      if (nextScene !== activeScene) {
        const old = activeScene;
        activeScene = nextScene;
        setScene(nextScene);
        // Initial landing must stay on the first still frame.
        // Only an actual downward scroll initiates the first video.
        if (chapter === 0) {
          if (interacted && progress > .006 && old !== 0) activateClip(0);
        } else if (old < 0 || Math.min(old, 3) !== chapter) {
          activateClip(chapter);
        }
        if (nextScene >= 3) placeCards(cards.current, nextScene - 3, reduced.matches);
      }
      if (chapter === 0 && interacted && progress > .006) {
        const video = videos.current[0];
        if (video && video.paused && !video.ended) {
          video.playbackRate = 1;
          void video.play().catch(() => {});
        }
      }
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    const onScroll = () => {
      if (window.scrollY > 5) interacted = true;
      schedule();
    };
    const onTouch = () => { interacted = true; schedule(); };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
      else {
        cancelAnimationFrame(raf);
        raf = 0;
        videos.current.forEach(v => v?.pause());
      }
    }, { rootMargin: '150px' });
    observer.observe(section);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('resize', schedule);
    const onVisibility = () => {
      if (document.hidden) videos.current.forEach(v => v?.pause());
      else schedule();
    };
    document.addEventListener('visibilitychange', onVisibility);
    placeCards(cards.current, 0, reduced.matches);
    // Fix intro initial state: first video paused at its poster / first frame until scroll.
    const intro = videos.current[0];
    if (intro) { intro.pause(); intro.playbackRate = 1; }
    schedule();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', onVisibility);
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
              poster={filmPosters[index]}
              preload={index === 0 ? 'auto' : 'metadata'}
              playsInline muted
              onError={() => setErrors(previous => previous.map((value, k) => index === k ? true : value))}
            />
          ))}
        </div>
        <div className="film-ambient" aria-hidden="true" />
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
