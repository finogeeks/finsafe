# FinSAFE 企业 IT 全景：个人模式与托管模式

**English:** [enterprise-it-overview.md](./enterprise-it-overview.md)（概要）

**采购 / 架构速览：** [产品一页纸](./product-one-pager-zh.md)（含中心 Sandbox-as-a-Service 与桌面边缘部署）

本文面向 **企业 IT、终端管理（MDM）与安全运营** 人员，重点说明 FinSAFE 在 **员工桌面（边缘）** 上的两种运行形态——**个人模式（Personal）** 与 **托管模式（Managed）**——以及它们如何与 **中心执行平面**（`finsafe-server`、Policy Router、Execution Scheduler，常部署于 Kubernetes）配合。中心侧可提供多租户 **Sandbox-as-a-Service**；边缘侧解决「分布式智能体」本机运行时的舰队治理。部署实操请先在 [终端部署方式选型](./endpoint-deployment-options-zh.md) 选定路径，再按 [企业部署手册](./enterprise-deployment-runbook-zh.md) 与 [MDM 检查清单](./mdm/vendor-neutral-checklist-zh.md) 执行。中心 API 与 K8s 映射见仓库内 [finsafe-server API](../../../docs/api/finsafe-server.md)、[Kubernetes 架构](../../../docs/design/finsafe-kubernetes-architecture.md)。

---

## 1. 背景：桌面上的分布式智能体

企业部署 FinSAFE 通常涉及 **两条互补路径**（见 [产品一页纸](./product-one-pager-zh.md)）：

| 路径 | 目的 |
|------|------|
| **中心 / 云** | 自建执行平面：`finsafe-server` + Scheduler + Router，在 K8s 等环境对外提供 **Sandbox-as-a-Service**（工具调用、代码执行、审批与配额） |
| **边缘 / 桌面** | 员工本机跑 **Hermes**、**OpenClaw** 等；数据与交互尽量留在端上，用 wrapper 或 **托管模式** 统一策略与审计 |

越来越多组织同时面临 **「分布式智能体」**：Agent 编排留在应用侧，但每一次 **shell / 脚本 / 工具** 都是真实 OS 权限。算力可能分布在 **云端执行集群** 与 **每台笔记本** 上，共同痛点包括：

| 痛点 | 说明 |
|------|------|
| 策略分散 | 每人自备 YAML、脚本或环境变量，版本与审查无法统一 |
| 绕过容易 | 用户可直接 `hermes`、`openclaw`，不经过任何沙箱 |
| 审计断裂 | 安全团队难以获得一致的运行记录（策略摘要、隔离档位、退出码） |
| 合规缺口 | 金融、政务等场景要求可证明的「执行边界」与策略溯源 |

**FinSAFE** 的定位是：在 **操作系统层** 为每一次 Agent 触发的执行提供 **可声明、可审计的边界**（Linux：bubblewrap / cgroup / Landlock / seccomp；macOS：Seatbelt）。**中心层** 用 Policy Router 编译高级策略、Scheduler 做准入与排队；**边缘层** 用 **`finsafe` CLI** 直接包装本机程序。**托管模式** 则在桌面上把策略从「用户手里的文件」升级为 **组织签名的 bundle + 本机 agent 强制**，恢复舰队级可治理性。

---

## 2. 产品目的与价值（两种模式对照）

| 维度 | 个人模式（Personal） | 托管模式（Managed） |
|------|------------------------|---------------------|
| **主要用户** | 开发者、研究员、试点用户 | 已纳管的企业桌面（全员或高风险岗位） |
| **策略来源** | 用户或项目仓库中的 **wrapper YAML**（`--policy`） | **Policy Authority** 下发的 **已签名 JWS bundle**，经 `finsafe-agent` 缓存 |
| **CLI 行为** | `finsafe --policy <file> run\|self-confine …` | `finsafe run -- <program> …`（无本地 `--policy`） |
| **存在目的** | 低摩擦试用、与现有开发流集成、策略即代码 | 舰队统一策略、防篡改、集中审计与吊销 |
| **价值** | 单机即可验证隔离与审计 JSON，无需中央服务 | 对「桌面 OpenClaw 类」工作负载实现 **组织级策略与可见性** |

两种模式 **共用同一套 `finsafe` 二进制与隔离引擎**；差异在于 **策略由谁提供、能否被终端用户改写**。

> **发行说明：** 公开发行的 `curl \| sh` 安装包默认 **不含** 托管能力（更小、适合个人试用）。舰队部署请使用带 **`managed` 特性** 的企业构建（见 [packaging/README.md](../packaging/README.md) 中的 `build-finsafe-enterprise.sh`）。

---

## 3. 工作原理概览

### 3.1 共同基础：Local Program Wrapper

