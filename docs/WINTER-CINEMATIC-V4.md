# Winter Cinematic V4 — interactive project journey

Changes:
- The ski photograph is scaled *to width* on phones rather than fill/cover height (avoids giant face crop; goggles top remain visible).
- Custom animated SVG goggle lens: drops over the face, detaches into the black scene, rotates, and dissolves into a four-project floating glass gallery.
- Four keyboard- and touch-accessible cards: Munjiz, AqarAI, Garage Tahmeen, CISmate, linking to existing case-study pages.
- Gallery is inert until fully visible; mouse/keyboard focus is not trapped.
- Separate progressive scroll transforms run on all case study panels, Work/About/Skills/Contact and reverse when scrolled upward.
- Winter palette contrast fixes for the white About and Munjiz sections.
- No scroll hijacking; reduced-motion, no-JS fallbacks.

This is an original motion design inspired by the Firnlight cinematic *technique*, not a licensed reproduction of the paid template or a claim of a true photographed goggle frame sequence. The goggles are an authored SVG prop instead of actual animated film frames.

Validation: npm run lint; npm run typecheck; npm run build; and device-specific QA.
Do not merge to main without approval.
