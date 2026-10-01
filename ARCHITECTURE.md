# MotionAstra architecture

The runtime has three layers: local HTML/CSS/JavaScript; a serialized CSInterface transport; and an ES3-compatible After Effects host. The schema is compiled into local JS/JSX so file:// fetch restrictions do not prevent startup. No Node integration, external server, CDN, eval of user payloads, or internet access is required.

## Bridge

js/bridge.js resolves the extension root via CSInterface and loads jsx/presets-data.jsx then jsx/hostscript.jsx using absolute File paths. It checks the host version. Requests are URI-encoded JSON passed to MotionAstra.dispatch. Replies are tagged and correlated by request ID. A lost/empty CEP reply is recovered from a host mailbox; the host mutation is never automatically replayed. Status polling shares the same promise queue. An unconfirmed operation asks the user to inspect the timeline before retrying.

The host contains a data-only JSON parser/encoder for ExtendScript without a guaranteed JSON global. It rejects invalid parameter types before installing an effect. Checkbox normalization prevents string false from being interpreted as true. Every mutating action has one Undo group; per-layer results show skips/failures. A fresh failed instance cleans its own partial controls. Updates can be partial and explicitly report Undo guidance.

## Schema and compatibility

presets.json has exactly 20 public recipes. Legacy v2 records are separate and remain loadable but are not rendered as cards. Counter/Switcher retain their IDs. A layer can carry one instance. Layer-comment metadata records recipe, token, settings and version; unrelated comment text is retained. Native controls keep the MA2 naming convention for v2 compatibility. The package does not rewrite old projects on load.

## Expressions and ownership

Expressions use a tagged prefix. Only tagged expressions, generated MA2 animators/effects/masks and token-specific markers are removed by the owned-removal tool. User masks, comments, effects and marker text are preserved. Erase ALL explicitly clears the full Effects stack on selected layers in addition to owned animation. Transition removal disables its coverage layer and keeps the project source; no project-wide deletion is performed.

Text/background clocks use layer.inPoint plus End marker time, bounded one-shot progress, optional loop, easing, reverse and manual progress. New instances default to compact layout: one native MA2 MotionAstra Progress Slider Control, with typed parameter values stored in layer metadata and embedded in owned expressions on Update. Colors also write directly to native rendering effects. Individual layout retains separate live controls for advanced keyframing. Existing instances remain individual until explicitly converted. Structural Count is reconstructed only on Update. Native background masks are deterministic and bounded in count.

Transition creation/update code was removed in 2.5.4. Only recognition for explicitly removing old transition instances remains; it disables the coverage layer after cleanup.

## Layer tools

Anchor conversion evaluates an ephemeral Point3D Control expression using toWorldVec and parent.fromWorldVec, then removes the probe. The same compensation is applied to keyed, separated or expression-driven Position. Original expressions are wrapped with an additive offset, and repeated offsets merge. Snapshot rollback restores affected properties if a pivot write fails. Current-frame preservation is deliberate; it is not a promise to preserve all frames when rotations/scales animate.

Layer ordering manipulates only selected layers and preserves their relative order where appropriate. Parenting uses a controller at the average selected world anchor, with a 3D null if needed. Camera/light anchors and locked layers are reported as skips. No all-project cleanup is hidden inside a workflow action.

## UI

The main region and inspector have independent scrolling. Search lives in the collapsible top navigation. Quick Tools occupies the third main tab. Settings lives in the independently collapsible Quick shortcuts row. Footer space is reserved for status and a 3.5-second notification. Every card offers Apply defaults and Customize. Destructive removal uses an inline review region. Browser-only mode disables host actions.

See VALIDATION.md for the distinction between modeled host testing and actual native AE rendering.

## 2.5.4 creation actions

New Shape constructs a regular native filled path; New Solid uses composition dimensions and the requested RGB color; New Text retains native editable text. Creation requires an active comp, not a selection, and selects only its result. New shape/solid validates color before adding layers, removes its own partial layer on construction failure and uses the shared Undo dispatcher. The Create bar and standalone catalog share the same local UI.

## Compact controls and FX Tweaker

FX Tweaker loads one selected instance and binds updates to its composition, layer and instance token. A changed selection is rejected before mutation. Parameter search and collapsible groups organize settings without adding AE controls. Ordinary parameter updates preserve keyframes/expressions on the master progress slider. Enable Manual Progress to drive animation with that slider. End markers remain the timing source.

Compact old controls is explicit and refuses animated parameter controls or external effect-expression dependencies. Conversion preserves native rendering effects and user artwork. Compact means one parameter controller, not one total Effects-stack entry: native Ramp, Blur, Bevel and other rendering effects remain necessary. Settings offers Individual controls for advanced keyframing.

