# Cinematic frame-alignment experiment

Branch fix/cinematic-frame-alignment is intentionally isolated from portfolio-3d-v2 and main.

Diagnosis: all three original MP4 Git blob SHAs are byte-identical between the working pre-Codex version and today's build. Codex replaced per-source persistent video elements with one <video> that repeatedly changes its src, plus a separately painted 1920x1080 canvas. In addition the plane's 100lvh dimension could differ from the mobile stage's 100dvh.

Experiment: restore stable, native <video> surfaces (three original full-quality sources, three reverse sources with lazy src), using the existing finite-state CinematicController and all unchanged sections/Three.js gallery. StableFilmDeck holds a completed film's actual video frame instead of resampling into canvas. It only reveals the incoming video when its start frame has decoded, never rewinds a video that has already started. Clip geometry is fixed at 100% of the cinematic plane, shared by all clips and poster, with no 100lvh/100dvh mismatch.

No modification or transcoding of source footage. Original Codex branch and production remain unchanged.
