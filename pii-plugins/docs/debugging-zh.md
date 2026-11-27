# 用本地 HTML 调试插件

[English](debugging.md) · [下一步：接入 FinSAFE](integration.md)

开发流程只有：**写代码 → 编译 EXE → 本地页面输入 → 查看结果 → 修改并重编译**。
需要 Windows x64、stable Rust 和 MSVC 编译工具；编辑代码用你自己的工具即可。
以下命令都在 `pii-plugins/` 目录执行。

## 对外目录包含什么

```text
pii-plugins/
  protocol/                 插件请求、响应与校验
  sdk/                      Rust SDK 与 IPC 客户端
  devtool/                  独立命令行和 HTML 测试工具
  start-workbench.cmd        双击：编译、启动服务并打开浏览器
  examples/redactor/        身份证检测、脱敏示例
  examples/employee/        只返回检测结果的示例
  fixtures/                 合成测试数据
  docs/                     本文、协议和集成说明
  scripts/verify.py          独立验证入口
```

这些内容都在同一个可单独复制的目录里，不依赖私有 FinSAFE 代码。
本源码目录已在公开仓库提供；配套 FinShield 产品版本和源码修订见 [release.json](../release.json)。
本指南通过本地路径依赖使用随包 SDK，不要求另行发布的 SDK crate 或预编译开发工具 EXE。

## 1. 编译并打开页面

双击开发包根目录的 **start-workbench.cmd**，或运行：

```powershell
.\start-workbench.cmd
```

脚本会自动编译、启动服务、检查网页已响应并打开默认浏览器。首次构建可能需要几分钟。
保持启动窗口打开；关闭窗口或按 Ctrl+C 停止服务。启动不需要私有源码、FinSAFE 安装、Python 或额外的 PowerShell 版本。
网页必须从启动脚本的那台电脑访问；每次启动以脚本打开或打印的新地址为准，不依赖聊天里的旧端口链接。
编译失败会显示错误，双击启动的窗口会等待你查看错误后再关闭。
正常退出时，脚本会清理属于本次启动的运行记录，避免把已停止服务的端口误当成当前网页。
确认体验成功时，除了看启动信息，还应在浏览器打开页面并点击一次 **Send to plugin**，检查脱敏预览。

本地 HTTP 服务现在允许最多 64 KiB 请求头。浏览器在本机不同端口之间共享 Cookie；
实际 Chrome 配置发送了约 16.9 KiB 请求头，触发了之前 8 KiB 的限制，页面因此返回
HTTP 400 和 `{"error":"header limit"}`。这个限制已修复，不需要清理浏览器 Cookie。
超过新上限时返回 HTTP 431，并说明大小限制。终端只记录请求头大小，不记录 Cookie 值或请求头内容。

2026-11-15 已验证：只复制本开发包到仓库外、使用带空格的路径并从其他工作目录运行，
默认示例、指定项目和已有 EXE 三种启动方式都能提供网页、返回脱敏结果并清理进程。

如果需要手动操作，等价命令为：

```powershell
cargo build --workspace --locked
cargo run -p finshield-pii-dev -- ui --project .\examples\redactor --timeout-ms 12000
```

打开终端打印的 `http://127.0.0.1:端口/`。工具在本机提供 HTML 页面，同时启动插件 EXE。
你不需要启动 FinSAFE、DSH 或 WorkBuddy，也不会调用真实模型。

在输入框填写：

```text
我的身份证号是11010119900101123X。
```

点击 **Send to plugin**，预览应为：

```text
我的身份证号是110XXX123X。
```

下面的 Findings and edits 显示真实插件返回的检测结果和整段替换文本。
页面会把输入包装成插件协议，通过 IPC 调用 EXE，再把结果展示出来。

## 2. 改代码，再编译，再试

1. 检测、脱敏逻辑在 `examples/redactor/src/lib.rs`。
2. 保留位数在 `examples/redactor/src/main.rs` 的 `Redactor::new(3, 4)`。
   改成 `new(0, 4)` 只留后四位；改成 `new(6, 4)` 保留前六位和后四位。
3. 页面点击 **Rebuild and restart**。工具先停止旧 EXE，再调用 Cargo 编译，启动新 EXE。
4. 再点击 **Send to plugin**，重发同一段文本。
   使用 `new(0, 4)` 时，结果应变成 `我的身份证号是XXX123X。`。
5. 恢复 `new(3, 4)`，再重建、发送一次，就回到默认示例。

页面保留输入，不会自动重发。Windows 会锁定运行中的 EXE，因此使用页面的重建操作，让工具先停止旧进程。
编译错误看工具终端；通信、超时或处理错误看页面。修好后重建即可。
**Stop plugin** 只停止插件，页面保持打开；**Rebuild and restart** 可以重新启动。
关闭工具终端会结束它拥有的插件进程。

## 3. 使用自己的项目或 EXE

```powershell
.\start-workbench.cmd -Project 'C:\Projects\my-plugin'
.\start-workbench.cmd -Executable 'C:\Plugins\my-plugin.exe'
```

也可以直接使用开发工具命令：

```powershell
cargo run -p finshield-pii-dev -- ui --project C:\Projects\my-plugin --timeout-ms 12000
cargo run -p finshield-pii-dev -- ui --exe C:\Plugins\my-plugin.exe --timeout-ms 12000
```

`--project` 由工具编译项目并定位 EXE；多个二进制目标用 `--bin NAME` 选择。
`--exe` 直接测试已有 EXE，重启时只重新运行它，编译由开发者自行完成。

## 4. 什么时候算这一步完成

- 输入身份证号，能看到检测结果及预期脱敏文本。
- 修改代码、重编译、重发后，结果确实改变。
- 普通文本不变；一段中的多个号码都处理；中文前后文保持完整。
- 停止和重启工作正常，旧 EXE 不再运行。

```powershell
cargo test -p finsafe-pii-redactor --lib --locked
python scripts/verify.py --dry-run
python scripts/verify.py
python scripts/verify.py --export
```

验证脚本检查实际 EXE、IPC、页面、重建和清理。`--export` 只复制本目录到仓库外，再构建和测试。
身份证示例是简单格式正则，不做日期或校验码验证，也不匹配 15 位号码。

本地联调完成后，再按 [集成说明](integration.md) 把同一个 EXE 接入 FinSAFE。
完整用户／工具文本协议见 [协议 v1](protocol.md)。

## 已验证的本地循环

2026-11-15 已通过真实页面后台实测：修改 `(3, 4)` 为 `(0, 4)`，重编译并重发相同文本，
输出从 `110XXX123X` 变为 `XXX123X`；恢复配置后，输出也恢复。每次重编译都启动了新进程，
停止／重启正常，测试结束后源码已恢复。

10 项单元测试、严格 lint、命令行／HTML 联调，以及只复制本目录到仓库外后的构建和测试均通过。
HTTP 回归检查覆盖带 32 KiB 合成 Cookie 请求头的页面、状态和真实脱敏调用，以及超过 64 KiB 时可读取的 431 错误响应。
复测使用复现过 `header limit` 的同一个 Windows Chrome 配置，保留原有约 16.9 KiB 请求头：
页面加载、中文／多号码脱敏、普通文本不变、修改代码后重编译并发送、停止和重启均通过。
这一步验证独立开发包，尚未替代安装版 FinSAFE 的应用验收。
