# MotionAstra v3.0.8 — Alpha

- Fixed Text Switcher Choice in Compact layout: the source-text expression now reads a native MA2 choice slider, enabling timeline keyframes and direct changes in AE.
- Load settings reads the actual native Choice value.
- Unrelated updates preserve Choice keys and expressions. Explicit panel Choice edits write at the current time for keyed controls.
- Existing compact instances gain the controller on Update without recreating the layer.
- Added guidance distinguishing Choice slider mode from Automatic mode.

Upgrade: restart AE, select the existing Switcher layer, Quick Tools → Load selected FX → Update. Animate MA2 choice in Effect Controls. Native AE rendering remains a manual verification step.
