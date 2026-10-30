# Changelog

User-facing changes for **public** FinSafe CLI and fleet releases on [finogeeks/finsafe](https://github.com/finogeeks/finsafe/releases).

This file is the only public release history. It is maintained in the private FinSAFE monorepo under `docs/public-finsafe/` and synced to the public repository on each release. Private development commits are not copied here automatically.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.9.98] - 2026-10-30

### Changed

- Build the offline Windows setup EXE with NSIS instead of WiX/Burn and name it
  `finshield-<version>-x64-setup.exe`. Update release metadata and downloads.
- Show the agreement and an editable installation directory on reinstall and
  upgrade. Remove the separate maintenance-choice page.

### Fixed

- Launch the desktop after installation through the existing Windows Explorer
  shell. Preserve the desktop's preparation and elevation workflow.
- Advance automatically from successful installation to the Finish page.

## [0.9.97] - 2026-10-29

Local Windows installer for installation directory controls and status updates.

### Changed

- Use the same Find again button with a visible label and icon for WorkBuddy
  and DSH. Validate typed or selected directories automatically. Offer a
  different discovered directory for explicit adoption before replacing a
  manual selection.

### Fixed

- Update DSH installation status, version and startup command from the same
  validated directory result. Keep Open available for a running instance while
  installation inputs change.

The cause of the initial automatic-discovery miss in product-bugs #59 remains
unconfirmed. This build fixes the confirmed page interaction and state updates.

## [0.9.91] - 2026-10-29

Local Windows installer for elevated desktop startup.

### Fixed

- Open the desktop when FinSAFE starts with an elevated Windows token. Retain
  the existing authorization workflow and AppContainer confinement.

## [0.9.90] - 2026-10-28

Local Windows installer for AppContainer Junction access.

### Fixed

- Keep Windows process-creation attribute values and their nested SID buffers
  valid until the attribute list is destroyed. Remove the redundant normal
  AppContainer policy attribute whose expired storage could unintentionally
  block Junction queries used by Node.js module resolution.

## [0.9.89] - 2026-10-28

Local Windows installer for configuration access across privilege changes.

### Fixed

- Installation and Repair grant the initiating account Modify access to the
  configuration directory and its known YAML files. Explicit authorization from
  an elevated desktop establishes the same access before staging. Existing
  configuration contents, sandbox permission entries and DACL protection are
  preserved.

## [0.9.88] - 2026-10-27

Local Windows installer for the approved Widget notifications and Agent artwork.

### Changed

- Show red problem markers on Agent leaves and beside the folded orb. Open the
  corresponding Console page and clear the marker until a new error occurs.
- Use the yellow badge for a runtime PII count. Each final finding adds one;
  opening the PII alert page clears it. The count is not persisted.

### Fixed

- Move black Agent hover names closer to the icons and center the DSH artwork.

## [0.9.87] - 2026-10-27

Local Windows installer for WorkBuddy window activation.

### Fixed

- Use WorkBuddy's existing Electron single-instance handler to restore its
  window after Close Window, so Electron can resume content and input.

## [0.9.82] - 2026-10-26

Local Windows installer for the approved floating-control UI.

### Changed

- Open a lower action menu before security preparation, with a Console entry
  available during preparation. Only the explicit Start preparation action
  starts the existing preparation operation.
- Use the approved standby label, preparation explanations, running/starting
  hover summaries and Console / Quit control context menu.
- Keep the existing Agent launch, security preparation and monitoring behavior.

### Fixed

- Use security-preparation wording in the WorkBuddy console guidance.

## [0.9.81] - 2026-10-25

Local Windows console and application-entry fixes.

### Changed

- Start WorkBuddy through the explicit AppSeam entry. Keep application defaults
  outside Core and use integration IDs only for record attribution.
- Pass the DSH integration ID explicitly in desktop launch commands.

### Fixed

- Wrap the WorkBuddy launch command within its card, using the DSH command style.
- Stop showing a resolved historical configuration-read failure when current
  configuration and preparation are valid. Keep other operation failures visible.

## [0.9.80] - 2026-10-25

Local Windows installer for the WorkBuddy desktop launch update.

### Changed

- WorkBuddy uses the DSH launch-page layout and shared secure Start/Open flow,
  with one installation directory. The desktop floating control includes WorkBuddy.
- Remove the legacy WorkBuddy Guard, attach/detach, Watch, wrapping scripts,
  IAT hook and installer reattachment actions. Current self-confine execution,
  authorization and Inspector services remain in use.


## [0.9.72] - 2026-10-23

### Changed

- The Windows desktop UI uses loopback ports 57341–57350, with 57341 as the
  initial default. Remembered ports outside this range are ignored. Reopen
  FinSAFE after upgrading an already-open page from the old port range.
- Desktop heartbeats run every 120 seconds. A failed heartbeat allows three
  attempts, with three-second deadlines and one-second retry delays, before
  showing the unavailable state. Business operations are not retried.

## [0.9.71] - 2026-10-23

Local Windows test build for directory preparation and desktop authorization.

### Changed

- The base configuration no longer declares a read-only boundary for `C:/`.
- Windows `prepare` and `prepare apply` enable the existing generic AppContainer
  ACL repair by default. Desktop authorization submits repair in its first
  request, without a second permission-adjustment dialog. Plan and check stay
  read-only; receipt-backed unprepare is unchanged.
- Windows directory preparation uses USN enumeration and live DACL queries,
  with one check sequence and one serial ACL writer.

## [0.9.70] - 2026-10-22

Local Windows test build for desktop authorization and upgrade verification.

### Fixed

- Desktop authorization stages the selected configuration in the initiating
  user's context and requests elevation before creating or replacing installed
  effective configuration. Cancelling elevation preserves the installed
  configuration and permission receipt.
- Authorization states show one action each: authorize, reauthorize, continue,
  or revoke when already authorized. Pending states do not also offer revoke.
- MSI program entries have fallback file versions so upgrades replace old
  unversioned programs even when their timestamps indicate modification.

## [0.9.69] - 2026-10-21

Local Windows test build for installer and desktop authorization acceptance.

### Changed

- Windows Installer uses standard Restart Manager handling for files in use,
  including shutdown, cancellation, retry, and required-reboot behavior. The
  custom process-stop action is removed, and automatic application restart
  remains disabled.
- The desktop authorization page reports one of four ordered states: not
  authorized, reauthorization required, authorization incomplete, or
  authorized. Existing authorization, preparation, and replacement execution
  remain unchanged.

## [0.9.68] - 2026-10-21

Local Windows test build for installer acceptance.

### Fixed

- Optional Microsoft Defender exclusion failures no longer require confirmation
  during installation. If Defender is unavailable, skip the step and log the
  result. Other failures appear in the existing completion summary with optional
  manual setup instructions; technical errors remain in the installer log.
- After consent, attempt to close this installation's FinSAFE processes before
  MSI checks files in use. Keep the final elevated shutdown check and normal
  handling for processes that cannot be stopped or other files still in use.
  Live MSI interface acceptance remains pending.

## [0.9.67] - 2026-10-20

Local Windows test build from origin/main for user verification.

### Changed

- Windows Core current-input PII adds `block` and `approval_required` beside
  the default `warning` action. Approval uses a native Windows dialog for one
  request; rejection, closure, timeout, or unavailable approval prevents that
  request from being sent. Approval does not authorize future requests.
- The native approval dialog uses Chinese text, category labels, and a default
  cancel action. Application and destination remain visible; request IDs stay
  in internal records.
- Windows Core removes `llm_content.on_uninspectable`. Incomplete PII checks
  always allow forwarding under the other network and content rules and
  record a content-free reason. Blocking and approval apply only to detected
  findings. The original payload is preserved on permitted requests.
- Client-facing PII refusals use English without a product name. The blocking
  message is `Sensitive information detected. This request was blocked.`
  See [Windows Core PII actions](docs/windows-core-pii.md) for scope and limits.

## [0.9.66] - 2026-10-18

Local Windows test build for user verification.

### Added

- Refresh a running Windows Inspector's PII and content rules with
  `finsafe app tls-inspector --refresh [--yaml <path>]`. A missing Inspector
  reports a no-op without starting one. Existing clients keep their PID,
  proxy endpoints, and CA; in-flight exchanges can finish under their old rules.

### Changed

- Desktop PII saves refresh the running Inspector and report whether settings
  are active, saved for the next launch, pending authorization, or could not
  be confirmed. Running agents do not need to restart after a successful refresh.

## [0.9.65] - 2026-10-18

Local Windows test build for user verification.

### Fixed

- Create PII approval windows with the native topmost style and check visible,
  topmost placement after showing them. Attempt foreground activation once.
  This follows a user-reported display failure in 0.9.64; real WorkBuddy
  verification remains pending.

## [0.9.64] - 2026-10-18

Local Windows test build for user verification.

### Fixed

- Attempt to keep pending PII approval windows above ordinary application windows.
  The default cancel choice and independent window lifecycle are unchanged.
  PII inspection scope is unchanged; history inspection is tracked separately.

## [0.9.63] - 2026-10-18

Local Windows test build for user verification.

### Fixed

- Desktop PII saves use the existing temporary UAC worker to write protected
  configuration files. Cancellation and write failures keep the prior selection.
- Successful PII saves remind the user to restart the agent for the setting
  to take effect.
- Development builds and runtime recovery no longer start the optional
  Windows helper service implicitly.

## [0.9.62] - 2026-10-18

