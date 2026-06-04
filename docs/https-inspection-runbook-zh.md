# HTTPS 检查运行手册（托管舰队）

**English:** [https-inspection-runbook.md](./https-inspection-runbook.md)

面向企业运维的端到端指南：在 FinSAFE **出口代理**上启用 **TLS 终止**（HTTPS 检查 / MITM），在沙箱出口路径内解密 HTTPS，以支持域名 allowlist、L7 决策及更丰富的 `proxy_egress` 审计（`tls_terminated`、method、path）。

**相关文档：** [authority-deployment-zh.md](./authority-deployment-zh.md#tls-检查mitm)、[POLICY-QUICKREF-zh.md](./POLICY-QUICKREF-zh.md)、[enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md)。

**示例策略：** [`examples/wrapper-policies/enterprise-https-inspection.yaml`](../examples/wrapper-policies/enterprise-https-inspection.yaml)

---

## 前置条件

| 项 | 说明 |
|----|------|
| 托管模式 | Policy Authority + 已注册 `finsafe-agent` — [managed-mode-zh.md](./managed-mode-zh.md) |
| 商业 `license.jws` | 须含 **`mitm_tls_terminate`**（Finogeeks 默认许可证集**不包含**，需采购） |
| Authority 已运行 | [authority-deployment-zh.md](./authority-deployment-zh.md) |
| 运维权限 | Admin UI **设置 → 常规** 中的 `X-Admin-Token` |
| `finsafe-bundlectl` | 运维工作站 — [finsafe-bundlectl SKILL](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-bundlectl/SKILL-zh.md) |

**合规：**须告知用户，沙箱内程序的 HTTPS 可能被解密用于策略执行与审计。纳入可接受使用政策 / 安全告知。

**平台说明：**

| 操作系统 | 托管 HTTPS 检查 |
|----------|-----------------|
| **Linux** | 支持（bubblewrap + 回环代理 / `finsafe-net-proxy`）。 |
| **macOS** | 支持（`network: allowlist` + `start_internal_proxy` + Seatbelt 回环规则）。 |
| **Windows** | 主机沙箱 + 回环代理路径可用；全舰队推广前请用目标构建做小范围试点。 |

---

## 步骤 1 — 确认许可证

```bash
export AUTHORITY=https://gov.example.com/policy-authority
curl -sf "$AUTHORITY/v1/license/status" | jq .
```

`status` 为 `valid` 或 `grace`，且 `features` 含 **`mitm_tls_terminate`**。否则 MITM 管理接口与发布 `tls_terminate: true` 的策略将返回 **`402`**（`LICENSE_FEATURE_DENIED`）。

---

## 步骤 2 — 生成 Authority 检查 CA

每个 Authority 环境执行一次（轮换 CA 需重新发布 bundle 并更新信任）。

```bash
export TOKEN="<管理员令牌>"

# 创建 CA（若已存在可先 GET 确认）
curl -sf -X POST "$AUTHORITY/v1/admin/mitm/ca" \
  -H "X-Admin-Token: $TOKEN" | jq .

# 校验已存储的公钥证书
curl -sf "$AUTHORITY/v1/admin/mitm/ca" \
  -H "X-Admin-Token: $TOKEN" | jq -r '.cert_pem' | openssl x509 -noout -subject -dates
```

**诊断（无需管理员令牌）：**

```bash
curl -sf "$AUTHORITY/v1/mitm/ca/cert" | jq -r '.cert_pem' | head -5
```

步骤 2 完成前返回 **`404`**；许可证无 `mitm_tls_terminate` 时返回 **`402`**。

---

## 步骤 3 — 构建并发布启用检查的 bundle

策略须包含：

- `network.allowlist.domains`
- `tls_terminate: true`
- `start_internal_proxy: true`（回环代理 **`127.0.0.1:60080`**）

可参考 [enterprise-https-inspection.yaml](../examples/wrapper-policies/enterprise-https-inspection.yaml)。

```bash
export FINSAFE_AUTHORITY_PUBLIC_URL="$AUTHORITY"
export FINSAFE_ORG_DOMAIN=example.com
export FINSAFE_AUTHORITY_SIGNING_KEY=/secure/authority/signing_key.bin

finsafe-bundlectl bundle build \
  --from docs/public-finsafe/examples/wrapper-policies/enterprise-https-inspection.yaml \
  --out /secure/bundles/inspection-draft.json

finsafe-bundlectl bundle sign --in /secure/bundles/inspection-draft.json \
  --out /secure/bundles/inspection-v1.jws

finsafe-bundlectl bundle publish --in /secure/bundles/inspection-v1.jws \
  --authority "$FINSAFE_AUTHORITY_PUBLIC_URL"
```

| 失败 | 原因 |
|------|------|
| `402` | 许可证无 `mitm_tls_terminate` |
| 提示需 MITM CA | 未执行步骤 2 |

发布后 bundle 含 **`inspection_ca_cert_pem`**。通过 Admin UI **Assignments** 或既有流程下发 — [sandbox-management-model-zh.md](./sandbox-management-model-zh.md)。

---

## 步骤 4 — 桌面端下发

除常规托管模式安装（`finsafe`、`finsafe-agent`、sentinel、authority URL）外，无需单独 MDM 载荷。发布后：

1. Agent 在心跳 / 策略刷新时拉取新 bundle。
2. Agent 安装检查 CA，并向沙箱子进程注入信任库环境变量（`SSL_CERT_FILE`、`CURL_CA_BUNDLE`、`NODE_EXTRA_CA_CERTS` 等）。
3. 托管 `finsafe run` / `self-confine` 在策略要求时应用 `tls_terminate` 并启动内置代理。

打包与注册见 [enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md) 阶段 B–D。

---

## 步骤 5 — 试点验证

### 5.1 托管冒烟

```bash
# 已注册设备 — 策略仅来自 agent
finsafe run --json -- /usr/bin/curl -fsS https://example.com/ | jq '.envelope.policy_source, .envelope.inner.exit_code'
```

期望 `policy_source` 为 **`managed`**，退出码 **`0`**（`example.com` 在 allowlist 内）。

**注意：** URL 使用**主机名**（`https://example.com/`），勿用 IP 字面量（`https://127.0.0.1/…`）；回环代理会返回 `ip_literal_denied`。

### 5.2 审计：TLS 已终止

试点机可启用代理审计：

```bash
export FINSAFE_NET_PROXY_AUDIT_LOG=/tmp/finsafe-proxy-audit.jsonl
```

执行托管 HTTPS 请求后：

```bash
grep '"tls_terminated":true' /tmp/finsafe-proxy-audit.jsonl | tail -1 | jq .
```

已终止 TLS 的流量为 **`proxy_egress` schema 版本 `3`**（可见 method/path）；不透明 CONNECT 隧道仍为 **2**。

### 5.3 Authority 侧检查

| 检查项 | 命令 |
|--------|------|
| 当前 bundle | `curl -sf "$AUTHORITY/v1/bundles/current" \| jq '.bundle_id, .version'` |
| 公开 CA | `curl -sf "$AUTHORITY/v1/mitm/ca/cert" \| jq -r '.cert_pem' \| openssl x509 -noout -subject` |
| 舰队审计 | Admin UI **审计** / **运行** — 试点后的出口事件 |

---

## 本机实验环境

[`scripts/managed-lab.sh`](../scripts/managed-lab.sh) + [managed-lab-zh.md](./testing/managed-lab-zh.md) 在 `~/.finsafe-lab` 下启动 Authority + agent。步骤 1–3 仍需要带 **`mitm_tls_terminate`** 的 Finogeeks `license.jws`。

**仅代理、无商业许可证的单机开发：**

```bash
export FINSAFE_LICENSE_MITM=1
# 可选稳定 CA（配合 start_internal_proxy）：
# export FINSAFE_MITM_CA_CERT_PATH=/path/to/ca.pem
# export FINSAFE_MITM_CA_KEY_PATH=/path/to/ca.key
```

curl/openssl 探测可设 `FINSAFE_MITM_FORCE_TERMINATE=1`。详见 [POLICY-QUICKREF-zh.md](./POLICY-QUICKREF-zh.md) — **TLS 检查（MITM）运维说明**。

---

## 故障排查

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| `POST /v1/admin/mitm/ca` 或发布返回 `402` | 许可证无 `mitm_tls_terminate` | 联系 Finogeeks；重装 `license.jws`；重启 authority。 |
| 发布提示需要 authority MITM CA | 未执行步骤 2 | `POST /v1/admin/mitm/ca` 后重试发布。 |
| 沙箱内 TLS 错误（`certificate verify failed`） | 设备未拉取含 `inspection_ca_cert_pem` 的 bundle | 确认设备 bundle 版本；重启 agent；检查托管缓存目录。 |
| 审计中 `ip_literal_denied` | URL 使用 IP 而非主机名 | 使用 `https://example.com/`，勿用 `https://93.184.216.34/`。 |
| `127.0.0.1:60080` 连接被拒绝 | `start_internal_proxy: false` 或未启动代理 | 策略设 `start_internal_proxy: true`，或按 [POLICY-QUICKREF-zh.md](./POLICY-QUICKREF-zh.md) 单独运行 `finsafe-net-proxy`。 |
| macOS：有代理仍被拦截出站 | Seatbelt 未放行回环 | 使用当前舰队 `finsafe`，`network: allowlist` + 内置代理。 |
| 审计无 `tls_terminated` | `tls_terminate: false` 或非托管策略 | 确认 YAML；托管运行需已发布 bundle + agent 安装 CA。 |

---

## CA 轮换（进阶）

1. 生成新 CA（`POST /v1/admin/mitm/ca` — 确认产品对覆盖行为；安排维护窗口）。
2. 发布带 `tls_terminate: true` 的**新 bundle 版本**。
3. 下发 bundle；agent 刷新 `inspection_ca_cert_pem`。
4. 对 FinSAFE 托管范围外仍信任旧检查 CA 的工具，需另行更新信任。

生产环境轮换 CA 前请与 Finogeeks 支持协调。
