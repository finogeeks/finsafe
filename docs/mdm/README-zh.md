# MDM 部署手册

在舰队机器上分发 FinSAFE 并强制托管模式的平台专项步骤。

**快速了解 MDM 如何与 FinSAFE 结合：** [产品一页纸 · MDM 章节](../product-one-pager-zh.md#mdm分发安装与托管模式结合)（中央 vs 终端分工、交付清单、上线顺序）。

建议先阅读 **[企业 IT 全景](../enterprise-it-overview-zh.md)**，再执行 [企业部署手册](../enterprise-deployment-runbook-zh.md)。

**English:** [README.md](./README.md)

| 指南 | 适用场景 |
|------|----------|
| **[vendor-neutral-checklist-zh.md](./vendor-neutral-checklist-zh.md)** · [English](./vendor-neutral-checklist.md) | **任意工具**（Ansible、Kandji、黄金镜像、SSH）— 不要求 Jamf/Intune |
| [jamf-zh.md](./jamf-zh.md) · [English](./jamf.md) | Jamf Pro（macOS 舰队） |
| [intune-zh.md](./intune-zh.md) · [English](./intune.md) | Microsoft Intune（**macOS + Linux**；**不含 Windows 托管 v1**） |
| [ansible-zh.md](./ansible-zh.md) · [English](./ansible.md) | 无 MDM 的 Linux 服务器 / VDI |

示例文件：[`packaging/mdm/examples/`](../../packaging/mdm/examples/)。
