---
name: finsafe-bundlectl
description: >-
  Self-contained operator guide for finsafe-bundlectl: build BundleV1 from wrapper policy
  YAML, sign with the authority Ed25519 key, publish to finsafe-authority-http, and sign
  managed-required sentinel JWS for MDM. Use when the user has only the bundlectl binary
  and this skill, or when the task mentions bundle publish, managed-required.json, or
  sentinel sign.
---

# finsafe-bundlectl operator skill

Guide for AI agents helping **platform / security operators** on a **locked workstation** — not end users on fleet laptops. This skill is **self-contained**; the operator may have only `finsafe-bundlectl` and this file (no local clone of any repo).

## Scope

| In scope | Out of scope |
|----------|----------------|
| `bundle build`, `bundle sign`, `bundle publish` | `finsafe run`, personal `--policy` on desktops |
| `sentinel sign` for MDM | `finsafe-licensectl` (not in public releases) |
| Env vars, signing key, license requirements | Writing new bundlectl features |

## What you need before running commands

| Item | Where | Notes |
|------|--------|--------|
| **`finsafe-bundlectl` binary** | Operator workstation (Linux or macOS) | From GitHub release archive `finsafe-bundlectl-v<version>-<target>.tar.zst` — see [releases](https://github.com/finogeeks/finsafe/releases) |
| **`finsafe-authority-http`** | Linux authority server | Must already be running and reachable |
| **`license.jws`** | Authority server only: `/etc/finsafe/license.jws` | Finogeeks-issued commercial license; **`bundle publish` returns HTTP 402** if missing or invalid |
| **`signing_key.bin`** | Authority server + operator copy | 32-byte Ed25519 seed; **same file** on both sides via `FINSAFE_AUTHORITY_SIGNING_KEY` |
| **Wrapper policy YAML** | Any path the operator chooses | Input to `bundle build`; not shipped with bundlectl |

### License vs policy signing key (do not confuse)

| Artifact | Purpose | On bundlectl laptop? |
|----------|---------|----------------------|
| **`license.jws`** | Commercial entitlement for managed mode (enroll, bundle distribution, admin APIs) | **No** — install only on the authority host |
| **`signing_key.bin`** | Signs policy bundles and managed-required sentinel; drives JWKS at `/.well-known/finsafe/jwks.json` | **Yes** — read-only copy for bundlectl (`FINSAFE_AUTHORITY_SIGNING_KEY`) |

JWKS is derived from the **policy signing key**, not from `license.jws`.

### How bundlectl relates to the authority (no extra docs required)

```text
Operator laptop                    Policy Authority server              Fleet desktops
────────────────                   ───────────────────────              ──────────────
finsafe-bundlectl                  finsafe-authority-http               finsafe-agent + finsafe
  │                                  │                                    │
  ├─ bundle build/sign               ├─ license.jws (commercial)        ├─ /etc/finsafe/managed-required.json (MDM)
  ├─ bundle publish ──HTTP POST──►   ├─ re-sign bundle, store in DB       ├─ GET /v1/bundles/current + JWKS
  └─ sentinel sign ──MDM file──►     └─ enroll, heartbeats, admin UI      └─ finsafe run uses agent policy
       (not uploaded via HTTP)
```

**Publish path:** `build` → unsigned JSON → `sign` → local JWS → `publish --in <jws> --authority <url>` → `POST /v1/admin/bundles` with `{"bundle": <BundleV1>}`. The authority **re-signs** with its key; agents never trust the operator’s JWS directly.

**Sentinel path:** `sentinel sign` writes a JWS file for MDM to deploy as `/etc/finsafe/managed-required.json`. It is **not** uploaded to the authority API.

## Install the binary (operator workstation)

1. Open [FinSAFE releases](https://github.com/finogeeks/finsafe/releases) and download the matching archive:
   - Linux x86_64: `finsafe-bundlectl-v<version>-x86_64-unknown-linux-gnu.tar.zst`
   - macOS Apple Silicon: `finsafe-bundlectl-v<version>-aarch64-apple-darwin.tar.zst`
   - macOS Intel: `finsafe-bundlectl-v<version>-x86_64-apple-darwin.tar.zst`
2. Verify with `SHA256SUMS` from the same release page.
3. Extract and install:

```bash
VERSION=0.5.0   # match your release
TARGET=aarch64-apple-darwin   # or x86_64-unknown-linux-gnu / x86_64-apple-darwin
tar -xvf "finsafe-bundlectl-v${VERSION}-${TARGET}.tar.zst"
sudo cp "finsafe-bundlectl-v${VERSION}-${TARGET}/finsafe-bundlectl" /usr/local/bin/
finsafe-bundlectl 2>&1 | head -1   # expect usage line if invoked with no args
```

Requires **`zstd`** and **`tar`** for extraction. **`jq`** is recommended to review bundle JSON before sign.

## Environment (operator workstation)

Set once per shell session:

```bash
export FINSAFE_AUTHORITY_SIGNING_KEY=/secure/finsafe-authority/signing_key.bin
export FINSAFE_AUTHORITY_PUBLIC_URL=https://gov.example.com/policy-authority
export FINSAFE_ORG_DOMAIN=example.com   # required for sentinel sign
```

| Variable | Required for | Meaning |
|----------|----------------|---------|
| `FINSAFE_AUTHORITY_SIGNING_KEY` | `bundle sign`, `bundle publish`, `sentinel sign` | Path to **32-byte** Ed25519 seed (same as authority’s `signing_key.bin`) |
| `FINSAFE_AUTHORITY_PUBLIC_URL` | `bundle publish`, `sentinel sign` | Authority **base URL** (same as agents’ `FINSAFE_AUTHORITY_URL`); no `/v1/...` suffix |
| `FINSAFE_ORG_DOMAIN` | `sentinel sign` | Organization domain embedded in sentinel (defaults to `example.com` if unset) |
| `FINSAFE_AUTHORITY_KID` | Optional | Key ID in JWKS (default `authority-default`); must match authority if set |

If `FINSAFE_AUTHORITY_SIGNING_KEY` is missing, bundlectl may auto-generate a key at the default path — **wrong for production**; always point at the authority’s real key.

## Command tree (exact CLI)

```text
finsafe-bundlectl bundle build  --from <policy.yaml|json> --out <draft.json>
finsafe-bundlectl bundle sign    --in <draft.json>        --out <bundle.jws>
finsafe-bundlectl bundle publish --in <bundle.jws>        --authority <base-url>
finsafe-bundlectl sentinel sign  --out <managed-required.jws>
```

**Critical flags**

- Use **`--in`** for sign and publish (not `--jws`, `--input`, or `--file`).
- **`--authority`** is only the base URL, e.g. `https://gov.example.com/policy-authority`.
- Flag order does not matter for `bundle publish`.

## Minimal wrapper policy (create locally, then build)

`bundle build` needs a **wrapper policy** file on disk. Minimal smoke-style YAML the operator can save as `policy.yaml`:

```yaml
schema_version: 1
kind: local-wrapper
program_mode: short-lived
degrade:
  allow_fallback: true
audit:
  require_policy_digest: true
  require_resolved_posture: true
network: host
resources:
  memory_max: "512M"
  pids_max: "64"
filesystem:
  read_only_paths:
    - "/usr"
    - "/bin"
  read_write_paths:
    - "./workspace"
```

Adjust paths and limits for your program. Input may be `.yaml`, `.yml`, or JSON.

## Workflow A — Ship a fleet policy bundle

Run **in order**; do not publish unsigned JSON.

```bash
WORKDIR=/tmp/finsafe-bundle-$(date +%Y%m%d)
mkdir -p "$WORKDIR"
POLICY=/path/to/policy.yaml   # file the operator created or received

finsafe-bundlectl bundle build \
  --from "$POLICY" \
  --out "$WORKDIR/bundle-draft.json"

# Review before sign (jq optional)
jq . "$WORKDIR/bundle-draft.json"

finsafe-bundlectl bundle sign \
  --in "$WORKDIR/bundle-draft.json" \
  --out "$WORKDIR/bundle.jws"
# Record stdout: digest=...

finsafe-bundlectl bundle publish \
  --in "$WORKDIR/bundle.jws" \
  --authority "$FINSAFE_AUTHORITY_PUBLIC_URL"
# Success: published bundle version N
```

### What `bundle build` produces (edit before sign if needed)

- Unsigned **`BundleV1` JSON**
- Auto fields: `bundle_id` like `bundle_YYYYMMDD`, `version: 1`, `expires_at` ~7 days ahead
- Default binding: one entry `id: "default"`, `program: "*"`, `os: ["linux","macos"]`
- For tenant/group/device rules, edit the JSON manually before `bundle sign`

### After publish — verify from the workstation

```bash
curl -sf "$FINSAFE_AUTHORITY_PUBLIC_URL/.well-known/finsafe/jwks.json"
curl -sf "$FINSAFE_AUTHORITY_PUBLIC_URL/v1/bundles/current" | head -c 200
curl -sf "$FINSAFE_AUTHORITY_PUBLIC_URL/v1/license/status"
```

Enrolled agents pick up the bundle on the next heartbeat; no per-desktop bundle file push.

## Workflow B — Managed-required sentinel (MDM)

Independent of bundle publish.

```bash
finsafe-bundlectl sentinel sign --out /tmp/managed-required.jws
```

Deploy **`/tmp/managed-required.jws`** to each managed machine as:

```text
/etc/finsafe/managed-required.json
```

Use your MDM or configuration management (Jamf, Intune, Ansible, etc.). The sentinel JWS tells desktops the authority URL and expected JWKS thumbprint; **policy content** still comes from `bundle publish` → agent pull.

**Regenerate and redeploy** the sentinel when you rotate `signing_key.bin` or change the public authority URL.

## Authority server checklist (operator coordinates with server admin)

Bundlectl does not install the authority. Before `bundle publish` succeeds:

1. `finsafe-authority-http` listening on the URL in `FINSAFE_AUTHORITY_PUBLIC_URL`
2. `license.jws` installed at `/etc/finsafe/license.jws` (or `FINSAFE_LICENSE_PATH`)
3. `signing_key.bin` at the path configured on the server (default under `/var/lib/finsafe-authority/`)
4. Same `signing_key.bin` (or copy) available to bundlectl via `FINSAFE_AUTHORITY_SIGNING_KEY`
5. Network: workstation can `curl` the authority health/JWKS endpoints
6. Protect `POST /v1/admin/bundles` and `/admin/` at the reverse proxy (no built-in admin auth)

## Security rules for agents

1. Run bundlectl only on a **locked operator machine**, never on employee laptops.
2. Never commit or paste `signing_key.bin`, `bundle.jws`, or `license.jws` into tickets or git.
3. Treat `FINSAFE_AUTHORITY_SIGNING_KEY` like a **CA private key**; rotation requires re-enrollment planning.
4. Do not expose admin bundle APIs to the public internet without IP allowlist, SSO, or mTLS.
5. Workflow: **build → review JSON → sign → publish once** per change.

## Troubleshooting

| Symptom | Likely cause | Action |
|---------|----------------|--------|
| `usage: finsafe-bundlectl bundle ...` | Wrong subcommand | Use exact tree above |
| `missing flag --in` | Wrong flag | `--in` for sign and publish |
| `publish failed: 402` | No valid `license.jws` on authority | Install Finogeeks license on **server** only |
| `publish failed: 4xx/5xx` | Bad URL, proxy, or bundle JSON | Fix `--authority` base URL; check server logs |
| `bad signing key length` | Corrupt key file | Restore 32-byte Ed25519 seed |
| Agents stale policy | JWKS/key mismatch or heartbeat delay | Same key on server and bundlectl; wait for agent heartbeat |
| Enroll fails with sentinel | URL or thumbprint drift | Re-run `sentinel sign` after key/URL change; redeploy MDM file |

## Optional online reference (full URLs only)

Use only if the operator needs more than this skill:

- Releases and archive names: https://github.com/finogeeks/finsafe/releases
- Authority install, license, systemd: https://github.com/finogeeks/finsafe/blob/main/docs/authority-deployment.md
- Fleet rollout phases: https://github.com/finogeeks/finsafe/blob/main/docs/enterprise-deployment-runbook.md
- Example wrapper policies (download raw): https://github.com/finogeeks/finsafe/tree/main/examples/wrapper-policies
