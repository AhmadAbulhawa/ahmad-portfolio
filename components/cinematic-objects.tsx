import Link from 'next/link';

/**
 * Hand-authored optical prop. This is a deliberately stylized transition object,
 * not a claim that the owner's static photograph is a filmed pose sequence.
 */
export function CinematicGoggles() {
  return (
    <div className="cinema-goggles" aria-hidden="true">
      <svg viewBox="0 0 640 280" role="presentation" focusable="false">
        <defs>
          <linearGradient id="firn-lens" x1="0" x2="1" y1=".3" y2=".7">
            <stop offset="0%" stopColor="#f9b52c" />
            <stop offset="21%" stopColor="#fb743c" />
            <stop offset="47%" stopColor="#b450bd" />
            <stop offset="73%" stopColor="#745beb" />
            <stop offset="100%" stopColor="#3aa8d0" />
          </linearGradient>
          <linearGradient id="firn-reflection" x1="0" x2=".8" y1="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity=".85" />
            <stop offset="38%" stopColor="#eff8ff" stopOpacity=".2" />
            <stop offset="100%" stopColor="#0c1423" stopOpacity=".2" />
          </linearGradient>
          <linearGradient id="firn-frame" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#101827" />
            <stop offset="50%" stopColor="#354357" />
            <stop offset="100%" stopColor="#040811" />
          </linearGradient>
        </defs>
        <path d="M9 92 Q62 69 112 76 L535 75 Q585 69 631 87 L622 144 Q588 155 570 158 L555 106 Q553 97 532 96 L110 97 Q93 99 88 108 L70 153 Q42 150 16 139Z" fill="#1b2330" opacity=".72" />
        <path d="M71 45 Q108 17 182 24 Q253 9 321 28 Q404 10 478 25 Q548 21 576 51 Q604 77 587 158 Q580 206 538 226 Q453 251 362 225 Q322 211 284 228 Q168 261 99 219 Q59 195 54 149 Q38 86 71 45Z" fill="url(#firn-frame)" stroke="#0b111d" strokeWidth="16" />
        <path d="M84 56 Q112 30 190 41 Q257 29 323 47 Q402 28 474 41 Q535 38 555 64 Q570 92 563 150 Q559 186 524 205 Q444 230 369 208 Q326 188 282 207 Q178 240 115 205 Q83 184 77 145 Q69 87 84 56Z" fill="url(#firn-lens)" />
        <path d="M94 61 Q225 30 323 51 Q437 26 549 71 L537 95 Q427 51 313 81 Q198 51 109 96Z" fill="url(#firn-reflection)" opacity=".8" />
        <path d="M117 160 Q230 107 322 149 Q411 103 523 155 Q458 196 368 170 Q328 151 283 173 Q191 208 117 160Z" fill="#243552" opacity=".12" />
        <path d="M80 81 Q87 40 136 38 M555 82 Q546 39 497 39" fill="none" stroke="#fff" strokeWidth="6" opacity=".28" strokeLinecap="round" />
      </svg>
      <span className="goggles-label">FROM THE VISION / INTO THE WORK</span>
    </div>
  );
}

const links = [
  { slug:'munjiz', name:'Munjiz', descriptor:'AI PRODUCT', image:'munjiz', pos:'center', number:'01' },
  { slug:'aqar-ai', name:'AqarAI', descriptor:'SPATIAL INTELLIGENCE', image:'aqar', pos:'left', number:'02' },
  { slug:'garage-tahmeen', name:'Garage Tahmeen', descriptor:'MOTION ENGINEERING', image:'garage', pos:'right', number:'03' },
  { slug:'cismate', name:'CISmate', descriptor:'MOBILE PLANNING', image:'cismate', pos:'fourth', number:'04' },
] as const;

export function FloatingProjects() {
  return (
    <div className="firn-showcase firn-showcase--interactive" id="floating-projects" aria-label="Explore Ahmad's projects" inert>
      <div className="firn-showcase-halo" aria-hidden="true" />
      <div className="floating-gallery-head">
        <span>SELECT A PROJECT</span>
        <span>04 SELECTED EXPERIENCES</span>
      </div>
      <div className="firn-tiles" role="group" aria-label="Four project links">
        {links.map((link) => (
          <Link prefetch={false}
            key={link.slug}
            href={'/projects/' + link.slug + '/'}
            className={'firn-cinema-card firn-cinema-card--' + link.pos}
            aria-label={'Open ' + link.name + ' case study'}>
            <span className={'firn-card-image firn-card-image--' + link.image} aria-hidden="true" />
            <span className="firn-tile-meta"><span>{link.number} / {link.descriptor}</span><b aria-hidden="true">↗</b></span>
            <strong>{link.name}</strong>
          </Link>
        ))}
      </div>
      <p className="firn-showcase-title" aria-hidden="true">EXPLORE THE <em>WORK.</em></p>
      <a className="floating-view-all" href="#work">View all projects ↓</a>
    </div>
  );
}
