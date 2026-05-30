# FinSAFE 产品一页纸（企业 IT 版）

**读者：** 企业 IT 负责人、安全架构师、平台与终端工程师  
**English:** [product-one-pager.md](./product-one-pager.md)

---

## 一句话

**FinSAFE 是面向 AI 智能体工作负载的多租户安全执行底座**——用操作系统原生隔离（Linux / macOS）把「每一次工具调用 / 代码执行」变成可策略化、可调度、可审计的**执行单元**；既可部署在**员工桌面（边缘）**，也可部署在**数据中心 / Kubernetes（中心）**，对外提供 **Sandbox-as-a-Service** 能力。

---

## 产品分层（与代码一致）

```text
控制面（租户、策略、配额、审计、审批）
        │
        ▼
执行调度器 + 策略路由  ←  finsafe-scheduler、finsafe-policy（Policy Router）
  · 准入 / 排队 / 取消 / 租户并发与速率限制
  · 高级策略（HighLevelPolicy）→ 编译执行计划（CompiledExecutionPlan）
        │
        ▼
FinSAFE 运行时 / API     ←  finsafe-server（POST /v1/executions 等）
  · 与传输无关的函数 API + HTTP 覆盖层（OpenAPI）
        │
        ▼
单次执行沙箱           ←  bwrap、cgroup、Landlock、seccomp；macOS Seatbelt
  · 原则：一次执行 = 一个沙箱 = 一套策略范围
```

公开发行的 `finsafe` CLI 主要暴露最底层 **Local Program Wrapper**（本机 `run` / `self-confine`）。**调度、路由与远程提交**在企业/平台构建与 [`finsafe-server`](../../../docs/api/finsafe-server.md) 中提供；详见 [系统规格](../../../docs/design/finsafe-system-spec.md)、[Kubernetes 部署架构](../../../docs/design/finsafe-kubernetes-architecture.md)。

---

## AI 领域我们在解决什么

| 核心痛点 | 通俗说法 | FinSAFE 的切入点 |
|----------|----------|------------------|
| **Agent 即编排器** | LLM 决定「做什么」，但每次跑脚本、调工具都是真实 OS 权限 | 把每次动作变成**短生命周期执行单元**，单独编译策略再启动 |
| **多租户与滥用** | 云上跑很多用户的 Agent，需要排队、限流、配额 | **Execution Scheduler**：按租户 / 用户 / Agent 准入与审计 |
| **策略与实现脱节** | 运维写 YAML，运行时却被传入 seccomp/bwrap 原始参数 | **Policy Router**：只接受高级意图，拒绝原始沙箱旋钮 |
| **边缘与中心两套故事** | 本机 Hermes 要管，云上批任务也要管 | **同一套 JSON 契约**（`finsafe-json`），桌面 wrapper 或中心 API 二选一或组合 |
| **合规要证据** | 需证明「谁在何种策略下执行了什么」 | 统一审计形状：准入决策、`policy_hash`、运行信封 |

我们**不解决**：模型幻觉、提示词注入的语义层防护、LLM 供应商数据驻留——需网关、DLP、IAM 等配合。

---

## 两种部署形态（可并存）

| 形态 | 跑在哪里 | 典型组件 | 谁在用 |
|------|----------|----------|--------|
| **边缘 / 桌面** | 员工 Mac、Linux 笔记本 | `finsafe` CLI、`finsafe-agent`、Policy Authority（托管模式）、MDM | 分布式智能体（本机 OpenClaw / Hermes）；数据尽量留在端上 |
| **中心 / 云** | K8s 集群、内网执行平面 | `finsafe-server`、Scheduler、Router、执行 Pod/Job、可选 `finsafe-net-proxy` | 平台团队对外提供 **Sandbox-as-a-Service**；Claw/Hermes 适配器通过 HTTP 提交执行 |

**连接方式示例：**

- 本机包装：`finsafe --policy hermes-interactive.yaml self-confine hermes`
- 远程提交：`finsafe run --high-level policy.yaml --server https://finsafe.example.com -- …`（`POST /v1/executions`，见 Stage 2 API）
- 舰队托管：桌面 `finsafe run -- hermes`（策略来自 agent，无本地 `--policy`）

边缘强调 **治理与数据驻留**；中心强调 **多租户调度与统一执行平面**。二者共享沙箱引擎与策略语义，不是两个无关产品。

---

## 产品功能一览

