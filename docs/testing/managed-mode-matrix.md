# Managed mode acceptance matrix

Manual run book for managed-mode acceptance.

> **Audience:** Customer IT and security teams running a **managed-mode pilot**. Treat each row as a sign-off checklist. Setup: [finsafe-enterprise-setup skill](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-enterprise-setup/SKILL.md), [enterprise-deployment-runbook.md](../enterprise-deployment-runbook.md), [licensing-e2e-macos.md](./licensing-e2e-macos.md). Single-machine lab: [managed-lab.md](./managed-lab.md).

| # | Scenario | Expected | How to verify (pilot) |
|---|----------|----------|------------------------|
| 1 | Fresh enroll + pull | Agent writes `enrolled.json`, serves policy on UDS | Enroll script + `test -f /etc/finsafe/enrolled.json` |
| 2 | Managed `finsafe run -- true` | Exit 0, managed audit metadata when enrolled | `finsafe run --json -- /usr/bin/true` |
| 2b | Managed `finsafe self-confine` | Admin **Audit** shows `SandboxStarted` (`mode=self-confine` in reason); supervised paths also emit `RunCompleted` | Publish interactive wrapper, then `./scripts/managed-lab.sh interactive -- /bin/true` (or a short broker); refresh Audit after ~2s |
| 3 | `--policy` while enrolled | `MANAGED_POLICY_LOCAL_OVERRIDE` | Pass `--policy` on fleet binary |
| 4 | `--personal` with sentinel | `MANAGED_FORCED_BY_POLICY` | Manual |
| 5 | Kill switch active | New runs denied; in-flight notified | Admin UI kill switch |
| 6 | Bundle rotation | Higher version replaces cache | `bundlectl` publish higher version |
| 7 | Downgrade bundle | Rejected at verify | Publish lower version; agent should reject |
| 8 | Expired bundle + deny stale | Daemon unreachable / deny | Policy process per runbook |
| 9 | Daemon stopped | CLI cannot resolve policy | Stop agent; expect daemon error |
| 10 | Audit spool upload | Events in authority DB | Admin UI / DB inspection |
| 11 | Heartbeat tamper flag | Digest mismatch reported | Manual security review |
| 12 | Agent IPC challenge failure | Wrong peer on socket/pipe | Manual (Windows: named-pipe challenge) |
| 13 | Personal machine (no sentinel) | Legacy `--policy` unchanged | N/A — fleet uses sentinel |
| 14 | Clock rollback | Floor detects rollback | Manual |
| 15 | Sentinel removed | Personal path or daemon error | Remove sentinel; verify behavior |
| 16 | Cache tampering | Verify/pull failure | Manual |
| 17 | Wrong CLI build | Managed mode unavailable | Use **`finsafe-fleet-v*`** releases only (not personal `finsafe-v*`) |
| 18 | No commercial license | Admin/enroll return `402` + `LICENSE_MISSING` | curl admin/enroll without `license.jws` |
| 19 | Valid license | `GET /v1/license/status` valid/grace; admin + enroll `200` | [licensing-e2e-macos.md](./licensing-e2e-macos.md) |
| 20 | Seat limit | Nth+1 enroll returns `402` + `LICENSE_SEAT_LIMIT` | Enroll over `max_devices` |
| 21 | License + managed smoke (macOS) | Publish bundle, enroll, `finsafe run --json` exit 0 or `policy_source=managed` | [managed-mode-macos-runbook.md](./managed-mode-macos-runbook.md) or [managed-lab.md](./managed-lab.md) |
| 22 | HTTPS inspection (`mitm_tls_terminate`) | CA created; publish `tls_terminate: true`; pilot curl + `tls_terminated` in proxy audit | [https-inspection-runbook.md](../https-inspection-runbook.md) |

**macOS licensing guide:** [licensing-e2e-macos.md](./licensing-e2e-macos.md)

## Isolated state (lab)

[`scripts/managed-lab.sh`](../../scripts/managed-lab.sh) keeps sentinel, enrollment, agent socket, cache, and audit under **`~/.finsafe-lab`** (override with `FINSAFE_LAB_DIR`). You can also set **`FINSAFE_MANAGED_STATE_DIR`** on endpoints to redirect managed paths for a non-production tree.

## macOS

See [managed-mode-macos-runbook.md](./managed-mode-macos-runbook.md) and [packaging/launchd/](https://github.com/finogeeks/finsafe/tree/main/packaging/launchd/).

## Windows

Hosted `windows-acceptance` runs `cargo test --release` on Windows crates, builds `finsafe.exe`, `finsafe-agent.exe`, and `finsafe-winhelper.exe`, starts the agent in console mode with `FINSAFE_AGENT_CONSOLE=1`, verifies the named-pipe challenge over `\\.\pipe\finsafe-agent`, and runs AppContainer sandbox acceptance. Full Windows authority enrollment and managed policy smoke should be run on a Windows pilot host after installing the Service through Intune or GPO.

## Personal-mode wrapper smoke

On a machine **without** managed sentinel, confirm local wrapper policies with [USER-GUIDE.md](../USER-GUIDE.md) and examples under [`examples/wrapper-policies/`](../../examples/wrapper-policies/).
