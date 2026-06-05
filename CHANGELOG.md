# Changelog

User-facing changes for **public** FinSafe CLI and fleet releases on [finogeeks/finsafe](https://github.com/finogeeks/finsafe/releases).

This file is the only public release history. It is maintained in the private FinSAFE monorepo under `docs/public-finsafe/` and synced to the public repository on each release. Private development commits are not copied here automatically.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

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
