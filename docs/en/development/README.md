# Development and integration

[中文](../../zh-CN/development/README.md) · [Documentation](../README.md)

Choose an entry by the task you need to complete. Using an existing plugin, launching a command through the CLI, integrating a host and extending PII processing have different platform, version and support requirements.

## Start integrating

- [Integration routes and a minimal example](integration-guide.md): choose an existing Agent, CLI, host SDK or PII extension route, run a public example and verify permissions.
- [Integrate with an AI coding agent](ai-integration.md): supply the right documents, environment and task, then review generated steps and record actual results.
- [Advanced configuration and CLI reference](../reference/cli-configuration.md): distinguish supported, experimental and internal options, then check defaults, precedence and activation.
- [Compatibility matrix](../agents/compatibility.md): check Agent form, operating system and version scope.

## Understand the security boundaries

| Your question | Technical explanation |
| --- | --- |
| Where is network access restricted? | [Windows network isolation and WFP](../architecture/windows-network.md) |
| Why is desktop interaction restricted? | [Windows desktop interaction and Job UI](../architecture/windows-job-ui.md) |
| How are requests inspected and redacted? | [Inspector network and content inspection](../architecture/inspector.md) |
| What does the current plugin enable by default? | [Plugin defaults](../protection/defaults.md), [configuration effects and activation](../protection/configuration.md) |

Installation, permission preparation, actual process protection and effective content inspection require separate verification. A component or option in source code does not establish a supported integration interface for your product release.

## Extend PII detection and redaction

The [Windows PII developer kit](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/README.md) owns the SDK, protocol, examples and local workbench. Follow its [debugging guide](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/docs/debugging.md); this navigation does not duplicate the protocol. PII detection/redaction plugins extend content processing and differ from Agent integration plugins. Match the kit and product versions and verify real request coverage. Commercial plugin use requires prior written permission; see the [kit license](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/LICENSE).

## Enterprise integration needs

For team deployment, enterprise management or a specific integration, see [enterprise solutions](../enterprise/README.md) and contact Finogeeks to confirm delivery scope.
