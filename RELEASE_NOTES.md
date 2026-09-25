# MotionAstra 2.8.2 — Pre-alpha

- All ten Text FX expose a color picker; Apply/Update writes native RGBA colors. Gold/Glass keep their shaded gradients.
- Panning Transition replaces Film Stamp in the Text FX catalog, with direction, distance and fade controls. Existing Film Stamp instances remain loadable.
- Loop mode now includes None (play once, then hold). Static Background freezes the generated design at its start, overriding reverse/manual progress.
- Background duration is a writable numeric field in seconds.
- Quick Tools now align 2D visual layers to composition edges/center and distribute their centers horizontally or vertically. Supports 2D parents; 3D layers/parents are skipped.
- The Create bar adds an installed-font selector: Load fonts, choose a font, then New Text. Current AE font remains the default.
- Preserves single-layer background generation, direct background colors and compact bottom Apply/Update actions.

Replace the full extension folder, restart AE, and confirm 2.8.2 in Settings. For existing Text FX, Load FX Settings, choose a color, then Update to migrate its color binding. Native AE rendering still requires verification; modeled-host and Chromium tests are release gates.
