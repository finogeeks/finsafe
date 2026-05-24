# FinSAFE 托管模式

企业桌面在 **托管模式** 下运行 FinSAFE：策略以经签名的 JWS bundle 形式由中央 **Policy Authority（策略权威）** 下发，由 **`finsafe-agent`** 校验并缓存后强制执行，现有 **`finsafe`** CLI 通过 Unix 域套接字消费策略。

管理员心智模型——Bundle 作为已签名策略集合、确定性 Group、一等 Assignment、Assignment 上的 rollout 与冲突处理——见 [FinSAFE 沙箱管理模型](./sandbox-management-model-zh.md)。

若不存在纳管标记且未部署 `managed-required` 哨兵，个人/开发者用法保持不变。

**English:** [managed-mode.md](./managed-mode.md)

**企业 IT：** 请先阅读 **[企业 IT 全景](./enterprise-it-overview-zh.md)**（个人 / 托管对比、Hermes 示例、防篡改与可治理性），再阅读 [企业部署手册](./enterprise-deployment-runbook-zh.md)。舰队安装：[与 MDM 产品无关的检查清单](./mdm/vendor-neutral-checklist-zh.md)（适用于任意 MDM 或配置管理），或 [Jamf](./mdm/jamf-zh.md) / [Intune](./mdm/intune-zh.md) / [Ansible](./mdm/ansible-zh.md)。

## 组件

完整二进制清单、发行包与 Linux 专属配套：[binary-reference-zh.md](./binary-reference-zh.md)。

| 二进制 / 服务 | 角色 |
|---------------|------|
| **商业许可证**（`/etc/finsafe/license.jws`） | Finogeeks 签发的 authority 许可证；控制管理、注册、bundle 与舰队审计（缺失/无效时返回 `402`） |
| `finsafe-authority-http` | JWKS、bundle 分发、注册、心跳、审计上报、管理 API |
| `finsafe-agent` | 注册、bundle 校验与缓存、UDS 协议、心跳、审计 spool 上传 |
| `finsafe` | 托管时从 agent 解析策略；仅当策略允许时可用 `--personal` 退出 |
| `finsafe-bundlectl` | 构建/签名/发布 bundle 与 managed-required 哨兵 — 见 [authority-deployment-zh.md](./authority-deployment-zh.md#6-使用-finsafe-bundlectl-管理策略-bundle) |
| `finsafe-helper`、`finsafe-supervisor`、`finsafe-landlock-shim` | **仅 Linux** — 与 `finsafe` 同目录，用于 bubblewrap/cgroup/Landlock（macOS 不交付） |

## 路径（Linux 默认）

| 路径 | 用途 |
|------|------|
| `/etc/finsafe/managed-required.json` | MDM 下发的 JWS 哨兵（强制托管模式） |
| `/etc/finsafe/enrolled.json` | 设备注册记录 |
| `/var/lib/finsafe/cache/` | 已校验 bundle 缓存 |
| `/var/lib/finsafe/audit/` | 审计 spool（NDJSON） |
| `/run/finsafe-agent.sock` | CLI ↔ agent UDS |

## 快速开始（开发）

```bash
# 终端 1 — authority（生产环境托管 API 需有效许可证）
export FINSAFE_AUTHORITY_DB=/tmp/finsafe-authority.db
export FINSAFE_LICENSE_PATH=/tmp/finsafe-license.jws   # 生产环境由 Finogeeks 签发
cargo run -p finsafe-authority --bin finsafe-authority-http

# 终端 2 — 构建并发布 bundle
finsafe-bundlectl bundle build --from examples/wrapper-policy.yaml --out /tmp/bundle.json
finsafe-bundlectl bundle sign --in /tmp/bundle.json --out /tmp/bundle.jws
finsafe-bundlectl bundle publish --in /tmp/bundle.jws --authority http://127.0.0.1:8090

# 终端 3 — agent（引导注册）
sudo mkdir -p /etc/finsafe /var/lib/finsafe
export FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID=dev-laptop-1
export FINSAFE_ENROLL_TOKEN=$(curl -s -X POST http://127.0.0.1:8090/v1/enroll/token | jq -r .token)
cargo run -p finsafe-agent

# 终端 4 — 托管运行
finsafe run -- /usr/bin/true
```

管理 UI：[http://127.0.0.1:8090/admin/](http://127.0.0.1:8090/admin/)

## CLI 错误码

| 代码 | 含义 |
|------|------|
| `MANAGED_FORCED_BY_POLICY` | 哨兵或已注册阻止 `--personal` 或本地覆盖 |
| `MANAGED_DAEMON_UNREACHABLE` | Agent 套接字不存在或 challenge 失败 |
| `MANAGED_POLICY_LOCAL_OVERRIDE` | 托管状态下使用了 `--policy` 或全局 wrapper 文件 |

## MDM 部署

完整分阶段流程见 [企业部署手册](./enterprise-deployment-runbook-zh.md)。各平台指南：

- [与 MDM 产品无关的检查清单](./mdm/vendor-neutral-checklist-zh.md) — **未使用 Jamf/Intune 时优先**
- [Jamf Pro](./mdm/jamf-zh.md)
- [Microsoft Intune](./mdm/intune-zh.md)
- [Ansible](./mdm/ansible-zh.md)

示例脚本：[`packaging/mdm/examples/`](../packaging/mdm/examples/)。

另见：[托管模式验收矩阵](testing/managed-mode-matrix-zh.md)、[macOS 许可证 E2E](testing/licensing-e2e-macos-zh.md)、[企业手册 — 安全边界](enterprise-deployment-runbook-zh.md#10-安全边界)。
