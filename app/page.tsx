import Link from 'next/link';
import Image from 'next/image';
import { Arrow } from '@/components/icons';
import { Motion } from '@/components/motion';
import { FirnlightMotion } from '@/components/firnlight-motion';
import { FilmChapters } from '@/components/film-chapters';
import { CinematicGoggles, FloatingProjects } from '@/components/cinematic-objects';
import { VideoPlayer } from '@/components/video-player';
import { Contact } from '@/components/shell';
import { munjizClips } from '@/lib/films';
import { person, projects, skillGroups, garageClips } from '@/lib/content';

export default function Home() {
  const [garage, munjiz, aqar] = projects;
  return (
    <>
      <Motion />
      <main id="main-content">
        <FirnlightMotion />
        <FilmChapters />
        <section className="work wrap section" data-motion-section id="work" aria-labelledby="work-title">
          <div className="section-top">
            <div className="section-label">
              <span className="tiny-cross">+</span> SELECTED WORK / 01—04
            </div>
            <span className="section-aside">Different problems. One attention to detail.</span>
          </div>
          <h2 className="section-title" id="work-title" data-reveal>
            Built to work.
            <br />
            <em>Made to feel.</em>
          </h2>
          <article className="project garage-project firn-feature" data-motion-project aria-labelledby="garage-title" data-reveal>
            {garageClips[0] ? (
              <VideoPlayer {...garageClips[0]} />
            ) : (
              <Link prefetch={false} className="garage-editorial" href="/projects/garage-tahmeen/">
                <div className="editorial-top">
                  <span>GARAGE TAHMEEN</span>
                  <span>FRONTEND STUDY / 01</span>
                </div>
                <div className="garage-words">
                  <span>SCROLL.</span>
                  <span>STORY.</span>
                  <span className="outline-word">MOTION.</span>
                </div>
                <div className="garage-editorial-bottom">
                  <span>
                    A study in cinematic
                    <br />
                    frontend engineering.
                  </span>
                  <span className="round-arrow">
                    <Arrow diagonal />
                  </span>
                </div>
              </Link>
            )}
            <div className="project-info">
              <div className="project-name">
                <span className="project-index">01</span>
                <div>
                  <p className="project-category">{garage.category}</p>
                  <h3 id="garage-title">
                    <Link prefetch={false} href="/projects/garage-tahmeen/">
                      Garage Tahmeen <Arrow diagonal />
                    </Link>
                  </h3>
                </div>
              </div>
              <div className="project-summary">
                <p>{garage.intro}</p>
                <div className="tags">
                  <span>Next.js</span>
                  <span>TypeScript</span>
                  <span>GSAP</span>
                </div>
                <Link prefetch={false} className="text-link" href="/projects/garage-tahmeen/">
                  Explore the case study <Arrow />
                </Link>
              </div>
            </div>
          </article>

          <article
            className="project munjiz-project firn-feature" data-motion-project
            id="munjiz"
            aria-labelledby="munjiz-title"
            data-reveal
          >
            <div className="munjiz-text">
              <span className="section-label">02 / FULL-STACK & AI</span>
              <h3 id="munjiz-title">
                Munjiz<span className="accent">.</span>
              </h3>
              <p className="munjiz-statement">
                Big ideas.
                <br />
                <em>A clear next step.</em>
              </p>
              <p className="body-copy">
                An Arabic-first student platform connecting thoughtful interface design with
                structured AI workflows.
              </p>
              <div className="project-points">
                <span>
                  01 <b>Arabic RTL experiences</b>
                </span>
                <span>
                  02 <b>Typed, connected workflows</b>
                </span>
                <span>
                  03 <b>AI-assisted student work</b>
                </span>
              </div>
              <div className="tags">
                <span>Next.js</span>
                <span>FastAPI</span>
                <span>PostgreSQL</span>
              </div>
              <Link prefetch={false} className="text-link" href="/projects/munjiz/">
                Inside the project <Arrow />
              </Link>
            </div>
            <div className="munjiz-visual">
              {munjiz.media && <VideoPlayer {...munjizClips[1]} />}
              <p className="media-note">
                SELECTED SCENE · ORIGINAL PORTRAIT RECORDING
                <br />
                Platform capabilities are detailed in the case study.
              </p>
            </div>
          </article>

          <article className="project aqar-project firn-feature" data-motion-project aria-labelledby="aqar-title" data-reveal>
            <div className="aqar-top">
              <span className="section-label">03 / SPATIAL INTELLIGENCE</span>
              <span className="section-label">A ROOM. RECONSIDERED.</span>
            </div>
            {aqar.media && <VideoPlayer {...aqar.media} />}
            <p className="media-note aqar-note">
              Owner-supplied interior visualization. Not an application screen recording.
            </p>
            <div className="project-info">
              <div className="project-name">
                <span className="project-index">03</span>
                <div>
                  <p className="project-category">{aqar.category}</p>
                  <h3 id="aqar-title">
                    <Link prefetch={false} href="/projects/aqar-ai/">
                      AqarAI <Arrow diagonal />
                    </Link>
                  </h3>
                </div>
              </div>
              <div className="project-summary">
                <p>
                  From room context to product selection and image generation. AI workflows with a
                  real-world frame of reference.
                </p>
                <div className="tags">
                  <span>React</span>
                  <span>Python</span>
                  <span>AI workflows</span>
                </div>
                <Link prefetch={false} className="text-link" href="/projects/aqar-ai/">
                  Explore the case study <Arrow />
                </Link>
              </div>
            </div>
          </article>
        </section>

        <section className="also wrap" data-motion-section aria-labelledby="also-title" data-reveal>
          <div className="also-intro">
            <p className="section-label">BEYOND THE BROWSER</p>
            <h2 id="also-title">
              A different screen.
              <br />
              The same curiosity.
            </h2>
          </div>
          <Link prefetch={false} className="cis-card firn-feature" data-motion-project href="/projects/cismate/">
            <div className="cis-preview">
              <Image
                src="/projects/cismate-planner-thumb.webp"
                alt="CISmate Flutter app: semester planning preferences, course targets, and schedule controls"
                width={255}
                height={400}
                loading="lazy"
              />
              <Image
                src="/projects/cismate-schedule-thumb.webp"
                alt="CISmate generated schedule showing course selections and prerequisite warnings"
                width={254}
                height={401}
                loading="lazy"
              />
            </div>
            <div className="cis-copy">
              <span className="section-label">MOBILE · ACADEMIC PLANNING</span>
              <h3>
                CISmate <Arrow diagonal />
              </h3>
              <p>
                A Flutter academic planner with prerequisite-aware scheduling and an AI assistant.
              </p>
              <span className="text-link">
                View project <Arrow />
              </span>
            </div>
          </Link>
        </section>

        <section className="about wrap section" data-motion-section id="about" aria-labelledby="about-title">
          <div className="section-label">
            <span className="tiny-cross">+</span> THE PERSON BEHIND THE PIXELS
          </div>
          <div className="about-grid">
            <div>
              <h2 id="about-title" className="section-title" data-reveal>
                Curious by nature.
                <br />
                <em>Precise by choice.</em>
              </h2>
              <div className="education">
                <span className="education-mark" aria-hidden="true">
                  ↗
                </span>
                <div>
                  <strong>University of Jordan</strong>
                  <span>Computer Information Systems</span>
                  <small>Graduated June 2026</small>
                </div>
              </div>
            </div>
            <div className="about-copy">
              <p>
                I’m Ahmad, a recent Computer Information Systems graduate who enjoys making the web
                feel a little more considered.
              </p>
              <p>
                My interests sit between creative frontend engineering and useful software:
                responsive interfaces, carefully timed animation, full-stack applications, and
                AI-powered products.
              </p>
              <p>
                I like understanding how things work, refining the details, and learning what it
                takes to make an ambitious idea feel effortless to use.
              </p>
              <a
                className="text-link"
                href={person.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                More about me on LinkedIn <Arrow diagonal />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </div>
          <div className="skills-heading">
            <h3>A practical toolkit.</h3>
            <p>Technologies I build with, and tools I continue to explore.</p>
          </div>
          <div className="skills-grid" data-motion-section>
            {skillGroups.map((group, i) => (
              <div className="skill-group" key={group.name}>
                <span className="skill-index">0{i + 1}</span>
                <h4>{group.name}</h4>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
        <Contact />
      </main>
    </>
  );
}
