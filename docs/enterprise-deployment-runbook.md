# Enterprise deployment runbook (managed mode)

**中文：** [enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md)

This runbook is for IT / security operators rolling out FinSAFE fleet-wide. It complements the architecture overview in [managed-mode.md](./managed-mode.md) with phased procedures, verification steps, and rollback.

**Audience:** platform engineering, endpoint management (Jamf / Intune / Ansible), security operations.

**Out of scope:** developers using personal `finsafe run --policy file.yaml` on unmanaged laptops (unchanged).

---

## 1. Architecture recap

```text
                    ┌─────────────────────────────┐
                    │  finsafe-authority (HTTPS)   │
                    │  • JWKS, bundles, enroll     │
                    │  • kill-switch, audit ingest │
                    └──────────────┬──────────────┘
                                   │ pull / heartbeat / audit
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
   ┌───────────┐            ┌───────────┐            ┌───────────┐
   │ Desktop A │            │ Desktop B │            │ Desktop C │
   │ agent+CLI │            │ agent+CLI │            │ agent+CLI │
   └───────────┘            └───────────┘            └───────────┘
```

On each desktop:

1. **MDM** installs binaries + `managed-required` sentinel + starts `finsafe-agent`.
2. **Agent** enrolls once, caches signed bundles, serves policy on `/run/finsafe-agent.sock`.
3. **CLI** (`finsafe run -- …`) resolves policy only from the agent when managed.

---

## 2. Prerequisites

| Requirement | Notes |
|---------------|--------|
| Policy Authority URL | HTTPS, reachable from managed clients; e.g. `https://gov.example.com/policy-authority` |
| Signing key custody | Ed25519 key used by `finsafe-bundlectl`; prefer HSM or locked ops host |
| MDM | Jamf Pro, Microsoft Intune, or config management (Ansible) with root/admin deploy |
| Approved wrapper policies | Source YAML reviewed by security; built into bundles |
| Device identity | Stable `device_id` per machine (MDM serial, hostname policy, or asset tag) |

**Supported platforms (v1):** Linux and macOS desktops. Windows host sandbox is not in managed-mode v1.

---

## 3. Phase A — Deploy Policy Authority (central)

### A.1 Install and configure

See [authority-deployment.md](./authority-deployment.md) for the full authority installation guide, including binary install, data directory setup, signing key management, and service units. **Binary suite reference:** [binary-reference.md](./binary-reference.md).

Summary:

