# FinSAFE 文档索引

**English:** [README.md](./README.md)

## 企业 IT 全景（首选）

| 文档 | 说明 |
|------|------|
| [product-one-pager-zh.md](./product-one-pager-zh.md) | **产品一页纸**：功能、市场定位、AI 痛点、与 Docker/MicroVM/云沙箱对比 |
| [enterprise-it-overview-zh.md](./enterprise-it-overview-zh.md) | **个人 vs 托管**、产品背景、Hermes 示例、托管防篡改、分布式智能体可治理性、MDM 路径 |
| [enterprise-it-overview.md](./enterprise-it-overview.md) | English stub → 完整中文版 |

## 运维人员（单机、本地策略）

| 文档 | 说明 |
|------|------|
| [USER-GUIDE-zh.md](./USER-GUIDE-zh.md) | 安装、`run` 与 `self-confine`、wrapper 策略 |
| [USER-GUIDE.md](./USER-GUIDE.md) | English user guide |
| [POLICY-QUICKREF-zh.md](./POLICY-QUICKREF-zh.md) | 包装策略字段速查 |
| [POLICY-QUICKREF.md](./POLICY-QUICKREF.md) | Wrapper policy field reference (English) |

## 运维技能（AI Agent）

| 技能 | 说明 |
|------|------|
| [SKILL-zh.md](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-bundlectl/SKILL-zh.md) · [English](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-bundlectl/SKILL.md) | **`finsafe-bundlectl`**：自包含；仅需二进制 + 技能文件 |
| [../skills/README-zh.md](../skills/README-zh.md) | 公开运维技能索引 |

## 企业管理员（托管舰队）

向员工桌面部署 **Policy Authority**、**finsafe-agent** 与已签名 bundle。终端用户运行 `finsafe run -- <program>`，无需自备策略文件。

| 文档 | 说明 |
|------|------|
| [binary-reference-zh.md](./binary-reference-zh.md) · [binary-reference.md](./binary-reference.md) | **全部二进制**、发行包、Linux 配套、管理员验证清单 |
| [authority-deployment-zh.md](./authority-deployment-zh.md) · [authority-deployment.md](./authority-deployment.md) | Authority 安装、商业许可证、`finsafe-bundlectl` |
| [managed-mode-zh.md](./managed-mode-zh.md) | 概述、组件、路径、CLI 错误 |
| [enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md) | 完整分阶段部署与运维 |
| [mdm/vendor-neutral-checklist-zh.md](./mdm/vendor-neutral-checklist-zh.md) | 适用于任意 MDM 或配置工具的检查清单 |
| [mdm/README-zh.md](./mdm/README-zh.md) | Jamf、Intune、Ansible 手册 |
| [testing/managed-mode-matrix-zh.md](./testing/managed-mode-matrix-zh.md) | 生产前验收测试 |
| [testing/licensing-e2e-macos-zh.md](./testing/licensing-e2e-macos-zh.md) · [licensing-e2e-macos.md](./testing/licensing-e2e-macos.md) | macOS 许可证与托管冒烟 E2E 脚本 |

建议阅读顺序：**[enterprise-it-overview-zh.md](./enterprise-it-overview-zh.md)** → **[enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md)**。

## 部署制品（脚本与服务单元）

| 位置 | 内容 |
|------|------|
| [../packaging/](../packaging/) | `systemd/`、`launchd/`、`mdm/examples/` — 复制到 MDM 或 Ansible |
