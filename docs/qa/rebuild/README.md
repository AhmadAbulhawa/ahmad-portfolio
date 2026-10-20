# Cinematic rebuild — visual evidence

Captured from the production static export in Chromium. Desktop: **1440 × 1000**. Mobile: **390 × 844**, with actual Chromium protocol touch sequences in interaction QA. Additional portrait **320 × 568** and landscape **667 × 375** checks passed.

[Desktop overview](desktop-overview.jpg) · [Mobile overview](mobile-overview.jpg) · [Executed browser report](browser-report.json) · [Architecture and media decisions](../../CINEMATIC-REBUILD.md)

## Introduction and gallery

| View | Desktop | Mobile |
| --- | --- | --- |
| Initial paused frame | [Image](desktop-intro.webp) | [Image](mobile-intro.webp) |
| Design philosophy, last frame | [Image](desktop-philosophy-final.webp) | [Image](mobile-philosophy-final.webp) |
| Transformation | [Image](desktop-transformation.webp) | [Image](mobile-transformation.webp) |
| First selected project | [Image](desktop-gallery-01.webp) | [Image](mobile-gallery-01.webp) |
| Fourth selected project | [Image](desktop-gallery-04.webp) | [Image](mobile-gallery-04.webp) |

## Full editorial sections

| Section | Desktop | Mobile |
| --- | --- | --- |
| Garage Tahmeen | [Image](desktop-work-garage.webp) | [Image](mobile-work-garage.webp) |
| Munjiz | [Image](desktop-work-munjiz.webp) | [Image](mobile-work-munjiz.webp) |
| AqarAI | [Image](desktop-work-aqar.webp) | [Image](mobile-work-aqar.webp) |
| CISmate | [Image](desktop-work-cismate.webp) | [Image](mobile-work-cismate.webp) |
| About editorial | [Image](desktop-about-editorial.webp) | [Image](mobile-about-editorial.webp) |
| Technologies | [Image](desktop-technology-field.webp) | [Image](mobile-technology-field.webp) |
| Contact | [Image](desktop-contact-full.webp) | [Image](mobile-contact-full.webp) |

## Complete case-study pages

| Project | Desktop | Mobile |
| --- | --- | --- |
| Munjiz | [Full page](desktop-case-munjiz-full.webp) | [Full page](mobile-case-munjiz-full.webp) |
| Garage Tahmeen | [Full page](desktop-case-garage-tahmeen-full.webp) | [Full page](mobile-case-garage-tahmeen-full.webp) |
| AqarAI | [Full page](desktop-case-aqar-ai-full.webp) | [Full page](mobile-case-aqar-ai-full.webp) |
| CISmate | [Full page](desktop-case-cismate-full.webp) | [Full page](mobile-case-cismate-full.webp) |

Clean npm installation, lint, TypeScript, 10 controller tests, production export, real forward/reverse playback, missed-ended recovery, all navigation destinations, home/reload reset, reduced motion, delayed media, rejected play, no-WebGL fallback, every selected project link, and overflow checks passed locally. Screenshots were inspected against the supplied arctic/goggle reference. The three original cinematic MP4s are unchanged.

These are browser screenshots. A physical iPhone was **not tested**. Local Playwright WebKit installation was blocked by the environment's network policy; CI has separate Chromium and WebKit jobs. Neither physical Safari performance nor remote CI/deployment is established by these local screenshots.
