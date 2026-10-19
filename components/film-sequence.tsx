'use client';
import { useEffect, useRef, useState, useId } from 'react';
import { Poster } from './poster';
import type { FilmClip } from '@/lib/films';
import { Arrow, Play } from './icons';

export function FilmSequence({ clips }: { clips: FilmClip[] }) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const chapters = useRef<(HTMLElement | null)[]>([]);
  const region = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const id = useId();
  const clip = clips[active];
  useEffect(() => {
    // Read the viewport center with pixel coordinates. Percentage root margins
    // depend on viewport width and can select stale scenes on wide displays.
    let frame = 0;
    function updateScene() {
      frame = 0;
      const center = window.innerHeight / 2;
      let index = 0;
      chapters.current.forEach((chapter, current) => {
        if (chapter && chapter.getBoundingClientRect().top <= center) index = current;
      });
      if (index !== activeRef.current) {
        activeRef.current = index;
        setActive(index);
        setPlaying(false);
        setFailed(false);
      }
    }
    function scheduleScene() {
      if (!frame) frame = requestAnimationFrame(updateScene);
    }
    window.addEventListener('scroll', scheduleScene, { passive: true });
    window.addEventListener('resize', scheduleScene);
    updateScene();
    const visibility = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) setPlaying(false);
      },
      { threshold: 0 },
    );
    if (region.current) visibility.observe(region.current);
    function pauseWhenHidden() {
      if (document.hidden) setPlaying(false);
    }
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => {
      window.removeEventListener('scroll', scheduleScene);
      window.removeEventListener('resize', scheduleScene);
      cancelAnimationFrame(frame);
      visibility.disconnect();
      document.removeEventListener('visibilitychange', pauseWhenHidden);
    };
  }, []);
  function select(index: number) {
    activeRef.current = index;
    setActive(index);
    setPlaying(false);
    setFailed(false);
    chapters.current[index]?.scrollIntoView({
      block: 'center',
      behavior: 'instant',
    });
  }
  return (
    <div
      ref={region}
      className={`film-sequence ${clips[0].width > clips[0].height ? 'sequence-landscape' : ''}`}
    >
      <div className="sequence-sticky">
        <div className="sequence-counter">
          <span>SELECTED MOMENTS</span>
          <span>
            0{active + 1} / 0{clips.length}
          </span>
        </div>
        <div
          className="sequence-screen"
          style={{ aspectRatio: `${clip.width}/${clip.height}` }}
          key={clip.src}
        >
          {playing ? (
            <video
              src={clip.src}
              poster={clip.poster}
              width={clip.width}
              height={clip.height}
              autoPlay
              controls
              muted
              playsInline
              preload="none"
              aria-label={clip.label}
              aria-describedby={`${id}-description`}
              onError={() => setFailed(true)}
            />
          ) : (
            <button
              className="sequence-play"
              onClick={() => setPlaying(true)}
              aria-label={`Play scene — ${clip.label}`}
            >
              <Poster
                src={clip.poster}
                width={clip.width}
                height={clip.height}
                alt={`Still from ${clip.label}`}
                sizes={
                  clip.width > clip.height
                    ? '(max-width: 760px) calc(100vw - 40px), 800px'
                    : '(max-width: 560px) 50vw, 340px'
                }
              />
              <span className="play-badge">
                <Play />
                <span>Play scene</span>
              </span>
            </button>
          )}
        </div>
        {failed && (
          <p role="alert" className="media-note">
            Could not play this scene.{' '}
            <a href={clip.src} download>
              Download clip
            </a>
            .
          </p>
        )}
        <div className="sequence-controls">
          <button
            onClick={() => select(Math.max(0, active - 1))}
            disabled={active === 0}
            aria-label="Previous scene"
          >
            ←
          </button>
          <span>
            {clip.duration} · ORIGINAL {clip.width > clip.height ? 'WIDESCREEN' : 'PORTRAIT'}
          </span>
          <button
            onClick={() => select(Math.min(clips.length - 1, active + 1))}
            disabled={active === clips.length - 1}
            aria-label="Next scene"
          >
            <Arrow />
          </button>
        </div>
        <p className="sr-only" aria-live="polite" id={`${id}-description`}>
          {clip.description}
        </p>
      </div>
      <div className="sequence-chapters">
        {clips.map((item, index) => (
          <section
            ref={(el) => {
              chapters.current[index] = el;
            }}
            data-scene={index}
            key={item.src}
            className={`sequence-chapter ${active === index ? 'is-active' : ''}`}
            aria-labelledby={`${id}-chapter-${index}`}
          >
            <span className="section-label">SCENE 0{index + 1}</span>
            <h2 id={`${id}-chapter-${index}`}>{item.title}</h2>
            <p>{item.note}</p>
            <span className="sequence-hint">
              {index === clips.length - 1
                ? 'THE STORY CONTINUES BELOW ↓'
                : 'SCROLL TO THE NEXT MOMENT ↓'}
            </span>
          </section>
        ))}
      </div>
    </div>
  );
}
