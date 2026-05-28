# FinSAFE scripts (public repository)

Scripts in this directory ship with [finogeeks/finsafe](https://github.com/finogeeks/finsafe) for **enterprise administrators** operating Policy Authority and fleet endpoints.

| Script | Purpose |
|--------|---------|
| [`start-authority.sh`](start-authority.sh) | Foreground start with defaults (`--workdir`, license path, prints **/admin/** URL) |
| [`check-authority-health.sh`](check-authority-health.sh) | Verify `/health`, `/v1/license/status`, and **`/admin/`** (optional admin stats with `FINSAFE_ADMIN_TOKEN`) |
| [`../install.sh`](../install.sh) | Personal `finsafe` — Linux/macOS |
| [`../install.ps1`](../install.ps1) | Personal `finsafe` — Windows |
| [`../install-fleet.sh`](../install-fleet.sh) | IT pilot managed fleet — Linux/macOS (sudo) |
| [`../install-fleet-windows.ps1`](../install-fleet-windows.ps1) | IT pilot managed fleet — Windows (elevated) |
| [`../packaging/mdm/`](../packaging/mdm/) | **Production** MDM/Ansible examples (all platforms) |

## Operator binaries (not shell scripts)

Fleet rollout uses release binaries from GitHub, not source builds:

| Binary | Role |
|--------|------|
| `finsafe-fleet-v*` | Managed `finsafe` + `finsafe-agent` on desktops |
| `finsafe-admin-server-v*` | `finsafe-authority-http` (Policy Authority) |
| `finsafe-bundlectl-v*` | Build, sign, publish policy bundles |

See [binary-reference.md](../docs/binary-reference.md) and [authority-deployment.md](../docs/authority-deployment.md).

## Finogeeks engineering (private source repo)

Regression, E2E, and release automation live in the **private** FinSAFE monorepo under `scripts/tests/`, `scripts/dev/`, and `scripts/prod/`. They are not published here.
