# 托管模式：`finsafe` CLI、Agent 与 Policy Authority 连接说明

**English:** [managed-cli-authority-connectivity.md](./managed-cli-authority-connectivity.md)

本文说明在 **托管模式**（MDM **哨兵**、设备 **注册** 或两者并存）下，员工桌面上的 **`finsafe`** 如何工作。在 [managed-mode-zh.md](./managed-mode-zh.md) 概述基础上，补充连接拓扑、发现规则与实现引用。

**读者：** 企业 IT、安全架构师、排查 `MANAGED_DAEMON_UNREACHABLE` 或注册问题的集成人员。

**相关：** [enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md) · [endpoint-deployment-options-zh.md](./endpoint-deployment-options-zh.md) · [authority-deployment-zh.md](./authority-deployment-zh.md) · [mdm/README-zh.md](./mdm/README-zh.md)

---

## 核心原则

在舰队 / 哨兵模式下，**`finsafe` 不会通过 HTTPS 直接访问 Policy Authority（策略权威）**。

| 组件 | 是否访问 Policy Authority | 是否访问 `finsafe-agent` |
|------|---------------------------|--------------------------|
| **`finsafe` CLI** | 否 | 是（仅本地 IPC） |
| **`finsafe-agent`** | 是（注册、JWKS、bundle、心跳、审计） | N/A（IPC 服务端） |
| **MDM / IT** | 部署哨兵并配置 agent 环境变量 | 安装并启动 agent 服务 |

策略治理由以下链路保证：

1. **磁盘标记** — 哨兵和/或注册文件使 CLI 进入托管行为。
2. **`finsafe-agent`** — 从权威拉取已签名 bundle、校验并缓存，按程序/用户/组选择绑定。
3. **本地 IPC** — CLI 在启动沙箱前向 agent 获取有效 wrapper 策略。

---

## 架构图

```text
  MDM / IT
    │  安装：finsafe、finsafe-agent、managed-required.json
    │  在 agent 服务上设置：FINSAFE_AUTHORITY_URL
    │  一次性：FINSAFE_ENROLL_TOKEN + FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID
    ▼
┌─────────────────────────────────────────────────────────────┐
│  员工桌面                                                    │
│                                                              │
│  finsafe run -- <程序>  ──IPC──►  finsafe-agent              │
│       │                                  │                   │
│       │（CLI 不直连权威）                  │ HTTPS             │
│       │                                  ▼                   │
│       │                    Policy Authority                  │
│       │                    (finsafe-authority-http)         │
│       │                    • /.well-known/finsafe/jwks.json  │
│       │                    • /v1/enroll                      │
│       │                    • /v1/bundles/current             │
│       │                    • /v1/heartbeats                  │
│       │                    • /v1/audit/events                │
│       ▼                                                      │
│  沙箱（Seatbelt / bwrap+seccomp+Landlock / Windows）         │
└─────────────────────────────────────────────────────────────┘
```

与 [enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md) 中的架构回顾一致。

---

## CLI 如何判定处于托管模式

托管模式由 **本地文件系统状态** 推断，CLI **不会** 主动探测权威是否在线。

### 信号

| 信号 | 生产路径（Linux/macOS） | Windows |
|------|-------------------------|---------|
| **托管强制哨兵** | `/etc/finsafe/managed-required.json` | `C:\ProgramData\FinSAFE\managed-required.json` |
| **注册标记** | `/etc/finsafe/enrolled.json` | `C:\ProgramData\FinSAFE\enrolled.json` |

**哨兵** 为运维签发的紧凑 JWS（或带 `jws` 字段的 JSON 包装），由 `finsafe-bundlectl sentinel sign` 生成。载荷类型：`ManagedRequiredSentinelV1`（`crates/finsafe-bundle/src/sentinel.rs`），字段包括：

