# Windows 远程 Authority 托管 E2E（实验 / GA 试点）

**English:** [windows-remote-authority-e2e.md](./windows-remote-authority-e2e.md)

验证 **Linux/macOS 上的 Policy Authority** → **Windows 上的 `finsafe-agent` 注册与拉包** → **托管模式 `finsafe run`** 全链路。Authority **不在 Windows 上运行**。

这与 CI 中的 `windows-acceptance` **agent-pipe** job 不同：agent-pipe 只做本机 bootstrap + 命名管道，不连接真实 Authority。本流程是产品文档中的 **正式交付门禁** 之一（见 [product-one-pager-zh.md](../product-one-pager-zh.md)）。

---

## 架构

```text
Linux/macOS 主机                         Windows 试点机
─────────────────                        ─────────────────
e2e-linux-authority-for-windows-fleet    e2e-windows-remote-authority-fleet.ps1
  licensectl → authority-http              finsafe-agent + enroll token
  bundlectl → windows-managed-smoke        pull bundle → cache/bundle.jws
  fleet assignment + enroll token          finsafe run → AppContainer echo
  handoff.json ──────复制/共享──────────►
```

| 组件 | 平台 | 说明 |
|------|------|------|
| `finsafe-authority-http` | Linux / macOS | `managed-lab.sh` 同类；本 harness 绑定 `0.0.0.0` 供局域网 Windows 访问 |
| `finsafe-agent` / `finsafe` | Windows | Release 中的 `finsafe-fleet-v*` 或本地 `target\release` |
| `handoff.json` | 任意 | 含 `authority_url`、`enroll_token`、`device_id`（一次性 token） |

---

## 前置条件

**Authority 主机（Linux 或 macOS）：**

- 仓库根目录、`jq`、`curl`、Rust 工具链（与 `e2e-mac-authority-hermes.sh` 相同）
- 商业许可证签发密钥：`FINSAFE_LICENSE_SIGNING_KEY` 或仓库根 `.signing_key.bin`
- Windows 能访问 Authority 的 URL（防火墙放行 TCP 端口，默认 **8095**）

**Windows 试点机：**

- PowerShell 7+（`pwsh`）
- 已解压的 `finsafe-fleet-v*`（含 `finsafe.exe`、`finsafe-agent.exe`、`finsafe-winaccept.exe`）
- 能 HTTP 访问 Authority 的 `authority_url`（内网 IP 或 HTTPS 终止后的公网 URL）

---

## 步骤 1 — Linux/macOS：起 Authority 并生成 handoff

```bash
export FINSAFE_LICENSE_SIGNING_KEY=/path/to/.signing_key.bin
# 若自动推断 LAN IP 失败，请显式设置 Windows 可访问的 URL：
# export FINSAFE_AUTHORITY_PUBLIC_URL=http://192.168.1.10:8095

./scripts/tests/managed-mode/e2e-linux-authority-for-windows-fleet.sh prepare --no-wait
```

产物：

- `/tmp/finsafe-win-remote-e2e/handoff.json`（默认 `FINSAFE_E2E_DIR`）
- Authority 日志：`/tmp/finsafe-win-remote-e2e/authority.log`
- Admin UI：`http://<authority-host>:8095/admin`

将 `handoff.json` 复制到 Windows（SCP、共享文件夹等）。**enroll token 一次性**，若 Windows 端注册失败需重新执行 `prepare` 生成新 token。

---

## 步骤 2 — Windows：注册 + 托管运行

在含 `finsafe.exe` 的目录旁创建 `workspace`（策略 RW 路径；脚本会自动创建）：

```powershell
# 假设 handoff 与 fleet 二进制已就位
pwsh -File C:\finsafe-e2e\e2e-windows-remote-authority-fleet.ps1 `
  -HandoffPath C:\finsafe-e2e\handoff.json `
  -BinDir 'C:\Program Files\FinSAFE'
```

成功输出末尾为：

```text
OK: Windows remote authority fleet E2E complete (managed AppContainer echo under authority bundle)
```

断言包括：

- `policy_source == managed`
- `windows_backend == windows_appcontainer`
- `finsafe-winaccept echo` 输出 `hello`
- 托管模式下 `--policy` 本地覆盖被拒绝

---

## 步骤 3 — 收尾

```bash
./scripts/tests/managed-mode/e2e-linux-authority-for-windows-fleet.sh stop
```

---

## 故障排查

| 现象 | 可能原因 |
|------|----------|
| Windows 无法访问 `/health` | `FINSAFE_AUTHORITY_PUBLIC_URL` 用了 `127.0.0.1`、防火墙未放行、或 NAT 隔离 |
| `enrolled.json` 超时 | token 已消费或 Authority 不可达；重新 `prepare` |
| `bundle.jws` 超时 | Fleet assignment 未生效或 `device_id` 与 handoff 不一致 |
| `no policy binding matched` | Bundle 的 `os` 未含 `windows`（本 harness 在 publish 前用 `jq` 修补；勿用手工 bundlectl 默认产物） |
| `MANAGED_DAEMON_UNREACHABLE` | `finsafe-agent` 未运行或命名管道 `\\.\pipe\finsafe-agent` 被占用 |

---

## 与 CI 的关系

| 层级 | 自动化 | 覆盖 |
|------|--------|------|
| `windows-acceptance` agent-pipe | GitHub `windows-latest` | 设备 IPC + bootstrap（无远程 Authority） |
| 本 runbook | **手工**（两台机器或 VM） | Authority → enroll → bundle → managed `finsafe run` |
| 未来 | `p0-p2-improvement-plan.md` backlog | 跨 runner workflow 编排 |

**不涉及新产品功能开发**；若 E2E 暴露缺陷，再修 agent/CLI/Authority。自动化缺口主要是 **harness + 文档**，不是 Windows 版 Authority。

---

## 相关脚本

| 脚本 | 角色 |
|------|------|
| `scripts/tests/managed-mode/e2e-linux-authority-for-windows-fleet.sh` | Authority 侧 `prepare` / `stop` |
| `scripts/tests/managed-mode/e2e-windows-remote-authority-fleet.ps1` | Windows 侧客户端 |
| `scripts/tests/managed-mode/e2e-mac-authority-hermes.sh` | 单机 macOS 全栈参照 |
| `docs/public-finsafe/scripts/managed-lab.sh` | 单机 lab（非 Windows fleet） |
