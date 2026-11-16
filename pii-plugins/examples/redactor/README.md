# Resident-ID masking plugin for FinSAFE

[中文接入步骤](README-zh.md)

This example masks `11010119900101123X` as `110XXX123X`: first 3, last 4,
and XXX in between. It uses a simple 18-character format regex, without date
or checksum validation. Use synthetic data.

The personal FinSAFE installer includes the plugin host, without this sample
EXE, SDK or development workbench. Use a build with external PII processor
support. The vendor plugin package is installed separately.

## Build and distribute

From the standalone `pii-plugins/` source directory:

```powershell
cargo build --release -p finsafe-pii-redactor --locked
```

The package has three core files: `finsafe-pii-redactor.exe`,
`network-policy.example.yaml` and `apply_network_policy.py`. Include this
README and `README-zh.md` as instructions. Keep the package together in a
stable host folder. FinSAFE starts the EXE and supplies IPC.

## Apply the plugin configuration

Use a FinSAFE build with external PII support. Run from the plugin folder:

```powershell
python -m pip install PyYAML
python .\apply_network_policy.py
```

The script resolves the template EXE paths, so no manual absolute-path edit is
needed. For a selected installation or development binary, pass `--finsafe`
and `--config-dir` explicitly. It requires installed FinSAFE, Python and PyYAML. The script is ordinary Python
so developers can edit the paths and replacement logic directly.

## Replace the complete network configuration

The default active configuration directory is `C:\ProgramData\FinSAFE\config`.
Use the selected installation's directory if different. Back up its
`candidate.yaml` and `effective.yaml` before editing.

The script replaces `policy.network` in `candidate.yaml` with the complete
mapping from `network-policy.example.yaml`, shown below. `network:` belongs
under the existing `policy:` key, with two extra spaces of indentation. Other
policy fields and the rest of the document are retained.

```yaml
network:
  mode: proxy
  tls_terminate: true
  endpoints: ["*.*"]
  llm_content:
    retention: true
    max_body_bytes: 16777216
    plugins:
      - id: resident-id-mask
        detector: external
        on_finding: warning
        executable: finsafe-pii-redactor.exe
        timeout_ms: 2000
        allow_rewrite: true
```

`mode: proxy` routes requests through FinSAFE's proxy; `tls_terminate: true`
enables inspection of HTTPS model traffic. `endpoints` declares allowed
destinations; `"*.*"` is the personal edition's default. Keep a narrower existing
endpoint list if that is your policy. The template keeps retention and the
16 MiB body limit and selects this external processor.

Only the first item in `plugins` is selected. If a second item is present,
it is ignored, even if the first detector finds nothing or fails. No worker or
EXE is started for later entries. To use built-in detection instead, replace
the first item with:

```yaml
plugins:
  - id: builtin-pii
    detector: pii
    on_finding: warning
    categories: [global.email, cn.resident_id]
```

The selected item has one `id`, a `detector` selector and `on_finding`.
`pii` uses `categories`; `external` uses `executable`, `timeout_ms` and
`allow_rewrite`. The script resolves only the selected relative EXE path
against this package folder and preserves absolute paths.

Both built-in and external detectors use the same transport: decode, process,
apply any valid edits to their original text fields, and encode before sending.
An original gzip request is recompressed as gzip, including when there are no
edits. Encoding errors return an HTTP error rather than discarding the edit.
On a finding, `warning` permits forwarding; `approval_required` waits for the
existing approval UI; `block` or rejected approval stops the request.

## What the script applies

The Python script reads the template with PyYAML and replaces only
`candidate.policy.network`. It copies candidate/effective to `.yaml.bak`
(overwriting the previous backup), writes candidate, calls the existing
`config materialize --on-conflict replace` to generate effective, then calls
`app tls-inspector --refresh`.

Errors are raised directly and stop execution. There is no automatic retry,
rollback, permission change or new FinSAFE configuration API. If materialization
fails after candidate was saved, effective retains its previous contents;
fix the cause and rerun, or restore the `.bak` files before retrying.

The template uses personal network defaults. Keep any narrower endpoint list
or custom content settings. PII-only changes preserve the Windows permission
authorization digest when network permissions are unchanged. Enabling TLS
inspection or widening endpoint scope can require authorization through
FinSAFE's normal workflow; this script does not handle authorization.

Editing `candidate.yaml` alone does not update the running inspector.
Materialization writes `effective.yaml`; refresh applies its content settings
to an existing inspector. If the inspector is not running, refresh reports
that state without starting it. The next protected application launch loads
the new configuration. Requests already processing retain their configuration.

## Verify in a protected application

Send `My ID is 11010119900101123X.` from an application protected by FinSAFE.
Verify the delivered model request contains `My ID is 110XXX123X.`. Also test
ordinary text and tool-returned text. The user's editor can still display the
original message: verify the actual intercepted/forwarded payload.

To disable this processor, remove its entry from `plugins`, then materialize
and refresh again. The new first entry becomes selected if any entries remain.

For developers, the full standalone kit includes protocol, SDK, local HTML
workbench and fixtures. See its `docs/integration.md` for the full workflow.
