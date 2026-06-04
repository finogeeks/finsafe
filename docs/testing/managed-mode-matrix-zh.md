# 托管模式验收矩阵

托管模式验收的手动测试清单。

> **读者：** 进行**托管模式试点**的客户 IT 与安全团队。将各行作为签收检查清单。部署：[finsafe-enterprise-setup 技能](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-enterprise-setup/SKILL-zh.md)、[enterprise-deployment-runbook-zh.md](../enterprise-deployment-runbook-zh.md)、[licensing-e2e-macos-zh.md](./licensing-e2e-macos-zh.md)。单机实验：[managed-lab-zh.md](./managed-lab-zh.md)。

**English:** [managed-mode-matrix.md](./managed-mode-matrix.md)

| # | 场景 | 预期 | 试点验证方式 |
|---|------|------|--------------|
| 1 | 全新注册 + 拉取 | `enrolled.json`，UDS 提供策略 | 注册脚本 + `test -f /etc/finsafe/enrolled.json` |
| 2 | 托管 `finsafe run -- true` | 退出 0，`policy_source=managed` | `finsafe run --json -- /usr/bin/true` |
| 3 | 已注册时 `--policy` | `MANAGED_POLICY_LOCAL_OVERRIDE` | 在 fleet 二进制上传入 `--policy` |
| 4 | 有哨兵时 `--personal` | `MANAGED_FORCED_BY_POLICY` | 手工 |
| 5 | Kill switch | 拒绝新运行 | Admin UI |
| 6 | Bundle 轮换 | 高版本替换缓存 | `bundlectl` 发布更高版本 |
| 7 | Bundle 降级 | 校验拒绝 | 发布更低版本；agent 应拒绝 |
| 8 | 过期 + deny stale | 守护进程不可达 | 按 runbook 处理 |
| 9 | 守护进程停止 | CLI 无法解析策略 | 停止 agent |
| 10 | 审计上传 | DB 中有事件 | Admin UI |
| 11 | 心跳篡改 | 摘要不一致 | 手工安全审查 |
| 12 | UDS challenge 失败 | 错误对端 | 手工（Windows：命名管道 challenge） |
| 13 | 个人机（无哨兵） | 旧 `--policy` | 舰队需哨兵 |
| 14 | 时钟回拨 | 检测到回拨 | 手工 |
| 15 | 移除哨兵 | 个人路径或错误 | 移除哨兵后验证 |
| 16 | 缓存篡改 | 校验/拉取失败 | 手工 |
| 17 | 错误 CLI 构建 | 无托管能力 | 仅用 **`finsafe-fleet-v*`**（非个人版 `finsafe-v*`） |
| 18 | 无商业许可证 | `402` + `LICENSE_MISSING` | 无 `license.jws` 时 curl |
| 19 | 有效许可证 | status valid/grace；管理/注册 `200` | [licensing-e2e-macos-zh.md](./licensing-e2e-macos-zh.md) |
| 20 | 席位上限 | `LICENSE_SEAT_LIMIT` | 超额注册 |
| 21 | macOS 许可证+托管冒烟 | bundle + 注册 + `finsafe run --json` | [managed-mode-macos-runbook.md](./managed-mode-macos-runbook.md) 或 [managed-lab-zh.md](./managed-lab-zh.md) |
| 22 | HTTPS 检查（`mitm_tls_terminate`） | 已创建 CA；发布 `tls_terminate: true`；试点 curl + 审计含 `tls_terminated` | [https-inspection-runbook-zh.md](../https-inspection-runbook-zh.md) |

**macOS 许可证：** [licensing-e2e-macos-zh.md](./licensing-e2e-macos-zh.md)

## 隔离状态（Lab）

[`scripts/managed-lab.sh`](../../scripts/managed-lab.sh) 将哨兵、注册、agent 套接字、缓存与审计放在 **`~/.finsafe-lab`**（可用 `FINSAFE_LAB_DIR` 覆盖）。端点上也可设置 **`FINSAFE_MANAGED_STATE_DIR`** 将托管路径重定向到非生产目录树。

## macOS

[managed-mode-macos-runbook.md](./managed-mode-macos-runbook.md)、[packaging/launchd/](https://github.com/finogeeks/finsafe/tree/main/packaging/launchd/)。
