# Deploying finsafe-authority

**中文：** [authority-deployment-zh.md](./authority-deployment-zh.md)

This guide is for **IT / platform engineers** hosting the central Policy Authority
that managed-mode desktops enroll against. For the overall managed-mode architecture,
see [managed-mode.md](./managed-mode.md). For phased fleet rollout, see the
[enterprise deployment runbook](./enterprise-deployment-runbook.md).

## What it is

`finsafe-authority-http` is a small HTTP service that:

- Stores and distributes **signed policy bundles** to enrolled agents.
- Issues and validates **enrollment tokens**.
- Receives **heartbeats** from `finsafe-agent` on each desktop.
- Ingests **audit events** spooled by the agent.
- Exposes an **admin UI** and JSON API for operators.
- Publishes **JWKS** used by agents to verify bundle signatures.

`finsafe-bundlectl` is the companion operator CLI for building, signing, and publishing
bundles and managed-required sentinels. Both ship in the **admin archive** (separate from
the public desktop CLI archive). For the full binary suite and platform matrix, see
[binary-reference.md](./binary-reference.md).

---

## 1. Obtain binaries

Admin binaries (`finsafe-authority-http` and `finsafe-bundlectl`) are distributed in a
separate **admin archive** from [Releases](https://github.com/finogeeks/finsafe/releases):

```
finsafe-admin-v<version>-x86_64-unknown-linux-gnu.tar.zst
```

Verify and extract (same pattern as the desktop archive):

```bash
VERSION=0.2.0
shasum -a 256 -c SHA256SUMS
tar -xvf "finsafe-admin-v${VERSION}-x86_64-unknown-linux-gnu.tar.zst"
# Contents: finsafe-authority-http  finsafe-bundlectl
```

Install to a stable path:

```bash
sudo cp finsafe-authority-http finsafe-bundlectl /usr/local/bin/
```

The **desktop archive** (`finsafe`, `finsafe-agent`, helpers) is separate—see the
[top-level README](../README.md).

---

## 2. Data directory

The authority uses a SQLite database and an Ed25519 signing key. Create the directory
before first run:

```bash
sudo mkdir -p /var/lib/finsafe-authority
sudo chown finsafe-authority:finsafe-authority /var/lib/finsafe-authority  # or your service user
sudo chmod 0700 /var/lib/finsafe-authority
```

On first startup the authority **auto-generates** a signing key at
`/var/lib/finsafe-authority/signing_key.bin` if none exists. Keep this file
**secret and backed up**—all enrolled agents are pinned to this key's JWKS thumbprint
at enrollment time. Rotating the key requires re-enrolling every device.

---

## 2.1 Commercial license (managed mode)

**Personal / local-wrapper** use of the public `finsafe` CLI is free and does not
require a license file.

**Managed mode** (Policy Authority, admin APIs, enrollment, bundle distribution,
fleet audit) requires a **Finogeeks-issued signed license** on the authority host
before those endpoints accept traffic.

1. Obtain `license.jws` from Finogeeks (offline-signed JWS).
2. Install on the authority host:

```bash
sudo mkdir -p /etc/finsafe
sudo cp acme-license.jws /etc/finsafe/license.jws
sudo chmod 0640 /etc/finsafe/license.jws
# Service user must be able to read the file
```

3. Optionally set `FINSAFE_LICENSE_PATH` if you use a non-default path.
4. Restart `finsafe-authority-http`.

Without a valid license, `/health`, `/.well-known/finsafe/jwks.json`, `/admin/` (static
UI), and `GET /v1/license/status` remain available for diagnosis. Protected routes
return **`402 Payment Required`** with JSON `code` such as `LICENSE_MISSING`,
`LICENSE_EXPIRED`, or `LICENSE_SEAT_LIMIT`.

The license payload includes **feature flags** and an optional **`max_devices`** seat
count enforced at **new enrollment** time (revoked devices are not counted toward the
limit). After `expires_at`, a optional **`grace_until`** window (typically 14 days)
allows existing enrolled devices to continue heartbeat and audit while renewal is
completed.

---

## 3. Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FINSAFE_AUTHORITY_BIND` | `127.0.0.1:8090` | Bind address. Set to `0.0.0.0:8090` behind a reverse proxy. |
| `FINSAFE_AUTHORITY_DB` | `/var/lib/finsafe-authority/authority.db` | SQLite database path. |
| `FINSAFE_AUTHORITY_SIGNING_KEY` | `/var/lib/finsafe-authority/signing_key.bin` | Raw 32-byte Ed25519 signing key. |
| `FINSAFE_AUTHORITY_KID` | `authority-default` | Key ID embedded in JWKS and JWS headers. |
| `FINSAFE_AUTHORITY_PUBLIC_URL` | `http://127.0.0.1:8090` | Public URL returned to enrolling agents. **Must be set in production.** |
| `FINSAFE_AUTHORITY_REQUIRE_SENTINEL` | _(unset)_ | Set to `1` to flag heartbeats from devices without a sentinel as `tamper_suspected`. |
| `FINSAFE_ADMIN_UI_DIR` | _(bundled)_ | Override the static admin UI directory. Rarely needed. |
| `FINSAFE_LICENSE_PATH` | `/etc/finsafe/license.jws` | Commercial license JWS for managed/admin APIs. |
| `FINSAFE_LICENSE_VERIFY_PUBKEY_FILE` | _(embedded)_ | Optional override: 32-byte Ed25519 public key file for license verification (Finogeeks ops). |

**Always set `FINSAFE_AUTHORITY_PUBLIC_URL`** to the HTTPS URL that enrolled desktops
can reach. Agents write this URL into `/etc/finsafe/enrolled.json` at enrollment time.

---

## 4. Run as a service

### Linux (systemd)

A unit file is provided at
[`packaging/systemd/finsafe-authority.service`](../packaging/systemd/finsafe-authority.service).

```bash
sudo cp packaging/systemd/finsafe-authority.service /etc/systemd/system/
# Edit the unit to set FINSAFE_AUTHORITY_PUBLIC_URL and other env vars.
sudo systemctl daemon-reload
sudo systemctl enable --now finsafe-authority
sudo systemctl status finsafe-authority
```

### macOS (LaunchDaemon)

```bash
sudo cp packaging/launchd/com.finogeeks.finsafe-authority.plist \
    /Library/LaunchDaemons/
# Edit the plist to set your production URL before loading.
sudo launchctl load /Library/LaunchDaemons/com.finogeeks.finsafe-authority.plist
```

### TLS / reverse proxy

Do **not** expose `finsafe-authority-http` directly on port 443. Instead:

1. Bind the service to `127.0.0.1:8090` (or a private port).
2. Place **nginx / Caddy / a load balancer** in front to terminate TLS.
3. Restrict `/v1/admin/*` and `/admin/` to an internal IP range or SSO.

---

## 5. Verification

After the service is running **and `license.jws` is installed** (§2.1):

```bash
AUTHORITY=https://gov.example.com/policy-authority

# Health (always available)
curl -sf "$AUTHORITY/health"

# License status (diagnose missing/expired/seat limits)
curl -sf "$AUTHORITY/v1/license/status" | jq .

# JWKS (key agents pin at enrollment)
curl -sf "$AUTHORITY/.well-known/finsafe/jwks.json" | jq .

# Managed APIs require a valid license (expect 200, not 402)
curl -sf -X POST "$AUTHORITY/v1/enroll/token" | jq .
curl -sf "$AUTHORITY/v1/admin/devices" | jq .

# Current bundle (404 until you publish one — that is normal)
curl -sf "$AUTHORITY/v1/bundles/current" | jq .

# Admin UI
open "$AUTHORITY/admin/"
```

Without a license, `POST /v1/enroll/token` and `GET /v1/admin/devices` return **402**
with `LICENSE_MISSING`. End-to-end pilot checks (authority + desktop): [binary-reference.md](./binary-reference.md#verify-managed-mode-is-working-production-checklist).

---

## 6. Managing policy bundles with finsafe-bundlectl

`finsafe-bundlectl` is the operator tool for creating and pushing policy bundles. Run it
on a **secure operator workstation** that has access to the signing key (not on end-user
machines).

Set up environment once:

```bash
export FINSAFE_AUTHORITY_SIGNING_KEY=/secure/keys/finsafe-signing_key.bin
export FINSAFE_AUTHORITY_PUBLIC_URL=https://gov.example.com/policy-authority
export FINSAFE_ORG_DOMAIN=example.com
```

### Build a bundle draft from a wrapper policy YAML

```bash
finsafe-bundlectl bundle build \
  --from examples/wrapper-policies/hermes-interactive.yaml \
  --out /tmp/bundle-draft.json
```

The draft is a plain JSON `BundleV1` document (unsigned). Review it before signing.

### Sign the bundle

```bash
finsafe-bundlectl bundle sign \
  --in /tmp/bundle-draft.json \
  --out /tmp/bundle.jws
```

Outputs a compact JWS. Record the digest printed to stdout for your change log.

### Publish to the authority

```bash
finsafe-bundlectl bundle publish \
  --in /tmp/bundle.jws \
  --authority "$FINSAFE_AUTHORITY_PUBLIC_URL"
```

Enrolled agents pull the new bundle on their next heartbeat interval. No per-desktop
file push is needed.

### Sign the managed-required sentinel (one-time)

```bash
finsafe-bundlectl sentinel sign --out /tmp/managed-required.jws
```

This is the JWS file deployed by MDM to `/etc/finsafe/managed-required.json` on every
fleet machine. Regenerate and redeploy if you rotate the signing key.

---

## 7. Security notes

- **Signing key custody:** Treat `signing_key.bin` as a CA private key. Use an HSM or
  a dedicated locked operations host in production. Compromise requires rotating the key
  and re-enrolling the entire fleet.
- **Admin UI access:** The `/admin/` path and `/v1/admin/*` routes have **no built-in
  authentication**. Restrict them at the reverse proxy layer (IP allowlist, SSO/OIDC,
  mTLS). The admin UI itself notes this.
- **Enrollment tokens expire in 15 minutes** and are single-use. Revoke or discard
  unused tokens; never store them in MDM configuration reports longer than needed (see
  runbook Phase D.3).

---

## Related documents

- [binary-reference.md](./binary-reference.md) — full binary suite, release archives, platform matrix
- [managed-mode.md](./managed-mode.md) — architecture overview and CLI error codes
- [admin-ui.md](./admin-ui.md) — admin console reference
- [enterprise-deployment-runbook.md](./enterprise-deployment-runbook.md) — phased IT runbook
- [mdm/vendor-neutral-checklist.md](./mdm/vendor-neutral-checklist.md) — fleet checklist
