# Licensing E2E — macOS developer guide

**中文：** [licensing-e2e-macos-zh.md](./licensing-e2e-macos-zh.md)

Scriptable checks for **commercial license gates** on Policy Authority and a minimal
**managed enroll + run** path on macOS. Docker is **not** required for licensing;
use OrbStack or Linux only when you need Landlock or Linux-only harness scripts.

Related docs:

- [authority-deployment.md](../authority-deployment.md) — production `license.jws` install
- [managed-mode-matrix.md](./managed-mode-matrix.md) — full managed acceptance matrix
- [managed-mode-macos-runbook.md](./managed-mode-macos-runbook.md) — manual fleet steps on Mac

Scripts live in the FinSAFE source repo: [`scripts/managed-mode/`](../../../../scripts/managed-mode/).

---

## Test layers (recommended order)

| Layer | What it proves | Command |
|-------|----------------|---------|
| **0 — Unit** | JWS verify, expiry, grace, features, seat math | `cargo test -p finsafe-license -p finsafe-authority` |
| **1 — HTTP gates** | `402` without license; `200` with license; seat cap | `./scripts/managed-mode/license-suite.sh …` |
| **2 — Full macOS E2E** | Build, issue dev license, both authorities, managed run | `./scripts/managed-mode/e2e-licensing-macos.sh` |
| **3 — Linux parity** | Landlock, `run-suite.sh`, `tamper-suite.sh` | OrbStack VM or CI; see [managed-mode-matrix.md](./managed-mode-matrix.md) |
| **4 — Pilot** | Two hosts, real MDM, production JWKS | [enterprise-deployment-runbook.md](../enterprise-deployment-runbook.md) |

Layer **2** is the default pre-PR gate on a Mac with Rust installed.

---

## Prerequisites

- **macOS** (Apple Silicon or Intel) with Xcode CLI tools or a Rust toolchain (`cargo`).
- **`curl`** and **`jq`** on `PATH`.
- FinSAFE repo checkout (this document assumes repo root).

No PostgreSQL, Docker, or root is required for the automated E2E script.

---

## One-command full E2E

From the repository root:

```bash
./scripts/managed-mode/e2e-licensing-macos.sh
```

The script:

1. Builds enterprise binaries (`finsafe`, `finsafe-agent`, `finsafe-authority-http`, `finsafe-bundlectl`) and internal `finsafe-licensectl`.
2. Issues a **dev** license (`max_devices=2`, ~1 year expiry) with a temp signing keypair.
3. Starts **unlicensed** authority on `127.0.0.1:8091` → runs `license-suite.sh missing`.
4. Starts **licensed** authority on `127.0.0.1:8090` → runs `licensed` and `seat-limit`.
5. Restarts licensed authority with a **fresh DB**, publishes a smoke bundle, enrolls agent in an isolated state dir, runs `finsafe run --json -- /usr/bin/true`.
6. Runs `cargo test -p finsafe-license -p finsafe-authority`.

Success ends with:

```text
OK: licensing E2E complete (state kept at …)
```

Exit code **0**.

---

## Partial runs (authority already up)

Point `FINSAFE_AUTHORITY_URL` at a running `finsafe-authority-http`, then:

```bash
export FINSAFE_AUTHORITY_URL=http://127.0.0.1:8090

# Expect 402 + LICENSE_MISSING on admin/enroll when no license file is loaded
./scripts/managed-mode/license-suite.sh missing

# Expect valid/grace status, 200 on admin devices and enroll token
./scripts/managed-mode/license-suite.sh licensed

# Fill max_devices enrollments, then expect 402 + LICENSE_SEAT_LIMIT
./scripts/managed-mode/license-suite.sh seat-limit
```

`license-suite.sh` writes response bodies to `/tmp/finsafe-license-suite-body.json`.

---

## What each gate checks

### `missing`

| Endpoint | Expected |
|----------|----------|
| `GET /health` | `200` |
| `GET /v1/license/status` | `200` (reports missing/invalid) |
| `GET /v1/admin/devices` | `402`, JSON `code`: `LICENSE_MISSING` |
| `POST /v1/enroll/token` | `402`, JSON `code`: `LICENSE_MISSING` |

### `licensed`

| Check | Expected |
|-------|----------|
| `GET /v1/license/status` | `status` is `valid` or `grace` |
| `GET /v1/admin/devices` | `200` |
| `POST /v1/enroll/token` | `200` |

### `seat-limit`

Enrolls `max_devices` distinct `device_id` values via `POST /v1/enroll`, then enrolls one more and expects **`402`** with `LICENSE_SEAT_LIMIT`.

