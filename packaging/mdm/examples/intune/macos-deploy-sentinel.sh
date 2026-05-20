#!/bin/bash
# Intune macOS device script — deploy managed-required sentinel.
# Set secret variable SENTINEL_JWS in Intune script arguments (%%SENTINEL_JWS%%).
set -euo pipefail
SENTINEL_JWS="${1:-}"
if [[ -z "$SENTINEL_JWS" ]]; then
  echo "ERROR: pass signed JWS as script argument 1" >&2
  exit 1
fi
install -d -m 755 /etc/finsafe
printf '%s\n' "$SENTINEL_JWS" > /etc/finsafe/managed-required.json
chmod 644 /etc/finsafe/managed-required.json
chown root:wheel /etc/finsafe/managed-required.json
echo "Deployed /etc/finsafe/managed-required.json"
