@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install MotionAstra.ps1"
set "motionastra_result=%errorlevel%"
echo.
pause
exit /b %motionastra_result%
