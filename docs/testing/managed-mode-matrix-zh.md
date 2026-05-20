# 托管模式验收矩阵

托管模式验收的手动测试清单（计划 §14）。可在 Linux 上脚本化的子集：`scripts/managed-mode/run-suite.sh` 与 `scripts/managed-mode/tamper-suite.sh`（位于 FinSAFE 源码仓库，公开发行版文档中仅作引用）。

**English:** [managed-mode-matrix.md](./managed-mode-matrix.md)

| # | 场景 | 预期 | Linux 脚本 |
|---|------|------|------------|
| 1 | 全新注册 + 拉取 | Agent 写入 `enrolled.json`，在 UDS 上提供策略 | `run-suite.sh enroll` |
| 2 | 托管 `finsafe run -- true` | 退出码 0，JSON 审计中 `policy_source=managed` | `run-suite.sh run` |
| 3 | 已注册时使用 `--policy` | `MANAGED_POLICY_LOCAL_OVERRIDE` | `tamper-suite.sh local-policy` |
| 4 | 有哨兵时使用 `--personal` | `MANAGED_FORCED_BY_POLICY` | `tamper-suite.sh personal-flag` |
| 5 | Kill switch 激活 | 拒绝新运行；进行中的任务收到通知 | 手动 |
| 6 | Bundle 轮换 | 更高版本替换缓存 | `run-suite.sh rotate` |
| 7 | Bundle 降级 | 校验阶段拒绝 | 单元测试（`finsafe-bundle`） |
| 8 | Bundle 过期 + deny stale | `MANAGED_DAEMON_UNREACHABLE` / 拒绝 | 手动 |
| 9 | 守护进程停止 | CLI 无法解析策略 | `tamper-suite.sh daemon-down` |
| 10 | 审计 spool 上传 | 事件出现在 authority DB | `run-suite.sh audit` |
| 11 | 心跳篡改标记 | Authority 设置 `tamper_suspected` | 手动 |
| 12 | UDS challenge 失败 | 错误密钥 → challenge 错误 | `tamper-suite.sh uds-stub` |
| 13 | 个人机（无哨兵） | 旧版 `--policy` 行为不变 | `run-suite.sh personal` |
| 14 | 时钟回拨 | 单调时间下限检测到回拨 | 单元测试（`finsafe-bundle::clock_floor`） |
| 18 | 无商业许可证 | 管理/注册返回 `402` + `LICENSE_MISSING` | `license-suite.sh missing` |
| 19 | 有效许可证 | `GET /v1/license/status` 为 valid/grace；管理与注册 `200` | `license-suite.sh licensed` |
| 20 | 席位上限 | 第 N+1 次注册返回 `402` + `LICENSE_SEAT_LIMIT` | `license-suite.sh seat-limit` |
| 21 | 许可证 + 托管冒烟（macOS） | 发布 bundle、注册、`finsafe run --json` 退出 0 或 `policy_source=managed` | `e2e-licensing-macos.sh` |

**macOS 许可证 E2E：** [licensing-e2e-macos-zh.md](./licensing-e2e-macos-zh.md)

## macOS 说明

对表中标注为 *手动* 的项，在 macOS 上使用 LaunchDaemon（[`packaging/launchd/`](../../packaging/launchd/)）。需要 root 拥有的 `/etc/finsafe` 的篡改场景须通过管理员描述文件安装。
