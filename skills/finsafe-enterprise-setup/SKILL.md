---
name: finsafe-enterprise-setup
description: >-
  Self-contained guide for enterprise IT to deploy FinSAFE managed mode from GitHub
  releases only: Policy Authority, Finogeeks license.jws, finsafe-bundlectl bundles,
  MDM fleet rollout, and pilot verification. Use when setting up managed fleet,
  authority host, commercial license install, or enterprise deployment without the
  private FinSAFE source repo.
---

# FinSAFE enterprise setup (managed fleet)

Guide for AI agents helping **customer IT / platform engineering** deploy **managed mode** using only:

- [finogeeks/finsafe](https://github.com/finogeeks/finsafe) documentation and release binaries
- A **Finogeeks-issued** `license.jws` (not on GitHub)
- Optional companion skill: [finsafe-bundlectl](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-bundlectl/SKILL.md)

This skill is **self-contained** (full `https://` links only). No checkout of the private FinSAFE monorepo is required.

## Scope

| In scope | Out of scope |
|----------|----------------|
| Release downloads, authority install, license file | Issuing `license.jws` (`finsafe-licensectl` — Finogeeks only) |
| Pilot verification (`curl`, Admin UI) | [`scripts/check-authority-health.sh`](scripts/check-authority-health.sh); Finogeeks CI: `scripts/tests/managed-mode/*` (private monorepo) |
| MDM fleet phases (high level) | Personal-mode `install.sh` only workflow |
| Hand-off to bundlectl skill for publish/sentinel | Rust `cargo build` from source |

## End-to-end chain

```text
Finogeeks delivers license.jws
        ↓
Releases: finsafe-admin-server-v*  →  authority host
          finsafe-bundlectl-v*      →  operator workstation
          finsafe-fleet-v*          →  MDM → each desktop
        ↓
Install license + start finsafe-authority-http
        ↓
Copy authority signing_key.bin → operator laptop (bundlectl)
        ↓
bundlectl: publish bundle + sentinel sign
        ↓
MDM: fleet binaries + managed-required.json + enroll
        ↓
Pilot: finsafe run --json -- /usr/bin/true  →  policy_source=managed
```

## Phase 0 — Obtain from Finogeeks

| Deliverable | Who provides | Customer action |
|-------------|--------------|-----------------|
| **`license.jws`** | Finogeeks (commercial entitlement) | Install on authority host only — see Phase 2 |
| Support / renewal | Finogeeks | Renew before `expires_at`; optional `grace_until` window |

**Do not** expect `license.jws` or `finsafe-licensectl` on [GitHub Releases](https://github.com/finogeeks/finsafe/releases).

Full license install details: [authority-deployment §2.1](https://github.com/finogeeks/finsafe/blob/main/docs/authority-deployment.md#21-commercial-license-managed-mode).

## Phase 1 — Download release binaries

Open [FinSAFE Releases](https://github.com/finogeeks/finsafe/releases), verify **`SHA256SUMS`**, extract.

| Archive | Install on |
|---------|------------|
| `finsafe-admin-server-v<version>-<target>.tar.zst` | **Policy Authority** host (Linux x86_64 for production; macOS for pilot/dev) |
| `finsafe-bundlectl-v<version>-<target>.tar.zst` | **Operator** workstation (Linux or macOS) |
| `finsafe-fleet-v<version>-<target>.tar.zst` | **Each managed desktop** (via MDM/Ansible) |

**Not used for managed fleet:** `finsafe-v*` from `install.sh` (personal-mode CLI only).

Binary matrix: [binary-reference.md](https://github.com/finogeeks/finsafe/blob/main/docs/binary-reference.md).

Example (Linux authority + macOS operator):

```bash
VERSION=0.4.7
shasum -a 256 -c SHA256SUMS

tar -xvf "finsafe-admin-server-v${VERSION}-x86_64-unknown-linux-gnu.tar.zst"
sudo cp finsafe-admin-server-v${VERSION}-x86_64-unknown-linux-gnu/finsafe-authority-http /usr/local/bin/

tar -xvf "finsafe-bundlectl-v${VERSION}-aarch64-apple-darwin.tar.zst"
sudo cp finsafe-bundlectl-v${VERSION}-aarch64-apple-darwin/finsafe-bundlectl /usr/local/bin/
```

## Phase 2 — Policy Authority + commercial license

Follow: [authority-deployment.md](https://github.com/finogeeks/finsafe/blob/main/docs/authority-deployment.md).

**Summary:**

1. Create data dir (e.g. `/var/lib/finsafe-authority`, mode `0700`).
2. Install **`license.jws`**:

```bash
sudo mkdir -p /etc/finsafe
sudo cp /secure/from-finogeeks/acme-license.jws /etc/finsafe/license.jws
sudo chmod 0640 /etc/finsafe/license.jws
```

3. Set **`FINSAFE_AUTHORITY_PUBLIC_URL`** to the HTTPS URL agents will use (production requirement).
4. Start service — systemd unit: [packaging/systemd/finsafe-authority.service](https://github.com/finogeeks/finsafe/blob/main/packaging/systemd/finsafe-authority.service).

On **first start**, the authority auto-creates **`/var/lib/finsafe-authority/signing_key.bin`** if missing. **Back up this file** and provide a **read-only copy** to the operator workstation for `finsafe-bundlectl` (`FINSAFE_AUTHORITY_SIGNING_KEY`). This is the **policy** signing key — not the commercial license key.

### Verify authority (after license installed)

```bash
AUTHORITY=https://gov.example.com/policy-authority

curl -sf "$AUTHORITY/health"
curl -sf "$AUTHORITY/v1/license/status" | jq .
curl -sf "$AUTHORITY/.well-known/finsafe/jwks.json" | jq .
curl -sf -X POST "$AUTHORITY/v1/enroll/token" | jq .
curl -sf "$AUTHORITY/v1/admin/devices" | jq .
```

Without a valid license, enroll/admin return **`402`** with `LICENSE_MISSING`. Admin UI: `$AUTHORITY/admin/`.

Also see [binary-reference — production checklist](https://github.com/finogeeks/finsafe/blob/main/docs/binary-reference.md#verify-managed-mode-is-working-production-checklist).

## Phase 3 — Publish policy + MDM sentinel (operator workstation)

Use skill: [finsafe-bundlectl/SKILL.md](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-bundlectl/SKILL.md).

**Minimum:**

```bash
export FINSAFE_AUTHORITY_SIGNING_KEY=/secure/copy-of-authority/signing_key.bin
export FINSAFE_AUTHORITY_PUBLIC_URL=https://gov.example.com/policy-authority
export FINSAFE_ORG_DOMAIN=example.com

# Example policy (download from public repo)
curl -fsSL -o /tmp/hermes-smoke.yaml \
  https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/hermes-version-smoke.yaml

finsafe-bundlectl bundle build --from /tmp/hermes-smoke.yaml --out /secure/bundles/draft.json
finsafe-bundlectl bundle sign --in /secure/bundles/draft.json --out /secure/bundles/bundle-v1.jws
finsafe-bundlectl bundle publish --in /secure/bundles/bundle-v1.jws --authority "$FINSAFE_AUTHORITY_PUBLIC_URL"

finsafe-bundlectl sentinel sign --out /secure/mdm/managed-required.jws
```

If **`bundle publish` returns 402**, fix **`license.jws`** on the authority host first.

## Phase 4 — Fleet desktops (MDM)

Follow: [enterprise-deployment-runbook.md](https://github.com/finogeeks/finsafe/blob/main/docs/enterprise-deployment-runbook.md).

**Per desktop (conceptual):**

1. Install `finsafe` + `finsafe-agent` from **`finsafe-fleet-v*`** (Linux: also ship helper/supervisor/landlock shim beside `finsafe`).
2. Deploy **`managed-required.json`** from sentinel JWS (MDM).
3. Start **`finsafe-agent`** (LaunchDaemon / systemd) — see [packaging/](https://github.com/finogeeks/finsafe/tree/main/packaging).
4. **Enroll once** with one-time token from authority Admin UI or API — scripts in [packaging/mdm/examples/](https://github.com/finogeeks/finsafe/tree/main/packaging/mdm/examples/).
5. User runs: `finsafe run --json -- /usr/bin/true` (or your agent runtime).

**macOS manual steps:** [managed-mode-macos-runbook.md](https://github.com/finogeeks/finsafe/blob/main/docs/testing/managed-mode-macos-runbook.md).

**MDM vendors:** [mdm/README.md](https://github.com/finogeeks/finsafe/blob/main/docs/mdm/README.md) (Jamf, Intune, Ansible).

## Phase 5 — Pilot acceptance (no private scripts)

Use the matrix as a **checklist**, not as shell commands: [managed-mode-matrix.md](https://github.com/finogeeks/finsafe/blob/main/docs/testing/managed-mode-matrix.md).

| Check | How (customer) |
|-------|----------------|
| License valid | `GET /v1/license/status` → `valid` or `grace` |
| Bundle published | `GET /v1/bundles/current` → 200 with bundle |
| Device enrolled | `/etc/finsafe/enrolled.json` exists |
| Managed run | `finsafe run --json -- /usr/bin/true` → `policy_source=managed` or exit 0 |
| Tamper: local `--policy` | Expect `MANAGED_POLICY_LOCAL_OVERRIDE` when sentinel present |
| Admin operations | [admin-ui.md](https://github.com/finogeeks/finsafe/blob/main/docs/admin-ui.md) |

Automated `scripts/tests/managed-mode/*` harnesses are **Finogeeks engineering only** (private monorepo).

## Key docs (bookmark list)

| Topic | URL |
|-------|-----|
| Docs index | https://github.com/finogeeks/finsafe/blob/main/docs/README.md |
| IT panorama | https://github.com/finogeeks/finsafe/blob/main/docs/enterprise-it-overview.md |
| Full runbook | https://github.com/finogeeks/finsafe/blob/main/docs/enterprise-deployment-runbook.md |
| Authority + license | https://github.com/finogeeks/finsafe/blob/main/docs/authority-deployment.md |
| Bundlectl skill | https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-bundlectl/SKILL.md |
| Releases | https://github.com/finogeeks/finsafe/releases |

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| `402` on enroll/publish | Missing/expired `license.jws` | Install Finogeeks license; check `/v1/license/status` |
| `bundle publish` auth/sign error | Wrong `FINSAFE_AUTHORITY_SIGNING_KEY` | Use exact 32-byte `signing_key.bin` from authority host |
| Enroll fails | Wrong `FINSAFE_AUTHORITY_PUBLIC_URL` or thumbprint drift | Re-run `sentinel sign`; redeploy sentinel; re-enroll |
| `MANAGED_DAEMON_UNREACHABLE` | No bundle or agent down | Publish bundle; check agent logs |
| `MANAGED_POLICY_LOCAL_OVERRIDE` | Expected when sentinel enforced | User must not pass local `--policy` on fleet binary |
| Personal `finsafe` from `install.sh` still works | Two binaries can coexist | Fleet enforcement uses **`finsafe` from `finsafe-fleet-v*`**, not personal install |

## English-only admins

The full IT panorama is in Chinese: [enterprise-it-overview-zh.md](https://github.com/finogeeks/finsafe/blob/main/docs/enterprise-it-overview-zh.md). For deployment, English runbook + this skill are sufficient.
