# FinShield · 智安盾

**让 Agent 帮你做事，也给它划清边界。**

FinShield（智安盾）为 Agent 加上沙箱，约束它对文件、系统和桌面的访问与操作，让它在你授权的范围内工作。支持 Windows、macOS 和 Linux；DSH Windows 用户也可以直接通过插件接入。

[English](README.md) · [FinShield 产品页（finaios.ai）](https://finaios.ai/zh-hans/products/finshield/)

> **[Agent 安全测评](https://safety.finaios.ai/agents/dsh/zh-CN)** — 查看 DSH 四类危险操作的对照录像、测试条件和结果。

## Agent 操作电脑的四大危险

截屏可能泄露隐私，弹窗可能干扰工作，进程和文件操作也可能破坏正在使用的环境。下面四个案例展示普通运行与 FinShield 保护下的差异。

| [隐私泄露](https://safety.finaios.ai/agents/dsh/zh-CN#privacy) | [电脑失控](https://safety.finaios.ai/agents/dsh/zh-CN#interaction) | [系统破坏](https://safety.finaios.ai/agents/dsh/zh-CN#system) | [数据误删](https://safety.finaios.ai/agents/dsh/zh-CN#data) |
| :---: | :---: | :---: | :---: |
| <a href="https://safety.finaios.ai/agents/dsh/zh-CN#privacy"><img src="integrations/dsh/windows/detail/assessments/screen-capture.gif" width="180" alt="截屏泄密对照录像"></a> | <a href="https://safety.finaios.ai/agents/dsh/zh-CN#interaction"><img src="integrations/dsh/windows/detail/assessments/window-flood.gif" width="180" alt="弹窗风暴对照录像"></a> | <a href="https://safety.finaios.ai/agents/dsh/zh-CN#system"><img src="integrations/dsh/windows/detail/assessments/process-terminate.gif" width="180" alt="强制结束进程对照录像"></a> | <a href="https://safety.finaios.ai/agents/dsh/zh-CN#data"><img src="integrations/dsh/windows/detail/assessments/protected-directory-delete.gif" width="180" alt="受保护目录删除对照录像"></a> |
| 截屏泄露屏幕内容 | 弹窗风暴干扰桌面 | 强制结束运行中进程 | 删除受保护目录 |

点击动图查看完整测评。素材复用 DSH 插件的案例预览，为不同测试运行的对照摘录；具体测试条件、配置和防护范围以对应测评页面为准。

## 在 DSH 中使用 FinShield

**FinShield DSH Windows 插件**为 DSH 的 Agent 执行环境接入本地沙箱，保留原有桌面版、账户和会话。你可以在 DSH 内查看安装、授权和实际保护状态。

在 DSH 桌面版进入 **插件 → 添加插件**，输入 npm 包名 [`@finogeeks2026/finshield`](https://www.npmjs.com/package/@finogeeks2026/finshield)，安装并启用。首次启用需管理员授权；完成配置后，按提示重启 DSH，并在插件页面确认实际保护状态。

适用于 Windows x64。兼容版本、安装步骤与停用方式见[插件说明](integrations/dsh/windows/README-zh.md)；防护案例见[DSH 安全测评](https://safety.finaios.ai/agents/dsh/zh-CN)。

## 安装 FinShield

Windows [下载安装助手](https://github.com/finogeeks/finsafe/releases/latest/download/install-finshield.cmd)后双击运行；macOS、Linux、离线安装包及详细步骤见[最新 Release](https://github.com/finogeeks/finsafe/releases/latest)。完整操作见[安装与上手](docs/getting-started-zh.md)。

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

- [安装与上手](docs/getting-started-zh.md)：各平台下载、安装、首次启动与授权范围验证。
- [Windows 图解介绍](docs/finsafe-windows-overview.html)：产品能力、架构与接入方式。
- [文档目录与白皮书](docs/README-zh.md)：Windows、Linux/macOS 产品介绍与完整方案。
- [DSH Windows 插件](integrations/dsh/windows/README-zh.md)：插件安装、授权、更新与停用说明。
- [Agent 安全测评](https://safety.finaios.ai/agents/dsh/zh-CN)：DSH 四类危险操作的对照录像、测试条件和结果。
- [问题反馈](https://github.com/finogeeks/finsafe/issues/new/choose) · [用 Agent 提报](CONTRIBUTING-zh.md#推荐入口issue) · [版本记录](CHANGELOG.md)。

防护依赖实际启动入口、权限和版本；敏感信息检查仅覆盖已接入、可检查的请求。由 Finogeeks 发布，使用范围以发行或交付许可为准。


<!-- finshield-pii-plugins:start -->
## 开发 PII 插件（Windows）

[PII 插件开发包](pii-plugins/README-zh.md)包含 SDK、协议、示例、本地调试工具和
接入说明。正式接入须使用支持外部 PII 插件的 Windows FinShield 版本。
`pii-plugins/release.json` 记录配套产品版本和源码版本。

FinShield 个人版按其产品条款免费使用。基于本开发包开发的插件，如用于商业用途，
必须事先取得凡泰极客的书面许可。个人版免费使用不代表获得插件商用授权。
完整条款见[开发包许可](pii-plugins/LICENSE)。授权联系：
[contact@finogeeks.com](mailto:contact@finogeeks.com)。
<!-- finshield-pii-plugins:end -->
