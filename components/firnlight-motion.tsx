'use client';
import { useEffect } from 'react';

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const phase = (p: number, start: number, end: number) => clamp((p - start) / (end - start));
const ease = (v: number) => v * v * (3 - 2 * v);
export function FirnlightMotion() {
  useEffect(() => {
    const journey = document.querySelector<HTMLElement>('.firn-journey');
    if (!journey) return;
    const gallery = journey.querySelector<HTMLElement>('.firn-showcase');
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sections = Array.from(document.querySelectorAll<HTMLElement>(
      '[data-motion-project], [data-motion-section], .contact, .firn-chapter, .footer'
    ));
    const activeSections = new Set<HTMLElement>();
    let frame = 0, target = 0, current = 0, visible = true;
    const getJourneyTarget = () => {
      const rect = journey.getBoundingClientRect();
      target = clamp(-rect.top / Math.max(1, rect.height - window.innerHeight));
    };
    const updateSections = () => {
      if (preference.matches) return;
      // Each section has its own scroll-controlled travel throughout the whole page.
      activeSections.forEach(section => {
        const bounds = section.getBoundingClientRect();
        const p = clamp((window.innerHeight - bounds.top) / Math.max(1, window.innerHeight + bounds.height));
        section.style.setProperty('--section-progress', p.toFixed(4));
        section.style.setProperty('--section-enter', ease(phase(p, .06, .34)).toFixed(4));
        section.style.setProperty('--section-lift', ease(phase(p, .12, .68)).toFixed(4));
      });
    };
    const render = () => {
      frame = 0;
      const reduced = preference.matches;
      if (visible && !document.hidden) {
        current = reduced ? 0 : current + (target - current) * .26;
        if (Math.abs(target - current) < .0007) current = target;
        const css = journey.style;
        const vars: Record<string,number> = {
          '--firn-progress':current,
          '--fx-portrait-exit': ease(phase(current,.16,.39)),
          '--fx-camera': ease(phase(current,.01,.31)),
          '--fx-dark': ease(phase(current,.25,.46)),
          '--fx-screen': ease(phase(current,.51,.65)),
          '--fx-spin': ease(phase(current,.58,.78)),
          '--fx-exit': ease(phase(current,.91,1)),
          '--fx-caption': ease(phase(current,.72,.86)),
          '--fx-intro-text': 1 - ease(phase(current,.02,.27)),
          '--fx-reveal': ease(phase(current,.30,.43))*(1-ease(phase(current,.45,.58))),
          '--fx-goggle-enter': ease(phase(current,.11,.22)),
          '--fx-goggle-drop': ease(phase(current,.13,.31)),
          '--fx-goggle-flight': ease(phase(current,.30,.63)),
          '--fx-goggle-spin': ease(phase(current,.43,.71)),
          '--fx-goggle-exit': ease(phase(current,.59,.75)),
        };
        for (const [name,value] of Object.entries(vars)) css.setProperty(name,value.toFixed(4));
        // While invisible, the cards cannot be tabbed to or accidentally clicked.
        const selectable = !reduced && current >= .61 && current < .965;
        if (gallery) gallery.inert = !selectable;
        journey.dataset.galleryActive = selectable ? 'true' : 'false';
      }
      updateSections();
      if (visible && !document.hidden && !reduced && Math.abs(target-current)>.0007) frame=requestAnimationFrame(render);
    };
    const schedule = () => { getJourneyTarget(); if (!frame) frame=requestAnimationFrame(render); };
    const journeyObserver = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (visible) schedule();
      else if (gallery) { gallery.inert=true;journey.dataset.galleryActive='false'; }
    },{rootMargin:'120px'});
    journeyObserver.observe(journey);
    const sectionObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        if (entry.isIntersecting) activeSections.add(element);
        else activeSections.delete(element);
      }
      if (!frame) frame=requestAnimationFrame(render);
    },{rootMargin:'15% 0px',threshold:0});
    sections.forEach(s => sectionObserver.observe(s));
    const onVisibility = () => { if (!document.hidden) schedule(); };
    window.addEventListener('scroll', schedule, {passive:true});
    window.addEventListener('resize',schedule);
    preference.addEventListener('change',schedule);
    document.addEventListener('visibilitychange',onVisibility);
    // Never hide content without JS: CSS motion only enables when the engine runs.
    document.documentElement.dataset.cinematicMotion = 'active';
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      journeyObserver.disconnect();sectionObserver.disconnect();
      window.removeEventListener('scroll',schedule);
      window.removeEventListener('resize',schedule);
      preference.removeEventListener('change',schedule);
      document.removeEventListener('visibilitychange',onVisibility);
      delete document.documentElement.dataset.cinematicMotion;
      if (gallery) gallery.inert = true;
    };
  },[]);
  return null;
}
