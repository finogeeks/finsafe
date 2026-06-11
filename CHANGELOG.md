# Changelog

User-facing changes for **public** FinSafe CLI and fleet releases on [finogeeks/finsafe](https://github.com/finogeeks/finsafe/releases).

This file is the only public release history. It is maintained in the private FinSAFE monorepo under `docs/public-finsafe/` and synced to the public repository on each release. Private development commits are not copied here automatically.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

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
