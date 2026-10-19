# Content and authentic media audit

Reviewed 19 October 2026. No invented work history, metrics, clients, or qualifications.

## Sources

- User's detailed portfolio brief: identity, education (University of Jordan, CIS, June 2026), skills, contact, public project naming and contribution scope.
- Existing portfolio repository: original README and public/projects/README.md reviewed before implementation.
- Munjiz source at `ef5d28e`: README, frontend dependencies, and backend/project structure. Arabic RTL, FastAPI, PostgreSQL, structured AI consultation, version-bound artifacts and approval controls are supported by source. The brand video is NOT presented as a functional application demo.
- AqarAI source at `0e20e5e`: frontend dependencies, requirements, room analysis schemas, image service, inventory/placement/render service structure. Its transformation visualization is NOT presented as app-generated output or a functional screen recording.
- CISmate source at `1504199`: README, pubspec, network layer and screen structure. The Flutter client is present; Spring Boot/MySQL backend architecture is documented by that project, rather than independently verified as a deployed backend. No future recommendation optimization is claimed as shipped.
- The Framer portfolio could not be retrieved: the environment's network proxy denied access (403). No old photos, CV, employment history, or extra qualifications were inferred.

## Munjiz — completed cinematic edit

The entire 12.03-second original (464×848) was inspected using a 24-frame, half-second contact sheet and closer boundary frames. Three separately encoded H.264 clips preserve the portrait orientation and original motion:

| Clip                | Source interval   | Editorial reason                                                                                 |
| ------------------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| Arrival             | 00:00.80–00:03.30 | Omit the static initial hold; retain the tower approach through the settled presentation studio. |
| Through the studios | 00:03.70–00:07.20 | Curved facade movement connects the exam and project studios.                                    |
| The next chapter    | 00:07.60–00:11.15 | Career studio movement into the work collection, ending after the composition settles.           |

No voiceover, graphic overlay, fake animation, frame interpolation, or aspect-ratio change was added. Audio is removed. Cuts sit between independent scenes; no arbitrary seeking or CSS hiding of a complete source video is used. The complete original and first-pass full delivery copy are NOT in public/ or the Git repository. All three final clips were decoded with FFmpeg and played in Chromium.

`python scripts/edit-media.py /absolute/path/to/original.mp4` reproduces the clips and posters. Original bytes are read only, never overwritten. Source paths remain private, outside Git. `docs/munjiz-edit-decisions.json` records the decisions and delivery file sizes without a private source path.

Homepage: scene 1 in the hero, scene 2 in the Munjiz composition. Case study: one sticky portrait stage progressively switches among three scenes as the adjacent chapters enter view. Previous/next buttons provide a keyboard/touch alternative. Scrolling changes only posters; a video source mounts only on explicit play. Scene changes release the previous player. No hover playback or automatic initial downloads.

## AqarAI — supplied visualization

An owner-supplied 8-second 1920×1080 visualization was inspected at one-second intervals. The selected 00:00.70–00:06.00 excerpt retains furniture assembly and the settled room; it omits the empty opening and later composition replacement. Export: `aqar-transformation.mp4`, 1440×810, 5.3 seconds, silent H.264, fast-start. The project and case study both identify this as a visualization, not application UI or proof of model output.

Reproduce from the source (read only):

```sh
ffmpeg -ss 0.7 -i /absolute/path/to/source.mp4 -t 5.3 -an -vf scale=1440:-2 -c:v libx264 -crf 23 -preset medium -pix_fmt yuv420p -movflags +faststart public/projects/aqar-transformation.mp4
```

## CISmate — authentic application screenshots

`assets/screenshots/7.jpeg`, `8.jpeg`, and `6.jpeg` from the owner's CISmate repository were inspected and encoded to WebP. They show planning preferences, schedule results, and the AI assistant. The admin screenshot containing email addresses was deliberately excluded. No screenshot is stretched; each uses its real intrinsic dimensions. No old personal photography is used.

## Garage Tahmeen — owner-selected scenes integrated

The initial complete recording exceeded the transfer tool's 32 MiB limit. The owner subsequently provided an accessible archive containing three selected scenes (8.53, 8.30, and 4.31 seconds), then explicitly requested no further trimming. All three supplied scenes were visually inspected throughout. No claim is made to have reviewed the inaccessible longer recording.

The delivered scenes preserve EVERY source video frame and the owner's timing:

| Scene            | Owner-selected content                                              | Additional temporal editing |
| ---------------- | ------------------------------------------------------------------- | --------------------------- |
| Vehicle rotation | Front-to-rear vehicle movement and the following section transition | None                        |
| Technical reveal | Scanning movement exposing the vehicle's inner structure            | None                        |
| Driving scene    | Moving road scene with the original Arabic interface                | None                        |

All retain the exact original 1912:824 aspect ratio at 1434×618 (75% resolution), silent H.264/yuv420p, and fast-start. A 22-pixel clipped header fragment contains part of an identity mark; it is masked with a neutral solid strip BEFORE encoding and poster extraction. The first segment also contains a moving introductory paragraph and location line; these known identity-bearing areas are covered using pixel-tracked privacy masks. They remain masked as the page scrolls, including the final section change. This is a privacy redaction, not replacement footage or a fake animation. Car manufacturer marks intrinsic to the supplied scenes are not represented as clients or endorsements. No original automotive client identity or source repository link is included in public content or filenames.

The archive and extracted originals remain outside public/ and Git. `scripts/prepare-garage.py` reproducibly optimizes the same three owner-selected segments without `-ss` or `-t`, verifies unchanged originals, and exports neutral delivery names. `docs/garage-edit-decisions.json` records the non-destructive processing. `lib/garage-clips.json` holds the inspected scene sequence.

Homepage: the first widescreen scene. Case study: a single widescreen stage progressively changes among three scenes, with native playback controls and previous/next scene buttons. A clip mounts only on explicit play; scrolling updates posters without downloading video and releases a previous player. No full-length original recording is served.

## Other unavailable assets

- CV: no actual PDF provided. No disabled or fake download link is shown. Add the newest authorized PDF as `public/ahmad-abulhawa-cv.pdf` and rebuild; hero/contact actions appear automatically.
- Three inline AqarAI UI screenshots and the newer tower image are visible in chat but have no downloadable file paths in this execution environment. They are not re-created or replaced with fake UI. Attach them as accessible image files for integration. Current Munjiz imagery is extracted from the owner's original video, and AqarAI uses its supplied visualization.
- No personal photograph was supplied or recovered. The design is intentionally typography-led.
- Final domain is not selected. Set NEXT_PUBLIC_SITE_URL to the approved HTTPS origin before the approved production build. Until then no invented canonical URL or localhost social image is emitted.
