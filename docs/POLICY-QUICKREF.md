# Wrapper policy quick reference (`kind: local-wrapper`)

**中文:** [POLICY-QUICKREF-zh.md](POLICY-QUICKREF-zh.md)

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

## Host profile alternative (`self-confine`)

Instead of authoring wrapper YAML, **`finsafe --host-profile <NAME> self-confine`** synthesises a `local-wrapper` policy from built-in templates (`windows-desktop-isolated`, `linux-desktop-isolated`, `mac-seatbelt`, `windows-managed`). Optional **`--policy`** merges operator overrides. See [USER-GUIDE.md](USER-GUIDE.md) §1b.

## Field semantics

| Field | Meaning |
|-------|---------|
| `schema_version` | Wrapper policy schema version. Use `1` for current Stage 1 policies. |
| `kind` | Must be `local-wrapper`. |
| `program_mode` | `interactive` → use **`finsafe self-confine`**. `short-lived` → use **`finsafe run`**. Mismatch with the CLI verb is rejected. |
| `broker_confine` | Optional. Default `self-confine` confines the broker. Opt-in `tools-only` runs the broker unsandboxed (live TTY without AppContainer/ProjFS); audit shows `broker_confined=false`. Confine tools with **`finsafe run`** / execution cells. Example: [`hermes-interactive-tools-only.yaml`](../../examples/wrapper-policies/hermes-interactive-tools-only.yaml). |
| `degrade.allow_fallback` | When `false`, FinSafe fails closed if the strictest posture cannot be applied. When `true`, explicit fallback may be allowed and audited. |
| `degrade.prompt_on_macos_arm64_missing_apple_container` | **Deprecated / ignored** for native macOS Seatbelt wrapper flows; omit in new files. Legacy files may still include it. |
| `audit.require_policy_digest` | Refuse to start unless the wrapper policy digest is recorded in the audit envelope. |
| `audit.require_resolved_posture` | Refuse to start unless resolved host posture is recorded. |
| `stdio.mode` | Child stdio for **`run`**: `capture`, `inherit`, `null`, or `pty`. Text-mode runs default from this when set; `--json` often implies capture unless overridden. On **Linux**, **`pty`** allocates a virtual pseudo-terminal so tools that open **`/dev/tty`** (for example `vim`, `less`, password prompts, or Git hooks) work inside the sandbox without host TTY passthrough. Override per invocation with **`finsafe run --stdio pty`**. **`inherit`** on Linux does not grant a controlling terminal inside bubblewrap. |
| `macos_seatbelt.deny_outbound_ports` | Optional list of TCP ports to deny in the Seatbelt profile even when `network: host` (coarse control; not per-domain filtering). **Failure mode:** port-specific denies layered on `network: host` may fail immediately (`EPERM`) or stall until the client TCP timeout, depending on the stack; some agents hang rather than surfacing a clear error. Always pair with `resources.timeout_ms` so FinSAFE kills the child. For complete network isolation prefer `network: none`, which denies at the socket/DNS syscall level and usually fails fast. |
| `network` | `none` or `host` (Stage 1). |
| `resources.memory_max` / `pids_max` / `cpu_max` | cgroup v2-style resource strings where the Linux strict path applies. |
| `resources.timeout_ms` | Optional wall-clock ceiling for a **`run`** invocation. |
| `filesystem.read_only_paths` | Read-only scope (mounts / Landlock read layer where supported). **Only paths that exist on the host when `finsafe run` compiles the policy** are applied; missing entries are omitted and logged in derivation output (`read_only landlock skipped (path missing)`). |
| `filesystem.read_write_paths` | Writable scope. Same **existence-at-compile-time** rule as `read_only_paths`; missing entries are omitted (`read_write landlock skipped (path missing)`). Creating a directory later in the same run does not add it—you must re-run `finsafe run` after the path exists on the host. |
| `filesystem.protected_read_only_paths` | Optional extra paths forced into a **read-only** layer (carveouts under writable roots). Relative paths resolve against the process working directory. |
| `filesystem.skip_default_protected_paths` | Default `false`: compiler may add `.git` / `.finsafe` under each `read_write_paths` entry when they exist on disk. Set `true` to skip that merge. |
| `filesystem.deny_read_paths` | Explicit paths (or bounded globs) **denied for read** under writable roots — e.g. allow `./workspace` but block `./workspace/.env`. Compiled into a separate `deny_read_paths` layer (not `read_only_paths`). On Linux/macOS isolated profiles and Windows isolated/managed profiles, a built-in deny-read set applies unless `skip_default_deny_read: true`. **Unix sockets** (e.g. `docker.sock`) are blocked via this layer on Linux (bwrap `/dev/null` overlay) and via Seatbelt `unix-socket` rules on macOS—not via `read_only_paths` or Landlock alone. |
| `filesystem.allow_unix_socket_paths` | Host Unix socket paths **exempted from built-in sensitive-socket denies** (Docker/containerd/podman API sockets). Does not remove explicit `deny_read_paths`. Use when a product intentionally drives a local container runtime from inside the sandbox. |
| `filesystem.deny_write_globs` | Glob list (`*.ext`, `**/*.ext`, …) expanded via bounded `globset` into extra read-only entries (writes blocked). Legacy YAML key `deny_read_globs` is accepted as an alias. |
| `filesystem.skip_default_deny_read` | When `true`, skip built-in deny-read paths on Linux/macOS isolated profiles and Windows isolated/managed profiles. |
| `filesystem.glob_scan_max_depth` | Maximum directory depth when expanding deny globs (compiler default `8` if omitted). |
| `filesystem.toolchains` | Optional list of **named presets** (`homebrew`, `npm-global`, `cargo`, …) shipped in `toolchain-defaults.yaml`. When building from a **host profile** (`--host-profile`), each name **appends** `read_write_paths` / `read_only_paths` after the template and before operator YAML overrides. Repeatable CLI flag: `--toolchain <name>`. **Self-confine only** in v1. Built-in deny-read still applies; presets grant real writes (not log suppression). The `homebrew` preset is **broad** (`/opt/homebrew`, `/usr/local`) because formula install scripts run there—use explicit narrower `read_write_paths` for stricter setups. Example: [`brew-self-confine.yaml`](../../examples/wrapper-policies/brew-self-confine.yaml). |
| `network` (allowlist) | YAML: `network: !allowlist` with nested `domains: [example.com]` (YAML tag form; a plain map under `network:` will not parse). Requires egress proxy at launch (`start_internal_proxy: true` for personal/local, or `finsafe-net-proxy` + `proxy_cell` in managed/SaaS paths); effective mode `allowlist`. **How to run:** [network-allowlist-proxy-runbook.md](./network-allowlist-proxy-runbook.md). |
| `tls_terminate` | When `true` (wrapper root or `network.tls_terminate`), the egress proxy **decrypts HTTPS** for L7 filtering and richer `proxy_egress` audit (`tls_terminated`, method/path). Requires commercial license feature **`mitm_tls_terminate`** on the authority, an authority **inspection CA** embedded in published bundles (`inspection_ca_cert_pem`), and the agent-installed CA under the managed cache. Children receive trust-store env vars (`SSL_CERT_FILE`, `CURL_CA_BUNDLE`, `NODE_EXTRA_CA_CERTS`, …) pointing at the inspection cert. **Compliance:** users must be informed that HTTPS is inspected. |
| `start_internal_proxy` | When `true`, `finsafe run` / `finsafe self-confine` may start a bundled loopback forward proxy on **`127.0.0.1:60080`** (same range as Windows WFP `permit-loopback`) instead of requiring a separate `finsafe-net-proxy` UDS. Pair with `network: allowlist` for domain-restricted egress. Optional `tls_terminate: true` adds HTTPS inspection (licensed) — see [https-inspection-runbook.md](./https-inspection-runbook.md). |
| **Parent corporate proxy (pilot)** | Child still talks only to the loopback FinSAFE proxy; egress may chain via **HTTP CONNECT** to an enterprise gateway. Credentials stay out of bundles: env vars `FINSAFE_PARENT_PROXY_URL`, `FINSAFE_PARENT_PROXY_NO_PROXY` (comma-separated bypass list). Design: [parent-proxy.md](../../../docs/design/parent-proxy.md). |

