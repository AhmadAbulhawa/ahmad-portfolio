'use client';
import { Poster } from './poster';
import { useId, useRef, useState, useEffect } from 'react';
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
export function VideoPlayer({
  src,
  poster,
  width,
  height,
  label,
  description,
  priority = false,
  badge,
  duration,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const id = useId();
  const portrait = height > width;
  const actionLabel =
    badge ??
    (portrait ? 'Play scene' : src.includes('aqar') ? 'Play visualization' : 'Play experience');
  useEffect(() => {
    if (!open) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = old;
    };
  }, [open]);
  function close() {
    video.current?.pause();
    dialog.current?.close();
    setOpen(false);
    trigger.current?.focus();
  }
  function play() {
    setError(false);
    setOpen(true);
    dialog.current?.showModal();
  }
  return (
    <div className={`media ${portrait ? 'media-portrait' : 'media-landscape'}`}>
      <button
        ref={trigger}
        className="media-trigger"
        onClick={play}
        aria-label={`${actionLabel} — ${label}`}
        aria-haspopup="dialog"
      >
        <Poster
          src={poster}
          alt={
            portrait
              ? 'Munjiz landing page with an illuminated tower and Arabic typography'
              : src.includes('aqar')
                ? 'Modern furnished interior from the owner-supplied transformation visualization'
                : 'Garage Tahmeen automotive experience poster'
          }
          width={width}
          height={height}
          priority={priority}
        />
        <span className="play-badge">
          <Play />
          <span>{actionLabel}</span>
        </span>
        <span className="media-corner" aria-hidden="true">
          {duration ?? (src.includes('aqar') ? '00:05.3' : 'PLAY')} ↗
        </span>
      </button>
      <dialog
        ref={dialog}
        className={`video-dialog ${portrait ? 'dialog-portrait' : ''}`}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        onCancel={close}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="dialog-content">
          <div className="dialog-heading">
            <h2 id={`${id}-title`}>{label}</h2>
            <button className="dialog-close" onClick={close} autoFocus aria-label="Close video">
              Close <span aria-hidden="true">×</span>
            </button>
          </div>
          {open && (
            <video
              ref={video}
              src={src}
              poster={poster}
              width={width}
              height={height}
              controls
              playsInline
              autoPlay
              preload="none"
              onError={() => setError(true)}
              aria-label={label}
            />
          )}
          {error && (
            <p role="alert">
              Playback is unavailable in this browser.{' '}
              <a href={src} download>
                Download the video
              </a>{' '}
              to watch it.
            </p>
          )}
          <p id={`${id}-description`}>
            {description} <span>Silent video.</span>
          </p>
        </div>
      </dialog>
    </div>
  );
}
