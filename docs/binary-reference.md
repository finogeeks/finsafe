# FinSAFE binary reference (administrators)

**中文：** [binary-reference-zh.md](./binary-reference-zh.md)

This document lists **every operator-facing binary** in a FinSAFE deployment, which release archive it ships in, and which machines need it. Use it with [authority-deployment.md](./authority-deployment.md) (Policy Authority + license) and [enterprise-deployment-runbook.md](./enterprise-deployment-runbook.md) (fleet rollout).

---

## Suite at a glance

```text
  OPERATOR / SERVER                         MANAGED DESKTOP (each)
  ─────────────────                         ────────────────────────
  finsafe-authority-http  ◄──HTTPS──►       finsafe-agent
  finsafe-bundlectl (ops)                   finsafe  ◄──UDS──► agent
  license.jws (file, not a binary)          managed-required.json (JWS file)
                                            enrolled.json (written by agent)

  Linux desktop only (beside finsafe):
    finsafe-helper, finsafe-supervisor, finsafe-landlock-shim
```

| Role | Binaries | Typical host |
|------|----------|--------------|
| **Policy Authority** | `finsafe-authority-http` | Linux server (x86_64 admin archive today) |
| **Policy signing / publish** | `finsafe-bundlectl` | Secure operator workstation |
| **Commercial license** | `license.jws` (JWS file) | Authority server `/etc/finsafe/` |
| **Managed desktop** | `finsafe`, `finsafe-agent` | Every enrolled laptop/workstation |
| **Linux confinement helpers** | `finsafe-helper`, `finsafe-supervisor`, `finsafe-landlock-shim` | Same Linux desktops as `finsafe` (fixed paths) |

---

## Release archives (what IT downloads)

