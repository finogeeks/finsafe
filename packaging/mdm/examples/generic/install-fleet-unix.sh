#!/bin/bash
# Install FinSAFE managed fleet binaries from an extracted finsafe-fleet-v* directory.
# Called by install-fleet.sh (IT pilot). Production fleets should prefer MDM/Ansible.
#
# Required environment:
#   FINSAFE_FLEET_SOURCE_DIR   Path to finsafe-fleet-v<version>-<target>/ (contains finsafe, finsafe-agent, ...)
#   FINSAFE_AUTHORITY_URL      Policy Authority base URL
#
# Optional:
#   FINSAFE_SENTINEL_PATH      File containing managed-required JWS
#   FINSAFE_SENTINEL_JWS       Inline JWS (do not use both with PATH)
#   FINSAFE_ENROLL_TOKEN       One-time enrollment token
#   FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID  Defaults to hostname
#
set -euo pipefail

die() { printf 'error: %s\n' "$1" >&2; exit 1; }
info() { printf '==> %s\n' "$1" >&2; }

if [[ "$(id -u)" -ne 0 ]]; then
  die "run as root (sudo)"
fi

SOURCE_DIR="${FINSAFE_FLEET_SOURCE_DIR:-}"
AUTH_URL="${FINSAFE_AUTHORITY_URL:-}"
SENTINEL_PATH="${FINSAFE_SENTINEL_PATH:-}"
SENTINEL_JWS="${FINSAFE_SENTINEL_JWS:-}"
ENROLL_TOKEN="${FINSAFE_ENROLL_TOKEN:-}"
DEVICE_ID="${FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID:-$(hostname -s 2>/dev/null || hostname)}"

[[ -n "$SOURCE_DIR" ]] || die "FINSAFE_FLEET_SOURCE_DIR is required"
[[ -d "$SOURCE_DIR" ]] || die "fleet source directory not found: $SOURCE_DIR"
[[ -n "$AUTH_URL" ]] || die "FINSAFE_AUTHORITY_URL is required"

if [[ -n "$SENTINEL_PATH" && -n "$SENTINEL_JWS" ]]; then
  die "use only one of FINSAFE_SENTINEL_PATH or FINSAFE_SENTINEL_JWS"
fi
if [[ -n "$SENTINEL_PATH" ]]; then
  [[ -f "$SENTINEL_PATH" ]] || die "sentinel file not found: $SENTINEL_PATH"
  SENTINEL_JWS="$(tr -d '\n\r' <"$SENTINEL_PATH")"
fi
if [[ -n "$SENTINEL_JWS" ]]; then
  SENTINEL_JWS="$(printf '%s' "$SENTINEL_JWS" | tr -d '\n\r')"
fi

OS="$(uname -s)"
INSTALL_BIN="/usr/local/bin"

install_binaries() {
  local name
  for name in finsafe finsafe-agent finsafe-helper finsafe-supervisor finsafe-landlock-shim; do
  if [[ -f "$SOURCE_DIR/$name" ]]; then
    install -m 755 "$SOURCE_DIR/$name" "$INSTALL_BIN/$name"
    info "installed $INSTALL_BIN/$name"
  fi
  done
  [[ -f "$INSTALL_BIN/finsafe" ]] || die "missing finsafe in fleet archive"
  [[ -f "$INSTALL_BIN/finsafe-agent" ]] || die "missing finsafe-agent in fleet archive"
}

deploy_sentinel() {
  [[ -n "$SENTINEL_JWS" ]] || return 0
  mkdir -p /etc/finsafe
  chmod 755 /etc/finsafe
  printf '%s\n' "$SENTINEL_JWS" >/etc/finsafe/managed-required.json
  chmod 644 /etc/finsafe/managed-required.json
  if [[ "$OS" == "Darwin" ]]; then
    chown root:wheel /etc/finsafe/managed-required.json
  else
    chown root:root /etc/finsafe/managed-required.json
  fi
  info "deployed /etc/finsafe/managed-required.json"
}

