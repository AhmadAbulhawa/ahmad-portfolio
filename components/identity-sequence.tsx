'use client';

import { useEffect, useRef } from 'react';

/**
 * A second cinematic language for the About section.
 *
 * Unlike the film introduction, this chapter is entirely code-drawn. The
 * browser's natural scroll drives three editorial acts; reversing the scroll
 * reverses the story, with no gesture trapping, skipped frames or new media.
 */
export function IdentitySequence() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;

    const measure = () => {
      frame = 0;
      const rectangle = root.getBoundingClientRect();
      const travel = Math.max(1, rectangle.height - window.innerHeight);
      const progress = Math.max(0, Math.min(1, -rectangle.top / travel));
      const act = progress < 1 / 3 ? 0 : progress < 2 / 3 ? 1 : 2;

      root.dataset.act = String(act);
      root.style.setProperty('--identity-turn', `${(-32 + progress * 278).toFixed(2)}deg`);
      root.style.setProperty('--identity-counterturn', `${(24 - progress * 192).toFixed(2)}deg`);
      root.style.setProperty('--identity-shift', `${((progress - 0.5) * 65).toFixed(2)}px`);
      root.style.setProperty('--identity-scale', (0.86 + progress * 0.27).toFixed(3));
      root.style.setProperty('--identity-rail', (progress * 100).toFixed(2) + '%');
    };
    const requestMeasure = () => {
      if (!frame && !reduceMotion.matches) frame = requestAnimationFrame(measure);
    };
    const onPreference = () => {
      if (reduceMotion.matches) {
        cancelAnimationFrame(frame);
        frame = 0;
        root.dataset.act = '2';
        root.style.removeProperty('--identity-turn');
        root.style.removeProperty('--identity-counterturn');
        root.style.removeProperty('--identity-shift');
        root.style.removeProperty('--identity-scale');
      } else requestMeasure();
    };

    onPreference();
    window.addEventListener('scroll', requestMeasure, { passive: true });
    window.addEventListener('resize', requestMeasure);
    reduceMotion.addEventListener('change', onPreference);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestMeasure);
      window.removeEventListener('resize', requestMeasure);
      reduceMotion.removeEventListener('change', onPreference);
    };
  }, []);

  return (
    <div ref={rootRef} className="identity-scroll" data-act="0" aria-label="A cinematic introduction to the person behind the work">
      <div className="identity-sticky">
        <div className="identity-atmosphere" aria-hidden="true" />
        <div className="identity-grid" aria-hidden="true" />
        <div className="identity-coordinate identity-coordinate--top" aria-hidden="true">
          <span>THE PERSON BEHIND THE PIXELS</span>
          <span>IDENTITY / 2026</span>
        </div>

        <div className="identity-machine" aria-hidden="true">
          <div className="identity-machine-aura" />
          <div className="identity-ring identity-ring--outer" />
          <div className="identity-ring identity-ring--middle" />
          <div className="identity-ring identity-ring--inner" />
          <div className="identity-crosshair identity-crosshair--horizontal" />
          <div className="identity-crosshair identity-crosshair--vertical" />
          <div className="identity-monogram">
            <span>A<span className="identity-monogram-divider">/</span>A</span>
            <small>THE MIND BEHIND THE MOTION</small>
          </div>
          <span className="identity-satellite identity-satellite--one">01 / DESIGN</span>
          <span className="identity-satellite identity-satellite--two">02 / CODE</span>
          <span className="identity-satellite identity-satellite--three">03 / INTELLIGENCE</span>
        </div>

        <div className="identity-scene identity-scene--first">
          <p className="identity-eyebrow">01 — LOOK BEYOND THE FRAME</p>
          <h3>MORE THAN<br /><em>A SCREEN.</em></h3>
          <p className="identity-subcopy">Every experience begins with a point of view.</p>
        </div>
        <div className="identity-scene identity-scene--second">
          <p className="identity-eyebrow">02 — HOW I THINK</p>
          <h3>LOGIC MEETS<br /><em>IMAGINATION.</em></h3>
          <p className="identity-subcopy">Creative thinking. Precise engineering. Purposeful AI.</p>
        </div>
        <div className="identity-scene identity-scene--final">
          <p className="identity-eyebrow">03 — WHO'S BEHIND IT</p>
          <h3>AHMAD<br /><em>ABULHAWA.</em></h3>
          <p className="identity-subcopy">The person behind the pixels. The thinking behind the work.</p>
        </div>

        <div className="identity-coordinate identity-coordinate--bottom" aria-hidden="true">
          <span className="identity-scroll-hint">SCROLL TO UNFOLD <span>↓</span></span>
          <div className="identity-act-counter"><span className="identity-act-number">01</span><span className="identity-act-divider">/</span><span>03</span></div>
          <div className="identity-track"><span /></div>
          <span className="identity-end-label">DESIGN × ENGINEERING × AI</span>
        </div>
      </div>
    </div>
  );
}
