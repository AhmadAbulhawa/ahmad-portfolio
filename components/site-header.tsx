'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const items = [
  { href: '/#work', label: 'Work', no: '01' },
  { href: '/#about', label: 'About', no: '02' },
  { href: '/#contact', label: 'Contact', no: '03' },
];

export function SiteHeader({ cv }: { cv?: string }) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow =
        document.querySelector('.film-journey') && document.documentElement.dataset.filmReleased !== 'true'
          ? 'hidden' : previous;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);
  const close = () => setOpen(false);

  const returnToIntro = (event: React.MouseEvent<HTMLAnchorElement>) => {
    close();
    // Next's same-route Link is a no-op: explicitly reset the video player,
    // the scroll lock, and every gallery state without reloading large MP4s.
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
      event.preventDefault();
      history.replaceState(history.state, '', window.location.pathname + window.location.search);
      window.dispatchEvent(new Event('portfolio:restart-intro'));
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  };

  return (
    <header className="firn-header" aria-label="Site header">
      <div className="firn-header-inner">
        <Link href="/" className="firn-brand" aria-label="Ahmad Abulhawa home" onClick={returnToIntro}>AHMAD<span className="firn-brand-dot">.</span></Link>
        <nav className="firn-desktop-nav" aria-label="Primary">
          {items.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <div className="firn-header-actions">
          {cv && <a className="firn-resume" href={cv} download>RESUME ↗</a>}
          <button type="button" ref={toggleRef} className="firn-menu-toggle"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            aria-expanded={open}
            aria-controls="firn-mobile-panel"
            onClick={() => setOpen((old) => !old)}>
            <span>{open ? 'CLOSE' : 'MENU'}</span>
            <span className={'firn-menu-lines' + (open ? ' is-open' : '')}><i /><i /></span>
          </button>
        </div>
      </div>
      <nav className={'firn-mobile-panel' + (open ? ' is-open' : '')}
        aria-label="Mobile navigation"
        id="firn-mobile-panel"
        inert={!open}>
        <p className="firn-menu-caption">NAVIGATION / AHMAD ABULHAWA</p>
        {items.map((item) => <Link key={item.href} href={item.href} onClick={close}><span>{item.no}</span>{item.label}<b aria-hidden="true">↗</b></Link>)}
        {cv && <a href={cv} download onClick={close} className="firn-menu-cv">DOWNLOAD RESUME <span aria-hidden="true">↗</span></a>}
        <p className="firn-menu-caption firn-menu-foot">CREATIVE DEVELOPMENT / AI ENGINEERING</p>
      </nav>
    </header>
  );
}
