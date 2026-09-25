# MotionAstra FX 2.5.4

Offline CEP extension for Adobe After Effects 2025. Minimal black/orange UI, local CSInterface + Lucide, 10 Text FX, 10 procedural Backgrounds, Quick Tools in the third top tab.

Extract this whole folder, follow **INSTALLATION_GUIDE.md**, then open Window → Extensions → MotionAstra FX. The package is unsigned source; no Adobe installation or signing certificate is bundled. No build step or internet connection is needed to use it.

## Source layout

| Path | Responsibility |
|---|---|
| CSXS/manifest.xml | AEFT host range, CEP runtime, panel geometry |
| index.html | Accessible panel, cards, tools and inspector |
| css/style.css | Dark theme, responsive layout, reserved status area |
| js/main.js | Filtering, category state, card Apply, parameter inspector, tool events |
| js/bridge.js | CSInterface evalScript transport, reply validation and recovery |
| jsx/hostscript.jsx | ES3 host, recipes, ownership, timeline and tools |
| presets.json | Authoritative schema: 20 catalog presets + legacy records |
| js/presets-data.js, jsx/presets-data.jsx | Generated offline schema bundles |
| js/preview.js | Illustrative canvas previews for every card |
| vendor/ | Pinned local CSInterface and Lucide with notices |
| catalog.html | Single-file offline preview; cannot apply from a normal browser |
| install-windows.ps1, install-macos.command | Optional per-user installer helpers |
| tests/ | Host model, transport/UI regressions and real-AE smoke script |

Counter and Text Switcher retain the previous controls. Old v2 recipe instances remain editable through Load selected FX; the catalog contains only the 20 current cards. Projects are not migrated automatically.

The host targets AEFT 18.0–25.9; PHXS is omitted because it is Photoshop. This is CEP, not UXP. The standard source distribution is a folder/ZIP rather than a signed ZXP.

Read **EFFECTS_REFERENCE.md** for recipe implementations, **ARCHITECTURE.md** for ownership/timing, and **VALIDATION.md** for test coverage and limitations. The 3D/glass/extrusion effects are stylized 2D simulations. This package has not been rendered in an installed AE runtime here.

## Regenerate edited schema/catalog

```sh
python3 tools/build-data.py
python3 tools/build-catalog.py
```

Python, Node, Playwright and Chromium are developer tools only; they are not panel dependencies.

## 2.5.1 change

Transitions have been removed from the catalog and host engine. The top tabs are Text FX, Backgrounds and Quick Tools. Existing saved transition layers are left intact until explicitly removed using Quick Tools.

## 2.5.2 — minimal UI and creation tools

The Create bar offers New Shape, New Text and New Solid plus a shared shape/solid color picker. New layers start at CTI and end at the composition end. Shape creates editable rectangle geometry; Solid fills the comp. Preview cards use calmer lighting, rounded surfaces and local system typography. The offline catalog includes disabled creation buttons for a faithful UI preview.

## 2.5.3 checkbox hotfix

Fixes overly narrow checkbox normalization. Loop, Reverse and Manual Progress accept booleans, 0/1, explicit on/off/checked/unchecked text, numeric strings such as 0.0/1.0, and single-value containers. Native boxed primitives are unwrapped. Native expression-driven values within 0–1 use the same >0.5 threshold as the generated animation clock. Unknown values are still rejected instead of guessed.

The inspector no longer uses string truthiness, so the string false stays OFF. An invalid loaded value blocks Apply/Update until you explicitly choose its checkbox state. Errors identify panel vs native-control input and show the rejected checkbox value.

Quit AE completely, replace the entire extension folder, restart, and confirm Settings shows 2.5.4. Load the affected layer, set Loop OFF, then Update. If the failure happened before applying an instance, reset the preset and Apply. No project-wide changes are made by installing the patch. If it still fails, copy the full new message from History, including the received value.

The exact value that caused the reported error was not available. Compatibility cases were reproduced in a host model and checked in Chromium; this is not confirmation of the user's particular native AE runtime.

## 2.5.4 JSON transport hotfix

The reported Keep artwork error contains number NaN even though the panel sends a boolean. The host parser now reads true, false and null directly, independently of numeric conversion or regex capture identity. A startup self-check verifies those values before any operation. Invalid numeric values remain errors; NaN is never silently interpreted as OFF.

A regression reproduces the exact error with simulated string-like regex captures and passes after this change. This identifies a fragile parser boundary, but does not establish that Adobe uses those capture types in the affected installation. Native AE verification is still required.

Quit After Effects completely, replace the entire MotionAstra-FX folder, restart and confirm Settings shows 2.5.4. Select a visual layer, enable Keep artwork and retry the anchor tool. If the new transport self-check fails, copy its full message.

## 2.5.5 — clearer Update and bottom Apply

Update on a selected layer without the chosen preset now gives Apply/Load guidance without an error prefix or unnecessary Undo advice. It never applies a new preset implicitly. Apply appears full-width below Customize on every card, and last in the inspector footer. Host regression tests reproduce the original Soft Bokeh message and verify no mutation on mismatched layers. Native AE and browser rendering of this revision remain unverified.
