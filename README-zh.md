# FinShield · 智安盾

**Agent 操作电脑有风险，给它加个沙箱很简单。**

能改文件、执行命令的 Agent，一次误操作或恶意指令就可能让资料、隐私和桌面受到影响。FinShield 为 Agent 加上沙箱，让它在你授权的范围内工作。支持 Windows、macOS 和 Linux；原名 FinSafe，现有命令和部分发行文件仍使用 `finsafe`。

[English](README.md) · [Windows 图文手册](docs/WINDOWS-GUIDE-zh.md) · [技术方案与产品对比](docs/technical-overview-zh.md) · [百炼场 · 完整案例库](https://finsafe-safety-arena.finogeeks.club/#overview)

## 下载与上手

| 平台 | 发行方式 | 上手 |
| --- | --- | --- |
| **Windows x64** | EXE，双击安装后使用桌面控件 | [图文使用手册](docs/WINDOWS-GUIDE-zh.md) |
| **macOS · Apple 芯片** | 命令行发行包 | [上手说明](docs/getting-started-zh.md#macos) |
| **Linux x86_64** | 命令行发行包 | [上手说明](docs/getting-started-zh.md#linux) |

[查看发行包](https://github.com/finogeeks/finsafe/releases) · [下载版本说明](docs/FAQ-zh.md#为什么下载页只有旧版本)。公开附件目前仍是旧版本，新版 EXE 以上架或正式交付为准；macOS Intel 新包暂缓。

**Windows 用起来就几步：安装 EXE → 首次准备并确认权限 → 在桌面控件中选择 Agent，启动后照常使用。** 日常从控件启动、重新打开，网页只在设置、查记录或排障时使用。[看图操作](docs/WINDOWS-GUIDE-zh.md)。

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
