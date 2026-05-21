# 部署 finsafe-authority

本指南面向负责托管模式桌面注册所需的中央 Policy Authority 的 **IT / 平台工程师**。托管模式整体架构见 [managed-mode-zh.md](./managed-mode-zh.md)，分阶段舰队部署见 [企业部署手册](./enterprise-deployment-runbook-zh.md)。

**English:** [authority-deployment.md](./authority-deployment.md)

## 功能介绍

`finsafe-authority-http` 是一个轻量 HTTP 服务，负责：

- 存储和下发**已签名的策略 bundle** 给已注册的 agent。
- 签发和校验**注册 token**。
- 接收每台桌面 `finsafe-agent` 发送的**心跳**。
- 接收 agent spool 的**审计事件**。
- 提供**管理 UI** 与 JSON API 供运维人员使用。
- 发布 agent 用于验证 bundle 签名的 **JWKS**。

`finsafe-bundlectl` 是配套的运维 CLI，用于构建、签名和发布 bundle 及 managed-required 哨兵。运维 CLI 在 **`finsafe-bundlectl-v*`**（Linux + macOS）；authority HTTP 服务在 **`finsafe-admin-server-v*`**（Linux + macOS）。完整二进制清单见 [binary-reference-zh.md](./binary-reference-zh.md)。

---

## 1. 获取二进制

