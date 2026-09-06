# Visual sandbox

**中文：** [visual-sandbox-zh.md](./visual-sandbox-zh.md)

`finsafe --visual` opens a local web UI that runs **real commands** on this machine. Most tabs run the same action twice: once unprotected, once inside FinSAFE. Nothing is pre-recorded. The UI is embedded in the personal CLI; you do not need Bun, Node, or a git checkout.

```bash
finsafe --visual
# equivalent, does not open a browser unless you pass --open:
finsafe visual-sandbox --port 8787 --open
```

Opens **http://127.0.0.1:8787** (loopback only by default).

## What you can try

| Tab | What it shows |
| --- | ------------- |
| Overview | What this page does, plus an honest table of Linux / macOS / Windows limits |
| File vault | Read/write a path with deny-read globs vs host access |
| Web access | Open / allowlist / offline vs a real page or a block |
| HTTPS inspection | CONNECT+ciphertext vs decrypted method/path (commercial MITM is licensed — this UI uses a local lab CA) |
| Runaway job | Hang / CPU / memory / process caps, with honest OS badges |
| Agent | Detects Hermes and FinClaw on PATH; one-shot prompt under FinSAFE; console on screen. Default prompt asks the agent to fetch a site that is **not** on the LLM allowlist |

## HTTP client

Network tabs prefer **`curl`** when it is on PATH, so the sandbox is wrapping an ordinary tool. If curl is missing (common on locked-down demo laptops), the UI falls back to **`finsafe visual-http`**, a small HTTP helper built into the same binary. You can still put curl on PATH later; the sandbox is meant to wrap whichever tool you actually run.

CPU / memory runaway workloads still need `python3`.

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

Generated under a temp directory (printed at startup). They are fake salary / PII samples so the file-vault tab has something to deny.

## Developers

Source of the UI lives in the private FinSAFE tree (`ui/visual-sandbox/`). `bun run dev` there is a hot-reload harness; release binaries serve the compiled SPA from the `finsafe` process itself.
