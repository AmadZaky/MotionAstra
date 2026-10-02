# MotionAstra v3.0.11 — Alpha (Windows only)

- Download just Install MotionAstra.exe: embedded branded UI requests consent, downloads its matching GitHub package, verifies SHA-256 and package integrity, and uses existing backup/rollback replacement.
- No download before consent; connection errors and invalid archives do not modify the installed extension.
- New font source filters: User-installed, Windows common families, Adobe Fonts, and Other/unknown. Unknown installation origins are not guessed.
- Small fixed M.astra font specimen above the family selector; content and text size still control the created AE text separately.

User-installed means AE exposes a file in the per-user Windows Fonts directory. Fonts installed for all accounts may remain Other/unknown. Internet is needed for EXE setup; the panel works offline. The EXE is unsigned. Native AE rendering still requires manual verification.
