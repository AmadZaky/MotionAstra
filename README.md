# MotionAstra FX 2.8.4 — Pre-alpha

Offline CEP extension for Adobe After Effects 2025. Minimal black/orange UI, local CSInterface + Lucide, 10 Text FX, 10 procedural Backgrounds, Quick Tools in the third top tab.

Download the release ZIP, extract everything, close AE, then double-click **Install MotionAstra.cmd** (Windows) or **Install MotionAstra.command** (macOS). Confirm replacement of older versions, restart AE, then open Window → Extensions → MotionAstra FX. The GitHub source archive is for development; use the release asset for the ready-to-install package. The package is unsigned source; no Adobe installation or signing certificate is bundled. No build step or internet connection is needed to use it.

## Current workflow

Select a text layer for Text FX. Background Generate needs only an active composition; it creates one layer or updates selected matching instances. Deselect backgrounds to deliberately create another. Customize preserves your draft colors; Generate/Update writes them directly into native Gradient Ramp/Tint properties. These colors do not depend on color expressions.

Loop mode is a dropdown: Ping-Pong, Cycle (default), Continue, None (play once and hold). Continue advances normalized animation time beyond Duration; finite text reveals naturally finish while procedural motion keeps advancing. Manual Progress overrides looping. Existing project expressions stay unchanged until Update; legacy checkbox instances migrate to Cycle unless another mode is chosen.

Apply/Generate and Update are compact adjacent buttons at the inspector bottom. Load FX Settings is in the Tools Bar. Unwanted old duplicate layers are not deleted automatically.

## Versioning and releases

Run `python3 tools/bump-version.py` once before each new code push to main. Versions follow 2.8.1, 2.8.2, etc. CI rejects a push whose version is not the next patch after its parent. After tests pass, CI creates a new prerelease and installable ZIP; older releases are preserved. Re-running the same successful commit does not increment its version.

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

## 2.5.6 — automatic background layers

Background Apply always creates a dedicated layer at the bottom of the active composition and selects it. Background Update edits matching selected instances; if none match (including no selection), it creates one new background using the inspector parameters. Unrelated selected layers remain unchanged. Text Update keeps its existing validation. This supersedes earlier instructions requiring a selected solid or deselecting layers.

All ten backgrounds are covered by modeled-host creation/update regressions. Native AE rendering and the revised browser UI still require manual verification.

## v2.8 — Pre-alpha

Text FX require a selected text layer and never create one implicitly. Use New Text if needed. Background cards offer Customize and Generate Background. Generation needs only an active composition and creates its own layer; selected layers are untouched. Background Update retains the v2.5.6 update-or-generate behavior. The background UI uses a dedicated generateBackground host action. CEP uses numeric version 2.8.0; the GitHub prerelease tag is v2.8-pre-alpha. Native AE rendering and browser layout remain unverified; this is a pre-alpha release.

### Stability build 2.8.0-stability.1 (same v2.8 Pre-alpha release)

- A late status response cannot release the in-flight mutation lock.
- Customize values, including colors, remain in per-preset drafts for this panel session and are used by card buttons. Reset explicitly restores defaults.
- Generate updates matching selected background instances. Deselect all backgrounds to intentionally generate a new copy. Existing duplicate layers are not deleted automatically.
- Color/slider updates preserve background masks and native effects. Count changes rebuild geometry; older builds rebuild once to migrate expressions.
- Preview rendering pauses during host operations, is capped at 30 fps, and stops after one-shot animations.
- Build checks reload an older host implementation even though the public version remains 2.8.0. Settings displays the build identifier.

Thirteen host/state/preview suites pass locally, including reproductions of the late-status race, discarded card colors, repeat generation and idle preview. The release workflow also gates publication on real Chromium UI/checkbox tests. This does not measure native AE render performance or certify native effect behavior. Replace the full extension folder and restart AE. Old duplicated layers must be inspected and removed manually if unwanted.

## MotionAstra 2.8.2 — Pre-alpha

- All ten Text FX expose a color picker; Apply/Update writes native RGBA colors. Gold/Glass keep their shaded gradients.
- Panning Transition replaces Film Stamp in the Text FX catalog, with direction, distance and fade controls. Existing Film Stamp instances remain loadable.
- Loop mode now includes None (play once, then hold). Static Background freezes the generated design at its start, overriding reverse/manual progress.
- Background duration is a writable numeric field in seconds.
- Quick Tools now align 2D visual layers to composition edges/center and distribute their centers horizontally or vertically. Supports 2D parents; 3D layers/parents are skipped.
- The Create bar adds an installed-font selector: Load fonts, choose a font, then New Text. Current AE font remains the default.
- Preserves single-layer background generation, direct background colors and compact bottom Apply/Update actions.

Replace the full extension folder, restart AE, and confirm 2.8.2 in Settings. For existing Text FX, Load FX Settings, choose a color, then Update to migrate its color binding. Native AE rendering still requires verification; modeled-host and Chromium tests are release gates.

## MotionAstra 2.8.4 — Pre-alpha

- Fixes the startup-blocking `Illegal use of reserved word` at hostscript.jsx line 237: the ES3-reserved identifier `native` is now `nativeProperty`.
- Adds an ES3 parser and reserved-identifier release check, because Node's modern parser accepted the incompatible code.
- Release ZIP includes `MotionAstra-FX/`, `Install MotionAstra.cmd`, its PowerShell helper, and `Install MotionAstra.command` for macOS.
- Installers detect existing MotionAstra bundles by manifest ID, including renamed folders in standard user/system CEP locations. They ask before removing active old copies, preserve backups outside CEP, and restore moved copies if activation fails.
- Payload checksums are verified before replacement. Unrelated destination folders and linked payloads are rejected. Protected system installs require manual removal with administrator approval before retrying.
- Installer enables PlayerDebugMode for CSXS 11/12 in the current user account. No AE project files or AE preferences are edited.
- Windows and macOS installer tests, ES3 checks, host regressions and Chromium workflows gate release publication.

Close AE, extract the whole release ZIP, then double-click the launcher for your OS. Confirm replacement when prompted; restart AE and confirm Settings shows 2.8.4. The macOS script is unsigned; if macOS blocks it, use the approved Open action described in the guide. Direct AE rendering remains a manual check.
