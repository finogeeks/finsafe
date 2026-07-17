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

  Windows desktop only (beside finsafe):
    finsafe-winhelper.exe
```

| Role | Binaries | Typical host |
|------|----------|--------------|
| **Policy Authority** | `finsafe-authority-http` | Linux server or macOS dev host (`finsafe-admin-server-v*`) |
| **Policy signing / publish** | `finsafe-bundlectl` | Secure operator workstation (`finsafe-bundlectl-v*`, Linux + macOS) |
| **Commercial license** | `license.jws` (JWS file) | Authority server `/etc/finsafe/` |
| **Managed desktop** | `finsafe`, `finsafe-agent` (`.exe` on Windows) | Every enrolled laptop/workstation |
| **Linux confinement helpers** | `finsafe-helper`, `finsafe-supervisor`, `finsafe-landlock-shim` | Same Linux desktops as `finsafe` (fixed paths) |
| **Windows helper service** | `finsafe-winhelper.exe` | Same Windows desktops as `finsafe.exe` |

---

## Release archives (what IT downloads)

Public [GitHub Releases](https://github.com/finogeeks/finsafe/releases) ship **four archive families** on the same version tag. Verify **`SHA256SUMS`** before install. **`install.sh`** downloads only the personal **`finsafe-v*`** archives.

| Archive | Platforms | Contents |
|---------|-----------|----------|
| **`finsafe-v<version>-<target>.tar.zst`** | Linux x86_64, macOS Intel, macOS Apple Silicon, Windows x86_64 | Personal-mode `finsafe` (+ Linux/Windows companions); see platform table below |
| **`finsafe-fleet-v<version>-<target>.tar.zst`** | Same four desktop targets | Managed `finsafe` + `finsafe-agent` (+ Linux companions on Linux, `finsafe-winhelper.exe` on Windows) |
| **`finsafe-admin-server-v<version>-<target>.tar.zst`** | Linux x86_64, macOS Intel, macOS Apple Silicon | `finsafe-authority-http` only |
| **`finsafe-bundlectl-v<version>-<target>.tar.zst`** | Same three targets as desktop | `finsafe-bundlectl` only (operator workstation) |

**Not in any public archive:**

| Name | Why |
|------|-----|
| `license.jws` | Commercial entitlement; issued by Finogeeks (required to operate managed authority APIs) |

CI checks each archive family: personal **`finsafe-v*`** must exclude agent/authority binaries; **`finsafe-fleet-v*`** must include `finsafe` and `finsafe-agent` (and `finsafe-winhelper.exe` on Windows); **`finsafe-admin-server-v*`** must include only `finsafe-authority-http`; **`finsafe-bundlectl-v*`** must include only `finsafe-bundlectl`.

---

## Platform matrix (desktop CLI archive)

| Binary | Linux x86_64 | macOS (Intel / ARM) | Windows x86_64 | Purpose |
|--------|:------------:|:-------------------:|:---------------:|---------|
| **`finsafe` / `finsafe.exe`** | ✓ | ✓ | ✓ | User and app-facing CLI: `run`, `self-confine`, `probe`, `doctor`, managed resolution via agent |
| **`finsafe-agent` / `finsafe-agent.exe`** | ✓ (fleet) | ✓ (fleet) | ✓ (fleet) | Background daemon/service: enroll, pull bundles, UDS/named-pipe policy server, heartbeat, audit spool — **`finsafe-fleet-v*` archive** |
| **`finsafe-winhelper.exe`** | — | — | ✓ | Windows helper for AppContainer / Windows sandbox support |
| **`finsafe-helper`** | ✓ | — | — | Privileged helper for cgroup/overlay operations (Linux bubblewrap path) |
| **`finsafe-supervisor`** | ✓ | — | — | Attach-before-exec for cgroup limits (preferred over shell wrapper) |
| **`finsafe-landlock-shim`** | ✓ | — | — | Applies Landlock policy inside the sandbox before payload `exec` |
| **`finsafe-authority-http`** | ✓ (`finsafe-admin-server-v*`) | ✓ (`finsafe-admin-server-v*`) | — | Central Policy Authority HTTP service |
| **`finsafe-bundlectl`** | ✓ (`finsafe-bundlectl-v*`) | ✓ (`finsafe-bundlectl-v*`) | — | Build / sign / publish bundles and managed-required sentinel |

**macOS note:** Managed mode on Mac uses **Seatbelt** (`sandbox-exec`) inside `finsafe`; there is no `finsafe-landlock-shim` on Darwin. Linux managed desktops need all four Linux user-facing binaries (`finsafe` + three companions) on a **fixed path** (recommended `/usr/local/bin/`) so auto-discovery and heartbeat digests stay stable. Windows managed desktops use `C:\Program Files\FinSAFE\` by default for binaries and `C:\ProgramData\FinSAFE\` for state.

---

## Per-binary reference

### `finsafe`

- **Audience:** End users, agent runtimes, scripts invoking `finsafe run -- …`
- **Install path:** `/usr/local/bin/finsafe` (production); do not use per-user `~/bin` on fleet machines
- **Modes:** Personal (`--policy` YAML) when no sentinel/enrollment; managed when sentinel and/or `enrolled.json` present
- **Archive:** Public `finsafe-v*` (all platforms)

### `finsafe-agent`

- **Audience:** IT-deployed system service on managed desktops
- **Install path:** `/usr/local/bin/finsafe-agent` + systemd/LaunchDaemon unit on Linux/macOS; `C:\Program Files\FinSAFE\finsafe-agent.exe` as Windows Service `finsafe-agent`
- **Key env:** `FINSAFE_AUTHORITY_URL`, `FINSAFE_ENROLL_TOKEN` (one-time), `FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID`
- **Authority relocation:** When `FINSAFE_AUTHORITY_URL` is set in the agent service environment, it overrides the `authority_url` stored in `/etc/finsafe/enrolled.json` at runtime (heartbeats, bundle pull, JWKS). Use this when the policy authority moves to a new host, IP, or domain without re-enrolling devices.
- **Writes:** Linux/macOS `/etc/finsafe/enrolled.json`, `/var/lib/finsafe/cache/`, `/var/lib/finsafe/audit/`, `/run/finsafe-agent.sock`; Windows `C:\ProgramData\FinSAFE\enrolled.json`, `cache\`, `audit\`, named pipe `\\.\pipe\finsafe-agent`
- **Archive:** `finsafe-fleet-v*` (all supported desktop targets)

### `finsafe-authority-http`

- **Audience:** Central IT / platform team
- **Install path:** `/usr/local/bin/finsafe-authority-http` on authority host
- **Requires:** Valid `license.jws` at `FINSAFE_LICENSE_PATH` for admin, enroll, bundle, and fleet audit APIs
- **Data:** `FINSAFE_AUTHORITY_DB`, `FINSAFE_AUTHORITY_SIGNING_KEY`, `FINSAFE_AUTHORITY_PUBLIC_URL`
- **Archive:** `finsafe-admin-server-v*` (Linux x86_64 for production; macOS for local dev / pilot)

### `finsafe-bundlectl`

- **Audience:** Security / platform operators (not end users)
- **Commands:** `bundle build|sign|publish`, `sentinel sign`
- **Run on:** Locked operator workstation with access to authority signing key (Mac or Linux)
- **Archive:** `finsafe-bundlectl-v*` (Linux x86_64, macOS Intel, macOS Apple Silicon)
- **Agent skill (self-contained):** https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-bundlectl/SKILL.md

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

### `finsafe-server-http` (Sandbox-as-a-Service)

- **Audience:** Platform teams running remote sandbox cells (DeerFlow, adapters, SaaS)
- **Install path:** Native Linux tarball or OCI sidecar
- **Archive:** `finsafe-saas-server-v*` (**Linux x86_64 only** — includes public `finsafe` + helper/shim/supervisor + `daemon.docker.yaml`)
- **Container:** `ghcr.io/finogeeks/finsafe-saas:v<version>` (`linux/amd64`, `linux/arm64`; use this on macOS Docker hosts)
- **Not published:** apple-darwin / Windows saas-server archives (use the OCI image instead)

---

## Non-shipped workspace binaries (out of scope for fleet admins)

These exist in the FinSAFE source tree for adapters, tests, or internal tooling. **Fleet administrators do not install them** for managed-mode rollout:

| Binary / crate | Role |
|----------------|------|
| Library crates (`finsafe-bwrap`, `finsafe-bundle`, …) | Linked into the binaries above |

---

## Recommended install layout

### Authority server (Linux)

```text
/usr/local/bin/finsafe-authority-http
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

### Managed Windows desktop

```text
C:\Program Files\FinSAFE\finsafe.exe
C:\Program Files\FinSAFE\finsafe-agent.exe
C:\Program Files\FinSAFE\finsafe-winhelper.exe
C:\ProgramData\FinSAFE\managed-required.json
C:\ProgramData\FinSAFE\enrolled.json
\\.\pipe\finsafe-agent
```

---

## Administrator deployment order

1. **Install authority binaries** and `license.jws` → [authority-deployment.md](./authority-deployment.md) §2–4  
2. **Verify license and APIs** → §5 below and authority doc §5  
3. **Publish initial bundle** with `finsafe-bundlectl` → authority doc §6  
4. **Sign managed-required sentinel** → runbook Phase A.3  
5. **Package desktops:** `finsafe` + `finsafe-agent` (+ Linux companions or Windows `finsafe-winhelper.exe`) → runbook Phase B  
6. **Deploy sentinel, enroll agents, test** `finsafe run` → runbook Phases C–D  
7. **Pilot verification:** [licensing-e2e-macos.md — customer section](./testing/licensing-e2e-macos.md#customer-pilot-verification) or [finsafe-enterprise-setup skill](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-enterprise-setup/SKILL.md)

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
