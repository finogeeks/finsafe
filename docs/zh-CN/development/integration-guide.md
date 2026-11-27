# 为应用选择 FinShield 接入方式

[English](../../en/development/integration-guide.md) · [开发与集成](README.md) · [兼容矩阵](../agents/compatibility.md)

接入的第一步是确定实际执行任务的进程。给桌面安装一个插件、启动一个受保护服务、为内容检查增加检测器，解决的是不同问题。本页帮助你选择已有公开入口，并用一个普通命令进程验证接入边界。

**范围：** 现有 Agent 入口、Windows CLI 及公开 PII 开发包。Windows 命令示例要求一份已经准备和授权的有效配置；本页不为任意应用提供自动适配，也不增加新的安装后实测结论。产品和 Agent 的版本依据见[兼容矩阵](../agents/compatibility.md)。

## 选择与你的任务匹配的入口

| 你的目标 | 建议入口 | 接入后还要确认 |
| --- | --- | --- |
| 在已支持 Agent 中使用保护 | 对应 [Agent 指南](../agents/README.md)，优先使用已发布插件或桌面入口 | 实际执行 Host 是否已受保护，当前配置允许哪些操作 |
| 从终端运行 Codex 或 Claude | [Codex CLI](../agents/codex.md)／[Claude Code CLI](../agents/claude.md) 指南 | Codex 的 TUI 是否连接到受保护服务；Claude 的工具和 shell 是否在目标环境可用 |
| 包裹自己的命令或工具 | 使用匹配平台、发行版和配置的通用 CLI；下面提供 Windows 模板 | 程序、依赖、配置目录、文件与网络访问需求；子进程及退出行为 |
| 为自己的桌面产品提供原生接入 | 先评估宿主进程、执行进程与更新流程，再确认 SDK 和交付版本 | 应用适配、授权、状态和生命周期契约，不能仅改一个集成名称 |
| 增加敏感信息检测或脱敏规则 | [Windows PII 开发包](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/README-zh.md) | 真实请求是否经过检查路径，检测结果如何影响发送，插件许可 |
| 需要企业管理和组织级交付 | [企业方案](../enterprise/README.md) | 联系确认环境、试点范围、授权及交付要求 |

Linux／macOS 的通用 CLI 示例和 Windows 的有效配置入口不同，按[平台与 Agent 范围](../agents/compatibility.md)选择，不互换策略文件或直接套用下面的命令。

## 先画清进程边界

以“普通终端启动一个受保护命令”为例，图中只展示启动关系。输入是已授权配置与命令；输出是该次受保护任务及其执行结果。启动错误需要先修正，不能当作一次成功的防护测试。

```mermaid
flowchart LR
    T[普通终端或宿主] --> F[FinShield CLI]
    F --> P[受保护命令进程]
    P --> C[该任务创建的工具子进程]
```

普通终端、独立更新器或已经运行的桌面进程不会因为这次调用而自动进入同一保护范围。程序若把工作交给一个已有的外部服务，需另行确认那个服务的身份和权限。应用连接成功与执行进程受保护应分别验证。

## 最小 Windows CLI 接入

本例用 Windows PowerShell 代替业务应用，先验证启动和文件权限。它是通用命令模板，不表示某个自建 Agent 已通过兼容验收。

准备以下输入：

- 已安装 Windows x64 FinShield，并完成该目标配置的准备与授权。
- 真实的 FinShield EXE、Windows PowerShell EXE 和已准备 `effective.yaml` 路径。
- 一个已授权可读写的专用测试工作区。需要验证拒绝时，再准备只读、禁止访问的测试目录与无敏感信息的样本文件。
- 配置允许所选 PowerShell 及其正常运行所需路径。若当前交付没有提供相应配置入口，先使用现有 Agent 指南；不要直接修改生成的 `effective.yaml`，也不要借用其他插件的专用配置。

在普通 PowerShell 中替换路径，然后检查版本与准备结果：

```powershell
$finshieldExe = 'C:\Program Files\FinSAFE\finsafe.exe'
$effectiveYaml = 'C:\YourFinShieldConfig\effective.yaml'
$workspace = 'C:\YourAuthorizedTestWorkspace'
$shellExe = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'

& $finshieldExe --version
& $finshieldExe self-confine --help
& $finshieldExe prepare check --yaml-path $effectiveYaml --json
```