无论哪种模式，FinSAFE 都通过 **包装策略**（`kind: local-wrapper`）描述：

- 程序形态：**短期**（`run`）或 **交互式常驻**（`self-confine`）；
- 网络、文件系统、资源上限、审计字段等。

CLI 将 YAML **编译** 为内部执行规格，再调用平台相关后端完成隔离。详见 [USER-GUIDE-zh.md](./USER-GUIDE-zh.md)、[POLICY-QUICKREF-zh.md](./POLICY-QUICKREF-zh.md)。

```text
  wrapper 策略 (YAML 或 bundle 内嵌)
           │
           ▼
      ┌─────────┐     编译 / 匹配      ┌──────────────┐
      │ finsafe │ ──────────────────► │ 隔离后端执行   │
      │   CLI   │                     │ (bwrap/Seatbelt)│
      └────┬────┘                     └──────────────┘
           │
           ▼
      JSON 审计信封（--json）
```

### 3.2 个人模式：策略在用户侧

1. 用户在命令行或脚本中指定 **`--policy path/to/policy.yaml`**（或全局 `finsafe --policy … run …`）。
2. CLI **直接读取** 该文件，校验 schema，编译并启动被包装程序。
3. 若机器上 **没有** `/etc/finsafe/managed-required.json` 且 **未注册** `finsafe-agent`，且用户显式使用 **`--personal`**（或未触发托管隐式路径），则始终走个人模式。

**特点：** 用户可编辑 YAML、换版本、换路径；组织无法保证每台机器使用同一策略，除非辅以 MDM 下发文件（仍可能被本地管理员替换）。

### 3.3 托管模式：策略在组织侧

```text
 Policy Authority (HTTPS)          MDM 下发哨兵 + 二进制
         │                                    │
         │ 拉取已签名 bundle                    │
         ▼                                    ▼
   ┌─────────────┐    UDS     ┌─────────────┐   /etc/finsafe/managed-required.json
   │ finsafe-    │◄──────────►│  finsafe    │
   │   agent     │  挑战+策略  │    CLI      │
   └─────────────┘            └─────────────┘
         │
         ▼
   缓存 + 审计 spool ──► Authority / SIEM
```

1. **MDM**（Jamf、Intune、Ansible 等）安装 `finsafe`、`finsafe-agent`，部署 **managed-required 哨兵**（JWS），并启动系统服务。
2. **Agent** 向 **Policy Authority** 注册，拉取并 **校验签名** 的策略 bundle，写入本地缓存；在 Unix 域套接字上响应 CLI。
3. 用户执行 **`finsafe run -- hermes …`**（或 `self-confine` 等等价形式）时，CLI **禁止** 使用本地 `--policy`；通过 UDS 向 agent 索取 **当前有效策略**（可按程序名、argv 匹配）。
4. 运行前后审计事件可 **上报** 中央服务，供合规与威胁 hunting。

组件与路径细节：[managed-mode-zh.md](./managed-mode-zh.md)。

---

## 4. 示例：用 Hermes 理解两种模式

以下假设 Hermes 已安装且在 `PATH` 中。示例策略位于 [examples/wrapper-policies/](../examples/wrapper-policies/)。

### 4.1 个人模式 — 研发笔记本试点

**场景：** 安全团队发布经审查的 `hermes-interactive.yaml`，开发者自愿用 FinSAFE 包装 Hermes，中央服务尚未上线。

```bash
# 一次性检查版本（short-lived / run）
finsafe --policy ./hermes-version-smoke.yaml run --json hermes --version

# 单轮对话（run）
finsafe --policy ./hermes-oneshot-query.yaml run --json \
  hermes chat -q "用一句话说你好。"

# 长期交互 REPL（self-confine，需真实 TTY）
finsafe --policy ./hermes-interactive.yaml self-confine hermes
```

- **`run`** 对应 `program_mode: short-lived`；**`self-confine`** 对应 `program_mode: interactive`。
- `--json` 输出包含 `wrapper_policy_digest`、`resolved_host_profile`、`selected_backend` 等字段，便于 CI 或日志采集。
- 策略文件可由 Git 管理、PR 审查；**但无法阻止** 用户改用未审查的 YAML 或直接运行 `hermes`。

### 4.2 托管模式 — 舰队统一 Hermes 边界

**场景：** 组织已将 Hermes 策略打入 bundle v3，所有已注册 Mac 通过 agent 强制生效。

```bash
# 用户不再携带 --policy；策略来自 agent
finsafe run --json -- hermes --version

# 交互式 Hermes（策略在 bundle 中绑定 hermes + interactive）
finsafe self-confine hermes
```

IT 侧流程（摘要）：

