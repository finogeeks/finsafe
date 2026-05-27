# FinSafe CLI (public releases)

**中文：** [README-zh.md](README-zh.md)

FinSafe is a host execution boundary toolkit: namespaces, cgroup limits, syscall filtering (Linux), path restrictions, and Seatbelt-backed profiles (macOS), with auditable outcomes. The **`finsafe`** command-line tool is the operator front door for **local wrapper** workflows (`run`, `self-confine`, `probe`, `doctor`, and related helpers).

This repository holds **public release binaries** and **end-user documentation** only. It does **not** contain FinSafe engine source code.

## Personal vs managed (licensing)

| Mode | Who | License |
|------|-----|---------|
| **Personal / local wrapper** | Developers and power users running `finsafe --policy …` on their own machine | **Free** — public `finsafe` CLI releases include no commercial license file |
| **Managed fleet** | IT teams running `finsafe-authority-http`, `finsafe-agent`, and MDM-delivered policy | **Commercial** — Finogeeks issues a signed `license.jws` installed on the Policy Authority |

Public [GitHub Releases](https://github.com/finogeeks/finsafe/releases) ship **four archive families** on the same tag: personal CLI (`finsafe-v*`), managed fleet (`finsafe-fleet-v*`), policy authority server (`finsafe-admin-server-v*`, Linux + macOS), and operator CLI (`finsafe-bundlectl-v*`, Linux + macOS). Commercial `license.jws` is issued by Finogeeks (not on GitHub). See [binary-reference.md](docs/binary-reference.md) and [authority-deployment.md](docs/authority-deployment.md).

### Install scripts (all platforms)

| | **Linux** | **macOS** | **Windows** |
|---|-----------|-----------|-------------|
| **Personal** (`finsafe-v*`) | [`install.sh`](install.sh) | [`install.sh`](install.sh) | [`install.ps1`](install.ps1) |
| **IT pilot** (`finsafe-fleet-v*`) | [`install-fleet.sh`](install-fleet.sh) (sudo) | [`install-fleet.sh`](install-fleet.sh) (sudo) | [`install-fleet-windows.ps1`](install-fleet-windows.ps1) (elevated) |
| **Production fleet** | MDM / Ansible / image — [packaging/mdm/](packaging/mdm/) | MDM / Jamf / PKG — [packaging/mdm/](packaging/mdm/) | Intune / GPO — [packaging/mdm/](packaging/mdm/) |

IT pilot scripts download a release, verify `SHA256SUMS`, install binaries, and configure `finsafe-agent`. They are for labs and small pilots — not replacements for MDM at scale.

**Operator skills for AI agents:**

- [finsafe-enterprise-setup](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-enterprise-setup/SKILL.md) — managed fleet end-to-end (releases + Finogeeks `license.jws`)
- [finsafe-bundlectl](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-bundlectl/SKILL.md) — policy bundle publish + MDM sentinel

## Install a release

### One-liner (recommended)

Needs **`curl`**, **`tar`**, and **`zstd`** (or a `tar` with `--zstd`). Verifies **`SHA256SUMS`** unless you opt out.

```bash
curl -fsSL https://raw.githubusercontent.com/finogeeks/finsafe/main/install.sh | sh
```

Pin a version or install directory:

```bash
curl -fsSL https://raw.githubusercontent.com/finogeeks/finsafe/main/install.sh | env FINSAFE_VERSION=0.2.0 FINSAFE_INSTALL_DIR="$HOME/.local/bin" sh
curl -fsSL https://raw.githubusercontent.com/finogeeks/finsafe/main/install.sh | sh -s -- --version 0.2.0
```

See **`install.sh --help`** (after downloading the script) for all environment variables.

**Windows (personal):** PowerShell 5.1+ with `tar` (or `zstd` + `tar`):

```powershell
irm https://raw.githubusercontent.com/finogeeks/finsafe/main/install.ps1 | iex
```

Pin a version: `$env:FINSAFE_VERSION = '0.5.0'; irm .../install.ps1 | iex`

### Manual download

1. Open [**Releases**](https://github.com/finogeeks/finsafe/releases) and pick a version tag (for example `v0.2.0`).
2. Download the archive for your platform:
   - Linux x86_64: `finsafe-v<version>-x86_64-unknown-linux-gnu.tar.zst`
   - macOS Apple Silicon: `finsafe-v<version>-aarch64-apple-darwin.tar.zst`
   - macOS Intel: `finsafe-v<version>-x86_64-apple-darwin.tar.zst`
   - Windows x86_64: `finsafe-v<version>-x86_64-pc-windows-msvc.tar.zst`
3. Download `SHA256SUMS` from the same release.
4. Verify and extract:

```bash
VERSION=0.2.0   # replace with the release you downloaded
shasum -a 256 -c SHA256SUMS
tar -xvf "finsafe-v${VERSION}-<target>.tar.zst"
# Binary path: finsafe-v<version>-<target>/finsafe
# Linux archives also include finsafe-helper, finsafe-supervisor, and
# finsafe-landlock-shim; keep them next to finsafe for auto-discovery.
```

Optional: copy `finsafe` into a directory on your `PATH`. On Linux, copy the
three companion binaries beside it as well.

5. Confirm:

```bash
./finsafe version
finsafe --help
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

## Quick start (Hermes)

These examples assume **`hermes`** is on your **`PATH`** (install Hermes separately). Example policies use **`./workspace`** under your **current working directory** — run `mkdir -p workspace` before the commands below, or edit the YAML.

**Option A — download policies** (files land in the current directory):

```bash
curl -fsSL -O https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/hermes-version-smoke.yaml
curl -fsSL -O https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/hermes-oneshot-query.yaml
curl -fsSL -O https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/hermes-interactive.yaml
mkdir -p workspace
finsafe --policy ./hermes-version-smoke.yaml run hermes --version
finsafe --policy ./hermes-oneshot-query.yaml run hermes chat -q "Say hello in one sentence."
finsafe --policy ./hermes-interactive.yaml self-confine hermes   # TTY required
```

**Option B — clone this repo** and run from the repository root:

```bash
git clone https://github.com/finogeeks/finsafe.git && cd finsafe
mkdir -p workspace
finsafe --policy ./examples/wrapper-policies/hermes-version-smoke.yaml run hermes --version
finsafe --policy ./examples/wrapper-policies/hermes-oneshot-query.yaml run hermes chat -q "Say hello in one sentence."
finsafe --policy ./examples/wrapper-policies/hermes-interactive.yaml self-confine hermes   # TTY required
```

- **`run`** → policy **`program_mode: short-lived`** (one-shot / batch).  
- **`self-confine`** → policy **`program_mode: interactive`** (long-lived REPL); use a real terminal.  
- Mixing these (e.g. `run` with an `interactive` policy) is rejected.

More detail: [USER-GUIDE.md](docs/USER-GUIDE.md), [POLICY-QUICKREF.md](docs/POLICY-QUICKREF.md).

## Documentation

### End users and operators (local `--policy`)

| Document | Description |
|----------|-------------|
| [docs/USER-GUIDE.md](docs/USER-GUIDE.md) | English operator guide (`run` vs `self-confine`, policy YAML overview, exit codes). |
| [docs/USER-GUIDE-zh.md](docs/USER-GUIDE-zh.md) | Chinese user guide. |
| [docs/POLICY-QUICKREF.md](docs/POLICY-QUICKREF.md) | Wrapper policy (`kind: local-wrapper`) field reference (English). |
| [docs/POLICY-QUICKREF-zh.md](docs/POLICY-QUICKREF-zh.md) | 包装策略字段速查（中文）. |
| [examples/README.md](examples/README.md) | Index of policy examples (`high-level-policies/`, `wrapper-policies/`). |
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
