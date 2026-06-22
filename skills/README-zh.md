# FinSAFE 运维技能（供 AI Agent）

**English:** [README.md](./README.md)

本目录下每个技能均为**自包含**：运维人员只需 [GitHub Releases](https://github.com/finogeeks/finsafe/releases) 中的对应二进制与本技能文件，**无需**本地克隆文档仓库。

## 在 Agent 中使用

1. 将技能文件交给 Agent（例如 `finsafe-bundlectl/SKILL-zh.md`）。
2. 确保 `finsafe-bundlectl` 在 `PATH` 上，并按技能设置环境变量。
3. 技能内已含安装、命令、故障排查与最小策略 YAML 示例。

## Agent 沙箱（Hermes、OpenCode、agy 等）

**从这里开始：** [docs/agent-sandbox-guide-zh.md](../docs/agent-sandbox-guide-zh.md) · [English](../docs/agent-sandbox-guide.md) — 含 Agent 专用 **`learn` / `explain`** 流程。

| 技能 | 文件 | 适用场景 |
|------|------|----------|
| **finsafe-agent-sandbox-run** | [SKILL-zh.md](./finsafe-agent-sandbox-run/SKILL-zh.md) · [English](./finsafe-agent-sandbox-run/SKILL.md) | 运行 Agent；用 **`learn`**、**`explain`**、`--audit`、trace 迭代策略 |
| **finsafe-agent-sandbox-verify** | [SKILL.md](./finsafe-agent-sandbox-verify/SKILL.md) | Agent 能跑后：证明隔离 |
| **finsafe-trace-denials** | [SKILL.md](./finsafe-trace-denials/SKILL.md) | macOS：**`learn`** 报 0 拒绝但 stderr 仍拒绝时 |

## 企业舰队

| 技能 | 文件 | 适用场景 |
|------|------|----------|
| **finsafe-enterprise-setup** | [SKILL-zh.md](./finsafe-enterprise-setup/SKILL-zh.md) · [English](./finsafe-enterprise-setup/SKILL.md) | 托管舰队端到端 |
| **finsafe-bundlectl** | [SKILL-zh.md](./finsafe-bundlectl/SKILL-zh.md) · [English](./finsafe-bundlectl/SKILL.md) | bundle 发布 + MDM 哨兵 |

## 可选延伸阅读（仅完整 URL）

技能正文不依赖仓库内相对路径。需要更多背景时：

- https://github.com/finogeeks/finsafe/releases
- https://github.com/finogeeks/finsafe/tree/main/docs
