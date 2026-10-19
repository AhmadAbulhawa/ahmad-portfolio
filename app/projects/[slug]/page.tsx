import Link from 'next/link';
import type { Metadata } from 'next';
import Image from 'next/image';
import { FilmSequence } from '@/components/film-sequence';
import { munjizClips } from '@/lib/films';
import { notFound } from 'next/navigation';
import { projects, person, garageClips } from '@/lib/content';
import { Arrow } from '@/components/icons';
import { VideoPlayer } from '@/components/video-player';

export const dynamicParams = false;
export function generateStaticParams() {
  return [...projects.map(({ slug }) => ({ slug })), { slug: 'cismate' }];
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  const title = project?.name ?? 'CISmate';
  const description =
    project?.intro ??
    'A Flutter academic planning application with course exploration, scheduling, and AI-powered student assistance.';
  return {
    title,
    description,
    alternates: process.env.NEXT_PUBLIC_SITE_URL ? { canonical: `/projects/${slug}/` } : undefined,
    openGraph: {
      title: `${title} — Ahmad Abulhawa`,
      description,
      ...(process.env.NEXT_PUBLIC_SITE_URL ? { images: ['/social.png'] } : {}),
    },
  };
}
export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === 'cismate') return <Cismate />;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();
  const next = projects.find((p) => p.slug === project.next)!;
  return (
    <main id="main-content" className={`case-page case-${slug}`}>
      <section className="case-hero wrap">
        <Link prefetch={false} className="back-link" href="/#work">
          ← Back to selected work
        </Link>
        <div className="section-label">
          PROJECT {project.number} / {project.category.toUpperCase()}
        </div>
        <h1>
          {project.name}
          <span className="accent">.</span>
        </h1>
        <p className="case-tagline">{project.title}</p>
        <div className="case-intro">
          <p>{project.intro}</p>
          <div className="tags">
            {project.stack.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </div>
      </section>
      <section className="case-media wrap" aria-label={`${project.name} visual presentation`}>
        {slug === 'garage-tahmeen' && garageClips.length > 0 ? (
          <FilmSequence clips={garageClips} />
        ) : slug === 'munjiz' ? (
          <>
            <FilmSequence clips={munjizClips} />
            <p className="media-note">
              Three selected scenes from the original brand recording. Each scene loads only when
              played. These are landing-page visuals, not an application feature walkthrough.
            </p>
          </>
        ) : project.media ? (
          <>
            <VideoPlayer {...project.media} priority />
            <p className="media-note">{project.media.description}</p>
          </>
        ) : (
          <div className="case-editorial">
            <span className="section-label">GARAGE TAHMEEN / ENGINEERING OVERVIEW</span>
            <p>
              Scroll.
              <br />
              Story.
              <br />
              <em>Motion.</em>
            </p>
            <span className="editorial-footnote">Cinematic frontend engineering</span>
          </div>
        )}
      </section>
      <section className="case-details wrap" aria-labelledby="overview-title">
        <div className="case-section-label">
          <span className="section-label">THE OVERVIEW</span>
          <h2 id="overview-title">{project.title}</h2>
          {project.github && (
            <a
              className="text-link"
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              Explore the source <Arrow diagonal />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </div>
        <div className="case-prose">
          <p>{project.overview}</p>
          <h3>My contribution</h3>
          <p>{project.contribution}</p>
        </div>
      </section>
      <section className="case-features wrap" aria-label="Project capabilities">
        {project.features.map((feature, i) => (
          <div key={feature.title}>
            <span className="section-label">0{i + 1}</span>
            <h2>{feature.title}</h2>
            <p>{feature.text}</p>
          </div>
        ))}
      </section>
      <section className="engineering wrap">
        <div>
          <span className="section-label">THE ENGINEERING QUESTION</span>
          <h2>{project.challenge}</h2>
        </div>
        <div>
          <span className="section-label">IMPLEMENTATION FOCUS</span>
          <p>{project.response}</p>
        </div>
      </section>
      <div className="case-links wrap">
        <a className="text-link" href={`mailto:${person.email}`}>
          Talk about this project <Arrow diagonal />
        </a>
        <Link prefetch={false} className="text-link" href="/#work">
          All selected work <Arrow />
        </Link>
      </div>
      <Link prefetch={false} className="next-project wrap" href={`/projects/${next.slug}/`}>
        <span className="section-label">UP NEXT / {next.number}</span>
        <span className="next-title">
          {next.name}
          <Arrow diagonal />
        </span>
        <span>{next.category}</span>
      </Link>
    </main>
  );
}
function Cismate() {
  return (
    <main id="main-content" className="case-page">
      <section className="case-hero wrap">
        <Link prefetch={false} className="back-link" href="/#work">
          ← Back to selected work
        </Link>
        <div className="section-label">MOBILE / ACADEMIC PLANNING</div>
        <h1>
          CISmate<span className="accent">.</span>
        </h1>
        <p className="case-tagline">A clearer academic path.</p>
        <div className="case-intro">
          <p>
            A cross-platform academic planner for CIS students, connecting course information,
            semester planning, and AI-powered assistance.
          </p>
          <div className="tags">
            {['Flutter', 'Dart', 'REST APIs', 'Spring Boot', 'MySQL', 'OpenAI API'].map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </div>
      </section>
      <section className="cis-gallery wrap" aria-label="Authentic CISmate application screenshots">
        <figure>
          <Image
            src="/projects/cismate-planner.webp"
            width={510}
            height={800}
            alt="CISmate schedule generator with semester preferences, credit targets, and course selection"
            preload
          />
          <figcaption>Semester preferences & planning</figcaption>
        </figure>
        <figure>
          <Image
            src="/projects/cismate-schedule.webp"
            width={508}
            height={802}
            alt="Generated schedule with prerequisite warnings and course credit totals"
            preload
          />
          <figcaption>Schedule results & warnings</figcaption>
        </figure>
        <figure>
          <Image
            src="/projects/cismate-assistant.webp"
            width={509}
            height={802}
            alt="CISmate AI assistant answering a question about the Computer Information Systems program"
            loading="lazy"
          />
          <figcaption>Program-specific AI assistance</figcaption>
        </figure>
      </section>
      <section className="case-details wrap">
        <div className="case-section-label">
          <span className="section-label">THE OVERVIEW</span>
          <h2>
            Less guesswork.
            <br />
            More direction.
          </h2>
          <a
            className="text-link"
            href="https://github.com/AhmadAbulhawa/CISmate"
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore the source <Arrow diagonal />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
        <div className="case-prose">
          <p>
            CISmate brings course exploration, prerequisite-aware planning, schedule generation, GPA
            calculation, and an AI assistant into a mobile application for Computer Information
            Systems students.
          </p>
          <h3>My contribution</h3>
          <p>
            Flutter application development and REST API integration, with attention to planning
            flows, responsive mobile screens, and student assistance.
          </p>
          <p>
            The repository includes the Flutter client and documents a Spring Boot, MySQL, and
            OpenAI backend architecture. These screenshots show the actual application; deeper
            planning optimization and richer retrieval are described as future work.
          </p>
        </div>
      </section>
      <section className="case-features wrap">
        <div>
          <span className="section-label">01</span>
          <h2>Plan with context</h2>
          <p>
            Semester planning, prerequisite visibility, adjustable credit targets, and generated
            schedule warnings.
          </p>
        </div>
        <div>
          <span className="section-label">02</span>
          <h2>Know your options</h2>
          <p>
            Course and professor exploration, a GPA calculator, and career and opportunity modules.
          </p>
        </div>
        <div>
          <span className="section-label">03</span>
          <h2>Ask an assistant</h2>
          <p>Program-specific questions and guidance through the app’s AI assistant interface.</p>
        </div>
      </section>
      <section className="engineering wrap">
        <div>
          <span className="section-label">THE ENGINEERING QUESTION</span>
          <h2>How can a dense academic plan feel manageable on a small screen?</h2>
        </div>
        <div>
          <span className="section-label">IMPLEMENTATION FOCUS</span>
          <p>
            Separate preferences, generation, and schedule review into clear flows. Keep warnings
            visible alongside results, and centralize API access in the Flutter network layer.
          </p>
        </div>
      </section>
      <Link prefetch={false} className="next-project wrap" href="/projects/garage-tahmeen/">
        <span className="section-label">BACK TO FEATURED WORK / 01</span>
        <span className="next-title">
          Garage Tahmeen <Arrow diagonal />
        </span>
        <span>Cinematic automotive web experience</span>
      </Link>
    </main>
  );
}
