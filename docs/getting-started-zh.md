# FinShield 快速上手

[English](getting-started-en.md) · [文档目录](README-zh.md) · [Agent 安全测评](https://agent-safety-arena.finogeeks.club/zh-CN.html) ([English](https://agent-safety-arena.finogeeks.club/index.html))

[文档目录](README-zh.md) · [产品首页](https://github.com/finogeeks/finsafe)

选择操作系统，下载对应发行文件。Windows 推荐安装助手，也可下载离线 EXE；macOS 与 Linux 使用命令行压缩包。本文下载信息于 2026-11-03 按 [v0.10.1](https://github.com/finogeeks/finsafe/releases/tag/v0.10.1) 核对，后续版本以 [最新 Release](https://github.com/finogeeks/finsafe/releases/latest) 的附件与说明为准。

## Windows

1. 先安装你要使用的 WorkBuddy 或 DSH。FinShield 不代替这些智能体，也不代办账号登录。
2. [下载 `install-finshield.cmd`](https://github.com/finogeeks/finsafe/releases/latest/download/install-finshield.cmd) 并双击运行。安装助手使用英文提示，按 Enter 开始下载最新稳定版，并校验 SHA-256 和发布者数字签名。出现管理员授权窗口时确认，再按向导完成安装。离线安装可直接运行同一版本的 `finshield-<版本>-x64-setup.exe`。
3. 安装结束后找到桌面悬浮控件。显示“待准备”时，点击圆形按钮，再选“开始准备”；首次需要确认权限时，在辅助控制台检查范围并授权。Windows 可能请求管理员确认。
4. 等到“智能体待命”，展开控件图标，选择 WorkBuddy 或 DSH。目录无效时，再进入辅助控制台修正：WorkBuddy 需要安装目录；DSH 需要 Node.js 与 DSH 两个目录。
5. 点击可启动的智能体图标，等待确认运行后开始任务。之后再次点击带绿色状态点的图标，即可打开已有实例；日常无需保持网页打开。

首次使用建议从一个空的测试工作区开始。让智能体在已授权的可写目录里创建 `finshield-demo.txt`，写入“测试完成”，再读取它。确认基本功能可用后，按下方[验证授权范围](#验证授权范围)检查只读和禁止访问范围。

普通双击打开 FinShield 不会自动开始新的授权。看到“待准备”时，主动选择“开始准备”；“智能体待命”表示可以选择已接入的智能体。安装完成、安全准备完成和智能体运行是三个不同状态。

## macOS

当前公开包面向 Apple 芯片；`v0.10.1` 没有 Intel 包，勿使用旧版 Intel 包代替当前版本。

1. 在 Releases 下载 `finshield-<版本>-macos-arm64.tar.zst`。
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

不要将“直接启动 Hermes”视为同一个受保护入口。网络与隐私检查的覆盖范围见 [Linux/macOS 资料安全说明](finsafe-linux-macos-overview-zh.html#data)。

## Linux

当前公开构建目标为 x86_64 GNU/Linux。

1. 下载 `finshield-<版本>-linux-x64.tar.zst` 并解压。
2. 保留包内配套程序，特别是 `finsafe-helper`、`finsafe-supervisor` 和 `finsafe-landlock-shim`；不要只复制主程序。
3. 在解压后的目录运行：

```sh
./finsafe --version
./finsafe probe
./finsafe doctor
./finsafe --help
```

Linux 的实际能力取决于 bubblewrap、cgroup、内核与授权配置。按诊断结果和该版本的发行说明完成主机准备，再通过该版本支持的 FinShield 入口运行 Agent。命令行检查通过不能代替实际任务验证。

## 验证授权范围

使用专用测试目录和测试文件，按实际授权范围验证：

| 范围 | 测试方式 | 预期 |
| --- | --- | --- |
| 可读写工作区 | 创建、读取并修改 `finshield-demo.txt` | 操作成功，文件变化可见 |
| 已设为只读的目录 | 读取测试文件，再尝试修改 | 可读取，修改被拒，原内容保留 |
| 已设为禁止访问的目录 | 尝试读取预先存在的测试文件 | 读取被拒 |

判断以工具返回、文件内容和目录状态为准。模型口头拒绝、文件不存在或路径写错，都不能证明防护生效。直接从原厂快捷方式启动的应用不能默认视为受保护；网络与内容检查也仅覆盖已接入、可检查的路径。

## 升级与卸载

Windows `v0.10.1` 可从控件或控制台检查更新，自动检查至少间隔 24 小时，手动检查可随时发起。安装新版 EXE 时，按向导处理正在运行的应用，再检查授权范围和启动状态。卸载通过 Windows“设置 → 应用 → 已安装的应用”中的 FinShield／历史 FinSafe 条目完成。

该版本在更新检查请求中上报基本使用统计，不再提供统计开关；安装包从 GitHub 或 CDN 下载。详见 [v0.10.1 发行说明](https://github.com/finogeeks/finsafe/releases/tag/v0.10.1)。

macOS 和 Linux 更新时，先结束受保护任务，再用同一版本的整套发行文件替换原目录。移除命令行程序与清理配置、模型、证书、记录是不同操作；需要清理这些数据时，按对应版本的说明执行，勿直接删掉仍在使用的文件。

## 获取帮助

在 [GitHub Issues](https://github.com/finogeeks/finsafe/issues/new/choose) 反馈问题时，请提供产品版本、操作系统与 CPU 架构、Agent 名称与版本、启动入口、复现步骤、预期与实际结果，以及经过脱敏的错误文字或日志。

请勿提交真实客户资料、密钥、会话令牌或完整敏感对话。敏感安全问题请通过已有 Finogeeks 支持渠道私下反馈。
