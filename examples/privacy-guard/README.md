# Privacy guard examples

**English and Chinese setup, launch, and verification guide:** [docs/privacy-guard.md](../../docs/privacy-guard.md) · [中文](../../docs/privacy-guard-zh.md)

Quick local checks (use synthetic or approved test data):

```sh
printf 'Contact: privacy-test@example.invalid\n' > privacy-sample.txt
finsafe pii detect --file privacy-sample.txt --json
finsafe privacy verify --file privacy-sample.txt --json
# Optional: replace this path with an existing synthetic test image.
finsafe privacy verify --image ./synthetic-id-card.png --json
```

`pii detect` is a text-only category scan. `privacy verify` exercises the production privacy filter against a loopback TLS mock, not an external provider. Image verification is supported on macOS/Linux and requires the optional detector and signed OCR models to be installed. Release packaging may omit those optional components; the installer does not download them.

For agent egress inspection, launch through the protected-agent command, for example `finsafe hermes` or `finsafe finclaw`. The command enables the guard by default for recognized agents, unless policy explicitly disables it. This does not enable FinClaw's optional host hooks.
