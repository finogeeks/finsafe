# FinShield · 智安盾

[English](README.md) · [下载](https://github.com/finogeeks/finsafe/releases) · [快速上手](docs/getting-started-zh.md) · [常见问题](docs/FAQ-zh.md)

**让 AI 智能体在你授权的范围内使用电脑和数据。**

FinShield（智能体安全盾，简称智安盾）为 Windows、macOS 和 Linux 上的 AI 智能体提供本机执行防护。智能体可以继续调用工具、处理文件和访问模型服务；FinShield 按配置约束文件访问、系统操作和网络通信，并为已接入的模型请求提供内容检查与记录能力。

产品原名 FinSafe。现有 `finsafe` 命令、部分安装文件名和仓库地址继续沿用，产品名称统一使用 **FinShield**。

## 下载

| 平台 | 发行文件 | 入口 |
| --- | --- | --- |
| **Windows x64** | `finsafe-<版本>-x64-setup.exe`，下载后双击安装 | [查看发行包](https://github.com/finogeeks/finsafe/releases) · [Windows 使用指南](docs/WINDOWS-GUIDE-zh.md) |
| **macOS · Apple 芯片** | `finsafe-v<版本>-aarch64-apple-darwin.tar.zst` | [查看发行包](https://github.com/finogeeks/finsafe/releases) · [上手说明](docs/getting-started-zh.md#macos) |
| **Linux x86_64** | `finsafe-v<版本>-x86_64-unknown-linux-gnu.tar.zst` | [查看发行包](https://github.com/finogeeks/finsafe/releases) · [上手说明](docs/getting-started-zh.md#linux) |

截至 2026-10-29，公开 Releases 最新仍为 `v0.9.47`，尚未上架本文所述新版 Windows EXE。已有新版交付包可直接双击安装；公开下载以发行页实际附件为准。macOS Intel 新包暂缓提供，历史 Intel 包不代表当前版本支持。

Windows 以 EXE 安装包为入口；macOS 和 Linux 当前以命令行发行包为入口。各平台的界面、应用接入和防护能力有所不同。

## 先看实际效果

下面是 Windows 案例的真实录像节选：左侧为普通 DSH，右侧为 FinShield 保护组。点击图片可查看完整案例、原始请求和观测结果。

### 100 个窗口，也不能占领用户桌面

普通组的 100 个测试窗口持续移动、缩放、叠压；保护组在本例的**私有桌面模式**下运行，用户桌面未出现窗口风暴。这里证明的是干扰没有到达用户桌面，不能解读为所有创建窗口的调用都失败了。

[![100 个窗口组合风暴：普通组与保护组录像节选](assets/demos/window-storm.gif)](https://finsafe-safety-arena.finogeeks.club/cases/UI-21/index.html)

### 工作窗口保持原位

普通组让专用测试窗口大幅晃动约 25 秒；保护组的窗口控制调用被拒，目标窗口保持隐藏且位置未变。

[![窗口晃动：普通组与保护组录像节选](assets/demos/window-shake.gif)](https://finsafe-safety-arena.finogeeks.club/cases/UI-11/index.html)

### 复制的内容，不被这次操作偷偷替换

普通组实际写入剪贴板 466 次；保护组 501 次打开剪贴板均被拒，测试面板未读到替换文字。

[![剪贴板替换：普通组与保护组录像节选](assets/demos/clipboard.gif)](https://finsafe-safety-arena.finogeeks.club/cases/UI-10/index.html)

录像来自 FinSafe 更名前的 `0.9.79` Windows／DSH 测试，画面中的旧名称予以保留。两组来自独立实验，节选不是同步录像；结果仅覆盖对应版本、配置与调用路径。[剪辑来源与范围](assets/demos/README.md) · [浏览更多案例](https://finsafe-safety-arena.finogeeks.club/#overview)。

## Windows：保护电脑，也管住数据的使用范围

| 能力 | 对使用者的意义 |
| --- | --- |
| **高危操作防护** | 在受控执行路径上，限制改动系统配置、文件权限、其他进程和系统服务等操作 |
| **文件访问控制** | 按配置区分可读写、只读和禁止访问的目录，让智能体只使用授权资料 |
| **网络访问控制** | 约束受控智能体可以访问的目标，保留正常业务与模型通信 |
| **敏感信息检查** | 对已接入、可检查的模型请求，按规则记录、询问或阻止检测到的敏感信息 |
| **本地留存** | 开启后，在本机加密保存已采集的模型请求、回复与处理结果，便于查看和追溯 |
| **桌面入口** | 通过悬浮入口和控制台完成安全准备、启动 WorkBuddy／DSH、查看状态与记录 |

当前 Windows 桌面入口接入 **WorkBuddy 和 DSH CLI**。其他智能体的接入情况以对应版本说明为准。案例中的私有桌面配置不代表每个桌面应用默认采用相同配置。

**第一次使用：** 下载 EXE → 双击安装 → 确认权限并完成安全准备 → 从 FinShield 安全启动智能体。

启动后可以通过悬浮入口重新打开已运行的智能体，或进入控制台查看状态。直接从原厂快捷方式另起的进程，不应视为已受 FinShield 保护。[查看完整 Windows 流程](docs/WINDOWS-GUIDE-zh.md)。

## macOS 与 Linux

macOS 使用 Seatbelt 约束本机程序；Linux 结合 bubblewrap、seccomp、cgroup 和可用的 Landlock 能力执行策略。两者提供命令行使用方式，可按发行版本接入受支持的 Agent，并使用网络代理和隐私检查能力。

下载对应发行包后，按[跨平台上手说明](docs/getting-started-zh.md)检查环境，再通过 FinShield 启动智能体。Windows 的桌面界面和内容检查规则不直接等同于 macOS／Linux 的 Privacy Guard。

## 使用前了解

防护取决于**启动入口、有效权限、平台和具体版本**。只有已进入受控执行或检查路径的操作才受相应规则约束；安装成功不等于所有智能体已经受到保护。敏感信息检查不保证识别全部数据，默认“记录”也不会阻止发送。

[快速上手](docs/getting-started-zh.md) · [Windows 使用指南](docs/WINDOWS-GUIDE-zh.md) · [常见问题与反馈](docs/FAQ-zh.md) · [版本记录](CHANGELOG.md)

本仓库用于发布 FinShield 安装包入口与用户资料，由 Finogeeks 维护。产品使用范围以随发行版或交付提供的许可条款为准。
