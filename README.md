# FinShield

<!-- Generated for the public repository from upstream documentation sources. Edit the source, not the published copy. -->

**Let mainstream Agents work within clear security boundaries.**

FinShield (formerly FinSAFE) gives DSH, OpenCode, Hermes, Kilo, Codex, Claude Code, WorkBuddy, and other Agents a security boundary for files, system functions, and the desktop. Prefer a released Agent integration plugin, or connect through the `finsafe` CLI when no plugin is available. The product supports Windows, macOS, and Linux; see the [compatibility matrix](docs/en/agents/compatibility.md) for each Agent form and verification scope.

[简体中文](README-zh.md) · [Technical documentation](https://finogeeks.github.io/finsafe/) · [FinShield on finaios.ai](https://finaios.ai/en/products/finshield/)

## Four risks when Agents operate your computer

Screenshots can expose private information, pop-ups can disrupt work, and process or file operations can damage your working environment. These four DSH cases compare ordinary runs with FinShield protection.

| [Privacy leaks](https://safety.finaios.ai/agents/dsh/index.html#privacy) | [Desktop disruption](https://safety.finaios.ai/agents/dsh/index.html#interaction) | [System damage](https://safety.finaios.ai/agents/dsh/index.html#system) | [Data deletion](https://safety.finaios.ai/agents/dsh/index.html#data) |
| :---: | :---: | :---: | :---: |
| <a href="https://safety.finaios.ai/agents/dsh/index.html#privacy"><img src="https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/screen-capture.gif" width="180" alt="Screen capture leak comparison"></a> | <a href="https://safety.finaios.ai/agents/dsh/index.html#interaction"><img src="https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/window-flood.gif" width="180" alt="Pop-up flood comparison"></a> | <a href="https://safety.finaios.ai/agents/dsh/index.html#system"><img src="https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/process-terminate.gif" width="180" alt="Forced process termination comparison"></a> | <a href="https://safety.finaios.ai/agents/dsh/index.html#data"><img src="https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/protected-directory-delete.gif" width="180" alt="Protected-directory deletion comparison"></a> |
| Capturing private screen content | Flooding the desktop with pop-ups | Forcibly terminating processes | Deleting protected directories |

Select a GIF for the full assessment. Previews are reused from the DSH plugin and excerpt separate test runs; see each assessment page for test conditions, configuration, and protection scope.

## Choose your Agent

| Agent | Start here | Available integration |
| --- | --- | --- |
| DSH Desktop (Windows) | [Install the plugin](https://github.com/finogeeks/finsafe/blob/main/integrations/dsh/windows/README.md) | **Released**: `@finogeeks2026/finshield-dsh` |
| OpenCode Desktop (Windows) | [Plugin installation and use](docs/en/getting-started/install.md#opencode-desktop) | **Released**: `@finogeeks2026/finshield-opencode`; also available through the FinShield desktop launcher |
| Hermes Desktop (Windows) | [Desktop installation and launch](docs/en/getting-started/install.md#hermes-desktop) | FinShield desktop launcher |
| Kilo CLI (Windows) | [Test plugin integration](docs/en/getting-started/install.md#kilo-cli) | `@finogeeks2026/finshield-kilo` (test release, local interactive TUI) |
| Codex CLI (Windows) | [CLI integration guide](docs/en/agents/codex.md) | **CLI integration supported** |
| Claude Code CLI (Windows) | [CLI integration guide](docs/en/agents/claude.md) | **CLI integration supported** |
| WorkBuddy desktop (Windows) | [Desktop installation and launch](docs/en/getting-started/install.md#windows) | Desktop launcher |
| Other Agents / Linux / macOS | [Compatibility and generic CLI examples](docs/en/agents/compatibility.md) | Check the specific Agent |

CLI integration and plugin release are separate states. Codex / Claude CLI results do not establish desktop-app or IDE-extension integration. Platform support does not verify every feature of every Agent.

## Prefer plugin integration

In DSH Desktop Windows, open **Plugins → Add plugin**, install and enable [`@finogeeks2026/finshield-dsh`](https://www.npmjs.com/package/@finogeeks2026/finshield-dsh), then follow the prompts for native components, authorization, and required restarts. Confirm actual protection status. See the [plugin guide](https://github.com/finogeeks/finsafe/blob/main/integrations/dsh/windows/README.md) for version requirements, migration from the older package, and removal.

For **OpenCode Desktop on Windows x64**, save your work and close OpenCode, then run this in PowerShell with the default per-user Desktop installation:

```powershell
$openCodeCli = "$env:LOCALAPPDATA\Programs\ai.opencode.desktop\resources\opencode-cli.exe"
& $openCodeCli plugin add '@finogeeks2026/finshield-opencode'
```

For an all-users Desktop installation, use `$env:ProgramFiles\ai.opencode.desktop\resources\opencode-cli.exe`. For a custom installation, use its `resources\opencode-cli.exe`. If `opencode` is already on PATH, `opencode plugin add @finogeeks2026/finshield-opencode` is also available.

Open OpenCode and go to **Settings → FinShield**. The plugin downloads and installs matching native FinShield components and requests Windows authorization. After preparation, save your work, exit, and reopen OpenCode manually, then confirm protection status. See [installation and directory locations](docs/en/getting-started/install.md#opencode-desktop) and the [published plugin guide](https://github.com/finogeeks/finsafe/blob/main/integrations/opencode/windows/README.md).

For the Kilo CLI local interactive TUI test plugin and version scope, see [Kilo integration](docs/en/getting-started/install.md#kilo-cli).

Hermes Desktop and OpenCode Desktop can also start through the FinShield desktop launcher. Codex and Claude already support CLI integration without a plugin; follow the guides above. Standalone plugin delivery is described separately from existing CLI support. Confirm effective protection after installation or launch.

## Use the command line without a plugin

After installing FinShield, use `finsafe` to start the process that executes Agent work. On Windows, the Codex guide wraps `app-server` and connects a terminal UI; the Claude guide wraps the CLI directly. Both include preparation checks and protection verification.

[Install and choose a route](docs/en/getting-started/install.md) · [Codex CLI](docs/en/agents/codex.md) · [Claude Code CLI](docs/en/agents/claude.md)

Windows users can [download the install assistant](https://github.com/finogeeks/finsafe/releases/latest/download/install-finshield.cmd). See the [latest Release](https://github.com/finogeeks/finsafe/releases/latest) for macOS, Linux, and offline packages. For policy examples for other Agents, see the [compatibility matrix](docs/en/agents/compatibility.md); adapt and verify them for current versions.

## Protection and evaluations

- **File and workspace permissions** control reads and modifications within authorized scope.
- **System and desktop restrictions** constrain Agent operations on processes, the system, and desktop.
- **Sensitive-information inspection** detects and handles content on integrated, inspectable request paths according to policy.
- **Records and audit** retain inspectable execution records according to product configuration.

[Agent Safety Arena](https://safety.finaios.ai/) provides comparisons for multiple Agents, with recordings, conditions, and results.

## Enterprise deployment and further reading

- [Install and get started](docs/en/getting-started/install.md): downloads, installation, first launch, and permission checks.
- [Compatibility matrix](docs/en/agents/compatibility.md): Agent forms, platforms, plugin status, and verification evidence.
- [Overall illustrated introduction](docs/en/overview/finshield.html): capabilities, enterprise management, and scoped evaluations.
- [Documentation and whitepaper](docs/en/README.md): Windows, Linux/macOS, and the complete product approach.
- [DSH Windows plugin](https://github.com/finogeeks/finsafe/blob/main/integrations/dsh/windows/README.md): installation, authorization, updates, and removal.
- [Whitepaper](docs/en/reference/whitepaper.md): complete product approach, enterprise integration, and technical basis.
- [Report a problem](https://github.com/finogeeks/finsafe/issues/new/choose) · [Report with your agent](https://github.com/finogeeks/finsafe/blob/main/CONTRIBUTING.md#preferred-intake-issues) · [Release history](https://github.com/finogeeks/finsafe/blob/main/CHANGELOG.md).

Protection depends on the launch entry, effective permissions, and version. Content checks cover integrated, inspectable requests. Published by Finogeeks; use is subject to the supplied license terms.


PII plugins extend sensitive-information detection and redaction. They serve a different purpose from the Agent integration plugins above.

## Develop a PII plugin (Windows)

The [PII plugin developer kit](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/README.md) includes the SDK, protocol,
examples, local workbench and integration instructions. Use a Windows FinShield
release with external PII support. `pii-plugins/release.json` identifies the
matching product release and source revision.

FinShield Personal Edition is free to use under its product terms. Commercial
use of plugins developed with this kit requires prior written permission from
Finogeeks. Free personal-edition use does not grant a plugin commercial license.
See the [developer kit license](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/LICENSE). Contact:
[contact@finogeeks.com](mailto:contact@finogeeks.com).