1. 在运维工作站上用 `finsafe-bundlectl` 从 `hermes-interactive.yaml` **构建并签名** bundle，发布到 Policy Authority。
2. MDM 推送 bundle 更新通过 **agent 拉取** 实现（非用户手动复制 YAML）。
3. 安全运营在 Authority 查看审计与心跳；异常 digest 触发调查。

若用户尝试 `finsafe --policy /tmp/evil.yaml -- hermes`，CLI 返回 **`MANAGED_POLICY_LOCAL_OVERRIDE`**。若尝试 `finsafe run --personal -- hermes` 且存在哨兵，返回 **`MANAGED_FORCED_BY_POLICY`**。

---

## 5. 托管模式：管理员为何能可靠管控策略

托管模式的设计假设是：**桌面登录用户可能主动尝试削弱沙箱**，但 **不是** 持续拥有可随意改系统、关 MDM 的本地管理员（该情况见下文「残余风险」）。

### 5.1 策略完整性与来源可控

| 机制 | 作用 |
|------|------|
| **Ed25519 签名的 JWS bundle** | 终端只接受密码学验证通过的策略；篡改缓存文件会在加载时被拒绝 |
| **Policy Authority 单一发布口** | 变更必须经过 `finsafe-bundlectl` + 运维流程，而非 thousands 份 YAML |
| **Bundle 版本与绑定** | 可按程序、租户、OS 匹配；升级与回滚在服务端编排 |
| **Kill switch** | Authority 可下发吊销，agent 拒绝新运行或通知进行中会话 |

### 5.2 终端无法「换一份本地策略」

在已部署 **managed-required 哨兵** 和/或 **enrolled.json** 的机器上：

- 解析阶段拒绝 **`--policy`**（含全局 wrapper 与 legacy ExecutionSpec 路径）→ `MANAGED_POLICY_LOCAL_OVERRIDE`；
- 拒绝 **`--personal`** → `MANAGED_FORCED_BY_POLICY`；
- 托管隐式路径下，**必须** 从 agent 获取策略；无 agent 或 challenge 失败 → `MANAGED_DAEMON_UNREACHABLE`。

因此，即使用户精通命令行，也无法在 **仍使用组织提供的 `finsafe` 二进制** 的前提下，用本地 YAML 放宽网络或文件系统规则。

### 5.3 可观测与事后追责

- 每次运行可携带 **bundle_id、digest、policy_source=managed** 等元数据（见 `--json` 审计信封）；
- Agent **审计 spool** 与 **心跳**（含二进制 digest、哨兵状态）上报 Authority；
- MDM 可检查 `/etc/finsafe/managed-required.json`、服务是否运行、是否已注册。

验收项见 [托管模式验收矩阵](./testing/managed-mode-matrix-zh.md)。

---

## 6. 托管模式：桌面用户为何难以脱离（在威胁模型内）

