---
name: finsafe-bundlectl
description: >-
  finsafe-bundlectl 自包含运维指南：从 wrapper 策略 YAML 构建 BundleV1、用 authority Ed25519 密钥签名、
  发布到 finsafe-authority-http、为 MDM 签发 managed-required 哨兵 JWS。适用于仅有 bundlectl 二进制
  与本技能文件、或任务涉及 bundle publish / managed-required.json / sentinel sign 的场景。
---

# finsafe-bundlectl 运维技能

供 AI Agent 协助**平台 / 安全运维**在**锁定工作站**上操作 — 非舰队终端用户。本技能**自包含**；运维人员可能只有 `finsafe-bundlectl` 与本文件（无需本地克隆任何仓库）。

## 范围

| 包含 | 不包含 |
|------|--------|
| `bundle build`、`bundle sign`、`bundle publish` | 桌面上的 `finsafe run`、个人 `--policy` |
| `sentinel sign`（MDM） | `finsafe-licensectl`（公开发布包不含） |
| 环境变量、签名密钥、许可证要求 | 开发新的 bundlectl 功能 |

## 运行前必备

| 项目 | 位置 | 说明 |
|------|------|------|
| **`finsafe-bundlectl` 二进制** | 运维工作站（Linux 或 macOS） | 发行包 `finsafe-bundlectl-v<version>-<target>.tar.zst` — 见 [Releases](https://github.com/finogeeks/finsafe/releases) |
| **`finsafe-authority-http`** | Linux authority 服务器 | 已启动且网络可达 |
| **`license.jws`** | 仅 authority 主机：`/etc/finsafe/license.jws` | Finogeeks 签发的商业许可证；缺失或无效时 **`bundle publish` 返回 HTTP 402** |
| **`signing_key.bin`** | authority + 运维侧副本 | 32 字节 Ed25519 种子；两侧通过 `FINSAFE_AUTHORITY_SIGNING_KEY` 使用**同一文件** |
| **Wrapper 策略 YAML** | 运维自选路径 | `bundle build` 的输入；不随 bundlectl 附带 |

### 商业许可证 vs 策略签名密钥（勿混淆）

| 文件 | 用途 | 运维笔记本上需要？ |
|------|------|-------------------|
| **`license.jws`** | 托管模式商业授权（注册、bundle 分发、管理 API） | **否** — 仅安装在 authority 主机 |
| **`signing_key.bin`** | 签署策略 bundle 与 managed-required 哨兵；对应 JWKS `/.well-known/finsafe/jwks.json` | **是** — 只读副本供 bundlectl（`FINSAFE_AUTHORITY_SIGNING_KEY`） |

JWKS 来自**策略签名密钥**，与 `license.jws` 无关。

### bundlectl 与 authority 的关系（无需另读文档）

```text
运维笔记本                         Policy Authority 服务器              舰队桌面
──────────                         ─────────────────────                ────────
finsafe-bundlectl                  finsafe-authority-http               finsafe-agent + finsafe
  │                                  │                                    │
  ├─ bundle build/sign               ├─ license.jws（商业）               ├─ /etc/finsafe/managed-required.json（MDM）
  ├─ bundle publish ──HTTP POST──►   ├─ 重签 bundle 入库                  ├─ GET /v1/bundles/current + JWKS
  └─ sentinel sign ──MDM 文件──►     └─ 注册、心跳、管理 UI               └─ finsafe run 经 agent 取策略
       （不经 HTTP 上传）
```

**发布路径：** `build` → 未签名 JSON → `sign` → 本地 JWS → `publish --in <jws> --authority <url>` → `POST /v1/admin/bundles` 提交 `{"bundle": <BundleV1>}`。authority **会再次签名**；agent 不信任运维机上的 JWS。

**哨兵路径：** `sentinel sign` 生成 JWS，由 MDM 部署为 `/etc/finsafe/managed-required.json`，**不**经 authority HTTP 上传。

## 安装二进制（运维工作站）

1. 打开 [FinSAFE Releases](https://github.com/finogeeks/finsafe/releases)，下载对应包：
   - Linux x86_64：`finsafe-bundlectl-v<version>-x86_64-unknown-linux-gnu.tar.zst`
   - macOS Apple Silicon：`finsafe-bundlectl-v<version>-aarch64-apple-darwin.tar.zst`
   - macOS Intel：`finsafe-bundlectl-v<version>-x86_64-apple-darwin.tar.zst`
2. 用同页 `SHA256SUMS` 校验。
3. 解压并安装：

```bash
VERSION=0.4.6
TARGET=aarch64-apple-darwin
tar -xvf "finsafe-bundlectl-v${VERSION}-${TARGET}.tar.zst"
sudo cp "finsafe-bundlectl-v${VERSION}-${TARGET}/finsafe-bundlectl" /usr/local/bin/
```

需要 **`zstd`**、**`tar`**。发布前审阅 JSON 建议安装 **`jq`**。

## 环境变量（运维工作站）

```bash
export FINSAFE_AUTHORITY_SIGNING_KEY=/secure/finsafe-authority/signing_key.bin
export FINSAFE_AUTHORITY_PUBLIC_URL=https://gov.example.com/policy-authority
export FINSAFE_ORG_DOMAIN=example.com
```

| 变量 | 用于 | 含义 |
|------|------|------|
| `FINSAFE_AUTHORITY_SIGNING_KEY` | sign / publish / sentinel | **32 字节** Ed25519 种子路径（与 authority 的 `signing_key.bin` 相同） |
| `FINSAFE_AUTHORITY_PUBLIC_URL` | publish / sentinel | authority **根 URL**（与 agent 的 `FINSAFE_AUTHORITY_URL` 一致）；勿加 `/v1/...` |
| `FINSAFE_ORG_DOMAIN` | sentinel sign | 写入哨兵的 org 域（未设置时默认 `example.com`） |
| `FINSAFE_AUTHORITY_KID` | 可选 | JWKS 中的 key id（默认 `authority-default`）；若设置须与 authority 一致 |

未设置 `FINSAFE_AUTHORITY_SIGNING_KEY` 时 bundlectl 可能在默认路径**自动生成**密钥 — **生产禁止**；必须指向 authority 真实密钥。

## 命令树（与发行二进制一致）

```text
finsafe-bundlectl bundle build  --from <policy.yaml|json> --out <draft.json>
finsafe-bundlectl bundle sign    --in <draft.json>        --out <bundle.jws>
finsafe-bundlectl bundle publish --in <bundle.jws>        --authority <base-url>
finsafe-bundlectl sentinel sign  --out <managed-required.jws>
```

**关键参数**

- sign / publish 使用 **`--in`**（不是 `--jws`、`--input`）。
- **`--authority`** 仅为 base URL，例如 `https://gov.example.com/policy-authority`。
- `bundle publish` 参数顺序任意。

## 最小 wrapper 策略（本地创建后 build）

将以下内容保存为 `policy.yaml`（可按项目调整）：

```yaml
schema_version: 1
kind: local-wrapper
program_mode: short-lived
degrade:
  allow_fallback: true
audit:
  require_policy_digest: true
  require_resolved_posture: true
network: host
resources:
  memory_max: "512M"
  pids_max: "64"
filesystem:
  read_only_paths:
    - "/usr"
    - "/bin"
  read_write_paths:
    - "./workspace"
```

输入可为 `.yaml`、`.yml` 或 JSON。

## 流程 A — 发布舰队策略 bundle

**按顺序**执行，勿跳过 sign。

```bash
WORKDIR=/tmp/finsafe-bundle-$(date +%Y%m%d)
mkdir -p "$WORKDIR"
POLICY=/path/to/policy.yaml

finsafe-bundlectl bundle build --from "$POLICY" --out "$WORKDIR/bundle-draft.json"
jq . "$WORKDIR/bundle-draft.json"

finsafe-bundlectl bundle sign \
  --in "$WORKDIR/bundle-draft.json" \
  --out "$WORKDIR/bundle.jws"

finsafe-bundlectl bundle publish \
  --in "$WORKDIR/bundle.jws" \
  --authority "$FINSAFE_AUTHORITY_PUBLIC_URL"
```

### `bundle build` 默认输出（sign 前可编辑）

- 未签名 **BundleV1** JSON
- 自动：`bundle_id` 形如 `bundle_YYYYMMDD`、`version: 1`、约 7 天 `expires_at`
- 默认 binding：`id: "default"`，`program: "*"`，`os: ["linux","macos"]`
- 复杂租户/设备规则须在 sign 前手工改 JSON

### 发布后自检

```bash
curl -sf "$FINSAFE_AUTHORITY_PUBLIC_URL/.well-known/finsafe/jwks.json"
curl -sf "$FINSAFE_AUTHORITY_PUBLIC_URL/v1/bundles/current" | head -c 200
curl -sf "$FINSAFE_AUTHORITY_PUBLIC_URL/v1/license/status"
```

已注册 agent 在下次心跳拉取新 bundle，无需逐台推送 bundle 文件。

## 流程 B — managed-required 哨兵（MDM）

与 bundle publish **独立**。

```bash
finsafe-bundlectl sentinel sign --out /tmp/managed-required.jws
```

通过 MDM/配置管理将内容部署到每台托管机：

```text
/etc/finsafe/managed-required.json
```

哨兵含 authority URL 与 JWKS 指纹；**策略正文**仍由 `bundle publish` 经 agent 拉取。

轮换 `signing_key.bin` 或变更对外 URL 后须**重签哨兵**并重新下发 MDM。

## Authority 服务器检查清单（与服务器管理员协作）

bundlectl **不**安装 authority。`bundle publish` 成功前需确认：

1. `finsafe-authority-http` 在 `FINSAFE_AUTHORITY_PUBLIC_URL` 上监听
2. `/etc/finsafe/license.jws` 已安装（或 `FINSAFE_LICENSE_PATH`）
3. 服务器上 `signing_key.bin` 已配置（默认常在 `/var/lib/finsafe-authority/`）
4. 运维机通过 `FINSAFE_AUTHORITY_SIGNING_KEY` 可访问**同一**密钥文件
5. 运维机可 `curl` JWKS / 健康检查
6. 在反向代理层保护 `POST /v1/admin/bundles` 与 `/admin/`（服务内置无管理鉴权）

## Agent 安全约束

1. 仅在**锁定运维机**运行 bundlectl。
2. 勿将 `signing_key.bin`、`bundle.jws`、`license.jws` 写入工单或 git。
3. `FINSAFE_AUTHORITY_SIGNING_KEY` 按 **CA 私钥** 保管；轮换需规划重新注册。
4. 勿将管理 bundle API 直接暴露公网。
5. 推荐：**build → 审阅 JSON → sign → publish** 一次完成。

## 故障排查

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| `missing flag --in` | 参数名错误 | sign/publish 用 `--in` |
| `publish failed: 402` | authority 无有效 `license.jws` | 在**服务器**安装 Finogeeks 许可证 |
| `publish failed: 4xx/5xx` | URL/代理/bundle 非法 | 修正 `--authority`；查服务器日志 |
| `bad signing key length` | 密钥文件损坏 | 恢复 32 字节 Ed25519 种子 |
| agent 策略未更新 | 密钥不一致或心跳未到 | 确认两侧同一密钥；等待心跳 |
| 有哨兵但注册失败 | URL/指纹变更 | 轮换密钥或 URL 后重签哨兵并下发 MDM |

## 可选在线参考（仅完整 URL）

仅在需要比本技能更多背景时使用：

- 发行包：https://github.com/finogeeks/finsafe/releases
- Authority 安装与许可证：https://github.com/finogeeks/finsafe/blob/main/docs/authority-deployment-zh.md
- 舰队分阶段部署：https://github.com/finogeeks/finsafe/blob/main/docs/enterprise-deployment-runbook-zh.md
- 示例 wrapper 策略（可下载 raw）：https://github.com/finogeeks/finsafe/tree/main/examples/wrapper-policies
