# 托管模式本地实验环境（Lab）

**English:** [managed-lab.md](./managed-lab.md)

使用 **`scripts/managed-lab.sh`** 在**单台机器**上拉起完整托管栈：Policy Authority、已注册的 `finsafe-agent`，以及供 `finsafe run` / `finsafe self-confine` 使用的 shell 环境文件。使用 **PATH 上的发行版二进制**，状态保存在 **`~/.finsafe-lab`**，便于在不改动生产 fleet 路径的情况下验证托管模式。

**适用对象：** 从 [GitHub Releases](https://github.com/finogeeks/finsafe/releases) 安装套件后，需要在本机快速验证 Authority + 桌面 agent + CLI 的 IT 管理员与安全工程师。

**平台：** 仅 macOS 与 Linux（不支持 Windows）。

---

## 包含内容

| 组件 | 作用 |
|------|------|
| `finsafe-authority-http` | 本机 Policy Authority，默认 `127.0.0.1:8095` |
| `finsafe-agent` | 已注册 agent，状态在 `~/.finsafe-lab/desktop/` |
| `lab.env` | 导出 `FINSAFE_AUTHORITY_URL`、agent socket、许可证路径、签名密钥等 |
| 管理 UI | [http://127.0.0.1:8095/admin](http://127.0.0.1:8095/admin) |

实验环境**不使用**生产路径（`/etc/finsafe`、`/var/lib/finsafe`）。状态集中在 **`~/.finsafe-lab`**，便于试点结束后整目录删除。

---

## 前置条件

1. **PATH 上的二进制**（或通过 `FINSAFE_*_BIN` 指定路径）：

   | 发行包 | 二进制 |
   |--------|--------|
   | `finsafe-admin-server-v*` | `finsafe-authority-http` |
   | `finsafe-fleet-v*` | `finsafe`、`finsafe-agent` |
   | `finsafe-bundlectl-v*` | `finsafe-bundlectl` |

   安装说明见 [binary-reference-zh.md](../binary-reference-zh.md)、[install-fleet.sh](../../install-fleet.sh)。

2. **`jq`**、**`curl`**。

3. **Finogeeks 签发的 `license.jws`** — 注册与 bundle API 必需。见 [authority-deployment-zh.md](../authority-deployment-zh.md#21-commercial-license-managed-mode)。

4. **Python 3**（仅用标准库）— 探测 agent Unix socket。

---

## 快速开始

在 [finogeeks/finsafe](https://github.com/finogeeks/finsafe) 克隆目录中（或已复制 `scripts/managed-lab.sh` 与 `examples/` 的任意目录）：

```bash
export FINSAFE_LICENSE_PATH=/path/to/license.jws

./scripts/managed-lab.sh start
source "$(./scripts/managed-lab.sh env)"

./scripts/managed-lab.sh run -- /usr/bin/true
./scripts/managed-lab.sh run --json -- /usr/bin/true | jq '.envelope.policy_source, .envelope.inner.exit_code'
```

结束实验（保留状态供下次使用）：

```bash
./scripts/managed-lab.sh stop
```

---

## 子命令

| 命令 | 说明 |
|------|------|
| `start [--policy PATH]` | 启动 Authority、发布 bundle、注册 agent、生成 `lab.env` |
| `stop` | 停止 agent 与 Authority |
| `status` | PID、健康检查、注册状态、日志路径 |
| `env` | 输出 `lab.env` 路径供 `source` |
| `publish --from PATH` | 构建/签名/发布新 bundle |
| `restart-agent` | 发布后重启 agent（比等心跳更快） |
| `run [--json] -- <程序> [参数…]` | 托管短任务 `run` |
| `interactive [--json] -- <程序> [参数…]` | 托管交互式 `self-confine` |

**环境变量：**

| 变量 | 默认 |
|------|------|
| `FINSAFE_LICENSE_PATH` | `start` 前**必填** |
| `FINSAFE_LAB_DIR` | `~/.finsafe-lab` |
| `FINSAFE_LAB_BIND` | `127.0.0.1:8095` |
| `FINSAFE_LAB_DEVICE_ID` | `lab-desktop-1` |
| `FINSAFE_LAB_POLICY` | `examples/wrapper-policies/managed-lab-smoke.yaml` |

---

## 策略迭代

1. 在 `examples/wrapper-policies/` 选择或编辑 wrapper YAML。
2. 发布：

   ```bash
   ./scripts/managed-lab.sh publish --from examples/wrapper-policies/hermes-version-smoke.yaml
   ```

3. 等待 agent 拉取（心跳约 60 秒）或执行：

   ```bash
   ./scripts/managed-lab.sh restart-agent
   ```

4. 再次运行并对比 digest：

   ```bash
   ./scripts/managed-lab.sh run --json -- /usr/bin/true | jq '.envelope | {bundle_digest, wrapper_policy_digest}'
   ```

默认 **`managed-lab-smoke.yaml`** 仅允许 `/usr/bin/true` 等最小 FHS 路径，**不包含** Homebrew、`~/.local/bin`、`~/.hermes`。

---

## macOS 上运行 Hermes

托管 `run` 在 macOS 上会通过 Seatbelt **清空子进程环境**。Hermes 需通过 `/usr/bin/env` 显式传入 **`HOME`/`PATH`**，且 bundle 中声明相应路径。

1. 发布 `hermes-version-smoke.yaml`（见文件头部注释）。
2. `restart-agent`（或等待约 60 秒）。
3. 执行：

   ```bash
   ./scripts/managed-lab.sh run -- \
     /usr/bin/env HOME="$HOME" \
     PATH="/opt/homebrew/bin:$HOME/.local/bin:/usr/bin:/bin" \
     hermes --version
   ```

仅写 `run -- hermes --version` 会在**宿主机**上解析 `hermes` 路径，但沙箱内子进程仍需要 env 包装与匹配策略。详见 [managed-cli-authority-connectivity-zh.md](../managed-cli-authority-connectivity-zh.md)。

交互式 Hermes：

```bash
./scripts/managed-lab.sh publish --from examples/wrapper-policies/hermes-interactive.yaml
./scripts/managed-lab.sh restart-agent
./scripts/managed-lab.sh interactive -- \
  /usr/bin/env HOME="$HOME" PATH="/opt/homebrew/bin:$HOME/.local/bin:/usr/bin:/bin" hermes
```

---

## 本地 Lab 与生产 Fleet 对比

| 主题 | 本地 Lab | 生产 Fleet |
|------|----------|------------|
| 状态目录 | `~/.finsafe-lab` | `/etc/finsafe`、`/var/lib/finsafe` |
| Authority | `127.0.0.1:8095` | 企业 HTTPS Policy Authority |
| Sentinel | 不安装 | MDM 下发 `managed-required.json` |
| 二进制 | PATH 上的发行版 | 固定安装路径 |

---

## 故障排查

| 现象 | 处理 |
|------|------|
| 每次 `run` 都报 `usage: … run [--json] -- <program>` | 使用已修复、会转发参数的脚本（`cmd_run … "$@"`）。冒烟：`./scripts/managed-lab.sh run -- /usr/bin/true` |
| `/admin/` 404 但 `/admin` 可打开 | 使用 **`http://<bind>/admin`**（末尾不要 `/`）。根路径 `/` 会重定向到该地址。旧版 authority 需重新安装/构建以包含 `/admin/` 路由。 |
| 管理 UI 审计/运行为空 | 先成功执行至少一次托管命令；agent 约每秒上传审计。可用 `run --json -- /usr/bin/true` 后刷新管理 UI。 |
| `license status expected valid` | 检查 `FINSAFE_LICENSE_PATH`、席位与过期 — `curl -s http://127.0.0.1:8095/v1/license/status \| jq` |
| `MANAGED_DAEMON_UNREACHABLE` | `./scripts/managed-lab.sh status`；`stop` 后 `start`，或 `restart-agent` |
| Hermes `env: hermes: No such file` | 仍在 `managed-lab-smoke` bundle — 发布 `hermes-version-smoke.yaml` 并重启 agent |
| 端口占用 | 修改 `FINSAFE_LAB_BIND` 或停止占用端口的其他 Authority |

---

## 相关文档

- [managed-mode-zh.md](../managed-mode-zh.md)
- [authority-deployment-zh.md](../authority-deployment-zh.md)
- [managed-mode-macos-runbook.md](./managed-mode-macos-runbook.md)（生产 Mac 步骤）
- [licensing-e2e-macos-zh.md](./licensing-e2e-macos-zh.md)
