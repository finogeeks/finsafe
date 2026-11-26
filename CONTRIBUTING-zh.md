# 参与贡献 finogeeks/finsafe

> 网站、用户文档、首页和仓库维护指南由本公开仓库直接维护。文档 PR 在这里审阅和合并，无需迁回私有库或等待产品发布。

**English:** [CONTRIBUTING.md](CONTRIBUTING.md)

感谢帮助改进 FinSAFE。本仓库维护**公开发布、用户文档和文档网站**：预编译 CLI 二进制、安装脚本、示例与终端用户文档，**不包含** FinSAFE 引擎源代码。

## 变更落在哪里

| 你想改什么 | 实际编写位置 | 如何贡献 |
|------------|--------------|----------|
| **`finsafe` 行为缺陷** | 私有上游 monorepo | 开 **[GitHub Issue](https://github.com/finogeeks/finsafe/issues/new)**，加 `bug` 标签并附复现步骤 |
| **发布的产品文档**（`docs/`） | 本仓库 `docs/`（含 `docs/site/`） | 直接开 **PR** |
| **issue 模板、skills** | 本仓库 | 直接开 **PR** |
| **安装脚本**（如 `install.sh`） | 上游 + 发布同步 | 提交 issue，或提议由维护者在上游修改 |
| **运行时 / Rust 代码** | 不在本仓库 | **仅 issue** — 本镜像无法合并代码 PR |

网站源文件、用户指南、插件使用说明、首页、贡献指南和 Agent 维护规则都在这里维护。
私有库发布代码及必要交付文件，包括与版本匹配的许可声明，不覆盖公开 Markdown 或 HTML 使用文档。
私有研发文档独立维护。网站检查与部署见[维护说明](docs/site/README-zh.md)。

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

行为缺陷请用 **GitHub Issues**；文档修正可以直接提交 PR：

1. 尽量使用 bug 模板（`Steps to reproduce`、`Expected`、`Actual`）。
2. 写明 **FinSAFE 版本**（`finsafe --version`）、**操作系统**、相关 **策略 YAML**。
3. Agent 提交时添加 `bug`、`product:finsafe`、`triage:pending` 和一个
   `priority:p0`–`priority:p3` 标签。网页表单自动添加前三个；选择优先级本身不会添加
   优先级标签。受信任报告人可触发自动分诊；其他报告每日批量处理。

运行时修复在上游私有仓库实现、验证、发布后，会在 issue 上回复 **Resolved** 并附版本信息。

## 在本仓库开 Pull Request

欢迎直接提交网站和文档 PR，并在本仓库合并。

1. 修改公开源文件，需要时同时更新中英文。
2. 按[网站维护说明](docs/site/README-zh.md)运行检查。公开 Pages 工作流构建 PR，并在 `main` 构建通过后部署。
3. 维护者在这里审阅并合并文档、首页和使用指南。纯文档 PR 可能标记 `triage:docs-only`。
4. 运行代码、安装脚本和版本化交付文件需在所属上游修改；工作流修改由维护者审阅。

## 本仓库不接受的内容

- Rust / 引擎修改（无源码树）
- 外部贡献者修改 `.github/workflows/`（仅维护者）
- 在公开 issue 中提交敏感安全问题 — 请通过 Finogeeks 支持渠道联系

## 发布

公开 [GitHub Releases](https://github.com/finogeeks/finsafe/releases) 发布版本化产品产物。
网站和文档从本仓库发布，无需等待产品版本或私有库同步。
