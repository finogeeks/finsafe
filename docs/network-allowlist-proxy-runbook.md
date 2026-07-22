# Network allowlist + loopback proxy (personal / local)

**中文：** [network-allowlist-proxy-runbook-zh.md](./network-allowlist-proxy-runbook-zh.md)

End-to-end smoke guide for **domain allowlist** enforced by FinSAFE’s **loopback egress proxy**. Use this when you want “the agent may only reach these hostnames” without HTTPS inspection (MITM).

| Layer | What it does | License | This doc |
|-------|--------------|---------|----------|
| **A — Allowlist + proxy** | Child talks only to `127.0.0.1:60080`; proxy allows listed FQDNs | Personal CLI (**free**) | **You are here** |
| **B — TLS terminate / MITM** | Proxy decrypts HTTPS for L7 audit (`tls_terminated`, method/path) | Commercial `mitm_tls_terminate` | [https-inspection-runbook.md](./https-inspection-runbook.md) |

**Example policy:** [`examples/wrapper-policies/network-allowlist-proxy.yaml`](../examples/wrapper-policies/network-allowlist-proxy.yaml)

**Field reference:** [POLICY-QUICKREF.md](./POLICY-QUICKREF.md) (`network` allowlist, `start_internal_proxy`)

---

## How it works

```text
sandboxed process
  → only 127.0.0.1:60080 (loopback HTTP proxy)
  → FinSAFE proxy (start_internal_proxy or finsafe-net-proxy)
  → allowlist check (FQDN only)
  → upstream internet (allowed hosts only)
```

With `network: allowlist`, FinSAFE does **not** give the child a normal host network. It injects `HTTP_PROXY` / `HTTPS_PROXY` (and related aliases) pointing at the loopback proxy. Standard clients (curl, Python `requests`, Node `fetch`) use that proxy automatically when those env vars are set.

| Policy fields (minimum) | Role |
|-------------------------|------|
| `network: !allowlist` + `domains` | Allowed hostnames (FQDN; no IP literals in the list) |
| `start_internal_proxy: true` | CLI starts the bundled proxy on **`127.0.0.1:60080`** for this run |

Do **not** set `tls_terminate: true` for Layer A. That path needs a commercial license and an inspection CA — use the HTTPS inspection runbook instead.

