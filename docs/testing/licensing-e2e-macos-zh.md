# 许可证 E2E — macOS 开发者指南

**English:** [licensing-e2e-macos.md](./licensing-e2e-macos.md)

本文说明如何在 macOS 上通过脚本验证 Policy Authority 的**商业许可证门禁**，以及一条最小的**托管注册 + 运行**路径。验证许可证**不需要 Docker**；仅在需要 Landlock 或 Linux 专用 harness 时再使用 OrbStack / Linux。

相关文档：

- [authority-deployment-zh.md](../authority-deployment-zh.md) — 生产环境安装 `license.jws`
- [managed-mode-matrix-zh.md](./managed-mode-matrix-zh.md) — 完整托管验收矩阵
- [managed-mode-macos-runbook.md](./managed-mode-macos-runbook.md) — Mac 上手动舰队步骤

脚本位于 FinSAFE 源码仓库：[`scripts/managed-mode/`](../../../../scripts/managed-mode/)。

---

## 测试分层（推荐顺序）

| 层级 | 验证内容 | 命令 |
|------|----------|------|
| **0 — 单元** | JWS 校验、过期、宽限期、特性、席位计数 | `cargo test -p finsafe-license -p finsafe-authority` |
| **1 — HTTP 门禁** | 无许可证 `402`；有许可证 `200`；席位上限 | `./scripts/managed-mode/license-suite.sh …` |
| **2 — macOS 完整 E2E** | 构建、加载开发用 `license.jws`、双 authority、托管运行 | `./scripts/managed-mode/e2e-licensing-macos.sh` |
| **3 — Linux 对齐** | Landlock、`run-suite.sh`、`tamper-suite.sh` | OrbStack 虚拟机或 CI；见 [managed-mode-matrix-zh.md](./managed-mode-matrix-zh.md) |
| **4 — 试点** | 双机、真实 MDM、生产 JWKS | [enterprise-deployment-runbook-zh.md](../enterprise-deployment-runbook-zh.md) |

在已安装 Rust 的 Mac 上，**层级 2** 是合并 PR 前的默认门禁。

---

## 前置条件

- **macOS**（Apple Silicon 或 Intel），已安装 Xcode 命令行工具或 Rust（`cargo`）。
- `PATH` 中有 **`curl`** 与 **`jq`**。
- 已检出 FinSAFE 源码（下文命令均在仓库根目录执行）。

自动化 E2E **不需要** PostgreSQL、Docker 或 root。

---

## 一键完整 E2E

在仓库根目录：

```bash
./scripts/managed-mode/e2e-licensing-macos.sh
```

脚本将：

1. 构建企业版二进制（`finsafe`、`finsafe-agent`、`finsafe-authority-http`、`finsafe-bundlectl`）。
2. 为 E2E authority 准备**开发用** `license.jws`（`max_devices=2`，约 1 年有效期；不可用于生产）。
3. 在 `127.0.0.1:8091` 启动**无许可证** authority → 执行 `license-suite.sh missing`。
4. 在 `127.0.0.1:8090` 启动**有许可证** authority → 执行 `licensed` 与 `seat-limit`。
5. 用**全新数据库**重启有许可证的 authority，发布 smoke bundle，在隔离状态目录中注册 agent，执行 `finsafe run --json -- /usr/bin/true`。
6. 运行 `cargo test -p finsafe-license -p finsafe-authority`。

成功结束时输出：

```text
OK: licensing E2E complete (state kept at …)
```

退出码 **0**。

---

## 分段运行（authority 已启动）

将 `FINSAFE_AUTHORITY_URL` 指向正在运行的 `finsafe-authority-http`：

```bash
export FINSAFE_AUTHORITY_URL=http://127.0.0.1:8090

# 未加载许可证文件时，管理/注册接口应返回 402 + LICENSE_MISSING
./scripts/managed-mode/license-suite.sh missing

# 许可证有效时，状态为 valid/grace，管理与注册 token 为 200
./scripts/managed-mode/license-suite.sh licensed

# 占满 max_devices 后，再次注册应 402 + LICENSE_SEAT_LIMIT
./scripts/managed-mode/license-suite.sh seat-limit
```

`license-suite.sh` 将响应体写入 `/tmp/finsafe-license-suite-body.json`。

---

## 各检查项说明

### `missing`

| 端点 | 预期 |
|------|------|
| `GET /health` | `200` |
| `GET /v1/license/status` | `200`（报告缺失/无效） |
| `GET /v1/admin/devices` | `402`，JSON `code`：`LICENSE_MISSING` |
| `POST /v1/enroll/token` | `402`，JSON `code`：`LICENSE_MISSING` |

### `licensed`

