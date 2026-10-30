#!/usr/bin/env sh
# Install finsafe from GitHub releases published in finogeeks/finsafe.
# Installs `finsafe` into FINSAFE_INSTALL_DIR; when Linux release archives
# bundle runtime companions, installs them alongside for auto-discovery.
# Intended usage:
#   curl -fsSL https://raw.githubusercontent.com/finogeeks/finsafe/main/install.sh | sh
# With explicit version and/or install location:
#   curl -fsSL .../install.sh | env FINSAFE_VERSION=0.2.0 FINSAFE_INSTALL_DIR="$HOME/.local/bin" sh

set -eu

REPO_DEFAULT="finogeeks/finsafe"
REPO="${FINSAFE_REPO:-$REPO_DEFAULT}"

# Version without a leading "v" (e.g. 0.2.0). If empty, use GitHub "latest" release.
VERSION_RAW="${FINSAFE_VERSION:-}"

# Where to place the `finsafe` binary. Default matches README guidance.
INSTALL_DIR="${FINSAFE_INSTALL_DIR:-"$HOME/.local/bin"}"

# 1 = do not require SHA256SUMS (emergency escape hatch; not recommended)
SKIP_CHECKSUM="${FINSAFE_INSECURE_SKIP_CHECKSUM:-0}"

die() {
  printf "error: %s\n" "$1" >&2
  exit 1
}

info() {
  printf "==> %s\n" "$1" >&2
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "missing required command: $1"
}

strip_v() {
  # shellcheck disable=SC2001
  echo "$1" | sed 's/^v//'
}

usage() {
  cat <<'EOF' >&2
Usage:
  install.sh [--version <x.y.z|vx.y.z>]

Environment:
  FINSAFE_VERSION                 Install this version (e.g. 0.2.0). If unset, uses latest.
  FINSAFE_INSTALL_DIR             Install directory (default: $HOME/.local/bin)
  FINSAFE_REPO                    GitHub "owner/name" (default: finogeeks/finsafe)
  FINSAFE_INSECURE_SKIP_CHECKSUM  Set to 1 to skip SHA256 verification (not recommended)

Examples:
  curl -fsSL https://raw.githubusercontent.com/finogeeks/finsafe/main/install.sh | sh
  curl -fsSL https://raw.githubusercontent.com/finogeeks/finsafe/main/install.sh | sh -s -- --version 0.2.0
  FINSAFE_VERSION=0.2.0 sh install.sh
EOF
}

# Minimal argv parsing: forward compatibility with "curl | sh" one-liner.
# Supports:
#   sh -s -- --version 0.2.0
while [ "$#" -gt 0 ]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --version)
      [ "$#" -ge 2 ] || die "--version requires a value"
      VERSION_RAW="$2"
      shift 2
      ;;
    *)
      die "unknown argument: $1 (see --help)"
      ;;
  esac
done

need_cmd curl
need_cmd uname
need_cmd mkdir
need_cmd mktemp
need_cmd rm
need_cmd cp
need_cmd chmod
need_cmd tar

os="$(uname -s)"
arch="$(uname -m)"

detect_triple() {
  case "$os" in
    Linux)
      case "$arch" in
        x86_64) echo "x86_64-unknown-linux-gnu" ;;
        aarch64|arm64) die "this installer currently supports Linux x86_64 only (got $arch). Try manual download, or WSL/amd64, or a future aarch64 build." ;;
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
    *) die "unsupported OS: $os (on Windows, use install.ps1 from the same repo, or WSL2 + this script)" ;;
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
path = sys.argv[1]
with open(path, "r", encoding="utf-8") as f:
    d = json.load(f)
print(d.get("tag_name", "") or "")
PY
    )"
  else
    # Fallback: look for a "tag_name" line. Not as robust as JSON parse, but works for GitHub's API JSON.
    VERSION_STRIP="$(sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\(v\?[0-9][^\"]*\)".*/\1/p' "$latest_json" | head -n 1 || true)"
  fi
  rm -f "$latest_json" >/dev/null 2>&1 || true
  [ -n "$VERSION_STRIP" ] || die "could not parse latest release tag from GitHub API response"
  VERSION_STRIP="$(strip_v "$VERSION_STRIP")"
else
  VERSION_STRIP="$(strip_v "$VERSION_RAW")"
fi

version_tag="v${VERSION_STRIP}"
archive_name="finsafe-v${VERSION_STRIP}-${TRIPLE}.tar.zst"
inner_dir="finsafe-v${VERSION_STRIP}-${TRIPLE}"

# GitHub "download" URLs for release assets
base="https://github.com/${REPO}/releases/download/${version_tag}"
archive_url="${base}/${archive_name}"
sums_url="${base}/SHA256SUMS"