---

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| Public `finsafe` CLI | [Install](../README.md#install-from-releases) — personal mode, no `license.jws` |
| `finsafe probe` / `finsafe doctor` | Confirm the desktop platform is ready |
| `curl` (or another HTTP client) | Used in the smoke commands below |
| Writable `./workspace` | Example policy grants write only under `./workspace` |

**Platform notes (honest scope):**

| OS | Allowlist + `start_internal_proxy` |
|----|-------------------------------------|
| **Linux** | Supported (bubblewrap + loopback proxy). Needs working network on the host for allowed domains. |
| **macOS** | Supported (Seatbelt + loopback proxy rules). |
| **Windows** | Uses AppContainer + WFP loopback range (`60080–60089`). Run `finsafe setup-windows` once. Prefer a current release build for allowlist pilots; some clients may need an explicit proxy URL if automatic env pickup differs. |

---

## Step 1 — Minimal policy

Copy or edit [`network-allowlist-proxy.yaml`](../examples/wrapper-policies/network-allowlist-proxy.yaml). Essential fragment:

```yaml
network: !allowlist
  domains:
    - example.com
start_internal_proxy: true
```

The `!allowlist` tag is required (serde YAML enum form). Do **not** write `network:` then a nested `allowlist:` key — that fails to parse.

Add every hostname the workload must reach (LLM APIs, package registries, etc.). Matching is **host FQDN** based (see proxy allowlist rules in the field quick-ref). Subdomains you need must be listed explicitly unless your entry is a supported suffix form documented for your release.

---

## Step 2 — Allowlisted request (expect success)

From a directory that contains `./workspace` (create it if needed):

```bash
mkdir -p workspace

# If this tree is a clone of finogeeks/finsafe or Geeksfino/finsafe public docs:
POLICY=examples/wrapper-policies/network-allowlist-proxy.yaml
# Or download:
# curl -fsSLO https://raw.githubusercontent.com/finogeeks/finsafe/main/examples/wrapper-policies/network-allowlist-proxy.yaml
# POLICY=./network-allowlist-proxy.yaml

finsafe --policy "$POLICY" run -- \
  curl -fsS --max-time 15 https://example.com/
```

Expect **exit code 0** and HTML (or a redirect body) from `example.com`.

**Use hostnames in URLs**, not IP literals:

| URL | Result |
|-----|--------|
| `https://example.com/` | Allowed if `example.com` is on the list |
| `https://93.184.216.34/` | Denied (`ip_literal_denied`) even if that IP serves example.com |

Optional JSON envelope:

```bash
finsafe --policy "$POLICY" run --json -- \
  curl -fsS --max-time 15 https://example.com/ \
  | jq '.envelope.inner.exit_code'
```

Expect `0`.

---

## Step 3 — Non-allowlisted request (expect failure)

`example.org` is **not** on the sample list:

```bash
finsafe --policy "$POLICY" run -- \
  curl -fsS --max-time 15 https://example.org/
# look for: exit_code=Some(<non-zero>) and curl HTTP 403
```

Expect **non-zero** child exit in the termination line (`exit_code=Some(…)`, not `Some(0)`) and a failed `curl` (often HTTP **403** from the proxy). That is the allowlist working.

With `--json`, assert the inner code:

```bash
finsafe --policy "$POLICY" run --json -- \
  curl -fsS --max-time 15 https://example.org/ \
  | jq '.envelope.inner.exit_code'
```

Expect a non-zero value (for example `22` when curl reports HTTP 403).

---

## Step 4 — Proxy audit (optional)

When `FINSAFE_NET_PROXY_AUDIT_LOG` is set (any value), the proxy prints one JSON line per decision to **stderr**, prefixed with `finsafe_net_proxy_audit`:

```bash
export FINSAFE_NET_PROXY_AUDIT_LOG=1

finsafe --policy "$POLICY" run -- \
  curl -fsS --max-time 15 https://example.com/ \
  2>proxy-audit.stderr

grep finsafe_net_proxy_audit proxy-audit.stderr | tail -1
```

Denied requests carry stable reasons such as:

| Reason | Meaning |
|--------|---------|
| `host_not_in_allowlist` | Hostname not on `network.allowlist.domains` |
| `ip_literal_denied` | URL or target used a raw IP |
| `malformed_host` | Host string failed validation |

Verbose debug only: `FINSAFE_NET_PROXY_TRACE=1` (noisy; not for normal pilots).

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `network: invalid type: map, expected a YAML tag starting with '!'` | Nested `network: { allowlist: … }` map | Use `network: !allowlist` then `domains:` |
| `127.0.0.1:60080` connection refused | Proxy not started | Set `start_internal_proxy: true`, or run a separate `finsafe-net-proxy` and wire the cell to it (advanced / managed) |
| Port 60080 already in use | Another proxy or previous run | Stop the other listener, or free the port |
| Allowlisted host still fails | Typo / missing subdomain / IP URL | List the exact hostname; do not use IP literals |
| Non-allowlisted host **succeeds** | Policy not applied (`network: host`) or wrong policy file | Confirm `--policy` path and YAML `network.allowlist` |
| TLS certificate errors on allowed HTTPS | Missing CA paths in sandbox FS | Grant `/etc/ssl` (Linux) or platform CA paths; sample policy already includes common roots |
| Windows: client ignores proxy | Env not honored by that tool | Use a client that respects `HTTP(S)_PROXY`, or pass the loopback proxy explicitly (`curl -x http://127.0.0.1:60080`) |
| Confused with MITM / `tls_terminate` | Layer B docs | Allowlist alone does **not** need `FINSAFE_LICENSE_MITM` or an inspection CA |

---

## Managed fleet

The same YAML fields apply inside a signed bundle. Endpoints still need a proxy at launch (`start_internal_proxy: true` is the usual desktop path). Publish and assign via [managed-mode.md](./managed-mode.md) and [enterprise-deployment-runbook.md](./enterprise-deployment-runbook.md).

Layer B (decrypt HTTPS at the proxy) remains optional and licensed — [https-inspection-runbook.md](./https-inspection-runbook.md).

---

## Related

| Document | Role |
|----------|------|
| [POLICY-QUICKREF.md](./POLICY-QUICKREF.md) | Field definitions and audit env vars |
| [USER-GUIDE.md](./USER-GUIDE.md) | `run` / `self-confine` basics |
| [FAQ-zh.md](./FAQ-zh.md) § C5 | Product philosophy (Chinese) |
| [terminology-glossary.md](./terminology-glossary.md) | `finsafe-net-proxy`, loopback proxy, `proxy_egress` |
| [https-inspection-runbook.md](./https-inspection-runbook.md) | Layer B: TLS terminate / MITM |
