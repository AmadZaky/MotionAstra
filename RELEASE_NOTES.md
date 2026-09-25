# MotionAstra 2.8.1 — Pre-alpha

- Background generation adds only one layer per request; repeat Generate updates matching selected backgrounds.
- Selected colors are written directly to native Gradient Ramp/Tint RGBA properties on Generate/Update.
- Replaced Loop checkboxes with Ping-Pong, Cycle and Continue dropdowns for Text FX and Backgrounds. Cycle is the default. Manual Progress overrides looping.
- Compact Apply/Generate and Update buttons sit side by side at the inspector bottom. Load FX Settings lives in the Tools Bar.
- Existing checkbox-based projects migrate when updated; no automatic project-wide changes or duplicate-layer deletion.
- Patch version increments are now required on each code push. Older releases remain available.

Install the full ZIP and restart AE. Confirm 2.8.1 in Settings. Native AE rendering still requires verification; modeled-host and Chromium tests are release gates.
