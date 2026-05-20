# Managed mode — macOS manual runbook

Scriptable Linux checks live in [`scripts/managed-mode/`](../../../../scripts/managed-mode/). On macOS, run these steps before production rollout (maps to [managed-mode-matrix.md](./managed-mode-matrix.md)).

For **commercial license gates** and a one-command smoke path (`e2e-licensing-macos.sh`), see [licensing-e2e-macos.md](./licensing-e2e-macos.md).

## Prerequisites

- Enterprise build: `./scripts/build-finsafe-enterprise.sh` (enables `managed` feature).
- Jamf or manual install: binaries in `/usr/local/bin`, LaunchDaemon from [`packaging/launchd/`](../../packaging/launchd/).
- Policy Authority reachable from the Mac (VPN or split tunnel).

## 1. Install and start agent

```bash
sudo install -d -m 755 /etc/finsafe /var/lib/finsafe
# Deploy signed sentinel (see finsafe-bundlectl sentinel sign)
sudo cp managed-required.jws /etc/finsafe/managed-required.json
sudo cp packaging/launchd/com.finogeeks.finsafe-agent.plist /Library/LaunchDaemons/
sudo launchctl bootstrap system /Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist
```

## 2. Enroll once

```bash
export FINSAFE_ENROLL_TOKEN="<one-time-token>"
export FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID="$(system_profiler SPHardwareDataType | awk '/UUID/ {print $3}')"
sudo -E packaging/mdm/examples/jamf/enroll-once.sh
test -f /etc/finsafe/enrolled.json && echo enrolled-ok
```

## 3. Managed run (audit JSON)

```bash
finsafe run --json -- /usr/bin/true | jq '.envelope.policy_source // .exit_code'
```

Expect managed metadata when enrolled and sentinel present.

## 4. Tamper spot-checks (manual)

| Check | Command | Expected |
|-------|---------|----------|
| `--personal` under sentinel | `finsafe run --personal -- /usr/bin/true` | `MANAGED_FORCED_BY_POLICY` |
| Local `--policy` override | `finsafe run --policy /tmp/x.yaml -- /usr/bin/true` | `MANAGED_POLICY_LOCAL_OVERRIDE` |
| Agent stopped | `sudo launchctl bootout system/com.finogeeks.finsafe-agent` then run | `MANAGED_DAEMON_UNREACHABLE` |
| Personal developer path | Remove sentinel + enrollment; `finsafe run --personal --policy <wrapper.yaml> --json -- …` | Legacy/wrapper JSON unchanged |

## 5. Personal mode unchanged (wrapper)

```bash
# No /etc/finsafe/managed-required.json and no enrolled.json
finsafe --policy docs/public-finsafe/examples/wrapper-policies/hermes-version-smoke.yaml run --json -- /usr/bin/true
```

Confirm `envelope` fields match pre-managed expectations (`wrapper_policy_digest`, `selected_backend`, no `policy_source: managed`).

## 6. Rollback

1. Remove sentinel profile.
2. `sudo launchctl bootout system /Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist`
3. Remove `/etc/finsafe` and `/var/lib/finsafe` if decommissioning.

See [enterprise-deployment-runbook.md](../enterprise-deployment-runbook.md) for fleet-wide rollback.
