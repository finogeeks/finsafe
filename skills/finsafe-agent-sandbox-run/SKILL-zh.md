---
created: 2026-06-22
name: finsafe-agent-sandbox-run
description: >-
  在 FinSAFE 中运行 Hermes、OpenCode、agy；用 learn、explain、audit、finsafe-trace
  排障。面向公开发布用户，自包含。适用于沙箱化 Agent、修复 operation not permitted、
  迭代策略直至顺畅运行。
---

# finsafe-agent-sandbox-run

在 FinSAFE 下运行 **Hermes**、**OpenCode**、**agy** 或新 Agent。失败时用 **`learn`**、
**`explain`**（及 **`--audit`** / **`finsafe-trace`**），不要猜 YAML。

需要：`finsafe` 在 PATH — https://github.com/finogeeks/finsafe/releases

完整指南：https://github.com/finogeeks/finsafe/blob/main/docs/agent-sandbox-guide-zh.md

通用 learn/explain：https://github.com/finogeeks/finsafe/blob/main/docs/USER-GUIDE-zh.md

## 准备

```bash
curl -fsSL https://raw.githubusercontent.com/finogeeks/finsafe/main/install.sh | sh
BASE=https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/agent-sandbox
mkdir -p ~/finsafe-policies ~/my-agent-project/workspace
cd ~/finsafe-policies
for f in hermes-skip-deny.yaml opencode-oneshot.yaml agy-oneshot.yaml; do
  curl -fsSLO "$BASE/$f"
done
```

先确认无沙箱可运行。

## 策略迭代：`learn` 与 `explain`

### 选工具

| 情况 | 工具 |
|------|------|
| 无策略 | `finsafe learn -- <cmd>` |
| 扩展示例 YAML | `finsafe learn --base <yaml> --out <yaml> -- <cmd>` |
| 同次运行内联提示 | `finsafe --audit --policy <yaml> run -- <cmd>` |
| 已保存 `run --json` | `finsafe explain envelope.json` |
| macOS learn=0 但 stderr 拒绝 | `finsafe-trace` |

### learn（Agent 推荐流程）

从 **agent-sandbox 示例** 作 `--base`，勿只用内置最小种子：

```bash
cd ~/my-agent-project
POLICY=~/finsafe-policies/opencode-oneshot.yaml
CMD=(/usr/bin/env HOME="$HOME" PATH="$HOME/.bun/bin:$HOME/.local/bin:/usr/bin:/bin" \
  opencode run "Reply exactly: LEARN-OK")

finsafe learn --base "$POLICY" --out ~/finsafe-policies/opencode-learned.yaml \
  --work-dir "$PWD" --json -- "${CMD[@]}"

finsafe --policy ~/finsafe-policies/opencode-learned.yaml run -- "${CMD[@]}"

finsafe learn --base ~/finsafe-policies/opencode-learned.yaml \
  --out ~/finsafe-policies/opencode-learned.yaml --work-dir "$PWD" -- "${CMD[@]}"
```

**macOS：** `denial_count: 0` 但 stderr 有 `operation not permitted` → `--audit` 或 `finsafe-trace`。

### explain

```bash
finsafe --policy "$POLICY" run --json -- "${CMD[@]}" 2>audit.stderr | tail -1 > envelope.json
finsafe explain envelope.json
```

**learn** 自动合并 YAML；**explain** 分析已保存运行。

### 完整阶梯

裸跑失败 → 修 Agent/认证 → 沙箱失败 → audit → learn --base → run learned → 仍失败则再 learn 或 trace → 可选 explain → verify

## 路径速查（macOS）

| Agent | 关键路径 |
|-------|----------|
| Hermes | `~/.hermes`、`skip_default_deny_read: true` |
| OpenCode | `~/.local/share/opencode`（rw）等 |
| agy | Antigravity、Keychain |

## 相关技能

- **finsafe-agent-sandbox-verify** — 隔离证明
- **finsafe-trace-denials** — macOS trace
