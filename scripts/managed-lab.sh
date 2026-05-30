#!/usr/bin/env bash
# Local managed-mode lab: Policy Authority + enrolled agent + CLI env on one machine.
#
# For administrators evaluating FinSAFE fleet releases (not source builds).
# macOS and Linux only.
#
# Prerequisites (on PATH or set FINSAFE_*_BIN):
#   finsafe-authority-http   (finsafe-admin-server-v* archive)
#   finsafe-agent, finsafe   (finsafe-fleet-v* archive)
#   finsafe-bundlectl        (finsafe-bundlectl-v* archive)
#   jq, curl
#   Finogeeks-issued license.jws (FINSAFE_LICENSE_PATH)
#
# Usage (from a finsafe checkout or after copying this script):
#   export FINSAFE_LICENSE_PATH=/path/to/license.jws
#   ./scripts/managed-lab.sh start
#   source "$(./scripts/managed-lab.sh env)"
#   ./scripts/managed-lab.sh run -- /usr/bin/true
#   ./scripts/managed-lab.sh publish --from examples/wrapper-policies/hermes-version-smoke.yaml
#   ./scripts/managed-lab.sh stop
#
# Docs: docs/testing/managed-lab.md
set -euo pipefail

PUBLIC_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

LAB_DIR="${FINSAFE_LAB_DIR:-${HOME}/.finsafe-lab}"
BIND="${FINSAFE_LAB_BIND:-127.0.0.1:8095}"
DEVICE_ID="${FINSAFE_LAB_DEVICE_ID:-lab-desktop-1}"
DEFAULT_POLICY="${PUBLIC_ROOT}/examples/wrapper-policies/managed-lab-smoke.yaml"

AUTH_DIR="$LAB_DIR/authority"
DESKTOP_DIR="$LAB_DIR/desktop"
ENV_FILE="$LAB_DIR/lab.env"
AUTH_PID_FILE="$LAB_DIR/authority.pid"
AGENT_PID_FILE="$LAB_DIR/agent.pid"
AUTH_LOG="$LAB_DIR/authority.log"
AGENT_LOG="$LAB_DIR/agent.log"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

ok() {
  echo "OK: $*"
}

log() {
  echo "==> $*"
}

require_jq() {
  command -v jq >/dev/null 2>&1 || fail "jq is required (install via your OS package manager)"
}

resolve_bin() {
  local var_name="$1"
  local default_name="$2"
  local hint="$3"
  local from_env="${!var_name:-}"
  if [[ -n "$from_env" ]]; then
    [[ -x "$from_env" ]] || fail "$var_name is not executable: $from_env"
    printf '%s' "$from_env"
    return 0
  fi
  if command -v "$default_name" >/dev/null 2>&1; then
    command -v "$default_name"
    return 0
  fi
  fail "$default_name not found on PATH — $hint"
}

authority_bind_port() {
  local bind="${1:-$BIND}"
  if [[ "$bind" == *:* ]]; then
    echo "${bind##*:}"
  else
    echo "$bind"
  fi
}

free_authority_port() {
  local port="$1"
  if ! command -v lsof >/dev/null 2>&1; then
    return 0
  fi
  local pids
  pids="$(lsof -ti "tcp:${port}" 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    log "freeing port ${port} (pids: ${pids})"
    # shellcheck disable=SC2086
    kill ${pids} 2>/dev/null || true
    sleep 0.5
  fi
}

wait_authority_healthy() {
  local url="$1"
  local pid="${2:-}"
  for _ in $(seq 1 60); do
    if [[ -n "$pid" ]] && ! kill -0 "$pid" 2>/dev/null; then
      fail "authority pid ${pid} exited before healthy — see $AUTH_LOG"
    fi
    if curl -sf "${url}/health" >/dev/null 2>&1; then
      ok "authority healthy at ${url}"
      return 0
    fi
    sleep 0.2
  done
  fail "authority failed to become healthy at ${url} — see $AUTH_LOG"
}

