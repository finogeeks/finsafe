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
| `broker_confine` | 可选。默认 `self-confine` 会限制 broker 进程。显式选择 `tools-only` 时 broker **不**做 OS 级沙箱（保留交互式 TTY）；工具侧仍通过 **`finsafe run`** / execution cell 约束。审计字段：`broker_confined=false`。示例：[`hermes-interactive-tools-only.yaml`](../../examples/wrapper-policies/hermes-interactive-tools-only.yaml)。 |
| `degrade.allow_fallback` | 为 `false` 时，若无法施加最严格姿态则 **拒绝启动**；为 `true` 时，允许在审计约束下的显式降级。 |
| `degrade.prompt_on_macos_arm64_missing_apple_container` | 原生 macOS Seatbelt 包装流程下 **已弃用 / 忽略**；新文件请省略。旧文件若仍含此项可保留。 |
| `audit.require_policy_digest` | 若审计信封中未记录包装策略摘要，则拒绝启动。 |
| `audit.require_resolved_posture` | 若未记录解析后的主机姿态，则拒绝启动。 |
| `stdio.mode` | 子进程标准 IO，用于 **`run`**：`capture`、`inherit`、`null` 或 `pty`。文本模式运行通常受此控制；`--json` 往往在未覆盖时偏向 capture。在 **Linux** 上，**`pty`** 会分配虚拟伪终端，使在沙箱内打开 **`/dev/tty`** 的工具（如 `vim`、`less`、密码提示或 Git 钩子）可正常工作，且无需直通宿主机 TTY。单次覆盖：**`finsafe run --stdio pty`**。Linux 上 **`inherit`** 不会在 bubblewrap 内提供 controlling terminal。 |
| `macos_seatbelt.deny_outbound_ports` | 可选：在 `network: host` 时于 Seatbelt 配置中按 **TCP 端口** 拒绝出站（粗粒度；非按域名）。**失败模式：** 在 `network: host` 上叠加按端口 deny 时，可能立即失败（`EPERM`），也可能一直等到客户端 TCP 超时，取决于具体网络栈；部分 agent 会挂起而不给出明确错误。务必配合 `resources.timeout_ms`，以便 FinSAFE 终止子进程。若需完全网络隔离，优先使用 `network: none`（在 socket/DNS 系统调用层拒绝，通常较快失败）。 |
| `network` | `none` 或 `host`（Stage 1）。 |
| `resources.memory_max` / `pids_max` / `cpu_max` | 在 Linux 严格栈下为 cgroup v2 风格的资源字符串。 |
| `resources.timeout_ms` | 可选：**`run`** 调用的墙上时钟上限。 |
| `filesystem.read_only_paths` | 只读范围（在支持处参与挂载 / Landlock 只读层）。**仅在 `finsafe run` 编译策略时宿主机上已存在的路径**会生效；缺失项会被省略并在派生日志中记录（`read_only landlock skipped (path missing)`）。 |
| `filesystem.read_write_paths` | 可写范围。与 `read_only_paths` 相同：**编译时须已存在**；缺失项会被省略（`read_write landlock skipped (path missing)`）。同一次运行中事后 `mkdir` 不会自动加入，须在路径存在后重新执行 `finsafe run`。 |
| `filesystem.protected_read_only_paths` | 可选：在可写根下额外强制 **只读** 的路径（雕刻）。相对路径相对 **进程工作目录** 解析。 |
| `filesystem.skip_default_protected_paths` | 默认 `false`：若磁盘上存在，编译器可能在每个 `read_write_paths` 条目下合并 `.git` / `.finsafe`。设为 `true` 则跳过该合并。 |
| `filesystem.deny_read_paths` | 显式路径（或受限 glob），在可写根下 **禁止读取** — 例如允许 `./workspace` 但拒绝 `./workspace/.env`。编译为独立的 `deny_read_paths` 层（不是 `read_only_paths`）。Linux/macOS 隔离配置与 Windows 隔离/托管配置默认合并内置 deny-read，除非 `skip_default_deny_read: true`。含 `*`、`?`、`[`、`{` 的 glob 仅在 `read_write_paths` 下展开；**语法无效或零匹配会使策略编译失败**，除非 `skip_deny_read_glob_fail_closed: true`。**Unix 套接字**（如 `docker.sock`）在 Linux 上通过该层（bwrap `/dev/null` 覆盖）阻断，在 macOS 上通过 Seatbelt `unix-socket` 规则阻断——不能仅靠 `read_only_paths` 或 Landlock。 |
| `filesystem.allow_unix_socket_paths` | 从内置敏感套接字 deny 中 **豁免** 的主机 Unix 套接字路径（Docker/containerd/podman API）。不会移除显式 `deny_read_paths`。仅当产品有意在沙箱内驱动本地容器运行时时使用。 |
| `filesystem.deny_write_globs` | Glob 列表（`*.ext`、`**/*.ext` 等），经有界 `globset` 展开为额外只读项（禁止写入）。旧键名 `deny_read_globs` 仍可作为别名接受。 |
| `filesystem.skip_default_deny_read` | 为 `true` 时，在 Linux/macOS 隔离配置与 Windows 隔离/托管配置中跳过内置 deny-read 路径。 |
| `filesystem.glob_scan_max_depth` | 展开 deny 相关 glob 时的最大目录深度（省略时编译器默认 `8`）。 |
| `filesystem.skip_deny_read_glob_fail_closed` | 为 `true` 时，允许无效或在可写根下零匹配的 deny-read glob（迁移开关）。默认 `false`（失败即关闭）。 |
| `filesystem.toolchains` | 可选的**命名预设**列表（`homebrew`、`npm-global`、`cargo` 等），定义于 `toolchain-defaults.yaml`。通过 **`--host-profile`** 构建时，每个名称会在模板之后、运维 YAML 覆盖之前**追加** `read_write_paths` / `read_only_paths`。可重复 CLI 参数：`--toolchain <name>`。**v1 仅支持 self-confine**。内置 deny-read 仍生效；预设授予真实写入权限（非日志抑制）。`homebrew` 预设范围**较宽**（`/opt/homebrew`、`/usr/local`），因 formula 安装脚本会在这些路径执行——更严格场景请用更窄的显式 `read_write_paths`。示例：[`brew-self-confine.yaml`](../../examples/wrapper-policies/brew-self-confine.yaml)。 |
| `network`（allowlist） | YAML：`network: !allowlist`，其下 `domains: [example.com]`（**必须用 YAML 标签写法**；`network:` 下直接嵌套 map 无法解析）。启动时需出口代理（个人/本地用 `start_internal_proxy: true`；托管/SaaS 可用 `finsafe-net-proxy` + `proxy_cell`）；有效网络模式为 `allowlist`。**怎么跑：** [network-allowlist-proxy-runbook-zh.md](./network-allowlist-proxy-runbook-zh.md)。 |
| `tls_terminate` | 为 `true` 时（wrapper 根或 `network.tls_terminate`），出口代理**解密 HTTPS** 以做 L7 过滤与更丰富的 `proxy_egress` 审计（`tls_terminated`、method/path）。需要 Authority 商业许可证 **`mitm_tls_terminate`**、已发布 bundle 中嵌入的 **inspection CA**（`inspection_ca_cert_pem`），以及 Agent 在托管缓存中安装的检查 CA。子进程会收到指向该证书的信任库环境变量（`SSL_CERT_FILE`、`CURL_CA_BUNDLE`、`NODE_EXTRA_CA_CERTS` 等）。**合规：**须告知用户 HTTPS 被检查。 |
| `start_internal_proxy` | 为 `true` 时，`finsafe run` / `finsafe self-confine` 可在 **`127.0.0.1:60080`** 启动内置回环正向代理（与 Windows WFP `permit-loopback` 端口范围一致），无需单独 UDS `finsafe-net-proxy`。与 `network: allowlist` 配合实现域名受限出口。可选 `tls_terminate: true` 叠加 HTTPS 检查（需许可证）— 见 [https-inspection-runbook-zh.md](./https-inspection-runbook-zh.md)。 |
| **父级企业代理（试点）** | 子进程仍只连回环 FinSAFE 代理；出口经 **CONNECT 链**到企业网关。凭证不进 bundle：环境变量 `FINSAFE_PARENT_PROXY_URL`、`FINSAFE_PARENT_PROXY_NO_PROXY`（逗号分隔）。设计见 [parent-proxy.md](../../../docs/design/parent-proxy.md)。 |

