# Cinematic portfolio rebuild

This change is based on `portfolio-3d-v2` at `7f3b440d80f142479e840e1bce49d1a39038b0a3`. Next.js App Router, React, TypeScript, static export, all four project routes, original project descriptions, contact destinations, and the downloadable CV are retained. None of the three original MP4s was edited or re-encoded. Only the derived dissolve reverse clip was regenerated to align its boundary.

## Playback architecture

The previous implementation distributed playback across six video elements, mutable running/completion flags, a transition bridge, preload/seek event callbacks, and global touch/body locks. Its recovery still depended on particular media events or an exact final timestamp being observed. This is a fragile combination on a suspended or resource-constrained Safari decoder. The physical iPhone failure cannot be diagnosed conclusively without that device.

`lib/cinematic/controller.ts` now owns one media element and an explicit state:

`idle → transitioning → loading → playing / stalled → completed → next chapter / gallery → released`

Events trigger inspection; they do not authorize advancing. A 180 ms watchdog exists only during active playback. Completion requires observed media progress, valid duration, no active seek, and a real final sample: ended/paused at the last frame, duration reached, or a stationary final sample with the tail buffered. A buffering video in the middle cannot complete because wall-clock time elapsed. A subsequent gesture rechecks the timestamp before choosing an action, so a missed final event can be recovered by the same swipe. A rejected or stalled play retries the same source inside the next genuine gesture. No timeout advances a chapter.

Source changes, release, reset, and disposal invalidate old play promises. Visibility changes pause and restart the watchdog appropriately. Each source replacement calls `play()` inside the original gesture; no `canplay` or `seeked` event gates activation. The initial frame is a native poster with no autoplay. Navigation and Skip Intro explicitly release the cinema. AHMAD resets the source, gallery selection, URL fragment, and scroll position.

There is no global `touchmove` listener or body overflow mutation. Vertical touch gestures are scoped to the active stage using `touch-action: pan-x pinch-zoom`; wheel bursts are grouped using an idle boundary. Menu links and Skip Intro remain usable while media is loading. Inactive lower content is inert during the cinema, preventing keyboard focus from scrolling around an unfinished film. Keyboard arrows and PageUp/PageDown are supported.

## Film decisions

Originals inspected at 24 fps using extracted contact sheets:

- Film 01: original 1×, starts at zero.
- Film 02: original 1×, starts at 1.5 s, retaining a short breath before the visible disappearance around 2–3 s. Metadata seeking has a polling fallback; play is still invoked synchronously.
- Film 03: original 1.5×, starts at zero. Its opening goggles frame and the dissolve endpoint match geometrically. Both use the same object fit and position. No cover hides a second of advancing shatter footage.
- Reverse: reverse assets, with dissolve regenerated from the original starting at 1.5 s before reversal to match its forward boundary. The reverse asset is already trimmed and plays to its own duration; it is never trimmed a second time. New end-frame JPEG posters are extracted from the originals; the originals remain byte-identical.

Mobile uses `100dvh`, a `100svh` placeholder, safe-area padding, and edge-to-edge object-fit cover. A 16:9 original requires deliberate horizontal cropping in portrait. The face and central goggle action stay at the center; films 02 and 03 share the exact crop.

## Three.js and ThreeUI

The gallery uses Three.js `CSS3DRenderer`, a perspective camera, and a signed, non-wrapping helical trajectory. Real HTML links remain readable and accessible, rather than rendering text into textures. A selected card is exactly centered and has zero Y rotation. One input launches one eased, fixed-duration transition; input does not scrub the scene. Reverse uses the same parametric path. Portrait Munjiz artwork keeps its actual proportions. CISmate uses the original login screenshot.

One optional WebGL renderer supplies low-poly iridescent glass fragments, restrained lighting, and dust. DPR is capped at 1 on mobile and 1.5 on desktop; mobile has fewer particles and shards. The gallery is dynamically imported only when reached, stops rendering offscreen/in background, disposes geometry/materials/renderers on exit, and retains the CSS3D gallery if WebGL fails. Context loss preserves CSS card navigation. Reduced motion snaps between precise stops without ambient animation.

