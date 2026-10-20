'use client';
import { useEffect } from 'react';

// Multi-chapter scroll scrubbing. Native browser scrolling remains in charge.
// All CSS transforms read a handful of normalized, smoothed custom properties.
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const phase = (p: number, start: number, end: number) => clamp((p - start) / (end - start));
const ease = (v: number) => v * v * (3 - 2 * v);
export function FirnlightMotion() {
  useEffect(() => {
    const journey = document.querySelector<HTMLElement>('.firn-journey');
    if (!journey) return;
    const projects = Array.from(document.querySelectorAll<HTMLElement>('[data-motion-project]'));
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0, target = 0, current = 0, visible = true, moving = false;
    const updatePosition = () => {
      const rect = journey.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      target = clamp(-rect.top / travel);
      moving = true;
      if (!frame) frame = requestAnimationFrame(render);
    };
    const render = () => {
      frame = 0;
      if (!visible || document.hidden) return;
      const reduced = preference.matches;
      current = reduced ? 0 : current + (target - current) * .22;
      if (Math.abs(target - current) < .0008) current = target;
      const p = current;
      const css = journey.style;
      css.setProperty('--firn-progress', p.toFixed(4));
      css.setProperty('--fx-portrait-exit', ease(phase(p,.12,.39)).toFixed(4));
      css.setProperty('--fx-camera', ease(phase(p,.02,.34)).toFixed(4));
      css.setProperty('--fx-dark', ease(phase(p,.23,.46)).toFixed(4));
      css.setProperty('--fx-screen', ease(phase(p,.39,.57)).toFixed(4));
      css.setProperty('--fx-spin', ease(phase(p,.51,.80)).toFixed(4));
      css.setProperty('--fx-exit', ease(phase(p,.82,1)).toFixed(4));
      css.setProperty('--fx-caption', ease(phase(p,.66,.84)).toFixed(4));
      css.setProperty('--fx-intro-text', (1 - ease(phase(p,.04,.25))).toFixed(4));
      css.setProperty('--fx-reveal', ease(phase(p,.29,.47)) * (1-ease(phase(p,.48,.61)))+'');
      if (!reduced && (Math.abs(target-current)>.0008 || moving)) {
        moving = false;
        frame = requestAnimationFrame(render);
      }
    };
    const watcher = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (visible) updatePosition();
      else if (frame) { cancelAnimationFrame(frame); frame=0; }
    },{rootMargin:'120px'});
    watcher.observe(journey);
    const projectObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) el.classList.add('firn-seen');
      });
    }, {rootMargin: '0px 0px -12% 0px',threshold:.12});
    projects.forEach(el=>projectObserver.observe(el));
    const scroll = () => { if (visible) updatePosition(); };
    const preferenceChanged = () => updatePosition();
    window.addEventListener('scroll',scroll,{passive:true});
    window.addEventListener('resize',updatePosition);
    preference.addEventListener('change',preferenceChanged);
    const onVisibility = () => { if (!document.hidden) updatePosition(); };
    document.addEventListener('visibilitychange',onVisibility);
    updatePosition();
    return () => {
      cancelAnimationFrame(frame);watcher.disconnect();projectObserver.disconnect();
      window.removeEventListener('scroll',scroll);
      window.removeEventListener('resize',updatePosition);
      preference.removeEventListener('change',preferenceChanged);
      document.removeEventListener('visibilitychange',onVisibility);
    };
  },[]);
  return null;
}
