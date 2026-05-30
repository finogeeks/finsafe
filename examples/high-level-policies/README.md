# High-level policy examples

Operator-facing **intent** YAML for the FinSAFE high-level policy router. These documents describe *what* you want (filesystem, resources, network posture, syscalls); the engine resolves them to concrete Linux or macOS sandbox configuration.

## Files

| File | Posture |
|------|---------|
| `python-no-network.yaml` | Sandboxed Python with no network and a restrictive syscall profile. |
| `python-proxy-internal.yaml` | Sandboxed Python with egress via a host-configured internal proxy profile. |
| `shell-with-artifacts.yaml` | Restricted shell with workspace writes and artifact collection. |
| `broker-self-confine.yaml` | Long-lived broker style: workspace RW, host network, default syscalls, no artifacts. |

## What this YAML is **not**

These are intent documents. They must not declare raw sandbox mechanism fields (for example `bwrap_flags`, `seccomp_profile_path`, `cgroup_parent`, `landlock_rules`, or low-level `userns` knobs as mechanism leaks). Unknown fields are rejected by the parser (`deny_unknown_fields`).

## Maintainers

When the published FinSAFE engine changes high-level schema, update these YAML files in this directory and cross-check [POLICY-QUICKREF.md](../../docs/POLICY-QUICKREF.md) so operators stay aligned.
