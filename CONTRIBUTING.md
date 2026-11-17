# Contributing to finogeeks/finsafe

> This file, the homepages and product documents are generated from the private upstream `docs/public/` source. Change that source; contributors without upstream access can file a public issue or suggestion PR for maintainers to port. Templates and skills keep their existing ownership.

**中文：** [CONTRIBUTING-zh.md](CONTRIBUTING-zh.md)

Thank you for helping improve FinSAFE. This repository is a **public release mirror**:
prebuilt CLI binaries, install scripts, examples, and end-user documentation. It does
**not** contain the FinSAFE engine source code.

## Where changes land

| What you want to change | Where it is authored | How to contribute |
|-------------------------|----------------------|-------------------|
| **Bug in `finsafe` behavior** | Private upstream monorepo | Open a **[GitHub Issue](https://github.com/finogeeks/finsafe/issues/new)** with the `bug` label and reproduction steps |
| **Published product documentation** (`docs/`) | `docs/public/docs/` upstream | Open an **issue** describing the fix, or a **pull request here** as a suggestion (see below) |
| **Issue templates and skills** | This repository | Open a **pull request here** |
| **Install scripts** (`install.sh`, `install.ps1`, …) | Upstream + release sync | Same as documentation — issue preferred |
| **Runtime / Rust code** | Not in this repo | **Issues only** — we cannot merge code PRs on this mirror |

Releases publish the approved product documents from upstream into `docs/`,
and separately publish selected integration and developer-kit files. Product
documentation fixes must reach the upstream source to survive publication.
Homepages, contribution guides and AGENTS.md are also maintained in upstream
`docs/public/` and automatically published. Issue templates and skills keep their
existing ownership. The private source PR is the authoring change; no second
manually edited public copy is required.

## Preferred intake: issues

FinSAFE / FinShield reports previously filed in `finogeeks/product-bugs` now
belong here. Only migrate failures confirmed on the latest applicable release;
link the source report and preserve evidence and later corrections.

To report with an agent, open this repository and say:

```text
Read AGENTS.md and skills/finsafe-report-bug/SKILL.md.
I am testing FinSAFE / FinShield and want to report a bug.
Version: <product and plugin versions>
What happened: <describe the problem>
Help me collect evidence and prepare an English issue here.
```

You can discuss the report in Chinese. The agent collects missing details and
checks duplicates before preparing an English issue. A request to prepare a
draft does not publish it; say `Publish this issue` when ready. An explicit
request to file or migrate a report already authorizes that action.

For bugs and doc fixes, **GitHub Issues** are the supported intake path:

1. Use the bug report template when possible (`Steps to reproduce`, `Expected`, `Actual`).
2. Include **FinSAFE version** (`finsafe --version`), **OS**, and **policy YAML** if relevant.
3. Agent-created reports use `bug`, `product:finsafe`, `triage:pending`, and one
   `priority:p0`–`priority:p3` label. The form applies the first three; a priority
   choice alone does not apply a priority label. Trusted reporters may receive
   automated triage; others are batched daily.

Runtime fixes are implemented in the private upstream repo, verified, released, and linked back
to your issue with a **Resolved** comment when a release ships.

## Pull requests on this repository

PRs are welcome as **suggestions**, especially for documentation under `docs/`, `examples/`,
`packaging/`, and `skills/`.

When you open a PR here:

1. A bot will comment explaining the mirror workflow.
2. Changes to published product documents or release-managed files must be ported
   to their upstream source. Templates and skills retain their established review path. Generated homepages,
   contribution instructions and product pages must be changed upstream; a public
   suggestion is ported there before automatic publication.
3. Doc-only PRs may be labeled `triage:docs-only`. Runtime or out-of-scope PRs will be closed
   with guidance to open an issue instead.

We preserve contributor credit in upstream commit messages when porting your work.

## What we do not accept on this repo

- Rust / engine changes (no source tree here)
- Changes to `.github/workflows/` from external contributors (maintainer-only)
- Security-sensitive reports in public issues — contact Finogeeks through your support channel

## Releases

Public [GitHub Releases](https://github.com/finogeeks/finsafe/releases) ship CLI archives and
synced documentation. Document fixes are published automatically after relevant upstream changes merge into `main`; maintainers can also rerun documentation publication.
