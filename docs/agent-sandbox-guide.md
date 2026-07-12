# Running CLI agents in a FinSAFE sandbox

**中文：** [agent-sandbox-guide-zh.md](./agent-sandbox-guide-zh.md)

Help users run **Hermes**, **OpenCode**, **agy**, and future agent CLIs inside FinSAFE
without breaking legitimate work. When something fails, use **`learn`**, **`explain`**,
**`--audit`**, and (on macOS) **`finsafe-trace`** — not manual YAML guessing.

**Generic `learn` / `explain` reference:** [USER-GUIDE.md § Creating and iterating policies](./USER-GUIDE.md) · [`--audit` contract](./isolation-audit-mode.md)

**AI skills:** [finsafe-agent-sandbox-run](../skills/finsafe-agent-sandbox-run/SKILL.md) (run + fix) · [finsafe-agent-sandbox-verify](../skills/finsafe-agent-sandbox-verify/SKILL.md) (prove isolation)

---

## One-time setup

```bash
curl -fsSL https://raw.githubusercontent.com/finogeeks/finsafe/main/install.sh | sh
finsafe version   # macOS self-confine: prefer 0.9.1+

BASE=https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/agent-sandbox
mkdir -p ~/finsafe-policies && cd ~/finsafe-policies
for f in hermes-skip-deny.yaml hermes-interactive-test.yaml opencode-oneshot.yaml \
  agy-oneshot.yaml agy-interactive.yaml codex-oneshot.yaml; do
  curl -fsSLO "$BASE/$f"
done

mkdir -p ~/my-agent-project/workspace && cd ~/my-agent-project
```

Confirm each agent works **without** finsafe first (install, API keys, `opencode auth list`, etc.).

---

## Quick start by agent

Use `/usr/bin/env` with explicit `HOME` and `PATH` on macOS.

### Hermes

```bash
finsafe --policy ~/finsafe-policies/hermes-skip-deny.yaml run -- \
  /usr/bin/env HOME="$HOME" PATH="/opt/homebrew/bin:$HOME/.local/bin:/usr/bin:/bin" \
  hermes chat -q "Say hello."
```

Interactive: `hermes-interactive-test.yaml` + `self-confine -- hermes` (real TTY).

### OpenCode

```bash
finsafe --policy ~/finsafe-policies/opencode-oneshot.yaml run -- \
  /usr/bin/env HOME="$HOME" PATH="$HOME/.bun/bin:$HOME/.local/bin:/usr/bin:/bin" \
  opencode run "your prompt"
```

### agy

```bash
finsafe --policy ~/finsafe-policies/agy-oneshot.yaml run -- \
  /usr/bin/env HOME="$HOME" PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/bin:/bin" \
  agy --print "your prompt"
```

macOS: OAuth lives in `~/Library/Application Support/Antigravity` + Keychain — see `agy-oneshot.yaml`.

### `run` vs `self-confine`

| Verb | `program_mode` | Examples |
|------|----------------|----------|
| `run` | `short-lived` | `opencode run`, `agy --print`, one-shot Hermes |
| `self-confine` | `interactive` | `hermes`, interactive `agy` |

---

## Policy iteration with `learn` and `explain`

This is the **primary workflow** when an agent fails under sandbox but works naked.

### Which tool when?

| Situation | Tool |
|-----------|------|
| No policy yet, or want a fresh draft | **`finsafe learn -- <cmd>`** |
| Have example policy; need more grants | **`finsafe learn --base <yaml> --out <yaml> -- <cmd>`** |
| Same run, inline hints (no new YAML file) | **`finsafe --audit --policy <yaml> run -- <cmd>`** |
| Saved output from **`run --json`** | **`finsafe explain envelope.json`** |
| macOS: `learn` shows 0 denials but stderr denies a path | **`finsafe-trace`** — see [trace skill](../skills/finsafe-trace-denials/SKILL.md) |

### Recommended: start from the committed agent policy

Do **not** rely only on the built-in minimal learn seed for Hermes/OpenCode/agy — it
omits agent binary and state dirs. Extend the shipped example:

