# FinSafe CLI（公开发行版）

English: [README.md](README.md)

FinSafe 是一套**主机执行边界**工具集：Linux 命名空间、cgroup 限制、系统调用过滤、路径约束，以及基于 Seatbelt（macOS）的配置文件约束，并提供可审计的运行结果。**`finsafe`** 命令行是 **local wrapper** 流程的运维入口（`run`、`self-confine`、`probe`、`doctor` 及相关子命令）。

本仓库仅提供**公开发行的二进制文件**与**终端用户文档**，**不包含** FinSafe 引擎源码。

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

### 手动下载

1. 打开 [**Releases**](https://github.com/finogeeks/finsafe/releases)，选择某个版本标签（例如 `v0.2.0`）。
2. 下载对应平台的压缩包：
   - Linux x86_64：`finsafe-v<version>-x86_64-unknown-linux-gnu.tar.zst`
   - macOS Apple 芯片：`finsafe-v<version>-aarch64-apple-darwin.tar.zst`
   - macOS Intel：`finsafe-v<version>-x86_64-apple-darwin.tar.zst`
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

可将 `finsafe` 复制到 **`PATH`** 中的任意目录。Linux 上也请把三个伴随
二进制一起复制到同一目录。

5. 确认：

```bash
./finsafe version
finsafe --help
```

### `release.json`

部分发行版附带 **`release.json`**：列出资源 URL 与 SHA-256 摘要的小型清单，便于自动化下载脚本使用，而无需写死文件名。

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

| 文档 | 说明 |
|------|------|
| [docs/USER-GUIDE.md](docs/USER-GUIDE.md) | 英文运维指南（`run` 与 `self-confine`、策略 YAML 概述、退出码）。 |
| [docs/USER-GUIDE-zh.md](docs/USER-GUIDE-zh.md) | 中文用户指南。 |
| [docs/POLICY-QUICKREF-zh.md](docs/POLICY-QUICKREF-zh.md) | 包装策略（`kind: local-wrapper`）字段速查（中文）。 |
| [docs/POLICY-QUICKREF.md](docs/POLICY-QUICKREF.md) | 同上（英文）。 |
| [examples/README.md](examples/README.md) | 策略示例索引（`high-level-policies/`、`wrapper-policies/`）。 |
| [examples/wrapper-policies/hermes-version-smoke.yaml](examples/wrapper-policies/hermes-version-smoke.yaml) | 最小化的短期 wrapper 策略示例。 |

## 安全

- 解压或执行下载的二进制前，请先校验 **`SHA256SUMS`**。
- Wrapper 策略为**声明式**：通过 **`--policy`** 传入 YAML；CLI 按当前主机应用相应的隔离。上线生产前请阅读 [POLICY-QUICKREF-zh.md](docs/POLICY-QUICKREF-zh.md)（或英文 [POLICY-QUICKREF.md](docs/POLICY-QUICKREF.md)）。

## 许可

本仓库中的二进制与资料由 **Finogeeks** 发布，适用您所获得的发行版或订阅中附带的许可条款。若某次发行未附带单独的许可文件，则使用范围以您与发布方签署的协议为准。
