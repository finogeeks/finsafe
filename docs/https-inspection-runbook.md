# HTTPS inspection runbook (managed fleet)

**中文：** [https-inspection-runbook-zh.md](./https-inspection-runbook-zh.md)

End-to-end guide for enterprise operators enabling **TLS termination** at the FinSAFE egress proxy (often called HTTPS inspection or MITM). This decrypts HTTPS inside the sandbox egress path for domain allowlists, L7 decisions, and richer `proxy_egress` audit (`tls_terminated`, method, path).

**Start with allowlist only (no MITM)?** Use [network-allowlist-proxy-runbook.md](./network-allowlist-proxy-runbook.md) first — personal CLI, no commercial license.

**Related docs:** [authority-deployment.md](./authority-deployment.md#tls-inspection-mitm) (summary), [POLICY-QUICKREF.md](./POLICY-QUICKREF.md) (policy fields), [enterprise-deployment-runbook.md](./enterprise-deployment-runbook.md) (fleet rollout).

**Example policy:** [`examples/wrapper-policies/enterprise-https-inspection.yaml`](../examples/wrapper-policies/enterprise-https-inspection.yaml)

---

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| Managed mode | Policy Authority + enrolled `finsafe-agent` on desktops — [managed-mode.md](./managed-mode.md) |
| Commercial `license.jws` | Must include feature **`mitm_tls_terminate`** (not in default Finogeeks license sets). Request at purchase / renewal. |
| Authority running | `finsafe-authority-http` with valid license — [authority-deployment.md](./authority-deployment.md) |
| Operator access | `X-Admin-Token` for `/v1/admin/*` (Admin UI **Settings → General** or `FINSAFE_ADMIN_TOKENS_PATH`) |
| `finsafe-bundlectl` | On operator workstation — [skills/finsafe-bundlectl/SKILL.md](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-bundlectl/SKILL.md) |

**Compliance:** Inform users that HTTPS traffic from sandboxed programs may be decrypted for policy enforcement and audit. Document in acceptable-use / security notices.

**Platform notes:**

| OS | Managed HTTPS inspection |
|----|---------------------------|
| **Linux** | Supported (bubblewrap + loopback proxy / `finsafe-net-proxy`). |
| **macOS** | Supported (`network: allowlist` + `start_internal_proxy` + Seatbelt loopback rules). |
| **Windows** | Host sandbox + loopback proxy path; confirm pilot build before fleet-wide rollout. |

---

## Step 1 — Confirm license entitlement

Install `license.jws` on the authority host (`/etc/finsafe/license.jws` or `FINSAFE_LICENSE_PATH`). Finogeeks adds **`mitm_tls_terminate`** when you purchase the add-on; customers cannot self-issue this feature.

```bash
export AUTHORITY=https://gov.example.com/policy-authority

curl -sf "$AUTHORITY/v1/license/status" | jq .
```

Expect `status` of `valid` or `grace`, and **`mitm_tls_terminate`** in the `features` array. Without it, MITM admin routes and publish of `tls_terminate: true` policies return **`402 Payment Required`** with `LICENSE_FEATURE_DENIED`.

---

## Step 2 — Generate the authority inspection CA

Run once per authority environment (or again only when rotating the CA — requires republishing bundles and redistributing trust).

```bash
export TOKEN="<admin-token-from-settings>"

# Create CA (idempotent if already present — check GET first)
curl -sf -X POST "$AUTHORITY/v1/admin/mitm/ca" \
  -H "X-Admin-Token: $TOKEN" | jq .

# Verify stored public cert
curl -sf "$AUTHORITY/v1/admin/mitm/ca" \
  -H "X-Admin-Token: $TOKEN" | jq -r '.cert_pem' | openssl x509 -noout -subject -dates
```

**Diagnostics (no admin auth):**

```bash
curl -sf "$AUTHORITY/v1/mitm/ca/cert" | jq -r '.cert_pem' | head -5
```

Returns **`404`** until Step 2 succeeds. Returns **`402`** if the license lacks `mitm_tls_terminate`.

---

## Step 3 — Build and publish a bundle with inspection enabled

Use a wrapper policy with:

- `network: !allowlist` with `domains:` — allowed destination hostnames
- `tls_terminate: true` — proxy terminates TLS
- `start_internal_proxy: true` — bundled loopback proxy on **`127.0.0.1:60080`** (typical managed setup)

Start from the [example policy](../examples/wrapper-policies/enterprise-https-inspection.yaml) and adjust domains and filesystem paths for your program (Hermes, Python tooling, etc.).

```bash
export FINSAFE_AUTHORITY_PUBLIC_URL="$AUTHORITY"
export FINSAFE_ORG_DOMAIN=example.com
export FINSAFE_AUTHORITY_SIGNING_KEY=/secure/authority/signing_key.bin

finsafe-bundlectl bundle build \
  --from docs/public-finsafe/examples/wrapper-policies/enterprise-https-inspection.yaml \
  --out /secure/bundles/inspection-draft.json

finsafe-bundlectl bundle sign \
  --in /secure/bundles/inspection-draft.json \
  --out /secure/bundles/inspection-v1.jws

finsafe-bundlectl bundle publish \
  --in /secure/bundles/inspection-v1.jws \
  --authority "$FINSAFE_AUTHORITY_PUBLIC_URL"
```

**Publish failures:**

| HTTP / error | Cause |
|--------------|--------|
| `402` + `LICENSE_FEATURE_DENIED` | License missing `mitm_tls_terminate`. |
| `400` / message about MITM CA | `tls_terminate: true` but Step 2 not done — run `POST /v1/admin/mitm/ca`. |

Published bundles include **`inspection_ca_cert_pem`** so agents install the inspection CA under the managed cache.

Assign the bundle to device groups in the Admin UI (**Assignments**) or your normal rollout process — [sandbox-management-model.md](./sandbox-management-model.md).

---

## Step 4 — Roll out to desktops

No separate MDM payload is required beyond your usual managed-mode install (`finsafe`, `finsafe-agent`, sentinel, authority URL). After publish:

1. Agents pull the new bundle on heartbeat / policy refresh.
2. The agent writes the inspection CA and injects trust-store env vars into sandbox children (`SSL_CERT_FILE`, `CURL_CA_BUNDLE`, `NODE_EXTRA_CA_CERTS`, …).
3. `finsafe run` / managed `self-confine` applies `tls_terminate` and starts the internal proxy when the policy requests it.

See [enterprise-deployment-runbook.md](./enterprise-deployment-runbook.md) Phases B–D for packaging and enrollment.

---

## Step 5 — Verify on a pilot desktop

### 5.1 Managed smoke

```bash
# Enrolled machine — policy from agent only
finsafe run --json -- /usr/bin/curl -fsS https://example.com/ | jq '.envelope.policy_source, .envelope.inner.exit_code'
```

Expect `policy_source` **`managed`** and exit code **`0`** when `example.com` is in the allowlist.

**Important:** Use **hostnames** in URLs (`https://example.com/`), not bare IP literals (`https://127.0.0.1/…`). The loopback proxy rejects IP-literal targets by design (`ip_literal_denied`).

### 5.2 Audit: TLS terminated

Enable proxy audit logging on the pilot host if needed:

```bash
export FINSAFE_NET_PROXY_AUDIT_LOG=1
```

Run a managed HTTPS request while capturing stderr, then inspect records:

```bash
finsafe run --json -- /usr/bin/curl -fsS https://example.com/ 2>proxy-audit.stderr
grep finsafe_net_proxy_audit proxy-audit.stderr | grep '"tls_terminated":true' | tail -1 | jq -R 'sub("^finsafe_net_proxy_audit ";"") | fromjson'
```

Terminated flows use **`proxy_egress` schema version `3`** (method/path visible). Opaque CONNECT tunnels remain at schema **`2`**.

### 5.3 Authority checks

| Check | Command |
|-------|---------|
| Current bundle | `curl -sf "$AUTHORITY/v1/bundles/current" \| jq '.bundle_id, .version'` |
| Public CA | `curl -sf "$AUTHORITY/v1/mitm/ca/cert" \| jq -r '.cert_pem' \| openssl x509 -noout -subject` |
| Fleet audit | Admin UI **Audit** / **Runs** — egress events after pilot runs |

---

## Local lab (evaluation without production paths)

[`scripts/managed-lab.sh`](../scripts/managed-lab.sh) + [managed-lab.md](./testing/managed-lab.md) run Authority + agent under `~/.finsafe-lab`. You still need a Finogeeks `license.jws` with `mitm_tls_terminate` for Steps 1–3.

For **proxy-only** dev without commercial license on a single machine:

```bash
export FINSAFE_LICENSE_MITM=1
# Optional stable dev CA:
# export FINSAFE_MITM_CA_CERT_PATH=/path/to/ca.pem
# export FINSAFE_MITM_CA_KEY_PATH=/path/to/ca.key
```

See [POLICY-QUICKREF.md](./POLICY-QUICKREF.md) — **TLS inspection (MITM) operator notes**.

---

## Troubleshooting

| Symptom | Likely cause | Action |
|---------|----------------|--------|
| `402` on `POST /v1/admin/mitm/ca` or publish | License lacks `mitm_tls_terminate` | Contact Finogeeks; reinstall `license.jws`; restart authority. |
| Publish: “requires an authority MITM CA” | Step 2 skipped | `POST /v1/admin/mitm/ca`, retry publish. |
| TLS errors in sandbox (`certificate verify failed`) | Agent has not pulled bundle with `inspection_ca_cert_pem` | Confirm bundle version on device; restart agent; check managed cache. |
| `ip_literal_denied` in proxy audit | URL uses IP instead of hostname | Use `https://example.com/` not `https://93.184.216.34/`. |
| Connection refused to `127.0.0.1:60080` | `start_internal_proxy: false` or proxy not started | Set `start_internal_proxy: true` or run `finsafe-net-proxy` per [POLICY-QUICKREF.md](./POLICY-QUICKREF.md). |
| macOS: egress blocked despite proxy | Seatbelt without loopback allowance | Use current fleet `finsafe` with `network: allowlist` + internal proxy (restricted egress parity). |
| No `tls_terminated` in audit | `tls_terminate: false` or license bypass only on proxy host | Confirm policy YAML; managed runs need published bundle + agent CA install. |

---

## CA rotation (advanced)

1. Generate new CA (`POST /v1/admin/mitm/ca` — confirm product behavior for overwrite; plan maintenance window).
2. Publish a **new bundle version** with `tls_terminate: true`.
3. Roll out bundle; agents refresh `inspection_ca_cert_pem`.
4. Redeploy trust to any tools that pin the old inspection CA outside FinSAFE.

Coordinate with Finogeeks support before rotating production CAs.
