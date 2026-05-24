# FinSAFE scripts (public repository)

Scripts in this directory ship with [finogeeks/finsafe](https://github.com/finogeeks/finsafe) for **enterprise administrators** operating Policy Authority and fleet endpoints.

| Script | Purpose |
|--------|---------|
| [`check-authority-health.sh`](check-authority-health.sh) | Verify authority `/health` and `/v1/license/status` (optional admin stats with `FINSAFE_ADMIN_TOKEN`) |
| [`../install.sh`](../install.sh) | Install personal `finsafe` CLI from GitHub Releases |
| [`../packaging/mdm/`](../packaging/mdm/) | MDM examples: enroll once, deploy sentinel, agent install |

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
