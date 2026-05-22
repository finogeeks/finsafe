# Vendor-neutral fleet checklist (no Jamf / Intune required)

**中文：** [vendor-neutral-checklist-zh.md](./vendor-neutral-checklist-zh.md)

FinSAFE managed mode does **not** depend on a specific MDM product. Any tool—or manual IT process—that can install root-owned files, keep a system daemon running, and run a one-time script is sufficient.

Use this checklist when your customer uses **Ansible, Chef, Puppet, Kandji, Workspace ONE, golden images, SSH + scripts**, or internal packaging only.

**Related:** [endpoint deployment options](../endpoint-deployment-options.md) · [binary reference](../binary-reference.md) · [enterprise deployment runbook](../enterprise-deployment-runbook.md) · [managed-mode.md](../managed-mode.md) · [example scripts](../../packaging/mdm/examples/)

---

## Central (once per organization)

| # | Task | Done when |
|---|------|-----------|
| C0 | Install **commercial license** (`license.jws`) on authority host | `GET /v1/license/status` shows `valid` or `grace`; enroll token not `402` |
| C1 | Deploy **Policy Authority** (`finsafe-authority-http`) with TLS | `GET /health` returns OK |
| C2 | Protect **signing key**; operators use `finsafe-bundlectl` on a secure host | JWKS at `/.well-known/finsafe/jwks.json` |
| C3 | **Build, sign, publish** initial policy bundle | `GET /v1/bundles/current` returns JWS |
| C4 | **Sign managed-required sentinel** | `finsafe-bundlectl sentinel sign --out managed-required.jws` |
| C5 | Document **authority URL** for all endpoints | e.g. `https://gov.example.com/policy-authority` |
| C6 | Define **device_id** scheme | hostname, asset tag, serial, or MDM id—stable per machine |

---

## Per-machine delivery (any deployment tool)

Map each row to **one step** in your tool (package, file copy, systemd, script, profile).

| # | Deliverable | Path / behavior | Your tool’s action |
|---|-------------|-----------------|-------------------|
| M1 | `finsafe` binary | `/usr/local/bin/finsafe` mode `0755` | PKG / deb / copy / image bake |
| M1a | Linux companions (`finsafe-helper`, `finsafe-supervisor`, `finsafe-landlock-shim`) | Same directory as `finsafe` | Ship from Linux `finsafe-v*` archive; **not** on macOS |
| M2 | `finsafe-agent` binary | `/usr/local/bin/finsafe-agent` mode `0755` | `finsafe-fleet-v*` release archive |
| M3 | State directories | `/etc/finsafe`, `/var/lib/finsafe` (and cache/audit subdirs) | `mkdir` in preinstall |
| M4 | **Sentinel** (signed JWS, one line) | `/etc/finsafe/managed-required.json` | Secure file deploy; root-owned |
| M5 | **Agent service** | Linux: `finsafe-agent.service`; macOS: LaunchDaemon plist | Enable at boot |
| M6 | `FINSAFE_AUTHORITY_URL` | Agent service environment | Config profile / unit drop-in |
| M7 | **One-time enroll** (pilot wave) | `FINSAFE_ENROLL_TOKEN` + `FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID` on agent only | Script or profile; **remove token after** |
| M8 | Remove enroll secret | No `FINSAFE_ENROLL_TOKEN` in persistent config | Second script or profile revision |
| M9 | App launch command | `finsafe run -- <program> …` | App team docs; no `--policy` on fleet |

**Reference units:** [`packaging/systemd/finsafe-agent.service`](../../packaging/systemd/finsafe-agent.service) · [`packaging/launchd/com.finogeeks.finsafe-agent.plist`](../../packaging/launchd/com.finogeeks.finsafe-agent.plist)

---

## Map your product to these steps

