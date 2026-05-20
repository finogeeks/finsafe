# Microsoft Intune — FinSAFE managed mode

**中文：** [intune-zh.md](./intune-zh.md)

Deploy FinSAFE on **macOS** and **Linux** managed devices with Intune (Endpoint Manager).

**Prerequisites:** [enterprise runbook](../enterprise-deployment-runbook.md) Phase A (authority + signed sentinel).

---

## 1. macOS deployment overview

| Step | Intune item |
|------|-------------|
| Install binaries | macOS app (PKG/DMG) or shell script package |
| Agent daemon | Custom configuration profile (plist) or script + LaunchDaemon |
| Sentinel | Custom configuration profile (file payload) |
| Enrollment | Script policy with one-time token (pilot), then remove |

---

## 2. macOS — Install `finsafe` and `finsafe-agent`

### 2.1 Line-of-business app (PKG)

1. **Devices → macOS → Apps → Add** → Line-of-business app.
2. Upload signed PKG that installs to `/usr/local/bin/`.
3. Assign to device group (required install).

### 2.2 Post-install detection rule

```bash
test -x /usr/local/bin/finsafe && test -x /usr/local/bin/finsafe-agent
```

---

## 3. macOS — LaunchDaemon profile

Create **Devices → macOS → Configuration profiles → Create profile → Templates → Custom**.

Upload plist based on [`packaging/launchd/com.finogeeks.finsafe-agent.plist`](../../packaging/launchd/com.finogeeks.finsafe-agent.plist).

**OMA-URI alternative** (if using Settings Catalog custom keys): deploy via shell script (below) — plist delivery is simpler as **Custom profile** with `com.finogeeks.finsafe-agent` payload type `com.apple.ManagedClient.preferences` or file deployment through script.

**Recommended:** **Device shell script** (macOS) assigned to same group:

```bash
#!/bin/bash
set -euo pipefail
AUTH_URL="https://gov.example.com/policy-authority"
PLIST_DST="/Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist"

mkdir -p /etc/finsafe /var/lib/finsafe
chmod 755 /etc/finsafe /var/lib/finsafe

cat > "$PLIST_DST" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.finogeeks.finsafe-agent</string>
  <key>ProgramArguments</key><array><string>/usr/local/bin/finsafe-agent</string></array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>EnvironmentVariables</key><dict>
    <key>FINSAFE_AUTHORITY_URL</key><string>AUTH_URL_PLACEHOLDER</string>
  </dict>
</dict></plist>
PLIST
sed -i '' "s|AUTH_URL_PLACEHOLDER|$AUTH_URL|g" "$PLIST_DST"
chmod 644 "$PLIST_DST"
chown root:wheel "$PLIST_DST"
launchctl bootstrap system "$PLIST_DST" 2>/dev/null || launchctl load "$PLIST_DST"
```

Run as **root**, system context.

---

## 4. macOS — Managed-required sentinel

**Option A — Script deploy**

```bash
#!/bin/bash
set -euo pipefail
# Paste signed JWS into SENTINEL_JWS variable from secure Intune variable / Azure Key Vault reference
SENTINEL_JWS='%%SENTINEL_JWS%%'
install -d -m 755 /etc/finsafe
printf '%s\n' "$SENTINEL_JWS" > /etc/finsafe/managed-required.json
chmod 644 /etc/finsafe/managed-required.json
chown root:wheel /etc/finsafe/managed-required.json
```

Store `SENTINEL_JWS` as a **secret script variable** in Intune (do not commit to Git).

**Option B — Custom profile file payload**

If your tenant supports delivering a single file to `/etc/finsafe/managed-required.json`, attach the JWS file from `finsafe-bundlectl sentinel sign`.

---

## 5. macOS — One-time enrollment script

Create script policy **FinSAFE Enroll** (pilot group only):

