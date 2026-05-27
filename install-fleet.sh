#!/usr/bin/env sh
# IT pilot: download, verify, and install FinSAFE managed fleet on Linux or macOS.
# Installs finsafe-fleet-v* into /usr/local/bin, deploys sentinel, and starts finsafe-agent.
#
# Not a curl|sh one-liner for end users. Requires root (sudo) and Policy Authority settings.
# Production fleets should use MDM, Ansible, or golden images — see packaging/mdm/.
#
# Examples:
#   sudo FINSAFE_AUTHORITY_URL='https://gov.example.com/policy-authority' \
#        FINSAFE_SENTINEL_PATH=./managed-required.jws \
#        FINSAFE_ENROLL_TOKEN='one-time-token' \
#        ./install-fleet.sh
#
#   ./install-fleet.sh --version 0.5.0 --download-only
#   sudo ./install-fleet.sh --authority-url 'https://...' --sentinel-path ./managed-required.jws

set -eu

REPO="${FINSAFE_REPO:-finogeeks/finsafe}"
VERSION_RAW="${FINSAFE_VERSION:-}"
AUTHORITY_URL="${FINSAFE_AUTHORITY_URL:-}"
SENTINEL_PATH="${FINSAFE_SENTINEL_PATH:-}"
ENROLL_TOKEN="${FINSAFE_ENROLL_TOKEN:-}"
DEVICE_ID="${FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID:-}"
SKIP_CHECKSUM="${FINSAFE_INSECURE_SKIP_CHECKSUM:-0}"
DOWNLOAD_ONLY=0

die() { printf 'error: %s\n' "$1" >&2; exit 1; }
info() { printf '==> %s\n' "$1" >&2; }

usage() {
  cat <<'EOF' >&2
Usage:
  install-fleet.sh [options]

Options:
  --version <x.y.z>           Release version (default: latest)
  --authority-url <url>       Policy Authority URL (required unless --download-only)
  --sentinel-path <file>      managed-required JWS file
  --enroll-token <token>      One-time enrollment token (optional)
  --device-id <id>            Bootstrap device id (default: hostname)
  --download-only             Download and extract only; do not install
  -h, --help                  Show this help

Environment (same names as flags):
  FINSAFE_VERSION, FINSAFE_AUTHORITY_URL, FINSAFE_SENTINEL_PATH,
  FINSAFE_ENROLL_TOKEN, FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID,
  FINSAFE_INSECURE_SKIP_CHECKSUM=1, FINSAFE_REPO

Windows fleet: use install-fleet-windows.ps1 instead of this script.
EOF
}

strip_v() {
  echo "$1" | sed 's/^v//'
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "missing required command: $1"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    --version)
      [ "$#" -ge 2 ] || die "--version requires a value"
      VERSION_RAW="$2"
      shift 2
      ;;
    --authority-url)
      [ "$#" -ge 2 ] || die "--authority-url requires a value"
      AUTHORITY_URL="$2"
      shift 2
      ;;
    --sentinel-path)
      [ "$#" -ge 2 ] || die "--sentinel-path requires a value"
      SENTINEL_PATH="$2"
      shift 2
      ;;
    --enroll-token)
      [ "$#" -ge 2 ] || die "--enroll-token requires a value"
      ENROLL_TOKEN="$2"
      shift 2
      ;;
    --device-id)
      [ "$#" -ge 2 ] || die "--device-id requires a value"
      DEVICE_ID="$2"
      shift 2
      ;;
    --download-only)
      DOWNLOAD_ONLY=1
      shift
      ;;
    *)
      die "unknown argument: $1 (see --help)"
      ;;
  esac
done

if [ "$DOWNLOAD_ONLY" -eq 0 ] && [ -z "$AUTHORITY_URL" ]; then
  die "FINSAFE_AUTHORITY_URL or --authority-url is required (or use --download-only)"
fi

need_cmd curl
need_cmd uname
need_cmd mkdir
need_cmd mktemp
need_cmd rm

os="$(uname -s)"
arch="$(uname -m)"

detect_triple() {
  case "$os" in
    Linux)
      case "$arch" in
        x86_64) echo "x86_64-unknown-linux-gnu" ;;
        aarch64|arm64) die "this installer currently supports Linux x86_64 only (got $arch). Use MDM/Ansible with a manual finsafe-fleet-v* unpack." ;;
        *) die "unsupported Linux machine: $arch" ;;
      esac
      ;;
    Darwin)
      case "$arch" in
        x86_64) echo "x86_64-apple-darwin" ;;
        arm64) echo "aarch64-apple-darwin" ;;
        *) die "unsupported macOS machine: $arch" ;;
      esac
      ;;
    *) die "unsupported OS: $os (use install-fleet-windows.ps1 on Windows)" ;;
  esac
}

TRIPLE="$(detect_triple)"

if [ -z "$VERSION_RAW" ]; then
  info "resolving latest release for https://github.com/${REPO}"
  latest_json="$(mktemp)"
  curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" -o "$latest_json"
  if command -v python3 >/dev/null 2>&1; then
    VERSION_STRIP="$(
      python3 - "$latest_json" <<'PY'
