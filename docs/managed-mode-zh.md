# FinSAFE 托管模式

企业桌面在 **托管模式** 下运行 FinSAFE：策略以经签名的 JWS bundle 形式由中央 **Policy Authority（策略权威）** 下发，由 **`finsafe-agent`** 校验并缓存后强制执行，现有 **`finsafe`** CLI 通过 Unix 域套接字消费策略。

管理员心智模型——Bundle 作为已签名策略集合、确定性 Group、一等 Assignment、Assignment 上的 rollout 与冲突处理——见 [FinSAFE 沙箱管理模型](./sandbox-management-model-zh.md)。

若不存在纳管标记且未部署 `managed-required` 哨兵，个人/开发者用法保持不变。

**English:** [managed-mode.md](./managed-mode.md)

**企业 IT：** 请先阅读 **[企业 IT 全景](./enterprise-it-overview-zh.md)**（个人 / 托管对比、Hermes 示例、防篡改与可治理性），再阅读 [企业部署手册](./enterprise-deployment-runbook-zh.md)。舰队安装：[与 MDM 产品无关的检查清单](./mdm/vendor-neutral-checklist-zh.md)（适用于任意 MDM 或配置管理），或 [Jamf](./mdm/jamf-zh.md) / [Intune](./mdm/intune-zh.md) / [Ansible](./mdm/ansible-zh.md)。

**连接详解：** CLI 仅通过 agent 取策略（不直连权威）、agent 如何解析 `FINSAFE_AUTHORITY_URL`、哨兵与注册分工及架构图 — [managed-cli-authority-connectivity-zh.md](./managed-cli-authority-connectivity-zh.md) · [English](./managed-cli-authority-connectivity.md)。

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

## 快速开始（本地实验）

在 **macOS 或 Linux** 上，一条脚本即可启动 authority、发布默认策略、注册 agent 并生成 `lab.env`：

```bash
export FINSAFE_LICENSE_PATH=/path/to/license.jws   # 由 Finogeeks 签发

./scripts/managed-lab.sh start
source "$(./scripts/managed-lab.sh env)"

finsafe run -- /usr/bin/true
./scripts/managed-lab.sh stop
```

需在 `PATH` 上安装 **[GitHub Releases](https://github.com/finogeeks/finsafe/releases)** 中的 **`finsafe-fleet-v*`**、**`finsafe-admin-server-v*`**、**`finsafe-bundlectl-v*`**。默认绑定 **`127.0.0.1:8095`**，状态目录 **`~/.finsafe-lab`**。完整说明：[managed-lab-zh.md](./testing/managed-lab-zh.md)。

实验期间管理 UI：[http://127.0.0.1:8095/admin/](http://127.0.0.1:8095/admin/)

生产路径（`/etc/finsafe`、MDM 哨兵、systemd/LaunchDaemon）见 [enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md) 与 [managed-mode-macos-runbook.md](./testing/managed-mode-macos-runbook.md)。

## 策略默认项（舰队管理员）

已发布的 Bundle 内含 **沙箱策略**（wrapper YAML）。FinSAFE 还会合并 **编译器默认项**，这些不会出现在每一份 bundle 文件中：

- **Linux/macOS：** 内置 **deny-read**（例如可写工作区下的 `.env`、`$HOME` 下的 `.ssh`）以及可写根下的 **受保护** `.git` / `.finsafe`，除非策略设置 `skip_default_deny_read: true` 或 `skip_default_protected_paths: true`。
- **Windows（隔离/托管）：** 同样应用内置 **deny-read**（可写根下的 `.env*`；`%USERPROFILE%` 下的 `.ssh`、`.aws`、`.gnupg`、`.config/gcloud`），经 DACL deny ACE 强制，除非 `skip_default_deny_read: true`。

仅升级 `finsafe` / agent 二进制、未重新发布 bundle 内容时，Linux/macOS 与 Windows 桌面上的强制行为仍可能变化。全量推广前请阅读 [POLICY-QUICKREF-zh.md](./POLICY-QUICKREF-zh.md) 中 **内置文件系统默认项** 与 **`filesystem.deny_read_paths`**。仅在程序确实需要读取默认拒绝路径时设置 `skip_default_deny_read: true`。

**网络 allowlist：** 策略使用 `network: !allowlist` 与 `domains:`；启动时需 `finsafe-net-proxy`，或设置 `start_internal_proxy: true` 使用本机回环代理（`127.0.0.1:60080`）。**个人/本地怎么跑：** [network-allowlist-proxy-runbook-zh.md](./network-allowlist-proxy-runbook-zh.md)。字段与 `FINSAFE_NET_PROXY_AUDIT_LOG` 见 [POLICY-QUICKREF-zh.md](./POLICY-QUICKREF-zh.md)。

**HTTPS 检查（`tls_terminate`）：** 可选商业能力（许可证功能 `mitm_tls_terminate`）。Authority 签发检查用 CA；已发布 bundle 携带 `inspection_ca_cert_pem`；Agent 安装证书并向子进程注入信任库环境变量。须向用户告知 HTTPS 可能被解密。配置见 [https-inspection-runbook-zh.md](./https-inspection-runbook-zh.md)、[authority-deployment-zh.md](./authority-deployment-zh.md) 与 [POLICY-QUICKREF-zh.md](./POLICY-QUICKREF-zh.md) — **TLS 检查**。

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
