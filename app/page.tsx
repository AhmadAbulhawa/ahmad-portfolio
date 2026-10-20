import Link from 'next/link';
import Image from 'next/image';
import { Arrow } from '@/components/icons';
import { Motion } from '@/components/motion';
import { FilmChapters } from '@/components/film-chapters';
import { IdentitySequence } from '@/components/identity-sequence';
import { VideoPlayer } from '@/components/video-player';
import { TechnologySystem } from '@/components/technology-system';
import { Contact } from '@/components/shell';
import { person, projects, skillGroups, garageClips } from '@/lib/content';
export default function Home() {
  const [garage, munjiz, aqar] = projects;
  return (
    <>
      <Motion />
      <main id="main-content">
        <FilmChapters />
        <div data-portfolio-content>
          <section id="work" className="work wrap section" aria-labelledby="work-title">
            <div className="section-top">
              <span className="section-label">01 / SELECTED WORK</span>
              <span className="section-aside">FOUR PROJECTS. FOUR DIFFERENT PERSPECTIVES.</span>
            </div>
            <div className="work-heading">
              <h2 className="section-title" id="work-title">
                Built to work.
                <br />
                <em>Made to feel.</em>
              </h2>
              <p>
                Expressive interfaces.
                <br />
                Intelligent systems.
                <br />
                Real things, thoughtfully built.
              </p>
            </div>
            <article className="work-feature" data-reveal>
              <div className="work-project-top">
                <span className="section-label">01 / INTERACTIVE AUTOMOTIVE</span>
                <span className="section-label">NEXT.JS · TYPESCRIPT · GSAP</span>
              </div>
              {garageClips[0] && <VideoPlayer {...garageClips[0]} />}
              <div className="work-feature-info">
                <h3>
                  <Link prefetch={false} href="/projects/garage-tahmeen/">
                    Garage Tahmeen <Arrow diagonal />
                  </Link>
                </h3>
                <div>
                  <p>{garage.intro}</p>
                  <Link prefetch={false} className="text-link" href="/projects/garage-tahmeen/">
                    Explore the case study <Arrow />
                  </Link>
                </div>
              </div>
            </article>
            <div className="work-editorial-pair">
              <article className="work-portrait" data-reveal>
                <div className="work-project-top">
                  <span className="section-label">02 / AI & PRODUCT DESIGN</span>
                </div>
                <Link
                  prefetch={false}
                  className="project-art munjiz-art"
                  href="/projects/munjiz/"
                  aria-label="Explore Munjiz case study"
                >
                  <span className="art-caption">AMBITION, MADE TANGIBLE.</span>
                  <Image
                    src="/projects/munjiz-arrival.webp"
                    alt="Original Munjiz brand presentation — illuminated Arabic studio tower"
                    width={464}
                    height={848}
                    loading="lazy"
                  />
                  <span className="art-arrow">
                    <Arrow diagonal />
                  </span>
                </Link>
                <div className="work-pair-info">
                  <h3>
                    <Link href="/projects/munjiz/">
                      Munjiz <Arrow diagonal />
                    </Link>
                  </h3>
                  <p>{munjiz.intro}</p>
                  <div className="tags">
                    <span>Next.js</span>
                    <span>FastAPI</span>
                    <span>PostgreSQL</span>
                  </div>
                </div>
              </article>
              <article className="work-spatial" data-reveal>
                <div className="work-project-top">
                  <span className="section-label">03 / SPATIAL INTELLIGENCE</span>
                </div>
                <div className="spatial-art">
                  <VideoPlayer {...aqar.media!} />
                  <span className="spatial-caption">
                    FROM ROOM
                    <br />
                    TO <em>POSSIBILITY.</em>
                  </span>
                </div>
                <div className="work-pair-info">
                  <h3>
                    <Link href="/projects/aqar-ai/">
                      AqarAI <Arrow diagonal />
                    </Link>
                  </h3>
                  <p>{aqar.intro}</p>
                  <Link prefetch={false} className="text-link" href="/projects/aqar-ai/">
                    Inside the project <Arrow />
                  </Link>
                </div>
              </article>
            </div>
            <article className="work-cismate" data-reveal>
              <div className="cis-copy">
                <span className="section-label">04 / ACADEMIC PLANNING</span>
                <h3>
                  <Link href="/projects/cismate/">
                    CISmate <Arrow diagonal />
                  </Link>
                </h3>
                <p>
                  A clearer academic path. A Flutter planner connecting prerequisite-aware
                  scheduling, course information, and AI assistance.
                </p>
                <div className="tags">
                  <span>Flutter</span>
                  <span>Dart</span>
                  <span>Spring Boot</span>
                </div>
                <Link prefetch={false} className="text-link" href="/projects/cismate/">
                  Explore the application <Arrow />
                </Link>
              </div>
              <Link
                prefetch={false}
                className="cis-art"
                href="/projects/cismate/"
                aria-label="Explore CISmate case study"
              >
                <Image
                  src="/projects/cismate-login.jpeg"
                  alt="The real CISmate login screen with email and password fields"
                  width={1280}
                  height={803}
                  loading="lazy"
                />
              </Link>
            </article>
          </section>
          <section id="about" className="about section" aria-labelledby="about-title">
            <IdentitySequence />
            <div className="about-editorial">
              <span className="section-label">02 / THE PERSON BEHIND THE PIXELS</span>
              <h2 id="about-title">
                Curious
                <br />
                by nature.
                <br />
                <em>
                  Precise
                  <br />
                  by choice.
                </em>
              </h2>
              <div className="about-prose">
                <p>
                  I’m Ahmad, a Full-Stack Developer and AI Engineer, and a Computer Information
                  Systems graduate from the University of Jordan.
                </p>
                <p>
                  My work sits between expressive frontend engineering and useful software:
                  considered interfaces, carefully timed motion, connected applications, and
                  AI-powered products.
                </p>
                <p>
                  I like understanding how things work, refining the details, and making ambitious
                  ideas feel effortless to use.
                </p>
                <a
                  className="text-link"
                  href={person.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  More about me <Arrow diagonal />
                </a>
              </div>
              <div className="education">
                <span>UNIVERSITY OF JORDAN</span>
                <span>
                  Computer Information Systems
                  <br />
                  <small>Graduated June 2026</small>
                </span>
              </div>
            </div>
          </section>
          <TechnologySystem groups={skillGroups} />
          <Contact />
        </div>
      </main>
    </>
  );
}
