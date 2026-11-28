# AppContainer、Job UI 与 Windows 桌面隔离（大纲）

[English](../../en/blog/windows-desktop-isolation.md) · [技术博客](README.md)

<p class="blog-meta">文章大纲 · 执行隔离</p>

本页保留选题与章节安排，机制分析、复现脚本和实测结果将在后续补齐。

## 桌面隔离的不同层次

- 执行身份、对象权限、Job UI 与初始桌面放置。
- 桌面 Main、执行 Host 与工具后代的边界。

## 兼容性配置的作用

- 剪贴板读写、USER 对象与桌面共享。
- 单项例外、其他权限检查与嵌套启动。

## 主机支持与有效限制

- Windows 构建、请求选项与实际有效集合。
- 启动失败和策略应用结果的记录。

## 交互实验设计

- 自建测试窗口、合成剪贴板与可丢弃程序。
- API 返回、独立宿主观察与正常任务对照。

## 结果与未测路径

- 屏幕读取、输入及其他 IPC 的覆盖问题。
- 后续补充版本、兼容性取舍和实测结果。

## 相关文档

- [Windows 桌面交互与 Job UI](../architecture/windows-job-ui.md)。
- [Windows 系统与桌面防护](../protection/windows-security.md)。
- [兼容矩阵](../agents/compatibility.md)。
