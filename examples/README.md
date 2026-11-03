# Policy examples

> Older operation references link to the pre-cleanup version; check them against your installed release.

YAML samples published with [finogeeks/finsafe](https://github.com/finogeeks/finsafe). Use them from a checkout of this repository (paths in commands assume the repository root).

| Directory | Purpose |
|-----------|---------|
| [high-level-policies/](high-level-policies/) | High-level **intent** policies for the enterprise / policy-router path (no raw sandbox primitives in YAML). |
| [wrapper-policies/](wrapper-policies/) | `kind: local-wrapper` policies for `finsafe run` and `finsafe self-confine`. |

Wrapper field reference: [docs/POLICY-QUICKREF.md](https://github.com/finogeeks/finsafe/blob/bada9f48043eb09878c529d824190e5d7aa84d1f/docs/POLICY-QUICKREF.md) · [docs/POLICY-QUICKREF-zh.md](https://github.com/finogeeks/finsafe/blob/bada9f48043eb09878c529d824190e5d7aa84d1f/docs/POLICY-QUICKREF-zh.md). Command flows and **`finsafe learn` / `explain`**: [docs/USER-GUIDE.md](https://github.com/finogeeks/finsafe/blob/bada9f48043eb09878c529d824190e5d7aa84d1f/docs/USER-GUIDE.md).

**Note:** `install.sh` installs binaries only. Clone this repository, run **`finsafe init`**, or download individual YAML files.

**First-run Hermes / OpenCode:** [Historical Hermes guide](https://github.com/finogeeks/finsafe/blob/bada9f48043eb09878c529d824190e5d7aa84d1f/docs/agent-sandbox-guide.md#hermes) · [Historical OpenCode guide](https://github.com/finogeeks/finsafe/blob/bada9f48043eb09878c529d824190e5d7aa84d1f/docs/agent-sandbox-guide.md#opencode). Current installation: [安装指南](../docs/getting-started-zh.md).
