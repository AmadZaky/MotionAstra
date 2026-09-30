# MotionAstra 2.8.7 — Pre-alpha

- Adds Motion Curve: interactive Bézier graph, draggable/keyboard handles, exact coordinate fields, eight easing shapes, Mirror, Reset and motion preview.
- Apply writes native temporal easing to adjacent selected keyframe intervals without changing their time/value or adding expressions.
- Includes guards for unsupported values, active expressions, roving keys and curved spatial paths with nonzero endpoint speed. Native write failures attempt per-property rollback.
- Adds a refreshed dark/light panel theme with a header toggle. The selected theme and last curve persist locally.
- Retains 20 MotionAstra presets, all 120 YUGraphic text presets and existing workflow tools.
- Adds host conversion/rollback and Chromium graph/theme tests.

Close AE, extract the full ZIP, run the installer, restart AE and confirm version 2.8.7. In Motion Curve, select adjacent AE property keyframes, shape the graph and click Apply Curve. The graph is normalized progress, not the native raw speed graph. Native AE visual verification is still required.
