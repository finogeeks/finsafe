# FinSAFE 常见问题（FAQ）

**读者：** 产品、销售与售前、安全架构、企业 IT、平台工程、Agent 集成方  
**更新：** 2026-07-17  
**相关：** [产品一页纸](./product-one-pager-zh.md) · [术语表](./terminology-glossary-zh.md) · [生态比较备忘](../../reference/agent-sandbox-ecosystem-comparison.md) · [平台能力矩阵](../../reference/platform-feature-matrix.md)

技术事实以本仓库实现与公开文档为准；市场竞品描述基于公开资料，会随时间变化。

**写法约定：** 文中出现的产品名、缩写、行业黑话，均在下方「速查」或首次出现处给出白话解释；不假设读者已熟悉安全/云原生词汇。更全索引见 [terminology-glossary-zh.md](./terminology-glossary-zh.md)。

### 阅读前：什么是「沙箱」？为什么智能体需要它？

#### 沙箱一句话

**沙箱（Sandbox）** = 故意给程序造一个「带围栏的小院子」：它还能干活，但尽量**读不到围栏外的文件、改不了系统、连不了不该连的网**。出了意外（恶意代码、模型听错指令、脚本写错路径），伤害被关在院子里。

这不是某一种产品的专属名词，而是一整类**隔离思路**。你日常已经在用多种「沙箱」，只是名字不同：

| 常见形态 | 在防什么 | 和 FinSAFE 的关系 |
|----------|----------|-------------------|
| **浏览器沙箱**（Chrome 等把网页标签页隔开） | 恶意网页读本机文件、乱装插件 | **同思路、不同层**：浏览器管「网页能碰什么」；FinSAFE 管「Agent 拉起的本机进程能碰什么」 |
| **手机 App 沙箱**（iOS/Android 每应用独立数据目录） | App 互读隐私、越权调相机 | 同为 OS 级权限边界；FinSAFE 面向桌面/服务器上的 Agent 工具链 |
| **操作系统沙箱**（macOS Seatbelt、Windows AppContainer、Linux seccomp/Landlock 等） | 某个进程越权读写、乱调系统调用 | **FinSAFE 直接站在这一层**：把 OS 原语产品化成「策略 + 执行 + 审计」 |
| **容器 / Docker** | 应用与依赖打包隔离、进程视图隔离 | 常作**外层打包/编排**；FinSAFE 可嵌在容器里当**内层执行策略**，也可在无 Docker 的员工本机独立工作 |
| **虚拟机 / MicroVM** | 近乎整台小电脑隔离（常含独立内核） | **更强、更重**；公网陌生人代码的主场。企业内网半可信场景往往不必一上来就建 MicroVM 农场 |
| **Harness 内置沙箱**（Claude Code / Codex 自带） | 该产品自己的工具调用 | 个人/单产品够用；企业多 Agent、要中央策略与审计时，需要可独立采购的底座（FinSAFE） |

记忆口诀：**沙箱是「围栏」；围栏可以钉在浏览器、手机、OS、容器或虚拟机上。FinSAFE 钉的是「Agent 真实执行」那一层 OS 围栏，并可加上企业策略与审计。**

#### 为什么智能体特别需要沙箱？

聊天机器人主要「说话」；**智能体（AI Agent）会动手**：读盘、写文件、跑 Shell、开浏览器、调内网 API。模型一旦被提示词注入（prompt injection）、工具选错、或脚本写崩，后果是**真数据、真系统**上的。

没有执行层围栏时，常见风险包括：

| 风险 | 没有沙箱时可能发生什么 |
|------|------------------------|
| **泄密** | 读到 `~/.ssh`、`.env`、客户名单、未公开研报，再经工具外发 |
| **破坏** | `rm -rf`、改配置、覆盖生产脚本、误删共享盘 |
| **横向移动** | 用员工本机凭证扫内网、撞库、装后门 |
| **合规失守** | 敏感数据默认进公有云沙箱；出事无法证明「当时用了哪套策略」 |
| **绕过口头规矩** | 「请不要读密钥」只是提示词；模型或恶意内容可以不听——**OS 拒绝才算硬边界** |