import json, sys
with open(sys.argv[1], "r", encoding="utf-8") as f:
    d = json.load(f)
print((d.get("tag_name") or "").lstrip("v"))
PY
    )"
  else
    VERSION_STRIP="$(sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\(v\?[0-9][^\"]*\)".*/\1/p' "$latest_json" | head -n 1 | sed 's/^v//')"
  fi
  rm -f "$latest_json"
  [ -n "$VERSION_STRIP" ] || die "could not parse latest release tag"
else
  VERSION_STRIP="$(strip_v "$VERSION_RAW")"
fi

version_tag="v${VERSION_STRIP}"
archive_name="finsafe-fleet-v${VERSION_STRIP}-${TRIPLE}.tar.zst"
inner_dir="finsafe-fleet-v${VERSION_STRIP}-${TRIPLE}"
base="https://github.com/${REPO}/releases/download/${version_tag}"
archive_url="${base}/${archive_name}"
sums_url="${base}/SHA256SUMS"

stage="$(mktemp -d)"
cleanup_stage() { rm -rf "$stage" >/dev/null 2>&1 || true; }
trap cleanup_stage INT TERM EXIT

cd "$stage" || die "could not enter temp directory"

info "downloading ${archive_url}"
curl -fSL --retry 3 --retry-delay 1 -o "$archive_name" "$archive_url"

if [ "$SKIP_CHECKSUM" = "1" ]; then
  info "WARNING: skipping checksum verification (FINSAFE_INSECURE_SKIP_CHECKSUM=1)"
else
  need_cmd tar
  info "downloading ${sums_url}"
  curl -fSL --retry 3 --retry-delay 1 "$sums_url" -o SHA256SUMS
  c="$(awk -v f="$archive_name" 'NF >= 2 && $NF == f { c++ } END { print c + 0 }' SHA256SUMS)"
  [ "$c" -eq 1 ] || die "expected exactly one SHA256 line for ${archive_name} in SHA256SUMS (found ${c})"
  expected_hash="$(awk -v f="$archive_name" 'NF >= 2 && $NF == f { print $1; exit }' SHA256SUMS)"
  [ -n "$expected_hash" ] || die "empty hash in SHA256SUMS for ${archive_name}"
  if command -v shasum >/dev/null 2>&1; then
    actual_hash="$(shasum -a 256 "$archive_name" | awk '{print $1}')"
  elif command -v sha256sum >/dev/null 2>&1; then
    actual_hash="$(sha256sum "$archive_name" | awk '{print $1}')"
  else
    die "neither shasum nor sha256sum available"
  fi
  [ "$expected_hash" = "$actual_hash" ] || die "SHA256 mismatch for ${archive_name}"
  info "checksum OK (${archive_name})"
fi

if command -v zstd >/dev/null 2>&1; then
  zstd -dc "$archive_name" | tar -xf -
elif command -v grep >/dev/null 2>&1 && tar --help 2>&1 | grep -q -- '--zstd'; then
  tar --zstd -xf "$archive_name"
else
  die "need zstd or tar with --zstd support"
fi

[ -d "$inner_dir" ] || die "expected directory missing after extract: $inner_dir"

if [ "$DOWNLOAD_ONLY" -eq 1 ]; then
  out_dir="$( (unset CDPATH 2>/dev/null || true; cd -- "$(dirname "$0")" && pwd) )/$inner_dir"
  if [ -d "$out_dir" ]; then
    rm -rf "$out_dir"
  fi
  cp -R "$inner_dir" "$out_dir"
  info "fleet binaries extracted to $out_dir"
  info "next: sudo FINSAFE_FLEET_SOURCE_DIR=$out_dir FINSAFE_AUTHORITY_URL=... ./install-fleet.sh --authority-url ..."
  exit 0
fi

SCRIPT_DIR="$( (unset CDPATH 2>/dev/null || true; cd -- "$(dirname "$0")" && pwd) )"
UNIX_INSTALLER="${SCRIPT_DIR}/packaging/mdm/examples/generic/install-fleet-unix.sh"
[ -f "$UNIX_INSTALLER" ] || die "installer helper not found: $UNIX_INSTALLER"

if [ "$(id -u)" -ne 0 ]; then
  info "re-running install step as root via sudo"
  exec sudo env \
    FINSAFE_FLEET_SOURCE_DIR="$stage/$inner_dir" \
    FINSAFE_AUTHORITY_URL="$AUTHORITY_URL" \
    FINSAFE_SENTINEL_PATH="$SENTINEL_PATH" \
    FINSAFE_ENROLL_TOKEN="$ENROLL_TOKEN" \
    FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID="$DEVICE_ID" \
    sh "$UNIX_INSTALLER"
fi

export FINSAFE_FLEET_SOURCE_DIR="$stage/$inner_dir"
export FINSAFE_AUTHORITY_URL="$AUTHORITY_URL"
export FINSAFE_SENTINEL_PATH="$SENTINEL_PATH"
export FINSAFE_ENROLL_TOKEN="$ENROLL_TOKEN"
export FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID="$DEVICE_ID"
sh "$UNIX_INSTALLER"
