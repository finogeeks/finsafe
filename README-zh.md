# FinShield · 智安盾

**Agent 操作电脑有风险，给它加个沙箱很简单。**

能改文件、执行命令的 Agent，一次误操作或恶意指令就可能让资料、隐私和桌面受到影响。FinShield 为 Agent 加上沙箱，让它在你授权的范围内工作。支持 Windows、macOS 和 Linux；原名 FinSafe，命令仍使用 `finsafe`，发行包统一使用 `finshield` 名称。

[English](README.md) · [Windows 图文手册](docs/WINDOWS-GUIDE-zh.md) · [技术方案与产品对比](docs/technical-overview-zh.md) · [百炼场 · 完整案例库](https://finsafe-safety-arena.finogeeks.club/#overview)

## 下载与上手

最新稳定版为 [**FinShield v0.9.102**](https://github.com/finogeeks/finsafe/releases/tag/v0.9.102)。

### Windows：安装助手（推荐）

[**下载 Windows 安装助手 — install-finshield.cmd**](https://github.com/finogeeks/finsafe/releases/latest/download/install-finshield.cmd)

1. 下载 `install-finshield.cmd` 并双击运行。需要联网，无需另下脚本或输入命令。
2. 助手默认显示英文；输入 **L** 并按 **Enter** 可切换为中文，再按 **Enter** 开始安装。助手会自动下载最新稳定版 Windows 安装包，并校验 SHA-256。
3. 出现管理员授权窗口时选择“是”，然后按交互式安装向导操作。如提示需要重启，请先保存工作，再重启 Windows。

需要离线安装或指定本版本时，直接下载并运行 [**finshield-0.9.102-x64-setup.exe**](https://github.com/finogeeks/finsafe/releases/download/v0.9.102/finshield-0.9.102-x64-setup.exe)。EXE 已包含安装所需内容，无需另外下载 MSI。安装助手始终选择最新稳定版，即使它是从旧版本 Release 页面下载的。

如果 Windows 智能应用控制拦截安装，助手会提供设置指引，设置变更需由你自行确认。关闭智能应用控制会影响整台电脑的保护，旧版 Windows 可能需要重置或重装系统才能重新启用；安全策略也可能拦截安装助手本身。

**安装完成后：** 按桌面控件提示完成首次准备，确认所需权限，再选择并启动 Agent。日常从控件启动、重新打开，网页用于设置、查记录或排障。[看图操作](docs/WINDOWS-GUIDE-zh.md)。

### macOS 与 Linux

准备好 `curl`、`tar` 和 `zstd`（或支持 `--zstd` 的 `tar`），运行下面的命令安装最新稳定版 CLI：

```sh
curl -fsSL https://raw.githubusercontent.com/finogeeks/finsafe/main/install.sh | sh
```

脚本会识别平台、校验下载文件，默认把 `finsafe` 命令安装到 `~/.local/bin`。环境准备与首次使用见 [macOS 上手说明](docs/getting-started-zh.md#macos)或 [Linux 上手说明](docs/getting-started-zh.md#linux)。macOS Intel 新包仍暂缓发布。

### v0.9.102 手动下载

| 平台 | 下载 | 上手 |
| --- | --- | --- |
| **Windows x64** | [离线安装 EXE](https://github.com/finogeeks/finsafe/releases/download/v0.9.102/finshield-0.9.102-x64-setup.exe) | [图文使用手册](docs/WINDOWS-GUIDE-zh.md) |
| **macOS · Apple 芯片** | [finshield-0.9.102-macos-arm64.tar.zst](https://github.com/finogeeks/finsafe/releases/download/v0.9.102/finshield-0.9.102-macos-arm64.tar.zst) | [上手说明](docs/getting-started-zh.md#macos) |
| **Linux x86_64** | [finshield-0.9.102-linux-x64.tar.zst](https://github.com/finogeeks/finsafe/releases/download/v0.9.102/finshield-0.9.102-linux-x64.tar.zst) | [上手说明](docs/getting-started-zh.md#linux) |

手动下载后请用 [SHA256SUMS](https://github.com/finogeeks/finsafe/releases/download/v0.9.102/SHA256SUMS) 校验文件；[release.json](https://github.com/finogeeks/finsafe/releases/download/v0.9.102/release.json) 提供下载元数据，这两个文件不是额外的安装包。其他版本见[发行页面](https://github.com/finogeeks/finsafe/releases)。macOS/Linux 归档内部仍保留 `finsafe` 命令与原有目录名称。

## 没有沙箱会怎样？看真实录像

**100 窗口风暴：** 普通组桌面被窗口叠压；保护组采用私有桌面，干扰未到达用户桌面。

[![100 个窗口组合风暴对照录像](assets/demos/window-storm.gif)](https://finsafe-safety-arena.finogeeks.club/cases/UI-21/index.html)

**工作窗口晃动：** 普通组窗口大幅移动；保护组的控制调用被拒，目标保持原状。

[![工作窗口晃动对照录像](assets/demos/window-shake.gif)](https://finsafe-safety-arena.finogeeks.club/cases/UI-11/index.html)

**剪贴板篡改：** 普通组复制内容被替换；保护组的剪贴板访问被拒，未读到替换文字。

[![剪贴板篡改对照录像](assets/demos/clipboard.gif)](https://finsafe-safety-arena.finogeeks.club/cases/UI-10/index.html)

点击录像查看完整案例。素材来自 Windows／DSH `0.9.79` 独立测试，非同步录像；不同应用与配置的防护范围见[素材说明](assets/demos/README.md)。

## 功能对照

沿用原 Windows 技术方案中的产品对比表，详细评测后续补充。

| 产品 | 运行方式 | Agent 接入 | 高危操作限制 | 文件权限管控 | PII 检测 | 数据留存 |
| --- | --- | --- | --- | --- | --- | --- |
| 智安盾 | 原生 Windows | 支持 | 支持 | 支持 | 支持 | 支持 |
| SRT（Anthropic） | 原生 Windows | 只支持 CLI Agent | 部分支持 | 支持 | 不支持 | 不支持 |
| Codex（OpenAI） | 原生 Windows | DSH 任务执行失败 | 部分支持 | 部分支持 | 不支持 | 不支持 |
| MXC（Microsoft） | Windows 执行后端 | DSH 启动失败 | — | — | — | — |
| Docker Sandboxes | Linux 微虚拟机 | 不支持 Windows Agent | 隔离宿主系统 | 支持 | 不支持 | 不支持 |
| OpenShell | WSL2＋Linux 容器 | 不支持 Windows Agent | 隔离宿主系统 | 支持 | 不支持 | 不支持 |

“—”表示 Agent 启动失败，后续测试未执行。

## 继续了解

- [Windows 图文使用手册](docs/WINDOWS-GUIDE-zh.md)：从控件完成准备、启动和重新打开；需要时查看辅助设置与记录。
- [技术方案与产品对比](docs/technical-overview-zh.md)：架构图、防护机制、数据流与方案差异。
- [百炼场完整案例库](https://finsafe-safety-arena.finogeeks.club/#overview)：更多录像、原始请求和独立观测。
- [常见问题与反馈](docs/FAQ-zh.md) · [版本记录](CHANGELOG.md)。

防护依赖实际启动入口、权限和版本；敏感信息检查仅覆盖已接入、可检查的请求。由 Finogeeks 发布，使用范围以发行或交付许可为准。
