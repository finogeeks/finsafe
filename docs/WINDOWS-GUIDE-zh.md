# FinSafe Windows 桌面指南

**English:** [WINDOWS-GUIDE.md](WINDOWS-GUIDE.md)

本文是 Windows 10/11 **桌面运维入门**页面。策略字段细节见 [POLICY-QUICKREF-zh.md](POLICY-QUICKREF-zh.md)；跨平台 CLI 基础见 [USER-GUIDE-zh.md](USER-GUIDE-zh.md)。

与 Linux（bubblewrap）、macOS（Seatbelt）不同，Windows 有 **两种启动后端**。选错后端是安装困惑的主要来源（helper 权限提示、ProjFS 重启警告、长达数分钟的 ACL 标注）。

---

## 1. 一次性安装

推荐：

```powershell
irm https://raw.githubusercontent.com/finogeeks/finsafe/main/install.ps1 | iex
```

安装器会：

1. 将 `finsafe.exe` 与 `finsafe-winhelper.exe` 放到 `PATH`
2. **运行一次** **`finsafe setup-windows`**（可能出现一次权限 / UAC 提示，属正常）

手动安装：从 [Releases](https://github.com/finogeeks/finsafe/releases) 解压 Windows 包，两份二进制放在同一目录，然后：

```powershell
finsafe setup-windows
```

`setup-windows` 会准备：

| 组件 | 何时需要 | 说明 |
|------|----------|------|
| **finsafe-winhelper** 服务 | `network: none` / allowlist（WFP 围栏）、托管舰队 | 缺失时 `doctor` 会告警 |
| **ProjFS**（`Client-ProjFS`） | 可选：AppContainer + 大体积 `venv` / `node_modules` 投影 | 可能重启一次（退出码 **3010**）。典型 Hermes / `network: host` **不需要**。手动安装：`Enable-WindowsOptionalFeature -Online -FeatureName Client-ProjFS`（管理员） |

---

## 2. 选择后端（决策树）

```text
是否需要 network: none / allowlist、机密 deny-read、
托管舰队，或显式 windows.backend: appcontainer？
        │
        ├─ 是 ──► AppContainer（更强）
        │
        └─ 否（典型 Hermes / network: host 桌面）
                 └──► RestrictedToken（Auto 默认）
```

| | **RestrictedToken** | **AppContainer** |
|--|---------------------|------------------|
| **何时（Auto）** | `network: host` 且 YAML `deny_read_paths` 为空 | `network: none` / allowlist、任意 YAML `deny_read_paths`、托管舰队 |
| **钉死** | `windows.backend: restricted_token` | `windows.backend: appcontainer` |
| **读** | 整机可读（大多沿用用户身份） | 仅 Package SID + DACL 授权 |
| **写** | 默认拒绝；仅 `read_write_paths`（+ cwd）白名单 | 在声明的根上做 DACL 授权 |
| **Deny-read / 机密** | **跳过**内置机密 deny-read | 支持（DACL deny-read） |
| **网络围栏（WFP）** | 不是 host 网络的主路径 | 用于 none / allowlist |
| **大体积 `venv` / `node_modules`** | 无递归 ACL；**无需 ProjFS** | 优先 ProjFS 投影；策略里列整棵树可能触发 ACL 风暴 |
| **证明字段** | `windows_restricted_token`，`degraded_execution=true` | `windows_appcontainer` |
| **Hermes 示例** | [`hermes-windows-oneshot.yaml`](../examples/wrapper-policies/hermes-windows-oneshot.yaml) | [`hermes-windows-oneshot-appcontainer.yaml`](../examples/wrapper-policies/hermes-windows-oneshot-appcontainer.yaml) |

**经验法则：** 需要普通主机联网与本机 Python/Node 安装的 agent CLI，先用 RestrictedToken；需要锁网或机密 deny-read 再切 AppContainer。

另有显式弱兼容钉死（`windows.backend: write_restricted`），用于需要 RestrictedToken 族写白名单、但不走 AppContainer 的主机。除非明确需要，否则优先 Auto / RestrictedToken。见 [POLICY-QUICKREF-zh.md § Windows 后端](POLICY-QUICKREF-zh.md)。

---

## 3. 校验主机

```powershell
finsafe probe
finsafe doctor
# 自动化：
finsafe probe --json
finsafe doctor --json
```

常见信号怎么读：

| 信号 | 对典型 Hermes 的严重性 | 怎么做 |
|------|------------------------|--------|
| Helper 未运行 | 若只用 `network: host` 多为警告 | 使用 none/allowlist 策略前先跑 `finsafe setup-windows` |
| ProjFS 未就绪 / `restart_required` | **警告**（不是硬错误） | RestrictedToken 可忽略重启；仅 AppContainer + 大体积投影时再重启 |
| `appcontainer_works=false` | 会阻断 AppContainer Auto 路径 | host 类 agent 改用 RestrictedToken，或修复禁用 AppContainer 的系统/组策略 |

---

## 4. 第一次跑通

多数示例期望可写根目录 `./workspace`：

```powershell
New-Item -ItemType Directory -Force -Path workspace | Out-Null
```

冒烟：

```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/windows-version-smoke.yaml -OutFile windows-version-smoke.yaml
finsafe --policy .\windows-version-smoke.yaml run -- cmd /c ver
```

Hermes（推荐默认 — RestrictedToken）：

```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/hermes-windows-oneshot.yaml -OutFile hermes-windows-oneshot.yaml
finsafe --policy .\hermes-windows-oneshot.yaml run -- hermes --version
```

更强隔离 Hermes（AppContainer）：

```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/hermes-windows-oneshot-appcontainer.yaml -OutFile hermes-windows-oneshot-appcontainer.yaml
finsafe --policy .\hermes-windows-oneshot-appcontainer.yaml run -- hermes --version
```

- 短命工具 → `finsafe run` + `program_mode: short-lived`
- 真实终端里的交互式 broker → `finsafe self-confine`（ConPTY）
- Agent 专项说明 → [agent-sandbox-guide-zh.md § Windows agents](agent-sandbox-guide-zh.md)

> **关于 git-bash / MSYS2（Cygwin）Agent 的说明：** Windows 沙箱面向**原生
> Windows 二进制**设计。MSYS2/Cygwin 运行时（如 git-bash）与 `RestrictedToken`
> 后端**不兼容**：受限令牌拒绝了 MSYS2 运行时初始化所需的、以用户 SID 命名的
> 共享内存对象（`CreateFileMapping`），git-bash 因此中止（`Win32 error 5` /
> `STATUS_DLL_INIT_FAILED`），所有经由它执行的工具都会失败。Hermes 的
> `write_file` / `terminal` / `execute_code` 工具都通过 git-bash
> （`HERMES_GIT_BASH_PATH`）执行，因此 RestrictedToken 沙箱中的 Hermes 无法
> 执行文件/工具操作 — 尽管用 `cmd.exe` 直接写入相同的 `read_write_paths` 是
> 成功的。如果需要在沙箱内完整执行 Hermes 工具，请关注上游修复
> ([finogeeks/finsafe#29](https://github.com/finogeeks/finsafe/issues/29))，
> 或让 Hermes 工具改用原生 Windows 入口（cmd.exe / PowerShell）而非 git-bash。

---

## 5. 仅 AppContainer：大目录与 ProjFS

若你停留在 RestrictedToken / `network: host`，可跳过本节。

AppContainer 必须在 FinSAFE 使用的每个文件系统根（`work_dir`、`read_only_paths`、`read_write_paths`）上放置可继承的 Package SID ACL（以及 Low 完整性标签）。若在这些字段中列出整个 agent 检出目录或巨大的 `node_modules`，可能：

1. 触发大目录保护（默认立即子项 ≥ **10 000**）并 **拒绝** 标注，或
2. 在 EDR/DLP 下强制标注时耗费数分钟

优先：

1. **收窄路径** — 只列真正需要的目录
2. **RestrictedToken** — 仅需写白名单的 host 网络 agent
3. **ProjFS 投影** — AppContainer 下的大体积运行时树（`setup-windows`；仅当退出码 **3010** / `restart_required` 时重启）。手动安装 ProjFS：

   ```powershell
   # 需要管理员权限
   Enable-WindowsOptionalFeature -Online -FeatureName Client-ProjFS
   ```

   用 `finsafe probe --json | ConvertFrom-Json | Select-Object -ExpandProperty projfs` 验证。

详细表格、环境变量（`FINSAFE_WINSAFE_INHERIT_ROOT_*`）与中断标注恢复：[POLICY-QUICKREF-zh.md § Windows AppContainer 大目录](POLICY-QUICKREF-zh.md)。

---

## 6. 排障

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| 首次使用出现 UAC / 权限提示 | `setup-windows` 注册 helper / WFP | 接受一次；中断后可再跑 `finsafe setup-windows` |
| `doctor` 提示 helper | Helper 服务未运行 | `finsafe setup-windows`；none/allowlist 需要它 |
| `doctor` 提示 ProjFS / 重启 | Client-ProjFS 已启用但待重启，或功能缺失 | RestrictedToken Hermes 可忽略；仅 AppContainer + 大投影时重启 |
| `refusing to apply inheritable AppContainer ACLs` | 策略根是巨大目录树 | 收窄路径、改用 RestrictedToken，或走 ProjFS — 见 §5 |
| 首次 AppContainer 启动极慢 | 一次性 ACL 标注 | 让它跑完，不要中断；优先 ProjFS / 更窄路径 |
| AppContainer 下 Hermes 读不到 `.env` / 凭据 | 内置或显式 deny-read | 改用 RestrictedToken 示例，或审阅后设 `skip_default_deny_read: true` |
| 嵌套 `cmd /c …` 无输出 | 标准 I/O 路径 / 旧版本回归 | 升级到 **0.9.7+**；非交互控制台主机走 PipeCapture |
| `network: none` 仍能连外网 | Helper / WFP 未就绪 | `setup-windows`，再用 `probe --json` / 验收围栏检查 |
| 托管/企业姿态在 RestrictedToken 上失败 | 舰队要求 AppContainer | 使用 AppContainer + helper；已签名包不得把 RT 当作 AC 对等 |

Windows 上同样可用策略迭代（`learn` / `explain` / `--audit`）；`learn` 保持 AppContainer 强制并摄入 ETW 推导的拒绝。流程见 [USER-GUIDE-zh.md § 创建与迭代策略](USER-GUIDE-zh.md)。

---

## 7. 相关文档

| 文档 | 作用 |
|------|------|
| [USER-GUIDE-zh.md](USER-GUIDE-zh.md) | 跨平台 CLI（`run` / `self-confine` / learn） |
| [POLICY-QUICKREF-zh.md](POLICY-QUICKREF-zh.md) | 后端对照表 + AppContainer 大目录参考 |
| [agent-sandbox-guide-zh.md](agent-sandbox-guide-zh.md) | Hermes / agent 配方 |
| [README-zh.md](../README-zh.md) | 安装一行命令与发行包 |
| [CHANGELOG.md](../CHANGELOG.md) | 按版本的 Windows 修复说明 |
