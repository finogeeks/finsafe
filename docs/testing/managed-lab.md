# Managed mode local lab

**中文：** [managed-lab-zh.md](./managed-lab-zh.md)

Use **`scripts/managed-lab.sh`** to run a **full managed stack on one machine**: Policy Authority, enrolled `finsafe-agent`, and a shell env file for `finsafe run` / `finsafe self-confine`. It uses **release binaries** on `PATH` and keeps state under **`~/.finsafe-lab`** so pilots can validate managed mode without touching production fleet paths.

**Audience:** IT administrators and security engineers evaluating fleet + authority after installing from [GitHub Releases](https://github.com/finogeeks/finsafe/releases).

**Platforms:** macOS and Linux only (not Windows).

---

## What you get

| Piece | Role |
|-------|------|
| `finsafe-authority-http` | Local Policy Authority on `127.0.0.1:8095` (default) |
| `finsafe-agent` | Enrolled desktop agent under `~/.finsafe-lab/desktop/` |
| `lab.env` | Exports `FINSAFE_AUTHORITY_URL`, agent socket, license path, signing key |
| Admin UI | [http://127.0.0.1:8095/admin](http://127.0.0.1:8095/admin) |

Production paths (`/etc/finsafe`, `/var/lib/finsafe`) are **not** used. The lab keeps state under **`~/.finsafe-lab`** so pilots can delete it without touching fleet installs.

---

## Prerequisites

1. **Binaries on PATH** (or set `FINSAFE_*_BIN` overrides):

   | Archive | Binaries |
   |---------|----------|
   | `finsafe-admin-server-v*` | `finsafe-authority-http` |
   | `finsafe-fleet-v*` | `finsafe`, `finsafe-agent` |
   | `finsafe-bundlectl-v*` | `finsafe-bundlectl` |

   See [binary-reference.md](../binary-reference.md) and [install-fleet.sh](../../install-fleet.sh) for pilot install.

2. **`jq`** and **`curl`**.

3. **Finogeeks-issued `license.jws`** — required for enrollment and bundle APIs. Obtain from Finogeeks; see [authority-deployment.md](../authority-deployment.md#21-commercial-license-managed-mode).

4. **Python 3** (stdlib only) — used to probe the agent Unix socket.

---

## Quick start

From a checkout of [finogeeks/finsafe](https://github.com/finogeeks/finsafe) (or any directory where you copied `scripts/managed-lab.sh` and `examples/`):

```bash
export FINSAFE_LICENSE_PATH=/path/to/license.jws

./scripts/managed-lab.sh start
source "$(./scripts/managed-lab.sh env)"

./scripts/managed-lab.sh run -- /usr/bin/true
./scripts/managed-lab.sh run --json -- /usr/bin/true | jq '.envelope.policy_source, .envelope.inner.exit_code'
```

Stop when finished (state is kept for the next session):

```bash
./scripts/managed-lab.sh stop
```

---

## Commands

| Command | Purpose |
|---------|---------|
| `start [--policy PATH]` | Authority + publish default (or given) bundle + enroll + write `lab.env` |
| `stop` | Stop agent and authority |
| `status` | PIDs, health, enrollment, log paths |
| `env` | Print `lab.env` path for `source` |
| `publish --from PATH` | Build/sign/publish a new bundle |
| `restart-agent` | Restart agent after publish (faster than waiting for heartbeat) |
| `run [--json] -- <prog> [args…]` | Managed short-lived run |
| `interactive [--json] -- <prog> [args…]` | Managed interactive (`self-confine`) |

**Environment overrides:**

| Variable | Default |
|----------|---------|
| `FINSAFE_LICENSE_PATH` | _(required for `start`)_ |
| `FINSAFE_LAB_DIR` | `~/.finsafe-lab` |
| `FINSAFE_LAB_BIND` | `127.0.0.1:8095` |
| `FINSAFE_LAB_DEVICE_ID` | `lab-desktop-1` |
| `FINSAFE_LAB_POLICY` | `examples/wrapper-policies/managed-lab-smoke.yaml` |

---

## Policy iteration workflow

1. Edit or choose a wrapper YAML under `examples/wrapper-policies/`.
2. Publish:

   ```bash
   ./scripts/managed-lab.sh publish --from examples/wrapper-policies/hermes-version-smoke.yaml
   ```

3. Wait for the agent to pull (~60s on heartbeat) **or** force:

   ```bash
   ./scripts/managed-lab.sh restart-agent
   ```

4. Run again and compare digests:

   ```bash
   ./scripts/managed-lab.sh run --json -- /usr/bin/true | jq '.envelope | {bundle_digest, wrapper_policy_digest}'
   ```

Default **`managed-lab-smoke.yaml`** allows `/usr/bin/true` and minimal FHS paths. It does **not** allow Homebrew, `~/.local/bin`, or `~/.hermes`.

---

## Hermes on macOS

Under managed `run`, macOS clears the child environment inside Seatbelt. Hermes needs explicit **`HOME`** and **`PATH`** via `/usr/bin/env`, and a bundle that allows those paths.

1. Publish `hermes-version-smoke.yaml` (see comments at the top of that file).
2. `restart-agent` (or wait ~60s).
3. Run:

   ```bash
   ./scripts/managed-lab.sh run -- \
     /usr/bin/env HOME="$HOME" \
     PATH="/opt/homebrew/bin:$HOME/.local/bin:/usr/bin:/bin" \
     hermes --version
   ```

Bare `run -- hermes --version` resolves `hermes` on the **host** PATH but the sandboxed child still needs the env wrapper and matching policy. See [managed-cli-authority-connectivity.md](../managed-cli-authority-connectivity.md).

Interactive Hermes REPL:

```bash
./scripts/managed-lab.sh publish --from examples/wrapper-policies/hermes-interactive.yaml
./scripts/managed-lab.sh restart-agent
./scripts/managed-lab.sh interactive -- \
  /usr/bin/env HOME="$HOME" PATH="/opt/homebrew/bin:$HOME/.local/bin:/usr/bin:/bin" hermes
```

---

## Lab vs production fleet

| Topic | Local lab | Production fleet |
|-------|-----------|------------------|
| State | `~/.finsafe-lab` | `/etc/finsafe`, `/var/lib/finsafe` |
| Authority bind | `127.0.0.1:8095` | Your HTTPS Policy Authority |
| Sentinel | Not installed | `managed-required.json` via MDM |
| Binaries | Release archives on `PATH` | Same, fixed install paths |

---

## Troubleshooting

| Symptom | What to do |
|---------|------------|
| `usage: … run [--json] -- <program>` on every `run` | Upgrade to a script that forwards args (`cmd_run … "$@"`). Smoke: `./scripts/managed-lab.sh run -- /usr/bin/true` |
| Admin UI 404 at `/admin/` but `/admin` works | Open **`http://<bind>/admin`** (no trailing slash). Root `/` redirects there. Rebuild authority if an older binary lacks the `/admin/` route. |
| Empty audit / runs in Admin UI | Rebuild **`finsafe`** with the `managed` feature (enterprise packages do). Run `./scripts/managed-lab.sh run -- /usr/bin/true`, wait ~2s for agent upload, refresh Admin. Check `enrolled.json` **`authority_url`** is reachable from the agent (not `http://0.0.0.0:…`). Inspect spool: `$FINSAFE_LAB_DIR/desktop/audit/*.ndjson`. |
| `license status expected valid` | Check `FINSAFE_LICENSE_PATH`, seats, and expiry — `curl -s http://127.0.0.1:8095/v1/license/status \| jq` |
| `MANAGED_DAEMON_UNREACHABLE` | `./scripts/managed-lab.sh status`; `stop` then `start`, or `restart-agent` |
| Hermes `env: hermes: No such file` | Still on `managed-lab-smoke` bundle — publish `hermes-version-smoke.yaml` and restart agent |
| Port in use | Change `FINSAFE_LAB_BIND` or stop the other authority |

---

## Related docs

- [managed-mode.md](../managed-mode.md) — architecture and production paths
- [authority-deployment.md](../authority-deployment.md) — authority + license + bundlectl
- [managed-mode-macos-runbook.md](./managed-mode-macos-runbook.md) — production Mac fleet steps
- [licensing-e2e-macos.md](./licensing-e2e-macos.md) — license verification checklist