stage="$(mktemp -d)"
cleanup_stage() {
  rm -rf "$stage" >/dev/null 2>&1 || true
}
trap cleanup_stage INT TERM EXIT

cd "$stage" || die "could not enter temp directory"

info "downloading ${archive_url}"
curl -fSL --retry 3 --retry-delay 1 -o "$archive_name" "$archive_url"

if [ "$SKIP_CHECKSUM" = "1" ]; then
  info "WARNING: skipping checksum verification (FINSAFE_INSECURE_SKIP_CHECKSUM=1)"
else
  info "downloading ${sums_url}"
  curl -fSL --retry 3 --retry-delay 1 "$sums_url" -o SHA256SUMS

  # Multi-platform releases ship one SHA256SUMS listing all tar.zst files. We only
  # download one archive. Do not use `shasum -c` / `sha256sum -c` on the full
  # SHA256SUMS: they verify every listed file. Compare the single expected hash
  # to a hash of the downloaded archive only.
  c="$(
    awk -v f="$archive_name" 'NF >= 2 && $NF == f { c++ } END { print c + 0 }' SHA256SUMS
  )"
  if [ "$c" -ne 1 ]; then
    die "expected exactly one SHA256 line for ${archive_name} in SHA256SUMS (found ${c})"
  fi
  expected_hash="$(
    awk -v f="$archive_name" 'NF >= 2 && $NF == f { print $1; exit }' SHA256SUMS
  )"
  [ -n "$expected_hash" ] || die "empty hash in SHA256SUMS for ${archive_name}"

  if command -v shasum >/dev/null 2>&1; then
    actual_hash="$(shasum -a 256 "$archive_name" | awk '{print $1}')"
  elif command -v sha256sum >/dev/null 2>&1; then
    actual_hash="$(sha256sum "$archive_name" | awk '{print $1}')"
  else
    die "neither shasum nor sha256sum is available; install one, or (not recommended) set FINSAFE_INSECURE_SKIP_CHECKSUM=1"
  fi

  if [ "$expected_hash" != "$actual_hash" ]; then
    die "SHA256 mismatch for ${archive_name} (expected ${expected_hash}, got ${actual_hash})"
  fi
  info "checksum OK (${archive_name})"
fi

if command -v zstd >/dev/null 2>&1; then
  info "extracting with zstd + tar"
  zstd -dc "$archive_name" | tar -xf -
elif command -v grep >/dev/null 2>&1 && tar --help 2>&1 | grep -q -- '--zstd'; then
  info "extracting with tar --zstd"
  tar --zstd -xf "$archive_name"
else
  die "could not find zstd, and this tar does not support --zstd. Install zstd (e.g. brew install zstd / apt install zstd) and retry."
fi

[ -d "$inner_dir" ] || die "expected directory missing after extract: $inner_dir"
[ -f "$inner_dir/finsafe" ] || die "expected binary missing: $inner_dir/finsafe"

# shellcheck disable=SC2088
info "installing to ${INSTALL_DIR}"
# NOTE: we expand ~-style paths because users may set FINSAFE_INSTALL_DIR=~/bin
case "$INSTALL_DIR" in
  "~"|"~"/*|"~root"|"~root"/*) die "please expand ~ in FINSAFE_INSTALL_DIR (use an absolute path like \$HOME/... )" ;;
esac
mkdir -p "$INSTALL_DIR" || die "could not create install dir: $INSTALL_DIR"

cp -f "$inner_dir/finsafe" "$INSTALL_DIR/finsafe"
chmod 0755 "$INSTALL_DIR/finsafe"

# Linux release archives also ship runtime companions next to `finsafe` so
# cgroup/Landlock-bound runs work without path flags (same-dir auto-discovery).
for tool in finsafe-landlock-shim finsafe-helper finsafe-supervisor; do
  tool_src="$inner_dir/$tool"
  if [ -f "$tool_src" ]; then
    cp -f "$tool_src" "$INSTALL_DIR/$tool"
    chmod 0755 "$INSTALL_DIR/$tool"
    info "installed $tool: $INSTALL_DIR/$tool"
  fi
done

cp_path="$INSTALL_DIR/finsafe"
if command -v finsafe >/dev/null 2>&1; then
  first="$(command -v finsafe)"
  info "installed: $cp_path (first on PATH: $first)"
  "$first" version || true
else
  info "installed: $cp_path, but it is not on your PATH yet"
  info "add this to your shell rc: export PATH=\"$INSTALL_DIR:\$PATH\""
fi

info "done"
info "run \`finsafe init\` to create ~/.config/finsafe/policies/ with seeded example YAML (or clone https://github.com/finogeeks/finsafe for the full examples tree)"
info "managed fleet and policy authority archives (finsafe-fleet-v*, finsafe-admin-server-v*, finsafe-bundlectl-v*) are on the same GitHub release; see README.md"
