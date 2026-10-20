# Firnlight-inspired portfolio UI (prototype branch)
The owner selected https://www.scrolltide.co/templates/firnlight as a visual and motion reference.
This is an original implementation, not a copy of the paid Scrolltide source.

- Scroll-driven sticky hero with a snow portrait and a camera-like push-in.
- Fade to black and project-chapter reveal, with the work section immediately following.
- Monochrome winter palette replaces the old lime/green styling.
- Responsive navigation and full-page mobile overlay.
- Videos now play inline on click; the previous full-screen video dialog is gone.
- Source case studies, real project text, contact links and CV are preserved.
- No scroll hijacking; reduced-motion accessible fallback; scroll animation only runs while a user scrolls.
- Placeholder visual referenced at /projects/ahmad-firnlight-hero.webp (must be added before review).
- The animated action in Firnlight's original film was not copied: a real multi-frame wardrobe/goggle animation would require an approved frame sequence or filmed footage.

Validation: npm ci && npm run lint && npm run typecheck && npm run build.
Test on real iOS Safari and desktop browsers before merging main.
