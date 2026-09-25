# Validation — MotionAstra 2.5.4

## Automated coverage and run status

- **static.cjs:** offline asset graph, schema bundle parity, unique HTML IDs, manifest target/geometry, catalog self-containment and default Loop OFF.

- **engine.cjs:** 20 recipes, 10 per category; actual host dispatch against a deterministic AE model; Apply/Load/Update/reload/removal; legacy v2 recipes; wrong target handling; protected Source Text; false/0 checkbox forms; removed transition IDs are rejected; source-code parsing.
- **expressions.cjs:** evaluates the generated recipe expressions at start, quarter, middle, end and post-end times; checks finite mask coordinates/scalars and Loop OFF hold. This exercises expression math, not AE's effect renderer.
- **bridge.cjs:** actual generated evalScript + host in VM; quoted/Unicode install paths; empty/undefined/null/EvalScript-error reply recovery without replay; invalid replies; initialization and Undo failures; queue serialization.
- **tools.cjs:** all nine anchors across five visual source types, negative scale/rotation, 3D-parent probe consumption, keyed/separated Position, expression offset merging, locked/camera skips, six reorder modes, stagger, rename, easing, styling, parent and unparent.
- **ui.cjs:** actual headless Chromium with the actual host dispatcher behind an AE model; all 20 Apply/Update workflows; exact number edits; native controls loaded back; widths 300/320/380/768/1200; short-height access; persistent collapsible sections; reserved footer; confirmation/cancel; 3.5-second notifications/history; browser-only disabled actions. Screenshots are included.

Commands from this folder:

```sh
node tests/static.cjs
node tests/engine.cjs
node tests/expressions.cjs
node tests/bridge.cjs
node tests/tools.cjs
# Install Playwright in your test environment and supply a compatible browser:
CHROMIUM_PATH=/path/to/chromium node tests/ui.cjs
```

The UI test resolves Playwright normally, or from CODEX_PRIMARY_RUNTIME_NODE_MODULES when supplied by the development runtime. No dependency downloads happen inside the panel.

## Required real-AE gate — not run here

There is no installed After Effects runtime in this environment. **Actual native effect schemas, visual appearance, performance, CEP docking, OS installer behavior and rendering have not been certified.** The host model intentionally cannot prove those properties.

Run tests/AE_SMOKE_TEST.jsx in AE 2025 using File → Scripts → Run Script File, in a disposable project. It creates fixtures without erasing existing compositions, evaluates expressions, tests parented 3D anchors and tools, and offers a text report. It selects JavaScript as the expression engine for this test project. Review all failures and preview every recipe. Validate 8/16/32-bpc output and your intended resolution.

Native parameter assumptions are isolated in nativeParam/findNative in jsx/hostscript.jsx. Fractal Noise Evolution uses the stable `ADBE Fractal Noise-0023` identifier (not Evolution Options -0024); Contrast uses -0004. Directional Blur uses ADBE Motion Blur. These mappings were cross-checked against public source fixtures where available; that does not substitute for the installed AE gate.

Installer helpers were inspected and shell syntax checked, not executed on a user's Windows/macOS system. They are optional; the manual install steps are authoritative.

Canvas previews are original illustrative studies, not frame-accurate previews of AE's native image-processing algorithms. 3D Glass and Gold Extrusion are documented 2D simulations. Geometric background patterns have transparent gaps.

2.5.1 navigation checks: third tab opens Quick Tools even when Quick shortcuts are collapsed; offline catalog exposes tools; removed transition IDs reject Apply/Update before layer creation.

2.5.2: creation tests validate shape geometry/fill, solid color/comp dimensions, CTI in/out points, exclusive selection and rejection of invalid colors. Browser checks exercise all three creation buttons and the color picker. The black/orange layout is checked at narrow and short sizes. Native AE creation/rendering still requires the included smoke test.

2.5.3: tests/checkboxes.cjs checks accepted forms for Loop/Reverse/Manual, boxed native values, native fractional threshold, invalid input rejection before mutation, and useful error diagnostics. tests/checkbox-ui.cjs verifies false/off/0.0 stay unchecked and invalid loaded values block Apply/Update until explicitly corrected. Existing expression tests confirm one-shot hold with Loop OFF. The reported user's exact raw checkbox value remains unknown.

2.5.4: parser-boundary.cjs reproduced the exact Keep artwork number NaN error before the parser change, using simulated string-like RegExp captures. After the change, actual host dispatch preserves both Keep artwork and Loop states. The simulation is not evidence of native Adobe capture behavior. Host initialization additionally checks JSON boolean/null/number decoding.

Current hotfix run: static, engine, expressions, bridge, tools, checkboxes and parser-boundary passed. Browser tests could not be rerun because the Chromium executable is unavailable in this session. Browser coverage and screenshots above are retained from the previous release; this hotfix changes the host parser, not UI code.

## 2.5.5 — clearer Update and bottom Apply

Update on a selected layer without the chosen preset now gives Apply/Load guidance without an error prefix or unnecessary Undo advice. It never applies a new preset implicitly. Apply appears full-width below Customize on every card, and last in the inspector footer. Host regression tests reproduce the original Soft Bokeh message and verify no mutation on mismatched layers. Native AE and browser rendering of this revision remain unverified.

## 2.5.6 — automatic background layers

Background Apply always creates a dedicated layer at the bottom of the active composition and selects it. Background Update edits matching selected instances; if none match (including no selection), it creates one new background using the inspector parameters. Unrelated selected layers remain unchanged. Text Update keeps its existing validation. This supersedes earlier instructions requiring a selected solid or deselecting layers.

All ten backgrounds are covered by modeled-host creation/update regressions. Native AE rendering and the revised browser UI still require manual verification.

## v2.8 — Pre-alpha

Text FX require a selected text layer and never create one implicitly. Use New Text if needed. Background cards offer Customize and Generate Background. Generation needs only an active composition and creates its own layer; selected layers are untouched. Background Update retains the v2.5.6 update-or-generate behavior. The background UI uses a dedicated generateBackground host action. CEP uses numeric version 2.8.0; the GitHub prerelease tag is v2.8-pre-alpha. Native AE rendering and browser layout remain unverified; this is a pre-alpha release.

### RGBA hotfix (same v2.8 prerelease)

Color expressions now read the explicit Color Control property match name and return four numeric RGBA components. Legacy gradient interpolation also computes each component explicitly. Expression tests enforce four-component output for Ramp and Tint at five times, under both normal lookup and a simulated scalar numeric-lookup failure. This simulation reproduces the dimension symptom; it does not establish the precise cause in native AE. Ten host suites pass. Native AE validation remains required.

After replacing the extension and restarting AE, generate a fresh background. Existing instances retain their stored expressions until Update rebuilds them.
