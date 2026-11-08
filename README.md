# FinShield

**Agents can put your computer at risk. Adding a sandbox can be simple.**

FinShield gives Agents a sandbox on Windows, macOS, and Linux, so they work within the permissions you grant.

[简体中文](README-zh.md) · [FinShield on finaios.ai](https://finaios.ai/en/products/finshield/)

**Install:** on Windows, [download the install assistant](https://github.com/finogeeks/finsafe/releases/latest/download/install-finshield.cmd) and double-click it. For macOS, Linux, offline packages, and full instructions, see the [latest release](https://github.com/finogeeks/finsafe/releases/latest).

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

- [Install and get started](docs/getting-started-zh.md) (Chinese): downloads, installation, first launch, and permission checks.
- [Windows illustrated overview](docs/finsafe-windows-overview.html) (Chinese): capabilities, architecture, and integration.
- [Documentation and whitepaper](docs/README-zh.md) (Chinese): Windows, Linux/macOS, and the complete product approach.
- [Safety Arena case library](https://finsafe-safety-arena.finogeeks.club/#overview): more recordings, submitted requests, and observations.
- [Report a problem](https://github.com/finogeeks/finsafe/issues/new/choose) · [Release history](CHANGELOG.md).

Protection depends on the launch entry, effective permissions, and version. Content checks cover integrated, inspectable requests. Published by Finogeeks; use is subject to the supplied license terms.
