# Run with Windows PowerShell 5.1 -STA; creates actual WPF controls and runs the backend asynchronously.
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot
. (Join-Path $root 'installer\windows\WindowsUI.ps1')
function Assert($value,$message) { if (-not $value) { throw $message } }
$window=New-MotionAstraWindow
foreach ($id in @('Install','Cancel','Destination','Progress','Status','Details','DebugConsent')) { Assert ($null -ne $window.FindName($id)) "Missing WPF control: $id" }
Assert ($window.Title -eq 'MotionAstra Setup') 'Incorrect branding'
$window.Measure((New-Object Windows.Size(640,650)))
$window.Arrange((New-Object Windows.Rect(0,0,640,650)))
$window.UpdateLayout()
$bitmap=New-Object Windows.Media.Imaging.RenderTargetBitmap(640,650,96,96,([Windows.Media.PixelFormats]::Pbgra32))
$bitmap.Render($window)
$encoder=New-Object Windows.Media.Imaging.PngBitmapEncoder
$encoder.Frames.Add([Windows.Media.Imaging.BitmapFrame]::Create($bitmap))
New-Item -ItemType Directory -Force -Path (Join-Path $root 'dist') | Out-Null
$stream=[IO.File]::Create((Join-Path $root 'dist\installer-preview.png'))
try { $encoder.Save($stream) } finally { $stream.Dispose(); $window.Close() }
$temp=Join-Path ([IO.Path]::GetTempPath()) ('MotionAstra GUI '+[Guid]::NewGuid().ToString('N'))
try {
 $payload=Join-Path $temp 'download\MotionAstra-FX'
 foreach ($name in @('CSXS\manifest.xml','index.html','jsx\hostscript.jsx','jsx\presets-data.jsx','VERSION')) {
  $target=Join-Path $payload $name
  New-Item -ItemType Directory -Force -Path (Split-Path $target) | Out-Null
  Copy-Item -LiteralPath (Join-Path $root $name) -Destination $target
 }
 $sums=@(Get-ChildItem -LiteralPath $payload -Recurse -File | ForEach-Object { (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLower()+'  '+$_.FullName.Substring($payload.Length+1).Replace('\','/') })
 Set-Content -LiteralPath (Join-Path $payload 'SHA256SUMS') -Value $sums -Encoding ASCII
 $extensionRoot=Join-Path $temp 'extensions'; $backupRoot=Join-Path $temp 'backups'
 foreach ($mode in @('install','decline','replace','corrupt')) {
  if ($mode -eq 'corrupt') { Add-Content -LiteralPath (Join-Path $payload 'index.html') -Value 'corrupt' }
  $state=[hashtable]::Synchronized(@{Percent=0;Message='';Pending=$null;Answer=$null;Done=$false;Success=$false;Cancelled=$false;Installed=$false;Error=$null})
  $job=Start-MotionAstraJob -Backend (Join-Path $root 'install-windows.ps1') -Payload $payload -ExtensionRoot $extensionRoot -BackupRoot $backupRoot -OtherRoots @() -State $state -EnableDebug $false
  $deadline=[DateTime]::UtcNow.AddSeconds(60); $prompted=$false
  while (-not $job.Handle.IsCompleted) {
   if ($null -ne $state.Pending) { $prompted=$true; $state.Pending=$null; $state.Answer=$mode -eq 'replace' }
   if ([DateTime]::UtcNow -gt $deadline) { $job.Worker.Stop(); throw 'GUI worker timed out' }
   Start-Sleep -Milliseconds 25
  }
  try { [void]$job.Worker.EndInvoke($job.Handle) } finally { $job.Worker.Dispose() }
  if ($mode -eq 'decline') { Assert ($prompted -and $state.Cancelled -and -not $state.Success) 'Decline did not cancel'; Assert (Test-Path (Join-Path $extensionRoot 'MotionAstra-FX\sentinel')) 'Decline altered old files' }
  elseif ($mode -eq 'corrupt') { Assert ([bool]$state.Error -and -not $state.Installed) 'Corrupt package was accepted' }
  else { Assert $state.Success ("GUI install failed: "+$state.Error); Assert ($state.Percent -eq 100) 'Incomplete progress' }
  if ($mode -eq 'install') { Set-Content -LiteralPath (Join-Path $extensionRoot 'MotionAstra-FX\sentinel') -Value 'old' }
  if ($mode -eq 'replace') { Assert $prompted 'No confirmation requested'; Assert (@(Get-ChildItem -LiteralPath $backupRoot -Recurse -Filter sentinel).Count -eq 1) 'GUI replacement lost backup' }
 }
 Write-Host 'PASS: actual WPF layout, asynchronous install, decline, update, backup, progress and corrupt-package errors.'
} finally { if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Recurse -Force } }
