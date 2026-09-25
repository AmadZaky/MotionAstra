# MotionAstra 2.5 architecture

The runtime has three layers: local HTML/CSS/JavaScript; a serialized CSInterface transport; and an ES3-compatible After Effects host. The schema is compiled into local JS/JSX so file:// fetch restrictions do not prevent startup. No Node integration, external server, CDN, eval of user payloads, or internet access is required.

## Bridge

js/bridge.js resolves the extension root via CSInterface and loads jsx/presets-data.jsx then jsx/hostscript.jsx using absolute File paths. It checks the host version. Requests are URI-encoded JSON passed to MotionAstra.dispatch. Replies are tagged and correlated by request ID. A lost/empty CEP reply is recovered from a host mailbox; the host mutation is never automatically replayed. Status polling shares the same promise queue. An unconfirmed operation asks the user to inspect the timeline before retrying.

The host contains a data-only JSON parser/encoder for ExtendScript without a guaranteed JSON global. It rejects invalid parameter types before installing an effect. Checkbox normalization prevents string false from being interpreted as true. Every mutating action has one Undo group; per-layer results show skips/failures. A fresh failed instance cleans its own partial controls. Updates can be partial and explicitly report Undo guidance.

## Schema and compatibility

presets.json has exactly 20 public recipes. Legacy v2 records are separate and remain loadable but are not rendered as cards. Counter/Switcher retain their IDs. A layer can carry one instance. Layer-comment metadata records recipe, token, settings and version; unrelated comment text is retained. Native controls keep the MA2 naming convention for v2 compatibility. The package does not rewrite old projects on load.

## Expressions and ownership

Expressions use a tagged prefix. Only tagged expressions, generated MA2 animators/effects/masks and token-specific markers are removed by the owned-removal tool. User masks, comments, effects and marker text are preserved. Erase ALL explicitly clears the full Effects stack on selected layers in addition to owned animation. Transition removal disables its coverage layer and keeps the project source; no project-wide deletion is performed.

Text/background clocks use layer.inPoint plus End marker time, bounded one-shot progress, optional loop, easing, reverse and manual progress. Numeric/color/boolean controls are live. Strings are embedded in generated expressions and committed on Update. Structural Count is reconstructed only on Update. Native background masks are deterministic and bounded in count.

Transition creation/update code was removed in 2.5.4. Only recognition for explicitly removing old transition instances remains; it disables the coverage layer after cleanup.

## Layer tools

Anchor conversion evaluates an ephemeral Point3D Control expression using toWorldVec and parent.fromWorldVec, then removes the probe. The same compensation is applied to keyed, separated or expression-driven Position. Original expressions are wrapped with an additive offset, and repeated offsets merge. Snapshot rollback restores affected properties if a pivot write fails. Current-frame preservation is deliberate; it is not a promise to preserve all frames when rotations/scales animate.

Layer ordering manipulates only selected layers and preserves their relative order where appropriate. Parenting uses a controller at the average selected world anchor, with a 3D null if needed. Camera/light anchors and locked layers are reported as skips. No all-project cleanup is hidden inside a workflow action.

## UI

The main region and inspector have independent scrolling. Search lives in the collapsible top navigation. Quick Tools occupies the third main tab. Settings lives in the independently collapsible Quick shortcuts row. Footer space is reserved for status and a 3.5-second notification. Every card offers Apply defaults and Customize. Destructive removal uses an inline review region. Browser-only mode disables host actions.

See VALIDATION.md for the distinction between modeled host testing and actual native AE rendering.

## 2.5.4 creation actions

New Shape constructs a regular native filled path; New Solid uses composition dimensions and the requested RGB color; New Text retains native editable text. Creation requires an active comp, not a selection, and selects only its result. New shape/solid validates color before adding layers, removes its own partial layer on construction failure and uses the shared Undo dispatcher. The Create bar and standalone catalog share the same local UI.