### TLS inspection (MITM) operator notes

| Topic | Detail |
|-------|--------|
| **License** | Authority and publish paths return **`402`** without `mitm_tls_terminate` in `/etc/finsafe/license.jws`. `finsafe_licensectl` does **not** add this feature by default — request it from Finogeeks. |
| **Authority CA** | Operators run `POST /v1/admin/mitm/ca` (admin API) before publishing policies with `tls_terminate: true`. Agents fetch the public cert via bundle field or `GET /v1/mitm/ca/cert`. |
| **Example policy** | [`enterprise-https-inspection.yaml`](../examples/wrapper-policies/enterprise-https-inspection.yaml) + [https-inspection-runbook.md](./https-inspection-runbook.md). |
| **Dev / lab** | Set `FINSAFE_LICENSE_MITM=1` on proxy hosts to bypass license checks. Optional stable CA: `FINSAFE_MITM_CA_CERT_PATH` + `FINSAFE_MITM_CA_KEY_PATH` for `start_internal_proxy`. Force termination for curl/openssl probes: `FINSAFE_MITM_FORCE_TERMINATE=1`. |
| **Audit schema** | Terminated flows use `proxy_egress` schema version **3**; opaque CONNECT tunnels stay at **2**. |

### Built-in filesystem defaults (Linux/macOS/Windows)

