# FinSafe 用户指南

本指南面向通过预构建的 **`finsafe` CLI** 在 FinSafe **隔离边界内**运行程序或 Broker 的**运维人员与开发者**。完整包装策略字段见 [POLICY-QUICKREF-zh.md](POLICY-QUICKREF-zh.md)（英文：[POLICY-QUICKREF.md](POLICY-QUICKREF.md)）。

## FinSafe 能做什么

FinSafe 约束的是 **代码如何运行**：命名空间、cgroup、seccomp（Linux）、路径限制、macOS 上基于 **Seatbelt** 的配置，以及 Windows 上默认的 **RestrictedToken**（`network: host`）或更强的 **AppContainer** 配置，并提供 **可审计** 的执行结果。它 **不是** 大模型产品本身；智能体决定 **做什么**，FinSafe 决定 **在什么隔离姿态下执行**。

- **CLI (`finsafe`)：** 本地「包装器」入口 —— 短命任务用 **`run`**，常驻交互式 Broker 用 **`self-confine`**。
- **服务端多租户**调度与准入由**单独的执行平台**承担（不在本仓库说明范围内）。多数本地场景只需 CLI + 包装策略 YAML。

---

## 使用前准备

### 安装 CLI

从 [GitHub Releases](https://github.com/finogeeks/finsafe/releases) 下载、校验 **`SHA256SUMS`** 并解压，步骤见仓库 [README.md](../README.md)。
Linux 发行包除 `finsafe` 外还包含 `finsafe-helper`、`finsafe-supervisor`
和 `finsafe-landlock-shim`；安装时请与 `finsafe` 放在同一目录（安装脚本会自动这样做）。

### 对不同操作系统的期望

| 主机 | 典型本地包装器姿态 |
|------|---------------------|
| **Linux**（已安装 bubblewrap / cgroup 等工具链） | 严格栈：Bubblewrap 等隔离 + 按策略解析的 cgroup / Landlock / seccomp。缺少 bwrap 时，严格姿态可能 **拒绝启动**。 |
| **macOS**（arm64 或 x86_64） | **`mac-seatbelt`**：通过 `/usr/bin/sandbox-exec` 运行子进程；本地工具封装 **不使用** Bubblewrap 命名空间栈。`probe` / `doctor` 可查看能力说明。 |
| **Windows**（10/11 桌面） | **默认 `network: host`：** RestrictedToken（宿主机可读、写路径白名单，对齐 Codex 弱化姿态，无需 ProjFS）。**`network: none` / allowlist / 机密 deny-read：** AppContainer / LowBox。安装后运行一次 **`finsafe setup-windows`**（安装器会自动执行）以启用 helper / WFP；ProjFS 仅在 AppContainer + 大体积运行时树投影时需要（可能重启一次）。 |

### Windows 后端（RestrictedToken 与 AppContainer）

**Windows 专用入门：** [WINDOWS-GUIDE-zh.md](WINDOWS-GUIDE-zh.md) · [WINDOWS-GUIDE.md](WINDOWS-GUIDE.md)（安装 → 选后端 → 校验 → Hermes → AppContainer/ProjFS → 排障）。

桌面 Windows 有 **两种** 启动后端，由 `windows.backend`（或 `Auto`）选择：

| 后端 | 何时选用 | 隔离内容 | 不做的事 |
|------|----------|----------|----------|
| **RestrictedToken**（`windows_restricted_token`） | **默认**：`network: host` 且 YAML `deny_read_paths` 为空（Auto），或显式 `windows.backend: restricted_token` | 默认拒绝写，仅 `read_write_paths`（+ cwd）白名单；Job 资源限制 | 无 AppContainer LowBox；**整机可读**（对齐 Codex）；无机密 deny-read；无需 ProjFS；证明字段 `degraded_execution=true` |
| **AppContainer**（`windows_appcontainer`） | `network: none` / allowlist、显式 `deny_read_paths`、显式 `windows.backend: appcontainer`、托管舰队 | Package SID、DACL 授权/拒绝、WFP 出口围栏；大体积 `venv` / `node_modules` 可用 ProjFS 投影 | 递归 ACL / ProjFS 可能需要 `setup-windows`（Client-ProjFS 返回需重启时重启一次） |

**随发行附带的 Hermes 示例：**

- [`hermes-windows-oneshot.yaml`](../examples/wrapper-policies/hermes-windows-oneshot.yaml) — RestrictedToken（推荐默认）
- [`hermes-windows-oneshot-appcontainer.yaml`](../examples/wrapper-policies/hermes-windows-oneshot-appcontainer.yaml) — AppContainer（更强）

`finsafe doctor` 将 ProjFS 未就绪视为 **警告** 而非硬错误：多数 Hermes / `network: host` 策略不需要 ProjFS。

快速自检：

```bash
finsafe probe
finsafe doctor
```

自动化场景：`finsafe probe --json`、`finsafe doctor --json`。

---

## 核心概念：包装策略 YAML

运维侧通过 **`--policy`** 传入 **包装策略**（`kind: local-wrapper`）。CLI 将其编译为内部执行规格；**日常不必**手写底层执行 JSON。

常用字段简要说明：

- **`program_mode`：** 必须与子命令一致（**`short-lived`** 配 **`run`**，**`interactive`** 配 **`self-confine`**）。
- **`network`：** **`none`**、**`host`**，或带代理配置的 **`allowlist`**。
- **`filesystem.read_only_paths` / `read_write_paths`：** 声明路径，与工作目录、`./workspace` 等布局一致。
- **`macos_seatbelt.deny_outbound_ports`**（可选，macOS）：在 **`network: host`** 时按端口拒绝出站 TCP。
- **`resources`：** 内存、pids、CPU 字符串（按平台能力执行）；短命 **`run`** 可用 **`timeout_ms`** 限制墙上时钟。

**可选的 `filesystem` 编译项：** 包装器可能合并默认可写根下的受保护子目录（`.git` / `.finsafe`），在 Linux/macOS/Windows 上应用 **内置 deny-read**（例如工作区下的 `.env`、`$HOME` 下的 `.ssh`，除非 `skip_default_deny_read: true`），并支持显式 **`deny_read_paths`** 与 **`deny_write_globs`**（旧键名 `deny_read_globs` 仍可用）。**`deny_read_paths` 与 `read_only_paths` 不同** — deny-read 在可写范围内禁止读；只读路径是授权。YAML 可不写这些键，但受支持桌面平台的舰队升级仍会带上发行版内置默认项，除非显式关闭。详见 [POLICY-QUICKREF-zh.md](POLICY-QUICKREF-zh.md)。

---

## 命令行如何指定策略

FinSafe 支持多种策略输入形态；**多数本地运维只需「包装策略」**（`kind: local-wrapper`）。

### 1. 包装策略（推荐）

将 **`--policy`** 放在**子命令之前**（全局位置）：

```bash
finsafe --policy <PATH> run <program> [参数...]
finsafe --policy <PATH> self-confine <broker> [参数...]
```

`<PATH>` 可为绝对路径，或相对于**当前 shell 工作目录**的相对路径（**不**相对于 `finsafe` 可执行文件本身）。YAML 中的路径（例如 `./workspace`）一般也按当前工作目录解析，除非使用根路径等锚定写法。

下列示例可复制使用 —— 完整首次上手流程：[README § 快速上手（Hermes）](../README-zh.md#快速上手hermes)、[README § 快速上手（OpenCode）](../README-zh.md#快速上手opencode)。索引：[examples/README.md](../examples/README.md)：

| 用途 | 策略文件 | 示例命令 |
|------|----------|----------|
| 短命任务冒烟 | [examples/wrapper-policies/hermes-version-smoke.yaml](../examples/wrapper-policies/hermes-version-smoke.yaml) | `finsafe --policy ./examples/wrapper-policies/hermes-version-smoke.yaml run -- hermes --version` |
| 一次性查询 / 短命令风格 | [examples/wrapper-policies/hermes-oneshot-query.yaml](../examples/wrapper-policies/hermes-oneshot-query.yaml) | `finsafe --policy ./examples/wrapper-policies/hermes-oneshot-query.yaml run -- hermes chat -q "…"` |
| 交互式 Broker（需 TTY） | [examples/wrapper-policies/hermes-interactive.yaml](../examples/wrapper-policies/hermes-interactive.yaml) | `finsafe --policy ./examples/wrapper-policies/hermes-interactive.yaml self-confine -- hermes` |
| OpenCode 一次性 | [examples/wrapper-policies/agent-sandbox/opencode-oneshot.yaml](../examples/wrapper-policies/agent-sandbox/opencode-oneshot.yaml) | 见 [README § 快速上手（OpenCode）](../README-zh.md#快速上手opencode) |
| 同上，且在 Seatbelt 下拒绝出站 TCP 80 | [examples/wrapper-policies/hermes-interactive-deny-http.yaml](../examples/wrapper-policies/hermes-interactive-deny-http.yaml) | `finsafe --policy ./examples/wrapper-policies/hermes-interactive-deny-http.yaml self-confine -- hermes` |

尚无 **`finsafe --agent <名称>`** 快捷方式 —— 请始终用 **`--policy <yaml 路径>`** 指定策略。

字段含义见 [POLICY-QUICKREF-zh.md](POLICY-QUICKREF-zh.md)。

### 1b. 主机姿态（`--host-profile`，仅 `self-confine`）

若不想手写 `kind: local-wrapper` YAML，可在 **`self-confine`** 前使用 **`--host-profile`**。CLI 会按命名姿态合成交互式包装策略，再走与 `finsafe --policy <wrapper.yaml> self-confine` 相同的启动路径。

解析顺序：**`--host-profile`** → 环境变量 **`FINSAFE_HOST_PROFILE`** → **`finsafe.yaml`** 的 `isolation.host_profile`。无静默默认值；**`legacy`** 不能用于 `self-confine`。

```bash
# Windows 桌面（后端随策略 / Auto）
finsafe --host-profile windows-desktop-isolated self-confine -- powershell

# 可选 YAML 覆盖（标量以文件为准；路径列表合并）
finsafe --host-profile windows-desktop-isolated --policy my-tweaks.yaml self-confine -- powershell

# Linux / macOS 交互式 Broker
finsafe --host-profile linux-desktop-isolated self-confine -- ./my-broker
finsafe --host-profile mac-seatbelt self-confine -- ./my-broker
```

内置姿态包括 **`windows-desktop-isolated`**、**`linux-desktop-isolated`**、**`mac-seatbelt`**、**`windows-managed`**。默认可写根目录：Windows 为 **`./workspace`**，Linux/macOS 为 **`./workspace-sc`**（相对启动 cwd）。**`--json`** 会输出 **`resolved_host_profile`**、**`selected_backend`** 等字段。

### 2. 高层意图策略

使用 **`finsafe run --high-level`**，YAML 形态见 [examples/high-level-policies/](../examples/high-level-policies/)（**意图 / 路由** 模式，**不是** `kind: local-wrapper`）。**不要**同时使用「全局 `finsafe --policy <包装.yaml> …`」与 `run --high-level`，CLI 会将二者视为互斥。

```bash
finsafe run --high-level <PATH> -- <program> [参数...]
```

**`--server`** 及身份类参数仅在该路径下有意义；具体以本机 **`finsafe --help`** 为准。

**示例文件：** [examples/high-level-policies/python-no-network.yaml](../examples/high-level-policies/python-no-network.yaml)（无网络的 Python 沙箱意图；需与实际启动的程序、目录布局匹配）。

### 3. 旧版执行规格（JSON）

部分集成仍使用 **`finsafe run --policy spec.json`**，其中 `spec.json` 为 **`ExecutionSpecV1`**，**不是** 包装 YAML。此处的 **`--policy`** 写在 **`run` 之后**，与 **`finsafe --policy wrapper.yaml run …`** 是两套语法，**不可同时出现**（全局包装 `--policy` 与 `run --policy` 混用会被拒绝）。

---

## 何时使用 `run` 与 `self-confine`

| 子命令 | 适用场景 | 机制 |
|--------|----------|------|
| **`run`** | 可自然结束的任务（脚本、编译、一次性 CLI 查询等）。 | FinSafe **启动子进程**并对其施加约束。 |
| **`self-confine`** | 长期占用终端的 Broker（交互 REPL/TUI）。 | FinSafe **先对自身施加约束**，再 **`execve`** 替换为 Broker 镜像，**终端仍由 Broker 占用**。 |

**不要随意对调：** Broker 用 `run` 会破坏交互 IO；脚本滥用 `self-confine` 会偏离正确的生命周期与审计形态。

### 在 `run` 内运行交互式 CLI（Linux，PTY 模式）

部分短命任务仍需要在沙箱内拥有 **controlling terminal**——例如 `vim`、`less`、`nano`，或会打开 `/dev/tty` 的脚本。在 Linux 上，**`stdio: mode: inherit`**（或未设置时的默认行为）**不会**让 bubblewrap 内的 `/dev/tty` 可用，可能出现 *Inappropriate ioctl for device* 或 *No such device or address*。

在包装策略中使用 **`pty`**，或在命令行覆盖：

```yaml
stdio:
  mode: pty
```

```bash
finsafe --policy ./policy.yaml run --stdio pty -- vim /path/in/workspace/file.txt
```

PTY 模式在沙箱内使用**虚拟**终端（非宿主机 `/dev/tty` 直通），可降低宿主机终端注入风险。非 capture 的 **`--json`** 与 PTY 组合时，子进程输出经 PTY master 中继。

在启用 argv 加固的部署配置下，可为沙箱 PID 命名空间提供私有 **`/proc`**；并非所有默认 `finsafe run` 姿态都会自动挂载。

---

## 快速上手

### 1. 版本与帮助

```bash
finsafe version
finsafe --help
```

说明：**`finsafe run --help`** 可能未单独接线；请使用 **`finsafe --help`** 查看 `run` / `self-confine` 等选项。

### 2. 短命运行（最短示例）

若策略含 `read_write_paths: ["./workspace"]`，请先准备目录：

```bash
mkdir -p my-workspace/workspace
cd my-workspace
finsafe --policy ./examples/wrapper-policies/hermes-version-smoke.yaml run -- hermes --version
```

**macOS：** 若 `hermes` 找不到或路径被拒绝，请使用 [README 快速上手（Hermes）](../README-zh.md#快速上手hermes) 或 YAML 文件头注释中的 `/usr/bin/env HOME=… PATH=…` 形式。

（请将 `--policy` 指到你保存 YAML 的路径；本仓库 [examples](../examples/) 下有示例策略。）

机器可读输出：

```bash
finsafe --policy /path/to/policy.yaml run --json echo hello </dev/null | jq .
```

### 3. 交互式 Broker（`self-confine`）

在**真实终端（TTY）**中，切换到与 **`filesystem`** 声明一致的目录：

```bash
cd /path/to/project-with-workspace-dir
finsafe --policy /path/to/interactive-policy.yaml self-confine your-broker
```

将 `your-broker` 换为你的 Broker 可执行文件。

---

## 示例策略（`install.sh` 不会自动安装）

**`install.sh` / `install.ps1` 只安装二进制**，不会把 YAML 复制到本机。获取 starter 策略的方式：

| 方式 | 适用场景 |
|------|----------|
| **`finsafe init`**（推荐） | 创建 `~/.config/finsafe/policies/examples/`（Linux/macOS）或 `%APPDATA%\FinSAFE\policies\examples\`（Windows），并写入精选冒烟 YAML |
| **克隆** [finogeeks/finsafe](https://github.com/finogeeks/finsafe) | 完整 `examples/`（Hermes、Windows、各 agent CLI） |
| **`curl -O` 单文件** | 不克隆仓库，只下载一两个 YAML（见 [README](../README.md)） |

```bash
finsafe init
finsafe --policy ~/.config/finsafe/policies/examples/hermes-version-smoke.yaml run -- hermes --version
```

可用 **`FINSAFE_CONFIG_DIR`**（配置根目录）或 **`FINSAFE_POLICIES_DIR`**（仅策略目录）覆盖默认路径。主机 profile 配置：**`~/.config/finsafe/finsafe.yaml`**（或 **`FINSAFE_CONFIG`** 指定文件）。

| 目录 | 内容 |
|------|------|
| `~/.config/finsafe/policies/examples/`（`init` 后） | Hermes 冒烟、Codex/OpenCode one-shot、Windows 沙箱冒烟 |
| [examples/wrapper-policies/](../examples/wrapper-policies/) | GitHub 仓库中的完整公开示例 |
| [examples/wrapper-policies/agent-sandbox/](../examples/wrapper-policies/agent-sandbox/) | Hermes、Codex、OpenCode、agy、隔离探测 |

使用 **`finsafe --policy <yaml 路径>`**；可用绝对路径，或相对于当前 shell 工作目录的相对路径。

---

## 创建与迭代策略

沙箱运行失败（路径拒绝、网络阻断、超时）时，用 **`finsafe learn`**、**`finsafe --audit`** 或 **`finsafe explain`**，而不是盲目改 YAML。

**运行 Hermes、OpenCode 或 agy？** 见 [agent-sandbox-guide-zh.md](agent-sandbox-guide-zh.md) § **用 learn 与 explain 迭代策略**（含 `--base` 示例策略与 macOS learn 零拒绝说明）。

### 选哪个工具？

| 场景 | 工具 |
|------|------|
| 有命令、**尚无策略**（或要新草稿） | **`finsafe learn -- <cmd>`** → 默认 `~/.config/finsafe/policies/learned-policy.yaml`（可用 `--out` 覆盖） |
| 已有策略，失败后**追加授权** | **`finsafe learn --base ./policy.yaml -- <cmd>`** |
| 同一次运行要看 **stderr 提示**、不生成 YAML | **`finsafe --audit --policy ./policy.yaml run -- <cmd>`** |
| 已保存 **`--json` 信封** | **`finsafe explain envelope.json`** |

字段说明与平台差异：[POLICY-QUICKREF-zh.md](POLICY-QUICKREF-zh.md) · [`--audit` 约定](isolation-audit-mode.md)。

### `finsafe learn`

在**真实强制**下捕获拒绝（macOS/Windows 为诊断采集；Linux 为 seccomp audit），输出**可审阅 YAML**：

```bash
mkdir -p workspace
cd my-project

finsafe learn -- my-agent --print "hello"
# → ~/.config/finsafe/policies/learned-policy.yaml（可用 --out 覆盖）
finsafe --policy ./learned-policy.yaml run -- my-agent --print "hello"
finsafe learn --base ./learned-policy.yaml --out ./learned-policy.yaml -- my-agent --print "hello"
```

常用参数：**`--work-dir`**、**`--json`**。

**说明：** Linux 上 learn 可能让 seccomp 未拦截的 syscall 继续执行并记录；macOS/Windows 保持完整强制，命令仍可能非零退出——请阅读 learn 摘要及被阻止的敏感路径。

### `finsafe explain`

对已保存的执行信封做事后诊断（与 `finsafe run --json` 输出同形）：

```bash
finsafe --policy ./policy.yaml run --json -- my-agent --print "hello" 2>audit.stderr \
  | tail -1 > envelope.json
finsafe explain envelope.json
```

`explain` 会解析 `policy_derivation_notes`（含 Windows `etw_audit:`）及子进程 stdout 标记。

### 典型迭代循环

```
finsafe learn -- <cmd>           → learned-policy.yaml
       ↓
finsafe --policy learned-policy.yaml run -- <cmd>
       ↓
（仍失败？）finsafe learn --base learned-policy.yaml -- <cmd>
       ↓
（可选）finsafe --audit run …
       ↓
（可选）保存 --json → finsafe explain
       ↓
重复直至通过
```

---

## macOS Seatbelt 特别说明

macOS **不可**与 Linux「完全等价隔离」：

- 除 **基准敏感路径拒绝**外，会根据 **`filesystem` 与工作目录** 生成允许规则。
- **`macos_seatbelt.deny_outbound_ports`** 可在 **`network: host`** 下做端口级出站限制。

---

## 高层策略与远程提交

进阶场景可使用 **`finsafe run --high-level`** 或 **`--server`** 提交到执行 API。多数本地运维 **仅使用** **`--policy` 包装 YAML**。具体以你安装的版本 **`finsafe --help`** 为准。

---

## 审批（人工准入）

部分环境需要在调度前 **`approve` / `deny`**。该语义由执行平台与 Broker **适配器** 实现，**基础 CLI 不提供**完整对话式审批 UX。请咨询你所在组织的适配器文档。

---

## 退出码（CLI）

与 `finsafe --help` 中列表一致（以下为常见含义，以你安装版本为准）：

| 码 | 含义 |
|----|------|
| `0` | 成功（含 `probe` 正常结束）。 |
| `1` | 内部错误（如 JSON 序列化失败）。 |
| `2` | 命令行或输入错误。 |
| `3` | 在产生可用输出前沙箱启动失败。 |
| `64` | 策略已编译但当前主机下无可用的本地执行后端（编译待定等）。 |

---

## 故障排查

| 现象 | 建议检查 |
|------|----------|
| macOS 上提示 **bubblewrap 不可用** | **属预期**；本地走 **Seatbelt**；看 **`probe` / `doctor`**。 |
| **`program_mode` 不匹配** | **`short-lived`** 须配 **`run`**，**`interactive`** 须配 **`self-confine`**。 |
| **`network: none` 下无法访问 API** | 若需出站 HTTPS，在威胁模型允许时使用 **`network: host`**。 |
| macOS 上路径访问被拒 | 放宽 **`read_only_paths` / `read_write_paths`**，确认 **`./workspace`** 等存在，结合 **`run --json`** 佐证字段排查。 |
| **沙箱失败从何入手** | **Agent（Hermes/OpenCode/agy）：** [agent-sandbox-guide-zh.md](agent-sandbox-guide-zh.md) § **用 learn 与 explain 迭代策略**。**其他：** [USER-GUIDE-zh § 创建与迭代策略](USER-GUIDE-zh.md) — **`learn`**、**`explain`**、**`--audit`**。 |
| Linux **`run` 内 `/dev/tty` 失败** | 策略设 **`stdio: pty`** 或使用 **`finsafe run --stdio pty`**；勿指望 **`inherit`** 在 bubblewrap 内提供 controlling terminal。 |

---

## 延伸阅读（本仓库）

- [POLICY-QUICKREF-zh.md](POLICY-QUICKREF-zh.md) — 包装策略字段速查（中文）  
- [POLICY-QUICKREF.md](POLICY-QUICKREF.md) — Wrapper policy field reference (English)  
- [isolation-audit-mode.md](isolation-audit-mode.md) — `--audit` 行为与保存 JSON 信封  
- [USER-GUIDE.md](USER-GUIDE.md) — English user guide
