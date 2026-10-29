# FinShield

**Agents can put your computer at risk. Adding a sandbox can be simple.**

An Agent that edits files and runs commands can put your data, privacy, and desktop at risk through a mistake or malicious instruction. FinShield adds a sandbox so it works within the permissions you grant. Available for Windows, macOS, and Linux. Previously FinSafe; commands and some packages retain the `finsafe` name.

[简体中文](README-zh.md) · [Windows illustrated manual](docs/WINDOWS-GUIDE.md) · [Architecture and comparisons](docs/technical-overview.md) · [Safety Arena · all cases](https://finsafe-safety-arena.finogeeks.club/#overview)

## Download and start

| Platform | Distribution | Instructions |
| --- | --- | --- |
| **Windows x64** | Setup EXE + desktop Widget | [Illustrated manual](docs/WINDOWS-GUIDE.md) |
| **macOS · Apple Silicon** | Command-line archive | [Get started](docs/getting-started.md#macos) |
| **Linux x86_64** | Command-line archive | [Get started](docs/getting-started.md#linux) |

[Release files](https://github.com/finogeeks/finsafe/releases) · [Version availability](docs/FAQ.md#why-does-the-download-page-still-show-an-older-release). Public downloads currently contain older releases; use the new EXE when published or officially delivered. New macOS Intel packages are paused.

**On Windows: install the EXE → prepare and review permissions once → select an Agent in the desktop Widget, start it, and work as usual.** Use the Widget to start and reopen Agents; open the browser for settings, records, or troubleshooting. [Follow the illustrated steps](docs/WINDOWS-GUIDE.md).

## What happens without a sandbox? Watch real recordings

**100-window storm:** Windows overlap the ordinary desktop; private-desktop protection keeps the storm off the user's desktop.

[![100-window storm comparison](assets/demos/window-storm.gif)](https://finsafe-safety-arena.finogeeks.club/cases/UI-21/index.html)

**Window shaking:** The ordinary run moves a test window; protected control calls are refused and its state stays unchanged.

[![Window shaking comparison](assets/demos/window-shake.gif)](https://finsafe-safety-arena.finogeeks.club/cases/UI-11/index.html)

**Clipboard replacement:** Copied text changes in the ordinary run; protected clipboard access is refused and no replacement is observed.

[![Clipboard replacement comparison](assets/demos/clipboard.gif)](https://finsafe-safety-arena.finogeeks.club/cases/UI-10/index.html)

Select a recording for its full case. These are separate Windows/DSH `0.9.79` runs, not synchronized footage. See [source and scope notes](assets/demos/README.md) for configuration differences.

## Feature comparison

**FinShield combines permission, file and network controls with sensitive-information detection, outbound-content decisions and encrypted local retention.**

| Feature | **FinShield** | Anthropic SRT | Codex | Microsoft MXC | Docker Sandboxes | NVIDIA OpenShell |
| --- | --- | --- | --- | --- | --- | --- |
| Risky System Operations | **Yes** | Conditional | Conditional | Conditional | Conditional | Conditional |
| Files: writable, read-only and denied paths | **Yes** | Yes | Conditional | Yes | Yes | Yes |
| Network: restrict destinations | **Yes** | Yes | Conditional | Conditional | Yes | Yes |
| Built-in PII detection | **Yes¹** | — | — | — | — | — |
| Ask or block based on sensitive outbound content | **Yes¹** | — | — | — | — | — |
| Encrypt conversations and decisions locally | **Yes** | — | — | — | — | — |

Based on the earlier technical comparison and supplemental documentation; detailed evaluation will follow. “Conditional” preserves a qualified capability assessment: operation type, permissions, mode or backend matter. Having a sandbox or isolation mechanism alone does not establish full support for restricting risky system operations. “—” means the cited documentation does not declare a built-in feature; evaluation is pending. ¹ Integrated, inspectable requests only. [Sources, conditions and earlier experiments](docs/technical-overview.md#feature-comparison-and-notes).

## Explore

- [Windows illustrated manual](docs/WINDOWS-GUIDE.md): prepare, start, and reopen from the Widget; use supporting settings/records when needed.
- [Architecture and comparisons](docs/technical-overview.md): diagrams, protection mechanisms, data flow, and alternatives.
- [Safety Arena case library](https://finsafe-safety-arena.finogeeks.club/#overview): more recordings, submitted requests, and observations.
- [FAQ and feedback](docs/FAQ.md) · [Release history](CHANGELOG.md).

Protection depends on the launch entry, effective permissions, and version. Content checks cover integrated, inspectable requests. Published by Finogeeks; use is subject to the supplied license terms.