| If you use… | Typical mapping |
|-------------|-----------------|
| **Ansible / Chef / Puppet / Salt** | Roles implement M1–M8; see [ansible.md](./ansible.md) |
| **Kandji / Workspace ONE / Iru / SimpleMDM** | Custom profile = M4–M6; script policy = M7–M8 (same as [jamf.md](./jamf.md) / [intune.md](./intune.md) scripts) |
| **Munki / Autopkg** (macOS) | PKG for M1–M2; postinstall for M4–M6 |
| **Golden image / cloud-init** | Bake M1–M6; first-boot script for M7 |
| **SSH + runbook** | Manual C1–C6, then scp + systemctl/launchctl for M1–M8 |
| **Internal apt/yum repo** | Package installs M1–M2 + unit; config package for M4 |

Jamf and Intune are **optional** playbooks for two common UIs—not requirements.

---

## Verification (per machine)

Run after deployment (support session or automation):

```bash
# Binaries
test -x /usr/local/bin/finsafe && test -x /usr/local/bin/finsafe-agent

# Managed mode forced
test -f /etc/finsafe/managed-required.json && echo "sentinel ok"

# Enrollment
test -f /etc/finsafe/enrolled.json && jq -r .device_id /etc/finsafe/enrolled.json

# Agent
test -S /run/finsafe-agent.sock && echo "agent socket ok"

# Policy from authority (should not use local --policy)
finsafe run --json -- /usr/bin/true 2>&1 | head -c 500

# Negative: personal mode blocked
finsafe run --personal -- /usr/bin/true 2>&1 | grep -q MANAGED_FORCED_BY_POLICY && echo "enforce ok"
```

---

## Enrollment token workflow (all vendors)

1. IT: `POST /v1/enroll/token` on authority (or admin UI).
2. Deploy a unique token **only** to one agent service env (never user shell profile).
3. Restart agent; confirm `/etc/finsafe/enrolled.json` exists.
4. **Revoke token from all profiles** (MDM revision, Ansible var cleared, etc.).
5. Confirm agent still runs and pulls bundles without token in env.

Enrollment binds `FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID` to the agent's local device
key. If a second machine tries to enroll with the same `device_id`, the authority
rejects it unless it proves the same device key.

Example scripts (adapt parameter names to your tool):

- macOS/Linux shell: [`packaging/mdm/examples/generic/enroll-once.sh`](../../packaging/mdm/examples/generic/enroll-once.sh)
- Jamf variant: [`packaging/mdm/examples/jamf/enroll-once.sh`](../../packaging/mdm/examples/jamf/enroll-once.sh)
- Intune variant: [`packaging/mdm/examples/intune/macos-enroll-once.sh`](../../packaging/mdm/examples/intune/macos-enroll-once.sh)

---

## What you cannot skip for “managed” enforcement

| Skipped | Result |
|---------|--------|
| Sentinel + enroll | Users may stay in **personal** mode (`--policy` file) |
| Agent running | `MANAGED_DAEMON_UNREACHABLE`; fail-closed if sentinel present |
| Fixed binary paths | Heartbeat digest attestation may not match |
| Authority unreachable | Stale cache or deny per bundle `stale_behavior` |

---

## Out of scope (set expectations)

- **Windows** desktop agent: not in managed-mode v1 (Linux + macOS only).
- **Local admin adversary**: can remove sentinel/agent; needs MDM lockdown + monitoring, not software alone.
- **Non-FinSAFE launches**: users can still run binaries without `finsafe run` unless you block separately.

---

## Pilot → production gates

- [ ] C1–C6 complete on authority side  
- [ ] Canary group (10–50 machines) passes verification block above  
- [ ] Tamper spot-checks from [managed-mode matrix](../testing/managed-mode-matrix.md)  
- [ ] App teams updated to `finsafe run --` only  
- [ ] Enroll token removed from all persistent configs  
- [ ] SIEM / audit path for `POST /v1/audit/events` defined  
- [ ] Rollback runbook read ([enterprise runbook §9](../enterprise-deployment-runbook.md#9-rollback))  

---

## Other platform guides

| Guide | When |
|-------|------|
| [ansible.md](./ansible.md) | Config management on Linux |
| [jamf.md](./jamf.md) | Jamf Pro |
| [intune.md](./intune.md) | Microsoft Intune |
