# FinShield PII plugin developer kit

[中文](README-zh.md)

**License:** FinShield Personal Edition is free to use under its product terms.
Commercial use of plugins developed with this kit requires prior written
permission from Finogeeks. Free personal-edition use does not grant a plugin
commercial license. See [LICENSE](LICENSE); contact
[contact@finogeeks.com](mailto:contact@finogeeks.com).

Copy this directory anywhere. It is an independent Rust workspace. It needs
Windows x64, stable Rust with the MSVC build tools, and registry access for the
dependencies in Cargo.lock. The optional verification script needs Python 3.11+
and PyYAML.
No private FinShield source, installation, DSH, or WorkBuddy is needed.

The plugin is an ordinary Windows EXE. You implement a callback that receives
selected text and returns findings and optional replacement text. The SDK owns
the local IPC details. FinShield owns request selection, policy and forwarding.

## Build and try

Double-click **start-workbench.cmd** in this directory, or run:

~~~powershell
.\start-workbench.cmd
~~~

It builds the standalone host and default resident-ID example, starts the
local server, checks that the page responds, then opens your default browser.
Keep the console window open while testing. The first build can take a few
minutes. Rust/MSVC are required; FinSAFE, Python, and PowerShell 7 are not
required for this launcher. It uses Windows' built-in PowerShell.

To select your own project or an existing EXE:

~~~powershell
.\start-workbench.cmd -Project 'C:\Projects\my-plugin'
.\start-workbench.cmd -Executable 'C:\Plugins\my-plugin.exe'
~~~

For manual build/test commands:

~~~powershell
cargo build --workspace --locked
cargo test --workspace --all-targets --locked

.\target\debug\finshield-pii-dev.exe run --project .\examples\employee --text "Employee ACME-1234"
.\target\debug\finshield-pii-dev.exe ui --project .\examples\redactor
~~~

Open the loopback URL printed by the tool. Enter synthetic text and click Send.
The redactor finds 18-character resident IDs and masks the middle: 11010119900101123X becomes 110XXX123X. Use synthetic test numbers.
The page shows only your plugin's output. It does not apply product policy.

Use --exe C:\path\vendor.exe for an existing binary. Project mode builds the
selected Cargo project and uses Cargo artifact metadata to locate its EXE.
Use --bin NAME if the project contains more than one binary.

~~~text
pii-plugins/
  protocol/           Public types, framing and validation
  sdk/                Callback API and Windows pipe client
  devtool/            Standalone CLI and browser test host
  start-workbench.cmd  Double-click to build, start and open the local page
  examples/employee/  Detection-only Cargo project
  examples/redactor/  Resident-ID detection and masking Cargo project
  fixtures/           Synthetic input and expected output
  scripts/verify.py   Independent build, lint, export and native smoke checks
~~~

The page input is the text a user would send. The tool wraps it in the plugin
request, calls the EXE, and displays the result. For user/tool payload examples,
source mapping and current-input boundaries, see [protocol v1](docs/protocol.md).

The redactor uses a simple [1-9][0-9]{16}[0-9Xx] regex with ASCII token boundaries.
It does not verify checksums or calendar dates and does not support 15-digit IDs.
Redactor::new(3, 4) keeps the first 3 and last 4 characters around XXX; use
new(0, 4) to keep only the suffix, or new(6, 4) to retain a longer prefix.
The example main constructs the redactor once before serve.

## Write a plugin

Copy one example and update its SDK path to the kit's sdk directory. For a
project next to pii-plugins, use:

~~~toml
[dependencies]
finsafe-pii-plugin-sdk = { path = "../pii-plugins/sdk" }
~~~

Put your processor in src/lib.rs and keep src/main.rs small:

~~~rust
fn main() -> std::io::Result<()> {
    finsafe_pii_plugin_sdk::serve(my_plugin::process)
}
~~~

The example library shows the complete callback. Load your model once before
serve, then capture it in the callback. Return Output::default() for successful
checking with no findings or edits. Return Err(()) for failed checking. A panic
ends the plugin; it is not a successful empty result.

