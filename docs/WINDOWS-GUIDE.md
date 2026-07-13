# FinSafe on Windows (desktop)

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
| **ProjFS** (`Client-ProjFS`) | Optional: AppContainer + large `venv` / `node_modules` projection | May reboot once (exit **3010**). **Not** required for typical Hermes / `network: host` |

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
| **Deny-read / secrets** | Built-in confidential deny-read **skipped** | Supported (DACL deny-read) |
| **Network fence (WFP)** | Not the primary story for host networking | Used for none / allowlist |
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
| ProjFS not ready / `restart_required` | **Warning** (not a hard error) | Skip reboot unless you use AppContainer + large runtime projection |
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

- Short-lived tools → `finsafe run` + `program_mode: short-lived`
- Interactive brokers in a real terminal → `finsafe self-confine` (Live ConPTY under AppContainer **and** RestrictedToken when available)
- Opt-in unsandboxed broker (tools still sandboxed) → `broker_confine: tools-only` (see `hermes-interactive-tools-only.yaml`)
- Agent-focused notes → [agent-sandbox-guide.md § Windows agents](agent-sandbox-guide.md)

---

## 5. AppContainer-only: large trees and ProjFS

Skip this section if you stay on RestrictedToken / `network: host`.

AppContainer must place inheritable Package SID ACLs (and a Low integrity label) on every filesystem root FinSAFE uses (`work_dir`, `read_only_paths`, `read_write_paths`). Listing an entire agent checkout or a huge `node_modules` tree in those fields can:

1. Hit the large-tree guard (default ≥ **10 000** immediate children) and **refuse** labeling, or
2. Spend minutes labeling under EDR/DLP if you force it

Prefer:

1. **Narrow paths** — only directories the workload needs
2. **RestrictedToken** for host-network agents that only need write allowlisting
3. **ProjFS projection** for large runtime trees under AppContainer (`setup-windows`; reboot only if exit **3010** / `restart_required`)

Deep table, env vars (`FINSAFE_WINSAFE_INHERIT_ROOT_*`), and interrupted-label recovery: [POLICY-QUICKREF.md § Windows AppContainer: large roots](POLICY-QUICKREF.md).

---

## 6. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| UAC / permission prompt on first use | `setup-windows` registering helper / WFP | Accept once; re-run `finsafe setup-windows` if interrupted |
| `doctor` warns about helper | Helper service not running | `finsafe setup-windows`; needed for none/allowlist |
| `doctor` warns about ProjFS / reboot | Client-ProjFS enabled but reboot pending, or feature missing | Ignore for RestrictedToken Hermes; reboot only for AppContainer + large projection |
| `refusing to apply inheritable AppContainer ACLs` | Policy root is a huge tree | Narrow paths, switch to RestrictedToken, or use ProjFS — see §5 |
| First AppContainer launch is very slow | One-time ACL labeling | Let it finish; do not interrupt. Prefer ProjFS / narrower paths |
| Hermes cannot read `.env` / credentials under AppContainer | Built-in or explicit deny-read | Use RestrictedToken example, or set `skip_default_deny_read: true` after review |
| Nested `cmd /c …` prints nothing | Stdio path / older regression | Upgrade to **0.9.7+**; non-interactive console hosts use PipeCapture |
| `network: none` connect still succeeds | Helper / WFP not ready | `setup-windows`, then `probe --json` / acceptance fence checks |
| Managed / enterprise posture fails on RestrictedToken | Fleet requires AppContainer | Use AppContainer + helper; signed bundles must not treat RT as AC parity |

Policy iteration (`learn` / `explain` / `--audit`) works on Windows; `learn` keeps AppContainer enforcement and ingests ETW-derived denials. Workflow: [USER-GUIDE.md § Creating and iterating policies](USER-GUIDE.md).

---

## 7. Related docs

| Doc | Role |
|-----|------|
| [USER-GUIDE.md](USER-GUIDE.md) | Cross-platform CLI (`run` / `self-confine` / learn) |
| [POLICY-QUICKREF.md](POLICY-QUICKREF.md) | Backend table + AppContainer large-tree reference |
| [agent-sandbox-guide.md](agent-sandbox-guide.md) | Hermes / agent recipes |
| [README.md](../README.md) | Install one-liners and release archives |
| [CHANGELOG.md](../CHANGELOG.md) | Windows-specific fixes by version |
