import Link from 'next/link';
import { Arrow } from './icons';
import { SiteHeader } from './site-header';
import { person, cv } from '@/lib/content';
export function Header() { return <SiteHeader />; }
export function Footer() {
  return (
    <footer className="footer wrap">
      <Link prefetch={false} className="footer-name" href="/">
        Ahmad Abulhawa<span className="brand-dot">.</span>
      </Link>
      <span>Built with care. Designed to move.</span>
      <a href="#top">Back to top ↑</a>
      <small>© {new Date().getUTCFullYear()} Ahmad Mohammad Abulhawa</small>
    </footer>
  );
}
export function Contact() {
  return (
    <section className="contact wrap section" id="contact" aria-labelledby="contact-title">
      <div className="section-label">
        <span className="status-dot" /> HAVE SOMETHING IN MIND?
      </div>
      <div className="contact-heading">
        <h2 id="contact-title">
          Let’s make
          <br />
          something <em>matter.</em>
        </h2>
        <a className="contact-orb" href={`mailto:${person.email}`} aria-label="Email Ahmad">
          <Arrow diagonal />
        </a>
      </div>
      <div className="contact-bottom">
        <a className="email-link" href={`mailto:${person.email}`}>
          {person.email}
          <Arrow diagonal />
        </a>
        <div className="social-links">
          <a href={person.github} target="_blank" rel="noopener noreferrer">
            GitHub <Arrow diagonal />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a href={person.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn <Arrow diagonal />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          {cv && (
            <a href={cv} download>
              Download CV ↓
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
