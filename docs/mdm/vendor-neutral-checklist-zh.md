# 与 MDM 产品无关的舰队检查清单（不要求 Jamf / Intune）

FinSAFE 托管模式 **不依赖** 特定 MDM 产品。只要能安装 root 拥有的文件、保持系统守护进程运行并执行一次性脚本，任何工具或人工 IT 流程都足够。

当客户使用 **Ansible、Chef、Puppet、Kandji、Workspace ONE、黄金镜像、SSH + 脚本** 或仅内部打包时，请使用本清单。

**English:** [vendor-neutral-checklist.md](./vendor-neutral-checklist.md)

**相关文档：** [二进制参考](../binary-reference-zh.md) · [企业部署手册](../enterprise-deployment-runbook-zh.md) · [托管模式](../managed-mode-zh.md) · [示例脚本](../../packaging/mdm/examples/)

---

## 中央侧（每个组织一次）

| # | 任务 | 完成标准 |
|---|------|----------|
| C0 | 在 authority 主机安装 **商业许可证**（`license.jws`） | `GET /v1/license/status` 为 `valid` 或 `grace`；注册 token 非 `402` |
| C1 | 部署 **Policy Authority**（`finsafe-authority-http`）并启用 TLS | `GET /health` 返回 OK |
| C2 | 保护 **签名密钥**；运维在安全主机上使用 `finsafe-bundlectl` | JWKS 位于 `/.well-known/finsafe/jwks.json` |
| C3 | **构建、签名、发布** 初始策略 bundle | `GET /v1/bundles/current` 返回 JWS |
| C4 | **签名 managed-required 哨兵** | `finsafe-bundlectl sentinel sign --out managed-required.jws` |
| C5 | 向所有终端记录 **authority URL** | 例如 `https://gov.example.com/policy-authority` |
| C6 | 定义 **device_id** 规则 | 主机名、资产标签、序列号或 MDM id — 每台机器稳定唯一 |

---

## 每台机器交付（任意部署工具）

将每一行映射到工具中的 **一个步骤**（软件包、文件复制、systemd、脚本、描述文件）。

| # | 交付物 | 路径 / 行为 | 工具中的动作 |
|---|--------|-------------|--------------|
| M1 | `finsafe` 二进制 | `/usr/local/bin/finsafe`，模式 `0755` | PKG / deb / 复制 / 镜像烘焙 |
| M1a | Linux 配套（`finsafe-helper`、`finsafe-supervisor`、`finsafe-landlock-shim`） | 与 `finsafe` 同目录 | 来自 Linux `finsafe-v*` 包；**macOS 不需要** |
| M2 | `finsafe-agent` 二进制 | `/usr/local/bin/finsafe-agent`，模式 `0755` | `finsafe-fleet-v*` 发行包 |
| M3 | 状态目录 | `/etc/finsafe`、`/var/lib/finsafe`（及 cache/audit 子目录） | 安装前 `mkdir` |
| M4 | **哨兵**（单行签名 JWS） | `/etc/finsafe/managed-required.json` | 安全文件下发；root 拥有 |
| M5 | **Agent 服务** | Linux：`finsafe-agent.service`；macOS：LaunchDaemon plist | 开机启用 |
| M6 | `FINSAFE_AUTHORITY_URL` | Agent 服务环境变量 | 配置描述 / unit drop-in |
| M7 | **一次性注册**（试点波次） | 仅在 agent 上设置 `FINSAFE_ENROLL_TOKEN` + `FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID` | 脚本或描述文件；**注册后删除 token** |
| M8 | 移除注册密钥 | 持久配置中不再包含 `FINSAFE_ENROLL_TOKEN` | 第二次脚本或描述文件修订 |
| M9 | 应用启动命令 | `finsafe run -- <program> …` | 应用团队文档；舰队机器上不使用 `--policy` |

**参考单元文件：** [`packaging/systemd/finsafe-agent.service`](../../packaging/systemd/finsafe-agent.service) · [`packaging/launchd/com.finogeeks.finsafe-agent.plist`](../../packaging/launchd/com.finogeeks.finsafe-agent.plist)

---

## 将您的产品映射到上述步骤

