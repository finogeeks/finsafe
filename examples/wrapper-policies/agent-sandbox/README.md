# Agent sandbox example policies

Wrapper YAML for **local** smoke tests when wrapping third-party agent CLIs (Hermes, Codex, OpenCode, agy) or exercising network/filesystem isolation.

These ship in the public [finogeeks/finsafe](https://github.com/finogeeks/finsafe) repository under `examples/wrapper-policies/agent-sandbox/`. **`install.sh` installs binaries only** — clone this repo or `curl -O` individual YAML files.

## User guide (start here)

**[docs/agent-sandbox-guide.md](../../../docs/agent-sandbox-guide.md)** — run agents, troubleshoot with **`finsafe learn`**, **`finsafe explain`**, `--audit`, and `finsafe-trace`.

**Skills:** [finsafe-agent-sandbox-run](../../../skills/finsafe-agent-sandbox-run/SKILL.md) · [finsafe-agent-sandbox-verify](../../../skills/finsafe-agent-sandbox-verify/SKILL.md)

## Download policies

```bash
BASE=https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/agent-sandbox
mkdir -p ~/finsafe-policies && cd ~/finsafe-policies
for f in hermes-skip-deny.yaml hermes-interactive-test.yaml opencode-oneshot.yaml \
  agy-oneshot.yaml agy-interactive.yaml codex-oneshot.yaml; do
  curl -fsSLO "$BASE/$f"
done
```

## Running

From a directory with `./workspace` as the writable sandbox root:

```bash
mkdir -p workspace
finsafe --policy ~/finsafe-policies/opencode-oneshot.yaml run -- \
  /usr/bin/env HOME="$HOME" PATH="$HOME/.bun/bin:$HOME/.local/bin:/usr/bin:/bin" \
  opencode run "your prompt"
```

## Policy iteration (`learn` / `explain`)

When a run fails, extend the example policy — do not guess paths:

```bash
finsafe learn --base ~/finsafe-policies/opencode-oneshot.yaml \
  --out ~/finsafe-policies/opencode-learned.yaml \
  --work-dir "$PWD" --json -- \
  /usr/bin/env HOME="$HOME" PATH="$HOME/.bun/bin:$HOME/.local/bin:/usr/bin:/bin" \
  opencode run "hello"

finsafe --policy ~/finsafe-policies/opencode-learned.yaml run -- …

finsafe --policy … run --json -- … 2>audit.stderr | tail -1 > envelope.json
finsafe explain envelope.json
```

Full workflow: [agent-sandbox-guide.md](../../../docs/agent-sandbox-guide.md) § Policy iteration with learn and explain.

## Policy index

| File | Purpose |
|------|---------|
| `deny-https.yaml` | **macOS:** `network: host` + Seatbelt deny ports 80/443. Linux `run` fail-closes (#223); use `network-none.yaml` |
| `network-none.yaml` | `network: none`; full outbound deny (Linux/macOS/Windows curl probe) |
| `isolation-test.yaml` | Minimal FS scope; isolation probes (**not** for agent launch) |
| `hermes-deny-https.yaml` | Hermes oneshot with `network: none` (LLM/HTTPS blocked; cross-platform) |
| `hermes-interactive-test.yaml` | `self-confine` Hermes; `skip_default_deny_read` |
| `hermes-skip-deny.yaml` | Hermes one-shot / chat |
| `codex-oneshot.yaml` | Codex non-interactive one-shot |
| `opencode-oneshot.yaml` | OpenCode `run` one-shot |
| `agy-oneshot.yaml` | agy `--print` (macOS Antigravity OAuth paths) |
| `agy-interactive.yaml` | agy TUI via `self-confine` |

## Related

- [USER-GUIDE.md](../../../docs/USER-GUIDE.md) — generic `learn` / `explain`
- [POLICY-QUICKREF.md](../../../docs/POLICY-QUICKREF.md)