确认路径存在，并读取检查输出的 JSON：`result` 为 `same` 才表示所选准备记录匹配；`unprepared`、`incomplete` 或 `different` 均需先处理，结合 `differences` 查看差异。退出码 0 只表示查询执行成功。检查命令不替你完成新授权；配置不匹配或准备失败时，先通过受支持的产品配置流程修正。然后从工作区启动：

```powershell
Set-Location -LiteralPath $workspace
& $finshieldExe self-confine --yaml-path $effectiveYaml --stdio inherit --integration-id custom-cli -- $shellExe -NoLogo -NoProfile
```

`--` 后是实际执行程序及其参数；`--stdio inherit` 保留交互输入输出。`--integration-id custom-cli` 仅标记运行记录来源，不选择权限、不做应用适配，也不启用网络或 PII 检查。公开的原有接入示例见 [Claude CLI](../agents/claude.md)。

## 在受保护进程里验证操作

在刚启动的 PowerShell 内输入以下命令；将目录替换成该配置中真实的专用测试目录：

```powershell
$workspace = 'C:\YourAuthorizedTestWorkspace'
$readOnlyDir = 'C:\YourReadOnlyTestDirectory'
$deniedDir = 'C:\YourDeniedTestDirectory'

'integration-check' | Set-Content -LiteralPath (Join-Path $workspace 'finshield-demo.txt') -ErrorAction Stop
Get-Content -LiteralPath (Join-Path $workspace 'finshield-demo.txt') -ErrorAction Stop
Get-Content -LiteralPath (Join-Path $readOnlyDir 'fixture.txt') -ErrorAction Stop
'write-probe' | Set-Content -LiteralPath (Join-Path $readOnlyDir 'write-probe.txt') -ErrorAction Stop
Get-Content -LiteralPath (Join-Path $deniedDir 'fixture.txt') -ErrorAction Stop
```

这些是逐条执行、逐条检查结果的操作，不是自动验收脚本。样本文件应事先由普通进程创建并确认存在；只读目录中的 `write-probe.txt` 应尚不存在。

| 操作 | 对应有效权限下的预期 | 需要核对的证据 |
| --- | --- | --- |
| 工作区写入与读取 | 成功，返回 `integration-check` | 普通进程也能看到相同文件内容 |
| 只读样本读取 | 成功 | 返回预先设置的样本内容 |
| 只读目录新增文件 | 访问被拒 | 原始错误，且目录中没有新增测试文件 |
| 禁止访问样本读取 | 访问被拒 | 样本确实存在，错误为访问拒绝而非文件不存在 |

若允许操作也失败，先检查依赖、路径和配置；若应拒绝的操作成功，保留结果并修正所选范围，不把“进程已启动”当成验收通过。文件测试也不能证明桌面或网络检查生效，见[防护验证](../getting-started/install.md#验证授权范围)。

## 收尾与接入你的应用

在受保护 PowerShell 中运行 `exit`，返回原终端后确认该任务已结束。仅清理自己创建的测试文件；若本次配置增加了授权，通过原产品流程处理，不手工删除有效配置或授权记录。

接入业务命令时，把 `--` 后替换成真实程序和参数，保留同一个明确配置目标。分别验证普通启动、任务执行、子进程、异常退出和升级后的行为。不要为修复兼容性而直接扩大到全盘权限或跳过 Agent 自身审批。

## SDK 和 PII 是不同的扩展面

公开的 [FinSAFE Node SDK](https://www.npmjs.com/package/@finogeeks2026/finsafe-sdk)承载现有原生模块调用，DSH 与 OpenCode 插件使用它。包已公开不代表任何内部请求形状都成为稳定的第三方接口；新宿主应确认所选 SDK、原生组件和应用适配的对应版本及公开契约。CLI 包裹示例不替代完整桌面适配。

PII 插件则接收已选定的文本，返回检测与可选改写结果。它不负责启动 Agent 或作出权限授权。开发和真实产品接入分别见[PII 开发包](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/README-zh.md)及[脱敏示例](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/examples/redactor/README-zh.md)；商用前核对许可。

参数、生效规则和证据记录见[高级 CLI 与配置参考](../reference/cli-configuration.md)。报告问题时附产品、平台和应用版本、实际入口、脱敏配置范围、原始错误与允许／拒绝对照结果。
