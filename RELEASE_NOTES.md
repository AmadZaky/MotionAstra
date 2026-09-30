# MotionAstra 3.0.2 — Alpha

- Bloom Glow: writes RGBA to Fill Color (`ADBE Fill-0002`), not Horizontal Feather.
- Shared Glow: sets Glow Based On to Color Channels, and writes threshold/radius/intensity to `ADBE Glo2-0002` / `0003` / `0004`.
- Prism and Glass: convert Blend With Original from UI percentages to the range reported by the native Gradient Ramp property. Glow threshold uses the same percentage conversion.
- Adds strict contract tests reproducing the reported scalar/color and out-of-range errors. Covers both 0–1 and 0–100 percentage ranges, plus updates and correct Glow routing.
- Native write errors now identify the exact owned effect and parameter match name. Existing rollback remains enabled.

Close AE, install the complete ZIP and restart. Settings should show 3.0.2. Failed applications in prior versions were rolled back; select your visual layer and Apply again. Native AE rendering is not available in the automated test environment.
