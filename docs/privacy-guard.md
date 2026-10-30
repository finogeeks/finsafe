# Privacy guard: setup, test, and run

Privacy Guard, SOCKS, and detector-tier instructions on this page apply to Linux and macOS. Windows retains trial content inspection and encryption, and rejects Privacy Guard policy fields.

**中文：** [privacy-guard-zh.md](./privacy-guard-zh.md)

The privacy guard inspects supported outbound requests before they reach a remote model. It runs locally in FinShield's egress proxy; it does not send content to a cloud DLP service. Detection is not perfect and only applies when the agent's outbound traffic is actually mediated and inspectable by FinShield.

## Product modes and detector tiers

FinShield and Privacy Guard are separate choices:

- **Original FinShield (Privacy Guard off):** use FinShield's existing sandbox and policy features without outbound content-level PII inspection. This mode does not have a detector tier.
- **Privacy Guard on, Tier-1:** the guard uses FinShield's built-in pattern and rule checks. It does not require the NER/OCR detector or model assets.
- **Privacy Guard on, Tier-2:** the guard uses those same checks plus the local NER/OCR detector when the detector and complete signed model set are installed and ready. The current model set provides Chinese NER and OCR; Tier-2 is not a promise of complete detection.

Tier-1 and Tier-2 describe the detector available to an enabled Privacy Guard. They are not FinShield product editions, sandbox strength levels, or a measure of detection accuracy. If no optional detector is discovered, Privacy Guard can still run at Tier-1; requests that require unavailable OCR or otherwise cannot be inspected are denied by default. If `FINSAFE_PII_DETECTOR` or `FINSAFE_PII_MODELS` is explicitly set to an invalid path, startup fails rather than silently falling back. Supported protected-agent shortcuts enable the guard when policy omits the setting; set `privacy_guard.enabled: false` to keep the original guard-off behavior. Generic `finsafe run` and `finsafe self-confine` launches do not enable it automatically.

## 1. Install and check prerequisites

