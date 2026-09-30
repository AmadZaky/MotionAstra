# MotionAstra 2.8.5 — Pre-alpha

- New instances use one MotionAstra Progress parameter controller. Native effects that render the artwork remain necessary.
- Adds a dedicated FX Tweaker tab with Load selected FX, parameter search, collapsible groups and a compact Update footer.
- Tweaker updates are bound to the loaded composition/layer/instance; changing selection requires reloading and cannot accidentally generate another background.
- Compact settings persist in layer metadata; Update rebuilds typed expression constants and writes native colors. Existing progress animation is preserved on ordinary updates.
- Existing instances retain individual controls. Explicit Compact old controls conversion refuses animated controls or external expression dependencies. Individual layout remains available in Settings for advanced keyframing.
- Adds compact-controller and Chromium Tweaker regression coverage for all 20 presets and migration safety.

Close AE, extract the entire release ZIP and run the installer for your OS. Confirm replacement, restart AE and check version 2.8.5. Native AE rendering still requires the included manual smoke test; automated host-model and browser tests do not replace it.