### TLS 检查（MITM）运维说明

| 主题 | 说明 |
|------|------|
| **许可证** | `/etc/finsafe/license.jws` 中无 `mitm_tls_terminate` 时，Authority 与发布路径返回 **`402`**。`finsafe_licensectl` 默认**不**包含该功能——需向 Finogeeks 申请。 |
| **Authority CA** | 发布 `tls_terminate: true` 的策略前，运维执行 **`POST /v1/admin/mitm/ca`**（管理 API）。Agent 通过 bundle 字段或 **`GET /v1/mitm/ca/cert`** 获取公钥证书。 |
| **示例策略** | [`enterprise-https-inspection.yaml`](../examples/wrapper-policies/enterprise-https-inspection.yaml) + [https-inspection-runbook-zh.md](./https-inspection-runbook-zh.md)。 |
| **开发/实验** | 代理主机可设 `FINSAFE_LICENSE_MITM=1` 跳过许可证检查。`start_internal_proxy` 可选稳定 CA：`FINSAFE_MITM_CA_CERT_PATH` + `FINSAFE_MITM_CA_KEY_PATH`。curl/openssl 探测可设 `FINSAFE_MITM_FORCE_TERMINATE=1`。 |
| **审计 schema** | 终止 TLS 的流量使用 `proxy_egress` schema **3**；不透明 CONNECT 隧道仍为 **2**。 |

