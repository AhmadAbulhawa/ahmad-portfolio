# Ahmad Mohammad Abulhawa — Portfolio

A bespoke, static Next.js portfolio for creative frontend engineering, full-stack applications, and AI-powered products. Dark editorial art direction, locally hosted typography, restrained GSAP motion, and authentic project media.

## Run

Node 22+ and npm:

```sh
npm ci
npm run dev
```

Validate and generate the Cloudflare Pages-compatible static site:

```sh
npm run lint
npm run typecheck
npm run build
python -m http.server 3000 --directory out
```

## Included

- Responsive homepage: hero, selected work, secondary CISmate feature, about/education, skills, contact.
- Static case studies: Garage Tahmeen, Munjiz, AqarAI, and CISmate; custom 404.
- Three complete owner-selected Garage Tahmeen scenes, three edited portrait Munjiz moments, a trimmed AqarAI visualization, and real CISmate screenshots.
- Progressive cinematic case-study stage; clips mount only after explicit playback, with keyboard/touch navigation and reduced-motion support.
- Accessible video dialogs, native controls, focus restoration, visible focus, skip link, semantic content.
- Metadata, local social image, font license, static-file and Cloudflare size checks. Domain-aware canonical metadata and sitemap generation.

Garage Tahmeen uses the owner's three selected recordings in full, with no additional temporal trimming. Only compression, silent delivery, exact-ratio resizing, and privacy masks for the clipped header and identity-bearing copy/location are applied. Munjiz uses three separately edited moments selected after reviewing its complete portrait recording. Neither project serves a full-length continuous source recording.

No CV was provided. Add `public/ahmad-abulhawa-cv.pdf` and rebuild to enable real download actions automatically.

## Documentation

- [Content sources, exact edits, media status, integration steps](docs/CONTENT-AND-MEDIA.md)
- [Cloudflare Pages setup](docs/CLOUDFLARE-PAGES.md)
- [Validation evidence](docs/VALIDATION.md)

Set `NEXT_PUBLIC_SITE_URL` to the final approved HTTPS origin before production build. No domain is guessed. No website deployment or publication is authorized by this implementation.
