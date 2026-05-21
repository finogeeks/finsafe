# Licensing E2E — macOS guide

**中文：** [licensing-e2e-macos-zh.md](./licensing-e2e-macos-zh.md)

> **Audience**
>
> | You are | Use this document |
> |---------|-------------------|
> | **Customer IT / pilot** | [Customer pilot verification](#customer-pilot-verification) below, plus [finsafe-enterprise-setup skill](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-enterprise-setup/SKILL.md) and [authority-deployment.md](../authority-deployment.md). |
> | **Finogeeks engineering** | [Finogeeks automated harness](#finogeeks-automated-harness) — requires the **private FinSAFE source repository** (not shipped on `finogeeks/finsafe`). |

Related docs:

- [authority-deployment.md](../authority-deployment.md) — production `license.jws` install
- [managed-mode-matrix.md](./managed-mode-matrix.md) — managed acceptance checklist
- [managed-mode-macos-runbook.md](./managed-mode-macos-runbook.md) — manual fleet steps on Mac

---

## Customer pilot verification

Use **release binaries** and a **Finogeeks-issued** `license.jws`. No Rust toolchain or private repo scripts are required.

**Recommended skill:** [finsafe-enterprise-setup/SKILL.md](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-enterprise-setup/SKILL.md) (full phased setup).

### 1. Authority + license

Install `finsafe-authority-http` from `finsafe-admin-server-v*` on [Releases](https://github.com/finogeeks/finsafe/releases). Place `license.jws` at `/etc/finsafe/license.jws` per [authority-deployment §2.1](../authority-deployment.md#21-commercial-license-managed-mode).

### 2. HTTP license gates (curl)

```bash
AUTHORITY=https://gov.example.com/policy-authority

curl -sf "$AUTHORITY/health"
curl -sf "$AUTHORITY/v1/license/status" | jq .
curl -sf "$AUTHORITY/v1/admin/devices" | jq .
curl -sf -X POST "$AUTHORITY/v1/enroll/token" | jq .
```

| Check | Expected (with valid license) |
|-------|-------------------------------|
| `GET /health` | `200` |
| `GET /v1/license/status` | `status` is `valid` or `grace` |
| `GET /v1/admin/devices` | `200` |
| `POST /v1/enroll/token` | `200` |

Without `license.jws`, admin and enroll return **`402`** with JSON `code`: `LICENSE_MISSING`.

Seat limits: enroll `max_devices` distinct devices, then expect **`402`** / `LICENSE_SEAT_LIMIT` on the next enroll (requires `max_devices` in the license payload).

### 3. Publish bundle + managed run

Follow [finsafe-bundlectl skill](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-bundlectl/SKILL.md), then [managed-mode-macos-runbook.md](./managed-mode-macos-runbook.md).

```bash
finsafe run --json -- /usr/bin/true | jq '.envelope.policy_source // .exit_code'
```

Expect `policy_source == "managed"` (or exit `0`) when enrolled, sentinel present, and a bundle is published.

### 4. Production pilot

Two hosts, real MDM, production JWKS: [enterprise-deployment-runbook.md](../enterprise-deployment-runbook.md).

---

## Finogeeks automated harness

The following layers run only in the **Finogeeks private FinSAFE monorepo** (scripts are not published on `finogeeks/finsafe`).

Docker is **not** required for licensing on macOS; use OrbStack or Linux only for Landlock or Linux-only harness scripts.

### Test layers (engineering)

| Layer | What it proves | Command (private repo) |
|-------|----------------|------------------------|
| **0 — Unit** | JWS verify, expiry, grace, features, seat math | `cargo test -p finsafe-license -p finsafe-authority` |
| **1 — HTTP gates** | `402` without license; `200` with license; seat cap | `scripts/managed-mode/license-suite.sh …` |
| **2 — Full macOS E2E** | Build, dev `license.jws`, both authorities, managed run | `scripts/managed-mode/e2e-licensing-macos.sh` |
| **2b — macOS managed + Hermes** | licensectl + bundlectl + enroll + Hermes under Seatbelt | `scripts/managed-mode/e2e-mac-authority-hermes.sh` |
| **3 — Linux parity** | Landlock, `run-suite.sh`, `tamper-suite.sh` | OrbStack VM or CI; see [managed-mode-matrix.md](./managed-mode-matrix.md) |
| **4 — Pilot** | Two hosts, real MDM, production JWKS | [enterprise-deployment-runbook.md](../enterprise-deployment-runbook.md) |

Layer **2** is the default pre-PR gate on a Mac with Rust installed.

### Prerequisites (engineering)

- **macOS** with Xcode CLI tools or Rust (`cargo`).
- **`curl`** and **`jq`** on `PATH`.
- Private FinSAFE repository checkout.

### One-command full E2E (engineering)

From the private repository root:

```bash
./scripts/managed-mode/e2e-licensing-macos.sh
```

The script builds enterprise binaries, prepares a **dev** `license.jws` (not for production), runs license suites on unlicensed/licensed authorities, publishes a smoke bundle, enrolls an agent, and runs `finsafe run --json`.

### Partial runs (authority already up)

```bash
export FINSAFE_AUTHORITY_URL=http://127.0.0.1:8090
./scripts/managed-mode/license-suite.sh missing
./scripts/managed-mode/license-suite.sh licensed
./scripts/managed-mode/license-suite.sh seat-limit
```

### CI gates (engineering)

```bash
cargo fmt --all -- --check
cargo clippy -p finsafe-license -p finsafe-authority -- -D warnings
cargo test -p finsafe-license -p finsafe-authority
./scripts/managed-mode/e2e-licensing-macos.sh
```

---

## Mapping to acceptance matrix

| Matrix concern | Customer (curl / runbook) | Engineering (private scripts) |
|----------------|---------------------------|-----------------------------|
| License missing blocks admin/enroll | `402` on admin/enroll without `license.jws` | `license-suite.sh missing` |
| Valid license unlocks fleet APIs | `/v1/license/status` + admin `200` | `license-suite.sh licensed` |
| Seat enforcement | Manual enroll over `max_devices` | `license-suite.sh seat-limit` |
| Enroll + managed run | macOS runbook + `finsafe run --json` | `e2e-licensing-macos.sh` |
| Tamper, kill switch, rotation | [managed-mode-matrix.md](./managed-mode-matrix.md) checklist | `tamper-suite.sh`, etc. |

Add a matrix row when introducing a new license `code` or protected route.
