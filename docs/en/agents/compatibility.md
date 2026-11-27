# Agent compatibility matrix

[中文](../../zh-CN/agents/compatibility.md) · [Documentation](../README.md) · [Get started](../getting-started/install.md)

FinShield provides a security boundary for mainstream Agents. Prefer a released Agent integration plugin; use the `finsafe` CLI when no plugin is available. The product supports Windows, macOS, and Linux, but each Agent form, integration route, and verification scope must be checked separately.

Reviewed on 2026-11-24. **CLI supported** means command-line integration is available now. **Released** means a public delivery entry exists. **Evaluation verified** means evidence exists for specific versions, configuration, and cases. **Examples available** means policy material exists and the current version still needs verification. Agent integration and standalone plugin delivery are listed separately; the absence of a public plugin entry does not affect existing CLI integration.

## Choose an Agent

| Agent / form | Platform | Agent integration plugin | Route without a plugin | Versions and verification scope |
| --- | --- | --- | --- | --- |
| DSH Desktop | Windows x64 | **Released**: `@finogeeks2026/finshield-dsh` | FinShield desktop launcher | Requires DSH `>=0.2.1-rc.5 <0.3.0` and Node `>=24.9.0`; follow the [plugin guide](https://github.com/finogeeks/finsafe/blob/main/integrations/dsh/windows/README.md) |
| OpenCode Desktop | Windows x64 | **Released**: `@finogeeks2026/finshield-opencode`; see [installation](../getting-started/install.md#opencode-desktop) | FinShield Console / Widget desktop launcher | Desktop/SDK 2.3.0 integration target; 2.3.2 has separate installed exit evidence. Plugin protection covers the execution Host; Desktop Main remains ordinary. Use the released plugin requirements for the installed Agent version |
| Hermes Desktop | Windows x64 | No released standalone Hermes plugin entry | FinShield Console / Widget desktop launcher; see [setup](../getting-started/install.md#hermes-desktop) | Discovers registered MSIX and source installations. Desktop connects to a protected execution Host using its native profile; the desktop UI itself is not confined. The experimental Hermes plugin is separate from this launcher |
| Kilo CLI, local interactive TUI | Windows x64 | **Test release**: `@finogeeks2026/finshield-kilo@0.11.1-debug.6` | No standalone desktop-launcher route documented here | Kilo 7.8.27, matching native FinShield 0.11.1. Protected-process binding has installed evidence; session restoration and exit acceptance remain incomplete. Headless, remote, Desktop and IDE forms are outside this scope. See [test setup](../getting-started/install.md#kilo-cli) |
| Codex CLI | Windows x64 | No public plugin entry currently | **CLI supported** (evaluation verified): `self-confine` wraps `app-server`; the TUI connects to that server. See the [guide](codex.md) | Arena records Codex `0.166.0`; its Windows FinShield `0.10.9` route is documented below. This is not a blanket compatibility promise for later releases |
| Claude Code CLI | Windows x64 | No public plugin entry currently | **CLI supported** (evaluation verified): `self-confine` wraps the Claude CLI. See the [guide](claude.md) | Arena records Claude `2.1.314` and uses the same installed FinShield configuration as Codex; consult individual evaluation records |
| WorkBuddy desktop | Windows x64 | No released standalone plugin entry on this page | FinShield desktop launcher | Desktop integration and evaluation material exist; consult the [evaluations](https://safety.finaios.ai/) and [desktop setup](../getting-started/install.md#windows) for versions and configuration |
| Codex, Hermes, OpenCode, agy CLI | Linux / macOS; select by example | No released plugin entry on this page | **Examples available**: generic `run` / `self-confine` and [sample policies](https://github.com/finogeeks/finsafe/tree/main/examples/wrapper-policies/agent-sandbox) | Examples can contain older Agent arguments. Check, adapt, and verify them for the installed version. Windows guides do not transfer directly |
| Other / custom Agents | Depends on release package and host capabilities | Check actual delivery status for that Agent | Generic CLI integration needs adaptation and verification | Starting a process does not verify all Agent tools or protection features |

Codex CLI results do not cover the Codex desktop app or IDE extension. Claude Code CLI results do not cover Claude Desktop. Plugin installation, process startup, and effective protection are separate states.

## Two kinds of plugins

- **Agent integration plugins** connect FinShield to an Agent and handle installation, launch, authorization, and protection status. DSH, OpenCode Desktop, and the Kilo CLI test plugin are in this category.
- **PII detection / redaction plugins** extend sensitive-information detection and text rewriting. The existing [Windows developer kit](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/README.md) includes the SDK, protocol, examples, and local workbench. It is not a Codex or Claude integration plugin.

The PII kit's `pii-plugins/release.json` identifies its matching product release. Standalone debugging does not prove that an Agent's real requests are inspected. Product integration also needs matching versions, network configuration, and inspectable request paths. Commercial plugin use requires prior written permission; see the [kit license](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/LICENSE).

## Protection and platforms

| Capability | What to check |
| --- | --- |
| File and workspace permissions | Effective policy and authorization; test both allowed and denied operations in test directories |
| System and desktop restrictions | Launch route, Windows desktop / terminal mode, and actual platform capabilities |
| Network and sensitive-information inspection | Integrated proxy, TLS inspection, destination, and request format; CLI wrapping alone does not prove PII inspection is enabled |
| Records and audit | Installed version, effective configuration, and actual records; `--integration-id` labels the source and grants no permissions |

Windows uses AppContainer, macOS uses Seatbelt, and Linux depends on host capabilities such as bubblewrap and cgroup. Their permission, desktop, and resource controls differ. See the [Windows introduction](../overview/windows.md) and [Linux/macOS introduction](../overview/linux-macos.md).

## Evidence and updates

- [Codex wrapping implementation](https://github.com/finogeeks/agent-safety-arena/blob/main/docs/codex-finshield-recording.md) and [evaluation version profile](https://github.com/finogeeks/agent-safety-arena/blob/main/profiles/agents/codex/evaluation.json).
- [Claude wrapping implementation](https://github.com/finogeeks/agent-safety-arena/blob/main/docs/claude-finshield-recording.md) and [evaluation version profile](https://github.com/finogeeks/agent-safety-arena/blob/main/profiles/agents/claude/evaluation.json).
- [Agent Safety Arena](https://safety.finaios.ai/): recordings, conditions, and results. Integration in an evaluation tool does not establish a standalone product plugin release.

After upgrading FinShield or an Agent, record both versions and repeat the [permission checks](../getting-started/install.md#verify-permission-scope). Add a delivery entry, platform, versions, and verification evidence with each new matrix entry.
