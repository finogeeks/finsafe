param(
  [string] $AuthorityUrl = "https://gov.example.com/policy-authority",
  [string] $InstallDir = "C:\Program Files\FinSAFE",
  [string] $ProgramDataDir = "C:\ProgramData\FinSAFE",
  [string] $SourceDir = "",
  [string] $SentinelJws = "",
  [string] $SentinelPath = "",
  [string] $EnrollToken = "",
  [string] $DeviceId = $env:COMPUTERNAME
)

$ErrorActionPreference = "Stop"

# Match Unix install-fleet-unix.sh / deploy-sentinel.sh: tr -d '\n\r' first, then [[ -n ]].
# Do not use .Trim() — spaces inside or around the JWS must be preserved.
function Normalize-SentinelJws([string] $Value) {
  if ($null -eq $Value) { return $Value }
  $compact = $Value -replace '[\r\n]+', ''
  if ([string]::IsNullOrWhiteSpace($compact)) { return '' }
  return $compact
}

function Write-ManagedRequiredSentinel([string] $Dir, [string] $Jws) {
  $path = Join-Path $Dir "managed-required.json"
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($path, "$Jws`n", $utf8NoBom)
}

if ($SentinelJws -and $SentinelPath) {
  throw "use only one of -SentinelJws or -SentinelPath"
}
if ($SentinelPath) {
  if (-not (Test-Path -LiteralPath $SentinelPath)) {
    throw "sentinel file not found: $SentinelPath"
  }
  $SentinelJws = Get-Content -LiteralPath $SentinelPath -Raw
}
if ($SentinelJws) {
  $SentinelJws = Normalize-SentinelJws $SentinelJws
}

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
New-Item -ItemType Directory -Force -Path $ProgramDataDir | Out-Null

$binaryDir = $SourceDir
if ([string]::IsNullOrWhiteSpace($binaryDir)) {
  $binaryDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}
foreach ($name in @("finsafe.exe", "finsafe-agent.exe", "finsafe-winhelper.exe")) {
  $source = Join-Path $binaryDir $name
  if (-not (Test-Path -LiteralPath $source)) {
    throw "Missing $name under $binaryDir. Extract finsafe-fleet-v* or pass -SourceDir."
  }
  Copy-Item -Force -LiteralPath $source -Destination (Join-Path $InstallDir $name)
}

if ($SentinelJws) {
  Write-ManagedRequiredSentinel -Dir $ProgramDataDir -Jws $SentinelJws
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

$finsafeExe = Join-Path $InstallDir "finsafe.exe"
if (Test-Path -LiteralPath $finsafeExe) {
  Write-Host "FinSAFE: running one-time Windows sandbox setup (finsafe-winhelper service)..."
  & $finsafeExe setup-windows --no-elevate
  if ($LASTEXITCODE -ne 0) {
    throw "finsafe setup-windows failed (exit $LASTEXITCODE)"
  }
}

Write-Host "FinSAFE Windows agent service installed. Remove FINSAFE_ENROLL_TOKEN after enrolled.json appears."