Local Windows test build. Required acceptance is still incomplete.

### Changed

- The Windows desktop provides inline Record, Ask, and Block PII controls
  with tooltips, failure feedback, and click-to-retry behavior. PII previews
  candidate and uses the existing configuration application workflow.
- Continuous protection is shown inside the WorkBuddy detail with a visible
  update explanation. Configuration details remain read-only.

## [0.9.61] - 2026-10-15

Local Windows test build. Required acceptance is still incomplete.

### Added

- Windows x64 AppContainer runtime pipe compatibility for Python and Node
  subprocesses. `run` and `self-confine` enable the hook by default; use
  `--no-runtime-hook` to disable it for one invocation. This setting is not part
  of YAML/JSON policy.

## [0.9.58] - 2026-10-12

### Changed

- Windows Core uses one multi-category Tier-1 PII warning for the current user
  message or a validated assistant/tool suffix. Older conversation history is
  excluded. Warnings contain only the category count; the original request body
  is preserved. Old detector and pattern configurations require explicit
  replacement with the single `pii` warning entry.
- The Windows desktop shows configured memory, process-count, and execution-time
  limits. Its permission summary shows denied paths and expands all access
  classes on request.

### Fixed

- PII size and decoding failures skip detection without changing the independent
  base filter's limits or deny rules.

## [0.9.57] - 2026-10-11

### Changed

- Platform integration keeps the Windows trial runtime. Linux and macOS retain
  Privacy Guard, credential brokering, and target-specific signed detector
  bundles. Windows retains trial content inspection, encryption, and packaging;
  Privacy Guard policy fields are unsupported there.

## [0.9.56] - 2026-10-11

### Changed

- The Windows desktop keeps one active local page for each user. Reopening
  FinSAFE opens that page and displays any authorization already in progress.
- Administrator authorization runs in a headless worker and returns its result
  to the current page instead of opening another browser address.
- Permission revocation uses the receipt path list and reports progress for the
  current phase. A refreshed page keeps the authorization preview visible.
- Preparation check classifies a known version 2 receipt as `different`, so the
  desktop can request explicit reauthorization. Guard still rejects version 2,
  and unprepare can still clean it.
- The Windows installer license page contains concise product license terms,
  including WorkBuddy permission effects and the FinSAFE data statement.
- The Windows installer wizard uses Simplified Chinese. Its license body uses
  the same text size as the standard wizard pages.

## [0.9.55] - 2026-10-11

### Changed

- Windows configuration resolution and materialization preserve declared
  network and resource YAML values. Machine materialization changes only the
  file-system representation.
- Windows preparation now has `plan`, `check`, and `apply` layers. Check
  compares every receipt operation, including all WFP filters. Apply applies a
  missing receipt, reuses a matching receipt, or returns
  `unprepare_required` for a different receipt. It does not revoke or retry
  automatically.
- New preparation receipts use schema version 3. Check classifies a known
  version 2 receipt as different, guard rejects it, and the unchanged
  unprepare flow can still clean it.

### Removed

- Shared proxy identity-header injection and credential replacement. Policies,
  compiled plans, and SDK converters reject `inject_identity` and `credential_map`,
  including false or empty values. Configure credentials in the client. The proxy
  preserves client credentials and keeps local audit attribution.

## [0.9.54] - 2026-10-10

### Changed

- **Windows file permissions:** prepared file ACLs use a file capability derived
  from the user and security domain. AppContainer identity stays unchanged.
- **Windows launch:** run and self-confine start the original executable without
  staging or an extra file-permission precheck. Windows enforces access.
- **Windows base policy:** proxy mode with TLS termination and `*.*` endpoints.
  Credit-card and Chinese identity-card detectors warn and forward. Conversation
  retention stays off. Existing effective configurations require explicit replacement.

## [0.9.53] - 2026-10-08

### Fixed

- **Windows 10 preparation:** resolve local drive aliases to native disk-volume
  paths before strict ACL opens. Ordinary directories no longer fail as reparse
  points during `prepare` or `unprepare`. Real filesystem junctions remain
  rejected. Host/proxy preparation, receipt reuse, and permission cleanup passed
  on Windows 10 build 19045 and Windows 11 build 22631.

## [0.9.51] - 2026-10-07

### Added

- **Windows desktop conversations and alerts:** agent protection links to a read-only view of retained user messages, model replies and returned thinking, tool calls and results, and recorded detection decisions. Earlier history and raw payloads are expandable. The viewer reads the current user's existing encrypted store without changing protection or forwarding.

## [0.9.50] - 2026-10-07

### Fixed

- **Windows WorkBuddy Core proxy:** TLS inspection now reads `policy.network.tls_terminate: true` from the admitted YAML instead of requiring a MITM license or development override. The base YAML enables it. Upstream certificate verification remains enabled. Existing candidate files are preserved during upgrades.

## [0.9.49] - 2026-10-07

### Fixed

- **Windows desktop configuration:** every launch checks candidate, including when effective exists. Conflicts preserve the old effective and preview the new scope until explicit reauthorization replaces it. Configuration editing selects candidate and returning checks again. The existing prepare, cleanup, retry, and administrator authorization flow is unchanged.

## [0.9.48] - 2026-10-07

### Added

- **Windows WorkBuddy Core DLP:** local payment-card and Chinese identity-card detectors use format and checksum checks. The base YAML enables both with warning-and-forward actions. Plugins remain optional.

### Changed

- **Windows base network policy:** proxy mode with explicit `*.*` endpoints and local LLM retention enabled. Deny rules still take precedence.
- **Core content inspection:** `on_uninspectable` defaults to `forward_uninspected`. Helper warnings reach Core stderr without printing matched numbers.

- **Windows interactive `self-confine`:** AppContainer now shares the operator console (`console_inherit`) by default, the same as RestrictedToken. Ctrl+C goes to the broker and does not stop FinSAFE. `FINSAFE_WIN_PTY_MODE=live` is the Live ConPTY override for an embedded host that needs FinSAFE as the terminal host; a host without ConPTY refuses that setting instead of falling back to pipe capture.
- **Windows UI isolation:** sandbox children inherit `WinSta0\Default` and take Job Object UI restrictions (`JOB_OBJECT_UILIMIT_*`, attested `windows_job_ui_limits`) instead of a private window station. Nested console children (`python → pwsh → cmd`) can start. Same-desktop `GetDC(NULL)` screen read is not blocked. Policy `windows.ui_restrictions.desktop: isolated` is refused. See [the WinSta0 spec](../superpowers/specs/2026-10-05-windows-appcontainer-winsta0-streaming-stdio-design.md).
- **Windows pipe capture flags:** AppContainer non-interactive launches use `CREATE_NO_WINDOW` for every image (no basename list, no `CREATE_NEW_CONSOLE`).
- **Windows pipe stdio:** the non-interactive path is MXC-shaped capture pipes (`create_std_pipes`) plus a caller `StdioSink`. Text `finsafe run` streams live (`TerminalSink`); `--json` still buffers (`AccumulateSink`). Stdin passthrough / console pump is independent of the sink. Attestation: `windows_stdio_strategy=pipe`, `windows_stdio_sink=accumulate|terminal`.

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

## [0.9.47] - 2026-09-21

### Changed

