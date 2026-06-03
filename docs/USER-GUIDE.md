# FinSafe User Guide

This guide is for **operators and developers** who run programs and agent brokers under FinSafe confinement using the prebuilt **`finsafe`** CLI. For the full wrapper policy field list, see [POLICY-QUICKREF.md](POLICY-QUICKREF.md) ([Chinese](POLICY-QUICKREF-zh.md)) in this repository.

## What FinSafe does

FinSafe constrains **how** code runs on a host: namespaces, cgroup limits, syscall filtering (Linux), path restrictions, and Seatbelt-backed profiles (macOS), with **auditable** outcomes. It is **not** an AI product; agent runtimes decide *what* to do—the boundary defines *inside which isolation posture* work runs.

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
- **`network`:** `none` or `host` (Stage 1 wrapper).
- **`filesystem.read_only_paths` / `read_write_paths`:** Paths relative to your workspace layout.
- **`macos_seatbelt.deny_outbound_ports`** (optional, macOS): Block specific outbound TCP ports when `network: host`.
- **`resources`:** Memory, PIDs, CPU cgroup strings; optional `timeout_ms` for wall-clock limits on **`run`**.

**Optional compiler `filesystem` fields:** The wrapper may merge default protected subtrees (`.git` / `.finsafe` under writable roots), apply a **built-in deny-read set** on Linux/macOS (for example `.env` under the workspace and `.ssh` under `$HOME` unless `skip_default_deny_read: true`), add explicit **`deny_read_paths`**, and expand **`deny_write_globs`** (legacy alias `deny_read_globs`) into extra read-only rules. **`deny_read_paths` is not the same as `read_only_paths`** — deny-read blocks reads inside writable scope; read-only paths are grants. Omitting those keys keeps older policies valid on paper, but fleet upgrades on Linux/macOS still pick up shipped defaults unless you opt out. See [POLICY-QUICKREF.md](POLICY-QUICKREF.md) ([Chinese](POLICY-QUICKREF-zh.md)).

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

Copy-paste examples from this repository (clone or browse on GitHub) — see [examples/README.md](../examples/README.md):

| Goal | Policy file | Example |
|------|-------------|---------|
| Short-lived wrapper smoke | [examples/wrapper-policies/hermes-version-smoke.yaml](../examples/wrapper-policies/hermes-version-smoke.yaml) | `finsafe --policy ./examples/wrapper-policies/hermes-version-smoke.yaml run echo hello` |
| One-shot broker / query style | [examples/wrapper-policies/hermes-oneshot-query.yaml](../examples/wrapper-policies/hermes-oneshot-query.yaml) | `finsafe --policy ./examples/wrapper-policies/hermes-oneshot-query.yaml run hermes chat -q "…"` |
| Interactive broker (TTY) | [examples/wrapper-policies/hermes-interactive.yaml](../examples/wrapper-policies/hermes-interactive.yaml) | `finsafe --policy ./examples/wrapper-policies/hermes-interactive.yaml self-confine hermes` |
| Interactive broker + deny outbound TCP port 80 (Seatbelt) | [examples/wrapper-policies/hermes-interactive-deny-http.yaml](../examples/wrapper-policies/hermes-interactive-deny-http.yaml) | `finsafe --policy ./examples/wrapper-policies/hermes-interactive-deny-http.yaml self-confine hermes` |

Wrapper field reference: [POLICY-QUICKREF.md](POLICY-QUICKREF.md) · [POLICY-QUICKREF-zh.md](POLICY-QUICKREF-zh.md).

### 1b. Host profile (`self-confine` only)

When you prefer a **named posture** instead of hand-writing `kind: local-wrapper` YAML, use **`--host-profile`** before `self-confine`. The CLI synthesises an interactive wrapper policy, then uses the same launch path as `finsafe --policy <wrapper.yaml> self-confine`.

Resolution order: CLI **`--host-profile`** → **`FINSAFE_HOST_PROFILE`** → **`finsafe.yaml`** `isolation.host_profile`. There is no silent default; **`legacy`** is rejected for `self-confine`.

```bash
# Windows desktop (AppContainer)
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
finsafe --policy ./examples/wrapper-policies/hermes-version-smoke.yaml run echo "hello"
```

(Adjust `--policy` to the path where you stored your YAML; the [examples](../examples/) folder in this repo includes a starter policy.)

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
| **`/dev/tty` fails inside Linux `run`** | Use **`stdio: pty`** in policy or **`finsafe run --stdio pty`**. Do not expect **`inherit`** to provide a controlling terminal under bubblewrap. |

---

## Further reading (this repository)

- [POLICY-QUICKREF.md](POLICY-QUICKREF.md) — wrapper policy field reference  
- [POLICY-QUICKREF-zh.md](POLICY-QUICKREF-zh.md) — 包装策略字段速查（中文）  
- [USER-GUIDE-zh.md](USER-GUIDE-zh.md) — 中文用户指南
