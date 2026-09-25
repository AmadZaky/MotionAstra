# MotionAstra v2.8 — Pre-alpha

- Text FX require an existing selected text layer; use New Text to create one explicitly.
- Background cards have Customize and Generate Background buttons.
- Generate Background needs only an active composition, creates its own bottom layer, and selects it.
- Background Update edits matching selected instances or generates one when none match.
- Apply/Generate remains at the bottom of each preset card and inspector.
- Includes 10 text presets, 10 backgrounds, Quick Tools, local dependencies, and an offline catalog.

Install the attached ZIP by replacing the entire MotionAstra-FX extension folder and restarting After Effects. CEP reports numeric version 2.8.0.

Ten modeled-host test suites pass. Native After Effects rendering, actual CEP behavior, and the latest browser layout are not yet verified. This release is explicitly pre-alpha.

### RGBA hotfix (same v2.8 prerelease)

Color expressions now read the explicit Color Control property match name and return four numeric RGBA components. Legacy gradient interpolation also computes each component explicitly. Expression tests enforce four-component output for Ramp and Tint at five times, under both normal lookup and a simulated scalar numeric-lookup failure. This simulation reproduces the dimension symptom; it does not establish the precise cause in native AE. Ten host suites pass. Native AE validation remains required.

After replacing the extension and restarting AE, generate a fresh background. Existing instances retain their stored expressions until Update rebuilds them.
