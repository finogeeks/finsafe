# 包装策略速查（`kind: local-wrapper`）

运维通过 **`finsafe --policy`** 传入 **包装策略** YAML。本文汇总 **Stage 1** 字段。CLI 会将其编译为与主机相关的执行配置；**通常不需要**手写内部执行层 JSON。

English: [POLICY-QUICKREF.md](POLICY-QUICKREF.md)

## 最小骨架

```yaml
schema_version: 1
kind: local-wrapper
program_mode: short-lived    # 或: interactive
degrade:
  allow_fallback: true
audit:
  require_policy_digest: true
  require_resolved_posture: true
stdio:
  mode: inherit              # capture | inherit | null | pty（可选；对 `run` 建议显式写）
network: none               # 或: host
resources:
  memory_max: 512M
  pids_max: "128"
  cpu_max: "100000 100000"
  # timeout_ms: 300000      # 可选：`run` 墙上时钟上限
filesystem:
  read_only_paths: ["/usr"]
  read_write_paths: ["./workspace"]
```

## 字段语义

| 字段 | 含义 |
|------|------|
| `schema_version` | 包装策略 schema 版本。当前 Stage 1 使用 `1`。 |
| `kind` | 必须为 `local-wrapper`。 |
| `program_mode` | `interactive` → 使用 **`finsafe self-confine`**；`short-lived` → 使用 **`finsafe run`**。与 CLI 子命令不一致会被拒绝。 |
| `degrade.allow_fallback` | 为 `false` 时，若无法施加最严格姿态则 **拒绝启动**；为 `true` 时，允许在审计约束下的显式降级。 |
| `degrade.prompt_on_macos_arm64_missing_apple_container` | 原生 macOS Seatbelt 包装流程下 **已弃用 / 忽略**；新文件请省略。旧文件若仍含此项可保留。 |
| `audit.require_policy_digest` | 若审计信封中未记录包装策略摘要，则拒绝启动。 |
| `audit.require_resolved_posture` | 若未记录解析后的主机姿态，则拒绝启动。 |
| `stdio.mode` | 子进程标准 IO，用于 **`run`**：`capture`、`inherit`、`null` 或 `pty`。文本模式运行通常受此控制；`--json` 往往在未覆盖时偏向 capture。 |
| `macos_seatbelt.deny_outbound_ports` | 可选：在 `network: host` 时于 Seatbelt 配置中按 **TCP 端口** 拒绝出站（粗粒度；非按域名）。 |
| `network` | `none` 或 `host`（Stage 1）。 |
| `resources.memory_max` / `pids_max` / `cpu_max` | 在 Linux 严格栈下为 cgroup v2 风格的资源字符串。 |
| `resources.timeout_ms` | 可选：**`run`** 调用的墙上时钟上限。 |
| `filesystem.read_only_paths` | 只读范围（在支持处参与挂载 / Landlock 只读层）。 |
| `filesystem.read_write_paths` | 可写范围。 |
| `filesystem.protected_read_only_paths` | 可选：在可写根下额外强制 **只读** 的路径（雕刻）。相对路径相对 **进程工作目录** 解析。 |
| `filesystem.skip_default_protected_paths` | 默认 `false`：若磁盘上存在，编译器可能在每个 `read_write_paths` 条目下合并 `.git` / `.finsafe`。设为 `true` 则跳过该合并。 |
| `filesystem.deny_read_globs` | 可选：后缀 glob 列表（如 `*.ext`、`**/*.ext`）。在可写根下匹配到的路径加入只读限制（禁止写入）。不支持的图案会在派生日志中跳过。 |
| `filesystem.glob_scan_max_depth` | 展开 `deny_read_globs` 时的最大目录深度（省略时编译器默认 `8`）。 |

## 声明式原则

包装策略描述的是 **意图**（网络姿态、路径类别、资源），而非逐个内核机制名。CLI 与运行时会按主机将意图映射到 Bubblewrap、cgroup、seccomp、Landlock 或 Seatbelt。

## 审计信封（概念）

每次包装调用宜在 JSON 或日志中记录（具体嵌套以你所运行的 FinSafe 版本为准）：

- `wrapper_policy_digest` — 运维提供的策略字节的 SHA-256。  
- `resolved_host_profile` — 解析后选用的主机姿态。  
- `selected_backend` — 负载是否按 **`run`**（类 `ExecutionSpecV1`）或 **`self-confine`** 编译。  
- `fallback_used` / `fallback_reason` — 姿态选择发生降级时。

确切字段名请以当前构建为准；可用 **`finsafe run --json`** 配合测试命令查看本机输出的信封结构。
