# Visual sandbox

**中文：** [visual-sandbox-zh.md](./visual-sandbox-zh.md)

`finsafe --visual` opens a local web UI. The first screen is a **Scenario demo**: pick an Agent, pick a scenario (that fills the chat box in the current language), then send. Demo Agent shows your prompt once and two side-by-side replies — **Without FinSAFE** and **With FinSAFE** — with the task's artifact (browser, files, upload, timer). A real Agent (Hermes / FinClaw) uses the same side-by-side comparison. Commands, JSON, and policy YAML stay under **View audit evidence**. Nothing is pre-recorded. The UI is embedded in the personal CLI; you do not need Bun, Node, or a git checkout.

```bash
finsafe --visual
# equivalent, does not open a browser unless you pass --open:
finsafe visual-sandbox --port 8787 --open
```

Opens **http://127.0.0.1:8787** (loopback only by default).

## Double-click demo pack (no prior install)

Same `finsafe` binary, renamed so a double-click starts the UI. The recipient does not need `finsafe` on PATH.

| OS | What to send | How they open it |
| --- | --- | --- |
| Windows | `finsafe-visual.exe` | Double-click. Leave the console open; close it to stop. |
| macOS | `FinSAFE-Visual.dmg` (contains `FinSAFE Visual.app`) | Open the disk image, double-click the app. |

Build from this repo:

```bash
./scripts/dev/package-finsafe-visual.sh --release   # macOS → .app + .dmg
# Windows (PowerShell, after cargo build -p finsafe-cli):
#   pwsh -File .\scripts\dev\package-finsafe-visual.ps1 -Release
```

Demo Agent needs nothing else. Hermes / FinClaw still have to be installed on that machine. Windows allowlist / lock-net still wants `finsafe-winhelper` and `finsafe setup-windows`; this pack does not embed the helper.

## First run (no extra tools)

**Demo Agent** is selected by default. It is a built-in deterministic executor (no LLM, no Hermes/FinClaw, no `curl` / `python3` / `openssl`). It attempts the same file, network, and hang actions a tool-using Agent would, twice: unprotected vs inside FinSAFE.

Default scenario: open Baidu and show the page title. If this machine cannot reach the public site, the UI reports **host connectivity unavailable** — that is not a FinSAFE block.

Guided scenarios:

| Scenario | What it shows |
| --- | --- |
| External website | Unapproved destination vs allowlist |
| Sensitive files | Project brief allowed; synthetic `vault/internal-config.ini` denied |
| Data egress | POST a non-sensitive weekly note to `https://postman-echo.com/post` (reachable); Demo Agent still delivers unprotected traffic to a loopback receiver; FinSAFE blocks the echo host |
| Runaway task | A 60-second `sleep` / `Start-Sleep`; FinSAFE stops it at the time limit |

Detected Hermes / FinClaw appear in the same Agent picker. Free-form conversation is **Agent conversation**, also side by side (without FinSAFE / with FinSAFE). The send button is disabled when no local Agent is installed.

Existing File vault / Web access / HTTPS inspection / Runaway pages remain under **Advanced lab**.

## HTTP client (advanced lab)

Network lab tabs prefer **`curl`** when it is on PATH. If curl is missing, they fall back to **`finsafe visual-http`**. CPU / memory runaway workloads in the lab still need `python3`.

## What each OS actually enforces

| | Linux | macOS | Windows |
|---|---|---|---|
| Files | kernel (bwrap / Landlock) | Seatbelt | AppContainer / RestrictedToken |
| Network allowlist | loopback proxy | loopback proxy | proxy + WFP (live proof needs a Windows host) |
| Timeout | yes | yes | yes |
| CPU quota | cgroup | not Seatbelt | not claimed |
| Memory / process count | cgroup kill | not Seatbelt | Job Object kill |

Windows rows for this UI are **not** treated as proven until a maintainer runs `finsafe --visual` on a Windows machine.

## Kit files

Generated under a temp directory (printed at startup). They are marked **SYNTHETIC / CANARY** so the file scenarios have something to deny without using real secrets.

## Developers

Source of the UI lives in the private FinSAFE tree (`ui/visual-sandbox/`). `bun run dev` there is a hot-reload harness; release binaries serve the compiled SPA from the `finsafe` process itself.
