# 高级 CLI 与配置参考

[English](../../en/reference/cli-configuration.md) · [参考资料](README.md) · [配置项作用与生效](../protection/configuration.md)

界面没有某个设置，不代表 CLI 一定没有该能力；CLI 接受一个值，也不证明该值已经改变当前进程。本页说明怎样选择公开入口、理解参数位置，并确认配置真正生效。它是现有公开命令与字段的入口，不是所有平台所有子命令的完整参数清单。

**适用范围：** Windows 个人版有效配置入口、已公开的 Windows Job/UI 参数及 PII 集成配置。Linux／macOS 的 YAML 结构和运行要求另见[平台与 Agent 范围](../agents/compatibility.md)。参数是否存在，以所安装版本的帮助为准；帮助不能替代对应入口的支持说明和实际验证。

## 先确认参数属于哪一类

| 状态 | 使用依据 | 应怎样处理 |
| --- | --- | --- |
| 正式支持 | 当前交付有公开入口、版本范围和操作说明 | 按该说明使用，并验证目标实例 |
| 实验性 | 文档明确标为测试版或实验范围 | 固定所列版本，在专用环境验证；不推广成全平台保证 |
| 内部或未完成 | 只有源码、解析器字段、旧文档或原型 | 不把它列为正式配置，也不凭名称猜测效果 |

“只有 CLI，没有界面”是一种操作方式；“尚未实现”是一种能力状态。两者必须分别判断。当前公开范围见[配置入口说明](../protection/configuration.md#当前哪些入口已经公开)。

## 确认命令、版本与配置目标

先记录 `finsafe --version`，再阅读该子命令的帮助。Windows 接入常用：

```powershell
finsafe help
finsafe run --help
finsafe self-confine --help
finsafe prepare check --help
```

在多套安装、插件和配置并存时，使用真实 EXE 的完整路径，避免 PATH 选中另一版本。使用该安装实际选择的有效配置，不把 DSH、OpenCode、独立个人版的同名文件视为同一实例。

| 入口或参数 | 作用与参数位置 | 默认与生效边界 |
| --- | --- | --- |
| `self-confine --yaml-path <path>` | 选择 Windows 本次执行的已准备有效配置 | 示例显式选择，避免依赖安装默认目标；文件存在不证明已授权 |
| `prepare check --yaml-path <path> --json` | 查询所选配置的准备结果 | 读取 JSON 的 `result` 与 `differences`，匹配状态为 `same`；退出码 0 不等于匹配。不生成新授权，也不单独证明运行时限制已生效 |
| `--stdio inherit` | 放在 `run`／`self-confine` 后，选择继承输入输出 | 交互示例显式指定；其他模式与默认以该命令版本为准；不决定文件或网络权限 |
| `--integration-id <id>` | 放在执行子命令后，标记运行记录来源 | 不选择权限、桌面默认值或 Agent 适配；更改标签不会增加保护 |
| `--` | 将后续程序与参数交给被启动命令 | 后续标志属于目标程序；不要把目标程序参数误放到 FinSAFE 参数区 |
| `--windows-ui-*`、`--windows-desktop` | Windows 受支持执行入口的启动选项 | 各组选项和默认值见下节；不作为 Candidate 的同名字段 |

实际启动模板和可恢复的文件测试见[最小 CLI 接入](../development/integration-guide.md#最小-windows-cli-接入)。Codex 与 Claude 仍按各自[接入指南](../agents/README.md)处理应用参数。

## 桌面与 Job UI 参数

[Windows 系统与桌面防护](../protection/windows-security.md#cli-如何表达-ui-权限)是这些分组选项的取值与默认表，统一维护剪贴板、UI 对象隔离、桌面控制、系统设置、IME、注入和初始桌面行为。

例如 `--windows-ui-clipboard read` 表示移除剪贴板读取限制，写入仍受限；它不表示“仅用户点击时可读”。`--windows-ui-isolation desktop` 与 `--windows-desktop inherit` 属于不同维度。允许一组操作只改变相应限制，AppContainer 和其他对象权限继续生效。

调整前记录默认值和原因，调整后分别验证需要兼容的操作与仍需拒绝的操作。不要用 GUI 插件的实际行为倒推通用 CLI 默认，也不要因为 CLI 有参数就声称插件设置页面已开放该选项。

## YAML 字段与 CLI 参数怎样配合

| 配置面 | 应查阅的主要说明 | 与 CLI 的关系 |
| --- | --- | --- |
| 文件覆盖范围和路径权限 | [文件权限字段](../protection/configuration.md#文件权限字段) | 本次执行消费选定有效配置；启动命令本身不新建文件授权 |
| 网络模式与目标 | [网络与 PII 字段](../protection/configuration.md#网络与-pii-字段) | 实际模式决定流量路径；命令启动成功不证明代理或内容检查开启 |
| PII、改写和留存 | [网络访问、外泄与 PII](../protection/network-pii.md) | 使用支持的产品路径和示例；单独的插件测试不证明 Agent 请求已检查 |
| 资源 | [资源字段](../protection/configuration.md#资源字段) | 核对平台实施与有效值；`max` 不是一个有限资源配额 |
| UI 与初始桌面 | [公开 CLI 选项](../protection/windows-security.md#cli-如何表达-ui-权限) | 属于执行入口的启动输入，不应任意改写成 YAML 字段 |

没有一条“CLI 总是覆盖 YAML”的通用规则。先确认选项是否作用于同一属性、同一入口和同一配置目标，再按该属性的公开契约处理。旧版 wrapper YAML、Windows Candidate、Effective 和旧 JSON 不能仅按文件名互换。

## 保存配置到运行生效

以下图只描述公开 PII 配置流程的配置阶段；输入是选定 Candidate，输出是之后请求采用的内容设置。它不代替文件权限、TLS 信任或网络范围变更所需的原授权流程。

```mermaid
flowchart LR
    C[保存选定 Candidate] --> M[生成对应 Effective]
    M --> A[按变更要求完成授权或刷新]
    A --> V[验证后续真实操作]
```

PII 示例脚本备份并替换完整网络配置，调用既有配置物化与 Inspector 刷新。保存失败、物化失败和刷新失败是不同结果；不能统一显示为成功。刷新影响之后处理的请求，已在处理中的请求保持原设置。完整步骤及恢复限制见[脱敏示例](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/examples/redactor/README-zh.md)。

不要手工修改生成的 `effective.yaml` 代替正常配置流程。也不要把示例的宽泛端点范围覆盖到现有更窄配置上。

## 为每次高级调整保留验证记录

记录产品与平台版本、真实 EXE、所选配置、修改项及前后值、授权/激活结果、测试输入、原始结果和最终状态。对输入输出、文件、桌面与网络分别验证，不由一个“已受保护”状态推导全部能力。

本页整理公开接口，没有重新执行 Windows 安装后验收。最新产品包以[发行页](https://github.com/finogeeks/finsafe/releases/latest)为准；公开测评只证明其记录的平台、版本和场景。遇到未记载的参数或版本冲突，保留脱敏错误并[获取帮助](../getting-started/install.md#获取帮助)。
