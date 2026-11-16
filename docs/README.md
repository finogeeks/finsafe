# FinShield documentation

[简体中文](README-zh.md) · [Product home](https://github.com/finogeeks/finsafe) · [Latest download](https://github.com/finogeeks/finsafe/releases/latest)

FinShield gives mainstream Agents a security boundary for files, system functions, and the desktop. Prefer a released Agent integration plugin, or connect through the `finsafe` CLI. PII plugins extend sensitive-information detection and redaction.

## Get started

1. [Check compatibility](agent-compatibility-en.md): Agent form, platform, plugin status, and verification scope.
2. [Choose an integration route and install](getting-started-en.md): prefer the released DSH Windows plugin; follow the individual CLI guides for Codex and Claude.
3. [Verify protection](getting-started-en.md#verify-permission-scope) with both allowed and denied operations.

## Agent integration guides

| Agent | Recommended entry | Available integration |
| --- | --- | --- |
| DSH Desktop (Windows) | [Plugin installation and use](https://github.com/finogeeks/finsafe/blob/main/integrations/dsh/windows/README.md) | Released: `@finogeeks2026/finshield-dsh` |
| Codex CLI (Windows) | [CLI integration](codex-cli-en.md) | **CLI integration supported** |
| Claude Code CLI (Windows) | [CLI integration](claude-cli-en.md) | **CLI integration supported** |
| WorkBuddy desktop (Windows) | [Desktop installation and launch](getting-started-en.md#windows) | Desktop launcher |
| Other Agents / Linux / macOS | [Compatibility and generic CLI examples](agent-compatibility-en.md) | Check the specific Agent |

## Understand FinShield and configure protection

- [Overall illustrated introduction](finshield-overview-en.html): security controls, records, enterprise management, and scoped evaluations.
- [Windows introduction](finsafe-windows-overview-en.md) and [illustrated overview](finsafe-windows-overview-en.html): permissions, system and desktop restrictions, and sensitive-information inspection.
- [Linux/macOS introduction](finsafe-linux-macos-overview-en.md) and [illustrated overview](finsafe-linux-macos-overview-en.html): platform capabilities, integration routes, and limits.
- [Protection capabilities and platform conditions](agent-compatibility-en.md#protection-and-platforms): check effective configuration and actual request coverage.

## PII plugin development

The [Windows PII developer kit](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/README.md) provides the SDK, protocol, detection / redaction examples, and local workbench. The [debugging guide](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/docs/debugging.md) explains the development workflow.

PII plugins extend sensitive-information processing and serve a different purpose from Agent integration plugins. Product integration needs matching versions and inspectable request paths. Commercial use requires prior written permission; see the [kit license](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/LICENSE).

## Enterprise deployment and further reading

The [FinShield whitepaper](finsafe-whitepaper-en.md) covers the complete product approach, enterprise integration, technical basis, and experiments. Product introductions and the whitepaper provide further reading; start installation with the relevant Agent guide.

## Reference and support

- [Install, update, and uninstall](getting-started-en.md). Use the installed version's `finsafe help` for CLI interfaces.
- [Codex troubleshooting](codex-cli-en.md#troubleshooting) · [Claude troubleshooting](claude-cli-en.md#troubleshooting) · [Get help](getting-started-en.md#get-help).
- [Agent Safety Arena](https://safety.finaios.ai/): recordings, conditions, and results; [evaluation implementation and reproduction material](https://github.com/finogeeks/agent-safety-arena).
- [Release history](https://github.com/finogeeks/finsafe/blob/main/CHANGELOG.md) · [Report a problem](https://github.com/finogeeks/finsafe/issues/new/choose) · [Report with an Agent](https://github.com/finogeeks/finsafe/blob/main/CONTRIBUTING.md).