## YU Txt Motion integration

The original MIT YUGraphic core and host source are vendored unchanged. `tools/build-yu.py` bundles them with `src/yu-adapter.js` into `jsx/yu-text.jsx`. Build-time adaptation omits the original per-parameter sliders; expression generation substitutes validated numeric constants for the five original effect lookups without changing motion math or text animator setup. The bridge loads this module only when a YU command is requested. All mutations use the existing serialized transport and Undo dispatcher.

YU uses its original `YTM IN |` / `YTM OUT |` ownership names, independent of MA2. Phase settings are stored in a delimited layer-comment record, preserving other comments. YU Load/Update is separate from the MotionAstra FX Tweaker and checks layer identity. Main owned-removal also removes YU animators so Erase ALL cannot strand slider expressions from original YU instances. `js/yu-text.js` renders the separate category/filter/editor UI; only an active preview animates.

## Motion Curve

`js/motion-curve.js` owns an SVG Bézier editor, presets, time-inverted progress preview, bounded one-shot playback and local curve persistence. `curveTool` maps cubic handle X to temporal influence and normalized slope to native speed using keyframe value delta / time delta. Spatial properties use scalar path speed; nonzero endpoint speeds require zero spatial tangents to avoid assuming chord length equals curved arc length. Zero endpoint speeds work on curved paths without an arc-length approximation.

Writes are planned per property across adjacent selected keyframes. Opposite endpoint handles/interpolation, times and values are retained. Edited keys lose temporal auto/continuous coupling; roving and active-expression properties are skipped. A native failure restores snapshots for that property and reports rollback failure with Undo guidance. `js/theme.js` applies the stored root theme before paint; CSS tokens style the complete panel shell.

## FXTools collection

`fx-tools.json` defines an independent effect registry. `tools/build-fxtools.py` compiles UI data and the ES3 `MotionAstraFXTools` adapter; the bridge loads it only for FXTools commands. `js/fx-tools.js` renders cards and parameter groups from the registry. Native descriptors use effect/parameter match names. Prism uses Gradient Ramp, Turbulent Displace, Gaussian Blur and Glow; Bloom uses optional Fill and three native Glow scales. No extra layers or parameter sliders are created.

Per-effect settings are stored in the layer's MA_FXTOOLS comment record, separate from MA2 and YU. Named effect instances are updated in place; duplicates/mismatched effects and animated controlled parameters are rejected. Native parameter snapshots and enabled states are restored after a failed write, and partial new effects are removed. Loaded-target tokens guard Update. Cleanup is scoped to MAFT prefixes. Future tools need a registry entry, native adapter and test coverage.

## Command isolation (2.8.9)

The bridge boots only core data and host. Optional modules explicitly export versioned handlers into `$.global.MotionAstraModules`, including when evalFile runs in a local scope. Every command has its own dispatcher route. A missing YU module cannot block FXTools and vice versa; module errors do not trigger mutation retries. Owned cleanup reads ownership names/comments without loading optional engines.

Prism descriptors live in `src/fx-tools/prism-gradient.js`; Bloom descriptors live in `src/fx-tools/bloom-glow.js`. `src/fx-tools-host.js` contains shared validation, persistence and rollback. Run `python3 tools/build-fxtools.py` after editing these sources. Original YUGraphic vendor sources remain unchanged.

## 3.0 Alpha runtime and Glass Surface

Initialization validates the live global dispatcher before each serialized command, rather than trusting a panel-only ready flag. Only absent/incompatible hosts reload. Optional YU/FXTools engines remain lazy and independent. Settings diagnostics are a read-only host action outside Undo groups.

`src/fx-tools/glass-surface.js` contains the new surface descriptor; `fx-tools.json` owns its inputs. The shared adapter continues to validate, snapshot and roll back native effect writes. It intentionally has no source replacement or scene duplication. Build with `tools/build-fxtools.py` and `tools/build-catalog.py`. Release version is numeric 3.0.0 with an `-alpha` asset/tag suffix; subsequent pushes increment its patch.

## Windows setup UI

`installer/windows/Launcher.cs` compiles to a windowed .NET Framework executable. It launches `Installer/WindowsUI.ps1` using local Windows PowerShell 5.1 with no console window. The WPF view is `Window.xaml`. All UI control access stays on the STA dispatcher. File work runs on a separate PowerShell runspace; a synchronized state object carries progress and confirmation requests.

The existing backend accepts optional confirmation/progress callbacks, retaining its CLI defaults. Replacement is confirmed before any old installation moves. The transaction retains its checksum verification, backups and rollback. Windows CI builds the executable and renders the WPF window before release packaging.
