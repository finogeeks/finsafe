# FinSafe CLI (public releases)

**中文：** [README-zh.md](README-zh.md)

FinSafe is a host execution boundary toolkit: namespaces, cgroup limits, syscall filtering (Linux), path restrictions, and Seatbelt-backed profiles (macOS), with auditable outcomes. The **`finsafe`** command-line tool is the operator front door for **local wrapper** workflows (`run`, `self-confine`, `probe`, `doctor`, and related helpers).

This repository holds **public release binaries** and **end-user documentation** only. It does **not** contain FinSafe engine source code.

## Install a release

### One-liner (recommended)

Needs **`curl`**, **`tar`**, and **`zstd`** (or a `tar` with `--zstd`). Verifies **`SHA256SUMS`** unless you opt out.

```bash
curl -fsSL https://raw.githubusercontent.com/finogeeks/finsafe/main/install.sh | sh
```

Pin a version or install directory:

```bash
curl -fsSL https://raw.githubusercontent.com/finogeeks/finsafe/main/install.sh | env FINSAFE_VERSION=0.1.2 FINSAFE_INSTALL_DIR="$HOME/.local/bin" sh
curl -fsSL https://raw.githubusercontent.com/finogeeks/finsafe/main/install.sh | sh -s -- --version 0.1.2
```

See **`install.sh --help`** (after downloading the script) for all environment variables.

### Manual download

1. Open [**Releases**](https://github.com/finogeeks/finsafe/releases) and pick a version tag (for example `v0.1.2`).
2. Download the archive for your platform:
   - Linux x86_64: `finsafe-v<version>-x86_64-unknown-linux-gnu.tar.zst`
   - macOS Apple Silicon: `finsafe-v<version>-aarch64-apple-darwin.tar.zst`
   - macOS Intel: `finsafe-v<version>-x86_64-apple-darwin.tar.zst`
3. Download `SHA256SUMS` from the same release.
4. Verify and extract:

```bash
VERSION=0.1.2   # replace with the release you downloaded
shasum -a 256 -c SHA256SUMS
tar -xvf "finsafe-v${VERSION}-<target>.tar.zst"
# Binary path: finsafe-v<version>-<target>/finsafe
```

Optional: copy `finsafe` into a directory on your `PATH`.

5. Confirm:

```bash
./finsafe version
finsafe --help
```

### `release.json`

Each release may include **`release.json`**: a small manifest listing asset URLs and SHA-256 digests for automation. Use it if you script downloads instead of hard-coding filenames.

## Documentation

| Document | Description |
|----------|-------------|
| [docs/USER-GUIDE.md](docs/USER-GUIDE.md) | English operator guide (`run` vs `self-confine`, policy YAML overview, exit codes). |
| [docs/USER-GUIDE-zh.md](docs/USER-GUIDE-zh.md) | Chinese user guide. |
| [docs/POLICY-QUICKREF.md](docs/POLICY-QUICKREF.md) | Wrapper policy (`kind: local-wrapper`) field reference. |
| [examples/README.md](examples/README.md) | Index of policy examples (`high-level-policies/`, `wrapper-policies/`). |
| [examples/wrapper-policies/hermes-version-smoke.yaml](examples/wrapper-policies/hermes-version-smoke.yaml) | Minimal short-lived wrapper policy example. |

## Security

- Verify `SHA256SUMS` before extracting or executing downloaded binaries.
- Wrapper policies are **declarative**: you pass a YAML file with `--policy`; the CLI applies host-appropriate confinement. Review [POLICY-QUICKREF.md](docs/POLICY-QUICKREF.md) before deploying to production.

## License

Binaries and materials in this repository are published by **Finogeeks** under the license terms supplied with your distribution or subscription. If no separate license file is attached to a release, treat use as governed by your agreement with the publisher.