Requires the authority license payload to include `max_devices` (the E2E script issues `max_devices=2`).

### Managed block (inside `e2e-licensing-macos.sh`)

After seat tests, the script restarts the licensed authority so the DB is empty again, then:

1. `finsafe-bundlectl bundle build/sign/publish` (smoke wrapper policy).
2. Starts `finsafe-agent` with `FINSAFE_MANAGED_STATE_DIR` under a temp tree.
3. Waits for `enrolled.json`.
4. Asserts `finsafe run --json` reports `exit_code == 0` or `envelope.policy_source == "managed"`.

Without a published bundle, managed run fails with `MANAGED_DAEMON_UNREACHABLE: no active bundle`.

---

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `FINSAFE_E2E_BIND_UNLICENSED` | `127.0.0.1:8091` | Unlicensed authority listen address |
| `FINSAFE_E2E_BIND_LICENSED` | `127.0.0.1:8090` | Licensed authority listen address |
| `FINSAFE_E2E_MANAGED` | `1` | Set `0` to skip managed enroll/run (license HTTP only) |
| `FINSAFE_E2E_DIR` | _(temp)_ | State directory; printed at end of run |
| `FINSAFE_E2E_DIR_REUSE` | _(unset)_ | With `FINSAFE_E2E_DIR`, reuse paths instead of `mktemp` |
| `FINSAFE_AUTHORITY_URL` | _(script sets)_ | Target for `license-suite.sh` |
| `FINSAFE_LICENSE_PATH` | `/etc/finsafe/license.jws` in prod | JWS path for authority process |
| `FINSAFE_LICENSE_VERIFY_PUBKEY_FILE` | embedded key in release | E2E overrides with temp verifying key |
| `FINSAFE_LICENSE_SIGNING_KEY` | _(E2E only)_ | Dev issuer key; **never** ship to customers |

Production authorities use Finogeeks-issued `license.jws` and the embedded verifying key; see [authority-deployment.md](../authority-deployment.md).

Internal issuer (dev/CI only):

```bash
FINSAFE_BUILD_LICENSE_ISSUER=1 ./scripts/build-finsafe-enterprise.sh
finsafe-licensectl keygen --out /tmp/license-signing.bin
finsafe-licensectl issue --customer-id acme --subject pilot --max-devices 100 \
  --expires-at 2027-01-01T00:00:00Z --out /tmp/license.jws
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| `authority did not become healthy` | Port in use or crash on start | Read `authority-*.log` under `FINSAFE_E2E_DIR`; change bind ports |
| `admin-devices code=` (not `LICENSE_MISSING`) | Stale license file on “unlicensed” instance | E2E uses nonexistent `no-license.jws`; ensure `FINSAFE_LICENSE_PATH` points there |
| `seat-limit: license has no max_devices` | License without seat cap | Re-issue with `--max-devices N` |
| `MANAGED_DAEMON_UNREACHABLE: no active bundle` | No bundle published | Run bundlectl publish before agent (full E2E does this automatically) |
| `enrolled.json missing` | Agent cannot reach authority or bad enroll token | Inspect `$E2E_DIR/desktop/agent.log` |
| `managed run: unexpected output` | Agent stopped or policy deny | Re-run with `FINSAFE_E2E_DIR_REUSE=1` and same `FINSAFE_E2E_DIR` to inspect logs |

Reuse state from the last run:

```bash
export FINSAFE_E2E_DIR=/path/printed/at/end
export FINSAFE_E2E_DIR_REUSE=1
./scripts/managed-mode/e2e-licensing-macos.sh
```

---

## CI and local Rust gates

Before opening a PR that touches licensing or authority:

```bash
cargo fmt --all -- --check
cargo clippy -p finsafe-license -p finsafe-authority -- -D warnings
cargo test -p finsafe-license -p finsafe-authority
./scripts/managed-mode/e2e-licensing-macos.sh
```

Public release archives must **not** contain `finsafe-licensectl`; see `scripts/assert-public-release-archive.sh`.

---

## Mapping to acceptance matrix

| Matrix concern | Covered by |
|----------------|------------|
| License missing blocks admin/enroll | `license-suite.sh missing` |
| Valid license unlocks fleet APIs | `license-suite.sh licensed` |
| Seat enforcement | `license-suite.sh seat-limit` |
| Enroll + managed run | `e2e-licensing-macos.sh` (managed section) |
| Tamper, kill switch, rotation | [managed-mode-matrix.md](./managed-mode-matrix.md) (other scripts) |

Add a row to the matrix when you introduce a new license `code` or protected route.
