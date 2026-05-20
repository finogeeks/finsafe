#!/bin/bash
# Vendor-neutral one-time FinSAFE enrollment script.
# Usage:
#   sudo FINSAFE_ENROLL_TOKEN='<jws>' \
#        FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID='my-device-id' \
#        FINSAFE_AUTHORITY_URL='https://gov.example.com/policy-authority' \
#        ./enroll-once.sh
#
# Or pass as positional args: enroll-once.sh <token> <device_id> [authority_url]
set -euo pipefail

if [[ -f /etc/finsafe/enrolled.json ]]; then
  echo "Already enrolled; nothing to do."
  exit 0
fi

ENROLL_TOKEN="${FINSAFE_ENROLL_TOKEN:-${1:-}}"
DEVICE_ID="${FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID:-${2:-}}"
AUTH_URL="${FINSAFE_AUTHORITY_URL:-${3:-https://gov.example.com/policy-authority}}"

if [[ -z "$ENROLL_TOKEN" || -z "$DEVICE_ID" ]]; then
  echo "Usage: FINSAFE_ENROLL_TOKEN=... FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID=... [$0]" >&2
  echo "   or: $0 <token> <device_id> [authority_url]" >&2
  exit 1
fi

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root (sudo)." >&2
  exit 1
fi

mkdir -p /etc/finsafe /var/lib/finsafe
chmod 755 /etc/finsafe /var/lib/finsafe

OS="$(uname -s)"
if [[ "$OS" == "Darwin" ]]; then
  PLIST=/Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist
  if [[ ! -f "$PLIST" ]]; then
    echo "ERROR: install $PLIST first (see packaging/launchd/)" >&2
    exit 1
  fi
  set_plist() {
    local key="$1" val="$2"
    /usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:$key $val" "$PLIST" 2>/dev/null \
      || /usr/libexec/PlistBuddy -c "Add :EnvironmentVariables:$key string $val" "$PLIST"
  }
  set_plist FINSAFE_AUTHORITY_URL "$AUTH_URL"
  set_plist FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID "$DEVICE_ID"
  set_plist FINSAFE_ENROLL_TOKEN "$ENROLL_TOKEN"
  launchctl kickstart -k system/com.finogeeks.finsafe-agent 2>/dev/null \
    || launchctl load "$PLIST"
elif [[ "$OS" == "Linux" ]]; then
  DROPIN=/etc/systemd/system/finsafe-agent.service.d/enroll.conf
  mkdir -p "$(dirname "$DROPIN")"
  cat >"$DROPIN" <<EOF
[Service]
Environment=FINSAFE_AUTHORITY_URL=${AUTH_URL}
Environment=FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID=${DEVICE_ID}
Environment=FINSAFE_ENROLL_TOKEN=${ENROLL_TOKEN}
EOF
  systemctl daemon-reload
  systemctl enable --now finsafe-agent.service 2>/dev/null || systemctl restart finsafe-agent
else
  echo "Unsupported OS: $OS" >&2
  exit 1
fi

sleep 8
if [[ ! -f /etc/finsafe/enrolled.json ]]; then
  echo "ERROR: enrollment failed; /etc/finsafe/enrolled.json not created" >&2
  exit 1
fi

echo "Enrollment succeeded:"
cat /etc/finsafe/enrolled.json
echo ""
echo "NEXT: remove FINSAFE_ENROLL_TOKEN from service config and restart agent."