1. Install **`finsafe-authority-http`** and **`finsafe-bundlectl`** from the **admin archive** (`finsafe-admin-v*…tar.zst`) on a hardened Linux host (see [README](../README.md#enterprise-admin-binaries)).
2. Install **commercial `license.jws`** on the authority host before enabling fleet enroll or admin APIs — [authority-deployment.md §2.1](./authority-deployment.md#21-commercial-license-managed-mode).
3. Set environment:

   | Variable | Example |
   |----------|---------|
   | `FINSAFE_AUTHORITY_BIND` | `0.0.0.0:8090` (behind reverse proxy) |
   | `FINSAFE_AUTHORITY_DB` | `/var/lib/finsafe-authority/authority.db` |
   | `FINSAFE_AUTHORITY_PUBLIC_URL` | `https://gov.example.com/policy-authority` |
   | `FINSAFE_LICENSE_PATH` | `/etc/finsafe/license.jws` |
   | Signing key | `FINSAFE_AUTHORITY_SIGNING_KEY` or auto-generated under `/var/lib/finsafe-authority/` |

4. Terminate TLS at ingress; do not expose admin APIs to the public internet without SSO / IP allowlist.
5. Run authority **verification** (health, license status, enroll token, JWKS) — [authority-deployment.md §5](./authority-deployment.md#5-verification).

### A.2 Publish initial policy bundle

On an **operator workstation** (not end-user machines):

```bash
export FINSAFE_AUTHORITY_PUBLIC_URL=https://gov.example.com/policy-authority
export FINSAFE_ORG_DOMAIN=example.com

finsafe-bundlectl bundle build \
  --from ../examples/wrapper-policies/hermes-interactive.yaml \
  --out /secure/bundles/draft-v1.json

finsafe-bundlectl bundle sign --in /secure/bundles/draft-v1.json --out /secure/bundles/bundle-v1.jws
finsafe-bundlectl bundle publish --jws /secure/bundles/bundle-v1.jws --authority "$FINSAFE_AUTHORITY_PUBLIC_URL"
```

Record: `bundle_id`, `version`, digest, and JWKS thumbprint from `/.well-known/finsafe/jwks.json`.

### A.3 Sign managed-required sentinel

```bash
finsafe-bundlectl sentinel sign --out /secure/mdm/managed-required.jws
```

This JWS file is what MDM pushes to `/etc/finsafe/managed-required.json` on every fleet machine.

### A.4 Verification (authority)

| Check | Command / action |
|-------|------------------|
| Health | `curl -sf "$FINSAFE_AUTHORITY_PUBLIC_URL/health"` |
| License | `curl -sf "$FINSAFE_AUTHORITY_PUBLIC_URL/v1/license/status"` — expect `valid` or `grace` |
| Enroll token (licensed) | `curl -sf -X POST "$FINSAFE_AUTHORITY_PUBLIC_URL/v1/enroll/token"` — must not be `402` |
| JWKS | `curl -sf "$FINSAFE_AUTHORITY_PUBLIC_URL/.well-known/finsafe/jwks.json"` |
| Current bundle | `curl -sf "$FINSAFE_AUTHORITY_PUBLIC_URL/v1/bundles/current"` |
| Admin UI | Open `$FINSAFE_AUTHORITY_PUBLIC_URL/admin/` — see [admin-ui.md](./admin-ui.md) for reference |

Pilot **desktop** checks after Phase D: [binary-reference.md § Verify managed mode](./binary-reference.md#verify-managed-mode-is-working-production-checklist).

---

## 4. Phase B — Package client binaries

### B.1 Build or obtain packages

Ship to a **fixed path** on all platforms. See [binary-reference.md](./binary-reference.md) for release archives and the Linux vs macOS matrix.

| Binary | Linux path | macOS path | Source |
|--------|------------|------------|--------|
| `finsafe` | `/usr/local/bin/finsafe` | `/usr/local/bin/finsafe` | Public `finsafe-v*` archive (all platforms) |
| `finsafe-agent` | `/usr/local/bin/finsafe-agent` | `/usr/local/bin/finsafe-agent` | **`finsafe-fleet-v*`** release archive |
| `finsafe-helper` | `/usr/local/bin/finsafe-helper` | — | Public **Linux** `finsafe-v*` archive (sibling of `finsafe`) |
| `finsafe-supervisor` | `/usr/local/bin/finsafe-supervisor` | — | Public **Linux** `finsafe-v*` archive |
| `finsafe-landlock-shim` | `/usr/local/bin/finsafe-landlock-shim` | — | Public **Linux** `finsafe-v*` archive |

On **Linux**, copy all four user-facing binaries into the same directory so `finsafe` auto-discovers companions. On **macOS**, only `finsafe` and `finsafe-agent` are required (Seatbelt is built into `finsafe`).

Heartbeats attest digests at `/usr/local/bin/finsafe` and `finsafe-agent`; do not use per-user `~/bin` installs in production.

### B.2 Install agent service

| OS | Unit file |
|----|-----------|
| Linux (systemd) | [`packaging/systemd/finsafe-agent.service`](../packaging/systemd/finsafe-agent.service) |
| macOS (LaunchDaemon) | [`packaging/launchd/com.finogeeks.finsafe-agent.plist`](../packaging/launchd/com.finogeeks.finsafe-agent.plist) |

Set `FINSAFE_AUTHORITY_URL` to your public authority URL (same origin clients use for enroll/pull).

### B.3 Fleet deployment guides

| Situation | Document |
|-----------|----------|
| **Any tool** (no Jamf/Intune required) | [mdm/vendor-neutral-checklist.md](./mdm/vendor-neutral-checklist.md) |
| Jamf Pro | [mdm/jamf.md](./mdm/jamf.md) |
| Microsoft Intune | [mdm/intune.md](./mdm/intune.md) |
| Ansible / bare metal | [mdm/ansible.md](./mdm/ansible.md) |

Example payloads live under [`packaging/mdm/examples/`](../packaging/mdm/examples/).

---

## 5. Phase C — Force managed mode (sentinel)

Deploy the signed sentinel from Phase A.3:

- **Path:** `/etc/finsafe/managed-required.json`
- **Content:** single-line compact JWS (not pretty-printed JSON policy)
- **Ownership:** `root:wheel` or `root:root`, mode `0644` or stricter
- **Immutability:** use MDM “locked” file delivery where available

**Effect:** `finsafe` CLI enters managed mode; `--personal` and local `--policy` are rejected.

**Verify on a pilot device:**

```bash
test -f /etc/finsafe/managed-required.json && echo sentinel-ok
finsafe run --personal -- /usr/bin/true 2>&1 | grep -q MANAGED_FORCED_BY_POLICY
```

---

## 6. Phase D — Enrollment (one-time per device)

### D.1 Issue token (IT)

**Admin UI:** `POST /v1/enroll/token` (button in `/admin/`)  
**Or CLI:**

```bash
curl -s -X POST "$FINSAFE_AUTHORITY_PUBLIC_URL/v1/enroll/token"
```

Copy `token` (short-lived JWS). Treat as a secret; single use per device or batch window.

### D.2 Deliver token to agent (MDM, first boot only)

Set on the **agent service** environment (not user shell profile):

| Variable | Value |
|----------|--------|
| `FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID` | Stable id, e.g. `$(hostname -s)` or Jamf `$COMPUTERNAME` |
| `FINSAFE_ENROLL_TOKEN` | Token from D.1 |

Restart `finsafe-agent`. On success it writes `/etc/finsafe/enrolled.json`.

### D.3 Remove token from MDM

After pilot confirms enrollment:

1. Remove `FINSAFE_ENROLL_TOKEN` from the profile / unit file.
2. Redeploy profile so tokens are not left in inventory reports.
3. Keep `FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID` only if your playbooks require it (optional after enroll).

### D.4 Verification (desktop)

```bash
test -f /etc/finsafe/enrolled.json && jq . /etc/finsafe/enrolled.json
ls -la /run/finsafe-agent.sock
finsafe run --json -- /usr/bin/true | jq '.envelope.policy_source // empty'
```

Expect agent logs: bundle pull success; no repeated enroll failures.

---

## 7. Phase E — Application integration

Agent runtimes (FinClaw, Hermes, internal tools) should invoke:

```bash
finsafe run -- /path/to/runtime "$@"
```

**Do not** pass `--policy` on managed machines. Optional global wrapper policy in MDM is still a local file — prefer pure managed resolution.

Document for app teams:

- Exit code `2` — configuration / policy parse
- Exit code `3` — host unsupported or daemon unreachable
- JSON audit — use `--json` and ship `envelope` to your SIEM if needed

---

## 8. Ongoing operations

### 8.1 Policy updates

1. Edit approved YAML → build → sign → publish new bundle version.
2. Agents pull on interval / event; no per-desktop file push.
3. Test on a **canary** group MDM scope before production.

### 8.2 Kill switch

Admin UI or:

```bash
curl -X POST "$FINSAFE_AUTHORITY_PUBLIC_URL/v1/admin/kill-switch" \
  -H 'Content-Type: application/json' \
  -d '{"until":"2026-12-31T23:59:59Z"}'
```

Clears with `{"until":null}`.

### 8.3 Revoke device

```bash
curl -X POST "$FINSAFE_AUTHORITY_PUBLIC_URL/v1/admin/devices/DEVICE_ID/revoke"
```

Heartbeats return `revoke_device: true`; agent sets kill-switch locally.

### 8.4 Monitoring

| Signal | Source |
|--------|--------|
| Heartbeats | Authority DB / admin device list |
| `tamper_suspected` | Missing sentinel when `FINSAFE_AUTHORITY_REQUIRE_SENTINEL=1` |
| Binary digest mismatch | Heartbeat `binary_digests` vs release manifest |
| Audit | `POST /v1/audit/events` ingest; agent spool under `/var/lib/finsafe/audit/` |

### 8.5 Upgrades

1. Build new `finsafe` / `finsafe-agent` with unchanged paths.
2. Update MDM package; restart agent service.
3. Update expected digests in sentinel or release manifest if you pin binaries in sentinel.

---

## 9. Rollback

| Scenario | Action |
|----------|--------|
| Bad bundle published | Publish previous version or activate kill-switch; fix forward with new version |
| Sentinel too aggressive | Remove MDM sentinel profile (machines fall back to personal mode if not enrolled) |
| Agent broken | Stop unit; users on enrolled+sentinel machines cannot run until agent restored |
| Full uninstall | Remove sentinel, stop agent, remove packages, delete `/etc/finsafe` and `/var/lib/finsafe` |

**Warning:** Removing only the agent while sentinel remains causes `MANAGED_DAEMON_UNREACHABLE` (fail-closed).

---

## 10. Security boundaries

| Threat | Mitigation |
|--------|------------|
| User supplies own policy file | `MANAGED_POLICY_LOCAL_OVERRIDE` |
| User uses `--personal` | `MANAGED_FORCED_BY_POLICY` when sentinel/enrolled |
| Stale or forged bundle | JWS + JWKS pin at enroll; monotonic version |
| Fake agent on UDS | Ed25519 challenge (`UdsChallenge`) |
| Local administrator | **Not in scope** — can remove MDM, replace binaries |

See [§10 Security boundaries](#10-security-boundaries) in this runbook (desktop user as policy adversary).

---

## 11. Acceptance checklist (pilot → prod)

- [ ] Authority TLS and JWKS documented
- [ ] Bundle v1 published and bindings match pilot apps
- [ ] Sentinel deployed to pilot scope
- [ ] Enrollment token workflow tested; token removed after enroll
- [ ] `finsafe run -- <app>` succeeds; audit shows managed metadata
- [ ] Tamper cases from [managed-mode matrix](../testing/managed-mode-matrix.md) reviewed
- [ ] SIEM path for audit ingest defined
- [ ] Runbook owners and on-call rotation assigned

---

## Related documents

- [managed-mode.md](./managed-mode.md) — technical reference
- [mdm/](./mdm/) — Jamf, Intune, Ansible playbooks
- [packaging/mdm/](../packaging/mdm/) — example payloads
- [managed-mode-matrix.md](../testing/managed-mode-matrix.md) — acceptance tests
