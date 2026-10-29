# FinShield 快速上手

[English](getting-started.md) · [返回首页](../README-zh.md)

选择操作系统，下载对应发行文件。Windows 使用 EXE 安装包；macOS 与 Linux 使用命令行压缩包。版本和附件以 [Releases](https://github.com/finogeeks/finsafe/releases) 为准，新版代码中的功能可能尚未包含在公开历史包中。

## Windows

1. 先安装你要使用的 WorkBuddy 或 DSH。FinShield 不代替这些智能体，也不代办账号登录。
2. 下载 `finsafe-<版本>-x64-setup.exe`，双击运行，按向导完成安装。无需运行安装脚本。
3. 安装结束后打开 FinShield，检查“安全设置”中的文件和网络范围，完成授权与安全准备。需要时 Windows 会请求管理员确认。
4. 在“智能体管理”中确认应用安装目录。WorkBuddy 使用其安装目录；DSH 需要可用的 Node.js 和 DSH 安装目录。
5. 通过 FinShield 的“安全启动”或悬浮入口启动应用，等待界面确认运行状态，再开始任务。

首次使用建议从一个空的测试工作区开始。让智能体在已授权的可写目录里创建 `finshield-demo.txt`，写入“测试完成”，再读取它。确认基本功能可用后，按[Windows 使用指南](WINDOWS-GUIDE-zh.md)验证只读和禁止访问范围。

普通双击打开 FinShield 不会自动开始新的授权。看到“待准备”时，主动选择“开始准备”；“智能体待命”表示可以选择已接入的智能体。安装完成、安全准备完成和智能体运行是三个不同状态。

## macOS

当前发布目标为 Apple 芯片。Intel 新包暂缓，勿使用旧版 Intel 包代替当前版本。

1. 在 Releases 下载个人命令行包 `finsafe-v<版本>-aarch64-apple-darwin.tar.zst`。
2. 使用支持 Zstandard 的解压工具解压；校验文件可与同一版本的 `SHA256SUMS` 对照。
3. 保留包内目录和配套文件。从终端进入解压后的目录，运行：

```sh
./finsafe --version
./finsafe probe
./finsafe doctor
./finsafe --help
```

将该目录加入 `PATH` 后，可以直接使用 `finsafe`。按当前包的帮助和发行说明，通过 FinShield 启动你已经安装的 Agent。例如，包含 Hermes 快捷入口的版本可使用：

```sh
finsafe hermes
```

不要将“直接启动 Hermes”视为同一个受保护入口。网络与隐私检查的前提见[常见问题](FAQ-zh.md)。

## Linux

当前公开构建目标为 x86_64 GNU/Linux。

1. 下载个人命令行包 `finsafe-v<版本>-x86_64-unknown-linux-gnu.tar.zst` 并解压。
2. 保留包内配套程序，特别是 `finsafe-helper`、`finsafe-supervisor` 和 `finsafe-landlock-shim`；不要只复制主程序。
3. 在解压后的目录运行：

```sh
./finsafe --version
./finsafe probe
./finsafe doctor
./finsafe --help
```

Linux 的实际能力取决于 bubblewrap、cgroup、内核与授权配置。按诊断结果和该版本的发行说明完成主机准备，再通过该版本支持的 FinShield 入口运行 Agent。命令行检查通过不能代替实际任务验证。

## 升级与卸载

Windows 升级使用新版 EXE，按向导处理正在运行的应用，再检查授权范围和启动状态。卸载通过 Windows“设置 → 应用 → 已安装的应用”中的 FinShield／历史 FinSafe 条目完成。

macOS 和 Linux 更新时，先结束受保护任务，再用同一版本的整套发行文件替换原目录。移除命令行程序与清理配置、模型、证书、记录是不同操作；需要清理这些数据时，按对应版本的说明执行，勿直接删掉仍在使用的文件。

## 获取帮助

请记录产品版本、操作系统、Agent 名称与版本、操作步骤，以及界面显示的错误。[问题反馈说明](FAQ-zh.md#如何反馈问题)。
