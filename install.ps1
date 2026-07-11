# Install personal-mode finsafe from GitHub releases (finogeeks/finsafe).
#
# Preferred path: download the signed Windows installer
# (`finsafe-<version>-x64-setup.exe`) when published. That bootstrapper enables
# Client-ProjFS (may reboot once), installs finsafe + winhelper, and does not
# report success until `finsafe probe` reports projection readiness.
#
# Fallback: archive install of finsafe.exe + finsafe-winhelper.exe into
# FINSAFE_INSTALL_DIR, then `finsafe setup-windows` (same ProjFS contract).
#
# Intended usage (PowerShell 5.1+):
#   irm https://raw.githubusercontent.com/finogeeks/finsafe/main/install.ps1 | iex
# Pin version or install directory:
#   $env:FINSAFE_VERSION = '0.6.0'; irm .../install.ps1 | iex
#   .\install.ps1 -Version 0.6.0 -InstallDir "$env:USERPROFILE\.local\bin"
#
# For managed fleet on Windows, use install-fleet-windows.ps1 (elevated), not this script.

[CmdletBinding()]
param(
  [string] $Version = "",
  [string] $Repo = "",
  [string] $InstallDir = "",
  [switch] $SkipChecksum,
  [switch] $Help
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ($Help) {
  @"
Usage:
  install.ps1 [-Version <x.y.z|vx.y.z>] [-InstallDir <path>] [-SkipChecksum]

Environment:
  FINSAFE_VERSION                 Install this version (e.g. 0.6.0). If unset, uses latest.
  FINSAFE_INSTALL_DIR             Install directory (default: %USERPROFILE%\.local\bin)
  FINSAFE_REPO                    GitHub owner/name (default: finogeeks/finsafe)
  FINSAFE_INSECURE_SKIP_CHECKSUM  Set to 1 to skip SHA256 verification (not recommended)

Examples:
  irm https://raw.githubusercontent.com/finogeeks/finsafe/main/install.ps1 | iex
  `$env:FINSAFE_VERSION = '0.6.0'; irm .../install.ps1 | iex
  .\install.ps1 -Version 0.6.0
"@ | Write-Host
  exit 0
}

if ([string]::IsNullOrWhiteSpace($Repo)) {
  $Repo = if ($env:FINSAFE_REPO) { $env:FINSAFE_REPO } else { "finogeeks/finsafe" }
}

if ([string]::IsNullOrWhiteSpace($InstallDir)) {
  $InstallDir = if ($env:FINSAFE_INSTALL_DIR) { $env:FINSAFE_INSTALL_DIR } else {
    Join-Path $env:USERPROFILE ".local\bin"
  }
}

$TargetTriple = "x86_64-pc-windows-msvc"
$CliBinaryName = "finsafe.exe"
$WinhelperBinaryName = "finsafe-winhelper.exe"

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
Or download finsafe-v*-x86_64-pc-windows-msvc.tar.zst manually from GitHub Releases.
"@
}

function Resolve-CliExePath {
  param(
    [string] $BundleDir,
    [string] $PreferredName,
    [string] $LegacyName
  )

  $preferred = Join-Path $BundleDir $PreferredName
  if (Test-Path -LiteralPath $preferred) {
    return $preferred
  }

  $legacy = Join-Path $BundleDir $LegacyName
  if (Test-Path -LiteralPath $legacy) {
    throw @"
release archive contains '$LegacyName' but not '$PreferredName'.
This usually means an older Windows CLI build before the packaging fix.
Re-download with install.ps1, or run:
  Rename-Item -LiteralPath '$legacy' -NewName '$PreferredName'
Then invoke .\$PreferredName (not .\$LegacyName) in PowerShell.
"@
  }

  throw "expected binary missing in release archive: $PreferredName (looked in $BundleDir)"
}

function Install-OptionalCompanion {
  param(
    [string] $BundleDir,
    [string] $Name,
    [string] $InstallDirectory
  )

  $source = Join-Path $BundleDir $Name
  if (-not (Test-Path -LiteralPath $source)) {
    return
  }
  $dest = Join-Path $InstallDirectory $Name
  Copy-Item -Force -LiteralPath $source -Destination $dest
  Write-Info "installed: $dest"
}

if ($env:FINSAFE_INSECURE_SKIP_CHECKSUM -eq "1") {
  $SkipChecksum = $true
}

$releaseInfo = Resolve-ReleaseVersion -RepoName $Repo -RequestedVersion $Version
$versionTag = $releaseInfo.Tag
$versionStrip = $releaseInfo.Strip
$baseUrl = "https://github.com/$Repo/releases/download/$versionTag"
$setupName = "finsafe-${versionStrip}-x64-setup.exe"
$setupUrl = "$baseUrl/$setupName"
$archiveName = "finsafe-v${versionStrip}-${TargetTriple}.tar.zst"
$innerDirName = "finsafe-v${versionStrip}-${TargetTriple}"
$archiveUrl = "$baseUrl/$archiveName"
$sumsUrl = "$baseUrl/SHA256SUMS"

$stage = Join-Path $env:TEMP ("finsafe-install-" + [Guid]::NewGuid().ToString("n"))
New-Item -ItemType Directory -Force -Path $stage | Out-Null
try {
  # Prefer the signed Burn bootstrapper when the release publishes it.
  $setupPath = Join-Path $stage $setupName
  $usedInstaller = $false
  try {
    Write-Info "trying signed installer $setupUrl"
    Invoke-WebRequest -Uri $setupUrl -OutFile $setupPath -UseBasicParsing
    if ((Test-Path -LiteralPath $setupPath) -and ((Get-Item -LiteralPath $setupPath).Length -gt 0)) {
      Write-Info "launching installer (UAC / optional reboot may follow; setup resumes after reboot)"
      $p = Start-Process -FilePath $setupPath -Wait -PassThru
      if ($p.ExitCode -eq 3010) {
        Write-Info "Windows requires a reboot to finish Projected File System setup (exit 3010)."
        Write-Info "Reboot, then re-run install.ps1 or finsafe setup-windows (idempotent)."
        exit 3010
      }
      if ($p.ExitCode -ne 0) {
        throw "installer exited $($p.ExitCode)"
      }
      Write-Info "installer completed"
      $usedInstaller = $true
    }
  } catch {
    Write-Info "signed installer not used ($($_.Exception.Message)); falling back to archive install"
  }
  if ($usedInstaller) {
    Write-Info "done (installer path)"
    exit 0
  }

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

  $sourceExe = Resolve-CliExePath -BundleDir $bundleDir -PreferredName $CliBinaryName -LegacyName "finsafe"

  New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
  $destExe = Join-Path $InstallDir $CliBinaryName
  Copy-Item -Force -LiteralPath $sourceExe -Destination $destExe
  Write-Info "installed: $destExe"

  $destHelper = Join-Path $InstallDir $WinhelperBinaryName
  Install-OptionalCompanion -BundleDir $bundleDir -Name $WinhelperBinaryName -InstallDirectory $InstallDir

  if (Test-Path -LiteralPath $destHelper) {
    Write-Info "running one-time Windows setup (helper + ProjFS; accept the permission prompt if shown)"
    & $destExe setup-windows
    if ($LASTEXITCODE -eq 3010) {
      Write-Info "Windows requires a reboot to finish Projected File System setup (exit 3010)."
      Write-Info "Reboot, then re-run '$CliBinaryName setup-windows' (idempotent)."
      exit 3010
    }
    if ($LASTEXITCODE -ne 0) {
      Write-Info "WARNING: setup-windows exited $LASTEXITCODE — run '$CliBinaryName setup-windows' after install"
      Write-Info "Large venv/node_modules launches fail closed until projection_smoke_works is true."
    }
  } else {
    Write-Info "WARNING: $WinhelperBinaryName not in archive; network-locked policies will not work on Windows"
  }

  $onPath = $false
  foreach ($part in ($env:PATH -split ';')) {
    if ($part -eq $InstallDir) { $onPath = $true; break }
  }
  if (-not $onPath) {
    Write-Info "add to your user PATH: $InstallDir"
    Write-Info ('  [Environment]::SetEnvironmentVariable("Path", $env:Path + ";' + $InstallDir + '", "User")')
  }

  & $destExe version
  Write-Info "done"
  Write-Info "run `finsafe init` to create %APPDATA%\FinSAFE\policies\ with seeded example YAML (or clone https://github.com/finogeeks/finsafe for the full examples tree)"
  Write-Info "run finsafe as: $CliBinaryName (e.g. .\$CliBinaryName --help) — PowerShell requires the .exe suffix"
  Write-Info "managed fleet archives (finsafe-fleet-v*) use install-fleet-windows.ps1; see README.md"
}
finally {
  if (Test-Path -LiteralPath $stage) {
    Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
  }
}
