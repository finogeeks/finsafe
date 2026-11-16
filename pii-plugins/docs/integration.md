# From local code to FinShield

~~~mermaid
flowchart LR
    A[Write callback] --> B[Run library tests]
    B --> C[Test EXE with developer host]
    C --> D[Test EXE with FinShield proxy]
    D --> E[Test selected application]
    E --> F[Ship vendor EXE]
~~~

The first three stages use only this kit. The SDK starts no service, and the
developer host needs no product installation. Use synthetic fixtures, including
UTF-8 text, no finding, detection, replacement and processing failure.

Product integration uses the same EXE through the four fields in README.md.
The private real-proxy harness checks current-text selection, original history,
allow_rewrite, action policy and actual upstream bytes. Local plugin success
does not prove those paths. Application acceptance then verifies the installed
configuration and intercepted traffic with the selected application.

The plugin receives text already selected by FinShield. It cannot return an
approval decision or alter destinations, request headers, history, roles or
binary attachments through its result. Finding and edit validation use the
same public protocol crate as the developer host.

Ship the release EXE and any vendor assets. FinShield starts it on demand with
--socket and owns its lifetime. Do not point FinShield at finshield-pii-dev and
do not run a plugin daemon yourself. The plugin runs as a trusted host extension
with the user's normal file and network permissions. It does not run inside
the protected application's AppContainer.

A vendor model must fit the documented production memory/process limits and
startup/call timeout. Developer-host settings do not change production limits.

The wire schema and tool-result examples are documented in [protocol v1](protocol.md).
The redactor sample now masks resident IDs; its constructor selects visible prefix/suffix lengths.

## After the debug walkthrough

Finish [the debug walkthrough](debugging.md) first ([中文](debugging-zh.md)).
Build the release EXE from the standalone kit directory:

```powershell
cargo build --release -p finsafe-pii-redactor --locked
```

A vendor plugin package contains three core files:

- `finsafe-pii-redactor.exe`
- [network-policy.example.yaml](../examples/redactor/network-policy.example.yaml)
- [apply_network_policy.py](../examples/redactor/apply_network_policy.py)

Ship the [English](../examples/redactor/README.md) and
[Chinese](../examples/redactor/README-zh.md) walkthroughs as well. They show the
entire replacement `network` mapping, including proxy mode, TLS inspection,
endpoints and the external plugin. To use built-in PII instead, replace the first entry with detector: pii. Keep the package in a stable folder and
run its script with Python and PyYAML:

```powershell
python -m pip install PyYAML
python .\apply_network_policy.py
```

Use a FinSAFE build containing external PII support. The script uses PyYAML to
read and replace candidate's complete network configuration, then calls the
existing `config materialize` command, which uses the same materialization API
as the desktop. It resolves the selected first EXE path to an absolute path and keeps other
candidate fields intact. Both existing files are copied to `.yaml.bak` before
writing; each run overwrites the previous backups.

The script is intentionally straightforward Python. Errors propagate directly;
there is no retry, rollback, automatic authorization or new product API.
If materialization fails, candidate has been updated but effective remains
unchanged. Fix the cause or restore backups before rerunning.

After a successful apply, the script calls the existing
`finsafe app tls-inspector --refresh --yaml <effective.yaml>`. Refresh
updates running content settings without new authorization. If no inspector is
running, the next protected application launch loads the new configuration.
Already processing requests keep their existing settings. A refresh failure is
reported as saved configuration awaiting activation, rather than success.

The personal installer includes the plugin host. The vendor EXE/YAML/script are
separate. The script does not authorize or install product components. The
network template matches personal defaults; adapt any narrower endpoint scope
before applying. Changes to TLS inspection, endpoint scope, filesystem boundaries or identity
may require the normal FinSAFE authorization workflow; the script does not
handle that workflow.
PII-only changes preserve the Windows permission authorization digest.

Test synthetic user and tool-result text in the protected application and
inspect the actual forwarded payload. `11010119900101123X` should become
`110XXX123X` with `on_finding: warning` and `allow_rewrite: true`. A blocking
policy still blocks a finding. The plugin remains outside AppContainer.
Standalone success does not establish installed-client acceptance.

## One selected plugin

Only the first item in plugins is selected. Later items do not run, including
when the first detector is clean or fails. Both detector: pii and external
use the same decode/process/encode pipeline. A gzip request is decoded before
checking and recompressed as gzip before forwarding, with updated body framing.
This applies to built-in checks without edits too. Compression errors return
an HTTP error, without forwarding an unmodified fallback. SDK/IPC is unchanged.