Unless `skip_default_deny_read: true` or `skip_default_protected_paths: true`, the compiler merges shipped defaults (independent of your YAML) on **Linux/macOS isolated** and **Windows isolated/managed** profiles:

| Category | Typical paths (summary) |
|----------|-------------------------|
| **Deny read** (under each writable root) | `.env`, `.env.local`, `.env.production` |
| **Deny read** (under `$HOME` / `%USERPROFILE%`) | `.ssh`, `.aws`, `.gnupg`, `.config/gcloud` |
| **Deny read** (Linux absolutes) | `/etc/shadow`, `/etc/gshadow` |
| **Deny read / unix-socket** (sensitive container APIs, when paths exist on host at compile time) | `/var/run/docker.sock`, `/run/docker.sock`, `/run/containerd/containerd.sock`, `/run/podman/podman.sock`, `$HOME/.docker/run/docker.sock`, `$HOME/.orbstack/run/docker.sock` |
| **Protected read-only** (under each writable root, when present) | `.git`, `.finsafe` |

**Path vs socket vs network:** Listing `/var` in `read_only_paths` blocks directory listing through Landlock but does **not** block `connect()` to `/var/run/docker.sock`. Use built-in sensitive-socket defaults (default-on), explicit `deny_read_paths`, or `network: none` / seccomp `no_network` for defense in depth. Putting a socket path only in `read_only_paths` has no Landlock effect—the compiler logs a warning.

After a fleet upgrade, Hermes and similar programs may fail to read `.env` or credential dirs under the user profile even when bundle YAML is unchanged. Workloads that relied on implicit access to Docker/containerd sockets without declaring `allow_unix_socket_paths` will see `connect()` failures under `network: host` or proxy modes—add explicit allows only when required. To preserve prior behavior entirely, set `skip_default_deny_read: true` on the relevant sandbox policy (and review protected segments).

### Windows backends: RestrictedToken (default host) vs AppContainer

**Operator journey (install → choose backend → verify → troubleshoot):** [WINDOWS-GUIDE.md](WINDOWS-GUIDE.md) · [WINDOWS-GUIDE-zh.md](WINDOWS-GUIDE-zh.md).

**Linux/macOS do not have this split.** On Windows desktop, FinSAFE selects a launch backend from `windows.backend` (default `Auto`):

| Backend | Wire / attestation | Selected when | Isolation summary |
|---------|--------------------|---------------|-------------------|
| **RestrictedToken** | `windows_restricted_token`, `degraded_execution=true` | **Auto** + `network: host` + empty YAML `deny_read_paths`, or explicit `windows.backend: restricted_token` | `CreateRestrictedToken` + **WRITE_RESTRICTED**: child largely retains the user identity for **reads** (host-wide); **writes** are deny-by-default and allowed only on `read_write_paths` (+ cwd) via capability ACEs. Job Object still applies. No LowBox AppContainer profile, no recursive DACL labeling of `venv`/`node_modules`, **no ProjFS**. Built-in confidential deny-read is **skipped** on this path (Codex-aligned weaker posture). |
| **AppContainer** | `windows_appcontainer` | Auto + `network: none` / allowlist, any YAML `deny_read_paths`, explicit `windows.backend: appcontainer`, managed fleet | AppContainer / LowBox Package SID, inheritable DACL grants, optional deny-read ACEs, WFP egress fencing. Large runtime trees prefer **ProjFS projection** (enable via `finsafe setup-windows`; reboot only if enable returns `restart_required` / exit **3010**). |

**Examples (both shipped):**

| Policy | Backend |
|--------|---------|
| [`hermes-windows-oneshot.yaml`](../examples/wrapper-policies/hermes-windows-oneshot.yaml) | RestrictedToken |
| [`hermes-windows-oneshot-appcontainer.yaml`](../examples/wrapper-policies/hermes-windows-oneshot-appcontainer.yaml) | AppContainer |

Constraints for RestrictedToken: `network: host`, empty YAML `deny_read_paths` (use AppContainer if you need confidential deny-read or locked-down network).

### Windows AppContainer: large `read_only_paths` / `read_write_paths` roots

**Only applies to AppContainer launches.** RestrictedToken does not walk trees to apply Package SID ACLs.

