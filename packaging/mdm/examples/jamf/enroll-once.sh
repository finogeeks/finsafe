#!/bin/bash
# Jamf policy script: one-time FinSAFE enrollment.
# Parameter 4: ENROLL_TOKEN (one-time JWS from Policy Authority admin UI)
# Parameter 5: AUTHORITY_URL (optional override)
set -euo pipefail

if [[ -f /etc/finsafe/enrolled.json ]]; then
  echo "Already enrolled; skipping."
  exit 0
fi

ENROLL_TOKEN="${4:-}"
AUTH_URL="${5:-https://gov.example.com/policy-authority}"
if [[ -z "$ENROLL_TOKEN" ]]; then
  echo "ERROR: set Jamf parameter 4 to enrollment token" >&2
  exit 1
fi

DEVICE_ID="${JSSID:-$(ioreg -rd1 -c IOPlatformExpertDevice | awk -F\" '/IOPlatformUUID/ {print $4}')}"
PLIST=/Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist

if [[ ! -f "$PLIST" ]]; then
  echo "ERROR: install LaunchDaemon plist first" >&2
  exit 1
fi

/usr/libexec/PlistBuddy -c "Add :EnvironmentVariables:FINSAFE_AUTHORITY_URL string $AUTH_URL" "$PLIST" 2>/dev/null \
  || /usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:FINSAFE_AUTHORITY_URL $AUTH_URL" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :EnvironmentVariables:FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID string $DEVICE_ID" "$PLIST" 2>/dev/null \
  || /usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID $DEVICE_ID" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :EnvironmentVariables:FINSAFE_ENROLL_TOKEN string $ENROLL_TOKEN" "$PLIST" 2>/dev/null \
  || /usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:FINSAFE_ENROLL_TOKEN $ENROLL_TOKEN" "$PLIST"

launchctl kickstart -k system/com.finogeeks.finsafe-agent 2>/dev/null \
  || launchctl load "$PLIST"

sleep 8
if [[ ! -f /etc/finsafe/enrolled.json ]]; then
  echo "ERROR: enrollment did not create /etc/finsafe/enrolled.json" >&2
  exit 1
fi

echo "Enrollment OK: $(cat /etc/finsafe/enrolled.json)"
