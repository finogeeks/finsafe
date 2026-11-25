# WorkBuddy desktop integration (Windows)

[简体中文](../../zh-CN/agents/workbuddy.md) · [Agent integrations](README.md)

FinShield provides a protected desktop launch entry for WorkBuddy on Windows x64. WorkBuddy keeps its own account, models and task interface. FinShield constrains the execution path according to the selected authorization and configuration.

## Requirements

- Install WorkBuddy and complete its sign-in separately.
- Install the Windows FinShield package using the [installation guide](../getting-started/install.md#windows).
- Confirm the [compatibility matrix](compatibility.md) for the delivered edition and version. This guide uses the FinShield desktop entry; it does not require a WorkBuddy plugin.

## Prepare permissions

1. Save active WorkBuddy tasks before preparation or application replacement.
2. Open the FinShield Widget. If it shows **Not prepared**, choose **Start preparation**.
3. Review the requested access in the supporting Console and complete Windows consent when required.
4. Confirm the WorkBuddy installation directory in Console. Correct an invalid detected directory using the actual installation location.
5. Wait for **Agent standby** before starting WorkBuddy.

## Launch and use

1. Expand the Widget's Agent list and select WorkBuddy.
2. Use the FinShield launch entry and wait for the confirmed running state.
3. Start a task in a dedicated test workspace. Selecting the running Agent later opens its existing instance.

Installation, preparation and protected execution are separate states. A WorkBuddy window opened directly from its original shortcut does not by itself prove FinShield protection.

## Verify protection

Use [permission-scope verification](../getting-started/install.md#verify-permission-scope): create and read a test file in a writable directory, then test a read-only directory and a directory explicitly denied by the selected policy. Check tool results and actual file contents; a model's verbal refusal is not evidence.

Published comparison cases and their conditions are available in [Safety Arena](https://safety.finaios.ai/). They apply to the recorded versions, settings and scenarios.

## Troubleshooting

- **WorkBuddy is missing or its path is invalid:** check the installation directory in Console.
- **Not prepared:** complete preparation and review the reported authorization result.
- **An application opens but protection is uncertain:** confirm the selected entry and actual process state, then repeat the allowed and denied file tests.
- **A task is blocked:** check the selected directory and permission scope before retrying with test data.

## Update and removal

Follow [update and uninstall](../getting-started/install.md#update-and-uninstall). Save active tasks first. Updating or removing FinShield and updating WorkBuddy are separate operations. Recheck preparation and the protected launch after a change.

## Related documentation

- [Windows capabilities](../overview/windows.md)
- [Compatibility matrix](compatibility.md)
- [Installation and verification](../getting-started/install.md)