### 内置文件系统默认项（Linux/macOS/Windows）

在未设置 `skip_default_deny_read: true` 且未设置 `skip_default_protected_paths: true` 时，**Linux/macOS 隔离**与 **Windows 隔离/托管**配置会合并随发行版附带的默认规则（与策略 YAML 无关）：

| 类别 | 典型路径（摘要） |
|------|------------------|
| **Deny read**（可写根下） | `.env`、`.env.local`、`.env.production` |
| **Deny read**（`$HOME` / `%USERPROFILE%` 下） | `.ssh`、`.aws`、`.gnupg`、`.config/gcloud` |
| **Deny read**（Linux 绝对路径） | `/etc/shadow`、`/etc/gshadow` |
| **Deny read / unix-socket**（敏感容器 API，编译时主机上存在则生效） | `/var/run/docker.sock`、`/run/docker.sock`、`/run/containerd/containerd.sock`、`/run/podman/podman.sock`、`$HOME/.docker/run/docker.sock`、`$HOME/.orbstack/run/docker.sock` |
| **Protected read-only**（每个可写根下，若存在） | `.git`、`.finsafe` |

**路径 vs 套接字 vs 网络：** 在 `read_only_paths` 中列出 `/var` 可通过 Landlock 限制目录列举，但 **不会** 阻断对 `/var/run/docker.sock` 的 `connect()`。内置敏感套接字默认（默认开启）、显式 `deny_read_paths`，或 `network: none` / seccomp `no_network` 提供纵深防御。仅把套接字写在 `read_only_paths` 对 Landlock 无效——编译器会记录警告。

托管 bundle 升级后，即使未改 YAML，Hermes 等程序也可能因上述默认项而无法读取 `.env` 或用户配置目录下的凭证路径。在 `network: host` 或代理模式下，曾隐式使用 Docker/containerd 套接字且未声明 `allow_unix_socket_paths` 的工作负载将看到 `connect()` 失败——仅在确有需要时显式放行。需要完全恢复旧行为时：在相关 sandbox 策略中设置 `skip_default_deny_read: true`（并评估受保护子目录）。

### Windows 后端：RestrictedToken（默认 host）与 AppContainer

**运维入门（安装 → 选后端 → 校验 → 排障）：** [WINDOWS-GUIDE-zh.md](WINDOWS-GUIDE-zh.md) · [WINDOWS-GUIDE.md](WINDOWS-GUIDE.md)。

**Linux/macOS 无此双轨。** 桌面 Windows 根据 `windows.backend`（默认 `Auto`）选择启动后端：

| 后端 | 证明字段 | 何时选用 | 隔离摘要 |
|------|----------|----------|----------|
| **RestrictedToken** | `windows_restricted_token`，`degraded_execution=true` | **Auto** + `network: host` + YAML `deny_read_paths` 为空，或显式 `windows.backend: restricted_token` | `CreateRestrictedToken` + **WRITE_RESTRICTED**：**读**基本保留用户身份（整机可读）；**写**默认拒绝，仅 `read_write_paths`（+ cwd）经 capability ACE 放行。仍有 Job Object。无 LowBox、不对 `venv`/`node_modules` 递归打 ACL、**无需 ProjFS**。此路径**跳过**内置机密 deny-read（对齐 Codex 弱化姿态）。 |
| **AppContainer** | `windows_appcontainer` | Auto + `network: none` / allowlist、任意 YAML `deny_read_paths`、显式 `windows.backend: appcontainer`、托管舰队 | AppContainer / LowBox Package SID、可继承 DACL、可选 deny-read ACE、WFP 出口围栏。大运行时树优先 **ProjFS 投影**（`finsafe setup-windows`；仅当启用 Client-ProjFS 返回需重启 / 退出码 **3010** 时重启）。 |

