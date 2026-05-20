#!/bin/bash
# Jamf policy: remove one-time enrollment token from LaunchDaemon after success.
set -euo pipefail
PLIST=/Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist
[[ -f "$PLIST" ]] || exit 0
/usr/libexec/PlistBuddy -c "Delete :EnvironmentVariables:FINSAFE_ENROLL_TOKEN" "$PLIST" 2>/dev/null || true
launchctl kickstart -k system/com.finogeeks.finsafe-agent 2>/dev/null || true
echo "Removed FINSAFE_ENROLL_TOKEN from agent environment."
