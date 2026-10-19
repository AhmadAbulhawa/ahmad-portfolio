# Ahmad Abulhawa — Developer Portfolio

Personal portfolio for Ahmad Mohammad Abulhawa, highlighting frontend engineering, motion design, and AI-powered projects.

## Goal

Build a fast, accessible, premium-minimal personal site whose strongest visual moments are **real project demos** rather than distracting page effects.

## Featured work

1. **Garage Tahmeen** — an immersive automotive experience, built using Next.js, TypeScript, and GSAP. Show scroll-driven storytelling, responsive layouts, and cinematic transitions. Use the portfolio-facing project name **Garage Tahmeen**, not the original client's name or branding.
2. **Munjiz** — a Next.js/React platform featuring polished UI, Arabic RTL support, interactive carousels, and full-stack functionality.
3. **AqarAI** — an AI-powered interior-design / real-estate project.

Related repositories for reference:
- https://github.com/AhmadAbulhawa/Munjiz
- https://github.com/AhmadAbulhawa/almanaseer-cinematic-website (reference only; public portfolio should use the neutral name Garage Tahmeen and only cleared media)
- https://github.com/AhmadAbulhawa/aqar-ai

## Confirmed project presentation decision

**Use actual demo videos rather than recreating or embedding the original project websites inside the portfolio.**

- **Garage Tahmeen:** Show the user-provided screen recording of its cinematic transitions, scroll interactions, and UI. Use the neutral portfolio-facing name only. Expected assets: `public/projects/garage-tahmeen-preview.mp4` and `public/projects/garage-tahmeen-poster.webp` (prepared and ready to upload).
- **Munjiz:** Show a real, user-provided screen recording of its interface, interactive components, motion, and RTL behavior.
- Place a high-quality still poster/thumbnail before video load; clicking opens an accessible larger video player with native controls. Desktop may silently preview on hover/in-view if performance permits; mobile must work through tap and never depend on hover.
- Prioritize load speed. Lazy-load the videos, use `preload="none"` or `metadata`, `playsInline`, muted hover previews, and reduced-motion safeguards. Compress assets and keep each static file within hosting size limits; do not load both full videos on initial page load.
- If the real MP4/WebM files are not yet present in the repository, build polished poster/placeholder slots and document the exact expected filenames in `public/projects/`. **Never fabricate footage, fake demos, or recreate a miniature version of the project website as a substitute.**
- Each project can still have a concise static case-study page with its video, key features, tech stack, and GitHub link. AqarAI can use authorized screenshots/visuals until a real demo video is available.

## Implementation requirements

- Next.js App Router, TypeScript, GSAP as needed.
- Static export suitable for **Cloudflare Pages**; no SSR, server actions, or dynamic server APIs.
- Optimized, responsive, mobile-first experience with accessible keyboard controls, reduced-motion support, and semantic markup.
- Premium minimalist design: clear typography, project-first storytelling, restrained page motion.
- Two real videos provided by the user (Munjiz and Garage Tahmeen) as the primary visual showcases, lazy-loaded with fallback poster images; no site-in-site reconstruction.
- No fabricated project screenshots, fake metrics, testimonials, or experience claims.
- Avoid unauthorized third-party logos, photos, and footage.
- Pages/sections: Home, Selected Work, individual Project Case Studies, About/Skills, Contact.
- Prominent resume, email, GitHub, and LinkedIn links.
- Test `npm run build` and verify `out/` is produced before publishing.

## Links

- GitHub: https://github.com/AhmadAbulhawa
- LinkedIn: https://www.linkedin.com/in/ahmad-abulhawa-1a8835338
- Existing portfolio: https://ahmadabulhawa.framer.website

Develop locally / in Codex Cloud first; deploy only after review.