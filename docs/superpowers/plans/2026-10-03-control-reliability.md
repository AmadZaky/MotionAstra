# Control & Reliability Implementation Plan

**Goal:** Deliver the approved v3.6 features: selected layer context, clear animation controls, Favorites/Recent, and Motion preview copy.
**Architecture:** Extend the read-only status response with bounded layer metadata. Separate selection presentation and local collection persistence from the core panel. Keep existing host target checks authoritative; preserve native animation during unrelated parameter updates.
**Tech Stack:** Offline CEP JavaScript/CSS, ES3 ExtendScript, localStorage, host-model and Chromium regression tests.
**Spec:** User-approved items 1, 2 and 3 in this conversation; no new FX, no Save My Preset, no expanded preview engine.

## Constraints
- Windows / AE 2025; retain existing bundle and control names.
- Next release v3.6.0 pre-release; one push after validation.
- Text Animate preview says exactly Motion, including catalog.
- Never silently remove user keyframes/expressions on Update.

## Review focus
- No comp, no selection, locked and mixed layers: safe actionable status.
- Stale loaded target: disable Update; preserve backend target guard.
- Poll returning during mutations: never unlock controls.
- Invalid/storage-denied favorites and recents: usable fallback, bounded history.
- Native animation on backgrounds and progress: unrelated updates preserve keys.

## Tasks
- [x] Add selection-context host tests, read-only response and independent UI module; per-layer FX names and Load buttons; eligibility and stale-target tests.
- [x] Add keyframe-preservation tests; protect Progress/Choice and native colors, avoid version-only background rebuilds; display live-control vs panel-setting labels and keyframe guidance.
- [x] Add bounded collection store tests; star buttons and All/Favorites/Recent filters across core and Text Animate; record successful application only.
- [x] Change preview text to Motion; bump approved minor version; rebuild offline catalog and documents.
- [ ] Run host/browser/packaging gates, review diff, push and verify Windows CI and release assets. Native AE rendering remains a manual validation requirement.

## Local verification

- 32 host/model suites, ES3 parsing, Windows-only package checks and approved version migration check passed.
- 10 Chromium suites passed, including new inspector/collections tests and existing create, curve, font, theme, search and animation workflows.
- Native AE rendering is not available in this environment. Windows installer tests and release assets are verified in CI after push.
