# Connect Claude Code through the command line (Windows)

[简体中文](zh-CN/agents/claude.md) · [Documentation](en/README.md) · [Compatibility matrix](en/agents/compatibility.md)

This guide uses Safety Arena's Windows route: start Claude Code CLI with FinShield `self-confine`, keeping the interactive UI in an ordinary terminal. **Claude CLI integration is supported now and requires no plugin.** It does not cover Claude Desktop or Agent verification on Linux/macOS.

Arena records Claude `2.1.314` and uses the same installed FinShield `effective.yaml` as the Codex route. Existing evaluations do not mean this guide freshly verified every later installed version. Repeat checks after an upgrade.

## Prepare

1. [Install Windows x64 FinShield](en/getting-started/install.md#windows) and complete preparation and authorization.
2. Install and sign in to Claude Code CLI separately. Confirm ordinary execution and required tools work first. The commands use the actual native `claude.exe`; if only an npm launcher exists, check the installation rather than directly replacing the EXE with a `.cmd` / `.ps1` script.
3. In the FinShield Console, confirm access to the workspace, Claude executable, required configuration / state directories, and shell. Obtain the actual prepared `effective.yaml` path for that installation. Do not edit the generated file or reuse a DSH-plugin-specific configuration.
4. The evaluation underlying this guide uses the PowerShell tool route. Confirm that the installed Claude version's Windows shell configuration works first. A Git Bash startup failure is not evidence of security enforcement. Other shell routes need separate verification.

## Start Claude CLI

Replace the configuration and workspace placeholders in an ordinary PowerShell terminal:

```powershell
$finshieldExe = 'C:\Program Files\FinSAFE\finsafe.exe'
$claudeExe = (Get-Command claude.exe -CommandType Application -ErrorAction Stop).Source
$effectiveYaml = 'C:\YourFinShieldConfig\effective.yaml'
$workspace = 'C:\YourAuthorizedWorkspace'

foreach ($file in @($finshieldExe, $claudeExe, $effectiveYaml)) {
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw "File not found: $file" }
}
if (-not (Test-Path -LiteralPath $workspace -PathType Container)) { throw "Workspace not found: $workspace" }
& $finshieldExe --version
& $claudeExe --version
& $finshieldExe prepare check --yaml-path $effectiveYaml --json
```

Read the preparation result. Resolve missing preparation, configuration mismatches, and diagnostic errors through the product and complete authorization before running in the same terminal:

```powershell
Set-Location -LiteralPath $workspace
& $finshieldExe self-confine --yaml-path $effectiveYaml --stdio inherit --integration-id claude -- $claudeExe
```

Enter tasks and handle Claude permission prompts normally. This route needs no remote `app-server` and adds no `--dangerously-skip-permissions`, `--permission-mode`, or sandbox-off flag. Wrapping requires no change to `.claude/settings.local.json`.

```mermaid
flowchart LR
    A[Ordinary terminal] --> B[FinShield starts Claude CLI]
    B --> C[Tools and files within authorized scope]
```

`--stdio inherit` preserves interactive input and output. `--integration-id claude` only labels record attribution and grants no permissions. Claude CLI is wrapped; the terminal itself and independent commands in other terminals do not gain protection.

## Verify and exit

In a new test session, follow the [permission checks](en/getting-started/install.md#verify-permission-scope): workspace writes succeed, read-only modifications fail, and inaccessible-directory reads fail. Use existing nonsensitive test files and inspect actual tool results and contents. A model's verbal refusal, shell startup failure, or nonexistent file does not establish protection.

Network and PII inspection covers only integrated, inspectable paths. This launch command alone does not establish content-inspection coverage. To extend detection / redaction rules, see the [Windows PII developer kit](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/README.md).

Exit Claude CLI normally and confirm the wrapped process has ended. Start a new process after configuration changes, upgrades, or when returning to ordinary execution. Running `claude` directly in another terminal does not use this protected entry. Change permissions through the product configuration and preparation workflow rather than editing generated effective configuration.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| `claude.exe` not found | Check the native installation and PATH, or explicitly set the actual EXE path |
| No output or input | Use an ordinary interactive terminal and retain `--stdio inherit`; do not add output-capture options for the interactive session |
| Shell / tool startup fails | Confirm the same shell works in ordinary Claude first, then check whether effective configuration permits its paths; retain the original error |
| Configuration or preparation error | Check the FinShield installation, effective configuration, and preparation result; correct through the product rather than bypassing permission prompts |
| Sign-in, model, or network fails | Separate native Agent configuration from sandbox network restrictions; check the actual proxy / certificate configuration and redact logs |

Implementation basis: [Arena Claude integration](https://github.com/finogeeks/agent-safety-arena/blob/main/docs/claude-finshield-recording.md). For support, include FinShield / Claude versions, shell, launch route, and redacted errors; see [Get help](en/getting-started/install.md#get-help).
