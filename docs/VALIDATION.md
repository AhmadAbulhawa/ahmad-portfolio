# Validation evidence

19 October 2026. No deployment or publication performed.

The final approval review is **desktop only at 1440px**: see [screenshots, confirmed fixes and current evidence](qa/README.md). That review corrects the earlier moving privacy-mask timing and verifies all 634 final delivery frames; it supersedes the earlier mask sampling. The mobile observations below describe the initial build, not a new mobile approval pass.

## Build and static delivery

- `npm run lint`: passed, no ESLint errors or warnings.
- `npm run typecheck`: passed (`next typegen && tsc --noEmit`); does not require a prior production build.
- `npm run build`: passed with Next.js 16.4.2, React 19, TypeScript, static export.
- Generated homepage, four case studies, and 404, with direct static HTML routes.
- `scripts/check-export.mjs` checks internal resources (including responsive poster candidates), static pages, the 25 MiB per-file limit and 20,000-file free-tier ceiling. Export is approximately 8.1 MiB; largest media is under 2 MiB.
- No SSR, API routes, server actions, runtime image optimizer, secrets, database or paid service dependency.
- Local security and cache headers are declared for Cloudflare in `public/_headers`.

## Actual browser checks

Chromium via Playwright against the production static export:

- Homepage: no horizontal overflow at 320, 390, 768, 1024, and 1440 CSS pixels.
- All case studies: one h1 and no overflow at 320, 390, 768, and 1440 pixels.
- No MP4 requests on initial homepage or case-study navigation.
- Munjiz scene 1 plays with native controls at 464×848. Escape closes the dialog, removes its video source, and restores keyboard focus.
- Munjiz progressive chapters switch scenes on scroll without requesting video. Scenes 2 and 3 play; changing scene unmounts the old video. Previous/next scene navigation works.
- Garage Tahmeen: all three scenes play with native controls on desktop (1440px) and mobile (390px); the progressive stage changes without loading inactive video. It retains the original 1912:824 ratio at 1434×618. Full owner-selected scene frame counts preserved (256, 249, 129). No temporal trimming. Privacy masking occurs in the actual delivery encode and extracted posters, not just CSS.
- AqarAI excerpt decodes and plays at 1440×810 (16:9).
- Lazy posters, responsive variants, and authentic CISmate screenshots load successfully. Mobile navigation opens.
- Reduced motion: immediately visible content, no smooth scrolling, no initial video downloads, no transform/opacity transitions.
- No browser runtime exceptions in the tested navigation and playback flows.
- FFmpeg full decode checks passed for each exported clip. Native browser playback checks are separate from visual/editorial footage review.

## Accessibility

axe-core 4.10.3 WCAG 2 A/AA and WCAG 2.1 AA audits: no reported violations on the homepage or any of the four case studies. Visible control labels match accessible names; native dialog focus behavior, Escape, keyboard buttons, skip link and reduced-motion behavior were checked. This is automated and focused manual verification, not a formal accessibility certification.

## Performance lab

One isolated Lighthouse mobile run against a compressed static QA server (gzip text delivery approximating Cloudflare Pages; Node/Chromium on the task machine):

| Category       | Score |
| -------------- | ----- |
| Performance    | 98    |
| Accessibility  | 100   |
| Best practices | 100   |
| SEO            | 100   |

FCP 0.8 s, LCP 2.4 s, total blocking time 50 ms, CLS 0.

An uncompressed Python development server scored 82 for mobile performance. Cloudflare automatically compresses eligible text assets; the compressed measurement is the closer delivery model. These are local lab measurements, not field Core Web Vitals or measurements of a deployed website. Cache/CDN behavior must be verified only after explicit deployment approval.

## Limits and remaining content

The initial longer Garage recording could not be transferred; the later owner-selected archive was used instead, preserving all three selected scenes in full. No latest CV PDF or downloadable versions of the inline UI screenshots/personal photography were available. There is no fake CV download or invented imagery. The Framer reference was network-blocked. Final domain remains unset; canonical URLs, absolute social image URLs, and the sitemap become available when `NEXT_PUBLIC_SITE_URL` is set for the approved domain and the build is rerun.
