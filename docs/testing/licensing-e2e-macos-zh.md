# 许可证 E2E — macOS 指南

**English:** [licensing-e2e-macos.md](./licensing-e2e-macos.md)

> **读者**
>
> | 角色 | 使用章节 |
> |------|----------|
> | **客户 IT / 试点** | 下文 [客户试点验收](#客户试点验收)，以及 [finsafe-enterprise-setup 技能](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-enterprise-setup/SKILL-zh.md)、[authority-deployment-zh.md](../authority-deployment-zh.md)。 |
> | **Finogeeks 工程** | [Finogeeks 自动化 harness](#finogeeks-自动化-harness) — 需要**私有 FinSAFE 源码仓库**（不在 `finogeeks/finsafe` 公开发布）。 |

相关文档：

- [authority-deployment-zh.md](../authority-deployment-zh.md) — 生产 `license.jws`
- [managed-mode-matrix-zh.md](./managed-mode-matrix-zh.md) — 托管验收清单
- [managed-mode-macos-runbook.md](./managed-mode-macos-runbook.md) — Mac 手工舰队步骤

---

## 客户试点验收

使用 **发行包二进制** 与 **Finogeeks 签发**的 `license.jws`。无需 Rust 工具链或私有仓库脚本。

**推荐技能：** [finsafe-enterprise-setup/SKILL-zh.md](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-enterprise-setup/SKILL-zh.md)。

### 1. Authority + 许可证

从 [Releases](https://github.com/finogeeks/finsafe/releases) 安装 `finsafe-admin-server-v*` 中的 `finsafe-authority-http`。将 `license.jws` 置于 `/etc/finsafe/license.jws`，见 [authority-deployment-zh §2.1](../authority-deployment-zh.md#21-商业许可证托管模式)。

### 2. HTTP 许可证门禁（curl）

```bash
AUTHORITY=https://gov.example.com/policy-authority

curl -sf "$AUTHORITY/health"
curl -sf "$AUTHORITY/v1/license/status" | jq .
curl -sf "$AUTHORITY/v1/admin/devices" | jq .
curl -sf -X POST "$AUTHORITY/v1/enroll/token" | jq .
```

| 检查 | 有效许可证时的预期 |
|------|-------------------|
| `GET /health` | `200` |
| `GET /v1/license/status` | `status` 为 `valid` 或 `grace` |
| `GET /v1/admin/devices` | `200` |
| `POST /v1/enroll/token` | `200` |

无 `license.jws` 时，管理与注册返回 **`402`**、`code`: `LICENSE_MISSING`。

席位：注册满 `max_devices` 后，下一次注册应 **`402`** / `LICENSE_SEAT_LIMIT`。

### 3. 发布 bundle + 托管运行

按 [finsafe-bundlectl 技能](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-bundlectl/SKILL-zh.md) 与 [managed-mode-macos-runbook.md](./managed-mode-macos-runbook.md)。

```bash
finsafe run --json -- /usr/bin/true | jq '.envelope.policy_source // .exit_code'
```

已注册、有哨兵且已发布 bundle 时，预期 `policy_source == "managed"` 或退出码 `0`。

### 4. 生产试点

双机、真实 MDM：[enterprise-deployment-runbook-zh.md](../enterprise-deployment-runbook-zh.md)。

---

## Finogeeks 自动化 harness

以下仅在 **Finogeeks 私有 FinSAFE monorepo** 中运行（脚本不在 `finogeeks/finsafe` 上）。

macOS 验证许可证**不需要 Docker**；Landlock 或 Linux 专用脚本时再使用 OrbStack / Linux。

### 测试分层（工程）

| 层级 | 内容 | 命令（私有仓库） |
|------|------|------------------|
| **0 — 单元** | JWS、过期、宽限期、席位 | `cargo test -p finsafe-license -p finsafe-authority` |
| **1 — HTTP** | 无证 `402`、有证 `200`、席位 | `scripts/tests/managed-mode/license-suite.sh …` |
| **2 — macOS E2E** | 开发 `license.jws`、双 authority、托管运行 | `scripts/tests/managed-mode/e2e-licensing-macos.sh` |
| **2b — Hermes** | licensectl + bundlectl + Hermes | `scripts/tests/managed-mode/e2e-mac-authority-hermes.sh` |
| **3 — Linux** | Landlock、tamper | 见 [managed-mode-matrix-zh.md](./managed-mode-matrix-zh.md) |
| **4 — 试点** | 真实 MDM | [enterprise-deployment-runbook-zh.md](../enterprise-deployment-runbook-zh.md) |

### 一键 E2E（工程）

在私有仓库根目录：

```bash
./scripts/tests/managed-mode/e2e-licensing-macos.sh
```

### CI（工程）

```bash
cargo fmt --all -- --check
cargo clippy -p finsafe-license -p finsafe-authority -- -D warnings
cargo test -p finsafe-license -p finsafe-authority
./scripts/tests/managed-mode/e2e-licensing-macos.sh
```

---

## 与验收矩阵的对应

| 矩阵项 | 客户（curl / runbook） | 工程（私有脚本） |
|--------|------------------------|------------------|
| 无证阻断 | 无 `license.jws` 时 `402` | `license-suite.sh missing` |
| 有效许可证 | `/v1/license/status` + 管理 `200` | `license-suite.sh licensed` |
| 席位 | 手工超额注册 | `license-suite.sh seat-limit` |
| 注册 + 运行 | macOS runbook + `finsafe run --json` | `e2e-licensing-macos.sh` |
