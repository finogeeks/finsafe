# FinSAFE 概念术语表

**English:** [terminology-glossary.md](./terminology-glossary.md)

本文汇总 FinSAFE 公开文档、实现与对标材料（如与 [Claude sandbox-runtime](https://github.com/Geeksfino/sandbox-runtime)、Codex 内置沙箱的比较）中常见的**安全、沙箱、网络与企业治理**术语。阅读 [企业 IT 全景](./enterprise-it-overview-zh.md)、[包装策略速查](./POLICY-QUICKREF-zh.md) 或 [HTTPS 检查运维手册](./https-inspection-runbook-zh.md) 时可作索引。

**说明：** 表中「FinSAFE 落点」指向典型组件、策略字段或文档；未列出的对标概念若 FinSAFE 尚未实现，会在「状态」列标明。

---

## 1. 产品架构与部署

| 术语（中 / En） | 含义 | FinSAFE 落点 |
|-----------------|------|----------------|
| **Local Program Wrapper** / 本地程序包装器 | 在操作系统层用声明式策略包装任意本地二进制（`run` 短任务、`self-confine` 交互式），输出审计信封。 | `finsafe` CLI；`kind: local-wrapper` 策略。见 [USER-GUIDE-zh.md](./USER-GUIDE-zh.md)。 |
| **个人模式（Personal）** | 用户自备 wrapper YAML（`--policy`），策略可被本地修改。 | 无 `managed-required.json` 且未注册 agent 时的默认路径。 |
| **托管模式（Managed）** | 组织通过 Policy Authority 下发已签名 bundle，本机 agent 强制策略，禁止本地 `--policy`。 | `finsafe-agent`、`finsafe-authority-http`、MDM 哨兵。见 [managed-mode-zh.md](./managed-mode-zh.md)。 |
| **Policy Authority（策略权威）** | 中央 HTTPS 服务：JWKS、bundle 分发、设备注册、心跳、管理 API、审计接收。 | `finsafe-authority-http`；需 `/etc/finsafe/license.jws`。 |
| **边缘 / 桌面（Edge）** | 策略与执行发生在员工本机（Mac/Linux/Windows 本地沙箱）。 | `finsafe run`、`finsafe-agent`、Seatbelt / bwrap 栈。 |
| **中心 / 云（Center）** | 多租户执行平面：提交、调度、路由、远程执行。 | `finsafe-server`、Execution Scheduler、Policy Router。见 [product-one-pager-zh.md](./product-one-pager-zh.md)。 |
| **Sandbox-as-a-Service** | 企业自建的中心化沙箱 API，对外提供受策略约束的执行单元。 | `POST /v1/executions` 等；与桌面 wrapper 共用策略语义。 |
| **HighLevelPolicy** | 高级策略意图（非原始 seccomp/bwrap 旋钮），由路由层编译。 | `finsafe-policy`；编译为 `CompiledExecutionPlan`。 |
| **Policy Router（策略路由）** | 将高级策略编译为可执行计划，计算确定性 `policy_hash`，拒绝 ad-hoc 沙箱参数。 | `finsafe-policy` / `finsafe-server` 控制面。 |
| **Execution Scheduler（执行调度器）** | 准入、排队、取消、租户/用户并发与速率限制。 | `finsafe-scheduler`（中心构建）。 |
| **Host profile（主机姿态）** | 内置或命名的主机模板（如 `mac-seatbelt`、`linux-desktop-isolated`、`windows-managed`），合并为 wrapper 策略。 | `finsafe --host-profile`；`resolved_host_profile` 写入审计。 |
| **MicroVM / 专用节点** | 内核级或硬件虚拟化隔离，用于不可信多租户或强对抗场景。 | FinSAFE **共享内核沙箱**的外层选项；产品一页纸中与 Docker/VM 对比。 |

---

## 2. 策略、Bundle 与舰队治理

| 术语（中 / En） | 含义 | FinSAFE 落点 |
|-----------------|------|----------------|
| **包装策略（Wrapper policy）** | `schema_version` + `kind: local-wrapper` 的 YAML/JSON，描述网络、文件系统、资源、审计意图。 | `--policy` 或 bundle 内嵌；见 [POLICY-QUICKREF-zh.md](./POLICY-QUICKREF-zh.md)。 |
| **Sandbox policy（沙箱策略）** | Bundle 内针对某一程序/agent 的一条策略（如 Hermes 交互式策略）。 | [sandbox-management-model-zh.md](./sandbox-management-model-zh.md)。 |
| **Bundle（策略包）** | 已签名、带版本号的策略集合；按程序名/argv 匹配单条策略，歧义则 fail closed。 | `BundleV1`；`finsafe-bundlectl bundle publish`。 |
| **Group（分组）** | 用确定性规则（`admin:*` 标签、`device:*` 事实、`device_id`）定义的设备队列。 | Admin UI「设备分组」；`/v1/admin/groups`。 |
| **Assignment（分配）** | 将一份 Bundle 绑定到一个 Group；**rollout 属于 Assignment**。 | 百分比 rollout、draft/active/paused 等状态。 |
| **Rollout（灰度发布）** | 按 device id + seed 稳定选取子集接收新 Assignment。 | 非 Bundle 字段；见沙箱管理模型。 |
| **Tag / Fact（标签 / 事实）** | `admin:*` 由 MDM/管理员设置；`device:*` 由 agent 上报；`observed:*` 仅用于观测。 | Assignment 定向用 `admin:*` 与已验证 `device:*`。 |
| **managed-required 哨兵（Sentinel）** | MDM 下发的 JWS 文件，声明设备必须处于托管模式。 | `/etc/finsafe/managed-required.json`；`bundlectl sentinel sign`。 |
| **Enroll / 注册** | 设备向 Authority 注册并写入 `enrolled.json`，获取拉取 bundle 资格。 | `FINSAFE_ENROLL_TOKEN`（一次性）；`/etc/finsafe/enrolled.json`。 |
| **policy_digest / wrapper_policy_digest** | 运维策略字节的 SHA-256，用于审计溯源与完整性。 | `audit.require_policy_digest`；运行 JSON 信封。 |
| **resolved_posture** | 解析后的主机姿态与降级结果摘要。 | `audit.require_resolved_posture`。 |
| **degrade.allow_fallback** | 无法施加最严格隔离时是否允许显式降级并记录。 | 包装策略 `degrade` 段。 |
| **enterprise-strict（企业严格档）** | `finsafe run --profile enterprise-strict`：启动前拒绝缺 cgroup、网络开启、seccomp 非 enforce 等。 | `docs/operations/enterprise-strict-run-profile.md`。 |
| **fail closed（失败关闭）** | 策略歧义、校验失败、哨兵无效时拒绝执行而非放宽。 | Bundle 多匹配、托管 challenge 失败等。 |

---

## 3. 凭证、签名与许可证

| 术语（中 / En） | 含义 | FinSAFE 落点 |
|-----------------|------|----------------|
| **JWS（JSON Web Signature）** | 对 JSON 载荷的签名封装；用于 bundle、哨兵、商业许可证。 | `license.jws`、已发布 bundle、managed-required。 |
| **license.jws（商业许可证）** | Finogeeks 签发的 authority 能力门控；缺失/无效时 HTTP **402**。 | `/etc/finsafe/license.jws`；功能位如 `mitm_tls_terminate`。 |
| **signing_key.bin** | 32 字节 Ed25519 种子，签署 bundle 与哨兵（**非**许可证密钥）。 | Authority + `finsafe-bundlectl` 共用；JWKS 公开验签。 |
| **JWKS** | 公钥集，供 agent/CLI 校验 bundle 与哨兵签名。 | `GET /.well-known/finsafe/jwks.json`。 |
| **mitm_tls_terminate** | 许可证功能位：允许 Authority/代理做 HTTPS 检查（TLS 终止）。 | [https-inspection-runbook-zh.md](./https-inspection-runbook-zh.md)。 |
| **inspection_ca_cert_pem** | 嵌入 bundle 的 HTTPS 检查用 CA 公钥证书。 | Agent 安装并向子进程注入 `SSL_CERT_FILE` 等。 |
| **UDS challenge** | CLI 经 Unix 域套接字向 agent 证明请求来自本机受信路径（防伪造取策略）。 | `/run/finsafe-agent.sock`；`MANAGED_DAEMON_UNREACHABLE`。 |
| **审计 spool** | 本机 NDJSON 审计队列，agent 批量上报 Authority/SIEM。 | `/var/lib/finsafe/audit/`。 |

---

## 4. Linux 隔离机制

| 术语（中 / En） | 含义 | FinSAFE 落点 |
|-----------------|------|----------------|
| **bubblewrap（bwrap）** | 用户态容器式启动器：mount namespace、PID/user 等命名空间，构建沙箱内文件系统视图。 | `finsafe-bwrap`；Linux `run` / `self-confine` 主路径。 |
| **namespace（命名空间）** | 内核隔离维度（mount、PID、network、user 等）；bwrap 组合使用。 | bwrap 启动参数；与「共享内核沙箱」表述相关。 |
| **cgroup v2** | 控制组：CPU、内存、pids 等资源上限与计量。 | `resources.*` 策略字段；`finsafe-cgroup`、`finsafe-supervisor`。 |
| **seccomp（BPF）** | 系统调用过滤；`enforce` / `log` / `audit` 等模式。 | `finsafe-seccomp`；`no_network` 等 syscall profile；enterprise-strict 要求 enforce。 |
| **Landlock** | LSM 路径级访问控制（读/写/执行），在 bwrap 挂载视图之上再收紧。 | `finsafe-landlock-shim`；`read_only_paths` / `read_write_paths` 编译层。 |
| **finsafe-helper** | 特权辅助进程：cgroup、overlay 等 bwrap 路径需要的能力。 | Linux 发行包与 `finsafe` 同目录。 |
| **finsafe-supervisor** | 在 exec 前 attach cgroup，优于 shell 包装。 | enterprise-strict 常要求 `--supervisor`。 |
| **finsafe-landlock-shim** | 在沙箱内子进程 exec 前应用 Landlock 规则。 | 与 bwrap 组合，非互斥二选一。 |
| **deny-read（拒绝读取）** | 在可写根下禁止读取敏感路径（`.env`、`~/.ssh` 等）。 | `filesystem.deny_read_paths` + 内置默认；bwrap `/dev/null` 覆盖或 Landlock。 |
| **protected read-only** | 可写根下的 `.git`、`.finsafe` 等强制只读「雕刻」。 | `protected_read_only_paths`；内置默认。 |
| **proxy cell** | 将子进程网络出口约束为仅访问本机回环代理端口的执行单元语义。 | Linux bwrap + `HTTP_PROXY=127.0.0.1:60080`；与 allowlist 配合。 |
| **syscall profile `no_network`** | seccomp 层禁止网络相关 syscall 的配置族。 | 与 `network: none` 纵深配合。 |

---

## 5. macOS 隔离机制

| 术语（中 / En） | 含义 | FinSAFE 落点 |
|-----------------|------|----------------|
| **Seatbelt** | macOS 沙箱策略语言（SBPL），限制文件、网络、IPC 等。 | `macos_seatbelt` 策略段；`sandbox-exec` 后端。 |
| **sandbox-exec** | macOS 加载 Seatbelt 配置并启动子进程的系统工具。 | `finsafe` 在 Mac 上调用；stage2 回归用例。 |
| **restricted egress / 受限出口** | 非全网放行时，仅允许连本机 loopback 上的 HTTP 代理端口。 | `MacosSeatbeltNetworkSpecV1`；`restricted_proxy_egress`。 |
| **deny_outbound_ports** | Seatbelt 层按 TCP 端口拒绝出站（粗粒度，非域名）。 | `macos_seatbelt.deny_outbound_ports`。 |

---

## 6. Windows 隔离机制

| 术语（中 / En） | 含义 | FinSAFE 落点 |
|-----------------|------|----------------|
| **AppContainer** | Windows 低特权应用容器：能力 SID、隔离级别。 | `finsafe-winsafe`；`windows-managed` 等 profile。 |
| **Restricted Token（受限令牌）** | 剥离特权的安全上下文；enterprise strict 下不作为托管首选后端。 | 与 AppContainer 组合；设计文档中的降级边界。 |
| **Job Object** | 进程组资源与生命周期限制（CPU、内存、UI 隔离等）。 | Windows 沙箱栈组件之一。 |
| **DACL deny ACE** |  discretionary ACL 拒绝项，用于路径级 deny-read（如 `%USERPROFILE%\.ssh`）。 | Windows 内置 deny-read 默认项的强制执行方式。 |
| **Capability SID** | AppContainer 授予的细粒度能力标识。 | Windows 能力缺失时的常见失败原因（见 isolation audit 文档）。 |
| **Desktop isolation（桌面隔离）** | 将沙箱进程限制在非交互桌面，降低 UI 钓鱼与剪贴板风险。 | Windows 托管/隔离配置；对标 Codex 经验。 |
| **elevated_exec** | 需提升权限执行时的受控路径（与默认 AppContainer 区分）。 | Windows 设计文档；非默认全员开启。 |
| **WFP（Windows Filtering Platform）** | 内核网络过滤框架，可安装持久化过滤器。 | `crates/finsafe-winsafe/src/wfp/`。 |
| **deny-only group（WFP）** | 默认拒绝出站、仅放行明确规则（含 loopback 代理端口）的过滤器组设计。 | 对标 sandbox-runtime；持久化 8 条过滤器典型安装。 |
| **permit-loopback / loopback proxy range** | WFP 放行 `127.0.0.1:60080–60089` 等本机代理端口，子进程经 `HTTP_PROXY` 出网。 | 与 `start_internal_proxy`、`finsafe-net-proxy` 端口一致。 |
| **Windows managed fleet gap** | Windows **设备侧**（`finsafe-agent`、哨兵、缓存、命名管道）已有实现与 CI（`windows-acceptance` **agent-pipe**）。**Policy Authority** 仅在 Linux/macOS 运行；全链 **Authority → enroll → bundle → 托管 run** 由 `linux-managed-fleet` / `e2e-mac-authority-hermes` 证明，不在 Windows runner 上起 authority。 | 回归矩阵 `windows-managed`、`linux-managed-fleet`；[managed-lab.md](./testing/managed-lab.md)。 |

---

## 7. 网络、代理与 HTTPS 检查

| 术语（中 / En） | 含义 | FinSAFE 落点 |
|-----------------|------|----------------|
| **network: none / host** | Stage 1 网络姿态：无网络或继承主机网络（可配 Seatbelt 端口拒绝）。 | 包装策略 `network` 字段。 |
| **allowlist（域名白名单）** | 仅允许访问列出的域名；其余经代理拒绝。 | `network.allowlist.domains`；有效模式 `allowlist`。 |
| **finsafe-net-proxy** | 独立进程：HTTP 正向代理 + 域名 allowlist + 可选 MITM。 | UDS 或 sidecar；`FINSAFE_NET_PROXY_AUDIT_LOG`。 |
| **start_internal_proxy** | CLI 在 `127.0.0.1:60080` 启动内置回环代理，无需单独 UDS 代理进程。 | 策略字段；与 WFP loopback 范围对齐。 |
| **loopback proxy（回环代理）** | 子进程只连 `127.0.0.1` 上代理，由代理决定是否放行外网。 | `HTTP_PROXY` / `HTTPS_PROXY` 注入；60080–60089。 |
| **CONNECT 隧道** | HTTP `CONNECT` 建立端到端 TLS 隧道；代理不解析明文 HTTP。 | 未终止 TLS 时 `proxy_egress` schema **2**。 |
| **TLS terminate / HTTPS 检查** | 代理作为 MITM 终结 TLS，解密后做 L7 检查与丰富审计。 | `tls_terminate: true`；schema **3**；`tls_terminated` 字段。 |
| **MITM（Man-in-the-Middle）** | 中间人解密 HTTPS；企业场景需告知用户与合规审批。 | 商业能力 `mitm_tls_terminate`；检查 CA。 |
| **Corporate proxy / 父级企业代理** | 企业网关 HTTP(S) 代理；出口流量须先经公司代理再上网。 | **规划中**（FinSAFE loopback 尚未链到 parent proxy）；对标 sandbox-runtime。 |
| **Parent proxy chaining** | 本机 loopback 代理再把请求转发到上游企业代理。 | 设计非目标直至客户触发；见 `macos-windows-sandbox-proxy-parity.md`。 |
| **SOCKS proxy** | 基于 SOCKS4/5 的通用代理协议；常配合 `ALL_PROXY`。 | 策略/spec **占位**；无内置 SOCKS 服务（非当前交付）。 |
| **L7 filter hook / filterRequest** | 对单个 HTTP 请求可编程允许/拒绝/改写（如 JS 回调）。 | **未实现**；FinSAFE 为固定 Rust 规则 + 审计；对标 sandbox-runtime。 |
| **L7（应用层）** | OSI 第 7 层；此处指 HTTP 方法、路径、Host、body 等可见语义。 | MITM 后可记录 method/path；未来「DLP rule pack」讨论。 |
| **proxy_egress（审计事件）** | 代理每次出站决策的结构化审计记录。 | schema v2（隧道）/ v3（TLS 终止）；`rate_limit_*` 等原因码。 |
| **NO_PROXY** | 绕过代理的主机列表环境变量。 | `loopback_proxy_env_pairs()` 与子进程环境注入。 |
| **DLP（Data Loss Prevention）** | 防泄露策略（脱敏、阻断外发敏感数据）。 | 文档建议用**可审计的有限规则集**而非任意 hook。 |

---

## 8. 审计、可观测与运行信封

| 术语（中 / En） | 含义 | FinSAFE 落点 |
|-----------------|------|----------------|
| **Execution attestation（执行证明）** | 单次 `finsafe run` 的结构化隔离证明（seccomp/seatbelt/windows 档位等）。 | JSON 信封 `attestation`；`ExecutionAttestation`。 |
| **SelfConfineReport** | 交互式 `self-confine` broker 的并行证明形状。 | `SelfConfineReportV1`。 |
| **Audit envelope（审计信封）** | `--json` 输出的运行摘要：digest、profile、退出码、代理/WFP 元数据等。 | [POLICY-QUICKREF-zh.md](./POLICY-QUICKREF-zh.md) §审计信封。 |
| **Isolation audit mode** | 跨平台「只记录不阻断」或诊断档，用于排障（Linux seccomp log；Windows 无 seccomp 类比）。 | `docs/operations/isolation-audit-mode.md`。 |
| **Stage 2 回归** | 在真实沙箱环境（sandbox-exec、bwrap cell）中跑网络/MITM 等集成探针。 | `scripts/tests/stage2/`；macOS/Windows MITM stage2 仍为 gap。 |
| **Tamper suite** | 防篡改：哨兵、强制托管入口、策略缓存完整性等组合能力。 | 企业 IT 全景与托管模式文档。 |

---

## 9. 部署与运维（IT / MDM）

| 术语（中 / En） | 含义 | FinSAFE 落点 |
|-----------------|------|----------------|
| **MDM（Mobile Device Management）** | 终端管理平台（Jamf、Intune 等），下发二进制、plist/systemd、哨兵。 | [mdm/README-zh.md](./mdm/README-zh.md)。 |
| **finsafe-fleet 发行包** | 含 `finsafe` + `finsafe-agent`（Linux 含 helper 三件套）的托管桌面包。 | GitHub Releases；非 `curl\|sh` 个人包。 |
| **finsafe-bundlectl** | 运维机：bundle build/sign/publish、sentinel sign。 | [authority-deployment-zh.md](./authority-deployment-zh.md)。 |
| **Admin UI** | Authority 自带 Web 管理台（Bundle、Group、Assignment、MITM CA）。 | `http://<authority>:8095/admin/`。 |
| **Hermes / OpenClaw** | 文档中的典型 AI Agent 运行时示例（非 FinSAFE 组件名）。 | 示例 wrapper 策略；fleet 治理场景。 |

---

## 10. 对标语境（sandbox-runtime / Codex）

以下术语常出现在与 **Claude sandbox-runtime** 或 **Codex 内置沙箱** 的对比中；便于理解差距文档，不一定表示 FinSAFE 已具备同等能力。

| 术语（中 / En） | 简要含义 | FinSAFE 状态（2026-06） |
|-----------------|----------|-------------------------|
| **Runtime library** | 可嵌入宿主应用的沙箱库（Node/TS），非完整舰队产品。 | FinSAFE 同时提供 CLI + Authority + agent（更偏产品）。 |
| **WFP deny-only + loopback** | 机器级默认拒网 + 仅放行本机代理端口。 | **已实现**（`finsafe-winsafe`）。 |
| **MITM TLS + L7 审计** | 解密 HTTPS 并记录 method/path 等。 | **已实现**（许可证门控）；macOS/Windows 沙箱内 stage2 待加强。 |
| **filterRequest / L7 hook** | 每请求可编程策略。 | **未实现**；倾向固定 Rust 规则或未来 DSL。 |
| **Parent corporate proxy** | Loopback 代理链到企业网关。 | **未实现**；P1 路线图。 |
| **SOCKS server** | 本地 SOCKS 监听 + Seatbelt/WFP 放行。 | **占位**；非目标直至需求触发。 |
| **Codex 内置沙箱** | 与 Codex 会话/工具/审批深度集成的 Rust 沙箱。 | FinSAFE **通用**包装任意二进制 + 中心 API；不绑定单一 IDE。 |
| **Shared-kernel sandbox** | 与宿主机共享内核的隔离（bwrap/Seatbelt/AppContainer），非 VM。 | FinSAFE 定位；强对抗建议外层 MicroVM。 |

---

## 11. 相关文档

| 主题 | 文档 |
|------|------|
| 策略字段 | [POLICY-QUICKREF-zh.md](./POLICY-QUICKREF-zh.md) |
| 托管模式 | [managed-mode-zh.md](./managed-mode-zh.md) |
| Bundle / Assignment | [sandbox-management-model-zh.md](./sandbox-management-model-zh.md) |
| HTTPS 检查 | [https-inspection-runbook-zh.md](./https-inspection-runbook-zh.md) |
| macOS/Windows 代理对标 | 仓库内 `docs/design/macos-windows-sandbox-proxy-parity.md` |
| 企业严格档 | 仓库内 `docs/operations/enterprise-strict-run-profile.md` |
| 隔离审计模式 | 仓库内 `docs/operations/isolation-audit-mode.md` |
| 文档索引 | [README-zh.md](./README-zh.md) |

---

*文档版本与 workspace 发行说明同步维护；若实现变更导致术语含义变化，请在同一次变更中更新本表与 [CHANGELOG.md](../CHANGELOG.md)。*
