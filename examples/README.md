# Policy examples

YAML samples published with [finogeeks/finsafe](https://github.com/finogeeks/finsafe). Use them from a checkout of this repository (paths in commands assume the repository root).

| Directory | Purpose |
|-----------|---------|
| [high-level-policies/](high-level-policies/) | High-level **intent** policies for the enterprise / policy-router path (no raw sandbox primitives in YAML). |
| [wrapper-policies/](wrapper-policies/) | `kind: local-wrapper` policies for `finsafe run` and `finsafe self-confine`. |

Wrapper field reference: [docs/POLICY-QUICKREF.md](../docs/POLICY-QUICKREF.md) · [docs/POLICY-QUICKREF-zh.md](../docs/POLICY-QUICKREF-zh.md). Command flows and **`finsafe learn` / `explain`**: [docs/USER-GUIDE.md](../docs/USER-GUIDE.md).

**Note:** `install.sh` installs binaries only. Clone this repository, run **`finsafe init`**, or download individual YAML files.

**First-run Hermes / OpenCode:** [README § Quick start (Hermes)](../README.md#quick-start-hermes) · [README § Quick start (OpenCode)](../README.md#quick-start-opencode) ([中文 README](../README-zh.md)).
