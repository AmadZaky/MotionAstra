# ZxT-Motions v3.6.0 — Control & Reliability Pre-release (Windows only)

- Adds a compact, read-only Layer Inspector with names, types, locks, core FX, Text Animate phases, native effects and contextual Load settings actions.
- Makes Apply/Update selection-aware, with actionable guidance for missing compositions, wrong types, locked layers and stale loaded targets. Existing host validation remains authoritative.
- Labels AE-keyframeable Progress/Choice controls separately from panel settings. Explicit slider edits write at the playhead; unrelated updates preserve animated controls in compact and individual layouts.
- Preserves native color keyframes and expressions during unrelated edits. Blocks explicit edits that would override custom expressions, and blocks Count rebuilds that would remove custom artwork animation.
- Refreshes existing background expressions across builds without recreating artwork solely because the version changed.
- Protects manually animated Text Animate phases against silent replacement, while retaining explicit Remove and independent IN/OUT editing.
- Adds local Favorites and Recent filters across core presets and Text Animate. Recent contains the last 20 successfully applied/updated presets.
- Changes Text Animate preview copy to **Motion**. Keeps square previews, Studio layout, five accents, dark/light mode and existing tools.
- Adds selection, storage, keyframe-preservation and browser regression tests; packages the same features in the offline catalog.

Windows-only online setup, integrity checks and rollback remain unchanged. Package and installer are unsigned. Browser/model and Windows CI tests do not replace manual rendering and timeline checks in After Effects 2025.
