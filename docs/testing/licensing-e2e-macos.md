# Licensing E2E — macOS guide

**中文：** [licensing-e2e-macos-zh.md](./licensing-e2e-macos-zh.md)

> **Audience:** Customer IT and security teams validating **commercial licensing** and managed APIs during a pilot. Use **release binaries** from [GitHub Releases](https://github.com/finogeeks/finsafe/releases) and a **Finogeeks-issued** `license.jws`.

Related docs:

- [authority-deployment.md](../authority-deployment.md) — production `license.jws` install
- [managed-mode-matrix.md](./managed-mode-matrix.md) — managed acceptance checklist
- [managed-mode-macos-runbook.md](./managed-mode-macos-runbook.md) — manual fleet steps on Mac

---

## Customer pilot verification

**Recommended skill:** [finsafe-enterprise-setup/SKILL.md](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-enterprise-setup/SKILL.md) (full phased setup).

**Single-machine lab:** [managed-lab.md](./managed-lab.md) (`./scripts/managed-lab.sh start` with `FINSAFE_LICENSE_PATH`).

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

## Mapping to acceptance matrix

| Matrix concern | How to verify |
|----------------|---------------|
| License missing blocks admin/enroll | `402` on admin/enroll without `license.jws` |
| Valid license unlocks fleet APIs | `/v1/license/status` + admin `200` |
| Seat enforcement | Enroll over `max_devices` in license |
| Enroll + managed run | [managed-mode-macos-runbook.md](./managed-mode-macos-runbook.md) or [managed-lab.md](./managed-lab.md) |
| Tamper, kill switch, rotation | [managed-mode-matrix.md](./managed-mode-matrix.md) checklist |

Add a matrix row when introducing a new license `code` or protected route.
