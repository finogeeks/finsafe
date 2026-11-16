param(
    [string]$Project,
    [string]$Executable,
    [string]$Bin,
    [ValidateRange(100, 120000)][int]$TimeoutMs = 12000,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$kitRoot = Split-Path -Parent $PSScriptRoot
$buildProcess = $null
$hostProcess = $null
$statePath = Join-Path $kitRoot 'target/workbench.json'
$exitCode = 0
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)

function Quote-Argument([string]$Value) {
    # Win32 command-line quoting, including paths with spaces and trailing slashes.
    $escaped = [regex]::Replace($Value, '(\\*)("|$)', [System.Text.RegularExpressions.MatchEvaluator]{
        param($Match)
        $slashes = $Match.Groups[1].Value
        if ($Match.Groups[2].Value -eq '"') { return $slashes + $slashes + '\"' }
        return $slashes + $slashes
    })
    return '"' + $escaped + '"'
}

function Start-Child([string]$File, [string[]]$Arguments) {
    $info = New-Object System.Diagnostics.ProcessStartInfo
    $info.FileName = $File
    $info.Arguments = ($Arguments | ForEach-Object { Quote-Argument $_ }) -join ' '
    $info.WorkingDirectory = $kitRoot
    $info.UseShellExecute = $false
    # Share the launcher's console so closing its window also closes the host.
    $info.CreateNoWindow = $false
    $info.RedirectStandardOutput = $true
    $info.RedirectStandardError = $true
    $info.StandardOutputEncoding = New-Object System.Text.UTF8Encoding($false)
    $info.StandardErrorEncoding = New-Object System.Text.UTF8Encoding($false)
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $info
    [void]$process.Start()
    return $process
}

function Show-HostErrors($Process, [ref]$Pending) {
    while ($null -ne $Pending.Value -and $Pending.Value.IsCompleted) {
        $line = $Pending.Value.GetAwaiter().GetResult()
        if ($null -eq $line) { $Pending.Value = $null; break }
        [Console]::Error.WriteLine($line)
        $Pending.Value = $Process.StandardError.ReadLineAsync()
    }
}

try {
    if ($Project -and $Executable) { throw 'Select -Project or -Executable, not both.' }
    if (-not $Project -and -not $Executable) { $Project = Join-Path $kitRoot 'examples/redactor' }
    $selectedPath = if ($Executable) { $Executable } else { $Project }
    $selectedPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($selectedPath)
    if (-not (Test-Path -LiteralPath $selectedPath)) { throw "Plugin path does not exist: $selectedPath" }
    $cargo = Get-Command cargo.exe -ErrorAction SilentlyContinue
    if (-not $cargo) { throw 'Install stable Rust and the MSVC build tools, then run this script again.' }

    Write-Host 'Building the standalone HTML workbench. The first build may take a few minutes...'
    $hostTarget = Join-Path $kitRoot 'target/workbench-host'
    $buildProcess = Start-Child $cargo.Source @('build', '--locked', '--manifest-path',
        (Join-Path $kitRoot 'Cargo.toml'), '--target-dir', $hostTarget,
        '-p', 'finshield-pii-dev', '--message-format=json')
    $buildErrors = $buildProcess.StandardError.ReadToEndAsync()
    $hostExecutable = $null
    while ($null -ne ($line = $buildProcess.StandardOutput.ReadLine())) {
        $item = ConvertFrom-Json -InputObject $line
        if ($item.reason -eq 'compiler-message' -and $item.message.rendered) {
            [Console]::Error.WriteLine($item.message.rendered)
        }
        if ($item.reason -eq 'compiler-artifact' -and $item.target.name -eq 'finshield-pii-dev' -and $item.executable) {
            $hostExecutable = $item.executable
        }
    }
    $buildProcess.WaitForExit()
    [Console]::Error.Write($buildErrors.GetAwaiter().GetResult())
    if ($buildProcess.ExitCode -ne 0) { throw 'Cargo build failed. See the compiler output above.' }
    if (-not $hostExecutable) { throw 'Cargo did not report a workbench executable.' }

    $hostArguments = @('ui', '--timeout-ms', [string]$TimeoutMs)
    if ($Executable) { $hostArguments += @('--exe', $selectedPath) }
    else { $hostArguments += @('--project', $selectedPath) }
    if ($Bin) { $hostArguments += @('--bin', $Bin) }
    Write-Host "Starting plugin: $selectedPath"
    $hostProcess = Start-Child $hostExecutable $hostArguments
    $hostErrors = $hostProcess.StandardError.ReadLineAsync()
    $firstLine = $hostProcess.StandardOutput.ReadLineAsync()
    $deadline = [DateTime]::UtcNow.AddMinutes(5)
    while (-not $firstLine.IsCompleted) {
        Show-HostErrors $hostProcess ([ref]$hostErrors)
        if ([DateTime]::UtcNow -gt $deadline) { throw 'Timed out waiting for the HTML workbench to start.' }
        Start-Sleep -Milliseconds 100
    }
    Show-HostErrors $hostProcess ([ref]$hostErrors)
    $url = $firstLine.GetAwaiter().GetResult()
    if (-not $url -or $url -notmatch '^http://127\.0\.0\.1:[0-9]+/$') {
        throw 'The workbench exited before it printed a local URL. See the output above.'
    }
    $request = [System.Net.HttpWebRequest]::Create($url)
    $request.Proxy = $null
    $request.Timeout = 5000
    $response = $request.GetResponse()
    try {
        if ([int]$response.StatusCode -ne 200) { throw 'The HTML page is not ready.' }
    } finally { $response.Close() }

    @{ url = $url; host_pid = $hostProcess.Id; launcher_pid = $PID } |
        ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8
    Write-Host "READY: $url"
    Write-Host 'Keep this window open. Edit code, click Rebuild and restart, then send text again.'
    Write-Host 'Press Ctrl+C or close this window to stop the workbench.'
    if (-not $NoBrowser) {
        try { Start-Process -FilePath $url }
        catch { Write-Warning "Could not open the default browser. Open $url manually." }
    }
    while (-not $hostProcess.HasExited) {
        Show-HostErrors $hostProcess ([ref]$hostErrors)
        Start-Sleep -Milliseconds 200
    }
    Show-HostErrors $hostProcess ([ref]$hostErrors)
    if ($hostProcess.ExitCode -ne 0) { throw "Workbench exited with code $($hostProcess.ExitCode)." }
} catch {
    [Console]::Error.WriteLine('ERROR: ' + $_.Exception.Message)
    $exitCode = 1
} finally {
    $ownedHostId = if ($null -ne $hostProcess) { $hostProcess.Id } else { $null }
    foreach ($process in @($hostProcess, $buildProcess)) {
        if ($null -ne $process) {
            if (-not $process.HasExited) { $process.Kill(); [void]$process.WaitForExit(5000) }
            $process.Dispose()
        }
    }
    # Several launchers can run at once. Clear only this launcher's own record,
    # so an exited test/session cannot leave its dead port as the current URL.
    if ($null -ne $ownedHostId -and (Test-Path -LiteralPath $statePath)) {
        try {
            $saved = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
            if ($saved.launcher_pid -eq $PID -and $saved.host_pid -eq $ownedHostId) {
                Remove-Item -LiteralPath $statePath
            }
        } catch { Write-Warning ('Could not clear the launcher record: ' + $_.Exception.Message) }
    }
}
exit $exitCode
