import Link from 'next/link';
import { Arrow } from './icons';
import { SiteHeader } from './site-header';
import { person, cv } from '@/lib/content';
export function Header() {
  return <SiteHeader cv={cv} />;
}
export function Footer() {
  return (
    <footer className="footer wrap">
      <div>
        <Link className="footer-name" href="/">
          AHMAD<span>.</span>
        </Link>
        <span>FULL-STACK DEVELOPMENT / AI ENGINEERING</span>
      </div>
      <div>
        <small>© {new Date().getUTCFullYear()} Ahmad Abulhawa</small>
        <a href="#top">Back to top ↑</a>
      </div>
    </footer>
  );
}
export function Contact() {
  return (
    <section className="contact section" id="contact" aria-labelledby="contact-title">
      <div className="contact-halo" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="wrap">
        <div className="section-top">
          <span className="section-label">04 / THE NEXT CHAPTER</span>
          <span className="section-label">STARTS WITH A CONVERSATION</span>
        </div>
        <div className="contact-heading">
          <h2 id="contact-title">
            Let’s build
            <br />
            something
            <br />
            <em>unexpected.</em>
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
            </a>
            <a href={person.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn <Arrow diagonal />
            </a>
            {cv && (
              <a href={cv} download>
                Download CV ↓
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
