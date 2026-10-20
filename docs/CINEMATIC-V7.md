# Cinematic V7
- 3 chapters only: name / design quote / goggle shatter (instead of 9 sentences).
- Intro frame stays static on page load; starts after first user scroll. Intro playbackRate 1, other clips 1.5.
- Film is full-bleed on desktop, 100% viewport width and height, using the ORIGINAL 1920x1080 files without recompression.
- Mobile keeps object-fit:contain.
- Helix has four stops. Each stop automatically CSS-animates the four glass project planes to a new 3D pose in 1050ms; no scrubbed frames. Native scroll controls which discrete destination is selected; wheel/touch remain browser-owned.
- QA checks first frame paused, real media count, fullscreen geometry, transitions and navigation.
- DO NOT change main until explicit approval.
