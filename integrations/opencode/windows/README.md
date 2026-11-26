# FinShield for OpenCode Desktop

**[Documentation](https://finshield.finogeeks.club/en/agents/opencode.html) · [What FinShield protects](https://finshield.finogeeks.club/en/protection/) · [简体中文](https://github.com/finogeeks/finsafe/blob/main/integrations/opencode/windows/README-zh.md)**

FinShield adds Windows sandbox protection to OpenCode Desktop's execution backend. Use the full guide for setup, configuration, updates and troubleshooting.

## Requirements

Windows x64 and OpenCode Desktop V2. This integration targets Desktop/SDK 2.3.0. An internet connection is needed to download the plugin and native components.

## Install

With the OpenCode V2 CLI available, run:

```sh
opencode plugin add @finogeeks2026/finshield-opencode
```

Open Desktop and check **Settings → FinShield**. Follow component preparation and Windows authorization prompts. When ready, save your work, exit OpenCode and open it manually; confirm actual protection. If you only have Desktop, follow the [Desktop-only installation instructions](https://finshield.finogeeks.club/en/agents/opencode.html#install-without-the-cli).

## Protection scope

This Windows integration protects the execution backend and retains the Desktop interface. File, system and desktop boundaries follow the effective configuration. Network mode defaults to `host`: protected status does not enable a FinShield website blacklist, HTTPS content inspection or PII redaction.

[Default protection](https://finshield.finogeeks.club/en/protection/defaults.html) · [Configuration](https://finshield.finogeeks.club/en/protection/configuration.html) · [Network and PII](https://finshield.finogeeks.club/en/protection/network-pii.html).

## Update and support

The FinShield page checks for package updates. When one is available, choose **Install update**, follow preparation prompts and reopen OpenCode when requested. Check protection after reopening. See the [full guide](https://finshield.finogeeks.club/en/agents/opencode.html) for troubleshooting and lifecycle details.

Use the plugin's **Feedback** link to include version and status, or [report a problem](https://github.com/finogeeks/finsafe/issues/new/choose). Published [DSH evaluations](https://safety.finaios.ai/agents/dsh/) are DSH evidence, not OpenCode test results.

Use is governed by the [product license](LICENSE.rtf). See [third-party notices](THIRD-PARTY-NOTICES.md).
