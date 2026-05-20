# Managed mode acceptance matrix

Manual run book for managed-mode acceptance (plan §14).

| # | Scenario | Expected | Automation |
|---|----------|----------|------------|
| 1 | Fresh enroll + pull | Agent writes `enrolled.json`, serves policy on UDS | `scripts/managed-mode/run-suite.sh enroll` |
| 2 | Managed `finsafe run -- true` | Exit 0, managed audit metadata when enrolled | `run-suite.sh run` |
| 3 | `--policy` while enrolled | `MANAGED_POLICY_LOCAL_OVERRIDE` | `tamper-suite.sh local-policy` |
| 4 | `--personal` with sentinel | `MANAGED_FORCED_BY_POLICY` | `tamper-suite.sh personal-flag` |
| 5 | Kill switch active | New runs denied; in-flight notified | manual (authority admin) |
| 6 | Bundle rotation | Higher version replaces cache | `run-suite.sh rotate` (stub + bundlectl) |
| 7 | Downgrade bundle | Rejected at verify | `cargo test -p finsafe-bundle` |
| 8 | Expired bundle + deny stale | Daemon unreachable / deny | manual |
| 9 | Daemon stopped | CLI cannot resolve policy | `tamper-suite.sh daemon-kill` |
| 10 | Audit spool upload | Events in authority DB | `run-suite.sh audit` |
| 11 | Heartbeat tamper flag | Digest mismatch reported | `tamper-suite.sh binary-swap` |
| 12 | UDS challenge failure | Wrong peer on socket | `tamper-suite.sh uds-stub` |
| 13 | Personal machine (no sentinel) | Legacy `--policy` unchanged | `run-suite.sh personal` + `personal_run_golden` (Linux) |
| 14 | Clock rollback | Floor detects rollback | `tamper-suite.sh clock-rollback` |
| 15 | Sentinel removed | Personal path or daemon error | `tamper-suite.sh sentinel-removal` |
| 16 | Cache tampering | Verify/pull failure | `tamper-suite.sh cache-tamper` |
| 17 | Private `cargo install` | No managed symbols in binary | `tamper-suite.sh no-managed-feature` |
| 18 | No commercial license | Admin/enroll return `402` + `LICENSE_MISSING` | `license-suite.sh missing` |
| 19 | Valid license | `GET /v1/license/status` valid/grace; admin + enroll `200` | `license-suite.sh licensed` |
| 20 | Seat limit | Nth+1 enroll returns `402` + `LICENSE_SEAT_LIMIT` | `license-suite.sh seat-limit` |
| 21 | License + managed smoke (macOS) | Publish bundle, enroll, `finsafe run --json` exit 0 or `policy_source=managed` | `e2e-licensing-macos.sh` |

**macOS licensing guide:** [licensing-e2e-macos.md](./licensing-e2e-macos.md)

## Harness (Linux scripts)

Scripts use an isolated tree when `FINSAFE_MANAGED_STATE_DIR` is set (default: temp dir):

- `managed-required.json`, `enrolled.json`, `agent.sock`, `cache/`, `audit/`

Build targets:

- **Public / developer:** `./scripts/build-finsafe-personal.sh` → `cargo build --no-default-features`
- **Enterprise fleet:** `./scripts/build-finsafe-enterprise.sh` → `cargo build --features managed`

Run all scriptable checks:

```bash
./scripts/build-finsafe-enterprise.sh
./scripts/managed-mode/tamper-suite.sh all
./scripts/managed-mode/run-suite.sh all   # needs authority on :8090 for enroll
```

## macOS

See [managed-mode-macos-runbook.md](./managed-mode-macos-runbook.md) and [`packaging/launchd/`](../../packaging/launchd/).

## Stage 1 wrapper smoke (personal)

Confirms `docs/operations/local-program-wrapper.md` contract on Linux:

```bash
./scripts/verify-local-program-wrapper-smoke.sh
```