Public [GitHub Releases](https://github.com/finogeeks/finsafe/releases) ship three archive families on the same version tag. Verify **`SHA256SUMS`** before install. **`install.sh`** downloads only the personal **`finsafe-v*`** archives.

| Archive | Platforms | Contents |
|---------|-----------|----------|
| **`finsafe-v<version>-<target>.tar.zst`** | Linux x86_64, macOS Intel, macOS Apple Silicon | Personal-mode `finsafe` (+ Linux companions); see platform table below |
| **`finsafe-fleet-v<version>-<target>.tar.zst`** | Same three targets | Managed `finsafe` + `finsafe-agent` (+ Linux companions on Linux) |
| **`finsafe-admin-v<version>-x86_64-unknown-linux-gnu.tar.zst`** | Linux x86_64 (authority host) | `finsafe-authority-http`, `finsafe-bundlectl` |

**Not in any public archive:**

| Name | Why |
|------|-----|
| `license.jws` | Commercial entitlement; issued by Finogeeks (required to operate managed authority APIs) |
| `finsafe-licensectl` | Finogeeks internal license issuance only |

CI checks each archive family: personal **`finsafe-v*`** must exclude agent/authority binaries; **`finsafe-fleet-v*`** must include `finsafe` and `finsafe-agent`; **`finsafe-admin-v*`** must include authority binaries only.

---

## Platform matrix (desktop CLI archive)

| Binary | Linux x86_64 | macOS (Intel / ARM) | Purpose |
|--------|:------------:|:-------------------:|---------|
| **`finsafe`** | ✓ | ✓ | User and app-facing CLI: `run`, `self-confine`, `probe`, `doctor`, managed resolution via agent |
| **`finsafe-agent`** | ✓ (fleet) | ✓ (fleet) | Background daemon: enroll, pull bundles, UDS policy server, heartbeat, audit spool — **`finsafe-fleet-v*` archive** |
| **`finsafe-helper`** | ✓ | — | Privileged helper for cgroup/overlay operations (Linux bubblewrap path) |
| **`finsafe-supervisor`** | ✓ | — | Attach-before-exec for cgroup limits (preferred over shell wrapper) |
| **`finsafe-landlock-shim`** | ✓ | — | Applies Landlock policy inside the sandbox before payload `exec` |
| **`finsafe-authority-http`** | ✓ (admin archive) | — (build from source possible) | Central Policy Authority HTTP service |
| **`finsafe-bundlectl`** | ✓ (admin archive) | — (build from source possible) | Build / sign / publish bundles and managed-required sentinel |

**macOS note:** Managed mode on Mac uses **Seatbelt** (`sandbox-exec`) inside `finsafe`; there is no `finsafe-landlock-shim` on Darwin. Linux managed desktops need all four Linux user-facing binaries (`finsafe` + three companions) on a **fixed path** (recommended `/usr/local/bin/`) so auto-discovery and heartbeat digests stay stable.

---

## Per-binary reference

### `finsafe`

- **Audience:** End users, agent runtimes, scripts invoking `finsafe run -- …`
- **Install path:** `/usr/local/bin/finsafe` (production); do not use per-user `~/bin` on fleet machines
- **Modes:** Personal (`--policy` YAML) when no sentinel/enrollment; managed when sentinel and/or `enrolled.json` present
- **Archive:** Public `finsafe-v*` (all platforms)

### `finsafe-agent`

- **Audience:** IT-deployed system service on managed desktops
- **Install path:** `/usr/local/bin/finsafe-agent` + systemd/LaunchDaemon unit ([packaging/](../packaging/))
- **Key env:** `FINSAFE_AUTHORITY_URL`, `FINSAFE_ENROLL_TOKEN` (one-time), `FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID`
- **Writes:** `/etc/finsafe/enrolled.json`, `/var/lib/finsafe/cache/`, `/var/lib/finsafe/audit/`, `/run/finsafe-agent.sock`
- **Archive:** `finsafe-fleet-v*` (all supported desktop targets)

### `finsafe-authority-http`

- **Audience:** Central IT / platform team
- **Install path:** `/usr/local/bin/finsafe-authority-http` on authority host
- **Requires:** Valid `license.jws` at `FINSAFE_LICENSE_PATH` for admin, enroll, bundle, and fleet audit APIs
- **Data:** `FINSAFE_AUTHORITY_DB`, `FINSAFE_AUTHORITY_SIGNING_KEY`, `FINSAFE_AUTHORITY_PUBLIC_URL`
- **Archive:** `finsafe-admin-v*` (Linux x86_64)

### `finsafe-bundlectl`

- **Audience:** Security / platform operators (not end users)
- **Commands:** `bundle build|sign|publish`, `sentinel sign`
- **Run on:** Locked operator workstation with access to authority signing key
- **Archive:** `finsafe-admin-v*` (Linux x86_64)

### `finsafe-helper` (Linux only)

- **Audience:** Invoked by `finsafe` for privileged cgroup/overlay steps
- **Install:** Same directory as `finsafe` (sibling auto-discovery)
- **Archive:** Inside public Linux `finsafe-v*` archive

### `finsafe-supervisor` (Linux only)

- **Audience:** Invoked by `finsafe-bwrap` launch path for cgroup attach-before-exec
- **Install:** Sibling of `finsafe` on Linux fleet hosts
- **Archive:** Inside public Linux `finsafe-v*` archive

### `finsafe-landlock-shim` (Linux only)

- **Audience:** Runs inside bubblewrap sandbox when policy uses Landlock `path` mode
- **Install:** Sibling of `finsafe` on Linux fleet hosts
- **Archive:** Inside public Linux `finsafe-v*` archive

### `finsafe-licensectl` (internal)

- **Audience:** Finogeeks operations only — issues `license.jws`
- **Never** ship to customers or include in public/admin release archives
- **Build:** `FINSAFE_BUILD_LICENSE_ISSUER=1 ./scripts/build-finsafe-enterprise.sh` (source repo only)

---

## Non-shipped workspace binaries (out of scope for fleet admins)

These exist in the FinSAFE source tree for adapters, tests, or future platform APIs. **Fleet administrators do not install them** for managed-mode rollout:

| Binary / crate | Role |
|----------------|------|
| `finsafe-server-http` | Separate platform-layer HTTP API (not Policy Authority) |
| Library crates (`finsafe-bwrap`, `finsafe-bundle`, …) | Linked into the binaries above |

---

## Recommended install layout

### Authority server (Linux)

```text
/usr/local/bin/finsafe-authority-http
/usr/local/bin/finsafe-bundlectl          # operator workstation may copy here too
/etc/finsafe/license.jws
/var/lib/finsafe-authority/authority.db
/var/lib/finsafe-authority/signing_key.bin
```

### Managed Linux desktop

```text
/usr/local/bin/finsafe
/usr/local/bin/finsafe-agent
/usr/local/bin/finsafe-helper
/usr/local/bin/finsafe-supervisor
/usr/local/bin/finsafe-landlock-shim
/etc/finsafe/managed-required.json
/etc/finsafe/enrolled.json                 # after enroll
```

### Managed macOS desktop

```text
/usr/local/bin/finsafe
/usr/local/bin/finsafe-agent
/etc/finsafe/managed-required.json
/etc/finsafe/enrolled.json
```

---

## Administrator deployment order

1. **Install authority binaries** and `license.jws` → [authority-deployment.md](./authority-deployment.md) §2–4  
2. **Verify license and APIs** → §5 below and authority doc §5  
3. **Publish initial bundle** with `finsafe-bundlectl` → authority doc §6  
4. **Sign managed-required sentinel** → runbook Phase A.3  
5. **Package desktops:** `finsafe` + `finsafe-agent` (+ Linux companions) → runbook Phase B  
6. **Deploy sentinel, enroll agents, test** `finsafe run` → runbook Phases C–D  
7. **Scripted smoke (dev/CI):** [licensing-e2e-macos.md](./testing/licensing-e2e-macos.md)

---

## Verify managed mode is working (production checklist)

Run after Phases A–D on a **pilot** machine.

### Authority (with license installed)

```bash
AUTHORITY=https://gov.example.com/policy-authority

curl -sf "$AUTHORITY/health"
curl -sf "$AUTHORITY/v1/license/status" | jq .    # expect status valid or grace
curl -sf "$AUTHORITY/.well-known/finsafe/jwks.json" | jq .
curl -sf "$AUTHORITY/v1/bundles/current" | jq .   # 200 after publish; 404 before first publish is OK
curl -sf -X POST "$AUTHORITY/v1/enroll/token" | jq .  # 200 when licensed
```

Protected routes without a license return **HTTP 402** with `code` such as `LICENSE_MISSING` (see [admin-ui.md](./admin-ui.md)).

### Pilot desktop

```bash
test -f /etc/finsafe/managed-required.json && echo sentinel-ok
test -f /etc/finsafe/enrolled.json && jq .authority_url /etc/finsafe/enrolled.json
test -S /run/finsafe-agent.sock && echo agent-socket-ok   # Linux default; macOS may differ — see managed-mode.md
finsafe run --json -- /usr/bin/true | jq '{exit_code, policy_source: .envelope.policy_source}'
```

**Success indicators:**

- `exit_code` is `0` (or policy intentionally denies the command)
- `envelope.policy_source` is `"managed"` when JSON audit is enabled
- `finsafe run --personal -- /usr/bin/true` fails with `MANAGED_FORCED_BY_POLICY` when sentinel is present

### Fleet acceptance

Full matrix: [managed-mode-matrix.md](./testing/managed-mode-matrix.md). macOS licensing script: [licensing-e2e-macos.md](./testing/licensing-e2e-macos.md).

---

## Related documents

| Document | Topic |
|----------|--------|
| [authority-deployment.md](./authority-deployment.md) | Authority install, license, env, bundlectl |
| [enterprise-deployment-runbook.md](./enterprise-deployment-runbook.md) | Phased fleet rollout |
| [managed-mode.md](./managed-mode.md) | Architecture, paths, CLI errors |
| [admin-ui.md](./admin-ui.md) | Admin console and license `402` messages |
| [mdm/vendor-neutral-checklist.md](./mdm/vendor-neutral-checklist.md) | MDM payload checklist |
