# Agent 兼容矩阵

[English](../../en/agents/compatibility.md) · [文档目录](../README.md) · [快速开始](../getting-started/install.md)

FinShield 面向主流 Agent 提供安全边界。优先使用已发布的 Agent 接入插件；没有插件时，可以通过 `finsafe` 命令行接入。产品支持 Windows、macOS 和 Linux，但每个 Agent 的形态、接入方式和验证范围需分别确认。

本页于 2026-11-16 整理。**已支持 CLI**表示现在即可通过命令行接入；**已发布**表示有公开交付入口；**测评验证**表示有特定版本、配置和案例的测评证据；**有示例**表示有策略材料，仍需验证当前版本。Agent 接入能力与独立插件交付状态分别列出，暂无公开插件入口不影响已有 CLI 接入。

## 按 Agent 选择

| Agent／形态 | 平台 | Agent 接入插件 | 非插件接入 | 版本与验证范围 |
| --- | --- | --- | --- | --- |
| DSH Desktop | Windows x64 | **已发布**：`@finogeeks2026/finshield-dsh` | FinShield 桌面入口 | 插件要求 DSH `>=0.2.1-rc.5 <0.3.0`、Node `>=24.9.0`；以[插件说明](https://github.com/finogeeks/finsafe/blob/main/integrations/dsh/windows/README-zh.md)为准 |
| Codex CLI | Windows x64 | 暂无公开插件入口 | **已支持 CLI**（测评验证）：`self-confine` 包裹 `app-server`，TUI 连接该服务；见[指南](codex.md) | Arena 配置记录 Codex `0.166.0`；Windows FinShield `0.10.9` 路径见下方实现说明；不构成后续版本的全量兼容承诺 |
| Claude Code CLI | Windows x64 | 暂无公开插件入口 | **已支持 CLI**（测评验证）：`self-confine` 包裹 Claude CLI；见[指南](claude.md) | Arena 配置记录 Claude `2.1.314`；采用与 Codex 相同的已安装 FinShield 配置；具体案例以测评记录为准 |
| WorkBuddy 桌面版 | Windows x64 | 本页不提供已发布独立插件入口 | FinShield 桌面入口 | 桌面接入与测评已有材料；版本和配置见[测评](https://safety.finaios.ai/)及[桌面上手](../getting-started/install.md#windows) |
| Codex、Hermes、OpenCode、agy CLI | Linux／macOS；按示例选择 | 本页不提供已发布插件入口 | **有示例**：通用 `run`／`self-confine` 与[策略样例](https://github.com/finogeeks/finsafe/tree/main/examples/wrapper-policies/agent-sandbox) | 示例可能沿用旧版 Agent 参数；使用前按当前版本核对、调整并验证，不能直接套用 Windows 指南 |
| 其他 Agent／自建 Agent | 按发行包与主机能力选择 | 按该 Agent 的实际交付状态确认 | 通用 CLI 接入需要适配和验证 | 能启动进程不等于已验证该 Agent 的全部工具和防护能力 |

Codex CLI 的测评结果不覆盖 Codex 桌面版或 IDE 扩展；Claude Code CLI 的结果不覆盖 Claude 桌面版。插件安装成功、进程启动成功和保护已生效是不同状态。

## 两类插件

- **Agent 接入插件**：将 FinShield 接入 Agent，处理安装、启动、授权和保护状态。DSH Windows 插件属于这一类。
- **PII 检测／脱敏插件**：扩展敏感信息识别与文本改写规则。已有[Windows 开发包](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/README-zh.md)，包含 SDK、协议、示例和本地调试工具。它不是 Codex／Claude 接入插件。

PII 开发包以 `pii-plugins/release.json` 标识配套产品版本。独立调试通过不代表某个 Agent 的真实请求已被检查；正式接入还需匹配产品版本、网络配置与可检查的请求路径。插件商用须事先取得书面许可，见[开发包许可](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/LICENSE)。

## 防护能力与平台

| 能力 | 使用前需确认 |
| --- | --- |
| 文件与工作区权限 | 当前生效策略及授权；在测试目录验证允许与拒绝两种操作 |
| 系统与桌面操作限制 | 启动入口、Windows 桌面／终端模式和实际平台能力 |
| 网络与敏感信息检查 | 代理、TLS 检查、目标服务和请求格式是否已接入；CLI 包裹本身不证明 PII 检查开启 |
| 运行记录与审计 | 当前版本、有效配置和实际产生的记录；`--integration-id` 仅标记来源，不授予权限 |

Windows 使用 AppContainer；macOS 使用 Seatbelt；Linux 依赖 bubblewrap、cgroup 等主机能力。三者的权限、桌面与资源限制不完全相同，见 [Windows 产品介绍](../overview/windows.md)及 [Linux/macOS 产品介绍](../overview/linux-macos.md)。

## 证据与更新

- [Codex 包裹实现](https://github.com/finogeeks/agent-safety-arena/blob/main/docs/codex-finshield-recording.md)及[测评版本配置](https://github.com/finogeeks/agent-safety-arena/blob/main/profiles/agents/codex/evaluation.json)。
- [Claude 包裹实现](https://github.com/finogeeks/agent-safety-arena/blob/main/docs/claude-finshield-recording.md)及[测评版本配置](https://github.com/finogeeks/agent-safety-arena/blob/main/profiles/agents/claude/evaluation.json)。
- [Agent Safety Arena](https://safety.finaios.ai/)：录像、测试条件和结果；测评工具中的接入不等于独立产品插件发布。

升级 FinShield 或 Agent 后，记录两个产品的版本，重新进行[授权范围验证](../getting-started/install.md#验证授权范围)。新增矩阵条目时，同时提供交付入口、平台、版本和验证依据。