install_linux_agent() {
  mkdir -p /etc/finsafe /var/lib/finsafe /var/lib/finsafe/cache /var/lib/finsafe/audit
  chmod 755 /etc/finsafe /var/lib/finsafe

  cat >/etc/systemd/system/finsafe-agent.service <<UNIT
[Unit]
Description=FinSAFE managed-mode policy agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/local/bin/finsafe-agent
Restart=on-failure
RestartSec=5
RuntimeDirectory=finsafe
RuntimeDirectoryMode=0755
Environment=FINSAFE_AUTHORITY_URL=${AUTH_URL}

[Install]
WantedBy=multi-user.target
UNIT

  systemctl daemon-reload
  systemctl enable finsafe-agent.service
  info "installed systemd unit finsafe-agent.service"
}

install_macos_agent() {
  local plist_dst="/Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist"
  mkdir -p /etc/finsafe /var/lib/finsafe
  chmod 755 /etc/finsafe /var/lib/finsafe

  cat >"$plist_dst" <<PLIST
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

  chmod 644 "$plist_dst"
  chown root:wheel "$plist_dst"
  launchctl bootstrap system "$plist_dst" 2>/dev/null || launchctl load "$plist_dst"
  info "installed LaunchDaemon $plist_dst"
}

configure_enroll() {
  [[ -n "$ENROLL_TOKEN" ]] || return 0
  if [[ -f /etc/finsafe/enrolled.json ]]; then
    info "already enrolled; skipping enroll token injection"
    return 0
  fi

  if [[ "$OS" == "Darwin" ]]; then
    local plist="/Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist"
    [[ -f "$plist" ]] || die "missing LaunchDaemon plist"
    set_plist() {
      local key="$1" val="$2"
      /usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:$key $val" "$plist" 2>/dev/null \
        || /usr/libexec/PlistBuddy -c "Add :EnvironmentVariables:$key string $val" "$plist"
    }
    set_plist FINSAFE_AUTHORITY_URL "$AUTH_URL"
    set_plist FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID "$DEVICE_ID"
    set_plist FINSAFE_ENROLL_TOKEN "$ENROLL_TOKEN"
    launchctl kickstart -k system/com.finogeeks.finsafe-agent 2>/dev/null \
      || launchctl load "$plist"
  elif [[ "$OS" == "Linux" ]]; then
    local dropin="/etc/systemd/system/finsafe-agent.service.d/enroll.conf"
    mkdir -p "$(dirname "$dropin")"
    cat >"$dropin" <<EOF
[Service]
Environment=FINSAFE_AUTHORITY_URL=${AUTH_URL}
Environment=FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID=${DEVICE_ID}
Environment=FINSAFE_ENROLL_TOKEN=${ENROLL_TOKEN}
EOF
    systemctl daemon-reload
    systemctl restart finsafe-agent.service 2>/dev/null || systemctl start finsafe-agent.service
  else
    die "unsupported OS: $OS"
  fi

  sleep 8
  if [[ ! -f /etc/finsafe/enrolled.json ]]; then
    die "enrollment did not create /etc/finsafe/enrolled.json (check authority URL and token)"
  fi
  info "enrollment succeeded"
}

info "installing fleet from $SOURCE_DIR"
install_binaries
deploy_sentinel

case "$OS" in
  Linux) install_linux_agent ;;
  Darwin) install_macos_agent ;;
  *) die "unsupported OS: $OS" ;;
esac

systemctl start finsafe-agent.service 2>/dev/null || true
configure_enroll

info "done"
info "verify: finsafe version; test -f /etc/finsafe/managed-required.json"
if [[ -n "$ENROLL_TOKEN" ]]; then
  info "remove FINSAFE_ENROLL_TOKEN from agent config after enrollment succeeds"
fi
info "production rollout: use MDM/Ansible — see packaging/mdm/README.md"
