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
| `degrade.allow_fallback` | When `false`, FinSafe fails closed if the strictest posture cannot be applied. When `true`, explicit fallback may be allowed and audited. |
| `degrade.prompt_on_macos_arm64_missing_apple_container` | **Deprecated / ignored** for native macOS Seatbelt wrapper flows; omit in new files. Legacy files may still include it. |
| `audit.require_policy_digest` | Refuse to start unless the wrapper policy digest is recorded in the audit envelope. |
| `audit.require_resolved_posture` | Refuse to start unless resolved host posture is recorded. |
| `stdio.mode` | Child stdio for **`run`**: `capture`, `inherit`, `null`, or `pty`. Text-mode runs default from this when set; `--json` often implies capture unless overridden. On **Linux**, **`pty`** allocates a virtual pseudo-terminal so tools that open **`/dev/tty`** (for example `vim`, `less`, password prompts, or Git hooks) work inside the sandbox without host TTY passthrough. Override per invocation with **`finsafe run --stdio pty`**. **`inherit`** on Linux does not grant a controlling terminal inside bubblewrap. |
| `macos_seatbelt.deny_outbound_ports` | Optional list of TCP ports to deny in the Seatbelt profile even when `network: host` (coarse control; not per-domain filtering). |
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
| `network` (allowlist) | YAML: `network:\n  allowlist:\n    domains: [example.com]`. Requires egress `finsafe-net-proxy` + `proxy_cell` at launch; effective mode `allowlist`. |
| `tls_terminate` | When `true` (wrapper root or `network.tls_terminate`), the egress proxy **decrypts HTTPS** for L7 filtering and richer `proxy_egress` audit (`tls_terminated`, method/path). Requires commercial license feature **`mitm_tls_terminate`** on the authority, an authority **inspection CA** embedded in published bundles (`inspection_ca_cert_pem`), and the agent-installed CA under the managed cache. Children receive trust-store env vars (`SSL_CERT_FILE`, `CURL_CA_BUNDLE`, `NODE_EXTRA_CA_CERTS`, …) pointing at the inspection cert. **Compliance:** users must be informed that HTTPS is inspected. |
| `start_internal_proxy` | When `true`, `finsafe run` / `finsafe self-confine` may start a bundled loopback forward proxy on **`127.0.0.1:60080`** (same range as Windows WFP `permit-loopback`) instead of requiring a separate `finsafe-net-proxy` UDS. Pair with `network: allowlist` and usually `tls_terminate: true` for managed HTTPS inspection. |
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

### Windows AppContainer: large `read_only_paths` / `read_write_paths` roots

**Linux/macOS do not have this behavior.** Landlock and Seatbelt apply path rules without walking every file under a policy root or calling per-file `SetNamedSecurityInfoW`. The notes below are **Windows-only**.

Windows AppContainer needs an **inheritable** DACL (Package SID ACE) and a **Low mandatory integrity label** on each filesystem root FinSAFE uses: `work_dir`, every `read_only_paths` entry, and every `read_write_paths` entry. Child processes inherit those ACLs; FinSAFE must materialize them on the root (and, on first launch, may touch descendants when applying inheritable grants).

| Phase | What happens | Operator impact |
|-------|----------------|-----------------|
| **First launch** on a large tree (default guard: ≥ **10 000** immediate children under a policy root) | FinSAFE **refuses** by default (`refusing to apply inheritable AppContainer ACLs`) to avoid multi-minute ACL storms (worse under endpoint DLP/EDR that intercepts every `SetNamedSecurityInfoW`). | **Narrow paths** — do not put an entire agent checkout, project root, or tree containing `node_modules` in `read_only_paths` / `read_write_paths`. List only directories the workload truly needs. |
| **First launch** when you accept the one-time cost | Set `FINSAFE_WINSAFE_INHERIT_ROOT_FAIL=0` for a **single** labeling run (expect warnings). After labels exist, unset it so later misconfigurations still fail closed. | Use a maintenance window; prefer narrowing paths over labeling a 10k+ tree. |
| **Repeat launch** on the **same** already-labeled roots | FinSAFE skips the large-tree guard when the root already has inheritable Package ACE + Low-IL posture, and skips redundant `SetNamedSecurityInfoW` when grants are satisfied. Typical relaunch stays **under one second** even when the tree is large. | Steady-state Hermes / `finsafe run` loops should be fast once roots are labeled; slowness on every launch usually means paths are not yet labeled or policy roots keep changing. |

| Variable | Default | Effect |
|----------|---------|--------|
| `FINSAFE_WINSAFE_INHERIT_ROOT_WARN_LIMIT` | `10000` | Immediate-child count at/above this triggers the large-tree guard (walk is capped at this limit). |
| `FINSAFE_WINSAFE_INHERIT_ROOT_FAIL` | `1` (fail closed) | `0` = warn and apply inheritable ACLs anyway (one-time labeling). |

**Not a production workaround:** `windows.backend: restricted_token` is experimental and not GA; it does not replace AppContainer ACL labeling for large read-only trees.

Regression coverage: `scripts/dev/run-windows-acceptance.ps1` suite `inherit-guard` case *inherit-relaunch-fast* (second launch on the same labeled directory must complete in &lt;1 s).

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
