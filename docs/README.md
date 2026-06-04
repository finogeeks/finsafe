# FinSAFE documentation index

**中文：** [README-zh.md](./README-zh.md)

## Enterprise IT panorama (start here)

| Document | Description |
|----------|-------------|
| [product-one-pager-zh.md](./product-one-pager-zh.md) · [product-one-pager.md](./product-one-pager.md) | **Product one-pager**: positioning, AI pain points, vs Docker/cloud sandboxes |
| [enterprise-it-overview-zh.md](./enterprise-it-overview-zh.md) | **Personal vs managed**, background, Hermes examples, anti-tamper, distributed-agent governability, MDM path (Chinese, full) |
| [enterprise-it-overview.md](./enterprise-it-overview.md) | English entry → links to Chinese full guide |
| [endpoint-deployment-options-zh.md](./endpoint-deployment-options-zh.md) · [endpoint-deployment-options.md](./endpoint-deployment-options.md) | **Choose deployment path**: MDM vs Ansible vs golden image vs SSH vs central-only; authority binding; sentinel vs enroll |

## For operators (single-machine, local policy)

| Document | Description |
|----------|-------------|
| [USER-GUIDE.md](./USER-GUIDE.md) | Install, `run` vs `self-confine`, wrapper policies |
| [USER-GUIDE-zh.md](./USER-GUIDE-zh.md) | 中文用户指南 |
| [POLICY-QUICKREF.md](./POLICY-QUICKREF.md) | Wrapper policy field reference |
| [POLICY-QUICKREF-zh.md](./POLICY-QUICKREF-zh.md) | 包装策略字段速查 |

## Operator skills (AI agents)

| Skill | Description |
|-------|-------------|
| [finsafe-enterprise-setup/SKILL.md](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-enterprise-setup/SKILL.md) · [SKILL-zh.md](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-enterprise-setup/SKILL-zh.md) | **`finsafe-enterprise-setup`**: managed fleet end-to-end (releases + Finogeeks license only) |
| [finsafe-bundlectl/SKILL.md](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-bundlectl/SKILL.md) · [SKILL-zh.md](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-bundlectl/SKILL-zh.md) | **`finsafe-bundlectl`**: bundle publish + MDM sentinel |
| [../skills/README.md](../skills/README.md) | Index of public operator skills |

## For enterprise administrators (managed fleet)

Deploy **Policy Authority**, **finsafe-agent**, and signed bundles to employee desktops. End users run `finsafe run -- <program>` without supplying their own policy files.

| Document | Description |
|----------|-------------|
| [binary-reference.md](./binary-reference.md) · [binary-reference-zh.md](./binary-reference-zh.md) | All shipped binaries, release archives, admin verification checklist |
| [sandbox-management-model.md](./sandbox-management-model.md) · [sandbox-management-model-zh.md](./sandbox-management-model-zh.md) | **Sandbox management model**: bundles as policy sets, groups, assignments, rollout, and conflict handling |
| [authority-deployment.md](./authority-deployment.md) · [authority-deployment-zh.md](./authority-deployment-zh.md) | Installing and running `finsafe-authority-http`, license, env vars, `finsafe-bundlectl` |
| [https-inspection-runbook.md](./https-inspection-runbook.md) · [https-inspection-runbook-zh.md](./https-inspection-runbook-zh.md) | **HTTPS inspection (TLS terminate)** — license, CA, publish, pilot verification |
| [admin-ui.md](./admin-ui.md) · [admin-ui-zh.md](./admin-ui-zh.md) | Admin console reference (devices, enrollment tokens, kill switch, API equivalents) |
| [managed-mode.md](./managed-mode.md) · [managed-mode-zh.md](./managed-mode-zh.md) | Overview, components, paths, CLI errors |
| [managed-cli-authority-connectivity.md](./managed-cli-authority-connectivity.md) · [managed-cli-authority-connectivity-zh.md](./managed-cli-authority-connectivity-zh.md) | **CLI ↔ agent ↔ authority** topology, discovery, IPC, enrollment |
| [endpoint-deployment-options.md](./endpoint-deployment-options.md) · [endpoint-deployment-options-zh.md](./endpoint-deployment-options-zh.md) | Deployment path decision guide (no MDM required) |
| [enterprise-deployment-runbook.md](./enterprise-deployment-runbook.md) · [enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md) | Full phased deployment and operations |
| [mdm/vendor-neutral-checklist.md](./mdm/vendor-neutral-checklist.md) · [vendor-neutral-checklist-zh.md](./mdm/vendor-neutral-checklist-zh.md) | Checklist for any MDM or config tool |
| [mdm/README.md](./mdm/README.md) · [README-zh.md](./mdm/README-zh.md) | Jamf, Intune, Ansible playbooks |
| [testing/managed-mode-matrix.md](./testing/managed-mode-matrix.md) · [managed-mode-matrix-zh.md](./testing/managed-mode-matrix-zh.md) | Acceptance tests before production |
| [testing/managed-lab.md](./testing/managed-lab.md) · [managed-lab-zh.md](./testing/managed-lab-zh.md) | **Local full stack lab** — [`scripts/managed-lab.sh`](../scripts/managed-lab.sh) on one machine |
| [testing/licensing-e2e-macos.md](./testing/licensing-e2e-macos.md) · [licensing-e2e-macos-zh.md](./testing/licensing-e2e-macos-zh.md) | macOS licensing + managed smoke (**customer curl checklist** + Finogeeks harness note) |
| [testing/managed-mode-macos-runbook.md](./testing/managed-mode-macos-runbook.md) · [managed-mode-macos-runbook-zh.md](./testing/managed-mode-macos-runbook-zh.md) | macOS fleet pilot manual steps (EN procedural; zh index) |

Read order: **[enterprise-it-overview.md](./enterprise-it-overview.md)** → **[endpoint-deployment-options.md](./endpoint-deployment-options.md)** → **[enterprise-deployment-runbook.md](./enterprise-deployment-runbook.md)**.

### Documentation languages

Most operator guides exist as **English** and **Chinese** pairs (`*.md` / `*-zh.md`). When a topic differs between languages (for example HTTPS inspection CA rotation or Admin UI settings), treat the **English** file as the reference for the latest procedure until both are updated in the same change. Strategic background is fullest in [enterprise-it-overview-zh.md](./enterprise-it-overview-zh.md); English readers can use [enterprise-it-overview.md](./enterprise-it-overview.md) for links to all admin runbooks.

## Deployment artifacts (scripts and service units)

| Location | Contents |
|----------|----------|
| [../packaging/](../packaging/) | `systemd/`, `launchd/`, `mdm/examples/` — copy into your MDM or Ansible |
