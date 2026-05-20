#!/bin/bash
# Vendor-neutral: deploy managed-required sentinel JWS.
# Usage:
#   sudo FINSAFE_SENTINEL_JWS="$(cat managed-required.jws)" ./deploy-sentinel.sh
#   sudo ./deploy-sentinel.sh /path/to/managed-required.jws
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root (sudo)." >&2
  exit 1
fi

if [[ -n "${1:-}" ]]; then
  SENTINEL_JWS="$(tr -d '\n' <"$1")"
elif [[ -n "${FINSAFE_SENTINEL_JWS:-}" ]]; then
  SENTINEL_JWS="$FINSAFE_SENTINEL_JWS"
else
  echo "Usage: FINSAFE_SENTINEL_JWS=... $0   OR   $0 /path/to/managed-required.jws" >&2
  exit 1
fi

mkdir -p /etc/finsafe
printf '%s\n' "$SENTINEL_JWS" >/etc/finsafe/managed-required.json
chmod 644 /etc/finsafe/managed-required.json
if [[ "$(uname -s)" == "Darwin" ]]; then
  chown root:wheel /etc/finsafe/managed-required.json
else
  chown root:root /etc/finsafe/managed-required.json
fi
echo "Installed /etc/finsafe/managed-required.json"
