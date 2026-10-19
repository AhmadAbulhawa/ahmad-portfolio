'use client';
import { useEffect } from 'react';

export function Motion() {
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void import('gsap').then(({ gsap }) => {
      if (disposed) return;
      const context = gsap.context(() => {
        gsap.fromTo(
          '[data-hero-line]',
          { y: 28, opacity: 0.35 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            stagger: 0.1,
            ease: 'power3.out',
            clearProps: 'all',
          },
        );
      });
      // Content is never hidden while waiting for JS or an intersection.
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            gsap.fromTo(
              entry.target,
              { y: 24 },
              {
                y: 0,
                duration: 0.8,
                ease: 'power3.out',
                clearProps: 'transform',
              },
            );
            observer.unobserve(entry.target);
          }
        },
        { threshold: 0.12 },
      );
      document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
      const stop = () => {
        context.revert();
        observer.disconnect();
        gsap.killTweensOf('[data-reveal]');
      };
      cleanup = stop;
      preference.addEventListener('change', stop, { once: true });
      cleanup = () => {
        stop();
        preference.removeEventListener('change', stop);
      };
    });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);
  return null;
}
