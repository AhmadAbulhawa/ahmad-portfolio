# Intro pose continuity regression

Based on `portfolio-3d-v2` at `c3d26c20cd4247cf9b55d5c7a70708c5eb036121`, on the separate `fix/cinematic-intro-continuity` branch.

The supplied 2.77-second recording shows the boundary from film 01 (A NEW PERSPECTIVE) to film 02 (DESIGN), around recording time 2.267 seconds. It is a landscape viewport, approximately 2.13:1. Earlier boundary checks measured film 02 → 03 only, so their passing goggle-coordinate assertions did not cover this report.

## Cause

Feature registration of the recording against the original MP4 frames identifies film 01's actual final frame, followed by film 02's opening pose. Background registration keeps the same scale and translation across the cut. The page's camera, cover crop, and viewport do not change. The source poses do: at 640-pixel source width, the saturated lens region is 124 pixels wide at film 01's endpoint versus 142 pixels at film 02's opening (about 14.5% wider), with different face and glove positions.

The earlier multi-video implementation had opacity transitions. The one-decoder rebuild removed them; the frame-handoff path subsequently overwrote its outgoing hold with the incoming frame and exposed it directly. This preserved loading continuity but made the unmatched poses switch in one paint. Delaying an incoming decoder or applying arbitrary camera offsets cannot align the different face/glove poses.

## Change

Only the 01 ↔ 02 boundary retains its outgoing decoded frame above the incoming film and dissolves it over 500 ms. A temporary full-resolution canvas exposes the verified incoming first frame for the same two-paint compositor protection already used by matched handoffs. It then yields to the native video while the outgoing frame fades. It is released after the transition.

The 02 ↔ 03 boundaries and same-film direction changes retain their existing direct, frame-matched handoffs. Source URLs, start times, playback rates, gestures, captions, layout, scroll handling, and gallery behavior are unchanged. Reduced motion keeps an immediate transition. Reset, release, and disposal cancel any pending blend along with the existing frame callbacks.

No MP4 was edited, transcoded, trimmed, or replaced. The three original SHA-256 hashes remain:

- `01-goggles-on.mp4`: `9bd9dd8e2b91bcbe3cd81df6b79a17ee817864c044e4cdfeca2d907bbd296a50`
- `02-dissolve.mp4`: `af22e46683cbf354362f0396a40b2c6ec65f5f46428650c82d7e48e9f9cd3314`
- `03-shatter.mp4`: `1629989e38a8869e6e1ac80689ffac1cfd2e7aea45e0caa6ee4a5be9a567bba2`

## Executed verification

- Supplied recording examined frame by frame; matching original source frames inspected at the reported cut.
- Actual browser screenshots inspected before, during, and after the fixed handoff at 1536 × 720, 390 × 844, and 844 × 390.
- `scripts/qa-intro-handoff.mjs`: all four viewports/motion settings pass. The outgoing pixels remain unchanged during the blend. The incoming first frame is exposed around 1.516 s, relative to its 1.5 s start. Normal-motion cases have 30–31 sampled intermediate frames across 483–500 ms, with monotonically falling opacity; reduced motion has none.
- `qa:frames`: all desktop, portrait, and no-video-frame-callback fallback journeys pass, including delayed responses, forward and reverse transitions, gallery return, reset, first-frame exposure, and unchanged 02/03 alignment.
- `qa:cinematic`: desktop wheel and mobile Chromium protocol touch journeys pass, including caption synchronization, all gallery stops, reverse playback, menu navigation, and every case-study page. No page errors or stall retries.
- All 21 controller/input tests pass, including the new boundary-selection regression. Type checking and the static production build pass.

Local browser verification uses Chromium, including mobile viewport/touch emulation. Physical iPhone Safari and local WebKit are not available; these results do not assert physical-device Safari coverage.

Reproduce with the range-capable static server after a production build:

```sh
node scripts/serve-export.mjs
CHROMIUM_PATH=/usr/bin/chromium node scripts/qa-intro-handoff.mjs
CHROMIUM_PATH=/usr/bin/chromium npm run qa:frames
CHROMIUM_PATH=/usr/bin/chromium npm run qa:cinematic
```
