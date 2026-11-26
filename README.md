# FinShield

**[Documentation](https://finshield.finogeeks.club/en/) · [What FinShield protects](https://finshield.finogeeks.club/en/protection/) · [Downloads](https://github.com/finogeeks/finsafe/releases/latest)**

[简体中文](README-zh.md)

FinShield (formerly FinSAFE) gives Agent execution processes configurable boundaries for files, system functions and desktop operations. Start with your Agent's guide, then check the actual protection state. Integration support and protection scope depend on platform, version and configuration.

## Choose your Agent

| Agent | Usage guide | Integration |
| --- | --- | --- |
| Codex CLI | [CLI integration](https://finshield.finogeeks.club/en/agents/codex.html) | Windows CLI integration |
| Claude Code CLI | [CLI integration](https://finshield.finogeeks.club/en/agents/claude.html) | Windows CLI integration |
| OpenCode Desktop | [Install and use](https://finshield.finogeeks.club/en/agents/opencode.html) | Windows plugin: `@finogeeks2026/finshield-opencode` |
| Hermes Desktop | [Install and launch](https://finshield.finogeeks.club/en/agents/hermes.html) | Windows desktop launcher |
| Kilo CLI | [Test plugin guide](https://finshield.finogeeks.club/en/agents/kilo.html) | Windows local interactive TUI; test release |
| DSH Desktop | [Install and use](https://finshield.finogeeks.club/en/agents/dsh.html) | Windows plugin: `@finogeeks2026/finshield-dsh` |
| WorkBuddy | [Install and launch](https://finshield.finogeeks.club/en/agents/workbuddy.html) | Windows desktop launcher |

For Linux, macOS and other Agent forms, check the [compatibility matrix](https://finshield.finogeeks.club/en/agents/compatibility.html). CLI support does not establish desktop-app or IDE-extension support.

## Understand your protection

- [Plugin defaults](https://finshield.finogeeks.club/en/protection/defaults.html): protected directories, writable paths and system / desktop restrictions.
- [Configuration explained](https://finshield.finogeeks.club/en/protection/configuration.html): available settings and their effects.
- [Network access and PII](https://finshield.finogeeks.club/en/protection/network-pii.html): website access, data exfiltration, detection and redaction limits.

**The DSH and OpenCode Windows plugins default to host networking.** Their protected status does not enable a FinShield website blacklist, HTTPS content inspection or PII redaction. File protection follows effective path rules; it does not make all files outside the workspace read-only.

## Four risks when Agents operate your computer

Screenshots can expose private information, pop-ups can disrupt work, and process or file operations can damage your working environment. These four DSH cases compare ordinary runs with FinShield protection.

| [Privacy leaks](https://safety.finaios.ai/agents/dsh/index.html#privacy) | [Desktop disruption](https://safety.finaios.ai/agents/dsh/index.html#interaction) | [System damage](https://safety.finaios.ai/agents/dsh/index.html#system) | [Data deletion](https://safety.finaios.ai/agents/dsh/index.html#data) |
| :---: | :---: | :---: | :---: |
| <a href="https://safety.finaios.ai/agents/dsh/index.html#privacy"><img src="https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/screen-capture.gif" width="180" alt="Screen capture leak comparison"></a> | <a href="https://safety.finaios.ai/agents/dsh/index.html#interaction"><img src="https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/window-flood.gif" width="180" alt="Pop-up flood comparison"></a> | <a href="https://safety.finaios.ai/agents/dsh/index.html#system"><img src="https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/process-terminate.gif" width="180" alt="Forced process termination comparison"></a> | <a href="https://safety.finaios.ai/agents/dsh/index.html#data"><img src="https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/protected-directory-delete.gif" width="180" alt="Protected-directory deletion comparison"></a> |
| Capturing private screen content | Flooding the desktop with pop-ups | Forcibly terminating processes | Deleting protected directories |

Select a GIF for the full assessment. Previews are reused from the DSH plugin and excerpt separate test runs; see each assessment page for test conditions, configuration, and protection scope.

## Get started and get help

- [Installation](https://finshield.finogeeks.club/en/getting-started/install.html) · [Latest downloads](https://github.com/finogeeks/finsafe/releases/latest).
- [Documentation](https://finshield.finogeeks.club/en/) · [Public architecture](https://finshield.finogeeks.club/en/architecture/) · [Whitepaper](https://finshield.finogeeks.club/en/reference/whitepaper.html).
- [Report a problem](https://github.com/finogeeks/finsafe/issues/new/choose) · [Contribute](CONTRIBUTING.md) · [Release history](CHANGELOG.md).

## Develop a PII plugin

The [Windows PII plugin developer guide](https://finshield.finogeeks.club/en/development/pii.html) covers the SDK, protocol, examples, local workbench and integration. These plugins extend sensitive-information detection and redaction; they differ from Agent integration plugins. Use a compatible Windows FinShield release; `pii-plugins/release.json` identifies the matching product and source revisions.

FinShield Personal Edition is free to use under its product terms. Commercial
use of plugins developed with this kit requires prior written permission from
Finogeeks. Free personal-edition use does not grant a plugin commercial license.
See the [developer kit license](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/LICENSE). Contact:
[contact@finogeeks.com](mailto:contact@finogeeks.com).
