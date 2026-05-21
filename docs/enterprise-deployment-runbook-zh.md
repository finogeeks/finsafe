# 企业部署手册（托管模式）

本手册面向在全舰队推广 FinSAFE 的 IT / 安全运维人员。建议先阅读 **[企业 IT 全景](./enterprise-it-overview-zh.md)**（个人 / 托管模式、Hermes 示例、可治理性价值），再在 [托管模式](./managed-mode-zh.md) 组件说明之上执行下列分阶段流程。

**English:** [enterprise-deployment-runbook.md](./enterprise-deployment-runbook.md)

**读者：** 平台工程、终端管理（Jamf / Intune / Ansible）、安全运营。

**不在范围内：** 未纳管笔记本上使用个人 `finsafe run --policy file.yaml` 的开发者（行为不变）。

---

## 1. 架构回顾

```text
                    ┌─────────────────────────────┐
                    │  finsafe-authority (HTTPS)   │
                    │  • JWKS、bundle、注册         │
                    │  • kill-switch、审计上报      │
                    └──────────────┬──────────────┘
                                   │ 拉取 / 心跳 / 审计
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
   ┌───────────┐            ┌───────────┐            ┌───────────┐
   │ Desktop A │            │ Desktop B │            │ Desktop C │
   │ agent+CLI │            │ agent+CLI │            │ agent+CLI │
   └───────────┘            └───────────┘            └───────────┘
```

每台桌面：

1. **MDM** 安装二进制 + `managed-required` 哨兵 + 启动 `finsafe-agent`。
2. **Agent** 一次性注册，缓存已签名 bundle，在 `/run/finsafe-agent.sock` 提供策略。
3. **CLI**（`finsafe run -- …`）在托管状态下仅从 agent 解析策略。

---

## 2. 前提条件

| 要求 | 说明 |
|------|------|
| Policy Authority URL | HTTPS，托管客户端可达；例如 `https://gov.example.com/policy-authority` |
| 签名密钥保管 | `finsafe-bundlectl` 使用的 Ed25519 密钥；优先 HSM 或锁定运维主机 |
| MDM | Jamf Pro、Microsoft Intune，或具备 root/管理员部署能力的配置管理（Ansible） |
| 已审批的 wrapper 策略 | 安全团队审查的源 YAML；打包进 bundle |
| 设备身份 | 每台机器稳定的 `device_id`（MDM 序列号、主机名策略或资产标签） |

**v1 支持平台：** Linux 与 macOS 桌面。Windows 主机沙箱不在托管模式 v1 范围内。

---

## 3. 阶段 A — 部署 Policy Authority（中央）

### A.1 安装与配置

完整 authority 安装指南见 [authority-deployment-zh.md](./authority-deployment-zh.md)。**二进制套件对照：** [binary-reference-zh.md](./binary-reference-zh.md)。

概要：

