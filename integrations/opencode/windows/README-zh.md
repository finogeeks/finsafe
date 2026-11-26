# 适用于 OpenCode Desktop 的 FinShield

**[使用文档](https://finshield.finogeeks.club/zh-CN/agents/opencode.html) · [到底防护了什么](https://finshield.finogeeks.club/zh-CN/protection/) · [English](README.md)**

FinShield 为 OpenCode Desktop 的执行后端增加 Windows 沙箱防护。安装、配置、更新和故障排查的完整说明见使用文档。

## 环境要求

Windows x64 和 OpenCode Desktop V2。此集成面向 Desktop/SDK 2.3.0，需要互联网连接来下载插件及原生组件。

## 安装

可以使用 OpenCode V2 CLI 时，运行：

```sh
opencode plugin add @finogeeks2026/finshield-opencode
```

打开 Desktop，在 **Settings → FinShield** 查看状态，按提示完成组件准备和 Windows 授权。准备完成后保存工作，退出 OpenCode 并手动重新打开，确认实际保护。只有桌面应用时，按[不使用 CLI 的安装说明](https://finshield.finogeeks.club/zh-CN/agents/opencode.html#不使用-cli-安装)操作。

## 防护范围

此 Windows 集成保护执行后端，并保留桌面界面。文件、系统和桌面边界按实际配置生效。默认网络模式为 `host`：显示“受保护”不代表启用了 FinShield 网站黑名单、HTTPS 内容检查或 PII 脱敏。

[默认防护](https://finshield.finogeeks.club/zh-CN/protection/defaults.html) · [配置项说明](https://finshield.finogeeks.club/zh-CN/protection/configuration.html) · [网络与 PII](https://finshield.finogeeks.club/zh-CN/protection/network-pii.html)。

## 更新与支持

FinShield 页面会检查插件包更新。有新版本时选择**安装更新**，按提示完成准备，并在要求时重新打开 OpenCode；重新打开后检查保护状态。故障排查和生命周期说明见[完整指南](https://finshield.finogeeks.club/zh-CN/agents/opencode.html)。

建议使用插件中的**反馈问题**入口附带当前版本和状态，也可[直接反馈](https://github.com/finogeeks/finsafe/issues/new/choose)。已公开的 [DSH 测评](https://safety.finaios.ai/agents/dsh/zh-CN)是 DSH 的证据，不代表 OpenCode 的测试结果。

使用须遵守[产品许可](LICENSE.rtf)，另见[第三方声明](THIRD-PARTY-NOTICES.md)。
