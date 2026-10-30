# Windows Core PII actions

Status: unreleased. This guide describes the Windows Core action extension.
Live WorkBuddy dialog, refusal display, and retry acceptance must be recorded
before claiming that client workflow is verified.

Windows Core checks the current user message or the current matched tool-call
and tool-result block on the supported inspected proxy path. It uses the
selected built-in Tier-1 categories. It does not scan repeated history as a
fallback, rewrite content, or inspect opaque child HTTPS traffic.

## Select a finding action

| `on_finding` | Behavior after a completed check finds sensitive information |
|---|---|
| `warning` | Record a warning and send the original request. This is the default. |
| `block` | Refuse the request before submitting it to the model service. |
| `approval_required` | Hold this request and display a Windows confirmation dialog. Send it only after explicit approval. |

PII inspection is best effort in all three modes. If the request is too large,
cannot be decoded or extracted, or the detector fails, the original request
can still be sent. The incomplete check is logged without its content.
Independent network and content denials still apply. There is no
`llm_content.on_uninspectable` setting in Windows Core.

## Example

The following network section selects approval for payment-card and Mainland
China identity-card findings. Use the destinations and category list required
by your application; these two categories are only an example.

```yaml
policy:
  network:
    mode: proxy
    tls_terminate: true
    endpoints: [api.example.com]
    llm_content:
      plugins:
        - id: pii
          detector: pii
          on_finding: approval_required
          categories:
            - global.payment_card
            - cn.resident_id
      retention: true
      max_body_bytes: 16777216
```

An empty category list disables findings. `max_body_bytes` is the decoded PII
inspection limit, with a default of 16 MiB. It is not a new hard request-size
limit. Retention is independent of detection and approval; enabling a finding
action does not require raw-content retention.

## Confirm one request

The Chinese dialog shows the application, destination, and detected categories.
It does not display matched values, the original message, or request IDs.

- Choose **仅发送这一次** (send once) to allow this one original request.
- Choose **取消发送** (cancel sending), close the window, or press Escape to
  refuse it. Cancel is the default keyboard choice.
- A timeout, cancelled request, unavailable dialog, or full approval capacity
  also prevents that known finding from being sent.

The dialog affects only its request. Other requests can continue when normal
client and proxy resources are available. Approval does not authorize a host,
session, later request, or retry. A retry that produces a finding needs a new
decision. A cancelled request cannot be revived by clicking an old dialog.

The confirmation window is an ordinary Windows desktop dialog. It does not
require administrator approval and is not a Windows secure-desktop prompt.

## When a request is refused

The proxy returns HTTP 403 with an English explanation. A blocked finding uses:

> Sensitive information detected. This request was blocked.

The model service receives no request from this refusal. The client may display
the explanation or wrap it as a request error. Its retry and conversation
recovery behavior depend on that client. A native approval dialog does not
guarantee how WorkBuddy will present an HTTP error.

## Records and limits

Operational records distinguish warnings, blocked findings, incomplete checks,
pending approval, and final approval outcomes. They contain reason codes and
category summaries, not matched values. When retention is enabled, protected
exchange records also receive decision events. Logging and retention are
bounded and best effort; storage failure does not grant approval.

The selected rules cover only detectable values in supported current-input
formats. Blocking mode does not guarantee that every sensitive value or every
request will be inspected. This Windows Core feature is separate from the
Linux/macOS [Privacy Guard](privacy-guard.md).
