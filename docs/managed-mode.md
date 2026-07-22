# FinSAFE managed mode

**中文：** [managed-mode-zh.md](./managed-mode-zh.md)

Enterprise desktops run FinSAFE under **managed mode**: policy is distributed as signed JWS bundles from a central **Policy Authority**, cached and enforced by **`finsafe-agent`**, and consumed by the existing **`finsafe`** CLI over Unix-domain sockets on Linux/macOS or a named pipe on Windows.

For the administrator mental model—bundles as signed policy sets, deterministic groups, first-class assignments, rollout on assignments, and conflict handling—see the [FinSAFE sandbox management model](./sandbox-management-model.md).

Personal / developer use is unchanged when no enrollment marker and no `managed-required` sentinel are present.

**Enterprise IT:** start with the [enterprise deployment runbook](./enterprise-deployment-runbook.md). Fleet install: [vendor-neutral checklist](./mdm/vendor-neutral-checklist.md) (any MDM or config management), or [Jamf](./mdm/jamf.md) / [Intune](./mdm/intune.md) / [Ansible](./mdm/ansible.md).

**Connectivity deep dive:** how the CLI talks only to the agent (not the authority), how the agent finds `FINSAFE_AUTHORITY_URL`, sentinel vs enrollment, and the architecture diagram — [managed-cli-authority-connectivity.md](./managed-cli-authority-connectivity.md) · [中文](./managed-cli-authority-connectivity-zh.md).

## Components

Full binary list, release archives, and Linux-only companions: [binary-reference.md](./binary-reference.md).

