# Microsoft Intune — FinSAFE 托管模式

通过 Intune（Endpoint Manager）在 **macOS**、**Linux** 与 **Windows** 托管设备上部署 FinSAFE。

**English:** [intune.md](./intune.md)

**前提：** 已完成 [企业手册](../enterprise-deployment-runbook-zh.md) 阶段 A（authority + 已签名哨兵）。

### Windows 设备（Intune）

Windows 托管舰队使用 `finsafe-fleet-v*`（`finsafe.exe`、`finsafe-agent.exe`、`finsafe-winhelper.exe`），安装路径与 Win32/GPO 步骤见英文手册 **[intune.md §7](./intune.md#7-windows-deployment-intune-or-gpo)**。IT 试点可用 **[`install-fleet-windows.ps1`](../../install-fleet-windows.ps1)**（需提升权限的 PowerShell）。

---

## 1. macOS 部署概览

| 步骤 | Intune 项 |
|------|-----------|
| 安装二进制 | macOS 应用（PKG/DMG）或 shell 脚本包 |
| Agent 守护进程 | 自定义配置描述文件（plist）或脚本 + LaunchDaemon |
| 哨兵 | 自定义配置描述文件（文件载荷） |
| 注册 | 带一次性 token 的脚本策略（试点），完成后移除 |

---

## 2. macOS — 安装 `finsafe` 与 `finsafe-agent`

### 2.1 业务线应用（PKG）

1. **Devices → macOS → Apps → Add** → Line-of-business app。
2. 上传安装到 `/usr/local/bin/` 的签名 PKG。
3. 分配给设备组（必需安装）。

### 2.2 安装后检测规则

```bash
test -x /usr/local/bin/finsafe && test -x /usr/local/bin/finsafe-agent
```

---

## 3. macOS — LaunchDaemon 描述文件

创建 **Devices → macOS → Configuration profiles → Create profile → Templates → Custom**。

上传基于 [`packaging/launchd/com.finogeeks.finsafe-agent.plist`](../../packaging/launchd/com.finogeeks.finsafe-agent.plist) 的 plist。

**OMA-URI 替代方案**（Settings Catalog 自定义键）：可通过 shell 脚本部署（见下）— 以 **Custom profile** 或脚本交付 plist 通常更简单。

**推荐：** 分配给同一组的 **Device shell script**（macOS）：

```bash
#!/bin/bash
set -euo pipefail
AUTH_URL="https://gov.example.com/policy-authority"
PLIST_DST="/Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist"

mkdir -p /etc/finsafe /var/lib/finsafe
chmod 755 /etc/finsafe /var/lib/finsafe

cat > "$PLIST_DST" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.finogeeks.finsafe-agent</string>
  <key>ProgramArguments</key><array><string>/usr/local/bin/finsafe-agent</string></array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>EnvironmentVariables</key><dict>
    <key>FINSAFE_AUTHORITY_URL</key><string>AUTH_URL_PLACEHOLDER</string>
  </dict>
</dict></plist>
PLIST
sed -i '' "s|AUTH_URL_PLACEHOLDER|$AUTH_URL|g" "$PLIST_DST"
chmod 644 "$PLIST_DST"
chown root:wheel "$PLIST_DST"
launchctl bootstrap system "$PLIST_DST" 2>/dev/null || launchctl load "$PLIST_DST"
```

以 **root**、系统上下文运行。

---

## 4. macOS — Managed-required 哨兵

**方案 A — 脚本部署**

```bash
#!/bin/bash
set -euo pipefail
# 从 Intune 安全变量 / Azure Key Vault 引用粘贴签名 JWS
SENTINEL_JWS='%%SENTINEL_JWS%%'
install -d -m 755 /etc/finsafe
printf '%s\n' "$SENTINEL_JWS" > /etc/finsafe/managed-required.json
chmod 644 /etc/finsafe/managed-required.json
chown root:wheel /etc/finsafe/managed-required.json
```

将 `SENTINEL_JWS` 存为 Intune **机密脚本变量**（勿提交 Git）。

**方案 B — 自定义描述文件文件载荷**

若租户支持将单文件交付到 `/etc/finsafe/managed-required.json`，可附加 `finsafe-bundlectl sentinel sign` 生成的 JWS 文件。

---

## 5. macOS — 一次性注册脚本

创建脚本策略 **FinSAFE Enroll**（仅试点组）：

```bash
#!/bin/bash
set -euo pipefail
[[ -f /etc/finsafe/enrolled.json ]] && exit 0

DEVICE_ID="${DEVICE_SERIAL_NUMBER:-$(ioreg -rd1 -c IOPlatformExpertDevice | awk -F\" '/IOPlatformUUID/ {print $4}')}"
ENROLL_TOKEN='%%ENROLL_TOKEN%%'
AUTH_URL="https://gov.example.com/policy-authority"
PLIST="/Library/LaunchDaemons/com.finogeeks.finsafe-agent.plist"

/usr/libexec/PlistBuddy -c "Add :EnvironmentVariables:FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID string $DEVICE_ID" "$PLIST" 2>/dev/null \
  || /usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID $DEVICE_ID" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :EnvironmentVariables:FINSAFE_ENROLL_TOKEN string $ENROLL_TOKEN" "$PLIST" 2>/dev/null \
  || /usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:FINSAFE_ENROLL_TOKEN $ENROLL_TOKEN" "$PLIST"
/usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:FINSAFE_AUTHORITY_URL $AUTH_URL" "$PLIST" 2>/dev/null || true

launchctl kickstart -k system/com.finogeeks.finsafe-agent || launchctl load "$PLIST"
sleep 8
test -f /etc/finsafe/enrolled.json
```

- `ENROLL_TOKEN`：Intune 机密变量，每波轮换。
- 成功后 **停用** 该脚本分配，或使用要求规则：仅当 `enrolled.json` 不存在时运行。

**清理脚本**（可选）：注册后从 plist 删除 `FINSAFE_ENROLL_TOKEN`（同 Jamf §4.3）。

---

## 6. Linux 部署（Intune）

Intune 支持 **Linux** 自定义脚本（视发行版而定）。

### 6.1 安装软件包

使用发行版 deb/rpm 或脚本：

```bash
#!/bin/bash
set -euo pipefail
install -m 0755 finsafe /usr/local/bin/finsafe
install -m 0755 finsafe-agent /usr/local/bin/finsafe-agent
```

### 6.2 systemd 单元

部署 [`packaging/systemd/finsafe-agent.service`](../../packaging/systemd/finsafe-agent.service)：

```bash
#!/bin/bash
set -euo pipefail
AUTH_URL="https://gov.example.com/policy-authority"
install -m 0644 finsafe-agent.service /etc/systemd/system/finsafe-agent.service
mkdir -p /etc/finsafe /var/lib/finsafe
systemctl daemon-reload
systemctl enable --now finsafe-agent.service
```

覆盖 authority URL：

```bash
mkdir -p /etc/systemd/system/finsafe-agent.service.d
cat > /etc/systemd/system/finsafe-agent.service.d/authority.conf <<EOF
[Service]
Environment=FINSAFE_AUTHORITY_URL=$AUTH_URL
EOF
systemctl daemon-reload
systemctl restart finsafe-agent
```

### 6.3 哨兵 + 注册

路径与 macOS 相同：

- `/etc/finsafe/managed-required.json`
- 在 systemd drop-in 中一次性设置 `FINSAFE_ENROLL_TOKEN` + `FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID`

```bash
# /etc/systemd/system/finsafe-agent.service.d/enroll.conf（注册后删除）
[Service]
Environment=FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID=HOSTNAME_OR_INTUNE_DEVICE_ID
Environment=FINSAFE_ENROLL_TOKEN=one-time-token
```

---

## 7. 合规策略（可选）

| 合规规则 | 检测 |
|----------|------|
| FinSAFE agent 运行中 | 自定义脚本：`test -S /run/finsafe-agent.sock` |
| 哨兵存在 | `test -f /etc/finsafe/managed-required.json` |
| 已注册 | `test -f /etc/finsafe/enrolled.json` |

标记不合规 → 通过重新运行脚本修复（不能替代哨兵强制）。

---

## 8. 验证

在设备上（Company Portal 支持会话或本地管理员）：

```bash
/usr/local/bin/finsafe run --json -- /usr/bin/true 2>&1 | head
ls -la /etc/finsafe/ /run/finsafe-agent.sock
```

Intune **Device diagnostics** → 脚本输出。

---

## 9. 示例载荷

见 [`packaging/mdm/examples/intune/`](../../packaging/mdm/examples/intune/)。
