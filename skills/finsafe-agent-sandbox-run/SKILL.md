---
created: 2026-06-22
name: finsafe-agent-sandbox-run
description: >-
  Run Hermes, OpenCode, agy, and future CLI agents under FinSAFE; troubleshoot
  with learn, explain, audit, and finsafe-trace. Self-contained for public release
  users. Use when sandboxing agents, fixing operation not permitted, or iterating
  policy until agents work smoothly.
---

# finsafe-agent-sandbox-run

Run **Hermes**, **OpenCode**, **agy**, or a **new agent** under FinSAFE. On failure,
use **`learn`** and **`explain`** (plus **`--audit`** / **`finsafe-trace`**) — do not
guess YAML paths.

Requires: `finsafe` on PATH — https://github.com/finogeeks/finsafe/releases

Full guide: https://github.com/finogeeks/finsafe/blob/main/docs/agent-sandbox-guide.md

Generic learn/explain: https://github.com/finogeeks/finsafe/blob/main/docs/USER-GUIDE.md

## Setup

```bash
curl -fsSL https://raw.githubusercontent.com/finogeeks/finsafe/main/install.sh | sh
BASE=https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/agent-sandbox
mkdir -p ~/finsafe-policies ~/my-agent-project/workspace
cd ~/finsafe-policies
for f in hermes-skip-deny.yaml opencode-oneshot.yaml agy-oneshot.yaml agy-interactive.yaml; do
  curl -fsSLO "$BASE/$f"
done
cd ~/my-agent-project
```

Confirm agent works **without** finsafe first.

## Run (macOS — use /usr/bin/env)

```bash
# Hermes
finsafe --policy ~/finsafe-policies/hermes-skip-deny.yaml run -- \
  /usr/bin/env HOME="$HOME" PATH="/opt/homebrew/bin:$HOME/.local/bin:/usr/bin:/bin" \
  hermes chat -q "hello"

# OpenCode
finsafe --policy ~/finsafe-policies/opencode-oneshot.yaml run -- \
  /usr/bin/env HOME="$HOME" PATH="$HOME/.bun/bin:$HOME/.local/bin:/usr/bin:/bin" \
  opencode run "hello"

# agy
finsafe --policy ~/finsafe-policies/agy-oneshot.yaml run -- \
  /usr/bin/env HOME="$HOME" PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/bin:/bin" \
  agy --print "hello"
```

`run` = `program_mode: short-lived`. `self-confine` = `interactive` (Hermes TUI, agy TUI).

## Policy iteration: `learn` and `explain`

### Which tool?

| Situation | Tool |
|-----------|------|
| No policy / fresh draft | `finsafe learn -- <cmd>` |
| Extend example agent YAML | `finsafe learn --base <yaml> --out <yaml> -- <cmd>` |
| Inline hints, same run | `finsafe --audit --policy <yaml> run -- <cmd>` |
| Saved `run --json` envelope | `finsafe explain envelope.json` |
| macOS: learn `denial_count: 0` but stderr denies | `finsafe-trace` |

### Learn workflow (preferred for agents)

**Start from committed agent policy**, not the built-in minimal seed:

```bash
cd ~/my-agent-project
POLICY=~/finsafe-policies/opencode-oneshot.yaml
CMD=(/usr/bin/env HOME="$HOME" PATH="$HOME/.bun/bin:$HOME/.local/bin:/usr/bin:/bin" \
  opencode run "Reply exactly: LEARN-OK")

# Capture + merge grants
finsafe learn --base "$POLICY" --out ~/finsafe-policies/opencode-learned.yaml \
  --work-dir "$PWD" --json -- "${CMD[@]}"
# Read: denial_count, merged_paths, blocked_paths

# Run under learned policy
finsafe --policy ~/finsafe-policies/opencode-learned.yaml run -- "${CMD[@]}"

# Iterate
finsafe learn --base ~/finsafe-policies/opencode-learned.yaml \
  --out ~/finsafe-policies/opencode-learned.yaml --work-dir "$PWD" -- "${CMD[@]}"
```

Same pattern for Hermes (`hermes-skip-deny.yaml`) and agy (`agy-oneshot.yaml`) — change `CMD`.

**Flags:** `--work-dir` (must have `./workspace`), `--json` (summary on stdout).

**macOS caveat:** `learn` reads kernel Seatbelt logs. If stderr shows
`operation not permitted` on e.g. `~/.local/share/opencode/log/...` but
`denial_count: 0`, use `--audit` or `finsafe-trace` and merge paths manually.

### Explain workflow

When re-running the LLM is expensive or failure is intermittent:

```bash
finsafe --policy "$POLICY" run --json -- "${CMD[@]}" 2>audit.stderr | tail -1 > envelope.json
finsafe explain envelope.json
# finsafe explain --json envelope.json
```

Use **learn** to auto-merge YAML. Use **explain** to diagnose a **saved** run.

### Full ladder

```
naked fail? → fix agent/auth/network
sandbox fail? → --audit run
             → learn --base <agent.yaml> --out learned.yaml
             → run --policy learned.yaml
still fail? → learn --base learned.yaml (or finsafe-trace on macOS if denial_count=0)
optional   → run --json → explain
clean run  → finsafe-agent-sandbox-verify (prove isolation)
```

## Path cheat-sheet (macOS)

| Agent | Key paths |
|-------|-----------|
| Hermes | `~/.hermes` (rw), `skip_default_deny_read: true` |
| OpenCode | `~/.bun`, `~/.config/opencode`, `~/.local/share/opencode` (rw) |
| agy | `~/.gemini`, `~/Library/Application Support/Antigravity`, Keychains (ro) |

## Gotchas

| Symptom | Fix |
|---------|-----|
| exit 127 | PATH in policy + `/usr/bin/env` |
| Hermes crash at start | `skip_default_deny_read: true` |
| agy OAuth | Antigravity + Keychain paths |
| learn 0 denials | `finsafe-trace` |
| OpenCode 0 credentials | `opencode auth login` |
| self-confine 65 | finsafe **0.9.1+** |

## Related

- **finsafe-agent-sandbox-verify** — prove isolation after agent runs
- **finsafe-trace-denials** — macOS structured deny report

Policies: https://github.com/finogeeks/finsafe/tree/main/examples/wrapper-policies/agent-sandbox
