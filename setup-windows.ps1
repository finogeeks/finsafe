#Requires -Version 5.1
<#
.SYNOPSIS
  One-time FinSAFE Windows setup for personal desktops (helper service + network sandbox).

.DESCRIPTION
  Registers and starts the finsafe-winhelper Windows service beside finsafe.exe, then
  provisions the machine-wide network fence used by policies with `network: none`.

  Normal users run:
    finsafe setup-windows
  which may show a single Windows permission prompt. This script is the same steps for
  installers (install.ps1) when finsafe.exe is already on PATH.

.EXAMPLE
  .\setup-windows.ps1
  finsafe setup-windows
#>
[CmdletBinding()]
param(
  [string] $FinsafeExe = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-FinsafeExe {
  param([string] $Requested)

  if (-not [string]::IsNullOrWhiteSpace($Requested)) {
    if (-not (Test-Path -LiteralPath $Requested)) {
      throw "finsafe.exe not found: $Requested"
    }
    return (Resolve-Path -LiteralPath $Requested).Path
  }

  $cmd = Get-Command finsafe.exe -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd.Source
  }

  throw @"
finsafe.exe was not found on PATH.
Install FinSAFE first: https://github.com/finogeeks/finsafe/releases
Or pass -FinsafeExe 'C:\path\to\finsafe.exe'
"@
}

$finsafePath = Resolve-FinsafeExe -Requested $FinsafeExe
Write-Host "==> running Windows setup via $finsafePath"
& $finsafePath setup-windows
if ($LASTEXITCODE -ne 0) {
  throw "finsafe setup-windows failed (exit $LASTEXITCODE)"
}
Write-Host "==> FinSAFE Windows setup complete"
