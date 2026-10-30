# FinShield

**Agents can put your computer at risk. Adding a sandbox can be simple.**

An Agent that edits files and runs commands can put your data, privacy, and desktop at risk through a mistake or malicious instruction. FinShield adds a sandbox so it works within the permissions you grant. Available for Windows, macOS, and Linux. Previously FinSafe; the command remains `finsafe`, while release packages use the `finshield` name.

[简体中文](README-zh.md) · [Windows illustrated manual](docs/WINDOWS-GUIDE.md) · [Architecture and comparisons](docs/technical-overview.md) · [Safety Arena · all cases](https://finsafe-safety-arena.finogeeks.club/#overview)

## Download and start

The latest stable release is [**FinShield v0.9.102**](https://github.com/finogeeks/finsafe/releases/tag/v0.9.102).

### Windows: install assistant (recommended)

[**Download the Windows install assistant — install-finshield.cmd**](https://github.com/finogeeks/finsafe/releases/latest/download/install-finshield.cmd)

1. Download and double-click `install-finshield.cmd`. An internet connection is required; you do not need a separate script or a typed command.
2. Prompts are in English by default. Type **L** and press **Enter** to switch to Chinese, then press **Enter** to install. The assistant downloads the latest stable Windows installer and verifies its SHA-256 checksum.
3. Choose **Yes** in the administrator prompt and follow the interactive installation wizard. If a restart is required, save your work and restart Windows when prompted.

For offline installation or to install this specific version, download [**finshield-0.9.102-x64-setup.exe**](https://github.com/finogeeks/finsafe/releases/download/v0.9.102/finshield-0.9.102-x64-setup.exe) and run it directly. The EXE contains the installation payload; no separate MSI is needed. The install assistant always selects the latest stable version, even if you downloaded the assistant from an older release.

If Windows Smart App Control blocks installation, the assistant provides settings guidance. Security changes require your own confirmation: turning Smart App Control off affects the whole PC, and older Windows versions may require a reset or reinstall to enable it again. Security policy may also block the assistant itself.

**After installation:** follow the desktop Widget's preparation flow, review the requested permissions, then select and start an Agent. Use the Widget to start and reopen Agents; open the browser for settings, records, or troubleshooting. [Follow the illustrated steps](docs/WINDOWS-GUIDE.md).

### macOS and Linux

Install the latest stable command-line release with `curl`, `tar`, and `zstd` (or a `tar` that supports `--zstd`):

```sh
curl -fsSL https://raw.githubusercontent.com/finogeeks/finsafe/main/install.sh | sh
```

The script detects your platform, verifies the download checksum, and installs the `finsafe` command into `~/.local/bin` by default. See the [macOS guide](docs/getting-started.md#macos) or [Linux guide](docs/getting-started.md#linux) for setup and first use. New macOS Intel packages remain paused.

### Manual downloads for v0.9.102

| Platform | Download | Instructions |
| --- | --- | --- |
| **Windows x64** | [Offline setup EXE](https://github.com/finogeeks/finsafe/releases/download/v0.9.102/finshield-0.9.102-x64-setup.exe) | [Illustrated manual](docs/WINDOWS-GUIDE.md) |
| **macOS · Apple Silicon** | [finshield-0.9.102-macos-arm64.tar.zst](https://github.com/finogeeks/finsafe/releases/download/v0.9.102/finshield-0.9.102-macos-arm64.tar.zst) | [Get started](docs/getting-started.md#macos) |
| **Linux x86_64** | [finshield-0.9.102-linux-x64.tar.zst](https://github.com/finogeeks/finsafe/releases/download/v0.9.102/finshield-0.9.102-linux-x64.tar.zst) | [Get started](docs/getting-started.md#linux) |

Verify manual downloads with [SHA256SUMS](https://github.com/finogeeks/finsafe/releases/download/v0.9.102/SHA256SUMS). [release.json](https://github.com/finogeeks/finsafe/releases/download/v0.9.102/release.json) contains download metadata; these two files are not additional installers. Browse [all releases](https://github.com/finogeeks/finsafe/releases) for other versions. The macOS/Linux archives retain the `finsafe` command and existing payload directory names.

## What happens without a sandbox? Watch real recordings

**100-window storm:** Windows overlap the ordinary desktop; private-desktop protection keeps the storm off the user's desktop.

[![100-window storm comparison](assets/demos/window-storm.gif)](https://finsafe-safety-arena.finogeeks.club/cases/UI-21/index.html)

**Window shaking:** The ordinary run moves a test window; protected control calls are refused and its state stays unchanged.

[![Window shaking comparison](assets/demos/window-shake.gif)](https://finsafe-safety-arena.finogeeks.club/cases/UI-11/index.html)

**Clipboard replacement:** Copied text changes in the ordinary run; protected clipboard access is refused and no replacement is observed.

[![Clipboard replacement comparison](assets/demos/clipboard.gif)](https://finsafe-safety-arena.finogeeks.club/cases/UI-10/index.html)

Select a recording for its full case. These are separate Windows/DSH `0.9.79` runs, not synchronized footage. See [source and scope notes](assets/demos/README.md) for configuration differences.

## Feature comparison

Reproduced from the original Windows technical proposal. Detailed evaluation will follow.

| Product | Runtime | Agent integration | Risky System Operations | File permissions | PII detection | Data retention |
| --- | --- | --- | --- | --- | --- | --- |
| FinShield | Native Windows | Supported | Supported | Supported | Supported | Supported |
| SRT (Anthropic) | Native Windows | CLI Agents only | Partially supported | Supported | Unsupported | Unsupported |
| Codex (OpenAI) | Native Windows | DSH task execution failed | Partially supported | Partially supported | Unsupported | Unsupported |
| MXC (Microsoft) | Windows execution backend | DSH failed to start | — | — | — | — |
| Docker Sandboxes | Linux microVM | Windows Agents unsupported | Isolates the host system | Supported | Unsupported | Unsupported |
| OpenShell | WSL2 + Linux container | Windows Agents unsupported | Isolates the host system | Supported | Unsupported | Unsupported |

“—” means Agent startup failed and subsequent tests were not performed.

## Explore

- [Windows illustrated manual](docs/WINDOWS-GUIDE.md): prepare, start, and reopen from the Widget; use supporting settings/records when needed.
- [Architecture and comparisons](docs/technical-overview.md): diagrams, protection mechanisms, data flow, and alternatives.
- [Safety Arena case library](https://finsafe-safety-arena.finogeeks.club/#overview): more recordings, submitted requests, and observations.
- [FAQ and feedback](docs/FAQ.md) · [Release history](CHANGELOG.md).

Protection depends on the launch entry, effective permissions, and version. Content checks cover integrated, inspectable requests. Published by Finogeeks; use is subject to the supplied license terms.
