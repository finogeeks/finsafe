# FinSAFE 二进制参考（管理员）

**English:** [binary-reference.md](./binary-reference.md)

本文列出 FinSAFE 部署中**面向运维的二进制**、各自所在的发行包，以及需要安装的主机类型。请结合 [authority-deployment-zh.md](./authority-deployment-zh.md)（Policy Authority 与许可证）和 [enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md)（舰队分阶段上线）使用。

---

## 套件总览

```text
  运维 / 服务器端                           托管桌面（每台）
  ───────────────                           ────────────────
  finsafe-authority-http  ◄──HTTPS──►       finsafe-agent
  finsafe-bundlectl（运维机）                 finsafe  ◄──UDS──► agent
  license.jws（文件，非二进制）               managed-required.json（JWS）
                                            enrolled.json（agent 写入）

  仅 Linux 桌面（与 finsafe 同目录）：
    finsafe-helper、finsafe-supervisor、finsafe-landlock-shim
```

| 角色 | 二进制 | 典型主机 |
|------|--------|----------|
| **Policy Authority** | `finsafe-authority-http` | Linux 服务器或 macOS 开发机（`finsafe-admin-server-v*`） |
| **策略签名 / 发布** | `finsafe-bundlectl` | 安全运维工作站（`finsafe-bundlectl-v*`，Linux + macOS） |
| **商业许可证** | `license.jws`（JWS 文件） | Authority 服务器 `/etc/finsafe/` |
| **托管桌面** | `finsafe`、`finsafe-agent` | 每台已注册终端 |
| **Linux 隔离辅助** | `finsafe-helper`、`finsafe-supervisor`、`finsafe-landlock-shim` | 与 `finsafe` 同机的 Linux 桌面（固定路径） |

---

## 发行包（IT 下载内容）

