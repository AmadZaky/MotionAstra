# Online setup downloads only the version embedded in the EXE, after UI consent.
function Assert-MotionAstraReleaseAsset($Release,[string]$Version) {
    $tag='v'+$Version+'-alpha'
    $name='MotionAstra_FX_v'+$Version+'-alpha.zip'
    if ($Release.tag_name -cne $tag -or $Release.draft) { throw 'Unexpected GitHub release.' }
    $assets=@($Release.assets | Where-Object { $_.name -ceq $name })
    if ($assets.Count -ne 1) { throw 'Release package is not available. Retry later.' }
    $asset=$assets[0]
    $expected='https://github.com/AmadZaky/MotionAstra/releases/download/'+$tag+'/'+$name
    if ($asset.browser_download_url -cne $expected -or $asset.digest -notmatch '^sha256:[a-fA-F0-9]{64}$' -or $asset.size -le 0 -or $asset.size -gt 536870912) { throw 'Invalid release URL, checksum or size. Download refused.' }
    return $asset
}
function Expand-MotionAstraDownload([string]$Zip,[string]$Destination,[string]$Digest,[long]$Size) {
    if ((Get-Item -LiteralPath $Zip).Length -ne $Size) { throw 'Incomplete download. Retry with an internet connection.' }
    if ((Get-FileHash -LiteralPath $Zip -Algorithm SHA256).Hash -ine $Digest.Substring(7)) { throw 'Download checksum mismatch. No installation changes made.' }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive=[IO.Compression.ZipFile]::OpenRead($Zip)
    try {
        $total=0L;$seen=@{};$plan=@()
        if ($archive.Entries.Count -gt 5000) { throw 'Too many archive entries.' }
        foreach ($entry in $archive.Entries) {
            $name=$entry.FullName.Replace('\','/')
            if ($name -match '(^/|:|(^|/)\.\.(/|$))' -or (($entry.ExternalAttributes -shr 16) -band 61440) -eq 40960) { throw 'Unsafe archive entry.' }
            if (-not $name.StartsWith('MotionAstra-FX/')) { continue }
            if ($name.EndsWith('/')) { continue }
            if ($seen.ContainsKey($name)) { throw 'Duplicate archive path.' };$seen[$name]=$true
            $total += $entry.Length
            if ($total -gt 536870912) { throw 'Expanded package exceeds size limit.' }
            $target=[IO.Path]::GetFullPath((Join-Path $Destination $name))
            $prefix=[IO.Path]::GetFullPath($Destination).TrimEnd('\')+'\'
            if (-not $target.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe archive path.' }
            $plan+=@{Entry=$entry;Target=$target}
        }
        foreach ($item in $plan) {
            New-Item -ItemType Directory -Force -Path (Split-Path $item.Target) | Out-Null
            [IO.Compression.ZipFileExtensions]::ExtractToFile($item.Entry,$item.Target,$false)
        }
    } finally { $archive.Dispose() }
    return (Join-Path $Destination 'MotionAstra-FX')
}
function Get-MotionAstraOnlinePayload([string]$Version,[string]$Workspace,[hashtable]$State) {
    if ($Version -notmatch '^\d+\.\d+\.\d+$') { throw 'Invalid embedded setup version.' }
    [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
    $State.Message='Connecting to GitHub...';$State.Percent=2
    $release=Invoke-RestMethod -Uri ('https://api.github.com/repos/AmadZaky/MotionAstra/releases/tags/v'+$Version+'-alpha') -Headers @{'User-Agent'='MotionAstra-Setup';'Accept'='application/vnd.github+json'} -TimeoutSec 30
    $asset=Assert-MotionAstraReleaseAsset $release $Version
    $State.Message='Downloading MotionAstra from GitHub...';$State.Percent=5
    $zip=Join-Path $Workspace 'package.zip'
    Invoke-WebRequest -UseBasicParsing -Uri $asset.browser_download_url -OutFile $zip -TimeoutSec 180 | Out-Null
    $State.Message='Verifying download...';$State.Percent=15
    $payload=Expand-MotionAstraDownload $zip (Join-Path $Workspace 'unpacked') $asset.digest $asset.size
    if ((Get-Content -LiteralPath (Join-Path $payload 'VERSION') -Raw).Trim() -cne $Version) { throw 'Downloaded version does not match setup.' }
    return $payload
}
