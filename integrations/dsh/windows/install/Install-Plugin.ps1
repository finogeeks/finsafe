#Requires -Version 7.0
[CmdletBinding(DefaultParameterSetName='Install')]
param(
    [Parameter(Mandatory,ParameterSetName='Install')][string]$Archive,
    [Parameter(Mandatory,ParameterSetName='Remove')][switch]$Remove,
    [string]$DshDirectory = (Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'Programs/DeepSeek Harness'),
    [string]$DshHome,
    [string]$InstallDirectory = (Join-Path ([Environment]::GetFolderPath("ProgramFiles")) "FinSAFE/dsh-plugin"),
    [string]$ConfigDirectory = (Join-Path ([Environment]::GetFolderPath("CommonApplicationData")) "FinSAFE/dsh-plugin/config"),
    [string]$Pwsh = (Get-Process -Id $PID).Path,
    [switch]$Offline
)
$ErrorActionPreference = 'Stop'
if (!$IsWindows) { throw 'This plugin requires Windows' }
$DshDirectory = (Resolve-Path -LiteralPath $DshDirectory).Path
$desktop = (Get-Item -LiteralPath (Join-Path $DshDirectory 'DeepSeek Harness.exe')).FullName
$dshCli = Join-Path $DshDirectory 'resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js'
function Invoke-DesktopNode([string[]]$NodeArguments) {
    # Electron is a GUI image. Explicit pipes and WaitForExit are required even in Node mode.
    $start = [Diagnostics.ProcessStartInfo]::new($desktop)
    $start.UseShellExecute = $false
    $start.CreateNoWindow = $true
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    foreach ($argument in (@('--expose-internals') + $NodeArguments)) { $start.ArgumentList.Add($argument) }
    $start.Environment['ELECTRON_RUN_AS_NODE'] = '1'
    $child = [Diagnostics.Process]::Start($start)
    $output = $child.StandardOutput.ReadToEndAsync()
    $errors = $child.StandardError.ReadToEndAsync()
    $child.WaitForExit()
    if ($child.ExitCode -ne 0) { throw "DSH operation failed: $($errors.GetAwaiter().GetResult()). Backup: $backup" }
    return $output.GetAwaiter().GetResult()
}
if (!$DshHome) {
    $homeResult = Invoke-DesktopNode @((Join-Path $PSScriptRoot 'resolve-home.mjs'),(Join-Path $DshDirectory 'resources/app.asar/dsh')) | ConvertFrom-Json
    $DshHome = $homeResult.home
}
$DshHome = [IO.Path]::GetFullPath($DshHome)
$profileRoot = Join-Path $DshHome 'profiles/desktop'
$stateRoot = Join-Path $DshHome 'finsafe-windows'
$backup = Join-Path $stateRoot ('install-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
foreach ($name in @('package.json','cordis.patch.yml','pnpm-lock.yaml','pnpm-workspace.yaml')) {
    $source = Join-Path $profileRoot $name
    if (Test-Path -LiteralPath $source) { Copy-Item -LiteralPath $source -Destination (Join-Path $backup $name) }
}
$configPath = Join-Path $stateRoot 'config.json'
if (Test-Path -LiteralPath $configPath) { Copy-Item -LiteralPath $configPath -Destination (Join-Path $backup 'config.json') }
$config = @{}
foreach ($entry in @(@('pwsh',$Pwsh))) {
    if ($entry[1]) { $config[$entry[0]] = $entry[1] }
}
$runtimeRoot = Join-Path $DshDirectory 'resources/app.asar/dsh'
$metadata = Join-Path $PSScriptRoot 'metadata.mjs'
$previousNodeMode = $env:ELECTRON_RUN_AS_NODE
$previousHome = $env:DSH_HOME
try {
    if (!$Remove) {
        $config.pwsh = (Get-Item -LiteralPath $Pwsh).FullName
        $major = & $config.pwsh -NoProfile -Command '$PSVersionTable.PSVersion.Major'
        if ($LASTEXITCODE -ne 0 -or [int]$major -lt 7) { throw 'PowerShell 7 is required' }
        $archivePath = (Get-Item -LiteralPath $Archive).FullName
        $arguments = @('plugin','--profile','desktop','add',$archivePath,'--ignore-scripts')
        if ($Offline) { $arguments += '--offline' }
    } else {
        # Read and clean our override before pnpm removes this script's package.
        Invoke-DesktopNode @($metadata,'remove-override',$runtimeRoot,$DshHome) | Out-Null
        $arguments = @('plugin','--profile','desktop','remove','@finogeeks2026/finshield','--config.ignore-scripts=true')
    }
    $env:DSH_HOME = $DshHome
    Invoke-DesktopNode (@($dshCli) + $arguments) | Out-Null
    if ($Remove) {
        if (Test-Path -LiteralPath $configPath) { Remove-Item -LiteralPath $configPath }
    } else {
        $installedRoot = Join-Path $profileRoot 'node_modules/@finogeeks2026/finshield'
        $runtimeParent = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'FinSAFE/dsh-plugin/downloads'
        $config.installation = [IO.Path]::GetFullPath($InstallDirectory)
        $config.configuration = [IO.Path]::GetFullPath($ConfigDirectory)
        $config.localAppData = [Environment]::GetFolderPath('LocalApplicationData')
        $config.downloads = $runtimeParent
        $download = Invoke-DesktopNode @((Join-Path $installedRoot 'install/runtime.js'),
            '--downloads',$runtimeParent,'--installation',$config.installation,
            '--configuration',$config.configuration,'--pwsh',$config.pwsh,
            '--local-app-data',$config.localAppData) | ConvertFrom-Json
        $version = (Get-Content -LiteralPath (Join-Path $installedRoot 'package.json') -Raw | ConvertFrom-Json).version
        @{version=$version;resultPath=$download.resultPath;exitCode=$download.exitCode;rebootRequired=$download.rebootRequired} |
            ConvertTo-Json | Set-Content -LiteralPath (Join-Path $stateRoot "setup-$version.json") -Encoding utf8
        $config.executable = $download.executable
        $config.yamlPath = $download.yamlPath
        Invoke-DesktopNode @($metadata,'remove-override',$runtimeRoot,$DshHome) | Out-Null
        $config | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $configPath -Encoding utf8
    }
    @{operation=$(if($Remove){'removed'}else{'installed'});profile=$profileRoot;backup=$backup;restartRequired=$true;nativeResult=$download} | ConvertTo-Json
} finally {
    $env:ELECTRON_RUN_AS_NODE = $previousNodeMode
    $env:DSH_HOME = $previousHome
}