Install FinShield from [GitHub Releases](https://github.com/finogeeks/finsafe/releases), verify `SHA256SUMS`, and install the agent separately. Check that your CLI includes the protected-agent commands:

```sh
finsafe version
finsafe --help
```

The CLI must list `hermes`, `codex`, `pi`, or `finclaw`. If the command is unknown, update FinShield to a release that includes the privacy-guard CLI.

CLI and fleet release archives declare `tier1-only` or `tier2-required` in
`artifact-capability.json`; `release.json` records the profile per asset.
Tier-1-only is the release default and may omit detector assets. A
Tier-2-required macOS/Linux archive must contain the complete signed bundle or
packaging fails. The release installer does not download models: it verifies
the archive's bundle and installs it under
`~/.finsafe/plugins/finsafe-pii-detector/`. When the detector is absent from a
Tier-1-only install, the enabled guard still runs its built-in pattern checks,
but image OCR and model-assisted categories are unavailable.

Tier-2-required artifacts are supported only for macOS and Linux;
Windows remains Tier-1-only. The release workflow defaults to Tier-1-only.
Tier-2 is an experimental preview and has not been accuracy-certified or
benchmarked against a representative corpus. A release smoke test verifies
synthetic text rewrite, image OCR rewrite, signed bundle startup, archive
integrity, and installer behavior on each supported release target; it does
not measure detection recall or prove broad PII coverage. Do not rely on it as
the sole privacy control. A `tier2-required` profile is an install/runtime
requirement, not an accuracy claim. Each Tier-2 install includes
`THIRD-PARTY-NOTICES.txt` and the Apache-2.0 license text beside the detector.

### Set up a downloaded release

Use the personal `finsafe-v*` archive for your OS and CPU architecture, verify its checksum, and install or extract it using the release instructions. Add the directory containing `finsafe` to your shell `PATH`, then verify that this is the downloaded binary:

```sh
command -v finsafe
finsafe --version
```

Install each agent separately using its own official installation instructions. Its executable must be discoverable on `PATH` from the same shell that launches FinShield; keep the normal user `HOME` and agent configuration available so the agent can find its own login, provider credentials, and state. FinShield does not install, configure, or authenticate Hermes, FinClaw, Codex, or Pi for you.

For Tier-2 detection, use the installer with a `tier2-required` archive. It
verifies the bundle before replacing the installed plugin at
`~/.finsafe/plugins/finsafe-pii-detector/`. For manual installation, copy the
archive's `plugins/finsafe-pii-detector/` directory to that location and verify
it with the packaged detector's `--verify-bundle` mode. The Tier-2 tree
requires the NER model at `pii-models/ner/model.onnx` and all required OCR
files under `pii-models/ocr/`. For an operator-managed asset location, set
both `FINSAFE_PII_DETECTOR` and `FINSAFE_PII_MODELS` in the environment that
launches FinShield. The binary does not download missing assets. A
Tier-2-required artifact refuses protected-agent startup if its plugin is
missing or invalid; a Tier-1-only artifact may continue with pattern checks
only. Confirm detector startup diagnostics before relying on NER/OCR.

Example for assets stored outside the binary directory:

```sh
export FINSAFE_PII_DETECTOR="$HOME/.local/share/finsafe/finsafe-pii-detector"
export FINSAFE_PII_MODELS="$HOME/.local/share/finsafe/pii-models"
```

## 2. Run a supported agent under the guard

Use FinShield's protected-agent command instead of launching the agent binary directly:

```sh
# Hermes interactive session
finsafe hermes

# One-shot Hermes query
finsafe hermes chat -q "Summarize the document I selected."

# FinClaw
finsafe finclaw

# Codex
finsafe codex exec "Summarize the document I selected."

# Pi
finsafe pi --print "Summarize the document I selected."
```

The guard is enabled by default for `hermes`, `codex`, `pi`, `pi-agent`, and `finclaw` when using these FinShield commands. An explicit `enabled: false` policy setting disables it. In wrapper YAML, use the flattened top-level `privacy_guard` field; in high-level policy YAML, use `network.privacy_guard`. Other `finsafe run` or `finsafe self-confine` launches do not automatically get this consumer default; enable the guard in the policy for those flows. See [POLICY-QUICKREF.md](./POLICY-QUICKREF.md#field-semantics).

These are the protected shortcuts; invoke the installed harness through FinShield rather than running its binary directly. The command forwards arguments to the separately installed agent and uses the current user's normal agent configuration/authentication. On first protected launch, FinShield creates an inspection CA at `~/.finsafe/mitm/ca.crt` and its private key at `~/.finsafe/mitm/ca.key` when no valid CA pair is configured. The protected process receives the certificate through common client trust variables; the private key is denied to the agent. Keep `HOME` set to the same account that owns the agent configuration. Do not distribute or expose the private key. This CA is for the local FinShield-to-agent inspection connection; it is not an upstream trust bundle.

For content inspection, the protected launch routes outbound traffic through the local proxy and attempts TLS inspection. Requests the proxy cannot inspect (for example, certificate-pinned clients or unsupported protocols) do not receive content-level protection. Review the coverage and platform limits below; do not treat a successful launch as proof every request was inspected.

The protected-agent shortcuts do not currently expose a dry-run mode. `finsafe self-confine --dry-run` can inspect a generic policy, but it does not reproduce the shortcut's `host` + privacy-guard proxy configuration, so its output is not evidence that the protected-agent proxy or inspection CA is configured. Use `finsafe privacy verify` below for a local proxy/filter check; it is not an agent end-to-end test.

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

Image verification needs the optional `finsafe-pii-detector` executable and signed OCR models to be installed and discoverable by FinShield. Without them, this command cannot prove OCR protection. A successful verification reports a category/action and `sample_forwarded_unchanged: false`; it uses only the local loopback mock.

The image verifier accepts samples up to 1 MiB. The reference detector has bounded image dimensions and inference limits. OCR is not a guarantee of recognizing every image, language, orientation, document type, or image quality; PDF/Office parsing is not provided. Windows image verification through this detector is not currently supported.

## 5. `pii` versus `privacy`

These command groups serve different workflows:

- **`finsafe pii detect --text …` / `--file …`** performs a local text-only category scan. It does not scan images or exercise the outbound proxy.
- **`finsafe privacy verify --file …` / `--image …`** tests the privacy filter's rewrite/block path against a loopback mock. It does not launch an agent or prove all of that agent's traffic is covered.
- **`finsafe pii placeholder`** and **`finsafe pii approvals`** are host-integration interfaces for cooperating code that shares FinShield's in-process state. Running those CLI commands in a separate process does not connect to another running agent's proxy state. They are not a standalone FinClaw hook or approval UI.

## Coverage and limitations

The privacy guard protects content only when the request passes through FinShield's proxy, TLS can be inspected, and the payload format is supported. Certificate pinning, opaque traffic, unsupported protocols, and traffic that bypasses the proxy can reduce or remove content-level coverage. FinShield's sandbox/network boundary must prevent bypass for the specific deployment.

The built-in detector uses patterns and validation rules for supported categories. Optional NER/OCR expands detection but does not make it complete. Measured agent, provider, platform, and image coverage is limited; do not infer universal coverage from a successful launch or verification run. FinClaw's optional prompt/tool hooks are a separate integration and are not enabled by `finsafe finclaw`.

See also: [agent sandbox guide](./agent-sandbox-guide.md) · [policy quick reference](./POLICY-QUICKREF.md) · [privacy-guard example notes](../examples/privacy-guard/README.md).
