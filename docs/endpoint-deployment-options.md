# Endpoint deployment options (enterprise administrators)

**中文：** [endpoint-deployment-options-zh.md](./endpoint-deployment-options-zh.md)

Use this guide to **choose how** your organization rolls out FinSAFE managed mode on employee desktops. FinSAFE does **not** require Jamf, Intune, or any particular MDM product. Those names appear in playbooks only as common examples.

**Read order for IT:**

1. [enterprise-it-overview.md](./enterprise-it-overview.md) — personal vs managed, why fleet governance matters  
2. **This document** — pick central vs desktop delivery method  
3. [enterprise-deployment-runbook.md](./enterprise-deployment-runbook.md) — phased procedures (authority → clients → operations)  
4. [mdm/vendor-neutral-checklist.md](./mdm/vendor-neutral-checklist.md) — per-machine M1–M9 checklist  
5. Platform-specific playbooks under [mdm/README.md](./mdm/README.md) when you want step-by-step UI or Ansible samples  

---

## 1. Choose your operating model

| Model | Where policy runs | Typical endpoint control | FinSAFE components |
|-------|-------------------|--------------------------|-------------------|
| **Managed desktop (recommended for distributed agents)** | Employee Mac/Linux/Windows laptop | Install `finsafe` + `finsafe-agent` + sentinel + enroll | Policy Authority + fleet archives + MDM **or equivalent** |
| **Central execution only** | Your data center / Kubernetes | No FinSAFE agent on user laptops | `finsafe-server` (see [product-one-pager.md](./product-one-pager.md)); clients call HTTPS API |
| **Personal / developer** | User laptop, self-managed | None required | Public `finsafe` CLI + local `--policy` YAML (free; not fleet-governed) |

Most enterprises adopting FinSAFE for **local OpenClaw, Hermes, or similar agents** want **managed desktop**: policy is signed, pulled from **your** Policy Authority, and the CLI cannot fall back to a personal policy file when the sentinel is in place.

**Managed desktop platforms:** Linux, macOS, and Windows. Windows uses `C:\Program Files\FinSAFE` for binaries, `C:\ProgramData\FinSAFE` for state, and `\\.\pipe\finsafe-agent` for CLI ↔ agent IPC.

---

## 2. Choose how to deliver to each desktop

All paths below implement the same **per-machine contract** (M1–M9 in the [vendor-neutral checklist](./mdm/vendor-neutral-checklist.md)). Pick the row that matches your IT capabilities.

