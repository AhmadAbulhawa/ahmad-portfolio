# Matched intro endpoints

The owner-supplied recording shows a pose jump at film 01 -> 02. The original endpoint lens is about 14% narrower than film 02's opening pose. A runtime dissolve concealed loading but still changed the resting image when the next chapter was requested.

## Playback edit

`01-goggles-on-aligned.mp4` retains all 77 original intro frames at 24 fps. After the original motion finishes, a nine-frame (375 ms) opacity join resolves to the actual decoded frame at 1.5 seconds in `02-dissolve.mp4`, followed by three endpoint holds. The resulting 1080p playback edit lasts 3.708 seconds. Its reverse is generated from that same edit. The three original forward MP4 files are retained byte-for-byte; see [media hashes](qa/intro-matched/media-hashes.json).

The short join is deliberately part of film 01's timeline, before the completed resting frame. It uses the two supplied source images, without optical-flow warping, generated texture, camera transforms, or per-film cover adjustments. At the next user input both sides of the boundary already show the same pose. Compression leaves small color differences; decoded pixels are not asserted byte-identical.

All runtime handoffs now expose matched start frames directly, including reduced motion. The failed 500 ms runtime dissolve and its second full-resolution canvas have been removed. The existing loading hold, single decoder, first-frame readiness, source preparation, input gating, captions, and gallery remain in place.

Rebuild the playback derivatives with `npm run media:intro` (requires FFmpeg), then `npm run build`. Normal hosting builds use the committed MP4 files and do not require FFmpeg.

## Executed verification

- `npm run qa:intro`: all eight 01 -> 02 / reverse 02 -> 01 comparisons pass at 1536 x 720, 390 x 844, 844 x 390, and reduced motion. Measured lens center, width, and height differ by **0 rendered pixels** at every handoff. Full-frame maximum-channel mean differences are 2.00/255 forward and 2.63/255 reverse; fewer than 0.16% of pixels differ by more than 16/255. The media plane does not change size or position.
- `npm run qa:frames`: all three desktop/mobile/fallback journeys pass delayed loading, the 02/03 boundary, forward/reverse playback, gallery return, reset, and incoming start-frame exposure.
- `npm run qa:cinematic`: desktop wheel and mobile Chromium protocol touch journeys pass through all chapters, gallery stops, navigation, and four case studies, without runtime errors or stall retries.
- All 20 controller/input tests, lint, TypeScript, production export and hosting asset-size checks pass.

[Browser recording](qa/intro-matched/preview.mp4) · [Measured intro boundaries](qa/intro-matched/intro-handoff.json) · [Journey report](qa/intro-matched/browser-report.json)

![Landscape immediately before chapter change](qa/intro-matched/recording-landscape-01-to-02-before.webp)
![Landscape immediately after chapter change](qa/intro-matched/recording-landscape-01-to-02-after.webp)

Verification uses local Chromium with mobile viewport/touch emulation, not physical iPhone Safari. Production/main was not deployed or merged by this fix.