The technology section contains a real, locally adapted ThreeUI Community **Liquid Form** component and its complete shader, from MengTo/threeui commit `68802d5428071ada5c20db8094b1649e6bb770ed`. See `components/threeui/` and its retained MIT license. This is source integration, not an unused package. The adaptation changes lighting to cyan/violet/magenta, bounds rendering at 240/360 pixels, caps updates to 25 fps, and mounts only while visible with motion enabled. No Pro assets, iframe, external CDN, authentication, or paid service is required.

## Visual system

The old override styles and unused faux-cinema components are removed. Reusable arctic colors, editorial display/serif typography, navigation, controls, and media treatments carry through Work, About, the keyboard-accessible technology tabs, Contact, the footer, and all four case studies. Garage and AqarAI keep real playable videos; Munjiz keeps its portrait media and scene presentation. Project claims, links, and media descriptions remain grounded in the existing content.

## Verification

Run with Node 22.7+ (Node 24 used locally):

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
node scripts/serve-export.mjs
CHROMIUM_PATH=/usr/bin/chromium npm run qa:cinematic
# With Playwright-managed browsers installed:
QA_BROWSER=webkit npm run qa:cinematic
```

Controller tests cover no autoplay, no skipped unfinished films, missing completion events, fully buffered last-frame recovery, false/early ended events, active seeks, stalled/rejected playback, stale promises, reverse playback, background recovery, and cleanup. Browser QA plays the original videos, tests desktop wheel and Chromium protocol touch sequences (synthetic events for the WebKit CI path), interrupts and resumes playback, suppresses ended delivery, checks all gallery stops and reverse films, navigates each menu destination, resets/reloads, checks technology keyboard controls, visits every case study, and captures screenshots.

Physical iPhone Safari is not available here. Local WebKit installation was blocked by a network-policy 403 from the Playwright download host. The GitHub workflow has separate Chromium and WebKit jobs; local Chromium results do not establish physical Safari compatibility, device thermal performance, or successful remote CI/deployment. See the accompanying QA report for executed results.

### Executed results

Clean `npm ci`, lint, TypeScript, all **10** controller regressions, the full **desktop and mobile Chromium** journey, and the separate resilience suite passed. The latter holds the first video response, rejects a play request, disables WebGL, and clicks each of the four real selected-card links. Extra **320 × 568** and **667 × 375** checks passed without overflow, with Skip Intro inside the viewport. Desktop/mobile full section and case-page screenshots are available in [the visual evidence index](qa/rebuild/README.md).

Touch QA also exposed and fixed compatibility clicks after swiping a glass link: a valid vertical gesture cancels only its own touchend default action. Taps remain native. Pointer input belongs to the centered project; surrounding CSS3D planes cannot intercept that project's link. Short landscape layouts constrain the frame by available height.

### WebKit CI follow-up

CI could install WebKit even though the local execution network could not. Its first run reported `MEDIA_ERR_SRC_NOT_SUPPORTED` while loading/seeking the second MP4 from Python’s simple HTTP server, which does not implement media byte ranges. QA now uses `scripts/serve-export.mjs`, including `Accept-Ranges`, valid 206 responses, suffix/explicit ranges, HEAD handling, and 416 responses, matching Cloudflare’s media delivery contract. This corrects the test server without transcoding the original films. WebKit results are tracked on the PR.

The range-capable WebKit run passed all forward films and the glass gallery, then exposed a mid-stream reverse-film stall with `paused=false` and no media error. A genuine retry now pauses and re-arms that same decoder before calling play; ordinary scrolling cannot reset the actual-progress stall clock. Browser QA records bounded same-chapter stall retries instead of waiting without interaction, and a dedicated controller regression covers this WebKit state.

Initial `waiting` notifications before a decoded frame now remain in `loading`; they do not masquerade as a mid-stream stall. The WebKit runner also waits for valid metadata before deciding whether a stationary clip needs a same-chapter retry. This keeps loading, playback, and genuine stalled states distinct.
