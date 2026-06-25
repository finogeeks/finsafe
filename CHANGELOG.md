# Changelog

User-facing changes for **public** FinSafe CLI and fleet releases on [finogeeks/finsafe](https://github.com/finogeeks/finsafe/releases).

This file is the only public release history. It is maintained in the private FinSAFE monorepo under `docs/public-finsafe/` and synced to the public repository on each release. Private development commits are not copied here automatically.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

## [0.9.9] - 2026-06-25

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **Allow inotify, io_uring, and legacy file syscalls in Linux seccomp profile** (public issue [finogeeks/finsafe#12](https://github.com/finogeeks/finsafe/issues/12), PR [Geeksfino/finsafe#74](https://github.com/Geeksfino/finsafe/pull/74))

## [0.9.8] - 2026-06-24

### Fixed

- **Windows AppContainer large dependency trees (`node_modules`, `venv`, agent checkouts):** Inheritable DACL relabels now use `TreeSetNamedSecurityInfoW` with coarse progress reporting, and only skip repeat work when a **completion sentinel** proves the whole tree was labeled. Fixes interrupted first launches that left the root tagged but descendants without `FILE_EXECUTE` (no execute permission on nested `.exe` files). `FINSAFE_WINSAFE_INHERIT_ROOT_FAIL=0` still only downgrades the size guard — it does not bypass labeling.
- **Windows Node.js agent runtimes:** Auto-detect `node_modules` behind the resolved command target and grant read+execute on that tree (same exemption from the large-tree fail-closed guard as Python venvs).
- **Windows tree DACL FFI:** Correct `TreeSetNamedSecurityInfoW` parameter order and progress-callback signature for Windows 10/11.

## [0.9.7] - 2026-06-23

### Fixed

- **Windows nested `cmd` stdout capture:** Non-interactive AppContainer console hosts (`cmd`, PowerShell) use **PipeCapture** with `CREATE_NEW_CONSOLE` so nested external children (`cmd /c whoami`) capture stdout without `STATUS_DLL_INIT_FAILED` (`0xC0000142`). Restores the stable path after a Buffered ConPTY default regression (PR [Geeksfino/finsafe#72](https://github.com/Geeksfino/finsafe/pull/72)).

### Added

- **Windows launch attestation:** `windows_stdio_strategy` and `windows_creation_flags` on `finsafe run --json` and self-confine reports — the resolved stdio strategy and `CreateProcess` flags for operator diagnostics (distinct from the coarse `windows_pty_mode` label).

## [0.9.6] - 2026-06-23

### Fixed

- **fix(windows): allow cmd.exe to spawn child processes under AppContainer** (public issue [finogeeks/finsafe#10](https://github.com/finogeeks/finsafe/issues/10), PR [Geeksfino/finsafe#68](https://github.com/Geeksfino/finsafe/pull/68))
- **Windows AppContainer nested `cmd` children:** AppContainer pipe-capture console hosts (`cmd`, PowerShell) use `CREATE_NEW_CONSOLE` with inherited pipe std handles so nested external children (`cmd /c whoami`) capture stdout after the desktop-isolation skip (#68). Non-console images keep `DETACHED_PROCESS`.

## [0.9.5] - 2026-06-22

### Fixed

- **Windows AppContainer / Hermes:** Avoid duplicate inheritable DACL work when wrapper policy lists paths that overlap the auto-detected Python venv (`Scripts` / `Lib`). First launch may still label a large `site-packages` tree once; re-launches stay fast. Do not list the venv in `read_only_paths` — see Windows sandbox operator notes.

## [0.9.4] - 2026-06-22

### Added

- **Per-environment egress scoping (#58):** `environment_id` attribution at the proxy boundary, per-environment approval store, and strict fail-closed mode for unattributed requests.
- **Track B (macOS/Windows):** Sandbox-level L7 deny, identity injection, and parent-proxy chain probes; wrapper policy governance fields (`inject_identity`, `l7_rules`, `credential_map`) wired through `internal_proxy`.
- **Docs:** Agent sandbox guides (EN/zh), platform feature matrix, and `finsafe-agent-sandbox-run` skill.

## [0.9.3] - 2026-06-22

### Fixed

- **fix(windows): AppContainer execute grants for read_only/read_write paths** (public issue [finogeeks/finsafe#9](https://github.com/finogeeks/finsafe/issues/9), PR [Geeksfino/finsafe#64](https://github.com/Geeksfino/finsafe/pull/64))

## [0.9.2] - 2026-06-20

### Added

- **Egress L7 governance (Track A):** Identity injection, static L7 rules, token brokering (`network.credential_map`), bounded content audit (schema v4), compile-time threat-intel allowlist augmentation, and parent-proxy `required` fail-closed at proxy launch.
- **Executor → server audit (G11):** `ExecutionRecord.proxy_egress_records` populated after proxied cell runs.
- **Track B (macOS):** HTTPS MITM-through-sandbox probe (`sandbox_exec_mitm_https_via_tcp_loopback_proxy`); CLI `internal_proxy` uses the same `build_proxy_config_from_plan` pipeline as the executor.
- **Docs:** `docs/design/token-transformation.md`, updated governance acceptance matrix (G1–G11).

### Changed

- **Parent proxy:** Bundle-declared `network.parent_proxy` with launch-time reachability probe when `required: true`.

## [0.9.1] - 2026-06-20

### Fixed

- **macOS `finsafe self-confine`:** Seatbelt profile temp files are kept alive until `sandbox-exec` starts, fixing exit 65 (`…/.tmpXXXXXX: No such file or directory`) on interactive wrapper launches (Hermes, agy, and other `program_mode: interactive` policies).

### Added

- **Agent-sandbox examples:** `agy-interactive.yaml` for `self-confine` with agy; updated `agy-oneshot.yaml` with Antigravity IDE auth paths (`~/Library/Application Support/Antigravity`, Keychain, Preferences).
- **Public skill:** `finsafe-agent-sandbox-verify` expanded with R2-seatbelt, self-confine sub-suite, and agy auth gotchas (F11).

## [0.9.0] - 2026-06-20

### Added

- **`finsafe learn` / `finsafe explain`:** Capture sandbox denials and turn them into policy YAML or human-readable explanations on Linux (bubblewrap), macOS (Seatbelt), and Windows (AppContainer wrapper). Inline remediation hints appear on denial paths across platforms.
- **`finsafe init`:** Seeds reference policy examples under the user config directory (`~/.config/finsafe/policies/examples/` on Linux/macOS, `%APPDATA%\FinSAFE\policies\examples\` on Windows). Install scripts now suggest running it after install; it does not auto-select a default policy for `run`.
- **Public docs:** Hermes and OpenCode quick starts, first-run flow, agent-sandbox wrapper examples, and install-path guidance in README and USER-GUIDE (EN/zh).

### Changed

- **Learn output paths:** Default `finsafe learn --out` writes to `policies/learned-policy.yaml` under the FinSAFE user config root via `policy_paths`.
- **CLI:** Removed the experimental `finsafe learn --agent` flag until an agent registry exists; `run --high-level --agent <id>` remains for scheduler identity only.

## [0.8.17] - 2026-06-17

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **fix(windows): split sc.exe keyword args for setup-windows service create** (public issue [finogeeks/finsafe#7](https://github.com/finogeeks/finsafe/issues/7), PR [Geeksfino/finsafe#55](https://github.com/Geeksfino/finsafe/pull/55))

## [0.8.16] - 2026-06-17

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **fix(windows): skip inheritable relabel when work_dir is under Program Files** (public issue [finogeeks/finsafe#8](https://github.com/finogeeks/finsafe/issues/8), PR [Geeksfino/finsafe#54](https://github.com/Geeksfino/finsafe/pull/54))

## [0.8.15] - 2026-06-17

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **fix(windows): AppContainer DACL grants without Write Owner; winhelper fallback** (public issue [finogeeks/finsafe#5](https://github.com/finogeeks/finsafe/issues/5), PR [Geeksfino/finsafe#53](https://github.com/Geeksfino/finsafe/pull/53))

## [0.8.14] - 2026-06-16

### Fixed

- **Windows AppContainer System32 console hosts (`cmd.exe`, `powershell.exe`):** Launching a system-owned binary under AppContainer no longer wedges for minutes on hosts with Defender tamper-protection or EDR file filters. The launcher was applying redundant ancestor and volume-root traverse grants via `SetNamedSecurityInfoW` to `C:\Windows\System32`, `C:\Windows`, and `C:\`; those directories already grant `ALL APPLICATION PACKAGES` read+execute and AppContainer tokens bypass traverse checks. The redundant writes are now skipped, restoring fast (~1s) launches for `finsafe run cmd …` and `finsafe self-confine cmd …`.
- **Windows self-confine ConPTY on headless hosts:** Forced live-ConPTY smokes and teardown paths are more robust on non-TTY CI and automation runners (bounded `ClosePseudoConsole`, buffered capture routing for console hosts under `FINSAFE_SELF_CONFINE_FORCE_PTY`).

## [0.8.13] - 2026-06-16

### Fixed

- **Windows AppContainer `read_write_paths` directory listing and delete:** Sandboxed `cmd /c dir` and `cmd /c del` under paths listed in `filesystem.read_write_paths` no longer fail with Access denied when the child cwd is inside those roots. RW DACL grants now include explicit `FILE_LIST_DIRECTORY` and `DELETE` bits so LowBox checks match what `FindFirstFile` and `DeleteFile` need (public issue #4).

## [0.8.12] - 2026-06-16

### Fixed

- **Windows AppContainer `read_write_paths` directory ops:** Sandboxed `cmd` could create and read files under a declared RW root but `dir` (FindFirstFile) and `del` (DeleteFile) failed with Access denied even when the child cwd matched that root. RW DACL grants now include explicit traverse and delete-child permissions; access-denied hints no longer suggest a missing RW grant when cwd is already inside `read_write_paths`.

## [0.8.11] - 2026-06-13

### Fixed

- **Windows `read_only_paths: ["."]` with `read_write_paths: ["./workspace"]`:** Shell smoke (`cmd /c dir`, PowerShell) keeps the launch directory as the sandboxed child cwd instead of auto-relocating into `./workspace`, so read-only listing of the project root works again. Auto workspace cwd still applies for the common `./workspace`-only smoke case.

## [0.8.10] - 2026-06-12

### Added

- **`finsafe setup-windows`:** One-time Windows host setup for personal desktops. Registers and starts the `finsafe-winhelper` Windows service beside `finsafe.exe`, provisions the network sandbox (`network: none` / allowlist policies), and may show a single Windows permission prompt. `install.ps1` runs this automatically after install.
- **`finsafe doctor` on Windows:** Warns when the helper service is not running and points operators to `finsafe setup-windows` (policies with `network: host`, such as Hermes, do not need this step).

### Fixed

- **Windows network setup errors:** Failures such as `NetLocalGroupAdd(finsafe-net): 5` now include plain-language guidance to run `finsafe setup-windows` instead of opaque Win32 errors alone.
- **`finsafe-winhelper` Windows Service mode:** SCM-started helper no longer forces console mode; dev/acceptance still use `FINSAFE_WINHELPER_CONSOLE=1`.
- **Windows wrapper work-dir / smoke:** Policy `filesystem.*_paths` always resolve from the shell cwd; `--work-dir` only sets the sandboxed child's working directory (fixing `./workspace` double-nesting when both were set to `workspace`). When a policy has a sole relative `read_write_paths` entry (for example `./workspace`), FinSAFE auto-creates the directory, auto-uses it as child cwd for `cmd` / PowerShell smoke runs, and grants read+write on the child cwd when it matches that RW root. Access-denied hints steer operators to `cmd /c echo hello` instead of `cmd /c dir`.

## [0.8.9] - 2026-06-11

### Fixed

- **Windows `stdio.mode: inherit` on interactive consoles:** `finsafe run` with a policy that sets `stdio.mode: inherit` (e.g. policies reused from embedded-host deployments) silently produced no output in interactive PowerShell/cmd sessions on 0.8.8 — even `cmd /c dir` looked broken. The launcher now detects when its own stdout is a console (not a host-owned pipe) and falls back to buffered capture + replay, so output always appears. True passthrough is unchanged for embedded hosts that own pipes; `FINSAFE_WIN_PIPE_INHERIT_FORCE=1` forces passthrough onto a console if you really want it.
- **Windows wrapper text-mode replay:** Captured child output on the wrapper `run` path now replays through the console-aware writer (`WriteConsoleW`), matching the spec `run` path, so localized (OEM-codepage) output renders correctly.

### Added

- **Windows agent runtime auto-grant (Hermes works out of the box):** When the resolved command target lives inside a Python venv (e.g. `hermes.exe` under `…\venv\Scripts\`), FinSAFE now automatically grants the sandbox read+execute on the venv root **and** the base interpreter referenced by `pyvenv.cfg`. Previously such launches died in the loader with `STATUS_DLL_INIT_FAILED` (0xC0000142) unless the policy enumerated venv internals — which then tripped the inheritable-ACL size guard. The first launch labels the runtime tree once and prints a progress line (`finsafe: granting sandbox read access to agent runtime …`); subsequent launches are fast. Volume/profile roots are never auto-granted.
- **`examples/wrapper-policies/hermes-windows-oneshot.yaml`:** Windows policy for one-shot Hermes commands (`hermes --version`, `hermes chat -q …`) — no venv paths, no stdio overrides needed.

## [0.8.8] - 2026-06-11

### Added

- **Windows PipeInherit stdio:** Embedded hosts (e.g. desktop agents speaking JSON-RPC over pipes) can request live bidirectional stdio by setting **`stdio.mode: inherit`** on the CLI `run` path. The sandboxed child inherits the launcher's own standard handles — no ConPTY, no `stdin = NUL`, and no buffer-until-exit capture that deadlocks long-lived agents.
- **Windows stdio design docs:** Public design references for the Windows stdio strategy inventory, MXC comparison, and PipeInherit embedded-host contract.

### Fixed

- **Windows localized cmd output:** PipeCapture decodes OEM-encoded bytes from detached console hosts (e.g. localized `dir` headers) via OEM/ACP fallback instead of lossy UTF-8.
- **Windows acceptance cargo test:** `windows-acceptance` runs `cargo test` with `--no-fail-fast` so one failing crate does not skip `finsafe-winsafe` unit tests.

## [0.8.7] - 2026-06-10

### Changed

- **Windows self-confine live output (Stage 2):** Interactive `self-confine` on a real TTY now streams broker output live through ConPTY pumps under **both** backends, including AppContainer. Previously interactive AppContainer console hosts (`cmd`, PowerShell) were diverted to buffered ConPTY capture, which froze the screen until broker exit and could wedge in conhost teardown (scripts appearing to hang until an external timeout). Non-TTY callers keep pipe capture and replay-after-exit.
- **Bounded ConPTY teardown:** After the broker exits, the live-ConPTY stdout drain is capped at 5 s; a wedged conhost flush is detached (with a `FINSAFE_WIN_LAUNCH_DEBUG=1` diagnostic) instead of hanging the supervisor.

### Fixed

- **Windows self-confine policy timeout:** `self-confine` now honors `resources.timeout_ms` from the compiled execution spec instead of always waiting forever; long-lived brokers still omit the field for an infinite supervisor wait. The `launch_windows_full` timeout parameter is wired through to the child wait (it was previously ignored).
- **Windows inheritable-ACL fast path:** Repeat launches on a tree that already carries inheritable package DACL grants skip the fail-closed large-tree guard even when the low-integrity label probe is inconclusive, matching the idempotent `SetNamedSecurityInfoW` skip in `grant_path`.

### Added

- `FINSAFE_WIN_PTY_MODE=live|buffered|pipe` — diagnostic override for the interactive stdio plumbing if a specific host misbehaves.
- `FINSAFE_SELF_CONFINE_FORCE_PTY=1` — test/diagnostic hook that forces the ConPTY path without a TTY; used by the Windows acceptance suite to exercise pseudoconsole attach + teardown under AppContainer.

### Known gaps

- Non-interactive `self-confine` with console hosts (`cmd`, PowerShell) on headless Windows runners can still wedge for minutes in some CI environments. CI skips the optional `cmd /c echo` smoke by default (`FINSAFE_WIN_ACCEPTANCE_SELF_CONFINE_CMD=1` for local runs). Interactive TTY launches use live ConPTY (Stage 2).

## [0.8.6] - 2026-06-10

### Fixed

- **Windows self-confine interactive output:** ConPTY (`live_conpty`) launches now set `STARTF_USESTDHANDLES` with null std handles so console-subsystem children connect to the pseudoconsole instead of inheriting the parent terminal handles. Without this, AppContainer-confined `cmd`, `whoami`, and PowerShell could exit successfully yet print nothing in an interactive PowerShell session.

## [0.8.5] - 2026-06-06

### Fixed

- **Windows AppContainer deny-read:** Deny-read paths (explicit policy entries and built-in defaults such as `workspace/.env` and `%USERPROFILE%/.ssh`) are enforced via protected DACL sealing on leaf files. Inherited package read ALLOW ACEs on writable workspace ancestors no longer let confined processes read denied secrets.
- **Windows acceptance:** Deny-read scenarios are back in CI (`deny_read`, built-in `.env` and `.ssh`, and `skip_default_deny_read` opt-out).

## [0.8.4] - 2026-06-04

### Added

- **Corporate parent proxy (pilot):** The loopback egress proxy can chain outbound HTTPS via an upstream HTTP(S) CONNECT parent using `FINSAFE_PARENT_PROXY_URL` and optional `FINSAFE_PARENT_PROXY_NO_PROXY` (credentials via env only; not in signed bundles).
- **Terminology glossary:** Public docs add English and Chinese glossaries for sandbox, policy, fleet, and proxy terms.

### Changed

- **Regression matrix:** Stage-2 includes `net-parent-proxy-mock` for parent-proxy chaining smoke coverage on macOS/Linux.

### Fixed

- **Windows acceptance CI:** Inline deny-read policy YAML includes required `audit` fields; network-deny scenario asserts WFP filter installation.

## [0.8.3] - 2026-06-04

### Added

- **Body-aware L7 DLP:** MITM egress proxy can inspect HTTP request bodies against policy `dlp` rules (regex patterns, size caps); sensitive payloads are blocked with HTTP 403 when inspection cannot run safely.
- **Windows UI isolation:** Tier B sandbox children spawn on a private Win32 window station and desktop so they cannot enumerate or message interactive `WinSta0\Default` windows or use the interactive clipboard; outcome is recorded in run attestation as `windows_desktop_isolation`.
- **Toolchain profiles:** `self-confine` and policy merge support for toolchain-style host profiles and bundled policy overlays.

### Security

- **Sensitive Unix socket defaults:** Built-in deny for common container control sockets (Docker, containerd, podman, Docker Desktop / OrbStack shims) on Linux (`deny_read` / bwrap overlay) and macOS (Seatbelt `unix-socket` rules). Opt in with `filesystem.allow_unix_socket_paths` when an agent must use a local container API. `read_only_paths` does not block socket `connect()`—see [POLICY-QUICKREF](./docs/POLICY-QUICKREF.md).

## [0.8.2] - 2026-06-03

### Added

- **Public release history:** `CHANGELOG.md` on [finogeeks/finsafe](https://github.com/finogeeks/finsafe/blob/main/CHANGELOG.md); GitHub Release descriptions are generated from the matching version section (no private commit log).
- **Sandbox egress proxy:** TLS SNI handling and loopback proxy support for controlled outbound traffic from confined workloads.

### Fixed

- **Linux `finsafe run`:** Bubblewrap deny-read no longer fails when optional paths (for example `~/.aws`) are missing on the host.
- **Windows managed builds:** WFP network fence and winhelper IPC aligned with `windows-sys` 0.52 so release and CI Windows targets compile reliably.

### Changed

- Linux isolated Landlock policy tests and docs updated for expected path layout.
