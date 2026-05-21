# 托管模式验收矩阵

托管模式验收的手动测试清单。

> **读者**
>
> | 角色 | 用法 |
> |------|------|
> | **客户 IT / 试点** | 将各行作为**检查清单**。[finsafe-enterprise-setup 技能](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-enterprise-setup/SKILL-zh.md)、[enterprise-deployment-runbook-zh.md](../enterprise-deployment-runbook-zh.md)、[licensing-e2e-macos-zh.md](./licensing-e2e-macos-zh.md#客户试点验收)。 |
> | **Finogeeks 工程** | 使用**私有源码仓库**中的 **Automation** 列（`scripts/managed-mode/*`、`cargo test`）。 |

**English:** [managed-mode-matrix.md](./managed-mode-matrix.md)

| # | 场景 | 预期 | 自动化（Finogeeks 私有仓库） | 客户试点 |
|---|------|------|------------------------------|----------|
| 1 | 全新注册 + 拉取 | `enrolled.json`，UDS 提供策略 | `run-suite.sh enroll` | 注册脚本 + `test -f /etc/finsafe/enrolled.json` |
| 2 | 托管 `finsafe run -- true` | 退出 0，`policy_source=managed` | `run-suite.sh run` | `finsafe run --json -- /usr/bin/true` |
| 3 | 已注册时 `--policy` | `MANAGED_POLICY_LOCAL_OVERRIDE` | `tamper-suite.sh local-policy` | 手工 |
| 4 | 有哨兵时 `--personal` | `MANAGED_FORCED_BY_POLICY` | `tamper-suite.sh personal-flag` | 手工 |
| 5 | Kill switch | 拒绝新运行 | 手动 | Admin UI |
| 6 | Bundle 轮换 | 高版本替换缓存 | `run-suite.sh rotate` | `bundlectl` 发布更高版本 |
| 7 | Bundle 降级 | 校验拒绝 | `cargo test -p finsafe-bundle` | N/A |
| 8 | 过期 + deny stale | 守护进程不可达 | 手动 | runbook |
| 9 | 守护进程停止 | CLI 无法解析策略 | `tamper-suite.sh daemon-kill` | 停止 agent |
| 10 | 审计上传 | DB 中有事件 | `run-suite.sh audit` | Admin UI |
| 11 | 心跳篡改 | 摘要不一致 | `tamper-suite.sh binary-swap` | 手工 |
| 12 | UDS challenge 失败 | 错误对端 | `tamper-suite.sh uds-stub` | N/A |
| 13 | 个人机（无哨兵） | 旧 `--policy` | `run-suite.sh personal` | 舰队需哨兵 |
| 14 | 时钟回拨 | 检测到回拨 | `tamper-suite.sh clock-rollback` | 手工 |
| 15 | 移除哨兵 | 个人路径或错误 | `tamper-suite.sh sentinel-removal` | 手工 |
| 16 | 缓存篡改 | 校验/拉取失败 | `tamper-suite.sh cache-tamper` | 手工 |
| 17 | 私有 cargo 安装 | 无托管符号 | `tamper-suite.sh no-managed-feature` | 仅用 **`finsafe-fleet-v*`** |
| 18 | 无商业许可证 | `402` + `LICENSE_MISSING` | `license-suite.sh missing` | curl 无证 |
| 19 | 有效许可证 | status valid/grace；管理/注册 `200` | `license-suite.sh licensed` | [licensing-e2e 客户节](./licensing-e2e-macos-zh.md#客户试点验收) |
| 20 | 席位上限 | `LICENSE_SEAT_LIMIT` | `license-suite.sh seat-limit` | 超额注册 |
| 21 | macOS 许可证+托管冒烟 | bundle + 注册 + `finsafe run --json` | `e2e-licensing-macos.sh` | [managed-mode-macos-runbook.md](./managed-mode-macos-runbook.md) |

**macOS 许可证：** [licensing-e2e-macos-zh.md](./licensing-e2e-macos-zh.md)

## Harness（Finogeeks 工程 — Linux）

隔离状态目录（`FINSAFE_MANAGED_STATE_DIR`）：`managed-required.json`、`enrolled.json`、`agent.sock`、`cache/`、`audit/`。

构建（仅私有仓库）：

- 个人：`scripts/build-finsafe-personal.sh`
- 企业：`scripts/build-finsafe-enterprise.sh`

```bash
./scripts/build-finsafe-enterprise.sh
./scripts/managed-mode/tamper-suite.sh all
./scripts/managed-mode/run-suite.sh all
```

## macOS

[managed-mode-macos-runbook.md](./managed-mode-macos-runbook.md)、[packaging/launchd/](https://github.com/finogeeks/finsafe/tree/main/packaging/launchd/)。