| 能力 | 说明 |
|------|------|
| **Local Program Wrapper** | 单机包装任意二进制：`run`（短任务）、`self-confine`（交互式 Broker） |
| **高级策略 + Policy Router** | `HighLevelPolicy` → 编译为 `CompiledExecutionPlan`；确定性 `policy_hash` |
| **Execution Scheduler** | 准入、队列、取消、租户/用户/Agent 限制、主机预算（Stage 3） |
| **finsafe-server API** | `submit` / `get` / `cancel` / `resolve`（审批流）；OpenAPI + JSON Schema |
| **托管模式（桌面舰队）** | 签名 bundle、Policy Authority、`finsafe-agent`、MDM 哨兵（见 [托管模式](./managed-mode-zh.md)） |
| **Kubernetes 目标架构** | 每执行一 Pod/Job + 集群内 FinSAFE 内层沙箱（见设计文档） |
| **网络与制品** | 代理/白名单模式、制品收集策略（路由层声明，执行层落实） |

---

## 市场定位

- **品类：** AI Agent 的 **安全执行底座（Secure Execution Substrate）** — 介于「纯容器平台」与「纯终端 EDR」之间。  
- **与 ChatKit / FinClaw / Hermes 适配器：** Agent 负责对话与工具编排；FinSAFE 负责 **如何安全地执行** 每一次动作。  
- **Sandbox-as-a-Service：** 企业自建执行平面（常见为 K8s + `finsafe-server`），对内部或 B2B 租户提供策略化沙箱 API，**不必**把代码迁到 e2b/Daytona 等第三方云。  
- **桌面治理层：** 当 Agent 必须留在本机时，用托管模式 + MDM 恢复舰队级策略与审计（见 [企业 IT 全景](./enterprise-it-overview-zh.md)）。

```text
  第三方云沙箱 (e2b / Daytona)     FinSAFE 中心平面          FinSAFE 桌面
  厂商托管、秒级环境              自建 K8s / 内网 SaaS       本机 Agent + MDM
         │                              │                        │
         └──────── 可并存 ──────────────┴────────────────────────┘
              非敏感批任务上云；敏感交互在端；统一策略语言
```

---

## 技术价值（给工程师）

1. **比 Docker 更贴 Agent 执行模型** — 面向「一次工具调用 / 一段代码」，而非长期容器服务；比 MicroVM 更轻，适合企业可接受共享内核的场景。  
2. **调度与策略分离** — Router 只编译策略；Scheduler 只做准入与公平性；沙箱 crate 不含 HTTP，边界清晰（见 Stage 2 矩阵）。  
3. **契约优先** — `finsafe-json` 统一 `SchedulerRequest`、`AdmissionDecision`、审计事件；便于 SIEM 与多语言适配器。  
4. **诚实边界** — 共享内核沙箱 **不能** 替代 MicroVM 抵御恶意内核利用；极高对抗多租户应 **外层 MicroVM / 专用节点 + 内层 FinSAFE**。

---

## 与常见技术怎么选

| 技术 | 典型用途 | 与 FinSAFE 的关系 |
|------|----------|------------------|
| **Docker / K8s** | 打包、编排、集群资源 | FinSAFE **可跑在** Pod 内作内层沙箱；K8s 管放置与粗粒度限额，FinSAFE 管执行单元策略与 attestation。**不是** 用 FinSAFE 取代 K8s。 |
| **MicroVM（Firecracker 等）** | 不可信多租户、强隔离 | **更强、更重**；FinSAFE 可作内层或用于信任度较高的企业多租户。 |
| **WASM 运行时** | 插件、小片段代码 | 难覆盖完整 shell + MCP + 本地工具链的 Agent 栈。 |
| **e2b / Daytona** | 托管云沙箱、评测、Coding Agent 主机 | **第三方算力与镜像**；FinSAFE 适合 **自建执行平面**、策略与审计留在企业内，或与桌面数据驻留组合。 |
| **仅 MDM / EDR** | 设备合规、恶意行为检测 | **互补**：FinSAFE 在 Agent 动作执行前限定文件/网络/资源，并输出策略级审计。 |

**选型口诀：**

- 要 **厂商托管、开箱即用** 的远程开发沙箱 → e2b / Daytona 等。  
- 要 **自建多租户 Agent 执行平面**（K8s、内网 API、配额与审批）→ **FinSAFE 中心部署（SaaS 形态）**。  
- 要 **员工本机跑 Agent 且统一底线** → **FinSAFE 桌面 + 托管模式**。  
- 租户 **完全不可信**、需扛内核漏洞 → **MicroVM 外层 + FinSAFE 内层**（或纯 MicroVM）。

