---
name: finsafe-report-bug
description: >-
  Report FinSAFE or FinShield bugs in finogeeks/finsafe, collect reproduction
  evidence, check duplicates, and verify reported fixes. Use for product bug
  reports and product-bugs migration; not for unrelated products or runtime implementation.
---

# Report a FinSAFE / FinShield bug

Adapted from `finogeeks/product-bugs`'s `groundwork-report-bug` skill.
This repository is now the reporting destination for this product.
Follow [AGENTS.md](../../AGENTS.md) and the
[bug form](../../.github/ISSUE_TEMPLATE/bug_report.yml).
If installed separately, read those files from
`https://github.com/finogeeks/finsafe` before filing.

## Access and duplicates

Use the authenticated GitHub CLI with the destination specified explicitly:

```bash
gh auth status
gh issue list --repo finogeeks/finsafe --state all --limit 100
gh issue view <number> --repo finogeeks/finsafe --comments
```

Search or paginate further if necessary. Check existing plugin reports as well
as generic product reports. For a duplicate, prepare an evidence update to the
existing issue. Do not create another issue after an uncertain submission;
check whether the first request succeeded.

Run the list command before reporting an access failure. Report its exit code
and stderr with secrets removed. A browser session does not authenticate `gh`,
and an unauthenticated 404 is not evidence about a private source issue.
If access fails, retain the draft; never request a token in chat.

## Collect enough evidence

Identify the component, tested product or plugin version, OS, prerequisites,
steps, expected behavior, and actual behavior. Ask only for missing information.
Use existing logs and recordings first. Preserve original error text and explain
it in English. Keep observations separate from hypotheses; a root cause is not
required to report a failure.

If needed, prepare a small temporary read-only probe. Explain its question,
runtime, steps, expected signal, and cleanup. Keep raw captures outside tracked
files and inspect actual output before drawing conclusions. Do not change the
installed product, permissions, or security settings just to gather evidence.
State unavailable evidence and untested steps explicitly.

This tracker is public. Redact credentials, customer data, private source code,
and identifying machine/account details that are unnecessary for reproduction.
Route security-sensitive reports through the Finogeeks support channel.

## Prepare the report

Write the title, body, and comments in English. Use one verifiable failure per
issue and preserve the form headings: `finsafe version`, `Platform`, `Component`,
`Priority`, `Steps to reproduce`, `Expected behavior`, `Actual behavior`,
`Screenshots, recordings, or logs`, and `Local agent's preliminary cause analysis`.
Record unknown values explicitly. The last section is optional and distinguishes
evidence, suspected cause, and unverified parts.

For a legacy report, read its body and comments, including later corrections.
Check the latest applicable release and linked fixes. Migrate only a failure
confirmed on that release. An old OPEN state is insufficient. Preserve its
source URL, original tested version, current reproduction version/date, and
evidence limits. A private attachment link is not public evidence; include a
redacted text explanation. Do not present an untested old failure as current.

Choose a P0-P3 priority from the form, using the reporter's existing choice
when available. Show the complete draft and labels when review is needed.
A draft request alone does not authorize publication. If the user has already
asked to file or migrate the report, use that authorization without reconfirming.

## Publish and verify

Create with `bug`, `product:finsafe`, `triage:pending`, and exactly one of
`priority:p0`, `priority:p1`, `priority:p2`, or `priority:p3`.
Check the labels exist. Repository setup or migration authorization can cover
creating missing labels; otherwise retain the draft and report what is missing.
Web form priority choices do not automatically apply priority labels.

Pass the English body through a UTF-8 file, never interpolated shell text:

```bash
gh issue create --repo finogeeks/finsafe --title "<reviewed title>" \
  --body-file /path/to/report.md --label bug --label product:finsafe \
  --label triage:pending --label priority:p2
```

Use the chosen priority, then read the resulting issue and verify body and
labels. Return its actual URL. For an authorized migration, record the new URL
on the source report before closing that source as superseded. Keep a source
open if destination publication fails. Do not duplicate its development task.

Fixes remain in the upstream product repository. Record the repaired release,
environment, original reproduction steps, and acceptance result. Close only
after verification or explicit maintainer confirmation, and state that basis.
Merged code, a successful build, and a passing unit test do not establish
installed-product acceptance.
