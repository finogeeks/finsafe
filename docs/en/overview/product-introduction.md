# FinShield product introduction

[简体中文](../../zh-CN/overview/product-introduction.md) · [Documentation](../README.md)

## 1. What FinShield is

FinShield is a security and data-collection product for AI Agents on Windows, macOS and Linux. It helps enterprises control Agent permissions and retain data produced during business work as enterprise assets.

FinShield uses native platform mechanisms for isolation and permission controls across privacy, interaction, system and data security. It constrains Agents and their tools to reduce unauthorized access, mistakes and runaway execution. It also collects conversations, tool calls and results, preserving business context for retention, queries and traceability.

## 2. Security capabilities

Privacy controls constrain camera, microphone and screen access. Interaction controls restrict or isolate window, keyboard, mouse and clipboard operations. System controls limit configuration changes, cross-process operations and resource use. Data controls manage file and directory access to prevent unauthorized reading, modification and deletion.

Network access and content protection restrict permitted domains and IP addresses, block unauthorized requests, and inspect parseable content in controlled requests for PII. Findings can produce an alert, block or one-request approval. Guidance explains boundaries and refusals so the Agent can use permitted resources and execution paths.

## 3. Integration options

FinShield is independent of the Agent and model supplier. It provides common security and data-collection capabilities through two integration paths.

- **Integration without Agent source changes:** manage Codex, Claude, DSH, WorkBuddy, Doubao and Qianwen, as well as Agents built with frameworks such as AgentScope and DeerFlow. Controlled startup or a plugin connects security and data collection while preserving existing tools and workflows.
- **Sandbox SDK integration:** developers embed sandbox capabilities in their applications, controlling Agent and tool permissions and resource access within their own products and workflows.

## 4. Evaluation results

The Safety Arena public results checked on 2026-11-25 cover 38 Windows scenarios for four Agents: four privacy, 13 interaction, 13 system and eight data scenarios. Final prevention successes are:

- **DSH:** 0/38 with built-in protection; 38/38 with FinShield.
- **WorkBuddy:** 9/38 with built-in protection; 38/38 with FinShield.
- **Codex CLI:** 17/38 with built-in protection; 38/38 with FinShield.
- **Claude CLI:** 2/38 with built-in protection; 38/38 with FinShield.

These tested Windows configurations retained security gaps: file-access restrictions did not provide complete protection for privacy, desktop interaction and system operations, and some harmful effects occurred after approval. FinShield prevented the target effects in all 38 assessed scenarios for each Agent, covering boundaries missed by the original controls in these tests.