| 若您使用… | 典型映射 |
|-----------|----------|
| **Ansible / Chef / Puppet / Salt** | Role 实现 M1–M8；见 [ansible-zh.md](./ansible-zh.md) |
| **Kandji / Workspace ONE / Iru / SimpleMDM** | 自定义描述文件 = M4–M6；脚本策略 = M7–M8（与 [jamf-zh.md](./jamf-zh.md) / [intune-zh.md](./intune-zh.md) 脚本相同） |
| **Munki / Autopkg**（macOS） | PKG 负责 M1–M2；postinstall 负责 M4–M6 |
| **黄金镜像 / cloud-init** | 镜像烘焙 M1–M6；首次启动脚本做 M7 |
| **SSH + 运行手册** | 手动完成 C1–C6，再 scp + systemctl/launchctl 完成 M1–M8 |
| **内部 apt/yum 仓库** | 软件包安装 M1–M2 + unit；配置包交付 M4 |

Jamf 与 Intune 只是两种常见 UI 的 **可选** 手册，并非硬性要求。

---

## 验证（每台机器）

部署后执行（支持会话或自动化）：

```bash
# 二进制
test -x /usr/local/bin/finsafe && test -x /usr/local/bin/finsafe-agent

# 强制托管模式
test -f /etc/finsafe/managed-required.json && echo "sentinel ok"

# 注册
test -f /etc/finsafe/enrolled.json && jq -r .device_id /etc/finsafe/enrolled.json

# Agent
test -S /run/finsafe-agent.sock && echo "agent socket ok"

# 策略来自 authority（不应使用本地 --policy）
finsafe run --json -- /usr/bin/true 2>&1 | head -c 500

# 负向：个人模式应被阻止
finsafe run --personal -- /usr/bin/true 2>&1 | grep -q MANAGED_FORCED_BY_POLICY && echo "enforce ok"
```

---

## 注册 token 工作流（所有厂商通用）

1. IT：在 authority 上 `POST /v1/enroll/token`（或管理 UI）。
2. 将 token **仅** 部署到 agent 服务环境（不要写入用户 shell 配置）。
3. 重启 agent；确认存在 `/etc/finsafe/enrolled.json`。
4. **从所有描述文件中撤销 token**（MDM 修订、Ansible 变量清空等）。
5. 确认 agent 在无 token 环境变量时仍能运行并拉取 bundle。

示例脚本（按工具调整参数名）：

- macOS/Linux 通用 shell：[`packaging/mdm/examples/generic/enroll-once.sh`](../../packaging/mdm/examples/generic/enroll-once.sh)
- Jamf 变体：[`packaging/mdm/examples/jamf/enroll-once.sh`](../../packaging/mdm/examples/jamf/enroll-once.sh)
- Intune 变体：[`packaging/mdm/examples/intune/macos-enroll-once.sh`](../../packaging/mdm/examples/intune/macos-enroll-once.sh)

---

## 若要实现「托管」强制，不可省略的项

| 省略项 | 结果 |
|--------|------|
| 哨兵 + 注册 | 用户可能仍处于 **个人** 模式（`--policy` 文件） |
| Agent 未运行 | `MANAGED_DAEMON_UNREACHABLE`；有哨兵时 fail-closed |
| 二进制路径不固定 | 心跳摘要 attestation 可能不匹配 |
| Authority 不可达 | 使用陈旧缓存或按 bundle `stale_behavior` 拒绝 |

---

## 范围外（请设定预期）

- **Windows** 桌面 **托管模式 v1 不包含**（仅 Linux + macOS）。Intune 的 **Windows 设备** 类型不适用本文 M1–M8；Windows 用户可改用 **中心 `finsafe-server` API**（执行在云端 Linux）。见 [产品一页纸 · Windows 与 MDM](../product-one-pager-zh.md#windows-设备与-mdmv1-现状)。
- **本地管理员对手**：可移除哨兵/agent；需 MDM 锁定与监控，单靠软件不够。
- **非 FinSAFE 启动**：用户仍可直接运行未包裹 `finsafe run` 的二进制，除非另行阻断。

---

## 试点 → 生产门禁

- [ ] 中央侧 C1–C6 已完成  
- [ ] 金丝雀组（10–50 台）通过上文验证块  
- [ ] 已审阅 [托管模式矩阵](../testing/managed-mode-matrix-zh.md) 中的篡改抽检  
- [ ] 应用团队已改为仅使用 `finsafe run --`  
- [ ] 所有持久配置中已移除注册 token  
- [ ] 已定义 SIEM / `POST /v1/audit/events` 审计路径  
- [ ] 已阅读回滚章节（[企业手册 §9](../enterprise-deployment-runbook-zh.md#9-回滚)）  

---

## 其他平台指南

| 指南 | 场景 |
|------|------|
| [ansible-zh.md](./ansible-zh.md) | Linux 配置管理 |
| [jamf-zh.md](./jamf-zh.md) | Jamf Pro |
| [intune-zh.md](./intune-zh.md) | Microsoft Intune |
