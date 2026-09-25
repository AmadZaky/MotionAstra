# Run from the extracted source folder, with After Effects closed.
$ErrorActionPreference = 'Stop'
if (Get-Process AfterFX -ErrorAction SilentlyContinue) { throw 'Close After Effects before installing.' }
$sourceRoot = $PSScriptRoot
$extensionRoot = Join-Path $env:APPDATA 'Adobe\CEP\extensions'
$destination = Join-Path $extensionRoot 'MotionAstra-FX'
if ([IO.Path]::GetFullPath($sourceRoot).TrimEnd('\') -eq [IO.Path]::GetFullPath($destination).TrimEnd('\')) { throw 'Run this installer from the extracted download, outside CEP/extensions.' }
if (-not (Test-Path (Join-Path $sourceRoot 'CSXS\manifest.xml'))) { throw 'Incomplete source folder.' }
New-Item -ItemType Directory -Force -Path $extensionRoot | Out-Null
if (Test-Path $destination) {
    $backupRoot = Join-Path $env:APPDATA 'MotionAstra Backups'
    New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null
    $backup = Join-Path $backupRoot ('MotionAstra-FX-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
    Move-Item -LiteralPath $destination -Destination $backup
    Write-Host "Previous install backed up to: $backup"
}
Copy-Item -LiteralPath $sourceRoot -Destination $destination -Recurse
foreach ($runtime in @('11','12')) {
    $key = "HKCU:\Software\Adobe\CSXS.$runtime"
    New-Item -Path $key -Force | Out-Null
    New-ItemProperty -Path $key -Name PlayerDebugMode -Value '1' -PropertyType String -Force | Out-Null
}
Write-Host "Installed MotionAstra 2.5 in $destination"
Write-Host 'Restart AE. Open Window > Extensions > MotionAstra FX. See INSTALLATION_GUIDE.md.'
