# Advanced CLI and configuration

[简体中文](../../zh-CN/reference/cli-configuration.md) · [Reference](README.md) · [Configuration effects](../protection/configuration.md)

A setting absent from the interface may still have a supported CLI entry. An accepted CLI value does not prove that the current process changed. This page explains how to choose public entries, place arguments and verify activation. It is an entry to existing public commands and fields, not an exhaustive option list for every platform and subcommand.

**Scope:** the Windows personal edition's effective-configuration entry, published Windows Job/UI options and PII integration settings. See [platform and Agent scope](../agents/compatibility.md) for Linux/macOS policy formats and runtime requirements. Check the installed version's help for option availability; help alone does not replace entry-specific support information and verification.

## Classify an option before using it

| Status | Basis | How to use it |
| --- | --- | --- |
| Supported | The current delivery has a public entry, version scope and instructions | Follow those instructions and verify the target instance |
| Experimental | Documentation explicitly defines a test or experimental scope | Pin the stated versions and verify in a dedicated environment; do not claim cross-platform support |
| Internal or incomplete | Only source, parser fields, old documents or prototypes exist | Do not treat it as supported configuration or infer effects from its name |

“CLI only” describes an operating interface; “not implemented” describes capability status. Assess them separately. See [currently public entries](../protection/configuration.md#currently-documented-entry-points).

## Identify the command, version and configuration target

Record `finsafe --version`, then read the subcommand's help. Common Windows entries include:

```powershell
finsafe help
finsafe run --help
finsafe self-confine --help
finsafe prepare check --help
```

With several installations, plugins or configurations, use the actual EXE's full path to avoid a different PATH version. Select the effective configuration used by that installation. Identically named DSH, OpenCode and standalone personal-edition files do not identify the same instance.

| Entry or option | Purpose and position | Defaults and activation boundary |
| --- | --- | --- |
| `self-confine --yaml-path <path>` | Select a prepared effective configuration for this Windows execution | The example selects explicitly rather than relying on an installation default; file existence is not authorization |
| `prepare check --yaml-path <path> --json` | Query preparation for the selected configuration | Read JSON `result` and `differences`; the matching state is `same`. Exit code 0 does not mean a match. Grants no new authorization and does not alone prove a runtime restriction |
| `--stdio inherit` | After `run` or `self-confine`, select inherited input and output | Interactive examples select it explicitly; other modes/defaults depend on that command version; it changes no file/network permission |
| `--integration-id <id>` | After the execution subcommand, label record attribution | Selects no permissions, desktop defaults or Agent adaptation; changing a label adds no protection |
| `--` | Pass the remaining program and arguments to the launched command | Subsequent flags belong to that program; keep them out of the FinSAFE argument section |
| `--windows-ui-*`, `--windows-desktop` | Launch options on supported Windows execution entries | See the next section for values/defaults; these are not identically named Candidate fields |

See [minimal CLI integration](../development/integration-guide.md#minimal-windows-cli-integration) for a launch template and recoverable file tests. Use the respective [Agent guides](../agents/README.md) for Codex and Claude arguments.

## Desktop and Job UI options

[Windows system and desktop protection](../protection/windows-security.md#cli-ui-permissions) owns the value/default table for clipboard, UI-object isolation, desktop control, system settings, IME, injection and initial desktop placement.

For example, `--windows-ui-clipboard read` removes the clipboard read restriction while writes remain restricted. It does not mean “read only after a user click.” `--windows-ui-isolation desktop` and `--windows-desktop inherit` address different dimensions. Allowing a group changes its corresponding restriction; AppContainer and other object permissions still apply.

Record the default and reason before adjusting. Afterward verify both the operation needing compatibility and the operations that must remain denied. Do not infer generic CLI defaults from a GUI plugin's behavior, or claim a plugin settings page exposes an option merely because the CLI accepts it.

## How YAML fields relate to launch arguments

| Configuration surface | Primary explanation | Relationship to the CLI |
| --- | --- | --- |
| File coverage and path permissions | [File permission fields](../protection/configuration.md#file-permission-fields) | Execution consumes the selected effective configuration; launch alone grants no new file permissions |
| Network mode and destinations | [Network and PII fields](../protection/configuration.md#network-and-pii-fields) | Actual mode determines routing; successful launch proves no proxy or content inspection activation |
| PII, edits and retention | [Network, exfiltration and PII](../protection/network-pii.md) | Use a supported product path and example; independent plugin testing proves no Agent request coverage |
| Resources | [Resource fields](../protection/configuration.md#resource-fields) | Check platform enforcement and effective values; `max` is not a finite resource quota |
| UI and initial desktop | [Public CLI options](../protection/windows-security.md#cli-ui-permissions) | These are launch inputs, not fields to invent in YAML |

There is no universal rule that CLI arguments override YAML. Identify whether they affect the same property, entry and configuration target, then use that property's public contract. Do not exchange old wrapper YAML, Windows Candidate, Effective and legacy JSON based only on filenames.

## From saved configuration to active behavior

This diagram covers configuration stages in the public PII workflow. Input is the selected Candidate; output is content settings used for subsequent requests. It does not replace authorization needed for file permissions, TLS trust or network-scope changes.

```mermaid
flowchart LR
    C[Save selected Candidate] --> M[Materialize matching Effective]
    M --> A[Authorize or refresh as the change requires]
    A --> V[Verify subsequent real operations]
```

The PII example script backs up and replaces the complete network configuration, then invokes existing materialization and Inspector refresh. Saving, materialization and refresh can fail separately; do not report all three as success. Refresh affects subsequently processed requests, while in-flight requests keep their previous settings. See the [redactor example](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/examples/redactor/README.md) for full steps and recovery limits.

Do not manually edit generated `effective.yaml` in place of the configuration workflow. Do not replace a narrower destination scope with the example's broad endpoint settings.

## Keep verification records for advanced changes

Record product/platform versions, actual EXE, selected configuration, changed properties and before/after values, authorization/activation results, test inputs, original results and final state. Verify I/O, files, desktop and network separately. A single protected status proves no complete set of capabilities.

This page organizes public interfaces; it does not rerun Windows installed-product acceptance. Use [releases](https://github.com/finogeeks/finsafe/releases/latest) for current packages. Published evaluations establish only their recorded platform, version and scenario. For an undocumented option or version conflict, retain redacted errors and [get help](../getting-started/install.md#get-help).
