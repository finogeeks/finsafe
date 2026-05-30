# Managed mode: CLI, agent, and Policy Authority connectivity

**中文：** [managed-cli-authority-connectivity-zh.md](./managed-cli-authority-connectivity-zh.md)

This document explains how **`finsafe`** behaves on fleet desktops when **managed mode** is active (MDM **sentinel**, device **enrollment**, or both). It complements the shorter overview in [managed-mode.md](./managed-mode.md) with connection topology, discovery rules, and implementation references.

**Audience:** enterprise IT, security architects, integrators debugging `MANAGED_DAEMON_UNREACHABLE` or enrollment issues.

**Related:** [enterprise-deployment-runbook.md](./enterprise-deployment-runbook.md) · [endpoint-deployment-options.md](./endpoint-deployment-options.md) · [authority-deployment.md](./authority-deployment.md) · [mdm/README.md](./mdm/README.md)

---

## Core principle

In fleet / sentinel mode, **`finsafe` does not call the Policy Authority over HTTPS**.

| Component | Talks to Policy Authority? | Talks to `finsafe-agent`? |
|-----------|----------------------------|---------------------------|
| **`finsafe` CLI** | No | Yes (local IPC only) |
| **`finsafe-agent`** | Yes (enroll, JWKS, bundles, heartbeat, audit) | N/A (server side of IPC) |
| **MDM / IT** | Deploys sentinel + sets agent env | Installs and starts agent service |

Policy governance is enforced by:

1. **On-disk markers** — sentinel and/or enrollment file force managed behavior in the CLI.
2. **`finsafe-agent`** — pulls signed bundles from the authority, caches them, selects bindings per program/user/group.
3. **Local IPC** — CLI obtains the effective wrapper policy from the agent before launching the sandbox.

---

## Architecture

```text
  MDM / IT
    │  installs: finsafe, finsafe-agent, managed-required.json
    │  sets on agent service: FINSAFE_AUTHORITY_URL
    │  one-time: FINSAFE_ENROLL_TOKEN + FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID
    ▼
┌─────────────────────────────────────────────────────────────┐
│  Employee desktop                                            │
│                                                              │
│  finsafe run -- <program>  ──IPC──►  finsafe-agent            │
│       │                                  │                   │
│       │ (no HTTPS to authority)          │ HTTPS             │
│       │                                  ▼                   │
│       │                    Policy Authority                  │
│       │                    (finsafe-authority-http)         │
│       │                    • /.well-known/finsafe/jwks.json  │
│       │                    • /v1/enroll                      │
│       │                    • /v1/bundles/current             │
│       │                    • /v1/heartbeats                  │
│       │                    • /v1/audit/events                │
│       ▼                                                      │
│  sandbox (Seatbelt / bwrap+seccomp+Landlock / Windows)       │
└─────────────────────────────────────────────────────────────┘
```

