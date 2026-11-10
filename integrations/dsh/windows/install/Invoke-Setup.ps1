#Requires -Version 7.0
param(
    [Parameter(Mandatory)][string]$PackagePath,
    [Parameter(Mandatory)][string]$InstallDirectory,
    [Parameter(Mandatory)][string]$Configuration,
    [Parameter(Mandatory)][string]$Candidate,
    [switch]$IntegrationOutputs
)
$ErrorActionPreference = 'Stop'
$paths = @($PackagePath,$InstallDirectory,$Configuration,$Candidate)
foreach ($path in $paths) {
    if (![IO.Path]::IsPathFullyQualified($path) -or $path.IndexOfAny([char[]]"`0`r`n`"") -ge 0) { throw 'Invalid absolute setup path' }
}
$arguments = @('/S')
$arguments += '/CONFIGDIR="' + $Configuration + '"'
$arguments += '/CANDIDATE="' + $Candidate + '"'
if (!$IntegrationOutputs) { $arguments += '/NOINTEGRATIONS' }
$arguments += '/SELFUPDATE=0'
# NSIS consumes the entire final /D= value, including spaces.
$arguments += '/D=' + $InstallDirectory
$code = 1
$detail = ''
try {
    $setup = Start-Process -FilePath $PackagePath -ArgumentList ($arguments -join ' ') -WorkingDirectory (Split-Path -Parent $PackagePath) -Verb RunAs -Wait -PassThru
    $code = $setup.ExitCode
} catch {
    $code = 1
    $failure = $_.Exception
    while ($failure) {
        if ($failure.PSObject.Properties['NativeErrorCode']) { $code = $failure.NativeErrorCode; break }
        $failure = $failure.InnerException
    }
    [Console]::Error.WriteLine($_.Exception.Message)
    $detail = $_.Exception.Message
} finally {
    $phase = if ($code -eq 0) { 'completed' } elseif ($code -in @(3010,1641)) { 'reboot-required' } elseif ($code -in @(2,1223,1602)) { 'cancelled' } else { 'failed' }
    $path = Join-Path (Split-Path -Parent $PackagePath) 'setup-result.json'
    $bytes = [Text.Encoding]::UTF8.GetBytes((@{code=$code;phase=$phase;detail=$detail} | ConvertTo-Json -Compress))
    $result = [IO.File]::Open($path,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::Read)
    try { $result.Write($bytes,0,$bytes.Length) } finally { $result.Dispose() }
}
exit $code
