# FinShield 智安盾：AI 智能体沙箱与权限控制

[English](../../en/overview/README.md) · [文档目录](../README.md)

## 一、FinShield是什么

FinShield（智安盾）是一款面向 AI 智能体（Agent）的操作系统级沙箱与安全防护产品，支持 Windows、macOS 和 Linux，控制受保护执行进程及其工具的访问权限。企业还可使用数据收集能力，留存对话、工具调用和处理结果。命令行工具的名称是 `finsafe`。

FinShield通过各平台的原生安全机制实施隔离与权限控制，围绕隐私、交互、系统和数据安全，约束智能体及其工具的访问与操作，降低越权访问、误操作和任务失控带来的风险。同时，FinShield收集对话、工具调用和处理结果等运行过程数据，保留业务上下文，支持留存与查询追溯，帮助企业积累和管理业务数据资产。

## 二、安全防护能力

FinShield围绕隐私、交互、系统和数据建立安全防护。隐私防护约束摄像头、麦克风和屏幕访问，降低隐私泄露风险；交互防护限制或隔离窗口、键鼠和剪贴板操作，减少对用户工作环境的干扰；系统防护限制系统配置修改、跨进程操作和资源使用，降低系统受损与业务中断风险；数据防护控制文件与目录的访问权限，保护业务资料免遭越权读取、修改和删除。

在支持的网络与内容检查配置中，FinShield 可控制智能体访问的域名与 IP，拦截未经授权的网络请求，并对受控请求中的可解析内容进行 PII（个人身份信息）检测，支持告警、阻断和单次审批。已发布的 DSH 和 OpenCode Windows 插件默认使用宿主网络，不启用 HTTPS 内容检查或 PII 脱敏，具体要求见[网络访问与 PII](../protection/network-pii.md)。

## 三、接入与集成方式

FinShield独立于具体Agent和模型供应商，为不同智能体提供统一的安全防护与数据收集能力，支持零侵入纳管和沙箱SDK集成两种接入方式。

- **零侵入纳管**：无需修改 Agent 源码，可通过 Windows 插件接入 [OpenCode Desktop](https://github.com/finogeeks/finsafe/blob/main/integrations/opencode/windows/README-zh.md) 和 DSH Desktop，通过 FinShield 桌面入口启动 WorkBuddy 或 Hermes Desktop，或按文档使用 Codex、Claude 的 CLI 接入。[兼容矩阵](../agents/compatibility.md)列出实际交付入口、配套版本和测试版范围。
- **沙箱SDK集成**：面向自研Agent与应用开发，开发者可在自身应用中集成沙箱能力，管理Agent及其工具的执行权限和资源访问，将安全防护集成到自有产品与业务流程中。

## 四、实测结果

截至2026年11月25日，Finogeeks的 [Safety Arena](https://safety.finaios.ai/) 已在Windows平台公布四款Agent的38项场景对照测评，覆盖隐私安全4项、交互安全13项、系统安全13项和数据安全8项。各Agent的防护成功数如下：

- **[DSH](https://safety.finaios.ai/agents/dsh/)**：内置防护0/38项；接入FinShield后38/38项。
- **[WorkBuddy](https://safety.finaios.ai/agents/workbuddy/)**：内置防护9/38项；接入FinShield后38/38项。
- **[Codex CLI](https://safety.finaios.ai/agents/codex-cli/)**：内置防护17/38项；接入FinShield后38/38项。
- **[Claude CLI](https://safety.finaios.ai/agents/claude-cli/)**：内置防护2/38项；接入FinShield后38/38项。

测评由开发 FinShield 的 FinAIOS 团队维护。[统计方法与项目关系](https://safety.finaios.ai/methodology/)及[原始测评资料](https://github.com/finogeeks/agent-safety-arena)提供了结果的来源。

测评显示，上述Agent的内置防护在Windows上仍存在安全缺口：文件访问限制未能同时覆盖隐私访问、桌面交互和系统操作，部分高风险操作在用户确认放行后仍可执行。接入FinShield后，四款Agent在本次38项场景中均实现防护，补充了原有安全控制未覆盖的操作边界。

## 五、平台与进一步阅读

不同平台的执行边界、桌面能力和记录范围并不相同，按实际工作环境选择：

| 阅读入口 | 了解什么 |
| --- | --- |
| [Windows 能力](windows.md) | Windows 上的交互、系统与资料防护，以及运行记录 |
| [Linux/macOS 能力](linux-macos.md) | 对应平台的原生隔离、接入条件和能力差异 |
| [默认防护与配置](../protection/README.md) | 当前入口默认启用的保护、仍允许的操作及验证方法 |

需要图解可阅读[整体介绍](finshield.html)；技术机制见[安全原理](../architecture/README.md)。实际接入以[兼容矩阵](../agents/compatibility.md)中的平台、形态和版本范围为准。
