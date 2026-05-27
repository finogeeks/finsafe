# Install personal-mode finsafe from GitHub releases (finogeeks/finsafe).
# Installs finsafe.exe into FINSAFE_INSTALL_DIR (default: %USERPROFILE%\.local\bin).
#
# Intended usage (PowerShell 5.1+):
#   irm https://raw.githubusercontent.com/finogeeks/finsafe/main/install.ps1 | iex
# Pin version or install directory:
#   $env:FINSAFE_VERSION = '0.5.1'; irm .../install.ps1 | iex
#   .\install.ps1 -Version 0.5.1 -InstallDir "$env:USERPROFILE\.local\bin"
#
# For managed fleet on Windows, use install-fleet-windows.ps1 (elevated), not this script.

[CmdletBinding()]
param(
  [string] $Version = "",
  [string] $Repo = "finogeeks/finsafe",
  [string] $InstallDir = "",
  [switch] $SkipChecksum
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($InstallDir)) {
  $InstallDir = Join-Path $env:USERPROFILE ".local\bin"
}

$TargetTriple = "x86_64-pc-windows-msvc"

function Write-Info([string] $Message) {
  Write-Host "==> $Message"
}

function Get-VersionTag([string] $Raw) {
  if ([string]::IsNullOrWhiteSpace($Raw)) { return "" }
  $trimmed = $Raw.Trim()
  if ($trimmed.StartsWith("v")) { return $trimmed }
  return "v$trimmed"
}

function Get-VersionStrip([string] $Tag) {
  if ($Tag.StartsWith("v")) { return $Tag.Substring(1) }
  return $Tag
}

function Resolve-ReleaseVersion {
  param([string] $RepoName, [string] $RequestedVersion)

  if (-not [string]::IsNullOrWhiteSpace($env:FINSAFE_VERSION)) {
    $RequestedVersion = $env:FINSAFE_VERSION
  }

  if (-not [string]::IsNullOrWhiteSpace($RequestedVersion)) {
    $tag = Get-VersionTag $RequestedVersion
    return @{ Tag = $tag; Strip = (Get-VersionStrip $tag) }
  }

  Write-Info "resolving latest release for https://github.com/$RepoName"
  $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$RepoName/releases/latest" -Headers @{
    Accept = "application/vnd.github+json"
  }
  $tag = [string]$release.tag_name
  if ([string]::IsNullOrWhiteSpace($tag)) {
    throw "could not parse latest release tag from GitHub API"
  }
  return @{ Tag = $tag; Strip = (Get-VersionStrip $tag) }
}

function Get-ExpectedSha256 {
  param([string] $SumsFile, [string] $ArchiveName)

  $escapedName = [regex]::Escape($ArchiveName)
  $pattern = "^\s*([0-9a-fA-F]{64})\s+$escapedName\s*$"
  $matches = Select-String -Path $SumsFile -Pattern $pattern
  if ($matches.Count -ne 1) {
    throw "expected exactly one SHA256 line for $ArchiveName in SHA256SUMS (found $($matches.Count))"
  }
  return $matches[0].Matches[0].Groups[1].Value.ToLowerInvariant()
}

function Expand-PersonalArchive {
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
Install tar with --zstd support (Windows 11 / recent Windows 10) or zstd CLI plus tar on PATH.
Or download finsafe-v* manually from GitHub Releases.
"@
}

$skipFromEnv = $env:FINSAFE_INSECURE_SKIP_CHECKSUM -eq "1"
if ($skipFromEnv) { $SkipChecksum = $true }

$releaseInfo = Resolve-ReleaseVersion -RepoName $Repo -RequestedVersion $Version
$versionTag = $releaseInfo.Tag
$versionStrip = $releaseInfo.Strip
$archiveName = "finsafe-v${versionStrip}-${TargetTriple}.tar.zst"
$innerDirName = "finsafe-v${versionStrip}-${TargetTriple}"
$baseUrl = "https://github.com/$Repo/releases/download/$versionTag"
$archiveUrl = "$baseUrl/$archiveName"
$sumsUrl = "$baseUrl/SHA256SUMS"

$stage = Join-Path $env:TEMP ("finsafe-install-" + [Guid]::NewGuid().ToString("n"))
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
    Write-Info "WARNING: skipping checksum verification (SkipChecksum or FINSAFE_INSECURE_SKIP_CHECKSUM=1)"
  }

  $extractRoot = Join-Path $stage "extract"
  Expand-PersonalArchive -ArchivePath $archivePath -DestDir $extractRoot
  $bundleDir = Join-Path $extractRoot $innerDirName
  if (-not (Test-Path -LiteralPath $bundleDir)) {
    throw "expected directory missing after extract: $bundleDir"
  }

  $sourceExe = Join-Path $bundleDir "finsafe.exe"
  if (-not (Test-Path -LiteralPath $sourceExe)) {
    throw "expected binary missing: $sourceExe"
  }

  New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
  $destExe = Join-Path $InstallDir "finsafe.exe"
  Copy-Item -Force -LiteralPath $sourceExe -Destination $destExe

  Write-Info "installed: $destExe"
  $onPath = $false
  foreach ($part in ($env:PATH -split ';')) {
    if ($part -eq $InstallDir) { $onPath = $true; break }
  }
  if (-not $onPath) {
    Write-Info "add to your user PATH: $InstallDir"
    Write-Info '  [Environment]::SetEnvironmentVariable("Path", $env:Path + ";' + $InstallDir + '", "User")'
  }

  & $destExe version
  Write-Info "done"
  Write-Info "managed fleet archives (finsafe-fleet-v*) use install-fleet-windows.ps1; see README.md"
}
finally {
  if (Test-Path -LiteralPath $stage) {
    Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
  }
}