公开 [GitHub Releases](https://github.com/finogeeks/finsafe/releases) 在同一版本标签下提供**四类**发行包。安装前请校验 **`SHA256SUMS`**。**`install.sh`** 仅下载个人模式 **`finsafe-v*`** 包。

| 发行包 | 平台 | 内容 |
|--------|------|------|
| **`finsafe-v<version>-<target>.tar.zst`** | Linux x86_64、macOS Intel、macOS Apple Silicon | 个人模式 `finsafe`（Linux 含配套二进制）；见下方平台表 |
| **`finsafe-fleet-v<version>-<target>.tar.zst`** | 同上三个 target | 托管 `finsafe` + `finsafe-agent`（Linux 另含三个配套二进制） |
| **`finsafe-admin-server-v<version>-<target>.tar.zst`** | Linux x86_64、macOS Intel、macOS Apple Silicon | 仅 `finsafe-authority-http` |
| **`finsafe-bundlectl-v<version>-<target>.tar.zst`** | 同上三个 target | 仅 `finsafe-bundlectl`（运维工作站） |

**不会出现在任何公开发布包中：**

| 名称 | 原因 |
|------|------|
| `license.jws` | 商业授权文件；由 Finogeeks 签发（运营托管 authority API 所必需） |

CI 按发行包族校验：个人 **`finsafe-v*`** 不得含 agent/authority；**`finsafe-fleet-v*`** 须含 `finsafe` 与 `finsafe-agent`；**`finsafe-admin-server-v*`** 仅含 `finsafe-authority-http`；**`finsafe-bundlectl-v*`** 仅含 `finsafe-bundlectl`。

---

## 平台对照（桌面 CLI 发行包）

| 二进制 | Linux x86_64 | macOS（Intel / ARM） | 用途 |
|--------|:------------:|:--------------------:|------|
| **`finsafe`** | ✓ | ✓ | 用户与应用调用的 CLI：`run`、`self-confine`、`probe`、`doctor`；托管时经 agent 解析策略 |
| **`finsafe-agent`** | ✓（舰队） | ✓（舰队） | 后台守护：注册、拉取 bundle、UDS 策略服务、心跳、审计 spool — **`finsafe-fleet-v*` 发行包** |
| **`finsafe-helper`** | ✓ | — | 特权辅助进程（Linux bubblewrap 路径下的 cgroup/overlay） |
| **`finsafe-supervisor`** | ✓ | — | cgroup 限制 attach-before-exec（优于 shell 包装） |
| **`finsafe-landlock-shim`** | ✓ | — | 在沙箱内应用 Landlock 后再 exec 负载 |
| **`finsafe-authority-http`** | ✓（`finsafe-admin-server-v*`） | ✓（`finsafe-admin-server-v*`） | 中央 Policy Authority HTTP 服务 |
| **`finsafe-bundlectl`** | ✓（`finsafe-bundlectl-v*`） | ✓（`finsafe-bundlectl-v*`） | 构建 / 签名 / 发布 bundle 与 managed-required 哨兵 |

**macOS 说明：** Mac 托管模式在 `finsafe` 内使用 **Seatbelt**（`sandbox-exec`），无 `finsafe-landlock-shim`。Linux 托管桌面需将 **四个** 面向用户的二进制（`finsafe` + 三个 companion）放在**同一路径**（建议 `/usr/local/bin/`），以便自动发现与心跳摘要一致。

---

## 逐二进制说明

### `finsafe`

- **对象：** 终端用户、Agent 运行时、调用 `finsafe run -- …` 的脚本
- **路径：** `/usr/local/bin/finsafe`（生产）；舰队机器勿用 `~/bin`
- **模式：** 无哨兵/未注册时可 `--policy`；存在哨兵或 `enrolled.json` 时为托管模式
- **发行包：** 公开 `finsafe-v*`（全平台）

### `finsafe-agent`

- **对象：** IT 通过系统服务部署于托管桌面
- **路径：** `/usr/local/bin/finsafe-agent` + systemd/LaunchDaemon（见 [packaging/](../packaging/)）
- **关键环境变量：** `FINSAFE_AUTHORITY_URL`、`FINSAFE_ENROLL_TOKEN`（一次性）、`FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID`
- **写入：** `/etc/finsafe/enrolled.json`、`/var/lib/finsafe/cache/`、`/var/lib/finsafe/audit/`、`/run/finsafe-agent.sock`
- **发行包：** `finsafe-fleet-v*`（各桌面平台）

### `finsafe-authority-http`

- **对象：** 中央 IT / 平台团队
- **路径：** Authority 主机 `/usr/local/bin/finsafe-authority-http`
- **依赖：** `FINSAFE_LICENSE_PATH` 处有效的 `license.jws`，否则管理/注册/bundle/审计 API 返回 402
- **数据：** `FINSAFE_AUTHORITY_DB`、`FINSAFE_AUTHORITY_SIGNING_KEY`、`FINSAFE_AUTHORITY_PUBLIC_URL`
- **发行包：** `finsafe-admin-server-v*`（生产环境 Linux x86_64；macOS 用于本地开发 / 试点）

### `finsafe-bundlectl`

- **对象：** 安全 / 平台运维（非终端用户）
- **命令：** `bundle build|sign|publish`、`sentinel sign`
- **运行位置：** 可访问 authority 签名密钥的锁定运维机（Mac 或 Linux）
- **发行包：** `finsafe-bundlectl-v*`（Linux x86_64、macOS Intel、macOS Apple Silicon）
- **Agent 技能（自包含）：** https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-bundlectl/SKILL-zh.md

### `finsafe-helper`（仅 Linux）

- **对象：** 由 `finsafe` 调用，执行特权 cgroup/overlay 步骤
- **安装：** 与 `finsafe` 同目录（兄弟进程自动发现）
- **发行包：** 公开 Linux `finsafe-v*` 包内

### `finsafe-supervisor`（仅 Linux）

- **对象：** `finsafe-bwrap` 启动路径中用于 cgroup attach-before-exec
- **安装：** Linux 舰队主机上作为 `finsafe` 的兄弟二进制
- **发行包：** 公开 Linux `finsafe-v*` 包内

### `finsafe-landlock-shim`（仅 Linux）

- **对象：** 策略使用 Landlock `path` 模式时在 bubblewrap 沙箱内运行
- **安装：** Linux 舰队主机上作为 `finsafe` 的兄弟二进制
- **发行包：** 公开 Linux `finsafe-v*` 包内

---

## 不随舰队交付的工作区二进制

以下存在于 FinSAFE 源码树，供适配器、测试或未来平台 API 使用。**托管模式上线无需安装：**

| 二进制 / crate | 角色 |
|----------------|------|
| `finsafe-server-http` | 独立平台层 HTTP API（非 Policy Authority） |
| 库 crate（`finsafe-bwrap`、`finsafe-bundle` 等） | 链接进上述二进制 |

---

## 推荐目录布局

### Authority 服务器（Linux）

```text
/usr/local/bin/finsafe-authority-http
/etc/finsafe/license.jws
/var/lib/finsafe-authority/authority.db
/var/lib/finsafe-authority/signing_key.bin
```

### 托管 Linux 桌面

```text
/usr/local/bin/finsafe
/usr/local/bin/finsafe-agent
/usr/local/bin/finsafe-helper
/usr/local/bin/finsafe-supervisor
/usr/local/bin/finsafe-landlock-shim
/etc/finsafe/managed-required.json
/etc/finsafe/enrolled.json                 # 注册后
```

### 托管 macOS 桌面

```text
/usr/local/bin/finsafe
/usr/local/bin/finsafe-agent
/etc/finsafe/managed-required.json
/etc/finsafe/enrolled.json
```

---

## 管理员部署顺序

1. **安装 authority 二进制与 `license.jws`** → [authority-deployment-zh.md](./authority-deployment-zh.md) §2–4  
2. **验证许可证与 API** → 下文与 authority 文档 §5  
3. **用 `finsafe-bundlectl` 发布初始 bundle** → authority 文档 §6  
4. **签发 managed-required 哨兵** → 手册 Phase A.3  
5. **打包桌面：** `finsafe` + `finsafe-agent`（Linux 另加三个 companion）→ 手册 Phase B  
6. **下发哨兵、注册 agent、测试** `finsafe run` → 手册 Phase C–D  
7. **脚本冒烟（开发/CI）：** [licensing-e2e-macos-zh.md](./testing/licensing-e2e-macos-zh.md)

---

## 验证托管模式已生效（生产检查清单）

在 **试点机** 完成 Phase A–D 后执行。

### Authority（已安装许可证）

```bash
AUTHORITY=https://gov.example.com/policy-authority

curl -sf "$AUTHORITY/health"
curl -sf "$AUTHORITY/v1/license/status" | jq .    # 期望 status 为 valid 或 grace
curl -sf "$AUTHORITY/.well-known/finsafe/jwks.json" | jq .
curl -sf "$AUTHORITY/v1/bundles/current" | jq .   # 发布后 200；首次发布前 404 可接受
curl -sf -X POST "$AUTHORITY/v1/enroll/token" | jq .  # 有许可证时为 200
```

无有效许可证时，受保护接口返回 **HTTP 402**，`code` 如 `LICENSE_MISSING`（见 [admin-ui-zh.md](./admin-ui-zh.md)）。

### 试点桌面

```bash
test -f /etc/finsafe/managed-required.json && echo sentinel-ok
test -f /etc/finsafe/enrolled.json && jq .authority_url /etc/finsafe/enrolled.json
test -S /run/finsafe-agent.sock && echo agent-socket-ok   # Linux 默认；macOS 路径见 managed-mode-zh.md
finsafe run --json -- /usr/bin/true | jq '{exit_code, policy_source: .envelope.policy_source}'
```

**成功标志：**

- `exit_code` 为 `0`（或策略有意拒绝该命令）
- 启用 JSON 审计时 `envelope.policy_source` 为 `"managed"`
- 存在哨兵时 `finsafe run --personal -- /usr/bin/true` 应报 `MANAGED_FORCED_BY_POLICY`

### 舰队验收

完整矩阵：[managed-mode-matrix-zh.md](./testing/managed-mode-matrix-zh.md)。macOS 许可证脚本：[licensing-e2e-macos-zh.md](./testing/licensing-e2e-macos-zh.md)。

---

## 相关文档

| 文档 | 主题 |
|------|------|
| [authority-deployment-zh.md](./authority-deployment-zh.md) | Authority 安装、许可证、环境变量、bundlectl |
| [enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md) | 分阶段舰队上线 |
| [managed-mode-zh.md](./managed-mode-zh.md) | 架构、路径、CLI 错误 |
| [admin-ui-zh.md](./admin-ui-zh.md) | 管理台与许可证 402 提示 |
| [mdm/vendor-neutral-checklist-zh.md](./mdm/vendor-neutral-checklist-zh.md) | MDM 载荷检查清单 |
