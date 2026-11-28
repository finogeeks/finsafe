---
aside: false
---

# FinShield Documentation

[中文](../zh-CN/README.md) · [Product home](https://github.com/finogeeks/finsafe) · [Latest download](https://github.com/finogeeks/finsafe/releases/latest)

FinShield (智安盾) is an operating-system sandbox for AI agent execution processes. Its Windows integrations add file, system and desktop controls to supported Agents such as OpenCode Desktop and WorkBuddy. macOS and Linux use their own integration routes; `finsafe` is the command-line tool.

Choose your [Agent integration](agents/README.md), then check [what FinShield protects by default](protection/README.md). PII detection and redaction require a supported content-inspection configuration.

## Enterprise AI security governance whitepaper

[Read the enterprise governance whitepaper](resources/agent-security-governance.md) on enterprise AI risks, layered security architecture, implementation planning and FinShield practice. The November 2026 edition includes English and Chinese PDF viewing, download and HTML full text.

## Start with your goal

| What you want to do | Start here |
| --- | --- |
| Understand the product and use an existing Agent | [Product introduction](overview/README.md), [install and verify](getting-started/install.md), [compatibility](agents/compatibility.md) |
| Protect your own application or extend PII processing | [Development and integration](development/README.md), [integration routes and a minimal example](development/integration-guide.md) |
| Discuss an enterprise solution and a pilot | [Enterprise solutions and contact](enterprise/README.md) |

## Technical blog

<div class="blog-section-lead"><p>An outline on Python and Node.js child-process compatibility in AppContainer.</p><a href="/en/blog/">Blog index</a></div>

<div class="blog-feature-wrap">
<a class="blog-feature" href="/en/blog/appcontainer-child-processes.html">
  <div class="blog-feature-copy"><p class="blog-meta">Article outline · Execution isolation</p><h3>How FinShield addresses Python and Node.js child-process compatibility in AppContainer</h3><p>AgentScope, Hermes, DSH and OpenCode examples, with a plan for native AC, MXC and FinShield comparisons.</p><span class="blog-read">View outline</span></div>
  <div class="blog-path" aria-hidden="true"><span class="blog-path-label">PROCESS &amp; CHANNELS</span><span class="blog-path-node">Protected Agent</span><span>↓</span><span class="blog-path-node blog-path-boundary">Python / Node.js</span><span>↓</span><span class="blog-path-node">Tool children</span><span class="blog-path-caption">PIPE / IPC / stdio</span></div>
</a>
</div>

## Understand the security mechanisms

Use the [security architecture index](architecture/README.md) to find where protection is enforced. Then check [advanced configuration and CLI reference](reference/cli-configuration.md) against the interfaces supported by your installed release.

- [Windows network isolation and WFP](architecture/windows-network.md): enforcement targets, proxy responsibilities and coverage limits.
- [Windows desktop interaction and Job UI](architecture/windows-job-ui.md): restrictions, compatibility choices and verification.
- [Inspector network and content inspection](architecture/inspector.md): traffic paths, TLS trust, PII, retention and failure behavior.

## Get started

New to FinShield? Read [common questions](reference/faq.md): 32 questions about AI safety, Agent safety, sandbox boundaries and why FinShield exists.

1. [Check compatibility](agents/compatibility.md): Agent form, platform, plugin status, and verification scope.
2. [Choose an integration route and install](getting-started/install.md): follow the DSH / OpenCode Windows plugin guides, use the FinShield launcher for Hermes Desktop or the test plugin for Kilo CLI, and follow the individual CLI guides for Codex and Claude.
3. [Verify protection](getting-started/install.md#verify-permission-scope) with both allowed and denied operations.

## Agent integration guides

| Agent | Recommended entry | Available integration |
| --- | --- | --- |
| Codex CLI (Windows) | [CLI integration](agents/codex.md) | **CLI integration supported** |
| Claude Code CLI (Windows) | [CLI integration](agents/claude.md) | **CLI integration supported** |
| OpenCode Desktop (Windows) | [Plugin installation and use](https://github.com/finogeeks/finsafe/blob/main/integrations/opencode/windows/README.md) | **Released**: `@finogeeks2026/finshield-opencode`; also available through the FinShield desktop launcher |
| Hermes Desktop (Windows) | [Desktop installation and launch](getting-started/install.md#hermes-desktop) | FinShield desktop launcher |
| Kilo CLI (Windows) | [Test plugin integration](getting-started/install.md#kilo-cli) | `@finogeeks2026/finshield-kilo` (test release, local interactive TUI) |
| DSH Desktop (Windows) | [Plugin installation and use](https://github.com/finogeeks/finsafe/blob/main/integrations/dsh/windows/README.md) | Released: `@finogeeks2026/finshield-dsh` |
| WorkBuddy desktop (Windows) | [Desktop installation and launch](agents/workbuddy.md) | Desktop launcher |
| Other Agents / Linux / macOS | [Compatibility and generic CLI examples](agents/compatibility.md) | Check the specific Agent |

## Understand FinShield and configure protection

- [What FinShield protects](protection/README.md): defaults, allowed operations, configuration effects, website access and PII scope.
- [Windows system and desktop protection](protection/windows-security.md): Job/UI, low-level API access, compatibility exceptions and verification.
- [FinShield product introduction](overview/README.md): cross-platform positioning, security, integration and Windows evaluation results.
- [Overall illustrated introduction](overview/finshield.html): security controls, records, enterprise management, and scoped evaluations.
- [Windows introduction](overview/windows.md) and [illustrated overview](overview/windows.html): permissions, system and desktop restrictions, and sensitive-information inspection.
- [Linux/macOS introduction](overview/linux-macos.md) and [illustrated overview](overview/linux-macos.html): platform capabilities, integration routes, and limits.
- [Protection capabilities and platform conditions](agents/compatibility.md#protection-and-platforms): check effective configuration and actual request coverage.

## PII plugin development

The [Windows PII developer kit](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/README.md) provides the SDK, protocol, detection / redaction examples, and local workbench. The [debugging guide](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/docs/debugging.md) explains the development workflow.

PII plugins extend sensitive-information processing and serve a different purpose from Agent integration plugins. Product integration needs matching versions and inspectable request paths. Commercial use requires prior written permission; see the [kit license](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/LICENSE).

## Enterprise solutions and further reading

[Enterprise solutions](enterprise/README.md) explains assessment, pilots and engagement. [Contact Finogeeks](mailto:contact@finogeeks.com) to discuss your environment and delivery scope.

The [mechanisms and evaluation archive](reference/whitepaper.md) covers product capabilities, integration, implementation and the edition’s Safety Arena Windows results, including the 38-scenario matrix and scoring methods. Use the enterprise governance whitepaper above for the formal publication; start installation with the relevant Agent guide.

## Reference and support

- [Install, update, and uninstall](getting-started/install.md). Use the installed version's `finsafe help` for CLI interfaces.
- [Codex troubleshooting](agents/codex.md#troubleshooting) · [Claude troubleshooting](agents/claude.md#troubleshooting) · [Get help](getting-started/install.md#get-help).
- [Agent Safety Arena](https://safety.finaios.ai/): recordings, conditions, and results; [evaluation implementation and reproduction material](https://github.com/finogeeks/agent-safety-arena).
- [Release history](https://github.com/finogeeks/finsafe/blob/main/CHANGELOG.md) · [Report a problem](https://github.com/finogeeks/finsafe/issues/new/choose) · [Report with an Agent](https://github.com/finogeeks/finsafe/blob/main/CONTRIBUTING.md).

## Browse by topic

- [Product overview](overview/README.md).
- [Install and verify](getting-started/install.md).
- [Agent integration](agents/README.md).
- [Configure and verify protection](protection/README.md).
- [Development and integration](development/README.md).
- [Technical blog](blog/README.md).
- [Enterprise solutions](enterprise/README.md).
- [Reference and support](reference/README.md).

## Architecture and diagrams

[Browse architecture diagrams and technical designs](architecture/README.md).