This matches the recap in [enterprise-deployment-runbook.md](./enterprise-deployment-runbook.md#1-architecture-recap).

---

## How the CLI knows it is governed

Managed mode is inferred from **local filesystem state**, not from a live authority probe in the CLI.

### Signals

| Signal | Production path (Linux/macOS) | Windows |
|--------|------------------------------|---------|
| **Managed-required sentinel** | `/etc/finsafe/managed-required.json` | `C:\ProgramData\FinSAFE\managed-required.json` |
| **Enrollment marker** | `/etc/finsafe/enrolled.json` | `C:\ProgramData\FinSAFE\enrolled.json` |

**Sentinel** is a compact JWS (or JSON wrapper with a `jws` field) signed by operations (`finsafe-bundlectl sentinel sign`). Payload type: `ManagedRequiredSentinelV1` (`crates/finsafe-bundle/src/sentinel.rs`), including:

- `authority_url` — expected authority base URL (signed metadata for fleet attestation; see [Sentinel vs agent URL](#sentinel-vs-agent-authority-url) below)
- `jwks_thumbprint` — pins the authority signing key set
- `org_domain`, `expected_binary_digests`, `issued_at`, `expires_at`

**Enrollment** is written by the agent after successful `POST /v1/enroll` (or dev bootstrap). Record type: `EnrollmentRecordV1` (`crates/finsafe-agent/src/enroll.rs`): `device_id`, `authority_url`, `jwks_thumbprint`.

### CLI decision logic

Implemented in `crates/finsafe-cli/src/managed.rs` (`detect_run_mode`) and `crates/finsafe-cli/src/cli.rs` (`managed_implicit_for`):

- If **sentinel exists** or **`enrolled.json` exists**, and the user did **not** pass `--personal`, wrapper runs use **managed** policy resolution (no local `--policy`).
- **`--personal`** is **rejected** when the sentinel is present (`MANAGED_FORCED_BY_POLICY`).
- Local **`--policy`** or global wrapper policy files are **rejected** when managed (`MANAGED_POLICY_LOCAL_OVERRIDE`).

Either sentinel **or** enrollment alone is enough to enter managed mode for the CLI.

### Test / harness override

Set **`FINSAFE_MANAGED_STATE_DIR`** to redirect sentinel, enrollment, agent socket, cache, and audit paths under one directory. [`scripts/managed-lab.sh`](../scripts/managed-lab.sh) uses this pattern under `~/.finsafe-lab` for pilots.

---

## How the CLI connects (to the agent only)

When managed and no local policy file is supplied, `finsafe` loads policy via the agent (`crates/finsafe-cli/src/main.rs` → `load_wrapper_policy_managed`):

1. **`verify_daemon_challenge()`** — proves the IPC peer is the real agent (nonce + device-key signature over UDS/pipe).
2. **`resolve_managed_policy(program, argv, user, groups)`** — sends `GetEffectivePolicy`; receives `WrapperPolicyV1` plus bundle metadata (`bundle_id`, `run_token`, etc.).

Audit label for managed policy: `managed://finsafe-agent`.

### IPC endpoints

| Platform | Default | Override |
|----------|---------|----------|
| Linux/macOS | `/run/finsafe-agent.sock` | `FINSAFE_AGENT_SOCKET` |
| Windows | `\\.\pipe\finsafe-agent` | `FINSAFE_AGENT_SOCKET` (pipe name) |

Protocol: newline-delimited JSON (`finsafe_agent::protocol`). Client: `finsafe_agent::client::exchange` (`crates/finsafe-cli/src/managed.rs`).

### Typical CLI errors (connectivity-related)

| Code | Meaning |
|------|---------|
| `MANAGED_DAEMON_UNREACHABLE` | Socket/pipe missing, connect failure, read timeout, or challenge failed |
| `MANAGED_FORCED_BY_POLICY` | Sentinel blocks `--personal` or agent rejected override |
| `MANAGED_POLICY_LOCAL_OVERRIDE` | `--policy` / global wrapper file used while managed |
| `MANAGED_BUNDLE_EXPIRED` / `POLICY_DENIED` | Returned via agent when no active bundle or binding mismatch |

Full table: [managed-mode.md#cli-errors](./managed-mode.md#cli-errors).

---

## How the agent locates and connects to the authority

Only **`finsafe-agent`** uses HTTPS toward the Policy Authority.

### Authority base URL

| Source | When it applies |
|--------|-----------------|
| **`FINSAFE_AUTHORITY_URL`** on the **agent process** | Primary configuration (systemd `Environment=`, LaunchDaemon plist, Intune script). Default in code if unset: `http://127.0.0.1:8090` (development only). |
| **`enrolled.json` → `authority_url`** | Persisted after enroll API response or bootstrap save |
| **Env override on load** | If `FINSAFE_AUTHORITY_URL` is non-empty when the agent reads `enrolled.json`, it **overrides** the stored URL (`load_enrollment` in `enroll.rs`) |

Production IT should set **`FINSAFE_AUTHORITY_URL`** on the agent service to the same public base URL used when signing the sentinel (`FINSAFE_AUTHORITY_PUBLIC_URL` in `finsafe-bundlectl`). Use the **root URL only** — no `/v1/...` suffix.

Example: `https://gov.example.com/policy-authority`

### Sentinel vs agent authority URL

The sentinel JWS includes an `authority_url` field for **signed fleet metadata** and thumbprint pinning at agent startup. The agent **does not** currently read `authority_url` from the verified sentinel to choose its HTTP target; HTTP uses **`FINSAFE_AUTHORITY_URL`** and **`enrolled.json`** as above.

Operations must keep sentinel signing URL and agent env **aligned**. See [finsafe-bundlectl SKILL](./../skills/finsafe-bundlectl/SKILL.md).

### First-time enrollment

On agent startup (`crates/finsafe-agent/src/runtime.rs`):

1. If **`enrolled.json` exists** — load record, fetch JWKS from authority, refresh bundle cache from disk.
2. Else if **`FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID`** is set:
   - With **`FINSAFE_ENROLL_TOKEN`**: `POST {authority}/v1/enroll` → write `enrolled.json`.
   - Without token (dev only): write minimal `enrolled.json` using `config.authority_url`.
3. Else — agent serves IPC but may have no bundle until enrollment.

MDM pattern: issue one-time enroll token, inject token + device id into install script, remove token after `enrolled.json` exists ([mdm/README.md](../packaging/mdm/README.md)).

### Ongoing authority HTTP API

| Purpose | Method and path |
|---------|-----------------|
| Trust / verify bundles | `GET {authority}/.well-known/finsafe/jwks.json` |
| Current bundle for device | `GET {authority}/v1/bundles/current` (header `X-Device-ID`) |
| Heartbeat, tamper, kill-switch | `POST {authority}/v1/heartbeats` |
| Audit upload | `POST {authority}/v1/audit/events` |

Default intervals (`AgentConfig`): bundle pull ~300s; heartbeat ~60s (pull may also run on heartbeat ticks when pull interval is longer).

---

## Sentinel vs enrollment (operator view)

| Artifact | Who writes it | CLI effect | Agent effect |
|----------|---------------|------------|--------------|
| **`managed-required.json`** | MDM (`finsafe-bundlectl sentinel sign`) | Forces managed mode; blocks `--personal` when present | Verifies JWS at startup; pins JWKS thumbprint; heartbeats report `managed_required_sentinel_present` |
| **`enrolled.json`** | Agent after `/v1/enroll` | Enables managed mode if sentinel absent | Stores `device_id` and `authority_url`; enables pull/heartbeat/audit |

**Recommended production:** deploy **both** — sentinel for tamper-resistant “must be managed,” enrollment for device identity and bundle distribution.

---

## End-to-end: `finsafe run` on a fleet laptop

1. Application or user invokes `finsafe run -- /path/to/app` (no `--policy`).
2. CLI checks sentinel and/or `enrolled.json` → **managed** (unless `--personal` and policy allows — sentinel blocks personal).
3. CLI connects to **`/run/finsafe-agent.sock`** (or Windows pipe).
4. CLI runs **UDS challenge**, then **`GetEffectivePolicy`** for program, argv0, user, groups, OS.
5. Agent verifies sentinel (if present), checks kill-switch, selects binding from **cached signed bundle**, returns policy + `run_token`.
6. CLI expands filesystem templates, applies wrapper + host profile, runs payload inside sandbox.
7. In parallel (background): agent pulls bundles and sends heartbeats to authority using `enrolled.json` + `FINSAFE_AUTHORITY_URL`.

---

## Configuration checklist (IT)

| Item | Where | Notes |
|------|-------|-------|
| Authority reachable | Network / TLS ingress | Clients need HTTPS to public base URL |
| `FINSAFE_AUTHORITY_URL` | Agent service env | Same URL as `FINSAFE_AUTHORITY_PUBLIC_URL` when signing sentinel |
| Sentinel JWS | `/etc/finsafe/managed-required.json` | From `finsafe-bundlectl sentinel sign` |
| Agent service running | systemd / launchd / Windows Service | Socket/pipe must exist before CLI managed runs |
| One-time enroll | `FINSAFE_ENROLL_TOKEN`, device id | Until `enrolled.json` present |
| Commercial license | Authority host `/etc/finsafe/license.jws` | Finogeeks-issued; gates fleet APIs |

Verification scripts: [`packaging/scripts/check-authority-health.sh`](../scripts/check-authority-health.sh) · [authority-deployment.md §5](./authority-deployment.md#5-verification).

---

## Code references (source repository)

| Topic | Location |
|-------|----------|
| Managed paths | `crates/finsafe-bundle/src/paths.rs` |
| Sentinel schema / verify | `crates/finsafe-bundle/src/sentinel.rs` |
| CLI managed IPC | `crates/finsafe-cli/src/managed.rs` |
| CLI run / policy load | `crates/finsafe-cli/src/main.rs` |
| Agent config / URL | `crates/finsafe-agent/src/config.rs` |
| Enrollment | `crates/finsafe-agent/src/enroll.rs` |
| Agent startup, pull, heartbeat | `crates/finsafe-agent/src/runtime.rs`, `pull.rs`, `heartbeat.rs` |
| Agent RPC / policy selection | `crates/finsafe-agent/src/rpc.rs` |

---

## See also

- [managed-mode.md](./managed-mode.md) — components, paths table, quick start
- [sandbox-management-model.md](./sandbox-management-model.md) — bundles, groups, assignments
- [endpoint-deployment-options.md](./endpoint-deployment-options.md) — MDM vs Ansible vs central-only
- [testing/managed-mode-matrix.md](./testing/managed-mode-matrix.md) — acceptance tests
