# Agent sandbox example policies

Wrapper YAML for **local** smoke tests when wrapping third-party agent CLIs (Hermes, Codex, OpenCode, agy) or exercising network/filesystem isolation.

These ship in the public [finogeeks/finsafe](https://github.com/finogeeks/finsafe) repository under `examples/wrapper-policies/agent-sandbox/`. **`install.sh` installs binaries only** — clone this repo or `curl -O` individual YAML files (see [USER-GUIDE.md](../../../docs/USER-GUIDE.md) § “Example policies”).

## Running

From a directory where you want `./workspace` as the writable sandbox root:

```bash
mkdir -p workspace
finsafe --policy examples/wrapper-policies/agent-sandbox/deny-https.yaml run -- \
  curl -sf --max-time 5 https://httpbin.org/get
```

Each YAML file’s header comment documents the intended command and expected outcome.

## Policy index

| File | Purpose |
|------|---------|
| `deny-https.yaml` | `network: host` + deny ports 80/443; curl should fail |
| `network-none.yaml` | `network: none`; full outbound deny |
| `isolation-test.yaml` | Minimal FS scope; probes deny-read / write containment |
| `hermes-deny-https.yaml` | Hermes oneshot with HTTPS blocked |
| `hermes-interactive-test.yaml` | `self-confine` Hermes; `skip_default_deny_read` for `.hermes/.env` |
| `hermes-skip-deny.yaml` | Diagnostic: all built-in deny-read skipped (not for production) |
| `codex-oneshot.yaml` | Codex non-interactive one-shot |
| `opencode-oneshot.yaml` | OpenCode `run` one-shot |
| `agy-oneshot.yaml` | agy `--print` one-shot |
| `agy-interactive.yaml` | agy TUI via `self-confine` (real TTY); `agy --print` for non-TTY SC smoke |

## Related

- Hermes production-style samples: [../hermes-interactive-deny-http.yaml](../hermes-interactive-deny-http.yaml)
- Policy iteration (`learn`, `explain`, `--audit`): [USER-GUIDE.md](../../../docs/USER-GUIDE.md) § “Creating and iterating policies”
- Field reference: [POLICY-QUICKREF.md](../../../docs/POLICY-QUICKREF.md)
