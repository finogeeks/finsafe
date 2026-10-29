# FinShield

[简体中文](README-zh.md) · [Downloads](https://github.com/finogeeks/finsafe/releases) · [Get started](docs/getting-started.md) · [FAQ](docs/FAQ.md)

**Let AI agents use your computer and data within the permissions you grant.**

FinShield provides local execution protection for AI agents on Windows, macOS, and Linux. Agents can use tools, work with files, and contact model services while FinShield applies configured boundaries to file access, system operations, and network traffic. Supported model integrations also provide content inspection and exchange records.

Previously named FinSafe, the product is now **FinShield**. Existing `finsafe` commands, some package names, and the repository address retain their current names.

## Downloads

| Platform | Package | Links |
| --- | --- | --- |
| **Windows x64** | `finsafe-<version>-x64-setup.exe`; download and double-click | [Release files](https://github.com/finogeeks/finsafe/releases) · [Windows guide](docs/WINDOWS-GUIDE.md) |
| **macOS · Apple Silicon** | `finsafe-v<version>-aarch64-apple-darwin.tar.zst` | [Release files](https://github.com/finogeeks/finsafe/releases) · [Get started](docs/getting-started.md#macos) |
| **Linux x86_64** | `finsafe-v<version>-x86_64-unknown-linux-gnu.tar.zst` | [Release files](https://github.com/finogeeks/finsafe/releases) · [Get started](docs/getting-started.md#linux) |

As of 2026-10-29, the latest public release is still `v0.9.47`; the new Windows setup EXE described here is not yet available there. If you already received a current installer, double-click that EXE. Public availability depends on the attached release files. New macOS Intel packages are temporarily paused; historical Intel packages do not establish current-version support.

Windows uses an EXE installer. macOS and Linux currently use command-line archives. Interfaces, Agent integrations, and protection capabilities differ by platform.

## Watch real examples

These Windows excerpts show ordinary DSH on the left and the FinShield-protected run on the right. Select an image for the full case, submitted request, and observed results.

### Keep a 100-window storm off the user's desktop

In the ordinary run, 100 test windows moved, resized, and overlapped. In the protected run, **private-desktop mode** kept that storm off the user's desktop. This result concerns desktop interference; it does not mean every window-creation call failed.

[![100-window storm: ordinary and protected recording excerpts](assets/demos/window-storm.gif)](https://finsafe-safety-arena.finogeeks.club/cases/UI-21/index.html)

### Keep a work window in place

The ordinary run shook a dedicated test window for about 25 seconds. In the protected run, window-control calls were refused; the target remained hidden and unmoved.

[![Window shaking: ordinary and protected recording excerpts](assets/demos/window-shake.gif)](https://finsafe-safety-arena.finogeeks.club/cases/UI-11/index.html)

### Prevent this attempt to replace copied text

The ordinary run wrote to the clipboard 466 times. The protected run's 501 attempts to open the clipboard were refused, and the test panel observed no replacement text.

[![Clipboard replacement: ordinary and protected recording excerpts](assets/demos/clipboard.gif)](https://finsafe-safety-arena.finogeeks.club/cases/UI-10/index.html)

These recordings come from Windows/DSH tests of version `0.9.79`, before the product rename. Original names remain visible. The groups were recorded separately; excerpts are not synchronized. Results apply to the tested version, configuration, and operation paths. [Editing notes and sources](assets/demos/README.md) · [More cases](https://finsafe-safety-arena.finogeeks.club/#overview).

## Windows: protect the computer and control data access

| Capability | What it provides |
| --- | --- |
| **High-risk operation protection** | Restricts changes to system configuration, file permissions, other processes, and services on controlled execution paths |
| **File access control** | Separates writable, read-only, and inaccessible directories according to configured permissions |
| **Network access control** | Restricts destinations while preserving authorized business and model traffic |
| **Sensitive-information checks** | Records, asks for approval, or blocks supported findings in inspectable model requests |
| **Local retention** | When enabled, encrypts captured model requests, responses, and decisions on this computer for later review |
| **Desktop controls** | Provides a floating entry and local Console for security preparation, WorkBuddy/DSH launch, status, and records |

The current Windows desktop inventory contains **WorkBuddy and DSH CLI**. Check release notes for other integrations. The private-desktop configuration used in the examples is not the default for every desktop application.

**First use:** Download the EXE → double-click to install → confirm permissions and complete security preparation → safely start an Agent from FinShield.

Use the floating entry to reopen a running Agent or visit Console. A separate process started through its vendor shortcut should not be assumed protected. [Read the Windows guide](docs/WINDOWS-GUIDE.md).

## macOS and Linux

macOS uses Seatbelt for local execution boundaries. Linux combines bubblewrap, seccomp, cgroup, and available Landlock support. Both provide command-line workflows, version-dependent Agent integrations, and proxy/privacy-inspection capabilities.

Download the matching archive and follow [Get started](docs/getting-started.md) to check your host and launch through FinShield. Windows desktop features and content rules differ from Privacy Guard on macOS/Linux.

## Before you start

Protection depends on the **launch entry, effective permissions, platform, and version**. Only operations routed through a controlled execution or inspection path receive its protection. Installation alone does not protect every Agent. Sensitive-information detection is not exhaustive, and the default record-only action does not prevent sending.

[Get started](docs/getting-started.md) · [Windows guide](docs/WINDOWS-GUIDE.md) · [FAQ and feedback](docs/FAQ.md) · [Release history](CHANGELOG.md)

Finogeeks maintains this repository as a download entry and user-documentation site for FinShield. Use is subject to the terms supplied with your release or delivery.