- **Ops console restyle (#409):** the managed admin UI now uses shadcn/ui with a full-width sidebar. (PR [Geeksfino/finsafe#409](https://github.com/Geeksfino/finsafe/pull/409))

### Added

- **Windows launch-image staging (#372):** host-portable staging copies with fail-closed execute ACE before AppContainer launch. (PR [Geeksfino/finsafe#372](https://github.com/Geeksfino/finsafe/pull/372))
- **WorkBuddy catalog-static writes and trial first-run UX (#366).** (PR [Geeksfino/finsafe#366](https://github.com/Geeksfino/finsafe/pull/366))

### Fixed

- **Admit executions without blocking on cell lifetime (#404).** (PR [Geeksfino/finsafe#404](https://github.com/Geeksfino/finsafe/pull/404))
- **WorkBuddy overlay into both USER homes (#396).** (PR [Geeksfino/finsafe#396](https://github.com/Geeksfino/finsafe/pull/396))
- **WorkBuddy PowerShell via CodeBuddy USER settings (#389).** (PR [Geeksfino/finsafe#389](https://github.com/Geeksfino/finsafe/pull/389))
- **Vendor `--parent-pid` rewrite onto the finsafe hop (#382).** (PR [Geeksfino/finsafe#382](https://github.com/Geeksfino/finsafe/pull/382))
- **HighLevel session `.git` and `.finsafe` remapped as read-only overlays (#373).** (PR [Geeksfino/finsafe#373](https://github.com/Geeksfino/finsafe/pull/373))
- **Keep app-seam attach across WorkBuddy in-app update (#368).** (PR [Geeksfino/finsafe#368](https://github.com/Geeksfino/finsafe/pull/368))
- **Windows helper IPC fail-soft (#383):** when `finsafe-winhelper` is stopped, `finsafe run` no longer waits ~5s per helper-pipe open (about 15s across three launch probes) before RestrictedToken `CreateProcess`. A missing or busy pipe is immediate fail-soft; `wait_for_helper` after `setup-windows` / `sc start` is unchanged. The helper accept loop keeps a spare named-pipe instance so back-to-back AppContainer launches do not hit `ERROR_FILE_NOT_FOUND`.
- **Windows WFP `network: none` fence probe (#329):** the pre-launch TCP probe and AppContainer child now use a `finsafe-net` deny-only token. Persistent filters still permit the operator's enabled group membership so the desktop stays online. A successful operator connect is no longer treated as a fence failure. A live none/allowlist AppContainer holds a per-package lease so a same-SID `network: host` launch cannot unfence it. Hosted `windows-latest` must attempt `1.1.1.1:443` under that deny-only token and attest `windows_egress_fence_verified=true`; `GITHUB_ACTIONS` / `CI` / machine-account tokens are not a reason to skip the probe or launch without the stamp. Workgroup runners mint via MSV1_0 S4U (or a helper-owned probe logon) because Kerberos S4U is invalid for local accounts.

### Experimental

- **Windows GUI app seams** (`finsafe app attach` / `detach` / `status`) —
  experimental, not a supported product mode. Two enforcement tiers (D16):
  the core process is a user-mode guard (write scope, configured cooperative
  Node `fs` deny-read, audit) plus a Job
  Object (teardown, limits); spawned tools are RestrictedToken (kernel write
  scope) and still have no catalog deny-read. There is no egress or kernel
  filesystem boundary on the core. Run `finsafe app detach --all` before
  deleting or replacing `finsafe.exe`; an orphaned seam is a silent fail-open
  (**no toast is guaranteed**). See
  [WINDOWS-GUIDE.md § App seams](docs/WINDOWS-GUIDE.md).
  Not G2; FakeAgent fixture ≠ WorkBuddy.

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

## [0.9.46] - 2026-09-06

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **fix(windows): grant duplex ACL on finsafe-winhelper named pipe (#37)** (public issue [finogeeks/finsafe#37](https://github.com/finogeeks/finsafe/issues/37), PR [Geeksfino/finsafe#304](https://github.com/Geeksfino/finsafe/pull/304))

## [0.9.45] - 2026-09-06

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **fix(visual-sandbox): File vault Windows deny-glob and native demo commands** (public issue [finogeeks/finsafe#38](https://github.com/finogeeks/finsafe/issues/38), PR [Geeksfino/finsafe#305](https://github.com/Geeksfino/finsafe/pull/305))

## [0.9.44] - 2026-09-05

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **fix(visual-sandbox): emit required read_only_paths and fix Windows deny-glob containment** (public issue [finogeeks/finsafe#36](https://github.com/finogeeks/finsafe/issues/36), PR [Geeksfino/finsafe#301](https://github.com/Geeksfino/finsafe/pull/301))

## [0.9.43] - 2026-09-05

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **fix(visual-sandbox): use kit-relative paths in File vault commands** (public issue [finogeeks/finsafe#35](https://github.com/finogeeks/finsafe/issues/35), PR [Geeksfino/finsafe#300](https://github.com/Geeksfino/finsafe/pull/300))

## [0.9.42] - 2026-09-04

### Added

- **`finsafe --visual` / `finsafe visual-sandbox`** — Local live-compare UI in the personal CLI: file vault, web access, HTTPS inspection, runaway jobs, and an Agent tab (Hermes / FinClaw one-shot under FinSAFE). Output streams live; no Bun or source checkout required. Guide: [visual-sandbox.md](docs/visual-sandbox.md). (PR [Geeksfino/finsafe#293](https://github.com/Geeksfino/finsafe/pull/293))

## [0.9.41] - 2026-09-01

### Added

- **`windows.msys2_child_ipc`** — Opt-in RestrictedToken flag so child Git-for-Windows / MSYS2 `bash.exe` (Hermes tools, `cmd /c bash`) can initialize Cygwin IPC. Default off: NTFS write allowlisting stays. When true, the operator SID is a WRITE_RESTRICTED restricting SID for the whole token and write allowlisting does **not** apply to user-owned objects; attestation names `msys2_child_ipc`. The shipped Hermes Windows examples set it. Direct `bash.exe` payloads still work without the flag (public #29). (Public issue [finogeeks/finsafe#34](https://github.com/finogeeks/finsafe/issues/34))

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

## [0.9.40] - 2026-08-31

### Added

- **Deny-first egress rules** — Allowlist policies can set `denied_hosts` and optional `denied_host_reasons` (`*`, `*:port`, FQDN, `*.suffix`, `:port`). Deny is evaluated before allow, so `github.com:22` stays blocked even when `github.com` is allowed. Blocked requests audit as `host_denied` plus the optional operator message. (PR [Geeksfino/finsafe#270](https://github.com/Geeksfino/finsafe/pull/270))
- **JVM sandbox proxy agent** — Linux and macOS restricted-egress launches merge a `-javaagent` into `JAVA_TOOL_OPTIONS` so Java tools honor the loopback proxy. Linux self-confine extracts and injects the bundled jar. Override with `java_agent_jar_path` or `FINSAFE_JAVA_PROXY_AGENT_JAR`. (PRs [Geeksfino/finsafe#255](https://github.com/Geeksfino/finsafe/pull/255), [#258](https://github.com/Geeksfino/finsafe/pull/258))
- **`FTP_PROXY` / `ftp_proxy`** — Allowlist child overlays inject the same loopback CONNECT URL as the other proxy env vars, so inherited FTP proxy settings cannot bypass the sandbox proxy. (PR [Geeksfino/finsafe#249](https://github.com/Geeksfino/finsafe/pull/249))

### Changed

- **Windows path overlap checks** use canonical containment (case-fold, extended-path strip, fail-closed) so RO/RW/deny-read overlap is not fooled by alternate spellings. (PR [Geeksfino/finsafe#263](https://github.com/Geeksfino/finsafe/pull/263))
- **Policy Authority kill-switch** — Clear / expiry polarity is live-`until` only (expired or null no longer stay blocked); admin console copy matches the Devices IA. (PRs [Geeksfino/finsafe#256](https://github.com/Geeksfino/finsafe/pull/256), [#257](https://github.com/Geeksfino/finsafe/pull/257))
- **Windows CreateProcess 1260** (`ERROR_ACCESS_DISABLED_BY_POLICY`) now prints IT-managed policy guidance instead of a bare numeric code. (PR [Geeksfino/finsafe#248](https://github.com/Geeksfino/finsafe/pull/248))

### Fixed

- **RestrictedToken + Git for Windows bash** — Before `CreateRestrictedToken`, FinSAFE grants capability SIDs on existing MSYS2 SID-named file mappings (`CreateFileMapping S-1-5-21-….n`) so WRITE_RESTRICTED git-bash can open the mapping the host already created (Win32 error 5). This is not `SeCreateGlobalPrivilege` and does not walk `node_modules`. AppContainer remains a different token. (Public issue [finogeeks/finsafe#29](https://github.com/finogeeks/finsafe/issues/29), PR [Geeksfino/finsafe#275](https://github.com/Geeksfino/finsafe/pull/275))
- **Proxy host spelling** — Trailing-dot FQDNs and IP literals use one canonicalization path, closing false denials and an IP-literal deny bypass. (PR [Geeksfino/finsafe#269](https://github.com/Geeksfino/finsafe/pull/269))
- **Linux netns / proxy bwrap** always pass `--die-with-parent`, including `linux-desktop` launches where argv hardening is off, so orphaned cells die with the supervisor. (PR [Geeksfino/finsafe#268](https://github.com/Geeksfino/finsafe/pull/268))

### Security

- **Linux capability drop is verified** in the inner sandbox stage (`capget`): empty inheritable/permitted/effective sets after `--cap-drop ALL`, instead of trusting argv hardening alone. (PR [Geeksfino/finsafe#271](https://github.com/Geeksfino/finsafe/pull/271))

## [0.9.39] - 2026-08-20

### Security

- **macOS Seatbelt writable-root rename hardening** — After broad `(allow file-write*)` grants, profile generation emits `(deny file-write-unlink …)` on each writable directory root so the sandbox cannot rename/exchange the root itself. Deny-read paths also deny writes, and protected read-only / deny-read subtrees under writable roots get ancestor unlink denies. Writable roots whose path contains nested symlink components fail profile preparation (top-level aliases such as `/tmp` → `/private/tmp` remain valid). (PR [Geeksfino/finsafe#243](https://github.com/Geeksfino/finsafe/pull/243))
- **Windows elevated DACL provisioning no longer follows reparse points** — Elevated `finsafe-winhelper` ACL setup (`ApplyPathDacl`) opens user-influenced policy roots (`work_dir`, compiled RO/RW/deny-read paths) with `OBJ_DONT_REPARSE` and applies DACLs via handle-based `SetSecurityInfo`. Directory junctions under those roots are rejected instead of receiving sandbox ACLs meant for the intended tree. Interactive (non-elevated) launches keep the previous path-based behavior. (PR [Geeksfino/finsafe#242](https://github.com/Geeksfino/finsafe/pull/242))

## [0.9.38] - 2026-08-16

### Added

- **`finsafe prelabel`** — Apply Windows AppContainer filesystem grants and write completion sentinels without launching a payload. Use the same `--high-level`/`--policy` file and command tail as the later `run` so sentinel keys match. No-op on Linux and macOS. (PR [Geeksfino/finsafe#234](https://github.com/Geeksfino/finsafe/pull/234))
- **`finsafe doctor --high-level` / `--policy`** — Windows inheritable-root size preflight: names over-cap trees and points operators at `finsafe prelabel`. Volume / `%USERPROFILE%` / AppData product-folder roots stay errors, not a reason to raise the cap. (PR [Geeksfino/finsafe#234](https://github.com/Geeksfino/finsafe/pull/234))

### Changed

- **Faster AppContainer ACL labeling** — Package SID plus All Application Packages / All Restricted Application Packages are applied in one tree walk instead of three. Warm relaunches skip when all three grants are already present. (PR [Geeksfino/finsafe#234](https://github.com/Geeksfino/finsafe/pull/234))

### Security

- **Refuse inheritable DACL walks on Electron `userData` / AppData product folders** — AppContainer and RestrictedToken both refuse listing those roots as inheritable `read_write_paths` / `work_dir`. Use a dedicated empty home under `%LOCALAPPDATA%\FinSAFE\...`. Empty RestrictedToken homes get a directory ACE without `TreeSetNamedSecurityInfoW`. (PR [Geeksfino/finsafe#233](https://github.com/Geeksfino/finsafe/pull/233))

## [0.9.37] - 2026-08-13

### Security

- **Fail-closed deny-read globs** — Glob patterns in `filesystem.deny_read_paths` that have invalid syntax or match no paths under `read_write_paths` now fail policy compile instead of launching unenforced. Deny-write globs stay lenient. Migration hatch: `skip_deny_read_glob_fail_closed: true`. (PR [Geeksfino/finsafe#217](https://github.com/Geeksfino/finsafe/pull/217))

### Fixed

- **Linux host-rootfs `/dev/shm`** — After `--dev /dev` shadows host devices, FinSAFE re-binds `/dev/shm` when the host provides it so POSIX shared-memory IPC works for `linux-desktop-isolated` and similar host-rootfs plans. Curated rootfs plans are unchanged. (PR [Geeksfino/finsafe#218](https://github.com/Geeksfino/finsafe/pull/218))
- **macOS Seatbelt Homebrew Python / dyld** — Read-only path grants and platform defaults for `/opt/homebrew` and `/usr/local` emit `file-map-executable` so dyld can mmap interpreters and libs. Writable workspaces stay W^X (no map-exec on `read_write_paths` / writable work_dir). (PR [Geeksfino/finsafe#219](https://github.com/Geeksfino/finsafe/pull/219))

## [0.9.36] - 2026-08-11

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **Allow legacy creat(2) in x86_64 seccomp overlay for self-confine** (public issue [finogeeks/finsafe#33](https://github.com/finogeeks/finsafe/issues/33), PR [Geeksfino/finsafe#206](https://github.com/Geeksfino/finsafe/pull/206))

## [0.9.35] - 2026-08-11

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **fix(linux): scope run timeout kill to sandbox only** (public issue [finogeeks/finsafe#32](https://github.com/finogeeks/finsafe/issues/32), PR [Geeksfino/finsafe#205](https://github.com/Geeksfino/finsafe/pull/205))

## [0.9.34] - 2026-08-10

### Added

- **Unified `SandboxViolation` audit records** — Normalized filesystem/network deny events on the shared execution audit envelope: blocked proxy egress dual-emits legacy `ProxyEgressRecord` plus `sandbox_violation`; macOS `--audit` Seatbelt capture populates `attestation.sandbox_violations`. Windows Learning Mode mapping remains helper-only until wired into the launch path. (PR [Geeksfino/finsafe#199](https://github.com/Geeksfino/finsafe/pull/199))
- **macOS `allow_local_binding` AF_UNIX IPC** — Under restricted egress, scoped Seatbelt AF_UNIX bind/connect allows for workspace, `$TMPDIR`, `/tmp`, and `/var/folders` so Node/TS toolchain pipes work; sensitive sockets such as `docker.sock` stay denied unless opted in. (PR [Geeksfino/finsafe#202](https://github.com/Geeksfino/finsafe/pull/202))

### Changed

- **Linux bubblewrap minimum version 0.5.0** — `finsafe probe` / launch fail closed when `bwrap` is missing, unparsable, or older than **0.5.0** (binding constraint: `--clearenv`). Doctor reports `bwrap_version_too_old` with upgrade remediation instead of opaque `bwrap: unknown option` at spawn. (PR [Geeksfino/finsafe#203](https://github.com/Geeksfino/finsafe/pull/203))

### Security

- **MITM / L7 path-authorization hardening** — Ambiguous request paths (encoded traversal, backslashes, malformed `%`) are fail-closed before L7 `path_prefix` matching (`l7_path_ambiguous`). When MITM is licensed and wired, opaque CONNECT and cleartext HTTP-forward bypasses are blocked (`mitm_required`). Post-CONNECT classification waits briefly on non-blocking sockets so missing ClientHello fails closed as `mitm_required` instead of racing to `client_io_error:WouldBlock`. (PR [Geeksfino/finsafe#198](https://github.com/Geeksfino/finsafe/pull/198))

### Fixed

- **Linux Landlock grants write on `/dev/null` (and `/dev/zero`)** — Platform device baseline previously put `/dev/null` in Landlock **read-only**, so shell redirects (`>/dev/null`) failed inside bwrap cells with `Permission denied`. Baseline now adds `/dev/null`/`/dev/zero` as Landlock **read-write** (no bwrap bind; still served by `--dev`), keeps `/dev/urandom`/`/dev/random` read-only, and skips non-directory RW roots when expanding deny-read `.env` masks. Do not list `/dev` itself as Landlock RO (nested-rule intersection would strip `/dev/null` write). The ancestor-read walker also skips character-device RW grants so `/dev/null`/`/dev/tty` do not inject RO `/dev`.
- **Linux bwrap RW mount fixup no longer strips sticky/world-writable mode** — `try_fixup_mount_sources_for_bwrap_identity` previously `chown`ed RW bind sources to the sandbox identity and forced `0755`. That undid entrypoint/`session.rs` `chmod 1777` on `/tmp` and session workspaces, so the first cell launch failed with `bwrap: Can't create file at /tmp/.env: Permission denied` (deny-read mask creation under `--unshare-user` without `CAP_DAC_OVERRIDE`). Fixup now keeps/restores `01777` and also upgrades already-owned `0755` leftovers.

## [0.9.33] - 2026-08-06

### Added

- **`FINSAFE_PROXY_AUDIT_LOG` / `FINSAFE_PROXY_ALLOWLIST_FILE` env passthrough for `run` and `self-confine`** — Integrators launching `finsafe --policy <yaml> run <cmd>` or `finsafe --policy <yaml> self-confine <cmd>` can now enable the FS-2 JSONL egress audit log and the FS-3 hot-reloaded `host[:port]` allowlist file per run by exporting these variables (empty values are treated as unset). The detached `proxy-serve` sibling (macOS/Linux self-confine) receives the equivalent `--audit-log` / `--allowlist-file` flags; the in-process proxy (`run`, Windows self-confine) installs the JSONL sink directly (fail-closed on open error) and seeds + watches the allowlist file with the same fail-closed reload semantics as `proxy-serve`.

## [0.9.32] - 2026-08-05

### Added

- **Per-run loopback proxy ports (`60080–60089`)** — Concurrent `controlled` / self-confine agents no longer collide on a single fixed proxy port; allocation is fail-closed when the range is exhausted (macOS sibling proxy and Windows in-process). (PR [Geeksfino/finsafe#191](https://github.com/Geeksfino/finsafe/pull/191))
- **Linux self-confine private network namespace + loopback proxy relay** — When netns and the relay binary are available, guest traffic is forced through the host loopback proxy; otherwise FinSAFE falls back to the existing UDS proxy path. (PR [Geeksfino/finsafe#191](https://github.com/Geeksfino/finsafe/pull/191))
- **`proxy-serve --audit-log`** — Compact JSONL audit (`ts`, `host`, `port`, `decision`, `reason`) for allow/deny decisions. (PR [Geeksfino/finsafe#191](https://github.com/Geeksfino/finsafe/pull/191))
- **`proxy-serve --allowlist-file` hot reload** — Polls/debounces the allowlist file and atomically swaps the matcher; garbage reloads keep the previous allowlist (fail-closed). (PR [Geeksfino/finsafe#191](https://github.com/Geeksfino/finsafe/pull/191))

### Fixed

- **Seatbelt allows the declared ephemeral proxy port** within the `60080–60089` range so sandboxed children can reach their allocated sibling proxy. (PR [Geeksfino/finsafe#191](https://github.com/Geeksfino/finsafe/pull/191))
- **Ready-marker isolation across loopback port retries** so concurrent proxy startups do not race on a shared ready file. (PR [Geeksfino/finsafe#191](https://github.com/Geeksfino/finsafe/pull/191))

## [0.9.31] - 2026-08-05

### Added

- **Windows Learning Mode deny-and-record audit capture** — On Win11 24H2+ AppContainer hosts where `finsafe probe` reports Learning Mode APIs available, `finsafe --audit` and `finsafe learn` capture structured denials (JSON + `policy_derivation_notes`) without weakening enforcement. Older hosts and RestrictedToken keep kernel ETW + marker hints as the fallback. (PR [Geeksfino/finsafe#188](https://github.com/Geeksfino/finsafe/pull/188))

### Fixed

- **Windows deny-read seals and absent-path placeholders** — Deny-read DACLs no longer treat extended local paths as UNC, seal against inherited write/create more reliably, and materialize missing deny-read placeholders under RW roots so absent-path acceptance matches production behavior. Learning Mode denial notes with spaces in paths round-trip correctly. (PR [Geeksfino/finsafe#188](https://github.com/Geeksfino/finsafe/pull/188))

## [0.9.30] - 2026-07-31

### Added

- **Windows PipeCapture / Buffered ConPTY sessions report operator interrupt** — Ctrl+C or Ctrl+Break on a console-attached supervisor terminates the sandboxed Job (exit code `1`) and attests `termination_reason=operator_interrupted`, distinct from policy timeout kill (`124` / `timeout_killed`). Live ConPTY keeps its existing Ctrl+C-forward contract. (PR [Geeksfino/finsafe#176](https://github.com/Geeksfino/finsafe/pull/176))

### Fixed

- **Linux personal CLI allowlist + `start_internal_proxy` no longer fails when `/run/finsafe-proxy.sock` is missing** — FinSAFE now creates a bubblewrap-compatible guest mount stub (prefer `/run/finsafe-proxy.sock`, fall back to `/tmp/finsafe-proxy.sock` when `/run` is permission-denied or read-only) and wires that path through the loopback relay, env, and bind-mount. Fixes public issue [finogeeks/finsafe#28](https://github.com/finogeeks/finsafe/issues/28). (PR [Geeksfino/finsafe#177](https://github.com/Geeksfino/finsafe/pull/177))
- **Windows operator-interrupt handler cleanup no longer leaves Ctrl+C ignored** — After an interruptible wait, the supervisor removes its console handler instead of calling `SetConsoleCtrlHandler(NULL, TRUE)`. (PR [Geeksfino/finsafe#176](https://github.com/Geeksfino/finsafe/pull/176))

## [0.9.29] - 2026-07-29

### Fixed

- **Windows warm launch no longer re-labels AppContainer trees that are already complete** — Repeat `self-confine` / sandbox starts probe label-completion sentinels and root DACL posture before opening paths for `WRITE_DAC`, share helper-written sentinels under `%ProgramData%`, and drop the per-launch ProjFS smoke rehearsal so large workspace/venv trees are not relabeled on every start. Stale sentinels that outlive a recreated directory are cleared and re-granted. (PR [Geeksfino/finsafe#170](https://github.com/Geeksfino/finsafe/pull/170))
- **RestrictedToken write allowlist no longer TreeSets the whole project root** — When `work_dir` is a strict ancestor of a `read_write_paths` root (typical `./workspace` policies), FinSAFE skips the inheritable cwd grant that previously rewrote DACLs across `target/` and overwrote the child workspace capability ACE (`Access is denied` on allowlisted writes). (PR [Geeksfino/finsafe#170](https://github.com/Geeksfino/finsafe/pull/170))
- **RestrictedToken self-confine smoke policy uses `network: host`** — Matches release-ready preflight (WFP fencing for `network: none` stays on AppContainer) and the Hermes desktop path. (PR [Geeksfino/finsafe#170](https://github.com/Geeksfino/finsafe/pull/170))

## [0.9.28] - 2026-07-24

### Fixed

- **Managed `self-confine` now reports fleet audit events** — Interactive brokers under managed mode previously resolved policy from the agent but never spooled `SandboxStarted` / `RunCompleted` to the authority, so Admin **Audit** / **Runs** stayed empty while short-lived `finsafe run` showed up normally. Managed `self-confine` now registers the run and emits `SandboxStarted` (reason includes `mode=self-confine`) before launch/exec; supervised paths (Windows, tools-only, macOS `--audit` spawn) also emit `RunCompleted`. Linux/macOS `execve` handoff still only reports start. (PR [Geeksfino/finsafe#161](https://github.com/Geeksfino/finsafe/pull/161))

### Changed

- **Managed egress proxy cells inject `WS_PROXY` / `WSS_PROXY`** — Loopback and UDS proxy environment injection now includes WebSocket proxy aliases (and lowercase forms on the loopback path) so WebSocket clients cannot bypass the managed proxy under restricted egress. (PR [Geeksfino/finsafe#158](https://github.com/Geeksfino/finsafe/pull/158))

## [0.9.27] - 2026-07-23

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **fix(landlock): allow O_CREAT at rw workspace root after carveout split** (public issue [finogeeks/finsafe#27](https://github.com/finogeeks/finsafe/issues/27), PR [Geeksfino/finsafe#151](https://github.com/Geeksfino/finsafe/pull/151))

## [0.9.26] - 2026-07-23

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **fix(landlock): allow O_CREAT at rw workspace root after carveout split** (public issue [finogeeks/finsafe#27](https://github.com/finogeeks/finsafe/issues/27), PR [Geeksfino/finsafe#151](https://github.com/Geeksfino/finsafe/pull/151))

## [0.9.25] - 2026-07-23

### Fixed

- **fix(windows): restricted-token `self-confine` uses console inherit instead of ConPTY** — Interactive restricted-token self-confine previously spawned brokers through Live ConPTY, which failed at DLL init (`0xC0000142`) when the child could not attach to a foreign-token conhost. That path now uses **ConsoleInherit** (inherits the supervisor console, `WinSta0\Default` desktop) so agents such as Hermes can start under restricted-token self-confine on Windows. (PR [Geeksfino/finsafe#148](https://github.com/Geeksfino/finsafe/pull/148))

## [0.9.24] - 2026-07-22

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **fix(linux): enforce protected_read_only_paths via bwrap ro-bind carveouts** (public issue [finogeeks/finsafe#21](https://github.com/finogeeks/finsafe/issues/21), PR [Geeksfino/finsafe#141](https://github.com/Geeksfino/finsafe/pull/141))

## [0.9.23] - 2026-07-22

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **fix(linux): self-confine adds network host Landlock paths like run mode** (public issue [finogeeks/finsafe#23](https://github.com/finogeeks/finsafe/issues/23), PR [Geeksfino/finsafe#147](https://github.com/Geeksfino/finsafe/pull/147))

## [0.9.22] - 2026-07-21

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **fix(linux): enforce deny_write_globs under read_write Landlock grants** (public issue [finogeeks/finsafe#22](https://github.com/finogeeks/finsafe/issues/22), PR [Geeksfino/finsafe#142](https://github.com/Geeksfino/finsafe/pull/142))

## [0.9.21] - 2026-07-21

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Added

- **SaaS allowlist works with standard HTTP clients (Linux)** — allowlist proxy-cell executions now wrap the payload with an in-cell loopback relay (`finsafe proxy-relay-exec`): the cell gets `HTTP_PROXY`/`HTTPS_PROXY=http://127.0.0.1:60080` (plus lowercase aliases and `NO_PROXY`), and the relay forwards loopback TCP to the per-execution egress-proxy UDS at `/run/finsafe-proxy.sock`. Unmodified curl, Python `requests`, and Node fetch now traverse the FQDN allowlist without `unix://` proxy support. Previously the cell only received `HTTP_PROXY=unix:///run/finsafe-proxy.sock`, which mainstream clients reject (`curl: (7) Unsupported proxy scheme`). The relay is fail-closed (payload never spawns if the listener or proxy socket is unavailable) and adds no reachability: the cell netns still has no external routes, and all egress terminates at the host-side allowlist proxy. Requires the executor to resolve an absolute `finsafe` path (`FINSAFE_CLI_PATH` or `PATH`); otherwise the legacy `unix://` env is kept.
- **`proxy_loopback` seccomp profile family** (`bwrap-proxy-loopback.json`) — same allowlist as `default` (AF_INET permitted) for allowlist cells running the loopback relay. The executor pins this family automatically on relay cells (overriding any inherited `FINSAFE_BWRAP_SECCOMP_PROFILE_FAMILY=proxy_uds`, which would kill the relay's loopback sockets); operators still control seccomp *mode* via `FINSAFE_BWRAP_SECCOMP`. Also selectable explicitly in operator config `hardening.seccomp.profile_family`. **Security note:** because `proxy_loopback` permits AF_INET (unlike `proxy_uds`), seccomp no longer backstops IPv4/IPv6 socket creation, so `--unshare-net` is the *sole, non-degradable* network boundary for relay cells — bwrap fails closed (the cell never launches) if it cannot create the network namespace, and all egress still terminates at the host-side FQDN allowlist proxy.

### Notes / scope

- This applies to **short-lived SaaS one-shot / workspace-turn executions on Linux** (`finsafe-server` executor). It does **not** change `self-confine` / resident-broker allowlist, which remains `proxy_uds` (UDS-only); standard-HTTP-client allowlist there is not yet wired. macOS/Windows allowlist behavior is unchanged.
- **`wrapper_launch.compiler_version` is now 2** — probe/attestation/router details report the bumped wrapper-policy compiler revision so audit can distinguish loopback-relay derivation from the legacy `unix://` proxy-cell path (v1).

### Fixed

- **fix(linux): Landlock read_write_paths under bwrap + shim (finogeeks#20)** (public issue [finogeeks/finsafe#20](https://github.com/finogeeks/finsafe/issues/20), PR [Geeksfino/finsafe#140](https://github.com/Geeksfino/finsafe/pull/140))

## [0.9.20] - 2026-07-20

### Fixed

- **SaaS Docker allowlist launch** — Pre-create `/run/finsafe-proxy.sock` in `Dockerfile.saas`, `Dockerfile.saas.prebuilt`, and recreate it in `docker-entrypoint.sh` on each start. Without this mount target, `network.mode=allowlist` cells failed at launch with `Bubblewrap mount target(s) missing in rootfs: /run/finsafe-proxy.sock` (exit 3) even when `host_capabilities.allowlist_supported=true`. Published to `ghcr.io/geeksfino/finsafe-saas:v0.9.20`.

## [0.9.19] - 2026-07-19

### Fixed

- **macOS Seatbelt `self-confine` symlink path spelling:** policy `read_only_paths` / `read_write_paths` that are themselves symlinks (for example a CLI-safe home alias under `~/.findesk-dev/...` pointing at `~/Library/Application Support/...`) are now emitted under **both** the literal and canonical spellings. Previously `prepare_macos_seatbelt_self_confine` canonicalized those entries first, so a Hermes (or other) shebang/argv that still referenced the literal alias failed with `EPERM` even though the resolved target was allowed.

## [0.9.18] - 2026-07-19

### Added

- **SaaS daemon `host_capabilities` config** — `daemon.yaml` can declare `allowlist_supported` and `proxy_profiles` for the policy router. Short-lived `HighLevelPolicyV1` executions (one-shot submits and workspace session turns) honor this setting; Phase Y resident brokers remain on `self-confine` wrapper templates. When `allowlist_supported: true`, the executor starts an embedded `finsafe-net-proxy` per execution (fail-closed if the proxy fails to start).

## [0.9.17] - 2026-07-18

### Added

- **examples: Hermes Windows interactive policy** (`hermes-windows-interactive.yaml`) — RestrictedToken + `self-confine` recipe for a live Hermes session (`program_mode: interactive`, no session timeout). The Unix-path `hermes-interactive.yaml` does not apply on Windows, and the oneshot policy's `short-lived` mode + 120 s timeout must not be reused for interactive sessions.

### Fixed

- **Windows interactive `self-confine` (both backends):** FinSAFE now performs the terminal-host half of the Live ConPTY contract. The supervisor's real console is switched to raw/VT mode for the session — per-key stdin (no line buffering / double echo), arrow and function keys delivered as VT input, ANSI rendering on classic conhost — and **Ctrl+C is forwarded to the broker** instead of killing the FinSAFE supervisor (which previously tore down the whole session via the Job object; Ctrl+Break remains the session kill). Console window resizes are forwarded to the broker via `ResizePseudoConsole`. Original console modes are restored on exit. This is what prevented interactive TUI agents (e.g. Hermes) from being usable under `self-confine` even after the 0.9.15 spawn fix; one-shot `run` was unaffected.

## [0.9.16] - 2026-07-17

### Added

- **Sandbox-as-a-Service public delivery:** Linux archive `finsafe-saas-server-v*`
  (`finsafe-server-http` + public `finsafe` + helper/shim/supervisor) and multi-arch
  OCI image `ghcr.io/finogeeks/finsafe-saas` (`linux/amd64`, `linux/arm64`) via
  `release-public-cli.yml`. Prefer the image for Docker sidecars (including macOS
  Docker Desktop); use the tarball for bare-metal Linux installs.

## [0.9.15] - 2026-07-13

### Added

- **`broker_confine: tools-only` (opt-in):** leave the interactive broker unsandboxed for a live TTY; confine tools via `finsafe run` / execution cells. Audit attests `broker_confined=false` / `confine_scope=tools_only`. Example: `examples/wrapper-policies/hermes-interactive-tools-only.yaml`.

### Changed

- **Windows RestrictedToken interactive `self-confine`:** defaults to **Live ConPTY** when available (Codex-aligned spawn: no console-window flags; `lpDesktop=Winsta0\Default`). Escape hatch: `FINSAFE_WIN_PTY_MODE=pipe`.

### Fixed

- **Windows RestrictedToken interactive `self-confine`:** child could exit with `STATUS_DLL_INIT_FAILED` (`0xC0000142`) on the legacy `CreateProcessAsUserW` spawn path (public issue [finogeeks/finsafe#17](https://github.com/finogeeks/finsafe/issues/17), PR [Geeksfino/finsafe#109](https://github.com/Geeksfino/finsafe/pull/109)). **0.9.15+** defaults to Live ConPTY; escape hatch `FINSAFE_WIN_PTY_MODE=pipe`.
- **Windows:** export `preflight_windows_launch` from `finsafe-winsafe` so `finsafe-cli` cross-compile and Windows acceptance builds resolve the symbol.

## [0.9.14] - 2026-07-12

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Added

- **docs: dedicated Windows desktop guide** — [WINDOWS-GUIDE.md](docs/WINDOWS-GUIDE.md) / [WINDOWS-GUIDE-zh.md](docs/WINDOWS-GUIDE-zh.md) covers install → RestrictedToken vs AppContainer decision tree → `probe`/`doctor` → Hermes examples → AppContainer/ProjFS → troubleshooting. Linked from README, USER-GUIDE, POLICY-QUICKREF, and agent-sandbox-guide.

### Fixed

- **fix(windows): load ProjFS dynamically so finsafe starts without projectedfslib.dll** (public issue [finogeeks/finsafe#15](https://github.com/finogeeks/finsafe/issues/15), PR [Geeksfino/finsafe#106](https://github.com/Geeksfino/finsafe/pull/106))

## [0.9.13] - 2026-07-11

### Added

- **Windows ProjFS projection for large AppContainer runtimes:** Optional Projected File System support projects large trees (for example Node/Python agent runtimes) without recursive DACL walks. `finsafe setup-windows` / the Windows installer can enable the feature; `finsafe probe --json` reports ProjFS readiness. See [USER-GUIDE.md](docs/USER-GUIDE.md).
- **Windows `write_restricted` backend:** Explicit weaker compatibility mode (RestrictedToken-family write allowlist without AppContainer) for hosts that need host-wide read. Prefer Auto defaults unless you pin a backend.
- **examples: Hermes Windows AppContainer policy** (`hermes-windows-oneshot-appcontainer.yaml`) alongside the RestrictedToken `hermes-windows-oneshot.yaml`.
- **examples: Linux-specific Hermes interactive wrapper policy** (`hermes-linux-interactive.yaml`) — `stdio: pty`, `skip_default_deny_read` for `${HOME}/.hermes/.env`, and `/etc/resolv.conf` for DNS inside bubblewrap. Contributed via public PR [finogeeks/finsafe#14](https://github.com/finogeeks/finsafe/pull/14) by [@xulis](https://github.com/xulis).

### Changed

- **Windows desktop default backend:** Auto + `network: host` (empty YAML `deny_read_paths`) now selects **RestrictedToken** (Codex-aligned host-wide read, write allowlist). AppContainer remains for `network: none` / allowlist, confidential deny-read, explicit `windows.backend: appcontainer`, and managed fleet. ProjFS is optional (AppContainer large-runtime projection); `doctor` reports ProjFS issues as warnings. See [USER-GUIDE.md § Windows backends](docs/USER-GUIDE.md) and [POLICY-QUICKREF.md](docs/POLICY-QUICKREF.md).

## [0.9.12] - 2026-07-08

### Added

- **Windows WFP egress fence verification:** Before AppContainer launch with `network: none`, FinSAFE runs a host-side TCP probe and records `windows_egress_fence_verified` and `windows_egress_fence_probe_target` on `finsafe run --json` / self-confine reports. When the current logon token lacks `finsafe-net`, the helper can refresh via S4U logon so the probe exercises the same principal the child will use.

### Security

- **Windows outbound deny attestation:** A successful connect to the probe target fails launch setup (fail-closed) on desktop hosts; `WSAEACCES` (Winsock 10013) counts as verified fence behavior.

### Fixed

- **Linux bubblewrap:** Reject shell metacharacter injection in curated argument paths (ecosystem-watch hardening).

## [0.9.11] - 2026-07-01

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **fix(linux-seccomp): allow x86_64 epoll_wait and vfork in self-confine** (public issue [finogeeks/finsafe#13](https://github.com/finogeeks/finsafe/issues/13), PR [Geeksfino/finsafe#88](https://github.com/Geeksfino/finsafe/pull/88))

## [0.9.10] - 2026-06-26

### Security

- **macOS restricted egress + `allow_local_binding`:** Seatbelt outbound rule now uses `(remote ip "localhost:*")` instead of `(local ip "*:*")`, which previously matched unbound `connect()` sources and bypassed the egress allowlist when clients ignored proxy env vars (aligned with upstream [sandbox-runtime#316](https://github.com/anthropic-experimental/sandbox-runtime/pull/316)). Injects `JAVA_TOOL_OPTIONS=-Djava.net.preferIPv4Stack=true` for Java/Gradle loopback clients under the same posture.

## [0.9.9] - 2026-06-25

### Fixed

- **Allow inotify, io_uring, and legacy file syscalls in Linux seccomp profile** (public issue [finogeeks/finsafe#12](https://github.com/finogeeks/finsafe/issues/12), PR [Geeksfino/finsafe#74](https://github.com/Geeksfino/finsafe/pull/74))

## [0.9.8] - 2026-06-24

### Fixed

- **Windows AppContainer large dependency trees (`node_modules`, `venv`, agent checkouts):** Inheritable DACL relabels now use `TreeSetNamedSecurityInfoW` with coarse progress reporting, and only skip repeat work when a **completion sentinel** proves the whole tree was labeled. Fixes interrupted first launches that left the root tagged but descendants without `FILE_EXECUTE` (no execute permission on nested `.exe` files). `FINSAFE_WINSAFE_INHERIT_ROOT_FAIL=0` still only downgrades the size guard — it does not bypass labeling.
- **Windows Node.js agent runtimes:** Auto-detect `node_modules` behind the resolved command target and grant read+execute on that tree (same exemption from the large-tree fail-closed guard as Python venvs).
- **Windows tree DACL FFI:** Correct `TreeSetNamedSecurityInfoW` parameter order and progress-callback signature for Windows 10/11.

## [0.9.7] - 2026-06-23

### Fixed

- **Windows nested `cmd` stdout capture:** Non-interactive AppContainer console hosts (`cmd`, PowerShell) use **PipeCapture** with `CREATE_NEW_CONSOLE` so nested external children (`cmd /c whoami`) capture stdout without `STATUS_DLL_INIT_FAILED` (`0xC0000142`). Restores the stable path after a Buffered ConPTY default regression (PR [Geeksfino/finsafe#72](https://github.com/Geeksfino/finsafe/pull/72)).

### Added

- **Windows launch attestation:** `windows_stdio_strategy` and `windows_creation_flags` on `finsafe run --json` and self-confine reports — the resolved stdio strategy and `CreateProcess` flags for operator diagnostics (distinct from the coarse `windows_pty_mode` label).

## [0.9.6] - 2026-06-23

### Fixed

- **fix(windows): allow cmd.exe to spawn child processes under AppContainer** (public issue [finogeeks/finsafe#10](https://github.com/finogeeks/finsafe/issues/10), PR [Geeksfino/finsafe#68](https://github.com/Geeksfino/finsafe/pull/68))
- **Windows AppContainer nested `cmd` children:** AppContainer pipe-capture console hosts (`cmd`, PowerShell) use `CREATE_NEW_CONSOLE` with inherited pipe std handles so nested external children (`cmd /c whoami`) capture stdout after the desktop-isolation skip (#68). Non-console images keep `DETACHED_PROCESS`.

## [0.9.5] - 2026-06-22

### Fixed

- **Windows AppContainer / Hermes:** Avoid duplicate inheritable DACL work when wrapper policy lists paths that overlap the auto-detected Python venv (`Scripts` / `Lib`). First launch may still label a large `site-packages` tree once; re-launches stay fast. Do not list the venv in `read_only_paths` — see Windows sandbox operator notes.

## [0.9.4] - 2026-06-22

### Added

- **Per-environment egress scoping (#58):** `environment_id` attribution at the proxy boundary, per-environment approval store, and strict fail-closed mode for unattributed requests.
- **Track B (macOS/Windows):** Sandbox-level L7 deny, identity injection, and parent-proxy chain probes; wrapper policy governance fields (`inject_identity`, `l7_rules`, `credential_map`) wired through `internal_proxy`.
- **Docs:** Agent sandbox guides (EN/zh), platform feature matrix, and `finsafe-agent-sandbox-run` skill.

## [0.9.3] - 2026-06-22

### Fixed

- **fix(windows): AppContainer execute grants for read_only/read_write paths** (public issue [finogeeks/finsafe#9](https://github.com/finogeeks/finsafe/issues/9), PR [Geeksfino/finsafe#64](https://github.com/Geeksfino/finsafe/pull/64))

## [0.9.2] - 2026-06-20

### Added

- **Egress L7 governance (Track A):** Identity injection, static L7 rules, token brokering (`network.credential_map`), bounded content audit (schema v4), compile-time threat-intel allowlist augmentation, and parent-proxy `required` fail-closed at proxy launch.
- **Executor → server audit (G11):** `ExecutionRecord.proxy_egress_records` populated after proxied cell runs.
- **Track B (macOS):** HTTPS MITM-through-sandbox probe (`sandbox_exec_mitm_https_via_tcp_loopback_proxy`); CLI `internal_proxy` uses the same `build_proxy_config_from_plan` pipeline as the executor.
- **Docs:** `docs/design/token-transformation.md`, updated governance acceptance matrix (G1–G11).

### Changed

- **Parent proxy:** Bundle-declared `network.parent_proxy` with launch-time reachability probe when `required: true`.

## [0.9.1] - 2026-06-20

### Fixed

- **macOS `finsafe self-confine`:** Seatbelt profile temp files are kept alive until `sandbox-exec` starts, fixing exit 65 (`…/.tmpXXXXXX: No such file or directory`) on interactive wrapper launches (Hermes, agy, and other `program_mode: interactive` policies).

### Added

- **Agent-sandbox examples:** `agy-interactive.yaml` for `self-confine` with agy; updated `agy-oneshot.yaml` with Antigravity IDE auth paths (`~/Library/Application Support/Antigravity`, Keychain, Preferences).
- **Public skill:** `finsafe-agent-sandbox-verify` expanded with R2-seatbelt, self-confine sub-suite, and agy auth gotchas (F11).

## [0.9.0] - 2026-06-20

### Added

- **`finsafe learn` / `finsafe explain`:** Capture sandbox denials and turn them into policy YAML or human-readable explanations on Linux (bubblewrap), macOS (Seatbelt), and Windows (AppContainer wrapper). Inline remediation hints appear on denial paths across platforms.
- **`finsafe init`:** Seeds reference policy examples under the user config directory (`~/.config/finsafe/policies/examples/` on Linux/macOS, `%APPDATA%\FinSAFE\policies\examples\` on Windows). Install scripts now suggest running it after install; it does not auto-select a default policy for `run`.
- **Public docs:** Hermes and OpenCode quick starts, first-run flow, agent-sandbox wrapper examples, and install-path guidance in README and USER-GUIDE (EN/zh).

### Changed

- **Learn output paths:** Default `finsafe learn --out` writes to `policies/learned-policy.yaml` under the FinSAFE user config root via `policy_paths`.
- **CLI:** Removed the experimental `finsafe learn --agent` flag until an agent registry exists; `run --high-level --agent <id>` remains for scheduler identity only.

## [0.8.17] - 2026-06-17

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **fix(windows): split sc.exe keyword args for setup-windows service create** (public issue [finogeeks/finsafe#7](https://github.com/finogeeks/finsafe/issues/7), PR [Geeksfino/finsafe#55](https://github.com/Geeksfino/finsafe/pull/55))

## [0.8.16] - 2026-06-17

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **fix(windows): skip inheritable relabel when work_dir is under Program Files** (public issue [finogeeks/finsafe#8](https://github.com/finogeeks/finsafe/issues/8), PR [Geeksfino/finsafe#54](https://github.com/Geeksfino/finsafe/pull/54))

## [0.8.15] - 2026-06-17

<!-- Curate entries here, then cut a dated section before dispatching release-public-cli.yml. -->

### Fixed

- **fix(windows): AppContainer DACL grants without Write Owner; winhelper fallback** (public issue [finogeeks/finsafe#5](https://github.com/finogeeks/finsafe/issues/5), PR [Geeksfino/finsafe#53](https://github.com/Geeksfino/finsafe/pull/53))

## [0.8.14] - 2026-06-16

### Fixed

- **Windows AppContainer System32 console hosts (`cmd.exe`, `powershell.exe`):** Launching a system-owned binary under AppContainer no longer wedges for minutes on hosts with Defender tamper-protection or EDR file filters. The launcher was applying redundant ancestor and volume-root traverse grants via `SetNamedSecurityInfoW` to `C:\Windows\System32`, `C:\Windows`, and `C:\`; those directories already grant `ALL APPLICATION PACKAGES` read+execute and AppContainer tokens bypass traverse checks. The redundant writes are now skipped, restoring fast (~1s) launches for `finsafe run cmd …` and `finsafe self-confine cmd …`.
- **Windows self-confine ConPTY on headless hosts:** Forced live-ConPTY smokes and teardown paths are more robust on non-TTY CI and automation runners (bounded `ClosePseudoConsole`, buffered capture routing for console hosts under `FINSAFE_SELF_CONFINE_FORCE_PTY`).

## [0.8.13] - 2026-06-16

### Fixed

- **Windows AppContainer `read_write_paths` directory listing and delete:** Sandboxed `cmd /c dir` and `cmd /c del` under paths listed in `filesystem.read_write_paths` no longer fail with Access denied when the child cwd is inside those roots. RW DACL grants now include explicit `FILE_LIST_DIRECTORY` and `DELETE` bits so LowBox checks match what `FindFirstFile` and `DeleteFile` need (public issue #4).

## [0.8.12] - 2026-06-16

### Fixed

- **Windows AppContainer `read_write_paths` directory ops:** Sandboxed `cmd` could create and read files under a declared RW root but `dir` (FindFirstFile) and `del` (DeleteFile) failed with Access denied even when the child cwd matched that root. RW DACL grants now include explicit traverse and delete-child permissions; access-denied hints no longer suggest a missing RW grant when cwd is already inside `read_write_paths`.

## [0.8.11] - 2026-06-13

### Fixed

- **Windows `read_only_paths: ["."]` with `read_write_paths: ["./workspace"]`:** Shell smoke (`cmd /c dir`, PowerShell) keeps the launch directory as the sandboxed child cwd instead of auto-relocating into `./workspace`, so read-only listing of the project root works again. Auto workspace cwd still applies for the common `./workspace`-only smoke case.

## [0.8.10] - 2026-06-12

### Added

- **`finsafe setup-windows`:** One-time Windows host setup for personal desktops. Registers and starts the `finsafe-winhelper` Windows service beside `finsafe.exe`, provisions the network sandbox (`network: none` / allowlist policies), and may show a single Windows permission prompt. `install.ps1` runs this automatically after install.
- **`finsafe doctor` on Windows:** Warns when the helper service is not running and points operators to `finsafe setup-windows` (policies with `network: host`, such as Hermes, do not need this step).

### Fixed

- **Windows network setup errors:** Failures such as `NetLocalGroupAdd(finsafe-net): 5` now include plain-language guidance to run `finsafe setup-windows` instead of opaque Win32 errors alone.
- **`finsafe-winhelper` Windows Service mode:** SCM-started helper no longer forces console mode; dev/acceptance still use `FINSAFE_WINHELPER_CONSOLE=1`.
- **Windows wrapper work-dir / smoke:** Policy `filesystem.*_paths` always resolve from the shell cwd; `--work-dir` only sets the sandboxed child's working directory (fixing `./workspace` double-nesting when both were set to `workspace`). When a policy has a sole relative `read_write_paths` entry (for example `./workspace`), FinSAFE auto-creates the directory, auto-uses it as child cwd for `cmd` / PowerShell smoke runs, and grants read+write on the child cwd when it matches that RW root. Access-denied hints steer operators to `cmd /c echo hello` instead of `cmd /c dir`.

## [0.8.9] - 2026-06-11

### Fixed

- **Windows `stdio.mode: inherit` on interactive consoles:** `finsafe run` with a policy that sets `stdio.mode: inherit` (e.g. policies reused from embedded-host deployments) silently produced no output in interactive PowerShell/cmd sessions on 0.8.8 — even `cmd /c dir` looked broken. The launcher now detects when its own stdout is a console (not a host-owned pipe) and falls back to buffered capture + replay, so output always appears. True passthrough is unchanged for embedded hosts that own pipes; `FINSAFE_WIN_PIPE_INHERIT_FORCE=1` forces passthrough onto a console if you really want it.
- **Windows wrapper text-mode replay:** Captured child output on the wrapper `run` path now replays through the console-aware writer (`WriteConsoleW`), matching the spec `run` path, so localized (OEM-codepage) output renders correctly.

### Added

- **Windows agent runtime auto-grant (Hermes works out of the box):** When the resolved command target lives inside a Python venv (e.g. `hermes.exe` under `…\venv\Scripts\`), FinSAFE now automatically grants the sandbox read+execute on the venv root **and** the base interpreter referenced by `pyvenv.cfg`. Previously such launches died in the loader with `STATUS_DLL_INIT_FAILED` (0xC0000142) unless the policy enumerated venv internals — which then tripped the inheritable-ACL size guard. The first launch labels the runtime tree once and prints a progress line (`finsafe: granting sandbox read access to agent runtime …`); subsequent launches are fast. Volume/profile roots are never auto-granted.
- **`examples/wrapper-policies/hermes-windows-oneshot.yaml`:** Windows policy for one-shot Hermes commands (`hermes --version`, `hermes chat -q …`) — no venv paths, no stdio overrides needed.

## [0.8.8] - 2026-06-11

### Added

- **Windows PipeInherit stdio:** Embedded hosts (e.g. desktop agents speaking JSON-RPC over pipes) can request live bidirectional stdio by setting **`stdio.mode: inherit`** on the CLI `run` path. The sandboxed child inherits the launcher's own standard handles — no ConPTY, no `stdin = NUL`, and no buffer-until-exit capture that deadlocks long-lived agents.
- **Windows stdio design docs:** Public design references for the Windows stdio strategy inventory, MXC comparison, and PipeInherit embedded-host contract.

### Fixed

- **Windows localized cmd output:** PipeCapture decodes OEM-encoded bytes from detached console hosts (e.g. localized `dir` headers) via OEM/ACP fallback instead of lossy UTF-8.
- **Windows acceptance cargo test:** `windows-acceptance` runs `cargo test` with `--no-fail-fast` so one failing crate does not skip `finsafe-winsafe` unit tests.

## [0.8.7] - 2026-06-10

### Changed

- **Windows self-confine live output (Stage 2):** Interactive `self-confine` on a real TTY now streams broker output live through ConPTY pumps under **both** backends, including AppContainer. Previously interactive AppContainer console hosts (`cmd`, PowerShell) were diverted to buffered ConPTY capture, which froze the screen until broker exit and could wedge in conhost teardown (scripts appearing to hang until an external timeout). Non-TTY callers keep pipe capture and replay-after-exit.
- **Bounded ConPTY teardown:** After the broker exits, the live-ConPTY stdout drain is capped at 5 s; a wedged conhost flush is detached (with a `FINSAFE_WIN_LAUNCH_DEBUG=1` diagnostic) instead of hanging the supervisor.

### Fixed

- **Windows self-confine policy timeout:** `self-confine` now honors `resources.timeout_ms` from the compiled execution spec instead of always waiting forever; long-lived brokers still omit the field for an infinite supervisor wait. The `launch_windows_full` timeout parameter is wired through to the child wait (it was previously ignored).
- **Windows inheritable-ACL fast path:** Repeat launches on a tree that already carries inheritable package DACL grants skip the fail-closed large-tree guard even when the low-integrity label probe is inconclusive, matching the idempotent `SetNamedSecurityInfoW` skip in `grant_path`.

### Added

- `FINSAFE_WIN_PTY_MODE=live|buffered|pipe` — diagnostic override for the interactive stdio plumbing if a specific host misbehaves.
- `FINSAFE_SELF_CONFINE_FORCE_PTY=1` — test/diagnostic hook that forces the ConPTY path without a TTY; used by the Windows acceptance suite to exercise pseudoconsole attach + teardown under AppContainer.

### Known gaps

- Non-interactive `self-confine` with console hosts (`cmd`, PowerShell) on headless Windows runners can still wedge for minutes in some CI environments. CI skips the optional `cmd /c echo` smoke by default (`FINSAFE_WIN_ACCEPTANCE_SELF_CONFINE_CMD=1` for local runs). Interactive TTY launches use live ConPTY (Stage 2).

## [0.8.6] - 2026-06-10

### Fixed

- **Windows self-confine interactive output:** ConPTY (`live_conpty`) launches now set `STARTF_USESTDHANDLES` with null std handles so console-subsystem children connect to the pseudoconsole instead of inheriting the parent terminal handles. Without this, AppContainer-confined `cmd`, `whoami`, and PowerShell could exit successfully yet print nothing in an interactive PowerShell session.

## [0.8.5] - 2026-06-06

### Fixed

- **Windows AppContainer deny-read:** Deny-read paths (explicit policy entries and built-in defaults such as `workspace/.env` and `%USERPROFILE%/.ssh`) are enforced via protected DACL sealing on leaf files. Inherited package read ALLOW ACEs on writable workspace ancestors no longer let confined processes read denied secrets.
- **Windows acceptance:** Deny-read scenarios are back in CI (`deny_read`, built-in `.env` and `.ssh`, and `skip_default_deny_read` opt-out).

## [0.8.4] - 2026-06-04

### Added

- **Corporate parent proxy (pilot):** The loopback egress proxy can chain outbound HTTPS via an upstream HTTP(S) CONNECT parent using `FINSAFE_PARENT_PROXY_URL` and optional `FINSAFE_PARENT_PROXY_NO_PROXY` (credentials via env only; not in signed bundles).
- **Terminology glossary:** Public docs add English and Chinese glossaries for sandbox, policy, fleet, and proxy terms.

### Changed

- **Regression matrix:** Stage-2 includes `net-parent-proxy-mock` for parent-proxy chaining smoke coverage on macOS/Linux.

### Fixed

- **Windows acceptance CI:** Inline deny-read policy YAML includes required `audit` fields; network-deny scenario asserts WFP filter installation.

## [0.8.3] - 2026-06-04

### Added

- **Body-aware L7 DLP:** MITM egress proxy can inspect HTTP request bodies against policy `dlp` rules (regex patterns, size caps); sensitive payloads are blocked with HTTP 403 when inspection cannot run safely.
- **Windows UI isolation:** Tier B sandbox children spawn on a private Win32 window station and desktop so they cannot enumerate or message interactive `WinSta0\Default` windows or use the interactive clipboard; outcome is recorded in run attestation as `windows_desktop_isolation`. **Superseded:** from #600 the private station is removed because it broke nested console children (`0xC0000142`). UI isolation is the Job Object mask on inherited `WinSta0\Default`; see [the 2026-10-05 spec](../superpowers/specs/2026-10-05-windows-appcontainer-winsta0-streaming-stdio-design.md) and the Unreleased notes.
- **Toolchain profiles:** `self-confine` and policy merge support for toolchain-style host profiles and bundled policy overlays.

### Security

- **Sensitive Unix socket defaults:** Built-in deny for common container control sockets (Docker, containerd, podman, Docker Desktop / OrbStack shims) on Linux (`deny_read` / bwrap overlay) and macOS (Seatbelt `unix-socket` rules). Opt in with `filesystem.allow_unix_socket_paths` when an agent must use a local container API. `read_only_paths` does not block socket `connect()`—see [POLICY-QUICKREF](./docs/POLICY-QUICKREF.md).

## [0.8.2] - 2026-06-03

### Added

- **Public release history:** `CHANGELOG.md` on [finogeeks/finsafe](https://github.com/finogeeks/finsafe/blob/main/CHANGELOG.md); GitHub Release descriptions are generated from the matching version section (no private commit log).
- **Sandbox egress proxy:** TLS SNI handling and loopback proxy support for controlled outbound traffic from confined workloads.

### Fixed

- **Linux `finsafe run`:** Bubblewrap deny-read no longer fails when optional paths (for example `~/.aws`) are missing on the host.
- **Windows managed builds:** WFP network fence and winhelper IPC aligned with `windows-sys` 0.52 so release and CI Windows targets compile reliably.

### Changed

- Linux isolated Landlock policy tests and docs updated for expected path layout.
