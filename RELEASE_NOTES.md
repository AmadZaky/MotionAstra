# MotionAstra 2.8.9 — Pre-alpha

- Fixes FXTools failing with a YU Txt Motion command/module error: each collection now loads independently and registers an explicit versioned host handler.
- Separates Prism Gradient and Bloom Glow implementation files, and makes each command route explicit.
- Text Apply / Update refreshes matching instances without adding duplicate controls, including mixed selections.
- Tools Bar Load settings follows the active collection. Loaded YU/FXTools editors show Save changes; removing the loaded setup restores Apply.
- Preserves existing presets, native parameter protection, serialized commands and no-replay recovery.

Close After Effects, extract the complete release ZIP, run its installer, then restart AE. Native AE rendering remains a manual verification step; automated tests use an AE model and Chromium.
