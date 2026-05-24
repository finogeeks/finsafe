# FinSAFE managed mode

**中文：** [managed-mode-zh.md](./managed-mode-zh.md)

Enterprise desktops run FinSAFE under **managed mode**: policy is distributed as signed JWS bundles from a central **Policy Authority**, cached and enforced by **`finsafe-agent`**, and consumed by the existing **`finsafe`** CLI over a Unix-domain socket.

For the administrator mental model—bundles as signed policy sets, deterministic groups, first-class assignments, rollout on assignments, and conflict handling—see the [FinSAFE sandbox management model](./sandbox-management-model.md).

Personal / developer use is unchanged when no enrollment marker and no `managed-required` sentinel are present.

**Enterprise IT:** start with the [enterprise deployment runbook](./enterprise-deployment-runbook.md). Fleet install: [vendor-neutral checklist](./mdm/vendor-neutral-checklist.md) (any MDM or config management), or [Jamf](./mdm/jamf.md) / [Intune](./mdm/intune.md) / [Ansible](./mdm/ansible.md).

## Components

Full binary list, release archives, and Linux-only companions: [binary-reference.md](./binary-reference.md).

| Binary / service | Role |
|------------------|------|
| **Commercial license** (`/etc/finsafe/license.jws`) | Finogeeks-issued JWS on the authority; gates admin, enrollment, bundles, and fleet audit (`402` when missing/invalid) |
| `finsafe-authority-http` | JWKS, bundle distribution, enrollment, heartbeats, audit ingest, admin API |
| `finsafe-agent` | Enrollment, bundle verify+cache, UDS protocol, heartbeat, audit spool upload |
| `finsafe` | Resolves policy from agent when managed; `--personal` opts out only if policy allows |
| `finsafe-bundlectl` | Build/sign/publish bundles and managed-required sentinels — see [authority-deployment.md](./authority-deployment.md#6-managing-policy-bundles-with-finsafe-bundlectl) |
| `finsafe-helper`, `finsafe-supervisor`, `finsafe-landlock-shim` | **Linux only** — siblings of `finsafe` for bubblewrap/cgroup/Landlock (not shipped on macOS) |

## Paths (Linux defaults)

| Path | Purpose |
|------|---------|
| `/etc/finsafe/managed-required.json` | MDM-deployed JWS sentinel (forces managed mode) |
| `/etc/finsafe/enrolled.json` | Device enrollment record |
| `/var/lib/finsafe/cache/` | Verified bundle cache |
| `/var/lib/finsafe/audit/` | Audit spool (NDJSON) |
| `/run/finsafe-agent.sock` | CLI ↔ agent UDS |

## Quick start (dev)

```bash
# Terminal 1 — authority (managed APIs need a valid license in production)
export FINSAFE_AUTHORITY_DB=/tmp/finsafe-authority.db
export FINSAFE_LICENSE_PATH=/tmp/finsafe-license.jws   # Finogeeks-issued in production
cargo run -p finsafe-authority --bin finsafe-authority-http

# Terminal 2 — build & publish a bundle
finsafe-bundlectl bundle build --from examples/wrapper-policy.yaml --out /tmp/bundle.json
finsafe-bundlectl bundle sign --in /tmp/bundle.json --out /tmp/bundle.jws
finsafe-bundlectl bundle publish --in /tmp/bundle.jws --authority http://127.0.0.1:8090

# Terminal 3 — agent (bootstrap enrollment)
sudo mkdir -p /etc/finsafe /var/lib/finsafe
export FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID=dev-laptop-1
export FINSAFE_ENROLL_TOKEN=$(curl -s -X POST http://127.0.0.1:8090/v1/enroll/token | jq -r .token)
cargo run -p finsafe-agent

# Terminal 4 — managed run
finsafe run -- /usr/bin/true
```

Admin UI: [http://127.0.0.1:8090/admin/](http://127.0.0.1:8090/admin/)

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
