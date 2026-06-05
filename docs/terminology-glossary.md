# FinSAFE terminology glossary

**中文（完整版）：** [terminology-glossary-zh.md](./terminology-glossary-zh.md)

The Chinese glossary is the **canonical, full** reference for FinSAFE concepts: product architecture, policy and fleet governance, Linux/macOS/Windows isolation, networking (allowlist, MITM, WFP, corporate proxy, L7 hooks), audit envelopes, and comparison terms used alongside **Claude sandbox-runtime** and **Codex** sandbox discussions.

Use it when you encounter unfamiliar terms such as:

- **MITM / TLS terminate** — HTTPS inspection via `tls_terminate`, `mitm_tls_terminate` license, inspection CA  
- **WFP / deny-only group / permit-loopback** — Windows persistent filters and loopback proxy ports `60080–60089`  
- **Corporate / parent proxy** — upstream enterprise HTTP(S) gateway (planned chaining from FinSAFE loopback proxy)  
- **L7 filter hook / filterRequest** — per-request programmable proxy policy (sandbox-runtime pattern; not shipped in FinSAFE today)  
- **bubblewrap, seccomp, cgroup, Landlock, Seatbelt, AppContainer** — platform isolation stacks  
- **Bundle, Assignment, rollout, sentinel, UDS challenge** — managed-mode fleet governance  

For field-level policy semantics, see [POLICY-QUICKREF.md](./POLICY-QUICKREF.md). For the doc index, see [README.md](./README.md).
