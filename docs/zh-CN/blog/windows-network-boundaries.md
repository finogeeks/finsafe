# Windows Agent 网络隔离的信任边界（大纲）

[English](../../en/blog/windows-network-boundaries.md) · [技术博客](README.md)

<p class="blog-meta">文章大纲 · 网络与内容安全</p>

本页保留选题与章节安排，机制分析、复现脚本和实测结果将在后续补齐。

## 威胁模型与执行身份

- 受保护执行 Host、适用子进程、桌面 Main 和本机服务。
- 文件读取、网络连接与内容检查分别保护什么。

## WFP 与代理的分工

- Package SID、有效网络模式与连接路径。
- 代理配置、实际采用代理与 HTTPS 内容可见性。

## 回环服务的信任边界

- 本机中介的调用权限与独立外连。
- 直连限制与内容检查覆盖之间的条件。

## 对照实验设计

- 正常代理请求、范围外直连、子进程与本机中介。
- 客户端错误、代理记录及自有接收端载荷的关联。
- 地址族、协议和运行时版本的覆盖矩阵。

## 结果与支持范围

- 后续补充各路径的实际观察和未测范围。
- 分开记录连接拒绝、内容命中与有效改写。

## 相关文档

- [Windows 网络隔离与 WFP](../architecture/windows-network.md)。
- [Inspector 内容检查](../architecture/inspector.md)。
- [网络访问与 PII](../protection/network-pii.md)。
