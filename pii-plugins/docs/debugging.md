# Test and debug a plugin with the local page

[中文逐步操作](debugging-zh.md) · [Next: integrate with FinSAFE](integration.md)

Run these commands from the standalone `pii-plugins/` directory. You need Windows
x64, stable Rust and the MSVC build tools. Use any editor to change the code.

The workflow is: edit code, build the EXE, test text in the local HTML page,
compare the result, then edit and rebuild. The kit supplies the protocol, SDK,
developer host, examples and fixtures in this one directory. No private
FinSAFE source or running product is needed. The directory has not yet been
uploaded to a public repository or published as an SDK package.

## Build and open the page

Double-click **start-workbench.cmd**, or run `./start-workbench.cmd` from the
kit directory. It builds, starts the host, checks HTTP readiness and opens the
default browser. Keep its console open. The first build can take a few minutes.
The launcher uses built-in Windows PowerShell; it needs neither private code
nor Python nor PowerShell 7. Failures stay visible in the launch window.

Open the page on the same computer where the script runs. Use the URL opened
or printed by that run; a previous chat's port is not a permanent service URL.
On normal exit, the launcher clears its own runtime record so an ended session
does not leave a dead port advertised as current. Confirm the page in a browser
and click **Send to plugin** to check the visible masked result; HTTP readiness
alone does not establish that browser interaction worked.

The local HTTP host accepts up to 64 KiB of request headers. Browsers share
loopback cookies across ports: an existing Chrome profile sent about 16.9 KiB,
which triggered the previous 8 KiB limit and returned HTTP 400 with
`{"error":"header limit"}`. That limit is fixed; clearing browser cookies is
not required. Larger requests receive HTTP 431 with an explicit size limit.
The terminal logs header sizes only, never cookie values or header contents.

On 2026-11-15, an exported copy in a path with spaces was launched from an
unrelated directory. Default-example, explicit-project and existing-EXE modes
all served HTML, returned masked text and cleaned up their owned processes.

Equivalent manual commands are:

```powershell
cargo build --workspace --locked
cargo run -p finshield-pii-dev -- ui --project .\examples\redactor --timeout-ms 12000
```

Open the loopback URL printed by the tool. The tool serves the HTML page and
starts the plugin EXE. Enter this synthetic message:

```text
My ID is 11010119900101123X.
```

Click **Send to plugin**. The processed preview must show:

```text
My ID is 110XXX123X.
```

The findings and edits panel shows the real plugin response. Try two IDs in
one message, a message with no ID, and Chinese text around an ID. The example
only checks the 18-character format; it does not validate dates or checksums.

## Edit, compile and try again

1. Edit `examples/redactor/src/lib.rs` to change detection or masking logic.
2. To change visible characters, edit `Redactor::new(3, 4)` in
   `examples/redactor/src/main.rs`. Use `new(0, 4)` to retain only the last four.
3. Click **Rebuild and restart**. The host stops the old EXE before Cargo runs,
   builds the project, starts the new EXE, and displays its new PID.
4. Click **Send to plugin** again with the same message. With `new(0, 4)`,
   the preview must be `My ID is XXX123X.`.
5. Restore `new(3, 4)`, rebuild and resend to return to the default example.

The page keeps your input but does not send it again automatically. Windows
can lock a running EXE, so use the page's rebuild action while the host owns it.
Compilation output remains in the tool terminal. IPC or processing errors
appear on the page. Fix the cause and rebuild to start a fresh plugin.
The call timeout is controlled by `--timeout-ms`; a timed-out call ends its
session. Close the host terminal to stop the owned plugin process tree.

**Stop plugin** ends the current plugin while keeping the page open. Use
**Rebuild and restart** to start it again.

## Existing EXE or another Cargo project

```powershell
cargo run -p finshield-pii-dev -- ui --exe C:\Plugins\my-plugin.exe --timeout-ms 12000
cargo run -p finshield-pii-dev -- ui --project C:\Projects\my-plugin --timeout-ms 12000
```

For an existing EXE, restart relaunches that binary; compilation is done by its
author. Project mode invokes Cargo and finds the actual EXE from its artifact
metadata. Use `--bin NAME` if the project has several binary targets.

A one-shot test is also available:

```powershell
cargo run -p finshield-pii-dev -- run --project .\examples\redactor --text "My ID is 11010119900101123X." --timeout-ms 12000
```

## Complete the local loop

- The initial input produces the expected finding and masked preview.
- Changing the code, rebuilding, and resending changes the actual EXE result.
- Ordinary text stays unchanged; multiple IDs are all processed.
- Stop, restart and closing the host clean up the owned EXE.

```powershell
cargo test -p finsafe-pii-redactor --lib --locked
python scripts/verify.py --dry-run
python scripts/verify.py
python scripts/verify.py --export
```

The independent verifier covers real EXEs, CLI and page requests, rebuild and
process cleanup. Export mode copies only this kit outside the private checkout
and builds/tests the copy. After this loop passes, use the
[FinSAFE integration steps](integration.md). User/tool payloads and the page's
testing scope are explained in [protocol v1](protocol.md).

## Verified local loop

On 2026-11-15, the actual page host was used to change the example constructor
from `(3, 4)` to `(0, 4)`, rebuild, and resend the same input. Its output changed
from `110XXX123X` to `XXX123X`. Restoring `(3, 4)` and rebuilding restored the
original result. Each rebuild started a fresh process; Stop and restart also
worked. The source was restored after this check.

The workspace's 10 unit tests, strict clippy, CLI/HTML checks and an independently
exported-copy build/test all passed. Installed FinSAFE acceptance is separate.
HTTP regression checks include HTML, status and actual masking calls with
32 KiB of synthetic cookie headers, plus a readable 431 response above 64 KiB.
The same Windows Chrome profile that reproduced `header limit` was retested
with its existing 16.9 KiB headers: page load, Chinese/multiple-ID masking,
unchanged ordinary text, the edit/rebuild/send loop, Stop and restart all passed.
