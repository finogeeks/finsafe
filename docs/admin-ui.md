# Admin UI reference

**中文：** [admin-ui-zh.md](./admin-ui-zh.md)

The **FinSAFE Policy Authority admin console** is a React operator UI served at
`/admin/` on the authority host (embedded in `finsafe-authority-http` when built with
`embed-admin-ui`, or from `FINSAFE_ADMIN_UI_DIR`).

**URL (production):** `https://gov.example.com/policy-authority/admin/`  
**URL (local dev):** `http://127.0.0.1:8090/admin/`

> **Security:** Protect `/admin/` and `/v1/admin/*` at the reverse proxy (IP allowlist,
> SSO/OIDC, mTLS). Set admin tokens via `FINSAFE_ADMIN_TOKENS_PATH` or
> `--workdir/.../admin_tokens` and pass `X-Admin-Token` from the UI (Settings → General).

---

## Navigation

| Area | Purpose |
|------|---------|
| **Dashboard** | Fleet KPIs: device counts, denials and runs in the last 24h, live event feed. |
| **Devices** | Search/filter fleet; nested **Tags** and **Groups**; bulk-apply tags; view bundle and denial counts. |
| **Runs** | Managed run records ingested from audit. |
| **Audit** | Raw fleet audit events. |
| **Bundles** | Published policy bundles (signed policy sets); policy editor (guided + YAML). |
| **Assignments** | Connect published bundles to groups with rollout controls. |
| **Alerts** | Security-oriented audit kinds (including policy denials). |
| **Settings** | License/token and **kill switch**. |

**Recommended workflow:** define **tag presets** and **device groups** under **Devices → Tags** and **Devices → Groups**,
publish bundles, then assign bundles to groups on **Assignments**, and apply matching
tags on **Devices**. See the [sandbox management model](./sandbox-management-model.md).

---

## Settings → General

- **Commercial license** — `GET /v1/license/status` (`valid`, `missing`, `expired`, etc.).
- **Admin token** — stored in browser `localStorage`, sent as `X-Admin-Token`.

Protected APIs without a valid license return **`402 Payment Required`**.

---

## Devices → Tag presets

Browser-local catalog of allowed label names (e.g. `department:finance`,
`cohort:beta`). Export/import JSON to share across operators. Tags are applied on
**Devices**; the authority stores labels per device row.

---

## Devices → Device groups

Groups are **named device cohorts** defined by deterministic rules over trusted tags and
device facts. Assignment-targetable groups use an `all` rule: every required predicate
must match. Supported inputs include `admin:name=value` tags, authority-verified
`device:*` facts, `device_id`, and direct `not` exclusions. OR cases should be split
into separate groups.

Create groups here; assign matching `admin:*` tags on **Devices**. Use **Assignments**
to connect a published bundle to a group.

---

## HTTPS inspection (TLS terminate)

Optional commercial add-on (`mitm_tls_terminate` in `license.jws`). The Admin UI does not yet expose a dedicated CA wizard; use the admin API (same token as kill switch):

```bash
# After license includes mitm_tls_terminate
curl -X POST "$AUTHORITY/v1/admin/mitm/ca" -H "X-Admin-Token: $TOKEN"
curl -sf "$AUTHORITY/v1/admin/mitm/ca" -H "X-Admin-Token: $TOKEN" | jq -r '.cert_pem' | head -3
```

Publish bundles whose wrapper policies set `tls_terminate: true` (see **Bundles** policy editor or YAML). Full operator procedure: [https-inspection-runbook.md](./https-inspection-runbook.md).

---

## Settings → Kill switch

### What it is

The **kill switch** is an emergency fleet control. When active for a device, its
`finsafe-agent`:

1. **Blocks new managed runs** — `finsafe run` and managed `self-confine` cannot obtain
   policy (`KILL_SWITCH_ACTIVE` from the agent UDS).
2. **Ends in-flight sandboxes** — long-lived runs that watch the kill switch receive a
   terminate signal after a grace period (from bundle `on_rotation.grace_secs`, typically
   30s).

