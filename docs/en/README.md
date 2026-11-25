# FinShield documentation

[简体中文](../zh-CN/README.md) · [Product home](https://github.com/finogeeks/finsafe) · [Latest download](https://github.com/finogeeks/finsafe/releases/latest)

FinShield gives mainstream Agents a security boundary for files, system functions, and the desktop. Prefer a released Agent integration plugin, or connect through the `finsafe` CLI. PII plugins extend sensitive-information detection and redaction.

## Get started

1. [Check compatibility](agents/compatibility.md): Agent form, platform, plugin status, and verification scope.
2. [Choose an integration route and install](getting-started/install.md): follow the DSH / OpenCode Windows plugin guides, use the FinShield launcher for Hermes Desktop or the test plugin for Kilo CLI, and follow the individual CLI guides for Codex and Claude.
3. [Verify protection](getting-started/install.md#verify-permission-scope) with both allowed and denied operations.

## Agent integration guides

| Agent | Recommended entry | Available integration |
| --- | --- | --- |
| DSH Desktop (Windows) | [Plugin installation and use](https://github.com/finogeeks/finsafe/blob/main/integrations/dsh/windows/README.md) | Released: `@finogeeks2026/finshield-dsh` |
| OpenCode Desktop (Windows) | [Plugin installation and use](getting-started/install.md#opencode-desktop) | **Released**: `@finogeeks2026/finshield-opencode`; also available through the FinShield desktop launcher |
| Hermes Desktop (Windows) | [Desktop installation and launch](getting-started/install.md#hermes-desktop) | FinShield desktop launcher |
| Kilo CLI (Windows) | [Test plugin integration](getting-started/install.md#kilo-cli) | `@finogeeks2026/finshield-kilo` (test release, local interactive TUI) |
| Codex CLI (Windows) | [CLI integration](agents/codex.md) | **CLI integration supported** |
| Claude Code CLI (Windows) | [CLI integration](agents/claude.md) | **CLI integration supported** |
| WorkBuddy desktop (Windows) | [Desktop installation and launch](getting-started/install.md#windows) | Desktop launcher |
| Other Agents / Linux / macOS | [Compatibility and generic CLI examples](agents/compatibility.md) | Check the specific Agent |

## Understand FinShield and configure protection

- [FinShield product introduction](overview/product-introduction.md): cross-platform positioning, security, integration and Windows evaluation results.
- [Overall illustrated introduction](overview/finshield.html): security controls, records, enterprise management, and scoped evaluations.
- [Windows introduction](overview/windows.md) and [illustrated overview](overview/windows.html): permissions, system and desktop restrictions, and sensitive-information inspection.
- [Linux/macOS introduction](overview/linux-macos.md) and [illustrated overview](overview/linux-macos.html): platform capabilities, integration routes, and limits.
- [Protection capabilities and platform conditions](agents/compatibility.md#protection-and-platforms): check effective configuration and actual request coverage.

## PII plugin development

The [Windows PII developer kit](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/README.md) provides the SDK, protocol, detection / redaction examples, and local workbench. The [debugging guide](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/docs/debugging.md) explains the development workflow.

PII plugins extend sensitive-information processing and serve a different purpose from Agent integration plugins. Product integration needs matching versions and inspectable request paths. Commercial use requires prior written permission; see the [kit license](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/LICENSE).

## Enterprise deployment and further reading

The [FinShield whitepaper](reference/whitepaper.md) covers product capabilities, integration, implementation and current Safety Arena Windows results, including the 38-scenario matrix and scoring methods. Product introductions and the whitepaper provide further reading; start installation with the relevant Agent guide.

## Reference and support

- [Install, update, and uninstall](getting-started/install.md). Use the installed version's `finsafe help` for CLI interfaces.
- [Codex troubleshooting](agents/codex.md#troubleshooting) · [Claude troubleshooting](agents/claude.md#troubleshooting) · [Get help](getting-started/install.md#get-help).
- [Agent Safety Arena](https://safety.finaios.ai/): recordings, conditions, and results; [evaluation implementation and reproduction material](https://github.com/finogeeks/agent-safety-arena).
- [Release history](https://github.com/finogeeks/finsafe/blob/main/CHANGELOG.md) · [Report a problem](https://github.com/finogeeks/finsafe/issues/new/choose) · [Report with an Agent](https://github.com/finogeeks/finsafe/blob/main/CONTRIBUTING.md).

## Browse by topic

- [Product and protection boundaries](overview/README.md).
- [Install and verify](getting-started/README.md).
- [Agent integration](agents/README.md).
- [Configure and verify protection](protection/README.md).
- [PII plugins and extensions](development/README.md).
- [Enterprise deployment](enterprise/README.md).
- [Reference and support](reference/README.md).
