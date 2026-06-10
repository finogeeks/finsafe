# Windows remote Authority managed E2E (pilot / GA gate)

**中文:** [windows-remote-authority-e2e-zh.md](./windows-remote-authority-e2e-zh.md)

Proves **Policy Authority on Linux/macOS** → **Windows `finsafe-agent` enroll + bundle pull** → **managed `finsafe run`**. Authority does **not** run on Windows.

This is distinct from the CI **agent-pipe** job in `windows-acceptance` (local bootstrap + named pipe only, no real Authority). It matches the manual gate in [product-one-pager.md](../product-one-pager.md).

## Quick start

**Authority host:**

```bash
export FINSAFE_LICENSE_SIGNING_KEY=/path/to/.signing_key.bin
# export FINSAFE_AUTHORITY_PUBLIC_URL=http://192.168.1.10:8095  # if LAN IP inference fails

./scripts/tests/managed-mode/e2e-linux-authority-for-windows-fleet.sh prepare --no-wait
# Copy /tmp/finsafe-win-remote-e2e/handoff.json to the Windows VM
```

**Windows pilot:**

```powershell
pwsh -File e2e-windows-remote-authority-fleet.ps1 `
  -HandoffPath C:\finsafe-e2e\handoff.json `
  -BinDir 'C:\Program Files\FinSAFE'
```

**Teardown:**

```bash
./scripts/tests/managed-mode/e2e-linux-authority-for-windows-fleet.sh stop
```

See the Chinese doc for architecture diagram, prerequisites, assertions, and troubleshooting.
