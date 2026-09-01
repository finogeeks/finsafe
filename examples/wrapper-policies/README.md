# Wrapper policy examples

`kind: local-wrapper` YAML for **`finsafe run`** (short-lived) and **`finsafe self-confine`** (interactive). Hermes-facing samples use **`${HOME}` / `${XDG_CONFIG_HOME}`** placeholders so checked-in policies stay portable; see the quick-ref for substitution rules vs `policy_digest`. Commands in file comments assume this repository root, for example:

```bash
finsafe --policy examples/wrapper-policies/hermes-version-smoke.yaml run your-command
```

See [docs/POLICY-QUICKREF.md](../../docs/POLICY-QUICKREF.md) or [docs/POLICY-QUICKREF-zh.md](../../docs/POLICY-QUICKREF-zh.md).

| File | Platform | Use |
|------|----------|-----|
| `managed-lab-smoke.yaml` | Linux / macOS | Default bundle for [`scripts/managed-lab.sh`](../../scripts/managed-lab.sh) (`/usr/bin/true`, minimal FHS) |
| `hermes-version-smoke.yaml`, `hermes-oneshot-query.yaml` | Linux / macOS | Hermes one-shot smoke (`${HOME}`, FHS paths) |
| `hermes-interactive.yaml` | macOS | Hermes interactive broker (Seatbelt, `stdio: inherit`) — older sample |
| `hermes-macos-interactive.yaml` | macOS | Hermes interactive broker (Seatbelt, `stdio: inherit`, `skip_default_deny_read`, Homebrew paths) |
| `kimi-macos-interactive.yaml` | macOS | Kimi Code CLI interactive (Seatbelt; cwd writable for coding-agent edits) |
| `hermes-interactive-tools-only.yaml` | Windows | Hermes interactive broker with `broker_confine: tools-only` (live TTY; tools via `finsafe run`) |
| `hermes-linux-interactive.yaml` | Linux | Hermes interactive broker (`stdio: pty`, `skip_default_deny_read`, DNS) |
| `hermes-interactive-deny-http.yaml` | macOS | Hermes interactive with Seatbelt outbound HTTP/HTTPS port deny. Linux `run` fail-closes on `macos_seatbelt.*` (#223); for Linux use `hermes-linux-interactive.yaml` + `network: none` |
| `hermes-windows-oneshot.yaml` | Windows | One-shot Hermes under **RestrictedToken** (default desktop `network: host` path; host-wide read; `msys2_child_ipc: true` so child git-bash works — write allowlisting off for user-owned NTFS; no ProjFS) |
| `hermes-windows-oneshot-appcontainer.yaml` | Windows | Same Hermes one-shot under **AppContainer** (stronger; large venvs may need ProjFS) |
| `hermes-windows-interactive.yaml` | Windows | Interactive Hermes session under **RestrictedToken** via `self-confine` (Live ConPTY terminal host; no session timeout) |
| `windows-version-smoke.yaml` | Windows | Minimal `finsafe run cmd /c echo hello` |
| `windows-sandbox-smoke.yaml` | Windows | Stricter AppContainer smoke with `network: host` |
| `network-allowlist-proxy.yaml` | Linux / macOS / Windows | Domain allowlist + `start_internal_proxy` (no MITM) — [runbook](../../docs/network-allowlist-proxy-runbook.md) |
| `enterprise-https-inspection.yaml` | Linux / macOS / Windows | Allowlist + `tls_terminate` (licensed MITM) — [HTTPS inspection runbook](../../docs/https-inspection-runbook.md) |
| `agent-sandbox/` | Linux / macOS / Windows | Agent CLI samples (Hermes, Codex, OpenCode, agy) and isolation probes — see [agent-sandbox/README.md](agent-sandbox/README.md) |

**Maintainers:** edit YAML in this directory; keep comments and paths consistent with [managed-lab.md](../../docs/testing/managed-lab.md) and [POLICY-QUICKREF.md](../../docs/POLICY-QUICKREF.md).
