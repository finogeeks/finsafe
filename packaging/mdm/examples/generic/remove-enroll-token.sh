#!/bin/bash
# Vendor-neutral: remove one-time enrollment token from agent service config.
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root (sudo)." >&2
  exit 1
fi

OS="$(uname -s)"
if [[ "$OS" == "Darwin" ]]; then
  PLIST=/Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist
  [[ -f "$PLIST" ]] || exit 0
  /usr/libexec/PlistBuddy -c "Delete :EnvironmentVariables:FINSAFE_ENROLL_TOKEN" "$PLIST" 2>/dev/null || true
  launchctl kickstart -k system/com.finogeeks.finsafe-agent 2>/dev/null || true
elif [[ "$OS" == "Linux" ]]; then
  rm -f /etc/systemd/system/finsafe-agent.service.d/enroll.conf
  systemctl daemon-reload
  systemctl restart finsafe-agent 2>/dev/null || true
fi
echo "Removed enrollment token from persistent agent configuration."
