'use client';
import { useEffect, useRef, useState } from 'react';
import { Poster } from './poster';
import { Play } from './icons';

type Props = {
  src: string;
  poster: string;
  width: number;
  height: number;
  label: string;
  description: string;
  priority?: boolean;
  badge?: string;
  duration?: string;
};

export function VideoPlayer({ src, poster, width, height, label, description, priority = false, badge, duration }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState(false);
  const portrait = height > width;

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !started) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) videoRef.current?.pause();
    }, { threshold: 0.05 });
    observer.observe(host);
    const onHidden = () => {
      if (document.hidden) videoRef.current?.pause();
    };
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, [started]);

  function playInline() {
    setError(false);
    setStarted(true);
    // First click mounts the real video. Playback begins only on user action.
  }

  return (
    <div ref={hostRef} className={'media firn-media ' + (portrait ? 'media-portrait' : 'media-landscape')}>
      {started ? (
        <>
          <video ref={(node) => {
            videoRef.current = node;
            if (node && node.paused && !error) {
              void node.play().catch(() => { /* native controls remain available */ });
            }
          }} src={src} poster={poster} width={width} height={height} controls playsInline muted loop autoPlay
            preload="metadata" aria-label={label} onError={() => setError(true)} />
          {error && <p className="media-note" role="alert">Playback unavailable. <a href={src} download>Download this clip ↗</a></p>}
        </>
      ) : (
        <button type="button" className="media-trigger firn-inline-play" onClick={playInline} aria-label={'Play video inline: ' + label}>
          <Poster src={poster} alt={label} width={width} height={height} priority={priority} />
          <span className="play-badge"><Play /><span>{badge ?? 'PLAY FILM'}</span></span>
          <span className="media-corner">{duration ?? 'WATCH'} ↗</span>
        </button>
      )}
      <span className="sr-only">{description}</span>
    </div>
  );
}
