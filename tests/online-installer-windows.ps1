$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot
. (Join-Path $root 'installer\windows\Download.ps1')
function Assert($value,$message) { if (-not $value) { throw $message } }
function Reject([scriptblock]$action) { $failed=$false;try { & $action | Out-Null } catch { $failed=$true };Assert $failed 'Unsafe package accepted' }
$temp=Join-Path ([IO.Path]::GetTempPath()) ('MA-OnlineTest-'+[Guid]::NewGuid().ToString('N'))
try {
 New-Item -ItemType Directory -Path $temp | Out-Null
 $version=(Get-Content (Join-Path $root 'VERSION') -Raw).Trim()
 $zip=Join-Path $temp 'release.zip'
 python (Join-Path $root 'tools\package-release.py') --output $zip
 if ($LASTEXITCODE -ne 0) { throw 'Fixture packaging failed' }
 $digest='sha256:'+(Get-FileHash $zip -Algorithm SHA256).Hash.ToLower()
 $size=(Get-Item $zip).Length
 $asset=@{name="ZxT-Motions_v$version-alpha.zip";browser_download_url="https://github.com/AmadZaky/ZxT-Motions/releases/download/v$version-alpha/ZxT-Motions_v$version-alpha.zip";digest=$digest;size=$size}
 $release=@{tag_name="v$version-alpha";draft=$false;assets=@($asset)}
 Assert ((Assert-MotionAstraReleaseAsset $release $version).digest -eq $digest) 'Correct metadata rejected'
 $asset.browser_download_url='https://example.com/payload.zip';Reject { Assert-MotionAstraReleaseAsset $release $version }
 $asset.browser_download_url="https://github.com/AmadZaky/ZxT-Motions/releases/download/v$version-alpha/ZxT-Motions_v$version-alpha.zip"
 Reject { Expand-MotionAstraDownload $zip (Join-Path $temp 'bad') ('sha256:'+('0'*64)) $size }
 $payload=Expand-MotionAstraDownload $zip (Join-Path $temp 'good') $digest $size
 . (Join-Path $root 'install-windows.ps1');Assert-MotionAstraPayload $payload
 Assert (-not (Test-Path (Join-Path $temp 'good\Installer'))) 'Downloaded code outside payload extracted'
 # Mock only network transport; execute real metadata/digest/extraction logic.
 $script:calls=0;$script:fixtureZip=$zip;$script:fixtureRelease=$release
 function Invoke-RestMethod { param($Uri,$Headers,$TimeoutSec);$script:calls++;return $script:fixtureRelease }
 function Invoke-WebRequest { param([switch]$UseBasicParsing,$Uri,$OutFile,$TimeoutSec);$script:calls++;Copy-Item $script:fixtureZip $OutFile }
 $network=Join-Path $temp 'network';New-Item -ItemType Directory $network | Out-Null
 $state=@{};$received=Get-MotionAstraOnlinePayload $version $network $state
 Assert-MotionAstraPayload $received;Assert ($script:calls -eq 2) 'Incorrect network flow'
 # Archive traversal rejected even when the transport digest matches.
 $evil=Join-Path $temp 'evil.zip';$archive=[IO.Compression.ZipFile]::Open($evil,[IO.Compression.ZipArchiveMode]::Create)
 try { [void]$archive.CreateEntry('MotionAstra-FX/../../escape.txt') } finally { $archive.Dispose() }
 Reject { Expand-MotionAstraDownload $evil (Join-Path $temp 'evil') ('sha256:'+(Get-FileHash $evil).Hash) (Get-Item $evil).Length }
 $assembly=[Reflection.Assembly]::LoadFile((Join-Path $root 'dist\Install ZxT-Motions.exe'))
 foreach ($name in @('WindowsUI.ps1','Window.xaml','Backend.ps1','Download.ps1','SetupVersion.txt')) { Assert ($assembly.GetManifestResourceNames() -contains $name) ('EXE missing '+$name) }
 Write-Host 'PASS: standalone EXE resources, pinned release metadata, download flow, digest checks, package integrity and traversal rejection.'
} finally { Remove-Item -LiteralPath $temp -Recurse -Force -ErrorAction SilentlyContinue }
