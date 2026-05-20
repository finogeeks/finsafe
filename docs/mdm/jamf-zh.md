# Jamf Pro — FinSAFE 托管模式

在 macOS 上部署 `finsafe`、`finsafe-agent`、managed-required 哨兵及一次性注册。

**English:** [jamf.md](./jamf.md)

**前提：** 已完成 [企业手册](../enterprise-deployment-runbook-zh.md) 阶段 A（authority + 已签名哨兵 JWS）。

---

## 1. 打包二进制

### 方案 A — 发行流水线 PKG

1. 构建通用或按架构 PKG，安装到 `/usr/local/bin/`。
2. 上传到 Jamf **Computers → Packages**。
3. 加入策略或 **Configuration Profile** 载荷（若使用安装类描述文件）。

### 方案 B — Jamf App Store / 自定义二进制载荷

生产环境不推荐；固定路径对摘要 attestation 很重要。

**安装后脚本**（健全性检查）：

```bash
/usr/local/bin/finsafe --version
/usr/local/bin/finsafe-agent --help 2>/dev/null || true
```

---

## 2. LaunchDaemon（finsafe-agent）

使用模板 [`packaging/launchd/com.finogeeks.finsafe-agent.plist`](../../packaging/launchd/com.finogeeks.finsafe-agent.plist)。

### Jamf **Configuration Profile**（Custom Settings）或 **Policy Files and Processes**

1. 将 plist 部署到 `/Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist`。
2. 设置 `EnvironmentVariables`：

   | 键 | 值 |
   |-----|-----|
   | `FINSAFE_AUTHORITY_URL` | `https://gov.example.com/policy-authority` |

3. 部署后 **Extension Attribute** 或策略脚本：

```bash
launchctl bootstrap system /Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist 2>/dev/null \
  || launchctl load /Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist
```

仅用于注册引导时，另加（见 §4）：

- `FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID` → Jamf 变量 `$JSSID` / `$COMPUTERNAME` / 序列号
- `FINSAFE_ENROLL_TOKEN` → 来自安全参数（注册后移除）

---

## 3. Managed-required 哨兵（Configuration Profile）

Jamf **Configuration Profile → Files**（或 **Payloads → File Distribution**）：

| 设置 | 值 |
|------|-----|
| 路径 | `/etc/finsafe/managed-required.json` |
| 源文件 | `finsafe-bundlectl sentinel sign` 生成的签名 JWS |
| 权限 | `root:wheel`，`0644` |

若目录不存在，用安装前脚本创建：

```bash
mkdir -p /etc/finsafe /var/lib/finsafe
chown root:wheel /etc/finsafe /var/lib/finsafe
chmod 755 /etc/finsafe /var/lib/finsafe
```

**作用域：** 生产 Smart Group（所有已纳管且安装 agent 的 Mac）。

**验证（Jamf 策略日志或 recon 脚本）：**

```bash
test -f /etc/finsafe/managed-required.json && profiles show | grep -i finsafe
```

---

## 4. 一次性注册

### 4.1 签发 token（IT）

通过 authority 管理 UI 或：

```bash
curl -s -X POST "https://gov.example.com/policy-authority/v1/enroll/token"
```

将 token 存入 **Jamf Parameter**（加密）或 **Vault** — 不要明文提交 Git。

### 4.2 注册 Configuration Profile（试点）

复制 LaunchDaemon plist 载荷并增加环境变量：

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>FINSAFE_AUTHORITY_URL</key>
  <string>https://gov.example.com/policy-authority</string>
  <key>FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID</key>
  <string>$JSSID</string>
  <key>FINSAFE_ENROLL_TOKEN</key>
  <string>REPLACE_WITH_ONE_TIME_TOKEN</string>
</dict>
```

Jamf 不会在 plist 字面量中自动展开 `$JSSID` — 请用 **Policy Script** 写入 plist，或使用 **Extension Attribute** + 脚本：

```bash
#!/bin/bash
# Jamf policy: FinSAFE enroll（每台机器运行一次）
set -euo pipefail
DEVICE_ID="${JSSID:-$(system_profiler SPHardwareDataType | awk '/UUID/ {print $3}')}"
TOKEN='%%ENROLL_TOKEN%%'  # Jamf parameter 4

PLIST=/Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist
/usr/libexec/PlistBuddy -c "Add :EnvironmentVariables:FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID string $DEVICE_ID" "$PLIST" 2>/dev/null \
  || /usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID $DEVICE_ID" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :EnvironmentVariables:FINSAFE_ENROLL_TOKEN string $TOKEN" "$PLIST" 2>/dev/null \
  || /usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:FINSAFE_ENROLL_TOKEN $TOKEN" "$PLIST"

launchctl kickstart -k system/com.finogeeks.finsafe-agent
sleep 5
test -f /etc/finsafe/enrolled.json
```

### 4.3 注册后清理策略

当存在 `/etc/finsafe/enrolled.json` 时：

```bash
/usr/libexec/PlistBuddy -c "Delete :EnvironmentVariables:FINSAFE_ENROLL_TOKEN" \
  /Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist 2>/dev/null || true
launchctl kickstart -k system/com.finogeeks.finsafe-agent
```

从作用域移除注册策略，或在 Jamf 组中将机器标记为已完成。

---

## 5. Smart Groups（建议）

| 组 | 条件 |
|----|------|
| FinSAFE — 未注册 | Extension Attribute：`enrolled.json` 不存在 |
| FinSAFE — 托管已激活 | 存在 `/etc/finsafe/enrolled.json` 且守护进程在运行 |
| FinSAFE — 试点 | bundle 金丝雀的静态子集 |

**Extension Attribute 示例**（脚本）：

```bash
#!/bin/bash
if [[ -f /etc/finsafe/enrolled.json ]]; then echo "<result>enrolled</result>"
else echo "<result>pending</result>"; fi
```

---

## 6. 面向用户的应用配置

将 FinClaw / 内部启动器指向：

```bash
/usr/local/bin/finsafe run -- /path/to/agent-binary "$@"
```

Jamf **Restriction** 描述文件不能替代哨兵强制；若需阻断其他启动路径，须单独配置。

---

## 7. 故障排除

| 现象 | 检查 |
|------|------|
| `MANAGED_DAEMON_UNREACHABLE` | `launchctl print system/com.finogeeks.finsafe-agent`；套接字 `/run/finsafe-agent.sock` |
| `MANAGED_FORCED_BY_POLICY` | 测试 `--personal` 时出现属预期 |
| 注册循环 | Token 过期；时钟偏差；authority URL 错误 |
| 无 bundle | Agent 日志；从 Mac 执行 `curl authority/v1/bundles/current` |

日志：`log show --predicate 'process == "finsafe-agent"' --last 1h`

---

## 示例载荷

见 [`packaging/mdm/examples/jamf/`](../../packaging/mdm/examples/jamf/)。