---

## 适用场景

| 场景 | 部署形态 |
|------|----------|
| 内部 **Agent 平台**（工具调用、代码执行、审批） | 中心：`finsafe-server` + Scheduler + Router；K8s 工作节点 |
| **Sandbox-as-a-Service** 对内/对伙伴开放 API | 同上 + API 网关、租户鉴权、审计下沉 |
| 全公司 **本机 OpenClaw / Hermes** | 边缘：wrapper 或托管模式 + MDM |
| 敏感数据 **不出端** 的投研/政务桌面 | 边缘托管；可选中心仅做策略与审计汇聚 |
| **合规试点** | 先本机 `--policy` 验证策略，再推广 server 或托管舰队 |

## 不太适合的场景

| 场景 | 建议 |
|------|------|
| 仅需 **固定 Docker 镜像**、无 Agent 动态工具链 | 标准容器平台可能更简单 |
| **互联网陌生人** 多租户、零信任内核 | 外层 MicroVM 或商业云沙箱 |
| **Windows** Agent 主机沙箱（v1） | 当前托管 v1 以 Linux / macOS 为主；中心 Linux 执行仍可用 |
| 期望 FinSAFE **单独解决** 模型安全与提示词注入 | 需上层网关与策略引擎 |

---

## MDM：分发、安装与托管模式结合

本节说明 **边缘 / 桌面托管** 场景下，FinSAFE 如何通过 **MDM（或任意终端管理工具）** 完成软件分发与强制策略。中心执行平面（`finsafe-server`、K8s）通常由 **平台团队** 用镜像 / Helm / CI 部署，**不经过** 终端 MDM；二者共用同一套 Policy Authority 与签名体系时，策略可一致。

### 分工：MDM 管什么、中央管什么

```text
  ┌──────────────── Policy Authority（HTTPS，IT/安全运维）────────────┐
  │  构建/签名 bundle · 签发 managed-required 哨兵 · 注册 token · JWKS   │
  └────────────────────────────┬────────────────────────────────────┘
                               │ 拉取 bundle / 注册 / 心跳（agent）
         MDM 下发               │
  ┌────────────────────────────▼────────────────────────────────────┐
  │  员工 Mac / Linux 笔记本                                            │
  │  M1–M2  finsafe、finsafe-agent 二进制                              │
  │  M4     /etc/finsafe/managed-required.json（强制托管）              │
  │  M5–M6  agent 系统服务 + FINSAFE_AUTHORITY_URL                     │
  │  M7–M8  一次性注册（enroll token），完成后撤销                        │
  └───────────────────────────────────────────────────────────────────┘
```

| 由 **中央运维** 完成（非 MDM） | 由 **MDM / 配置管理** 推到每台桌面 |
|------------------------------|-----------------------------------|
| 部署 `finsafe-authority-http` | 安装 `finsafe`、`finsafe-agent`（须 **managed** 企业构建） |
| `finsafe-bundlectl` 签名 bundle 与哨兵 | 下发哨兵 JWS → `/etc/finsafe/managed-required.json` |
| 签发一次性 `enroll` token | 配置 LaunchDaemon / systemd，设置 `FINSAFE_AUTHORITY_URL` |
| 策略变更、kill switch、审计汇聚 | 执行一次性注册脚本；注册后 **删除** token 环境变量 |

**要点：** MDM **不承载** 策略 YAML 正文；终端上的执行策略来自 agent 向 Authority **拉取的已签名 bundle**。MDM 只负责 **二进制、服务、哨兵、注册与 URL** 等「装机面」交付。

### 企业二进制与安装路径

