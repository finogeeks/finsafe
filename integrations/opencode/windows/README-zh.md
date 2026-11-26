# 适用于 OpenCode Desktop 的 FinShield

**[使用文档](https://finshield.finogeeks.club/zh-CN/agents/opencode.html) · [安全测评](https://safety.finaios.ai/) · [English](README.md)**

**让 Agent 帮你做事，也给它划清边界。**

Agent 的操作不止是删除文件：它们还可能访问私人信息、干扰桌面和更改系统设置。FinShield 为 OpenCode Desktop 的执行后端增加 Windows 沙箱防护，控制它对文件、系统和桌面的访问与操作，保留你原有的编码工作流程。

## 看看防护效果

下面的动图展示 FinShield 在四类风险场景中的防护效果：

| 隐私 · 截屏访问 | 桌面 · 弹窗干扰 | 系统 · 进程保护 | 数据 · 文件保护 |
| :---: | :---: | :---: | :---: |
| [![截屏访问对照实测](https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/screen-capture.gif)](https://safety.finaios.ai/screen-capture/dsh/dsh-desktop-file-v3-20261109/zh-CN.html) | [![桌面干扰对照实测](https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/window-flood.gif)](https://safety.finaios.ai/window-flood/dsh/dsh-finshield-pro-20261105/zh-CN.html) | [![进程保护对照实测](https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/process-terminate.gif)](https://safety.finaios.ai/process-terminate/dsh/dsh-python-file-v2-20261111/zh-CN.html) | [![文件保护对照实测](https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/protected-directory-delete.gif)](https://safety.finaios.ai/protected-directory-delete/dsh/dsh-direct-v4-20261112/zh-CN.html) |

这些 GIF 摘自 Finogeeks 已发布的 **DSH 测评，并非 OpenCode 测试**。点击动图查看完整录像、测试条件与结果。对照画面来自不同测试运行，不能作为当前 OpenCode 插件已通过相同测评的依据。

## 环境要求

- Windows x64。
- OpenCode Desktop V2；此集成面向 Desktop/SDK 2.3.0。
- 可下载插件及原生组件的互联网连接。

## 安装

1. **添加插件。** 可以使用 OpenCode V2 CLI 时，运行：

   ```sh
   opencode plugin add @finogeeks2026/finshield-opencode
   ```

   只有桌面应用、没有 CLI 时，按[不使用 CLI 的安装说明](https://finshield.finogeeks.club/zh-CN/agents/opencode.html#不使用-cli-安装)添加插件。

2. **打开插件页面。** 重新打开 OpenCode Desktop，进入 **Settings → FinShield**，查看组件准备进度。
3. **完成首次准备。** FinShield 会在后台下载和准备组件，Windows 可能请求管理员授权。准备期间可以继续使用 OpenCode；等待页面提示准备完成。
4. **重新打开并确认保护。** 收到提示后保存工作，退出 OpenCode，再手动打开。回到 **Settings → FinShield**，确认实际保护状态。如果尚未受保护，先查看页面上的准备进度或错误提示。

## 防护范围

此 Windows 集成保护执行后端，并保留桌面界面。文件、系统和桌面边界按实际配置生效。默认网络模式为 `host`：显示“受保护”不代表启用了 FinShield 网站黑名单、HTTPS 内容检查或 PII 脱敏。

具体权限及设置的作用见[防护范围与配置说明](https://finshield.finogeeks.club/zh-CN/protection/)。

## 日常使用与支持

- **查看状态：** 随时打开 **Settings → FinShield** 查看准备进度与实际保护状态。
- **更新：** FinShield 页面会检查插件包更新。有新版本时选择**安装更新**，按提示完成准备，并在要求时重新打开 OpenCode，再确认保护状态。
- **故障排查：** 设置中找不到 FinShield，或准备完成后仍未受保护时，见[故障排查说明](https://finshield.finogeeks.club/zh-CN/agents/opencode.html#故障排查)。

遇到问题时，建议使用插件中的**反馈问题**入口附带当前版本和状态，也可[直接反馈](https://github.com/finogeeks/finsafe/issues/new/choose)。

使用须遵守[产品许可](LICENSE.rtf)，另见[第三方声明](THIRD-PARTY-NOTICES.md)。