**示例（均随发行附带）：**

| 策略 | 后端 |
|------|------|
| [`hermes-windows-oneshot.yaml`](../examples/wrapper-policies/hermes-windows-oneshot.yaml) | RestrictedToken |
| [`hermes-windows-oneshot-appcontainer.yaml`](../examples/wrapper-policies/hermes-windows-oneshot-appcontainer.yaml) | AppContainer |

RestrictedToken 约束：`network: host`、YAML `deny_read_paths` 为空（需要机密 deny-read 或锁定网络时改用 AppContainer）。

### Windows AppContainer：大体积 `read_only_paths` / `read_write_paths` 根目录

**仅适用于 AppContainer 启动。** RestrictedToken 不会为打 Package SID ACL 而遍历目录树。

Windows AppContainer 要求 FinSAFE 使用的每个文件系统根（`work_dir`、`read_only_paths`、`read_write_paths` 各项）具备**可继承**的 DACL（Package SID ACE）与 **Low 强制完整性标签**。子进程继承这些 ACL；首次启动时 FinSAFE 会在根上（必要时在子项上）写入可继承授权。对大体积 `venv` / `node_modules`，优先用 **ProjFS 投影**运行时树，而不是把整棵树写进策略路径。

| 阶段 | 行为 | 运维建议 |
|------|------|----------|
| **首次启动**且策略根下子项过多（默认守卫：≥ **10000** 个直接子项） | 默认 **拒绝**启动（`refusing to apply inheritable AppContainer ACLs`），避免对大树逐文件改 ACL 导致数分钟卡顿（端点 DLP/EDR 拦截每次 `SetNamedSecurityInfoW` 时更严重）。 | **收窄路径**——不要把整个 agent 目录、项目根或含 `node_modules` 的树放进 `read_only_paths` / `read_write_paths`；只列工作负载真正需要的目录。或对 `network: host` 智能体改用 RestrictedToken。 |
| **首次启动**且接受一次性打标成本 | 设 `FINSAFE_WINSAFE_INHERIT_ROOT_FAIL=0` 完成**一次**打标（会有 WARNING）。打标完成后取消该变量，以便后续误配仍 fail closed。 | 安排在维护窗口；优先 ProjFS 或 RestrictedToken，而非给 1 万+ 文件树打标。 |
| **同一已打标根**上的 **重复启动** | 若根上已有可继承 Package ACE + Low-IL 姿态，FinSAFE 跳过大树守卫，并在授权已满足时跳过冗余 `SetNamedSecurityInfoW`。典型重复启动 **1 秒内**完成，即使树下文件很多。 | Hermes / `finsafe run` 稳态循环应在首次打标后变快；若每次仍慢，通常是根尚未打标或策略根路径在变。 |

| 变量 | 默认 | 作用 |
|------|------|------|
| `FINSAFE_WINSAFE_INHERIT_ROOT_WARN_LIMIT` | `10000` | 直接子项数达到该值即触发大树守卫（遍历上限同此值）。 |
| `FINSAFE_WINSAFE_INHERIT_ROOT_FAIL` | `1`（fail closed） | `0` = 警告后继续应用可继承 ACL（一次性打标）。 |

**ProjFS：** AppContainer + 大运行时树的可选高级路径。`setup-windows` 在启用 Client-ProjFS 需重启时可能以 **3010** 退出；`doctor` 将其报为 **警告**（RestrictedToken / 典型 Hermes 不需要 ProjFS）。

回归：`scripts/dev/run-windows-acceptance.ps1` 的 `inherit-guard` 套件含 *inherit-relaunch-fast*（同一目录第二次启动须在 3 秒内完成）。

### 出站代理可观测性（allowlist 模式）

当 `finsafe-net-proxy` 执行 allowlist 时，运维可设置：