A Finding identifies a supplied segment, a bounded ASCII category code,
UTF-8 byte offsets [start, end), and confidence from 0 to 1. For example,
acme.employee_id describes a vendor finding; operators do not register it.
An Edit identifies a segment and contains the full replacement text for that
segment. No edit means keep its text. Do not return conversation history,
headers, destination changes or arbitrary request JSON.

The public protocol version is 1. It is separate from the kit release version.
Transport is a local named pipe with bounded length-prefixed JSON frames.
The SDK receives --socket from the host; authors do not construct pipe names.

## Test and debug in the local HTML page

~~~powershell
.\target\debug\finshield-pii-dev.exe ui --project .\examples\redactor --timeout-ms 12000
~~~

Write code in your editor, build the EXE, enter test text on the page, and
inspect the real findings and rewritten preview. No editor integration or
debugger attachment is part of this workflow. See the [step-by-step guide](docs/debugging.md)
or [中文操作](docs/debugging-zh.md).

Rebuild and restart stops the owned EXE before Cargo runs, starts a new process,
and displays its new PID. Send the same text again to compare results. Requests
are not replayed automatically. Close the tool terminal to exit; the Job closes
and stops the owned plugin process tree.

## Integrate the same EXE

Distribute three core files: the plugin EXE, a complete network YAML template,
and an application script. The redactor provides
[network-policy.example.yaml](examples/redactor/network-policy.example.yaml),
[apply_network_policy.py](examples/redactor/apply_network_policy.py), and
[deployment instructions with the full network mapping](examples/redactor/README.md).

Put the three files together in a stable folder and run the Python script
with Python and PyYAML. It resolves the sibling EXE's absolute path, backs up
candidate/effective, replaces candidate's network, calls the existing FinSAFE
materializer, then calls inspector refresh. Errors stop execution for the
developer to resolve. It does not patch effective manually, retry, roll back or
authorize. The template includes proxy mode, TLS inspection, allowed endpoints,
content limits/retention and the selected external processor.

Only the first item in `plugins` is selected. Later items are ignored and do
not start workers or EXEs. Select `detector: pii` for built-in categories or
`detector: external` for an EXE; both use the first item's `on_finding`.
External entries also specify `executable`, `timeout_ms` and `allow_rewrite`.
Timeout defaults to 2000 ms (100–12000 including startup/IPC); rewrite defaults
to false. The script resolves the selected EXE path to an absolute path.

Both implementations share one transport pipeline: decode the request, run
the selected detector, apply any valid replacement to its source text fields,
and restore the original Content-Encoding before forwarding. A gzip request
is recompressed as gzip, including when the built-in detector makes no edits.
Encoding errors return an HTTP error rather than silently discarding edits.
Warning permits forwarding; approval waits for the existing UI; block or
rejected approval stops forwarding. No second plugin is called.

FinShield starts and owns each EXE outside AppContainer. Each external process
has the existing one-process/768 MiB limit and bounded calls/queue. SDK and IPC
are unchanged. Unconfigured external plugins create no host EXE or pipe;
built-in-only configuration keeps its existing behavior and request bytes.
Complex Messages source mappings remain unsupported. See [integration](docs/integration.md) for the deployment flow.

## Verify the delivery boundary

Install PyYAML for the Python interpreter that runs verification. It reads the
packaged network YAML sample.

~~~powershell
python -m pip install PyYAML
python scripts/verify.py --dry-run
python scripts/verify.py
python scripts/verify.py --export
~~~

Export mode copies only this directory to a temporary directory outside the
checkout, then builds and tests that copy. It checks local dependency and
include paths, both EXEs, CLI/project mode and page requests,
stop/rebuild/restart and cleanup. Registry downloads are permitted.

This proves the developer kit. Real product proxy tests and installed-client
acceptance are separate. No public repository upload or registry publication
is performed. [LICENSE](LICENSE) permits noncommercial development, testing and
use; commercial use requires separate written permission from Finogeeks.

Stable product releases mirror this entire tracked directory into the public
repository. The published `release.json` records the matching FinShield product
version and source revision; the wire protocol version remains separate.
