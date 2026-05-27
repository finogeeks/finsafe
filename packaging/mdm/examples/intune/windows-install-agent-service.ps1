param(
  [string] $AuthorityUrl = "https://gov.example.com/policy-authority",
  [string] $InstallDir = "C:\Program Files\FinSAFE",
  [string] $ProgramDataDir = "C:\ProgramData\FinSAFE",
  [string] $SentinelJws = "",
  [string] $EnrollToken = "",
  [string] $DeviceId = $env:COMPUTERNAME
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
New-Item -ItemType Directory -Force -Path $ProgramDataDir | Out-Null

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
foreach ($name in @("finsafe.exe", "finsafe-agent.exe", "finsafe-winhelper.exe")) {
  $source = Join-Path $scriptDir $name
  if (-not (Test-Path $source)) {
    throw "Missing $name beside this script. Extract the finsafe-fleet archive before running."
  }
  Copy-Item -Force $source (Join-Path $InstallDir $name)
}

if ($SentinelJws) {
  Set-Content -Path (Join-Path $ProgramDataDir "managed-required.json") -Value $SentinelJws -NoNewline
}

$serviceName = "finsafe-agent"
$agentExe = Join-Path $InstallDir "finsafe-agent.exe"

if (-not (Get-Service -Name $serviceName -ErrorAction SilentlyContinue)) {
  sc.exe create $serviceName binPath= "`"$agentExe`"" start= auto DisplayName= "FinSAFE Agent" | Out-Null
}

$envValues = @("FINSAFE_AUTHORITY_URL=$AuthorityUrl")
if ($DeviceId) {
  $envValues += "FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID=$DeviceId"
}
if ($EnrollToken) {
  $envValues += "FINSAFE_ENROLL_TOKEN=$EnrollToken"
}

New-Item -Force "HKLM:\SYSTEM\CurrentControlSet\Services\$serviceName" | Out-Null
New-ItemProperty `
  -Path "HKLM:\SYSTEM\CurrentControlSet\Services\$serviceName" `
  -Name Environment `
  -PropertyType MultiString `
  -Value $envValues `
  -Force | Out-Null

sc.exe failure $serviceName reset= 86400 actions= restart/60000/restart/60000/""/60000 | Out-Null
sc.exe start $serviceName | Out-Null

Write-Host "FinSAFE Windows agent service installed. Remove FINSAFE_ENROLL_TOKEN after enrolled.json appears."

