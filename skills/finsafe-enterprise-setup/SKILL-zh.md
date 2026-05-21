---
name: finsafe-enterprise-setup
description: >-
  企业 IT 仅通过 GitHub 发行包部署 FinSAFE 托管模式：Policy Authority、Finogeeks 签发的
  license.jws、finsafe-bundlectl 策略包、MDM 舰队下发与试点验收。适用于托管舰队搭建、
  authority 主机、商业许可证安装，且无需私有 FinSAFE 源码仓库。
---

# FinSAFE 企业部署（托管舰队）

供 AI Agent 协助**客户 IT / 平台工程**部署**托管模式**，仅依赖：

- [finogeeks/finsafe](https://github.com/finogeeks/finsafe) 文档与发行二进制
- **Finogeeks 签发**的 `license.jws`（不在 GitHub 上）
- 配套技能：[finsafe-bundlectl](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-bundlectl/SKILL-zh.md)

本技能**自包含**（仅使用完整 `https://` 链接），**无需**克隆私有 FinSAFE 源码仓库。

## 范围

| 范围内 | 范围外 |
|--------|--------|
| 发行包下载、authority 安装、许可证文件 | 签发 `license.jws`（`finsafe-licensectl` — 仅 Finogeeks） |
| 试点验收（`curl`、Admin UI） | `scripts/managed-mode/*`（私有源码仓 / Finogeeks CI） |
| MDM 舰队阶段（概要） | 仅 `install.sh` 的个人模式工作流 |
| 移交 bundlectl 技能做 publish/sentinel | 从源码 `cargo build` |

## 端到端链路

```text
Finogeeks 交付 license.jws
        ↓
发行包：finsafe-admin-server-v*  →  authority 主机
        finsafe-bundlectl-v*      →  运维工作站
        finsafe-fleet-v*          →  MDM → 各桌面
        ↓
安装许可证并启动 finsafe-authority-http
        ↓
将 authority signing_key.bin 复制到运维机（bundlectl）
        ↓
bundlectl：发布 bundle + sentinel sign
        ↓
MDM：舰队二进制 + managed-required.json + 注册
        ↓
试点：finsafe run --json -- /usr/bin/true  →  policy_source=managed
```

## 阶段 0 — 向 Finogeeks 获取

| 交付物 | 提供方 | 客户操作 |
|--------|--------|----------|
| **`license.jws`** | Finogeeks（商业授权） | 仅安装在 authority 主机 — 见阶段 2 |
| 支持 / 续期 | Finogeeks | 在 `expires_at` 前续期；可能有 `grace_until` 宽限期 |

**不要**在 [GitHub Releases](https://github.com/finogeeks/finsafe/releases) 上寻找 `license.jws` 或 `finsafe-licensectl`。

许可证安装详见：[authority-deployment-zh §2.1](https://github.com/finogeeks/finsafe/blob/main/docs/authority-deployment-zh.md#21-商业许可证托管模式)。

## 阶段 1 — 下载发行包

打开 [FinSAFE Releases](https://github.com/finogeeks/finsafe/releases)，校验 **`SHA256SUMS`** 后解压。

| 发行包 | 安装位置 |
|--------|----------|
| `finsafe-admin-server-v<version>-<target>.tar.zst` | **Policy Authority** 主机（生产推荐 Linux x86_64；macOS 用于试点/开发） |
| `finsafe-bundlectl-v<version>-<target>.tar.zst` | **运维**工作站（Linux 或 macOS） |
| `finsafe-fleet-v<version>-<target>.tar.zst` | **每台托管桌面**（经 MDM/Ansible） |

**托管舰队不用：** `install.sh` 安装的 `finsafe-v*`（仅个人模式 CLI）。

二进制矩阵：[binary-reference-zh.md](https://github.com/finogeeks/finsafe/blob/main/docs/binary-reference-zh.md)。

## 阶段 2 — Policy Authority + 商业许可证

详见：[authority-deployment-zh.md](https://github.com/finogeeks/finsafe/blob/main/docs/authority-deployment-zh.md)。

**摘要：**

1. 创建数据目录（如 `/var/lib/finsafe-authority`，权限 `0700`）。
2. 安装 **`license.jws`**：

```bash
sudo mkdir -p /etc/finsafe
sudo cp /secure/from-finogeeks/acme-license.jws /etc/finsafe/license.jws
sudo chmod 0640 /etc/finsafe/license.jws
```

3. 设置 **`FINSAFE_AUTHORITY_PUBLIC_URL`** 为终端可访问的 HTTPS 地址（生产必设）。
4. 启动服务 — systemd 单元：[packaging/systemd/finsafe-authority.service](https://github.com/finogeeks/finsafe/blob/main/packaging/systemd/finsafe-authority.service)。

**首次启动**时，若不存在密钥，authority 会在 `/var/lib/finsafe-authority/signing_key.bin` **自动生成**策略签名密钥。请**备份**并向运维机提供**只读副本**供 `finsafe-bundlectl` 使用（`FINSAFE_AUTHORITY_SIGNING_KEY`）。这是**策略**签名密钥，与商业许可证密钥无关。

### 验收 authority（安装许可证后）

```bash
AUTHORITY=https://gov.example.com/policy-authority

curl -sf "$AUTHORITY/health"
curl -sf "$AUTHORITY/v1/license/status" | jq .
curl -sf "$AUTHORITY/.well-known/finsafe/jwks.json" | jq .
curl -sf -X POST "$AUTHORITY/v1/enroll/token" | jq .
curl -sf "$AUTHORITY/v1/admin/devices" | jq .
```

无有效许可证时，注册/管理接口返回 **`402`**、`LICENSE_MISSING`。管理界面：`$AUTHORITY/admin/`。

另见 [binary-reference-zh — 生产验收清单](https://github.com/finogeeks/finsafe/blob/main/docs/binary-reference-zh.md#验证托管模式是否生效生产清单)。

## 阶段 3 — 发布策略 + MDM 哨兵（运维工作站）

使用技能：[finsafe-bundlectl/SKILL-zh.md](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-bundlectl/SKILL-zh.md)。

**最小步骤：**

```bash
export FINSAFE_AUTHORITY_SIGNING_KEY=/secure/copy-of-authority/signing_key.bin
export FINSAFE_AUTHORITY_PUBLIC_URL=https://gov.example.com/policy-authority
export FINSAFE_ORG_DOMAIN=example.com

curl -fsSL -o /tmp/hermes-smoke.yaml \
  https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/hermes-version-smoke.yaml

finsafe-bundlectl bundle build --from /tmp/hermes-smoke.yaml --out /secure/bundles/draft.json
finsafe-bundlectl bundle sign --in /secure/bundles/draft.json --out /secure/bundles/bundle-v1.jws
finsafe-bundlectl bundle publish --in /secure/bundles/bundle-v1.jws --authority "$FINSAFE_AUTHORITY_PUBLIC_URL"

finsafe-bundlectl sentinel sign --out /secure/mdm/managed-required.jws
```

若 **`bundle publish` 返回 402**，请先检查 authority 上的 **`license.jws`**。

## 阶段 4 — 舰队桌面（MDM）

详见：[enterprise-deployment-runbook-zh.md](https://github.com/finogeeks/finsafe/blob/main/docs/enterprise-deployment-runbook-zh.md)。

**每台桌面（概念）：**

1. 从 **`finsafe-fleet-v*`** 安装 `finsafe` + `finsafe-agent`（Linux 还需 helper/supervisor/landlock shim，与 `finsafe` 同目录）。
2. 经 MDM 下发 **`managed-required.json`**（来自 sentinel JWS）。
3. 启动 **`finsafe-agent`**（LaunchDaemon / systemd）— 见 [packaging/](https://github.com/finogeeks/finsafe/tree/main/packaging)。
4. 使用 Admin UI 或 API 的一次性 token **注册一次** — 脚本见 [packaging/mdm/examples/](https://github.com/finogeeks/finsafe/tree/main/packaging/mdm/examples/)。
5. 用户执行：`finsafe run --json -- /usr/bin/true`（或您的智能体运行时）。

**macOS 手工步骤：** [managed-mode-macos-runbook.md](https://github.com/finogeeks/finsafe/blob/main/docs/testing/managed-mode-macos-runbook.md)。

**MDM 厂商：** [mdm/README-zh.md](https://github.com/finogeeks/finsafe/blob/main/docs/mdm/README-zh.md)。

## 阶段 5 — 试点验收（无需私有脚本）

将矩阵作为**检查清单**使用，不要当作可执行脚本：[managed-mode-matrix-zh.md](https://github.com/finogeeks/finsafe/blob/main/docs/testing/managed-mode-matrix-zh.md)。

| 检查项 | 客户侧做法 |
|--------|----------|
| 许可证有效 | `GET /v1/license/status` → `valid` 或 `grace` |
| 已发布 bundle | `GET /v1/bundles/current` → 200 |
| 设备已注册 | 存在 `/etc/finsafe/enrolled.json` |
| 托管运行 | `finsafe run --json -- /usr/bin/true` → `policy_source=managed` 或 exit 0 |
| 篡改：本地 `--policy` | 有 sentinel 时应为 `MANAGED_POLICY_LOCAL_OVERRIDE` |
| 管理操作 | [admin-ui-zh.md](https://github.com/finogeeks/finsafe/blob/main/docs/admin-ui-zh.md) |

自动化 `scripts/managed-mode/*` 仅供 **Finogeeks 工程**（私有 monorepo）。

## 关键文档

| 主题 | 链接 |
|------|------|
| 文档索引 | https://github.com/finogeeks/finsafe/blob/main/docs/README-zh.md |
| IT 全景 | https://github.com/finogeeks/finsafe/blob/main/docs/enterprise-it-overview-zh.md |
| 完整 runbook | https://github.com/finogeeks/finsafe/blob/main/docs/enterprise-deployment-runbook-zh.md |
| Authority + 许可证 | https://github.com/finogeeks/finsafe/blob/main/docs/authority-deployment-zh.md |
| bundlectl 技能 | https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-bundlectl/SKILL-zh.md |
| 发行包 | https://github.com/finogeeks/finsafe/releases |

## 故障排查

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| enroll/publish 返回 `402` | 缺少/过期 `license.jws` | 安装 Finogeeks 许可证；查 `/v1/license/status` |
| `bundle publish` 签名失败 | `FINSAFE_AUTHORITY_SIGNING_KEY` 错误 | 使用 authority 主机上 32 字节 `signing_key.bin` |
| 注册失败 | `FINSAFE_AUTHORITY_PUBLIC_URL` 或 thumbprint 不一致 | 重新 `sentinel sign`、重新下发 sentinel、重新注册 |
| `MANAGED_DAEMON_UNREACHABLE` | 无 bundle 或 agent 未运行 | 发布 bundle；查 agent 日志 |
| `MANAGED_POLICY_LOCAL_OVERRIDE` | 有 sentinel 时的预期行为 | 舰队二进制不得再传本地 `--policy` |
| `install.sh` 的个人版仍可运行 | 可与舰队版共存 | 托管强制依赖 **`finsafe-fleet-v*`** 中的 `finsafe` |