```bash
cd ~/my-agent-project
POLICY=~/finsafe-policies/opencode-oneshot.yaml
CMD=(/usr/bin/env HOME="$HOME" PATH="$HOME/.bun/bin:$HOME/.local/bin:/usr/bin:/bin" \
  opencode run "Reply exactly: LEARN-OK")

# Pass 1 — capture denials, write learned YAML
finsafe learn --base "$POLICY" --out ~/finsafe-policies/opencode-learned.yaml \
  --work-dir ~/my-agent-project --json -- "${CMD[@]}"

# Inspect machine-readable summary (stdout JSON when --json)
#   denial_count, merged_paths, blocked_paths, exit_code

# Pass 2 — run under learned policy
finsafe --policy ~/finsafe-policies/opencode-learned.yaml run -- "${CMD[@]}"

# Pass 3 — merge more grants if still failing
finsafe learn --base ~/finsafe-policies/opencode-learned.yaml \
  --out ~/finsafe-policies/opencode-learned.yaml \
  --work-dir ~/my-agent-project -- "${CMD[@]}"
```

Repeat until the agent completes and `denial_count` stays 0 on learn passes.

**Hermes learn example:**

```bash
finsafe learn --base ~/finsafe-policies/hermes-skip-deny.yaml \
  --out ~/finsafe-policies/hermes-learned.yaml \
  --work-dir ~/my-agent-project -- \
  /usr/bin/env HOME="$HOME" PATH="/opt/homebrew/bin:$HOME/.local/bin:/usr/bin:/bin" \
  hermes chat -q "Reply exactly: LEARN-HERMES-OK"
```

**agy learn example:**

```bash
finsafe learn --base ~/finsafe-policies/agy-oneshot.yaml \
  --out ~/finsafe-policies/agy-learned.yaml \
  --work-dir ~/my-agent-project -- \
  /usr/bin/env HOME="$HOME" PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/bin:/bin" \
  agy --print "Reply exactly: LEARN-AGY-OK"
```

### `learn` flags that matter for agents

| Flag | Purpose |
|------|---------|
| `--base <path>` | Start from existing YAML (prefer agent-sandbox examples) |
| `--out <path>` | Where to write merged policy (default: `~/.config/finsafe/policies/learned-policy.yaml`) |
| `--work-dir <path>` | Child cwd — must contain `./workspace` for write tests |
| `--json` | Emit `{ denial_count, merged_paths, blocked_paths, exit_code, review_summary }` on stdout |

**Review before trust:** learned YAML may add broad paths. Read `merged_paths` and
`blocked_paths` in the learn summary. Do not deploy learned policies to production
without review.

### macOS: when `learn` reports zero denials

On macOS, `learn` ingests **kernel Seatbelt deny events**. Application stderr may
still show:

```text
open /Users/you/.local/share/opencode/log/opencode.log: operation not permitted
```

while `denial_count: 0`. When that happens:

1. Run **`finsafe --audit --policy <yaml> run -- <cmd>`** and read stderr hints.
2. Or download and run **`finsafe-trace`** (structured **SUGGESTED POLICY ADDITIONS**).
3. Add the path to `read_write_paths` or `read_only_paths` manually, then re-run `learn`.

### Using `finsafe explain`

Use **`explain`** when you already ran with **`--json`** and want a structured
post-mortem without re-executing the agent (slow LLM, flaky network).

```bash
POLICY=~/finsafe-policies/opencode-oneshot.yaml
CMD=(/usr/bin/env HOME="$HOME" PATH="$HOME/.bun/bin:$HOME/.local/bin:/usr/bin:/bin" \
  opencode run "hello")

# Last line of stdout is the JSON envelope; audit text goes to stderr
finsafe --policy "$POLICY" run --json -- "${CMD[@]}" 2>audit.stderr | tail -1 > envelope.json

finsafe explain envelope.json
# or: finsafe explain --json envelope.json
```

