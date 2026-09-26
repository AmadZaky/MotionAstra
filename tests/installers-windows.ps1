$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '..\install-windows.ps1')
function Assert($Condition, $Message) { if (-not $Condition) { throw $Message } }
$testRoot = Join-Path ([IO.Path]::GetTempPath()) ('MotionAstra test ' + [Guid]::NewGuid().ToString('N'))
$payload = Join-Path $testRoot 'download\MotionAstra-FX'
$extensionRoot = Join-Path $testRoot 'extensions'
$backupRoot = Join-Path $testRoot 'backups'
$systemRoot = Join-Path $testRoot 'system extensions'
function Read-Host { param($Prompt); return $script:answer }
$script:answer = 'yes'
try {
    foreach ($name in @('CSXS\manifest.xml','index.html','jsx\hostscript.jsx','jsx\presets-data.jsx','VERSION')) {
        $dest=Join-Path $payload $name
        New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
        Copy-Item -LiteralPath (Join-Path (Split-Path $PSScriptRoot) $name) -Destination $dest
    }
    $sums = @(Get-ChildItem -LiteralPath $payload -File -Recurse | ForEach-Object { (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLower() + '  ' + $_.FullName.Substring($payload.Length+1).Replace('\','/') })
    Set-Content -LiteralPath (Join-Path $payload 'SHA256SUMS') -Value $sums -Encoding ASCII
    Assert (Install-MotionAstra $payload $extensionRoot $backupRoot @($systemRoot)) 'Clean installation failed'
    $dest=Join-Path $extensionRoot 'MotionAstra-FX'
    Set-Content -LiteralPath (Join-Path $dest 'sentinel') -Value 'old'
    $script:answer='no'
    Assert (-not (Install-MotionAstra $payload $extensionRoot $backupRoot @($systemRoot))) 'Decline must cancel'
    Assert (Test-Path -LiteralPath (Join-Path $dest 'sentinel')) 'Cancel changed old files'
    $script:answer='yes'
    New-Item -ItemType Directory -Path $systemRoot | Out-Null
    Copy-Item -LiteralPath $dest -Destination (Join-Path $systemRoot 'renamed-old') -Recurse
    Assert (Install-MotionAstra $payload $extensionRoot $backupRoot @($systemRoot)) 'Replacement failed'
    Assert (-not (Test-Path -LiteralPath (Join-Path $dest 'sentinel'))) 'Stale file merged into new install'
    Assert (-not (Test-Path -LiteralPath (Join-Path $systemRoot 'renamed-old'))) 'System duplicate remains'
    Assert (@(Get-ChildItem -LiteralPath $backupRoot -Filter sentinel -Recurse).Count -eq 2) 'Backups missing'
    # Force activation to fail after moving the old version; real rollback must restore it.
    Set-Content -LiteralPath (Join-Path $dest 'sentinel') -Value 'rollback'
    function Move-Item {
        param($LiteralPath,$Destination)
        if ((Split-Path $LiteralPath -Leaf) -eq 'new') { throw 'Simulated activation failure' }
        Microsoft.PowerShell.Management\Move-Item -LiteralPath $LiteralPath -Destination $Destination
    }
    $failed=$false
    try { Install-MotionAstra $payload $extensionRoot $backupRoot @($systemRoot) | Out-Null } catch { $failed=$true }
    Remove-Item Function:\Move-Item
    Assert $failed 'Activation failure was not reported'
    Assert (Test-Path -LiteralPath (Join-Path $dest 'sentinel')) 'Rollback failed'
    Set-Content -LiteralPath (Join-Path $payload 'index.html') -Value 'corrupt'
    $failed=$false
    try { Install-MotionAstra $payload $extensionRoot $backupRoot @($systemRoot) | Out-Null } catch { $failed=$true }
    Assert $failed 'Corrupt payload was accepted'
    Assert (Test-Path -LiteralPath (Join-Path $dest 'sentinel')) 'Corrupt payload changed active files'
    Write-Host 'PASS: Windows clean install, cancellation, system duplicate replacement, backups, rollback and checksums.'
} finally { if (Test-Path -LiteralPath $testRoot) { Remove-Item -LiteralPath $testRoot -Recurse -Force } }
