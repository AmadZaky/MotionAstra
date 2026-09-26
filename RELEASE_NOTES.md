# MotionAstra 2.8.3 — Pre-alpha

- Fixes the startup-blocking `Illegal use of reserved word` at hostscript.jsx line 237: the ES3-reserved identifier `native` is now `nativeProperty`.
- Adds an ES3 parser and reserved-identifier release check, because Node's modern parser accepted the incompatible code.
- Release ZIP includes `MotionAstra-FX/`, `Install MotionAstra.cmd`, its PowerShell helper, and `Install MotionAstra.command` for macOS.
- Installers detect existing MotionAstra bundles by manifest ID, including renamed folders in standard user/system CEP locations. They ask before removing active old copies, preserve backups outside CEP, and restore moved copies if activation fails.
- Payload checksums are verified before replacement. Unrelated destination folders and linked payloads are rejected. Protected system installs require manual removal with administrator approval before retrying.
- Installer enables PlayerDebugMode for CSXS 11/12 in the current user account. No AE project files or AE preferences are edited.
- Windows and macOS installer tests, ES3 checks, host regressions and Chromium workflows gate release publication.

Close AE, extract the whole release ZIP, then double-click the launcher for your OS. Confirm replacement when prompted; restart AE and confirm Settings shows 2.8.3. The macOS script is unsigned; if macOS blocks it, use the approved Open action described in the guide. Direct AE rendering remains a manual check.
