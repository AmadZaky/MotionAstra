# MotionAstra 3.0.1 — Alpha

- Fixes the reported host startup error `SyntaxError: Expected: : (line 380)` in v3.0.0.
- Replaces nested true-branch ternaries in checkbox conversion and compact expression serialization with explicit if/else. Simplifies the same pattern in easing status reporting.
- Adds an ExtendScript compatibility gate rejecting this pattern in shipped JSX. Standard ES3 parsing alone did not catch the incompatibility reported by AE.
- No changes to effect recipes, Glass Surface settings or panel layout.

Close After Effects, extract the complete ZIP, run the installer and restart AE. Settings should report version 3.0.1. Native AE is not available in the build environment; if another error appears, share Settings → Show connection report.