| 检查 | 预期 |
|------|------|
| `GET /v1/license/status` | `status` 为 `valid` 或 `grace` |
| `GET /v1/admin/devices` | `200` |
| `POST /v1/enroll/token` | `200` |

### `seat-limit`

通过 `POST /v1/enroll` 注册 `max_devices` 个不同的 `device_id`，再注册一个应得到 **`402`** 且 `LICENSE_SEAT_LIMIT`。

要求许可证载荷包含 `max_devices`（E2E 脚本签发的为 `max_devices=2`）。

### 托管段（`e2e-licensing-macos.sh` 内）

席位测试后会重启有许可证的 authority 并清空数据库，然后：

1. `finsafe-bundlectl bundle build/sign/publish`（smoke 包装策略）。
2. 在临时目录下以 `FINSAFE_MANAGED_STATE_DIR` 启动 `finsafe-agent`。
3. 等待 `enrolled.json` 出现。
4. 断言 `finsafe run --json` 中 `exit_code == 0` 或 `envelope.policy_source == "managed"`。

若未发布 bundle，托管运行会失败：`MANAGED_DAEMON_UNREACHABLE: no active bundle`。

---

## 环境变量

| 变量 | 默认值 | 用途 |
|------|--------|------|
| `FINSAFE_E2E_BIND_UNLICENSED` | `127.0.0.1:8091` | 无许可证 authority 监听地址 |
| `FINSAFE_E2E_BIND_LICENSED` | `127.0.0.1:8090` | 有许可证 authority 监听地址 |
| `FINSAFE_E2E_MANAGED` | `1` | 设为 `0` 可跳过托管注册/运行 |
| `FINSAFE_E2E_DIR` | _(临时目录)_ | 状态目录；运行结束时会打印路径 |
| `FINSAFE_E2E_DIR_REUSE` | _(未设置)_ | 与 `FINSAFE_E2E_DIR` 一起使用时复用目录 |
| `FINSAFE_AUTHORITY_URL` | _(由脚本设置)_ | `license-suite.sh` 的目标 URL |
| `FINSAFE_LICENSE_PATH` | 生产默认 `/etc/finsafe/license.jws` | authority 读取的 JWS 路径 |

生产环境使用 Finogeeks 签发的 `license.jws` 与内置校验公钥，见 [authority-deployment-zh.md](../authority-deployment-zh.md)。完整 E2E 脚本会自行生成开发用许可证文件；勿将该文件用于生产。

---

## 故障排查

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| `authority did not become healthy` | 端口占用或启动崩溃 | 查看 `FINSAFE_E2E_DIR` 下 `authority-*.log`；更换绑定端口 |
| `admin-devices code=`（非 `LICENSE_MISSING`） | 「无许可证」实例仍加载了旧许可证 | E2E 使用不存在的 `no-license.jws`；确认 `FINSAFE_LICENSE_PATH` |
| `seat-limit: license has no max_devices` | 许可证未设置席位上限 | 使用包含 `max_devices` 的 `license.jws`（E2E 脚本为 `max_devices=2`） |
| `MANAGED_DAEMON_UNREACHABLE: no active bundle` | 未发布 bundle | 在 agent 前执行 bundlectl publish（完整 E2E 已包含） |
| `enrolled.json missing` | agent 无法连接 authority 或 token 无效 | 查看 `$E2E_DIR/desktop/agent.log` |
| `managed run: unexpected output` | agent 已退出或策略拒绝 | 设置 `FINSAFE_E2E_DIR_REUSE=1` 与相同 `FINSAFE_E2E_DIR` 后重跑 |

复用上次运行状态：

```bash
export FINSAFE_E2E_DIR=/path/printed/at/end
export FINSAFE_E2E_DIR_REUSE=1
./scripts/managed-mode/e2e-licensing-macos.sh
```

---

## CI 与本地 Rust 门禁

修改许可证或 authority 相关代码后，合并 PR 前建议：

```bash
cargo fmt --all -- --check
cargo clippy -p finsafe-license -p finsafe-authority -- -D warnings
cargo test -p finsafe-license -p finsafe-authority
./scripts/managed-mode/e2e-licensing-macos.sh
```

---

## 与验收矩阵的对应关系

| 矩阵关注点 | 覆盖方式 |
|------------|----------|
| 无许可证时阻止管理/注册 | `license-suite.sh missing` |
| 有效许可证解锁舰队 API | `license-suite.sh licensed` |
| 席位 enforcement | `license-suite.sh seat-limit` |
| 注册 + 托管运行 | `e2e-licensing-macos.sh`（托管段） |
| 篡改、kill switch、轮换等 | [managed-mode-matrix-zh.md](./managed-mode-matrix-zh.md)（其他脚本） |

新增许可证 `code` 或受保护路由时，请同步更新矩阵中的对应行。
