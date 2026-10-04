# Privacy guard: setup, test, and run

**中文：** [privacy-guard-zh.md](./privacy-guard-zh.md)

The privacy guard inspects supported outbound requests before they reach a remote model. It runs locally in FinSAFE's egress proxy; it does not send content to a cloud DLP service. Detection is not perfect and only applies when the agent's outbound traffic is actually mediated and inspectable by FinSAFE.

## 1. Install and check prerequisites

Install FinSAFE from [GitHub Releases](https://github.com/finogeeks/finsafe/releases), verify `SHA256SUMS`, and install the agent separately. Check that your CLI includes the protected-agent commands:

```sh
finsafe version
finsafe --help
```

The CLI must list `hermes`, `codex`, `pi`, or `finclaw`. If the command is unknown, update FinSAFE to a release that includes the privacy-guard CLI.

The optional NER/OCR detector and signed models are separate from the core pattern detector. Release packaging is optional and varies by release; installers do not download models. Check the release notes/archive before relying on image or model-assisted detection. When the detector is absent, the proxy still runs its built-in pattern checks, but image OCR and model-assisted categories are unavailable.

## 2. Run a supported agent under the guard

Use FinSAFE's protected-agent command instead of launching the agent binary directly:

```sh
# Hermes interactive session
finsafe hermes

# One-shot Hermes query
finsafe hermes chat -q "Summarize the document I selected."

# FinClaw
finsafe finclaw
```

The guard is enabled by default for `hermes`, `codex`, `pi`, `pi-agent`, and `finclaw` when using these FinSAFE commands. An explicit `enabled: false` policy setting disables it. In wrapper YAML, use the flattened top-level `privacy_guard` field; in high-level policy YAML, use `network.privacy_guard`. Other `finsafe run` or `finsafe self-confine` launches do not automatically get this consumer default; enable the guard in the policy for those flows. See [POLICY-QUICKREF.md](./POLICY-QUICKREF.md#field-semantics).

For content inspection, the protected launch routes outbound traffic through the local proxy and attempts TLS inspection. Requests the proxy cannot inspect (for example, certificate-pinned clients or unsupported protocols) do not receive content-level protection. Review the coverage and platform limits below; do not treat a successful launch as proof every request was inspected.

## 3. Test text detection and the proxy rewrite path

Use test or synthetic content, not real personal data. `finsafe pii detect` checks text with the built-in deterministic detector and prints category/class/level summaries, not the matched value:

```sh
printf 'Contact: privacy-test@example.invalid\n' > privacy-sample.txt
finsafe pii detect --file privacy-sample.txt --json
```

To exercise the privacy filter and rewrite/block behavior, use `privacy verify`. It runs the sample through the production privacy filter and a temporary TLS mock bound to loopback; it does not contact a remote provider:

```sh
finsafe privacy verify --file privacy-sample.txt --json
```

A protected result reports a finding and an action such as `rewrite` or `deny`. Exit code `0` means the sample was rewritten or blocked; `4` means no finding was protected or sensitive content would have been forwarded unchanged; `2` indicates invalid input/policy; `3` indicates local verifier setup or transport failure. The verifier prints summaries only and limits the sample to 1 MiB.

## 4. Test image OCR

On macOS or Linux, provide a PNG, JPEG, GIF, or WebP test image:

```sh
finsafe privacy verify --image ./synthetic-id-card.png --json
```

Image verification needs the optional `finsafe-pii-detector` executable and signed OCR models to be installed and discoverable by FinSAFE. Without them, this command cannot prove OCR protection. A successful verification reports a category/action and `sample_forwarded_unchanged: false`; it uses only the local loopback mock.

The image verifier accepts samples up to 1 MiB. The reference detector has bounded image dimensions and inference limits. OCR is not a guarantee of recognizing every image, language, orientation, document type, or image quality; PDF/Office parsing is not provided. Windows image verification through this detector is not currently supported.

## 5. `pii` versus `privacy`

These command groups serve different workflows:

- **`finsafe pii detect --text …` / `--file …`** performs a local text-only category scan. It does not scan images or exercise the outbound proxy.
- **`finsafe privacy verify --file …` / `--image …`** tests the privacy filter's rewrite/block path against a loopback mock. It does not launch an agent or prove all of that agent's traffic is covered.
- **`finsafe pii placeholder`** and **`finsafe pii approvals`** are host-integration interfaces for cooperating code that shares FinSAFE's in-process state. Running those CLI commands in a separate process does not connect to another running agent's proxy state. They are not a standalone FinClaw hook or approval UI.

## Coverage and limitations

The privacy guard protects content only when the request passes through FinSAFE's proxy, TLS can be inspected, and the payload format is supported. Certificate pinning, opaque traffic, unsupported protocols, and traffic that bypasses the proxy can reduce or remove content-level coverage. FinSAFE's sandbox/network boundary must prevent bypass for the specific deployment.

The built-in detector uses patterns and validation rules for supported categories. Optional NER/OCR expands detection but does not make it complete. Measured agent, provider, platform, and image coverage is limited; do not infer universal coverage from a successful launch or verification run. FinClaw's optional prompt/tool hooks are a separate integration and are not enabled by `finsafe finclaw`.

See also: [agent sandbox guide](./agent-sandbox-guide.md) · [policy quick reference](./POLICY-QUICKREF.md) · [privacy-guard example notes](../examples/privacy-guard/README.md).
