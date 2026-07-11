# FinSafe User Guide

This guide is for **operators and developers** who run programs and agent brokers under FinSafe confinement using the prebuilt **`finsafe`** CLI. For the full wrapper policy field list, see [POLICY-QUICKREF.md](POLICY-QUICKREF.md) ([Chinese](POLICY-QUICKREF-zh.md)) in this repository.

## What FinSafe does

FinSafe constrains **how** code runs on a host: namespaces, cgroup limits, syscall filtering (Linux), path restrictions, Seatbelt-backed profiles (macOS), and on Windows either **RestrictedToken** (default `network: host`) or **AppContainer** (stronger / locked-down network), with **auditable** outcomes. It is **not** an AI product; agent runtimes decide *what* to do—the boundary defines *inside which isolation posture* work runs.

- **CLI (`finsafe`):** Local wrapper front door — `run` for short-lived commands, `self-confine` for long-lived interactive brokers.
- **Server mode:** Multi-tenant submission and scheduling use a separate execution platform (not covered in this repository). Most local users only need the CLI and a wrapper policy file.

---

## Prerequisites

### Install the CLI

Use [GitHub Releases](https://github.com/finogeeks/finsafe/releases), verify `SHA256SUMS`, and extract the archive. See the [top-level README](../README.md).
Linux archives include `finsafe-helper`, `finsafe-supervisor`, and
`finsafe-landlock-shim` in addition to `finsafe`; keep them in the same
directory (the installer does this automatically).

### Host expectations

| Host | Typical local wrapper posture |
|------|-------------------------------|
| **Linux** (bubblewrap / cgroup toolchain available) | Strict stack: Bubblewrap-oriented isolation plus cgroup / Landlock / seccomp as resolved from policy. Missing bubblewrap may cause **fail closed** for strict postures. |
| **macOS** (arm64 or x86_64) | **`mac-seatbelt`**: children run via `/usr/bin/sandbox-exec`. Bubblewrap-style namespaces are **not** used for the local tool wrapper; `probe` / `doctor` describe capabilities. |
| **Windows** (10/11 desktop) | **Default for `network: host`:** RestrictedToken (host-wide read, write allowlist — Codex-aligned weaker posture; no ProjFS). **`network: none` / allowlist / confidential deny-read:** AppContainer / LowBox. Run **`finsafe setup-windows` once** after install (installer does this) for helper / WFP. ProjFS is optional and only needed for AppContainer + large runtime-tree projection (may reboot once). |

**Windows quick start (personal):**

```powershell
irm https://raw.githubusercontent.com/finogeeks/finsafe/main/install.ps1 | iex
mkdir workspace
finsafe --policy examples/wrapper-policies/windows-sandbox-smoke.yaml run cmd /c echo hello
```

FinSAFE auto-creates `./workspace` when missing and uses it as the child cwd when it is the sole `read_write_paths` entry. Pass `--work-dir <path>` only when you need a different child working directory; policy filesystem paths always resolve from your shell cwd.

If install did not finish setup, or `finsafe doctor` warns about the Windows helper, run **`finsafe setup-windows`** once (accept the permission prompt if Windows asks).

### Windows backends (RestrictedToken vs AppContainer)

Desktop Windows has **two** launch backends. Operators choose with `windows.backend` (or leave `Auto`):

| Backend | When selected | What it isolates | What it does **not** do |
|---------|---------------|------------------|-------------------------|
| **RestrictedToken** (`windows_restricted_token`) | **Default** for `network: host` + empty YAML `deny_read_paths` (Auto), or explicit `windows.backend: restricted_token` | Deny-by-default **writes** allowlisted on `read_write_paths` (+ cwd); Job Object resource limits | No AppContainer LowBox; **host-wide read** (Codex-aligned); no confidential deny-read; no ProjFS; attestation sets `degraded_execution=true` |
| **AppContainer** (`windows_appcontainer`) | `network: none` / allowlist, any explicit `deny_read_paths`, explicit `windows.backend: appcontainer`, managed fleet | Package SID, DACL grants/denies, WFP egress fencing, optional ProjFS projection of large `venv` / `node_modules` | Recursive ACL labeling / ProjFS may need `setup-windows` (+ reboot if Client-ProjFS returns `restart_required`) |

**Shipped Hermes examples:**

- [`hermes-windows-oneshot.yaml`](../examples/wrapper-policies/hermes-windows-oneshot.yaml) — RestrictedToken (recommended default)
- [`hermes-windows-oneshot-appcontainer.yaml`](../examples/wrapper-policies/hermes-windows-oneshot-appcontainer.yaml) — AppContainer (stronger)

`finsafe doctor` treats missing ProjFS as a **warning**, not a hard error: most Hermes / `network: host` policies do not need it.

Quick checks:

```bash
finsafe probe
finsafe doctor
```

Automation: `finsafe probe --json`, `finsafe doctor --json`.

---

## Core idea: wrapper policy YAML

Operators pass a **wrapper policy** (`kind: local-wrapper`) with **`--policy`**. The CLI compiles it into an internal execution specification; you do **not** hand-edit low-level execution JSON for day-to-day use.

Summary of important fields:

- **`program_mode`:** Must match the subcommand (`short-lived` → `run`, `interactive` → `self-confine`).
- **`network`:** `none`, `host`, or `allowlist` with proxy configuration.
- **`filesystem.read_only_paths` / `read_write_paths`:** Paths relative to your workspace layout.
- **`macos_seatbelt.deny_outbound_ports`** (optional, macOS): Block specific outbound TCP ports when `network: host`.
- **`resources`:** Memory, PIDs, CPU strings where the platform can enforce them; optional `timeout_ms` for wall-clock limits on **`run`**.

**Optional compiler `filesystem` fields:** The wrapper may merge default protected subtrees (`.git` / `.finsafe` under writable roots), apply a **built-in deny-read set** on Linux/macOS/Windows (for example `.env` under the workspace and `.ssh` under `$HOME` unless `skip_default_deny_read: true`), add explicit **`deny_read_paths`**, and expand **`deny_write_globs`** (legacy alias `deny_read_globs`) into extra read-only rules. **`deny_read_paths` is not the same as `read_only_paths`** — deny-read blocks reads inside writable scope; read-only paths are grants. Omitting those keys keeps older policies valid on paper, but fleet upgrades on supported desktop platforms still pick up shipped defaults unless you opt out. See [POLICY-QUICKREF.md](POLICY-QUICKREF.md) ([Chinese](POLICY-QUICKREF-zh.md)).

---

## Specifying policy on the command line

FinSafe exposes several policy grammars; **most local operators only need the wrapper policy** (`kind: local-wrapper`).

### 1. Wrapper policy (recommended)

Put **`--policy`** on the **global** argv **before** the subcommand:

```bash
finsafe --policy <PATH> run <program> [args...]
finsafe --policy <PATH> self-confine <broker> [args...]
```

`<PATH>` may be absolute or **relative to your current shell working directory** (it is not relative to the `finsafe` binary). Fields such as `filesystem.read_write_paths: ["./workspace"]` are resolved against the same cwd unless the YAML uses anchored paths.

Copy-paste examples from this repository — full first-run walkthroughs: [README § Quick start (Hermes)](../README.md#quick-start-hermes), [README § Quick start (OpenCode)](../README.md#quick-start-opencode). Index: [examples/README.md](../examples/README.md).

| Goal | Policy file | Example |
|------|-------------|---------|
| Short-lived wrapper smoke | [examples/wrapper-policies/hermes-version-smoke.yaml](../examples/wrapper-policies/hermes-version-smoke.yaml) | `finsafe --policy ./examples/wrapper-policies/hermes-version-smoke.yaml run -- hermes --version` |
| One-shot broker / query style | [examples/wrapper-policies/hermes-oneshot-query.yaml](../examples/wrapper-policies/hermes-oneshot-query.yaml) | `finsafe --policy ./examples/wrapper-policies/hermes-oneshot-query.yaml run -- hermes chat -q "…"` |
| Interactive broker (TTY, macOS) | [examples/wrapper-policies/hermes-interactive.yaml](../examples/wrapper-policies/hermes-interactive.yaml) | `finsafe --policy ./examples/wrapper-policies/hermes-interactive.yaml self-confine -- hermes` |
| Interactive broker (TTY, Linux) | [examples/wrapper-policies/hermes-linux-interactive.yaml](../examples/wrapper-policies/hermes-linux-interactive.yaml) | `finsafe --policy ./examples/wrapper-policies/hermes-linux-interactive.yaml self-confine -- hermes` |
| OpenCode one-shot | [examples/wrapper-policies/agent-sandbox/opencode-oneshot.yaml](../examples/wrapper-policies/agent-sandbox/opencode-oneshot.yaml) | See [README § Quick start (OpenCode)](../README.md#quick-start-opencode) |
| Interactive broker + deny outbound TCP port 80 (Seatbelt) | [examples/wrapper-policies/hermes-interactive-deny-http.yaml](../examples/wrapper-policies/hermes-interactive-deny-http.yaml) | `finsafe --policy ./examples/wrapper-policies/hermes-interactive-deny-http.yaml self-confine -- hermes` |

There is **no** `finsafe --agent <name>` shortcut yet — always pass an explicit YAML path with **`--policy`**.

Wrapper field reference: [POLICY-QUICKREF.md](POLICY-QUICKREF.md) · [POLICY-QUICKREF-zh.md](POLICY-QUICKREF-zh.md).

### 1b. Host profile (`self-confine` only)

When you prefer a **named posture** instead of hand-writing `kind: local-wrapper` YAML, use **`--host-profile`** before `self-confine`. The CLI synthesises an interactive wrapper policy, then uses the same launch path as `finsafe --policy <wrapper.yaml> self-confine`.

Resolution order: CLI **`--host-profile`** → **`FINSAFE_HOST_PROFILE`** → **`finsafe.yaml`** `isolation.host_profile`. There is no silent default; **`legacy`** is rejected for `self-confine`.

```bash
# Windows desktop (backend follows policy / Auto)
finsafe --host-profile windows-desktop-isolated self-confine -- powershell

# Optional YAML overrides (scalars from file win; path lists merge)
finsafe --host-profile windows-desktop-isolated --policy my-tweaks.yaml self-confine -- powershell

# Linux / macOS interactive brokers
finsafe --host-profile linux-desktop-isolated self-confine -- ./my-broker
finsafe --host-profile mac-seatbelt self-confine -- ./my-broker
```

Built-in profiles include **`windows-desktop-isolated`**, **`linux-desktop-isolated`**, **`mac-seatbelt`**, and **`windows-managed`**. Default writable root is **`./workspace`** on Windows and **`./workspace-sc`** on Linux/macOS (relative to launch cwd). **`--json`** includes **`resolved_host_profile`** and **`selected_backend`**.

### 2. High-level intent policy

Use **`finsafe run --high-level`** with YAML from [examples/high-level-policies/](../examples/high-level-policies/) (intent / router schema — **not** `kind: local-wrapper`). **Do not combine** global `finsafe --policy <wrapper.yaml>…` with `run --high-level`; the CLI treats them as mutually exclusive.

```bash
finsafe run --high-level <PATH> -- <program> [args...]
```

Optional **`--server`** and identity flags apply only on this path; see `finsafe --help` for your build.

**Sample file:** [examples/high-level-policies/python-no-network.yaml](../examples/high-level-policies/python-no-network.yaml) (sandboxed Python, **no** network).

### 3. Legacy execution spec (JSON)

Some integrations still use **`finsafe run --policy spec.json`** where `spec.json` is **`ExecutionSpecV1`**, not wrapper YAML. That **`--policy`** sits **after** `run` and is unrelated to **`finsafe --policy wrapper.yaml run …`**. You cannot pass both the global wrapper `--policy` and the per-subcommand legacy `--policy` at once.

---

## When to use `run` vs `self-confine`

| Verb | Use when | Mechanism |
|------|----------|-----------|
| **`run`** | One-shot or batch workloads that exit on their own (`python`, compilers, one-shot agent CLI queries). | FinSafe **starts a child** with confinement applied to that execution. |
| **`self-confine`** | Long-lived brokers that own the terminal (REPL / TUI). | FinSafe applies posture to **itself**, then **`execve`** replaces the process with the broker—the TTY stays with the broker. |

**Do not swap them:** wrapping a broker with `run` breaks normal interactive IO; wrapping a one-shot script with `self-confine` is the wrong lifecycle and audit shape.

### Interactive CLI tools inside `run` (Linux, PTY mode)

Some short-lived commands still need a **controlling terminal** inside the sandbox—for example `vim`, `less`, `nano`, or scripts that open `/dev/tty`. On Linux, **`stdio: mode: inherit`** (or the default when unset) does **not** make `/dev/tty` work under bubblewrap; you may see errors such as *Inappropriate ioctl for device* or *No such device or address*.

Use **`pty`** in the wrapper policy or override on the command line:

```yaml
stdio:
  mode: pty
```

```bash
finsafe --policy ./policy.yaml run --stdio pty -- vim /path/in/workspace/file.txt
```

PTY mode uses a **virtual** terminal inside the sandbox (not direct host `/dev/tty` passthrough), which avoids host-terminal injection risks. **`--json`** with PTY relays child output through the PTY master when not using machine-readable capture mode.

Private `/proc` for the sandbox PID namespace is available when argv hardening is enabled in your deployment configuration—not on every default `finsafe run` without that posture.

---

## Getting started

### 1. Version and help

```bash
finsafe version
finsafe --help
```

Note: **`finsafe run --help`** may not be wired—use **`finsafe --help`** for options that apply to `run` / `self-confine`.

### 2. Short-lived run (minimal)

If policy uses `read_write_paths: ["./workspace"]`, create that directory first:

```bash
mkdir -p my-workspace/workspace
cd my-workspace
finsafe --policy ./examples/wrapper-policies/hermes-version-smoke.yaml run -- hermes --version
```

On **macOS**, if `hermes` is not found or Seatbelt denies toolchain paths, use explicit `HOME`/`PATH` (see [Quick start (Hermes)](../README.md#quick-start-hermes) or the policy file header comments).

(Adjust `--policy` to the path where you stored your YAML; the [examples](../examples/) folder in this repo includes starter policies.)

Machine-readable output:

```bash
finsafe --policy /path/to/policy.yaml run --json echo hello </dev/null | jq .
```

On macOS, JSON output typically includes Seatbelt-related attestation fields (sandbox helper path, profile digest, network posture).

### 3. Interactive broker (`self-confine`)

From a real terminal (TTY), in a directory layout that matches your **`filesystem`** paths:

```bash
cd /path/to/project-with-workspace-dir
finsafe --policy /path/to/interactive-policy.yaml self-confine your-broker
```

Replace `your-broker` with the broker executable you run (for example a local agent CLI).

---

## Example policies (not installed by `install.sh`)

**`install.sh` / `install.ps1` install binaries only** — no YAML is copied to your machine. Get starter policies in one of these ways:

| Method | When to use |
|--------|-------------|
| **`finsafe init`** (recommended) | Creates `~/.config/finsafe/policies/examples/` (Linux/macOS) or `%APPDATA%\FinSAFE\policies\examples\` (Windows) with a curated smoke set. |
| **Clone** [finogeeks/finsafe](https://github.com/finogeeks/finsafe) | Full `examples/` tree (Hermes, Windows smokes, agent CLIs). |
| **`curl -O` raw files** | One or two policies without cloning (see [README](../README.md) quick start). |

```bash
finsafe init
finsafe --policy ~/.config/finsafe/policies/examples/hermes-version-smoke.yaml run -- hermes --version
```

Override locations with **`FINSAFE_CONFIG_DIR`** (config root) or **`FINSAFE_POLICIES_DIR`** (policy store only). Host profile YAML: **`~/.config/finsafe/finsafe.yaml`** (or **`FINSAFE_CONFIG`** for an explicit file path).

| Directory | Contents |
|-----------|----------|
| `~/.config/finsafe/policies/examples/` (after `init`) | Hermes smokes, Codex/OpenCode one-shots, Windows sandbox smoke |
| [examples/wrapper-policies/](../examples/wrapper-policies/) | Full public tree in the GitHub repo |
| [examples/wrapper-policies/agent-sandbox/](../examples/wrapper-policies/agent-sandbox/) | Hermes, Codex, OpenCode, agy, isolation probes |

Use **`finsafe --policy <path-to.yaml>`** with paths relative to your shell cwd unless you pass an absolute path.

---

## Creating and iterating policies

When a sandboxed run fails (path denied, network blocked, timeout), use **`finsafe learn`**, **`finsafe --audit`**, or **`finsafe explain`** instead of guessing YAML fields.

**Running Hermes, OpenCode, or agy?** See [agent-sandbox-guide.md](agent-sandbox-guide.md) § **Policy iteration with learn and explain** for agent-shaped commands, `--base` on example policies, and the macOS `learn` zero-denial caveat.

### Which tool when?

| Situation | Tool |
|-----------|------|
| You have a command and **no policy yet** (or want a fresh draft) | **`finsafe learn -- <cmd>`** — writes `~/.config/finsafe/policies/learned-policy.yaml` by default (override with `--out`) |
| You have a policy and want **more grants** after a failure | **`finsafe learn --base ./policy.yaml -- <cmd>`** |
| You want **inline hints** on the same run without generating YAML | **`finsafe --audit --policy ./policy.yaml run -- <cmd>`** |
| You saved a **`--json` envelope** from a past run | **`finsafe explain envelope.json`** |

Field reference and platform notes: [POLICY-QUICKREF.md](POLICY-QUICKREF.md) · [`--audit` contract](isolation-audit-mode.md).

### `finsafe learn`

Captures sandbox denials under **real enforcement** (diagnostic capture on macOS/Windows; seccomp audit on Linux) and emits **reviewable YAML**:

```bash
mkdir -p workspace
cd my-project

# First pass — built-in minimal seed (network: none, ./workspace writable)
finsafe learn -- my-agent --print "hello"
# → ~/.config/finsafe/policies/learned-policy.yaml (override with --out)

# Run under the learned policy
finsafe --policy ./learned-policy.yaml run -- my-agent --print "hello"

# Merge additional grants after another failure
finsafe learn --base ./learned-policy.yaml --out ./learned-policy.yaml -- my-agent --print "hello"
```

Useful flags: **`--work-dir`** (child cwd), **`--json`** (machine-readable summary on stdout).

**Expectations:** Linux `learn` may allow seccomp-missed syscalls to complete while logging them. macOS and Windows keep full enforcement — the command may still exit non-zero; review the learn summary and blocked secret paths before deploying.

### `finsafe explain`

Post-mortem diagnosis from a saved execution envelope (same JSON shape as `finsafe run --json`):

```bash
finsafe --policy ./policy.yaml run --json -- my-agent --print "hello" 2>audit.stderr \
  | tail -1 > envelope.json
finsafe explain envelope.json
# or: finsafe explain --json envelope.json
```

`explain` reads `policy_derivation_notes` (including Windows `etw_audit:` lines) and child stdout markers when present.

### Typical iteration loop

```
finsafe learn -- <cmd>                    → learned-policy.yaml
       ↓
finsafe --policy learned-policy.yaml run -- <cmd>
       ↓
(still failing?) finsafe learn --base learned-policy.yaml -- <cmd>
       ↓
(optional) finsafe --audit run …          → stderr hints
       ↓
(optional) save --json envelope → finsafe explain
       ↓
repeat until clean
```

---

## macOS Seatbelt notes

macOS isolation is **not** equivalent to Linux:

- Profiles include **baseline denies** for sensitive paths plus **allows** derived from **`filesystem`** and the working directory.
- **`macos_seatbelt.deny_outbound_ports`** layers port-specific denies on top of **`network: host`**.

---

## High-level policy and remote submission

Advanced integrations may use **`finsafe run --high-level`** with a separate high-level policy document, or **`--server`** to submit work to an execution API. Most **local** workflows use **`--policy`** wrapper YAML only. See `finsafe --help` for flags available in your build.

---

## Approval (human-in-the-loop)

Some deployments require **approve / deny** before a run is admitted. That flow is carried by the execution platform and broker adapters—not by a conversational prompt in the base CLI. Your organization’s adapter documentation describes how approvals are surfaced.

---

## Exit codes (CLI)

Typical meanings (see `finsafe --help` for the authoritative list for your version):

| Code | Meaning |
|------|---------|
| `0` | Success (including `probe` completing normally). |
| `1` | Internal error (for example JSON serialization). |
| `2` | CLI / input error (missing file, invalid flags). |
| `3` | Sandbox launch failure before usable output. |
| `64` | Policy compiled, but no local executor is available for this host posture (“compile-pending” / unsupported combination). |

---

## Troubleshooting

| Symptom | What to check |
|---------|----------------|
| **Bubblewrap not available** on macOS | Expected for the local wrapper; macOS uses **Seatbelt**. Use **`probe`** / **`doctor`**. |
| **`program_mode` mismatch** | Policy **`short-lived`** must pair with **`run`**; **`interactive`** with **`self-confine`**. |
| **No network** under `network: none` | Use **`network: host`** if the workload needs outbound HTTPS (subject to your threat model). |
| **Paths denied on macOS** | Widen **`read_only_paths`** / **`read_write_paths`**, ensure declared directories exist, inspect **`--json`** attestation fields. |
| **Sandbox run failed — where to start** | **Agents (Hermes/OpenCode/agy):** [agent-sandbox-guide.md](agent-sandbox-guide.md) § **Policy iteration with learn and explain**. **Other workloads:** [USER-GUIDE § Creating and iterating policies](USER-GUIDE.md) — **`finsafe learn`**, **`finsafe explain`**, **`--audit`**. |
| **`/dev/tty` fails inside Linux `run`** | Use **`stdio: pty`** in policy or **`finsafe run --stdio pty`**. Do not expect **`inherit`** to provide a controlling terminal under bubblewrap. |

---

## Further reading (this repository)

- [POLICY-QUICKREF.md](POLICY-QUICKREF.md) — wrapper policy field reference  
- [POLICY-QUICKREF-zh.md](POLICY-QUICKREF-zh.md) — 包装策略字段速查（中文）  
- [isolation-audit-mode.md](isolation-audit-mode.md) — `--audit` behavior and saving JSON envelopes  
- [USER-GUIDE-zh.md](USER-GUIDE-zh.md) — 中文用户指南
