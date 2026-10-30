# FinShield on Windows (desktop)

**中文:** [WINDOWS-GUIDE-zh.md](WINDOWS-GUIDE-zh.md)

This is the **operator onboarding** page for Windows 10/11 desktop. Field-level policy detail stays in [POLICY-QUICKREF.md](POLICY-QUICKREF.md); cross-platform CLI basics stay in [USER-GUIDE.md](USER-GUIDE.md).

Unlike Linux (bubblewrap) and macOS (Seatbelt), Windows has **two launch backends**. Choosing the wrong one is the main source of setup confusion (helper prompts, ProjFS reboot warnings, multi-minute ACL labeling).

---

## 1. Install once

Preferred:

```powershell
irm https://raw.githubusercontent.com/finogeeks/finsafe/main/install.ps1 | iex
```

What the installer does:

1. Installs `finsafe.exe` and `finsafe-winhelper.exe` on your `PATH`
2. Runs **`finsafe setup-windows` once** (Windows may show a single permission / UAC prompt — that is normal)

Manual install: unpack the Windows archive from [Releases](https://github.com/finogeeks/finsafe/releases), keep both binaries in the same directory, then:

```powershell
finsafe setup-windows
```

`setup-windows` provisions:

| Piece | Required for | Notes |
|-------|----------------|-------|
| **finsafe-winhelper** service | `network: none` / allowlist (WFP fence), managed fleet | `doctor` warns if missing |
| **ProjFS** (`Client-ProjFS`) | Optional: AppContainer + large `venv` / `node_modules` projection | `setup-windows` enables the feature without a reboot when `prjflt` can start. Reboot only if `probe` reports `restart_required`. **Not** required for typical Hermes / `network: host`. Install manually: `Enable-WindowsOptionalFeature -Online -FeatureName Client-ProjFS -NoRestart` (Admin) |

---

## 2. Pick a backend (decision tree)

```text
Do you need network: none / allowlist, confidential deny-read,
managed fleet, or explicit windows.backend: appcontainer?
        │
        ├─ YES ──► AppContainer (stronger)
        │
        └─ NO (typical Hermes / network: host desktop)
                 └──► RestrictedToken (default under Auto)
```

| | **RestrictedToken** | **AppContainer** |
|--|---------------------|------------------|
| **When (Auto)** | `network: host` + empty YAML `deny_read_paths` | `network: none` / allowlist, any YAML `deny_read_paths`, managed fleet |
| **Pin** | `windows.backend: restricted_token` | `windows.backend: appcontainer` |
| **Reads** | Host-wide (same user identity for most reads) | Package SID + DACL grants only |
| **Writes** | Deny-by-default; allow `read_write_paths` (+ cwd) | DACL grants on declared roots |
| **Deny-read / secrets** | Explicit deny-read is unsupported | Explicit effective-YAML deny-read is supported (DACL deny-read) |
| **Network fence (WFP)** | Not the primary story for host networking | Used for none / allowlist. Operator (enabled `finsafe-net`) stays online; FAIL is deny-only `WSAEACCES` on the child/probe |
| **Large `venv` / `node_modules`** | No recursive ACL walk; **no ProjFS** | Prefer ProjFS projection; listing whole trees in policy can trigger ACL storms |
| **Attestation** | `windows_restricted_token`, `degraded_execution=true` | `windows_appcontainer` |
| **Hermes example** | [`hermes-windows-oneshot.yaml`](../examples/wrapper-policies/hermes-windows-oneshot.yaml) | [`hermes-windows-oneshot-appcontainer.yaml`](../examples/wrapper-policies/hermes-windows-oneshot-appcontainer.yaml) |

**Rule of thumb:** start with RestrictedToken for agent CLIs that need normal host networking and a Python/Node install. Switch to AppContainer when you need locked-down network or confidential deny-read.

There is also an explicit weaker compatibility pin (`windows.backend: write_restricted`) for hosts that need RestrictedToken-family write allowlisting without AppContainer. Prefer Auto / RestrictedToken unless you know you need that pin. See [POLICY-QUICKREF.md § Windows backends](POLICY-QUICKREF.md).

---

## 3. Verify the host

```powershell
finsafe probe
finsafe doctor
# JSON for automation:
finsafe probe --json
finsafe doctor --json
```

How to read common signals:

| Signal | Severity for typical Hermes | What to do |
|--------|----------------------------|------------|
| Helper not running | Warning if you only use `network: host` | Run `finsafe setup-windows` before none/allowlist policies |
| ProjFS not ready / `restart_required` | **Warning** (not a hard error) | RestrictedToken can ignore it. For AppContainer + large projection, re-run `setup-windows` and confirm `projection_smoke_works`; reboot only if `restart_required` stays true |
| `appcontainer_works=false` | Blocks AppContainer Auto paths | Use RestrictedToken for host agents, or fix OS / enterprise policy that disables AppContainers |

---

## 4. First successful runs

Create a workspace (many examples expect `./workspace` as the writable root):

```powershell
New-Item -ItemType Directory -Force -Path workspace | Out-Null
```

Smoke (any backend that matches the policy):

```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/windows-version-smoke.yaml -OutFile windows-version-smoke.yaml
finsafe --policy .\windows-version-smoke.yaml run -- cmd /c ver
```

Hermes (recommended default — RestrictedToken):

```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/hermes-windows-oneshot.yaml -OutFile hermes-windows-oneshot.yaml
finsafe --policy .\hermes-windows-oneshot.yaml run -- hermes --version
```

Stronger Hermes (AppContainer):

```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/hermes-windows-oneshot-appcontainer.yaml -OutFile hermes-windows-oneshot-appcontainer.yaml
finsafe --policy .\hermes-windows-oneshot-appcontainer.yaml run -- hermes --version
```

Interactive Hermes session (RestrictedToken + `self-confine`, run from a real
terminal — Windows Terminal or an interactive PowerShell window):

```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/hermes-windows-interactive.yaml -OutFile hermes-windows-interactive.yaml
finsafe --policy .\hermes-windows-interactive.yaml self-confine -- hermes
```

FinShield stays resident as the supervisor. The broker shares your console
(per-key input, colors, live TUI redraws, and window resizes go straight to
the broker). **Ctrl+C goes to Hermes; Ctrl+Break kills the whole session.**
Set `FINSAFE_WIN_PTY_MODE=live` only when an embedded host needs FinShield to be
the terminal host. Do not reuse the oneshot policy for `self-confine` — it is
`program_mode: short-lived` and carries a 120 s timeout that would end a live
session.

- Short-lived tools → `finsafe run` + `program_mode: short-lived`
- Interactive brokers in a real terminal → `finsafe self-confine` (the broker shares your console)
- Opt-in unsandboxed broker (tools still sandboxed) → `broker_confine: tools-only` (see `hermes-interactive-tools-only.yaml`)
- Agent-focused notes → [agent-sandbox-guide.md § Windows agents](agent-sandbox-guide.md)

> **Note on git-bash / MSYS2 (Cygwin) agents:** Git for Windows `bash.exe` as the
> **direct** RestrictedToken payload is supported by granting FinShield capability
> SIDs on the existing SID-named shared-memory object (`CreateFileMapping
> S-1-5-21-….n`) and adding the operator SID as a restricting SID (public
> [#29](https://github.com/finogeeks/finsafe/issues/29)). Hermes tools, `cmd /c
> bash`, and other **child** git-bash processes need an explicit
> `windows.msys2_child_ipc: true` (public
> [#34](https://github.com/finogeeks/finsafe/issues/34)). That opt-in puts the
> operator SID in restricting SIDs for the **whole** token, so NTFS write
> allowlisting does **not** apply to user-owned files for that session. The
> shipped `hermes-windows-oneshot.yaml` / `hermes-windows-interactive.yaml`
> examples set it. Default RestrictedToken (flag omitted) keeps the write
> allowlist; child bash then dies in Cygwin init (Win32 5). AppContainer is a
> different token and is still not a git-bash path. This is not
> `SeCreateGlobalPrivilege`. **Do not** set `windows.msys2_child_ipc` on the
> WorkBuddy GUI app seam: Git Bash is hook DENY there; the C7 language path is
> PowerShell → python/node. `finsafe app attach` writes CodeBuddy
> `permissions.deny: ["Bash"]`, `CODEBUDDY_CODE_SHELL=powershell`,
> `CODEBUDDY_DISABLE_SHELL_SNAPSHOT=1` into **both** USER homes; prepared
> AppContainer attach also writes `CODEBUDDY_SAFE_DELETE_ENABLED=1` and
> `sandbox.safeDeleteRuntimeEnabled: true`:
> `.workbuddy/settings.json` (Desktop) and `.codebuddy/settings.json` +
> `settings.local.json` (bare CLI) (see §6).

---

### Shared configuration for AppContainer HTTPS inspection

The AppContainer HTTPS candidate has been tested with one fixed configuration
for its Windows `finsafe run` commands. It does not change while runs are
active. Existing `network.mode: proxy` and `tls_terminate` settings select proxy
routing and TLS inspection; no additional configuration entry is required.

CA injection and persistent Inspector reuse use this shared configuration.
Different policy permissions for individual runs within one domain, dynamic policy
changes, and additional isolation between those runs are deferred. Existing
AppContainer confinement and configured network rules remain in effect.

Inspector does not admit proxy requests by application PID or require child-process
registration. Each run receives a loopback-only proxy endpoint with that run's audit
metadata. Children can use the inherited proxy and CA environment. This endpoint
does not authenticate the source process or isolate permissions between local
processes. Core and Explicit retention use the same user/domain store, visible in
desktop Records.

Windows uses one ordinary-user Inspector per **user SID +
`security_domain_id` within one Windows logon**. Core and ordinary/tool runs in
that domain share its fixed inspection configuration. WorkBuddy and DSH in the
same domain can run at the same time through the existing Inspector; starting
one does not require exiting the other. Different domains use independent
Inspectors, CA material, and lifetime resources. Node Guard keeps its
network adapter; Core exit releases its attachment and does not stop Inspector.
Admitted AppContainer self-confine also uses this host. Standard HTTP forward
requests and HTTPS CONNECT use the same engine with TLS inspection enabled or
disabled. Future Transparent attachment is not implemented. See the
[verification results and limits](../../design/windows-appcontainer-https-inspection.md#103-migration-verification)
before making application compatibility claims.

## 5. Dedicated home, large trees, and ProjFS

### Dedicated FinShield home (RestrictedToken)

Do **not** skip this subsection if you stay on RestrictedToken / `network: host`.
RestrictedToken launch-time grants **refuse** volume roots, `%USERPROFILE%`,
`%APPDATA%` / `%LOCALAPPDATA%` roots, and Electron `userData` product folders
(for example `%APPDATA%\…`). Use a dedicated sandbox home under
`%LOCALAPPDATA%\FinSAFE\...` instead of listing `userData` in `read_write_paths`
or as `work_dir`. WorkBuddy catalog (#375) additionally grants
`%LOCALAPPDATA%\CodeBuddyExtension` with a **NoWalk** ACE (not TreeSet, not
Electron `userData`); other AppData product folders stay refused.

Prepared AppContainer access (`finsafe prepare` plus an installed effective
YAML) is a different lifecycle: explicitly configured volume and profile roots
are accepted, and receipt-backed `unprepare` restores the original ACL. Broad
access must still be explicit in effective YAML; app cwd/chdir does not add it.

**RestrictedToken and pre-existing files:** WRITE_RESTRICTED sets a
directory-inheritable ACE on the home directory only (`DirectoryInheritableNoWalk`).
It does **not** rewrite existing descendants. The agent can create **new** files
that inherit the capability SID, but it **cannot modify pre-existing files or
subdirectories** unless those objects already carry that SID. Point the policy at
a dedicated **empty** `%LOCALAPPDATA%\FinSAFE\...` home — do not copy a fat
`userData` tree into that home and expect writes to succeed.

### AppContainer-only: large trees and ProjFS

Skip **this** subsection if you stay on RestrictedToken / `network: host`
(the dedicated-home rule above still applies).

AppContainer filesystem authority comes from the installed effective YAML, not from a
wrapper policy at launch. Run `finsafe prepare` after adding the required persistent
boundaries; `run` and `self-confine` only consume that prepared authority and never add
or repair ACLs. Explicit volume and profile roots are accepted when configured in the
effective YAML, and `unprepare` restores receipt-backed changes. Preparing a very large
physical tree can still take minutes under EDR/DLP, so prefer:

1. **Narrow paths** — only directories the workload needs
2. **RestrictedToken** for host-network agents that only need write allowlisting (still use a dedicated empty FinShield home)
3. **ProjFS projection** for large runtime trees under AppContainer (`setup-windows`; reboot only if `finsafe probe --json` reports `restart_required`). To enable ProjFS manually:

   ```powershell
   # Requires Administrator
   Enable-WindowsOptionalFeature -Online -FeatureName Client-ProjFS -NoRestart
   ```

   Verify with `finsafe probe --json | ConvertFrom-Json | Select-Object -ExpandProperty projfs`.

Preparation lifecycle and interrupted-preparation recovery: [POLICY-QUICKREF.md § Windows AppContainer: large roots](POLICY-QUICKREF.md).

---

## 6. App seams (experimental)

An **app seam** is a place in an installed GUI agent where FinShield can change
behaviour without editing the vendor's signed binaries. Phase 1 uses the
app's **bundled bootstrap script**: `finsafe app attach` replaces that script
with a FinShield shim, writes a guard file beside it, and keeps a byte-for-byte
backup of the original (relative names next to the seam:
`<seam>.finsafe-orig` and `<seam>.finsafe-guard.js`). This is
**experimental**, not a supported product mode. On Linux and macOS,
`finsafe app` exits 78.

```powershell
finsafe app list
finsafe app doctor <integration-id>
finsafe app attach <integration-id>
finsafe app status
finsafe app detach --all
```

**Run `finsafe app detach --all` before deleting or replacing `finsafe.exe`.**
If the binary is gone while a seam is still attached, the seam is
**orphaned** (D14): in personal mode the shim runs the original unguarded and
appends to a local log. **No user notification is guaranteed** for an
orphaned seam (no toast is promised). That is a broken state, not a
supported mode.

### What Phase 1 does and does not guarantee

| Layer | Phase 1 | Tier (D16) |
|-------|---------|------------|
| Core process | Write scope and configured deny-read through Node `fs`; Job teardown and resource limits | **User-mode** guard + Job. There is **no** kernel filesystem boundary on the core. |
| Spawned tools (children) | The selected effective YAML supplies concrete roots and narrow runtime globs such as `codebuddy-*` and `workbuddy-*`; the only runtime addition is the native AppContainer profile `Temp`. FakeAgent does not add the session cwd or chdir targets. | **Kernel** AppContainer plus prepared path ACLs |
| Deny-read / confidential paths | Effective-YAML deny rules are applied to the shared AppContainer SID and are also enforced cooperatively for Node `fs` calls in the core. | **Kernel** for children; **user-mode** on the core |
| Egress allowlist | **No** (audit only) | — (Phase 2) |

Do not read “attached” as “the whole GUI-agent tree is kernel-sandboxed.” The
core still runs with the user's full token; the kernel write boundary is the
children. FakeAgent fixture proof is not WorkBuddy G2.

WorkBuddy’s model **Bash** tool is Git Bash (MSYS2), not `cmd`. The seam
**denies** `bash` / `git-bash` / `mintty` at `CreateProcessW`. That is
intentional: enabling `windows.msys2_child_ipc` would drop NTFS write
allowlisting for the session and is **forbidden** on this catalog.
`finsafe app attach` writes the same overlay into **both** USER homes
(`%USERPROFILE%\.workbuddy\settings.json` for Desktop SettingsManager, and
`%USERPROFILE%\.codebuddy\settings.json` + `settings.local.json` for bare CLI)
plus an existing project `.codebuddy/` overlay under the attach cwd or
`%USERPROFILE%\WorkBuddy`: `permissions.deny: ["Bash"]`,
`CODEBUDDY_CODE_SHELL=powershell`, `CODEBUDDY_DISABLE_SHELL_SNAPSHOT=1`,
and, for prepared AppContainer attach only, `CODEBUDDY_SAFE_DELETE_ENABLED=1`
plus `sandbox.safeDeleteRuntimeEnabled: true` (keeps
`sandbox.extraAllowWrite` / claw / plugins). A project overlay
created after attach can still later-win. Detach restores every layer from the
first-attach snapshot. Attach reports `restart_needed` so `--prewarm` /
`--serve` re-read settings. Do not set `CODEBUDDY_CODE_SHELL=cmd`. This is a
product-config workaround, not Git Bash inside RestrictedToken.

---

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| UAC / permission prompt on first use | `setup-windows` registering helper / WFP | Accept once; re-run `finsafe setup-windows` if interrupted |
| `doctor` warns about helper | Helper service not running | `finsafe setup-windows`; needed for none/allowlist |
| `doctor` warns about ProjFS / reboot | Client-ProjFS missing, smoke failed, or a *pending* reboot | Ignore for RestrictedToken Hermes; re-run `setup-windows` and trust `probe` (`Restart Required : Possible` is not a reboot). Reboot only if `restart_required` is true |
| `doctor` names an over-cap inherit root | Wrapper-policy tree exceeds `FINSAFE_WINSAFE_INHERIT_ROOT_WARN_LIMIT` | Narrow the wrapper path. If broad persistent AppContainer access is intentional, add the boundary to the installed effective YAML and run `finsafe prepare`; prepare does **not** consume the wrapper policy, and explicit prepared boundaries may cover broad roots — see §5 |
| `refusing to apply inheritable` + `product folder` / `userData` | A RestrictedToken `read_write_paths` / `work_dir` root is an AppData product folder | Use a dedicated empty home under `%LOCALAPPDATA%\FinSAFE\...` — see §5 |
| RestrictedToken agent cannot write existing files in the home | `DirectoryInheritableNoWalk` does not rewrite pre-existing descendants | Create a **new empty** `%LOCALAPPDATA%\FinSAFE\...` home; new files inherit the capability ACE. Do not copy a populated `userData` tree into that home |
| AppContainer launch says the launch-image bucket is not covered | `{userData}\sandbox-images\<digest>` lacks prepared Package-SID read/execute rights | Add a `read_only` or `read_write` boundary covering the staging location to the installed effective YAML, then run `finsafe prepare`. Launch verifies the effective DACL and never repairs it |
| Hermes cannot read `.env` / credentials under AppContainer | An explicit effective-YAML deny-read rule | Review and change that YAML rule, or use the RestrictedToken example when host-wide read is intended |
| `self-confine` exits `0xC0000142` / `STATUS_DLL_INIT_FAILED` (RestrictedToken) | Pre-0.9.15 spawn path | Upgrade to **0.9.15+** (Live ConPTY default); or `FINSAFE_WIN_PTY_MODE=pipe` |
| WorkBuddy still offers Bash / `bash.exe` dies with Win32 5 / `0xC0000142` | Git Bash is seam DENY; MSYS2 IPC is not confineable without dropping write allowlisting; a project `.codebuddy/` overlay created after attach can later-win; GUI reads `.workbuddy/settings.json` | Attach writes **both** USER homes (`.workbuddy/settings.json` and `.codebuddy/settings.json` + `settings.local.json`: deny Bash + PowerShell env + `CODEBUDDY_DISABLE_SHELL_SNAPSHOT=1` + safe-delete on) and existing project overlays. Restart WorkBuddy so CodeBuddy re-reads settings. Do **not** set `windows.msys2_child_ipc`. |
| Nested `cmd /c …` prints nothing | Stdio path / older regression | Upgrade to **0.9.7+**; non-interactive console hosts use PipeCapture |
| Operator `network: none` connect still succeeds | Expected: enabled `finsafe-net` keeps the desktop online | Not a fence failure. The AppContainer child and pre-spawn probe use a deny-only `finsafe-net` stamp; FAIL is a successful connect there instead of `WSAEACCES` |
| Deny-only probe / sandboxed child connect succeeds | Helper / WFP not ready, or deny-only stamp failed | `setup-windows`, then `probe --json` / acceptance fence checks (`windows_egress_fence_verified`) |
| Managed / enterprise posture fails on RestrictedToken | Fleet requires AppContainer | Use AppContainer + helper; signed bundles must not treat RT as AC parity |
| GUI agent runs unguarded after FinShield was removed | Orphaned seam: `finsafe.exe` deleted or replaced without `detach` (D14) | Reinstall FinShield and run `finsafe app detach --all`, or restore the vendor bootstrap from `<seam>.finsafe-orig`. **No toast is guaranteed** |

Policy iteration (`learn` / `explain` / `--audit`) works on Windows; `learn` keeps AppContainer enforcement and ingests ETW-derived denials. Workflow: [USER-GUIDE.md § Creating and iterating policies](USER-GUIDE.md).

---

## 8. Related docs

| Doc | Role |
|-----|------|
| [USER-GUIDE.md](USER-GUIDE.md) | Cross-platform CLI (`run` / `self-confine` / learn) |
| [POLICY-QUICKREF.md](POLICY-QUICKREF.md) | Backend table + AppContainer large-tree reference |
| [agent-sandbox-guide.md](agent-sandbox-guide.md) | Hermes / agent recipes |
| [README.md](../README.md) | Install one-liners and release archives |
| [CHANGELOG.md](../CHANGELOG.md) | Windows-specific fixes by version |
