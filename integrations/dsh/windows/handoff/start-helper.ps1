[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$OperationPath,
    [Parameter(Mandatory)][int]$MainPid,
    [Parameter(Mandatory)][int]$HostPid
)
$ErrorActionPreference = 'Stop'
# Give the coordinator its own hidden console. DETACHED_PROCESS exits before
# running this PowerShell build; an inherited console dies with the old Desktop.
$coordinator = Join-Path $PSScriptRoot 'coordinate.ps1'
$arguments = '-NoProfile -File "' + $coordinator + '" -OperationPath "' + $OperationPath + '" -MainPid ' + $MainPid + ' -HostPid ' + $HostPid
$helper = Start-Process -FilePath (Join-Path $PSHOME 'pwsh.exe') -ArgumentList $arguments -WindowStyle Hidden -PassThru
[pscustomobject]@{pid=$helper.Id} | ConvertTo-Json -Compress
