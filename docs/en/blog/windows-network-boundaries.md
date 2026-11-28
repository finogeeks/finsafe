# Trust boundaries in Windows Agent network isolation (outline)

[中文](../../zh-CN/blog/windows-network-boundaries.md) · [Technical blog](README.md)

<p class="blog-meta">Article outline · Network and content security</p>

This page contains the planned sections. Mechanism analysis, reproduction scripts and test results will be added later.

## Threat model and execution identities

- Protected execution Host, applicable descendants, desktop Main and local services.
- Separate responsibilities of file access, network connections and content inspection.

## WFP and proxy responsibilities

- Package SID, effective network modes and connection paths.
- Proxy configuration, actual proxy use and HTTPS content visibility.

## Local-service trust boundaries

- Intermediary permissions and independent outbound connections.
- Conditions connecting direct-connection restrictions with inspection coverage.

## Controlled experiment design

- Normal proxy traffic, out-of-scope direct requests, descendants and local intermediaries.
- Correlation of client errors, proxy records and controlled receiver payloads.
- Coverage across address families, protocols and runtime versions.

## Results and support scope

- Actual observations and untested paths to be added.
- Separate records for connection denial, content findings and valid edits.

## Related documentation

- [Windows network isolation and WFP](../architecture/windows-network.md).
- [Inspector content inspection](../architecture/inspector.md).
- [Network access and PII](../protection/network-pii.md).
