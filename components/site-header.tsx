'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Arrow } from './icons';

const items = [
  { href: '/#work', label: 'Work', no: '01' },
  { href: '/#about', label: 'About', no: '02' },
  { href: '/#skills', label: 'Toolkit', no: '03' },
  { href: '/#contact', label: 'Contact', no: '04' },
];

export function SiteHeader({ cv }: { cv?: string }) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (event.key === 'Tab') {
        const links = Array.from(
          document.querySelectorAll<HTMLElement>('.firn-header a, .firn-menu-toggle'),
        ).filter((el) => el.getClientRects().length > 0);
        const first = links[0],
          last = links[links.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);
  const close = () => setOpen(false);


  return (
    <header className="firn-header" aria-label="Site header">
      <div className="firn-header-inner">
        <Link
          href="/#top"
          className="firn-brand"
          aria-label="Ahmad Abulhawa home"
        >
          AHMAD<span className="firn-brand-dot">.</span>
        </Link>
        <nav className="firn-desktop-nav" aria-label="Primary">
          {items.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="firn-header-actions">
          {cv && (
            <a className="firn-resume" href={cv} download>
              RESUME <Arrow diagonal />
            </a>
          )}
          <button
            type="button"
            ref={toggleRef}
            className="firn-menu-toggle"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            aria-expanded={open}
            aria-controls="firn-mobile-panel"
            onClick={() => setOpen((old) => !old)}
          >
            <span>{open ? 'CLOSE' : 'MENU'}</span>
            <span className={'firn-menu-lines' + (open ? ' is-open' : '')}>
              <i />
              <i />
            </span>
          </button>
        </div>
      </div>
      <nav
        className={'firn-mobile-panel' + (open ? ' is-open' : '')}
        aria-label="Mobile navigation"
        id="firn-mobile-panel"
        inert={!open}
      >
        <p className="firn-menu-caption">NAVIGATION / AHMAD ABULHAWA</p>
        {items.map((item) => (
          <Link key={item.href} href={item.href} onClick={close}>
            <span>{item.no}</span>
            {item.label}
            <b aria-hidden="true">
              <Arrow diagonal />
            </b>
          </Link>
        ))}
        {cv && (
          <a href={cv} download onClick={close} className="firn-menu-cv">
            DOWNLOAD RESUME <Arrow diagonal />
          </a>
        )}
        <p className="firn-menu-caption firn-menu-foot">CREATIVE DEVELOPMENT / AI ENGINEERING</p>
      </nav>
    </header>
  );
}
