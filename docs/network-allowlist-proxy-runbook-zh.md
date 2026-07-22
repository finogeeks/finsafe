# 网络白名单 + 回环代理（个人 / 本地）

**English:** [network-allowlist-proxy-runbook.md](./network-allowlist-proxy-runbook.md)

端到端冒烟指南：用 FinSAFE **回环出口代理**强制 **域名白名单（allowlist）**。适用于「智能体只能访问这些主机名」，**不需要** HTTPS 检查（MITM）。

| 层级 | 作用 | 许可证 | 本文档 |
|------|------|--------|--------|
| **A — 白名单 + 代理** | 子进程只能连 `127.0.0.1:60080`；代理仅放行名单内 FQDN | 个人 CLI（**免费**） | **当前文档** |
| **B — TLS 终止 / MITM** | 代理解密 HTTPS，做 L7 审计（`tls_terminated`、method/path） | 商业功能 `mitm_tls_terminate` | [https-inspection-runbook-zh.md](./https-inspection-runbook-zh.md) |

**示例策略：** [`examples/wrapper-policies/network-allowlist-proxy.yaml`](../examples/wrapper-policies/network-allowlist-proxy.yaml)

**字段速查：** [POLICY-QUICKREF-zh.md](./POLICY-QUICKREF-zh.md)（`network` allowlist、`start_internal_proxy`）

---

## 运行原理

```text
沙箱内进程
  → 仅允许连 127.0.0.1:60080（本机回环 HTTP 代理）
  → FinSAFE 代理（start_internal_proxy 或 finsafe-net-proxy）
  → 白名单校验（仅 FQDN）
  → 外网（仅允许的主机）
```

在 `network: allowlist` 下，FinSAFE **不会**给子进程普通 host 网络，而是注入指向回环代理的 `HTTP_PROXY` / `HTTPS_PROXY`（及同类别名）。curl、Python `requests`、Node `fetch` 等会在识别这些环境变量时自动走代理。

| 最少策略字段 | 作用 |
|--------------|------|
| `network: !allowlist` + `domains` | 允许的主机名（FQDN；名单中不要写 IP 字面量） |
| `start_internal_proxy: true` | 本次运行由 CLI 在 **`127.0.0.1:60080`** 启动内置代理 |

Layer A **不要**设置 `tls_terminate: true`。那属于商业许可证与检查 CA 路径——见 HTTPS 检查运行手册。

---

## 前置条件

