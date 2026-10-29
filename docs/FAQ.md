# FinShield FAQ

[简体中文](FAQ-zh.md) · [Home](../README.md)

## How are FinShield and FinSafe related?

FinShield is the new name for FinSafe. Its Chinese name is 智能体安全盾, shortened to 智安盾. Existing `finsafe` commands, paths, some package names, and the repository address remain. Earlier FinSafe-branded cases concern the same product.

## Do I need an installation command on Windows?

No. Double-click the matching setup EXE and follow the wizard. Complete security preparation in the product, then start a supported Agent through FinShield. See the [Windows guide](WINDOWS-GUIDE.md).

## Why does the download page still show an older release?

Code merges, test-package deliveries, and public releases are separate steps. As of 2026-10-29, public Releases still ends at `v0.9.47` and does not yet include the new desktop EXE. These documents describe the current product workflow, not capabilities guaranteed in every historical package. Use the notes for the version you receive.

## Is the experience identical on all platforms?

Windows provides an EXE, a floating entry, and local Console, currently integrating WorkBuddy and DSH CLI. macOS and Linux primarily provide command-line entries. The current macOS release target is Apple Silicon; new Intel packages are paused. Linux targets x86_64. Isolation mechanisms, compatibility, and inspection differ by platform and version.

## Does installation automatically protect every Agent?

No. Complete authorization and start the Agent through a supported FinShield entry. Separately launched vendor shortcuts, unintegrated applications, and traffic outside inspected paths must not be assumed protected. Opening an application window alone does not establish its launch identity or permissions.

## Does Full Access bypass FinShield?

Full Access controls the Agent's own permission or approval mode. For a process actually running inside FinShield's controlled environment, that setting does not itself remove operating-system restrictions. Verify the launch identity, effective policy, and integration rather than relying on a mode label.

## Does FinShield guarantee that models never make mistakes or all attacks fail?

No. It constrains integrated execution and data paths to reduce the impact of dangerous actions. It does not guarantee correct model decisions or coverage of every system interface, protocol, or application version. Cases establish results under their stated conditions.

## Do the window-storm results apply to every Windows application?

No. Cases specify their version, DSH mode, and desktop configuration. A private desktop can separate test windows from the user's desktop; GUI compatibility paths such as WorkBuddy may differ. An undisturbed user desktop does not mean every window-creation call failed.

## Does a sensitive-information finding always stop transmission?

Windows defaults to Record, which logs a finding and continues sending. Ask requires a per-request approval for a known finding; Block refuses a known finding. Incomplete checks, unreadable payloads, or unsupported content may still be forwarded under other rules. Detection is not exhaustive.

Privacy Guard on macOS/Linux follows a separate workflow; Windows modes and coverage must not be applied to it unchanged.

## Does local retention mean requests never leave my computer?

No. Retention stores encrypted local records of captured requests, responses, and decisions. Approved requests still reach the configured model service. Review file scope, network destinations, inspection, and retention separately.

## What if an Agent cannot access normal work files?

Check that the file exists and is in an authorized writable workspace rather than a read-only reference directory. Change scope through security settings, authorize again, and verify the actual task. Avoid granting the entire user profile write access to resolve a single error.

## How do I report a problem?

Open a [GitHub Issue](https://github.com/finogeeks/finsafe/issues/new/choose) with:

- FinShield version, operating system, and CPU architecture.
- Agent name/version and the launch entry used.
- Reproduction steps, expected/actual results, and visible error text.
- Relevant permission scope and redacted screenshots or logs.

Do not submit real customer data, keys, session tokens, or complete sensitive conversations. Report sensitive security issues privately through your existing Finogeeks support channel.
