# FinShield PII 插件开发包

[English](README.md) · [逐步完成调试](docs/debugging-zh.md)

**许可：** FinShield 个人版按其产品条款免费使用。基于本开发包开发的插件，
如用于商业用途，必须事先取得凡泰极客的书面许可。个人版免费使用不代表
获得插件商用授权。完整条款见 [LICENSE](LICENSE)；授权联系：
[contact@finogeeks.com](mailto:contact@finogeeks.com)。

这个目录是独立的 Rust workspace。可以单独复制出去编译和调试，不需要私有
FinShield 代码、安装包、DSH 或 WorkBuddy。环境需要 Windows x64、stable Rust、
MSVC 编译工具及 Cargo 注册表依赖。验证脚本另需 Python 3.11+ 和 PyYAML。

插件是普通的 Windows EXE，运行在 AppContainer 外。你只写接收文本、返回检测结果
和可选改写文本的回调；SDK 处理 IPC。FinShield 负责选择当前文本、执行策略和转发。

拿到这个目录后，双击 **start-workbench.cmd**，或在本目录运行：

~~~powershell
.\start-workbench.cmd
~~~

脚本会自动编译开发工具和身份证示例、启动本地服务、检查网页可访问，再打开默认浏览器。
首次编译可能需要几分钟。保持终端窗口打开即可测试；关闭窗口或按 Ctrl+C 停止服务。
启动脚本只需要 Rust/MSVC 和 Windows 自带的 PowerShell，不需要 Python、PowerShell 7 或 FinSAFE。

测试自己的项目或已有 EXE：

~~~powershell
.\start-workbench.cmd -Project 'C:\Projects\my-plugin'
.\start-workbench.cmd -Executable 'C:\Plugins\my-plugin.exe'
~~~

也可以手动编译和运行：

~~~powershell
cargo build --workspace --locked
cargo test --workspace --all-targets --locked
.\target\debug\finshield-pii-dev.exe run --project .\examples\employee --text "Employee ACME-1234"
.\target\debug\finshield-pii-dev.exe ui --project .\examples\redactor
~~~

打开工具打印的本地地址，输入用户准备发送的话。后台包装成插件请求，调用 EXE，页面显示检测结果与改写预览。

redactor 示例用简单正则匹配 18 位身份证格式，默认把 11010119900101123X 改成 110XXX123X：保留前 3 位和后 4 位，中间替换为 XXX。修改 main 中 Redactor::new(3, 4) 即可调整保留位数；new(0, 4) 只留后 4 位。此示例不校验日期或校验码，也不检测 15 位号码。

插件可以收到多个文本片段，包括当前工具读文件后返回给模型的文本。完整请求／响应和当前输入边界见 [协议说明](docs/protocol.md)。独立页直接调用插件；私有 Core 集成页则包装真实聊天协议并显示实际转发内容。
已有 EXE 可用 --exe 路径；自己的 Cargo 项目用 --project 目录。多个二进制目标用
--bin 选择。工具自动构建并读取实际产物路径。

日常开发就是修改示例代码，打开本地 HTML 输入文本，再对比真实插件返回的检测和脱敏结果。
本开发包不提供编辑器集成或调试器附加流程，详见 [中文调试流程](docs/debugging-zh.md) 或 [English](docs/debugging.md)。

改完代码后点击 Rebuild and restart。工具先停止旧 EXE，再编译并启动新进程。
重发同一段文本即可比较修改前后的结果。关闭工具终端即可结束。

写插件时复制 examples/employee 或 examples/redactor，并将 Cargo.toml 的 SDK
路径指向本目录 sdk。回调放在库中，main 只调用 serve。Finding 的位置是输入片段
中的 UTF-8 字节范围；Edit 返回整个片段的替换文本。无改写就不返回 Edit。

独立验证：

先为执行验证的 Python 解释器安装 PyYAML，用于读取开发包中的网络 YAML 示例。

~~~powershell
python -m pip install PyYAML
python scripts/verify.py --dry-run
python scripts/verify.py --export
~~~

--export 会把这个目录复制到仓库之外，再对复制出的源码编译、测试和检查 IPC、
页面、重建及进程清理。它不使用私有代码。

集成时使用同一个 release EXE。插件配置包含 id、detector 和 on_finding；
外部插件写 detector: external，并配置 executable、timeout_ms、allow_rewrite。插件仅返回结果，
FinShield 继续执行原有策略；不配置外部检测器时保留原来的流程。开发工具无需随产品运行。

示例附带完整的 [network-policy.example.yaml](examples/redactor/network-policy.example.yaml)
和 [中文接入步骤](examples/redactor/README-zh.md)，文档贴出了替换后的全部 `network`。
插件包的三个核心文件是 EXE、完整网络 YAML 和 [apply_network_policy.py](examples/redactor/apply_network_policy.py)。
运行脚本即可备份配置、更新 candidate、调用 FinSAFE 原有接口生成 effective，再执行已有的 inspector refresh。
它包含代理模式、TLS 检查、允许目标、内容设置和外部插件，替换活动 `candidate.yaml` 的 `policy.network`。
再调用现有接口生成 `effective.yaml` 并刷新检查器。原有网络权限范围不变时，插件配置本身不改变 Windows 权限授权摘要；
开启原来未开启的 TLS 检查或扩大目标范围会涉及新授权，脚本不处理授权。
脚本使用 Python 和 PyYAML，出错直接报错停止，交给开发者处理。
个人版包含插件宿主能力，第三方插件 EXE 单独分发。

开发包采用专有许可，允许非商业开发、测试和使用；商用须另行取得书面许可。
产品正式发布时会把本目录中所有已纳入 Git 的文件同步到公开仓库。
公开目录中的 `release.json` 记录配套 FinShield 产品版本和源码版本，协议版本单独管理。

只选择 `plugins` 的第一项，其余条目忽略，不创建 worker 或 EXE。
第一项可用 `detector: pii` 或 `detector: external`，策略由该项的 `on_finding` 决定。
两者共用解压、调用、回填、按原编码重新压缩的发送流程。
原请求是 gzip，无论是否改写，处理后仍重新压缩为 gzip 发送；压缩失败直接返回 HTTP 错误。
