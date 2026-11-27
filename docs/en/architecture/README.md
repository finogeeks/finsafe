# Security mechanisms and architecture

[中文](../../zh-CN/architecture/README.md) · [Documentation](../README.md)

Start with a concrete security question, then return to configuration and task guides. A mechanism, a released interface and one observed test result each have their own scope. Check your platform, release and integration route.

## Security mechanisms

| Topic | Question it answers |
| --- | --- |
| [Windows network isolation and WFP](windows-network.md) | Whose connections are restricted, how do WFP and the proxy differ, and how can you verify them? |
| [Windows desktop interaction and Job UI](windows-job-ui.md) | Which interactions are restricted, what do compatibility choices change, and how do you inspect effective values? |
| [Inspector network and content inspection](inspector.md) | Which requests are inspected, how are certificates and original text handled, and what happens on failure? |

For user-visible effects, see [Windows system and desktop protection](../protection/windows-security.md) and [network access and PII](../protection/network-pii.md). For operations, see [development and integration](../development/README.md) and [advanced configuration and CLI reference](../reference/cli-configuration.md).

## Plugin architecture

These designs come from public integration packages and retain their documented version and acceptance limits. They explain existing plugins; they do not establish a complete general-purpose host SDK contract.

- [DSH plugin architecture](https://github.com/finogeeks/finsafe/blob/main/integrations/dsh/windows/DESIGN.md)
- [OpenCode plugin architecture](https://github.com/finogeeks/finsafe/blob/main/integrations/opencode/windows/DESIGN.md)

## Product diagrams and platform boundaries

- [Windows](../overview/windows.html)
- [Linux / macOS](../overview/linux-macos.html)
- [FinShield](../overview/finshield.html)
- [mechanisms and evaluation archive](../reference/whitepaper.md)

## Plugin protocol and integration

- [PII protocol](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/docs/protocol.md)
- [PII integration](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/docs/integration.md)
