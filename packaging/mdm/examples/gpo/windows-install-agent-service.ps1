<# 
  Group Policy startup-script example.
  Place this script and the extracted Windows finsafe-fleet archive contents in the
  same SYSVOL folder, then run it as a Computer Startup script.
#>

param(
  [string] $AuthorityUrl = "https://gov.example.com/policy-authority",
  [string] $EnrollToken = "",
  [string] $SentinelJws = ""
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$intuneExample = Join-Path (Split-Path -Parent $scriptDir) "intune\windows-install-agent-service.ps1"

if (-not (Test-Path $intuneExample)) {
  throw "Expected shared Windows installer helper at $intuneExample"
}

& $intuneExample `
  -AuthorityUrl $AuthorityUrl `
  -EnrollToken $EnrollToken `
  -SentinelJws $SentinelJws `
  -DeviceId $env:COMPUTERNAME