| 变量 | 作用 |
|------|------|
| `FINSAFE_NET_PROXY_AUDIT_LOG=1` | 每次代理决策向 stderr 输出一行 JSON（`finsafe_net_proxy_audit …`）。 |
| `FINSAFE_NET_PROXY_TRACE=1` | 详细跟踪日志（仅调试）。 |

代理内置速率限制；启用审计时，被拒请求会记录 `rate_limit_global` 或 `rate_limit_domain:<host>` 等原因。

### 路径占位符（`${HOME}` / `~/` / `${XDG_CONFIG_HOME}` / `${USERPROFILE}`）

`filesystem` 下任意 `*_paths` 字符串条目（含 `protected_read_only_paths`、`deny_read_paths`、`allow_unix_socket_paths`）支持：

- **花括号占位符：** `${HOME}`、`${XDG_CONFIG_HOME}`、`${USERPROFILE}`
- **波浪号前缀：** `~` 或 `~/子路径`（从 `HOME` 解析；Windows 上回退到 `USERPROFILE`）

Shell 写法如 `$HOME/bin`（无花括号）或 `%USERPROFILE%\bin` **不会**展开——请用 `${HOME}/bin` 或 `~/bin`。

- **替换发生在 FinSAFE 解析 YAML/JSON 时**，环境取自 **`finsafe` 自身进程**，不会自动从你包裹的子进程 argv 推导。托管 bundle 在每台设备执行 `finsafe run` 时各自展开。
- **`policy_digest`** 仍对磁盘上的原始策略字节做摘要；占位符不会改变离线哈希比对语义。
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

## 在 macOS 上诊断沙箱失败

### macOS 上的 `--audit`（诊断采集）

在 **Linux** 上，`finsafe --audit` 使用 seccomp 宽松模式（系统调用仍允许，写入内核审计）。在 **macOS** 上，`sandbox-exec` **没有**原生宽松模式。全局 `--audit` 仍使用**相同的 enforce 配置**（attestation 为 `seatbelt_mode: diagnostic`，`seatbelt_profile_digest` 与 enforce 一致），并在运行期间流式采集内核 Sandbox `deny(...)` 事件；退出后在 stderr 打印建议的 `filesystem.read_only_paths` / `read_write_paths`。

命令仍可能在首次拒绝时失败——这是预期行为。价值在于可操作的**路径发现**，而非让工作负载跑完。

### `finsafe-trace`（仅引擎源码检出）

部分 FinSAFE 引擎检出包含 `scripts/dev/finsafe-trace.sh`。**公开** [finogeeks/finsafe](https://github.com/finogeeks/finsafe) 发行树中**不包含**该脚本。已发布二进制请优先使用 **`finsafe --audit`** 与 **`finsafe learn`**。

**内置 CLI（推荐）：**
```bash
finsafe --audit --policy my-agent.yaml run -- hermes --print "hello"
```

另见 [isolation-audit-mode.md](isolation-audit-mode.md)（跨平台 `--audit` 约定及保存 JSON 信封供 `finsafe explain`）。

### 策略迭代循环（macOS / Linux / Windows）

**`finsafe learn`** 捕获拒绝事件并生成可审阅的 YAML：

```bash
finsafe learn -- my-agent --print "hello"          # → ./learned-policy.yaml
finsafe --policy ./learned-policy.yaml run -- my-agent --print "hello"
finsafe learn --base ./learned-policy.yaml -- …    # 合并新授权
```

在 **Windows** 上，`learn` 保持 AppContainer 强制，并解析 ETW `etw_audit:` 行与子进程 stdout 标记（如 `blocked_write_denied`）。`--audit run` 会在 stderr 输出同类证据的内联修复建议。

**手动 / 仅审计循环**（已有策略文件时）：

```
finsafe run → 失败
       ↓
finsafe --audit run → 显示被拒绝路径 + YAML 建议
       ↓
finsafe explain envelope.json   # 从事后保存的 JSON 诊断（见 USER-GUIDE-zh.md）
       ↓
编辑包装 YAML（补充路径 / skip_default_deny_read）
       ↓
finsafe run → 重复直至通过
```

在 Linux 上，`finsafe --audit run -- cmd` 还会启用 seccomp 宽松模式，使命令在记录违规的同时可能跑完。在 macOS 上，`--audit` 保持 Seatbelt 强制并流式采集内核拒绝日志（`seatbelt_mode: diagnostic`）。在 Windows 上，`--audit` 增加 ETW 采集与标记提示，不削弱 AppContainer 强制。
