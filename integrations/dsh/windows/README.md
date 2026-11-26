# FinShield for DSH Desktop

**[Documentation](https://finshield.finogeeks.club/en/agents/dsh.html) · [What FinShield protects](https://finshield.finogeeks.club/en/protection/) · [简体中文](README-zh.md)**

FinShield adds Windows sandbox protection to DSH's Agent execution processes. Use the full guide for setup, configuration, updates and removal.

## Requirements

Windows x64; DSH Desktop `>=0.2.1-rc.5 <0.3.0`; Node `>=24.9.0` as required by the package. Other FinShield editions do not establish macOS/Linux support for this plugin.

## Install

1. Save active work. In DSH Desktop, open **Plugins → Add plugin**.
2. Install and enable `@finogeeks2026/finshield-dsh`.
3. Follow the native component setup and Windows authorization prompts.
4. When prompted, exit DSH and open it manually. Open **Plugins → Installed → FinShield** and confirm actual protection.

Use the desktop plugin manager; a separate CLI can target a different profile. See the [full installation guide](https://finshield.finogeeks.club/en/agents/dsh.html) for details and older-package migration.

## Protection scope

The protected process has file, system, device-privacy and desktop-interaction boundaries. Access follows the effective configuration; writable files can still be changed or deleted. Network mode defaults to `host`: this plugin does not provide a FinShield website blacklist, proxy/TLS content inspection or PII redaction.

[Default protection](https://finshield.finogeeks.club/en/protection/defaults.html) · [Configuration](https://finshield.finogeeks.club/en/protection/configuration.html) · [Network and PII](https://finshield.finogeeks.club/en/protection/network-pii.html).

## Update, disable and support

Update through DSH and follow the native setup prompts. Exit and reopen DSH when requested. Disabling a plugin does not move an already running process out of its sandbox. Removing the plugin retains native components, configuration and logs; see the [operation guide](https://finshield.finogeeks.club/en/agents/dsh-operations.html) for complete removal steps.

[DSH evaluations](https://safety.finaios.ai/agents/dsh/) show scoped comparisons, not a guarantee for every operation. Use the plugin page's feedback link to include current version and status, or [report a problem](https://github.com/finogeeks/finsafe/issues/new?template=plugin_feedback_en.yml).

Use is governed by the [product license](LICENSE.rtf). See [third-party notices](THIRD-PARTY-NOTICES.md).
