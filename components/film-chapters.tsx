'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { filmSources } from '@/lib/film-sources';

const projects = [
  { name: 'Munjiz', tag: 'AI / PRODUCT DESIGN', slug: 'munjiz', image: '/projects/munjiz-arrival.webp' },
  { name: 'Garage Tahmeen', tag: 'FRONTEND / MOTION', slug: 'garage-tahmeen', image: '/projects/garage-tahmeen-drive.webp' },
  { name: 'AqarAI', tag: 'SPATIAL AI', slug: 'aqar-ai', image: '/projects/aqar-poster.webp' },
  { name: 'CISmate', tag: 'MOBILE / STUDENT PLANNING', slug: 'cismate', image: '/projects/cismate-planner.webp' },
] as const;

// A whole scrolling chapter per sentence. Video playback is not scrubbed or seeked
// with scroll position; it runs once at 1.5x when its chapter becomes active.
const story = [
  { chapter: 0, eyebrow: 'INTRODUCTION / 01', line: 'AHMAD', emphasis: 'ABULHAWA.', detail: 'Full-stack developer. AI engineering. Visual experiences.' },
  { chapter: 0, eyebrow: 'THE WAY I THINK / 02', line: 'THOUGHTFUL', emphasis: 'BY DESIGN.', detail: 'Every experience starts with one bold idea.' },
  { chapter: 0, eyebrow: 'THE WAY I BUILD / 03', line: 'BUILT TO WORK.', emphasis: 'MADE TO FEEL.', detail: 'Beautiful is good. Beautiful and useful is better.' },
  { chapter: 1, eyebrow: 'THE PHILOSOPHY / 04', line: 'DESIGN IS', emphasis: 'A FEELING.', detail: 'More than pixels. More than a pretty interface.' },
  { chapter: 1, eyebrow: 'THE PHILOSOPHY / 05', line: 'BEYOND', emphasis: 'WHAT YOU SEE.', detail: 'The best solutions make complex things feel simple.' },
  { chapter: 1, eyebrow: 'THE PHILOSOPHY / 06', line: 'THE EXPERIENCE / 06', emphasis: 'IS WHAT MATTERS.', detail: 'Four real projects. Four different challenges. One obsession with detail.' },
  { chapter: 2, eyebrow: 'THE SHIFT / 07', line: 'BREAK THE', emphasis: 'EXPECTED.', detail: 'The next idea begins where the ordinary ends.' },
  { chapter: 2, eyebrow: 'THE SHIFT / 08', line: 'SHATTER', emphasis: 'THE ORDINARY.', detail: 'Watch a single vision become a thousand possibilities.' },
  { chapter: 2, eyebrow: 'THE REVEAL / 09', line: 'NOW EXPLORE', emphasis: 'THE WORK.', detail: 'Every piece leads somewhere different.' },
] as const;

const STEP_COUNT = 17;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smoother = (value: number) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};

