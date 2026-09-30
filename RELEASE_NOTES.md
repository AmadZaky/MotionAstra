# MotionAstra 3.0.0 — Alpha

- Recovers missing/replaced AE host globals before a queued command; does not replay uncertain mutations.
- Adds a Settings connection report with runtime versions, installed path, native-effect capabilities, selected-layer state and recent operation errors.
- Adds FXTools → Glass Surface, an independent native recipe with tint, distortion, frost blur, beveled highlights and glow. No generated layers. This surface treatment uses selected source pixels, not background refraction or the commercial Glasser engine.
- Keeps Prism Gradient, Bloom Glow and YU recipes unchanged. Formats the panel markup and separates the new recipe from shared transport/validation code.
- Moves release packaging/version checks to the approved 3.0.0 Alpha series.

Close AE, extract the full ZIP, run its installer and restart AE. If Apply/Generate still fails, open Settings → Show connection report and copy its contents. Automated model/browser tests cannot verify native AE rendering. The reported all-effects failure has not yet been reproduced in the user's AE installation; the stale-runtime failure is covered by a regression test.
