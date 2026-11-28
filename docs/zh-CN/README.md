---
aside: false
---

# FinShield 文档中心

[English](../en/README.md) · [产品首页](https://github.com/finogeeks/finsafe) · [最新下载](https://github.com/finogeeks/finsafe/releases/latest)

FinShield（智安盾）是面向 AI 智能体执行进程的操作系统级沙箱。Windows 接入可为 OpenCode Desktop、WorkBuddy 等受支持的 Agent 增加文件、系统与桌面操作控制；macOS 和 Linux 使用各自的接入方式。`finsafe` 是命令行工具的名称。

先选择对应的 [Agent 接入指南](agents/README.md)，再查看[默认保护范围](protection/README.md)。PII 检测与脱敏需要支持内容检查的配置。

## 企业 AI 安全治理白皮书

[阅读《Agent时代 企业信息安全治理白皮书》](resources/agent-security-governance.md)：从企业 AI 风险、分层安全架构到建设路径与 FinShield 实践。2026年11月版，提供原版 PDF 在线浏览、下载和 HTML 全文。

## 从你的目标开始

| 你想完成什么 | 阅读入口 |
| --- | --- |
| 了解产品、安装并使用现有 Agent | [产品介绍](overview/README.md)、[安装与验证](getting-started/install.md)、[兼容矩阵](agents/compatibility.md) |
| 为自己的应用接入保护，或扩展 PII | [开发与集成](development/README.md)、[接入方式与最小示例](development/integration-guide.md) |
| 了解企业方案并讨论试点 | [企业方案与联系入口](enterprise/README.md) |

## 技术博客

<div class="blog-section-lead"><p>技术选题与文章大纲，正文及实测将后续补齐。</p><a href="/zh-CN/blog/">全部大纲</a></div>

<div class="blog-feature-wrap">
<a class="blog-feature" href="/zh-CN/blog/appcontainer-child-processes.html">
  <div class="blog-feature-copy"><p class="blog-meta">文章大纲 · 执行隔离</p><h3>FinShield 如何解决 AppContainer 中 Python 和 Node.js 的子进程兼容性问题</h3><p>AgentScope、Hermes、DSH、OpenCode 调用案例，以及原生 AC、MXC 与 FinShield 的对照验证规划。</p><span class="blog-read">查看大纲</span></div>
  <div class="blog-path" aria-hidden="true"><span class="blog-path-label">PROCESS &amp; CHANNELS</span><span class="blog-path-node">受保护 Agent</span><span>↓</span><span class="blog-path-node blog-path-boundary">Python / Node.js</span><span>↓</span><span class="blog-path-node">工具子进程</span><span class="blog-path-caption">PIPE / IPC / stdio</span></div>
</a>
</div>

<div class="blog-secondary-grid">
<div class="blog-secondary-wrap">
<a class="blog-secondary" href="/zh-CN/blog/windows-network-boundaries.html">
  <div class="blog-feature-copy"><p class="blog-meta">文章大纲 · 网络与内容安全</p><h3>Windows Agent 网络隔离的信任边界</h3><p>WFP、代理、本机中介与上游载荷的分析和验证计划。</p><span class="blog-read">查看大纲</span></div>
</a>
</div>
<div class="blog-secondary-wrap">
<a class="blog-secondary" href="/zh-CN/blog/pii-inspection-failure-semantics.html">
  <div class="blog-feature-copy"><p class="blog-meta">文章大纲 · 网络与内容安全</p><h3>PII 检查链路的覆盖、改写与失败语义</h3><p>TLS、文本选择、命中动作、异常处理与接收端验证提纲。</p><span class="blog-read">查看大纲</span></div>
</a>
</div>
</div>

## 深入了解安全机制

想知道“保护在哪里执行”，可以从[安全原理目录](architecture/README.md)进入。理解机制后，再按[高级配置与 CLI 参考](reference/cli-configuration.md)核对所安装版本支持的入口。

- [Windows 网络隔离与 WFP](architecture/windows-network.md)：网络限制对象、代理分工和覆盖边界。
- [Windows 桌面交互与 Job UI](architecture/windows-job-ui.md)：限制作用、兼容性选择和验证方法。
- [Inspector 网络与内容检查](architecture/inspector.md)：流量路径、TLS 信任、PII、留存和失败行为。

## 快速开始

初次了解？先看[常见问题](reference/faq.md)：32 问讲清 AI safety、Agent safety、沙箱边界，以及为什么需要 FinShield。

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
- [FinShield简版产品介绍](overview/README.md)：跨平台定位、安全防护、接入方式与Windows实测结果。
- [整体图解介绍](overview/finshield.html)：安全管控、运行记录、企业管理与实测对照。
- [Windows 产品介绍](overview/windows.md)与[图解介绍](overview/windows.html)：权限、系统与桌面限制，以及敏感信息检查。
- [Linux/macOS 产品介绍](overview/linux-macos.md)与[图解介绍](overview/linux-macos.html)：平台能力、接入方式与限制。
- [防护能力与平台条件](agents/compatibility.md#防护能力与平台)：确认有效配置和实际请求覆盖范围。

## PII 插件开发

[Windows PII 插件开发包](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/README-zh.md)提供 SDK、协议、检测／脱敏示例与本地调试工具；[调试指南](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/docs/debugging-zh.md)介绍开发流程。

PII 插件扩展敏感信息处理规则，与 Agent 接入插件用途不同。正式接入需匹配产品版本及可检查的请求路径；商用须事先取得书面许可，见[开发包许可](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/LICENSE)。

## 企业方案与深入阅读

[企业方案](enterprise/README.md)介绍需求评估、试点与合作方式。[联系 Finogeeks](mailto:contact@finogeeks.com)讨论具体环境和交付范围。

[产品机制与测评资料（历史）](reference/whitepaper.md)：产品能力、接入方式、技术实现与该版Safety Arena Windows测评，附38项场景清单和统计方法。正式出版物请阅读前面的企业治理白皮书，实际安装先从对应 Agent 指南开始。

## 参考与支持

- [安装、升级与卸载](getting-started/install.md)。CLI 接口以所安装版本的 `finsafe help` 为准。
- [Codex 排障](agents/codex.md#常见问题) · [Claude 排障](agents/claude.md#常见问题) · [获取帮助](getting-started/install.md#获取帮助)。
- [Agent Safety Arena](https://safety.finaios.ai/)：对照录像、测试条件与结果；[测评实现与复现材料](https://github.com/finogeeks/agent-safety-arena)。
- [版本记录](https://github.com/finogeeks/finsafe/blob/main/CHANGELOG.md) · [问题反馈](https://github.com/finogeeks/finsafe/issues/new/choose) · [用 Agent 提报](https://github.com/finogeeks/finsafe/blob/main/CONTRIBUTING-zh.md)。

## 按主题浏览

- [产品概览](overview/README.md).
- [安装与验证](getting-started/install.md).
- [Agent 接入](agents/README.md).
- [配置与验证防护](protection/README.md).
- [开发与集成](development/README.md).
- [技术博客](blog/README.md).
- [企业方案](enterprise/README.md).
- [参考资料与支持](reference/README.md).

## 架构与图示

[查看架构图与技术设计](architecture/README.md)。