1. 在加固 Linux authority 主机安装 **`finsafe-authority-http`**（**`finsafe-admin-server-v*…tar.zst`**；macOS 包用于本地开发 / 试点）；在运维工作站安装 **`finsafe-bundlectl`**（**`finsafe-bundlectl-v*…tar.zst`**，Linux 或 macOS）。见 [README](../README-zh.md) 企业管理员二进制。
2. 在开启舰队注册与管理 API 前，在 authority 主机安装商业 **`license.jws`** — [authority-deployment-zh.md §2.1](./authority-deployment-zh.md#21-商业许可证托管模式)。
3. 设置环境变量：

   | 变量 | 示例 |
   |------|------|
   | `FINSAFE_AUTHORITY_BIND` | `0.0.0.0:8090`（置于反向代理之后） |
   | `FINSAFE_AUTHORITY_DB` | `/var/lib/finsafe-authority/authority.db` |
   | `FINSAFE_AUTHORITY_PUBLIC_URL` | `https://gov.example.com/policy-authority` |
   | `FINSAFE_LICENSE_PATH` | `/etc/finsafe/license.jws` |
   | 签名密钥 | `FINSAFE_AUTHORITY_SIGNING_KEY` 或 `/var/lib/finsafe-authority/` 下自动生成 |

4. 在入口终止 TLS；无 SSO / IP 允许列表时不要将管理 API 暴露到公网。
5. 执行 authority **验证**（健康、许可证状态、注册 token、JWKS）— [authority-deployment-zh.md §5](./authority-deployment-zh.md#5-验证)。

### A.2 发布初始策略 bundle

在 **运维工作站**（非终端用户机器）上：

```bash
export FINSAFE_AUTHORITY_PUBLIC_URL=https://gov.example.com/policy-authority
export FINSAFE_ORG_DOMAIN=example.com

finsafe-bundlectl bundle build \
  --from ../examples/wrapper-policies/hermes-interactive.yaml \
  --out /secure/bundles/draft-v1.json

finsafe-bundlectl bundle sign --in /secure/bundles/draft-v1.json --out /secure/bundles/bundle-v1.jws
finsafe-bundlectl bundle publish --in /secure/bundles/bundle-v1.jws --authority "$FINSAFE_AUTHORITY_PUBLIC_URL"
```

记录：`bundle_id`、`version`、摘要，以及 `/.well-known/finsafe/jwks.json` 的 JWKS 指纹。

### A.3 签名 managed-required 哨兵

```bash
finsafe-bundlectl sentinel sign --out /secure/mdm/managed-required.jws
```

该 JWS 文件由 MDM 推送到舰队每台机器的 `/etc/finsafe/managed-required.json`。

### A.4 验证（authority）

| 检查 | 命令 / 操作 |
|------|-------------|
| 健康 | `curl -sf "$FINSAFE_AUTHORITY_PUBLIC_URL/health"` |
| 许可证 | `curl -sf "$FINSAFE_AUTHORITY_PUBLIC_URL/v1/license/status"` — 期望 `valid` 或 `grace` |
| 注册 token（已许可） | `curl -sf -X POST "$FINSAFE_AUTHORITY_PUBLIC_URL/v1/enroll/token"` — 不得为 `402` |
| JWKS | `curl -sf "$FINSAFE_AUTHORITY_PUBLIC_URL/.well-known/finsafe/jwks.json"` |
| 当前 bundle | `curl -sf "$FINSAFE_AUTHORITY_PUBLIC_URL/v1/bundles/current"` |
| 管理 UI | 打开 `$FINSAFE_AUTHORITY_PUBLIC_URL/admin/`，参考 [admin-ui-zh.md](./admin-ui-zh.md) |

阶段 D 后**桌面试点**检查：[binary-reference-zh.md § 验证托管模式](./binary-reference-zh.md#验证托管模式已生效生产检查清单)。

---

## 4. 阶段 B — 打包客户端二进制

### B.1 构建或获取软件包

在所有平台使用 **固定路径** 交付。发行包与 Linux/macOS 差异见 [binary-reference-zh.md](./binary-reference-zh.md)。

| 二进制 | Linux 路径 | macOS 路径 | 来源 |
|--------|------------|------------|------|
| `finsafe` | `/usr/local/bin/finsafe` | `/usr/local/bin/finsafe` | 公开 `finsafe-v*` 包（全平台） |
| `finsafe-agent` | `/usr/local/bin/finsafe-agent` | `/usr/local/bin/finsafe-agent` | **`finsafe-fleet-v*`** 发行包 |
| `finsafe-helper` | `/usr/local/bin/finsafe-helper` | — | 公开 **Linux** `finsafe-v*` 包（与 `finsafe` 同目录） |
| `finsafe-supervisor` | `/usr/local/bin/finsafe-supervisor` | — | 公开 **Linux** `finsafe-v*` 包 |
| `finsafe-landlock-shim` | `/usr/local/bin/finsafe-landlock-shim` | — | 公开 **Linux** `finsafe-v*` 包 |

**Linux** 须将上述四个面向用户的二进制放在同一目录以便自动发现。**macOS** 仅需 `finsafe` 与 `finsafe-agent`（Seatbelt 内置于 `finsafe`）。

心跳对 `/usr/local/bin/finsafe` 与 `finsafe-agent` 做摘要；生产环境勿使用每用户 `~/bin` 安装。

### B.2 安装 agent 服务

| 操作系统 | 单元文件 |
|----------|----------|
| Linux（systemd） | [`packaging/systemd/finsafe-agent.service`](../packaging/systemd/finsafe-agent.service) |
| macOS（LaunchDaemon） | [`packaging/launchd/com.finogeeks.finsafe-agent.plist`](../packaging/launchd/com.finogeeks.finsafe-agent.plist) |

将 `FINSAFE_AUTHORITY_URL` 设为客户端用于注册/拉取的公开 authority URL。

### B.3 舰队部署指南

| 场景 | 文档 |
|------|------|
| **任意工具**（不要求 Jamf/Intune） | [mdm/vendor-neutral-checklist-zh.md](./mdm/vendor-neutral-checklist-zh.md) |
| Jamf Pro | [mdm/jamf-zh.md](./mdm/jamf-zh.md) |
| Microsoft Intune | [mdm/intune-zh.md](./mdm/intune-zh.md) |
| Ansible / 裸机 | [mdm/ansible-zh.md](./mdm/ansible-zh.md) |

示例载荷位于 [`packaging/mdm/examples/`](../packaging/mdm/examples/)。

---

## 5. 阶段 C — 强制托管模式（哨兵）

部署阶段 A.3 的签名哨兵：

- **路径：** `/etc/finsafe/managed-required.json`
- **内容：** 单行紧凑 JWS（非格式化的策略 JSON）
- **属主：** `root:wheel` 或 `root:root`，模式 `0644` 或更严
- **不可变：** 在 MDM 中尽可能使用「锁定」文件交付

**效果：** `finsafe` CLI 进入托管模式；拒绝 `--personal` 与本地 `--policy`。

**在试点设备上验证：**

```bash
test -f /etc/finsafe/managed-required.json && echo sentinel-ok
finsafe run --personal -- /usr/bin/true 2>&1 | grep -q MANAGED_FORCED_BY_POLICY
```

---

## 6. 阶段 D — 注册（每台设备一次）

### D.1 签发 token（IT）

**管理 UI：** `POST /v1/enroll/token`（`/admin/` 中的按钮）  
**或 CLI：**

```bash
curl -s -X POST "$FINSAFE_AUTHORITY_PUBLIC_URL/v1/enroll/token"
```

复制 `token`（短生命周期 JWS）。视为机密；每台设备或每批窗口单次使用。

### D.2 将 token 交付给 agent（MDM，仅首次启动）

在 **agent 服务** 环境（非用户 shell 配置）中设置：

| 变量 | 值 |
|------|-----|
| `FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID` | 稳定 id，例如 `$(hostname -s)` 或 Jamf `$COMPUTERNAME` |
| `FINSAFE_ENROLL_TOKEN` | D.1 的 token |

重启 `finsafe-agent`。成功后会写入 `/etc/finsafe/enrolled.json`。

### D.3 从 MDM 移除 token

试点确认注册后：

1. 从描述文件 / unit 文件中移除 `FINSAFE_ENROLL_TOKEN`。
2. 重新部署描述文件，避免 token 留在清单报告中。
3. 若 playbook 不需要，注册后可不再保留 `FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID`。

### D.4 验证（桌面）

```bash
test -f /etc/finsafe/enrolled.json && jq . /etc/finsafe/enrolled.json
ls -la /run/finsafe-agent.sock
finsafe run --json -- /usr/bin/true | jq '.envelope.policy_source // empty'
```

预期 agent 日志：bundle 拉取成功；无重复注册失败。

---

## 7. 阶段 E — 应用集成

Agent 运行时（FinClaw、Hermes、内部工具）应调用：

```bash
finsafe run -- /path/to/runtime "$@"
```

**不要** 在托管机器上传入 `--policy`。MDM 中的可选全局 wrapper 仍是本地文件 — 优先纯托管解析。

向应用团队说明：

- 退出码 `2` — 配置 / 策略解析
- 退出码 `3` — 主机不支持或守护进程不可达
- JSON 审计 — 需要时使用 `--json`，将 `envelope` 送入 SIEM

---

## 8. 日常运维

### 8.1 策略更新

1. 编辑已审批 YAML → 构建 → 签名 → 发布新 bundle 版本。
2. Agent 按间隔/事件拉取；无需逐台推送文件。
3. 在生产 MDM 作用域前，在 **金丝雀** 组测试。

### 8.2 Kill switch

管理 UI 或：

```bash
curl -X POST "$FINSAFE_AUTHORITY_PUBLIC_URL/v1/admin/kill-switch" \
  -H 'Content-Type: application/json' \
  -d '{"until":"2026-12-31T23:59:59Z"}'
```

清除：`{"until":null}`。

### 8.3 撤销设备

```bash
curl -X POST "$FINSAFE_AUTHORITY_PUBLIC_URL/v1/admin/devices/DEVICE_ID/revoke"
```

心跳返回 `revoke_device: true`；agent 在本地设置 kill-switch。

### 8.4 监控

| 信号 | 来源 |
|------|------|
| 心跳 | Authority DB / 管理设备列表 |
| `tamper_suspected` | 当 `FINSAFE_AUTHORITY_REQUIRE_SENTINEL=1` 时哨兵缺失 |
| 二进制摘要不匹配 | 心跳 `binary_digests` 与发行清单 |
| 审计 | `POST /v1/audit/events` 上报；agent spool 在 `/var/lib/finsafe/audit/` |

### 8.5 升级

1. 构建新 `finsafe` / `finsafe-agent`，路径不变。
2. 更新 MDM 软件包；重启 agent 服务。
3. 若在哨兵中固定二进制，更新 `expected_binary_digests` 或发行清单中的预期摘要。

---

## 9. 回滚

| 场景 | 操作 |
|------|------|
| 发布了错误 bundle | 发布旧版本或激活 kill-switch；修复后发布新版本 |
| 哨兵过于激进 | 移除 MDM 哨兵描述文件（未注册机器可回退个人模式） |
| Agent 故障 | 停止单元；已注册且有哨兵的机器在 agent 恢复前无法运行 |
| 完全卸载 | 移除哨兵、停止 agent、卸载软件包、删除 `/etc/finsafe` 与 `/var/lib/finsafe` |

**警告：** 仅移除 agent 而保留哨兵会导致 `MANAGED_DAEMON_UNREACHABLE`（fail-closed）。

---

## 10. 安全边界

| 威胁 | 缓解 |
|------|------|
| 用户提供自有策略文件 | `MANAGED_POLICY_LOCAL_OVERRIDE` |
| 用户使用 `--personal` | 有哨兵/已注册时 `MANAGED_FORCED_BY_POLICY` |
| 陈旧或伪造 bundle | 注册时固定 JWS + JWKS；单调版本 |
| UDS 上的伪造 agent | Ed25519 challenge（`UdsChallenge`） |
| 本地管理员 | **不在范围内** — 可移除 MDM、替换二进制 |

将桌面用户视为策略对手时的边界说明见本手册 [§10 安全边界](#10-安全边界)。

---

## 11. 验收清单（试点 → 生产）

- [ ] Authority TLS 与 JWKS 已文档化
- [ ] Bundle v1 已发布且绑定与试点应用一致
- [ ] 哨兵已部署到试点作用域
- [ ] 注册 token 流程已测试；注册后已移除 token
- [ ] `finsafe run -- <app>` 成功；审计含托管元数据
- [ ] 已审阅 [托管模式矩阵](./testing/managed-mode-matrix-zh.md) 中的篡改场景
- [ ] 已定义审计上报 SIEM 路径
- [ ] 已指定手册负责人与 on-call 轮值

---

## 相关文档

- [managed-mode-zh.md](./managed-mode-zh.md) — 技术参考
- [mdm/](./mdm/) — Jamf、Intune、Ansible 手册（中英文）
- [packaging/mdm/](../packaging/mdm/) — 示例载荷
- [managed-mode-matrix-zh.md](./testing/managed-mode-matrix-zh.md) — 验收测试
