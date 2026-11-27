# Windows 系统与桌面防护

[English](../../en/protection/windows-security.md) · [防护说明](README.md) · [插件默认防护](defaults.md)

Agent 不只通过终端命令操作电脑。Python、Node.js、本地 EXE 和原生扩展都可以调用 Windows API。本页说明受保护执行进程受到哪些系统约束，Job/UI 限制解决什么问题，以及哪些结论仍需在实际接入环境验证。

**适用范围：** Windows AppContainer 执行路径。具体效果取决于 FinSAFE 版本、Windows 版本、接入方式及实际启动配置。本页描述系统机制与受支持的 CLI 配置，不表示 DSH／OpenCode 插件页面已开放这些设置，也不把 CLI 默认值当成所有插件的实际值。桌面 Main、普通更新器及其他宿主进程的范围见[插件默认防护](defaults.md#保护哪些进程)。

## 权限在什么位置落实

```mermaid
flowchart LR
    A[受保护的 Agent 或工具进程] --> B[调用 Windows API]
    B --> C[Windows 检查令牌、对象权限及有效限制]
    C --> D[返回允许结果或访问错误]
```

AppContainer 令牌、Capability SID、对象 ACL、完整性级别及 Job 限制共同约束实际操作。换一种脚本语言，或从高层库改为调用 Win32／Native API，本身不会增加进程权限。**这也不等于 FinShield 对所有底层 API 建立了逐个拦截和记录的清单。** 需要分别说明调用访问了什么对象、申请了哪些权限、哪一层约束生效。

文件规则、Job/UI 限制、网络控制和 PII 检查各有范围。允许文件读取，不代表允许所有进程操作；文件访问被限制，也不代表获准读取的文本不能经网络发送。

## Job Object 与 UI 限制分别做什么

Job Object 将受控进程组织为一个任务，并可承载资源、生命周期和 UI 限制。**Job/UI 是其中的桌面交互限制，不是 CPU、内存配额的别名。**

| 限制类别 | 约束的行为 | 需要说明的边界 |
| --- | --- | --- |
| 剪贴板读取与写入 | 分别约束把剪贴板内容读入进程、把内容写到剪贴板 | 读与写可独立配置；允许其中一项不会自动允许另一项，也不表达“仅真实用户点击时允许” |
| 外部 USER 对象 | 限制使用同一 Job 以外进程拥有的 USER 句柄，约束相关窗口交互与钩子 | USER 句柄不是所有内核句柄；不能据此认定文件、管道或进程句柄都受同一位控制 |
| 全局原子表 | 限制通过系统全局原子表共享信息 | 不代表所有 IPC 都被关闭 |
| 桌面与会话控制 | 限制创建／切换桌面、注销或退出会话等对应操作 | 初始放在哪个桌面由另一个选项决定；桌面放置本身不是所有逃逸路径均已验证的证明 |
| 系统参数与显示设置 | 限制相应系统参数和显示配置修改 | 不覆盖全部注册表写入或全部系统设置接口 |
| IME 与注入相关限制 | 在支持的 Windows 版本上施加对应 Job/UI 限制 | 不能扩展成“所有输入读取、模拟输入或注入手段均已阻断”；需核对具体操作和系统支持 |
| 资源与生命周期 | 配置适用的进程数、内存、运行时限和任务结束行为 | 与 UI 限制分别核对。公开插件的若干资源字段为 `max`，不代表已有有限配额 |

Microsoft 的 [Job/UI 说明](https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-jobobject_basic_ui_restrictions)解释了基础限制位。FinShield 的有效限制还需结合启动选项与系统支持核对，不能只看进程是否属于某个 Job。

## CLI 如何表达 UI 权限

在提供这些选项的 Windows `finsafe run`／`self-confine` 版本中，使用分组选项表达意图，不直接填写原始位掩码。先检查所安装版本的 `finsafe run --help` 与 `finsafe self-confine --help`。这些是启动参数，不是可直接添加到插件 Candidate YAML 的字段。

| 选项 | 取值 | 省略时的 CLI 行为 |
| --- | --- | --- |
| `--windows-ui-clipboard` | `none`、`read`、`write`、`all` | `none`：限制读与写 |
| `--windows-ui-isolation` | `container`、`handles`、`atoms`、`desktop` | `container`：限制外部 USER 对象及全局原子表共享 |
| `--windows-ui-desktop-control` | `deny`、`allow` | `deny` |
| `--windows-ui-system-settings` | `none`、`parameters`、`display`、`all` | `none`：限制相应参数与显示设置修改 |
| `--windows-ui-ime` | `deny`、`allow` | `deny`，结合 Windows 版本支持 |
| `--windows-ui-injection` | `deny`、`allow` | `deny`，结合 Windows 版本支持 |
| `--windows-desktop` | `isolated`、`inherit` | `isolated`：初始放置到私有桌面 |

`clipboard=read` 只移除读限制，写仍受限；`write` 则相反。`isolation=desktop` 选择 UI 对象共享方式，**不等于** `--windows-desktop inherit`。允许某一组只移除相应 Job/UI 限制，其他组及 AppContainer、UIPI、对象 ACL 仍然生效，不保证操作必定成功。

GUI 接入可能为了显示窗口、复制粘贴或应用兼容性采用不同启动参数。应核对该接入的实际配置与验证结果，不能因 CLI 的限制默认值就宣称所有桌面插件禁用剪贴板。

## 底层 API 访问的具体边界

下面列出常见操作及判定方式。API 名称用于解释资源访问，不表示 FinShield 提供了同名的逐 API 开关。

| 操作／代表接口 | 主要权限边界 | 不能据此推断的结论 |
| --- | --- | --- |
| 文件打开、读取、写入：`CreateFileW` 等 | 生效的路径权限、文件／目录 ACL、AppContainer 访问检查及适用的完整性约束 | 不是全部工作区外文件默认拒绝；也不提供备份与撤销 |
| 注册表读取与修改：`RegOpenKeyExW`、`RegSetValueExW` | 注册表对象 ACL 与进程令牌；不同键及所需访问权分别判定 | 没有独立公开的任意注册表规则编辑器；不能承诺注册表全部不可读写 |
| 结束进程、写进程内存、复制句柄：`OpenProcess`、`TerminateProcess`、`WriteProcessMemory`、`DuplicateHandle` | 目标对象安全描述符、请求的进程访问权、令牌与完整性边界 | “目标进程仍存活”不单独证明某个 API 返回了拒绝；自己的子进程与其他用户进程不能一概而论 |
| 窗口消息、钩子与桌面操作 | Job/UI、UIPI、目标桌面及窗口对象的有效访问规则 | 不保证所有桌面读取和输入手段均被阻断 |
| 摄像头、麦克风及其他设备 | 对应设备访问、Capability、系统隐私与适用的代理访问路径 | 不等于整机设备被关闭；第三方代理或宿主进程的行为需另行检查 |
| 命名管道、共享内存、事件与 COM | 对象 ACL、命名空间、AppContainer 身份、能力与服务自身的授权 | Job 的 USER 句柄限制不是“禁止全部 IPC”；合法进程通信仍可能被允许 |
| Socket、HTTP 与模型请求 | 实际网络模式及适用的系统网络策略；内容检查另需覆盖真实请求 | 默认 `network.mode: host` 不提供目标白名单或自动 PII 阻断 |

操作系统机制背景见 Microsoft 的 [AppContainer 隔离说明](https://learn.microsoft.com/en-us/windows/win32/secauthz/appcontainer-isolation)。FinShield 公开测评中的进程终止、内存修改、句柄复制、注册表等案例及其版本范围见[产品机制与测评资料（历史）](../reference/whitepaper.md)。平台机制、一个案例成功和本机当前配置生效，是不同层次的证据。

## 必须明确的限制

- **不能只凭 AppContainer 或 Job/UI 宣称“完全防截屏”。** 同桌面 `GetDC(NULL)` 读取屏幕不由现有 Job/UI 掩码阻止；特定截图路径的测评不能覆盖所有图形、录屏或代理路径。
- **初始私有桌面不等于完整桌面隔离证明。** 还需验证桌面访问权限及相关线程／子进程行为；`inherit` 会改变桌面共享范围。
- **没有完整的逐 API 拒绝审计承诺。** Windows 文件拒绝日志只覆盖已接入的事件与可归因进程，Job/UI、注册表及全部拒绝操作不保证都有记录。没有日志不能说明操作被允许，也不能说明从未发生尝试。
- **兼容性放行需要逐项说明。** 允许剪贴板或 UI 对象共享，只改变对应边界；沿用宿主网络也不会自动关闭文件防护。避免只用一个“已受保护”状态概括所有能力。
- **不把测试范围扩大成全平台保证。** 一个 Agent、Windows 构建或 API 路径的结果，不代表其他接入与系统版本。

## 怎样验证

| 验证对象 | 建议记录的证据 |
| --- | --- |
| 当前进程 | FinSAFE、Agent 和 Windows 版本，受保护入口，实际执行进程及其子进程范围 |
| Job/UI | 当前有效限制；剪贴板读／写分别测，宿主测试窗口与受保护进程交互分别测 |
| 文件与注册表 | 自有测试目录／键的允许对照与拒绝对照，实际读取内容或最终修改结果及原始错误 |
| 跨进程访问 | 自建可丢弃目标进程，记录请求权限、API 返回值及错误码，再独立核对进程存活／内存结果 |
| 网络与 PII | 合成文本、自有接收端、真实发送载荷及命中后的处理结果 |

只在自有、可恢复的测试对象上操作。不要拿真实业务进程、凭据或客户资料测试。Agent 口头拒绝、程序没有启动、缺少依赖和没有日志，都不能单独当成系统已阻断的证据。完整验证入口见[安装与验证](../getting-started/install.md#验证授权范围)。
