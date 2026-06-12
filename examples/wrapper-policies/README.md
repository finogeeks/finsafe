# Wrapper policy examples

`kind: local-wrapper` YAML for **`finsafe run`** (short-lived) and **`finsafe self-confine`** (interactive). Hermes-facing samples use **`${HOME}` / `${XDG_CONFIG_HOME}`** placeholders so checked-in policies stay portable; see the quick-ref for substitution rules vs `policy_digest`. Commands in file comments assume this repository root, for example:

```bash
finsafe --policy examples/wrapper-policies/hermes-version-smoke.yaml run your-command
```

See [docs/POLICY-QUICKREF.md](../../docs/POLICY-QUICKREF.md) or [docs/POLICY-QUICKREF-zh.md](../../docs/POLICY-QUICKREF-zh.md).

| File | Platform | Use |
|------|----------|-----|
| `managed-lab-smoke.yaml` | Linux / macOS | Default bundle for [`scripts/managed-lab.sh`](../../scripts/managed-lab.sh) (`/usr/bin/true`, minimal FHS) |
| `hermes-version-smoke.yaml`, `hermes-oneshot-query.yaml`, `hermes-interactive*.yaml` | Linux / macOS | Hermes broker smoke (`${HOME}`, FHS paths) |
| `hermes-windows-oneshot.yaml` | Windows | One-shot Hermes (`hermes --version`, `hermes chat -q …`) under AppContainer; venv access is granted automatically |
| `windows-version-smoke.yaml` | Windows | Minimal `finsafe run cmd /c echo hello` |
| `windows-sandbox-smoke.yaml` | Windows | Stricter AppContainer smoke with `network: host` |

**Maintainers:** edit YAML in this directory; keep comments and paths consistent with [managed-lab.md](../../docs/testing/managed-lab.md) and [POLICY-QUICKREF.md](../../docs/POLICY-QUICKREF.md).
