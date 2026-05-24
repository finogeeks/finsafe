# Fleet deployment packaging

Copy-paste artifacts for enterprise administrators deploying **managed mode**. Read the guides in [`../docs/`](../docs/) first ([中文索引](../docs/README-zh.md)).

| Path | Use |
|------|-----|
| [`systemd/finsafe-agent.service`](systemd/finsafe-agent.service) | Linux: enable `finsafe-agent` at boot |
| [`launchd/com.finogeeks.finsafe-agent.plist`](launchd/com.finogeeks.finsafe-agent.plist) | macOS: LaunchDaemon template |
| [`mdm/`](mdm/) | MDM example scripts (Jamf, Intune, generic, Ansible) |
| [`../scripts/`](../scripts/) | IT utilities (`check-authority-health.sh`) |

**Workflow:** [enterprise-deployment-runbook.md](../docs/enterprise-deployment-runbook.md) · [中文](../docs/enterprise-deployment-runbook-zh.md) · **Checklist:** [mdm/vendor-neutral-checklist.md](../docs/mdm/vendor-neutral-checklist.md) · [中文](../docs/mdm/vendor-neutral-checklist-zh.md)

## Binaries

Enterprise fleets use **GitHub Release** tarballs — not ad-hoc source builds on endpoints.

| Audience | Artifact | Install |
|----------|----------|---------|
| Personal / developer trial | `finsafe-v*` | [`install.sh`](../install.sh) or release tarball |
| Managed fleet | `finsafe-fleet-v*` | MDM/pkg to `/usr/local/bin` |
| Policy Authority | `finsafe-admin-server-v*` | systemd / LaunchDaemon |
| Bundle operator | `finsafe-bundlectl-v*` | IT workstation |

**Finogeeks engineers** building from the private source monorepo: `scripts/dev/build-finsafe-personal.sh` (public CLI) and `scripts/dev/build-finsafe-enterprise.sh` (`--features managed`).
