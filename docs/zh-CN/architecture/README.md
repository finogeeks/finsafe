# 安全原理与架构

[English](../../en/architecture/README.md) · [文档首页](../README.md)

从具体问题理解安全机制，再回到配置和操作指南。机制说明、已发布入口和某次实测结果各有范围，阅读时核对所用平台、版本与接入方式。

## 安全原理

| 主题 | 要回答的问题 |
| --- | --- |
| [Windows 网络隔离与 WFP](windows-network.md) | 谁的连接受限制，WFP 与代理分别做什么，如何验证？ |
| [Windows 桌面交互与 Job UI](windows-job-ui.md) | 哪些交互受限，兼容性选择改变什么，如何检查有效值？ |
| [Inspector 网络与内容检查](inspector.md) | 哪些请求被检查，证书和原文如何处理，失败时发生什么？ |

使用效果见[Windows 系统与桌面防护](../protection/windows-security.md)、[网络访问与 PII](../protection/network-pii.md)。操作入口见[开发与集成](../development/README.md)和[高级配置与 CLI 参考](../reference/cli-configuration.md)。

## 插件架构

以下设计来自公开集成包，保留各页记录的版本范围和验收限制。它们用于解释现有插件，不自动构成通用宿主 SDK 的完整接入契约。

- [DSH 插件架构](https://github.com/finogeeks/finsafe/blob/main/integrations/dsh/windows/DESIGN.md)
- [OpenCode 插件架构](https://github.com/finogeeks/finsafe/blob/main/integrations/opencode/windows/DESIGN.md)

## 产品图解与平台边界

- [Windows](../overview/windows.html)
- [Linux / macOS](../overview/linux-macos.html)
- [FinShield](../overview/finshield.html)
- [技术白皮书](../reference/whitepaper.md)

## 插件协议与集成

- [PII 插件协议](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/docs/protocol.md)
- [PII 插件集成](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/docs/integration.md)
