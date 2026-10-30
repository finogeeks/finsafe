# 管理 UI 参考

**English:** [admin-ui.md](./admin-ui.md)

**FinSAFE Policy Authority 管理控制台**为 React 运维界面，由 `finsafe-authority-http` 在 `/admin/` 提供（`embed-admin-ui` 构建或 `FINSAFE_ADMIN_UI_DIR`）。

**URL（生产）：** `https://gov.example.com/policy-authority/admin/`  
**URL（本地）：** `http://127.0.0.1:8090/admin/`

> **安全：** 请在反向代理层保护 `/admin/` 与 `/v1/admin/*`。通过
> `FINSAFE_ADMIN_TOKENS_PATH` 配置管理员 token，在 **设置 → 常规** 中填入
> `X-Admin-Token`。

---

## 导航概览

| 区域 | 用途 |
|------|------|
| **总览** | 舰队 KPI：设备数、24 小时内拒绝次数与运行次数、事件流。 |
| **设备** | 搜索/筛选；嵌套 **标签** 与 **分组**；批量打标签、查看策略包与拒绝次数。 |
| **运行** | 来自审计的托管运行记录。 |
| **审计** | 原始舰队审计事件。 |
| **策略包** | 已发布 bundle（已签名策略集合）；策略编辑器（引导式 + YAML）。 |
| **Assignments（分配）** | 将已发布 bundle 关联到分组并控制 rollout。 |
| **告警** | 安全相关审计类型（含策略拒绝）。 |
| **设置** | 许可证/token 与 **Kill switch**。 |

**推荐流程：** 在 **设备 → 标签** 与 **设备 → 分组** 中定义 **标签预设** 与 **设备分组**，发布 bundle，再在 **Assignments** 页将 bundle **分配** 到分组，最后在 **设备** 页分配匹配标签。详见 [沙箱管理模型](./sandbox-management-model-zh.md)。

---

## 设置 → 常规

| 字段 | 说明 |
|------|------|
| **Authority 公网 URL** | 设备与 bundlectl 使用的基址（如 `https://gov.example.com/policy-authority`）。 |
| **管理员令牌** | 写入 `X-Admin-Token` 的密钥；用于 API 与 UI。 |
| **设备过期阈值（秒）** | 无心跳超过该时间后设备标记为 **stale**（默认 300）。 |
| **注册 token TTL（秒）** | 一次性注册 token 有效期（默认 900）。 |

**保存** 会持久化到 authority 配置存储。修改 URL 或令牌后，请用新值更新 MDM 载荷与 `finsafe-bundlectl` 环境变量。

---

## 设备 → 标签预设

定义可在 **设备** 页分配的 `admin:*` 标签（如 `admin:dept=finance`）。**Assignments** 与 bundle `match_spec.groups` 依赖这些标签将设备归入分组。

---

## 设备 → 设备分组

**Group** 是由可信标签与设备事实上的**确定性规则**定义的**命名设备队列**。可用于 Assignment 的分组使用 `all` 规则：所有必需谓词必须同时匹配。支持 `admin:name=value` 标签、authority 已验证的 `device:*` 事实、`device_id` 以及直接 `not` 排除项。OR 情况应拆分为独立分组。

在此创建 Group；在 **设备** 页分配匹配的 `admin:*` 标签。在 **Assignments** 页将已发布 bundle 关联到 Group。

---

## HTTPS 检查（TLS 终止）

可选商业能力（`license.jws` 含 `mitm_tls_terminate`）。**合规：** 启用前须告知用户；沙箱内 HTTPS 可能被解密用于策略与审计。控制台暂无专用 CA 向导，请用管理 API（与 Kill switch 相同 `X-Admin-Token`）：

```bash
curl -X POST "$AUTHORITY/v1/admin/mitm/ca" -H "X-Admin-Token: $TOKEN"
curl -sf "$AUTHORITY/v1/admin/mitm/ca" -H "X-Admin-Token: $TOKEN" | jq -r '.cert_pem' | head -3
```

在 **Bundles** 中发布 `tls_terminate: true` 的策略。完整流程：[https-inspection-runbook-zh.md](./https-inspection-runbook-zh.md)。

---

