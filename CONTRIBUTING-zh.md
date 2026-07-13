# 参与贡献 finogeeks/finsafe

**English:** [CONTRIBUTING.md](CONTRIBUTING.md)

感谢帮助改进 FinSAFE。本仓库是**公开发布镜像**：预编译 CLI 二进制、安装脚本、示例与终端用户文档，**不包含** FinSAFE 引擎源代码。

## 变更落在哪里

| 你想改什么 | 实际编写位置 | 如何贡献 |
|------------|--------------|----------|
| **`finsafe` 行为缺陷** | 私有上游 monorepo | 开 **[GitHub Issue](https://github.com/finogeeks/finsafe/issues/new)**，加 `bug` 标签并附复现步骤 |
| **文档**（指南、安装说明） | 上游 `docs/public-finsafe/` | 开 **issue** 说明修改，或在此开 **PR** 作为建议（见下文） |
| **安装脚本**（`install.sh`、`install.ps1` 等） | 上游 + 发布同步 | 同文档 — 优先 issue |
| **运行时 / Rust 代码** | 不在本仓库 | **仅 issue** — 本镜像无法合并代码 PR |

每次公开发布时，维护者会从上游 **rsync** `docs/public-finsafe/` 到本仓库 `main`。
**仅**在 `finogeeks/finsafe` 合并、未回上游的修改会在下次同步时被**覆盖**。

## 推荐入口：Issue

缺陷与文档修正请用 **GitHub Issues**：

1. 尽量使用 bug 模板（`Steps to reproduce`、`Expected`、`Actual`）。
2. 写明 **FinSAFE 版本**（`finsafe --version`）、**操作系统**、相关 **策略 YAML**。
3. 受信任报告人带 `bug` 标签可触发自动分诊；其他报告每日批量处理。

运行时修复在上游私有仓库实现、验证、发布后，会在 issue 上回复 **Resolved** 并附版本信息。

## 在本仓库开 Pull Request

欢迎把 PR 当作**建议**，尤其是 `docs/`、`examples/`、`packaging/`、`skills/` 下的文档。

开 PR 后：

1. 机器人会说明镜像工作流。
2. **不要指望直接在 `finogeeks/finsafe` 合并**。维护者会把实质修改移植到上游 `docs/public-finsafe/`，并关闭你的 PR 并附上上游链接。
3. 纯文档 PR 可能打上 `triage:docs-only`；运行时或超出范围的 PR 会关闭并引导开 issue。

移植时会尽量在上游提交信息中保留贡献者署名。

## 本仓库不接受的内容

- Rust / 引擎修改（无源码树）
- 外部贡献者修改 `.github/workflows/`（仅维护者）
- 在公开 issue 中提交敏感安全问题 — 请通过 Finogeeks 支持渠道联系

## 发布

公开 [GitHub Releases](https://github.com/finogeeks/finsafe/releases) 发布 CLI 包与同步后的文档。
文档修正会在**下一次**发布（或维护者单独 docs 同步）后出现在 `main`。
