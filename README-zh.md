# FinShield · 智安盾

**[使用文档](https://finshield.finogeeks.club/zh-CN/) · [到底防护了什么](https://finshield.finogeeks.club/zh-CN/protection/) · [下载](https://github.com/finogeeks/finsafe/releases/latest)**

[English](README.md)

FinShield（智安盾，原 FinSAFE）为 Agent 执行进程提供可配置的文件、系统和桌面操作边界。从对应 Agent 的使用指南开始，完成接入后确认实际保护状态。支持范围和防护效果取决于平台、版本及配置。

## 选择你的 Agent

| Agent | 使用指南 | 接入方式 |
| --- | --- | --- |
| WorkBuddy | [安装与启动](https://finshield.finogeeks.club/zh-CN/agents/workbuddy.html) | Windows 桌面入口 |
| DSH Desktop | [安装与使用](https://finshield.finogeeks.club/zh-CN/agents/dsh.html) | Windows 插件：`@finogeeks2026/finshield-dsh` |
| Codex CLI | [命令行接入](https://finshield.finogeeks.club/zh-CN/agents/codex.html) | Windows CLI 接入 |
| Claude Code CLI | [命令行接入](https://finshield.finogeeks.club/zh-CN/agents/claude.html) | Windows CLI 接入 |
| OpenCode Desktop | [安装与使用](https://finshield.finogeeks.club/zh-CN/agents/opencode.html) | Windows 插件：`@finogeeks2026/finshield-opencode` |
| Hermes Desktop | [安装与启动](https://finshield.finogeeks.club/zh-CN/agents/hermes.html) | Windows 桌面入口 |
| Kilo CLI | [测试插件指南](https://finshield.finogeeks.club/zh-CN/agents/kilo.html) | Windows 本地交互 TUI，测试版 |

Linux、macOS 及其他 Agent 形态见[兼容矩阵](https://finshield.finogeeks.club/zh-CN/agents/compatibility.html)。CLI 接入结果不代表桌面版或 IDE 扩展已接入。

## 了解实际防护范围

- [插件默认防护](https://finshield.finogeeks.club/zh-CN/protection/defaults.html)：受保护目录、可写范围和系统／桌面限制。
- [配置项说明](https://finshield.finogeeks.club/zh-CN/protection/configuration.html)：可用设置及其作用。
- [网络访问与 PII](https://finshield.finogeeks.club/zh-CN/protection/network-pii.html)：网站访问、数据外泄、检测与脱敏的边界。

**DSH 和 OpenCode Windows 插件默认使用主机网络。** 显示“受保护”不代表启用了 FinShield 网站黑名单、HTTPS 内容检查或 PII 脱敏。文件防护按实际路径规则生效，不代表工作区外所有文件都只读。

## Agent 操作电脑的四大危险

截屏可能泄露隐私，弹窗可能干扰工作，进程和文件操作也可能破坏正在使用的环境。下面四个 DSH 案例展示普通运行与 FinShield 保护下的差异。

| [隐私泄露](https://safety.finaios.ai/agents/dsh/zh-CN#privacy) | [电脑失控](https://safety.finaios.ai/agents/dsh/zh-CN#interaction) | [系统破坏](https://safety.finaios.ai/agents/dsh/zh-CN#system) | [数据误删](https://safety.finaios.ai/agents/dsh/zh-CN#data) |
| :---: | :---: | :---: | :---: |
| <a href="https://safety.finaios.ai/agents/dsh/zh-CN#privacy"><img src="https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/screen-capture.gif" width="180" alt="截屏泄密对照录像"></a> | <a href="https://safety.finaios.ai/agents/dsh/zh-CN#interaction"><img src="https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/window-flood.gif" width="180" alt="弹窗风暴对照录像"></a> | <a href="https://safety.finaios.ai/agents/dsh/zh-CN#system"><img src="https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/process-terminate.gif" width="180" alt="强制结束进程对照录像"></a> | <a href="https://safety.finaios.ai/agents/dsh/zh-CN#data"><img src="https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/protected-directory-delete.gif" width="180" alt="受保护目录删除对照录像"></a> |
| 截屏泄露屏幕内容 | 弹窗风暴干扰桌面 | 强制结束运行中进程 | 删除受保护目录 |

点击动图查看完整测评。素材复用 DSH 插件的案例预览，为不同测试运行的对照摘录；具体测试条件、配置和防护范围以对应测评页面为准。

## 开始使用与获取帮助

- [安装指南](https://finshield.finogeeks.club/zh-CN/getting-started/install.html) · [最新下载](https://github.com/finogeeks/finsafe/releases/latest)。
- [使用文档](https://finshield.finogeeks.club/zh-CN/) · [公开架构](https://finshield.finogeeks.club/zh-CN/architecture/) · [白皮书](https://finshield.finogeeks.club/zh-CN/reference/whitepaper.html)。
- [反馈问题](https://github.com/finogeeks/finsafe/issues/new/choose) · [参与贡献](CONTRIBUTING-zh.md) · [版本记录](CHANGELOG.md)。

## 开发 PII 插件

[Windows PII 插件开发指南](https://finshield.finogeeks.club/zh-CN/development/pii.html)包含 SDK、协议、示例、本地调试工具和接入说明。这类插件扩展敏感信息识别与脱敏规则，与 Agent 接入插件用途不同。正式接入须使用兼容的 Windows FinShield 版本；`pii-plugins/release.json` 记录配套产品及源码版本。

FinShield 个人版按其产品条款免费使用。基于本开发包开发的插件，如用于商业用途，
必须事先取得凡泰极客的书面许可。个人版免费使用不代表获得插件商用授权。
完整条款见[开发包许可](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/LICENSE)。授权联系：
[contact@finogeeks.com](mailto:contact@finogeeks.com)。
