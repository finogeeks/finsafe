# Get started with FinShield

[简体中文](getting-started-zh.md) · [Home](../README.md)

Download the package for your operating system. Windows uses an EXE installer; macOS and Linux use command-line archives. Check the attached files and version notes in [Releases](https://github.com/finogeeks/finsafe/releases). Features in current code may not yet exist in older public packages.

## Windows

1. Install WorkBuddy or DSH separately. FinShield does not replace the Agent or configure its account.
2. Download `finsafe-<version>-x64-setup.exe`, double-click it, and follow the wizard. No installation script is needed.
3. Open FinShield. Review file and network permissions in “安全设置” (Security settings), then complete authorization and security preparation. Windows may request administrator consent.
4. Confirm installation directories in “智能体管理” (Agent management). WorkBuddy needs its installation directory; DSH needs valid Node.js and DSH directories.
5. Use FinShield's “安全启动” (Safe start) or floating entry to launch the application. Wait for confirmed running status before starting a task.

Begin with an empty test workspace. Ask the Agent to create `finshield-demo.txt` in an authorized writable directory, write “Test complete”, and read it back. Then use the [Windows guide](WINDOWS-GUIDE.md) to verify read-only and inaccessible directories.

A normal double-click to open FinShield does not start a new authorization. Choose “开始准备” (Start preparation) when the entry shows “待准备” (Not prepared). “智能体待命” (Agent standby) means you can select an integrated Agent. Installed, prepared, and running are separate states.

## macOS

The current release target is Apple Silicon. New Intel packages are paused; an older Intel archive is not a substitute for the current release.

1. Download `finsafe-v<version>-aarch64-apple-darwin.tar.zst` from Releases.
2. Extract it with a Zstandard-capable tool. Compare the download with `SHA256SUMS` from the same release if verifying integrity.
3. Keep the accompanying files. Open a terminal in the extracted directory and run:

```sh
./finsafe --version
./finsafe probe
./finsafe doctor
./finsafe --help
```

Add the directory to `PATH` to use `finsafe` directly. Follow that package's help and release notes to start an already-installed Agent through FinShield. For example, versions with the Hermes shortcut support:

```sh
finsafe hermes
```

Starting Hermes directly is a different entry. See the [FAQ](FAQ.md) for network and privacy-inspection requirements.

## Linux

The current public build target is x86_64 GNU/Linux.

1. Download and extract `finsafe-v<version>-x86_64-unknown-linux-gnu.tar.zst`.
2. Keep accompanying programs, including `finsafe-helper`, `finsafe-supervisor`, and `finsafe-landlock-shim`; do not copy only the main executable.
3. Run these commands in the extracted directory:

```sh
./finsafe --version
./finsafe probe
./finsafe doctor
./finsafe --help
```

Available confinement depends on bubblewrap, cgroup, the kernel, and host authorization. Follow the diagnostics and release-specific host setup instructions before starting an Agent through a supported FinShield entry. Diagnostic success does not replace an actual task check.

## Update and uninstall

On Windows, run the new setup EXE. Follow its guidance for running applications, then check authorization and Agent startup. Uninstall through Windows Settings → Apps → Installed apps; the entry may still use the previous FinSafe name.

On macOS/Linux, end protected tasks before replacing the extracted directory with the complete set of files from one version. Removing executables is separate from deleting configuration, models, certificates, or records. Follow that release's cleanup instructions for those resources.

## Get help

Include the product version, operating system, Agent name/version, steps, and visible error. See [How to report a problem](FAQ.md#how-do-i-report-a-problem).
