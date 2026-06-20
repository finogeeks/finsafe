# Isolation audit mode (`--audit`)

FinSAFE uses different kernel mechanisms on Linux, macOS, and Windows. The portable concept is **audit mode**: load the selected reviewed profile, collect isolation-miss evidence, and print remediation hints without weakening enforcement (except Linux seccomp, which may log instead of kill).

Enable with global **`finsafe --audit`** before `run` or `self-confine`:

```bash
finsafe --audit --policy my-agent.yaml run -- my-agent --print "hello"
```

Not valid with `run --high-level` or enterprise-strict profiles.

## Effect by host

| Host | `--audit` behavior |
|------|-------------------|
| **Linux** | Seccomp **permissive** (`log` / `audit`) — syscalls may complete while misses are logged. Same as `FINSAFE_BWRAP_SECCOMP=audit` for bubblewrap `run`. |
| **macOS** | Seatbelt **enforcement unchanged**; kernel Sandbox `deny(...)` events streamed; stderr policy hints (`seatbelt_mode: diagnostic`). |
| **Windows** | AppContainer **enforcement unchanged**; ETW kernel-file/network capture + marker hints in `policy_derivation_notes`; inline remediation on stderr when denials are classified. |

On macOS and Windows the wrapped command may still exit non-zero on the first denial — that is expected. The value is **path discovery**, not running without a sandbox.

## JSON stdout contract

With **`--json`**, FinSAFE prints **exactly one JSON document on stdout** and it **must be the last line**. Human text and audit hints go to **stderr**. Save an envelope for `finsafe explain`:

```bash
finsafe --policy my-agent.yaml run --json -- my-agent --print "hello" 2>audit.stderr \
  | tail -1 > envelope.json
finsafe explain envelope.json
```

Child stdout/stderr are nested inside `envelope.inner` in the JSON document.

## Operator workflow

1. Reproduce in normal **enforce** mode; note exit code.
2. Re-run with the **same policy** and **`--audit`**; read stderr remediation / suggested paths.
3. Optionally save the `--json` envelope and run **`finsafe explain`** for a structured report.
4. Edit YAML or run **`finsafe learn`** to merge grants (see [USER-GUIDE.md](USER-GUIDE.md)).

## Further reading

- [POLICY-QUICKREF.md](POLICY-QUICKREF.md) — policy iteration loop
- [USER-GUIDE.md](USER-GUIDE.md) — `learn` / `explain` workflows
