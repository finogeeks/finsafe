# FinShield for OpenCode Desktop

**[Documentation](https://finshield.finogeeks.club/en/agents/opencode.html) · [Safety evaluations](https://safety.finaios.ai/) · [简体中文](https://github.com/finogeeks/finsafe/blob/main/integrations/opencode/windows/README-zh.md)**

**Let your agent work. Keep its access under control.**

Agents can do more than delete files: they can access private information, disrupt your desktop and change system settings. FinShield adds Windows sandbox protection to OpenCode Desktop's execution backend, controlling access to files, system functions and the desktop while preserving your usual coding workflow.

## See protection in action

These GIFs illustrate FinShield protection across four risk categories:

| Privacy · Screen access | Desktop · Disruptive pop-ups | System · Process protection | Data · File protection |
| :---: | :---: | :---: | :---: |
| [![Screen capture comparison](https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/screen-capture.gif)](https://safety.finaios.ai/screen-capture/dsh/dsh-desktop-file-v3-20261109/index.html) | [![Desktop interference comparison](https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/window-flood.gif)](https://safety.finaios.ai/window-flood/dsh/dsh-finshield-pro-20261105/index.html) | [![Process protection comparison](https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/process-terminate.gif)](https://safety.finaios.ai/process-terminate/dsh/dsh-python-file-v2-20261111/index.html) | [![File protection comparison](https://raw.githubusercontent.com/finogeeks/finsafe/main/integrations/dsh/windows/detail/assessments/protected-directory-delete.gif)](https://safety.finaios.ai/protected-directory-delete/dsh/dsh-direct-v4-20261112/index.html) |

These excerpts come from Finogeeks' published **DSH evaluations, not OpenCode tests**. Select a GIF for full recordings, test conditions and results. Each comparison shows separate test runs and does not establish that the current OpenCode plugin has passed the same evaluations.

## Requirements

- Windows x64.
- OpenCode Desktop V2; this integration targets Desktop/SDK 2.3.0.
- An internet connection to download the plugin and native components.

## Install

1. **Add the plugin.** With the OpenCode V2 CLI available, run:

   ```sh
   opencode plugin add @finogeeks2026/finshield-opencode
   ```

   If you only have Desktop without the CLI, follow the [Desktop-only installation instructions](https://finshield.finogeeks.club/en/agents/opencode.html#install-without-the-cli).

2. **Open the plugin page.** Reopen OpenCode Desktop and go to **Settings → FinShield** to check component preparation progress.
3. **Complete first-time preparation.** FinShield downloads and prepares components in the background. Windows may ask for administrator consent. You can keep using OpenCode while preparation runs; wait for the page to indicate it is ready.
4. **Reopen and confirm protection.** When prompted, save your work, exit OpenCode and open it manually. Return to **Settings → FinShield** and check actual protection. If protection is not active, check the page for preparation progress or an error.

## Protection scope

This Windows integration protects the execution backend and retains the Desktop interface. File, system and desktop boundaries follow the effective configuration. Network mode defaults to `host`: protected status does not enable a FinShield website blacklist, HTTPS content inspection or PII redaction.

See [protection scope and configuration](https://finshield.finogeeks.club/en/protection/) for permissions and the effects of available settings.

## Everyday use and support

- **Check status:** Open **Settings → FinShield** at any time for preparation progress and actual protection status.
- **Update:** The FinShield page checks for package updates. When one is available, choose **Install update**, follow preparation prompts and reopen OpenCode when requested. Confirm protection after reopening.
- **Troubleshoot:** If FinShield is missing from Settings or protection remains inactive after preparation, see the [troubleshooting instructions](https://finshield.finogeeks.club/en/agents/opencode.html#troubleshooting).

If you encounter a problem, use the plugin's **Feedback** link to include version and status, or [report a problem](https://github.com/finogeeks/finsafe/issues/new/choose).

Use is governed by the [product license](LICENSE.rtf). See [third-party notices](THIRD-PARTY-NOTICES.md).