舰队部署请使用 [GitHub Releases](https://github.com/finogeeks/finsafe/releases) 中的 **`finsafe-fleet-v*`** 发行包（含托管 `finsafe` + `finsafe-agent`）。公开发行的 `curl | sh` 个人安装包默认不含托管能力。

| 交付物 | 推荐路径 | 说明 |
|--------|----------|------|
| `finsafe` | `/usr/local/bin/finsafe` | 用户入口；心跳会校验该路径摘要 |
| `finsafe-agent` | `/usr/local/bin/finsafe-agent` | 守护进程；提供 UDS 策略 |
| 状态目录 | `/etc/finsafe`、`/var/lib/finsafe` | 注册信息、bundle 缓存、审计 spool |
| 哨兵 | `/etc/finsafe/managed-required.json` | 单行 JWS；存在则禁止 `--personal` / 本地 `--policy` |
| Agent 套接字 | `/run/finsafe-agent.sock`（Linux 默认） | CLI 托管模式下从此取策略 |

Linux 上若发行版包含 `finsafe-helper` 等伴随二进制，应与 `finsafe` **同目录** 安装。

### MDM 交付清单（与工具无关）

将下列步骤映射到 Jamf / Intune / Ansible / 黄金镜像等中的 **软件包、受管文件、启动项、脚本策略** 各一步：

| 步骤 | 内容 | 参考 |
|------|------|------|
| **1. 装二进制** | M1–M2：PKG、deb、Munki、Intune 应用、镜像烘焙 | [packaging/README.md](../packaging/README.md) |
| **2. 建目录** | M3：`/etc/finsafe`、`/var/lib/finsafe` | 安装前 `mkdir` |
| **3. 下哨兵** | M4：中央签名的 `managed-required.json` | [deploy-sentinel 示例](../packaging/mdm/examples/generic/deploy-sentinel.sh) |
| **4. 启 agent** | M5–M6：systemd 或 LaunchDaemon + `FINSAFE_AUTHORITY_URL` | [systemd 单元](../packaging/systemd/finsafe-agent.service) · [launchd plist](../packaging/launchd/com.finogeeks.finsafe-agent.plist) |
| **5. 注册** | M7：仅试点波次注入 `FINSAFE_ENROLL_TOKEN`、`FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID` | [enroll-once.sh](../packaging/mdm/examples/generic/enroll-once.sh) |
| **6. 收 token** | M8：确认 `/etc/finsafe/enrolled.json` 后，从 MDM 移除 token | [remove-enroll-token](../packaging/mdm/examples/generic/remove-enroll-token.sh) |
| **7. 推广用法** | M9：文档约定 `finsafe run -- hermes`（无 `--policy`） | [USER-GUIDE-zh.md](./USER-GUIDE-zh.md) |

### 与常见 MDM 的对应关系

| 工具 | 典型做法 |
|------|----------|
| **Jamf Pro** | PKG 装二进制；配置文件下发哨兵；LaunchDaemon 启 agent；策略脚本做 enroll | [jamf-zh.md](./mdm/jamf-zh.md) |
| **Microsoft Intune** | macOS 应用/PKG + 自定义属性；Linux 用脚本部署 systemd | [intune-zh.md](./mdm/intune-zh.md) |
| **Ansible / Puppet / Chef** | Playbook 实现 M1–M8 全链路 | [ansible-zh.md](./mdm/ansible-zh.md) |
| **Kandji / Workspace ONE / 黄金镜像** | 与厂商无关清单中的映射表 | [vendor-neutral-checklist-zh.md](./mdm/vendor-neutral-checklist-zh.md) |

FinSAFE **不绑定** 某一 MDM；只要能以 root 安装文件、保持系统级守护进程、执行一次性脚本即可。

| 工具 | 托管模式 v1 覆盖的端点 |
|------|------------------------|
| **Jamf Pro** | **macOS** |
| **Microsoft Intune** | **macOS** + **Linux**（自定义脚本 / systemd）；**不含 Windows 端 FinSAFE 舰队** |
| **Ansible / SCCM 等** | 以 **Linux** 为主（见 [ansible-zh.md](./mdm/ansible-zh.md)） |

### Windows 设备与 MDM（v1 现状）

**结论：** 托管模式 v1 **没有** 面向 Windows 桌面的 MDM 装机清单（无 Windows 版 `finsafe-agent`、无 `managed-required` 哨兵路径、无 Intune「Windows 应用」示例）。这与「FinSAFE 可在云端运行」并不矛盾——**中心执行平面** 与 **Windows 笔记本上的本地托管** 是两条路径。

| 能力 | Windows 桌面（v1） | Mac / Linux 桌面（v1） |
|------|-------------------|------------------------|
| MDM 下发 `finsafe` + `finsafe-agent` + 哨兵 | **不支持** | **支持**（见上文 M1–M8） |
| `finsafe run` 本地包装 Hermes/OpenClaw | **无官方 Windows 主机沙箱** | 支持（bwrap / Seatbelt） |
| 通过 **Policy Authority + agent** 强制舰队策略 | **不支持** | 支持 |
| 员工在 Windows 上使用 Agent，**执行落在中心** | **可以**（见下） | 可选本地或中心 |

**Windows 上 IT 仍可采用的方案：**

1. **中心 Sandbox-as-a-Service（推荐）**  
   Windows 上的 ChatKit / Hermes / 自研适配器通过 HTTPS 调用 **`finsafe-server`**（`POST /v1/executions`），代码与数据在 **数据中心 / K8s 上的 Linux 执行单元** 内运行。MDM 负责 Windows 常规合规（BitLocker、补丁、应用控制），**不负责** 安装 FinSAFE 托管组件。

2. **混合舰队**  
   - 需要 **本机数据驻留** 的岗位：发放 **Mac 或 Linux** 笔记本，按本文 MDM 流程纳管。  
   - 允许 **Windows 办公机** 的岗位：Agent 逻辑走 **中心 API**；敏感本地 REPL 不放在 Windows 上。

3. **WSL2 / 远程 Linux（仅作补充，非官方 v1 承诺）**  
   若组织已在 Windows 上标准化 WSL2，**理论上** 可在 WSL 发行版内按 Linux 路径安装 FinSAFE 并配合 Intune 的 Linux 脚本——但路径、服务生命周期与审计归属复杂，**不作为 v1 正式支持矩阵**；投产前需自行验证。

4. **互补：应用控制，而非 FinSAFE 托管**  
   在 Intune 上对 `hermes.exe`、`openclaw` 等使用 **AppLocker / WDAC** 限制未包裹启动，属于 **EDR/应用控制** 范畴，**不能** 替代 FinSAFE 的策略编译与 `policy_hash` 审计；可与 Mac/Linux 托管舰队并存。

**Microsoft Intune 说明：** 现有 [intune-zh.md](./mdm/intune-zh.md) 仅覆盖 **macOS 与 Linux** 托管设备；请勿将其中脚本用于「Windows 10/11 设备」类型。Windows 设备在 Intune 中仍可用于部署其他安全基线，但 **FinSAFE 托管模式装机项（M1–M8）不适用**。

**规划预期：** Windows 桌面托管（含 Intune Win32 服务、哨兵路径、UDS/agent 协议）属于 **后续版本** 范围；当前请以 [vendor-neutral-checklist-zh.md](./mdm/vendor-neutral-checklist-zh.md) 与 [部署手册](./enterprise-deployment-runbook-zh.md) 中的平台声明为准。

### 推荐上线顺序（结合 MDM）

1. **中央**：Authority 上线 → 签名初始 Hermes/OpenClaw bundle → 签名哨兵（见 [部署手册](./enterprise-deployment-runbook-zh.md) 阶段 A）。  
2. **试点 MDM 组**：仅装二进制 + agent + 注册，**暂不** 推哨兵 → 验证拉包与 `finsafe run --json`。  
3. **强制托管**：向试点组下发 `managed-required.json` → 验证 `MANAGED_FORCED_BY_POLICY` / `MANAGED_POLICY_LOCAL_OVERRIDE`。  
4. **全舰队**：MDM 滚动更新；Authority 轮换 bundle 版本，agent 自动拉取。

部署后可用 [vendor-neutral-checklist-zh.md](./mdm/vendor-neutral-checklist-zh.md) 中的验证命令做冒烟（二进制、哨兵、`enrolled.json`、UDS、负向 `--personal`）。

---

## 交付与文档入口

| 关注点 | 文档 |
|--------|------|
| 采购 / 架构总览 | 本文 + [企业 IT 全景](./enterprise-it-overview-zh.md) |
| 桌面托管与 MDM | 本文 **「MDM」** 一节 · [部署手册](./enterprise-deployment-runbook-zh.md) · [MDM 检查清单](./mdm/vendor-neutral-checklist-zh.md) · [mdm/README-zh.md](./mdm/README-zh.md) |
| 中心 API（对内工程） | 仓库内 [`docs/api/finsafe-server.md`](../../../docs/api/finsafe-server.md) · [`docs/design/finsafe-kubernetes-architecture.md`](../../../docs/design/finsafe-kubernetes-architecture.md) |
| 本机策略与 Hermes 示例 | [USER-GUIDE-zh.md](./USER-GUIDE-zh.md) · [examples/wrapper-policies/](../examples/wrapper-policies/) · [high-level-policies/](../examples/high-level-policies/) |

---

*FinSAFE 由 Finogeeks 发布。本公开文档侧重发行版 CLI 与运维手册；完整平台（server、scheduler、router）在 monorepo 内实现，企业可按需构建与部署。*
