import { existsSync } from 'node:fs';
import path from 'node:path';
import garageManifest from './garage-clips.json';
import type { FilmClip } from './films';

export const person = {
  name: 'Ahmad Mohammad Abulhawa',
  email: 'ahmadabulhawar6@gmail.com',
  github: 'https://github.com/AhmadAbulhawa',
  linkedin: 'https://www.linkedin.com/in/ahmad-abulhawa-1a8835338',
};
export function assetExists(file: string) {
  return existsSync(path.join(process.cwd(), 'public', file));
}
export const cv = assetExists('ahmad-abulhawa-cv.pdf') ? '/ahmad-abulhawa-cv.pdf' : undefined;

export type Project = {
  slug: string;
  number: string;
  name: string;
  category: string;
  title: string;
  intro: string;
  stack: string[];
  github?: string;
  media?: {
    src: string;
    poster: string;
    width: number;
    height: number;
    label: string;
    description: string;
  };
  overview: string;
  contribution: string;
  features: { title: string; text: string }[];
  challenge: string;
  response: string;
  next: string;
};
// Only separately edited, inspected clips are eligible for the public site.
export const garageClips: FilmClip[] = (() => {
  if (!garageManifest.reviewedForPublicDisplay) return [];
  const clips: unknown[] = garageManifest.clips;
  if (clips.length < 3 || clips.length > 5) throw new Error('Garage requires 3–5 reviewed clips');
  for (const value of clips) {
    const clip = value as FilmClip;
    if (
      !clip ||
      !['src', 'poster', 'label', 'description', 'badge', 'duration', 'title', 'note'].every(
        (key) => typeof clip[key as keyof FilmClip] === 'string',
      ) ||
      !Number.isFinite(clip.width) ||
      !Number.isFinite(clip.height) ||
      clip.width <= clip.height ||
      clip.height <= 0
    )
      throw new Error('Invalid Garage clip manifest');
    for (const resource of [clip.src, clip.poster]) {
      if (
        !/^\/projects\/garage-tahmeen-[a-z0-9-]+\.(mp4|webp)$/.test(resource) ||
        !assetExists(resource.slice(1))
      )
        throw new Error('Missing or unsafe Garage clip asset');
    }
  }
  return clips as FilmClip[];
})();
export const projects: Project[] = [
  {
    slug: 'garage-tahmeen',
    number: '01',
    name: 'Garage Tahmeen',
    category: 'Cinematic automotive web experience',
    title: 'Motion with intention.',
    intro:
      'An automotive experience where scroll, transitions, and interaction become one continuous story.',
    stack: ['Next.js', 'React', 'TypeScript', 'GSAP', 'CSS'],
    overview:
      'A frontend project built around cinematic automotive storytelling. Carefully synchronized transitions connect the hero, vehicle presentations, and changing sections in a responsive web experience.',
    contribution:
      'Frontend implementation with Next.js, React, TypeScript, GSAP, and CSS, focusing on scroll-driven animation, responsive composition, and interactive transitions.',
    features: [
      {
        title: 'Scroll as a narrative',
        text: 'Scroll-triggered sequences connect sections and guide the pace of the experience.',
      },
      {
        title: 'Coordinated transitions',
        text: 'Vehicle changes, visual movement, and interface transitions share a deliberate animation language.',
      },
      {
        title: 'Responsive interaction',
        text: 'Layouts and controls adapt the cinematic direction to desktop and smaller screens.',
      },
    ],
    challenge:
      'Keeping a visually ambitious, scroll-driven experience coherent across different screen sizes and interaction methods.',
    response:
      'The implementation focus is coordinated GSAP timelines, responsive CSS, and controlled transitions that support the story without obscuring navigation.',
    next: 'munjiz',
  },
  {
    slug: 'munjiz',
    number: '02',
    name: 'Munjiz',
    category: 'AI-powered student productivity platform',
    title: 'Ambition, made tangible.',
    intro:
      'A cinematic first impression. A thoughtful Arabic experience. A full-stack platform for student work.',
    stack: ['Next.js', 'React', 'TypeScript', 'FastAPI', 'PostgreSQL', 'OpenAI API'],
    github: 'https://github.com/AhmadAbulhawa/Munjiz',
    media: {
      src: '/projects/munjiz-arrival.mp4',
      poster: '/projects/munjiz-arrival.webp',
      width: 464,
      height: 848,
      label: 'Watch Munjiz — selected brand scene',
      description:
        'A portrait recording of the Munjiz landing experience: the illuminated tower, Arabic typography, and cinematic brand transitions. This is a brand presentation, not a walkthrough of platform features.',
    },
    overview:
      'Munjiz brings an Arabic-first interface to AI-assisted student work. The repository implements project state validation, structured academic task generation, document rendering, and consultation workflows through a Next.js frontend and FastAPI backend.',
    contribution:
      'Interface engineering and full-stack integration, bringing responsive RTL experiences together with typed APIs, persistent project state, and AI-assisted workflows.',
    features: [
      {
        title: 'Arabic from the foundation',
        text: 'RTL project creation, summaries, and consultation flows include explicit review and approval controls.',
      },
      {
        title: 'Structured AI workflows',
        text: 'Provider-neutral consultation uses structured responses, bounded retries, timeouts, and auditable metadata.',
      },
      {
        title: 'State that stays consistent',
        text: 'PostgreSQL persistence, Alembic migrations, stale-write protection, and version-bound document artifacts support reliable project workflows.',
      },
    ],
    challenge:
      'Keeping generated academic deliverables consistent as a student’s project evolves, while supporting a polished Arabic interface.',
    response:
      'A canonical project state, immutable approval snapshots, and version-bound artifacts anchor the backend. Explicit frontend approval controls keep students involved in changes.',
    next: 'aqar-ai',
  },
  {
    slug: 'aqar-ai',
    number: '03',
    name: 'AqarAI',
    category: 'AI-powered interior design',
    title: 'From room to possibility.',
    intro:
      'Connecting spatial context, real furniture, and image-generation workflows in one design experience.',
    stack: ['Next.js', 'React', 'TypeScript', 'Python', 'FastAPI', 'OpenAI API'],
    github: 'https://github.com/AhmadAbulhawa/aqar-ai',
    media: {
      src: '/projects/aqar-transformation.mp4',
      poster: '/projects/aqar-poster.webp',
      width: 1440,
      height: 810,
      label: 'Watch the interior transformation — selected scene',
      description:
        'Owner-supplied interior transformation visualization. It illustrates the visual direction; it is not a screen recording or evidence of application-generated output.',
    },
    overview:
      'AqarAI connects room analysis with furniture selection and image generation. Its source includes a room-context interface, measured dimensions, inventory review, template workflows, spatial constraints, and a backend image-generation service.',
    contribution:
      'Responsive interface development and AI workflow integration, connecting room inputs and product selection to backend analysis and generation services.',
    features: [
      {
        title: 'Context before generation',
        text: 'Room analysis combines image input with measured dimensions, obstacles, and circulation information through a structured schema.',
      },
      {
        title: 'Products with real attributes',
        text: 'Catalog and template services track product dimensions and origin, resolve slots, and check room fit before rendering.',
      },
      {
        title: 'An explicit generation pipeline',
        text: 'A render manifest and compliance services connect selected furniture and room constraints to image generation. Billable image edits disable automatic SDK retries.',
      },
    ],
    challenge:
      'Connecting visual generation to room measurements and selected products, rather than treating every design request as an unconstrained image prompt.',
    response:
      'The source separates room analysis, inventory selection, placement planning, render manifests, and compliance checks. These are engineering safeguards, not a claim of perfect visual fidelity.',
    next: 'cismate',
  },
];
export const skillGroups = [
  {
    name: 'Frontend & motion',
    items: [
      'Next.js',
      'React',
      'TypeScript',
      'JavaScript',
      'HTML & CSS',
      'GSAP',
      'Responsive design',
      'RTL interfaces',
    ],
  },
  {
    name: 'Backend & data',
    items: ['Python', 'FastAPI', 'Java', 'Spring Boot', 'REST APIs', 'PostgreSQL', 'MySQL'],
  },
  {
    name: 'AI & workflow',
    items: [
      'OpenAI APIs',
      'LLM applications',
      'RAG',
      'Google Flow',
      'Qwen',
      'Git & GitHub',
      'Docker',
      'AI-assisted development',
    ],
  },
];
