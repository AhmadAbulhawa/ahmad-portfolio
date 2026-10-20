'use client';

import { useEffect } from 'react';

// Scroll scrubbing without scroll hijacking: the image moves while the scroll
// position stays native. No WebGL or expensive frame decoding required.
export function FirnlightMotion() {
  useEffect(() => {
    const section = document.querySelector<HTMLElement>('.firn-journey');
    if (!section) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const update = () => {
      frame = 0;
      const height = Math.max(1, section.offsetHeight - window.innerHeight);
      const position = section.getBoundingClientRect();
      const progress = reducedMotion.matches ? 0 : Math.max(0, Math.min(1, -position.top / height));
      section.style.setProperty('--firn-progress', progress.toFixed(4));
      // Motion phases: editorial portrait -> dissolve to black -> work reveal.
      const reveal = Math.max(0, Math.min(1, (progress - .42) / .38));
      section.style.setProperty('--firn-reveal', reveal.toFixed(4));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    reducedMotion.addEventListener('change', schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      reducedMotion.removeEventListener('change', schedule);
    };
  }, []);
  return null;
}
