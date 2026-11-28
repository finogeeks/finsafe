# AppContainer, Job UI and Windows desktop isolation (outline)

[中文](../../zh-CN/blog/windows-desktop-isolation.md) · [Technical blog](README.md)

<p class="blog-meta">Article outline · Execution isolation</p>

This page contains the planned sections. Mechanism analysis, reproduction scripts and test results will be added later.

## Layers of desktop isolation

- Execution identity, object permissions, Job UI and initial desktop placement.
- Boundaries between desktop Main, execution Host and tool descendants.

## Compatibility configuration

- Clipboard directions, USER objects and desktop sharing.
- Individual exceptions, other access checks and nested launches.

## Host support and effective restrictions

- Windows build, requested options and the effective restriction set.
- Records of startup failures and policy application outcomes.

## Interaction experiment design

- Self-created windows, synthetic clipboard text and disposable programs.
- API results, independent host observations and normal-task controls.

## Results and untested paths

- Coverage questions for screen access, input and other IPC.
- Versions, compatibility tradeoffs and test results to be added.

## Related documentation

- [Windows desktop interaction and Job UI](../architecture/windows-job-ui.md).
- [Windows system and desktop protection](../protection/windows-security.md).
- [Compatibility matrix](../agents/compatibility.md).
