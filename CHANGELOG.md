# Changelog

User-facing changes for **public** FinSafe CLI and fleet releases on [finogeeks/finsafe](https://github.com/finogeeks/finsafe/releases).

This file is the only public release history. It is maintained in the private FinSAFE monorepo under `docs/public-finsafe/` and synced to the public repository on each release. Private development commits are not copied here automatically.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

## [0.9.32] - 2026-08-05

### Added

- **Per-run loopback proxy ports (`60080–60089`)** — Concurrent `controlled` / self-confine agents no longer collide on a single fixed proxy port; allocation is fail-closed when the range is exhausted (macOS sibling proxy and Windows in-process). (PR [Geeksfino/finsafe#191](https://github.com/Geeksfino/finsafe/pull/191))
- **Linux self-confine private network namespace + loopback proxy relay** — When netns and the relay binary are available, guest traffic is forced through the host loopback proxy; otherwise FinSAFE falls back to the existing UDS proxy path. (PR [Geeksfino/finsafe#191](https://github.com/Geeksfino/finsafe/pull/191))
- **`proxy-serve --audit-log`** — Compact JSONL audit (`ts`, `host`, `port`, `decision`, `reason`) for allow/deny decisions. (PR [Geeksfino/finsafe#191](https://github.com/Geeksfino/finsafe/pull/191))
- **`proxy-serve --allowlist-file` hot reload** — Polls/debounces the allowlist file and atomically swaps the matcher; garbage reloads keep the previous allowlist (fail-closed). (PR [Geeksfino/finsafe#191](https://github.com/Geeksfino/finsafe/pull/191))

### Fixed

- **Seatbelt allows the declared ephemeral proxy port** within the `60080–60089` range so sandboxed children can reach their allocated sibling proxy. (PR [Geeksfino/finsafe#191](https://github.com/Geeksfino/finsafe/pull/191))
- **Ready-marker isolation across loopback port retries** so concurrent proxy startups do not race on a shared ready file. (PR [Geeksfino/finsafe#191](https://github.com/Geeksfino/finsafe/pull/191))

## [0.9.31] - 2026-08-05

### Added

- **Windows Learning Mode deny-and-record audit capture** — On Win11 24H2+ AppContainer hosts where `finsafe probe` reports Learning Mode APIs available, `finsafe --audit` and `finsafe learn` capture structured denials (JSON + `policy_derivation_notes`) without weakening enforcement. Older hosts and RestrictedToken keep kernel ETW + marker hints as the fallback. (PR [Geeksfino/finsafe#188](https://github.com/Geeksfino/finsafe/pull/188))

### Fixed

- **Windows deny-read seals and absent-path placeholders** — Deny-read DACLs no longer treat extended local paths as UNC, seal against inherited write/create more reliably, and materialize missing deny-read placeholders under RW roots so absent-path acceptance matches production behavior. Learning Mode denial notes with spaces in paths round-trip correctly. (PR [Geeksfino/finsafe#188](https://github.com/Geeksfino/finsafe/pull/188))

## [0.9.30] - 2026-07-31

### Added

- **Windows PipeCapture / Buffered ConPTY sessions report operator interrupt** — Ctrl+C or Ctrl+Break on a console-attached supervisor terminates the sandboxed Job (exit code `1`) and attests `termination_reason=operator_interrupted`, distinct from policy timeout kill (`124` / `timeout_killed`). Live ConPTY keeps its existing Ctrl+C-forward contract. (PR [Geeksfino/finsafe#176](https://github.com/Geeksfino/finsafe/pull/176))

### Fixed

- **Linux personal CLI allowlist + `start_internal_proxy` no longer fails when `/run/finsafe-proxy.sock` is missing** — FinSAFE now creates a bubblewrap-compatible guest mount stub (prefer `/run/finsafe-proxy.sock`, fall back to `/tmp/finsafe-proxy.sock` when `/run` is permission-denied or read-only) and wires that path through the loopback relay, env, and bind-mount. Fixes public issue [finogeeks/finsafe#28](https://github.com/finogeeks/finsafe/issues/28). (PR [Geeksfino/finsafe#177](https://github.com/Geeksfino/finsafe/pull/177))
- **Windows operator-interrupt handler cleanup no longer leaves Ctrl+C ignored** — After an interruptible wait, the supervisor removes its console handler instead of calling `SetConsoleCtrlHandler(NULL, TRUE)`. (PR [Geeksfino/finsafe#176](https://github.com/Geeksfino/finsafe/pull/176))

## [0.9.29] - 2026-07-29

### Fixed

- **Windows warm launch no longer re-labels AppContainer trees that are already complete** — Repeat `self-confine` / sandbox starts probe label-completion sentinels and root DACL posture before opening paths for `WRITE_DAC`, share helper-written sentinels under `%ProgramData%`, and drop the per-launch ProjFS smoke rehearsal so large workspace/venv trees are not relabeled on every start. Stale sentinels that outlive a recreated directory are cleared and re-granted. (PR [Geeksfino/finsafe#170](https://github.com/Geeksfino/finsafe/pull/170))
- **RestrictedToken write allowlist no longer TreeSets the whole project root** — When `work_dir` is a strict ancestor of a `read_write_paths` root (typical `./workspace` policies), FinSAFE skips the inheritable cwd grant that previously rewrote DACLs across `target/` and overwrote the child workspace capability ACE (`Access is denied` on allowlisted writes). (PR [Geeksfino/finsafe#170](https://github.com/Geeksfino/finsafe/pull/170))
- **RestrictedToken self-confine smoke policy uses `network: host`** — Matches release-ready preflight (WFP fencing for `network: none` stays on AppContainer) and the Hermes desktop path. (PR [Geeksfino/finsafe#170](https://github.com/Geeksfino/finsafe/pull/170))

## [0.9.28] - 2026-07-24

### Fixed

- **Managed `self-confine` now reports fleet audit events** — Interactive brokers under managed mode previously resolved policy from the agent but never spooled `SandboxStarted` / `RunCompleted` to the authority, so Admin **Audit** / **Runs** stayed empty while short-lived `finsafe run` showed up normally. Managed `self-confine` now registers the run and emits `SandboxStarted` (reason includes `mode=self-confine`) before launch/exec; supervised paths (Windows, tools-only, macOS `--audit` spawn) also emit `RunCompleted`. Linux/macOS `execve` handoff still only reports start. (PR [Geeksfino/finsafe#161](https://github.com/Geeksfino/finsafe/pull/161))

### Changed

- **Managed egress proxy cells inject `WS_PROXY` / `WSS_PROXY`** — Loopback and UDS proxy environment injection now includes WebSocket proxy aliases (and lowercase forms on the loopback path) so WebSocket clients cannot bypass the managed proxy under restricted egress. (PR [Geeksfino/finsafe#158](https://github.com/Geeksfino/finsafe/pull/158))

## [0.9.27] - 2026-07-23

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **fix(landlock): allow O_CREAT at rw workspace root after carveout split** (public issue [finogeeks/finsafe#27](https://github.com/finogeeks/finsafe/issues/27), PR [Geeksfino/finsafe#151](https://github.com/Geeksfino/finsafe/pull/151))

## [0.9.26] - 2026-07-23

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **fix(landlock): allow O_CREAT at rw workspace root after carveout split** (public issue [finogeeks/finsafe#27](https://github.com/finogeeks/finsafe/issues/27), PR [Geeksfino/finsafe#151](https://github.com/Geeksfino/finsafe/pull/151))

## [0.9.25] - 2026-07-23

### Fixed

- **fix(windows): restricted-token `self-confine` uses console inherit instead of ConPTY** — Interactive restricted-token self-confine previously spawned brokers through Live ConPTY, which failed at DLL init (`0xC0000142`) when the child could not attach to a foreign-token conhost. That path now uses **ConsoleInherit** (inherits the supervisor console, `WinSta0\Default` desktop) so agents such as Hermes can start under restricted-token self-confine on Windows. (PR [Geeksfino/finsafe#148](https://github.com/Geeksfino/finsafe/pull/148))

## [0.9.24] - 2026-07-22

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **fix(linux): enforce protected_read_only_paths via bwrap ro-bind carveouts** (public issue [finogeeks/finsafe#21](https://github.com/finogeeks/finsafe/issues/21), PR [Geeksfino/finsafe#141](https://github.com/Geeksfino/finsafe/pull/141))

## [0.9.23] - 2026-07-22

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **fix(linux): self-confine adds network host Landlock paths like run mode** (public issue [finogeeks/finsafe#23](https://github.com/finogeeks/finsafe/issues/23), PR [Geeksfino/finsafe#147](https://github.com/Geeksfino/finsafe/pull/147))

## [0.9.22] - 2026-07-21

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **fix(linux): enforce deny_write_globs under read_write Landlock grants** (public issue [finogeeks/finsafe#22](https://github.com/finogeeks/finsafe/issues/22), PR [Geeksfino/finsafe#142](https://github.com/Geeksfino/finsafe/pull/142))

## [0.9.21] - 2026-07-21

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Added

- **SaaS allowlist works with standard HTTP clients (Linux)** — allowlist proxy-cell executions now wrap the payload with an in-cell loopback relay (`finsafe proxy-relay-exec`): the cell gets `HTTP_PROXY`/`HTTPS_PROXY=http://127.0.0.1:60080` (plus lowercase aliases and `NO_PROXY`), and the relay forwards loopback TCP to the per-execution egress-proxy UDS at `/run/finsafe-proxy.sock`. Unmodified curl, Python `requests`, and Node fetch now traverse the FQDN allowlist without `unix://` proxy support. Previously the cell only received `HTTP_PROXY=unix:///run/finsafe-proxy.sock`, which mainstream clients reject (`curl: (7) Unsupported proxy scheme`). The relay is fail-closed (payload never spawns if the listener or proxy socket is unavailable) and adds no reachability: the cell netns still has no external routes, and all egress terminates at the host-side allowlist proxy. Requires the executor to resolve an absolute `finsafe` path (`FINSAFE_CLI_PATH` or `PATH`); otherwise the legacy `unix://` env is kept.
- **`proxy_loopback` seccomp profile family** (`bwrap-proxy-loopback.json`) — same allowlist as `default` (AF_INET permitted) for allowlist cells running the loopback relay. The executor pins this family automatically on relay cells (overriding any inherited `FINSAFE_BWRAP_SECCOMP_PROFILE_FAMILY=proxy_uds`, which would kill the relay's loopback sockets); operators still control seccomp *mode* via `FINSAFE_BWRAP_SECCOMP`. Also selectable explicitly in operator config `hardening.seccomp.profile_family`. **Security note:** because `proxy_loopback` permits AF_INET (unlike `proxy_uds`), seccomp no longer backstops IPv4/IPv6 socket creation, so `--unshare-net` is the *sole, non-degradable* network boundary for relay cells — bwrap fails closed (the cell never launches) if it cannot create the network namespace, and all egress still terminates at the host-side FQDN allowlist proxy.

### Notes / scope

- This applies to **short-lived SaaS one-shot / workspace-turn executions on Linux** (`finsafe-server` executor). It does **not** change `self-confine` / resident-broker allowlist, which remains `proxy_uds` (UDS-only); standard-HTTP-client allowlist there is not yet wired. macOS/Windows allowlist behavior is unchanged.
- **`wrapper_launch.compiler_version` is now 2** — probe/attestation/router details report the bumped wrapper-policy compiler revision so audit can distinguish loopback-relay derivation from the legacy `unix://` proxy-cell path (v1).

### Fixed

- **fix(linux): Landlock read_write_paths under bwrap + shim (finogeeks#20)** (public issue [finogeeks/finsafe#20](https://github.com/finogeeks/finsafe/issues/20), PR [Geeksfino/finsafe#140](https://github.com/Geeksfino/finsafe/pull/140))

## [0.9.20] - 2026-07-20

### Fixed

- **SaaS Docker allowlist launch** — Pre-create `/run/finsafe-proxy.sock` in `Dockerfile.saas`, `Dockerfile.saas.prebuilt`, and recreate it in `docker-entrypoint.sh` on each start. Without this mount target, `network.mode=allowlist` cells failed at launch with `Bubblewrap mount target(s) missing in rootfs: /run/finsafe-proxy.sock` (exit 3) even when `host_capabilities.allowlist_supported=true`. Published to `ghcr.io/geeksfino/finsafe-saas:v0.9.20`.

## [0.9.19] - 2026-07-19

### Fixed

- **macOS Seatbelt `self-confine` symlink path spelling:** policy `read_only_paths` / `read_write_paths` that are themselves symlinks (for example a CLI-safe home alias under `~/.findesk-dev/...` pointing at `~/Library/Application Support/...`) are now emitted under **both** the literal and canonical spellings. Previously `prepare_macos_seatbelt_self_confine` canonicalized those entries first, so a Hermes (or other) shebang/argv that still referenced the literal alias failed with `EPERM` even though the resolved target was allowed.

## [0.9.18] - 2026-07-19

### Added

- **SaaS daemon `host_capabilities` config** — `daemon.yaml` can declare `allowlist_supported` and `proxy_profiles` for the policy router. Short-lived `HighLevelPolicyV1` executions (one-shot submits and workspace session turns) honor this setting; Phase Y resident brokers remain on `self-confine` wrapper templates. When `allowlist_supported: true`, the executor starts an embedded `finsafe-net-proxy` per execution (fail-closed if the proxy fails to start).

## [0.9.17] - 2026-07-18

### Added

- **examples: Hermes Windows interactive policy** (`hermes-windows-interactive.yaml`) — RestrictedToken + `self-confine` recipe for a live Hermes session (`program_mode: interactive`, no session timeout). The Unix-path `hermes-interactive.yaml` does not apply on Windows, and the oneshot policy's `short-lived` mode + 120 s timeout must not be reused for interactive sessions.

### Fixed

- **Windows interactive `self-confine` (both backends):** FinSAFE now performs the terminal-host half of the Live ConPTY contract. The supervisor's real console is switched to raw/VT mode for the session — per-key stdin (no line buffering / double echo), arrow and function keys delivered as VT input, ANSI rendering on classic conhost — and **Ctrl+C is forwarded to the broker** instead of killing the FinSAFE supervisor (which previously tore down the whole session via the Job object; Ctrl+Break remains the session kill). Console window resizes are forwarded to the broker via `ResizePseudoConsole`. Original console modes are restored on exit. This is what prevented interactive TUI agents (e.g. Hermes) from being usable under `self-confine` even after the 0.9.15 spawn fix; one-shot `run` was unaffected.

## [0.9.16] - 2026-07-17

### Added

- **Sandbox-as-a-Service public delivery:** Linux archive `finsafe-saas-server-v*`
  (`finsafe-server-http` + public `finsafe` + helper/shim/supervisor) and multi-arch
  OCI image `ghcr.io/finogeeks/finsafe-saas` (`linux/amd64`, `linux/arm64`) via
  `release-public-cli.yml`. Prefer the image for Docker sidecars (including macOS
  Docker Desktop); use the tarball for bare-metal Linux installs.

## [0.9.15] - 2026-07-13

### Added

- **`broker_confine: tools-only` (opt-in):** leave the interactive broker unsandboxed for a live TTY; confine tools via `finsafe run` / execution cells. Audit attests `broker_confined=false` / `confine_scope=tools_only`. Example: `examples/wrapper-policies/hermes-interactive-tools-only.yaml`.

### Changed

- **Windows RestrictedToken interactive `self-confine`:** defaults to **Live ConPTY** when available (Codex-aligned spawn: no console-window flags; `lpDesktop=Winsta0\Default`). Escape hatch: `FINSAFE_WIN_PTY_MODE=pipe`.

### Fixed

- **Windows RestrictedToken interactive `self-confine`:** child could exit with `STATUS_DLL_INIT_FAILED` (`0xC0000142`) on the legacy `CreateProcessAsUserW` spawn path (public issue [finogeeks/finsafe#17](https://github.com/finogeeks/finsafe/issues/17), PR [Geeksfino/finsafe#109](https://github.com/Geeksfino/finsafe/pull/109)). **0.9.15+** defaults to Live ConPTY; escape hatch `FINSAFE_WIN_PTY_MODE=pipe`.
- **Windows:** export `preflight_windows_launch` from `finsafe-winsafe` so `finsafe-cli` cross-compile and Windows acceptance builds resolve the symbol.

## [0.9.14] - 2026-07-12

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Added

- **docs: dedicated Windows desktop guide** — [WINDOWS-GUIDE.md](docs/WINDOWS-GUIDE.md) / [WINDOWS-GUIDE-zh.md](docs/WINDOWS-GUIDE-zh.md) covers install → RestrictedToken vs AppContainer decision tree → `probe`/`doctor` → Hermes examples → AppContainer/ProjFS → troubleshooting. Linked from README, USER-GUIDE, POLICY-QUICKREF, and agent-sandbox-guide.

### Fixed

- **fix(windows): load ProjFS dynamically so finsafe starts without projectedfslib.dll** (public issue [finogeeks/finsafe#15](https://github.com/finogeeks/finsafe/issues/15), PR [Geeksfino/finsafe#106](https://github.com/Geeksfino/finsafe/pull/106))

## [0.9.13] - 2026-07-11

### Added

- **Windows ProjFS projection for large AppContainer runtimes:** Optional Projected File System support projects large trees (for example Node/Python agent runtimes) without recursive DACL walks. `finsafe setup-windows` / the Windows installer can enable the feature; `finsafe probe --json` reports ProjFS readiness. See [USER-GUIDE.md](docs/USER-GUIDE.md).
- **Windows `write_restricted` backend:** Explicit weaker compatibility mode (RestrictedToken-family write allowlist without AppContainer) for hosts that need host-wide read. Prefer Auto defaults unless you pin a backend.
- **examples: Hermes Windows AppContainer policy** (`hermes-windows-oneshot-appcontainer.yaml`) alongside the RestrictedToken `hermes-windows-oneshot.yaml`.
- **examples: Linux-specific Hermes interactive wrapper policy** (`hermes-linux-interactive.yaml`) — `stdio: pty`, `skip_default_deny_read` for `${HOME}/.hermes/.env`, and `/etc/resolv.conf` for DNS inside bubblewrap. Contributed via public PR [finogeeks/finsafe#14](https://github.com/finogeeks/finsafe/pull/14) by [@xulis](https://github.com/xulis).

### Changed

- **Windows desktop default backend:** Auto + `network: host` (empty YAML `deny_read_paths`) now selects **RestrictedToken** (Codex-aligned host-wide read, write allowlist). AppContainer remains for `network: none` / allowlist, confidential deny-read, explicit `windows.backend: appcontainer`, and managed fleet. ProjFS is optional (AppContainer large-runtime projection); `doctor` reports ProjFS issues as warnings. See [USER-GUIDE.md § Windows backends](docs/USER-GUIDE.md) and [POLICY-QUICKREF.md](docs/POLICY-QUICKREF.md).

## [0.9.12] - 2026-07-08

### Added

- **Windows WFP egress fence verification:** Before AppContainer launch with `network: none`, FinSAFE runs a host-side TCP probe and records `windows_egress_fence_verified` and `windows_egress_fence_probe_target` on `finsafe run --json` / self-confine reports. When the current logon token lacks `finsafe-net`, the helper can refresh via S4U logon so the probe exercises the same principal the child will use.

### Security

- **Windows outbound deny attestation:** A successful connect to the probe target fails launch setup (fail-closed) on desktop hosts; `WSAEACCES` (Winsock 10013) counts as verified fence behavior.

### Fixed

- **Linux bubblewrap:** Reject shell metacharacter injection in curated argument paths (ecosystem-watch hardening).

## [0.9.11] - 2026-07-01

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **fix(linux-seccomp): allow x86_64 epoll_wait and vfork in self-confine** (public issue [finogeeks/finsafe#13](https://github.com/finogeeks/finsafe/issues/13), PR [Geeksfino/finsafe#88](https://github.com/Geeksfino/finsafe/pull/88))

## [0.9.10] - 2026-06-26

### Security

- **macOS restricted egress + `allow_local_binding`:** Seatbelt outbound rule now uses `(remote ip "localhost:*")` instead of `(local ip "*:*")`, which previously matched unbound `connect()` sources and bypassed the egress allowlist when clients ignored proxy env vars (aligned with upstream [sandbox-runtime#316](https://github.com/anthropic-experimental/sandbox-runtime/pull/316)). Injects `JAVA_TOOL_OPTIONS=-Djava.net.preferIPv4Stack=true` for Java/Gradle loopback clients under the same posture.

## [0.9.9] - 2026-06-25

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
