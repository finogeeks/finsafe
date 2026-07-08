# FinSafe CLI (public releases)

**中文：** [README-zh.md](README-zh.md)

FinSafe is a **cross-platform** host execution boundary toolkit for running third-party agents safely on **Linux, macOS, and Windows**. It applies namespaces, cgroup limits, and syscall filtering (Linux), Seatbelt profiles (macOS), and AppContainer / WFP / DACL confinement (Windows), with auditable outcomes. The **`finsafe`** command-line tool is the operator front door for **local wrapper** workflows (`run`, `self-confine`, `learn`, `explain`, `probe`, `doctor`, and related helpers).

This repository holds **public release binaries** and **end-user documentation** only. It does **not** contain FinSafe engine source code.

## Supported platforms

FinSAFE ships **first-class desktop sandboxes** on all three operator platforms. The same wrapper policy YAML (`kind: local-wrapper`) compiles to the best native confinement available on each host:

| Platform | Confinement stack | Personal CLI | Managed fleet |
|----------|-------------------|:------------:|:-------------:|
| **Linux** x86_64 | bubblewrap, cgroup v2, seccomp, Landlock (when available) | ✓ | ✓ |
| **macOS** (Intel + Apple Silicon) | Seatbelt (`sandbox-exec`), loopback egress proxy | ✓ | ✓ |
| **Windows** x86_64 | AppContainer / LowBox, Job Object, DACL deny-read, WFP egress, ConPTY / PipeCapture stdio | ✓ | ✓ |

Run **`finsafe probe`** and **`finsafe doctor`** on any platform before authoring policy. **Policy Authority** (`finsafe-admin-server-v*`) is published for **Linux and macOS** server hosts; enrolled **Windows desktops** use the fleet archive (`finsafe-fleet-v*-x86_64-pc-windows-msvc.tar.zst`).

## Capabilities (personal wrapper)

Across Linux, macOS, and Windows, the public `finsafe` CLI supports:

- **Declarative wrapper policies** — `finsafe --policy wrapper.yaml run …` (short-lived) and `self-confine …` (interactive brokers)
- **Network modes** — deny-all, host, and domain allowlist with a loopback forward proxy (optional TLS MITM / L7 inspection where licensed)
- **Policy iteration** — `learn`, `explain`, and `--audit` when a deny blocks legitimate agent work
- **Auditable outcomes** — JSON envelopes with attestation digests ([isolation audit mode](docs/isolation-audit-mode.md))
- **Agent templates** — Hermes, OpenCode, Codex, agy under [examples/wrapper-policies/agent-sandbox/](examples/wrapper-policies/agent-sandbox/)

See the [agent sandbox guide](docs/agent-sandbox-guide.md) for agent-specific workflows on every desktop OS.

## Personal vs managed (licensing)

| Mode | Who | License |
|------|-----|---------|
| **Personal / local wrapper** | Developers and power users running `finsafe --policy …` on their own machine | **Free** — public `finsafe` CLI releases include no commercial license file |
| **Managed fleet** | IT teams running `finsafe-authority-http`, `finsafe-agent`, and MDM-delivered policy | **Commercial** — Finogeeks issues a signed `license.jws` installed on the Policy Authority |