| Binary / service | Role |
|------------------|------|
| **Commercial license** (`/etc/finsafe/license.jws`) | Finogeeks-issued JWS on the authority; gates admin, enrollment, bundles, and fleet audit (`402` when missing/invalid) |
| `finsafe-authority-http` | JWKS, bundle distribution, enrollment, heartbeats, audit ingest, admin API |
| `finsafe-agent` | Enrollment, bundle verify+cache, UDS/named-pipe protocol, heartbeat, audit spool upload |
| `finsafe` | Resolves policy from agent when managed; `--personal` opts out only if policy allows |
| `finsafe-bundlectl` | Build/sign/publish bundles and managed-required sentinels — see [authority-deployment.md](./authority-deployment.md#6-managing-policy-bundles-with-finsafe-bundlectl) |
| `finsafe-helper`, `finsafe-supervisor`, `finsafe-landlock-shim` | **Linux only** — siblings of `finsafe` for bubblewrap/cgroup/Landlock (not shipped on macOS) |
| `finsafe-winhelper.exe` | **Windows only** — sibling service/helper for Windows sandbox support |

## Paths (production defaults)

| Platform | Sentinel | Enrollment | Cache / audit | IPC |
|----------|----------|------------|---------------|-----|
| Linux/macOS | `/etc/finsafe/managed-required.json` | `/etc/finsafe/enrolled.json` | `/var/lib/finsafe/cache/`, `/var/lib/finsafe/audit/` | `/run/finsafe-agent.sock` |
| Windows | `C:\ProgramData\FinSAFE\managed-required.json` | `C:\ProgramData\FinSAFE\enrolled.json` | `C:\ProgramData\FinSAFE\cache\`, `C:\ProgramData\FinSAFE\audit\` | `\\.\pipe\finsafe-agent` |

## Quick start (local lab)

On **macOS or Linux**, use one script to start authority, publish a default policy, enroll the agent, and write `lab.env`:

```bash
export FINSAFE_LICENSE_PATH=/path/to/license.jws   # Finogeeks-issued

./scripts/managed-lab.sh start
source "$(./scripts/managed-lab.sh env)"

finsafe run -- /usr/bin/true
./scripts/managed-lab.sh stop
```

Requires **`finsafe-fleet-v*`**, **`finsafe-admin-server-v*`**, and **`finsafe-bundlectl-v*`** on `PATH` (from [GitHub Releases](https://github.com/finogeeks/finsafe/releases)). Default bind **`127.0.0.1:8095`**, state **`~/.finsafe-lab`**. Full guide: [managed-lab.md](./testing/managed-lab.md).

Admin UI during the lab: [http://127.0.0.1:8095/admin/](http://127.0.0.1:8095/admin/)

For production fleet paths (`/etc/finsafe`, MDM sentinel, systemd/LaunchDaemon), follow [enterprise-deployment-runbook.md](./enterprise-deployment-runbook.md) and [managed-mode-macos-runbook.md](./testing/managed-mode-macos-runbook.md).

## Policy defaults (fleet administrators)

Published bundles contain **sandbox policies** (wrapper YAML). FinSAFE also applies **compiler defaults** that are not duplicated in every bundle file:

- **Linux/macOS:** Built-in **deny-read** paths (for example `.env` under writable workspace roots and `.ssh` under `$HOME`) and **protected** `.git` / `.finsafe` segments under writable roots, unless a policy sets `skip_default_deny_read: true` or `skip_default_protected_paths: true`.
- **Windows (isolated/managed):** The same built-in **deny-read** set applies (`.env*` under writable roots; `.ssh`, `.aws`, `.gnupg`, `.config/gcloud` under `%USERPROFILE%`), enforced via DACL deny ACEs, unless `skip_default_deny_read: true`.

After upgrading `finsafe` / agent binaries without republishing bundle content, agents may still change enforcement on Linux/macOS and Windows desktops. Review [POLICY-QUICKREF.md](./POLICY-QUICKREF.md) — sections **Built-in filesystem defaults** and **`filesystem.deny_read_paths`** — before wide rollout. Use `skip_default_deny_read: true` only when a program legitimately must read paths covered by the default set.

**Network allowlist:** Policies use `network: !allowlist` with `domains:`; endpoints need `finsafe-net-proxy` at launch (or `start_internal_proxy: true` for a bundled loopback proxy on `127.0.0.1:60080`). **Personal/local how-to:** [network-allowlist-proxy-runbook.md](./network-allowlist-proxy-runbook.md). Fields and `FINSAFE_NET_PROXY_AUDIT_LOG`: [POLICY-QUICKREF.md](./POLICY-QUICKREF.md).

**HTTPS inspection (`tls_terminate`):** Optional commercial add-on (`mitm_tls_terminate` license feature). The authority issues an inspection CA; published bundles carry `inspection_ca_cert_pem`; the agent installs the cert and injects trust-store env vars into sandbox children. Operators must disclose inspection to users. Setup: [https-inspection-runbook.md](./https-inspection-runbook.md) (full runbook), [authority-deployment.md](./authority-deployment.md#tls-inspection-mitm), and [POLICY-QUICKREF.md](./POLICY-QUICKREF.md) — **TLS inspection**.

## CLI errors

| Code | Meaning |
|------|---------|
| `MANAGED_FORCED_BY_POLICY` | Sentinel or enrollment blocks `--personal` or local override |
| `MANAGED_DAEMON_UNREACHABLE` | Agent socket missing or challenge failed |
| `MANAGED_POLICY_LOCAL_OVERRIDE` | `--policy` / global wrapper file used while managed |

## MDM deployment

See [enterprise-deployment-runbook.md](./enterprise-deployment-runbook.md) for the full phased runbook. Platform guides:

- [Vendor-neutral checklist](./mdm/vendor-neutral-checklist.md) — **use when not on Jamf/Intune**
- [Jamf Pro](./mdm/jamf.md)
- [Microsoft Intune](./mdm/intune.md)
- [Ansible](./mdm/ansible.md)

Example scripts: [`packaging/mdm/examples/`](../packaging/mdm/examples/).

See also: [managed-mode test matrix](testing/managed-mode-matrix.md), [licensing E2E on macOS](testing/licensing-e2e-macos.md), [enterprise runbook — security boundaries](enterprise-deployment-runbook.md#10-security-boundaries).
