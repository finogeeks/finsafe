# 在 FinSAFE 沙箱中运行 CLI Agent

**English:** [agent-sandbox-guide.md](./agent-sandbox-guide.md)

帮助用户在 FinSAFE 中运行 **Hermes**、**OpenCode**、**agy** 及未来 Agent。失败时用 **`learn`**、**`explain`**、**`--audit`** 及（macOS）**`finsafe-trace`** 迭代策略，不要盲目改 YAML。

**通用 learn/explain：** [USER-GUIDE-zh.md § 创建与迭代策略](./USER-GUIDE-zh.md) · [`--audit` 说明](./isolation-audit-mode.md)

**AI 技能：** [finsafe-agent-sandbox-run](../skills/finsafe-agent-sandbox-run/SKILL-zh.md) · [finsafe-agent-sandbox-verify](../skills/finsafe-agent-sandbox-verify/SKILL.md)

---

## 一次性准备

```bash
curl -fsSL https://raw.githubusercontent.com/finogeeks/finsafe/main/install.sh | sh
finsafe version

BASE=https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/agent-sandbox
mkdir -p ~/finsafe-policies && cd ~/finsafe-policies
for f in hermes-skip-deny.yaml hermes-interactive-test.yaml opencode-oneshot.yaml \
  agy-oneshot.yaml agy-interactive.yaml; do
  curl -fsSLO "$BASE/$f"
done

mkdir -p ~/my-agent-project/workspace && cd ~/my-agent-project
```

先确认 **无沙箱** 时 Agent 可运行。

---

## 各 Agent 快速开始

macOS 请用 `/usr/bin/env` 传 `HOME`、`PATH`。

### Hermes / OpenCode / agy

见英文版命令块；策略文件分别为 `hermes-skip-deny.yaml`、`opencode-oneshot.yaml`、`agy-oneshot.yaml`。

### `run` 与 `self-confine`

| 命令 | `program_mode` |
|------|----------------|
| `run` | `short-lived` |
| `self-confine` | `interactive` |

---

## 用 `learn` 与 `explain` 迭代策略

沙箱内失败、裸跑成功时的 **主流程**。

### 选哪个工具？

| 情况 | 工具 |
|------|------|
| 尚无策略 | **`finsafe learn -- <cmd>`** |
| 有示例策略，需追加授权 | **`finsafe learn --base <yaml> --out <yaml> -- <cmd>`** |
| 同一次运行要看内联提示 | **`finsafe --audit --policy <yaml> run -- <cmd>`** |
| 已保存 **`run --json`** 输出 | **`finsafe explain envelope.json`** |
| macOS：`learn` 为 0 但 stderr 仍拒绝 | **`finsafe-trace`** |

### 推荐：从已提交的 Agent 策略扩展

不要只用 learn 内置最小种子 — 请用 `agent-sandbox` 示例作 `--base`：

```bash
cd ~/my-agent-project
POLICY=~/finsafe-policies/opencode-oneshot.yaml
CMD=(/usr/bin/env HOME="$HOME" PATH="$HOME/.bun/bin:$HOME/.local/bin:/usr/bin:/bin" \
  opencode run "Reply exactly: LEARN-OK")

finsafe learn --base "$POLICY" --out ~/finsafe-policies/opencode-learned.yaml \
  --work-dir ~/my-agent-project --json -- "${CMD[@]}"

finsafe --policy ~/finsafe-policies/opencode-learned.yaml run -- "${CMD[@]}"

finsafe learn --base ~/finsafe-policies/opencode-learned.yaml \
  --out ~/finsafe-policies/opencode-learned.yaml \
  --work-dir ~/my-agent-project -- "${CMD[@]}"
```

重复直至成功且 `denial_count` 为 0。

### `learn` 常用参数

| 参数 | 作用 |
|------|------|
| `--base` | 从已有 YAML 扩展（优先 agent-sandbox 示例） |
| `--out` | 输出路径 |
| `--work-dir` | 子进程 cwd（需含 `./workspace`） |
| `--json` | 输出 `denial_count`、`merged_paths` 等 |

审阅后再用于生产 — learned YAML 可能过宽。

### macOS：`learn` 报 0 拒绝

内核日志未捕获时，应用 stderr 仍可能有 `operation not permitted`。此时：

1. **`finsafe --audit run`**
2. **`finsafe-trace`**
3. 手动合并路径后再次 `learn`

### 使用 `finsafe explain`

在已用 **`--json`** 跑过、不想重复调 LLM 时做事后分析：

```bash
finsafe --policy "$POLICY" run --json -- "${CMD[@]}" 2>audit.stderr | tail -1 > envelope.json
finsafe explain envelope.json
```

**何时用 explain：** 保存的失败现场、昂贵 LLM 不宜重跑、Windows ETW 笔记。

**何时用 learn：** 需要自动合并授权到 YAML、正向迭代策略文件。

### 完整循环

```text
裸跑失败 → 先修安装/认证/网络
沙箱失败 → --audit → learn --base <agent.yaml> → run learned.yaml
仍失败 → macOS learn=0 用 trace；否则 learn --base learned.yaml
可选 → run --json → explain
成功 → verify 技能验证隔离
```

---

## 路径速查（macOS）

| Agent | 典型路径 |
|-------|----------|
| Hermes | `~/.hermes`（rw）、`skip_default_deny_read: true` |
| OpenCode | `~/.bun`、`~/.local/share/opencode`（rw）等 |
| agy | `~/.gemini`、`~/Library/Application Support/Antigravity`、Keychain |

---

## Windows Agent（Hermes）

桌面 Windows 上，典型 Hermes（`network: host`）优先使用 **RestrictedToken** 示例——整机可读覆盖 Python venv，无需 ProjFS / 递归 AppContainer ACL：

```powershell
mkdir workspace -ErrorAction SilentlyContinue
finsafe --policy examples/wrapper-policies/hermes-windows-oneshot.yaml run hermes --version
```

交互式 Hermes 会话用 `self-confine` + 交互策略（在真实终端中运行；FinSAFE 通过
Live ConPTY + raw/VT 控制台直通与窗口大小转发承载沙箱内 TUI —— Ctrl+C 发给
Hermes，Ctrl+Break 终止会话）：

```powershell
finsafe --policy examples/wrapper-policies/hermes-windows-interactive.yaml self-confine -- hermes
```

更强 AppContainer（deny-read / LowBox / 可选 ProjFS）见 `hermes-windows-oneshot-appcontainer.yaml`。完整 Windows 入门：[WINDOWS-GUIDE-zh.md](./WINDOWS-GUIDE-zh.md)。字段细节：[USER-GUIDE-zh.md § Windows 后端](./USER-GUIDE-zh.md) · [POLICY-QUICKREF-zh.md](./POLICY-QUICKREF-zh.md)。

---

## 新 Agent

1. 复制 `opencode-oneshot.yaml`
2. `learn --base …` 迭代
3. macOS 必要时 `finsafe-trace`
4. `explain` 分析难例
5. verify 技能验收
