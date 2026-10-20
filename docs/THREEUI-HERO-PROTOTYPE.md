# ThreeUI cinematic 3D hero prototype

This branch is a **prototype only**. Production remains untouched until approval.

## What changed
- Preserved all real portfolio text, selected work, project routes, downloadable CV and video playback.
- Added the **EnergyOrb** WebGL scene from the public ThreeUI Community codebase, adapted for the portfolio color palette and Next.js, with a second lightweight 2D star overlay.
- Added a scroll-driven camera-like dolly/scale/fade transition from the hero toward the real Selected Work section.
- Added a static visual fallback for users on reduced motion, low-data or unavailable WebGL.
- Rendering stops when the orb is off screen or the tab is hidden; GPU pixel ratio is capped at 1.35. Heavy 3D assets and new npm dependencies are deliberately avoided in this first proof of concept.

## Attribution and license
Ported from:
- https://github.com/MengTo/threeui/blob/main/src/shaders/energy-orb/EnergyOrb.tsx
- https://github.com/MengTo/threeui/blob/main/src/shaders/energy-orb/energyOrbShaders.ts

ThreeUI Community (c) 2026 Meng To, MIT license:
https://github.com/MengTo/threeui/blob/main/LICENSE

Preserve this credit and the MIT license if these files are reused. The existing shader itself is unchanged; the React wrapper has reduced particles, capped DPR, adjusted pause-on-reduced-motion behavior and a transparent surface for our hero layering. No Pro/Beta source or external media are included.

## Review and validation
Run with Node 22+:

npm ci
npm run lint
npm run typecheck
npm run build

Inspect the hero and the scroll-to-projects transition on Chrome, Safari and mobile; check that browser WebGL support, low-power and reduced-motion fallbacks work. Performance and frame rates are **not yet benchmarked on user devices**. Do not merge into main until visually reviewed and tested.

The current prototype creates a shader-rendered rotating sphere with camera-like CSS motion. It does **not yet** build a full real 3D camera/path spanning the entire site; that expansion is the next stage after approval.