Windows AppContainer needs an **inheritable** DACL (Package SID ACE) and a **Low mandatory integrity label** on each filesystem root FinSAFE uses: `work_dir`, every `read_only_paths` entry, and every `read_write_paths` entry. Child processes inherit those ACLs; FinSAFE must materialize them on the root (and, on first launch, may touch descendants when applying inheritable grants). For large `venv` / `node_modules`, prefer **ProjFS projection** of the runtime tree instead of listing those trees in policy paths.

| Phase | What happens | Operator impact |
|-------|----------------|-----------------|
| **First launch** on a large tree (default guard: ≥ **10 000** immediate children under a policy root) | FinSAFE **refuses** by default (`refusing to apply inheritable AppContainer ACLs`) to avoid multi-minute ACL storms (worse under endpoint DLP/EDR that intercepts every `SetNamedSecurityInfoW`). | **Narrow paths** — do not put an entire agent checkout, project root, or tree containing `node_modules` in `read_only_paths` / `read_write_paths`. List only directories the workload truly needs. Or switch to RestrictedToken for `network: host` agents. |
| **First launch** when you accept the one-time cost | Set `FINSAFE_WINSAFE_INHERIT_ROOT_FAIL=0` for a **single** labeling run (expect progress lines every 5 000 objects). **Let it finish** — interrupting mid-label leaves descendants without execute bits. | Use a maintenance window; prefer ProjFS or RestrictedToken over listing the whole checkout in policy. |
| **Repeat launch** on the **same** fully labeled roots | FinSAFE records a completion sentinel under `%LOCALAPPDATA%\FinSAFE\label-complete\` and skips redundant tree relabels. Typical relaunch stays **under one second** even when the tree is large. | Steady-state agent loops should be fast once labeling completes; slowness on every launch means labeling never finished or policy roots keep changing. |
| **Upgrading from an interrupted 0.9.7 (or earlier) label** | Root-only DACL probes could skip a partial tree, leaving `.exe` files without execute permission. | Reset ACLs on the affected tree (`icacls <root> /reset /T /C`) or delete matching files under `%LOCALAPPDATA%\FinSAFE\label-complete\`, then run once with `FINSAFE_WINSAFE_INHERIT_ROOT_FAIL=0` until labeling completes. |

**Node.js agents:** when the resolved command lives under `node_modules` (for example `node_modules\.bin\…`), FinSAFE auto-grants read+execute on that `node_modules` tree under AppContainer (same size-guard exemption as Python venvs). Do **not** list the whole checkout in `read_write_paths` when the launcher path is enough.

| Variable | Default | Effect |
|----------|---------|--------|
| `FINSAFE_WINSAFE_INHERIT_ROOT_WARN_LIMIT` | `10000` | Immediate-child count at/above this triggers the large-tree guard (walk is capped at this limit). |
| `FINSAFE_WINSAFE_INHERIT_ROOT_FAIL` | `1` (fail closed) | `0` = warn and apply inheritable ACLs anyway (one-time labeling). Does **not** skip labeling — only downgrades the size guard from abort to warning. |

**ProjFS:** optional advanced path for AppContainer + large runtime trees. `setup-windows` may exit **3010** when a reboot is required after enabling Client-ProjFS; `doctor` reports this as a **warning** (RestrictedToken / typical Hermes does not need ProjFS).

Regression coverage: `scripts/dev/run-windows-acceptance.ps1` suite `inherit-guard` case *inherit-relaunch-fast* (second launch on the same labeled directory must complete in &lt;3 s).

### Egress proxy observability (allowlist mode)

When `finsafe-net-proxy` enforces an allowlist, operators can enable:

| Variable | Effect |
|----------|--------|
| `FINSAFE_NET_PROXY_AUDIT_LOG=1` | Emit one JSON line per proxy decision to stderr (`finsafe_net_proxy_audit …`). |
| `FINSAFE_NET_PROXY_TRACE=1` | Verbose proxy trace on stderr (debugging only). |

Rate limiting is applied inside the proxy; blocked requests record reasons such as `rate_limit_global` or `rate_limit_domain:<host>` in the audit envelope when auditing is enabled.

### Path templates (`${HOME}`, `~/`, `${XDG_CONFIG_HOME}`, `${USERPROFILE}`)

String entries inside `filesystem.*_paths` (including `protected_read_only_paths`, `deny_read_paths`, and `allow_unix_socket_paths`) support:

- **Braced placeholders:** `${HOME}`, `${XDG_CONFIG_HOME}`, `${USERPROFILE}`
- **Leading tilde:** `~` or `~/subdir` (resolved from `HOME`, or `USERPROFILE` on Windows)

Shell forms like `$HOME/bin` (no braces) and `%USERPROFILE%\bin` are **not** expanded—use `${HOME}/bin` or `~/bin`.

- Substitution runs when FinSAFE parses the YAML/JSON (the **`finsafe` process environment** — not implicitly from the eventual child `argv`). Managed-mode bundles keep templates on the wire; each device expands at `finsafe run` time.
- **`policy_digest`** is still computed over the **raw policy file bytes**. Templates are deliberate portability affordances without changing offline digest equality.
- **`${XDG_CONFIG_HOME}`** falls back to `${HOME}/.config` when the variable is absent (POSIX desktop convention). Set `GH_CONFIG_DIR` in the Hermes/GitHub CLI process if auth files live elsewhere (point your policy paths at that resolved directory literal or export `XDG_CONFIG_HOME` accordingly before launching `finsafe`).

## Declarative rule

The wrapper policy names **intent** (network posture, path classes, resources)—not individual kernel mechanisms. The CLI and runtime map intent to Bubblewrap, cgroup, seccomp, Landlock, or Seatbelt as appropriate for the host.

## Audit envelope (conceptual)

Every wrapper invocation should record (in JSON or logs, depending on mode):

- `wrapper_policy_digest` — SHA-256 over the policy bytes the operator supplied.  
- `resolved_host_profile` — chosen host posture after resolution.  
- `selected_backend` — whether the payload compiled toward **`run`** (`ExecutionSpecV1`-class) or **`self-confine`**.  
- `fallback_used` / `fallback_reason` — when posture selection degraded.

Exact field names and nesting follow the FinSafe version you run; use `finsafe run --json` with a test command to inspect the envelope your build emits.

## Diagnosing sandbox failures on macOS

### macOS `--audit` (diagnostic capture)

`finsafe --audit` on **Linux** uses seccomp permissive mode (syscalls allowed,
logged to kernel audit). On **macOS**, `sandbox-exec` has no native
permissive/log-only mode. Global `--audit` instead runs the **same enforce
profile** (`seatbelt_mode: diagnostic` in attestation; same
`seatbelt_profile_digest` as enforce) and streams kernel Sandbox `deny(...)`
events during the run. After exit, FinSAFE prints suggested
`filesystem.read_only_paths` / `read_write_paths` additions on stderr.

The command may still fail on the first denial — that is expected. The value is
actionable path discovery, not allowing the workload to complete.

### `finsafe-trace` (engine source checkout only)

Some FinSAFE engine checkouts ship `scripts/dev/finsafe-trace.sh` for bisecting Seatbelt profiles via `FINSAFE_SANDBOX_EXEC`. It is **not** part of the public `finogeeks/finsafe` release tree. Prefer built-in **`finsafe --audit`** and **`finsafe learn`** on released binaries.

**Built-in CLI (recommended):**
```bash
finsafe --audit --policy my-agent.yaml run -- hermes --print "hello"
```

See also [isolation-audit-mode.md](isolation-audit-mode.md) for the cross-platform `--audit` contract and how to save JSON envelopes for `finsafe explain`.

### Policy iteration loop (macOS / Linux / Windows)

**`finsafe learn`** captures denials and writes reviewable YAML:

```bash
finsafe learn -- my-agent --print "hello"          # → ./learned-policy.yaml
finsafe --policy ./learned-policy.yaml run -- my-agent --print "hello"
finsafe learn --base ./learned-policy.yaml -- …    # merge new grants
```

On **Windows**, `learn` keeps AppContainer enforcement and ingests ETW
`etw_audit:` lines plus child stdout markers (`blocked_write_denied`, etc.).
Use `--audit run` for inline stderr remediation on the same evidence.

**Manual / audit-only loop** (when you already have a policy file):

```
finsafe run → fails
       ↓
finsafe --audit run → shows denied paths + suggested YAML (or finsafe-trace on macOS)
       ↓
finsafe explain envelope.json   # post-mortem from saved JSON (see USER-GUIDE.md)
       ↓
edit wrapper YAML (add paths / skip_default_deny_read)
       ↓
finsafe run → repeat until clean
```

On Linux, `finsafe --audit run -- cmd` also runs seccomp permissive so the
command may complete while syscall misses are logged. On macOS, `--audit` keeps
Seatbelt enforcement and streams kernel deny events (`seatbelt_mode: diagnostic`).
On Windows, `--audit` prefers Learning Mode deny-and-record capture when available
(Win11 24H2+; see `finsafe probe`), otherwise ETW capture and marker hints, without weakening
AppContainer enforcement.
