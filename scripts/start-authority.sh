#!/usr/bin/env bash
# Start finsafe-authority-http in the foreground with sensible defaults for pilots.
#
# Usage:
#   export FINSAFE_LICENSE_PATH=/etc/finsafe/license.jws   # required for managed APIs
#   export FINSAFE_AUTHORITY_PUBLIC_URL=https://gov.example.com/policy-authority
#   ./scripts/start-authority.sh
#
# Options (env):
#   FINSAFE_AUTHORITY_HTTP_BIN  — path to binary (default: finsafe-authority-http on PATH)
#   FINSAFE_AUTHORITY_BIND      — listen address (default: 127.0.0.1:8090)
#   FINSAFE_AUTHORITY_STATE_DIR — SQLite + signing key directory
#   FINSAFE_LICENSE_PATH        — commercial license.jws (default: /etc/finsafe/license.jws)
#
# The admin console is only at /admin/ (trailing slash). Root / redirects there.
set -euo pipefail

resolve_auth_bin() {
  if [[ -n "${FINSAFE_AUTHORITY_HTTP_BIN:-}" && -x "${FINSAFE_AUTHORITY_HTTP_BIN}" ]]; then
    echo "${FINSAFE_AUTHORITY_HTTP_BIN}"
    return 0
  fi
  if command -v finsafe-authority-http >/dev/null 2>&1; then
    command -v finsafe-authority-http
    return 0
  fi
  echo "ERROR: finsafe-authority-http not found." >&2
  echo "Install from finsafe-admin-server-v*.tar.zst (see docs/authority-deployment.md)." >&2
  exit 1
}

default_state_dir() {
  if [[ "$(id -u)" -eq 0 ]]; then
    echo "/var/lib/finsafe-authority"
  else
    echo "${HOME}/.finsafe-authority"
  fi
}

AUTH_BIN="$(resolve_auth_bin)"
BIND="${FINSAFE_AUTHORITY_BIND:-127.0.0.1:8090}"
STATE_DIR="${FINSAFE_AUTHORITY_STATE_DIR:-$(default_state_dir)}"
LICENSE_PATH="${FINSAFE_LICENSE_PATH:-/etc/finsafe/license.jws}"

mkdir -p "$STATE_DIR"
chmod 0700 "$STATE_DIR" 2>/dev/null || true

export FINSAFE_AUTHORITY_BIND="$BIND"
export FINSAFE_AUTHORITY_STATE_DIR="$STATE_DIR"
export FINSAFE_LICENSE_PATH="$LICENSE_PATH"
export FINSAFE_AUTHORITY_PUBLIC_URL="${FINSAFE_AUTHORITY_PUBLIC_URL:-http://${BIND}}"

host="${BIND%:*}"
port="${BIND##*:}"
admin_url="http://${host}:${port}/admin/"

echo "==> binary:      $AUTH_BIN"
echo "==> bind:        $FINSAFE_AUTHORITY_BIND"
echo "==> state dir:   $STATE_DIR"
echo "==> license:     $LICENSE_PATH"
echo "==> public URL:  $FINSAFE_AUTHORITY_PUBLIC_URL"
echo "==> admin UI:    $admin_url"
echo ""

if [[ ! -f "$LICENSE_PATH" ]]; then
  echo "WARN: license file missing — /health and /admin/ work; managed APIs return 402." >&2
  echo "      Install Finogeeks license.jws and set FINSAFE_LICENSE_PATH." >&2
  echo "" >&2
fi

exec "$AUTH_BIN" --workdir "$STATE_DIR" --license "$LICENSE_PATH"
