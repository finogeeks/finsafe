# 开发与集成

[English](../../en/development/README.md) · [Documentation](../README.md)

从你需要完成的任务选择入口。使用已有插件、从 CLI 启动程序、开发宿主接入和扩展 PII，是不同的工作；各自的平台、版本和支持范围也不同。

## 开始接入

- [接入方式与最小示例](integration-guide.md)：选择现有 Agent、CLI、宿主 SDK 或 PII 扩展路径，运行公开示例并验证权限。
- [使用 AI 完成集成](ai-integration.md)：给编码 Agent 正确的文档、环境与任务输入，核对生成步骤并记录实际结果。
- [高级配置与 CLI 参考](../reference/cli-configuration.md)：区分正式、实验性和内部选项，核对默认值、覆盖关系与生效方式。
- [兼容矩阵](../agents/compatibility.md)：核对 Agent 形态、操作系统和版本范围。

## 理解安全边界

| 你的问题 | 技术说明 |
| --- | --- |
| 网络访问在哪里被限制？ | [Windows 网络隔离与 WFP](../architecture/windows-network.md) |
| 桌面交互为什么受到限制？ | [Windows 桌面交互与 Job UI](../architecture/windows-job-ui.md) |
| 请求怎样经过检查和脱敏？ | [Inspector 网络与内容检查](../architecture/inspector.md) |
| 当前插件默认启用了什么？ | [插件默认防护](../protection/defaults.md)、[配置项作用与生效](../protection/configuration.md) |

组件安装完成、权限准备完成、进程实际受保护和内容检查生效需要分别验证。源码中存在一个组件或选项，不表示它已经成为你的产品版本支持的集成接口。

## 扩展 PII 检测与脱敏

[Windows PII 开发包](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/README-zh.md)统一维护 SDK、协议、示例和本地调试工具。开发步骤见其[调试指南](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/docs/debugging-zh.md)，本目录不复制协议正文。PII 检测／脱敏插件扩展内容处理，与 Agent 接入插件用途不同。使用时匹配开发包与产品版本，并验证真实请求覆盖范围。插件商用须事先取得书面许可，见[开发包许可](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/LICENSE)。

## 企业集成需求

需要讨论团队部署、企业管理或专项接入时，查看[企业方案](../enterprise/README.md)并联系 Finogeeks 确认交付范围。
