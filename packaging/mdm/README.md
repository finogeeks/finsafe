# MDM deployment (managed mode)

Ship FinSAFE to fleet machines and enforce managed mode via MDM or config management.

## Documentation

**中文文档索引：** [docs/README-zh.md](../docs/README-zh.md) · **Deployment options:** [endpoint-deployment-options.md](../docs/endpoint-deployment-options.md)

| Document | Description |
|----------|-------------|
| [Endpoint deployment options](../docs/endpoint-deployment-options.md) · [中文](../docs/endpoint-deployment-options-zh.md) | **Choose your path** — Jamf, Intune, Ansible, image, SSH, or central-only |
| [Vendor-neutral checklist](../docs/mdm/vendor-neutral-checklist.md) · [中文](../docs/mdm/vendor-neutral-checklist-zh.md) | **No Jamf/Intune** — map any MDM or config tool to FinSAFE steps |
| [Enterprise deployment runbook](../docs/enterprise-deployment-runbook.md) · [中文](../docs/enterprise-deployment-runbook-zh.md) | End-to-end IT runbook (phases A–E, rollback, checklist) |
| [Managed mode reference](../docs/managed-mode.md) · [中文](../docs/managed-mode-zh.md) | Architecture, paths, CLI errors |
| [Jamf playbook](../docs/mdm/jamf.md) · [中文](../docs/mdm/jamf-zh.md) | macOS + Jamf Pro |
| [Intune playbook](../docs/mdm/intune.md) · [中文](../docs/mdm/intune-zh.md) | macOS + Linux + Windows + Intune |
| [Ansible playbook](../docs/mdm/ansible.md) · [中文](../docs/mdm/ansible-zh.md) | Linux without MDM |

## Artifacts on each machine

| Artifact | Path |
|----------|------|
| `finsafe` CLI | `/usr/local/bin/finsafe` |
| `finsafe-agent` | `/usr/local/bin/finsafe-agent` |
| Managed-required sentinel (JWS) | `/etc/finsafe/managed-required.json` |
| Enrollment record | `/etc/finsafe/enrolled.json` (after enroll) |
| Agent socket | `/run/finsafe-agent.sock` |

Windows equivalents: `C:\Program Files\FinSAFE\{finsafe.exe,finsafe-agent.exe,finsafe-winhelper.exe}`, `C:\ProgramData\FinSAFE\managed-required.json`, `C:\ProgramData\FinSAFE\enrolled.json`, and named pipe `\\.\pipe\finsafe-agent`.

## Service units

- Linux: [`systemd/finsafe-agent.service`](../systemd/finsafe-agent.service)
- macOS: [`launchd/com.finogeeks.finsafe-agent.plist`](../launchd/com.finogeeks.finsafe-agent.plist)
- Windows: Service name `finsafe-agent`; see [`examples/intune/windows-install-agent-service.ps1`](examples/intune/windows-install-agent-service.ps1) and [`examples/gpo/windows-install-agent-service.ps1`](examples/gpo/windows-install-agent-service.ps1)

## Example scripts (copy into MDM)

| Platform | Scripts |
|----------|---------|
| **Generic** | [`examples/generic/`](examples/generic/) — enroll, sentinel, remove token, [`install-fleet-unix.sh`](examples/generic/install-fleet-unix.sh) (used by IT pilot installer) |
| Jamf | [`examples/jamf/`](examples/jamf/) — enroll, remove token, extension attribute |
| Intune | [`examples/intune/`](examples/intune/) — plist, sentinel, enroll, Linux systemd, Windows Service |
| GPO | [`examples/gpo/`](examples/gpo/) — Windows startup-script wrapper |
| **IT pilot** (download + install) | Linux/macOS: [`../../install-fleet.sh`](../../install-fleet.sh) · Windows: [`../../install-fleet-windows.ps1`](../../install-fleet-windows.ps1) |
| Ansible | [`examples/ansible/deploy-finsafe.yml`](examples/ansible/deploy-finsafe.yml) |

## Operator workflow (summary)

1. Run Policy Authority; publish bundle with `finsafe-bundlectl`.
2. Sign sentinel: `finsafe-bundlectl sentinel sign --out managed-required.jws`.
3. MDM: install binaries + sentinel + agent service.
4. Issue one-time enroll token; MDM injects `FINSAFE_ENROLL_TOKEN` + device id; remove token after `/etc/finsafe/enrolled.json` or `C:\ProgramData\FinSAFE\enrolled.json` exists.
5. Apps invoke `finsafe run -- <program>` (no local `--policy`).

## Binary digest attestation

Heartbeats include SHA-256 of binaries at `/usr/local/bin/finsafe` and `finsafe-agent` on Linux/macOS, or `C:\Program Files\FinSAFE\finsafe.exe` and `finsafe-agent.exe` on Windows. Pin expected digests in sentinel `expected_binary_digests` when signing (extend `finsafe-bundlectl` workflow as needed).
