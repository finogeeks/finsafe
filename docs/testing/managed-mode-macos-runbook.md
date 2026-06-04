# Managed mode — macOS manual runbook

**中文：** [managed-mode-macos-runbook-zh.md](./managed-mode-macos-runbook-zh.md) (index) · [managed-mode-matrix-zh.md](./managed-mode-matrix-zh.md) · [enterprise-deployment-runbook-zh.md](../enterprise-deployment-runbook-zh.md).

> **Audience:** Customer IT pilots validating macOS fleet rollout. Manual steps below map to [managed-mode-matrix.md](./managed-mode-matrix.md). For a single-machine lab on release binaries, see [managed-lab.md](./managed-lab.md).

For **commercial license gates**, see [licensing-e2e-macos.md — customer pilot](./licensing-e2e-macos.md#customer-pilot-verification). Full setup chain: [finsafe-enterprise-setup skill](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-enterprise-setup/SKILL.md).

## Prerequisites

- **Managed binaries** from [GitHub Releases](https://github.com/finogeeks/finsafe/releases): unpack `finsafe-fleet-v<version>-<target>.tar.zst` and install `finsafe` + `finsafe-agent` to `/usr/local/bin` (do **not** use personal-mode `install.sh` alone for fleet enforcement).
- Jamf or manual install: LaunchDaemon from [packaging/launchd/](https://github.com/finogeeks/finsafe/tree/main/packaging/launchd/).
- Policy Authority reachable from the Mac (VPN or split tunnel), with **Finogeeks-issued** `license.jws` installed — [authority-deployment.md](../authority-deployment.md).

## 1. Install and start agent

```bash
sudo install -d -m 755 /etc/finsafe /var/lib/finsafe
# Deploy signed sentinel (see finsafe-bundlectl sentinel sign)
sudo cp managed-required.jws /etc/finsafe/managed-required.json
# Copy plist from your packaging checkout or:
# curl -fsSL -o /tmp/com.finogeeks.finsafe-agent.plist \
#   https://raw.githubusercontent.com/finogeeks/finsafe/main/packaging/launchd/com.finogeeks.finsafe-agent.plist
sudo cp /path/to/com.finogeeks.finsafe-agent.plist /Library/LaunchDaemons/
sudo launchctl bootstrap system /Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist
```

## 2. Enroll once

```bash
export FINSAFE_ENROLL_TOKEN="<one-time-token>"
export FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID="$(system_profiler SPHardwareDataType | awk '/UUID/ {print $3}')"
# Download enroll script from public repo if needed:
# curl -fsSL -o /tmp/enroll-once.sh \
#   https://raw.githubusercontent.com/finogeeks/finsafe/main/packaging/mdm/examples/jamf/enroll-once.sh
sudo -E /path/to/enroll-once.sh
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
