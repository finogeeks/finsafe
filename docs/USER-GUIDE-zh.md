# FinSafe 用户指南

本指南面向通过预构建的 **`finsafe` CLI** 在 FinSafe **隔离边界内**运行程序或 Broker 的**运维人员与开发者**。完整包装策略字段见本仓库中的 [POLICY-QUICKREF.md](POLICY-QUICKREF.md)。

## FinSafe 能做什么

FinSafe 约束的是 **代码如何运行**：命名空间、cgroup、seccomp（Linux）、路径限制，以及 macOS 上基于 **Seatbelt** 的配置，并提供 **可审计** 的执行结果。它 **不是** 大模型产品本身；智能体决定 **做什么**，FinSafe 决定 **在什么隔离姿态下执行**。

- **CLI (`finsafe`)：** 本地「包装器」入口 —— 短命任务用 **`run`**，常驻交互式 Broker 用 **`self-confine`**。
- **服务端多租户**调度与准入由**单独的执行平台**承担（不在本仓库说明范围内）。多数本地场景只需 CLI + 包装策略 YAML。

---

## 使用前准备

### 安装 CLI

从 [GitHub Releases](https://github.com/finogeeks/finsafe/releases) 下载、校验 **`SHA256SUMS`** 并解压，步骤见仓库 [README.md](../README.md)。

### 对不同操作系统的期望

| 主机 | 典型本地包装器姿态 |
|------|---------------------|
| **Linux**（已安装 bubblewrap / cgroup 等工具链） | 严格栈：Bubblewrap 等隔离 + 按策略解析的 cgroup / Landlock / seccomp。缺少 bwrap 时，严格姿态可能 **拒绝启动**。 |
| **macOS**（arm64 或 x86_64） | **`mac-seatbelt`**：通过 `/usr/bin/sandbox-exec` 运行子进程；本地工具封装 **不使用** Bubblewrap 命名空间栈。`probe` / `doctor` 可查看能力说明。 |

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
- **`network`：** Stage 1 为 **`none`** 或 **`host`**。
- **`filesystem.read_only_paths` / `read_write_paths`：** 声明路径，与工作目录、`./workspace` 等布局一致。
- **`macos_seatbelt.deny_outbound_ports`**（可选，macOS）：在 **`network: host`** 时按端口拒绝出站 TCP。
- **`resources`：** 内存、pids、cgroup CPU 配额；短命 **`run`** 可用 **`timeout_ms`** 限制墙上时钟。

**可选的 `filesystem` 编译项：** 包装器可能在 Landlock 只读层合并默认受保护子目录，并按 **`deny_read_globs`** 等配置扩展规则。不写这些键的**旧策略仍然有效**。详见 [POLICY-QUICKREF.md](POLICY-QUICKREF.md)。

---

## 何时使用 `run` 与 `self-confine`

| 子命令 | 适用场景 | 机制 |
|--------|----------|------|
| **`run`** | 可自然结束的任务（脚本、编译、一次性 CLI 查询等）。 | FinSafe **启动子进程**并对其施加约束。 |
| **`self-confine`** | 长期占用终端的 Broker（交互 REPL/TUI）。 | FinSafe **先对自身施加约束**，再 **`execve`** 替换为 Broker 镜像，**终端仍由 Broker 占用**。 |

**不要随意对调：** Broker 用 `run` 会破坏交互 IO；脚本滥用 `self-confine` 会偏离正确的生命周期与审计形态。

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
finsafe --policy ./examples/hermes-version-smoke.yaml run echo "hello"
```

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

---

## 延伸阅读（本仓库）

- [POLICY-QUICKREF.md](POLICY-QUICKREF.md) — 包装策略字段参考（英文）  
- [USER-GUIDE.md](USER-GUIDE.md) — English user guide