`explain` reads `policy_derivation_notes`, attestation fields (denied paths/ports),
and child stderr markers when present. Pair with `audit.stderr` for the full picture.

**When to prefer `explain` over another `learn` pass:**

- Failure is intermittent and you want to inspect a **saved** run.
- You need to share diagnosis without re-running a costly LLM call.
- Windows ETW / derivation notes are easier to read through `explain --json`.

**When to prefer `learn` over `explain`:**

- You want finsafe to **merge grants into YAML** automatically.
- You are iterating toward a working policy file.

### Full iteration loop (agents)

```text
Agent fails naked?          → fix install / auth / network first
Agent fails under sandbox?
       ↓
finsafe --audit --policy <agent.yaml> run -- <cmd>     → stderr hints
       ↓
finsafe learn --base <agent.yaml> --out learned.yaml -- <cmd>
       ↓
finsafe --policy learned.yaml run -- <cmd>
       ↓
(still failing?)
  macOS + learn denial_count=0  → finsafe-trace → manual YAML merge
  else                            → learn --base learned.yaml --out learned.yaml -- <cmd>
       ↓
(optional) run --json → envelope.json → finsafe explain
       ↓
repeat until agent succeeds
       ↓
finsafe-agent-sandbox-verify (optional) → prove isolation
```

---

## Per-agent path cheat-sheet (macOS)

| Agent | Typical binary | Beyond `./workspace` |
|-------|----------------|----------------------|
| **Hermes** | `~/.local/bin/hermes` | `~/.hermes` (rw), `skip_default_deny_read: true` |
| **OpenCode** | `~/.bun/bin/opencode` | `~/.bun`, `~/.config/opencode`, `~/.local/share/opencode` (rw), `~/.npmrc` |
| **agy** | `~/.local/bin/agy` | `~/.gemini` (rw), `~/Library/Application Support/Antigravity` (rw), Keychains + Preferences (ro) |
| **Codex** | `~/.bun/bin/codex` | See `codex-oneshot.yaml` |

---

## Windows agents (Hermes)

On Windows desktop, prefer the **RestrictedToken** example for typical Hermes
(`network: host`) — host-wide read covers the Python venv without ProjFS or
recursive AppContainer ACL labeling:

```powershell
mkdir workspace -ErrorAction SilentlyContinue
finsafe --policy examples/wrapper-policies/hermes-windows-oneshot.yaml run hermes --version
```

For stronger AppContainer isolation (deny-read / LowBox / optional ProjFS for
large trees), use `hermes-windows-oneshot-appcontainer.yaml`. Full Windows
onboarding: [WINDOWS-GUIDE.md](./WINDOWS-GUIDE.md). Field detail:
[USER-GUIDE.md § Windows backends](./USER-GUIDE.md) ·
[POLICY-QUICKREF.md § Windows backends](./POLICY-QUICKREF.md).

---

## Common symptoms

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| exit 127 | Binary not on declared PATH | Add dir to `read_only_paths`; `/usr/bin/env PATH=…` |
| `operation not permitted` on logs | Missing rw path | `learn` / `--audit` / trace |
| Hermes startup crash | `.env` deny-read | `skip_default_deny_read: true` |
| agy OAuth in sandbox | Missing Antigravity paths | See `agy-oneshot.yaml` |
| `learn` 0 denials, stderr denies | macOS log gap | `finsafe-trace` or manual merge |
| OpenCode 0 credentials | No provider | `opencode auth login` |
| self-confine exit 65 | finsafe &lt; 0.9.1 | Upgrade to 0.9.1+ |

---

## Adding a new agent

1. Copy `opencode-oneshot.yaml` → `myagent-oneshot.yaml`.
2. Run representative command **naked**, then under **`learn --base myagent-oneshot.yaml`**.
3. macOS: use **`finsafe-trace`** if learn under-reports.
4. **`finsafe explain`** on saved envelopes for hard failures.
5. **finsafe-agent-sandbox-verify** before trusting the policy.

**Example policies:** [examples/wrapper-policies/agent-sandbox/](../examples/wrapper-policies/agent-sandbox/)
