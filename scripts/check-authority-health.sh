#!/usr/bin/env bash
# Enterprise IT: quick health + license status check for finsafe-authority-http.
#
# Usage:
#   export FINSAFE_AUTHORITY_URL=https://authority.example.com:8090
#   export FINSAFE_ADMIN_TOKEN=...   # optional; required for protected admin routes
#   ./scripts/check-authority-health.sh
#
# Requires: curl, jq
set -euo pipefail

BASE="${FINSAFE_AUTHORITY_URL:-http://127.0.0.1:8090}"
TOKEN="${FINSAFE_ADMIN_TOKEN:-}"

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required" >&2
  exit 2
fi

hdr=(-H "Accept: application/json")
if [[ -n "$TOKEN" ]]; then
  hdr+=(-H "X-Admin-Token: $TOKEN")
fi

echo "==> GET $BASE/health"
health="$(curl -sf "$BASE/health")"
echo "$health"

echo "==> GET $BASE/v1/license/status"
license="$(curl -sf "$BASE/v1/license/status")"
echo "$license" | jq .

status="$(echo "$license" | jq -r '.status // empty')"
case "$status" in
  valid|grace)
    echo "OK: license status=$status"
    ;;
  missing|expired|invalid|"")
    echo "WARN: license status=${status:-<empty>} — protected routes may return 402" >&2
    exit 1
    ;;
  *)
    echo "NOTE: license status=$status"
    ;;
esac

if [[ -n "$TOKEN" ]]; then
  echo "==> GET $BASE/v1/admin/stats (admin token)"
  curl -sf "${hdr[@]}" "$BASE/v1/admin/stats" | jq .
fi

echo "OK: authority reachable at $BASE"
