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

交互式 Hermes 会话（RestrictedToken + `self-confine`，请在真实终端中运行 —
Windows Terminal 或交互式 PowerShell 窗口）：

```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/hermes-windows-interactive.yaml -OutFile hermes-windows-interactive.yaml
finsafe --policy .\hermes-windows-interactive.yaml self-confine -- hermes
```

FinSAFE 常驻为 supervisor，并为沙箱内的 broker 充当终端宿主：会话期间控制台
切换为 raw/VT 模式（逐键输入、彩色、TUI 实时重绘、窗口大小变化转发），Hermes
退出后自动恢复。**Ctrl+C 发给 Hermes；Ctrl+Break 终止整个会话。**不要把
oneshot 策略复用给 `self-confine` — 它是 `program_mode: short-lived` 且带
120 秒超时，会中断交互会话。

- 短命工具 → `finsafe run` + `program_mode: short-lived`
- 真实终端里的交互式 broker → `finsafe self-confine`（AppContainer **与** RestrictedToken 在可用时均走 Live ConPTY）
- 可选：broker 不沙箱、工具仍沙箱 → `broker_confine: tools-only`（见 `hermes-interactive-tools-only.yaml`）
- Agent 专项说明 → [agent-sandbox-guide-zh.md § Windows agents](agent-sandbox-guide-zh.md)

> **关于 git-bash / MSYS2（Cygwin）Agent 的说明：** 作为 RestrictedToken **直接**
> 载荷的 Git for Windows `bash.exe`，通过给已有 SID 命名共享内存
> （`CreateFileMapping S-1-5-21-….n`）授予 capability SID，并把操作者 SID 加入
> restricting SID 来支持（公开 [#29](https://github.com/finogeeks/finsafe/issues/29)）。
> Hermes 工具、`cmd /c bash` 等 **子进程** git-bash 需要显式
> `windows.msys2_child_ipc: true`（公开
> [#34](https://github.com/finogeeks/finsafe/issues/34)）。该开关把操作者 SID
> 放进整个令牌的 restricting SID，因此该会话对用户已拥有 NTFS 对象**不再**做写白名单。
> 随附的 `hermes-windows-oneshot.yaml` / `hermes-windows-interactive.yaml` 已打开。
> 默认 RestrictedToken（省略该字段）保留写白名单；子进程 bash 会在 Cygwin 初始化时
> 以 Win32 5 失败。AppContainer 是另一套令牌，仍不是 git-bash 路径。这不是
> `SeCreateGlobalPrivilege`。

---

## 5. 专用主目录、大目录与 ProjFS

### 专用 FinSAFE 主目录（AppContainer **与** RestrictedToken）

即使你停留在 RestrictedToken / `network: host`，也**不要跳过**本小节。
两个后端的可继承 ACL 授权都会**拒绝**卷根、`%USERPROFILE%`、`%APPDATA%` /
`%LOCALAPPDATA%` 根，以及 Electron `userData` 产品目录（例如 `%APPDATA%\…`）。
请使用 `%LOCALAPPDATA%\FinSAFE\...` 下的专用沙箱主目录，不要把 `userData`
列入 `read_write_paths` 或当作 `work_dir`。

**RestrictedToken 与已有文件：** WRITE_RESTRICTED 只在主目录对象上设置可继承 ACE
（`DirectoryInheritableNoWalk`），**不会**改写已有子孙。Agent 可以创建**新**文件
（它们会继承 capability SID），但**不能修改预先存在的文件或子目录**，除非那些对象
已经带有该 SID。请把策略指向一个专用的**空** `%LOCALAPPDATA%\FinSAFE\...` 主目录
——不要把庞大的 `userData` 树拷进去并指望写入能成功。

### 仅 AppContainer：大目录与 ProjFS

若你停留在 RestrictedToken / `network: host`，可跳过**本小节**（上面的专用主目录规则仍然适用）。

AppContainer 必须在 FinSAFE 使用的每个文件系统根（`work_dir`、`read_only_paths`、`read_write_paths`）上放置可继承的 Package SID ACL（以及 Low 完整性标签）。若在这些字段中列出整个 agent 检出目录或巨大的 `node_modules`，可能：

1. 触发大目录保护（默认立即子项 ≥ **10 000**）并 **拒绝** 标注，或
2. 在 EDR/DLP 下强制标注时耗费数分钟

优先：

1. **收窄路径** — 只列真正需要的目录
2. **RestrictedToken** — 仅需写白名单的 host 网络 agent（仍须使用空的专用 FinSAFE 主目录）
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
| `doctor` 指出超限可继承根 | 策略树超过 `FINSAFE_WINSAFE_INHERIT_ROOT_WARN_LIMIT` | `finsafe doctor --high-level <policy>`（或 `--policy`）会在不启动的情况下指出路径。然后先 `finsafe prelabel --high-level <policy> -- <command>` 再 `run`。卷根 / `%USERPROFILE%` / AppData 产品目录仍会被拒绝 — 见 §5 |
| `refusing to apply inheritable AppContainer ACLs`（大树） | 策略根是巨大目录树（AppContainer TreeSet） | 用 `finsafe prelabel --high-level <policy> -- <command>`（命令尾与 `run` 相同）在交互路径外支付这次 walk。若范围过宽则收窄路径。提高 `FINSAFE_WINSAFE_INHERIT_ROOT_WARN_LIMIT` 或设 `FINSAFE_WINSAFE_INHERIT_ROOT_FAIL=0` 是最后手段（仍然很慢）。改用 RestrictedToken **并不能**让 Electron `userData` 通过 |
| `refusing to apply inheritable` 且含 `product folder` / `userData` | `read_write_paths` / `work_dir` 是 AppData 产品目录（AppContainer **或** RestrictedToken） | 改用 `%LOCALAPPDATA%\FinSAFE\...` 下的专用空主目录 — 见 §5。`prelabel` 同样拒绝这些根 |
| RestrictedToken agent 无法写入主目录里已有文件 | `DirectoryInheritableNoWalk` 不会改写预先存在的子孙 | 创建**新的空** `%LOCALAPPDATA%\FinSAFE\...` 主目录；新文件会继承 capability ACE。不要把已填充的 `userData` 树拷进去 |
| 首次 AppContainer 启动极慢 | 大策略根上的一次性 ACL 标注 | 完成行 `tree relabel in progress` / `labeling sandbox access on <path>` 会指出根路径和耗时。用 `finsafe prelabel --high-level <policy> -- <command>` 提前支付（命令尾必须与启动一致）。不要中断正在进行的 walk。优先 ProjFS / 更窄路径。**不要**把 `read_write_paths` 指向 Electron `userData` — FinSAFE 会拒绝这些根；请使用 `%LOCALAPPDATA%\FinSAFE\...` |
| AppContainer 下 Hermes 读不到 `.env` / 凭据 | 内置或显式 deny-read | 改用 RestrictedToken 示例，或审阅后设 `skip_default_deny_read: true` |
| `self-confine` 退出 `0xC0000142` / `STATUS_DLL_INIT_FAILED`（RestrictedToken） | 0.9.15 之前的启动路径 | 升级到 **0.9.15+**（默认 Live ConPTY）；或设 `FINSAFE_WIN_PTY_MODE=pipe` |
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
