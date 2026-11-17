# 通过命令行接入 Claude Code（Windows）

[English](../../en/agents/claude.md) · [文档目录](../README.md) · [兼容矩阵](compatibility.md)

本指南采用 Safety Arena 的 Windows 路径：用 FinShield `self-confine` 启动 Claude Code CLI，在普通终端中保留交互界面。**Claude 已支持 CLI 接入，无需安装插件。** 本页不覆盖 Claude 桌面版或 Linux/macOS 的 Agent 验证。

Arena 配置记录 Claude `2.1.314`，使用与 Codex 路径相同的已安装 FinShield `effective.yaml`。已有测评不代表本文对所有后续版本进行了安装验证；升级后需重新检查。

## 准备

1. 按[安装指南](../getting-started/install.md#windows)安装 Windows x64 FinShield，完成安全准备和授权。
2. 单独安装并登录 Claude Code CLI，先确认普通运行和所需工具可用。下面命令使用实际的原生 `claude.exe`；只有 npm 启动脚本时，先确认对应安装方式，不直接将 `.cmd`／`.ps1` 替代 EXE。
3. 在 FinShield 控制台确认工作区、Claude 程序、所需配置／状态目录及 shell 的访问范围。取得该安装实际使用、已准备的 `effective.yaml` 路径；不要直接编辑生成文件或复用 DSH 插件专用配置。
4. 本指南的测评依据采用 PowerShell 工具路径。先确认当前 Claude 版本的 Windows shell 配置可用；Git Bash 启动失败不能当作安全拦截证据。其他 shell 路径需要单独验证。

## 启动 Claude CLI

在普通 PowerShell 终端中替换配置和工作区示例路径：

```powershell
$finshieldExe = 'C:\Program Files\FinSAFE\finsafe.exe'
$claudeExe = (Get-Command claude.exe -CommandType Application -ErrorAction Stop).Source
$effectiveYaml = 'C:\YourFinShieldConfig\effective.yaml'
$workspace = 'C:\YourAuthorizedWorkspace'

foreach ($file in @($finshieldExe, $claudeExe, $effectiveYaml)) {
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw "File not found: $file" }
}
if (-not (Test-Path -LiteralPath $workspace -PathType Container)) { throw "Workspace not found: $workspace" }
& $finshieldExe --version
& $claudeExe --version
& $finshieldExe prepare check --yaml-path $effectiveYaml --json
```

检查准备结果。未准备、配置不匹配或诊断报错时，先通过产品流程修正并完成授权，再在同一终端运行：

```powershell
Set-Location -LiteralPath $workspace
& $finshieldExe self-confine --yaml-path $effectiveYaml --stdio inherit --integration-id claude -- $claudeExe
```

在该会话中按正常方式输入任务并处理 Claude 的权限提示。本路径不需要远程 `app-server`，也不添加 `--dangerously-skip-permissions`、`--permission-mode` 或沙箱关闭参数；无需为包裹而修改 `.claude/settings.local.json`。

```mermaid
flowchart LR
    A[普通终端] --> B[FinShield 启动 Claude CLI]
    B --> C[授权范围内的工具与文件操作]
```

`--stdio inherit` 保留交互输入输出；`--integration-id claude` 只标记记录来源，不授予权限。包裹对象是 Claude CLI；终端本身和你在其他终端独立执行的命令不因此获得保护。

## 验证与退出

在新建测试会话中按[授权范围验证](../getting-started/install.md#验证授权范围)检查允许的工作区写入、只读文件修改被拒及禁止目录读取被拒。使用预先创建的无敏感信息测试文件，核对实际工具结果与文件内容。模型口头拒绝、shell 启动失败或文件不存在都不能证明保护生效。

网络与 PII 检查仅覆盖实际接入、可检查的路径；本启动命令不自动证明内容检查开启。要扩展检测／脱敏规则，参阅 [Windows PII 插件开发包](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/README-zh.md)。

正常退出 Claude CLI，并确认本次包裹进程已结束。更换配置、升级或恢复普通运行时，启动新进程；直接从其他终端运行 `claude` 不属于本次受保护入口。权限变更须通过产品配置与准备流程，不直接编辑生成的有效配置。

## 常见问题

| 现象 | 处理 |
| --- | --- |
| 找不到 `claude.exe` | 确认原生安装和 PATH，或显式设置真实 EXE 路径 |
| 界面无输出或不能输入 | 从普通交互式终端运行并保留 `--stdio inherit`；不要为交互会话添加捕获输出参数 |
| shell／工具启动失败 | 先确认相同 shell 在普通 Claude 会话中可用，再检查有效配置是否允许其路径；保留原始错误 |
| 配置或准备错误 | 核对 FinShield 安装、有效配置和准备结果，通过产品流程修正；不靠跳过权限确认排错 |
| 登录、模型或网络失败 | 区分 Agent 原生配置与沙箱网络限制，检查实际代理／证书配置并脱敏日志 |

实现依据：[Arena Claude 接入说明](https://github.com/finogeeks/agent-safety-arena/blob/main/docs/claude-finshield-recording.md)。反馈时提供 FinShield／Claude 版本、shell、启动入口及脱敏错误，见[获取帮助](../getting-started/install.md#获取帮助)。
