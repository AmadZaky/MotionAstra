# MotionAstra FX 2.5 — Installation & workflow

MotionAstra is an offline CEP panel for **After Effects 2025 (25.x)**. All JavaScript, icons, styles and previews are bundled. No CDN, npm, server, account, downloaded preset pack or third-party AE plug-in is needed to use the panel. After Effects itself is required; this is not an independent desktop renderer, a UXP plug-in, or a ScriptUI .jsx panel.

This source release is unsigned. Browser and modeled-host checks are included; actual AE rendering still requires the supplied smoke test. Do not treat the declared host range as certification for every AE build.

## 1. Upgrade or manual installation

1. Close After Effects.
2. Extract **MotionAstra_FX_v2.5.4.zip**.
3. Back up the old MotionAstra-FX folder **outside** all CEP extension directories. Keep only one installed `com.motionastra.fx` bundle. Do not merge individual v2.0.1 and v2.5 files.
4. Copy the complete **MotionAstra-FX** folder to one location below:

| OS | Recommended per-user path | System-wide alternative |
|---|---|---|
| Windows | `%APPDATA%\Adobe\CEP\extensions\` | `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\` |
| macOS | `~/Library/Application Support/Adobe/CEP/extensions/` | `/Library/Application Support/Adobe/CEP/extensions/` |

The final path must end in `MotionAstra-FX/CSXS/manifest.xml`, with `index.html` alongside CSXS. Do not put it in ScriptUI Panels. Per-user installation does not need administrator privileges.

Optional helpers: after reviewing their contents, run `install-windows.ps1` with PowerShell, or `bash install-macos.command` in Terminal from the extracted folder. These copy to the per-user directory, back up an existing install outside CEP, and enable PlayerDebugMode 11/12. They do not launch AE or alter projects. Do not run the helpers from inside the already-installed extension folder. Manual installation remains fully supported.

## 2. Allow this unsigned development panel

Close all Adobe applications first. Windows **Registry Editor**: create `HKEY_CURRENT_USER\Software\Adobe\CSXS.12` and `CSXS.11`. In each key, create a **String Value (REG_SZ)** named `PlayerDebugMode`, value `1`. It is not a DWORD. Equivalent Command Prompt commands:

```bat
reg add "HKCU\Software\Adobe\CSXS.12" /v PlayerDebugMode /t REG_SZ /d 1 /f
reg add "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f
```

macOS Terminal:

```sh
defaults write com.adobe.CSXS.12 PlayerDebugMode -string "1"
defaults write com.adobe.CSXS.11 PlayerDebugMode -string "1"
defaults read com.adobe.CSXS.12 PlayerDebugMode
```

CEP 12 stores its preference in `~/Library/Preferences/com.adobe.CSXS.12.plist`. Use `defaults` instead of editing a cached binary plist. Restart Adobe apps; log out/in if macOS keeps stale preferences. To restore normal unsigned-panel restrictions, remove these values or set them to `0`.

## 3. AE 2025 preferences and first launch

1. Windows: **Edit → Preferences → Scripting & Expressions**. macOS: **After Effects → Settings/Preferences → Scripting & Expressions**.
2. Enable **Allow Scripts to Write Files and Access Network**. No online service is used; the smoke test uses file access to save its report.
3. **File → Project Settings → Expressions → JavaScript**. Do not use Legacy ExtendScript for generated property expressions. The host automation is still ExtendScript, which is separate from the project expression engine.
4. Restart AE. Open **Window → Extensions → MotionAstra FX**.
5. Open a composition. The footer shows the composition and selected-layer count. Settings shows version **2.5.4**.

The manifest uses **AEFT `[18.0,25.9]`**, CSXS minimum 11.0, minimum panel width 300px and preferred width 380px. `PHXS` is Photoshop, not After Effects, and is deliberately not advertised: this engine uses AE-only APIs. The requested range excludes AE 2026/26.x. CEP 11 and 12 host loading is intended; AE 2025 is the target for native validation.

## New in 2.5.4: Create bar

The refreshed UI uses black surfaces, orange accents and minimal preview cards. The main tabs remain Text FX, Backgrounds and Quick Tools. Expand **Create** in the header to show layer shortcuts:

- **New Shape:** creates a centered, filled, editable rectangle. Width/height are capped at 320px and 40% of composition dimensions.
- **New Text:** creates an editable text layer with “MotionAstra” as its text.
- **New Solid:** creates a full-comp solid using the swatch beside the buttons.

The color swatch applies to newly created shapes and solids, not existing layers or text. Creation works without a selection, selects only the new layer, starts at the playhead and ends at the composition end. Each action is undoable. The original layers stay intact. Near the final frame, the start is capped to leave one visible frame. These are regular AE layers, not preset-owned artwork.

The standalone catalog shows the same Create bar with AE actions disabled. Canvas previews are illustrative, not native AE renders.

## 4. Browse, Apply and Customize

- Search filters the active category immediately. Text FX and Backgrounds contain 10 cards each. The third tab opens Quick Tools.
- Hover or focus a card to play an illustrative canvas preview. These are motion studies, not native AE renders. Native appearance depends on text, frame size and underlying footage.
- **Apply** on a card uses defaults. **Customize** opens duration, appearance, colors and other relevant controls before Apply.
- Select an applied layer and click **Load selected FX** to read its native controls into the inspector. **Update selected FX** changes matching selected instances. A mixed selection reports skipped layers.
- Numeric values, color pickers and checkboxes become native `MA2 …` Effect Controls. Do not rename those controls. Strings such as phrases/prefixes need Update; background Count changes rebuild generated masks on Update.
- One MotionAstra instance per layer. Remove before changing that layer to a different recipe. Existing v2.0.1 recipes remain loadable through Load selected FX, even though their old cards are absent from the new 30-card catalog.
- Menu and Create can collapse independently. Quick Tools is the third top tab; Settings remains in the Create shortcuts row. Main content scrolls; inspector controls scroll separately. At very short heights, scroll the entire inspector to reach Apply. Notifications occupy a reserved footer area and fade after 3.5 seconds; History retains details.

## 5. Text FX

Select unlocked Text layers. With no selection, Apply creates a Text layer at the CTI. With an incompatible selection, it reports the mismatch instead of creating an unrelated layer. Animation starts at each layer's in-point.

Counter Text and Text Switcher retain the v2 workflow: exact start/end numbers, decimals, formatting and prefix/suffix; or up to 12 phrases with a Choice slider/automatic switching. Matrix Code, Counter and Switcher protect existing Source Text keyframes/expressions. Use a clean text layer for those recipes.

Other presets create native Text Animators and, where appropriate, native Gradient Ramp, Turbulent Displace, Gaussian Blur, Bevel Alpha or Drop Shadow. **3D Glass and Gold Extrusion are 2D material/depth simulations**, not renderer-level 3D geometry. See EFFECTS_REFERENCE.md for precise implementations.

Loop is **OFF** by default. Motion holds at its final generated state. Existing footage, user keyframes and unrelated effects keep their own motion. Reverse changes progress direction. Enable **Use progress slider** to drive progress manually. For direct progress mapping choose Linear easing.

## 6. Backgrounds

Select one or more unlocked **Solid layers** to apply. With no selection, a new composition-sized solid is created at the bottom for the composition duration. Precomp/video/text selections are skipped; to generate a background for the active comp, deselect layers first.

Space Nebula and Dark Smoke use native Fractal Noise and Tint. Liquid Gradient uses Gradient Ramp and Turbulent Displace. Other backgrounds use native effects and expression-generated solid masks for grids, rays, rings and soft particles. This is deterministic procedural artwork, not a particle-physics simulator.

Geometric fields and the Glassmorphism card have transparent gaps: place a colored solid beneath them if you need a fully opaque background plate. Nebula, Smoke and Liquid Gradient fill the frame. Use a clean solid for predictable results; your existing masks/effects are preserved and can change the composite.

Changing Count rebuilds only masks named `MA2 artwork …`. Other native sliders respond live. Text/background clocks start at inPoint and use `[FX End]` for duration. Drag End to retime. Update preserves a dragged End unless Duration also changes. Looping is explicit, never forced by a preset name.

## 7. Navigation update in 2.5.4

Top navigation is **Text FX (10) | Backgrounds (10) | Quick Tools**. Quick Tools directly opens the anchor grid, layer arrangement, parenting, easing, appearance and removal controls. It is no longer hidden in the Create shortcuts row. Search is hidden while viewing tools/settings.

All 10 transition presets and their creation/update engine have been removed. Existing transition layers already saved in projects are not automatically deleted or changed. To remove their MotionAstra effects deliberately, select those layers and use Quick Tools → Remove MotionAstra FX; this disables their coverage layers. Old transition instances can no longer be loaded/updated by the inspector.

## 8. Tools and removal

Tools retain the v2 anchor grid/custom percentages, parenting, X/Y/Z offset, six arrangement modes, stagger, rename, unlock, selected-key easing and text appearance.

Anchor supports Text, Shape, Solid, Footage, Precomp and Null layers, with keyed/separated Position, parenting and 3D. Cameras/lights have no Anchor Point. Locked layers are skipped. **Keep artwork at the playhead** preserves that frame using AE's coordinate conversion; changing the pivot can alter other frames when scale/rotation animate. Existing keys and expressions are offset, not deleted.

**Remove MotionAstra FX** removes generated controls, expressions, text animators, masks and tagged markers from selected unlocked layers, preserving unrelated effects. **Erase ALL effects** also removes the entire native/third-party Effects stack on those layers; unrelated expressions and non-MotionAstra text animators remain. Both require an inline confirmation. They never delete unselected layers.

Removing a transition disables its layer so the white coverage source cannot accidentally obscure footage. Its generated project source is retained; remove unused sources manually if desired. Removing a procedural background leaves its original solid. Original user comments and non-MotionAstra markers are retained. Undo is available; multi-layer operations report successful and skipped layers.

## 9. Troubleshooting

**Panel missing:** check exact nesting, only one installed bundle, host version range, correct REG_SZ debug values and restart. AE 26.x is intentionally outside this manifest. The runtime-specific debug preference must match the CEP runtime installed with your AE.

**Blank/white panel:** all files must be copied, including `js/`, `jsx/`, `vendor/` and `presets.json`. Open the panel, then inspect `http://localhost:8098/` with a Chromium browser. `.debug` sets port 8098 for AEFT. Change that port if occupied. Console/Network identifies missing assets. There is no CDN to unblock.

