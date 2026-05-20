#!/bin/bash
# Intune macOS device script — one-time enrollment.
# Arguments: $1 = ENROLL_TOKEN, $2 = optional AUTHORITY_URL
set -euo pipefail
[[ -f /etc/finsafe/enrolled.json ]] && exit 0

ENROLL_TOKEN="${1:-}"
AUTH_URL="${2:-https://gov.example.com/policy-authority}"
[[ -n "$ENROLL_TOKEN" ]] || { echo "missing enroll token" >&2; exit 1; }

DEVICE_ID="$(ioreg -rd1 -c IOPlatformExpertDevice | awk -F\" '/IOPlatformUUID/ {print $4}')"
PLIST="/Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist"
[[ -f "$PLIST" ]] || { echo "missing LaunchDaemon plist" >&2; exit 1; }

/usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:FINSAFE_AUTHORITY_URL $AUTH_URL" "$PLIST" 2>/dev/null \
  || /usr/libexec/PlistBuddy -c "Add :EnvironmentVariables:FINSAFE_AUTHORITY_URL string $AUTH_URL" "$PLIST"
/usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID $DEVICE_ID" "$PLIST" 2>/dev/null \
  || /usr/libexec/PlistBuddy -c "Add :EnvironmentVariables:FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID string $DEVICE_ID" "$PLIST"
/usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:FINSAFE_ENROLL_TOKEN $ENROLL_TOKEN" "$PLIST" 2>/dev/null \
  || /usr/libexec/PlistBuddy -c "Add :EnvironmentVariables:FINSAFE_ENROLL_TOKEN string $ENROLL_TOKEN" "$PLIST"

launchctl kickstart -k system/com.finogeeks.finsafe-agent 2>/dev/null || launchctl load "$PLIST"
sleep 8
test -f /etc/finsafe/enrolled.json
