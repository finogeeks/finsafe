# 适用于 OpenCode Desktop 的 FinShield

[English](https://github.com/finogeeks/finsafe/blob/main/integrations/opencode/windows/README.md)

[产品 GitHub](https://github.com/finogeeks/finsafe) · [Safety Arena](https://safety.finaios.ai/) · [npm](https://www.npmjs.com/package/@finogeeks2026/finshield-opencode)

**让智能体开展工作，同时控制它的访问权限。**

智能体的操作不止是删除文件：它们还可能访问私人信息、干扰桌面和更改系统设置。FinShield 为 OpenCode Desktop 的执行后端增加 Windows 沙箱防护，帮助将智能体操作限制在配置的访问边界内，同时保留你原有的编码工作流程。

以下示例展示这些边界在实际场景中的作用：

| 隐私 | 桌面 | 系统 | 数据 |
| :---: | :---: | :---: | :---: |
| [![屏幕截图对比](https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/screen-capture.gif)](https://safety.finaios.ai/screen-capture/dsh/dsh-desktop-file-v3-20261109/index.html) | [![桌面干扰对比](https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/window-flood.gif)](https://safety.finaios.ai/window-flood/dsh/dsh-finshield-pro-20261105/index.html) | [![进程防护对比](https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/process-terminate.gif)](https://safety.finaios.ai/process-terminate/dsh/dsh-python-file-v2-20261111/index.html) | [![文件防护对比](https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/protected-directory-delete.gif)](https://safety.finaios.ai/protected-directory-delete/dsh/dsh-direct-v4-20261112/index.html) |
| 屏幕截图 | 干扰性弹窗 | 终止进程 | 删除受保护目录 |

这些 GIF 摘自 FinShield 已发布的 **DSH 评测**，并非 OpenCode 测试。点击 GIF 可查看测试条件、完整录像和结果。每项对比均来自分别执行的测试。

[安装](#安装) · [浏览 DSH 评测](https://safety.finaios.ai/agents/dsh/) · [评测源码与方法](https://github.com/finogeeks/agent-safety-arena)

## 环境要求

- Windows x64。
- OpenCode Desktop V2。此集成目前面向 OpenCode Desktop/SDK 2.3.0。
- 可下载插件及其原生组件的互联网连接。

如果尚未安装，请先安装 [OpenCode Desktop](https://opencode.ai/)。

## 安装

安装 OpenCode V2 CLI 后，运行：

```sh
opencode plugin add @finogeeks2026/finshield-opencode
```

重启 OpenCode Desktop 以加载插件。如果只使用桌面应用，请参阅[不使用 CLI 安装](#不使用-cli-安装)。

## 首次启动时的行为

FinShield 会在后台自动准备组件并配置 Windows 沙箱权限。这可能需要一些时间；在准备期间，你可以继续使用 OpenCode。Windows 可能会请求管理员同意。

准备就绪后，FinShield 会提示你退出并重新打开 OpenCode。此后，正常启动时会自动开启防护。你可以随时在 **Settings > FinShield** 中查看状态。

## 更新

在 FinShield 设置页使用 **Check for updates**（检查更新）。更新完成后，保存工作，退出 OpenCode，再手动打开。重新打开后，检查当前防护状态。

## 故障排查

### 不使用 CLI 安装

在 `%USERPROFILE%\.config\opencode\opencode.json` 的 `plugins` 中添加 FinShield，并保留其他设置和插件条目：

```json
{
  "plugins": ["@finogeeks2026/finshield-opencode"]
}
```

如果文件夹或文件不存在，请创建它。如果你已使用 `opencode.jsonc` 或自定义配置目录，请编辑对应的配置。重启桌面应用后，OpenCode 会自动下载并加载配置的插件。参阅 [OpenCode 插件文档](https://opencode.ai/docs/plugins/)。

### 设置中没有显示 FinShield

确认编辑的是此 Desktop 安装使用的全局配置，V2 的字段名为 `plugins`，包名为 `@finogeeks2026/finshield-opencode`。再次安装前，先检查 JSON 错误以及插件下载或加载错误。

### 插件已安装，但防护未开启

在 **Settings > FinShield** 中查看准备进度或错误。准备就绪后，按提示退出并重新打开 OpenCode，以开启防护。

## 链接与支持

- [FinShield 产品与文档](https://github.com/finogeeks/finsafe)
- [Agent Safety Arena](https://safety.finaios.ai/) · [评测源码与方法](https://github.com/finogeeks/agent-safety-arena)
- [最新产品版本](https://github.com/finogeeks/finsafe/releases)
- [报告问题](https://github.com/finogeeks/finsafe/issues/new/choose)

## 适用范围与许可

此 Windows 集成保护后端 Host，并保留 Desktop Main。网络模式为 `host`；不能将 AppContainer 集成解读为完整网络隔离的承诺。当前支持范围及尚未完成的验收限制，请参阅产品的兼容性与验证文档。

使用须遵守[随集成提供的产品许可](https://github.com/finogeeks/finsafe/blob/main/integrations/opencode/windows/LICENSE.rtf)。

## 维护者说明

<details>
<summary>源码检出中的启动、打包与验证</summary>

## 启动

正常双击打开 OpenCode。插件初始化会直接返回，不等待更新器、下载、安装、授权或页面。管理错误会保留在 Settings > FinShield 中。当前 Host 的令牌决定防护状态。
准备完成后，选择“退出 OpenCode”或“稍后”。下次正常启动会使用现有启动交接流程替换 Host，并保留 Main。原生连接必须到达该 Host，启动交接才算完成。
受保护会话会在设置中显示当前状态。

```mermaid
flowchart LR
    A[OpenCode 原生启动] --> B[桌面可用]
    A -.插件激活.-> U[OpenCode 更新器]
    U --> E[准备目标并提供退出或稍后选项]
    E --> M[用户手动关闭并打开 OpenCode]
    M --> H[启动 AppSeam 交接并保留 Main]
    H --> C[原生恢复重新连接现有桌面]
```

## 构建与打包

如需本地 npm 式体验，请使用源码检出中已提交的 `docs/local-npm.md`。该流程提供插件、匹配的 SDK 和原生安装程序，然后输出正常的 `opencode plugin add` 命令。它不会替用户安装插件或启动 OpenCode。

配置源更改时，从产品清单生成随包提供的 Candidate。在本目录运行：

```powershell
npm ci --ignore-scripts
npm run build:policy
npm run build
npm pack --ignore-scripts --pack-destination C:\owned-test
```

包内包含 JavaScript、Candidate 和声明文件。独立更新器使用 OpenCode 已安装的 Bun 运行时；用户无需另外安装 Node 或 Bun。声明的 SDK 包含 Koffi 和共用产品 DLL。在匹配的 SDK 发布前进行开发时，按源码检出中 `sdk/node/README.md` 的 SDK 构建说明完成构建和打包，并从本地归档安装。

将归档安装到自有包目录，并把安装后的包目录添加到 OpenCode 的全局 `opencode.json`：

```json
{"plugins":[{"package":"C:/owned-test/packages/node_modules/@finogeeks2026/finshield-opencode"}]}
```

受管理的原生版本使用 `%ProgramFiles%\FinSAFE\opencode-plugin-versions\<version>`。
配置使用 `%ProgramData%\FinSAFE\opencode-plugin-versions\<version>\config`。
安全域为 `finshield.opencode`。产品源文件位于 `windows/config/opencode-plugin/`。安装规则以只读方式覆盖稳定的父目录。生成的 Candidate 位于 `policy/`。
下载和更新器暂存分别使用 `%LOCALAPPDATA%\FinSAFE` 下的 `opencode-plugin` 和 `opencode-updater` 位置。

更新器通过共用 SDK 安装并授权所选版本。更新时，它暂存现有所需 Candidate。如果与原型默认值完全一致，则选择新版本随包提供的正式 Candidate。
匹配的 FinSAFE 可执行文件支持 `app launch opencode --retain-main PID:CREATED --replace-host PID:CREATED`。移除插件后，原生运行时、配置和授权仍会保留。

OpenCode 配置是唯一的用户配置入口。插件根据请求的发行版本和 Windows 已知文件夹推导原生路径及配置路径。手动覆盖原生可执行文件、YAML 和版本根目录的方式已停用。
插件不会读写 `finsafe-windows/config.json`，不会迁移旧快照，也不会保存运行时进程与资源数据。更新器在内存中保留明确的更新目标；安装注册和授权仍由原生组件负责。

## 验证

使用插件自身的驱动程序，先阅读计划：

```powershell
python test/verify.py --lane unit --lane native --lane page --dry-run
python test/verify.py --lane unit --lane native --lane page
```

以前使用外部实例的 `installed` 验证通道已停用。使用本地打包的 SDK 进行验证时，请设置 `FINSHIELD_OPENCODE_SDK_ARCHIVE`。
最终阶段的 `product` 通道使用正常插件安装流程，打开自有 Windows 快捷方式，观察实际令牌、原生连接及会话，并检查共用文件哈希未改变。它需要已声明的可弃用 Windows 测试账户及其专用授权；不要在日常工作桌面运行。
`policy` 通道仅使用明确指定的兼容 FinSAFE 可执行文件和临时文件。最终阶段的 `product`、`lifecycle` 和 `isolation` 需要各自声明的自有输入，不属于自动单元检查。

跨原生版本的授权复用、模型/MCP/网络场景、完整崩溃恢复及多窗口恢复仍未通过验收。网络模式为 `host`。SDK 依赖树有 24 项中等严重度审计发现；这里不作公开发布就绪声明。

</details>