usage() {
  cat <<EOF
usage: $0 <command> [options]

Local managed-mode lab (Policy Authority + agent + enrolled desktop state).
State directory: $LAB_DIR
Authority bind: http://${BIND}

Commands:
  start [--policy PATH]     Start authority, publish bundle, enroll agent, write lab.env
  stop                      Stop agent and authority (keeps state)
  status                    Health, enrollment, PIDs, log paths
  env                       Print path to lab.env (source it before manual finsafe commands)
  publish [--from PATH]     Build/sign/publish a bundle to the running authority
  restart-agent             Restart finsafe-agent (keeps enrollment)
  run [--json] [--] <cmd>   Managed short-lived run (human output by default)
  interactive [--json] [--] <cmd>
                            Managed interactive broker (finsafe self-confine)
  help

Environment:
  FINSAFE_LICENSE_PATH      Required for start — Finogeeks-issued license.jws
  FINSAFE_LAB_DIR           State root (default: ~/.finsafe-lab)
  FINSAFE_LAB_BIND          Listen address (default: 127.0.0.1:8095)
  FINSAFE_LAB_DEVICE_ID     Enrollment device id (default: lab-desktop-1)
  FINSAFE_LAB_POLICY        Default policy YAML for start/publish
  FINSAFE_BIN / FINSAFE_AGENT_BIN / FINSAFE_AUTHORITY_HTTP_BIN / FINSAFE_BUNDLECTL_BIN
                            Override binary paths

After start:
  Admin UI:  http://${BIND}/admin/
  CLI env:   source \$($0 env)

See: ${PUBLIC_ROOT}/docs/testing/managed-lab.md
EOF
}

is_running() {
  local pid_file="$1"
  [[ -f "$pid_file" ]] || return 1
  local pid
  pid="$(cat "$pid_file")"
  kill -0 "$pid" 2>/dev/null
}

spawn_detached() {
  local pid_file="$1"
  local log_file="$2"
  shift 2
  : >"$log_file"
  if command -v setsid >/dev/null 2>&1; then
    setsid bash -c 'exec "$@"' _ "$@" >>"$log_file" 2>&1 </dev/null &
  else
    nohup bash -c 'exec "$@"' _ "$@" >>"$log_file" 2>&1 </dev/null &
  fi
  echo $! >"$pid_file"
  disown -h "$(cat "$pid_file")" 2>/dev/null || true
}

agent_socket_reachable() {
  [[ -S "$DESKTOP_DIR/agent.sock" ]] || return 1
  python3 - "$DESKTOP_DIR/agent.sock" <<'PY' >/dev/null 2>&1
import socket, sys
s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
s.settimeout(0.5)
s.connect(sys.argv[1])
PY
}

require_managed_agent() {
  if is_running "$AGENT_PID_FILE" && agent_socket_reachable; then
    return 0
  fi
  if [[ -S "$DESKTOP_DIR/agent.sock" ]]; then
    rm -f "$DESKTOP_DIR/agent.sock"
  fi
  fail "managed agent is not reachable at $DESKTOP_DIR/agent.sock — run: $0 start   then: $0 status"
}

stop_pid_file() {
  local pid_file="$1"
  local name="$2"
  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file")"
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
      ok "stopped $name (pid $pid)"
    fi
    rm -f "$pid_file"
  fi
}

require_license() {
  local license_src="${FINSAFE_LICENSE_PATH:-}"
  [[ -n "$license_src" ]] || fail "set FINSAFE_LICENSE_PATH to your Finogeeks-issued license.jws before start"
  [[ -f "$license_src" ]] || fail "license not found: $license_src"
  mkdir -p "$AUTH_DIR"
  cp -f "$license_src" "$AUTH_DIR/license.jws"
}

ensure_bins() {
  FINSAFE_BIN="$(resolve_bin FINSAFE_BIN finsafe 'install finsafe-fleet-v* to /usr/local/bin')"
  FINSAFE_AGENT_BIN="$(resolve_bin FINSAFE_AGENT_BIN finsafe-agent 'install finsafe-fleet-v* to /usr/local/bin')"
  FINSAFE_AUTHORITY_HTTP_BIN="$(resolve_bin FINSAFE_AUTHORITY_HTTP_BIN finsafe-authority-http 'install finsafe-admin-server-v* to /usr/local/bin')"
  FINSAFE_BUNDLECTL_BIN="$(resolve_bin FINSAFE_BUNDLECTL_BIN finsafe-bundlectl 'install finsafe-bundlectl-v* to /usr/local/bin')"
  export FINSAFE_BIN FINSAFE_AGENT_BIN FINSAFE_AUTHORITY_HTTP_BIN FINSAFE_BUNDLECTL_BIN
}

