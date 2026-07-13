# Contributing to finogeeks/finsafe

**中文：** [CONTRIBUTING-zh.md](CONTRIBUTING-zh.md)

Thank you for helping improve FinSAFE. This repository is a **public release mirror**:
prebuilt CLI binaries, install scripts, examples, and end-user documentation. It does
**not** contain the FinSAFE engine source code.

## Where changes land

| What you want to change | Where it is authored | How to contribute |
|-------------------------|----------------------|-------------------|
| **Bug in `finsafe` behavior** | Private upstream monorepo | Open a **[GitHub Issue](https://github.com/finogeeks/finsafe/issues/new)** with the `bug` label and reproduction steps |
| **Documentation** (guides, install notes) | `docs/public-finsafe/` upstream | Open an **issue** describing the fix, or a **pull request here** as a suggestion (see below) |
| **Install scripts** (`install.sh`, `install.ps1`, …) | Upstream + release sync | Same as documentation — issue preferred |
| **Runtime / Rust code** | Not in this repo | **Issues only** — we cannot merge code PRs on this mirror |

On each public release, maintainers **rsync** `docs/public-finsafe/` from upstream onto this
repository's `main` branch. Edits merged **only** on `finogeeks/finsafe` without upstreaming
will be **overwritten** on the next sync.

## Preferred intake: issues

For bugs and doc fixes, **GitHub Issues** are the supported intake path:

1. Use the bug report template when possible (`Steps to reproduce`, `Expected`, `Actual`).
2. Include **FinSAFE version** (`finsafe --version`), **OS**, and **policy YAML** if relevant.
3. Trusted reporters with the `bug` label may receive automated triage; others are batched daily.

Runtime fixes are implemented in the private upstream repo, verified, released, and linked back
to your issue with a **Resolved** comment when a release ships.

## Pull requests on this repository

PRs are welcome as **suggestions**, especially for documentation under `docs/`, `examples/`,
`packaging/`, and `skills/`.

When you open a PR here:

1. A bot will comment explaining the mirror workflow.
2. **Do not expect a direct merge** on `finogeeks/finsafe`. Maintainers cherry-port substantive
   edits into upstream `docs/public-finsafe/` and close your PR with a link to the upstream
   change.
3. Doc-only PRs may be labeled `triage:docs-only`. Runtime or out-of-scope PRs will be closed
   with guidance to open an issue instead.

We preserve contributor credit in upstream commit messages when porting your work.

## What we do not accept on this repo

- Rust / engine changes (no source tree here)
- Changes to `.github/workflows/` from external contributors (maintainer-only)
- Security-sensitive reports in public issues — contact Finogeeks through your support channel

## Releases

Public [GitHub Releases](https://github.com/finogeeks/finsafe/releases) ship CLI archives and
synced documentation. Doc fixes appear on `main` after the **next** release (or a maintainer
docs-only sync).
