# FinSAFE 文档索引

**English:** [README.md](./README.md)

## 概念与术语

| 文档 | 说明 |
|------|------|
| [FAQ-zh.md](./FAQ-zh.md) | **常见问题（三大部分）**：① 商业与客户价值 / 独特优势 / 市场教育；② 与市场沙箱竞争互补与对比；③ 架构实现与 Findesk/FinClaw/Hermes 价值链 |
| [terminology-glossary-zh.md](./terminology-glossary-zh.md) · [English](./terminology-glossary.md) | **概念术语表**：MITM、WFP、企业代理、L7、Landlock、Bundle/托管、对标 sandbox-runtime/Codex 等 |

## 企业 IT 全景（首选）

| 文档 | 说明 |
|------|------|
| [product-one-pager-zh.md](./product-one-pager-zh.md) | **产品一页纸**：功能、市场定位、AI 痛点、与 Docker/MicroVM/云沙箱对比 |
| [enterprise-it-overview-zh.md](./enterprise-it-overview-zh.md) | **个人 vs 托管**、产品背景、Hermes 示例、托管防篡改、分布式智能体可治理性、MDM 路径 |
| [enterprise-it-overview.md](./enterprise-it-overview.md) | English stub → 完整中文版 |
| [endpoint-deployment-options-zh.md](./endpoint-deployment-options-zh.md) · [endpoint-deployment-options.md](./endpoint-deployment-options.md) | **部署方式选型**：MDM/Ansible/镜像/SSH/仅中心侧；Authority 绑定；哨兵 vs 注册 |

## 运维人员（单机、本地策略）

| 文档 | 说明 |
|------|------|
| [WINDOWS-GUIDE-zh.md](./WINDOWS-GUIDE-zh.md) · [WINDOWS-GUIDE.md](./WINDOWS-GUIDE.md) | **Windows 桌面** — 安装、RestrictedToken 与 AppContainer、ProjFS、排障 |
| [agent-sandbox-guide-zh.md](./agent-sandbox-guide-zh.md) · [English](./agent-sandbox-guide.md) | **Agent 沙箱** — Hermes、OpenCode、agy；Agent 专用 **`learn` / `explain`** |
| [USER-GUIDE-zh.md](./USER-GUIDE-zh.md) | 安装、`run` 与 `self-confine`、通用 learn/explain |
| [visual-sandbox-zh.md](./visual-sandbox-zh.md) · [visual-sandbox.md](./visual-sandbox.md) | **`finsafe --visual`** — 本机网页，沙箱关 vs 开对照 |
| [USER-GUIDE.md](./USER-GUIDE.md) | English user guide |
| [network-allowlist-proxy-runbook-zh.md](./network-allowlist-proxy-runbook-zh.md) · [network-allowlist-proxy-runbook.md](./network-allowlist-proxy-runbook.md) | **域名白名单 + 回环代理** — 个人/本地冒烟（无需 MITM） |
| [POLICY-QUICKREF-zh.md](./POLICY-QUICKREF-zh.md) | 包装策略字段速查 |
| [POLICY-QUICKREF.md](./POLICY-QUICKREF.md) | Wrapper policy field reference (English) |

## 运维技能（AI Agent）

| 技能 | 说明 |
|------|------|
| [finsafe-agent-sandbox-run/SKILL-zh.md](../skills/finsafe-agent-sandbox-run/SKILL-zh.md) | **Agent 沙箱：** 运行 + **`learn` / `explain`** 迭代 |
| [finsafe-agent-sandbox-verify/SKILL.md](../skills/finsafe-agent-sandbox-verify/SKILL.md) | 证明隔离 |
| [finsafe-enterprise-setup/SKILL-zh.md](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-enterprise-setup/SKILL-zh.md) · [English](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-enterprise-setup/SKILL.md) | 托管舰队端到端 |
| [finsafe-bundlectl/SKILL-zh.md](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-bundlectl/SKILL-zh.md) · [English](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-bundlectl/SKILL.md) | **`finsafe-bundlectl`**：bundle 发布 + MDM 哨兵 |
| [../skills/README-zh.md](../skills/README-zh.md) | 公开运维技能索引 |