- `authority_url` — 期望的权威根 URL（签名元数据，用于舰队证明；见下文 [哨兵与 agent 的权威 URL](#哨兵与-agent-的权威-url)）
- `jwks_thumbprint` — 固定权威 JWKS 指纹
- `org_domain`、`expected_binary_digests`、`issued_at`、`expires_at`

**注册文件** 由 agent 在 `POST /v1/enroll`（或开发 bootstrap）成功后写入。记录类型：`EnrollmentRecordV1`（`crates/finsafe-agent/src/enroll.rs`）：`device_id`、`authority_url`、`jwks_thumbprint`。

### CLI 判定逻辑

实现位置：`crates/finsafe-cli/src/managed.rs`（`detect_run_mode`）、`crates/finsafe-cli/src/cli.rs`（`managed_implicit_for`）：

- 存在 **哨兵** 或 **`enrolled.json`**，且用户 **未** 使用 `--personal` 时，wrapper 运行走 **托管** 策略解析（不可使用本地 `--policy`）。
- 存在哨兵时 **`--personal` 被拒绝**（`MANAGED_FORCED_BY_POLICY`）。
- 托管下使用本地 **`--policy`** 或全局 wrapper 策略文件会被 **拒绝**（`MANAGED_POLICY_LOCAL_OVERRIDE`）。

仅有哨兵 **或** 仅有注册文件，任一即可使 CLI 进入托管模式。

### 测试 /  harness 覆盖

设置 **`FINSAFE_MANAGED_STATE_DIR`** 可将哨兵、注册、agent 套接字、缓存与审计路径重定向到同一目录。[`scripts/managed-lab.sh`](../scripts/managed-lab.sh) 在 `~/.finsafe-lab` 下使用该模式供试点使用。

---

## CLI 如何连接（仅连接 agent）

托管且未提供本地策略文件时，`finsafe` 通过 agent 加载策略（`crates/finsafe-cli/src/main.rs` → `load_wrapper_policy_managed`）：

1. **`verify_daemon_challenge()`** — 证明 IPC 对端为真实 agent（nonce + 设备密钥对 UDS/管道的签名）。
2. **`resolve_managed_policy(program, argv, user, groups)`** — 发送 `GetEffectivePolicy`，接收 `WrapperPolicyV1` 及 bundle 元数据（`bundle_id`、`run_token` 等）。

托管策略审计标签：`managed://finsafe-agent`。

### IPC 端点

| 平台 | 默认 | 覆盖 |
|------|------|------|
| Linux/macOS | `/run/finsafe-agent.sock` | `FINSAFE_AGENT_SOCKET` |
| Windows | `\\.\pipe\finsafe-agent` | `FINSAFE_AGENT_SOCKET`（管道名） |

协议：换行分隔 JSON（`finsafe_agent::protocol`）。客户端：`finsafe_agent::client::exchange`（`crates/finsafe-cli/src/managed.rs`）。

### 常见 CLI 错误（与连接相关）

| 代码 | 含义 |
|------|------|
| `MANAGED_DAEMON_UNREACHABLE` | 套接字/管道不存在、连接失败、读超时或 challenge 失败 |
| `MANAGED_FORCED_BY_POLICY` | 哨兵禁止 `--personal` 或 agent 拒绝覆盖 |
| `MANAGED_POLICY_LOCAL_OVERRIDE` | 托管下使用了 `--policy` / 全局 wrapper 文件 |
| `MANAGED_BUNDLE_EXPIRED` / `POLICY_DENIED` | 由 agent 返回：无有效 bundle 或绑定不匹配 |

完整表：[managed-mode-zh.md#cli-错误](./managed-mode-zh.md#cli-错误)。

---

## Agent 如何定位并连接 Policy Authority

仅 **`finsafe-agent`** 通过 HTTPS 访问 Policy Authority。

### 权威根 URL

| 来源 | 适用场景 |
|------|----------|
| **Agent 进程上的 `FINSAFE_AUTHORITY_URL`** | 主配置（systemd `Environment=`、LaunchDaemon plist、Intune 脚本）。未设置时代码默认 `http://127.0.0.1:8090`（仅开发）。 |
| **`enrolled.json` → `authority_url`** | 注册 API 或 bootstrap 写入后持久化 |
| **加载时环境变量覆盖** | Agent 读取 `enrolled.json` 时若 `FINSAFE_AUTHORITY_URL` 非空，**覆盖** 文件中 URL（`enroll.rs` 中 `load_enrollment`） |

生产环境应在 **agent 服务** 上设置 **`FINSAFE_AUTHORITY_URL`**，与签发哨兵时使用的公开 URL（`finsafe-bundlectl` 的 `FINSAFE_AUTHORITY_PUBLIC_URL`）一致。仅填 **根 URL**，不要带 `/v1/...` 后缀。

示例：`https://gov.example.com/policy-authority`

### 哨兵与 agent 的权威 URL

哨兵 JWS 中的 `authority_url` 用于 **签名舰队元数据** 及 agent 启动时的 JWKS 指纹校验。Agent **当前不会** 从已验证哨兵中读取 `authority_url` 作为 HTTP 目标；HTTP 使用 **`FINSAFE_AUTHORITY_URL`** 与 **`enrolled.json`**（见上）。

运维须保持哨兵签名 URL 与 agent 环境变量 **一致**。参见 [finsafe-bundlectl 技能](./../skills/finsafe-bundlectl/SKILL-zh.md)。

### 首次注册

Agent 启动时（`crates/finsafe-agent/src/runtime.rs`）：

1. 若已有 **`enrolled.json`** — 加载记录，从权威拉 JWKS，从磁盘刷新 bundle 缓存。
2. 否则若设置 **`FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID`**：
   - 有 **`FINSAFE_ENROLL_TOKEN`**：`POST {authority}/v1/enroll` → 写入 `enrolled.json`。
   - 无 token（仅开发）：用 `config.authority_url` 写入最小 `enrolled.json`。
3. 否则 — agent 可提供 IPC，但可能尚无 bundle，直至完成注册。

MDM 常见做法：签发一次性注册 token，在安装脚本中注入 token 与 device id，出现 `enrolled.json` 后移除 token（[mdm/README-zh.md](../packaging/mdm/README-zh.md)）。

### 持续使用的权威 HTTP API

| 用途 | 方法与路径 |
|------|------------|
| 信任 / 校验 bundle | `GET {authority}/.well-known/finsafe/jwks.json` |
| 设备当前 bundle | `GET {authority}/v1/bundles/current`（请求头 `X-Device-ID`） |
| 心跳、篡改、kill-switch | `POST {authority}/v1/heartbeats` |
| 审计上传 | `POST {authority}/v1/audit/events` |

默认间隔（`AgentConfig`）：bundle 拉取约 300s；心跳约 60s（当拉取间隔更长时，心跳 tick 也可能触发拉取）。

---

## 哨兵与注册（运维视角）

| 制品 | 写入方 | 对 CLI 的影响 | 对 Agent 的影响 |
|------|--------|---------------|-----------------|
| **`managed-required.json`** | MDM（`finsafe-bundlectl sentinel sign`） | 强制托管；存在时禁止 `--personal` | 启动校验 JWS；固定 JWKS 指纹；心跳上报 `managed_required_sentinel_present` |
| **`enrolled.json`** | Agent 在 `/v1/enroll` 之后 | 无哨兵时也可进入托管 | 保存 `device_id`、`authority_url`；启用拉取/心跳/审计 |

**生产建议：** 同时部署 **哨兵**（防篡改的“必须托管”）与 **注册**（设备身份与 bundle 分发）。

---

## 端到端：`finsafe run` 在舰队笔记本上

1. 应用或用户执行 `finsafe run -- /path/to/app`（无 `--policy`）。
2. CLI 检查哨兵和/或 `enrolled.json` → **托管**（除非 `--personal` 且策略允许 — 哨兵存在时禁止 personal）。
3. CLI 连接 **`/run/finsafe-agent.sock`**（或 Windows 管道）。
4. CLI 执行 **UDS challenge**，再对 program、argv0、user、groups、OS 发起 **`GetEffectivePolicy`**。
5. Agent 校验哨兵（若存在）、检查 kill-switch，从 **已缓存签名 bundle** 选择绑定，返回策略与 `run_token`。
6. CLI 展开文件系统模板，应用 wrapper 与主机 profile，在沙箱内运行载荷。
7. 并行（后台）：agent 使用 `enrolled.json` + `FINSAFE_AUTHORITY_URL` 向权威拉 bundle 并发送心跳。

---

## 配置清单（IT）

| 项 | 位置 | 说明 |
|----|------|------|
| 权威可达 | 网络 / TLS 入口 | 客户端需能 HTTPS 访问公开根 URL |
| `FINSAFE_AUTHORITY_URL` | Agent 服务环境变量 | 与签发哨兵时的 `FINSAFE_AUTHORITY_PUBLIC_URL` 一致 |
| 哨兵 JWS | `/etc/finsafe/managed-required.json` | 来自 `finsafe-bundlectl sentinel sign` |
| Agent 服务运行 | systemd / launchd / Windows 服务 | CLI 托管运行前套接字/管道须存在 |
| 一次性注册 | `FINSAFE_ENROLL_TOKEN`、device id | 直至出现 `enrolled.json` |
| 商业许可证 | Authority 主机 `/etc/finsafe/license.jws` | Finogeeks 签发；控制舰队 API |

验证脚本：[`packaging/scripts/check-authority-health.sh`](../scripts/check-authority-health.sh) · [authority-deployment-zh.md §5](./authority-deployment-zh.md#5-验证)。

---

## 代码引用（源码仓库）

| 主题 | 位置 |
|------|------|
| 托管路径 | `crates/finsafe-bundle/src/paths.rs` |
| 哨兵 schema / 校验 | `crates/finsafe-bundle/src/sentinel.rs` |
| CLI 托管 IPC | `crates/finsafe-cli/src/managed.rs` |
| CLI run / 策略加载 | `crates/finsafe-cli/src/main.rs` |
| Agent 配置 / URL | `crates/finsafe-agent/src/config.rs` |
| 注册 | `crates/finsafe-agent/src/enroll.rs` |
| Agent 启动、拉取、心跳 | `crates/finsafe-agent/src/runtime.rs`、`pull.rs`、`heartbeat.rs` |
| Agent RPC / 策略选择 | `crates/finsafe-agent/src/rpc.rs` |

---

## 另见

- [managed-mode-zh.md](./managed-mode-zh.md) — 组件、路径表、快速开始
- [sandbox-management-model-zh.md](./sandbox-management-model-zh.md) — bundle、组、分配
- [endpoint-deployment-options-zh.md](./endpoint-deployment-options-zh.md) — MDM / Ansible / 仅中心侧
- [testing/managed-mode-matrix-zh.md](./testing/managed-mode-matrix-zh.md) — 验收测试
