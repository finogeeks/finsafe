# FinShield 文档中心

[English](../en/README.md) · [产品首页](https://github.com/finogeeks/finsafe) · [最新下载](https://github.com/finogeeks/finsafe/releases/latest)

FinShield 为主流 Agent 提供文件、系统与桌面的安全边界。优先选择已发布的 Agent 接入插件；也可以通过 `finsafe` 命令行接入。在支持的产品配置中，PII 插件可扩展敏感信息检测与脱敏。

## 快速开始

1. [查看兼容矩阵](agents/compatibility.md)，确认 Agent 形态、平台、插件状态与验证范围。
2. [选择接入方式并安装](getting-started/install.md)：DSH／OpenCode Windows 按插件指南接入；Hermes Desktop 可从 FinShield 桌面启动，Kilo CLI 使用测试插件；Codex／Claude CLI 按各自指南接入。
3. [验证保护生效](getting-started/install.md#验证授权范围)，检查允许与拒绝两种操作。

## Agent 接入指南

| Agent | 推荐入口 | 可用接入 |
| --- | --- | --- |
| WorkBuddy 桌面版（Windows） | [桌面安装与启动](agents/workbuddy.md) | 桌面入口 |
| DSH Desktop（Windows） | [插件安装与使用](https://github.com/finogeeks/finsafe/blob/main/integrations/dsh/windows/README-zh.md) | 已发布：`@finogeeks2026/finshield-dsh` |
| Codex CLI（Windows） | [命令行接入](agents/codex.md) | **已支持 CLI 接入** |
| Claude Code CLI（Windows） | [命令行接入](agents/claude.md) | **已支持 CLI 接入** |
| OpenCode Desktop（Windows） | [插件安装与使用](https://github.com/finogeeks/finsafe/blob/main/integrations/opencode/windows/README-zh.md) | **已发布**：`@finogeeks2026/finshield-opencode`；也可从 FinShield 桌面启动 |
| Hermes Desktop（Windows） | [桌面安装与启动](getting-started/install.md#hermes-desktop) | FinShield 桌面入口 |
| Kilo CLI（Windows） | [测试插件接入](getting-started/install.md#kilo-cli) | `@finogeeks2026/finshield-kilo`（测试版，本地交互 TUI） |
| 其他 Agent／Linux／macOS | [兼容范围与通用 CLI 示例](agents/compatibility.md) | 按具体 Agent 确认 |

## 认识 FinShield 与防护配置

- [FinShield 到底防护什么](protection/README.md)：默认保护、仍允许的操作、配置作用、网站访问与 PII 范围。
- [Windows 系统与桌面防护](protection/windows-security.md)：Job/UI 限制、底层 API 权限、兼容性例外与验证方法。
- [FinShield简版产品介绍](overview/product-introduction.md)：跨平台定位、安全防护、接入方式与Windows实测结果。
- [整体图解介绍](overview/finshield.html)：安全管控、运行记录、企业管理与实测对照。
- [Windows 产品介绍](overview/windows.md)与[图解介绍](overview/windows.html)：权限、系统与桌面限制，以及敏感信息检查。
- [Linux/macOS 产品介绍](overview/linux-macos.md)与[图解介绍](overview/linux-macos.html)：平台能力、接入方式与限制。
- [防护能力与平台条件](agents/compatibility.md#防护能力与平台)：确认有效配置和实际请求覆盖范围。

## PII 插件开发

[Windows PII 插件开发包](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/README-zh.md)提供 SDK、协议、检测／脱敏示例与本地调试工具；[调试指南](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/docs/debugging-zh.md)介绍开发流程。

PII 插件扩展敏感信息处理规则，与 Agent 接入插件用途不同。正式接入需匹配产品版本及可检查的请求路径；商用须事先取得书面许可，见[开发包许可](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/LICENSE)。

## 企业部署与深入阅读

[智安盾白皮书](reference/whitepaper.md)：产品能力、接入方式、技术实现与Safety Arena当前Windows测评，附38项场景清单和统计方法。产品介绍与白皮书作为深入阅读材料，实际安装先从对应 Agent 指南开始。

## 参考与支持

- [安装、升级与卸载](getting-started/install.md)。CLI 接口以所安装版本的 `finsafe help` 为准。
- [Codex 排障](agents/codex.md#常见问题) · [Claude 排障](agents/claude.md#常见问题) · [获取帮助](getting-started/install.md#获取帮助)。
- [Agent Safety Arena](https://safety.finaios.ai/)：对照录像、测试条件与结果；[测评实现与复现材料](https://github.com/finogeeks/agent-safety-arena)。
- [版本记录](https://github.com/finogeeks/finsafe/blob/main/CHANGELOG.md) · [问题反馈](https://github.com/finogeeks/finsafe/issues/new/choose) · [用 Agent 提报](https://github.com/finogeeks/finsafe/blob/main/CONTRIBUTING-zh.md)。

## 按主题浏览

- [产品与保护边界](overview/README.md).
- [安装与验证](getting-started/README.md).
- [Agent 接入](agents/README.md).
- [配置与验证防护](protection/README.md).
- [PII 插件与扩展开发](development/README.md).
- [企业部署](enterprise/README.md).
- [参考资料与支持](reference/README.md).

## 架构与图示

[查看架构图与技术设计](architecture/README.md)。