## 设置 → Kill switch

### 是什么

**Kill switch（紧急制动）** 在激活后，`finsafe-agent` 会：

1. **阻止新的托管运行** — `finsafe run`、托管 `self-confine` 无法从 agent 获取策略（UDS 返回 `KILL_SWITCH_ACTIVE`）。
2. **结束进行中的沙箱** — 已注册的长运行会收到终止信号，经 grace 秒后退出（通常来自 bundle 的 `on_rotation.grace_secs`）。

设备 **仍保持注册**，心跳继续，便于在控制台观察舰队状态。

### 何时使用

| 场景 | 建议 |
|------|------|
| 发布了错误 bundle | 先激活 kill switch → 回滚或修复 → 再清除。 |
| 安全事件调查 | 全舰队或分组暂停，同时保留可见性。 |
| 变更冻结 | 使用 1h / 4h / 24h 或自定义到期时间。 |

### 何时不要用

| 改用… | 适用于… |
|--------|---------|
| **撤销设备** | 永久取消单台设备信任（设备详情 → Revoke）。 |
| **策略/assignment rollout** | 正常的绑定不匹配、网络/文件系统规则拒绝。 |
| **标签 + 分组** | 渐进发布，而非紧急停车。 |

### 界面范围

- **全舰队** — 全局 kill switch；心跳返回 `kill_switch_until`。
- **设备分组** — 对分组标签过滤器匹配的每台设备写入 per-device 记录。
- **指定 device_id** — 仅列出的设备。

**清除** 对所选范围发送 `until: null`。Agent **不会**因该事件再次进入拦截；下次心跳才是权威来源（设备撤销/篡改仍可保持拦截）。在 **全舰队** 下清除会删除 authority 中 **所有** kill switch 行（含此前按分组/设备写入的记录）。

带 `until` 的时限窗口在到期后会在心跳上 **自动解除**，不必再点清除。若要在到期前结束紧急制动，仍需点清除。恢复由心跳驱动 — **拉取 Bundle 不会**解除 Authority 紧急制动或设备撤销。

### API

```bash
curl -sf -H "X-Admin-Token: $TOKEN" "$AUTHORITY/v1/admin/kill-switch" | jq .

curl -X POST "$AUTHORITY/v1/admin/kill-switch" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: $TOKEN" \
  -d '{"until":"2026-05-23T21:00:00Z","scope":{"kind":"all"}}'

curl -X POST "$AUTHORITY/v1/admin/kill-switch" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: $TOKEN" \
  -d '{"until":null,"scope":{"kind":"all"}}'
```

