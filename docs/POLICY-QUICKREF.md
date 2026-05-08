# Wrapper policy quick reference (`kind: local-wrapper`)

Operators pass a **wrapper policy** YAML file to **`finsafe --policy`**. This page summarizes **Stage 1** fields. The CLI compiles this document into host-specific execution configuration; you normally do **not** author internal execution JSON by hand.

## Minimal skeleton

```yaml
schema_version: 1
kind: local-wrapper
program_mode: short-lived    # or: interactive
degrade:
  allow_fallback: true
audit:
  require_policy_digest: true
  require_resolved_posture: true
stdio:
  mode: inherit              # capture | inherit | null | pty  (optional but recommended for `run`)
network: none               # or: host
resources:
  memory_max: 512M
  pids_max: "128"
  cpu_max: "100000 100000"
  # timeout_ms: 300000      # optional wall-clock limit for `run`
filesystem:
  read_only_paths: ["/usr"]
  read_write_paths: ["./workspace"]
```

## Field semantics

| Field | Meaning |
|-------|---------|
| `schema_version` | Wrapper policy schema version. Use `1` for current Stage 1 policies. |
| `kind` | Must be `local-wrapper`. |
| `program_mode` | `interactive` → use **`finsafe self-confine`**. `short-lived` → use **`finsafe run`**. Mismatch with the CLI verb is rejected. |
| `degrade.allow_fallback` | When `false`, FinSafe fails closed if the strictest posture cannot be applied. When `true`, explicit fallback may be allowed and audited. |
| `degrade.prompt_on_macos_arm64_missing_apple_container` | **Deprecated / ignored** for native macOS Seatbelt wrapper flows; omit in new files. Legacy files may still include it. |
| `audit.require_policy_digest` | Refuse to start unless the wrapper policy digest is recorded in the audit envelope. |
| `audit.require_resolved_posture` | Refuse to start unless resolved host posture is recorded. |
| `stdio.mode` | Child stdio for **`run`**: `capture`, `inherit`, `null`, or `pty`. Text-mode runs default from this when set; `--json` often implies capture unless overridden. |
| `macos_seatbelt.deny_outbound_ports` | Optional list of TCP ports to deny in the Seatbelt profile even when `network: host` (coarse control; not per-domain filtering). |
| `network` | `none` or `host` (Stage 1). |
| `resources.memory_max` / `pids_max` / `cpu_max` | cgroup v2-style resource strings where the Linux strict path applies. |
| `resources.timeout_ms` | Optional wall-clock ceiling for a **`run`** invocation. |
| `filesystem.read_only_paths` | Read-only scope (mounts / Landlock read layer where supported). |
| `filesystem.read_write_paths` | Writable scope. |
| `filesystem.protected_read_only_paths` | Optional extra paths forced into a **read-only** layer (carveouts under writable roots). Relative paths resolve against the process working directory. |
| `filesystem.skip_default_protected_paths` | Default `false`: compiler may add `.git` / `.finsafe` under each `read_write_paths` entry when they exist on disk. Set `true` to skip that merge. |
| `filesystem.deny_read_globs` | Optional suffix glob list (`*.ext`, `**/*.ext`). Matches under writable roots are added to read-only restrictions (writes blocked). Unsupported patterns are skipped with log lines in derivation output. |
| `filesystem.glob_scan_max_depth` | Maximum directory depth when expanding `deny_read_globs` (compiler default `8` if omitted). |

## Declarative rule

The wrapper policy names **intent** (network posture, path classes, resources)—not individual kernel mechanisms. The CLI and runtime map intent to Bubblewrap, cgroup, seccomp, Landlock, or Seatbelt as appropriate for the host.

## Audit envelope (conceptual)

Every wrapper invocation should record (in JSON or logs, depending on mode):

- `wrapper_policy_digest` — SHA-256 over the policy bytes the operator supplied.  
- `resolved_host_profile` — chosen host posture after resolution.  
- `selected_backend` — whether the payload compiled toward **`run`** (`ExecutionSpecV1`-class) or **`self-confine`**.  
- `fallback_used` / `fallback_reason` — when posture selection degraded.

Exact field names and nesting follow the FinSafe version you run; use `finsafe run --json` with a test command to inspect the envelope your build emits.
