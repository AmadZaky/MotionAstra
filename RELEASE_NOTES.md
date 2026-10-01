# MotionAstra 3.0.4 — Alpha

- Adds **Install MotionAstra.exe**: a MotionAstra-branded black/orange graphical Windows setup window.
- Shows the destination, Install/Update, confirmation of existing copies, stage progress, success and selectable error details.
- Runs the existing integrity/backup/rollback backend on a worker runspace to keep the UI responsive.
- Exposes the unsigned-CEP preference as a visible option. No automatic administrator elevation.
- Verifies the displayed window with actual Install/Done button events and nonblank screenshot capture.
- Adds Windows-native WPF construction/rendering and asynchronous install/update/cancel/corruption tests; CI builds the executable and bundles it in the ZIP.
- FX recipes and the macOS installer are unchanged. The optional CMD troubleshooting entry remains available.

Extract the whole ZIP, close AE, and open **Install MotionAstra.exe**. Keep its Installer and MotionAstra-FX folders beside it. This Alpha executable is unsigned; Windows reputation warnings may still appear.