需许可证功能 `kill_switch`。详见 [企业部署手册 § Kill switch](./enterprise-deployment-runbook-zh.md#82-kill-switch)。

---

## 设备

列出已注册设备，支持筛选（状态、标签、分组、搜索）、分页与批量打标签。请先在 **设备 → 标签** 中定义标签。

| 列 | 含义 |
|----|------|
| **Device** | 注册时的 `device_id`（`FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID`）。 |
| **Status** | `healthy`、`stale`（超过 `device_stale_after_secs` 无心跳，默认 5 分钟）、`revoked` 等。 |
| **Tags** | 设备标签；决定分组归属与 bundle `match_spec.groups`。 |
| **Bundle** | 心跳上报的最近 bundle id/版本；已知时可跳转详情。**Not reported** = 最近心跳无 bundle。 |
| **Last seen** | 相对与绝对最后心跳时间。 |
| **Denials 24h** | 该设备过去 24 小时内**策略拒绝**审计事件数（见下）。 |

**Revoke** 在设备详情页；撤销后心跳返回 `revoke_device: true`，agent 进入类似 kill switch 的本地拦截态。取消吊销后，下一次心跳会清除该拦截，无需重启 agent。

```bash
curl -sf -H "X-Admin-Token: $TOKEN" "$AUTHORITY/v1/admin/devices?limit=50" | jq .
```

---

## 策略拒绝（「Denials 24h」）

### 含义

**策略拒绝（policy denial）** 指托管模式审计事件 `kind: policy_denied`：FinSAFE 依据当前 authority bundle **拒绝** 一次托管执行尝试。这不是普通 OS 错误，也不是 kill switch 本身。

常见原因（写入审计 `reason` 时）：

- **无匹配 binding** — 例如 bundle 只绑定 `hermes`，用户运行了 `curl`。
- **Kill switch 已激活**。
- **运行时策略拦截** — 沙箱/网络/文件系统规则拒绝（在审计链路接通时）。

**设备 → Denials 24h** 与 **总览 → Denials (24h)** 统计过去 24 小时内入库的 `policy_denied` 事件（由 agent 上传 `finsafe` 产生的审计）。

### 何时关注该指标

| 现象 | 可能含义 |
|------|----------|
| 单设备突增 | 绑定配置错误、标签不对、用户运行未批准工具。 |
| 发布后全舰队上升 | 新 bundle 过严；查 **告警** 与审计 `reason`。 |
| 长期为 0 | 无拒绝记录，或该路径尚未产生 `policy_denied` 审计。 |

**排查：** **告警**、**审计**、设备详情、bundle binding。**修复：** 调整 binding、设备标签/分组或 rollout——除非需要紧急停车，否则不必使用 kill switch。

**Denials** 不同于 **kill switch**（运维暂停）与 **revoke**（取消设备信任）。

---

## 策略包与策略编辑器

发布已签名的 `BundleV1` JWS 作为**策略集合**（每个 bundle 可含多条沙箱策略）。当 authority 构建支持 `/v1/admin/policies/*` 时可预览/发布 YAML 策略。Bundle 发布创建策略**内容**；**Assignment** 控制哪些设备收到该 bundle。

---

## Assignments（分配）

**Assignments** 页将已发布的 bundle 版本关联到设备分组，并控制该关系的 rollout。Rollout 百分比、seed 及可选开始/结束时间属于 Assignment，不属于 bundle。

典型流程：

1. 在 **策略包** 页发布 bundle。
2. 在 **设备 → 分组** 创建或确认可用于 Assignment 的 Group。
3. 在 **Assignments** 预览匹配设备，再保存或激活 Assignment。

存在 active Assignment 时，`/v1/bundles/current` 通过 Assignment 解析有效 bundle。部分 rollout 之外的设备可能回退到更宽泛的 Assignment，或收到 `no_assignment`。歧义重叠以 `assignment_conflict` **失败关闭**。

```bash
curl -sf -H "X-Admin-Token: $TOKEN" "$AUTHORITY/v1/admin/assignments" | jq .

curl -X POST "$AUTHORITY/v1/admin/assignments/preview" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: $TOKEN" \
  -d '{
    "assignment_id": "finance-hermes-prod",
    "bundle_version": 3,
    "group_id": "finance-hermes",
    "rollout": { "percent": 10, "rollout_seed": "finance-hermes-prod-seed" }
  }' | jq .
```

---

## 其他管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/v1/enroll/token` | 一次性注册 token（15 分钟 TTL）。 |
| `POST` | `/v1/admin/bundles` | 发布 bundle JWS（`finsafe-bundlectl`）。 |
| `GET` | `/v1/admin/assignments` | 列出 bundle 到分组的 Assignment。 |
| `POST` | `/v1/admin/assignments` | 创建或更新 Assignment。 |
| `POST` | `/v1/admin/assignments/preview` | 预览匹配设备与冲突。 |
| `POST` | `/v1/admin/devices/{id}/revoke` | 撤销设备。 |
| `GET` | `/v1/admin/kill-switch` | 列出 active kill switch 行。 |
| `POST` | `/v1/admin/kill-switch` | 激活或清除 kill switch。 |
| `GET` | `/v1/events` | SSE：bundle 轮换、kill switch、审计、运行。 |
| `GET` | `/health` | 存活探针（`ok`）。 |

---
## 相关文档

- [sandbox-management-model-zh.md](./sandbox-management-model-zh.md) — Bundle、Group、Assignment 与 rollout
- [authority-deployment-zh.md](./authority-deployment-zh.md)
- [enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md)
- [managed-mode-zh.md](./managed-mode-zh.md)
- [https-inspection-runbook-zh.md](./https-inspection-runbook-zh.md) — HTTPS 检查端到端（CA、发布、试点）
