# Fleet deployment packaging

Copy-paste artifacts for enterprise administrators deploying **managed mode**. Read the guides in [`../docs/`](../docs/) first ([中文索引](../docs/README-zh.md)).

| Path | Use |
|------|-----|
| [`systemd/finsafe-agent.service`](systemd/finsafe-agent.service) | Linux: enable `finsafe-agent` at boot |
| [`launchd/com.finogeeks.finsafe-agent.plist`](launchd/com.finogeeks.finsafe-agent.plist) | macOS: LaunchDaemon template |
| [`mdm/`](mdm/) | MDM example scripts (Jamf, Intune, generic, Ansible) |

**Workflow:** [enterprise-deployment-runbook.md](../docs/enterprise-deployment-runbook.md) · [中文](../docs/enterprise-deployment-runbook-zh.md) · **Checklist:** [mdm/vendor-neutral-checklist.md](../docs/mdm/vendor-neutral-checklist.md) · [中文](../docs/mdm/vendor-neutral-checklist-zh.md)

## Building binaries

| Audience | Script | Cargo flags |
|----------|--------|-------------|
| Public curl/install, developers | [`../../scripts/build-finsafe-personal.sh`](../../scripts/build-finsafe-personal.sh) | `--no-default-features` (default in `finsafe-cli/Cargo.toml`) |
| Fleet / MDM packages | [`../../scripts/build-finsafe-enterprise.sh`](../../scripts/build-finsafe-enterprise.sh) | `--features managed` |
