# FinSAFE product one-pager (enterprise IT)

**Audience:** IT leaders, security architects, platform and endpoint engineers  
**Full Chinese version:** [product-one-pager-zh.md](./product-one-pager-zh.md)

## In one sentence

**FinSAFE is a multi-tenant secure execution substrate for AI agent workloads** — OS-native sandboxing (Linux / macOS) turns each tool call or code run into a policy-bound, schedulable, auditable **execution unit**. Deploy on **employee desktops (edge)** or in **datacenter / Kubernetes (central)** to offer **Sandbox-as-a-Service**.

## Platform layers (implemented in the monorepo)

```text
Control plane (tenants, policies, quotas, audit, approvals)
        ↓
Execution Scheduler + Policy Router  (finsafe-scheduler, finsafe-policy)
        ↓
FinSAFE runtime / API              (finsafe-server — POST /v1/executions, OpenAPI)
        ↓
Per-execution sandbox              (bwrap, cgroup, Landlock, seccomp; macOS Seatbelt)
```

Public `curl | sh` releases focus on the **`finsafe` CLI** (local wrapper). Scheduler, router, and HTTP API are for enterprise/platform builds — see in-repo [`docs/api/finsafe-server.md`](../../../docs/api/finsafe-server.md) and [`docs/design/finsafe-system-spec.md`](../../../docs/design/finsafe-system-spec.md).

## Two deployment shapes

| Shape | Where | What |
|-------|-------|------|
| **Edge / desktop** | Laptops | `finsafe run` / `self-confine`; optional **managed fleet** (Policy Authority + agent + MDM) |
| **Central / cloud** | K8s or private execution plane | **Sandbox-as-a-Service** via `finsafe-server`; adapters submit `HighLevelPolicy` + `SchedulerRequest` |

CLI can target a remote server: `finsafe run --high-level policy.yaml --server https://… -- …`

## vs Docker / MicroVM / WASM / e2b / Daytona

| | FinSAFE | Typical alternative |
|---|---------|---------------------|
| **Model** | Policy-compiled **per execution** on native Linux/macOS sandbox | Docker: long-lived containers; MicroVM: VM per task; e2b/Daytona: vendor-hosted cloud sandboxes |
| **Multi-tenant** | Built-in scheduler admission, queues, rate limits | Often roll-your-own on top of K8s or use SaaS |
| **Desktop data residency** | Strong story with managed edge mode | Cloud sandboxes move code/data to provider |
| **Strongest isolation** | Shared-kernel sandbox — add MicroVM outer layer for hostile tenants | MicroVM / dedicated cloud isolation |

**Rule of thumb:** vendor-managed remote dev sandboxes → e2b / Daytona; **self-hosted agent execution plane** → FinSAFE central; **local agents with fleet policy** → FinSAFE edge + managed mode; **untrusted kernel-level adversaries** → MicroVM outside FinSAFE.

## MDM distribution (edge / managed fleet)

MDM (Jamf, Intune, Ansible, golden images, etc.) delivers **binaries**, the **managed-required sentinel**, the **agent service**, and **one-time enrollment** — not policy YAML. Policy comes from **Policy Authority** via signed bundles pulled by `finsafe-agent`.

Enterprise fleets use **`finsafe-fleet-v*`** release tarballs (managed `finsafe` + `finsafe-agent`) from [GitHub Releases](https://github.com/finogeeks/finsafe/releases). See the full **MDM** section in [product-one-pager-zh.md](./product-one-pager-zh.md) and [vendor-neutral MDM checklist](./mdm/vendor-neutral-checklist.md).

**Windows + MDM (v1):** Managed fleet deployment (agent, sentinel, M1–M8) is **Linux and macOS only**. Intune guides cover macOS/Linux endpoints, not Windows 10/11 devices. Windows users can use **central Sandbox-as-a-Service** via `finsafe-server` while executions run on Linux workers. Details: [product-one-pager-zh.md — Windows & MDM](./product-one-pager-zh.md#windows-设备与-mdmv1-现状).

## Read next

[Product one-pager (ZH)](./product-one-pager-zh.md) · [Enterprise IT overview](./enterprise-it-overview-zh.md) · [Managed deployment runbook](./enterprise-deployment-runbook.md)
