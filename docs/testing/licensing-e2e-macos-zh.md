# 许可证 E2E — macOS 指南

**English:** [licensing-e2e-macos.md](./licensing-e2e-macos.md)

> **读者：** 在试点中验证**商业许可证**与托管 API 的客户 IT 与安全团队。使用 [GitHub Releases](https://github.com/finogeeks/finsafe/releases) 的**发行版二进制**与 **Finogeeks 签发**的 `license.jws`。

相关文档：

- [authority-deployment-zh.md](../authority-deployment-zh.md) — 生产 `license.jws`
- [managed-mode-matrix-zh.md](./managed-mode-matrix-zh.md) — 托管验收清单
- [managed-mode-macos-runbook.md](./managed-mode-macos-runbook.md) — Mac 手工舰队步骤

---

## 客户试点验收

**推荐技能：** [finsafe-enterprise-setup/SKILL-zh.md](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-enterprise-setup/SKILL-zh.md)。

**单机实验：** [managed-lab-zh.md](./managed-lab-zh.md)（设置 `FINSAFE_LICENSE_PATH` 后 `./scripts/managed-lab.sh start`）。

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

## 与验收矩阵的对应

| 矩阵项 | 验证方式 |
|--------|----------|
| 无证阻断 | 无 `license.jws` 时 admin/enroll 返回 `402` |
| 有效许可证 | `/v1/license/status` + 管理 API `200` |
| 席位 | 超过许可证 `max_devices` 注册 |
| 注册 + 运行 | [managed-mode-macos-runbook.md](./managed-mode-macos-runbook.md) 或 [managed-lab-zh.md](./managed-lab-zh.md) |
| 篡改、kill switch、轮换 | [managed-mode-matrix-zh.md](./managed-mode-matrix-zh.md) 检查清单 |
