# 终端部署方式选型（企业管理员）

**English:** [endpoint-deployment-options.md](./endpoint-deployment-options.md)

本文帮助企业在员工桌面上**选择** FinSAFE 托管模式的落地方式。FinSAFE **不依赖** Jamf、Intune 或任何特定 MDM；文档中的厂商名称仅为常见示例。

**IT 推荐阅读顺序：**

1. [enterprise-it-overview-zh.md](./enterprise-it-overview-zh.md) — 个人模式 vs 托管模式、分布式 Agent 治理背景  
2. **本文** — 选择中心侧 vs 终端侧交付方式  
3. [enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md) — 分阶段操作（Authority → 客户端 → 运维）  
4. [mdm/vendor-neutral-checklist-zh.md](./mdm/vendor-neutral-checklist-zh.md) — 单机 M1–M9 清单  
5. 需要分步 UI 或 Ansible 示例时，见 [mdm/README-zh.md](./mdm/README-zh.md)  

---

## 1. 选择运营模式

| 模式 | 策略执行位置 | 典型终端管控 | FinSAFE 组件 |
|------|--------------|--------------|--------------|
| **托管桌面（分布式 Agent 推荐）** | 员工 Mac/Linux 本机 | 安装 `finsafe` + `finsafe-agent` + 哨兵 + 注册 | Policy Authority + 舰队包 + MDM **或等价手段** |
| **仅中心执行** | 数据中心 / Kubernetes | 用户笔记本不装 Agent | `finsafe-server`（见 [product-one-pager-zh.md](./product-one-pager-zh.md)）；客户端走 HTTPS API |
| **个人 / 开发者** | 用户本机自管 | 无强制组件 | 公开 `finsafe` CLI + 本地 `--policy` YAML（免费；非企业强制） |

若需治理本机 OpenClaw、Hermes 等 Agent，通常选 **托管桌面**：策略由企业签名、从 **自有** Policy Authority 拉取；哨兵就位后 CLI 不能退回个人策略文件。

