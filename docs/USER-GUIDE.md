# FinSafe User Guide

This guide is for **operators and developers** who run programs and agent brokers under FinSafe confinement using the prebuilt **`finsafe`** CLI. For the full wrapper policy field list, see [POLICY-QUICKREF.md](POLICY-QUICKREF.md) in this repository.

## What FinSafe does

FinSafe constrains **how** code runs on a host: namespaces, cgroup limits, syscall filtering (Linux), path restrictions, and Seatbelt-backed profiles (macOS), with **auditable** outcomes. It is **not** an AI product; agent runtimes decide *what* to do—the boundary defines *inside which isolation posture* work runs.

- **CLI (`finsafe`):** Local wrapper front door — `run` for short-lived commands, `self-confine` for long-lived interactive brokers.
- **Server mode:** Multi-tenant submission and scheduling use a separate execution platform (not covered in this repository). Most local users only need the CLI and a wrapper policy file.

---

## Prerequisites

### Install the CLI

Use [GitHub Releases](https://github.com/finogeeks/finsafe/releases), verify `SHA256SUMS`, and extract the archive. See the [top-level README](../README.md).

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

**Optional compiler `filesystem` fields:** The wrapper may merge default protected subtrees (for example `.git` / `.finsafe` under writable roots) and expand optional globs such as **`deny_read_globs`** into Landlock-oriented read-only rules. Omitting those keys keeps older policies valid. See [POLICY-QUICKREF.md](POLICY-QUICKREF.md).

---

## When to use `run` vs `self-confine`

| Verb | Use when | Mechanism |
|------|----------|-----------|
| **`run`** | One-shot or batch workloads that exit on their own (`python`, compilers, one-shot agent CLI queries). | FinSafe **starts a child** with confinement applied to that execution. |
| **`self-confine`** | Long-lived brokers that own the terminal (REPL / TUI). | FinSafe applies posture to **itself**, then **`execve`** replaces the process with the broker—the TTY stays with the broker. |

**Do not swap them:** wrapping a broker with `run` breaks normal interactive IO; wrapping a one-shot script with `self-confine` is the wrong lifecycle and audit shape.

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
finsafe --policy ./examples/hermes-version-smoke.yaml run echo "hello"
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

---

## Further reading (this repository)

- [POLICY-QUICKREF.md](POLICY-QUICKREF.md) — wrapper policy field reference  
- [USER-GUIDE-zh.md](USER-GUIDE-zh.md) — 中文用户指南
