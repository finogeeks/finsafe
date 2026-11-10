[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$OperationPath,
    [Parameter(Mandatory)][int]$MainPid,
    [Parameter(Mandatory)][int]$HostPid
)
$ErrorActionPreference = 'Stop'
$request = @{fixture=$OperationPath;mainPid=$MainPid;hostPid=$HostPid}
$fixture = Get-Content -LiteralPath $request.fixture -Raw | ConvertFrom-Json
if ($fixture.scope -notin @('owned-desktop-experiment','installed-desktop-plugin')) { throw 'Unknown Desktop handoff scope' }
$eventPath = Join-Path $fixture.root 'handoff.jsonl'
function Record-Stage([string]$stage, $details) {
    [pscustomobject]@{stage=$stage;details=$details;at=(Get-Date).ToUniversalTime().ToString('o');helperPid=$PID} |
        ConvertTo-Json -Compress -Depth 5 | Add-Content -LiteralPath $eventPath -Encoding utf8
}
try {
    Record-Stage 'helper-started' $request
    $oldMain = Get-Process -Id $request.mainPid
    if ($oldMain.Path -ne $fixture.desktop) { throw 'Old Main image does not match the owned fixture' }
    $oldHost = Get-Process -Id $request.hostPid
    if ($oldHost.Path -ne $fixture.desktop) { throw 'Old Host image does not match the owned fixture' }
    Record-Stage 'old-processes-verified' @{mainPid=$oldMain.Id;hostPid=$oldHost.Id}
    # Force only the retained owned Main. A tree kill would also kill this independent helper.
    $oldMain.Kill()
    Record-Stage 'old-main-terminated' $request.mainPid
    if (!$oldMain.WaitForExit(10000)) { throw 'Old Main did not exit' }
    if (!$oldHost.WaitForExit(15000)) { throw 'Old Host did not exit after Main disconnected' }
    Record-Stage 'old-desktop-stopped' @{mainPid=$request.mainPid;hostPid=$request.hostPid}
    $launch = [Diagnostics.ProcessStartInfo]::new($fixture.finsafe)
    $launch.UseShellExecute = $false
    $launch.CreateNoWindow = $true
    $launch.WorkingDirectory = Split-Path -Parent $fixture.desktop
    $launch.RedirectStandardOutput = $true
    $launch.RedirectStandardError = $true
    foreach ($argument in @('app','launch','dsh-desktop','--yaml-path',$fixture.policy,'--',$fixture.desktop)) {
        $launch.ArgumentList.Add($argument)
    }
    $launch.Environment['DSH_HOME'] = $fixture.dshHome
    if ($fixture.scope -eq 'installed-desktop-plugin') {
        $launch.Environment['FINSAFE_DSH_PLUGIN_ATTEMPT'] = $request.fixture
    } else {
        $launch.Environment['FINSAFE_DSH_HANDOFF_FIXTURE'] = $request.fixture
    }
    $launch.Environment['FINSAFE_DSH_HANDOFF_GENERATION'] = 'protected'
    $launch.Environment.Remove('ELECTRON_RUN_AS_NODE') | Out-Null
    $engine = [Diagnostics.Process]::Start($launch)
    $output = $engine.StandardOutput.ReadToEndAsync()
    $errors = $engine.StandardError.ReadToEndAsync()
    Record-Stage 'protected-launch-requested' @{enginePid=$engine.Id}
    $deadline = (Get-Date).AddSeconds(75)
    while (!(Test-Path -LiteralPath (Join-Path $fixture.root 'protected.json'))) {
        if ($engine.HasExited) { throw "FinSAFE exited before protected activation: $($errors.GetAwaiter().GetResult())" }
        if (Test-Path -LiteralPath (Join-Path $fixture.root 'plugin-error.txt')) { throw (Get-Content -LiteralPath (Join-Path $fixture.root 'plugin-error.txt') -Raw) }
        if ((Get-Date) -ge $deadline) { throw 'Protected plugin activation timed out' }
        Start-Sleep -Milliseconds 200
    }
    Record-Stage 'protected-activation' (Get-Content -LiteralPath (Join-Path $fixture.root 'protected.json') -Raw | ConvertFrom-Json)
    # Keep output pipes alive until the owned experiment is cleaned up by its driver.
    $engine.WaitForExit()
    $output.GetAwaiter().GetResult() | Set-Content -LiteralPath (Join-Path $fixture.root 'finsafe.stdout') -Encoding utf8
    $errors.GetAwaiter().GetResult() | Set-Content -LiteralPath (Join-Path $fixture.root 'finsafe.stderr') -Encoding utf8
} catch {
    Record-Stage 'failed' $_.Exception.Message
    $_ | Out-String | Set-Content -LiteralPath (Join-Path $fixture.root 'handoff-error.txt') -Encoding utf8
    exit 1
}
