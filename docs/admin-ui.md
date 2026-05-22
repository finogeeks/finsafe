# Admin UI reference

**中文：** [admin-ui-zh.md](./admin-ui-zh.md)

The **FinSAFE Policy Authority admin console** is a minimal browser-based operator
interface served at `/admin/` on the authority host.

**URL (production):** `https://gov.example.com/policy-authority/admin/`  
**URL (local dev):** `http://127.0.0.1:8090/admin/`

> **Security:** The admin UI has no built-in authentication. In production, restrict
> `/admin/` and `/v1/admin/*` at the reverse proxy layer using an IP allowlist,
> SSO/OIDC, or mTLS before exposing the authority to a network. See
> [authority-deployment.md § Security notes](./authority-deployment.md#7-security-notes).

---

## Commercial license panel

At the top of the console, **Commercial license** shows live state from
`GET /v1/license/status`: status (`valid`, `missing`, `expired`, `grace`, `invalid`),
customer ID, subject, expiry, enabled features, and `max_devices`.

When a protected API call fails because no license is installed or the license is
invalid, the authority returns **`402 Payment Required`** with a JSON body:

```json
{
  "error": "license missing: install a signed license at /etc/finsafe/license.jws",
  "code": "LICENSE_MISSING"
}
```

The UI surfaces this message and reminds operators to install or renew
`/etc/finsafe/license.jws` (or set `FINSAFE_LICENSE_PATH` on the service) and restart
`finsafe-authority-http`.

**API equivalent:**

```bash
curl -sf "$AUTHORITY/v1/license/status" | jq .
```

---

## Sections

### Devices

Lists all enrolled devices along with their last heartbeat time, whether the
managed-required sentinel is present, and revocation status.

Click **Refresh** to reload. Each entry shows:

| Field | Meaning |
|-------|---------|
| `device_id` | Stable identifier set at enrollment (`FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID`). |
| `last_seen` | UTC timestamp of the most recent heartbeat. |
| `sentinel_present` | Whether the agent last reported `/etc/finsafe/managed-required.json` is in place. |
| `revoked` | `true` if the device has been revoked. Revoked devices receive `revoke_device: true` on their next heartbeat and enter a local kill-switch state. |

**API equivalent:**
```bash
curl -sf "$AUTHORITY/v1/admin/devices" | jq .
```

### Enrollment token

Issues a **one-time enrollment token** (JWS, 15-minute TTL). Copy the `token` value
and supply it to the `finsafe-agent` service environment as `FINSAFE_ENROLL_TOKEN`
during the device's first boot.

The token is consumed by the first successful enrollment. During enrollment, the
authority also pins `FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID` to the agent's local
device key. A later enrollment with the same `device_id` but a different device
key is rejected with `DEVICE_ID_ALREADY_BOUND`.

After enrollment succeeds, remove the token from the agent's environment profile (see
[enterprise-deployment-runbook.md Phase D.3](./enterprise-deployment-runbook.md#d3-remove-token-from-mdm)).

**API equivalent:**
```bash
curl -sf -X POST "$AUTHORITY/v1/enroll/token" | jq .
# {"token":"<jws>","expires_at":"<rfc3339>"}
```

### Kill switch

Activates or clears a **fleet-wide kill switch** that prevents `finsafe run` from
succeeding on all enrolled desktops. Useful for emergency response.

- **Activate (1h):** Sets the kill switch with an expiry 1 hour from now. Agents
  receive the kill-switch state on their next heartbeat or bundle pull.
- **Clear:** Removes the kill switch immediately.

You can also set an arbitrary expiry via the API:

```bash
# Activate until a specific time
curl -X POST "$AUTHORITY/v1/admin/kill-switch" \
  -H 'Content-Type: application/json' \
  -d '{"until":"2026-12-31T23:59:59Z"}'

# Clear
curl -X POST "$AUTHORITY/v1/admin/kill-switch" \
  -H 'Content-Type: application/json' \
  -d '{"until":null}'
```

---

## Other admin API endpoints (CLI / automation only)

These are not surfaced in the UI but are available for scripting:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/admin/bundles` | Publish a signed bundle JWS. Used by `finsafe-bundlectl bundle publish`. |
| `POST` | `/v1/admin/devices/{device_id}/revoke` | Revoke a specific device. |
| `GET` | `/.well-known/finsafe/jwks.json` | JWKS for verifying bundle signatures. |
| `GET` | `/v1/bundles/current` | Latest bundle JWS (used by agents). |
| `GET` | `/health` | Liveness check (`200 ok`). |
| `GET` | `/v1/events` | SSE stream of admin events (bundle rotation, kill-switch, revocations). |

---

## Related documents

- [authority-deployment.md](./authority-deployment.md) — installing and running the authority server
- [enterprise-deployment-runbook.md](./enterprise-deployment-runbook.md) — full phased IT runbook
