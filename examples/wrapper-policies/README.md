# Wrapper policy examples

`kind: local-wrapper` YAML for **`finsafe run`** (short-lived) and **`finsafe self-confine`** (interactive). Hermes-facing samples use **`${HOME}` / `${XDG_CONFIG_HOME}`** placeholders so checked-in policies stay portable; see the quick-ref for substitution rules vs `policy_digest`. Commands in file comments assume this repository root, for example:

```bash
finsafe --policy examples/wrapper-policies/hermes-version-smoke.yaml run your-command
```

See [docs/POLICY-QUICKREF.md](../../docs/POLICY-QUICKREF.md) or [docs/POLICY-QUICKREF-zh.md](../../docs/POLICY-QUICKREF-zh.md).

| File | Platform | Use |
|------|----------|-----|
| `hermes-*.yaml` | Linux / macOS | Hermes broker smoke (`${HOME}`, FHS paths) |
| `windows-version-smoke.yaml` | Windows | Minimal `finsafe run cmd /c echo hello` |
| `windows-sandbox-smoke.yaml` | Windows | Stricter AppContainer smoke with `network: host` |

**Maintainers:** source-of-truth YAML lives under `examples/wrapper-policies/` in the private FinSAFE monorepo; copy updates here before a public doc sync.
