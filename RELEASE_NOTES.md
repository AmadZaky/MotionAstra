# MotionAstra 2.8.8 — Pre-alpha

- Adds the extensible FXTools tab, starting with Prism Gradient and Bloom Glow.
- Prism offers editable two-color palettes, gradient placement/angle/spread, linear/radial modes, optional looping rotation, organic distortion, diffusion and glow.
- Bloom combines three native Glow scales with radius, intensity, threshold, falloff and optional source tint.
- Apply updates existing named effects without generating layers. Both tools can coexist on the same layer.
- Load/Update binds to the loaded layer; Remove affects only the chosen FXTools stack. Native animated parameters are protected, and failed writes attempt rollback.
- Uses built-in AE effects, with no extra plugin dependency or parameter-only sliders. These are artistic approximations, not the Cosmic or Deep Glow rendering engines.
- Adds host and Chromium tests for both effects and the FXTools workflow.

Close AE, extract the complete ZIP, run the installer and restart AE. Open FXTools, select a visual layer, Customize and Apply FX. Native AE rendering is still a manual verification step.
