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

## 主机姿态（`self-confine` 替代手写 YAML）

不必手写包装策略时，可使用 **`finsafe --host-profile <NAME> self-confine`**，由内置模板合成交互式 `local-wrapper` 策略（如 `windows-desktop-isolated`、`linux-desktop-isolated`、`mac-seatbelt`、`windows-managed`）。可选 **`--policy`** 合并运维覆盖项。详见 [USER-GUIDE-zh.md](USER-GUIDE-zh.md) §1b。

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
| `stdio.mode` | 子进程标准 IO，用于 **`run`**：`capture`、`inherit`、`null` 或 `pty`。文本模式运行通常受此控制；`--json` 往往在未覆盖时偏向 capture。在 **Linux** 上，**`pty`** 会分配虚拟伪终端，使在沙箱内打开 **`/dev/tty`** 的工具（如 `vim`、`less`、密码提示或 Git 钩子）可正常工作，且无需直通宿主机 TTY。单次覆盖：**`finsafe run --stdio pty`**。Linux 上 **`inherit`** 不会在 bubblewrap 内提供 controlling terminal。 |
| `macos_seatbelt.deny_outbound_ports` | 可选：在 `network: host` 时于 Seatbelt 配置中按 **TCP 端口** 拒绝出站（粗粒度；非按域名）。 |
| `network` | `none` 或 `host`（Stage 1）。 |
| `resources.memory_max` / `pids_max` / `cpu_max` | 在 Linux 严格栈下为 cgroup v2 风格的资源字符串。 |
| `resources.timeout_ms` | 可选：**`run`** 调用的墙上时钟上限。 |
| `filesystem.read_only_paths` | 只读范围（在支持处参与挂载 / Landlock 只读层）。**仅在 `finsafe run` 编译策略时宿主机上已存在的路径**会生效；缺失项会被省略并在派生日志中记录（`read_only landlock skipped (path missing)`）。 |
| `filesystem.read_write_paths` | 可写范围。与 `read_only_paths` 相同：**编译时须已存在**；缺失项会被省略（`read_write landlock skipped (path missing)`）。同一次运行中事后 `mkdir` 不会自动加入，须在路径存在后重新执行 `finsafe run`。 |
| `filesystem.protected_read_only_paths` | 可选：在可写根下额外强制 **只读** 的路径（雕刻）。相对路径相对 **进程工作目录** 解析。 |
| `filesystem.skip_default_protected_paths` | 默认 `false`：若磁盘上存在，编译器可能在每个 `read_write_paths` 条目下合并 `.git` / `.finsafe`。设为 `true` 则跳过该合并。 |
| `filesystem.deny_read_paths` | 显式路径（或受限 glob），在可写根下 **禁止读取** — 例如允许 `./workspace` 但拒绝 `./workspace/.env`。编译为独立的 `deny_read_paths` 层（不是 `read_only_paths`）。Linux/macOS 隔离配置默认合并内置 deny-read，除非 `skip_default_deny_read: true`。Windows：仅运维声明的路径（尚无内置默认集）。 |
| `filesystem.deny_write_globs` | Glob 列表（`*.ext`、`**/*.ext` 等），经有界 `globset` 展开为额外只读项（禁止写入）。旧键名 `deny_read_globs` 仍可作为别名接受。 |
| `filesystem.skip_default_deny_read` | 为 `true` 时，在 Linux/macOS 隔离配置中跳过内置 deny-read 路径。 |
| `filesystem.glob_scan_max_depth` | 展开 deny 相关 glob 时的最大目录深度（省略时编译器默认 `8`）。 |
| `network`（allowlist） | YAML：`network:\n  allowlist:\n    domains: [example.com]`。启动时需 egress `finsafe-net-proxy` 与 `proxy_cell`；有效网络模式为 `allowlist`。 |

### 内置文件系统默认项（Linux/macOS）

在未设置 `skip_default_deny_read: true` 且未设置 `skip_default_protected_paths: true` 时，编译器会合并随发行版附带的默认规则（与策略 YAML 无关）：

| 类别 | 典型路径（摘要） |
|------|------------------|
| **Deny read**（可写根下） | `.env`、`.env.local`、`.env.production` |
| **Deny read**（`$HOME` 下） | `.ssh`、`.aws`、`.gnupg`、`.config/gcloud` |
| **Deny read**（Linux 绝对路径） | `/etc/shadow`、`/etc/gshadow` |
| **Protected read-only**（每个可写根下，若存在） | `.git`、`.finsafe` |

托管 bundle 升级后，即使未改 YAML，Linux/macOS 桌面上的 Hermes 等程序也可能因上述默认项而无法读取 `.env` 或 `~/.ssh`。需要旧行为时：在相关 sandbox 策略中设置 `skip_default_deny_read: true`（并评估是否同时跳过受保护子目录）。Windows 托管与个人模式目前不应用内置 deny-read 集。

### 出站代理可观测性（allowlist 模式）

当 `finsafe-net-proxy` 执行 allowlist 时，运维可设置：

| 变量 | 作用 |
|------|------|
| `FINSAFE_NET_PROXY_AUDIT_LOG=1` | 每次代理决策向 stderr 输出一行 JSON（`finsafe_net_proxy_audit …`）。 |
| `FINSAFE_NET_PROXY_TRACE=1` | 详细跟踪日志（仅调试）。 |

代理内置速率限制；启用审计时，被拒请求会记录 `rate_limit_global` 或 `rate_limit_domain:<host>` 等原因。

### 路径占位符（`${HOME}` / `${XDG_CONFIG_HOME}` / `${USERPROFILE}`）

`filesystem` 下任意 `*_paths` 字符串条目（含 `protected_read_only_paths`）支持的 **括号占位符** 仅为 `${HOME}`、`${XDG_CONFIG_HOME}`、`${USERPROFILE}`：

- **替换发生在 FinSAFE 解析 YAML/JSON 时**，环境取自 **`finsafe` 自身进程**，不会自动从你包裹的子进程 argv 推导。
- **`policy_digest`** 仍对磁盘上的原始策略字节做摘要；占位符不会改变离线哈希比对语义。
- 形如 `~/bin` 的波浪号前缀在 YAML 中 **不会做展开**；请写 `${HOME}/bin`。
- **`${XDG_CONFIG_HOME}`** 未设置时会回退到 `${HOME}/.config`。若 Hermes/GitHub CLI 的配置不在默认位置，可先导出 `GH_CONFIG_DIR` / `XDG_CONFIG_HOME`，再启动 `finsafe`，或在策略中写明绝对路径。

## 声明式原则

包装策略描述的是 **意图**（网络姿态、路径类别、资源），而非逐个内核机制名。CLI 与运行时会按主机将意图映射到 Bubblewrap、cgroup、seccomp、Landlock 或 Seatbelt。

## 审计信封（概念）

每次包装调用宜在 JSON 或日志中记录（具体嵌套以你所运行的 FinSafe 版本为准）：

- `wrapper_policy_digest` — 运维提供的策略字节的 SHA-256。  
- `resolved_host_profile` — 解析后选用的主机姿态。  
- `selected_backend` — 负载是否按 **`run`**（类 `ExecutionSpecV1`）或 **`self-confine`** 编译。  
- `fallback_used` / `fallback_reason` — 姿态选择发生降级时。

确切字段名请以当前构建为准；可用 **`finsafe run --json`** 配合测试命令查看本机输出的信封结构。