| 项 | 说明 |
|----|------|
| 公开发行的 `finsafe` CLI | [安装](../README-zh.md#安装发行版) — 个人模式，无需 `license.jws` |
| `finsafe probe` / `finsafe doctor` | 确认本机平台就绪 |
| `curl`（或其他 HTTP 客户端） | 用于下列冒烟命令 |
| 可写的 `./workspace` | 示例策略仅授权写入 `./workspace` |

**平台说明（如实范围）：**

| 操作系统 | 白名单 + `start_internal_proxy` |
|----------|----------------------------------|
| **Linux** | 支持（bubblewrap + 回环代理）。主机需能访问名单内域名。 |
| **macOS** | 支持（Seatbelt + 回环代理规则）。 |
| **Windows** | 走 AppContainer + WFP 回环端口范围（`60080–60089`）。先执行一次 `finsafe setup-windows`。试点请用当前发行版；少数客户端若不认代理环境变量，需显式指定代理 URL。 |

---

## 步骤 1 — 最小策略

复制或编辑 [`network-allowlist-proxy.yaml`](../examples/wrapper-policies/network-allowlist-proxy.yaml)。核心片段：

```yaml
network: !allowlist
  domains:
    - example.com
start_internal_proxy: true
```

必须写 **`!allowlist` 标签**（serde YAML 枚举形式）。**不要**写成 `network:` 下再嵌套 `allowlist:` 键——那样会解析失败。

把工作负载必须访问的主机名都写进名单（LLM API、包仓库等）。匹配按 **主机 FQDN**（详见字段速查中的代理 allowlist 规则）。需要的子域名请显式列出，除非当前版本文档写明支持某种后缀形式。

---

## 步骤 2 — 白名单内请求（期望成功）

在包含 `./workspace` 的目录下（没有则创建）：

```bash
mkdir -p workspace

# 若本树是 finogeeks/finsafe 或 Geeksfino/finsafe 公开文档克隆：
POLICY=examples/wrapper-policies/network-allowlist-proxy.yaml
# 或单独下载：
# curl -fsSLO https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/network-allowlist-proxy.yaml
# POLICY=./network-allowlist-proxy.yaml

finsafe --policy "$POLICY" run -- \
  curl -fsS --max-time 15 https://example.com/
```

期望 **退出码 0**，并能看到 `example.com` 的响应内容。

**URL 请用主机名，不要用 IP 字面量：**

| URL | 结果 |
|-----|------|
| `https://example.com/` | 名单含 `example.com` 时放行 |
| `https://93.184.216.34/` | 拒绝（`ip_literal_denied`），即使该 IP 对应 example.com |

可选 JSON 信封：

```bash
finsafe --policy "$POLICY" run --json -- \
  curl -fsS --max-time 15 https://example.com/ \
  | jq '.envelope.inner.exit_code'
```

期望 `0`。

---

## 步骤 3 — 白名单外请求（期望失败）

示例策略**未**包含 `example.org`：

```bash
finsafe --policy "$POLICY" run -- \
  curl -fsS --max-time 15 https://example.org/
# 关注：exit_code=Some(<非零>) 以及 curl 的 HTTP 403
```

期望终止行里子进程 **非零**退出码（`exit_code=Some(…)`，不是 `Some(0)`），且 `curl` 失败（代理常返回 HTTP **403**）。这正是白名单在生效。

使用 `--json` 时可断言内层退出码：

```bash
finsafe --policy "$POLICY" run --json -- \
  curl -fsS --max-time 15 https://example.org/ \
  | jq '.envelope.inner.exit_code'
```

期望非零（例如 curl 报 HTTP 403 时为 `22`）。

---

## 步骤 4 — 代理审计（可选）

设置 `FINSAFE_NET_PROXY_AUDIT_LOG`（任意非空值）后，代理每次决策向 **stderr** 输出一行 JSON，前缀为 `finsafe_net_proxy_audit`：

```bash
export FINSAFE_NET_PROXY_AUDIT_LOG=1

finsafe --policy "$POLICY" run -- \
  curl -fsS --max-time 15 https://example.com/ \
  2>proxy-audit.stderr

grep finsafe_net_proxy_audit proxy-audit.stderr | tail -1
```

拒绝原因包括：

| 原因码 | 含义 |
|--------|------|
| `host_not_in_allowlist` | 主机名不在 `network.allowlist.domains` |
| `ip_literal_denied` | URL 或目标使用了裸 IP |
| `malformed_host` | 主机名校验失败 |

仅调试时：`FINSAFE_NET_PROXY_TRACE=1`（日志很吵，不适合日常试点）。

---

## 故障排查

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| `network: invalid type: map, expected a YAML tag starting with '!'` | 写成了 `network: { allowlist: … }` 嵌套 map | 改为 `network: !allowlist`，其下写 `domains:` |
| `127.0.0.1:60080` 连接被拒绝 | 代理未启动 | 策略设 `start_internal_proxy: true`，或自行运行 `finsafe-net-proxy` 并接线（进阶 / 托管） |
| 端口 60080 已被占用 | 其他代理或残留进程 | 停掉占用进程或释放端口 |
| 名单内主机仍失败 | 拼写错误 / 漏写子域名 / 用了 IP URL | 写精确主机名；不要用 IP 字面量 |
| 名单外主机**成功** | 策略未生效（`network: host`）或策略文件路径错误 | 核对 `--policy` 与 YAML 中的 `network.allowlist` |
| 允许的 HTTPS 报证书错误 | 沙箱未挂载 CA 路径 | 授权 `/etc/ssl`（Linux）或平台 CA 路径；示例策略已含常见根路径 |
| Windows：客户端不走代理 | 该工具不认代理环境变量 | 使用遵守 `HTTP(S)_PROXY` 的客户端，或显式指定（`curl -x http://127.0.0.1:60080`） |
| 与 MITM / `tls_terminate` 混淆 | 读到了 B 层文档 | 仅白名单**不需要** `FINSAFE_LICENSE_MITM` 或检查 CA |

---

## 托管舰队

已签名 bundle 使用相同 YAML 字段。桌面端启动时仍需代理（通常 `start_internal_proxy: true`）。发布与下发见 [managed-mode-zh.md](./managed-mode-zh.md)、[enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md)。

B 层（在代理处解密 HTTPS）仍为可选商业能力 — [https-inspection-runbook-zh.md](./https-inspection-runbook-zh.md)。

---

## 相关文档

| 文档 | 作用 |
|------|------|
| [POLICY-QUICKREF-zh.md](./POLICY-QUICKREF-zh.md) | 字段定义与审计环境变量 |
| [USER-GUIDE-zh.md](./USER-GUIDE-zh.md) | `run` / `self-confine` 基础 |
| [FAQ-zh.md](./FAQ-zh.md) § C5 | 产品哲学 |
| [terminology-glossary-zh.md](./terminology-glossary-zh.md) | `finsafe-net-proxy`、回环代理、`proxy_egress` |
| [https-inspection-runbook-zh.md](./https-inspection-runbook-zh.md) | B 层：TLS 终止 / MITM |
