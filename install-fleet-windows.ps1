#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Download, verify, and install FinSAFE managed fleet on Windows (IT pilot / lab).

.DESCRIPTION
  Installs finsafe-fleet-v* from GitHub Releases into C:\Program Files\FinSAFE,
  registers the finsafe-agent Windows service, and optionally deploys sentinel
  and enrollment settings. This is for enterprise fleet rollout — not personal
  finsafe-v* and not a curl|powershell one-liner for end users.

  Production fleets should package the same binaries with Intune Win32 or GPO;
  see packaging/mdm/examples/intune/windows-install-agent-service.ps1.

.EXAMPLE
  .\install-fleet-windows.ps1 `
    -AuthorityUrl "https://gov.example.com/policy-authority" `
    -SentinelPath ".\managed-required.jws" `
    -EnrollToken "one-time-token"

.EXAMPLE
  .\install-fleet-windows.ps1 -Version 0.6.0 -DownloadOnly
#>
[CmdletBinding()]
param(
  [string] $Version = "",
  [string] $Repo = "finogeeks/finsafe",
  [string] $AuthorityUrl = "",
  [string] $InstallDir = "C:\Program Files\FinSAFE",
  [string] $ProgramDataDir = "C:\ProgramData\FinSAFE",
  [string] $SentinelJws = "",
  [string] $SentinelPath = "",
  [string] $EnrollToken = "",
  [string] $DeviceId = $env:COMPUTERNAME,
  [switch] $SkipChecksum,
  [switch] $DownloadOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$TargetTriple = "x86_64-pc-windows-msvc"
$FleetBinaryNames = @("finsafe.exe", "finsafe-agent.exe", "finsafe-winhelper.exe")

function Write-Info([string] $Message) {
  Write-Host "==> $Message"
}

function Get-VersionTag([string] $Raw) {
  if ([string]::IsNullOrWhiteSpace($Raw)) {
    return ""
  }
  $trimmed = $Raw.Trim()
  if ($trimmed.StartsWith("v")) {
    return $trimmed
  }
  return "v$trimmed"
}

function Get-VersionStrip([string] $Tag) {
  if ($Tag.StartsWith("v")) {
    return $Tag.Substring(1)
  }
  return $Tag
}

function Resolve-ReleaseVersion {
  param([string] $RepoName, [string] $RequestedVersion)

  if (-not [string]::IsNullOrWhiteSpace($RequestedVersion)) {
    $tag = Get-VersionTag $RequestedVersion
    return @{
      Tag   = $tag
      Strip = (Get-VersionStrip $tag)
    }
  }

  Write-Info "resolving latest release for https://github.com/$RepoName"
  $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$RepoName/releases/latest" -Headers @{
    Accept = "application/vnd.github+json"
  }
  $tag = [string]$release.tag_name
  if ([string]::IsNullOrWhiteSpace($tag)) {
    throw "could not parse latest release tag from GitHub API"
  }
  return @{
    Tag   = $tag
    Strip = (Get-VersionStrip $tag)
  }
}

function Get-ExpectedSha256 {
  param([string] $SumsFile, [string] $ArchiveName)

  $escapedName = [regex]::Escape($ArchiveName)
  $pattern = "^\s*([0-9a-fA-F]{64})\s+$escapedName\s*$"
  # @(...) forces an array so .Count is reliable even on a single match. Under
  # Set-StrictMode -Version Latest a lone MatchInfo is a scalar without .Count,
  # which previously threw "The property 'Count' cannot be found on this object".
  # Avoid the name $matches: it is a PowerShell automatic variable.
  $shaMatches = @(Select-String -Path $SumsFile -Pattern $pattern)
  if ($shaMatches.Count -ne 1) {
    throw "expected exactly one SHA256 line for $ArchiveName in SHA256SUMS (found $($shaMatches.Count))"
  }
  return $shaMatches[0].Matches[0].Groups[1].Value.ToLowerInvariant()
}

function Expand-FleetArchive {
  param([string] $ArchivePath, [string] $DestDir)

  New-Item -ItemType Directory -Force -Path $DestDir | Out-Null
  $tar = Get-Command tar -ErrorAction SilentlyContinue
  if ($tar) {
    $help = & tar --help 2>&1 | Out-String
    if ($help -match "zstd") {
      Write-Info "extracting with tar --zstd"
      & tar --zstd -xf $ArchivePath -C $DestDir
      return
    }
  }

  $zstd = Get-Command zstd -ErrorAction SilentlyContinue
  if ($zstd -and $tar) {
    Write-Info "extracting with zstd and tar"
    & zstd -dc $ArchivePath | & tar -xf - -C $DestDir
    return
  }

  throw @"
could not extract .tar.zst archive.
Install one of:
  - tar with --zstd support (Windows 11 / recent Windows 10)
  - zstd CLI plus tar on PATH
Or extract finsafe-fleet-v* manually, then run:
  packaging\mdm\examples\intune\windows-install-agent-service.ps1
"@
}

function Resolve-SentinelContent {
  if (-not [string]::IsNullOrWhiteSpace($SentinelJws) -and -not [string]::IsNullOrWhiteSpace($SentinelPath)) {
    throw "use only one of -SentinelJws or -SentinelPath"
  }
  if (-not [string]::IsNullOrWhiteSpace($SentinelPath)) {
    if (-not (Test-Path -LiteralPath $SentinelPath)) {
      throw "sentinel file not found: $SentinelPath"
    }
    return (Get-Content -LiteralPath $SentinelPath -Raw)
  }
  return $SentinelJws
}

if (-not $DownloadOnly -and [string]::IsNullOrWhiteSpace($AuthorityUrl)) {
  throw "AuthorityUrl is required unless -DownloadOnly is set"
}

$releaseInfo = Resolve-ReleaseVersion -RepoName $Repo -RequestedVersion $Version
$versionTag = $releaseInfo.Tag
$versionStrip = $releaseInfo.Strip
$archiveName = "finsafe-fleet-v${versionStrip}-${TargetTriple}.tar.zst"
$innerDirName = "finsafe-fleet-v${versionStrip}-${TargetTriple}"
$baseUrl = "https://github.com/$Repo/releases/download/$versionTag"
$archiveUrl = "$baseUrl/$archiveName"
$sumsUrl = "$baseUrl/SHA256SUMS"

$stage = Join-Path $env:TEMP ("finsafe-fleet-install-" + [Guid]::NewGuid().ToString("n"))
New-Item -ItemType Directory -Force -Path $stage | Out-Null
try {
  $archivePath = Join-Path $stage $archiveName
  Write-Info "downloading $archiveUrl"
  Invoke-WebRequest -Uri $archiveUrl -OutFile $archivePath -UseBasicParsing

  if (-not $SkipChecksum) {
    $sumsPath = Join-Path $stage "SHA256SUMS"
    Write-Info "downloading $sumsUrl"
    Invoke-WebRequest -Uri $sumsUrl -OutFile $sumsPath -UseBasicParsing
    $expected = Get-ExpectedSha256 -SumsFile $sumsPath -ArchiveName $archiveName
    $actual = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($expected -ne $actual) {
      throw "SHA256 mismatch for $archiveName (expected $expected, got $actual)"
    }
    Write-Info "checksum OK ($archiveName)"
  } else {
    Write-Info "WARNING: skipping checksum verification (-SkipChecksum)"
  }

  $extractRoot = Join-Path $stage "extract"
  Expand-FleetArchive -ArchivePath $archivePath -DestDir $extractRoot
  $fleetDir = Join-Path $extractRoot $innerDirName
  if (-not (Test-Path -LiteralPath $fleetDir)) {
    throw "expected directory missing after extract: $fleetDir"
  }
  foreach ($name in $FleetBinaryNames) {
    $bin = Join-Path $fleetDir $name
    if (-not (Test-Path -LiteralPath $bin)) {
      throw "expected binary missing in fleet archive: $name"
    }
  }

  if ($DownloadOnly) {
    $outDir = Join-Path (Get-Location) $innerDirName
    if (Test-Path -LiteralPath $outDir) {
      Remove-Item -LiteralPath $outDir -Recurse -Force
    }
    Copy-Item -LiteralPath $fleetDir -Destination $outDir -Recurse
    Write-Info "fleet binaries extracted to $outDir"
    Write-Info "next: run packaging\mdm\examples\intune\windows-install-agent-service.ps1 with -SourceDir pointing at that folder"
    return
  }

  $installerHelper = Join-Path $PSScriptRoot "packaging\mdm\examples\intune\windows-install-agent-service.ps1"
  if (-not (Test-Path -LiteralPath $installerHelper)) {
    throw "installer helper not found: $installerHelper (run this script from the public finsafe repo root layout)"
  }

  $sentinelContent = Resolve-SentinelContent
  Write-Info "installing fleet binaries and finsafe-agent service"
  & $installerHelper `
    -AuthorityUrl $AuthorityUrl `
    -InstallDir $InstallDir `
    -ProgramDataDir $ProgramDataDir `
    -SourceDir $fleetDir `
    -SentinelJws $sentinelContent `
    -EnrollToken $EnrollToken `
    -DeviceId $DeviceId

  Write-Info "done"
  Write-Info "verify: Get-Service finsafe-agent; Test-Path `"$ProgramDataDir\enrolled.json`""
  Write-Info "remove enroll token from the service Environment registry value after enrollment succeeds"
}
finally {
  if (Test-Path -LiteralPath $stage) {
    Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
  }
}
