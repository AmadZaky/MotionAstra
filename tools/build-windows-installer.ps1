param([string]$Output = (Join-Path (Split-Path $PSScriptRoot) 'dist\Install ZxT-Motions.exe'))
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot
New-Item -ItemType Directory -Force -Path (Split-Path $Output) | Out-Null
$compiler=Join-Path ([Runtime.InteropServices.RuntimeEnvironment]::GetRuntimeDirectory()) 'csc.exe'
if (-not (Test-Path $compiler)) { throw 'Build this launcher with Windows PowerShell 5.1 and the .NET Framework compiler.' }
Add-Type -AssemblyName System.Drawing
$iconPath=Join-Path (Split-Path $Output) 'motionastra.ico'
$bitmap=New-Object Drawing.Bitmap(64,64)
$graphics=[Drawing.Graphics]::FromImage($bitmap)
$graphics.Clear([Drawing.Color]::FromArgb(255,148,63))
$font=New-Object Drawing.Font('Segoe UI',44,([Drawing.FontStyle]::Bold))
$graphics.DrawString('*',$font,[Drawing.Brushes]::Black,8,0)
$icon=[Drawing.Icon]::FromHandle($bitmap.GetHicon())
$stream=[IO.File]::Create($iconPath)
try { $icon.Save($stream) } finally { $stream.Dispose(); $icon.Dispose(); $font.Dispose(); $graphics.Dispose(); $bitmap.Dispose() }
$resources=@(
 '/resource:'+(Join-Path $root 'installer\windows\WindowsUI.ps1')+',WindowsUI.ps1'
 '/resource:'+(Join-Path $root 'installer\windows\Window.xaml')+',Window.xaml'
 '/resource:'+(Join-Path $root 'install-windows.ps1')+',Backend.ps1'
 '/resource:'+(Join-Path $root 'installer\windows\Download.ps1')+',Download.ps1'
 '/resource:'+(Join-Path $root 'VERSION')+',SetupVersion.txt'
)
& $compiler @resources /nologo /win32icon:$iconPath /target:winexe /platform:anycpu /reference:System.Windows.Forms.dll /out:$Output (Join-Path $root 'installer\windows\Launcher.cs')
if ($LASTEXITCODE -ne 0) { throw 'Windows launcher compilation failed.' }
Write-Host "Built $Output"
