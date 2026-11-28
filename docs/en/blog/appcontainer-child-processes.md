# How FinShield addresses Python and Node.js child-process compatibility in AppContainer (outline)

[中文](../../zh-CN/blog/appcontainer-child-processes.md) · [Technical blog](README.md)

<p class="blog-meta">Article outline · Execution isolation</p>

The following sections plan the article and its examples. Reproduction scripts, Windows observations and FinShield delivery status will be added when the full article is developed.

## 1 Why Agents need complete child-process support

- Command execution, code execution, desktop Hosts and local MCP services.
- Process creation, runtime initialization, stdio, IPC and process exit as separate verification targets.
- Desktop Main, protected execution Host and tool descendants; root launches and nested creation inside AC require separate tests.

### Python examples

- **AgentScope local commands:** `LocalBackend.exec_shell()` calls `asyncio.create_subprocess_exec()` with an argument array, `DEVNULL` stdin and separate stdout/stderr pipes. [Implementation](https://github.com/agentscope-ai/agentscope/blob/b76f2726751e774541ece42256def65c247d4131/src/agentscope/tool/_builtin/_backend.py#L991-L1040).
- **AgentScope local MCP:** stdio configuration delegates to the MCP SDK through `stdio_client(StdioServerParameters(...))`; trace process creation and bidirectional channels in the SDK. [Implementation](https://github.com/agentscope-ai/agentscope/blob/b76f2726751e774541ece42256def65c247d4131/src/agentscope/mcp/_mcp_client.py#L221-L231).
- **Hermes terminal commands:** `LocalEnvironment._run_bash()` uses `subprocess.Popen()` to start Bash, captures stdout, merges stderr and optionally pipes stdin; trace tools started by the command as another process generation. [Implementation](https://github.com/NousResearch/hermes-agent/blob/a428f5344f777ccafe389c79d5b09384abef1437/tools/environments/local.py#L1268-L1306).
- **Hermes long-lived children:** `_spawn_long_lived()` delegates to `spawn_owned()` with byte pipes for stdin and stdout; examine communication and lifecycle separately from one-shot commands. [Implementation](https://github.com/NousResearch/hermes-agent/blob/a428f5344f777ccafe389c79d5b09384abef1437/tools/environments/local.py#L1344-L1359).

### Node.js and related JavaScript runtime examples

- **DSH Desktop Host startup:** `spawn(this.node, ...)` starts `dsh-desktop-host` with stdout/stderr pipes and Node IPC; use it to illustrate the desktop startup chain's distinct channels. [Implementation](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/apps/desktop/src/host-process.ts#L223-L245).
- **DSH PowerShell commands:** with the `pwsh-local` provider selected, `PwshLocalExecutor` uses `ctx.subprocess.spawn()`, sets stdin per request and collects stdout/stderr; follow external tools started by PowerShell as descendants. [Implementation](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/shell/pwsh-local/src/index.ts#L198-L214).
- **DSH Bash commands:** with the `bash-local` provider selected, `bash -c` runs through the subprocess service with collected output; distinguish this configured path from PowerShell. [Implementation](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/shell/bash-local/src/index.ts#L149-L172).
- **OpenCode Shell tool:** the target environment's spawner starts the Shell, which executes tools; trace command, cwd, environment, output and termination. [Shell entry](https://github.com/anomalyco/opencode/blob/59af60fbf44b6144e1c2e1051e7f8fd576c8d8d9/packages/core/src/shell.ts#L1045-L1057), [Node-side spawner](https://github.com/anomalyco/opencode/blob/59af60fbf44b6144e1c2e1051e7f8fd576c8d8d9/packages/util/src/cross-spawn-spawner.ts#L554-L565).
- **OpenCode local MCP:** the environment spawner starts the MCP service with protocol messages on stdin and piped stdout/stderr; use it as a long-lived bidirectional communication example. [Implementation](https://github.com/anomalyco/opencode/blob/59af60fbf44b6144e1c2e1051e7f8fd576c8d8d9/packages/core/src/mcp/stdio.ts#L100-L113).
- Identify the actual Node, Electron or Bun execution path; compatible API names do not establish identical runtime or channel implementations.

## 2 AppContainer constraints affecting these paths

- Runtime pipe names and the AC `LOCAL` namespace requirement.
- Console/desktop environments and child initialization.
- Ordinary pipes, asynchronous pipes, Node IPC and inherited stdio.
- Distinguish Python asyncio and Node/libuv versions; do not generalize one failing path into a claim that AC prohibits all child processes.

## 3 Reproduction scripts and experiment design

- Python: synchronous `Popen`, asyncio subprocesses, bidirectional stdio and sustained output.
- Node: pipe/inherit controls, IPC and external programs started by a Shell.
- Minimal reproductions from the source paths, followed by actual Agent tool entry points.
- Controls: ordinary process, native AppContainer, an identified MXC backend and FinShield.
- Parent/child PIDs, failure stage, original errors, output, EOF, exit and timeout; AC identities and applicable Job restrictions.

## 4 MXC comparison

- Fixed MXC, Python, Node/libuv and Windows versions with the actual backend identified.
- Equivalent runtimes, commands, working directories and channel configurations.
- Separate parent startup, child creation, communication and exit outcomes, scoped to the tested backend and version.

## 5 FinShield's solution

- Child launch environment and console compatibility.
- Runtime pipe compatibility, initialization timing and descendant coverage.
- Preservation of AC identity, applicable Job restrictions and resource authorization.
- Distinguish experimental prototypes, merged implementations and released delivery.

## 6 Actual FinShield outcomes

- The same scripts compared across groups.
- Corresponding AgentScope, Hermes, DSH and OpenCode tool entry points.
- Cross-runtime Python/Node process trees, bidirectional channels, abnormal exits and cleanup.
- Separate verification of functionality and confinement boundaries.

## 7 Conclusions and support scope

- Verified versions, architectures, backends and channels.
- Untested paths and follow-up verification.

## Scope of the example sources

Implementation references are pinned to public commits inspected on 2026-11-28. They organize the examples and do not establish installed-package AppContainer results. Recheck the versions used for the eventual experiment; source calls, upstream reports and merged changes are not fresh test observations.
