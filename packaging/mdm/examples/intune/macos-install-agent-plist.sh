#!/bin/bash
# Intune macOS device script — install finsafe-agent LaunchDaemon.
# Replace AUTH_URL before assigning in Intune.
set -euo pipefail
AUTH_URL="https://gov.example.com/policy-authority"
PLIST_DST="/Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist"

mkdir -p /etc/finsafe /var/lib/finsafe
chmod 755 /etc/finsafe /var/lib/finsafe

cat > "$PLIST_DST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.finogeeks.finsafe-agent</string>
    <key>ProgramArguments</key>
    <array>
      <string>/usr/local/bin/finsafe-agent</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>EnvironmentVariables</key>
    <dict>
      <key>FINSAFE_AUTHORITY_URL</key>
      <string>${AUTH_URL}</string>
    </dict>
  </dict>
</plist>
PLIST

chmod 644 "$PLIST_DST"
chown root:wheel "$PLIST_DST"
launchctl bootstrap system "$PLIST_DST" 2>/dev/null || launchctl load "$PLIST_DST"
