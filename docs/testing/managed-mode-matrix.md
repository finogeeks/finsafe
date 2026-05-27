# Managed mode acceptance matrix

Manual run book for managed-mode acceptance.

> **Audience**
>
> | You are | How to use this matrix |
> |---------|------------------------|
> | **Customer IT / pilot** | Treat rows as a **checklist** during pilot sign-off. Follow [finsafe-enterprise-setup skill](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-enterprise-setup/SKILL.md), [enterprise-deployment-runbook.md](../enterprise-deployment-runbook.md), and [licensing-e2e-macos.md](./licensing-e2e-macos.md#customer-pilot-verification). |
> | **Finogeeks engineering** | Use the **Automation** column in the **private FinSAFE source repository** (`scripts/tests/managed-mode/*`, `cargo test`). |

| # | Scenario | Expected | Automation (Finogeeks private repo) | Customer pilot |
|---|----------|----------|--------------------------------------|----------------|
| 1 | Fresh enroll + pull | Agent writes `enrolled.json`, serves policy on UDS | `scripts/tests/managed-mode/run-suite.sh enroll` | Enroll once script + `test -f /etc/finsafe/enrolled.json` |
| 2 | Managed `finsafe run -- true` | Exit 0, managed audit metadata when enrolled | `run-suite.sh run` | `finsafe run --json -- /usr/bin/true` |
| 3 | `--policy` while enrolled | `MANAGED_POLICY_LOCAL_OVERRIDE` | `tamper-suite.sh local-policy` | Manual: pass `--policy` on fleet binary |
| 4 | `--personal` with sentinel | `MANAGED_FORCED_BY_POLICY` | `tamper-suite.sh personal-flag` | Manual |
| 5 | Kill switch active | New runs denied; in-flight notified | manual (authority admin) | Admin UI kill switch |
| 6 | Bundle rotation | Higher version replaces cache | `run-suite.sh rotate` | `bundlectl` publish higher version |
| 7 | Downgrade bundle | Rejected at verify | `cargo test -p finsafe-bundle` | N/A (engineering) |
| 8 | Expired bundle + deny stale | Daemon unreachable / deny | manual | Policy process per runbook |
| 9 | Daemon stopped | CLI cannot resolve policy | `tamper-suite.sh daemon-kill` | Stop agent; expect daemon error |
| 10 | Audit spool upload | Events in authority DB | `run-suite.sh audit` | Admin UI / DB inspection |
| 11 | Heartbeat tamper flag | Digest mismatch reported | `tamper-suite.sh binary-swap` | Manual security review |
| 12 | Agent IPC challenge failure | Wrong peer on socket/pipe | `tamper-suite.sh uds-stub`; Windows hosted CI named-pipe challenge smoke | N/A (engineering) |
| 13 | Personal machine (no sentinel) | Legacy `--policy` unchanged | `run-suite.sh personal` | N/A — fleet uses sentinel |
| 14 | Clock rollback | Floor detects rollback | `tamper-suite.sh clock-rollback` | Manual |
| 15 | Sentinel removed | Personal path or daemon error | `tamper-suite.sh sentinel-removal` | Remove sentinel; verify behavior |
| 16 | Cache tampering | Verify/pull failure | `tamper-suite.sh cache-tamper` | Manual |
| 17 | Private `cargo install` | No managed symbols in binary | `tamper-suite.sh no-managed-feature` | Use **`finsafe-fleet-v*`** releases only |
| 18 | No commercial license | Admin/enroll return `402` + `LICENSE_MISSING` | `license-suite.sh missing` | curl admin/enroll without `license.jws` |
| 19 | Valid license | `GET /v1/license/status` valid/grace; admin + enroll `200` | `license-suite.sh licensed` | [licensing-e2e customer section](./licensing-e2e-macos.md#customer-pilot-verification) |
| 20 | Seat limit | Nth+1 enroll returns `402` + `LICENSE_SEAT_LIMIT` | `license-suite.sh seat-limit` | Enroll over `max_devices` |
| 21 | License + managed smoke (macOS) | Publish bundle, enroll, `finsafe run --json` exit 0 or `policy_source=managed` | `e2e-licensing-macos.sh` | [managed-mode-macos-runbook.md](./managed-mode-macos-runbook.md) |

**macOS licensing guide:** [licensing-e2e-macos.md](./licensing-e2e-macos.md)

## Harness (Finogeeks engineering — Linux scripts)

Scripts use an isolated tree when `FINSAFE_MANAGED_STATE_DIR` is set (default: temp dir):

- `managed-required.json`, `enrolled.json`, `agent.sock`, `cache/`, `audit/`

Build targets (private monorepo only):

- **Public / developer:** `scripts/dev/build-finsafe-personal.sh` → `cargo build --no-default-features`
- **Enterprise fleet:** `scripts/dev/build-finsafe-enterprise.sh` → `cargo build --features managed`

```bash
./scripts/dev/build-finsafe-enterprise.sh
./scripts/tests/managed-mode/tamper-suite.sh all
./scripts/tests/managed-mode/run-suite.sh all   # needs authority on :8090 for enroll
```

## macOS

See [managed-mode-macos-runbook.md](./managed-mode-macos-runbook.md) and [packaging/launchd/](https://github.com/finogeeks/finsafe/tree/main/packaging/launchd/).

## Windows

Hosted `windows-acceptance` runs `cargo test --release` on Windows crates, builds `finsafe.exe`, `finsafe-agent.exe`, and `finsafe-winhelper.exe`, starts the agent in console mode with `FINSAFE_AGENT_CONSOLE=1`, verifies the named-pipe challenge over `\\.\pipe\finsafe-agent`, and runs AppContainer sandbox acceptance. Full Windows authority enrollment and managed policy smoke should be run on a Windows pilot host after installing the Service through Intune or GPO.

## Stage 1 wrapper smoke (personal)

Confirms local wrapper contract on Linux (engineering):

```bash
./scripts/tests/verify-local-program-wrapper-smoke.sh
```

Customer personal-mode smoke: [USER-GUIDE.md](../USER-GUIDE.md).
