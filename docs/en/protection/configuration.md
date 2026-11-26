# Configuration explained

[简体中文](../../zh-CN/protection/configuration.md) · [Protection guide](README.md)

Identify your integration first. Bundled DSH / OpenCode settings, the Windows PII integration example and Linux / macOS CLI policies are not interchangeable configurations.

## Currently documented entry points

| Setting or operation | Public scope |
| --- | --- |
| Integration-plugin installation, authorization, protection status, updates and disablement | Follow the [DSH](https://github.com/finogeeks/finsafe/blob/main/integrations/dsh/windows/README.md) / [OpenCode](https://github.com/finogeeks/finsafe/blob/main/integrations/opencode/windows/README.md) guide |
| Bundled plugin file permissions and network baseline | Published YAML explains defaults; it does not establish an arbitrary path, website or PII editor in the plugin page |
| Windows external PII configuration | Matching-version developer integration examples, a configuration script and activation steps are public; this is a separate integration workflow |
| Unpublished settings or settings without a supported entry | Not listed as current user switches; field names and prototypes alone do not establish availability |
| OpenCode manual native executable, YAML or version-root overrides | Public documentation retires these overrides; this guide does not restore old parameters |

Installed, authorized and protected statuses do not replace checking an individual effective setting. Plugins and personal-edition installations can use different configuration locations and security domains. Editing one similarly named file does not establish a change to the current Agent.

## File-permission fields

Windows Job/UI and initial-desktop options are CLI launch arguments in supported versions, not Candidate file-permission fields. See [Windows system and desktop protection](windows-security.md) for values, defaults and low-level API boundaries.

Paths below are relative to a Windows Candidate's `policy` section. See [Plugin defaults](defaults.md) for default scope.

| Field / value | Effect | Practical boundary |
| --- | --- | --- |
| `filesystem_coverage.root` | File-access coverage baseline; public plugin snapshots use `read_write` | Does not mean only the default workspace is writable |
| `filesystem[].path` | File or directory targeted by a rule | Check the resolved location; backups, moved data and another drive are not automatically covered |
| `access: deny` | Rejects access to the target | Verify reads and relevant operations against owned fixtures |
| `access: read_only` | Permits reads and restricts changes | Content remains readable; this alone does not prevent sending it to a model |
| `access: read_write` | Permits the relevant reads and writes | Can include destructive overwrite or deletion; it is not automatic backup |
| `access: host` | Retains host behavior for the compatibility entry | Used by the public Recycle Bin entry; it is not an additional deny rule |
| `inheritance: descendants` | Extends a directory rule to descendants | Check the target and other specific rules together |
| `lifecycle` | Distinguishes existing locations from locations created during preparation | Part of configuration and preparation, not an application-page permission switch |
| `id`, `source` | Identify a rule and its origin | Renaming them does not add protection or authorization |

`security_domain_id` identifies native security resources; `integrations` identifies integrations. They are not website-filter switches or a way to grant protection to a process. Use supported configuration and authorization entries rather than changing these identifiers to bypass the workflow.

## Network and PII fields

These fields come from the public Windows PII integration example under `policy.network`. **They are not DSH / OpenCode plugin defaults or confirmed plugin-page settings.**

| Field | Effect |
| --- | --- |
| `mode: host` | Retains host networking; the public integration plugins default to this mode |
| `mode: proxy` | Uses the FinSAFE proxy path in a supporting product configuration; verify that actual requests traverse it |
| `tls_terminate: true` | Enables inspection of HTTPS content on that path; matching product support, certificate trust and supported protocol formats are still required |
| `endpoints` | Configures permitted destinations; the example's `["*.*"]` is broad, not a strict allowlist |
| `llm_content.retention` | Controls the example's original-content retention; it is not a blocking or redaction switch |
| `llm_content.max_body_bytes` | Body-size limit; the example uses `16777216` or 16 MiB, not coverage for arbitrary sizes or formats |
| `llm_content.plugins` | Detector list; only the first entry is selected, without sequential fallback to later entries |
| `detector: pii`, `categories` | Selects built-in PII detection and supported categories; public examples list `global.email` and `cn.resident_id` |
| `detector: external`, `executable` | Selects a separately delivered detector EXE, which runs outside AppContainer as a trusted extension |
| Selected entry's `on_finding` | Finding action: `warning` permits sending, `block` stops sending, `approval_required` waits for approval |
| External entry's `allow_rewrite` | Permits valid returned text edits; does not guarantee the plugin returns edits |
| External entry's `timeout_ms` | Bounds external-detector startup / call waiting; the example uses `2000` milliseconds, not a total model-request timeout |

See [Network access, exfiltration and PII](network-pii.md) for sending and redaction outcomes. When original-content retention is enabled, manage access and retention according to the product's recording mechanism. Redacting text sent to a model does not mean every local original has been deleted.

## Resource fields

| Field | Purpose and public default |
| --- | --- |
| `resources.timeout_ms` | Runtime limit; public plugin snapshots use `max`, without a finite limit in this field |
| `resources.memory_max` | Memory maximum; snapshots use `max`, not a stated fixed memory quota |
| `resources.pids_max` | Process-count maximum; snapshots use `max`, not one process by default |
| `resources.cpu_max` | CPU quota field; snapshots retain `100000 100000`. Enforcement depends on platform and version; Linux quota interpretation is not verified Windows plugin behavior |

These fields do not establish corresponding sliders or inputs in the plugin UI. Changes to platform resource behavior require a supported entry in the installed version and verification of actual results.

## How saved configuration becomes effective

The public PII example separates these stages:

1. `candidate.yaml` stores desired configuration. Editing it alone does not establish a change in running request processing.
2. The existing `config materialize` command generates `effective.yaml`.
3. The existing Inspector refresh applies new content settings to subsequent requests. Requests already processing retain their settings. If no Inspector is running, the next normal protected launch loads the configuration.
4. Network-scope or TLS changes requiring new authorization still use the existing authorization workflow. The sample script does not perform authorization for the user.

The sample script backs up Candidate and Effective before applying the complete network configuration. Handle actual materialization or refresh errors; the script has no automatic rollback and does not migrate an integration plugin into a different network product. Do not overwrite an existing narrower destination set, other permissions or another instance's settings with the complete example.

See the [redactor integration walkthrough](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/examples/redactor/README.md) for the full flow and failure recovery, and the [PII protocol](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/docs/protocol.md) for text boundaries.