write_lab_env() {
  cat >"$ENV_FILE" <<EOF
# Generated by scripts/managed-lab.sh — source before manual finsafe commands.
export FINSAFE_LAB_DIR='$LAB_DIR'
export FINSAFE_AUTHORITY_URL='http://${BIND}'
export FINSAFE_AUTHORITY_BIND='${BIND}'
export FINSAFE_AUTHORITY_STATE_DIR='$AUTH_DIR'
export FINSAFE_AUTHORITY_PUBLIC_URL='http://${BIND}'
export FINSAFE_AUTHORITY_SIGNING_KEY='$AUTH_DIR/signing_key.bin'
export FINSAFE_LICENSE_PATH='$AUTH_DIR/license.jws'
export FINSAFE_MANAGED_STATE_DIR='$DESKTOP_DIR'
export FINSAFE_AGENT_SOCKET='$DESKTOP_DIR/agent.sock'
EOF
}

lab_path() {
  export PATH="/usr/local/bin:/opt/homebrew/bin:${HOME}/.local/bin:${PATH:-/usr/bin:/bin:/usr/sbin:/sbin}"
}

resolve_program() {
  local program="$1"
  if [[ "$program" == /* ]]; then
    [[ -x "$program" || -f "$program" ]] || fail "program not found: $program"
    printf '%s' "$program"
    return 0
  fi
  lab_path
  local resolved
  resolved="$(command -v "$program" 2>/dev/null || true)"
  [[ -n "$resolved" ]] || fail "cannot resolve \`$program\` on PATH — use an absolute path"
  printf '%s' "$resolved"
}

publish_bundle() {
  local policy="${1:-${FINSAFE_LAB_POLICY:-$DEFAULT_POLICY}}"
  [[ -f "$policy" ]] || fail "policy not found: $policy"
  require_jq
  [[ -f "$AUTH_DIR/signing_key.bin" ]] || fail "missing $AUTH_DIR/signing_key.bin — start authority first"
  export FINSAFE_AUTHORITY_SIGNING_KEY="$AUTH_DIR/signing_key.bin"
  export FINSAFE_AUTHORITY_PUBLIC_URL="http://${BIND}"
  local bundle_json="$LAB_DIR/bundle.json"
  local bundle_jws="$LAB_DIR/bundle.jws"
  "$FINSAFE_BUNDLECTL_BIN" bundle build --from "$policy" --out "$bundle_json"
  "$FINSAFE_BUNDLECTL_BIN" bundle sign --in "$bundle_json" --out "$bundle_jws"
  "$FINSAFE_BUNDLECTL_BIN" bundle publish \
    --in "$bundle_jws" \
    --authority "http://${BIND}"
  ok "published $(basename "$policy") to http://${BIND}"
  echo "    Agent pulls on bundle-rotated event (~1–2s) or next heartbeat (~60s). Use: $0 restart-agent to force."
}

start_authority() {
  if is_running "$AUTH_PID_FILE"; then
    fail "authority already running (pid $(cat "$AUTH_PID_FILE")). Run: $0 stop"
  fi
  require_license
  mkdir -p "$AUTH_DIR" "$DESKTOP_DIR/cache" "$DESKTOP_DIR/audit"
  free_authority_port "$(authority_bind_port "$BIND")"
  export FINSAFE_AUTHORITY_BIND="$BIND"
  export FINSAFE_AUTHORITY_PUBLIC_URL="http://${BIND}"
  export FINSAFE_AUTHORITY_STATE_DIR="$AUTH_DIR"
  export FINSAFE_AUTHORITY_DB="${FINSAFE_AUTHORITY_DB:-$AUTH_DIR/authority.db}"
  export FINSAFE_LICENSE_PATH="$AUTH_DIR/license.jws"
  export FINSAFE_AUTHORITY_SIGNING_KEY="${FINSAFE_AUTHORITY_SIGNING_KEY:-$AUTH_DIR/signing_key.bin}"
  export FINSAFE_ADMIN_TOKENS_PATH="${FINSAFE_ADMIN_TOKENS_PATH:-$AUTH_DIR/admin_tokens}"
  log "starting finsafe-authority-http on http://${BIND}"
  spawn_detached "$AUTH_PID_FILE" "$AUTH_LOG" \
    env RUST_LOG="${RUST_LOG:-info}" \
    "$FINSAFE_AUTHORITY_HTTP_BIN"
  wait_authority_healthy "http://${BIND}" "$(cat "$AUTH_PID_FILE")"
  [[ -f "$AUTH_DIR/signing_key.bin" ]] || fail "authority did not create signing_key.bin — see $AUTH_LOG"
  local st
  st="$(curl -sf "http://${BIND}/v1/license/status" | jq -r .status)"
  [[ "$st" == "valid" ]] || fail "license status expected valid, got: $st (check FINSAFE_LICENSE_PATH)"
  ok "authority licensed ($st)"
}

start_agent() {
  if is_running "$AGENT_PID_FILE"; then
    kill "$(cat "$AGENT_PID_FILE")" 2>/dev/null || true
    wait "$(cat "$AGENT_PID_FILE")" 2>/dev/null || true
    rm -f "$AGENT_PID_FILE"
  fi
  rm -f "$DESKTOP_DIR/agent.sock"
  export FINSAFE_AUTHORITY_URL="http://${BIND}"
  export FINSAFE_MANAGED_STATE_DIR="$DESKTOP_DIR"
  export FINSAFE_AGENT_SOCKET="$DESKTOP_DIR/agent.sock"
  if [[ ! -f "$DESKTOP_DIR/enrolled.json" ]]; then
    log "enrolling device $DEVICE_ID"
    local token
    token="$(curl -sf -X POST "http://${BIND}/v1/enroll/token" | jq -r .token)"
    [[ -n "$token" && "$token" != "null" ]] || fail "enroll token missing — is the license valid?"
    export FINSAFE_ENROLL_TOKEN="$token"
    export FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID="$DEVICE_ID"
    spawn_detached "$AGENT_PID_FILE" "$AGENT_LOG" "$FINSAFE_AGENT_BIN"
    for _ in $(seq 1 50); do
      [[ -f "$DESKTOP_DIR/enrolled.json" ]] && break
      sleep 0.2
    done
    unset FINSAFE_ENROLL_TOKEN
    unset FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID
    [[ -f "$DESKTOP_DIR/enrolled.json" ]] || fail "enroll failed — see $AGENT_LOG"
    ok "enrolled ($DESKTOP_DIR/enrolled.json)"
    kill "$(cat "$AGENT_PID_FILE")" 2>/dev/null || true
    wait "$(cat "$AGENT_PID_FILE")" 2>/dev/null || true
    rm -f "$AGENT_PID_FILE" "$DESKTOP_DIR/agent.sock"
  fi
  log "starting finsafe-agent"
  spawn_detached "$AGENT_PID_FILE" "$AGENT_LOG" "$FINSAFE_AGENT_BIN"
  for _ in $(seq 1 25); do
    agent_socket_reachable && break
    sleep 0.2
  done
  agent_socket_reachable || fail "agent socket not accepting connections — see $AGENT_LOG"
  ok "agent listening on $DESKTOP_DIR/agent.sock"
}

cmd_start() {
  local policy="${FINSAFE_LAB_POLICY:-$DEFAULT_POLICY}"
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --policy)
        shift
        policy="${1:?--policy requires path}"
        ;;
      *)
        fail "unknown start option: $1"
        ;;
    esac
    shift
  done
  case "$(uname -s)" in
    Darwin | Linux) ;;
    *) fail "managed-lab supports macOS and Linux only (got $(uname -s))" ;;
  esac
  require_jq
  ensure_bins
  mkdir -p "$LAB_DIR"
  start_authority
  publish_bundle "$policy"
  start_agent
  write_lab_env
  echo ""
  echo "FinSAFE managed lab is up."
  echo "  Admin:       http://${BIND}/admin/"
  echo "  State:       $LAB_DIR"
  echo "  CLI env:     source $ENV_FILE"
  echo "  Smoke run:   $0 run -- /usr/bin/true"
  echo "  Hermes:      publish hermes-version-smoke.yaml, then see docs/testing/managed-lab.md"
  echo "  Publish:     $0 publish --from examples/wrapper-policies/<name>.yaml"
  echo "  Stop:        $0 stop"
  echo ""
  echo "Policy iteration: publish → wait ~60s or restart-agent → run again."
}

cmd_stop() {
  stop_pid_file "$AGENT_PID_FILE" "finsafe-agent"
  stop_pid_file "$AUTH_PID_FILE" "finsafe-authority-http"
  rm -f "$DESKTOP_DIR/agent.sock"
  ok "lab stopped (state kept at $LAB_DIR)"
}

cmd_status() {
  echo "lab:       $LAB_DIR"
  echo "authority: http://${BIND}"
  if is_running "$AUTH_PID_FILE"; then
    echo "  authority pid: $(cat "$AUTH_PID_FILE") (running)"
    curl -sf "http://${BIND}/health" >/dev/null && echo "  health: ok" || echo "  health: FAIL"
  else
    echo "  authority: not running"
  fi
  if is_running "$AGENT_PID_FILE"; then
    echo "  agent pid: $(cat "$AGENT_PID_FILE") (running)"
  else
    echo "  agent: not running"
  fi
  if [[ -f "$DESKTOP_DIR/enrolled.json" ]]; then
    echo "  enrolled: yes"
  else
    echo "  enrolled: no"
  fi
  if [[ -S "$DESKTOP_DIR/agent.sock" ]] && ! agent_socket_reachable; then
    echo "  warning: stale agent.sock (run restart-agent or stop)"
  elif agent_socket_reachable; then
    echo "  agent socket: reachable"
  fi
  [[ -f "$ENV_FILE" ]] && echo "  env file: $ENV_FILE" || echo "  env file: (missing — run start)"
  echo "  logs: $AUTH_LOG, $AGENT_LOG"
}

cmd_env() {
  [[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE — run: $0 start"
  echo "$ENV_FILE"
}

cmd_publish() {
  ensure_bins
  local policy="${FINSAFE_LAB_POLICY:-$DEFAULT_POLICY}"
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --from)
        shift
        policy="${1:?--from requires path}"
        ;;
      *)
        fail "unknown publish option: $1 (try --from PATH)"
        ;;
    esac
    shift
  done
  is_running "$AUTH_PID_FILE" || fail "authority not running — run: $0 start"
  publish_bundle "$policy"
}

cmd_restart_agent() {
  ensure_bins
  is_running "$AUTH_PID_FILE" || fail "authority not running — run: $0 start"
  [[ -f "$DESKTOP_DIR/enrolled.json" ]] || fail "not enrolled — run: $0 start"
  start_agent
}

invoke_lab_finsafe() {
  local verb="$1"
  local usage_line="$2"
  shift 2
  [[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE — run: $0 start"
  ensure_bins
  require_managed_agent
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  lab_path
  local json_args=()
  if [[ "${1:-}" == "--json" ]]; then
    json_args=(--json)
    shift
  fi
  if [[ "${1:-}" == "--" ]]; then
    shift
  fi
  [[ $# -gt 0 ]] || fail "$usage_line"
  local resolved
  resolved="$(resolve_program "$1")"
  shift
  exec "$FINSAFE_BIN" "$verb" "${json_args[@]}" -- "$resolved" "$@"
}

cmd_run() {
  invoke_lab_finsafe run "usage: $0 run [--json] -- <program> [args...]"
}

cmd_interactive() {
  invoke_lab_finsafe self-confine "usage: $0 interactive [--json] -- <program> [args...]"
}

CMD="${1:-help}"
shift || true
case "$CMD" in
  start) cmd_start "$@" ;;
  stop) cmd_stop ;;
  status) cmd_status ;;
  env) cmd_env ;;
  publish) cmd_publish "$@" ;;
  restart-agent) cmd_restart_agent ;;
  run) cmd_run "$@" ;;
  interactive) cmd_interactive "$@" ;;
  help | -h | --help) usage ;;
  *) usage >&2; exit 2 ;;
esac