export function FilmChapters() {
  const root = useRef<HTMLElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const cards = useRef<(HTMLAnchorElement | null)[]>([]);
  const [step, setStep] = useState(0);
  const [videoError, setVideoError] = useState<boolean[]>([false, false, false]);

  useEffect(() => {
    const section = root.current;
    if (!section) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let requestId = 0;
    let current = 0;
    let target = 0;
    let lastChapter = -1;
    let lastStep = -1;
    let isVisible = true;
    let previousGallery = false;

    const readScroll = () => {
      const bounds = section.getBoundingClientRect();
      target = clamp(-bounds.top / Math.max(1, bounds.height - window.innerHeight));
      if (!requestId) requestId = requestAnimationFrame(render);
    };

    const render = () => {
      requestId = 0;
      if (!isVisible || document.hidden) return;
      current = reduced.matches ? target : current + (target - current) * .25;
      if (Math.abs(target - current) < .0006) current = target;
      const progress = current;
      const nextStep = Math.min(STEP_COUNT - 1, Math.floor(progress * STEP_COUNT));
      const chapter = nextStep <= 2 ? 0 : nextStep <= 5 ? 1 : nextStep <= 8 ? 2 : 3;
      section.dataset.chapter = String(chapter);
      section.dataset.step = String(nextStep);

      if (nextStep !== lastStep) {
        lastStep = nextStep;
        setStep(nextStep);
      }

      // Only play the active cinematic shot, at 1.5x speed, once on chapter entry.
      // No frame-by-frame seeking with the wheel.
      if (chapter !== lastChapter) {
        lastChapter = chapter;
        videos.current.forEach((video, index) => {
          if (!video) return;
          video.pause();
          video.playbackRate = 1.5;
          if (index === chapter) {
            if (video.ended || video.currentTime > .15) {
              try { video.currentTime = 0; } catch { /* browser loading */ }
            }
            void video.play().catch(() => { /* user scroll retries on supported mobile browsers */ });
          } else if (chapter === 3 && index === 2 && video.readyState >= 1) {
            // Match the end frame of the shattered-glass clip behind the live 3D helix.
            try { video.currentTime = Math.max(0, video.duration - .08); } catch { /* browser loading */ }
          }
        });
      } else if (chapter < 3) {
        const active = videos.current[chapter];
        if (active && active.paused && !active.ended && active.readyState >= 2) {
          void active.play().catch(() => {});
        }
      }

      const gallery = chapter === 3;
      const galleryProgress = clamp((progress - 9 / STEP_COUNT) / (8 / STEP_COUNT));
      const galleryReveal = smoother(galleryProgress * 7);
      section.style.setProperty('--gallery-reveal', String(galleryReveal));
      section.style.setProperty('--film-scroll', String(progress));

      if (gallery !== previousGallery) previousGallery = gallery;
      const vw = Math.min(window.innerWidth, 1150);
      const radius = Math.min(vw * .33, 355);
      // One leisurely helical orbit, spread over EIGHT scroll screens instead
      // of racing around the whole ring in ~one screen.
      const arc = galleryProgress * Math.PI * 1.12;
      const mobile = window.innerWidth < 700;
      cards.current.forEach((card, index) => {
        if (!card) return;
        const a = index * Math.PI * .53 + arc - Math.PI * .45;
        const x = Math.sin(a) * radius;
        const z = Math.cos(a) * radius;
        const y = (index - 1.5) * (mobile ? 110 : 150) - galleryProgress * (mobile ? 180 : 240);
        const scale = .62 + ((z + radius) / (2 * radius)) * .28;
        card.style.transform =
          'translate3d(calc(-50% + ' + x.toFixed(1) + 'px),calc(-50% + ' + y.toFixed(1) +
          'px),' + z.toFixed(1) + 'px) rotateY(' + (-a * 180 / Math.PI).toFixed(1) +
          'deg) scale(' + scale.toFixed(3) + ')';
        card.style.zIndex = String(Math.round(z + radius));
        card.style.pointerEvents = gallery ? 'auto' : 'none';
        card.tabIndex = gallery ? 0 : -1;
      });

      if (Math.abs(target - current) > .0006) requestId = requestAnimationFrame(render);
    };

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) readScroll();
      else {
        cancelAnimationFrame(requestId);
        requestId = 0;
        videos.current.forEach(video => video?.pause());
      }
    }, { rootMargin: '200px' });

    observer.observe(section);
    window.addEventListener('scroll', readScroll, { passive: true });
    window.addEventListener('resize', readScroll);
    const onVisible = () => { if (!document.hidden) readScroll(); else videos.current.forEach(v => v?.pause()); };
    document.addEventListener('visibilitychange', onVisible);
    readScroll();

    return () => {
      cancelAnimationFrame(requestId);
      observer.disconnect();
      videos.current.forEach(video => video?.pause());
      window.removeEventListener('scroll', readScroll);
      window.removeEventListener('resize', readScroll);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const activeStory = story[Math.min(8, step)];
  const gallery = step >= 9;

  return (
    <section ref={root} className="film-journey" id="intro" aria-label="Ahmad's cinematic portfolio">
      <div className="film-sticky">
        <div className="film-videos" aria-hidden="true">
          {filmSources.map((clip, index) => (
            <video
              key={clip.role}
              ref={node => { videos.current[index] = node; }}
              className={'film-video film-video-' + index}
              src={clip.src}
              muted
              playsInline
              preload={index === 0 ? 'auto' : 'metadata'}
              onError={() => setVideoError(previous => previous.map((failed, k) => k === index ? true : failed))}
            />
          ))}
        </div>
        <div className="film-ambient" aria-hidden="true" />

        {!gallery && (
          <div key={step} className="film-sentence" aria-live="polite">
            <span className="film-micro">{activeStory.eyebrow}</span>
            <h1>{activeStory.line}<br /><em>{activeStory.emphasis}</em></h1>
            <p>{activeStory.detail}</p>
            <span className="film-next">KEEP SCROLLING ↓</span>
          </div>
        )}

        <div className="film-gallery" aria-hidden={!gallery}>
          <header>
            <span>SELECTED WORK / 04</span>
            <span>SCROLL SLOWLY · CHOOSE A PROJECT ↗</span>
          </header>
          <div className="film-helix" role="group" aria-label="Interactive glass project helix">
            {projects.map((project, index) => (
              <Link
                key={project.slug}
                href={'/projects/' + project.slug + '/'}
                prefetch={false}
                ref={node => { cards.current[index] = node; }}
                className="film-glass-card"
                tabIndex={-1}
                aria-label={'Explore ' + project.name + ' project'}
              >
                <div className="film-card-art" style={{ backgroundImage: 'url(' + project.image + ')' }} />
                <div className="film-card-info">
                  <span>{project.tag}</span>
                  <strong>{project.name}</strong>
                  <span>EXPLORE CASE STUDY ↗</span>
                </div>
              </Link>
            ))}
          </div>
          <span className="film-gallery-hint">THE IDEAS BEHIND THE GLASS.</span>
          <Link href="#work" className="film-explore-all">ALL PROJECTS ↘</Link>
        </div>

        {videoError.some(Boolean) && (
          <p className="film-media-warning" role="status">A cinematic clip is temporarily unavailable. You can still explore the projects below.</p>
        )}
        <div className="film-dots" aria-hidden="true">
          <span className={step < 3 ? 'active' : ''}>01</span>
          <span className={step >= 3 && step < 6 ? 'active' : ''}>02</span>
          <span className={step >= 6 && step < 9 ? 'active' : ''}>03</span>
          <span className={step >= 9 ? 'active' : ''}>04</span>
        </div>
        <a className="film-skip" href="#work">SKIP INTRO ↗</a>
      </div>
    </section>
  );
}