| Your situation | Recommended approach | Detailed guide |
|----------------|----------------------|----------------|
| **Jamf Pro** (macOS fleet) | Jamf PKG + configuration profile + one-time enroll policy | [mdm/jamf.md](./mdm/jamf.md) |
| **Microsoft Intune** (macOS + Linux + Windows) | App/PKG/archive + scripts + plist/systemd/Windows Service | [mdm/intune.md](./mdm/intune.md) |
| **Ansible / Puppet / Chef / Salt** (especially Linux) | Playbook role for M1–M8 | [mdm/ansible.md](./mdm/ansible.md) |
| **Golden image or cloud-init** | Bake M1–M6 into image; first-boot script for M7–M8 | [vendor-neutral checklist](./mdm/vendor-neutral-checklist.md) § Map your product |
| **Small fleet, no endpoint automation** | SSH + runbook + generic scripts, or IT pilot installers | [packaging/mdm/examples/generic/](../../packaging/mdm/examples/generic/) · [`install-fleet.sh`](../../install-fleet.sh) / [`install-fleet-windows.ps1`](../../install-fleet-windows.ps1) |
| **Internal apt/yum/PKG repo** | Package binaries + unit; separate package or profile for sentinel + env | Same M1–M8 mapping as Ansible |
| **macOS without Jamf** (Munki, Autopkg, manual PKG) | PKG install + postinstall for sentinel/agent | [testing/managed-mode-macos-runbook.md](./testing/managed-mode-macos-runbook.md) |
| **No root-level install on endpoints** | Do **not** promise managed desktop | Use **central execution** or issue managed Mac/Linux hardware |
| **Windows laptops only** | Windows fleet archive + Intune or GPO; IT pilot: [`install-fleet-windows.ps1`](../../install-fleet-windows.ps1) | [mdm/intune.md](./mdm/intune.md#windows-deployment-intune-or-gpo) |
| **Linux or macOS laptops (IT lab / pilot)** | [`install-fleet.sh`](../../install-fleet.sh) (sudo) or MDM/Ansible for production | [mdm/ansible.md](./mdm/ansible.md) · [mdm/jamf.md](./mdm/jamf.md) |

### Decision flow (short)

```text
Need policy on employee laptops for local agents?
├─ No  → Central finsafe-server / K8s (no fleet agent)
└─ Yes → Can you install root-owned files + a system daemon on each machine?
    ├─ No  → Same as above; or personal mode (not org-governed)
    └─ Yes → Pick delivery tool:
         Jamf / Intune / Ansible / image / SSH / internal repo
         (all map to M1–M9 — not different products)
```

---

## 3. What every managed-desktop path must include

Regardless of Jamf, Ansible, or manual IT, you need **two layers**: central (once per org) and per machine.

### Central (once per organization) — checklist C0–C6

| Item | Purpose |
|------|---------|
| **Policy Authority** (`finsafe-authority-http`) | JWKS, bundles, enroll, heartbeats, audit, kill switch |
| **Commercial `license.jws`** | Required for enroll and admin APIs in production |
| **`finsafe-bundlectl` on a secure operator host** | Build/sign/publish bundles; sign sentinel |
| **HTTPS authority URL** | Single production URL, e.g. `https://gov.example.com/policy-authority` |
| **Stable `device_id` scheme** | Per machine; used at enroll and in admin device list |

Procedure: [authority-deployment.md](./authority-deployment.md) · phases A–B in [enterprise-deployment-runbook.md](./enterprise-deployment-runbook.md).

### Per machine — checklist M1–M9

| Step | What | Who creates it |
|------|------|----------------|
| M1–M2 | `finsafe`, `finsafe-agent` (+ Linux companions or Windows `finsafe-winhelper.exe`) | IT deploys from `finsafe-fleet-v*` archive |
| M3 | `/etc/finsafe`, `/var/lib/finsafe` on Linux/macOS; `C:\ProgramData\FinSAFE` on Windows | IT |
| M4 | `/etc/finsafe/managed-required.json` (signed JWS) | IT deploys; content from `finsafe-bundlectl sentinel sign` |
| M5–M6 | Agent service + `FINSAFE_AUTHORITY_URL` | IT (systemd / LaunchDaemon / Windows Service) |
| M7 | One-time `FINSAFE_ENROLL_TOKEN` + `FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID` on **agent only** | IT injects; agent consumes |
| M8 | Remove enroll token from persistent config | IT after enroll succeeds |
| M9 | Apps use `finsafe run -- <program>` (no `--policy`) | App / platform teams |

Full table: [mdm/vendor-neutral-checklist.md](./mdm/vendor-neutral-checklist.md).

Example scripts (enroll, sentinel, remove token): [packaging/mdm/examples/](../../packaging/mdm/examples/).

---

## 4. Binding desktops to *your* authority (not arbitrary URLs)

End users and local admins **cannot** point fleet machines at a random Policy Authority through normal product UI. Binding is enforced by **infrastructure you control**:

| Control | What it does |
|---------|----------------|
| **`FINSAFE_AUTHORITY_URL` on `finsafe-agent`** | All enroll, bundle pull, JWKS, and heartbeats go to this URL (system service env, not user shell) |
| **One-time enroll token** | Issued by **your** authority (`POST /v1/enroll/token` or admin UI); consumed once per device |
| **`/etc/finsafe/enrolled.json`** | Written by the agent after successful enroll; stores `device_id`, `authority_url`, `jwks_thumbprint` |
| **`/etc/finsafe/managed-required.json`** | Org-signed sentinel; forces managed mode and blocks `--personal` / local `--policy` on the fleet CLI |
| **License + seat limits** | Authority rejects enroll when commercial license or device seats are exhausted |

**IT may change `FINSAFE_AUTHORITY_URL`** when relocating the authority (migration). That is intentional operations work, not end-user choice.

**Optional hardening:** set `FINSAFE_AUTHORITY_REQUIRE_SENTINEL=1` on the authority host so heartbeats without the sentinel file return `tamper_suspected` (see [authority-deployment.md](./authority-deployment.md)).

Local root can still tamper with files or stop the agent; the threat model assumes **managed endpoints with root owned by IT**, not hostile local administrators. See [managed-mode.md](./managed-mode.md).

---

## 5. Sentinel vs enrollment file (MDM distributes only one)

| File | Typical delivery | Created by | Purpose |
|------|------------------|------------|---------|
| **`managed-required.json`** | **Yes** — IT pushes the signed JWS to every machine | `finsafe-bundlectl sentinel sign` | Force managed mode; org-wide same file |
| **`enrolled.json`** | **No** — not a static MDM payload | **`finsafe-agent`** after `POST /v1/enroll` | Per-device enrollment record |

MDM (or Ansible, SSH, image) should:

1. Deploy **sentinel** (M4).  
2. Set **authority URL** on the agent (M6).  
3. Inject **one-time enroll token** + **device id** (M7).  
4. **Verify** `enrolled.json` exists, then **remove** token (M8).

---

## 6. Admin console: `sentinel_present`

In the admin UI or `GET /v1/admin/devices`, **`sentinel_present`** means:

> On the device’s **last heartbeat**, the agent reported whether **`/etc/finsafe/managed-required.json` exists**.

| Value | Meaning |
|-------|---------|
| **`true`** | Fleet machine has the managed-required sentinel (expected for production) |
| **`false`** | Enrolled and checking in, but sentinel file missing — common in **lab/pilot** before M4 is rolled out |

Fix on the endpoint:

```bash
test -f /etc/finsafe/managed-required.json && echo ok || echo missing
```

After deploying the sentinel, the next agent heartbeat should flip the field to `true`. Details: [admin-ui.md](./admin-ui.md).

---

## 7. Recommended rollout phases

Use the same sequence whether you use Jamf, Ansible, or SSH.

| Phase | Scope | Sentinel? | Goal |
|-------|--------|-----------|------|
| **Pilot** | Small group | Optional first | Binaries + agent + enroll; verify bundle pull and `finsafe run --json` |
| **Enforce** | Broader fleet | **Yes** (M4) | Push `managed-required.json`; confirm `--personal` and `--policy` are rejected |
| **Production** | All managed Mac/Linux | Yes | Remove enroll tokens; monitor [admin-ui.md](./admin-ui.md); rotate bundles via authority |

Phased detail: [enterprise-deployment-runbook.md](./enterprise-deployment-runbook.md) § recommended rollout (vendor-neutral checklist closing section).

---

## 8. Platform limits

| Platform | Managed desktop (agent + sentinel + enroll) | Notes |
|----------|---------------------------------------------|--------|
| **Linux** | Supported | Ansible playbook; systemd unit in [packaging/](../../packaging/) |
| **macOS** | Supported | Jamf/Intune/Munki/manual; LaunchDaemon in [packaging/](../../packaging/) |
| **Windows desktop** | Supported | Windows Service `finsafe-agent`, named pipe `\\.\pipe\finsafe-agent`, Intune/GPO PowerShell examples |

---

## 9. When managed desktop is not possible

| Constraint | Practical option |
|------------|------------------|
| Cannot install system daemon on laptops | Run agents against **`finsafe-server`** in your environment; standard desktop compliance (BitLocker, EDR) only |
| Windows-only workforce for local agents | Use the Windows fleet archive plus Intune/GPO deployment; central execution remains an option for locked-down endpoints |
| Developers only, no fleet mandate | **Personal mode** — `finsafe run --policy file.yaml` (not org-enforced) |
| No commercial license yet | Deploy authority in lab; production enroll requires Finogeeks **`license.jws`** |

---

## 10. Quick reference links

| Topic | Document |
|-------|----------|
| All binaries and release archives | [binary-reference.md](./binary-reference.md) |
| Authority install + license | [authority-deployment.md](./authority-deployment.md) |
| Full phased runbook | [enterprise-deployment-runbook.md](./enterprise-deployment-runbook.md) |
| M1–M9 checklist | [mdm/vendor-neutral-checklist.md](./mdm/vendor-neutral-checklist.md) |
| Jamf / Intune / Ansible | [mdm/README.md](./mdm/README.md) |
| Managed mode architecture | [managed-mode.md](./managed-mode.md) |
| Acceptance tests | [testing/managed-mode-matrix.md](./testing/managed-mode-matrix.md) |
| AI operator skill (releases + license) | [finsafe-enterprise-setup skill](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-enterprise-setup/SKILL.md) |

---

## Summary

- **No MDM required** — any method that can do M1–M9 (including Ansible, golden images, SSH, and manual runbooks) is valid.  
- **MDM is optional** — Jamf and Intune are documented playbooks, not prerequisites.  
- **Bind fleet to your authority** via agent env URL, enroll tokens, sentinel, and enrollment — not by hoping users pick the right URL.  
- **Deploy sentinel separately from enroll** — MDM pushes `managed-required.json`; the agent creates `enrolled.json` after enroll.  
- **Choose delivery tooling** from §2; then follow the [enterprise deployment runbook](./enterprise-deployment-runbook.md) and [vendor-neutral checklist](./mdm/vendor-neutral-checklist.md).
