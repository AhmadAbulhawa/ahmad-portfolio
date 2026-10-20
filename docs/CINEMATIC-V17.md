# V17 — real iPhone stuck at stage 02 and unwanted continue-film button

User-provided iPhone Safari screenshots show Stage 01 displaying an intrusive TAP TO CONTINUE FILM button, and Stage 02 (Design with Purpose) freezing at the last goggles shot. Fix the underlying state machine rather than showing a playback button.

Video stage completion now accepts the normal HTMLMediaElement ended event, plus a conservative last-frame recovery when the actual player is stopped at duration - 90ms or closer. This correctly handles Mobile Safari failing to dispatch its ended event. On the next swipe, if the actual video is confirmed complete, the state machine completes Stage 02 and immediately begins Stage 03. If the clip is not finished, any swipe or tap re-attempts play() of the SAME video in the user's activation context, WITHOUT skipping to the next chapter. No automatic time seek or generated reverse frames are involved.

The floating continue button and its state/CSS are completely removed. No other portfolio sections or original high-quality MP4 sources changed. The visual QA script reproduces the missing-ended iPhone case explicitly, and verifies that the continue button does not exist in the DOM.
