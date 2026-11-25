# FinShield · 智安盾

<!-- Generated for the public repository from upstream documentation sources. Edit the source, not the published copy. -->

**让主流 Agent 在清晰的安全边界内工作。**

FinShield（智安盾，原 FinSAFE）为 DSH、OpenCode、Hermes、Kilo、Codex、Claude Code、WorkBuddy 等 Agent 提供文件、系统与桌面的安全边界。优先使用已发布的 Agent 接入插件；没有插件时，也可以通过 `finsafe` 命令行接入。支持 Windows、macOS 和 Linux，各 Agent 的接入形态与验证范围见[兼容矩阵](docs/zh-CN/agents/compatibility.md)。

[English](README.md) · [技术文档](https://finogeeks.github.io/finsafe/) · [FinShield 产品页（finaios.ai）](https://finaios.ai/zh-hans/products/finshield/)

## Agent 操作电脑的四大危险

截屏可能泄露隐私，弹窗可能干扰工作，进程和文件操作也可能破坏正在使用的环境。下面四个 DSH 案例展示普通运行与 FinShield 保护下的差异。

| [隐私泄露](https://safety.finaios.ai/agents/dsh/zh-CN#privacy) | [电脑失控](https://safety.finaios.ai/agents/dsh/zh-CN#interaction) | [系统破坏](https://safety.finaios.ai/agents/dsh/zh-CN#system) | [数据误删](https://safety.finaios.ai/agents/dsh/zh-CN#data) |
| :---: | :---: | :---: | :---: |
| <a href="https://safety.finaios.ai/agents/dsh/zh-CN#privacy"><img src="https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/screen-capture.gif" width="180" alt="截屏泄密对照录像"></a> | <a href="https://safety.finaios.ai/agents/dsh/zh-CN#interaction"><img src="https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/window-flood.gif" width="180" alt="弹窗风暴对照录像"></a> | <a href="https://safety.finaios.ai/agents/dsh/zh-CN#system"><img src="https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/process-terminate.gif" width="180" alt="强制结束进程对照录像"></a> | <a href="https://safety.finaios.ai/agents/dsh/zh-CN#data"><img src="https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/protected-directory-delete.gif" width="180" alt="受保护目录删除对照录像"></a> |
| 截屏泄露屏幕内容 | 弹窗风暴干扰桌面 | 强制结束运行中进程 | 删除受保护目录 |

点击动图查看完整测评。素材复用 DSH 插件的案例预览，为不同测试运行的对照摘录；具体测试条件、配置和防护范围以对应测评页面为准。

## 选择你的 Agent

| Agent | 从这里开始 | 可用接入 |
| --- | --- | --- |
| DSH Desktop（Windows） | [安装插件](https://github.com/finogeeks/finsafe/blob/main/integrations/dsh/windows/README-zh.md) | **已发布**：`@finogeeks2026/finshield-dsh` |
| OpenCode Desktop（Windows） | [插件安装与使用](docs/zh-CN/getting-started/install.md#opencode-desktop) | **已发布**：`@finogeeks2026/finshield-opencode`；也可从 FinShield 桌面启动 |
| Hermes Desktop（Windows） | [桌面安装与启动](docs/zh-CN/getting-started/install.md#hermes-desktop) | FinShield 桌面入口 |
| Kilo CLI（Windows） | [测试插件接入](docs/zh-CN/getting-started/install.md#kilo-cli) | `@finogeeks2026/finshield-kilo`（测试版，本地交互 TUI） |
| Codex CLI（Windows） | [命令行接入指南](docs/zh-CN/agents/codex.md) | **已支持 CLI 接入** |
| Claude Code CLI（Windows） | [命令行接入指南](docs/zh-CN/agents/claude.md) | **已支持 CLI 接入** |
| WorkBuddy 桌面版（Windows） | [桌面安装与启动](docs/zh-CN/getting-started/install.md#windows) | 桌面入口 |
| 其他 Agent／Linux／macOS | [兼容范围与通用 CLI 示例](docs/zh-CN/agents/compatibility.md) | 按具体 Agent 确认 |

CLI 接入与插件发布是不同状态。Codex／Claude 的 CLI 结果不代表桌面版或 IDE 扩展已接入；平台支持也不代表每个 Agent 的全部功能均已验证。

## 优先通过插件接入

DSH Desktop Windows 用户可在应用内进入 **插件 → 添加插件**，安装并启用 [`@finogeeks2026/finshield-dsh`](https://www.npmjs.com/package/@finogeeks2026/finshield-dsh)，按提示安装原生组件、完成授权和所需重启，再确认实际保护状态。版本要求、旧包迁移和停用步骤见[插件指南](https://github.com/finogeeks/finsafe/blob/main/integrations/dsh/windows/README-zh.md)。

**OpenCode Desktop（Windows x64）**用户先保存工作、退出 OpenCode，再在 PowerShell 中安装插件。Desktop 按用户默认安装时使用：

```powershell
$openCodeCli = "$env:LOCALAPPDATA\Programs\ai.opencode.desktop\resources\opencode-cli.exe"
& $openCodeCli plugin add '@finogeeks2026/finshield-opencode'
```

若 Desktop 为全机安装，将路径改为 `$env:ProgramFiles\ai.opencode.desktop\resources\opencode-cli.exe`；自定义安装则使用该目录下的 `resources\opencode-cli.exe`。已有 PATH 中的 `opencode` 命令时，也可运行 `opencode plugin add @finogeeks2026/finshield-opencode`。

打开 OpenCode，进入 **Settings → FinShield**。插件会下载并安装版本匹配的 FinShield 原生组件，按提示完成 Windows 授权；准备完成后保存工作，退出并手动重新打开 OpenCode，再确认保护状态。安装位置与配置目录见[安装及目录说明](docs/zh-CN/getting-started/install.md#opencode-desktop)，另见[已发布插件指南（英文）](https://github.com/finogeeks/finsafe/blob/main/integrations/opencode/windows/README.md)。

Kilo CLI 本地交互 TUI 的测试插件与版本范围见[Kilo 接入说明](docs/zh-CN/getting-started/install.md#kilo-cli)。

Hermes Desktop 和 OpenCode Desktop 也可通过 FinShield 桌面入口启动。Codex、Claude 已支持命令行接入，无需安装插件，见上表指南。独立插件的交付状态与已有 CLI 接入能力分别说明；安装或启动完成后仍需确认保护生效。

## 不使用插件，也可以用命令行

安装 FinShield 后，用 `finsafe` 启动实际执行 Agent 工作的进程。Windows 下，Codex 指南包裹 `app-server` 并通过终端连接，Claude 指南直接包裹 CLI；两者均包含准备检查和保护验证步骤。

[安装与选择接入方式](docs/zh-CN/getting-started/install.md) · [Codex CLI](docs/zh-CN/agents/codex.md) · [Claude Code CLI](docs/zh-CN/agents/claude.md)

Windows 可[下载安装助手](https://github.com/finogeeks/finsafe/releases/latest/download/install-finshield.cmd)；macOS、Linux 及离线包见[最新 Release](https://github.com/finogeeks/finsafe/releases/latest)。其他 Agent 的策略示例见[兼容矩阵](docs/zh-CN/agents/compatibility.md)，需按当前版本适配和验证。

## 防护能力与实测

- **文件与工作区权限**：按授权控制读取和修改范围。
- **系统与桌面限制**：约束 Agent 对进程、系统及桌面的操作。
- **敏感信息检查**：在实际接入、可检查的请求路径上按策略检测与处理。
- **运行记录与审计**：按产品配置保留可检查的运行记录。

[Agent Safety Arena](https://safety.finaios.ai/)提供多 Agent 的对照录像、测试条件与结果。

## 企业部署与继续了解

- [安装与上手](docs/zh-CN/getting-started/install.md)：各平台下载、安装、首次启动与授权范围验证。
- [兼容矩阵](docs/zh-CN/agents/compatibility.md)：Agent 形态、平台、插件状态与验证依据。
- [整体图解介绍](docs/zh-CN/overview/finshield.html)：产品能力、企业管理与实测对照。
- [文档目录与白皮书](docs/zh-CN/README.md)：Windows、Linux/macOS 产品介绍与完整方案。
- [DSH Windows 插件](https://github.com/finogeeks/finsafe/blob/main/integrations/dsh/windows/README-zh.md)：插件安装、授权、更新与停用说明。
- [智安盾白皮书](docs/zh-CN/reference/whitepaper.md)：完整产品方案、企业接入与技术依据。
- [问题反馈](https://github.com/finogeeks/finsafe/issues/new/choose) · [用 Agent 提报](https://github.com/finogeeks/finsafe/blob/main/CONTRIBUTING-zh.md#推荐入口issue) · [版本记录](https://github.com/finogeeks/finsafe/blob/main/CHANGELOG.md)。

防护依赖实际启动入口、权限和版本；敏感信息检查仅覆盖已接入、可检查的请求。由 Finogeeks 发布，使用范围以发行或交付许可为准。


PII 插件扩展敏感信息识别与脱敏规则，与上面的 Agent 接入插件用途不同。

## 开发 PII 插件（Windows）

[PII 插件开发包](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/README-zh.md)包含 SDK、协议、示例、本地调试工具和
接入说明。正式接入须使用支持外部 PII 插件的 Windows FinShield 版本。
`pii-plugins/release.json` 记录配套产品版本和源码版本。

FinShield 个人版按其产品条款免费使用。基于本开发包开发的插件，如用于商业用途，
必须事先取得凡泰极客的书面许可。个人版免费使用不代表获得插件商用授权。
完整条款见[开发包许可](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/LICENSE)。授权联系：
[contact@finogeeks.com](mailto:contact@finogeeks.com)。
