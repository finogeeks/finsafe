# 智安盾Windows 桌面指南

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
| **ProjFS**（`Client-ProjFS`） | 可选：AppContainer + 大体积 `venv` / `node_modules` 投影 | `setup-windows` 在能拉起 `prjflt` 时无需重启。仅当 `probe` 报 `restart_required` 时才重启。典型 Hermes / `network: host` **不需要**。手动安装：`Enable-WindowsOptionalFeature -Online -FeatureName Client-ProjFS -NoRestart`（管理员） |

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
| **Deny-read / 机密** | 不支持显式 deny-read | 支持 effective YAML 中的显式 deny-read（DACL deny-read） |
| **网络围栏（WFP）** | 不是 host 网络的主路径 | 用于 none / allowlist。操作者（已启用的 `finsafe-net`）保持在线；FAIL 是子进程/探测上的 deny-only `WSAEACCES` |
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
| ProjFS 未就绪 / `restart_required` | **警告**（不是硬错误） | RestrictedToken 可忽略。AppContainer + 大体积投影时再跑 `setup-windows`，确认 `projection_smoke_works`；仅当 `restart_required` 仍为 true 时重启 |
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

智安盾常驻为 supervisor。broker 直接共用你的控制台（逐键输入、彩色、TUI
实时重绘和窗口大小变化都直接到 broker）。**Ctrl+C 发给 Hermes；Ctrl+Break
终止整个会话。**只有嵌入式宿主需要智安盾自己充当终端时，才设置
`FINSAFE_WIN_PTY_MODE=live`。不要把 oneshot 策略复用给 `self-confine` — 它是
`program_mode: short-lived` 且带 120 秒超时，会中断交互会话。

- 短命工具 → `finsafe run` + `program_mode: short-lived`
- 真实终端里的交互式 broker → `finsafe self-confine`（broker 共用你的控制台）
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
> `SeCreateGlobalPrivilege`。**不要**在 WorkBuddy GUI app seam 上打开
> `windows.msys2_child_ipc`：该 seam 对 Git Bash 是 hook DENY；C7 语言路径是
> PowerShell → python/node。`finsafe app attach` 会把 CodeBuddy
> `permissions.deny: ["Bash"]`、`CODEBUDDY_CODE_SHELL=powershell`、
> `CODEBUDDY_DISABLE_SHELL_SNAPSHOT=1` 写入**两个** USER 主目录；prepared
> AppContainer attach 还会写入 `CODEBUDDY_SAFE_DELETE_ENABLED=1` 与
> `sandbox.safeDeleteRuntimeEnabled: true`：
> `.workbuddy/settings.json`（Desktop）以及 `.codebuddy/settings.json` +
> `settings.local.json`（裸 CLI）（见 §6）。

---

### AppContainer HTTPS 检查的共享配置

当前 AppContainer HTTPS 检查候选版本的验证使用一套固定配置，运行期间不动态变化。
代理路由与 TLS 检查沿用现有 `network.mode: proxy`
和 `tls_terminate` 设置，不新增配置入口。

证书注入与持久 Inspector 复用均基于这套共享配置。在同一域内按运行分配不同策略权限、
动态切换策略，以及这些运行之间的额外权限隔离，暂缓实现。
现有 AppContainer 约束和已配置的网络规则继续生效。

Inspector 不按应用 PID 判断代理请求，也不要求对子进程逐一登记。每次运行获得
一个仅监听本机的代理入口，用于记录该次运行的审计信息；正常子进程继承代理和
证书环境变量即可使用。入口不提供本机进程之间的权限隔离或来源身份认证。
Core 与 Explicit 的留存记录使用相同的用户、域存储位置，可在桌面“记录”中查看。

