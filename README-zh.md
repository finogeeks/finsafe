# FinSafe CLI（公开发行版）

English: [README.md](README.md)

FinSafe 是一套**主机执行边界**工具集：Linux 命名空间、cgroup 限制、系统调用过滤、路径约束，以及基于 Seatbelt（macOS）的配置文件约束，并提供可审计的运行结果。**`finsafe`** 命令行是 **local wrapper** 流程的运维入口（`run`、`self-confine`、`probe`、`doctor` 及相关子命令）。

本仓库仅提供**公开发行的二进制文件**与**终端用户文档**，**不包含** FinSafe 引擎源码。

## 个人模式 vs 托管模式（许可）

| 模式 | 适用对象 | 许可证 |
|------|----------|--------|
| **个人 / local wrapper** | 在本机使用 `finsafe --policy …` 的开发者 | **免费** — 公开发行的 `finsafe` CLI 无需商业许可证 |
| **托管舰队** | 部署 `finsafe-authority-http`、`finsafe-agent` 与 MDM 策略的 IT 团队 | **商业许可** — 由 Finogeeks 签发 `license.jws` 并安装在 Policy Authority 上 |

GitHub [Releases](https://github.com/finogeeks/finsafe/releases) 提供个人 CLI（`finsafe-v*`）、托管舰队（`finsafe-fleet-v*`）、authority 服务（`finsafe-admin-server-v*`，Linux + macOS）与运维 CLI（`finsafe-bundlectl-v*`，Linux + macOS）。详见 **[binary-reference-zh.md](docs/binary-reference-zh.md)**。Authority 与 `license.jws`：[authority-deployment-zh.md](docs/authority-deployment-zh.md)。

### 安装脚本（全平台）

| | **Linux** | **macOS** | **Windows** |
|---|-----------|-----------|-------------|
| **个人**（`finsafe-v*`） | [`install.sh`](install.sh) | [`install.sh`](install.sh) | [`install.ps1`](install.ps1) |
| **IT 试点**（`finsafe-fleet-v*`） | [`install-fleet.sh`](install-fleet.sh)（sudo） | [`install-fleet.sh`](install-fleet.sh)（sudo） | [`install-fleet-windows.ps1`](install-fleet-windows.ps1)（提升权限） |
| **生产舰队** | MDM / Ansible / 镜像 — [packaging/mdm/](packaging/mdm/) | MDM / Jamf / PKG — [packaging/mdm/](packaging/mdm/) | Intune / GPO — [packaging/mdm/](packaging/mdm/) |

IT 试点脚本会下载发行包、校验 `SHA256SUMS`、安装二进制并配置 `finsafe-agent`，适用于实验室与小规模试点，**不能**替代大规模 MDM 交付。

**供 AI Agent 使用的运维技能：**

- [finsafe-enterprise-setup](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-enterprise-setup/SKILL-zh.md) — 托管舰队端到端（发行包 + Finogeeks `license.jws`）
- [finsafe-bundlectl](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-bundlectl/SKILL-zh.md) — 策略包发布 + MDM 哨兵

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
curl -fsSL https://raw.githubusercontent.com/finogeeks/finsafe/main/install.sh | env FINSAFE_VERSION=0.2.0 FINSAFE_INSTALL_DIR="$HOME/.local/bin" sh
curl -fsSL https://raw.githubusercontent.com/finogeeks/finsafe/main/install.sh | sh -s -- --version 0.2.0
```

下载脚本后可执行 **`install.sh --help`**，查看全部环境变量说明。

**Windows（个人模式）：** PowerShell 5.1+，需 `tar`（或 `zstd` + `tar`）：

```powershell
irm https://raw.githubusercontent.com/finogeeks/finsafe/main/install.ps1 | iex
```

固定版本：`$env:FINSAFE_VERSION = '0.6.0'; irm .../install.ps1 | iex`

### 手动下载

1. 打开 [**Releases**](https://github.com/finogeeks/finsafe/releases)，选择某个版本标签（例如 `v0.2.0`）。
2. 下载对应平台的压缩包：
   - Linux x86_64：`finsafe-v<version>-x86_64-unknown-linux-gnu.tar.zst`
   - macOS Apple 芯片：`finsafe-v<version>-aarch64-apple-darwin.tar.zst`
   - macOS Intel：`finsafe-v<version>-x86_64-apple-darwin.tar.zst`
   - Windows x86_64：`finsafe-v<version>-x86_64-pc-windows-msvc.tar.zst`
3. 在同一发行版页面下载 **`SHA256SUMS`**。
4. 校验并解压：

```bash
VERSION=0.2.0   # 改为你下载的版本号
shasum -a 256 -c SHA256SUMS
tar -xvf "finsafe-v${VERSION}-<target>.tar.zst"
# 二进制路径：finsafe-v<version>-<target>/finsafe
# Linux 压缩包还包含 finsafe-helper、finsafe-supervisor 和
# finsafe-landlock-shim；请与 finsafe 放在同一目录，便于自动发现。
```

**Windows（手动解压）：** 使用 `tar --zstd`（Windows 11 / 较新 Windows 10 自带）：

```powershell
$VERSION = "0.2.0"   # 改为你下载的版本号
tar --zstd -xf "finsafe-v$VERSION-x86_64-pc-windows-msvc.tar.zst"
# 二进制：finsafe-v<version>-x86_64-pc-windows-msvc\finsafe.exe
# 可选伴随程序：finsafe-winhelper.exe（同目录，与 finsafe.exe 放在一起）
```

将二进制复制到 **`PATH`** 中的目录。Linux 请同时复制三个伴随二进制；Windows 请复制 **`finsafe.exe`**（以及压缩包内的 **`finsafe-winhelper.exe`**）。PowerShell 无法将无扩展名文件当作可执行程序运行。

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

## 快速上手（Hermes）

以下假设 **`hermes`** 已在 **`PATH`** 中（请自行安装）。示例策略使用当前目录下的 **`./workspace`** —— 执行前先 **`mkdir -p workspace`**，或修改 YAML 中的路径。

**方式 A — 只下载策略文件**（YAML 落在当前目录）：

```bash
curl -fsSL -O https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/hermes-version-smoke.yaml
curl -fsSL -O https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/hermes-oneshot-query.yaml
curl -fsSL -O https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/hermes-interactive.yaml
mkdir -p workspace
finsafe --policy ./hermes-version-smoke.yaml run hermes --version
finsafe --policy ./hermes-oneshot-query.yaml run hermes chat -q "用一句话说你好。"
finsafe --policy ./hermes-interactive.yaml self-confine hermes   # 需要真实 TTY
```

**方式 B — 克隆本仓库**，在仓库根目录执行：

```bash
git clone https://github.com/finogeeks/finsafe.git && cd finsafe
mkdir -p workspace
finsafe --policy ./examples/wrapper-policies/hermes-version-smoke.yaml run hermes --version
finsafe --policy ./examples/wrapper-policies/hermes-oneshot-query.yaml run hermes chat -q "用一句话说你好。"
finsafe --policy ./examples/wrapper-policies/hermes-interactive.yaml self-confine hermes   # 需要真实 TTY
```

- **`run`** → 策略须为 **`program_mode: short-lived`**（一次性 / 批处理）。  
- **`self-confine`** → 策略须为 **`program_mode: interactive`**（长期交互 REPL）；请在真实终端中使用。  
- 错误搭配（例如对交互策略用 `run`）会被 CLI 拒绝。

更多说明：[USER-GUIDE-zh.md](docs/USER-GUIDE-zh.md)、[POLICY-QUICKREF-zh.md](docs/POLICY-QUICKREF-zh.md)。

## 文档

### 终端用户与本地运维（`--policy`）

| 文档 | 说明 |
|------|------|
| [docs/USER-GUIDE.md](docs/USER-GUIDE.md) | 英文运维指南（`run` 与 `self-confine`、策略 YAML 概述、退出码）。 |
| [docs/USER-GUIDE-zh.md](docs/USER-GUIDE-zh.md) | 中文用户指南。 |
| [docs/POLICY-QUICKREF-zh.md](docs/POLICY-QUICKREF-zh.md) | 包装策略（`kind: local-wrapper`）字段速查（中文）。 |
| [docs/POLICY-QUICKREF.md](docs/POLICY-QUICKREF.md) | 同上（英文）。 |
| [examples/README.md](examples/README.md) | 策略示例索引（`high-level-policies/`、`wrapper-policies/`）。 |
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

## 许可

本仓库中的二进制与资料由 **Finogeeks** 发布，适用您所获得的发行版或订阅中附带的许可条款。若某次发行未附带单独的许可文件，则使用范围以您与发布方签署的协议为准。
