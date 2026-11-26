# 插件默认防护

[English](../../en/protection/defaults.md) · [防护说明](README.md)

本页依据 2026-11-26 核对的 FinSAFE 公开仓库配置，说明 DSH 和 OpenCode Windows 插件的默认范围。它是随包配置的说明，不代替你电脑上当前版本的有效配置与实际授权。

## 保护哪些进程

DSH 与 OpenCode 插件保护其 Agent 执行 Host 及相应的受控执行路径。桌面 Main、普通更新器和电脑上的其他应用不因此全部进入同一沙箱。安装、授权完成、需要重新打开，以及当前进程已受保护，是不同状态。

从插件正常入口安装并按提示重新打开应用后，检查实际保护状态，再做[允许与拒绝验证](../getting-started/install.md#验证授权范围)。普通启动窗口已经出现，不足以证明执行进程已受保护。

## 随包配置的基线

| 项目 | DSH 与 OpenCode 公开默认值 | 对使用者的含义 |
| --- | --- | --- |
| 文件基线 `filesystem_coverage.root` | `read_write` | 不把所有工作区外路径默认设为禁止；还需检查显式目录规则和 Windows 实际权限 |
| 敏感目录 `filesystem` 条目 | 下表列出的 `deny`、`read_only` 等规则 | 在对应路径上限制读取、修改或删除 |
| 网络 `network.mode` | `host` | 该默认配置不启用 FinShield 代理、目标访问限制或模型内容检查 |
| `timeout_ms`、`memory_max`、`pids_max` | `max` | 这些字段没有设置有限的运行时限、内存上限或进程数上限；仍存在平台自身的权限和限制 |
| 回收站覆盖规则 | `$Recycle.Bin` 使用 `access: host` | 是沿用宿主行为的兼容性例外，不是“禁止访问回收站”规则 |

资源字段的含义及入口限制见[配置说明](configuration.md)。默认值不是建议放宽你已有的更严格配置。

## 默认拒绝访问的资料目录

两份配置包含相同的一组 Windows 敏感目录规则。下面按用途归类；环境变量表示当前 Windows 用户或系统位置，规则作用于对应目录及其后代。非默认位置必须另行核对。

| 类别 | 已列出的目录或应用资料 |
| --- | --- |
| 开发与云凭据 | `%USERPROFILE%` 下的 `.ssh`、`.aws`、`.gnupg`、`.kube`；`%APPDATA%` 下的 `gcloud`、`GitHub CLI` |
| 浏览器资料 | 已列出的 Chrome、Edge、Firefox、Brave、Opera、Vivaldi、QQ 浏览器、搜狗浏览器及 360 浏览器用户资料目录 |
| 密码管理器 | Bitwarden 桌面、CLI 及已列出的 Microsoft Store 安装资料位置 |
| 通讯与协作资料 | 已列出的 QQ／QQNT、微信 3／4、企业微信、钉钉、飞书／Lark、Teams、Slack、Signal 本地资料目录及部分 Store 安装位置 |
| 邮件资料 | Outlook 本地资料、默认 Outlook 归档目录、Thunderbird Profiles |
| 默认文档目录中的通讯文件 | `Documents` 下列出的 `Tencent Files`、`WeChat Files`、`WXWork`、`WXWork Files`、`xwechat_files` |

例如，默认规则拒绝 `%USERPROFILE%\.ssh`，但不能据此认定另存于 `D:\MyKeys` 的私钥也被覆盖。浏览器资料目录的规则也不是所有文件名中含 `cookie` 的文件的通用拒绝规则。

## 只读、可写与兼容性范围

| 范围 | 公开配置中的作用 |
| --- | --- |
| FinSAFE 安装目录、配置目录及部分运行资料目录 | 设为只读，减少受保护执行进程修改保护组件或配置的机会 |
| `%APPDATA%\Microsoft`、`%LOCALAPPDATA%\Microsoft`、`%ProgramData%\Microsoft` | 有只读规则；其中更具体的显式拒绝目录仍需按其规则核对 |
| DSH 运行数据、默认工作区和 Node 临时目录 | 有可写兼容性规则，以维持 DSH 正常工作 |
| OpenCode 缓存、配置、数据、状态、安装目录和默认工作区 | 有可写兼容性规则，以维持 OpenCode 正常工作 |
| DSH 插件安装根目录、OpenCode 选定原生版本的稳定父目录 | 有对应的只读兼容性规则 |

兼容性路径会按实际安装和用户环境解析。本页不把某一台电脑上的绝对路径作为所有安装的固定位置。

## 哪些操作仍可能成功

- 在获准可写位置创建、覆盖、移动或删除文件。只读与拒绝规则需实际覆盖目标；沙箱不提供版本恢复。
- 读取没有落入拒绝规则、且 Windows 实际权限允许读取的资料。两份默认配置没有通用的 `.env` 文件名拒绝条目。
- 经宿主网络访问模型、网站或其他服务。默认配置没有按“危险网站”“网盘”“社交网站”等类别拦截。
- 将获准读取的内容或用户手动输入的敏感文本发送给模型。文件访问防护与 PII 外发检查是不同层面的能力。
- 在受保护执行进程以外，由用户或普通应用执行操作。Agent 接入插件的状态不代表整台电脑都受到相同管控。

重要数据应同时核对读写范围、网络目标和内容检查条件，见[网络访问、外泄与 PII](network-pii.md)。

## 配置依据与验证

- [DSH 随包 Candidate YAML](https://github.com/finogeeks/finsafe/blob/main/integrations/dsh/windows/policy/candidate.yaml)
- [OpenCode 随包 Candidate YAML](https://github.com/finogeeks/finsafe/blob/main/integrations/opencode/windows/policy/candidate.yaml)
- [DSH 运行说明](https://github.com/finogeeks/finsafe/blob/main/integrations/dsh/windows/OPERATIONS-zh.md)
- [OpenCode 插件说明](https://github.com/finogeeks/finsafe/blob/main/integrations/opencode/windows/README.md)

上述 YAML 用于理解公开默认值，不是要求直接替换活动配置。使用自有测试资料验证实际拒绝、只读和可写路径；升级后记录版本并重做检查。不同 Agent、个人版或企业配置需各自确认。