Windows 当前使用：**在同一个 Windows 登录会话内，每个用户 SID +
`security_domain_id` 对应一个普通用户权限的常驻 Inspector**。同域的 Core、普通
运行和工具子进程使用统一检查配置，共用该 Inspector。WorkBuddy 与 DSH 在同域
时可以同时运行，启动任何一个都不需要退出另一个。不同域使用独立的 Inspector、
CA 材料和生命周期资源；停止一个域的 Inspector 不影响其他域。
Node Guard 保留网络适配器；Core 退出
只释放自己的连接和审计上下文，不停止 Inspector。未来透明转发也接入同一个进程。
已准入的 AppContainer self-confine 也接入此宿主。标准 HTTP 代理请求和 HTTPS
CONNECT 使用同一检查引擎，支持启用或关闭 TLS 检查。透明转发尚未实现。
具体验证结果与兼容性缺口见[迁移验证](../../design/windows-appcontainer-https-inspection.md#103-migration-verification)。

## 5. 专用主目录、大目录与 ProjFS

### 专用智安盾主目录（RestrictedToken）

即使你停留在 RestrictedToken / `network: host`，也**不要跳过**本小节。
RestrictedToken 启动时授权会**拒绝**卷根、`%USERPROFILE%`、`%APPDATA%` /
`%LOCALAPPDATA%` 根，以及 Electron `userData` 产品目录（例如 `%APPDATA%\…`）。
请使用 `%LOCALAPPDATA%\FinSAFE\...` 下的专用沙箱主目录，不要把 `userData`
列入 `read_write_paths` 或当作 `work_dir`。WorkBuddy catalog（#375）额外以
**NoWalk** ACE 授予 `%LOCALAPPDATA%\CodeBuddyExtension`（不是 TreeSet，也不是
Electron `userData`）；其他 AppData 产品目录仍拒绝。

Prepared AppContainer（`finsafe prepare` + 已安装的 effective YAML）是另一套
生命周期：effective YAML 中显式声明的卷根和用户配置根可以授权，`unprepare`
根据 receipt 恢复原 ACL。宽范围必须显式写入 effective YAML；app cwd/chdir
不会动态增加权限。

**RestrictedToken 与已有文件：** WRITE_RESTRICTED 只在主目录对象上设置可继承 ACE
（`DirectoryInheritableNoWalk`），**不会**改写已有子孙。Agent 可以创建**新**文件
（它们会继承 capability SID），但**不能修改预先存在的文件或子目录**，除非那些对象
已经带有该 SID。请把策略指向一个专用的**空** `%LOCALAPPDATA%\FinSAFE\...` 主目录
——不要把庞大的 `userData` 树拷进去并指望写入能成功。

### 仅 AppContainer：大目录与 ProjFS

若你停留在 RestrictedToken / `network: host`，可跳过**本小节**（上面的专用主目录规则仍然适用）。

AppContainer 文件系统权限只来自已安装的 effective YAML，而不是启动时传入的 wrapper policy。加入所需的持久边界后运行 `finsafe prepare`；`run` 与 `self-confine` 只消费已准备的权限，绝不会新增或修复 ACL。effective YAML 中显式配置的卷根和用户配置根可被接受，`unprepare` 会恢复 receipt 记录的改动。对非常大的物理目录树，preparation 在 EDR/DLP 下仍可能耗费数分钟，因此优先：

1. **收窄路径** — 只列真正需要的目录
2. **RestrictedToken** — 仅需写白名单的 host 网络 agent（仍须使用空的专用智安盾主目录）
3. **ProjFS 投影** — AppContainer 下的大体积运行时树（`setup-windows`；仅当 `finsafe probe --json` 报 `restart_required` 时重启）。手动安装 ProjFS：

   ```powershell
   # 需要管理员权限
   Enable-WindowsOptionalFeature -Online -FeatureName Client-ProjFS -NoRestart
   ```

   用 `finsafe probe --json | ConvertFrom-Json | Select-Object -ExpandProperty projfs` 验证。

Preparation 生命周期与中断恢复：[POLICY-QUICKREF-zh.md § Windows AppContainer 大目录](POLICY-QUICKREF-zh.md)。

---

## 6. App seams（实验性）

**App seam** 是已安装 GUI agent 里、无需改厂商签名二进制就能改变行为的位置。
Phase 1 用的是应用自带的 **bundled bootstrap script**：`finsafe app attach`
把它换成智安盾shim，在旁边写入 guard，并保留原文件的逐字节备份（seam
旁的相对名：`<seam>.finsafe-orig` 与 `<seam>.finsafe-guard.js`）。这是
**实验性** 功能，不是已支持的产品模式。Linux / macOS 上 `finsafe app`
以 78 退出。

```powershell
finsafe app list
finsafe app doctor <integration-id>
finsafe app attach <integration-id>
finsafe app status
finsafe app detach --all
```

**在删除或替换 `finsafe.exe` 之前，先运行 `finsafe app detach --all`。**
若 seam 仍附着而二进制已不在，seam 即 **orphaned**（D14）：个人模式下
shim 会无防护地跑原脚本，并追加本地日志。**不保证**此时会有用户通知
（不承诺 toast）。这是损坏状态，不是受支持的模式。

### Phase 1 保证什么、不保证什么

| 层 | Phase 1 | 层级（D16） |
|----|---------|------------|
| 核心进程 | 经 Node `fs` 的写范围与已配置 deny-read；Job 拆除与资源限制 | **用户态** guard + Job。核心进程上**没有**内核文件系统边界。 |
| 派生工具（子进程） | 选定的 effective YAML 提供具体根目录及 `codebuddy-*`、`workbuddy-*` 等窄范围运行时 glob；唯一的运行时追加项是 AppContainer profile 自带的 `Temp`。FakeAgent 不会增加会话 cwd 或 chdir 目标。 | **内核** AppContainer + 已 prepare 的路径 ACL |
| Deny-read / 机密路径 | Effective YAML 中的 deny 规则应用到共享 AppContainer SID；核心进程的 Node `fs` 也协作式执行这些规则。 | 子进程为**内核**边界；核心进程为**用户态**边界 |
| 出站 allowlist | **无**（仅审计） | —（Phase 2） |

不要把「已 attach」读成「整棵 GUI agent 树都被内核沙箱化」。核心仍以用户
完整令牌运行；内核写边界在子进程。FakeAgent fixture 证明不等于 WorkBuddy G2。

WorkBuddy 的模型 **Bash** 工具是 Git Bash（MSYS2），不是 `cmd`。seam 在
`CreateProcessW` 上 **DENY** `bash` / `git-bash` / `mintty`。这是有意的：打开
`windows.msys2_child_ipc` 会关掉该会话的 NTFS 写白名单，本 catalog **禁止**该
字段。`finsafe app attach` 会把同一套 overlay 写入**两个** USER 主目录
（Desktop SettingsManager 用 `%USERPROFILE%\.workbuddy\settings.json`，裸 CLI
用 `%USERPROFILE%\.codebuddy\settings.json` 和 `settings.local.json`），并对
attach cwd / `%USERPROFILE%\WorkBuddy` 下已有的项目 `.codebuddy/` 覆盖层做同样
合并：`permissions.deny: ["Bash"]`、`CODEBUDDY_CODE_SHELL=powershell`、
`CODEBUDDY_DISABLE_SHELL_SNAPSHOT=1`；仅 prepared AppContainer attach 还会写入
`CODEBUDDY_SAFE_DELETE_ENABLED=1`、`sandbox.safeDeleteRuntimeEnabled: true`
（保留 `sandbox.extraAllowWrite` /
claw / plugins）。attach 之后新建的项目覆盖层仍可能 later-win。detach 还原
首次 attach 触及的每一层。attach 会报告 `restart_needed`，以便 `--prewarm` /
`--serve` 重读设置。不要设 `CODEBUDDY_CODE_SHELL=cmd`。这是产品配置绕过，不是
RestrictedToken 里跑 Git Bash。

---

## 7. 排障

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| 首次使用出现 UAC / 权限提示 | `setup-windows` 注册 helper / WFP | 接受一次；中断后可再跑 `finsafe setup-windows` |
| `doctor` 提示 helper | Helper 服务未运行 | `finsafe setup-windows`；none/allowlist 需要它 |
| `doctor` 提示 ProjFS / 重启 | Client-ProjFS 缺失、烟测失败，或确有待重启 | RestrictedToken Hermes 可忽略；再跑 `setup-windows` 并以 `probe` 为准（`Restart Required : Possible` 不是待重启）。仅当 `restart_required` 为 true 时重启 |
| `doctor` 指出超限可继承根 | wrapper policy 的目录树超过 `FINSAFE_WINSAFE_INHERIT_ROOT_WARN_LIMIT` | 收窄 wrapper 路径。若确实需要 AppContainer 持久访问更大范围，把该边界加入已安装的 effective YAML，再运行 `finsafe prepare`；prepare **不会**读取 wrapper policy，显式 prepared 边界可以覆盖宽根 — 见 §5 |
| `refusing to apply inheritable` 且含 `product folder` / `userData` | RestrictedToken 的 `read_write_paths` / `work_dir` 是 AppData 产品目录 | 改用 `%LOCALAPPDATA%\FinSAFE\...` 下的专用空主目录 — 见 §5 |
| RestrictedToken agent 无法写入主目录里已有文件 | `DirectoryInheritableNoWalk` 不会改写预先存在的子孙 | 创建**新的空** `%LOCALAPPDATA%\FinSAFE\...` 主目录；新文件会继承 capability ACE。不要把已填充的 `userData` 树拷进去 |
| AppContainer 启动提示 launch-image bucket 未覆盖 | `{userData}\sandbox-images\<digest>` 缺少已准备 Package SID 的读/执行权限 | 在已安装 effective YAML 中加入覆盖 staging 位置的 `read_only` 或 `read_write` 边界，再运行 `finsafe prepare`。launch 只检查实际 DACL，绝不会现场修复 |
| AppContainer 下 Hermes 读不到 `.env` / 凭据 | effective YAML 中的显式 deny-read 规则 | 审阅并修改该 YAML 规则；若确实需要宿主机范围读取，可改用 RestrictedToken 示例 |
| `self-confine` 退出 `0xC0000142` / `STATUS_DLL_INIT_FAILED`（RestrictedToken） | 0.9.15 之前的启动路径 | 升级到 **0.9.15+**（默认 Live ConPTY）；或设 `FINSAFE_WIN_PTY_MODE=pipe` |
| WorkBuddy 仍提供 Bash / `bash.exe` 以 Win32 5 / `0xC0000142` 退出 | Git Bash 是 seam DENY；MSYS2 IPC 无法在保留写白名单的前提下被 confine；attach 之后新建的项目 `.codebuddy/` 覆盖层仍可能 later-win；GUI 读的是 `.workbuddy/settings.json` | attach 会写入**两个** USER 主目录（`.workbuddy/settings.json` 以及 `.codebuddy/settings.json` + `settings.local.json`：deny Bash + PowerShell env + `CODEBUDDY_DISABLE_SHELL_SNAPSHOT=1` + 打开 safe-delete）以及已有项目覆盖层。重启 WorkBuddy 让 CodeBuddy 重读设置。**不要**设 `windows.msys2_child_ipc`。 |
| 嵌套 `cmd /c …` 无输出 | 标准 I/O 路径 / 旧版本回归 | 升级到 **0.9.7+**；非交互控制台主机走 PipeCapture |
| 操作者在 `network: none` 下仍能连外网 | 预期：已启用的 `finsafe-net` 组成员身份让桌面保持在线 | 不是围栏失败。AppContainer 子进程和启动前探测用 deny-only 戳记；FAIL 是该令牌上连接成功而不是 `WSAEACCES` |
| Deny-only 探测 / 沙箱子进程连接成功 | Helper / WFP 未就绪，或 deny-only 戳记失败 | `setup-windows`，再用 `probe --json` / 验收围栏检查（`windows_egress_fence_verified`） |
| 托管/企业姿态在 RestrictedToken 上失败 | 舰队要求 AppContainer | 使用 AppContainer + helper；已签名包不得把 RT 当作 AC 对等 |
| 卸载智安盾后 GUI agent 仍无防护地运行 | Orphaned seam：未 `detach` 就删除或替换了 `finsafe.exe`（D14） | 重装智安盾后运行 `finsafe app detach --all`，或从 `<seam>.finsafe-orig` 恢复厂商 bootstrap。**不保证 toast** |

Windows 上同样可用策略迭代（`learn` / `explain` / `--audit`）；`learn` 保持 AppContainer 强制并摄入 ETW 推导的拒绝。流程见 [USER-GUIDE-zh.md § 创建与迭代策略](USER-GUIDE-zh.md)。

---

## 8. 相关文档

| 文档 | 作用 |
|------|------|
| [USER-GUIDE-zh.md](USER-GUIDE-zh.md) | 跨平台 CLI（`run` / `self-confine` / learn） |
| [POLICY-QUICKREF-zh.md](POLICY-QUICKREF-zh.md) | 后端对照表 + AppContainer 大目录参考 |
| [agent-sandbox-guide-zh.md](agent-sandbox-guide-zh.md) | Hermes / agent 配方 |
| [README-zh.md](../README-zh.md) | 安装一行命令与发行包 |
| [CHANGELOG.md](../CHANGELOG.md) | 按版本的 Windows 修复说明 |
