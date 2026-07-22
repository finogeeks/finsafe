# FinSafe CLI（公开发行版）

English: [README.md](README.md)

FinSafe 是一套**跨平台**主机执行边界工具集，用于在 **Linux、macOS 与 Windows** 上安全运行第三方智能体。Linux 侧提供命名空间、cgroup 限制、seccomp 与 Landlock；macOS 使用 Seatbelt（`sandbox-exec`）与回环出口代理；Windows 默认对 `network: host` 使用 RestrictedToken（宿主机可读、写白名单），对 `network: none` / allowlist / 机密 deny-read 使用 AppContainer / LowBox，并配合 Job Object、WFP 与 ConPTY / PipeCapture，提供可审计的运行结果。**`finsafe`** 命令行是 **local wrapper** 流程的运维入口（`run`、`self-confine`、`learn`、`explain`、`probe`、`doctor` 及相关子命令）。

本仓库仅提供**公开发行的二进制文件**与**终端用户文档**，**不包含** FinSafe 引擎源码。

## 支持的平台

FinSAFE 在三大桌面操作系统上提供**一等公民**沙箱能力。同一份 wrapper 策略 YAML（`kind: local-wrapper`）会编译为各主机上可用的原生隔离机制：

| 平台 | 隔离技术栈 | 个人 CLI | 托管舰队 |
|------|------------|:--------:|:--------:|
| **Linux** x86_64 | bubblewrap、cgroup v2、seccomp、Landlock（若内核支持） | ✓ | ✓ |
| **macOS**（Intel + Apple 芯片） | Seatbelt（`sandbox-exec`）、回环出口代理 | ✓ | ✓ |
| **Windows** x86_64 | RestrictedToken（默认 `network: host`）+ AppContainer / LowBox（none/allowlist / deny-read）、Job Object、WFP、ConPTY / PipeCapture | ✓ | ✓ |

编写策略前请在各平台运行 **`finsafe probe`** 与 **`finsafe doctor`**。**Policy Authority**（`finsafe-admin-server-v*`）仅发布 **Linux 与 macOS** 服务端构建；已纳管的 **Windows 桌面** 使用舰队包（`finsafe-fleet-v*-x86_64-pc-windows-msvc.tar.zst`）。

## 能力概览（个人 wrapper）

在 Linux、macOS 与 Windows 上，公开发行的 `finsafe` CLI 支持：

- **声明式 wrapper 策略** — `finsafe --policy wrapper.yaml run …`（短期）与 `self-confine …`（交互式 broker）
- **网络模式** — 全拒绝、host、域名白名单 + 回环正向代理（授权场景下可选 TLS MITM / L7 检查）。**白名单 + 代理怎么跑：** [network-allowlist-proxy-runbook-zh.md](docs/network-allowlist-proxy-runbook-zh.md)
- **策略迭代** — 合法工作被拦截时使用 `learn`、`explain` 与 `--audit`
- **可审计结果** — 带 attestation 摘要的 JSON 信封（[隔离审计模式](docs/isolation-audit-mode.md)）
- **Agent 模板** — Hermes、OpenCode、Codex、agy 等，见 [examples/wrapper-policies/agent-sandbox/](examples/wrapper-policies/agent-sandbox/)

各桌面系统的 Agent 工作流见 [agent-sandbox-guide-zh.md](docs/agent-sandbox-guide-zh.md)。

## 个人模式 vs 托管模式（许可）

| 模式 | 适用对象 | 许可证 |
|------|----------|--------|
| **个人 / local wrapper** | 在本机使用 `finsafe --policy …` 的开发者 | **免费** — 公开发行的 `finsafe` CLI 无需商业许可证 |
| **托管舰队** | 部署 `finsafe-authority-http`、`finsafe-agent` 与 MDM 策略的 IT 团队 | **商业许可** — 由 Finogeeks 签发 `license.jws` 并安装在 Policy Authority 上 |

