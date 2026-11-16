# 参与贡献 finogeeks/finsafe

**English:** [CONTRIBUTING.md](CONTRIBUTING.md)

感谢帮助改进 FinSAFE。本仓库是**公开发布镜像**：预编译 CLI 二进制、安装脚本、示例与终端用户文档，**不包含** FinSAFE 引擎源代码。

## 变更落在哪里

| 你想改什么 | 实际编写位置 | 如何贡献 |
|------------|--------------|----------|
| **`finsafe` 行为缺陷** | 私有上游 monorepo | 开 **[GitHub Issue](https://github.com/finogeeks/finsafe/issues/new)**，加 `bug` 标签并附复现步骤 |
| **发布的产品文档**（`docs/`） | 上游 `docs/public-finsafe/docs/product/` | 开 **issue** 说明修改，或在此开 **PR** 作为建议（见下文） |
| **报障规范、issue 模板、skills、根目录 README** | 本仓库 | 直接开 **PR** |
| **安装脚本**（`install.sh`、`install.ps1` 等） | 上游 + 发布同步 | 同文档 — 优先 issue |
| **运行时 / Rust 代码** | 不在本仓库 | **仅 issue** — 本镜像无法合并代码 PR |

发布流程将上游批准的产品文档同步到 `docs/`，并分别发布指定的接入与开发套件文件。
产品文档修改需回到上游源文件，才能在下次发布后保留。
根目录报障规范、issue 模板和 skills 在本仓库维护，发布时会保留；
不会再将旧文档目录整体覆盖到本仓库。

## 推荐入口：Issue

FinSAFE / FinShield 的新问题统一在本仓库提交。原 `finogeeks/product-bugs`
中的问题，只迁入已确认在最新适用版本仍存在的条目，并保留来源、证据和后续更正。

测试人员可打开本仓库，对 Agent 说：

```text
阅读 AGENTS.md 和 skills/finsafe-report-bug/SKILL.md。
我在测试 FinSAFE / FinShield，要报告一个 bug。
版本：<产品与插件版本>
现象：<描述问题>
请帮我收集证据，并准备提交到本仓库的英文 issue。
```

可以用中文交流，Agent 会补齐信息、检查重复并准备英文 issue。
只要求准备草稿时不会发布；确认后说“发布这个 issue”。已经明确要求提报或迁移时，
无需重复确认同一操作。

缺陷与文档修正请用 **GitHub Issues**：

1. 尽量使用 bug 模板（`Steps to reproduce`、`Expected`、`Actual`）。
2. 写明 **FinSAFE 版本**（`finsafe --version`）、**操作系统**、相关 **策略 YAML**。
3. Agent 提交时添加 `bug`、`product:finsafe`、`triage:pending` 和一个
   `priority:p0`–`priority:p3` 标签。网页表单自动添加前三个；选择优先级本身不会添加
   优先级标签。受信任报告人可触发自动分诊；其他报告每日批量处理。

运行时修复在上游私有仓库实现、验证、发布后，会在 issue 上回复 **Resolved** 并附版本信息。

## 在本仓库开 Pull Request

欢迎把 PR 当作**建议**，尤其是 `docs/`、`examples/`、`packaging/`、`skills/` 下的文档。

开 PR 后：

1. 机器人会说明镜像工作流。
2. 发布管理的产品文档和交付文件需移植到上游源文件；报障规范、模板、skills 和根目录说明可在本仓库直接 review 和合并。
3. 纯文档 PR 可能打上 `triage:docs-only`；运行时或超出范围的 PR 会关闭并引导开 issue。

移植时会尽量在上游提交信息中保留贡献者署名。

## 本仓库不接受的内容

- Rust / 引擎修改（无源码树）
- 外部贡献者修改 `.github/workflows/`（仅维护者）
- 在公开 issue 中提交敏感安全问题 — 请通过 Finogeeks 支持渠道联系

## 发布

公开 [GitHub Releases](https://github.com/finogeeks/finsafe/releases) 发布 CLI 包与同步后的文档。
文档修正会在**下一次**发布（或维护者单独 docs 同步）后出现在 `main`。