**托管桌面 v1 平台：** 仅 Linux 与 macOS。Windows 桌面托管舰队（Agent + 哨兵路径）**不在 v1**。见 [§8 平台限制](#8-平台限制)。

---

## 2. 选择终端交付方式

以下路径实现相同的 **单机契约**（[厂商中立清单](./mdm/vendor-neutral-checklist-zh.md) 中的 M1–M9）。按 IT 能力选一行即可。

| 情况 | 推荐方式 | 详细文档 |
|------|----------|----------|
| **Jamf Pro**（macOS 舰队） | Jamf PKG + 配置描述文件 + 一次性注册策略 | [mdm/jamf-zh.md](./mdm/jamf-zh.md) |
| **Microsoft Intune**（macOS + Linux） | Intune 应用/PKG + 脚本 + plist/systemd | [mdm/intune-zh.md](./mdm/intune-zh.md) |
| **Ansible / Puppet / Chef / Salt**（尤指 Linux） | Playbook 完成 M1–M8 | [mdm/ansible-zh.md](./mdm/ansible-zh.md) |
| **黄金镜像 / cloud-init** | 镜像内烘焙 M1–M6；首启脚本做 M7–M8 | [vendor-neutral-checklist-zh.md](./mdm/vendor-neutral-checklist-zh.md) § 映射到你的产品 |
| **小规模、无端点自动化** | SSH + 运维手册 + 通用脚本 | [packaging/mdm/examples/generic/](../../packaging/mdm/examples/generic/) |
| **自建 apt/yum/PKG 仓库** | 打包二进制 + 服务单元；哨兵与环境变量另包或描述文件 | 与 Ansible 相同 M1–M8 映射 |
| **无 Jamf 的 macOS**（Munki、Autopkg、手工 PKG） | PKG + 安装后配置哨兵/Agent | [testing/managed-mode-macos-runbook-zh.md](./testing/managed-mode-macos-runbook-zh.md) |
| **无法在终端做 root 级安装** | 不要承诺托管桌面 | 用 **中心执行**，或发放可托管的 Mac/Linux |
| **仅 Windows 笔记本** | 托管桌面 v1 **不支持** | 中心执行，或为本地 Agent 配 Mac/Linux |

### 简要决策

```text
是否需要在员工笔记本上约束本地 Agent？
├─ 否 → 中心 finsafe-server / K8s（无舰队 Agent）
└─ 是 → 能否在每台机器安装 root 属主文件 + 系统守护进程？
    ├─ 否 → 同上；或仅个人模式（非企业强制）
    └─ 是 → 选交付工具：
         Jamf / Intune / Ansible / 镜像 / SSH / 内网仓库
         （均映射 M1–M9，非不同产品）
```

---

## 3. 所有托管桌面路径的共性

无论 Jamf、Ansible 还是手工运维，均需 **中心侧（每组织一次）** 与 **单机侧** 两层。

### 中心侧 — 清单 C0–C6

| 项 | 作用 |
|----|------|
| **Policy Authority**（`finsafe-authority-http`） | JWKS、Bundle、注册、心跳、审计、Kill Switch |
| **商业 `license.jws`** | 生产环境注册与管理 API 所需 |
| **安全运维机上的 `finsafe-bundlectl`** | 构建/签名/发布 Bundle；签署哨兵 |
| **HTTPS Authority URL** | 统一生产地址，如 `https://gov.example.com/policy-authority` |
| **稳定的 `device_id` 规则** | 每台机器；用于注册与管理端设备列表 |

操作：[authority-deployment-zh.md](./authority-deployment-zh.md) · [enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md) 阶段 A–B。

### 单机侧 — 清单 M1–M9

| 步骤 | 内容 | 由谁产生 |
|------|------|----------|
| M1–M2 | `finsafe`、`finsafe-agent`（Linux 含配套二进制） | IT 从 `finsafe-fleet-v*` 部署 |
| M3 | `/etc/finsafe`、`/var/lib/finsafe` | IT |
| M4 | `/etc/finsafe/managed-required.json`（签名 JWS） | IT；内容由 `finsafe-bundlectl sentinel sign` |
| M5–M6 | Agent 服务 + `FINSAFE_AUTHORITY_URL` | IT（systemd / LaunchDaemon） |
| M7 | 一次性 `FINSAFE_ENROLL_TOKEN` + `FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID`（仅 Agent） | IT 注入；Agent 消费 |
| M8 | 从持久配置中移除注册令牌 | 注册成功后 IT 执行 |
| M9 | 应用使用 `finsafe run -- <程序>`（无 `--policy`） | 应用/平台团队 |

完整表：[mdm/vendor-neutral-checklist-zh.md](./mdm/vendor-neutral-checklist-zh.md)。

示例脚本：[packaging/mdm/examples/](../../packaging/mdm/examples/)。

---

## 4. 将桌面绑定到「指定」Authority（非任意 URL）

终端用户与本地管理员**不能**通过产品界面把舰队机器指向任意 Policy Authority。绑定由 **企业控制的基建** 完成：

| 控制项 | 作用 |
|--------|------|
| **`finsafe-agent` 上的 `FINSAFE_AUTHORITY_URL`** | 注册、拉 Bundle、JWKS、心跳均指向该 URL（系统服务环境，非用户 Shell） |
| **一次性注册令牌** | 由 **自有** Authority 签发（`POST /v1/enroll/token` 或管理 UI）；每设备消费一次 |
| **`/etc/finsafe/enrolled.json`** | 注册成功后由 Agent 写入；含 `device_id`、`authority_url`、`jwks_thumbprint` |
| **`/etc/finsafe/managed-required.json`** | 组织签名哨兵；强制托管模式，舰队 CLI 拒绝 `--personal` / 本地 `--policy` |
| **License 与席位** | 无有效商业 License 或席位用尽时 Authority 拒绝注册 |

**IT 可变更 `FINSAFE_AUTHORITY_URL`**（例如 Authority 迁移），属于运维操作，非终端用户自选。

**可选加固：** Authority 主机设置 `FINSAFE_AUTHORITY_REQUIRE_SENTINEL=1`，无哨兵文件的心跳可返回 `tamper_suspected（见 [authority-deployment-zh.md](./authority-deployment-zh.md)）。

本地 root 仍可篡改文件或停止 Agent；威胁模型假设 **托管终端的 root 归 IT 所有**，而非对抗性本地管理员。见 [managed-mode-zh.md](./managed-mode-zh.md)。

---

## 5. 哨兵 vs 注册文件（MDM 只推送其一）

| 文件 | 典型交付 | 创建方 | 用途 |
|------|----------|--------|------|
| **`managed-required.json`** | **是** — IT 推送签名 JWS | `finsafe-bundlectl sentinel sign` | 强制托管模式；全舰队可共用同一文件 |
| **`enrolled.json`** | **否** — 非静态 MDM 载荷 | **`finsafe-agent`** 在 `POST /v1/enroll` 后 | 每设备注册记录 |

MDM（或 Ansible、SSH、镜像）应：

1. 部署 **哨兵**（M4）。  
2. 在 Agent 上设置 **Authority URL**（M6）。  
3. 注入 **一次性注册令牌** + **device id**（M7）。  
4. **确认** `enrolled.json` 存在后 **移除** 令牌（M8）。

---

## 6. 管理端：`sentinel_present`

管理 UI 或 `GET /v1/admin/devices` 中的 **`sentinel_present`** 表示：

> 该设备 **最近一次心跳** 时，Agent 是否报告存在 **`/etc/finsafe/managed-required.json`**。

| 值 | 含义 |
|----|------|
| **`true`** | 已部署托管哨兵（生产环境预期） |
| **`false`** | 已注册且在线，但缺少哨兵 — **试点/实验室** 在 M4 全量前常见 |

终端检查：

```bash
test -f /etc/finsafe/managed-required.json && echo ok || echo missing
```

部署哨兵后，下一次心跳应变为 `true`。详见 [admin-ui-zh.md](./admin-ui-zh.md)。

---

## 7. 推荐分阶段上线

无论 Jamf、Ansible 还是 SSH，建议同一顺序：

| 阶段 | 范围 | 哨兵 | 目标 |
|------|------|------|------|
| **试点** | 小组 | 可先不上 | 二进制 + Agent + 注册；验证拉 Bundle 与 `finsafe run --json` |
| **强制** | 扩大舰队 | **是**（M4） | 推送 `managed-required.json`；确认拒绝 `--personal` 与 `--policy` |
| **生产** | 全部托管 Mac/Linux | 是 | 移除注册令牌；运维见 [admin-ui-zh.md](./admin-ui-zh.md)；经 Authority 轮换 Bundle |

分阶段说明：[enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md) · [vendor-neutral-checklist-zh.md](./mdm/vendor-neutral-checklist-zh.md) 文末。

---

## 8. 平台限制

| 平台 | 托管桌面（Agent + 哨兵 + 注册） | 说明 |
|------|--------------------------------|------|
| **Linux** | 支持 | Ansible；[packaging/](../../packaging/) 中 systemd |
| **macOS** | 支持 | Jamf/Intune/Munki/手工；LaunchDaemon |
| **Windows 桌面** | **v1 不支持** | 无 Windows Agent/哨兵路径；本地 Agent 用中心执行或 Mac/Linux |

---

## 9. 无法做托管桌面时

| 约束 | 可行方案 |
|------|----------|
| 无法在笔记本装系统守护进程 | 业务走 **`finsafe-server`**；桌面仅常规合规（BitLocker、EDR 等） |
| 本地 Agent 仅 Windows | 中心执行；或为相关岗位配 Mac/Linux |
| 仅开发者、无舰队要求 | **个人模式** — `finsafe run --policy file.yaml`（非企业强制） |
| 尚无商业 License | 实验室可搭 Authority；生产注册需 Finogeeks **`license.jws`** |

---

## 10. 文档索引

| 主题 | 文档 |
|------|------|
| 二进制与发布包 | [binary-reference-zh.md](./binary-reference-zh.md) |
| Authority 安装与 License | [authority-deployment-zh.md](./authority-deployment-zh.md) |
| 完整分阶段手册 | [enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md) |
| M1–M9 清单 | [mdm/vendor-neutral-checklist-zh.md](./mdm/vendor-neutral-checklist-zh.md) |
| Jamf / Intune / Ansible | [mdm/README-zh.md](./mdm/README-zh.md) |
| 托管模式架构 | [managed-mode-zh.md](./managed-mode-zh.md) |
| 验收测试 | [testing/managed-mode-matrix-zh.md](./testing/managed-mode-matrix-zh.md) |
| AI 运维技能（发布 + License） | [finsafe-enterprise-setup SKILL-zh](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-enterprise-setup/SKILL-zh.md) |

---

## 摘要

- **不强制 MDM** — 只要能完成 M1–M9（含 Ansible、黄金镜像、SSH、手工手册）即可。  
- **MDM 为可选项** — Jamf/Intune 为示例手册，非前提。  
- **舰队绑定自有 Authority** — 靠 Agent 环境 URL、注册令牌、哨兵与注册记录，而非用户自选 URL。  
- **哨兵与注册分开** — MDM 推送 `managed-required.json`；`enrolled.json` 由 Agent 注册后生成。  
- 在 §2 选定交付工具后，按 [企业部署手册](./enterprise-deployment-runbook-zh.md) 与 [厂商中立清单](./mdm/vendor-neutral-checklist-zh.md) 执行。
