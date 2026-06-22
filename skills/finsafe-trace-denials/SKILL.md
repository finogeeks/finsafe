---
name: finsafe-trace-denials
description: >-
  macOS-only trace-denials workflow for finsafe. Use when a sandboxed agent or
  command fails and you need to discover which Seatbelt deny events caused it.
  Surfaces kernel sandbox violations as structured YAML policy-fix suggestions.
  Requires finsafe-trace.sh + _finsafe_trace_report.py from scripts/dev/.
---

# finsafe trace-denials skill

**Companion:** [finsafe-agent-sandbox-run](../finsafe-agent-sandbox-run/SKILL.md) — agent run + **`learn` / `explain`** ladder.

## When to use

Use when **`finsafe run`** fails with `Operation not permitted` on macOS and you need
structured YAML path suggestions.

**Prefer `finsafe learn` first** when kernel denials are captured:

```bash
finsafe learn --base ~/finsafe-policies/opencode-oneshot.yaml \
  --out ~/finsafe-policies/opencode-learned.yaml --json -- \
  /usr/bin/env HOME="$HOME" PATH="…" opencode run "hello"
```

Use **`finsafe-trace`** when `learn` reports **`denial_count: 0`** but stderr still
denies paths (common on macOS for agent log files). Also use **`finsafe explain`**
on saved `run --json` envelopes — see [agent-sandbox-guide](https://github.com/finogeeks/finsafe/blob/main/docs/agent-sandbox-guide.md).

> **Note on `--audit`**
> `finsafe --audit` streams kernel deny hints on stderr under unchanged enforcement.
> `finsafe-trace` adds a structured **DENIED OPERATIONS** table and **SUGGESTED POLICY ADDITIONS**.

## Prerequisites

- macOS 10.15+, `finsafe` on `$PATH`, `python3` on `$PATH`
- `scripts/dev/finsafe-trace.sh` and `scripts/dev/_finsafe_trace_report.py`
  from the finsafe repository (both files must be in the same directory)

Optional one-time install:
```bash
ln -sf "$REPO/scripts/dev/finsafe-trace.sh"        ~/.local/bin/finsafe-trace
cp     "$REPO/scripts/dev/_finsafe_trace_report.py" ~/.local/bin/
chmod  +x ~/.local/bin/finsafe-trace
```

## Usage

```
finsafe-trace [--policy <path>] [--host-profile <name>] [--toolchain <name>]...
              [--json] [--finsafe <path>] -- <command> [args...]
```

Options mirror finsafe global options:

| Option | Meaning |
|--------|---------|
| `--policy <path>` | Wrapper policy YAML/JSON (same as `finsafe --policy`) |
| `--host-profile <name>` | Host profile template (same as `finsafe --host-profile`) |
| `--toolchain <name>` | Toolchain preset, repeatable |
| `--json` | Emit machine-readable JSON deny report instead of text |
| `--finsafe <path>` | Override finsafe binary path (default: `finsafe` on PATH, or `$FINSAFE_BIN`) |

## Step-by-step workflow

### 1. Reproduce the failure under trace mode

```bash
finsafe-trace --policy my-agent.yaml -- hermes --print "hello"
```

The command runs normally (output appears on your terminal). After it exits,
a deny report is printed.

### 2. Read the deny report

```
┌────────────────────────────────────────────────────────────────
│  finsafe trace-denials
├────────────────────────────────────────────────────────────────
  command  : hermes --print hello
  exit     : 1
  profile  : ✓ captured
└────────────────────────────────────────────────────────────────

  DENIED OPERATIONS  (3 unique)

    1  file-read-data        ~/.hermes/.env
    2  file-read-metadata    ~/.hermes/.env
    3  file-read-data        ~/.hermes/config.yaml

┌────────────────────────────────────────────────────────────────
│  SUGGESTED POLICY ADDITIONS
└────────────────────────────────────────────────────────────────

  # Add to filesystem.read_only_paths:
    - "~/.hermes"

  ⚠  Hits built-in deny-read list (.env, .ssh, .aws …):
    ~/.hermes/.env
    → Set: filesystem.skip_default_deny_read: true
```

Key fields:
- **DENIED OPERATIONS** — each unique (process, operation, resource) triple
- **process tag** `[procname]` — shown when a child process (not the main command) was denied
- **SUGGESTED POLICY ADDITIONS** — ready-to-paste YAML snippets
- **Built-in deny-read warning** — paths like `.env`, `.ssh`, `.aws` are blocked by finsafe's built-in deny list even if you add them to `read_only_paths`; use `skip_default_deny_read: true` if intentional

### 3. Apply the suggested additions to your wrapper YAML

```yaml
filesystem:
  read_only_paths:
    - "~/.hermes"           # ← added based on trace output
  skip_default_deny_read: true  # ← only if .env access is intentional
```

### 4. Re-run under finsafe (not trace mode) to confirm

```bash
finsafe --policy my-agent.yaml run -- hermes --print "hello"
```

Repeat steps 1–4 until no denials remain and the command succeeds.

## Machine-readable output (--json)

```bash
finsafe-trace --policy my-agent.yaml --json -- hermes --print "hello" \
  | jq '.suggested_read_only_paths'
```

JSON schema:

```json
{
  "schema_version": 1,
  "command": ["hermes", "--print", "hello"],
  "exit_code": 1,
  "profile_captured": true,
  "all_denials": [
    {"process": "hermes", "pid": 12345, "operation": "file-read-data",
     "resource": "/Users/alice/.hermes/.env"}
  ],
  "suggested_read_only_paths": ["~/.hermes"],
  "suggested_read_write_paths": [],
  "network_denials": [],
  "process_exec_denials": [],
  "mach_denials": [],
  "builtin_deny_hits": ["~/.hermes/.env"]
}
```

## How it works (internals)

1. A `sandbox-exec` shim is placed at the head of `$PATH`. When finsafe calls
   `/usr/bin/sandbox-exec -p <profile_text>`, the shim saves the compiled
   Seatbelt profile to a temp file and then execs the real `sandbox-exec`.
2. A `log stream` process runs in the background, collecting kernel sandbox
   violation messages matching `Sandbox: … deny(` from the macOS unified log.
3. After the command exits, `_finsafe_trace_report.py` parses the log, deduplicates
   violations, classifies them by operation type, and generates the report.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `profile: ✗ not captured` | finsafe did not call the shim's `sandbox-exec` (e.g. binary not on PATH, or finsafe used `-f file` instead of `-p text`) | Verify finsafe is on PATH; run with `--finsafe $(which finsafe)` |
| No denials shown but command still fails | Failure is not sandbox-related | Check stderr output above the report; the issue is a missing dependency, wrong args, etc. |
| Mach IPC denials only | Usually benign; macOS system processes generate these constantly | Ignore unless the command specifically needs a listed Mach service |
| `finsafe-trace: report script not found` | `_finsafe_trace_report.py` not in same dir as `finsafe-trace.sh` | Copy both files together (see Prerequisites) |

## Known limitations

- **macOS only** — Linux/Windows do not use Seatbelt; use `finsafe --audit` on
  Linux (genuine seccomp permissive mode) and the Windows diagnostic capture.
- **Self-confine not supported** — `finsafe self-confine` uses `execve` after
  confinement; the shim approach does not apply. Use `finsafe run` for tracing.
- **Mach IPC noise** — The kernel logs Mach lookup denials for many benign
  system operations. These appear in `all_denials` but are separated in the
  report. They rarely require policy changes.