下列控制 **叠加** 使用；FinSAFE **不声称** 能抵御拥有长期 root/本地管理员权限、可关 MDM、可替换二进制的高级对手（见 [威胁模型 — 桌面用户作为对手](../../design/finsafe-threat-model.md#13-desktop-user-as-policy-adversary-managed-mode)）。

| 用户可能的行为 | FinSAFE 的应对 | 说明 |
|----------------|----------------|------|
| 本地 `--policy evil.yaml` | `MANAGED_POLICY_LOCAL_OVERRIDE` | 解析期即拒绝 |
| `finsafe run --personal` | `MANAGED_FORCED_BY_POLICY` | 哨兵/注册状态下禁止 |
| 结束 `finsafe-agent` | CLI 无法取策略；心跳告警 | 需 MDM 禁止随意停服务 |
| 篡改 `/var/lib/finsafe/cache` | 每次加载重新验签 JWS | 篡改无效 |
| 在 `/run` 上伪造 UDS | **UdsChallenge**（Ed25519） | 假 agent 无法通过挑战 |
| 替换 `/usr/local/bin/finsafe` | 心跳 **binary_digests** 与清单比对 | 需配合 MDM 受管安装路径 |
| 回拨系统时钟延长 bundle 有效期 | **单调时钟 floor** | 缓存目录内持久化上次权威时间 |
| 自编译无托管功能的 CLI | 企业包应使用 **managed 构建**；公开发行包默认无托管 | 需禁止未授权开发工具链（可选） |

**关键结论：** 在「标准企业桌面用户 + MDM 纳管 + 企业签名二进制」模型下，用户 **不能** 在组织提供的 FinSAFE 入口上静默放宽 Hermes/OpenClaw 的沙箱；要完全绕过，必须 **脱离 FinSAFE 入口**（例如直接运行 `hermes`），这属于 **另一类检测面**（EDR、应用控制、网络策略），FinSAFE 与它们互补而非替代。

---

## 7. 对「分布式智能体」可治理性的价值总结

当 Agent 工作负载 **分布在中心执行集群与员工笔记本** 上时，组织面临的核心问题是：

> **如何在「Agent 决定做什么」的前提下，对每一次 OS 级执行设定一致策略、公平调度，并留下可审计证据？**

**中心平面**（Scheduler + Router + `finsafe-server`）解决多租户准入、排队、高级策略编译与 API 化沙箱服务。**边缘托管模式** 则回答：

> **如何在不要求所有推理上云的前提下，仍能对「本机代理能做什么」设定一致底线？**

FinSAFE 的价值可概括为：

1. **策略一致性** — 中心：租户级 `HighLevelPolicy` 经 Router 编译；边缘：Hermes/OpenClaw 包装策略以 bundle 覆盖全舰队。
2. **防篡改与强制入口** — 中心：API 拒绝原始 bwrap/seccomp 旋钮；边缘：纳管设备禁止本地 `--policy` 覆盖。
3. **审计与合规** — 统一 JSON 契约（准入、`policy_hash`、运行信封），可汇入 SIEM。
4. **演进能力** — 中心：配额、审批、`resolve`；边缘：bundle 轮换、kill switch。
5. **形态可组合** — 敏感交互在桌面托管；批处理或工具执行走中心 API；未纳管环境仍可用 `--policy` 试点。

因此，FinSAFE 不是「又一个终端 agent」或「又一个 Docker」，而是 **Agent 时代的执行治理层**：在边缘与中心用同一套沙箱语义，衔接 MDM、K8s、IAM 与 SOC。

---

## 8. 企业 IT 部署全景（MDM）

推荐分阶段实施（细节见 [enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md)）：

| 阶段 | 内容 | 参考 |
|------|------|------|
| **A. 中央** | 部署 Policy Authority、签名密钥、`finsafe-bundlectl` 发布流程 | 手册 §3 |
| **B. 试点** | 小范围安装 agent + CLI，验证 Hermes bundle，不收哨兵 | 手册 §4 |
| **C. 强制托管** | MDM 下发 `managed-required.json` | 手册 §5 |
| **D. 全舰队** | 注册、心跳监控、审计对接 SIEM | 手册 §6–8 |
| **E. 运营** | 轮换 bundle、事件响应、回滚 | 手册 §9–10 |

### MDM 交付物清单（与产品无关）

完整说明（中央 vs MDM 分工、上线顺序、工具映射）见 **[产品一页纸 · MDM 章节](./product-one-pager-zh.md#mdm分发安装与托管模式结合)**。

| 交付物 | 典型路径 | MDM 动作 |
|--------|----------|----------|
| `finsafe`、`finsafe-agent` 二进制 | `/usr/local/bin` 等 | PKG / 脚本安装（**managed** 企业构建） |
| LaunchDaemon / systemd 单元 | 见 [packaging/](../packaging/) | 服务策略 |
| managed-required 哨兵（JWS） | `/etc/finsafe/managed-required.json` | 受管文件下发 |
| 一次性注册 | 环境变量 + [enroll 脚本](../packaging/mdm/examples/) | 登录脚本或策略 |
| Policy Authority URL | 配置文件 / 自定义属性 | 租户配置 |

平台专项步骤：

- [与 MDM 产品无关的检查清单](./mdm/vendor-neutral-checklist-zh.md) — **首选**
- [Jamf Pro](./mdm/jamf-zh.md)
- [Microsoft Intune](./mdm/intune-zh.md)
- [Ansible](./mdm/ansible-zh.md)

### 建议阅读顺序（企业 IT）

1. 本文（全景与模式对比）
2. [managed-mode-zh.md](./managed-mode-zh.md) — 组件与错误码
3. [enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md) — 分阶段操作
4. [mdm/vendor-neutral-checklist-zh.md](./mdm/vendor-neutral-checklist-zh.md) — 上线检查项
5. [testing/managed-mode-matrix-zh.md](./testing/managed-mode-matrix-zh.md) — 投产前验收

---

## 9. 相关文档

| 文档 | 读者 |
|------|------|
| [USER-GUIDE-zh.md](./USER-GUIDE-zh.md) | 终端用户、服务台 |
| [POLICY-QUICKREF-zh.md](./POLICY-QUICKREF-zh.md) | 策略编写者 |
| [enterprise-deployment-runbook-zh.md](./enterprise-deployment-runbook-zh.md) | 部署与运维 |
| [managed-mode-macos-runbook.md](./testing/managed-mode-macos-runbook.md) | macOS 手工验收（英文） |

---

*文档版本与 FinSAFE 公开发行版同步；组件名称与路径以当前仓库 `docs/public-finsafe` 为准。*
