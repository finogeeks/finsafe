# Agent instructions for finogeeks/finsafe

> This file, the homepages and product documents are generated from the private upstream `docs/public/` source. Change that source; contributors without upstream access can file a public issue or suggestion PR for maintainers to port. Templates and skills keep their existing ownership.

This is the public FinSAFE / FinShield release and documentation repository.
Report product bugs in **finogeeks/finsafe**. Runtime source and fixes belong
in the private upstream repository; see [CONTRIBUTING.md](CONTRIBUTING.md).

## Report and verify bugs

Read [finsafe-report-bug](https://github.com/finogeeks/finsafe/blob/main/skills/finsafe-report-bug/SKILL.md) when reporting a
bug, collecting evidence, checking a duplicate, or verifying a reported fix.
Use the [bug form](https://github.com/finogeeks/finsafe/blob/main/.github/ISSUE_TEMPLATE/bug_report.yml).

- Chat can use Chinese. Write issue titles, descriptions, and comments in English.
  Preserve exact error messages in their original language.
- Use authenticated `gh` commands with `--repo finogeeks/finsafe`. Search open
  and closed issues before creating a report. An unauthenticated 404 does not
  prove that a private source issue is missing.
- Keep observations, suspected causes, merged fixes, and installed-version
  verification separate. A merged PR alone does not prove a reported bug is fixed.
- For legacy product-bugs reports, migrate only FinSAFE / FinShield failures
  confirmed on the latest applicable release. Preserve tested versions, evidence,
  corrections, and source links. Do not migrate unrelated products.
- Close a report after verified resolution or explicit maintainer confirmation.
  Record which basis applies; do not describe maintainer confirmation as a fresh test.
- Before publishing, check for credentials, customer data, private source excerpts,
  and security-sensitive details. Use the support channel for sensitive reports,
  as required by CONTRIBUTING.md. Do not copy a private issue wholesale to public intake.
- A draft request does not authorize publication. Reuse explicit authorization
  already given to file or migrate issues; do not ask again for the same action.

## Repository changes

Read files before editing and inspect command results before claiming success.
Validate changed YAML, local links, skill metadata, and whitespace. Release
publication owns `docs/` and selected integration/developer-kit subtrees.
Homepages, these agent instructions, contribution guides and product documents
are generated from the private upstream docs/public source and its publication
manifest. Do not independently edit generated copies here; propose the source
change upstream, or open a public issue/suggestion for maintainers to port.
Issue templates and skills retain their existing ownership and automation. Keep existing issue triage
labels and automation intact.
