# Contributing to finogeeks/finsafe

> Website, user documentation, homepages and repository guides are maintained directly in this public repository. Review and merge documentation PRs here; no private-source port or product release is required.

**中文：** [CONTRIBUTING-zh.md](CONTRIBUTING-zh.md)

Thank you for helping improve FinSAFE. This repository hosts **public releases, user documentation and the documentation website**:
prebuilt CLI binaries, install scripts, examples, and end-user documentation. It does
**not** contain the FinSAFE engine source code.

## Where changes land

| What you want to change | Where it is authored | How to contribute |
|-------------------------|----------------------|-------------------|
| **Bug in `finsafe` behavior** | Private upstream monorepo | Open a **[GitHub Issue](https://github.com/finogeeks/finsafe/issues/new)** with the `bug` label and reproduction steps |
| **Published product documentation** (`docs/`) | This repository (`docs/`, including `docs/site/`) | Open a **pull request here** |
| **Issue templates and skills** | This repository | Open a **pull request here** |
| **Install scripts** (such as `install.sh`) | Upstream + release sync | Report an issue or propose a change for maintainers to apply upstream |
| **Runtime / Rust code** | Not in this repo | **Issues only** — we cannot merge code PRs on this mirror |

Website source, user guides, plugin usage documentation, homepages,
contribution guides and Agent instructions are maintained here. Private releases
update code and required delivery assets, including version-matched license
notices; they do not replace public Markdown or HTML guides. Private engineering
documents are maintained separately. See [website maintenance](docs/site/README.md).

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

For behavior defects, **GitHub Issues** are the supported intake path. Documentation fixes can use direct pull requests:

1. Use the bug report template when possible (`Steps to reproduce`, `Expected`, `Actual`).
2. Include **FinSAFE version** (`finsafe --version`), **OS**, and **policy YAML** if relevant.
3. Agent-created reports use `bug`, `product:finsafe`, `triage:pending`, and one
   `priority:p0`–`priority:p3` label. The form applies the first three; a priority
   choice alone does not apply a priority label. Trusted reporters may receive
   automated triage; others are batched daily.

Runtime fixes are implemented in the private upstream repo, verified, released, and linked back
to your issue with a **Resolved** comment when a release ships.

## Pull requests on this repository

Documentation and website PRs are welcome and can be merged directly here.

1. Edit the relevant public sources and update both languages when needed.
2. Run the checks in [website maintenance](docs/site/README.md). The public Pages
   workflow builds PRs and deploys successful `main` builds.
3. Maintainers review and merge documentation, homepages and usage guides here.
   Documentation-only PRs may be labeled `triage:docs-only`.
4. Runtime code, install scripts and versioned delivery files need the owning
   upstream change. Workflow changes require maintainer review.

## What we do not accept on this repo

- Rust / engine changes (no source tree here)
- Changes to `.github/workflows/` from external contributors (maintainer-only)
- Security-sensitive reports in public issues — contact Finogeeks through your support channel

## Releases

Public [GitHub Releases](https://github.com/finogeeks/finsafe/releases) ship
versioned product artifacts. Website and documentation changes deploy from this
repository without waiting for a product release or a private-repository sync.