Temporary diagnostic logs:

```bat
reg add "HKCU\Software\Adobe\CSXS.12" /v LogLevel /t REG_SZ /d 6 /f
```

```sh
defaults write com.adobe.CSXS.12 LogLevel -string "6"
```

Inspect `%TEMP%` on Windows or `~/Library/Logs/CSXS/` on macOS; restore LogLevel to 1 afterward. If logs explicitly show a GPU failure, temporarily test `--disable-gpu` in a manifest CEFCommandLine parameter, then remove it after diagnosis.

**Unexpected end of JSON / invalid checkbox:** replace the entire extension rather than mixing versions. The bridge validates replies and recovers a lost response without repeating the mutation. Boolean controls accept true/false and canonical 0/1 values; the string `false` is not treated as ON.

**Native effect/schema error:** native match names and explicit property mappings are isolated in hostscript.jsx. Run the AE smoke test and inspect the report for your AE build. The modeled-host tests cannot establish Adobe's actual schemas. Failed fresh applications remove their own partial effects; an Update can partially change a layer, in which case use one Undo before retrying.

**Native controls disappeared:** do not rename/delete `MA2` controls or encoded layer-comment metadata. Undo the edit or Remove/reapply deliberately. Legacy v1 instances are not editable in this inspector; remove them before applying a v2.5 recipe. Existing v1 projects are not automatically changed.



