# 管理 UI 参考

**FinSAFE Policy Authority 管理控制台**是一个精简的基于浏览器的运维界面，由 authority 服务托管在 `/admin/` 路径下。

**URL（生产）：** `https://gov.example.com/policy-authority/admin/`  
**URL（本地开发）：** `http://127.0.0.1:8090/admin/`

**English:** [admin-ui.md](./admin-ui.md)

> **安全提示：** 管理 UI 没有内置认证。生产环境中，请在反向代理层限制 `/admin/` 和 `/v1/admin/*` 的访问，使用 IP 白名单、SSO/OIDC 或 mTLS。详见 [authority-deployment-zh.md § 安全说明](./authority-deployment-zh.md#7-安全说明)。

---

## 商业许可证面板

控制台顶部的 **Commercial license（商业许可证）** 通过 `GET /v1/license/status` 展示实时状态：`valid`、`missing`、`expired`、`grace`、`invalid`，以及客户 ID、subject、过期时间、已启用功能、`max_devices` 等。

受保护 API 因未安装或许可证无效而失败时，authority 返回 **`402 Payment Required`**，例如：

```json
{
  "error": "license missing: install a signed license at /etc/finsafe/license.jws",
  "code": "LICENSE_MISSING"
}
```

界面会提示在 `/etc/finsafe/license.jws` 安装或续期许可证（或在服务上设置 `FINSAFE_LICENSE_PATH`），并重启 `finsafe-authority-http`。

**等效 API：**

```bash
curl -sf "$AUTHORITY/v1/license/status" | jq .
```

---

## 各功能区

### 设备列表（Devices）

展示所有已注册设备及其最近心跳时间、managed-required 哨兵是否存在、以及撤销状态。

点击 **Refresh** 刷新。每条记录包含：

| 字段 | 说明 |
|------|------|
| `device_id` | 注册时设置的稳定标识符（`FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID`）。 |
| `last_seen` | 最近一次心跳的 UTC 时间戳。 |
| `sentinel_present` | Agent 上次汇报时 `/etc/finsafe/managed-required.json` 是否存在。 |
| `revoked` | `true` 表示该设备已被撤销。被撤销设备在下次心跳时收到 `revoke_device: true`，并进入本地 kill-switch 状态。 |

**等效 API：**
```bash
curl -sf "$AUTHORITY/v1/admin/devices" | jq .
```

### 注册 Token（Enrollment token）

签发一个**一次性注册 token**（JWS，有效期 15 分钟）。复制 `token` 值，在设备首次启动时通过 `FINSAFE_ENROLL_TOKEN` 环境变量传给 `finsafe-agent` 服务。

该 token 会在首次成功注册后被消费。注册时，authority 还会把
`FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID` 绑定到 agent 的本地设备密钥；后续若其他设备使用相同
`device_id` 但设备密钥不同，将返回 `DEVICE_ID_ALREADY_BOUND`。

注册成功后，从 agent 的服务环境配置中删除该 token（见 [企业部署手册 Phase D.3](./enterprise-deployment-runbook-zh.md#d3-从-mdm-移除-token)）。

**等效 API：**
```bash
curl -sf -X POST "$AUTHORITY/v1/enroll/token" | jq .
# {"token":"<jws>","expires_at":"<rfc3339>"}
```

### Kill switch

激活或清除**全舰队 kill switch**，阻止所有已注册桌面的 `finsafe run` 执行成功。适用于应急响应场景。

- **激活（1h）：** 设置从当前时间起 1 小时后到期的 kill switch。Agent 在下次心跳或 bundle 拉取时收到 kill-switch 状态。
- **清除：** 立即清除 kill switch。

也可通过 API 设置任意到期时间：

```bash
# 激活到指定时间
curl -X POST "$AUTHORITY/v1/admin/kill-switch" \
  -H 'Content-Type: application/json' \
  -d '{"until":"2026-12-31T23:59:59Z"}'

# 清除
curl -X POST "$AUTHORITY/v1/admin/kill-switch" \
  -H 'Content-Type: application/json' \
  -d '{"until":null}'
```

---

## 其他管理 API 接口（CLI / 自动化专用）

以下接口未在 UI 中展示，但可用于脚本和自动化：

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/v1/admin/bundles` | 发布已签名的 bundle JWS，由 `finsafe-bundlectl bundle publish` 调用。 |
| `POST` | `/v1/admin/devices/{device_id}/revoke` | 撤销指定设备。 |
| `GET` | `/.well-known/finsafe/jwks.json` | 用于验证 bundle 签名的 JWKS。 |
| `GET` | `/v1/bundles/current` | 最新 bundle JWS（agent 使用）。 |
| `GET` | `/health` | 存活检查（`200 ok`）。 |
| `GET` | `/v1/events` | 管理事件 SSE 流（bundle 轮换、kill-switch、撤销）。 |

---

## 相关文档

- [authority-deployment-zh.md](./authority-deployment-zh.md) — 安装和运行 authority 服务
- [enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md) — 分阶段 IT 部署手册
