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

**FinShield 将权限、文件、网络管控，与敏感信息检测、外发处置和本地加密留存放在一起。**

| 功能点 | **FinShield** | Anthropic SRT | Codex | Microsoft MXC | Docker Sandboxes | NVIDIA OpenShell |
| --- | --- | --- | --- | --- | --- | --- |
| 权限管控：高危系统操作限制 | **支持** | 条件支持 | 条件支持 | 条件支持 | 条件支持 | 条件支持 |
| 文件管控：读写、只读、禁止访问 | **支持** | 支持 | 条件支持 | 支持 | 支持 | 支持 |
| 网络管控：限制访问目标 | **支持** | 支持 | 条件支持 | 条件支持 | 支持 | 支持 |
| 内置 PII 敏感信息检测 | **支持¹** | — | — | — | — | — |
| 按敏感内容询问或阻断外发 | **支持¹** | — | — | — | — | — |
| 对话与处理结果在本机加密留存 | **支持** | — | — | — | — | — |

按此前技术方案及已补充资料整理，详细评测待补。“条件支持”保留有条件的能力结论，取决于操作类型、权限配置、运行模式或后端；具备沙箱或隔离机制不直接等于高危系统操作限制完整支持。“—”表示所列官方资料未声明内置该功能，待评测确认。¹ 仅覆盖已接入、可检查的请求。[来源、条件与既有实测](docs/technical-overview-zh.md#功能对照与说明)。

## 继续了解

- [Windows 图文使用手册](docs/WINDOWS-GUIDE-zh.md)：从控件完成准备、启动和重新打开；需要时查看辅助设置与记录。
- [技术方案与产品对比](docs/technical-overview-zh.md)：架构图、防护机制、数据流与方案差异。
- [百炼场完整案例库](https://finsafe-safety-arena.finogeeks.club/#overview)：更多录像、原始请求和独立观测。
- [常见问题与反馈](docs/FAQ-zh.md) · [版本记录](CHANGELOG.md)。

防护依赖实际启动入口、权限和版本；敏感信息检查仅覆盖已接入、可检查的请求。由 Finogeeks 发布，使用范围以发行或交付许可为准。
