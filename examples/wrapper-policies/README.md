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
| `hermes-interactive.yaml` | macOS | Hermes interactive broker (Seatbelt, `stdio: inherit`) |
| `hermes-linux-interactive.yaml` | Linux | Hermes interactive broker (`stdio: pty`, `skip_default_deny_read`, DNS) |
| `hermes-interactive-deny-http.yaml` | Linux / macOS | Hermes interactive with outbound HTTP denied |
| `hermes-windows-oneshot.yaml` | Windows | One-shot Hermes under **RestrictedToken** (default desktop `network: host` path; host-wide read, write allowlist; no ProjFS) |
| `hermes-windows-oneshot-appcontainer.yaml` | Windows | Same Hermes one-shot under **AppContainer** (stronger; large venvs may need ProjFS) |
| `windows-version-smoke.yaml` | Windows | Minimal `finsafe run cmd /c echo hello` |
| `windows-sandbox-smoke.yaml` | Windows | Stricter AppContainer smoke with `network: host` |
| `agent-sandbox/` | Linux / macOS / Windows | Agent CLI samples (Hermes, Codex, OpenCode, agy) and isolation probes — see [agent-sandbox/README.md](agent-sandbox/README.md) |

**Maintainers:** edit YAML in this directory; keep comments and paths consistent with [managed-lab.md](../../docs/testing/managed-lab.md) and [POLICY-QUICKREF.md](../../docs/POLICY-QUICKREF.md).
