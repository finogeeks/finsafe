# 适用于 DSH Desktop 的 FinShield

**[使用文档](https://finshield.finogeeks.club/zh-CN/agents/dsh.html) · [到底防护了什么](https://finshield.finogeeks.club/zh-CN/protection/) · [English](README.md)**

FinShield 为 DSH 的 Agent 执行进程增加 Windows 沙箱防护。安装、配置、更新和卸载的完整说明见使用文档。

## 环境要求

Windows x64；DSH Desktop `>=0.2.1-rc.5 <0.3.0`；插件包要求 Node `>=24.9.0`。其他 FinShield 平台版本不代表此插件支持 macOS/Linux。

## 安装

1. 保存正在进行的工作，在 DSH Desktop 中打开**插件 → 添加插件**。
2. 安装并启用 `@finogeeks2026/finshield-dsh`。
3. 按提示完成原生组件安装和 Windows 授权。
4. 收到提示后退出 DSH，再手动打开。进入**插件 → 已安装 → FinShield**，确认实际保护状态。

请使用桌面版插件管理器；独立 CLI 可能指向其他配置。详细步骤及旧包迁移见[完整安装指南](https://finshield.finogeeks.club/zh-CN/agents/dsh.html)。

## 防护范围

受保护进程具有文件、系统、设备隐私和桌面交互边界。访问权限按实际配置生效，可写文件仍可能被修改或删除。默认网络模式为 `host`：此插件不提供 FinShield 网站黑名单、代理／TLS 内容检查或 PII 脱敏。

[默认防护](https://finshield.finogeeks.club/zh-CN/protection/defaults.html) · [配置项说明](https://finshield.finogeeks.club/zh-CN/protection/configuration.html) · [网络与 PII](https://finshield.finogeeks.club/zh-CN/protection/network-pii.html)。

## 更新、停用与支持

通过 DSH 更新插件，并按提示完成原生组件准备；需要时退出后手动重新打开。停用插件不会把已运行的进程移出沙箱。移除插件会保留原生组件、配置和日志，完整卸载步骤见[运行指南](https://finshield.finogeeks.club/zh-CN/agents/dsh-operations.html)。

[DSH 测评](https://safety.finaios.ai/agents/dsh/zh-CN)展示特定条件下的对照结果，不保证每项操作。建议从插件页点击“反馈问题”，自动附带当前版本和状态，也可[直接反馈](https://github.com/finogeeks/finsafe/issues/new?template=plugin_feedback_zh.yml)。

使用须遵守[产品许可](LICENSE.rtf)，另见[第三方声明](THIRD-PARTY-NOTICES.md)。