## 企业管理员（托管舰队）

向员工桌面部署 **Policy Authority**、**finsafe-agent** 与已签名 bundle。终端用户运行 `finsafe run -- <program>`，无需自备策略文件。

| 文档 | 说明 |
|------|------|
| [binary-reference-zh.md](./binary-reference-zh.md) · [binary-reference.md](./binary-reference.md) | **全部二进制**、发行包、Linux 配套、管理员验证清单 |
| [sandbox-management-model-zh.md](./sandbox-management-model-zh.md) · [sandbox-management-model.md](./sandbox-management-model.md) | **沙箱管理模型**：Bundle 作为策略集合、Group、Assignment、rollout 与冲突处理 |
| [authority-deployment-zh.md](./authority-deployment-zh.md) · [authority-deployment.md](./authority-deployment.md) | Authority 安装、商业许可证、`finsafe-bundlectl` |
| [https-inspection-runbook-zh.md](./https-inspection-runbook-zh.md) · [https-inspection-runbook.md](./https-inspection-runbook.md) | **HTTPS 检查（TLS 终止）** — 许可证、CA、发布、试点验证（请先完成 [白名单 + 代理](./network-allowlist-proxy-runbook-zh.md)） |
| [managed-mode-zh.md](./managed-mode-zh.md) | 概述、组件、路径、CLI 错误 |
| [managed-cli-authority-connectivity-zh.md](./managed-cli-authority-connectivity-zh.md) · [English](./managed-cli-authority-connectivity.md) | **CLI ↔ agent ↔ 权威** 拓扑、发现、IPC、注册 |
| [endpoint-deployment-options-zh.md](./endpoint-deployment-options-zh.md) · [endpoint-deployment-options.md](./endpoint-deployment-options.md) | 部署路径决策（不强制 MDM） |
| [enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md) | 完整分阶段部署与运维 |
| [mdm/vendor-neutral-checklist-zh.md](./mdm/vendor-neutral-checklist-zh.md) | 适用于任意 MDM 或配置工具的检查清单 |
| [mdm/README-zh.md](./mdm/README-zh.md) | Jamf、Intune、Ansible 手册 |
| [testing/managed-mode-matrix-zh.md](./testing/managed-mode-matrix-zh.md) | 生产前验收测试 |
| [testing/managed-lab-zh.md](./testing/managed-lab-zh.md) · [managed-lab.md](./testing/managed-lab.md) | **本机全栈实验** — [`scripts/managed-lab.sh`](../scripts/managed-lab.sh) |
| [testing/licensing-e2e-macos-zh.md](./testing/licensing-e2e-macos-zh.md) · [licensing-e2e-macos.md](./testing/licensing-e2e-macos.md) | macOS 许可证与托管冒烟（**客户 curl 清单** + Finogeeks harness 说明） |
| [testing/managed-mode-macos-runbook-zh.md](./testing/managed-mode-macos-runbook-zh.md) · [managed-mode-macos-runbook.md](./testing/managed-mode-macos-runbook.md) | macOS 舰队试点手工步骤（英文操作为主；中文索引） |

建议阅读顺序：**[enterprise-it-overview-zh.md](./enterprise-it-overview-zh.md)** → **[endpoint-deployment-options-zh.md](./endpoint-deployment-options-zh.md)** → **[enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md)**。

### 文档语言与同步

多数运维指南提供 **英文** / **中文** 成对文件（`*.md` / `*-zh.md`）。若中英文内容不一致（例如 HTTPS 检查 CA 轮换、Admin UI 设置项），以**同一变更中最后更新的语言版本**为准；不确定时优先对照英文版。战略背景以 [enterprise-it-overview-zh.md](./enterprise-it-overview-zh.md) 最完整；英文入口见 [enterprise-it-overview.md](./enterprise-it-overview.md)。

## 部署制品（脚本与服务单元）

| 位置 | 内容 |
|------|------|
| [../packaging/](../packaging/) | `systemd/`、`launchd/`、`mdm/examples/` — 复制到 MDM 或 Ansible |