Public [GitHub Releases](https://github.com/finogeeks/finsafe/releases) ship **four archive families** on the same tag: personal CLI (`finsafe-v*`), managed fleet (`finsafe-fleet-v*`), policy authority server (`finsafe-admin-server-v*`, Linux + macOS), and operator CLI (`finsafe-bundlectl-v*`, Linux + macOS). **Desktop targets:** Linux x86_64, macOS Intel, macOS Apple Silicon, and **Windows x86_64** (personal and fleet). Commercial `license.jws` is issued by Finogeeks (not on GitHub). **Release notes:** [CHANGELOG.md](CHANGELOG.md) (curated for public users; each release page mirrors the matching version section). See [binary-reference.md](docs/binary-reference.md) and [authority-deployment.md](docs/authority-deployment.md).

### Install scripts (all platforms)

| | **Linux** | **macOS** | **Windows** |
|---|-----------|-----------|-------------|
| **Personal** (`finsafe-v*`) | [`install.sh`](install.sh) | [`install.sh`](install.sh) | [`install.ps1`](install.ps1) |
| **IT pilot** (`finsafe-fleet-v*`) | [`install-fleet.sh`](install-fleet.sh) (sudo) | [`install-fleet.sh`](install-fleet.sh) (sudo) | [`install-fleet-windows.ps1`](install-fleet-windows.ps1) (elevated) |
| **Production fleet** | MDM / Ansible / image — [packaging/mdm/](packaging/mdm/) | MDM / Jamf / PKG — [packaging/mdm/](packaging/mdm/) | Intune / GPO — [packaging/mdm/](packaging/mdm/) |

IT pilot scripts download a release, verify `SHA256SUMS`, install binaries, and configure `finsafe-agent`. They are for labs and small pilots — not replacements for MDM at scale.

**Operator skills for AI agents:**

- [finsafe-agent-sandbox-run](skills/finsafe-agent-sandbox-run/SKILL.md) — run Hermes / OpenCode / agy; **`learn` / `explain`** policy iteration
- [finsafe-agent-sandbox-verify](skills/finsafe-agent-sandbox-verify/SKILL.md) — prove sandbox isolation
- [finsafe-enterprise-setup](skills/finsafe-enterprise-setup/SKILL.md) — managed fleet (Finogeeks `license.jws`)
- [finsafe-bundlectl](skills/finsafe-bundlectl/SKILL.md) — policy bundle publish + MDM sentinel

**Agent sandbox guide:** [docs/agent-sandbox-guide.md](docs/agent-sandbox-guide.md) (includes **`learn` / `explain`** for agents)

## Install a release

### One-liner (recommended)

Needs **`curl`**, **`tar`**, and **`zstd`** (or a `tar` with `--zstd`). Verifies **`SHA256SUMS`** unless you opt out.

```bash
curl -fsSL https://raw.githubusercontent.com/finogeeks/finsafe/main/install.sh | sh
```

Pin a version or install directory:

```bash
curl -fsSL https://raw.githubusercontent.com/finogeeks/finsafe/main/install.sh | env FINSAFE_VERSION=0.9.10 FINSAFE_INSTALL_DIR="$HOME/.local/bin" sh
curl -fsSL https://raw.githubusercontent.com/finogeeks/finsafe/main/install.sh | sh -s -- --version 0.9.10
```

See **`install.sh --help`** (after downloading the script) for all environment variables.

**Windows (personal):** PowerShell 5.1+ with `tar` (or `zstd` + `tar`):

```powershell
irm https://raw.githubusercontent.com/finogeeks/finsafe/main/install.ps1 | iex
```

The installer copies `finsafe.exe` and `finsafe-winhelper.exe`, then runs **`finsafe setup-windows`** once (Windows may show a single permission prompt). After that, use `finsafe run` normally — no admin shell required.

Pin a version: `$env:FINSAFE_VERSION = '0.9.10'; irm https://raw.githubusercontent.com/finogeeks/finsafe/main/install.ps1 | iex`

### Manual download

1. Open [**Releases**](https://github.com/finogeeks/finsafe/releases) and pick a version tag (for example `v0.9.10`).
2. Download the archive for your platform:
   - Linux x86_64: `finsafe-v<version>-x86_64-unknown-linux-gnu.tar.zst`
   - macOS Apple Silicon: `finsafe-v<version>-aarch64-apple-darwin.tar.zst`
   - macOS Intel: `finsafe-v<version>-x86_64-apple-darwin.tar.zst`
   - Windows x86_64: `finsafe-v<version>-x86_64-pc-windows-msvc.tar.zst`
3. Download `SHA256SUMS` from the same release.
4. Verify and extract:

```bash
VERSION=0.9.10   # replace with the release you downloaded
shasum -a 256 -c SHA256SUMS
tar -xvf "finsafe-v${VERSION}-<target>.tar.zst"
# Binary path: finsafe-v<version>-<target>/finsafe
# Linux archives also include finsafe-helper, finsafe-supervisor, and
# finsafe-landlock-shim; keep them next to finsafe for auto-discovery.
```

**Windows (manual extract):** use `tar --zstd` (built in on Windows 11 / recent Windows 10):

```powershell
$VERSION = "0.9.10"   # replace with the release you downloaded
tar --zstd -xf "finsafe-v$VERSION-x86_64-pc-windows-msvc.tar.zst"
# Binary: finsafe-v<version>-x86_64-pc-windows-msvc\finsafe.exe
# Companion: finsafe-winhelper.exe (same folder; required for network-locked policies)
.\finsafe.exe setup-windows   # once per machine (permission prompt is normal)
```

Optional: copy binaries into a directory on your `PATH`. On Linux, copy the
three companion binaries beside `finsafe`. On Windows, copy **`finsafe.exe`**
and **`finsafe-winhelper.exe`** together, then run **`finsafe setup-windows`** once.
PowerShell does not run extensionless files as executables.

5. Confirm:

```bash
./finsafe version
finsafe --help
```

```powershell
.\finsafe.exe version
.\finsafe.exe --help
```

### `release.json`

Each release may include **`release.json`**: a small manifest listing asset URLs and SHA-256 digests for automation. Use it if you script downloads instead of hard-coding filenames.

### Enterprise binaries (same GitHub Release)

Managed fleet and policy authority archives ship on the **same** [Releases](https://github.com/finogeeks/finsafe/releases) page as the personal CLI. For fleet desktops, use **`install-fleet.sh`** / **`install-fleet-windows.ps1`** (IT pilot) or MDM/Ansible (production). Authority and `finsafe-bundlectl` remain manual unpack or your own automation. See **[docs/binary-reference.md](docs/binary-reference.md)** for the full matrix.

**IT pilot (managed fleet) example:**

```bash
sudo FINSAFE_AUTHORITY_URL='https://gov.example.com/policy-authority' \
     FINSAFE_SENTINEL_PATH=./managed-required.jws \
     FINSAFE_ENROLL_TOKEN='one-time-token' \
     ./install-fleet.sh
```

| Archive | Contents |
|---------|----------|
| **`finsafe-fleet-v<version>-<target>.tar.zst`** | Managed `finsafe` + `finsafe-agent` (Linux: helper/supervisor/landlock shim; Windows: `finsafe-winhelper.exe`) |
| **`finsafe-admin-server-v<version>-<target>.tar.zst`** | `finsafe-authority-http` (Linux production; macOS for local dev / pilot) |
| **`finsafe-bundlectl-v<version>-<target>.tar.zst`** | `finsafe-bundlectl` (operator workstation; same targets as desktop) |
| **`finsafe-v<version>-<target>.tar.zst`** | Personal-mode `finsafe` only (`install.sh`) |

Install authority binaries on the policy server; run `finsafe-bundlectl` from a secure operator workstation. Install **`license.jws`** (from Finogeeks, not on GitHub) before enroll or admin APIs. Setup: [docs/authority-deployment.md](docs/authority-deployment.md) · fleet rollout: [docs/enterprise-deployment-runbook.md](docs/enterprise-deployment-runbook.md).

## Quick start (Windows)

After [`install.ps1`](install.ps1) (copies `finsafe.exe` + `finsafe-winhelper.exe` and runs **`finsafe setup-windows`** once — a single permission prompt is normal):

```powershell
irm https://raw.githubusercontent.com/finogeeks/finsafe/main/install.ps1 | iex
Invoke-WebRequest -Uri https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/windows-version-smoke.yaml -OutFile windows-version-smoke.yaml
New-Item -ItemType Directory -Force -Path workspace | Out-Null
finsafe --policy .\windows-version-smoke.yaml run -- cmd /c ver
```

- **`run`** with `program_mode: short-lived` is the default for batch / one-shot agent tools on Windows.
- **`self-confine`** supports interactive console brokers (Hermes, PowerShell) via ConPTY when run from a real terminal.
- Nested `cmd` / PowerShell in non-interactive scripts uses **PipeCapture** stdio (see [CHANGELOG.md](CHANGELOG.md) 0.9.7+).

More Windows examples: [examples/wrapper-policies/windows-sandbox-smoke.yaml](examples/wrapper-policies/windows-sandbox-smoke.yaml), [hermes-windows-oneshot.yaml](examples/wrapper-policies/hermes-windows-oneshot.yaml).

## Quick start (Hermes)

FinSAFE installs **only the `finsafe` binary** — install **Hermes** separately and ensure it is on your **`PATH`**. Example policies expect a writable **`./workspace`** under your **current working directory** (`mkdir -p workspace` before the commands below).

**macOS:** Seatbelt deny-default often requires an explicit `HOME`/`PATH` prefix. If bare `hermes …` fails, use the `/usr/bin/env …` form shown in each YAML file’s header comments.

**Linux:** Use `hermes-linux-interactive.yaml` for interactive brokers (`stdio: pty`, `.env` credential access). `hermes-interactive.yaml` targets macOS Seatbelt paths.

### Get example policies

**Option A — `finsafe init`** (when your build includes it):

```bash
finsafe init
export POLICY_EXAMPLES="$HOME/.config/finsafe/policies/examples"
```

**Option B — download policies** (files land in the current directory):

```bash
curl -fsSL -O https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/hermes-version-smoke.yaml
curl -fsSL -O https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/hermes-oneshot-query.yaml
curl -fsSL -O https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/hermes-interactive.yaml
curl -fsSL -O https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/hermes-linux-interactive.yaml
```

**Option C — clone this repo** and run from the repository root:

```bash
git clone https://github.com/finogeeks/finsafe.git && cd finsafe
export POLICY_EXAMPLES="$PWD/examples/wrapper-policies"
```

### Run Hermes

```bash
mkdir -p workspace

# Smoke (short-lived) — use `run`
finsafe --policy "$POLICY_EXAMPLES/hermes-version-smoke.yaml" run -- hermes --version

# One-shot LLM query (short-lived) — use `run`; needs Hermes config / API access
finsafe --policy "$POLICY_EXAMPLES/hermes-oneshot-query.yaml" run -- \
  hermes chat -q "Say hello in one sentence."

# Interactive broker (long-lived) — use `self-confine` from a real TTY
# macOS:
finsafe --policy "$POLICY_EXAMPLES/hermes-interactive.yaml" self-confine -- hermes
# Linux:
finsafe --policy "$POLICY_EXAMPLES/hermes-linux-interactive.yaml" self-confine -- hermes
```

If you downloaded YAML into the current directory (Option B), replace `"$POLICY_EXAMPLES/…"` with `./hermes-….yaml`.

- **`run`** → policy **`program_mode: short-lived`** (one-shot / batch).  
- **`self-confine`** → policy **`program_mode: interactive`** (long-lived REPL).  
- Mixing these (e.g. `run` with an `interactive` policy) is rejected.

More detail: [USER-GUIDE.md](docs/USER-GUIDE.md), [POLICY-QUICKREF.md](docs/POLICY-QUICKREF.md).

## Quick start (OpenCode)

Install **OpenCode** separately (examples often expect `opencode` and sometimes `~/.bun/bin` on **`PATH`**). There is no interactive OpenCode sample in this repo — only a **one-shot** policy.

After **`finsafe init`**, or from a clone:

```bash
export POLICY_AGENT="$HOME/.config/finsafe/policies/examples"
# or: export POLICY_AGENT=./examples/wrapper-policies/agent-sandbox   # when cloned

mkdir -p workspace
finsafe --policy "$POLICY_AGENT/opencode-oneshot.yaml" run -- \
  /usr/bin/env HOME="$HOME" PATH="$HOME/.bun/bin:$HOME/.local/bin:/usr/bin:/bin" \
  opencode run "your prompt here"
```

Download only this file:

```bash
curl -fsSL -O https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/agent-sandbox/opencode-oneshot.yaml
mkdir -p workspace
finsafe --policy ./opencode-oneshot.yaml run -- opencode run "your prompt here"
```

Policy field reference and failure iteration (`learn`, `explain`, `--audit`): [USER-GUIDE.md § Creating and iterating policies](docs/USER-GUIDE.md).

## Example policies and policy authoring

**`install.sh` / `install.ps1` install binaries only** — wrapper YAML is **not** copied to your machine. After install:

```bash
finsafe init   # when available — seeds ~/.config/finsafe/policies/examples/
# or:
git clone https://github.com/finogeeks/finsafe.git && cd finsafe
# or curl -O individual YAML files (see Quick start sections above)
```

| Path | Contents |
|------|----------|
| [examples/wrapper-policies/](examples/wrapper-policies/) | Hermes, Windows smokes, managed-lab |
| [examples/wrapper-policies/agent-sandbox/](examples/wrapper-policies/agent-sandbox/) | Agent CLI templates (Hermes, Codex, OpenCode, agy) |

When a sandbox run fails, use **`finsafe learn`** to generate reviewable YAML, **`finsafe --audit run`** for inline stderr hints, or **`finsafe explain`** on a saved `--json` envelope. Full workflow: [USER-GUIDE.md § Creating and iterating policies](docs/USER-GUIDE.md).

## Documentation

### End users and operators (local `--policy`)

| Document | Description |
|----------|-------------|
| [docs/agent-sandbox-guide.md](docs/agent-sandbox-guide.md) · [agent-sandbox-guide-zh.md](docs/agent-sandbox-guide-zh.md) | **Agent sandbox** — Hermes, OpenCode, agy; **`learn` / `explain`** for agents. |
| [docs/USER-GUIDE.md](docs/USER-GUIDE.md) | English operator guide (`run` vs `self-confine`, generic learn / explain). |
| [docs/USER-GUIDE-zh.md](docs/USER-GUIDE-zh.md) | Chinese user guide. |
| [docs/POLICY-QUICKREF.md](docs/POLICY-QUICKREF.md) | Wrapper policy (`kind: local-wrapper`) field reference (English). |
| [docs/POLICY-QUICKREF-zh.md](docs/POLICY-QUICKREF-zh.md) | 包装策略字段速查（中文）. |
| [docs/isolation-audit-mode.md](docs/isolation-audit-mode.md) | `--audit` behavior; saving JSON envelopes for `explain`. |
| [examples/README.md](examples/README.md) | Index of policy examples (`high-level-policies/`, `wrapper-policies/`). |
| [examples/wrapper-policies/agent-sandbox/](examples/wrapper-policies/agent-sandbox/) | Agent CLI policy templates (Codex, OpenCode, agy, …). |
| [examples/wrapper-policies/hermes-version-smoke.yaml](examples/wrapper-policies/hermes-version-smoke.yaml) | Minimal short-lived wrapper policy example. |

### Enterprise administrators (managed fleet)

Central policy authority, `finsafe-agent`, MDM deployment, and fleet enforcement (no local `--policy` override on enrolled machines).

| Document | Description |
|----------|-------------|
| [docs/product-one-pager.md](docs/product-one-pager.md) · [docs/product-one-pager-zh.md](docs/product-one-pager-zh.md) | **Product one-pager** (positioning, AI pain points, technology comparison). |
| [docs/enterprise-it-overview.md](docs/enterprise-it-overview.md) · [docs/enterprise-it-overview-zh.md](docs/enterprise-it-overview-zh.md) | **Enterprise IT panorama** (personal vs managed, Hermes, governability, MDM). |
| [docs/endpoint-deployment-options.md](docs/endpoint-deployment-options.md) · [docs/endpoint-deployment-options-zh.md](docs/endpoint-deployment-options-zh.md) | **Deployment path guide** (MDM optional; Ansible/image/SSH; authority binding; sentinel). |
| [docs/binary-reference.md](docs/binary-reference.md) · [docs/binary-reference-zh.md](docs/binary-reference-zh.md) | **All binaries**, release archives, Linux companions, admin verify checklist |
| [docs/authority-deployment.md](docs/authority-deployment.md) | Installing and running `finsafe-authority-http`; license; `finsafe-bundlectl` reference. |
| [docs/admin-ui.md](docs/admin-ui.md) | Admin console reference (devices, enrollment tokens, kill switch). |
| [docs/managed-mode.md](docs/managed-mode.md) · [docs/managed-mode-zh.md](docs/managed-mode-zh.md) | Managed mode architecture, paths, CLI errors. |
| [docs/enterprise-deployment-runbook.md](docs/enterprise-deployment-runbook.md) · [docs/enterprise-deployment-runbook-zh.md](docs/enterprise-deployment-runbook-zh.md) | Phased IT runbook: authority, packages, sentinel, enrollment, operations. |
| [docs/mdm/vendor-neutral-checklist.md](docs/mdm/vendor-neutral-checklist.md) · [docs/mdm/vendor-neutral-checklist-zh.md](docs/mdm/vendor-neutral-checklist-zh.md) | Fleet checklist for **any** deployment tool (not only Jamf/Intune). |
| [docs/mdm/jamf.md](docs/mdm/jamf.md) · [docs/mdm/jamf-zh.md](docs/mdm/jamf-zh.md) | Jamf Pro deployment. |
| [docs/mdm/intune.md](docs/mdm/intune.md) · [docs/mdm/intune-zh.md](docs/mdm/intune-zh.md) | Microsoft Intune deployment. |
| [docs/mdm/ansible.md](docs/mdm/ansible.md) · [docs/mdm/ansible-zh.md](docs/mdm/ansible-zh.md) | Ansible / config management (Linux). |
| [docs/testing/managed-mode-matrix.md](docs/testing/managed-mode-matrix.md) · [docs/testing/managed-mode-matrix-zh.md](docs/testing/managed-mode-matrix-zh.md) | Acceptance test matrix (pilot → production). |
| [docs/testing/licensing-e2e-macos.md](docs/testing/licensing-e2e-macos.md) · [docs/testing/licensing-e2e-macos-zh.md](docs/testing/licensing-e2e-macos-zh.md) | macOS licensing + managed smoke E2E (`e2e-licensing-macos.sh`). |
| [packaging/](packaging/) | systemd / LaunchDaemon units and MDM example scripts |
| [scripts/](scripts/) | Enterprise IT utilities (`check-authority-health.sh`) |

## Security

- Verify `SHA256SUMS` before extracting or executing downloaded binaries.
- Wrapper policies are **declarative**: you pass a YAML file with `--policy`; the CLI applies host-appropriate confinement. Review [POLICY-QUICKREF.md](docs/POLICY-QUICKREF.md) or [POLICY-QUICKREF-zh.md](docs/POLICY-QUICKREF-zh.md) before deploying to production.

## License

Binaries and materials in this repository are published by **Finogeeks** under the license terms supplied with your distribution or subscription. If no separate license file is attached to a release, treat use as governed by your agreement with the publisher.
