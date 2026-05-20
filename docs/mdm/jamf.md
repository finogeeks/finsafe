# Jamf Pro — FinSAFE managed mode

**中文：** [jamf-zh.md](./jamf-zh.md)

Deploy `finsafe`, `finsafe-agent`, the managed-required sentinel, and one-time enrollment on macOS.

**Prerequisites:** [enterprise runbook](../enterprise-deployment-runbook.md) Phase A complete (authority + signed sentinel JWS).

---

## 1. Package binaries

### Option A — PKG from release pipeline

1. Build universal or arch-specific PKG installing to `/usr/local/bin/`.
2. Upload to Jamf **Computers → Packages**.
3. Add to a policy or **Configuration Profile** payload (if using installer-type profile).

### Option B — Jamf App Store / custom binary payload

Not recommended for production; fixed paths matter for digest attestation.

**Post-install script** (sanity check):

```bash
/usr/local/bin/finsafe --version
/usr/local/bin/finsafe-agent --help 2>/dev/null || true
```

---

## 2. LaunchDaemon (finsafe-agent)

Use the template [`packaging/launchd/com.finogeeks.finsafe-agent.plist`](../../packaging/launchd/com.finogeeks.finsafe-agent.plist).

### Jamf **Configuration Profile** (Custom Settings) or **Policy Files and Processes**

1. Deploy plist to `/Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist`.
2. Set `EnvironmentVariables`:

   | Key | Value |
   |-----|--------|
   | `FINSAFE_AUTHORITY_URL` | `https://gov.example.com/policy-authority` |

3. **Extension Attribute** or policy script after deploy:

```bash
launchctl bootstrap system /Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist 2>/dev/null \
  || launchctl load /Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist
```

For enrollment bootstrap only, add (see §4):

- `FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID` → use Jamf variable `$JSSID` / `$COMPUTERNAME` / serial
- `FINSAFE_ENROLL_TOKEN` → from secure parameter (remove after enroll)

---

## 3. Managed-required sentinel (Configuration Profile)

Jamf **Configuration Profile → Files** (or **Payloads → File Distribution**):

| Setting | Value |
|---------|--------|
| Path | `/etc/finsafe/managed-required.json` |
| Source | Signed JWS from `finsafe-bundlectl sentinel sign` |
| Permissions | `root:wheel`, `0644` |

Create `/etc/finsafe` if missing (preinstall script):

```bash
mkdir -p /etc/finsafe /var/lib/finsafe
chown root:wheel /etc/finsafe /var/lib/finsafe
chmod 755 /etc/finsafe /var/lib/finsafe
```

**Scope:** production Smart Group (all managed Macs with agent apps).

**Verify (Jamf policy log or recon script):**

```bash
test -f /etc/finsafe/managed-required.json && profiles show | grep -i finsafe
```

---

## 4. One-time enrollment

### 4.1 Issue token (IT)

From authority admin UI or:

```bash
curl -s -X POST "https://gov.example.com/policy-authority/v1/enroll/token"
```

Store token in **Jamf **Parameter** (encrypted) or **Vault** — not in plain Git.

### 4.2 Enrollment Configuration Profile (pilot)

Duplicate LaunchDaemon plist payload with extra env vars:

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>FINSAFE_AUTHORITY_URL</key>
  <string>https://gov.example.com/policy-authority</string>
  <key>FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID</key>
  <string>$JSSID</string>
  <key>FINSAFE_ENROLL_TOKEN</key>
  <string>REPLACE_WITH_ONE_TIME_TOKEN</string>
</dict>
```

Jamf does not expand `$JSSID` inside plist literals automatically — use **Policy Script** to write plist or use **Extension Attribute** + script:

```bash
#!/bin/bash
# Jamf policy: FinSAFE enroll (run once per machine)
set -euo pipefail
DEVICE_ID="${JSSID:-$(system_profiler SPHardwareDataType | awk '/UUID/ {print $3}')}"
TOKEN='%%ENROLL_TOKEN%%'  # Jamf parameter 4

PLIST=/Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist
/usr/libexec/PlistBuddy -c "Add :EnvironmentVariables:FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID string $DEVICE_ID" "$PLIST" 2>/dev/null \
  || /usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID $DEVICE_ID" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :EnvironmentVariables:FINSAFE_ENROLL_TOKEN string $TOKEN" "$PLIST" 2>/dev/null \
  || /usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:FINSAFE_ENROLL_TOKEN $TOKEN" "$PLIST"

launchctl kickstart -k system/com.finogeeks.finsafe-agent
sleep 5
test -f /etc/finsafe/enrolled.json
```

### 4.3 Post-enrollment cleanup policy

When `/etc/finsafe/enrolled.json` exists:

```bash
/usr/libexec/PlistBuddy -c "Delete :EnvironmentVariables:FINSAFE_ENROLL_TOKEN" \
  /Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist 2>/dev/null || true
launchctl kickstart -k system/com.finogeeks.finsafe-agent
```

Remove enrollment policy from scope or mark machine complete in Jamf group.

---

## 5. Smart Groups (recommended)

| Group | Criteria |
|-------|----------|
| FinSAFE — Not enrolled | Extension Attribute `enrolled.json` missing |
| FinSAFE — Managed active | File exists `/etc/finsafe/enrolled.json` AND daemon running |
| FinSAFE — Pilot | Static subset for bundle canary |

**Extension Attribute example** (script):

```bash
#!/bin/bash
if [[ -f /etc/finsafe/enrolled.json ]]; then echo "<result>enrolled</result>"
else echo "<result>pending</result>"; fi
```

---

## 6. User-facing app configuration

Point FinClaw / internal launchers at:

```bash
/usr/local/bin/finsafe run -- /path/to/agent-binary "$@"
```

Jamf **Restriction** profiles do not replace sentinel enforcement; they only block other launch paths if you add separate controls.

---

## 7. Troubleshooting

| Symptom | Check |
|---------|--------|
| `MANAGED_DAEMON_UNREACHABLE` | `launchctl print system/com.finogeeks.finsafe-agent`; socket `/run/finsafe-agent.sock` |
| `MANAGED_FORCED_BY_POLICY` | Expected when testing `--personal` |
| Enroll loop | Token expired; clock skew; authority URL wrong |
| No bundle | Agent logs; `curl authority/v1/bundles/current` from Mac |

Logs: `log show --predicate 'process == "finsafe-agent"' --last 1h`

---

## Example payloads

See [`packaging/mdm/examples/jamf/`](../../packaging/mdm/examples/jamf/).
