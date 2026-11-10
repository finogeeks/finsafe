# FinShield DSH Windows 插件

[English](README.md) · [架构与运行契约](DESIGN.md)

**驭智能之力，守安全之境。**

插件保留原 DSH 桌面版、图标、账户和会话。插件通过 FinSAFE AppSeam 请求一次
重启，新 Host 必须通过当前进程AppContainer状态读取，Main 保持在沙箱外。
启用或更新前请保存工作；接管重启可能中断任务。

## 安装与授权

需要 Windows x64、DSH `>=0.2.1-rc.5 <0.3.0`、PowerShell 7，以及下载对应
FinSAFE 稳定版安装包的网络和 Windows 安装授权。先打开一次 DSH 建立 Desktop
profile，再通过标准插件界面或自带 CLI 安装：

```powershell
dsh plugin --profile desktop add <plugin.tgz> --ignore-scripts
```

首次激活时，插件下载对应版本的完整 Windows 安装器及 SHA256SUMS，校验 SHA256，
在原生运行时缺失或版本不同时执行安装器。DSH 没有公开的插件安装回调。
激活立即返回，原生安装和授权在后台继续，复用现有桌面端授权API并保留Windows权限确认。
重新启用时接续已有任务，已经完成则复用准备结果，展开进度可查看原生百分比。
不增加授权按钮，不打开控制台。准备完成后，在插件页或跨页面提醒中选择“重启DSH”或“稍后”。
安装文件不等于已经
获得保护。失败结果会保留，后续启动不会不断自动重试。

也可在启动 DSH 前，从解包后的插件源码目录执行：

```powershell
./install/Install-Plugin.ps1 -Archive <plugin.tgz>
```

`-DshDirectory` 指定原 Desktop 安装目录，`-DshHome` 覆盖 DSH 解析的数据根。
`-InstallDirectory` 和 `-ConfigDirectory` 指定原生绝对路径。
打开原DSH继续后台授权。`-Offline`只控制DSH依赖解析，原生下载仍需网络。
需要明确重试安装时，再次运行此脚本。

| 内容 | 默认位置 |
|---|---|
| 完整原生运行时 | `%ProgramFiles%/FinSAFE/dsh-plugin/` |
| candidate 和 effective 配置 | `%ProgramData%/FinSAFE/dsh-plugin/config/` |
| 下载与原生安装结果 | `%LOCALAPPDATA%/FinSAFE/dsh-plugin/downloads/` |
| 设置、接管日志与备份 | `<DSH_HOME>/finsafe-windows/` |

实际路径由 Windows 已知文件夹决定。插件使用独立的 `finshield.dsh` 安全域，保留
个人版文件、配置和授权。一个 FinSAFE 产品按目标目录保存安装记录，不同目录
可以保留不同版本。

```mermaid
flowchart LR
    A[安装插件包] --> B[运行对应原生安装器]
    B --> C[调用现有原生配置与Prepare接口]
    C --> D[用户确认重启DSH]
    D --> E[执行一次 AppSeam 接管]
    E --> F[校验 Host 原生令牌]
```

原生配置接口负责candidate物化与effective生成，Prepare负责授权。策略保留Windows强制
文件保护及基础资源设置，仅选择 DSH 兼容规则，网络使用 host 模式，不提供代理、
TLS 检查、PII 或出站内容过滤。

## 使用与更新

在 **插件 → 已安装 → FinShield** 查看产品页面。页面跟随DSH主题和语言，全部说明链接跳转到
[安全竞技场](https://finsafe-safety-arena.finogeeks.club/)。页面显示后台授权、等待重启与实际保护状态，
不增加检查页面。日志与诊断状态是观察结果，保护由Host原生令牌确认。

通过 DSH 更新插件包，版本跟随 FinSAFE 稳定版。需要更新原生运行时时，激活流程
针对同一目录运行对应完整安装器。原生 Restart Manager 负责确认、关闭实际使用
目标文件的进程和替换。安装宿主运行在被替换的目录和进程之外。取消、替换失败和
重启要求保留原生结果。第二代 Host 失败不会触发循环接管。

## 停用与卸载

使用 DSH 标准控制停用或删除插件，退出并重新打开后改变后续激活。停用不能把
已运行的 Host 移出 AppContainer。附带脚本还可清理本插件元数据：

```powershell
./install/Install-Plugin.ps1 -Remove
```

删除插件包保留原生文件、下载、日志、备份及授权。需要删除原生运行时时，使用
该目录的 `finsafe-uninstall.exe` 或对应 Windows 已安装应用条目。原生卸载只影响
选定实例拥有的文件和记录，保留 effective 配置、其他用户文件及 DSH 账户、会话。
2026-11-06 修订设计（实现尚需收窄，原生验收未完成）：原生卸载通过已有的
定向 unprepare 清除该运行时安装目录、配置和原用户对应的 FinSAFE ID 授权。
不执行 SYSTEM 全量授权清理，不向其他运行时转交 Service。两个目录如果使用
相同的用户与安全域 ID，就共享同一份授权；清除此 ID 的授权会同时生效。
不同 ID 的授权保持独立。个人版默认配置路径、更新配置路径和快捷方式名称不变。
详见[设计文档](DESIGN.md#updates-and-removal)。

## 构建、发布与验证

稳定版流程在安装包发布成功后，将完整客户端、策略、许可证、第三方声明和双语
说明同步到[公开仓库](https://github.com/finogeeks/finsafe/tree/main/integrations/dsh/windows)，
并生成[自定义 DSH 索引](https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/index.json)。
每版固定公开 Git 提交和子目录，并记录原始 FinSAFE 源码提交。将该 URL 添加为
自定义插件索引。本次变更本身不发布版本，也不代表通过市场上架验收。

构建与验证命令见[英文说明](README.md#build-publication-and-verification)。策略生成
需要 Python 和 PyYAML。自动适配器、实例、策略和索引检查不能证明真实安装、升级、
卸载、跨账户授权、原会话保留、浏览器布局或远程 Git 安装，均需单独原生验收。
历史 shared 原型观察不能代表独立安全域包的验收结果。

插件含原有 FinSAFE 产品许可证 LICENSE.rtf 和[第三方声明](THIRD-PARTY-NOTICES.md)。
原生安装器提供自己的运行时声明，无需解压依赖。