GitHub [Releases](https://github.com/finogeeks/finsafe/releases) 在同一版本标签下提供个人 CLI（`finsafe-v*`）、托管舰队（`finsafe-fleet-v*`）、authority 服务（`finsafe-admin-server-v*`，Linux + macOS）与运维 CLI（`finsafe-bundlectl-v*`，Linux + macOS）。**桌面目标：** Linux x86_64、macOS Intel、macOS Apple 芯片与 **Windows x86_64**（个人与舰队）。**发行说明：** [CHANGELOG.md](CHANGELOG.md)。详见 **[binary-reference-zh.md](docs/binary-reference-zh.md)**。Authority 与 `license.jws`：[authority-deployment-zh.md](docs/authority-deployment-zh.md)。

### 安装脚本（全平台）

| | **Linux** | **macOS** | **Windows** |
|---|-----------|-----------|-------------|
| **个人**（`finsafe-v*`） | [`install.sh`](install.sh) | [`install.sh`](install.sh) | [`install.ps1`](install.ps1) |
| **IT 试点**（`finsafe-fleet-v*`） | [`install-fleet.sh`](install-fleet.sh)（sudo） | [`install-fleet.sh`](install-fleet.sh)（sudo） | [`install-fleet-windows.ps1`](install-fleet-windows.ps1)（提升权限） |
| **生产舰队** | MDM / Ansible / 镜像 — [packaging/mdm/](packaging/mdm/) | MDM / Jamf / PKG — [packaging/mdm/](packaging/mdm/) | Intune / GPO — [packaging/mdm/](packaging/mdm/) |

IT 试点脚本会下载发行包、校验 `SHA256SUMS`、安装二进制并配置 `finsafe-agent`，适用于实验室与小规模试点，**不能**替代大规模 MDM 交付。

**供 AI Agent 使用的运维技能：**

- [finsafe-agent-sandbox-run](skills/finsafe-agent-sandbox-run/SKILL-zh.md) — 运行 Hermes / OpenCode / agy；**`learn` / `explain`** 策略迭代
- [finsafe-agent-sandbox-verify](skills/finsafe-agent-sandbox-verify/SKILL-zh.md) — 验证沙箱隔离
- [finsafe-enterprise-setup](skills/finsafe-enterprise-setup/SKILL-zh.md) — 托管舰队（Finogeeks `license.jws`）
- [finsafe-bundlectl](skills/finsafe-bundlectl/SKILL-zh.md) — 策略包发布 + MDM 哨兵

**Agent 沙箱指南：** [docs/agent-sandbox-guide-zh.md](docs/agent-sandbox-guide-zh.md)（含 **`learn` / `explain`**）

## 企业 IT 全景（推荐）

面向 **舰队部署、MDM、安全运营与平台架构** 人员：说明 FinSAFE **中心 Sandbox-as-a-Service**（server、scheduler、router）与 **桌面边缘**（个人 / 托管模式）两条路径、市场与技术对比、Hermes 示例，以及对 **分布式智能体** 的可治理性价值。

| 文档 | 说明 |
|------|------|
| **[docs/terminology-glossary-zh.md](docs/terminology-glossary-zh.md)** | **概念术语表**（MITM、WFP、企业代理、L7、隔离机制、托管舰队、对标 sandbox-runtime/Codex） |
| **[docs/product-one-pager-zh.md](docs/product-one-pager-zh.md)** | **产品一页纸**（定位、痛点、与 Docker/云沙箱对比、适用场景） |
| **[docs/enterprise-it-overview-zh.md](docs/enterprise-it-overview-zh.md)** | 企业 IT 全景（首选阅读） |
| [docs/binary-reference-zh.md](docs/binary-reference-zh.md) | 全部二进制与发行包对照 |
| [docs/authority-deployment-zh.md](docs/authority-deployment-zh.md) | Authority 安装与商业许可证 |
| [docs/managed-mode-zh.md](docs/managed-mode-zh.md) | 托管模式组件与 CLI 错误码 |
| [docs/enterprise-deployment-runbook-zh.md](docs/enterprise-deployment-runbook-zh.md) | 分阶段部署与运维 |
| [docs/mdm/vendor-neutral-checklist-zh.md](docs/mdm/vendor-neutral-checklist-zh.md) | MDM 交付检查清单 |

公开发行的 `curl \| sh` 安装包默认 **不含** 托管特性（适合个人试用）；舰队请使用带 **managed** 特性的企业构建，见 [packaging/README.md](packaging/README.md)。

## 安装发行版

### 一行命令（推荐）

需要 **`curl`**、**`tar`** 以及 **`zstd`**（或支持 **`--zstd`** 的 `tar`）。默认会校验 **`SHA256SUMS`**，除非你显式关闭校验。

```bash
curl -fsSL https://raw.githubusercontent.com/finogeeks/finsafe/main/install.sh | sh
```

固定版本或安装目录：

```bash
curl -fsSL https://raw.githubusercontent.com/finogeeks/finsafe/main/install.sh | env FINSAFE_VERSION=0.9.10 FINSAFE_INSTALL_DIR="$HOME/.local/bin" sh
curl -fsSL https://raw.githubusercontent.com/finogeeks/finsafe/main/install.sh | sh -s -- --version 0.9.10
```

下载脚本后可执行 **`install.sh --help`**，查看全部环境变量说明。

**Windows（个人模式）：** PowerShell 5.1+，需 `tar`（或 `zstd` + `tar`）：

```powershell
irm https://raw.githubusercontent.com/finogeeks/finsafe/main/install.ps1 | iex
```

固定版本：`$env:FINSAFE_VERSION = '0.9.10'; irm https://raw.githubusercontent.com/finogeeks/finsafe/main/install.ps1 | iex`

### 手动下载

1. 打开 [**Releases**](https://github.com/finogeeks/finsafe/releases)，选择某个版本标签（例如 `v0.9.10`）。
2. 下载对应平台的压缩包：
   - Linux x86_64：`finsafe-v<version>-x86_64-unknown-linux-gnu.tar.zst`
   - macOS Apple 芯片：`finsafe-v<version>-aarch64-apple-darwin.tar.zst`
   - macOS Intel：`finsafe-v<version>-x86_64-apple-darwin.tar.zst`
   - Windows x86_64：`finsafe-v<version>-x86_64-pc-windows-msvc.tar.zst`
3. 在同一发行版页面下载 **`SHA256SUMS`**。
4. 校验并解压：

```bash
VERSION=0.9.10   # 改为你下载的版本号
shasum -a 256 -c SHA256SUMS
tar -xvf "finsafe-v${VERSION}-<target>.tar.zst"
# 二进制路径：finsafe-v<version>-<target>/finsafe
# Linux 压缩包还包含 finsafe-helper、finsafe-supervisor 和
# finsafe-landlock-shim；请与 finsafe 放在同一目录，便于自动发现。
```

**Windows（手动解压）：** 使用 `tar --zstd`（Windows 11 / 较新 Windows 10 自带）：

```powershell
$VERSION = "0.9.10"   # 改为你下载的版本号
tar --zstd -xf "finsafe-v$VERSION-x86_64-pc-windows-msvc.tar.zst"
# 二进制：finsafe-v<version>-x86_64-pc-windows-msvc\finsafe.exe
# 伴随程序：finsafe-winhelper.exe（同目录）
.\finsafe.exe setup-windows   # 每台机器运行一次（可能出现权限提示，属正常）
```

将二进制复制到 **`PATH`** 中的目录。Linux 请同时复制三个伴随二进制；Windows 请同时复制 **`finsafe.exe`** 与 **`finsafe-winhelper.exe`**，并运行一次 **`finsafe setup-windows`**。使用 `install.ps1` 安装时会自动执行该步骤。PowerShell 无法将无扩展名文件当作可执行程序运行。

5. 确认：

```bash
./finsafe version
finsafe --help
```

```powershell
.\finsafe.exe version
.\finsafe.exe --help
```

### `release.json`

部分发行版附带 **`release.json`**：列出资源 URL 与 SHA-256 摘要的小型清单，便于自动化下载脚本使用，而无需写死文件名。

### 企业二进制（同一 GitHub Release）

托管舰队与 Policy Authority 与个人 CLI 在**同一** [Releases](https://github.com/finogeeks/finsafe/releases) 页面发布。舰队桌面请用 **`install-fleet.sh`** / **`install-fleet-windows.ps1`**（IT 试点）或 MDM/Ansible（生产）。Authority 与 `finsafe-bundlectl` 仍建议手动解压或自建自动化。详见 **[docs/binary-reference-zh.md](docs/binary-reference-zh.md)**。

**IT 试点（托管舰队）示例：**

```bash
sudo FINSAFE_AUTHORITY_URL='https://gov.example.com/policy-authority' \
     FINSAFE_SENTINEL_PATH=./managed-required.jws \
     FINSAFE_ENROLL_TOKEN='one-time-token' \
     ./install-fleet.sh
```

| 发行包 | 内容 |
|--------|------|
| **`finsafe-fleet-v<version>-<target>.tar.zst`** | 托管 `finsafe` + `finsafe-agent`（Linux：helper/supervisor/landlock shim；Windows：`finsafe-winhelper.exe`） |
| **`finsafe-admin-server-v<version>-<target>.tar.zst`** | `finsafe-authority-http`（Linux 生产；macOS 本地开发 / 试点） |
| **`finsafe-bundlectl-v<version>-<target>.tar.zst`** | `finsafe-bundlectl`（运维工作站；target 与桌面包相同） |
| **`finsafe-v<version>-<target>.tar.zst`** | 个人模式 `finsafe`（`install.sh`） |

`license.jws` 由 Finogeeks 单独提供（不在 GitHub）。安装后再开启注册与管理 API：[authority-deployment-zh.md](docs/authority-deployment-zh.md) · [enterprise-deployment-runbook-zh.md](docs/enterprise-deployment-runbook-zh.md)。

## 快速上手（Windows）

通过 [`install.ps1`](install.ps1) 安装（复制 `finsafe.exe` 与 `finsafe-winhelper.exe`，并**一次性**运行 **`finsafe setup-windows`** — 可能出现一次权限提示，属正常）：

```powershell
irm https://raw.githubusercontent.com/finogeeks/finsafe/main/install.ps1 | iex
Invoke-WebRequest -Uri https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/windows-version-smoke.yaml -OutFile windows-version-smoke.yaml
New-Item -ItemType Directory -Force -Path workspace | Out-Null
finsafe --policy .\windows-version-smoke.yaml run -- cmd /c ver
```

- **`run`** + `program_mode: short-lived` 适用于 Windows 批处理 / 一次性 agent 工具。
- **`self-confine`** 在真实终端中支持交互式 broker（Hermes、PowerShell 等），经 ConPTY 附加控制台。
- 非交互脚本中嵌套 `cmd` / PowerShell 使用 **PipeCapture** 标准 I/O（见 [CHANGELOG.md](CHANGELOG.md) 0.9.7+）。

**完整 Windows 入门**（RestrictedToken 与 AppContainer、`setup-windows`、ProjFS、排障）：[docs/WINDOWS-GUIDE-zh.md](docs/WINDOWS-GUIDE-zh.md) · [WINDOWS-GUIDE.md](docs/WINDOWS-GUIDE.md)。

更多 Windows 示例：[windows-sandbox-smoke.yaml](examples/wrapper-policies/windows-sandbox-smoke.yaml)、[hermes-windows-oneshot.yaml](examples/wrapper-policies/hermes-windows-oneshot.yaml)（RestrictedToken）、[hermes-windows-oneshot-appcontainer.yaml](examples/wrapper-policies/hermes-windows-oneshot-appcontainer.yaml)。

## 快速上手（Hermes）

**`install.sh` 仅安装 `finsafe` 二进制** — 请**自行安装 Hermes** 并确保其在 **`PATH`** 中。示例策略假定当前目录下有可写的 **`./workspace`**（先执行 **`mkdir -p workspace`**）。

**macOS：** Seatbelt 缺省拒绝策略下，若直接运行 `hermes …` 失败，请使用各 YAML 文件头注释中的 `/usr/bin/env HOME=… PATH=…` 形式。

### 获取示例策略

**方式 A — `finsafe init`**（需 CLI 已包含该子命令）：

```bash
finsafe init
export POLICY_EXAMPLES="$HOME/.config/finsafe/policies/examples"
```

**方式 B — 只下载策略文件**（YAML 落在当前目录）：

```bash
curl -fsSL -O https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/hermes-version-smoke.yaml
curl -fsSL -O https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/hermes-oneshot-query.yaml
curl -fsSL -O https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/hermes-interactive.yaml
```

**方式 C — 克隆本仓库**：

```bash
git clone https://github.com/finogeeks/finsafe.git && cd finsafe
export POLICY_EXAMPLES="$PWD/examples/wrapper-policies"
```

### 运行 Hermes

```bash
mkdir -p workspace
finsafe --policy "$POLICY_EXAMPLES/hermes-version-smoke.yaml" run -- hermes --version
finsafe --policy "$POLICY_EXAMPLES/hermes-oneshot-query.yaml" run -- \
  hermes chat -q "用一句话说你好。"
finsafe --policy "$POLICY_EXAMPLES/hermes-interactive.yaml" self-confine -- hermes   # 需要真实 TTY
```

若使用方式 B，将 `"$POLICY_EXAMPLES/…"` 换成 `./hermes-….yaml`。

- **`run`** → **`program_mode: short-lived`**  
- **`self-confine`** → **`program_mode: interactive`**（须在真实终端中）

更多说明：[USER-GUIDE-zh.md](docs/USER-GUIDE-zh.md)、[POLICY-QUICKREF-zh.md](docs/POLICY-QUICKREF-zh.md)。

## 快速上手（OpenCode）

请**自行安装 OpenCode**（示例常假定 `opencode` 及 `~/.bun/bin` 在 **`PATH`** 中）。仓库内仅有 **一次性** 策略，无交互式 OpenCode 示例。

```bash
export POLICY_AGENT="$HOME/.config/finsafe/policies/examples"
# 或克隆后：export POLICY_AGENT=./examples/wrapper-policies/agent-sandbox

mkdir -p workspace
finsafe --policy "$POLICY_AGENT/opencode-oneshot.yaml" run -- \
  /usr/bin/env HOME="$HOME" PATH="$HOME/.bun/bin:$HOME/.local/bin:/usr/bin:/bin" \
  opencode run "你的提示词"
```

单文件下载：

```bash
curl -fsSL -O https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/agent-sandbox/opencode-oneshot.yaml
mkdir -p workspace
finsafe --policy ./opencode-oneshot.yaml run -- opencode run "你的提示词"
```

策略迭代（`learn`、`explain`、`--audit`）：[USER-GUIDE-zh.md § 创建与迭代策略](docs/USER-GUIDE-zh.md)。

## 示例策略与策略编写

**`install.sh` / `install.ps1` 仅安装二进制**。安装后：

```bash
finsafe init   # 若 CLI 支持 — 写入 ~/.config/finsafe/policies/examples/
# 或 git clone / curl -O（见上方快速上手）
```

| 路径 | 内容 |
|------|------|
| [examples/wrapper-policies/](examples/wrapper-policies/) | Hermes、Windows 冒烟、managed-lab |
| [examples/wrapper-policies/agent-sandbox/](examples/wrapper-policies/agent-sandbox/) | Codex、OpenCode、agy 等 agent 模板 |

沙箱失败时用 **`finsafe learn`** 生成可审阅 YAML、**`finsafe --audit run`** 查看 stderr 提示，或对保存的 **`--json` 信封** 运行 **`finsafe explain`**。详见 [USER-GUIDE-zh.md § 创建与迭代策略](docs/USER-GUIDE-zh.md)。

## 文档

### 终端用户与本地运维（`--policy`）

| 文档 | 说明 |
|------|------|
| [docs/WINDOWS-GUIDE-zh.md](docs/WINDOWS-GUIDE-zh.md) · [WINDOWS-GUIDE.md](docs/WINDOWS-GUIDE.md) | **Windows 桌面** — 安装、RestrictedToken 与 AppContainer、ProjFS、排障 |
| [docs/agent-sandbox-guide-zh.md](docs/agent-sandbox-guide-zh.md) · [agent-sandbox-guide.md](docs/agent-sandbox-guide.md) | **Agent 沙箱** — Hermes、OpenCode、agy；**`learn` / `explain`** |
| [docs/USER-GUIDE.md](docs/USER-GUIDE.md) | 英文运维指南（`run` 与 `self-confine`、**learn / explain**、策略 YAML、退出码）。 |
| [docs/USER-GUIDE-zh.md](docs/USER-GUIDE-zh.md) | 中文用户指南。 |
| [docs/POLICY-QUICKREF-zh.md](docs/POLICY-QUICKREF-zh.md) | 包装策略（`kind: local-wrapper`）字段速查（中文）。 |
| [docs/POLICY-QUICKREF.md](docs/POLICY-QUICKREF.md) | 同上（英文）。 |
| [docs/isolation-audit-mode.md](docs/isolation-audit-mode.md) | `--audit` 与保存 JSON 信封供 `explain` |
| [examples/README.md](examples/README.md) | 策略示例索引（`high-level-policies/`、`wrapper-policies/`）。 |
| [examples/wrapper-policies/agent-sandbox/](examples/wrapper-policies/agent-sandbox/) | Agent CLI 策略模板 |
| [examples/wrapper-policies/hermes-version-smoke.yaml](examples/wrapper-policies/hermes-version-smoke.yaml) | 最小化的短期 wrapper 策略示例。 |

### 企业管理员（托管模式 / 舰队部署）

策略集中下发、`finsafe-agent` 守护进程、MDM 部署与强制托管（已纳管设备上不可使用本地 `--policy` 覆盖）。

| 文档 | 说明 |
|------|------|
| [docs/product-one-pager-zh.md](docs/product-one-pager-zh.md) · [docs/product-one-pager.md](docs/product-one-pager.md) | **产品一页纸**（市场定位、技术对比、适用场景）。 |
| [docs/enterprise-it-overview-zh.md](docs/enterprise-it-overview-zh.md) · [docs/enterprise-it-overview.md](docs/enterprise-it-overview.md) | **企业 IT 全景**（个人 / 托管、Hermes、可治理性、MDM 路径）。 |
| [docs/binary-reference-zh.md](docs/binary-reference-zh.md) · [docs/binary-reference.md](docs/binary-reference.md) | 全部二进制、发行包、管理员验证清单 |
| [docs/authority-deployment-zh.md](docs/authority-deployment-zh.md) · [docs/authority-deployment.md](docs/authority-deployment.md) | 安装 `finsafe-authority-http`、许可证、`finsafe-bundlectl` |
| [docs/managed-mode-zh.md](docs/managed-mode-zh.md) · [docs/managed-mode.md](docs/managed-mode.md) | 托管模式架构、路径、CLI 错误码。 |
| [docs/enterprise-deployment-runbook-zh.md](docs/enterprise-deployment-runbook-zh.md) · [docs/enterprise-deployment-runbook.md](docs/enterprise-deployment-runbook.md) | 分阶段部署与运维手册。 |
| [docs/mdm/vendor-neutral-checklist-zh.md](docs/mdm/vendor-neutral-checklist-zh.md) · [docs/mdm/vendor-neutral-checklist.md](docs/mdm/vendor-neutral-checklist.md) | 与 MDM 产品无关的舰队检查清单。 |
| [docs/mdm/jamf-zh.md](docs/mdm/jamf-zh.md) · [docs/mdm/intune-zh.md](docs/mdm/intune-zh.md) · [docs/mdm/ansible-zh.md](docs/mdm/ansible-zh.md) | 各平台部署指南（中文）；[英文索引](docs/mdm/README.md) |
| [docs/testing/managed-mode-matrix-zh.md](docs/testing/managed-mode-matrix-zh.md) · [docs/testing/managed-mode-matrix.md](docs/testing/managed-mode-matrix.md) | 验收测试矩阵。 |
| [docs/testing/licensing-e2e-macos-zh.md](docs/testing/licensing-e2e-macos-zh.md) · [docs/testing/licensing-e2e-macos.md](docs/testing/licensing-e2e-macos.md) | macOS 许可证与托管冒烟 E2E（`e2e-licensing-macos.sh`）。 |
| [docs/README-zh.md](docs/README-zh.md) | 完整文档索引（中文） |
| [packaging/](packaging/) | systemd / LaunchDaemon 单元与 MDM 示例脚本 |

## 安全

- 解压或执行下载的二进制前，请先校验 **`SHA256SUMS`**。
- Wrapper 策略为**声明式**：通过 **`--policy`** 传入 YAML；CLI 按当前主机应用相应的隔离。上线生产前请阅读 [POLICY-QUICKREF-zh.md](docs/POLICY-QUICKREF-zh.md)（或英文 [POLICY-QUICKREF.md](docs/POLICY-QUICKREF.md)）。

## 贡献

本仓库为**发行镜像**（二进制 + 文档）。请参阅 **[CONTRIBUTING-zh.md](CONTRIBUTING-zh.md)** · [English](CONTRIBUTING.md) 了解如何报告缺陷、提交文档建议，以及为何 PR 会 cherry-port 到上游而非直接合并。

## 许可

本仓库中的二进制与资料由 **Finogeeks** 发布，适用您所获得的发行版或订阅中附带的许可条款。若某次发行未附带单独的许可文件，则使用范围以您与发布方签署的协议为准。