Agents **remain enrolled**; heartbeats continue so the console still shows device health.

### When to use it

| Scenario | Action |
|----------|--------|
| Bad bundle published | Activate kill switch → roll back or publish fix → clear switch. |
| Active incident / compromise investigation | Fleet-wide or scoped pause while retaining visibility. |
| Change freeze | Time-bounded `until` (1h / 4h / 24h or custom RFC3339). |

### When **not** to use it

| Instead use… | For… |
|--------------|------|
| **Revoke device** | Permanent removal of trust for one machine (`Devices` detail → Revoke). |
| **Policy / assignment rollout** | Normal deny rules (wrong program, network, labels). |
| **Tag + group targeting** | Gradual rollout, not emergency stop. |

### Scopes in the UI

- **Entire fleet** — global row in authority `kill_switch` table; returned on every
  device heartbeat as `kill_switch_until`.
- **Device group** — applies per-device kill switch rows for all devices matching the
  group's label filter.
- **Specific device IDs** — per-device rows only.

**Clear** sends `until: null` for the selected scope. Agents do **not** re-block on
that event; the next heartbeat is the source of truth (revoke/tamper can still keep
the device blocked). Per-device rows from a group activation must be cleared with the
same scope (or cleared fleet-wide when using **Entire fleet**).

Time-bounded `until` values **auto-lift** on heartbeat after expiry. Operators do not
need to click Clear for an elapsed 1h/4h/24h window; Clear is still required to stop a
kill switch before `until`. Resume is heartbeat-driven — **bundle pull does not** lift
an authority kill switch or revoke.

### API

```bash
# Read current rows
curl -sf -H "X-Admin-Token: $TOKEN" "$AUTHORITY/v1/admin/kill-switch" | jq .

# Activate fleet-wide for 1 hour (example time)
curl -X POST "$AUTHORITY/v1/admin/kill-switch" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: $TOKEN" \
  -d '{"until":"2026-05-23T21:00:00Z","scope":{"kind":"all"}}'

# Scoped to one device
curl -X POST "$AUTHORITY/v1/admin/kill-switch" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: $TOKEN" \
  -d '{"until":"2026-05-23T21:00:00Z","scope":{"kind":"device_ids","device_ids":["mac-hermes-1"]}}'

# Clear fleet-wide
curl -X POST "$AUTHORITY/v1/admin/kill-switch" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: $TOKEN" \
  -d '{"until":null,"scope":{"kind":"all"}}'
```

Requires license feature `kill_switch`. SSE event: `{"type":"kill-switch","until":...}`.

