# ZxT-Motions v3.6.0 Pre-release — Windows only

This build targets After Effects 2025 on Windows. macOS is not supported, no Mac installer is included, and the panel refuses host commands on macOS. Do not install this package on a Mac. The standalone browser catalog remains a preview only.

## Install or update

1. Download **Install ZxT-Motions.exe** from the release assets at https://github.com/AmadZaky/ZxT-Motions/releases. This single file contains the setup UI; no ZIP extraction is needed.
2. Close After Effects and open the EXE. Review the installation destination.
3. Check the download/install consent box and choose **Install** or **Update**. No network request starts before this consent.
4. Keep an internet connection while setup downloads its matching version from GitHub. It checks the archive's SHA-256 against GitHub release metadata, then verifies package files before changing any installed copy.
5. If old copies are detected, review their paths and confirm replacement. Backups and rollback remain enabled.
6. Select **Done**, restart AE and open **Window → Extensions → ZxT-Motions**. Settings should show **3.6.0**.

If the download fails, your current installation remains untouched. Retry after restoring connectivity. Missing release assets or missing digests are refused. The panel itself works offline after installation. The release ZIP remains available for manual/offline installation; its CMD launcher uses the local package, while the EXE always uses online setup.

The correct per-user destination is `%APPDATA%\Adobe\CEP\extensions\MotionAstra-FX`. This is a CEP extension, not a file for After Effects' Plug-ins or ScriptUI Panels directories. No Node, Python, internet connection or administrator access is needed for the normal per-user installation.

The installer verifies package checksums before changes, detects existing copies by manifest identity, requests confirmation, and retains backups outside CEP in `%APPDATA%\MotionAstra Backups`. It attempts rollback on failure and reports recovery paths if needed. Cancel is disabled during file replacement so rollback can complete safely. Protected system-wide copies may need to be moved by an administrator before retrying; the installer does not silently elevate.

The installer and extension are unsigned. A graphical interface does not provide code signing; Windows may display an unknown-publisher prompt. Follow your organization's security policies. For troubleshooting, `Install MotionAstra.cmd` and `Install MotionAstra.ps1` are supplied as fallback entry points.

## AE setup

- **Edit → Preferences → Scripting & Expressions:** enable **Allow Scripts to Write Files and Access Network**.
- **File → Project Settings → Expressions:** select **JavaScript**, not Legacy ExtendScript. The host automation itself still uses ExtendScript.
- Open a composition before using Create or SolidGen. Select text layers before applying text animation. Select keyframes for Motion Curve.

## Manual installation and unsigned CEP settings

Close AE. Back up old copies outside all CEP directories, then copy the full `MotionAstra-FX` folder to `%APPDATA%\Adobe\CEP\extensions\`. The final path must contain `MotionAstra-FX\CSXS\manifest.xml`. Do not merge old and new files.

The system-wide alternative is `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\`, which may require administrator access. Keep only one active copy of the `com.motionastra.fx` bundle.

The GUI's unsigned-CEP checkbox sets **PlayerDebugMode** for **CSXS.11** and **CSXS.12** in the current-user registry. If doing this manually, create a **String Value (REG_SZ)** named `PlayerDebugMode`, value `1`, under both:

- `HKEY_CURRENT_USER\Software\Adobe\CSXS.11`
- `HKEY_CURRENT_USER\Software\Adobe\CSXS.12`

Restart Adobe applications afterward. Set those values to `0` or remove them to restore unsigned-panel restrictions.

## Troubleshooting

- **Panel missing:** check nesting, bundle duplicates, PlayerDebugMode, and restart AE. AEFT `[18.0,25.9]` is the declared range; AE 2025 is the target. This does not advertise AE 2026 compatibility.
- **Blank panel:** reinstall the entire release. Assets are bundled offline. The included `.debug` file configures CEP DevTools at port 8098; inspect the panel console through `http://localhost:8098` while AE runs, if that host exposes remote debugging. Check `.debug` for the exact configured port. Enable CEP logs with a current-user string `LogLevel=6` under the appropriate CSXS key when diagnosing startup.
- **Checksum error:** download and extract the complete release again. Do not mix files across versions.
- **Installation error:** copy the selectable error from the installer. Check permissions, close AE, and inspect the reported backup/restore paths before retrying.
- **Apply/Generate failure:** use **Settings → Show connection report**. The report includes extension path, host version and recent errors. Check the timeline before retrying an operation whose completion is uncertain.
- **Font preview fallback:** CEP may not load every font available to AE. The preview explicitly labels fallback; Create still passes the exact selected native font face to AE.
- **Updating Text Switcher:** select the existing instance, Quick Tools → Load settings → Update. Animate `MA2 choice` in Choice slider mode; Automatic mode follows time.

## Verification limits

Release CI runs installer, rollback/integrity, WPF UI, ES3 parsing, modeled-host and Chromium UI tests on Windows. These do not render a real After Effects project. Run the bundled `tests/AE_SMOKE_TEST.jsx` and `tests/AE_YU_SMOKE_TEST.jsx` on a disposable project for native verification; check fonts, expressions, colors, keyframes and Undo before production use.

## Rename compatibility

Download the new ZxT-Motions installer. Old online EXEs may reject release URLs after the repository rename. The folder `MotionAstra-FX`, bundle identity and backup paths intentionally retain their legacy names so existing installations are upgraded in place; saved project controls remain compatible.

## Studio appearance (v3.6.0)

Open the header gear → Appearance and choose an accent: Orange, Lime Green, Light Blue, Burgundy or Plain White. The sun/moon button switches dark/light mode. Preferences are saved locally; reinstalling normally preserves them. These settings do not change FX or text colors in your project.

Customize opens beside the library at 920 px or wider, or on its own at smaller widths. Choose Library to return. Both Text Tools FX and Text Animate headers collapse their collections. The standalone catalog includes the same Studio interface and works without a CDN.

## v3.6 workflow check

1. Open Quick and expand the selected-layer summary. Refresh selection if you just switched layers. Load FX or an IN/OUT animation from the inspector.
2. Star a Text Animate or SolidGen card; check Favorites, then apply a preset and check Recent. Both lists persist locally after restart.
3. For keyed Progress/Choice, enable the corresponding manual/Choice mode and animate the native AE slider. Changing another panel setting must leave those keys unchanged. Editing that slider in the panel updates its value at the current playhead.
4. Native color keyframes survive unrelated updates. Custom expressions and custom Text Animate phase keys are protected; edit those in AE or explicitly remove the animation before replacing it.
5. Test on a duplicate project first. These automated tests model AE behavior; they cannot verify real AE rendering or every installed font/plugin.
