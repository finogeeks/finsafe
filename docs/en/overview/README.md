# FinShield: an operating-system sandbox for AI agents

[中文](../../zh-CN/overview/README.md) · [Documentation](../README.md)

## 1. What FinShield is

FinShield (智安盾) is an operating-system sandbox and security product for AI Agents on Windows, macOS and Linux. It controls access by protected execution processes and their tools. Enterprises can also use its data-collection capabilities to retain conversations, tool calls and results. The command-line tool is named `finsafe`.

FinShield uses native platform mechanisms for isolation and permission controls across privacy, interaction, system and data security. It constrains Agents and their tools to reduce unauthorized access, mistakes and runaway execution. It also collects conversations, tool calls and results, preserving business context for retention, queries and traceability.

## 2. Security capabilities

Privacy controls constrain camera, microphone and screen access. Interaction controls restrict or isolate window, keyboard, mouse and clipboard operations. System controls limit configuration changes, cross-process operations and resource use. Data controls manage file and directory access to prevent unauthorized reading, modification and deletion.

Supported network and content-inspection configurations can restrict permitted domains and IP addresses, block unauthorized requests, and inspect parseable content in controlled requests for PII. Findings can produce an alert, block or one-request approval. The released DSH and OpenCode Windows plugins use host networking by default; they do not enable HTTPS inspection or PII redaction. See [network access and PII](../protection/network-pii.md) for the separate requirements.

## 3. Integration options

FinShield is independent of the Agent and model supplier. It provides common security and data-collection capabilities through two integration paths.

- **Integration without Agent source changes:** use the Windows plugins for [OpenCode Desktop](https://github.com/finogeeks/finsafe/blob/main/integrations/opencode/windows/README.md) and DSH Desktop, the FinShield desktop launcher for WorkBuddy or Hermes Desktop, or the documented CLI routes for Codex and Claude. The [compatibility matrix](../agents/compatibility.md) lists the delivered routes, matching versions and test releases.
- **Sandbox SDK integration:** developers embed sandbox capabilities in their applications, controlling Agent and tool permissions and resource access within their own products and workflows.

## 4. Evaluation results

The [Safety Arena public results](https://safety.finaios.ai/) checked on 2026-11-25 cover 38 Windows scenarios for four Agents: four privacy, 13 interaction, 13 system and eight data scenarios. Final prevention successes are:

- **[DSH](https://safety.finaios.ai/agents/dsh/):** 0/38 with built-in protection; 38/38 with FinShield.
- **[WorkBuddy](https://safety.finaios.ai/agents/workbuddy/):** 9/38 with built-in protection; 38/38 with FinShield.
- **[Codex CLI](https://safety.finaios.ai/agents/codex-cli/):** 17/38 with built-in protection; 38/38 with FinShield.
- **[Claude CLI](https://safety.finaios.ai/agents/claude-cli/):** 2/38 with built-in protection; 38/38 with FinShield.

The FinAIOS team that develops FinShield also maintains these evaluations. See the [counting method and project relationship](https://safety.finaios.ai/methodology/) and [original evaluation material](https://github.com/finogeeks/agent-safety-arena).

These tested Windows configurations retained security gaps: file-access restrictions did not provide complete protection for privacy, desktop interaction and system operations, and some harmful effects occurred after approval. FinShield prevented the target effects in all 38 assessed scenarios for each Agent, covering boundaries missed by the original controls in these tests.

## 5. Platform guides and further reading

Execution boundaries, desktop capabilities and recording scope differ by platform. Choose the guide for your working environment:

| Guide | What it explains |
| --- | --- |
| [Windows capabilities](windows.md) | Interaction, system and data protection, plus runtime records on Windows |
| [Linux/macOS capabilities](linux-macos.md) | Native isolation, integration prerequisites and platform differences |
| [Protection defaults and configuration](../protection/README.md) | Effective defaults, allowed operations and verification for each integration |

See the [illustrated introduction](finshield.html) for diagrams, or [security mechanisms](../architecture/README.md) for technical details. Check the [compatibility matrix](../agents/compatibility.md) for the actual platform, Agent form and version scope.
