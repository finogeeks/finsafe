# MDM deployment playbooks

**中文：** [README-zh.md](./README-zh.md)

Platform-specific steps for distributing FinSAFE and enforcing managed mode. Start with the [enterprise deployment runbook](../enterprise-deployment-runbook.md).

| Guide | Use when |
|-------|----------|
| **[endpoint-deployment-options.md](../endpoint-deployment-options.md)** · [中文](../endpoint-deployment-options-zh.md) | **Choose deployment path** — Jamf, Intune, Ansible, image, SSH, or central-only |
| **[vendor-neutral-checklist.md](./vendor-neutral-checklist.md)** · [中文](./vendor-neutral-checklist-zh.md) | **Any tool** (Ansible, Kandji, golden image, SSH)—no Jamf/Intune required |
| [jamf.md](./jamf.md) · [中文](./jamf-zh.md) | Jamf Pro (macOS fleet) |
| [intune.md](./intune.md) · [中文](./intune-zh.md) | Microsoft Intune (macOS + Linux) |
| [ansible.md](./ansible.md) · [中文](./ansible-zh.md) | Linux servers / VDI without MDM |

Example files: [`packaging/mdm/examples/`](../../packaging/mdm/examples/).
