# Get started with FinShield

[简体中文](getting-started-zh.md) · [Documentation](README.md) · [Product home](https://github.com/finogeeks/finsafe) · [Agent Safety Evaluation](https://agent-safety-arena.finogeeks.club/index.html) ([中文](https://agent-safety-arena.finogeeks.club/zh-CN.html))

Choose the package for your operating system. Windows offers an install assistant and an offline EXE; macOS and Linux use CLI archives. Download information was checked on 2026-11-03 against [v0.10.1](https://github.com/finogeeks/finsafe/releases/tag/v0.10.1). For later versions, follow the assets and notes in the [latest Release](https://github.com/finogeeks/finsafe/releases/latest).

## Windows

1. Install WorkBuddy or DSH separately. FinShield does not replace the Agent or configure its account.
2. [Download `install-finshield.cmd`](https://github.com/finogeeks/finsafe/releases/latest/download/install-finshield.cmd) and double-click it. Prompts default to English; type `L` and press Enter to switch languages. Press Enter to download and verify the latest stable installer, confirm the administrator prompt, and follow the wizard. For offline installation, run the matching `finshield-<version>-x64-setup.exe` directly.
3. Find the desktop Widget. When it shows Not prepared, click the orb and choose Start preparation. Review and authorize permissions in the supporting Console when required. Windows may request administrator consent.
4. At Agent standby, expand the icons and select WorkBuddy or DSH. Correct invalid directories in Console: WorkBuddy needs its installation directory; DSH needs both Node.js and DSH directories.
5. Click a launchable Agent icon, wait for confirmed running status, and start work. Click its green-dot icon later to reopen the existing instance. A browser page need not remain open for daily use.

Begin with an empty test workspace. Ask the Agent to create `finshield-demo.txt` in an authorized writable directory, write “Test complete”, and read it back. Then use [Verify permission scope](#verify-permission-scope) below to check read-only and inaccessible directories.

Opening FinShield does not start a new authorization automatically. Choose Start preparation when it shows Not prepared. Agent standby means an integrated Agent can be selected. Installed, prepared, and running are separate states.

## macOS

The current public package targets Apple Silicon. `v0.10.1` has no Intel package; an older Intel package is not a substitute for this release.

1. Download `finshield-<version>-macos-arm64.tar.zst` from Releases.
2. Extract it with a Zstandard-capable tool and compare its checksum with `SHA256SUMS` from the same release.
3. Keep the directory structure and accompanying files. In the extracted directory, run:

```sh
./finsafe --version
./finsafe probe
./finsafe doctor
./finsafe --help
```

Add the directory to `PATH` to use `finsafe` directly. Follow that package's help and notes to launch an installed Agent through FinShield. Versions that include the Hermes shortcut support:

```sh
finsafe hermes
```

Starting Hermes directly is a different entry. See the [Linux/macOS information security overview](finsafe-linux-macos-overview-en.html#data) for network and privacy-inspection coverage.

## Linux

The current public build target is x86_64 GNU/Linux.

1. Download and extract `finshield-<version>-linux-x64.tar.zst`.
2. Keep accompanying programs, especially `finsafe-helper`, `finsafe-supervisor`, and `finsafe-landlock-shim`. Do not copy only the main executable.
3. In the extracted directory, run:

```sh
./finsafe --version
./finsafe probe
./finsafe doctor
./finsafe --help
```

Linux capabilities depend on bubblewrap, cgroup, the kernel, and host authorization. Follow diagnostics and that release's host-setup instructions before using a supported FinShield launch entry. Diagnostic success does not replace an actual task check.

## Verify permission scope

Use dedicated test directories and files under the effective permissions:

| Scope | Test | Expected result |
| --- | --- | --- |
| Writable workspace | Create, read, and edit `finshield-demo.txt` | Operations succeed and changes are visible |
| Directory configured as read-only | Read a test file, then try to edit it | Reading succeeds; editing fails and the original remains |
| Directory configured as inaccessible | Try to read a test file that already exists | Reading is refused |

Judge the actual tool result, file contents, and directory state. A model's verbal refusal, a nonexistent file, or an incorrect path does not prove enforcement. Applications launched through vendor shortcuts must not be assumed protected. Network and content inspection covers only integrated, inspectable paths.

## Update and uninstall

Windows `v0.10.1` supports update checks from the Widget or Console. Automatic checks are at least 24 hours apart; manual checks are available at any time. Run the new EXE and follow its instructions for running applications, then check authorization and Agent startup. Uninstall through Windows Settings → Apps → Installed apps; the entry may use FinShield or the earlier FinSafe name.

This version sends basic usage statistics with update requests and has no statistics switch. Installers download from GitHub or CDN. See the [v0.10.1 notes](https://github.com/finogeeks/finsafe/releases/tag/v0.10.1).

On macOS and Linux, end protected tasks before replacing the extracted directory with the complete files from one version. Removing programs is separate from deleting configuration, models, certificates, or records. Follow the matching release's cleanup instructions and keep files still in use.

## Get help

When opening a [GitHub Issue](https://github.com/finogeeks/finsafe/issues/new/choose), include the product version, OS and CPU architecture, Agent name/version, launch entry, reproduction steps, expected and actual results, and redacted errors or logs.

Do not submit customer information, keys, session tokens, or complete sensitive conversations. Report sensitive security issues privately through your existing Finogeeks support channel.