## 10. Native validation before production work

In a disposable AE project run **File → Scripts → Run Script File → tests/AE_SMOKE_TEST.jsx**. It creates 20 effect fixtures, checks generated expressions, exercises anchors/tools and offers a report. Inspect failures and RAM-preview every fixture over meaningful footage. Browser previews do not prove AE rendering or native effect parameter compatibility.

Developer tests require Node; the UI test additionally needs Playwright and Chromium. None of those are panel runtime dependencies. See VALIDATION.md.

## Official references

- CEP resources, host IDs, manifest and runtime: https://github.com/Adobe-CEP/CEP-Resources
- AE layer properties / adjustment behavior: https://helpx.adobe.com/after-effects/desktop/work-with-layers/layer-properties/layer-properties.html
- Distortion effects: https://helpx.adobe.com/after-effects/using/distort-effects.html
- Noise and grain: https://helpx.adobe.com/after-effects/using/noise-grain-effects.html

MotionAstra uses an original UI and procedural recipes. It includes no proprietary Mister Horse or Motion Bro assets/code.

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

## 2.8.1 current behavior (supersedes earlier Loop OFF guidance)

The loop checkbox is replaced by Ping-Pong, Cycle (default), and Continue. Continue advances time beyond the duration; bounded text reveals finish naturally. Manual Progress overrides the mode. Old instances keep their stored expressions until Update, which migrates them to the selected mode. Generate writes colors directly into native Ramp/Tint values. Background color changes apply on Generate/Update. Only one layer is created; selected matching backgrounds are updated instead. Apply/Generate and Update are adjacent compact bottom buttons; Load FX Settings is in the Tools Bar.

Use the ZIP attached to the v2.8.1-pre-alpha release. Future code pushes must increment the patch via tools/bump-version.py; CI verifies the increment before publishing. Native rendering is still not certified.

## MotionAstra 2.8.2 — Pre-alpha

- All ten Text FX expose a color picker; Apply/Update writes native RGBA colors. Gold/Glass keep their shaded gradients.
- Panning Transition replaces Film Stamp in the Text FX catalog, with direction, distance and fade controls. Existing Film Stamp instances remain loadable.
- Loop mode now includes None (play once, then hold). Static Background freezes the generated design at its start, overriding reverse/manual progress.
- Background duration is a writable numeric field in seconds.
- Quick Tools now align 2D visual layers to composition edges/center and distribute their centers horizontally or vertically. Supports 2D parents; 3D layers/parents are skipped.
- The Create bar adds an installed-font selector: Load fonts, choose a font, then New Text. Current AE font remains the default.
- Preserves single-layer background generation, direct background colors and compact bottom Apply/Update actions.

Replace the full extension folder, restart AE, and confirm 2.8.2 in Settings. For existing Text FX, Load FX Settings, choose a color, then Update to migrate its color binding. Native AE rendering still requires verification; modeled-host and Chromium tests are release gates.
