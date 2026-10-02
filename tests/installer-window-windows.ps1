# Open the real installer window and drive its Install/Done buttons on the WPF dispatcher.
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot
$temp=Join-Path ([IO.Path]::GetTempPath()) ('MotionAstra Window '+[Guid]::NewGuid().ToString('N'))
$oldAppData=$env:APPDATA
$script:testFailure=$null
$script:testPhase=0
$script:testOutput=Join-Path $root 'dist\installer-preview.png'
try {
 $installer=Join-Path $temp 'Installer';$payload=Join-Path $temp 'MotionAstra-FX'
 New-Item -ItemType Directory -Force -Path $installer | Out-Null
 Copy-Item -LiteralPath (Join-Path $root 'installer\windows\WindowsUI.ps1'),(Join-Path $root 'installer\windows\Window.xaml') -Destination $installer
 Copy-Item -LiteralPath (Join-Path $root 'install-windows.ps1') -Destination (Join-Path $installer 'Backend.ps1')
 foreach ($name in @('CSXS\manifest.xml','index.html','jsx\hostscript.jsx','jsx\presets-data.jsx','VERSION')) {
  $target=Join-Path $payload $name;New-Item -ItemType Directory -Force -Path (Split-Path $target) | Out-Null
  Copy-Item -LiteralPath (Join-Path $root $name) -Destination $target
 }
 $sums=@(Get-ChildItem -LiteralPath $payload -Recurse -File | ForEach-Object { (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLower()+'  '+$_.FullName.Substring($payload.Length+1).Replace('\','/') })
 Set-Content -LiteralPath (Join-Path $payload 'SHA256SUMS') -Value $sums -Encoding ASCII
 $env:APPDATA=Join-Path $temp 'UserData'
 . (Join-Path $installer 'WindowsUI.ps1')
 Add-Type -AssemblyName PresentationFramework,PresentationCore,WindowsBase
 $script:testDeadline=[DateTime]::UtcNow.AddSeconds(60)
 $script:driver=New-Object Windows.Threading.DispatcherTimer
 $script:driver.Interval=[TimeSpan]::FromMilliseconds(150)
 $script:driver.Add_Tick({
  try {
   if ([DateTime]::UtcNow -gt $script:testDeadline) { throw 'Installer window timed out' }
   if (-not $script:window.IsVisible) { return }
   if ($script:testPhase -eq 0) {
    $script:window.UpdateLayout()
    $bitmap=New-Object Windows.Media.Imaging.RenderTargetBitmap(640,650,96,96,([Windows.Media.PixelFormats]::Pbgra32))
    $bitmap.Render($script:window)
    $pixels=New-Object byte[] (640*650*4)
    $bitmap.CopyPixels($pixels,640*4,0)
    $nonzero=0;foreach ($pixel in $pixels) { if ($pixel -gt 0) { $nonzero++ } }
    if ($nonzero -lt 5000) { throw 'Installer preview rendered blank' }
    $encoder=New-Object Windows.Media.Imaging.PngBitmapEncoder
    $encoder.Frames.Add([Windows.Media.Imaging.BitmapFrame]::Create($bitmap))
    $stream=[IO.File]::Create($script:testOutput)
    try { $encoder.Save($stream) } finally { $stream.Dispose() }
    # An online install cannot start without explicit consent; no worker means no network.
    $savedVersion=$script:onlineVersion;$script:onlineVersion='0.0.0'
    $script:controls.DownloadConsent.IsChecked=$false
    $script:controls.Install.RaiseEvent((New-Object Windows.RoutedEventArgs([Windows.Controls.Button]::ClickEvent)))
    if ($script:job) { throw 'Download started before consent' }
    if ($script:controls.Details.Text -notmatch 'consent') { throw 'Missing consent guidance' }
    $script:onlineVersion=$savedVersion
    $script:controls.DebugConsent.IsChecked=$false
    $script:testPhase=1
    $script:controls.Install.RaiseEvent((New-Object Windows.RoutedEventArgs([Windows.Controls.Button]::ClickEvent)))
   } elseif ($script:testPhase -eq 1 -and -not $script:job) {
    if (-not $script:completed) { throw ('Installer did not reach success: '+$script:controls.Details.Text) }
    if ($script:controls.Install.Content -ne 'Done') { throw 'Done button missing' }
    if ($script:controls.Progress.Value -ne 100) { throw 'Progress did not finish' }
    $script:testPhase=2;$script:driver.Stop()
    $script:controls.Install.RaiseEvent((New-Object Windows.RoutedEventArgs([Windows.Controls.Button]::ClickEvent)))
   }
  } catch {
   $script:testFailure=$_.Exception.Message
   $script:driver.Stop()
   if ($script:job) { $script:job.Worker.Stop();$script:job.Worker.Dispose();$script:job=$null }
   $script:window.Close()
  }
 })
 $script:driver.Start()
 Show-MotionAstraInstaller
 $script:driver.Stop()
 if ($script:testFailure) { throw $script:testFailure }
 if ($script:testPhase -ne 2) { throw 'Window closed before Install/Done verification' }
 if (-not (Test-Path (Join-Path $env:APPDATA 'Adobe\CEP\extensions\MotionAstra-FX\VERSION'))) { throw 'GUI did not install to displayed destination' }
 Write-Host 'PASS: displayed WPF window, nonblank rendering, real Install/Done events and isolated destination.'
} finally {
 $env:APPDATA=$oldAppData
 if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Recurse -Force }
}
