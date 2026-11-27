# 使用 AI 完成 FinShield 集成

[English](../../en/development/ai-integration.md) · [开发与集成](README.md)

让 AI 编程助手先读取与你环境匹配的公开文档，再生成最小接入方案，并用实际操作结果验证。网页、单页 Markdown 和 AI 索引使用同一份内容；AI 生成的命令仍需核对版本、配置目标和执行结果。

一次接入从环境信息开始，以可观察的验证结果结束：

```mermaid
flowchart LR
    A[确认环境] --> B[读取匹配文档]
    B --> C[生成最小方案]
    C --> D[按已有权限执行并验证]
```

## 给 AI 哪些文档

先提供[中文文档索引](https://finshield.finogeeks.club/zh-CN/llms.txt)，再按任务读取单页。给机器的链接使用完整站点 URL，避免相对路径失去上下文。

| 入口 | 用途 |
| --- | --- |
| [语言入口](https://finshield.finogeeks.club/llms.txt) | 选择中文或英文 |
| [开发主题索引](https://finshield.finogeeks.club/zh-CN/development/llms.txt) | 按集成任务选择相关文档 |
| [中文全文](https://finshield.finogeeks.club/zh-CN/llms-full.txt) | 需要离线阅读或批量处理时读取 |
| [机器可读目录](https://finshield.finogeeks.club/docs.json) | 为工具选择文档 URL |

新增的全文、主题索引和 JSON 入口随对应网站版本发布后可用。访问不到时，先使用语言索引和下方单页 Markdown，不猜测缺失内容。长任务优先按需读取，避免把不相关平台的全文一起交给 AI。

全文包包含当前文档正文；历史快照只列来源链接，图片和外链仍需网络访问。机器目录标明语言、页面摘要、内容类别、规范网页及对应 Markdown；独立图解没有 Markdown 时标为 `null`。

## 先确定平台、版本与支持状态

提供操作系统与架构、FinShield 和 Agent 版本、CLI／桌面／插件形态、预期任务及现有配置入口。让 AI 先读[兼容矩阵 Markdown](https://finshield.finogeeks.club/zh-CN/agents/compatibility.md)，区分已发布、测试版、测评验证和仅有示例。

Windows CLI 的结果不自动覆盖桌面版、IDE 或 Linux/macOS。源码有字段、帮助接受参数和真实配置生效，也需要分别判断；缺少条件时，先说明缺口。

## 可以交给 AI 的任务提示

替换方括号后使用。提示先产出可检查方案；后续执行仍遵守你已给出的权限和产品正常授权流程。

```text
请帮助我接入 FinShield。
环境：[操作系统/架构]；FinShield：[版本]；Agent/应用：[名称、版本、形态]。
目标：[具体任务]。配置目标：[已有受支持配置入口；不含密钥]。

先读取：
https://finshield.finogeeks.club/zh-CN/llms.txt
https://finshield.finogeeks.club/zh-CN/agents/compatibility.md
https://finshield.finogeeks.club/zh-CN/development/integration-guide.md
https://finshield.finogeeks.club/zh-CN/reference/cli-configuration.md

按文档选择匹配入口，列出前置条件、版本范围及证据来源。
给出最小步骤、需替换的路径、允许/拒绝测试和收尾方法。
将未执行步骤、实际结果和缺少的条件分别记录。
不要猜测接口、扩大权限或绕过正常授权；需要权限时说明操作和范围。
```

## 怎样核对 AI 的输出

按[最小接入示例](https://finshield.finogeeks.club/zh-CN/development/integration-guide.md)核对真实 EXE、选定配置和执行进程。使用已准备的有效配置；配置文件存在或查询退出码为 0，都不足以证明准备记录匹配。

在专用测试目录中验证允许写入、只读修改被拒、禁止读取被拒，保存原始错误并独立检查文件状态。模型口头拒绝、路径不存在和启动失败不能代替拦截证据。文件验证也不能证明 Inspector 或 PII 已启用；需要时另读[Inspector Markdown](https://finshield.finogeeks.club/zh-CN/architecture/inspector.md)，确认真实请求路径。

## 哪些资料适合交给 AI

使用合成文本和脱敏诊断，不把真实客户数据、密钥或敏感对话放进提示。公开技术资料介绍受支持的接入；企业部署、管理接口和授权操作按项目交付。需要这些能力时，通过[企业方案](https://finshield.finogeeks.club/zh-CN/enterprise/)联系确认范围。

关键答案直接写在正文中，AI 不必依赖截图或展开控件寻找必要步骤。索引帮助发现内容，不保证搜索收录、模型引用或生成结果正确；升级后仍应重新核对适用范围并验证。
