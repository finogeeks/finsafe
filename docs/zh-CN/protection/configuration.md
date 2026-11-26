# 配置项作用与生效

[English](../../en/protection/configuration.md) · [防护说明](README.md)

先确定当前入口，再阅读字段。DSH／OpenCode 的随包配置、Windows PII 集成示例与 Linux／macOS CLI 策略，不是可以互相覆盖的同一份配置。

## 当前哪些入口已经公开

| 配置或操作 | 当前公开范围 |
| --- | --- |
| 接入插件的安装、授权、保护状态、更新和停用 | 按 [DSH](https://github.com/finogeeks/finsafe/blob/main/integrations/dsh/windows/README-zh.md)／[OpenCode](https://github.com/finogeeks/finsafe/blob/main/integrations/opencode/windows/README.md) 指南使用 |
| 插件的随包文件权限和网络基线 | 已公开 YAML，可用于理解默认值；不能据此认定插件页面提供了任意路径、网站或 PII 编辑器 |
| Windows PII 外部插件配置 | 已公开匹配版本的开发集成示例、配置脚本及生效步骤；属于单独的集成流程 |
| 尚未公开或未提供受支持入口的设置 | 不作为当前可操作的开关列出；不能仅凭字段名或原型推断已开放 |
| OpenCode 手动指定原生程序、YAML 或版本根目录 | 公开说明已停用这些覆盖入口；本页不恢复旧参数 |

选择“已安装”“已授权”或“已受保护”，均不能代替检查某一项具体配置是否有效。插件与个人版使用的配置位置和安全域也可能不同，不能只改一份同名文件就认定已修改了当前 Agent。

## 文件权限字段

Windows 的 Job/UI 与初始桌面使用受支持版本的 CLI 启动参数，不是本页 Candidate 的文件权限字段。各组取值、默认行为和底层 API 边界见 [Windows 系统与桌面防护](windows-security.md)。

以下路径相对于 Windows Candidate 的 `policy` 部分。默认范围见[插件默认防护](defaults.md)。

| 字段／取值 | 作用 | 使用时注意 |
| --- | --- | --- |
| `filesystem_coverage.root` | 文件访问的覆盖基线；公开插件快照为 `read_write` | 不表示“只有默认工作区可写” |
| `filesystem[].path` | 规则针对的文件或目录位置 | 按实际解析后的路径核对；备份位置、迁移位置和另一个磁盘不自动覆盖 |
| `access: deny` | 拒绝对目标的访问 | 用自有测试目标验证读取及相关操作被拒绝 |
| `access: read_only` | 允许读取，限制修改 | 内容仍可被读取；它本身不阻止将内容发给模型 |
| `access: read_write` | 允许相应读写操作 | 包括可能产生破坏的覆盖或删除；不是自动备份 |
| `access: host` | 对应兼容性条目沿用宿主行为 | 公开回收站条目采用此值；不是额外拒绝规则 |
| `inheritance: descendants` | 将目录规则的范围延伸到后代 | 需连同目标路径和其他具体规则检查 |
| `lifecycle` | 区分已存在的位置与准备时创建的位置 | 属于配置与准备契约，不是应用页面中的权限开关 |
| `id`、`source` | 标记规则及来源，便于识别 | 改名字不等于增加保护或授权 |

`security_domain_id` 标识一组原生安全资源；`integrations` 标记集成。它们不是用来打开网站过滤或让进程自动获得保护的开关。通过正式配置与授权入口操作，不直接改这些标识来绕过现有流程。

## 网络与 PII 字段

这组字段来自公开的 Windows PII 集成示例，位于 `policy.network`。**它们不是 DSH／OpenCode 插件默认配置，也不是已确认开放的插件页面设置。**

| 字段 | 作用 |
| --- | --- |
| `mode: host` | 沿用宿主网络；公开接入插件默认采用此模式 |
| `mode: proxy` | 在支持该模式的产品配置中使用 FinSAFE 代理路径；仍需验证实际请求经过该路径 |
| `tls_terminate: true` | 允许检查经过该路径的 HTTPS 内容；还需匹配产品、证书信任及支持的协议格式 |
| `endpoints` | 配置允许访问的目标；示例的 `["*.*"]` 是宽泛范围，不是严格白名单 |
| `llm_content.retention` | 控制示例所述的原文留存；不是拦截或脱敏开关 |
| `llm_content.max_body_bytes` | 请求体大小上限；示例为 `16777216`，即 16 MiB，不表示任意大小或格式都被检查 |
| `llm_content.plugins` | 内容检测器列表；目前只选择第一项，其余不会作为后备依次运行 |
| `detector: pii`、`categories` | 使用内置 PII 检测，选择支持的类别；公开示例列出 `global.email`、`cn.resident_id` |
| `detector: external`、`executable` | 使用单独交付的外部检测器 EXE；该程序作为受信任扩展在 AppContainer 外运行 |
| 所选条目的 `on_finding` | 命中后的处理：`warning` 允许发送，`block` 阻止发送，`approval_required` 等待审批 |
| 外部条目的 `allow_rewrite` | 允许应用插件返回的有效文本修改；不保证插件一定返回修改 |
| 外部条目的 `timeout_ms` | 限制外部检测器的启动／调用等待；公开示例为 `2000` 毫秒，不是模型请求的总超时 |

发送与脱敏的实际结果见[网络访问、外泄与 PII](network-pii.md)。启用原文留存时，也应按所用产品的留存机制管理这些记录的访问和保存；不能把“发给模型的文本已脱敏”理解成“所有本地原文都已删除”。

## 资源字段

| 字段 | 作用与公开默认状态 |
| --- | --- |
| `resources.timeout_ms` | 运行时限；公开插件快照为 `max`，没有用此字段设置有限时限 |
| `resources.memory_max` | 内存上限；快照为 `max`，不能宣传成已设置某个固定内存配额 |
| `resources.pids_max` | 进程数上限；快照为 `max`，不能宣传成默认只允许一个进程 |
| `resources.cpu_max` | CPU 配额字段；快照保留 `100000 100000`。执行方式依平台与版本，不能把 Linux 的配额解释直接当成已验证的 Windows 插件行为 |

这些字段的出现不证明插件界面已经提供对应滑块或输入框。改变平台资源行为属于实际产品配置变更，需使用所安装版本支持的入口，并验证结果。

## 保存之后怎样生效

公开 PII 示例区分下面的阶段：

1. `candidate.yaml` 保存期望配置。仅改此文件，不证明运行中的请求处理已改变。
2. 原有 `config materialize` 命令生成 `effective.yaml`。
3. 原有 Inspector 刷新操作让之后处理的请求使用新内容设置；已在处理中的请求保留原设置。没有 Inspector 运行时，下次正常受保护启动加载配置。
4. 需要新授权的网络范围或 TLS 变更，仍需经过原有授权流程。示例脚本不替用户完成授权。

示例脚本会备份 Candidate 与 Effective，再应用完整网络配置。生成或刷新失败时按实际错误处理；它没有自动回滚，也不负责把接入插件迁移成另一种网络产品。不要用完整示例覆盖现有更窄的目标范围、其他权限或另一实例的配置。

完整流程与失败后的恢复说明见[脱敏示例接入](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/examples/redactor/README-zh.md)；协议与文本边界见[PII 协议](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/docs/protocol.md)。
