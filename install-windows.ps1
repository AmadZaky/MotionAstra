# Called by Install MotionAstra.cmd. Requires Windows PowerShell 5.1 or newer.
$ErrorActionPreference = 'Stop'
function Test-MotionAstraOwned([string]$Folder) {
    $manifest = Join-Path $Folder 'CSXS\manifest.xml'
    if (-not (Test-Path -LiteralPath $manifest -PathType Leaf)) { return $false }
    try { [xml]$xml = Get-Content -LiteralPath $manifest -Raw; return $xml.ExtensionManifest.ExtensionBundleId -eq 'com.motionastra.fx' } catch { return $false }
}
function Assert-MotionAstraPayload([string]$Folder) {
    foreach ($name in @('CSXS\manifest.xml','index.html','jsx\hostscript.jsx','jsx\presets-data.jsx','VERSION','SHA256SUMS')) {
        if (-not (Test-Path -LiteralPath (Join-Path $Folder $name) -PathType Leaf)) { throw "Incomplete package: $name. Extract the entire release ZIP first." }
    }
    if (-not (Test-MotionAstraOwned $Folder)) { throw 'The payload is not MotionAstra.' }
    $links = @(Get-ChildItem -LiteralPath $Folder -Force -Recurse | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint })
    if ($links.Count -gt 0) { throw 'Linked files are not supported in the payload.' }
    $lines = @(Get-Content -LiteralPath (Join-Path $Folder 'SHA256SUMS'))
    if ($lines.Count -eq 0) { throw 'Empty checksum list.' }
    foreach ($line in $lines) {
        if ($line -notmatch '^([a-f0-9]{64})  ([A-Za-z0-9_. /-]+)$') { throw 'Invalid checksum list.' }
        $expected = $Matches[1]; $relative = $Matches[2]
        if ($relative.StartsWith('/') -or $relative -match '(^|/)\.\.(/|$)') { throw 'Unsafe checksum path.' }
        $file = Join-Path $Folder $relative
        if ((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ne $expected) { throw "Package checksum failed: $relative. Download and extract the release again." }
    }
}
function Install-MotionAstra([string]$Payload, [string]$ExtensionRoot, [string]$BackupRoot, [string[]]$OtherRoots = @()) {
    Assert-MotionAstraPayload $Payload
    $Payload = (Resolve-Path -LiteralPath $Payload).Path
    New-Item -ItemType Directory -Force -Path $ExtensionRoot,$BackupRoot | Out-Null
    $destination = Join-Path $ExtensionRoot 'MotionAstra-FX'
    $old = @()
    foreach ($root in (@($ExtensionRoot) + $OtherRoots | Select-Object -Unique)) {
        if (-not (Test-Path -LiteralPath $root)) { continue }
        foreach ($candidate in @(Get-ChildItem -LiteralPath $root -Directory -Force)) {
            if (Test-MotionAstraOwned $candidate.FullName) {
                if ($candidate.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Linked old install: $($candidate.FullName). Remove that link manually first." }
                $path = $candidate.FullName
                if (($Payload.TrimEnd('\') + '\').StartsWith($path.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Run the installer from Downloads, outside the installed panel.' }
                if ($old -notcontains $path) { $old += $path }
            }
        }
    }
    if ((Test-Path -LiteralPath $destination) -and -not (Test-MotionAstraOwned $destination)) { throw "Unrecognized folder at $destination; nothing was removed." }
    $version = (Get-Content -LiteralPath (Join-Path $Payload 'VERSION') -Raw).Trim()
    Write-Host "Install MotionAstra $version to:`n$destination"
    if ($old.Count -gt 0) {
        Write-Host "`nExisting MotionAstra installation(s):"
        $old | ForEach-Object { Write-Host "  $_" }
        $answer = Read-Host 'Remove these active copies and install the new version? Backups will be kept. [y/N]'
        if ($answer -notmatch '^(y|yes)$') { Write-Host 'Cancelled. Existing installations unchanged.'; return $false }
    }
    $transaction = Join-Path $BackupRoot ('install-' + [Guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $transaction | Out-Null
    $stage = Join-Path $transaction 'new'; $moved = @(); $installed = $false
    try {
        Copy-Item -LiteralPath $Payload -Destination $stage -Recurse
        Assert-MotionAstraPayload $stage
        foreach ($path in $old) {
            $backup = Join-Path $transaction ('previous-' + $moved.Count)
            Move-Item -LiteralPath $path -Destination $backup
            $moved += @{Original=$path; Backup=$backup}
            Add-Content -LiteralPath (Join-Path $transaction 'RESTORE.txt') -Value "$backup -> $path"
        }
        Move-Item -LiteralPath $stage -Destination $destination
        $installed = $true
        Assert-MotionAstraPayload $destination
    } catch {
        $problem = $_
        if ($installed) { Remove-Item -LiteralPath $destination -Recurse -Force }
        for ($i=$moved.Count-1; $i -ge 0; $i--) {
            try { Move-Item -LiteralPath $moved[$i].Backup -Destination $moved[$i].Original }
            catch { Write-Warning "Restore manually: $($moved[$i].Backup) -> $($moved[$i].Original)" }
        }
        throw "Installation failed: $problem. If an old system installation is protected, move it out of CEP/extensions with administrator approval, then retry. Backups: $transaction"
    } finally {
        if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
    }
    if ($moved.Count -eq 0) { Remove-Item -LiteralPath $transaction } else { Write-Host "Previous versions backed up to: $transaction" }
    Write-Host "Installed MotionAstra $version."
    return $true
}
function Start-MotionAstraInstaller {
    if (Get-Process AfterFX -ErrorAction SilentlyContinue) { throw 'Close After Effects before installing.' }
    $payload = Join-Path $PSScriptRoot 'MotionAstra-FX'
    $extensionRoot = Join-Path $env:APPDATA 'Adobe\CEP\extensions'
    $backupRoot = Join-Path $env:APPDATA 'MotionAstra Backups'
    $otherRoots = @()
    foreach ($common in @(${env:CommonProgramFiles(x86)}, $env:CommonProgramFiles)) {
        if ($common) { $otherRoots += Join-Path $common 'Adobe\CEP\extensions' }
    }
    if (-not (Install-MotionAstra $payload $extensionRoot $backupRoot $otherRoots)) { return }
    foreach ($runtime in @('11','12')) {
        $key = "HKCU:\Software\Adobe\CSXS.$runtime"
        New-Item -Path $key -Force | Out-Null
        New-ItemProperty -Path $key -Name PlayerDebugMode -Value '1' -PropertyType String -Force | Out-Null
    }
    Write-Host 'Enabled unsigned CEP panels for this user (PlayerDebugMode 11/12).'
    Write-Host 'Restart AE. Open Window > Extensions > MotionAstra FX.'
}
if ($MyInvocation.InvocationName -ne '.') {
    try { Start-MotionAstraInstaller; exit 0 }
    catch { Write-Host "Installation stopped: $_" -ForegroundColor Red; exit 1 }
}
