# Plugin defaults

[中文](../../zh-CN/protection/defaults.md) · [Protection guide](README.md)

This page explains DSH and OpenCode Windows plugin defaults from the public FinSAFE configurations checked on 2026-11-26. It describes bundled configuration, not a substitute for your installed version's effective settings and actual authorization.

## Which processes are protected

The DSH and OpenCode plugins protect their Agent execution Host and the relevant controlled execution paths. Desktop Main, ordinary updaters and other applications do not all enter the same sandbox. Installation, completed authorization, a required reopen, and actual current-process protection are different states.

Install through the normal plugin entry, reopen as instructed, check actual protection, then [test allowed and denied operations](../getting-started/install.md#verify-permission-scope). An open desktop window alone does not prove execution-process protection.

## Bundled configuration baseline

| Setting | Public DSH and OpenCode default | Meaning |
| --- | --- | --- |
| File baseline `filesystem_coverage.root` | `read_write` | Files outside the workspace are not all denied by default; also check explicit directory rules and actual Windows permissions |
| Sensitive-directory `filesystem` entries | `deny`, `read_only` and other rules below | Restrict reads, changes or deletion at the corresponding paths |
| Network `network.mode` | `host` | This default enables neither the FinShield proxy, destination restrictions nor model-content inspection |
| `timeout_ms`, `memory_max`, `pids_max` | `max` | These fields set no finite runtime, memory or process-count maximum; platform permissions and limits still apply |
| Recycle Bin coverage | `$Recycle.Bin` uses `access: host` | A compatibility exception retaining host behavior, not a Recycle Bin deny rule |

See [Configuration explained](configuration.md) for resource fields and configuration entry limits. These defaults are not instructions to weaken an existing stricter configuration.

## Data directories denied by default

Both configurations declare the same Windows sensitive-directory rules. The table groups them by purpose. Environment variables refer to the current Windows user or system locations, and rules cover the specified directory and descendants. Check non-default locations separately.

| Category | Listed directories or application data |
| --- | --- |
| Developer and cloud credentials | `.ssh`, `.aws`, `.gnupg`, `.kube` under `%USERPROFILE%`; `gcloud` and `GitHub CLI` under `%APPDATA%` |
| Browser data | Listed Chrome, Edge, Firefox, Brave, Opera, Vivaldi, QQ Browser, Sogou and 360 browser user-profile locations |
| Password managers | Bitwarden desktop, CLI and the listed Microsoft Store data location |
| Messaging and collaboration | Listed QQ / QQNT, WeChat 3 / 4, WeCom, DingTalk, Feishu / Lark, Teams, Slack and Signal local-data locations, including some Store locations |
| Mail data | Outlook local data, the default Outlook archive directory, and Thunderbird Profiles |
| Messaging files in default Documents | Listed `Tencent Files`, `WeChat Files`, `WXWork`, `WXWork Files` and `xwechat_files` under `Documents` |

For example, denying `%USERPROFILE%\.ssh` does not establish coverage for private keys saved at `D:\MyKeys`. Browser-profile rules are not universal filename rules for every file containing `cookie` in its name.

## Read-only, writable and compatibility scope

| Scope | Purpose in public configuration |
| --- | --- |
| FinSAFE installation, configuration and selected runtime-data directories | Read-only rules reduce opportunities for protected execution processes to modify protection components or configuration |
| `%APPDATA%\Microsoft`, `%LOCALAPPDATA%\Microsoft`, `%ProgramData%\Microsoft` | Read-only rules apply; check more specific explicitly denied locations by their own rules |
| DSH runtime data, default workspace and Node temporary directory | Writable compatibility rules support normal DSH operation |
| OpenCode cache, configuration, data, state, installation and default workspace | Writable compatibility rules support normal OpenCode operation |
| DSH plugin installation root and the stable parent of OpenCode's selected native version | Corresponding read-only compatibility rules apply |

Compatibility paths resolve from the actual installation and user environment. One computer's absolute paths are not fixed locations for all installations.

## Operations that can still succeed

- Creating, overwriting, moving or deleting files in permitted writable locations. Read-only and deny rules must cover the target; sandboxing does not provide version recovery.
- Reading data outside deny rules when actual Windows permissions permit access. Neither default configuration has a universal `.env` filename-deny entry.
- Reaching models, websites or other services through host networking. Defaults do not filter categories such as dangerous websites, file-sharing services or social networks.
- Sending permitted file content or sensitive text entered by the user to a model. File protection and PII outbound inspection are separate capabilities.
- Operations by users or ordinary applications outside the protected execution process. An integration-plugin status does not establish equivalent controls for the entire computer.

For important data, check file permissions, destinations and content-inspection conditions together. See [Network access, exfiltration and PII](network-pii.md).

## Configuration sources and verification

- [DSH bundled Candidate YAML](https://github.com/finogeeks/finsafe/blob/main/integrations/dsh/windows/policy/candidate.yaml)
- [OpenCode bundled Candidate YAML](https://github.com/finogeeks/finsafe/blob/main/integrations/opencode/windows/policy/candidate.yaml)
- [DSH operations](https://github.com/finogeeks/finsafe/blob/main/integrations/dsh/windows/OPERATIONS.md)
- [OpenCode plugin guide](https://github.com/finogeeks/finsafe/blob/main/integrations/opencode/windows/README.md)

The YAML explains public defaults; it is not an instruction to replace an active configuration. Test actual denied, read-only and writable locations with owned fixtures. Record versions and repeat checks after updates. Other Agents, personal-edition installations and enterprise configurations need their own verification.
