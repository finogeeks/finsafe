# Fleet deployment packaging

> Older operation references link to the pre-cleanup version; check them against your installed release.

Copy-paste artifacts for enterprise administrators deploying **managed mode**. Read the guides in [`../docs/`](../docs/) first ([中文索引](../docs/README-zh.md)).

| Path | Use |
|------|-----|
| [`systemd/finsafe-agent.service`](systemd/finsafe-agent.service) | Linux: enable `finsafe-agent` at boot |
| [`launchd/com.finogeeks.finsafe-agent.plist`](launchd/com.finogeeks.finsafe-agent.plist) | macOS: LaunchDaemon template |
| [`mdm/`](mdm/) | MDM example scripts (Jamf, Intune, generic, Ansible) |
| [`../scripts/`](../scripts/) | IT utilities (`check-authority-health.sh`) |

**Workflow:** [enterprise-deployment-runbook.md](https://github.com/finogeeks/finsafe/blob/bada9f48043eb09878c529d824190e5d7aa84d1f/docs/enterprise-deployment-runbook.md) · [中文](https://github.com/finogeeks/finsafe/blob/bada9f48043eb09878c529d824190e5d7aa84d1f/docs/enterprise-deployment-runbook-zh.md) · **Checklist:** [mdm/vendor-neutral-checklist.md](https://github.com/finogeeks/finsafe/blob/bada9f48043eb09878c529d824190e5d7aa84d1f/docs/mdm/vendor-neutral-checklist.md) · [中文](https://github.com/finogeeks/finsafe/blob/bada9f48043eb09878c529d824190e5d7aa84d1f/docs/mdm/vendor-neutral-checklist-zh.md)

## Binaries

Enterprise fleets use **GitHub Release** tarballs — not ad-hoc source builds on endpoints.

| Audience | Artifact | Install |
|----------|----------|---------|
| Personal / developer trial | `finsafe-v*` | [`install.sh`](../install.sh) or release tarball |
| Managed fleet | `finsafe-fleet-v*` | MDM/pkg to `/usr/local/bin` |
| Policy Authority | `finsafe-admin-server-v*` | systemd / LaunchDaemon |
| Bundle operator | `finsafe-bundlectl-v*` | IT workstation |

Do not build from source on production endpoints; use the release tarballs above.
