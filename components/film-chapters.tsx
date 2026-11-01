import Image from 'next/image';
import Link from 'next/link';
import { Arrow } from './icons';

/**
 * A lightweight, server-rendered cinematic introduction.
 * Native wheel, touch, keyboard and anchor scrolling are never intercepted.
 * Film clips remain available on the project pages, only on user request.
 */
export function FilmChapters() {
  return (
    <section
      id="intro"
      className="film-journey"
      data-mode="native"
      aria-labelledby="intro-title"
    >
      <div className="film-stage">
        <div className="film-plane" aria-hidden="true">
          <Image
            className="film-surface film-poster"
            src="/films/01-goggles-on-poster.jpg"
            alt=""
            fill
            sizes="100vw"
            priority
          />
        </div>
        <div className="film-shade" aria-hidden="true" />
        <div className="film-coordinate" aria-hidden="true">
          <span>A DIFFERENT PERSPECTIVE</span>
          <span>CREATIVE DEVELOPMENT / AI</span>
        </div>
        <div className="film-sentence" data-writing="static">
          <span className="section-label film-micro">
            FULL-STACK DEVELOPER · AI ENGINEER
          </span>
          <h1 id="intro-title">
            <span><span className="film-word">AHMAD</span></span>
            <em><span className="film-word">ABULHAWA.</span></em>
          </h1>
          <p>Thoughtful code. Unforgettable experiences.</p>
          <span className="film-cue">SCROLL TO EXPLORE ↓</span>
        </div>
        <div className="film-bottom">
          <Link href="#work" className="film-skip">
            EXPLORE MY WORK <Arrow diagonal />
          </Link>
          <span className="film-native-scroll">NATIVE SCROLL · NO WAITING</span>
        </div>
        <div className="film-progress" aria-hidden="true" />
      </div>
    </section>
  );
}
