'use client';

import { useEffect, useRef, useState } from 'react';
import { EnergyOrb } from './threeui-energy-orb';

/**
 * First interactive prototype: one ThreeUI WebGL energy-orb scene.
 * Camera-like travel is driven by CSS variables derived from native scroll.
 * All text, CV and case study actions remain accessible as real HTML.
 */
export function HeroWorld() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (motion.matches || connection?.saveData) return;

    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl', { powerPreference: 'low-power' });
    if (!gl) return;
    const lose = gl.getExtension('WEBGL_lose_context');
    lose?.loseContext();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setCanRender(true);
        observer.disconnect();
      },
      { rootMargin: '160px' },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const hero = host?.closest('section.hero');
    if (!hero || !host) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = hero.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(rect.height * 0.85, 1)));
      host.style.setProperty('--world-progress', progress.toFixed(4));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return (
    <div className="hero-world" ref={hostRef} aria-hidden="true">
      <div className="hero-world__ambient" />
      <div className="hero-world__orbit hero-world__orbit--outer" />
      <div className="hero-world__orbit hero-world__orbit--inner" />
      <div className="hero-world__orb">
        {canRender ? (
          <EnergyOrb speed={0.48} smokeSpeed={0.55} starDensity={0.38} glow={0.92} brightness={0.95} />
        ) : (
          <div className="hero-world__still" />
        )}
      </div>
      <span className="hero-world__coordinate">AHMAD / DIGITAL EXPLORATIONS — 2026</span>
      <span className="hero-world__axis">01 — IMMERSIVE INTRO</span>
    </div>
  );
}
