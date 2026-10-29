# FinShield

**Let AI agents use your computer and data within the permissions you grant.**

Local execution, file and network boundaries on Windows, macOS, and Linux, with sensitive-information checks and retention for integrated model requests. Previously FinSafe; commands and some packages retain the `finsafe` name.

[简体中文](README-zh.md) · [Windows illustrated manual](docs/WINDOWS-GUIDE.md) · [Architecture and comparisons](docs/technical-overview.md) · [Safety Arena · all cases](https://finsafe-safety-arena.finogeeks.club/#overview)

## Download and start

| Platform | Distribution | Instructions |
| --- | --- | --- |
| **Windows x64** | Double-click setup EXE | [Illustrated manual](docs/WINDOWS-GUIDE.md) |
| **macOS · Apple Silicon** | Command-line archive | [Get started](docs/getting-started.md#macos) |
| **Linux x86_64** | Command-line archive | [Get started](docs/getting-started.md#linux) |

[Release files](https://github.com/finogeeks/finsafe/releases) · [Version availability](docs/FAQ.md#why-does-the-download-page-still-show-an-older-release). Public downloads currently contain older releases; use the new EXE when published or officially delivered. New macOS Intel packages are paused.

## Watch real recordings

**100-window storm:** Windows overlap the ordinary desktop; private-desktop protection keeps the storm off the user's desktop.

[![100-window storm comparison](assets/demos/window-storm.gif)](https://finsafe-safety-arena.finogeeks.club/cases/UI-21/index.html)

**Window shaking:** The ordinary run moves a test window; protected control calls are refused and its state stays unchanged.

[![Window shaking comparison](assets/demos/window-shake.gif)](https://finsafe-safety-arena.finogeeks.club/cases/UI-11/index.html)

**Clipboard replacement:** Copied text changes in the ordinary run; protected clipboard access is refused and no replacement is observed.

[![Clipboard replacement comparison](assets/demos/clipboard.gif)](https://finsafe-safety-arena.finogeeks.club/cases/UI-10/index.html)

Select a recording for its full case. These are separate Windows/DSH `0.9.79` runs, not synchronized footage. See [source and scope notes](assets/demos/README.md) for configuration differences.

## Explore

- [Windows illustrated manual](docs/WINDOWS-GUIDE.md): install, prepare, start WorkBuddy/DSH, and review records.
- [Architecture and comparisons](docs/technical-overview.md): diagrams, protection mechanisms, data flow, and alternatives.
- [Safety Arena case library](https://finsafe-safety-arena.finogeeks.club/#overview): more recordings, submitted requests, and observations.
- [FAQ and feedback](docs/FAQ.md) · [Release history](CHANGELOG.md).

Protection depends on the launch entry, effective permissions, and version. Content checks cover integrated, inspectable requests. Published by Finogeeks; use is subject to the supplied license terms.
