# FinSAFE 运维技能（供 AI Agent）

**English:** [README.md](./README.md)

本目录下每个技能均为**自包含**：运维人员只需 [GitHub Releases](https://github.com/finogeeks/finsafe/releases) 中的对应二进制与本技能文件，**无需**本地克隆文档仓库。

## 在 Agent 中使用

1. 将技能文件交给 Agent（例如 `finsafe-bundlectl/SKILL-zh.md`）。
2. 确保 `finsafe-bundlectl` 在 `PATH` 上，并按技能设置环境变量。
3. 技能内已含安装、命令、故障排查与最小策略 YAML 示例。

## 可用技能

| 技能 | 文件 | 适用场景 |
|------|------|----------|
| **finsafe-enterprise-setup** | [SKILL-zh.md](./finsafe-enterprise-setup/SKILL-zh.md) · [English](./finsafe-enterprise-setup/SKILL.md) | 托管舰队端到端：authority、Finogeeks `license.jws`、MDM、试点验收 |
| **finsafe-bundlectl** | [SKILL-zh.md](./finsafe-bundlectl/SKILL-zh.md) · [English](./finsafe-bundlectl/SKILL.md) | 构建 / 签名 / 发布 bundle；MDM 哨兵 |

## 可选延伸阅读（仅完整 URL）

技能正文不依赖仓库内相对路径。需要更多背景时：

- https://github.com/finogeeks/finsafe/releases
- https://github.com/finogeeks/finsafe/tree/main/docs