Policy Authority 与运维 CLI 在 [Releases](https://github.com/finogeeks/finsafe/releases) 中分为**两个**发行包：

| 发行包 | 安装位置 |
|--------|----------|
| `finsafe-admin-server-v<version>-x86_64-unknown-linux-gnu.tar.zst` | Linux 生产 authority 主机 |
| `finsafe-admin-server-v<version>-aarch64-apple-darwin.tar.zst` | macOS Apple Silicon（开发 / 试点） |
| `finsafe-admin-server-v<version>-x86_64-apple-darwin.tar.zst` | macOS Intel（开发 / 试点） |
| `finsafe-bundlectl-v<version>-<target>.tar.zst` | 运维工作站 — `finsafe-bundlectl`（Linux 或 macOS） |

校验并解压（方式与桌面发行包相同）：

```bash
VERSION=0.4.3
shasum -a 256 -c SHA256SUMS

# Authority 主机（Linux 服务器）
tar -xvf "finsafe-admin-server-v${VERSION}-x86_64-unknown-linux-gnu.tar.zst"
sudo cp finsafe-admin-server-v${VERSION}-x86_64-unknown-linux-gnu/finsafe-authority-http /usr/local/bin/

# macOS 开发 / 试点（从 Release 页选择匹配的 <target>）
tar -xvf "finsafe-admin-server-v${VERSION}-aarch64-apple-darwin.tar.zst"
sudo cp finsafe-admin-server-v${VERSION}-aarch64-apple-darwin/finsafe-authority-http /usr/local/bin/

# 运维 Mac 或 Linux（从 Release 页选择匹配的 <target>）
tar -xvf "finsafe-bundlectl-v${VERSION}-aarch64-apple-darwin.tar.zst"
sudo cp finsafe-bundlectl-v${VERSION}-aarch64-apple-darwin/finsafe-bundlectl /usr/local/bin/
```

**桌面发行包**（`finsafe`、`finsafe-agent` 及辅助二进制）是独立的，见 [顶层 README](../README.md)。

**AI Agent：** 自包含 bundlectl 技能（仅需二进制 + 技能文件）：https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-bundlectl/SKILL-zh.md

---

## 2. 数据目录

Authority 使用 SQLite 数据库和 Ed25519 签名密钥，首次运行前先创建目录：

```bash
sudo mkdir -p /var/lib/finsafe-authority
sudo chown finsafe-authority:finsafe-authority /var/lib/finsafe-authority  # 或你的服务用户
sudo chmod 0700 /var/lib/finsafe-authority
```

首次启动时，若 `/var/lib/finsafe-authority/signing_key.bin` 不存在，authority 会**自动生成**签名密钥。请**妥善保管并备份**此文件——所有已注册 agent 在注册时会固定该密钥的 JWKS 指纹，轮换密钥需重新注册所有设备。

---

## 2.1 商业许可证（托管模式）

公开发行的 **`finsafe` CLI（个人 / local-wrapper）** 可免费使用，**无需**许可证文件。

**托管模式**（Policy Authority、管理 API、注册、策略包分发、舰队审计）要求 authority 主机上安装 **Finogeeks 签发的商业许可证** 后，相关接口才会接受请求。

1. 向 Finogeeks 获取 `license.jws`（离线签名的 JWS）。
2. 安装到 authority 主机：

```bash
sudo mkdir -p /etc/finsafe
sudo cp acme-license.jws /etc/finsafe/license.jws
sudo chmod 0640 /etc/finsafe/license.jws
# 服务运行用户需具备读权限
```

3. 若使用非默认路径，可设置 `FINSAFE_LICENSE_PATH`。
4. 重启 `finsafe-authority-http`。

无有效许可证时，`/health`、`/.well-known/finsafe/jwks.json`、`/admin/`（静态 UI）及 `GET /v1/license/status` 仍可用于排查。受保护路由返回 **`402 Payment Required`**，JSON 中 `code` 可能为 `LICENSE_MISSING`、`LICENSE_EXPIRED`、`LICENSE_SEAT_LIMIT` 等。

许可证包含 **功能开关** 与可选 **`max_devices` 席位**，在**新设备注册**时强制（已撤销设备不计入席位）。`expires_at` 之后可选 **`grace_until`** 宽限期（通常 14 天），期间已注册设备仍可心跳与上报审计，便于续期。

---

## 3. 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `FINSAFE_AUTHORITY_BIND` | `127.0.0.1:8090` | 监听地址。反向代理后设为 `0.0.0.0:8090`。 |
| `FINSAFE_AUTHORITY_DB` | `/var/lib/finsafe-authority/authority.db` | SQLite 数据库路径。 |
| `FINSAFE_AUTHORITY_SIGNING_KEY` | `/var/lib/finsafe-authority/signing_key.bin` | 32 字节原始 Ed25519 签名密钥。 |
| `FINSAFE_AUTHORITY_KID` | `authority-default` | 嵌入 JWKS 和 JWS 头的密钥 ID。 |
| `FINSAFE_AUTHORITY_PUBLIC_URL` | `http://127.0.0.1:8090` | 返回给注册 agent 的公开 URL。**生产环境必须设置。** |
| `FINSAFE_AUTHORITY_REQUIRE_SENTINEL` | _未设置_ | 设为 `1` 时，将缺少哨兵的设备心跳标记为 `tamper_suspected`。 |
| `FINSAFE_ADMIN_UI_DIR` | _内置_ | 覆盖静态管理 UI 目录，通常不需要。 |
| `FINSAFE_LICENSE_PATH` | `/etc/finsafe/license.jws` | 托管/管理 API 所需的商业许可证 JWS。 |

**务必将 `FINSAFE_AUTHORITY_PUBLIC_URL` 设置**为已注册桌面可访问的 HTTPS URL。Agent 在注册时会将此 URL 写入 `/etc/finsafe/enrolled.json`。

---

## 4. 以服务方式运行

### Linux（systemd）

单元文件位于
[`packaging/systemd/finsafe-authority.service`](../packaging/systemd/finsafe-authority.service)。

```bash
sudo cp packaging/systemd/finsafe-authority.service /etc/systemd/system/
# 编辑单元文件，设置 FINSAFE_AUTHORITY_PUBLIC_URL 等环境变量。
sudo systemctl daemon-reload
sudo systemctl enable --now finsafe-authority
sudo systemctl status finsafe-authority
```

### macOS（LaunchDaemon）

请使用 **`finsafe-admin-server-v*-apple-darwin.tar.zst`** 中的原生二进制（不要用 Linux 包）。本地快速测试（无需 LaunchDaemon）：

```bash
export FINSAFE_AUTHORITY_BIND=127.0.0.1:8090
export FINSAFE_AUTHORITY_PUBLIC_URL=http://127.0.0.1:8090
export FINSAFE_AUTHORITY_DB="$HOME/.finsafe-authority/authority.db"
export FINSAFE_AUTHORITY_SIGNING_KEY="$HOME/.finsafe-authority/signing_key.bin"
export FINSAFE_LICENSE_PATH=/path/to/license.jws
mkdir -p "$(dirname "$FINSAFE_AUTHORITY_DB")"
finsafe-authority-http
```

生产级守护进程安装：

```bash
sudo cp packaging/launchd/com.finogeeks.finsafe-authority.plist \
    /Library/LaunchDaemons/
# 加载前编辑 plist，填入生产 URL。
sudo launchctl load /Library/LaunchDaemons/com.finogeeks.finsafe-authority.plist
```

### TLS / 反向代理

**不要**直接在 443 端口暴露 `finsafe-authority-http`，应：

1. 将服务绑定到 `127.0.0.1:8090`（或内部端口）。
2. 在前面放置 **nginx / Caddy / 负载均衡器** 来终止 TLS。
3. 在反向代理层限制 `/v1/admin/*` 和 `/admin/` 的访问（IP 白名单、SSO/OIDC、mTLS）。

---

## 5. 验证

服务启动且已安装 **`license.jws`**（§2.1）后：

```bash
AUTHORITY=https://gov.example.com/policy-authority

# 健康检查（始终可用）
curl -sf "$AUTHORITY/health"

# 许可证状态（排查缺失/过期/席位）
curl -sf "$AUTHORITY/v1/license/status" | jq .

# JWKS（agent 注册时固定的密钥）
curl -sf "$AUTHORITY/.well-known/finsafe/jwks.json" | jq .

# 托管 API 需有效许可证（期望 200，而非 402）
curl -sf -X POST "$AUTHORITY/v1/enroll/token" | jq .
curl -sf "$AUTHORITY/v1/admin/devices" | jq .

# 当前 bundle（未发布前返回 404，属正常）
curl -sf "$AUTHORITY/v1/bundles/current" | jq .

# 管理 UI
open "$AUTHORITY/admin/"
```

无许可证时，`POST /v1/enroll/token` 与 `GET /v1/admin/devices` 返回 **402** 及 `LICENSE_MISSING`。Authority + 桌面试点端到端检查见 [binary-reference-zh.md](./binary-reference-zh.md#验证托管模式已生效生产检查清单)。

---

## 6. 使用 finsafe-bundlectl 管理策略 bundle

`finsafe-bundlectl` 是创建和推送策略 bundle 的运维工具。请在**安全的运维工作站**上运行，该工作站需能访问签名密钥（不在终端用户机器上运行）。它通过 HTTP 与 authority 协作，**不能**替代 authority 进程本身。

可复制粘贴的命令序列与 Agent 向故障排查（自包含）见 https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-bundlectl/SKILL-zh.md

### bundlectl 与 authority 如何配合

| 组件 | 职责 |
|------|------|
| **`finsafe-bundlectl`** | 构建 bundle 草稿、本地签名（审阅）、向 authority **发布** bundle JSON、为 MDM 签名 **managed-required** 哨兵 JWS |
| **`finsafe-authority-http`** | SQLite 存储、对发布的 bundle **重新签名并持久化**、提供 `GET /v1/bundles/current`、JWKS、注册、心跳、管理 UI |
| **`finsafe-agent`** | 从 authority 拉取最新 bundle JWS，用 JWKS 校验，缓存策略并通过 UDS 供 `finsafe` 使用 |

```mermaid
flowchart LR
  subgraph ops [运维工作站]
    BC[finsafe-bundlectl]
    KEY[(签名密钥)]
    BC --> KEY
  end

  subgraph server [Policy Authority]
    AH[finsafe-authority-http]
    DB[(SQLite bundles/devices)]
    JWKS[/.well-known/finsafe/jwks.json]
    AH --> DB
    AH --> JWKS
  end

  subgraph provision [舰队交付]
    MDM[MDM / 配置管理]
  end

  subgraph fleet [托管桌面]
    AG[finsafe-agent]
    FS[finsafe CLI]
    AG --> FS
  end

  BC -->|POST /v1/admin/bundles| AH
  BC -->|sentinel sign| MDM
  MDM -->|managed-required.jws| AG
  AG -->|GET bundles/current + JWKS| AH
```

**策略 bundle 路径（集中下发）：**

```text
运维（bundlectl）                      Authority                          舰队桌面
────────────────                      ─────────                          ────────

bundle build  → 未签名 BundleV1 JSON
bundle sign   → bundle.jws（本地审阅；与 authority 共用签名密钥）
bundle publish --in bundle.jws --authority <URL>
       │
       │  POST /v1/admin/bundles  { "bundle": <BundleV1> }
       ▼
                         校验 license.jws（缺失则 402）
                         用 authority 密钥重新签名
                         写入 bundles 表（version → jws）
                         通知 agent（bundle-rotated）
                                                               agent: GET JWKS
                                                               agent: GET /v1/bundles/current
                                                               校验 JWS → 缓存 → finsafe run
```

发布时 authority **不会原样存储**运维机上的 JWS：它解析已校验的 bundle 载荷，用 **authority 密钥再次签名** 后入库。Agent 只信任 authority 主机上 `/.well-known/finsafe/jwks.json` 中的公钥。请在 bundlectl 工作站与 authority 服务器上使用**同一** `FINSAFE_AUTHORITY_SIGNING_KEY`。

**managed-required 哨兵（与 bundle 发布分开）：** `finsafe-bundlectl sentinel sign` 生成供 MDM 部署的 JWS（例如 `/etc/finsafe/managed-required.json`），其中包含 `authority_url` 与 JWKS 指纹；**不会**通过 authority HTTP API 上传。策略**内容**仍经 `bundle publish` → `GET /v1/bundles/current` 下发。

**由 authority 处理（非 bundlectl）：** 一次性注册令牌（`POST /v1/enroll/token`）、设备注册/吊销、kill switch、审计入库及 `/admin/` UI。

### 运维命令

一次性配置环境变量：

```bash
export FINSAFE_AUTHORITY_SIGNING_KEY=/secure/keys/finsafe-signing_key.bin
export FINSAFE_AUTHORITY_PUBLIC_URL=https://gov.example.com/policy-authority
export FINSAFE_ORG_DOMAIN=example.com
```

### 从 wrapper 策略 YAML 构建 bundle 草稿

```bash
finsafe-bundlectl bundle build \
  --from examples/wrapper-policies/hermes-interactive.yaml \
  --out /tmp/bundle-draft.json
```

草稿是纯 JSON 的 `BundleV1` 文档（未签名），签名前请先审阅。

### 签名 bundle

```bash
finsafe-bundlectl bundle sign \
  --in /tmp/bundle-draft.json \
  --out /tmp/bundle.jws
```

输出紧凑 JWS，将 stdout 打印的摘要记录到变更日志。

### 发布到 authority

```bash
finsafe-bundlectl bundle publish \
  --in /tmp/bundle.jws \
  --authority "$FINSAFE_AUTHORITY_PUBLIC_URL"
```

已注册 agent 在下次心跳间隔时自动拉取新 bundle，无需逐台推送文件。

### 签名 managed-required 哨兵（一次性）

```bash
finsafe-bundlectl sentinel sign --out /tmp/managed-required.jws
```

此 JWS 文件由 MDM 部署到舰队每台机器的 `/etc/finsafe/managed-required.json`。轮换签名密钥后需重新生成并重新部署。

---

## 7. 安全说明

- **签名密钥保管：** 将 `signing_key.bin` 视同 CA 私钥。生产环境使用 HSM 或专用锁定运维主机。泄露后需轮换密钥并重新注册整个舰队。
- **管理 UI 访问控制：** `/admin/` 路径和 `/v1/admin/*` 路由**没有内置认证**。需在反向代理层限制访问（IP 白名单、SSO/OIDC、mTLS）。管理 UI 界面本身也有此提示。
- **注册 token 有效期 15 分钟**，且为单次使用。及时撤销或丢弃未使用的 token；不要在 MDM 配置报告中长时间留存（见部署手册 Phase D.3）。

---

## 相关文档

- [binary-reference-zh.md](./binary-reference-zh.md) — 完整二进制套件、发行包、平台对照
- [managed-mode-zh.md](./managed-mode-zh.md) — 架构概览与 CLI 错误码
- [admin-ui-zh.md](./admin-ui-zh.md) — 管理控制台参考
- [enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md) — 分阶段 IT 部署手册
- [mdm/vendor-neutral-checklist-zh.md](./mdm/vendor-neutral-checklist-zh.md) — 舰队部署检查清单