EDR（终端检测响应）擅长发现异常再处置；**沙箱擅长在执行前就把能力收窄**。企业落地 Agent 通常需要两者配合，而不是二选一。详见后文 [A1](#a1-finsafe-一句话是什么)、[A8](#a8-企业为何难以自建-microvmdocker-托管用-e2b-又有何挑战finsafe-如何成为内网好方案)。

### 阅读前：什么是「舰队」？

FinSAFE 文档里的 **舰队（fleet）** 不是海军术语，而是企业 IT 的习惯说法，指：

> **由组织统一纳管的一批员工终端**（Mac / Linux / Windows 笔记本或台式机），在其上安装同一套 FinSAFE 组件，并从中央 **Policy Authority（策略权威服务）** 拉取已签名的执行策略。

可以把它理解成「要跑 AI Agent 的那批公司电脑」，而不是云上的一批容器。

| 对比 | 个人模式 | 舰队 / 托管模式 |
|------|----------|-----------------|
| 谁定策略 | 本机用户写 `--policy` YAML | 中央签发 **bundle（策略包）**，本机不可随意改 |
| 典型组件 | 公开发行的 `finsafe` CLI | `finsafe` + `finsafe-agent`（fleet 发行包）+ Authority |
| 终端怎么装上 | 个人 `curl \| sh` 等 | 常经 **MDM**（见下表）/ Ansible / 黄金镜像批量下发 |
| 要解决什么 | 单机试跑、开发自用 | 全公司统一底线、灰度、审计、防绕过本地策略 |

后文「企业舰队」「桌面舰队」均指上述含义。细节见 [C4](#c4-finsafe-与-mdm-如何结合) 与 [managed-mode-zh.md](./managed-mode-zh.md)。

### 阅读前：核心概念与缩写速查

按字母/出现频率排列。读 FAQ 遇到不懂的词，先查本表。

#### 产品与角色

| 术语 | 白话说明 |
|------|----------|
| **AI Agent / 智能体** | 能调用工具（读文件、跑命令、上网）完成任务的 AI 程序，不只是聊天机器人 |
| **LLM** | Large Language Model，大语言模型（如 GPT、Claude 背后的模型） |
| **Harness** | 承载 Agent 的「驾驭层」产品（如 Claude Code、Codex CLI）：对话、工具调度、权限提示等；常自带一层沙箱 |
| **Findesk** | 投研/顾问向桌面产品（用 Electron 做成的桌面 App），把 Agent 与合规体验打包给业务用户 |
| **Electron** | 用网页技术（Chromium + Node.js）打包跨平台桌面应用的框架 |
| **FinClaw** | 本机 Agent 运行时之一（常以 `finclaw serve` 提供 HTTP 服务），可被 FinSAFE 包装 |
| **Hermes / OpenClaw** | 第三方或生态中的 Agent Runtime（智能体运行时），经同一套 `finsafe` 包装接入 |
| **ACP** | Agent Client Protocol：桌面宿主与 Agent 之间用 **stdin/stdout 管道**做 JSON-RPC 通信的一类协议形态（非 HTTP） |
| **JSON-RPC** | 用 JSON 编码的远程过程调用协议（请求里带方法名与参数，对方返回结果） |
| **Trust Zone** | Findesk 产品里的「可信区」叙事：哪些对话/数据更敏感、是否开启沙箱等信任信号 |
| **Code Interpreter** | 「代码解释器」：让模型在隔离环境里跑一段代码并看结果的能力/产品形态 |
| **Secure Execution Substrate** | 「安全执行底座」：FinSAFE 的品类自称——专注「怎样安全地执行」，不负责对话与业务 UX |
| **broker** | 长驻的对话/编排进程（跟用户聊、调度工具）；相对「一次性工具子进程」而言 |
| **提示词注入（prompt injection）** | 用藏在网页/文件/用户输入里的指令，诱使模型违背原意图去调用危险工具或泄密 |

#### 企业 IT 与安全品类

| 术语 | 白话说明 |
|------|----------|
| **MDM** | Mobile Device Management，**移动/终端设备管理**：Jamf、Intune 等，用来批量装软件、推配置、管公司电脑 |
| **EDR** | Endpoint Detection and Response，**终端检测与响应**：装在电脑上的安全软件，发现并处置恶意行为（告警、隔离主机等）。偏「事后/运行中检测」，不是 FinSAFE 那种「执行前策略限制」 |
| **SIEM** | Security Information and Event Management，安全信息与事件管理：集中收日志、做关联分析的平台 |
| **DLP** | Data Loss Prevention，数据防泄漏：阻止敏感内容外传（FinSAFE 可在代理路径上对 HTTP 正文做规则扫描） |
| **CISO** | Chief Information Security Officer，首席信息安全官 |
| **SOC** | Security Operations Center，安全运营中心（处理告警的团队/岗位） |
| **合规 / 审计证据** | 能向监管或内审证明「谁在什么策略下做了什么」的记录，而不只是「系统好像安全」 |
| **数据驻留** | 数据留在指定司法辖区/内网/本机，不默认送到公有云 |
| **私有化 / 行业云** | 软件部署在客户自己机房或专属云，而不是共用公有云多租户 |
| **黄金镜像** | 预装好软件的标准系统镜像，用来批量克隆员工机 |
| **Ansible** | 常用的自动化配置管理工具（用脚本批量改服务器/电脑） |

#### 云、编排与「沙箱」品类

| 术语 | 白话说明 |
|------|----------|
| **沙箱（Sandbox）** | 让不信任的程序在受限环境里跑，尽量伤不到宿主系统的技术总称 |
| **SaaS** | Software as a Service：软件以在线服务形式提供。文中 **Sandbox-as-a-Service** = 以 API 提供「按次受控执行」的服务形态 |
| **Serverless / Lambda / Cloud Function** | 「无服务器」函数计算：你交一段函数，云厂商负责弹性执行与计费；类比「按次跑代码」，但通常不是完整 Agent 工具链沙箱 |
| **API** | Application Programming Interface：程序之间调用的接口（如 HTTP `POST /v1/executions`） |
| **SDK** | Software Development Kit：给开发者用的客户端库 |
| **DX** | Developer Experience，开发者体验（文档好不好用、五分钟能否跑通） |
| **Docker** | 最常见的容器引擎：把应用和依赖打成镜像，在隔离的进程环境里跑 |
| **容器（Container）** | 共享宿主机内核、用命名空间等隔离开的进程组；比虚拟机轻，默认隔离弱于 MicroVM |
| **K8s / Kubernetes** | 容器编排系统：在集群里调度、扩缩、管理大量容器/任务 |
| **Pod** | K8s 里最小调度单元（常含一个或多个容器） |
| **CRD** | Custom Resource Definition：K8s 自定义资源类型（扩展「集群里有什么对象」） |
| **OCI** | Open Container Initiative：容器镜像/运行时的行业标准格式 |
| **控制面 / 数据面** | 控制面管「调度与策略」；数据面管「真正跑起来的负载」 |
| **BYOC** | Bring Your Own Cloud：把产品部署进客户自己的云账号/VPC |
| **VPC** | Virtual Private Cloud：云厂商里客户专属的隔离虚拟网络 |
| **GPU** | 图形处理器，常用于模型训练/推理加速 |
| **npm** | Node.js 生态常用的包管理器/包仓库（如 `npm install @anthropic-ai/sandbox-runtime`） |

#### 隔离强度相关

| 术语 | 白话说明 |
|------|----------|
| **OS** | Operating System，操作系统 |
| **进程级隔离** | 不新开虚拟机，主要靠操作系统权限与沙箱机制限制**进程**；启动快、密度高，但与宿主**共享内核** |
| **共享内核** | 沙箱内外用同一套操作系统内核；内核若被攻破，隔离可能失效 |
| **MicroVM** | 轻量虚拟机（如 Firecracker）：每个负载近似独立小虚拟机+独立内核，隔离更强、更重 |
| **Firecracker / Kata / gVisor** | 常见强隔离运行时：Firecracker/Kata 偏虚拟化；gVisor 在用户态拦截系统调用 |
| **syscall** | 系统调用：程序请求内核做的事（读盘、建网等） |
| **0day** | 尚未公开补丁的漏洞；「内核 0day」指可被用来逃出共享内核沙箱的严重漏洞 |
| **半可信多租户** | 租户是自己员工或授权系统，主要防误操作与泄密，而非防陌生黑客内核逃逸 |
| **不可信 / 敌意多租户** | 任意互联网用户提交代码，必须假设会主动攻击宿主 |

#### FinSAFE 治理与策略

| 术语 | 白话说明 |
|------|----------|
| **Policy Authority / Authority** | 中央「策略权威」HTTPS 服务：发策略包、管设备注册、收审计 |
| **bundle（策略包）** | 已数字签名的策略集合，设备只能执行验签通过的版本 |
| **哨兵（sentinel）** | 下发到机器上的签名文件，声明「此机必须托管，禁止个人改策略」 |
| **enroll（注册）** | 设备向 Authority 报到，获得拉策略资格 |
| **rollout（灰度）** | 先让一部分设备用新策略，再逐步扩大 |
| **JWS** | JSON Web Signature：给 JSON 内容做数字签名的封装格式 |
| **JWKS** | JSON Web Key Set：公开发布的验签公钥集合 |
| **CLI** | Command Line Interface，命令行工具（如 `finsafe`） |
| **YAML / JSON** | 常见的配置/数据文本格式 |
| **wrapper / 包装策略** | 用一份声明式配置「包住」任意程序再启动 |
| **`run` / `self-confine`** | FinSAFE 两种启动方式：短任务子进程 vs 交互式把自身限制后 exec 到目标程序 |
| **policy_hash / policy_digest** | 策略内容的指纹（哈希），用于证明「跑的时候用的就是这份策略」 |
| **attestation（证明/证明材料）** | 运行结果里记录「实际用了哪套隔离后端、是否降级」等可核验信息 |
| **fail closed** | 出问题就**拒绝执行**，而不是悄悄放宽策略 |
| **deny-read** | 明确禁止读取某些路径（如 `.env`、`.ssh`），即使工作区整体可写 |
| **审计信封 / 审计 spool** | 标准化的一次执行审计记录；spool 是本机暂存、稍后上报的队列 |
| **HighLevelPolicy** | 运维写的高级意图策略（不直接拧 seccomp 旋钮），由系统编译成执行计划 |
| **WarmPool** | 预热池：事先准备好一批沙箱槽位，降低高并发时的冷启动 |
| **pause/resume** | 把运行中环境挂起再恢复（省资源、保状态）；FinSAFE SaaS 侧仍在演进 |

#### 网络与代理

| 术语 | 白话说明 |
|------|----------|
| **egress（出口）** | 从沙箱/内网**往外**访问互联网的流量 |
| **allowlist（白名单）** | 只允许名单内的域名/目标，其余拒绝 |
| **代理（proxy）** | 流量先到本机或旁路代理再决定是否放行 |
| **回环 / loopback** | `127.0.0.1`，本机自己连自己；常用来强制流量进本地代理 |
| **MITM** | Man-in-the-Middle，中间人：这里指企业**主动解密 HTTPS** 做检查（须合规告知），不是黑客攻击 |
| **TLS / HTTPS** | 加密的网页/API 传输；TLS 终止 = 在代理处解密再检查 |
| **CA** | Certificate Authority，证书颁发机构；检查用 CA = 企业自签的「检查证书」根 |
| **L7** | OSI 第七层（应用层）：能看 HTTP 方法、路径、正文，而不只是 IP/端口 |
| **SOCKS** | 一种代理协议；Codex/srt 常内置，FinSAFE 尚未全面产品化 |
| **parent proxy（上级企业代理）** | 公司统一上网网关；FinSAFE 本地代理再把流量转给它 |
| **HTTP(S)_PROXY** | 程序用来发现代理地址的环境变量 |

#### 操作系统机制（正文第三部分会展开）

| 术语 | 白话说明 |
|------|----------|
| **bubblewrap / bwrap** | Linux 上常用的用户态沙箱启动器 |
| **namespace（命名空间）** | Linux 把「进程看到的挂载点/网络/PID 等」隔成独立视图的机制 |
| **seccomp** | 用过滤器限制程序能用哪些系统调用 |
| **Landlock** | Linux 按路径限制读写的安全模块 |
| **cgroup** | 控制组：限制 CPU/内存/进程数等资源 |
| **Seatbelt** | macOS 内核强制沙箱策略机制 |
| **AppContainer** | Windows 低特权应用容器 |
| **Restricted Token** | Windows「受限令牌」：降低进程写权限等能力的一种宿主侧限制方式 |
| **WFP** | Windows Filtering Platform，Windows 内核网络过滤 |
| **DACL** | 文件/对象上的访问控制列表（谁能读/写） |
| **Job Object** | Windows 进程组资源与生命周期限制 |
| **ProjFS** | Windows 投影文件系统：大目录可按需「投影」为本地树，常用于只读工作区 |
| **PipeInherit** | 管道句柄继承：父子进程共用 stdin/stdout 管道（桌面 ACP 场景常见） |
| **Shell** | 命令行解释器（bash、zsh、cmd、PowerShell 等） |
| **TTY / PTY / ConPTY** | 终端交互相关：真人打字的终端 vs 伪终端 vs Windows 控制台伪终端 |
| **stdio** | 标准输入/输出/错误三个数据流 |
| **LibOS** | Library OS：用用户态库模拟系统接口，而不是完整虚拟机；FinSAFE 不走此路线 |
| **Hypervisor** | 虚拟机监视器：在硬件上跑多个虚拟机的底层软件 |

---

## 目录

0. [阅读前：什么是「沙箱」？](#阅读前什么是沙箱为什么智能体需要它) · [什么是「舰队」？](#阅读前什么是舰队) · [缩写速查](#阅读前核心概念与缩写速查)

**第一部分 · 为什么有这个产品（商业与客户价值）**

- [A1. FinSAFE 一句话是什么？](#a1-finsafe-一句话是什么)
- [A2. 为什么市场已有很多沙箱，仍要做 FinSAFE？](#a2-为什么市场已有很多沙箱仍要做-finsafe)
- [A3. 对企业客户的核心价值是什么？](#a3-对企业客户的核心价值是什么)
- [A4. FinSAFE 最大的优势与独特能力是什么？](#a4-finsafe-最大的优势与独特能力是什么)
- [A5. 市场推广与客户教育应突出什么？](#a5-市场推广与客户教育应突出什么)
- [A6. 什么是 Sandbox-as-a-Service？和 Lambda / Serverless 有何可比性？](#a6-什么是-sandbox-as-a-service和-lambda--serverless-有何可比性)
- [A7. 明确不做什么？](#a7-明确不做什么)
- [A8. 企业为何难以自建 MicroVM/Docker 托管？用 E2B 又有何挑战？FinSAFE 如何成为内网好方案？](#a8-企业为何难以自建-microvmdocker-托管用-e2b-又有何挑战finsafe-如何成为内网好方案)

**第二部分 · 与市场上其他技术的对比**

- [B1. 与其他沙箱是竞争还是互补？](#b1-与其他沙箱是竞争还是互补)
- [B2. 隔离技术谱系（底层）](#b2-隔离技术谱系底层)
- [B3. 个人 / 本机方案一览](#b3-个人--本机方案一览)
- [B4. 开源与可自建平台](#b4-开源与可自建平台)
- [B5. 闭源 / 商业托管平台](#b5-闭源--商业托管平台)
- [B6. 「沙箱」但非 OS 隔离的方案](#b6-沙箱但非-os-隔离的方案)
- [B7. 与 Claude sandbox-runtime / Codex 内置沙箱对标](#b7-与-claude-sandbox-runtime--codex-内置沙箱对标)
- [B8. 威胁模型选型口诀](#b8-威胁模型选型口诀)

**第三部分 · 架构、实现与价值链协作**

- [C1. 「进程级」而非「Agent 级」是什么意思？性能开销？](#c1-进程级而非-agent-级是什么意思性能开销)
- [C2. 技术原理与核心原语](#c2-技术原理与核心原语)
- [C3. 安全策略怎么配置？](#c3-安全策略怎么配置)
- [C4. FinSAFE 与 MDM 如何结合？](#c4-finsafe-与-mdm-如何结合)
- [C5. 网络安全：allowlist、egress proxy、MITM](#c5-网络安全allowlistegress-proxymitm)
- [C6. 与 Findesk / FinClaw 如何配合完成价值链？](#c6-与-findesk--finclaw-如何配合完成价值链)
- [C7. 与 Hermes 等 Agent Runtime 的集成](#c7-与-hermes-等-agent-runtime-的集成)

---

# 第一部分 · 为什么有这个产品（商业与客户价值）

## A1. FinSAFE 一句话是什么？

**FinSAFE 是面向 AI 智能体工作负载的安全执行底座（Secure Execution Substrate）**：用操作系统原生隔离（Linux / macOS / Windows），把「每一次工具调用 / 代码执行」变成可策略化、可调度、可审计的**执行单元**；既可部署在员工桌面（边缘），也可部署在数据中心 / Kubernetes（容器编排集群，下文简称 K8s），对外提供 **Sandbox-as-a-Service**（以 API 提供受控执行的服务形态，见 [A6](#a6-什么是-sandbox-as-a-service和-lambda--serverless-有何可比性)）。

品类位置：介于「纯容器平台」（如 Docker/K8s，负责打包与编排）与「纯终端 EDR」（Endpoint Detection and Response：装在电脑上做威胁检测与响应的安全软件，见文首速查）之间——**Agent 负责想做什么，FinSAFE 负责怎样安全地做。**

> 缩写与黑话一律以文首 [速查表](#阅读前核心概念与缩写速查) 为准；下文不再逐词展开，但首次关键处会尽量点一下。

## A2. 为什么市场已有很多沙箱，仍要做 FinSAFE？

市面上多数方案只覆盖**某一层**：

| 常见方案类型 | 典型代表 | 通常缺什么 |
|--------------|----------|------------|
| 托管云沙箱 | E2B、Modal、Vercel Sandbox、腾讯 Agent 沙箱 | 数据驻留/私有化、企业策略权威、经 MDM（终端设备管理）纳管的设备舰队、端云一致策略语言 |
| 开源生命周期控制面 | OpenSandbox、部分 K8s CRD（自定义资源类型） | 桌面三端原生隔离、签名 bundle / Authority、合规审计闭环 |
| Harness 内置沙箱 | Claude sandbox-runtime、Codex 内置沙箱（写进某一款 Coding Agent 产品里的沙箱） | 不可拆成独立企业产品；无多台员工机统一托管；绑定单一 Agent |
| 仅 MDM / EDR | Jamf、Intune、各类 EDR（终端检测响应） | 不在「Agent 动作执行前」限定文件/网络/资源，也缺执行级 attestation（可核验的运行证明） |

FinSAFE 要填的缺口是：**同一套策略语义**，同时覆盖——

1. 员工本机边缘执行  
2. 设备舰队托管治理  
3. 内网中心化 Sandbox-as-a-Service  

并把每一次动作变成可证明的执行单元（`policy_hash`、审计信封）。

```text
  第三方云沙箱 (E2B / Daytona / Modal …)    FinSAFE 中心平面          FinSAFE 桌面
  厂商托管、秒级环境                         自建 K8s / 内网 SaaS      本机 Agent + MDM
         │                                         │                        │
         └──────────── 可并存（互补为主）──────────┴────────────────────────┘
              非敏感批任务可上云；敏感交互留端；统一策略语言
```

企业若想「自己当 E2B」或「用公有云沙箱托管内网 Agent」，常见卡点见 [A8](#a8-企业为何难以自建-microvmdocker-托管用-e2b-又有何挑战finsafe-如何成为内网好方案)。

## A3. 对企业客户的核心价值是什么？

| 客户痛点 | FinSAFE 交付的价值 |
|----------|-------------------|
| **Agent 会真实碰文件 / 网络 / Shell** | 在 OS 层刚性限制可读可写路径、出口域名、资源上限——模型被诱骗也越不出策略 |
| **数据不能随便出端** | 桌面边缘部署：投研/政务/金融桌面数据尽量留在本机，策略仍可中央签发 |
| **合规要证据** | 统一审计：谁、在何种策略摘要下、执行了什么；可对接 SIEM（安全日志分析平台） |
| **不能每人一套 YAML**（一种常见配置文件格式） | 托管模式 + 舰队：签名 bundle、灰度 rollout、哨兵禁止本地改策略 |
| **云上要跑很多租户的工具调用** | 中心 Scheduler（调度器）：准入、排队、配额、审批 resolve |
| **已有 MDM / 容器 / 云沙箱** | 不强迫替换：MDM 只管装机；Docker/K8s 可作外层；E2B 可作非敏感算力 |

**商业叙事一句话：** 让企业「敢把 Agent 交给员工与业务系统用」——不是再卖一个远程开发机，而是卖**可治理的执行边界**。

## A4. FinSAFE 最大的优势与独特能力是什么？

### 最大优势（相对市场）

**端云一致的企业执行治理层**：同一套策略语言与审计形状，覆盖「员工电脑上的 Agent」和「内网 Sandbox-as-a-Service」，并可与 MDM 组成舰队闭环。这是 E2B / Modal / OpenSandbox / Claude·Codex 内置沙箱通常**各自只做一半**的地方。

### 相对独特、值得反复强调的能力

| 能力 | 为何独特 / 稀缺 |
|------|-----------------|
| **桌面三端原生隔离**（bwrap / Seatbelt / AppContainer）+ **可拆产品** | 不像 Codex 绑死单一 Agent；也不像多数云沙箱不管本机 |
| **舰队托管闭环**（Authority + 签名 bundle + 哨兵 + enroll + 审计 spool） | 云沙箱与 runtime 库基本没有「企业 IT 装机面」这一环 |
| **执行单元语义**：「一次执行 = 一个沙箱 = 一套策略」 | 比「整机开一个 Docker」更贴 Agent 工具调用模型 |
| **进程级近原生密度** | 企业半可信场景下，往往比每租户一个 MicroVM 更省硬件、更好嵌桌面 |
| **策略可证明**（`policy_digest` / `policy_hash`、attestation） | 面向审计与责任追溯，而非「黑盒托管环境」 |
| **出口治理**（allowlist 域名白名单、回环代理、可选 MITM 企业 HTTPS 检查、body DLP 防泄漏扫描） | 防机密外泄，而不只是「能跑代码」 |

### 诚实边界（勿当独特优势吹）

- **不是**公网不可信多租户下最强隔离（那是 MicroVM / Firecracker 主场）。  
- SaaS 面（WarmPool 预热池、官方多语言 SDK、session pause/resume 挂起恢复）仍在演进，售前勿过度承诺。  
- 网络面相对 Codex / sandbox-runtime（下文有时简称 **srt**）：SOCKS 代理协议、任意 JS `filterRequest`、MitmHook 级改写尚未全面产品化。

## A5. 市场推广与客户教育应突出什么？

### 优先讲清的三句话（教育顺序）

1. **先讲沙箱常识**（文首）：Agent 会动手；没有 OS 围栏就会泄密/破坏/难举证——浏览器沙箱管网页，FinSAFE 管 Agent 进程。  
2. **企业要的不是再买一个云电脑，而是「策略 + 证据 + 可批量落地」**——多数企业不是云服务商，自建 MicroVM 农场或只靠 E2B 都有硬伤（见 [A8](#a8-企业为何难以自建-microvmdocker-托管用-e2b-又有何挑战finsafe-如何成为内网好方案)）。  
3. **FinSAFE 与 E2B/Docker/MDM 多为互补**——敏感留端/内网，非敏感可上云；MDM 装软件，FinSAFE 管策略。

### 按角色强调的重点

| 角色 | 突出什么 | 少讲什么 |
|------|----------|----------|
| **CISO / 合规**（首席信息安全官） | 审计信封、deny-read 默认、出口 allowlist/MITM、fail closed（失败则拒绝执行）、数据驻留 | 冷启动毫秒数竞赛 |
| **企业 IT / MDM** | fleet 发行包、哨兵、Authority、与 Jamf/Intune 分工 | 替代 EDR 或整机内核驱动 |
| **平台 / 架构** | 执行单元、HighLevelPolicy（高级策略）、可嵌 K8s 内层、端云一致契约 | 「我们比 Firecracker 更安全」 |
| **业务 / 投研负责人** | 敢用本机 Agent、Findesk Trust Zone（可信区信号）、不把数据默认送公有云 | 底层 seccomp 细节 |
| **开发者** | `run` / `self-confine`、wrapper YAML、Hermes 示例、learn/explain | 一上来就舰队全套 |

### 对外话术建议（可直接用）

- 「我们卖的是 **Agent 安全执行底座**，不是又一个 Code Interpreter 云。」  
- 「**私有化 / 行业云 / 员工桌面** 是主场；公网陌生人任意代码请用 MicroVM，我们可作内层或策略面。」  
- 「与 Claude/Codex 沙箱：**众采其技术长处，补上企业舰队与可独立采购的治理产品。**」

## A6. 什么是 Sandbox-as-a-Service？和 Lambda / Serverless 有何可比性？

**Sandbox-as-a-Service（FinSAFE 语境）** = 企业自建（或对内开放）的中心化执行平面：API（如 `POST /v1/executions`）提交「在某策略下跑某命令」；平台做准入、排队、隔离、制品与审计。与桌面 wrapper **共用策略语义**。

| 维度 | Lambda / Cloud Functions | FinSAFE Sandbox-as-a-Service |
|------|--------------------------|------------------------------|
| 卖什么 | 函数算力 | **受控执行边界** |
| 触发单位 | 事件 → handler | Agent/平台 → **执行单元** |
| 工作负载 | 固定函数 | 任意二进制 / shell / Agent 工具 |
| 隔离 | 常为 MicroVM | 默认进程级；可外层再套 MicroVM/Pod |
| 类比 | 托管函数运行时 | **secure serverless for agents** |

与 E2B 类云沙箱 API：**形态相似**（创建→执行→销毁），**治理目标不同**（私有化 + 与桌面舰队同一语言 vs 厂商托管 + 开发者 DX（Developer Experience，开发者体验））。企业「自建迷你 E2B」或「只买公有云沙箱」的现实难度见 [A8](#a8-企业为何难以自建-microvmdocker-托管用-e2b-又有何挑战finsafe-如何成为内网好方案)。

## A7. 明确不做什么？

- 不替代模型语义安全（幻觉、提示词注入）——网关 / Guardrails / DLP 上层。  
- 不声称共享内核沙箱可替代 MicroVM 抵御「公网陌生租户 + 内核 0day」。  
- 不默认做「整机劫持所有解释器」的内核驱动纳管——那是 MDM/EDR/企业 Add-on。  
- 不试图在公有云大众 Code Interpreter 赛道上硬刚 Modal/E2B 的计费与全球弹性。

详见 [product-one-pager-zh.md](./product-one-pager-zh.md)。

## A8. 企业为何难以自建 MicroVM/Docker 托管？用 E2B 又有何挑战？FinSAFE 如何成为内网好方案？

背景见文首 [什么是沙箱](#阅读前什么是沙箱为什么智能体需要它)。本节回答售前常问的第二层：**「我们为什么不能自己用 Docker / Firecracker 搭一套？或者直接买 E2B？」**

### 多数企业不是云服务商

公有云沙箱厂商（E2B、Modal 等）表面卖的是「创建沙箱 API」，背后往往是：

- 大规模 **MicroVM / 强化容器** 集群与镜像工厂  
- 多租户调度、预热池、计费、滥用对抗、全球入口  
- 7×24 平台工程与安全响应团队  

**绝大多数银行、券商、制造、政务、投研机构并不是云服务商**：没有同等规模的硬件与平台编制，也不该为了「让员工安全用 Agent」先变成迷你公有云。

### 路径一：企业自己用 MicroVM / Docker「托管本地 Agent」——难在哪？

| 难点 | 白话说明 |
|------|----------|
| **栈太深** | Firecracker / Kata / gVisor + 镜像供应链 + 网络 CNI（容器网络插件）+ 存储 + 节点扩缩，任一环出问题都会变成「平台事故」，而不是「Agent 功能事故」 |
| **桌面三端不对齐** | 员工大量用 **macOS / Windows**；经典 MicroVM 农场偏 Linux 服务器。本机交互式 Agent（读本地盘、弹终端）很难都塞进机房虚拟机 |
| **策略与产品缺口** | 「会起 Docker」≠「有 deny-read、出口白名单、策略签名、设备哨兵、审计信封」。企业要的是**治理产品**，不是再养一套容器集群 |
| **运维编制** | 镜像 CVE（未修的已知漏洞）、内核升级、节点宕机、配额与租户隔离，都要专人；业务侧 Agent 项目养不起第二个「内部云团队」 |
| **威胁模型错配** | 内网用户多为**半可信**（员工/授权系统）：主要防误操作与泄密。为每位用户常开 MicroVM 往往**过重、过贵、过慢**，还解决不了「策略谁签发、证据怎么留」 |

Docker/K8s **仍然有价值**（打包依赖、批处理、外层隔离），但把它们当成「企业 Agent 安全托管的全部答案」，会低估治理与桌面面。

### 路径二：直接采用 E2B 等公有云 / 托管沙箱——挑战在哪？

| 挑战 | 白话说明 |
|------|----------|
| **数据驻留与出境** | 代码、文件片段、工具输出可能进入厂商环境；金融/政务/涉密常直接否决或需漫长评估 |
| **网络与身份** | Agent 要碰内网系统、本机凭证、未上云的文件；公有云沙箱默认在「外面」，VPN/私网打通成本高、攻击面变大 |
| **策略主权** | 厂商策略模型 ≠ 你的 CISO 底线；难以与现有 MDM、SIEM、审批流做成**同一套权威** |
| **桌面边缘空白** | E2B 类强项是**云上执行环境**；管不住「员工笔记本上已经跑起来的 Agent」 |
| **供应商与成本结构** | 按秒/按环境计费适合弹性开发；大规模内部托管可能变成不可控账单，且关停厂商即断能力 |
| **合规举证** | 需要向审计证明「这次执行用了哪份策略」时，黑盒托管往往不够 |

**结论：** E2B 等很适合**非敏感、可出网、开发者 DX 优先**的负载；作为企业**唯一**的 Agent 安全边界，通常不够。

### FinSAFE 如何对症下药？为什么适合企业内网？

FinSAFE 不假设客户「先建成公有云级沙箱农场」，而是把能力收成企业 IT / 安全能落地的产品面：

| 企业真实约束 | FinSAFE 的做法 |
|--------------|----------------|
| 没有云厂商编制 | 提供可安装的 **CLI + 可选中心服务 + 舰队组件**，而不是「请自建 Firecracker 平台」 |
| 数据尽量不出域 | **桌面边缘**就地执行；中心平面可部署在**内网 / 私有化 / 行业云** |
| 员工机是 Mac/Win/Linux 混部 | **三端原生 OS 沙箱**（bwrap / Seatbelt / AppContainer），对齐真实办公环境 |
| 要的是治理不是又一个集群 | **HighLevelPolicy → 执行计划**、签名 **bundle**、**Authority**、哨兵、审计 spool——与 MDM 分工清晰（MDM 装机，FinSAFE 管执行策略） |
| 半可信内网，要密度与速度 | 默认**进程级**隔离：启动快、密度高，贴合「一次工具调用一次围栏」；必要时仍可外层套 Docker/K8s/MicroVM |
| 与公有云可并存 | 敏感留端/内网走 FinSAFE；非敏感批任务仍可走 E2B——**互补**，见 [B1](#b1-与其他沙箱是竞争还是互补) |

**内网好方案的判据（售前可对照）：**

1. **装得上**：经现有 MDM/黄金镜像下发，而不是先招一支虚拟化平台团队。  
2. **管得住**：中央签发策略，本机难绕过；失败默认拒绝（fail closed）。  
3. **留得下**：每次执行有策略指纹与审计信封，能对接内审 / SIEM。  
4. **跑得动**：本机交互与内网 API 延迟可接受，不必事事绕公有云。  
5. **说得清**：与 Docker（编排）、EDR（检测）、E2B（公有云算力）边界清楚，不强迫「替换一切」。

一句话：**云厂商卖「全球弹性沙箱农场」；FinSAFE 卖「企业能私有化落地的 Agent 执行围栏 + 舰队治理」。** 对绝大多数非云服务商企业，后者才是内网托管 Agent 的现实路径；前者可作补充算力，不宜默认充当唯一安全边界。

---

# 第二部分 · 与市场上其他技术的对比

## B1. 与其他沙箱是竞争还是互补？

**总判断：以互补为主，仅在少数重叠场景存在选型竞争。**

| 对方 | 关系 | 说明 |
|------|------|------|
| **E2B / Modal / Vercel / 腾讯云 Agent 沙箱 / Blaxel 等** | **互补为主** | 他们强在托管算力、MicroVM、GPU、全球 DX；FinSAFE 强在私有化、桌面、舰队、审计。可：非敏感任务上云，敏感留端/内网 |
| **OpenSandbox / K8s agent-sandbox** | **互补 + 局部重叠** | 控制面/池化可借鉴甚至并存；隔离后端路径不同。竞争点仅在「谁做企业自建 SaaS 控制面」 |
| **Docker / K8s** | **互补** | 编排与打包；FinSAFE 可作 Pod（K8s 最小调度单元）**内层**执行策略，不替代集群 |
| **Firecracker / gVisor / Kata** | **互补（外层）** | 更高隔离外层；FinSAFE 作内层或半可信场景的轻量替代 |
| **Claude sandbox-runtime / Codex 沙箱** | **互补 + 技术对标** | 个人/单产品够用；企业多 Agent、舰队、独立采购 → FinSAFE。技术上众采其长，产品层不抢「写进 Claude/Codex 里」 |
| **MDM / EDR** | **互补** | MDM 管装机与合规基线；EDR 管威胁检测响应；FinSAFE 管执行前策略边界（三者不是互相替代） |
| **NeMo Guardrails 等** | **互补** | 语义/对话护栏（管「模型说什么」）≠ OS 执行沙箱（管「进程能碰什么」） |
| **「只有我们能做沙箱」式竞标** | **应避免** | 易把客户推入错误威胁模型；正确做法是按威胁模型分层选型 |

**何时会「抢单」：** 客户预算里只有一个「沙箱」条目，且场景是**纯云上、公网不可信、只要托管 API**——此时 E2B/Modal 等更贴；FinSAFE 应主动让出或主张「内网/桌面另一条预算」。  
**何时 FinSAFE 应赢：** 数据驻留、员工电脑 Agent、金融/政务私有化、要审计证据、要与现有 MDM 集成、要端云同一策略。

## B2. 隔离技术谱系（底层）

沙箱不是一种技术，而是一族**隔离边界**。数字为公开材料中的数量级，非 FinSAFE 基准。

| 层级 | 技术 | 隔离边界 | 典型启动 | 适合 |
|------|------|----------|----------|------|
| **进程 / OS 原语** | bubblewrap、Seatbelt、Landlock、seccomp、AppContainer、Restricted Token | 共享宿主内核 + 策略收紧 | 通常 <20–50ms 量级 | 桌面 Agent、企业半可信多租户、高密度 |
| **共享内核容器** | Docker / containerd / Podman / OCI（容器镜像标准格式） | namespace + cgroup（操作系统提供的隔离与资源控制机制） | 数百 ms–数秒（含镜像） | 打包与编排；默认对不可信代码偏弱 |
| **用户态内核** | gVisor (runsc) | 拦截 syscall（系统调用） | 介于容器与 VM | 云上强化容器 |
| **硬件 MicroVM** | Firecracker、Kata、cloud-hypervisor、libkrun、Hyperlight | 独立 guest 内核 | ~100–300ms+ | 公网不可信多租户 |
| **完整 VM** | 传统 Hypervisor（虚拟机监视器）、Windows Sandbox | 更重 OS 边界 | 秒级+ | 强隔离、低密度 |
| **Wasm / Isolate** | Wasmtime、Wasmer、V8、Pyodide | 无完整 Linux ABI（应用二进制接口）或能力极窄 | 极快 | 插件、小片段；难覆盖完整 Agent 工具链 |
| **LibOS** | Microsoft LiteBox 等 | ABI 翻译（库操作系统） | 视实现 | 特殊场景；FinSAFE **不采用** |

**FinSAFE 主路径：** Linux `bwrap + seccomp + cgroup v2 + Landlock`；macOS Seatbelt；Windows AppContainer / Restricted Token + Job Object + WFP（各项白话见文首速查与 [C2](#c2-技术原理与核心原语)）。

## B3. 个人 / 本机方案一览

| 方案 | 形态 | 要点 |
|------|------|------|
| Docker Desktop / Podman | 容器 | 生态最大；LLM 代码需额外加固 |
| Apple Container | macOS + Virtualization + OCI | FinSAFE 原生桌面仍选 **Seatbelt** |
| bubblewrap / firejail | Linux 用户态 | 轻量；缺企业治理 |
| Seatbelt / sandbox-exec | macOS | Coding Agent 常用 |
| Windows AppContainer / LPAC（低特权应用容器变体） | Windows | Codex、MXC、FinSAFE 深水区 |
| Claude `@anthropic-ai/sandbox-runtime`（常简称 srt） | 跨平台 runtime 库 | 代理+MITM；npm 包 |
| OpenAI Codex 内置沙箱 | 内嵌 Codex | 不可独立企业产品化 |
| Cursor 等 IDE Agent | 产品内置 | 多与 OS 原语趋同 |
| Microsandbox / nono / SmolVM | 本机实验 | MicroVM 或轻量沙箱探索 |

## B4. 开源与可自建平台

| 方案 | 定位 | 与 FinSAFE |
|------|------|------------|
| **OpenSandbox** | 生命周期控制面 + 多语言 SDK | SaaS 控制面首要参考；隔离层路径不同 |
| **E2B** | Agent 代码执行事实标准之一 | 第三方托管算力；互补 |
| **Daytona** | 持久 workspace | 状态强；隔离深度通常弱于 MicroVM |
| **腾讯 CubeSandbox** | 兼容 E2B、硬件级隔离叙事 | 国内 E2B 替代路径 |
| **agent-sandbox（K8s）** | CRD（K8s 自定义资源） | 可与 OpenSandbox 组合 |
| **Firecracker / Kata / gVisor** | 基建原语 | FinSAFE 外层可选 |
| **Microsoft MXC** | 多后端 + TS SDK（TypeScript 开发包；early preview） | stdio（标准输入输出）对标；部分 profile 官方称非安全边界 |

## B5. 闭源 / 商业托管平台

Modal、Vercel Sandbox、Cloudflare Sandbox SDK、Blaxel、Fly.io Sprites、Northflank、Runloop、AWS AgentCore Code Interpreter、Google Agent Sandbox、腾讯云 AGSX（Agent 沙箱服务）/ Agent Runtime，以及 CodeSandbox SDK 等——多为**托管算力 + 某云生态**。与 FinSAFE：**互补选型**，按数据驻留与威胁模型组合，而非默认二选一。

## B6. 「沙箱」但非 OS 隔离的方案

| 方案 | 实际做什么 |
|------|------------|
| NVIDIA NeMo Guardrails | 输入/输出/执行 **rails**（可编程护栏流程）；可调外部 Docker/Wasm |
| Wasm / Pyodide 浏览器方案 | 在浏览器沙箱里跑片段代码；不覆盖完整本机 Agent |
| 政策/运行时叙事类工具 | 与 FinSAFE 的 OS 执行底座不同层 |

## B7. 与 Claude sandbox-runtime / Codex 内置沙箱对标

FinSAFE **众采各家之长**：桌面隔离与网络对标 srt/Codex；中心 SaaS 对标 OpenSandbox/Modal 体验；Windows stdio 参考 MXC。

| 维度 | sandbox-runtime | Codex 内置 | FinSAFE |
|------|-----------------|------------|---------|
| 产品形态 | 可独立 npm/CLI 库 | 绑死 Codex | 独立底座 + 企业治理 + SaaS |
| Linux | bubblewrap | Landlock + seccomp | bwrap + seccomp + cgroup + Landlock |
| macOS | Seatbelt | Seatbelt | Seatbelt |
| Windows | 本地用户 + WFP | Restricted token 等深水区 | AppContainer + RestrictedToken + WFP |
| 网络 | SOCKS、MITM、`filterRequest`（可编程请求过滤） | SOCKS、upstream（上游代理）、MitmHook | allowlist、MITM、body DLP；parent proxy（上级企业代理）试点 |
| 舰队托管 | 无 | 弱 | Authority + MDM + bundle |
| 中心 SaaS | 无 | 无 | `finsafe-server`（演进中） |

| 来源 | 已对齐 | 刻意不追 / 后置 |
|------|--------|------------------|
| srt（sandbox-runtime） | WFP、MITM/allowlist 思路 | 任意 JS `filterRequest`（与静态签名审计冲突） |
| Codex | RestrictedToken 默认 host、deny-read（禁止读敏感路径）持续对标 | 一次抄齐全部 Windows 深水区；SOCKS 非当前主场 |
| OpenSandbox | 生命周期/池化蓝图 | 默认改用容器作唯一隔离边界 |

**个人只用 Claude/Codex：** 内置沙箱通常够用。  
**多 Agent / 要上舰队：** FinSAFE。

## B8. 威胁模型选型口诀

1. 厂商托管、开箱远程开发沙箱 → E2B / Modal / 腾讯云 / Vercel …  
2. 自建多租户 Agent 执行平面（内网 API、配额、审批） → **FinSAFE 中心**  
3. 员工本机 Agent + 统一底线 → **FinSAFE 桌面 + 托管 + MDM**  
4. 租户完全不可信、需扛内核逃逸 → MicroVM 外层 ± FinSAFE 内层  
5. 只要 Claude/Codex 自用 → 其内置沙箱  
6. 只要语义护栏 → Guardrails 等（不替代 OS 沙箱）

更细工程评分见 [agent-sandbox-ecosystem-comparison.md](../../reference/agent-sandbox-ecosystem-comparison.md)。

---

# 第三部分 · 架构、实现与价值链协作

## C1. 「进程级」而非「Agent 级」是什么意思？性能开销？

| 层级 | 是安全边界吗 | 含义 |
|------|--------------|------|
| Tenant / User | 配额与鉴权 | 多租户会计 |
| **Agent** | **否** | 逻辑身份与编排 |
| **Execution** | **是** | 一次工具调用/一段代码 = 一个沙箱 = 一套策略 |

口诀：**一次执行 = 一个沙箱 = 一套策略范围。**  
推荐：危险工具用 `finsafe run`；交互 broker（长驻对话进程）用 `self-confine`，或 `broker_confine: tools-only`（只沙箱工具、不沙箱 broker 自身）。

| 成本项 | 方向 | 说明 |
|--------|------|------|
| 进程启动 + namespace（挂载命名空间等） | 通常远低于容器/VM | 潜力常写 <20–30ms |
| seccomp / Landlock / Seatbelt | 稳态常数税 | 相对模型推理通常可忽略 |
| 经代理 / MITM（企业 HTTPS 检查） | 中–高 | 有意的安全成本 |
| MicroVM | 更高 | 冷启动与密度劣势 |

适用：桌面 Agent、企业内网半可信多租户、合规试点、端云一致。  
慎用：公网完全不可信多租户（需外层 MicroVM）。

## C2. 技术原理与核心原语

```text
控制面（租户、策略、配额、审计、审批）
        │
        ▼
Policy Router + Execution Scheduler
  HighLevelPolicy → CompiledExecutionPlan（policy_hash）
        │
        ▼
finsafe-server API  和/或  本机 finsafe CLI
        │
        ▼
单次执行沙箱（OS 原语）
```

### Linux

| 原语 | 含义 | FinSAFE 用途 |
|------|------|--------------|
| **bubblewrap** | 用户态微型容器启动器（namespace 命名空间 + 挂载视图） | `run` / `self-confine` 主路径 |
| **seccomp** | BPF（一种内核字节码过滤器）限制系统调用 | enforce/log；与断网纵深 |
| **Landlock** | 路径级 LSM（Linux 安全模块） | 收紧读写与 deny-read |
| **cgroup v2** | CPU/内存/pids 上限 | `resources.*` |
| **helper / supervisor** | 特权辅助进程 | cgroup 可靠 attach |

### macOS

| 原语 | 含义 | FinSAFE 用途 |
|------|------|--------------|
| **Seatbelt** | 内核强制沙箱配置 | 由 wrapper 生成 profile |
| **sandbox-exec** | 加载 profile 启动子进程的系统工具 | 本机原生后端 |

### Windows

| 原语 | 含义 | FinSAFE 用途 |
|------|------|--------------|
| **AppContainer** | 低特权应用容器 | none/allowlist、deny-read、托管强隔离 |
| **Restricted Token** | WRITE_RESTRICTED（写受限令牌） | 默认 `network: host`（对齐 Codex 弱化姿态） |
| **Job Object** | 进程组资源限制 | 内存/进程数等 |
| **DACL / WFP** | 路径访问控制列表 / Windows 网络过滤平台 | deny-read；loopback 代理端口 |
| **ProjFS / ConPTY / PipeInherit** | 投影文件系统；控制台伪终端；管道继承 | 大树只读；交互；Findesk ACP（管道上的 Agent 协议） |

横切：**审计信封**、**learn / explain**（根据拒绝原因迭代策略）。矩阵：[platform-feature-matrix.md](../../reference/platform-feature-matrix.md)。

## C3. 安全策略怎么配置？

| 模式 | 怎么配 | 谁改 |
|------|--------|------|
| 个人 | `--policy` 或 `--host-profile` | 本机用户 |
| 托管 | 从 Authority 拉 bundle；禁止本地 `--policy` | 中央运维 |

```yaml
schema_version: 1
kind: local-wrapper
program_mode: short-lived    # interactive → self-confine
network: none                # 或 host / allowlist
resources:
  memory_max: 512M
  pids_max: "128"
filesystem:
  read_write_paths: ["./workspace"]
```

常用旋钮：文件系统读写与 deny-read、网络与 `tls_terminate`、资源与超时、`broker_confine: tools-only`、Windows backend Auto。详解：[POLICY-QUICKREF-zh.md](./POLICY-QUICKREF-zh.md)。

## C4. FinSAFE 与 MDM 如何结合？

舰队场景：**MDM 管装机面，Authority 管策略面。**

| MDM 做什么 | Authority 做什么 |
|------------|------------------|
| 安装 fleet 构建的 `finsafe` / `finsafe-agent` | 签名发布 bundle（策略包） |
| 下发 `managed-required.json` 哨兵 | enroll（设备注册）、心跳、JWKS（验签公钥集） |
| 配服务与 `FINSAFE_AUTHORITY_URL` | 灰度、kill switch（紧急停用） |
| 一次性 enroll token | 审计、许可证门控 |

没有 Authority、只有 MDM 装二进制 ≠ FinSAFE 舰队治理。见 [mdm/](./mdm/)、[endpoint-deployment-options-zh.md](./endpoint-deployment-options-zh.md)。

## C5. 网络安全：allowlist、egress proxy、MITM

哲学：**能断网则断网；要上网则经受信代理。**

```text
沙箱内进程 → 127.0.0.1:60080（本机回环） → finsafe-net-proxy
  → allowlist / L7 DLP（应用层防泄漏） / 可选 TLS 终止（解密 HTTPS 检查） → 上游或企业 parent proxy
```

| 模式 | 行为 |
|------|------|
| `none` | 无外连 |
| `host` | 继承主机网络 |
| `allowlist` | 强制经代理，仅允许列出域名 |

**MITM（此处指企业主动 HTTPS 检查，须合规告知用户）：** 策略设 `tls_terminate: true` + 许可证功能位 `mitm_tls_terminate` + 检查 CA（证书颁发）+ 用户告知。手册：[https-inspection-runbook-zh.md](./https-inspection-runbook-zh.md)。

## C6. 与 Findesk / FinClaw 如何配合完成价值链？

价值链上的分工（不要混为一谈）：

```text
用户意图 / 投研工作流
        │
        ▼
Findesk（桌面产品 / UX 用户体验 / Trust Zone 可信区信号 / 合规呈现）
        │
        ▼
findesk-core（会话、Agent 目录、spawn 拉起策略）
        │
        ├─ FinClaw / Hermes / OpenClaw / ACP …   ← Agent 编排与对话（「想做什么」）
        │         （ACP = 经管道做 JSON-RPC 的 Agent 协议形态）
        │
        └─ FinSAFE（self-confine / run）         ← OS 执行边界（「怎样安全地做」）
                │
                ▼
          受限进程树：文件 / 网络 / 资源 / 审计证据
```

| 组件 | 价值链角色 |
|------|------------|
| **Findesk** | 产品入口：打包 finsafe、提交策略 YAML、Settings 开关、Trust Zone 叙事 |
| **findesk-core** | `FinsafeSpawnPolicy`：何时包装哪个 Agent；与 FinClaw 网关集成 |
| **FinClaw** | 本机 Agent 运行时 / HTTP serve；开启 FinSAFE 时常为 `finsafe self-confine finclaw serve …` |
| **FinSAFE** | 与具体 Agent 解耦的执行底座；不负责对话与工具选型语义 |
| **Hermes 等** | 可替换的 Agent Runtime（智能体运行时）；经同一 wrapper 接入 |

**对客户怎么讲：** Findesk 是「敢用的投研桌面」；FinClaw/Hermes 是「干活的智能体」；FinSAFE 是「干活时的安全带与行车记录仪」。三者叠加才构成完整交付，单独卖沙箱或单独卖 Agent 都缺一块。

运行时形状：

```text
Findesk → findesk-core
  → finsafe --policy <profile.yaml> self-confine|run <agent>
    → FinClaw / Hermes / OpenClaw / ACP …
```

策略模板示例（Findesk 仓）：`finclaw-interactive`、`hermes`、`openclaw`、`node-acp` 等。详见 Findesk [workspace.md](https://github.com/Geeksfino/findesk/blob/main/findesk-docs/architecture/workspace.md)。

## C7. 与 Hermes 等 Agent Runtime 的集成

Hermes 是文档与示例覆盖较好的外部 runtime 之一：**不是** FinSAFE 特殊后端，走通用 Local Program Wrapper（本地程序包装器）。

| 场景 | 命令形态 |
|------|----------|
| 交互式 Hermes | `finsafe --policy hermes-interactive.yaml self-confine hermes` |
| 一次性工具 | `finsafe --policy hermes-tool.yaml run python3 tool.py` |
| 仅工具隔离 | `broker_confine: tools-only`（broker 本身不进 OS 沙箱） |

文档：[hermes-agent.md](../../integrations/hermes-agent.md)、[agent-sandbox-guide-zh.md](./agent-sandbox-guide-zh.md)。OpenClaw、ACP（管道协议 Agent）等同理。

---

## 延伸阅读

| 文档 | 内容 |
|------|------|
| [product-one-pager-zh.md](./product-one-pager-zh.md) | 产品定位与部署形态 |
| [terminology-glossary-zh.md](./terminology-glossary-zh.md) | **完整概念术语表**（比文首速查更细） |
| [enterprise-it-overview-zh.md](./enterprise-it-overview-zh.md) | 企业 IT 全景 |
| [POLICY-QUICKREF-zh.md](./POLICY-QUICKREF-zh.md) | 策略字段 |
| [agent-sandbox-ecosystem-comparison.md](../../reference/agent-sandbox-ecosystem-comparison.md) | 与 Codex/srt/OpenSandbox/MXC 深度比较 |
| [gemini-review-and-comparison.md](../../architecture/gemini-review-and-comparison.md) | vs MicroVM/Docker/gVisor |
| [platform-feature-matrix.md](../../reference/platform-feature-matrix.md) | 三端能力真值表 |

---

*本文为公开 FAQ；若与 `platform-feature-matrix.md` 冲突，以矩阵与代码为准。*
