# 从本地代码到 FinShield

[English](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/docs/integration.md)

~~~mermaid
flowchart LR
    A[编写回调] --> B[运行库测试]
    B --> C[使用开发宿主测试 EXE]
    C --> D[使用 FinShield 代理测试 EXE]
    D --> E[验证选定应用]
    E --> F[交付厂商 EXE]
~~~

前三个阶段只使用此开发包。SDK 不启动服务，开发宿主不需要安装产品。使用合成测试数据，覆盖 UTF-8 文本、无检测结果、检测、替换及处理失败。

产品集成通过 README.md 中的四个字段使用同一个 EXE。私有真实代理测试工具检查当前文本选择、原始历史、`allow_rewrite`、动作策略及实际上游字节。本地插件测试成功不能证明这些路径正确。随后，应用验收验证选定应用的已安装配置与被拦截流量。

插件接收 FinShield 已经选定的文本。它不能通过返回结果作出授权决定，也不能改变目的地址、请求头、历史、角色或二进制附件。检测结果和修改的校验使用与开发宿主相同的公开协议 crate。

交付 release EXE 及所需厂商资源。FinShield 按需用 `--socket` 启动插件，并管理其生命周期。不要把 FinShield 配置为调用 `finshield-pii-dev`，也不要自行运行插件守护进程。插件作为受信任的宿主扩展运行，具有用户正常的文件和网络权限。它不在受保护应用的 AppContainer 内运行。

厂商模型必须满足已记录的生产环境内存／进程限制及启动／调用超时。开发宿主设置不会改变生产限制。

线协议及工具结果示例见[协议 v1](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/docs/protocol.md)。脱敏示例现在会遮盖居民身份证号；其构造函数选择保留可见的前缀和后缀长度。

## 完成调试演练后

先完成[调试演练](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/docs/debugging-zh.md)（[英文](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/docs/debugging.md)）。在独立开发包目录构建 release EXE：

```powershell
cargo build --release -p finsafe-pii-redactor --locked
```

厂商插件包包含三个核心文件：

- `finsafe-pii-redactor.exe`
- [network-policy.example.yaml](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/examples/redactor/network-policy.example.yaml)
- [apply_network_policy.py](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/examples/redactor/apply_network_policy.py)

同时交付[英文](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/examples/redactor/README.md)和[中文](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/examples/redactor/README-zh.md)演练文档。它们展示完整的替换 `network` 配置，包括代理模式、TLS 检查、端点和外部插件。如需改用内置 PII，将第一项替换为 `detector: pii`。将插件包放在稳定目录，用 Python 和 PyYAML 运行脚本：

```powershell
python -m pip install PyYAML
python .\apply_network_policy.py
```

使用包含外部 PII 支持的 FinSAFE 构建。脚本用 PyYAML 读取并替换 candidate 的完整网络配置，然后调用现有 `config materialize` 命令。该命令与桌面使用同一配置物化 API。脚本将选定的第一个 EXE 路径解析为绝对路径，保留 candidate 的其他字段。写入前，两个现有文件均复制到 `.yaml.bak`；每次运行会覆盖上次备份。

该脚本使用直接的 Python 实现。错误直接上报；它没有重试、回滚、自动授权或新的产品 API。物化失败时，candidate 已更新，而 effective 保持不变。修复原因或恢复备份后再运行。

应用成功后，脚本调用现有的 `finsafe app tls-inspector --refresh --yaml <effective.yaml>`。刷新会更新运行中的内容设置，不执行新的授权。如果没有检查器运行，下次受保护应用启动时加载新配置。已经处理中的请求保留原设置。刷新失败时，报告“配置已保存，等待激活”，不报告成功。

个人版安装器包含插件宿主。厂商 EXE／YAML／脚本需单独提供。脚本不会授权或安装产品组件。网络模板与个人版默认配置一致；应用前，先调整任何更窄的端点范围。TLS 检查、端点范围、文件系统边界或身份的变更可能需要正常的 FinSAFE 授权流程；脚本不处理该流程。仅修改 PII 时，保留 Windows 权限授权摘要。

在受保护应用中测试合成的用户文本和工具结果文本，检查实际转发载荷。设置 `on_finding: warning` 及 `allow_rewrite: true` 时，`11010119900101123X` 应变为 `110XXX123X`。阻断策略仍会阻断检测结果。插件仍在 AppContainer 外运行。独立测试成功不等于已安装客户端通过验收。

## 只选择一个插件

只选择 `plugins` 中的第一项。即使第一个检测器未发现问题或处理失败，后续项也不会运行。`detector: pii` 和 `external` 使用相同的解码／处理／编码流程。gzip 请求先解码，再检查，然后重新压缩为 gzip 并更新请求体分帧后转发。内置检查没有修改时也使用此流程。压缩错误返回 HTTP 错误，不会回退转发未修改的请求。SDK／IPC 不变。