See also [enterprise-deployment-runbook.md § Kill switch](./enterprise-deployment-runbook.md#82-kill-switch).

---

## Devices

Lists enrolled devices with filters (status, tag, group, search), pagination, and bulk
tagging. Define tags under **Devices → Tags** first.

| Column | Meaning |
|--------|---------|
| **Device** | `device_id` from enrollment (`FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID`). |
| **Status** | `healthy`, `stale` (no heartbeat within `device_stale_after_secs`, default 5m), `revoked`, etc. |
| **Tags** | Labels on the device; drive group membership and bundle `match_spec.groups`. |
| **Bundle** | Last bundle id/version reported in the agent heartbeat; link to bundle detail when known. **Not reported** = no bundle in last heartbeat. |
| **Last seen** | Relative and absolute last heartbeat time. |
| **Denials 24h** | Count of **policy denial** audit events for this device in the last 24 hours (see below). |

**Revoke** is on the device detail page; revoked devices get `revoke_device: true` on
heartbeat and enter a local kill-switch-like state on the agent. After unrevoke, the
next heartbeat clears that block without requiring an agent restart.

```bash
curl -sf -H "X-Admin-Token: $TOKEN" "$AUTHORITY/v1/admin/devices?limit=50" | jq .
```

---

## Policy denials (“Denials 24h”)

### What it means

A **policy denial** is a managed-mode audit event (`kind: policy_denied`) meaning
FinSAFE **refused** a managed execution attempt under the active authority bundle—not
a generic OS error or a kill switch.

Typical causes (reported in audit `reason` when emitted):

- **No binding match** — e.g. user ran `curl` but the bundle only binds `hermes`.
- **Kill switch active** — emergency pause (may also surface as `KILL_SWITCH_ACTIVE` before audit).
- **Runtime policy block** — sandbox/network/filesystem rules denied the action (when wired to audit).

The **Devices → Denials 24h** column and **Dashboard → Denials (24h)** count events
stored in the authority database from `POST /v1/audit/events` (agent uploads spooled
audit from managed `finsafe run` and managed `finsafe self-confine`).

### When to use this metric

| Signal | Interpretation |
|--------|----------------|
| Sudden spike on one device | Misconfigured bundle binding, wrong tags, or users launching non-approved tools. |
| Fleet-wide increase after rollout | New bundle too strict; check **Alerts** and audit `reason` fields. |
| Always zero | No denials recorded—either policy is permissive enough or denial audit events are not yet emitted for that code path. |

**Investigate:** **Alerts** (filters `PolicyDenied`), **Audit**, device detail, and bundle
bindings. **Remediate:** adjust bundle `match_spec`, device tags/groups, or rollout—not
the kill switch unless you need an emergency stop.

Denials are **not** the same as **kill switch** (operator pause) or **revoke** (device trust).

---

## Bundles and policy editor

Publish signed `BundleV1` JWS artifacts as **policy sets** (multiple sandbox policies
per bundle). Preview/publish YAML policies when the authority build supports
`/v1/admin/policies/*`. Bundle publish creates policy content; **Assignments** control
which devices receive each bundle.

---

## Assignments

The **Assignments** page connects a published bundle version to a device group and
controls rollout for that relationship. Rollout percent, seed, and optional start/end
times belong to the assignment, not the bundle.

Typical flow:

1. Publish a bundle on **Bundles**.
2. Create or verify an assignment-targetable group under **Devices → Groups**.
3. On **Assignments**, preview matched devices, then save or activate the assignment.

When active assignments exist, `/v1/bundles/current` resolves the effective bundle through
assignment resolution. Devices outside a partial rollout may fall back to a broader
assignment or receive `no_assignment`. Ambiguous overlaps fail closed with
`assignment_conflict`.

```bash
curl -sf -H "X-Admin-Token: $TOKEN" "$AUTHORITY/v1/admin/assignments" | jq .

curl -X POST "$AUTHORITY/v1/admin/assignments/preview" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: $TOKEN" \
  -d '{
    "assignment_id": "finance-hermes-prod",
    "bundle_version": 3,
    "group_id": "finance-hermes",
    "rollout": { "percent": 10, "rollout_seed": "finance-hermes-prod-seed" }
  }' | jq .
```

---

## Other admin API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/enroll/token` | One-time enrollment token (15m TTL). |
| `POST` | `/v1/admin/bundles` | Publish bundle JWS (`finsafe-bundlectl`). |
| `GET` | `/v1/admin/assignments` | List bundle-to-group assignments. |
| `POST` | `/v1/admin/assignments` | Create or update an assignment. |
| `POST` | `/v1/admin/assignments/preview` | Preview matched devices and conflicts. |
| `POST` | `/v1/admin/devices/{id}/revoke` | Revoke device. |
| `GET` | `/v1/admin/kill-switch` | List active kill-switch rows. |
| `POST` | `/v1/admin/kill-switch` | Activate or clear kill switch. |
| `GET` | `/v1/events` | SSE: bundle rotation, kill-switch, audit, runs. |
| `GET` | `/health` | Liveness (`ok`). |

---

## Related documents

- [sandbox-management-model.md](./sandbox-management-model.md) — bundles, groups, assignments, and rollout
- [authority-deployment.md](./authority-deployment.md) — installing the authority server
- [enterprise-deployment-runbook.md](./enterprise-deployment-runbook.md) — phased IT runbook
- [managed-mode.md](./managed-mode.md) — agent, bundles, and desktop enforcement