```bash
#!/bin/bash
set -euo pipefail
[[ -f /etc/finsafe/enrolled.json ]] && exit 0

DEVICE_ID="${DEVICE_SERIAL_NUMBER:-$(ioreg -rd1 -c IOPlatformExpertDevice | awk -F\" '/IOPlatformUUID/ {print $4}')}"
ENROLL_TOKEN='%%ENROLL_TOKEN%%'
AUTH_URL="https://gov.example.com/policy-authority"
PLIST="/Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist"

/usr/libexec/PlistBuddy -c "Add :EnvironmentVariables:FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID string $DEVICE_ID" "$PLIST" 2>/dev/null \
  || /usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID $DEVICE_ID" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :EnvironmentVariables:FINSAFE_ENROLL_TOKEN string $ENROLL_TOKEN" "$PLIST" 2>/dev/null \
  || /usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:FINSAFE_ENROLL_TOKEN $ENROLL_TOKEN" "$PLIST"
/usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:FINSAFE_AUTHORITY_URL $AUTH_URL" "$PLIST" 2>/dev/null || true

launchctl kickstart -k system/com.finogeeks.finsafe-agent || launchctl load "$PLIST"
sleep 8
test -f /etc/finsafe/enrolled.json
```

- `ENROLL_TOKEN`: Intune secret variable, rotated per wave.
- After success, **retire** this script assignment or use requirement rule: only if `enrolled.json` missing.

**Cleanup script** (optional): remove `FINSAFE_ENROLL_TOKEN` from plist after enroll (same as Jamf §4.3).

---

## 6. Linux deployment (Intune)

Intune supports **Linux** custom scripts (distro-dependent).

### 6.1 Install packages

Use your distro package (deb/rpm) or script:

```bash
#!/bin/bash
set -euo pipefail
install -m 0755 finsafe /usr/local/bin/finsafe
install -m 0755 finsafe-agent /usr/local/bin/finsafe-agent
```

### 6.2 systemd unit

Deploy [`packaging/systemd/finsafe-agent.service`](../../packaging/systemd/finsafe-agent.service):

```bash
#!/bin/bash
set -euo pipefail
AUTH_URL="https://gov.example.com/policy-authority"
install -m 0644 finsafe-agent.service /etc/systemd/system/finsafe-agent.service
mkdir -p /etc/finsafe /var/lib/finsafe
systemctl daemon-reload
systemctl enable --now finsafe-agent.service
```

Override authority URL:

```bash
mkdir -p /etc/systemd/system/finsafe-agent.service.d
cat > /etc/systemd/system/finsafe-agent.service.d/authority.conf <<EOF
[Service]
Environment=FINSAFE_AUTHORITY_URL=$AUTH_URL
EOF
systemctl daemon-reload
systemctl restart finsafe-agent
```

### 6.3 Sentinel + enroll

Same file paths as macOS:

- `/etc/finsafe/managed-required.json`
- One-time `FINSAFE_ENROLL_TOKEN` + `FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID` in systemd drop-in

```bash
# /etc/systemd/system/finsafe-agent.service.d/enroll.conf  (remove after enroll)
[Service]
Environment=FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID=HOSTNAME_OR_INTUNE_DEVICE_ID
Environment=FINSAFE_ENROLL_TOKEN=one-time-token
```

---

## 7. Compliance policies (optional)

| Compliance rule | Detection |
|-----------------|-----------|
| FinSAFE agent running | Custom script: `test -S /run/finsafe-agent.sock` |
| Sentinel present | `test -f /etc/finsafe/managed-required.json` |
| Enrolled | `test -f /etc/finsafe/enrolled.json` |

Mark non-compliant → remediate with script re-run (not a substitute for sentinel enforcement).

---

## 8. Verification

On device (Company Portal support session or local admin):

```bash
/usr/local/bin/finsafe run --json -- /usr/bin/true 2>&1 | head
ls -la /etc/finsafe/ /run/finsafe-agent.sock
```

Intune **Device diagnostics** → script output.

---

## 9. Example payloads

See [`packaging/mdm/examples/intune/`](../../packaging/mdm/examples/intune/).
