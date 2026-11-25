# 更新日志

[English](../../en/reference/changelog.md)

> 公开发布历史快照，取自 `finogeeks/finsafe` 提交 `d068728f78ba67380713512399516f0cc8481742`，截至 0.9.47。最新安装包见[发布页](https://github.com/finogeeks/finsafe/releases)。

[finogeeks/finsafe](https://github.com/finogeeks/finsafe/releases) 上**公开** FinSafe CLI 和集群版本的用户可见变更。

本文件是唯一的公开发布历史。其源文件由私有 FinSAFE 单体仓库的 `docs/public-finsafe/` 维护，并在每次发布时同步到公开仓库。私有开发提交不会自动复制到这里。

格式遵循 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)。

## [未发布]

<!-- 在此整理条目；触发 release-public-cli.yml 前，先建立带日期的版本章节。 -->

## [0.9.47] - 2026-09-21

### 变更

- **运维控制台样式更新（#409）：**托管管理界面现使用 shadcn/ui，并采用全宽侧边栏。（PR [Geeksfino/finsafe#409](https://github.com/Geeksfino/finsafe/pull/409)）

### 新增

- **Windows 启动映像暂存（#372）：**在 AppContainer 启动前，暂存副本可跨宿主使用，并设置执行 ACE，失败时拒绝放行。（PR [Geeksfino/finsafe#372](https://github.com/Geeksfino/finsafe/pull/372)）
- **WorkBuddy 目录静态内容写入及试用版首次运行体验（#366）。**（PR [Geeksfino/finsafe#366](https://github.com/Geeksfino/finsafe/pull/366)）

### 修复

- **接纳执行时不再受执行单元生命周期阻塞（#404）。**（PR [Geeksfino/finsafe#404](https://github.com/Geeksfino/finsafe/pull/404)）
- **将 WorkBuddy 覆盖层应用到两个 USER 主目录（#396）。**（PR [Geeksfino/finsafe#396](https://github.com/Geeksfino/finsafe/pull/396)）
- **通过 CodeBuddy USER 设置配置 WorkBuddy PowerShell（#389）。**（PR [Geeksfino/finsafe#389](https://github.com/Geeksfino/finsafe/pull/389)）
- **将厂商的 `--parent-pid` 改写为 finsafe 中转进程（#382）。**（PR [Geeksfino/finsafe#382](https://github.com/Geeksfino/finsafe/pull/382)）
- **将 HighLevel 会话的 `.git` 和 `.finsafe` 重新映射为只读覆盖层（#373）。**（PR [Geeksfino/finsafe#373](https://github.com/Geeksfino/finsafe/pull/373)）
- **WorkBuddy 应用内更新期间保留 app-seam 附加（#368）。**（PR [Geeksfino/finsafe#368](https://github.com/Geeksfino/finsafe/pull/368)）
- **Windows helper IPC 容错（#383）：**当 `finsafe-winhelper` 已停止时，`finsafe run` 在 RestrictedToken `CreateProcess` 前，不再为每次 helper 管道打开等待约 5 秒（三次启动探测合计约 15 秒）。管道不存在或繁忙时立即按容错路径继续；`setup-windows` / `sc start` 后的 `wait_for_helper` 保持不变。helper 接收循环保留一个备用命名管道实例，防止连续 AppContainer 启动遇到 `ERROR_FILE_NOT_FOUND`。
- **Windows WFP `network: none` 网络隔离探测（#329）：**启动前 TCP 探测和 AppContainer 子进程现使用 `finsafe-net` 仅拒绝令牌。持久筛选器仍允许操作员已启用的组成员身份，使桌面保持联网。操作员连接成功不再被视为网络隔离失败。正在运行的 none/allowlist AppContainer 持有按包划分的租约，防止相同 SID 的 `network: host` 启动解除其网络隔离。托管的 `windows-latest` 必须使用该仅拒绝令牌尝试连接 `1.1.1.1:443`，并记录 `windows_egress_fence_verified=true`；`GITHUB_ACTIONS` / `CI` / 机器账号令牌都不能作为跳过探测或缺少该标记仍启动的理由。工作组运行器通过 MSV1_0 S4U（或 helper 拥有的探测登录）创建令牌，因为 Kerberos S4U 不适用于本地账号。

### 实验功能

- **Windows GUI 应用接缝**（`finsafe app attach` / `detach` / `status`）——实验功能，不属于受支持的产品模式。包含两个强制约束层级（D16）：核心进程使用用户态防护（写入范围、审计）及 Job Object（清理、限制）；派生工具使用 RestrictedToken（内核写入范围）。核心进程没有拒绝读取、出站限制或内核文件系统边界。删除或替换 `finsafe.exe` 前，先运行 `finsafe app detach --all`；孤立接缝会静默失去防护（**不保证弹出通知**）。参见 [WINDOWS-GUIDE.md 的应用接缝章节](https://github.com/finogeeks/finsafe/blob/bada9f48043eb09878c529d824190e5d7aa84d1f/docs/WINDOWS-GUIDE.md)。不属于 G2；FakeAgent 测试夹具不等于 WorkBuddy。

<!-- 在此整理条目；触发 release-public-cli.yml 前，先建立带日期的版本章节。 -->

## [0.9.46] - 2026-09-06

<!-- 在此整理条目；触发 release-public-cli.yml 前，先建立带日期的版本章节。 -->

### 修复

- **Windows：为 finsafe-winhelper 命名管道授予双向 ACL（#37）**（公开问题 [finogeeks/finsafe#37](https://github.com/finogeeks/finsafe/issues/37)，PR [Geeksfino/finsafe#304](https://github.com/Geeksfino/finsafe/pull/304)）

## [0.9.45] - 2026-09-06

<!-- 在此整理条目；触发 release-public-cli.yml 前，先建立带日期的版本章节。 -->

### 修复

- **可视化沙箱：修复文件保险库的 Windows 拒绝通配规则及原生命令演示**（公开问题 [finogeeks/finsafe#38](https://github.com/finogeeks/finsafe/issues/38)，PR [Geeksfino/finsafe#305](https://github.com/Geeksfino/finsafe/pull/305)）

## [0.9.44] - 2026-09-05

<!-- 在此整理条目；触发 release-public-cli.yml 前，先建立带日期的版本章节。 -->

### 修复

- **可视化沙箱：输出必需的 read_only_paths，并修复 Windows 拒绝通配规则的包含关系检查**（公开问题 [finogeeks/finsafe#36](https://github.com/finogeeks/finsafe/issues/36)，PR [Geeksfino/finsafe#301](https://github.com/Geeksfino/finsafe/pull/301)）

## [0.9.43] - 2026-09-05

<!-- 在此整理条目；触发 release-public-cli.yml 前，先建立带日期的版本章节。 -->

### 修复

- **可视化沙箱：在文件保险库命令中使用相对于开发包的路径**（公开问题 [finogeeks/finsafe#35](https://github.com/finogeeks/finsafe/issues/35)，PR [Geeksfino/finsafe#300](https://github.com/Geeksfino/finsafe/pull/300)）

## [0.9.42] - 2026-09-04

### 新增

- **`finsafe --visual` / `finsafe visual-sandbox`**——个人版 CLI 中的本地实时对比界面：文件保险库、网页访问、HTTPS 检查、失控任务及 Agent 标签页（在 FinSAFE 下单次运行 Hermes / FinClaw）。输出实时显示；无需 Bun 或源码检出。指南：[visual-sandbox.md](https://github.com/finogeeks/finsafe/blob/bada9f48043eb09878c529d824190e5d7aa84d1f/docs/visual-sandbox.md)。（PR [Geeksfino/finsafe#293](https://github.com/Geeksfino/finsafe/pull/293)）

## [0.9.41] - 2026-09-01

### 新增

- **`windows.msys2_child_ipc`**——需显式启用的 RestrictedToken 标志，使子进程中的 Git-for-Windows / MSYS2 `bash.exe`（Hermes 工具、`cmd /c bash`）可以初始化 Cygwin IPC。默认关闭，保留 NTFS 写入允许列表。为 true 时，操作员 SID 成为整个令牌的 WRITE_RESTRICTED 限制 SID，写入允许列表**不再**适用于用户拥有的对象；验证记录使用 `msys2_child_ipc` 字段。随附的 Hermes Windows 示例已设置此项。直接以 `bash.exe` 为负载时仍无需此标志（公开问题 #29）。（公开问题 [finogeeks/finsafe#34](https://github.com/finogeeks/finsafe/issues/34)）

<!-- 在此整理条目；触发 release-public-cli.yml 前，先建立带日期的版本章节。 -->

## [0.9.40] - 2026-08-31

### 新增

- **优先拒绝的出站规则**——允许列表策略可设置 `denied_hosts` 及可选的 `denied_host_reasons`（`*`、`*:port`、FQDN、`*.suffix`、`:port`）。先判断拒绝，再判断允许，因此即使允许 `github.com`，`github.com:22` 仍会被阻止。被阻止的请求记录为 `host_denied`，并可附带操作员消息。（PR [Geeksfino/finsafe#270](https://github.com/Geeksfino/finsafe/pull/270)）
- **JVM 沙箱代理 Agent**——Linux 和 macOS 限制出站的启动会将 `-javaagent` 合入 `JAVA_TOOL_OPTIONS`，使 Java 工具遵循回环代理。Linux self-confine 提取并注入随附 jar。可通过 `java_agent_jar_path` 或 `FINSAFE_JAVA_PROXY_AGENT_JAR` 覆盖。（PR [Geeksfino/finsafe#255](https://github.com/Geeksfino/finsafe/pull/255)、[#258](https://github.com/Geeksfino/finsafe/pull/258)）
- **`FTP_PROXY` / `ftp_proxy`**——允许列表子进程覆盖环境会注入与其他代理环境变量相同的回环 CONNECT URL，防止继承的 FTP 代理设置绕过沙箱代理。（PR [Geeksfino/finsafe#249](https://github.com/Geeksfino/finsafe/pull/249)）

### 变更

- **Windows 路径重叠检查**使用规范化包含关系（忽略大小写、去除扩展路径前缀、失败时拒绝放行），防止 RO/RW/deny-read 重叠检查被不同路径写法绕过。（PR [Geeksfino/finsafe#263](https://github.com/Geeksfino/finsafe/pull/263)）
- **策略授权中心紧急停用开关**——清除/过期判断仅以尚未到期的 `until` 为阻止条件（已过期或 null 不再保持阻止）；管理控制台文案与设备信息架构一致。（PR [Geeksfino/finsafe#256](https://github.com/Geeksfino/finsafe/pull/256)、[#257](https://github.com/Geeksfino/finsafe/pull/257)）
- **Windows CreateProcess 1260**（`ERROR_ACCESS_DISABLED_BY_POLICY`）现显示 IT 管理策略指引，而不只显示数字错误码。（PR [Geeksfino/finsafe#248](https://github.com/Geeksfino/finsafe/pull/248)）

### 修复

- **RestrictedToken + Git for Windows bash**——在 `CreateRestrictedToken` 前，FinSAFE 为现有按 MSYS2 SID 命名的文件映射（`CreateFileMapping S-1-5-21-….n`）授予能力 SID，使 WRITE_RESTRICTED git-bash 可以打开宿主已创建的映射（Win32 错误 5）。这不涉及 `SeCreateGlobalPrivilege`，也不会遍历 `node_modules`。AppContainer 仍是不同的令牌。（公开问题 [finogeeks/finsafe#29](https://github.com/finogeeks/finsafe/issues/29)，PR [Geeksfino/finsafe#275](https://github.com/Geeksfino/finsafe/pull/275)）
- **代理主机写法**——带结尾点的 FQDN 和 IP 字面量使用同一规范化路径，修复误拒绝及 IP 字面量绕过拒绝规则的问题。（PR [Geeksfino/finsafe#269](https://github.com/Geeksfino/finsafe/pull/269)）
- **Linux netns / 代理 bwrap**始终传入 `--die-with-parent`，包括关闭 argv 加固的 `linux-desktop` 启动，使孤立执行单元随监督进程退出。（PR [Geeksfino/finsafe#268](https://github.com/Geeksfino/finsafe/pull/268)）

### 安全

- **验证 Linux 能力已移除**——在内部沙箱阶段通过 `capget` 确认 `--cap-drop ALL` 后可继承、允许和有效能力集均为空，而非只信任 argv 加固。（PR [Geeksfino/finsafe#271](https://github.com/Geeksfino/finsafe/pull/271)）

## [0.9.39] - 2026-08-20

### 安全

- **macOS Seatbelt 可写根目录重命名加固**——授予宽泛的 `(allow file-write*)` 后，配置生成会为每个可写目录根输出 `(deny file-write-unlink …)`，防止沙箱重命名或交换根目录本身。拒绝读取的路径也拒绝写入；可写根下受保护的只读/拒绝读取子树会为其祖先添加 unlink 拒绝规则。可写根路径若包含嵌套符号链接组件，配置准备将失败（`/tmp` → `/private/tmp` 等顶层别名仍有效）。（PR [Geeksfino/finsafe#243](https://github.com/Geeksfino/finsafe/pull/243)）
- **Windows 提权 DACL 配置不再跟随重解析点**——提权的 `finsafe-winhelper` ACL 设置（`ApplyPathDacl`）使用 `OBJ_DONT_REPARSE` 打开受用户影响的策略根（`work_dir`、编译后的 RO/RW/deny-read 路径），并通过基于句柄的 `SetSecurityInfo` 应用 DACL。拒绝这些根下的目录联接，避免将原本面向目标树的沙箱 ACL 错授给联接目标。交互式（非提权）启动保留此前基于路径的行为。（PR [Geeksfino/finsafe#242](https://github.com/Geeksfino/finsafe/pull/242)）

## [0.9.38] - 2026-08-16

### 新增

- **`finsafe prelabel`**——无需启动负载，即可应用 Windows AppContainer 文件系统授权并写入完成标记。使用与之后 `run` 相同的 `--high-level`/`--policy` 文件和命令尾部，使标记键一致。在 Linux 和 macOS 上不执行操作。（PR [Geeksfino/finsafe#234](https://github.com/Geeksfino/finsafe/pull/234)）
- **`finsafe doctor --high-level` / `--policy`**——Windows 可继承根大小预检：列出超限目录树，并引导操作员使用 `finsafe prelabel`。卷根、`%USERPROFILE%` 根及 AppData 产品目录根仍视为错误，不能据此提高上限。（PR [Geeksfino/finsafe#234](https://github.com/Geeksfino/finsafe/pull/234)）

### 变更

- **加快 AppContainer ACL 标记**——包 SID、All Application Packages 和 All Restricted Application Packages 从三次遍历改为一次目录树遍历完成授权。三类授权都已存在时，后续启动跳过处理。（PR [Geeksfino/finsafe#234](https://github.com/Geeksfino/finsafe/pull/234)）

### 安全

- **拒绝在 Electron `userData` / AppData 产品目录上执行可继承 DACL 遍历**——AppContainer 和 RestrictedToken 均拒绝将这些根列为可继承的 `read_write_paths` / `work_dir`。应使用 `%LOCALAPPDATA%\FinSAFE\...` 下专用的空主目录。空 RestrictedToken 主目录只获得目录 ACE，不使用 `TreeSetNamedSecurityInfoW`。（PR [Geeksfino/finsafe#233](https://github.com/Geeksfino/finsafe/pull/233)）

## [0.9.37] - 2026-08-13

### 安全

- **拒绝读取通配规则失败时拒绝放行**——`filesystem.deny_read_paths` 中语法无效或在 `read_write_paths` 下没有匹配路径的通配模式，现使策略编译失败，避免无约束启动。拒绝写入的通配规则仍宽松处理。迁移选项：`skip_deny_read_glob_fail_closed: true`。（PR [Geeksfino/finsafe#217](https://github.com/Geeksfino/finsafe/pull/217)）

### 修复

- **Linux 宿主根文件系统的 `/dev/shm`**——`--dev /dev` 覆盖宿主设备后，若宿主提供 `/dev/shm`，FinSAFE 会重新绑定它，使 `linux-desktop-isolated` 等宿主根文件系统方案中的 POSIX 共享内存 IPC 可用。精选根文件系统方案不变。（PR [Geeksfino/finsafe#218](https://github.com/Geeksfino/finsafe/pull/218)）
- **macOS Seatbelt Homebrew Python / dyld**——只读路径授权及 `/opt/homebrew`、`/usr/local` 平台默认规则会输出 `file-map-executable`，使 dyld 可以 mmap 解释器和库。可写工作区仍保持 W^X（`read_write_paths` / 可写 work_dir 不授予 map-exec）。（PR [Geeksfino/finsafe#219](https://github.com/Geeksfino/finsafe/pull/219)）

## [0.9.36] - 2026-08-11

<!-- 在此整理条目；触发 release-public-cli.yml 前，先建立带日期的版本章节。 -->

### 修复

- **在 self-confine 的 x86_64 seccomp 覆盖策略中允许旧版 creat(2)**（公开问题 [finogeeks/finsafe#33](https://github.com/finogeeks/finsafe/issues/33)，PR [Geeksfino/finsafe#206](https://github.com/Geeksfino/finsafe/pull/206)）

## [0.9.35] - 2026-08-11

<!-- 在此整理条目；触发 release-public-cli.yml 前，先建立带日期的版本章节。 -->

### 修复

- **Linux：将 run 超时终止的范围限制在沙箱内**（公开问题 [finogeeks/finsafe#32](https://github.com/finogeeks/finsafe/issues/32)，PR [Geeksfino/finsafe#205](https://github.com/Geeksfino/finsafe/pull/205)）

## [0.9.34] - 2026-08-10

### 新增

- **统一的 `SandboxViolation` 审计记录**——在共享执行审计封装中规范化文件系统/网络拒绝事件：被阻止的代理出站同时输出旧版 `ProxyEgressRecord` 和 `sandbox_violation`；macOS `--audit` Seatbelt 采集会填充 `attestation.sandbox_violations`。Windows Learning Mode 映射在接入启动路径前仍仅适用于 helper。（PR [Geeksfino/finsafe#199](https://github.com/Geeksfino/finsafe/pull/199)）
- **macOS `allow_local_binding` AF_UNIX IPC**——限制出站时，为工作区、`$TMPDIR`、`/tmp`、`/var/folders` 添加限定范围的 Seatbelt AF_UNIX bind/connect 允许规则，使 Node/TS 工具链管道可用；`docker.sock` 等敏感套接字默认仍拒绝，除非显式启用。（PR [Geeksfino/finsafe#202](https://github.com/Geeksfino/finsafe/pull/202)）

### 变更

- **Linux bubblewrap 最低版本为 0.5.0**——`bwrap` 不存在、版本无法解析或低于 **0.5.0** 时，`finsafe probe` / 启动会拒绝放行（决定性约束：`--clearenv`）。Doctor 报告 `bwrap_version_too_old` 并给出升级办法，取代派生进程时含糊的 `bwrap: unknown option`。（PR [Geeksfino/finsafe#203](https://github.com/Geeksfino/finsafe/pull/203)）

### 安全

- **MITM / L7 路径授权加固**——有歧义的请求路径（编码后的目录穿越、反斜杠、格式错误的 `%`）在 L7 `path_prefix` 匹配前即被拒绝（`l7_path_ambiguous`）。MITM 已获授权且已接入时，阻止不透明 CONNECT 和明文 HTTP 转发绕过（`mitm_required`）。CONNECT 后的分类对非阻塞套接字进行短暂等待，使缺少 ClientHello 时以 `mitm_required` 拒绝，而非因竞态得到 `client_io_error:WouldBlock`。（PR [Geeksfino/finsafe#198](https://github.com/Geeksfino/finsafe/pull/198)）

### 修复

- **Linux Landlock 为 `/dev/null`（及 `/dev/zero`）授予写权限**——此前平台设备基线将 `/dev/null` 设为 Landlock **只读**，导致 bwrap 执行单元内的 shell 重定向（`>/dev/null`）报 `Permission denied`。基线现将 `/dev/null`/`/dev/zero` 加为 Landlock **读写**（不添加 bwrap bind，仍由 `--dev` 提供），保持 `/dev/urandom`/`/dev/random` 只读，并在展开拒绝读取的 `.env` 掩码时跳过非目录 RW 根。不要将 `/dev` 本身列为 Landlock RO（嵌套规则交集会移除 `/dev/null` 写权限）。祖先读取遍历也跳过字符设备 RW 授权，避免 `/dev/null`/`/dev/tty` 注入 RO `/dev`。
- **Linux bwrap RW 挂载修正不再移除 sticky/全员可写模式**——`try_fixup_mount_sources_for_bwrap_identity` 此前将 RW bind 来源 `chown` 为沙箱身份，并强制设为 `0755`。这撤销了入口脚本/`session.rs` 对 `/tmp` 和会话工作区的 `chmod 1777`，导致首次执行单元启动报 `bwrap: Can't create file at /tmp/.env: Permission denied`（在无 `CAP_DAC_OVERRIDE` 的 `--unshare-user` 下创建拒绝读取掩码）。修正逻辑现保留/恢复 `01777`，也会升级已经属于目标身份但遗留为 `0755` 的目录。

## [0.9.33] - 2026-08-06

### 新增

- **为 `run` 和 `self-confine` 透传 `FINSAFE_PROXY_AUDIT_LOG` / `FINSAFE_PROXY_ALLOWLIST_FILE` 环境变量**——集成方启动 `finsafe --policy <yaml> run <cmd>` 或 `finsafe --policy <yaml> self-confine <cmd>` 时，可导出这些变量，为每次运行启用 FS-2 JSONL 出站审计日志和 FS-3 热加载 `host[:port]` 允许列表文件（空值视为未设置）。分离的 `proxy-serve` 同级进程（macOS/Linux self-confine）接收等价的 `--audit-log` / `--allowlist-file` 标志；进程内代理（`run`、Windows self-confine）直接安装 JSONL 输出端（打开失败即拒绝放行），并初始化和监视允许列表文件，重新加载沿用与 `proxy-serve` 相同的失败时拒绝放行语义。

## [0.9.32] - 2026-08-05

### 新增

- **每次运行独立的回环代理端口（`60080–60089`）**——并发的 `controlled` / self-confine Agent 不再争用单一固定代理端口；范围耗尽时分配失败并拒绝放行（macOS 同级代理进程和 Windows 进程内代理）。（PR [Geeksfino/finsafe#191](https://github.com/Geeksfino/finsafe/pull/191)）
- **Linux self-confine 私有网络命名空间 + 回环代理中继**——netns 和中继二进制可用时，客户环境流量被强制送往宿主回环代理；否则 FinSAFE 回退到现有 UDS 代理路径。（PR [Geeksfino/finsafe#191](https://github.com/Geeksfino/finsafe/pull/191)）
- **`proxy-serve --audit-log`**——记录允许/拒绝决定的精简 JSONL 审计（`ts`、`host`、`port`、`decision`、`reason`）。（PR [Geeksfino/finsafe#191](https://github.com/Geeksfino/finsafe/pull/191)）
- **`proxy-serve --allowlist-file` 热加载**——轮询允许列表文件并防抖，原子替换匹配器；无效的重新加载保留原允许列表（失败时拒绝放行）。（PR [Geeksfino/finsafe#191](https://github.com/Geeksfino/finsafe/pull/191)）

### 修复

- **Seatbelt 允许已声明的临时代理端口**，范围为 `60080–60089`，使沙箱子进程可访问分配给自己的同级代理。（PR [Geeksfino/finsafe#191](https://github.com/Geeksfino/finsafe/pull/191)）
- **回环端口重试之间的就绪标记隔离**，避免并发代理启动争用共享就绪文件。（PR [Geeksfino/finsafe#191](https://github.com/Geeksfino/finsafe/pull/191)）

## [0.9.31] - 2026-08-05

### 新增

- **Windows Learning Mode 拒绝并记录的审计采集**——在 `finsafe probe` 报告 Learning Mode API 可用的 Win11 24H2+ AppContainer 宿主上，`finsafe --audit` 和 `finsafe learn` 可在不削弱约束的情况下采集结构化拒绝（JSON + `policy_derivation_notes`）。较旧宿主和 RestrictedToken 仍以内核 ETW + 标记提示作为回退。（PR [Geeksfino/finsafe#188](https://github.com/Geeksfino/finsafe/pull/188)）

### 修复

- **Windows 拒绝读取封闭及不存在路径的占位项**——拒绝读取 DACL 不再将扩展本地路径误判为 UNC，更可靠地封闭继承的写入/创建权限，并在 RW 根下创建缺失的拒绝读取占位项，使路径不存在的验收与生产行为一致。Learning Mode 中包含空格路径的拒绝说明可以正确往返转换。（PR [Geeksfino/finsafe#188](https://github.com/Geeksfino/finsafe/pull/188)）

## [0.9.30] - 2026-07-31

### 新增

- **Windows PipeCapture / Buffered ConPTY 会话报告操作员中断**——附着控制台的监督进程收到 Ctrl+C 或 Ctrl+Break 时，终止沙箱 Job（退出码 `1`），并记录 `termination_reason=operator_interrupted`，与策略超时终止（`124` / `timeout_killed`）区分。Live ConPTY 保持现有 Ctrl+C 转发契约。（PR [Geeksfino/finsafe#176](https://github.com/Geeksfino/finsafe/pull/176)）

### 修复

- **Linux 个人版 CLI 允许列表 + `start_internal_proxy` 不再因缺少 `/run/finsafe-proxy.sock` 而失败**——FinSAFE 现创建兼容 bubblewrap 的客户环境挂载占位项（优先使用 `/run/finsafe-proxy.sock`；`/run` 权限不足或只读时回退到 `/tmp/finsafe-proxy.sock`），并将该路径贯穿回环中继、环境变量和 bind 挂载。修复公开问题 [finogeeks/finsafe#28](https://github.com/finogeeks/finsafe/issues/28)。（PR [Geeksfino/finsafe#177](https://github.com/Geeksfino/finsafe/pull/177)）
- **Windows 操作员中断处理器清理不再导致 Ctrl+C 被忽略**——可中断等待结束后，监督进程移除自己的控制台处理器，而非调用 `SetConsoleCtrlHandler(NULL, TRUE)`。（PR [Geeksfino/finsafe#176](https://github.com/Geeksfino/finsafe/pull/176)）

## [0.9.29] - 2026-07-29

### 修复

- **Windows 热启动不再重新标记已完整处理的 AppContainer 目录树**——重复的 `self-confine` / 沙箱启动在以 `WRITE_DAC` 打开路径前，先探测标记完成哨兵及根 DACL 状态；共享 helper 写入 `%ProgramData%` 的标记，并移除每次启动的 ProjFS 冒烟预演，避免每次启动都重新标记大型工作区/venv 目录树。目录被重新创建后仍遗留的过期标记会被清除，并重新授权。（PR [Geeksfino/finsafe#170](https://github.com/Geeksfino/finsafe/pull/170)）
- **RestrictedToken 写入允许列表不再对整个项目根执行 TreeSet**——当 `work_dir` 是某个 `read_write_paths` 根的严格祖先（典型为 `./workspace` 策略）时，FinSAFE 跳过可继承 cwd 授权；此前该操作会重写整个 `target/` 的 DACL，并覆盖子工作区能力 ACE（允许列表中的写入出现 `Access is denied`）。（PR [Geeksfino/finsafe#170](https://github.com/Geeksfino/finsafe/pull/170)）
- **RestrictedToken self-confine 冒烟策略使用 `network: host`**——与发布就绪预检和 Hermes 桌面路径一致（`network: none` 的 WFP 网络隔离仍使用 AppContainer）。（PR [Geeksfino/finsafe#170](https://github.com/Geeksfino/finsafe/pull/170)）

## [0.9.28] - 2026-07-24

### 修复

- **托管 `self-confine` 现会上报集群审计事件**——托管模式下的交互式 broker 此前虽从 agent 解析策略，却从未将 `SandboxStarted` / `RunCompleted` 放入发往授权中心的队列，因此短时 `finsafe run` 正常显示，而管理员的“审计”/“运行”页仍为空。托管 `self-confine` 现会在启动/exec 前登记运行并输出 `SandboxStarted`（原因包含 `mode=self-confine`）；受监督路径（Windows、tools-only、macOS `--audit` 派生）还会输出 `RunCompleted`。Linux/macOS `execve` 交接仍只报告开始。（PR [Geeksfino/finsafe#161](https://github.com/Geeksfino/finsafe/pull/161)）

### 变更

- **托管出站代理执行单元注入 `WS_PROXY` / `WSS_PROXY`**——回环和 UDS 代理环境注入现包含 WebSocket 代理别名（回环路径还包含小写形式），防止 WebSocket 客户端在限制出站时绕过托管代理。（PR [Geeksfino/finsafe#158](https://github.com/Geeksfino/finsafe/pull/158)）

## [0.9.27] - 2026-07-23

<!-- 在此整理条目；触发 release-public-cli.yml 前，先建立带日期的版本章节。 -->

### 修复

- **Landlock：拆分例外区域后，允许在 rw 工作区根使用 O_CREAT**（公开问题 [finogeeks/finsafe#27](https://github.com/finogeeks/finsafe/issues/27)，PR [Geeksfino/finsafe#151](https://github.com/Geeksfino/finsafe/pull/151)）

## [0.9.26] - 2026-07-23

<!-- 在此整理条目；触发 release-public-cli.yml 前，先建立带日期的版本章节。 -->

### 修复

- **Landlock：拆分例外区域后，允许在 rw 工作区根使用 O_CREAT**（公开问题 [finogeeks/finsafe#27](https://github.com/finogeeks/finsafe/issues/27)，PR [Geeksfino/finsafe#151](https://github.com/Geeksfino/finsafe/pull/151)）

## [0.9.25] - 2026-07-23

### 修复

- **Windows：受限令牌 `self-confine` 使用控制台继承而非 ConPTY**——交互式受限令牌 self-confine 此前通过 Live ConPTY 派生 broker，子进程无法附加到不同令牌的 conhost 时会在 DLL 初始化阶段失败（`0xC0000142`）。该路径现使用 **ConsoleInherit**（继承监督进程控制台及 `WinSta0\Default` 桌面），使 Hermes 等 Agent 能在 Windows 受限令牌 self-confine 下启动。（PR [Geeksfino/finsafe#148](https://github.com/Geeksfino/finsafe/pull/148)）

## [0.9.24] - 2026-07-22

<!-- 在此整理条目；触发 release-public-cli.yml 前，先建立带日期的版本章节。 -->

### 修复

- **Linux：通过 bwrap ro-bind 例外区域强制执行 protected_read_only_paths**（公开问题 [finogeeks/finsafe#21](https://github.com/finogeeks/finsafe/issues/21)，PR [Geeksfino/finsafe#141](https://github.com/Geeksfino/finsafe/pull/141)）

## [0.9.23] - 2026-07-22

<!-- 在此整理条目；触发 release-public-cli.yml 前，先建立带日期的版本章节。 -->

### 修复

- **Linux：self-confine 与 run 模式一样添加 network host 的 Landlock 路径**（公开问题 [finogeeks/finsafe#23](https://github.com/finogeeks/finsafe/issues/23)，PR [Geeksfino/finsafe#147](https://github.com/Geeksfino/finsafe/pull/147)）

## [0.9.22] - 2026-07-21

<!-- 在此整理条目；触发 release-public-cli.yml 前，先建立带日期的版本章节。 -->

### 修复

- **Linux：在 read_write Landlock 授权下强制执行 deny_write_globs**（公开问题 [finogeeks/finsafe#22](https://github.com/finogeeks/finsafe/issues/22)，PR [Geeksfino/finsafe#142](https://github.com/Geeksfino/finsafe/pull/142)）

## [0.9.21] - 2026-07-21

<!-- 在此整理条目；触发 release-public-cli.yml 前，先建立带日期的版本章节。 -->

### 新增

- **SaaS 允许列表支持标准 HTTP 客户端（Linux）**——允许列表代理执行单元现通过单元内回环中继（`finsafe proxy-relay-exec`）包装负载：单元获得 `HTTP_PROXY`/`HTTPS_PROXY=http://127.0.0.1:60080`（及小写别名和 `NO_PROXY`），中继将回环 TCP 转发到位于 `/run/finsafe-proxy.sock` 的按执行划分的出站代理 UDS。未经修改的 curl、Python `requests`、Node fetch 现无需支持 `unix://` 代理即可经过 FQDN 允许列表。此前单元仅接收 `HTTP_PROXY=unix:///run/finsafe-proxy.sock`，主流客户端会拒绝该形式（`curl: (7) Unsupported proxy scheme`）。中继失败时拒绝放行（监听器或代理套接字不可用时绝不派生负载），且不增加可达范围：单元 netns 仍无外部路由，所有出站都终止于宿主侧允许列表代理。执行器必须能解析绝对 `finsafe` 路径（`FINSAFE_CLI_PATH` 或 `PATH`）；否则保留旧版 `unix://` 环境。
- **`proxy_loopback` seccomp 配置族**（`bwrap-proxy-loopback.json`）——为运行回环中继的允许列表单元使用与 `default` 相同的允许列表（允许 AF_INET）。执行器自动为中继单元固定该配置族（覆盖继承的 `FINSAFE_BWRAP_SECCOMP_PROFILE_FAMILY=proxy_uds`，后者会终止中继回环套接字）；操作员仍通过 `FINSAFE_BWRAP_SECCOMP` 控制 seccomp *模式*。也可在操作员配置的 `hardening.seccomp.profile_family` 中显式选择。**安全说明：**由于 `proxy_loopback` 允许 AF_INET（与 `proxy_uds` 不同），seccomp 不再为 IPv4/IPv6 套接字创建提供额外防线，因此 `--unshare-net` 是中继单元*唯一且不可降级*的网络边界——无法创建网络命名空间时 bwrap 拒绝放行（单元绝不启动），所有出站仍终止于宿主侧 FQDN 允许列表代理。

### 说明与范围

- 此变更适用于 **Linux 上短时 SaaS 单次/工作区回合执行**（`finsafe-server` 执行器）。**不改变** `self-confine` / 常驻 broker 允许列表，后者仍为 `proxy_uds`（仅 UDS）；其中尚未接入标准 HTTP 客户端允许列表。macOS/Windows 允许列表行为不变。
- **`wrapper_launch.compiler_version` 现为 2**——探测/验证记录/路由器详情报告升级后的包装策略编译器版本，使审计能够区分回环中继派生和旧版 `unix://` 代理单元路径（v1）。

### 修复

- **Linux：修复 bwrap + shim 下的 Landlock read_write_paths（finogeeks#20）**（公开问题 [finogeeks/finsafe#20](https://github.com/finogeeks/finsafe/issues/20)，PR [Geeksfino/finsafe#140](https://github.com/Geeksfino/finsafe/pull/140)）

## [0.9.20] - 2026-07-20

### 修复

- **SaaS Docker 允许列表启动**——在 `Dockerfile.saas`、`Dockerfile.saas.prebuilt` 中预建 `/run/finsafe-proxy.sock`，并在 `docker-entrypoint.sh` 每次启动时重新创建。此前缺少该挂载目标时，即使 `host_capabilities.allowlist_supported=true`，`network.mode=allowlist` 单元也会在启动时报 `Bubblewrap mount target(s) missing in rootfs: /run/finsafe-proxy.sock`（退出码 3）。已发布至 `ghcr.io/geeksfino/finsafe-saas:v0.9.20`。

## [0.9.19] - 2026-07-19

### 修复

- **macOS Seatbelt `self-confine` 符号链接路径写法：**策略 `read_only_paths` / `read_write_paths` 中本身为符号链接的项（例如 `~/.findesk-dev/...` 下指向 `~/Library/Application Support/...`、供 CLI 安全使用的主目录别名），现同时输出**字面和规范化**两种路径写法。此前 `prepare_macos_seatbelt_self_confine` 先规范化这些项，导致仍引用字面别名的 Hermes（或其他程序）shebang/argv 即使解析目标已允许，也会报 `EPERM`。

## [0.9.18] - 2026-07-19

### 新增

- **SaaS 守护进程 `host_capabilities` 配置**——`daemon.yaml` 可为策略路由器声明 `allowlist_supported` 和 `proxy_profiles`。短时 `HighLevelPolicyV1` 执行（单次提交和工作区会话回合）遵循此设置；Phase Y 常驻 broker 仍使用 `self-confine` 包装模板。设为 `allowlist_supported: true` 时，执行器为每次执行启动嵌入式 `finsafe-net-proxy`（代理启动失败即拒绝放行）。

## [0.9.17] - 2026-07-18

### 新增

- **示例：Hermes Windows 交互策略**（`hermes-windows-interactive.yaml`）——用于实时 Hermes 会话的 RestrictedToken + `self-confine` 方案（`program_mode: interactive`，无会话超时）。Unix 路径的 `hermes-interactive.yaml` 不适用于 Windows，单次运行策略的 `short-lived` 模式 + 120 秒超时也不能用于交互会话。

### 修复

- **Windows 交互式 `self-confine`（两个后端）：**FinSAFE 现实现 Live ConPTY 契约的终端宿主部分。监督进程的真实控制台在会话期间切换为 raw/VT 模式——逐键 stdin（无线缓冲/重复回显）、方向键和功能键以 VT 输入传递、经典 conhost 支持 ANSI 渲染——并将 **Ctrl+C 转发给 broker**，而非终止 FinSAFE 监督进程（此前会经 Job 对象拆除整个会话；Ctrl+Break 仍用于终止会话）。控制台窗口尺寸变化通过 `ResizePseudoConsole` 转发给 broker。退出时恢复原控制台模式。即使已有 0.9.15 的派生修复，此问题仍曾导致交互式 TUI Agent（如 Hermes）无法在 `self-confine` 下使用；单次 `run` 不受影响。

## [0.9.16] - 2026-07-17

### 新增

- **沙箱即服务公开交付：**通过 `release-public-cli.yml` 提供 Linux 归档 `finsafe-saas-server-v*`（`finsafe-server-http` + 公开 `finsafe` + helper/shim/supervisor）及多架构 OCI 镜像 `ghcr.io/finogeeks/finsafe-saas`（`linux/amd64`、`linux/arm64`）。Docker 边车（包括 macOS Docker Desktop）优先使用镜像；裸机 Linux 安装使用 tar 包。

## [0.9.15] - 2026-07-13

### 新增

- **`broker_confine: tools-only`（需显式启用）：**让交互式 broker 在沙箱外使用实时 TTY；工具通过 `finsafe run` / 执行单元受约束。审计记录 `broker_confined=false` / `confine_scope=tools_only`。示例：`examples/wrapper-policies/hermes-interactive-tools-only.yaml`。

### 变更

- **Windows RestrictedToken 交互式 `self-confine`：**可用时默认使用 **Live ConPTY**（与 Codex 一致的派生方式：不设控制台窗口标志；`lpDesktop=Winsta0\Default`）。替代选项：`FINSAFE_WIN_PTY_MODE=pipe`。

### 修复

- **Windows RestrictedToken 交互式 `self-confine`：**旧版 `CreateProcessAsUserW` 派生路径上的子进程可能以 `STATUS_DLL_INIT_FAILED`（`0xC0000142`）退出（公开问题 [finogeeks/finsafe#17](https://github.com/finogeeks/finsafe/issues/17)，PR [Geeksfino/finsafe#109](https://github.com/Geeksfino/finsafe/pull/109)）。**0.9.15+** 默认使用 Live ConPTY；替代选项为 `FINSAFE_WIN_PTY_MODE=pipe`。
- **Windows：**从 `finsafe-winsafe` 导出 `preflight_windows_launch`，使 `finsafe-cli` 交叉编译和 Windows 验收构建能解析该符号。

## [0.9.14] - 2026-07-12

<!-- 在此整理条目；触发 release-public-cli.yml 前，先建立带日期的版本章节。 -->

### 新增

- **文档：专门的 Windows 桌面指南**——[WINDOWS-GUIDE.md](https://github.com/finogeeks/finsafe/blob/bada9f48043eb09878c529d824190e5d7aa84d1f/docs/WINDOWS-GUIDE.md) / [WINDOWS-GUIDE-zh.md](https://github.com/finogeeks/finsafe/blob/bada9f48043eb09878c529d824190e5d7aa84d1f/docs/WINDOWS-GUIDE-zh.md) 覆盖安装 → RestrictedToken 与 AppContainer 决策树 → `probe`/`doctor` → Hermes 示例 → AppContainer/ProjFS → 故障排查。README、USER-GUIDE、POLICY-QUICKREF 和 agent-sandbox-guide 均提供链接。

### 修复

- **Windows：动态加载 ProjFS，使 finsafe 可在缺少 projectedfslib.dll 时启动**（公开问题 [finogeeks/finsafe#15](https://github.com/finogeeks/finsafe/issues/15)，PR [Geeksfino/finsafe#106](https://github.com/Geeksfino/finsafe/pull/106)）

## [0.9.13] - 2026-07-11

### 新增

- **针对大型 AppContainer 运行时的 Windows ProjFS 投影：**可选的 Projected File System 支持无需递归 DACL 遍历即可投影大型目录树（例如 Node/Python Agent 运行时）。`finsafe setup-windows` / Windows 安装程序可启用此功能；`finsafe probe --json` 报告 ProjFS 就绪状态。参见 [USER-GUIDE.md](https://github.com/finogeeks/finsafe/blob/bada9f48043eb09878c529d824190e5d7aa84d1f/docs/USER-GUIDE.md)。
- **Windows `write_restricted` 后端：**显式选择的较弱兼容模式（RestrictedToken 系列写入允许列表，不使用 AppContainer），用于需要宿主全局读取的环境。未固定后端时优先使用 Auto 默认值。
- **示例：Hermes Windows AppContainer 策略**（`hermes-windows-oneshot-appcontainer.yaml`），与 RestrictedToken `hermes-windows-oneshot.yaml` 并列提供。
- **示例：Linux 专用 Hermes 交互包装策略**（`hermes-linux-interactive.yaml`）——`stdio: pty`、针对 `${HOME}/.hermes/.env` 的 `skip_default_deny_read`，以及用于 bubblewrap 内 DNS 的 `/etc/resolv.conf`。由 [@xulis](https://github.com/xulis) 通过公开 PR [finogeeks/finsafe#14](https://github.com/finogeeks/finsafe/pull/14) 贡献。

### 变更

- **Windows 桌面默认后端：**Auto + `network: host`（YAML `deny_read_paths` 为空）现选择 **RestrictedToken**（与 Codex 一致的宿主全局读取及写入允许列表）。`network: none` / 允许列表、机密数据拒绝读取、显式 `windows.backend: appcontainer` 和托管集群仍使用 AppContainer。ProjFS 为可选项（AppContainer 大型运行时投影）；`doctor` 将 ProjFS 问题报告为警告。参见 [USER-GUIDE.md 的 Windows 后端章节](https://github.com/finogeeks/finsafe/blob/bada9f48043eb09878c529d824190e5d7aa84d1f/docs/USER-GUIDE.md) 和 [POLICY-QUICKREF.md](https://github.com/finogeeks/finsafe/blob/bada9f48043eb09878c529d824190e5d7aa84d1f/docs/POLICY-QUICKREF.md)。

## [0.9.12] - 2026-07-08

### 新增

- **Windows WFP 出站隔离验证：**以 `network: none` 启动 AppContainer 前，FinSAFE 在宿主侧执行 TCP 探测，并在 `finsafe run --json` / self-confine 报告中记录 `windows_egress_fence_verified` 和 `windows_egress_fence_probe_target`。当前登录令牌缺少 `finsafe-net` 时，helper 可通过 S4U 登录刷新令牌，使探测使用与子进程相同的主体。

### 安全

- **Windows 出站拒绝验证记录：**桌面宿主上若成功连接探测目标，则启动设置失败（拒绝放行）；`WSAEACCES`（Winsock 10013）视为已验证的网络隔离行为。

### 修复

- **Linux bubblewrap：**拒绝在精选参数路径中注入 shell 元字符（生态上游跟踪加固）。

## [0.9.11] - 2026-07-01

<!-- 在此整理条目；触发 release-public-cli.yml 前，先建立带日期的版本章节。 -->

### 修复

- **Linux seccomp：在 self-confine 中允许 x86_64 epoll_wait 和 vfork**（公开问题 [finogeeks/finsafe#13](https://github.com/finogeeks/finsafe/issues/13)，PR [Geeksfino/finsafe#88](https://github.com/Geeksfino/finsafe/pull/88)）

## [0.9.10] - 2026-06-26

### 安全

- **macOS 限制出站 + `allow_local_binding`：**Seatbelt 出站规则现使用 `(remote ip "localhost:*")`，取代此前的 `(local ip "*:*")`；旧规则会匹配尚未绑定的 `connect()` 来源，使忽略代理环境变量的客户端绕过出站允许列表（与上游 [sandbox-runtime#316](https://github.com/anthropic-experimental/sandbox-runtime/pull/316) 一致）。在相同约束下，为 Java/Gradle 回环客户端注入 `JAVA_TOOL_OPTIONS=-Djava.net.preferIPv4Stack=true`。

## [0.9.9] - 2026-06-25

### 修复

- **在 Linux seccomp 配置中允许 inotify、io_uring 和旧版文件系统调用**（公开问题 [finogeeks/finsafe#12](https://github.com/finogeeks/finsafe/issues/12)，PR [Geeksfino/finsafe#74](https://github.com/Geeksfino/finsafe/pull/74)）

## [0.9.8] - 2026-06-24

### 修复

- **Windows AppContainer 大型依赖目录树（`node_modules`、`venv`、Agent 源码检出）：**可继承 DACL 重新标记现使用 `TreeSetNamedSecurityInfoW` 并提供粗粒度进度报告；仅当**完成标记**证明整个目录树都已标记时才跳过重复工作。修复首次启动中断后仅根被标记、后代缺少 `FILE_EXECUTE` 的问题（嵌套 `.exe` 文件无执行权限）。`FINSAFE_WINSAFE_INHERIT_ROOT_FAIL=0` 仍只降低大小保护的严格程度，不绕过标记。
- **Windows Node.js Agent 运行时：**自动检测解析后命令目标背后的 `node_modules`，并为该目录树授予读取+执行权限（与 Python venv 一样，不受大型目录树失败时拒绝放行保护的限制）。
- **Windows 目录树 DACL FFI：**纠正 Windows 10/11 上 `TreeSetNamedSecurityInfoW` 的参数顺序和进度回调签名。

## [0.9.7] - 2026-06-23

### 修复

- **Windows 嵌套 `cmd` 标准输出采集：**非交互式 AppContainer 控制台宿主（`cmd`、PowerShell）使用带 `CREATE_NEW_CONSOLE` 的 **PipeCapture**，使嵌套外部子进程（`cmd /c whoami`）能够采集标准输出，避免 `STATUS_DLL_INIT_FAILED`（`0xC0000142`）。恢复 Buffered ConPTY 被默认启用后回归前的稳定路径（PR [Geeksfino/finsafe#72](https://github.com/Geeksfino/finsafe/pull/72)）。

### 新增

- **Windows 启动验证记录：**`finsafe run --json` 和 self-confine 报告增加 `windows_stdio_strategy`、`windows_creation_flags`，供操作员诊断实际选择的 stdio 策略及 `CreateProcess` 标志（与粗粒度 `windows_pty_mode` 标签不同）。

## [0.9.6] - 2026-06-23

### 修复

- **Windows：允许 cmd.exe 在 AppContainer 下派生子进程**（公开问题 [finogeeks/finsafe#10](https://github.com/finogeeks/finsafe/issues/10)，PR [Geeksfino/finsafe#68](https://github.com/Geeksfino/finsafe/pull/68)）
- **Windows AppContainer 嵌套 `cmd` 子进程：**AppContainer 管道采集控制台宿主（`cmd`、PowerShell）使用 `CREATE_NEW_CONSOLE`，并继承管道标准句柄，使跳过桌面隔离（#68）后嵌套外部子进程（`cmd /c whoami`）仍能采集标准输出。非控制台映像保留 `DETACHED_PROCESS`。

## [0.9.5] - 2026-06-22

### 修复

- **Windows AppContainer / Hermes：**包装策略列出的路径与自动检测到的 Python venv（`Scripts` / `Lib`）重叠时，避免重复处理可继承 DACL。首次启动仍可能标记一次大型 `site-packages` 目录树；之后启动保持快速。不要将 venv 列入 `read_only_paths`，参见 Windows 沙箱操作说明。

## [0.9.4] - 2026-06-22

### 新增

- **按环境限定出站范围（#58）：**代理边界的 `environment_id` 归属、按环境划分的批准存储，以及对无法归属请求严格拒绝放行的模式。
- **Track B（macOS/Windows）：**沙箱级 L7 拒绝、身份注入和父级代理链探测；包装策略治理字段（`inject_identity`、`l7_rules`、`credential_map`）通过 `internal_proxy` 接入。
- **文档：**Agent 沙箱指南（英文/中文）、平台功能矩阵及 `finsafe-agent-sandbox-run` 技能。

## [0.9.3] - 2026-06-22

### 修复

- **Windows：为 read_only/read_write 路径授予 AppContainer 执行权限**（公开问题 [finogeeks/finsafe#9](https://github.com/finogeeks/finsafe/issues/9)，PR [Geeksfino/finsafe#64](https://github.com/Geeksfino/finsafe/pull/64)）

## [0.9.2] - 2026-06-20

### 新增

- **出站 L7 治理（Track A）：**身份注入、静态 L7 规则、令牌代理（`network.credential_map`）、有界内容审计（schema v4）、编译时威胁情报允许列表扩充，以及代理启动时父级代理 `required` 失败即拒绝放行。
- **执行器 → 服务端审计（G11）：**代理执行单元运行后填充 `ExecutionRecord.proxy_egress_records`。
- **Track B（macOS）：**经沙箱的 HTTPS MITM 探测（`sandbox_exec_mitm_https_via_tcp_loopback_proxy`）；CLI `internal_proxy` 使用与执行器相同的 `build_proxy_config_from_plan` 流程。
- **文档：**`docs/design/token-transformation.md`，更新治理验收矩阵（G1–G11）。

### 变更

- **父级代理：**由配置包声明 `network.parent_proxy`；`required: true` 时在启动阶段执行可达性探测。

## [0.9.1] - 2026-06-20

### 修复

- **macOS `finsafe self-confine`：**Seatbelt 配置临时文件保留到 `sandbox-exec` 启动，修复交互包装启动（Hermes、agy 及其他 `program_mode: interactive` 策略）时的退出码 65（`…/.tmpXXXXXX: No such file or directory`）。

### 新增

- **Agent 沙箱示例：**为 agy 的 `self-confine` 提供 `agy-interactive.yaml`；为 `agy-oneshot.yaml` 更新 Antigravity IDE 认证路径（`~/Library/Application Support/Antigravity`、Keychain、Preferences）。
- **公开技能：**`finsafe-agent-sandbox-verify` 扩充 R2-seatbelt、self-confine 子套件及 agy 认证注意事项（F11）。

## [0.9.0] - 2026-06-20

### 新增

- **`finsafe learn` / `finsafe explain`：**在 Linux（bubblewrap）、macOS（Seatbelt）和 Windows（AppContainer 包装）上采集沙箱拒绝，并转换为策略 YAML 或便于阅读的说明。各平台拒绝路径显示行内修复提示。
- **`finsafe init`：**在用户配置目录（Linux/macOS 为 `~/.config/finsafe/policies/examples/`，Windows 为 `%APPDATA%\FinSAFE\policies\examples\`）创建参考策略示例。安装脚本现建议安装后运行它；它不会为 `run` 自动选择默认策略。
- **公开文档：**在 README 和 USER-GUIDE（英文/中文）中增加 Hermes、OpenCode 快速入门、首次运行流程、Agent 沙箱包装示例及安装路径说明。

### 变更

- **学习输出路径：**默认 `finsafe learn --out` 通过 `policy_paths` 写入 FinSAFE 用户配置根下的 `policies/learned-policy.yaml`。
- **CLI：**在 Agent 注册表建立前，移除实验性的 `finsafe learn --agent` 标志；`run --high-level --agent <id>` 仍仅用于调度器身份。

## [0.8.17] - 2026-06-17

<!-- 在此整理条目；触发 release-public-cli.yml 前，先建立带日期的版本章节。 -->

### 修复

- **Windows：为 setup-windows 服务创建拆分 sc.exe 关键字参数**（公开问题 [finogeeks/finsafe#7](https://github.com/finogeeks/finsafe/issues/7)，PR [Geeksfino/finsafe#55](https://github.com/Geeksfino/finsafe/pull/55)）

## [0.8.16] - 2026-06-17

<!-- 在此整理条目；触发 release-public-cli.yml 前，先建立带日期的版本章节。 -->

### 修复

- **Windows：work_dir 位于 Program Files 下时，跳过可继承重新标记**（公开问题 [finogeeks/finsafe#8](https://github.com/finogeeks/finsafe/issues/8)，PR [Geeksfino/finsafe#54](https://github.com/Geeksfino/finsafe/pull/54)）

## [0.8.15] - 2026-06-17

<!-- 在此整理条目；触发 release-public-cli.yml 前，先建立带日期的版本章节。 -->

### 修复

- **Windows：AppContainer DACL 授权不包含 Write Owner；支持 winhelper 回退**（公开问题 [finogeeks/finsafe#5](https://github.com/finogeeks/finsafe/issues/5)，PR [Geeksfino/finsafe#53](https://github.com/Geeksfino/finsafe/pull/53)）

## [0.8.14] - 2026-06-16

### 修复

- **Windows AppContainer System32 控制台宿主（`cmd.exe`、`powershell.exe`）：**在启用 Defender 防篡改或 EDR 文件筛选器的宿主上，以 AppContainer 启动系统拥有的二进制程序不再卡住数分钟。启动器此前会通过 `SetNamedSecurityInfoW` 为 `C:\Windows\System32`、`C:\Windows` 和 `C:\` 应用多余的祖先及卷根遍历授权；这些目录本已授予 `ALL APPLICATION PACKAGES` 读取+执行权限，且 AppContainer 令牌会绕过遍历检查。现跳过这些多余写入，使 `finsafe run cmd …` 和 `finsafe self-confine cmd …` 恢复快速（约 1 秒）启动。
- **无界面宿主上的 Windows self-confine ConPTY：**强制 Live ConPTY 冒烟和清理路径在非 TTY CI、自动化运行器中更稳健（有界 `ClosePseudoConsole`；`FINSAFE_SELF_CONFINE_FORCE_PTY` 下将控制台宿主路由到缓冲采集）。

## [0.8.13] - 2026-06-16

### 修复

- **Windows AppContainer `read_write_paths` 目录列举和删除：**在 `filesystem.read_write_paths` 所列路径下，沙箱内 `cmd /c dir` 和 `cmd /c del` 不再因子进程 cwd 位于这些根内而报访问被拒绝。RW DACL 授权现显式包含 `FILE_LIST_DIRECTORY` 和 `DELETE` 位，使 LowBox 检查与 `FindFirstFile`、`DeleteFile` 所需权限一致（公开问题 #4）。

## [0.8.12] - 2026-06-16

### 修复

- **Windows AppContainer `read_write_paths` 目录操作：**沙箱内 `cmd` 可在声明的 RW 根下创建和读取文件，但即使子进程 cwd 匹配该根，`dir`（FindFirstFile）和 `del`（DeleteFile）仍会报访问被拒绝。RW DACL 授权现显式包含遍历和删除子项权限；cwd 已在 `read_write_paths` 内时，访问被拒绝提示不再建议补充 RW 授权。

## [0.8.11] - 2026-06-13

### 修复

- **Windows `read_only_paths: ["."]` 与 `read_write_paths: ["./workspace"]`：**Shell 冒烟（`cmd /c dir`、PowerShell）保留启动目录作为沙箱子进程 cwd，不再自动迁移到 `./workspace`，使项目根的只读列举恢复正常。仅使用 `./workspace` 的常见冒烟情形仍自动选择工作区 cwd。

## [0.8.10] - 2026-06-12

### 新增

- **`finsafe setup-windows`：**面向个人桌面的一次性 Windows 宿主设置。在 `finsafe.exe` 旁注册并启动 `finsafe-winhelper` Windows 服务，配置网络沙箱（`network: none` / 允许列表策略），可能显示一次 Windows 权限提示。`install.ps1` 安装后自动运行此步骤。
- **Windows 上的 `finsafe doctor`：**helper 服务未运行时发出警告，并引导操作员运行 `finsafe setup-windows`（Hermes 等 `network: host` 策略不需要此步骤）。

### 修复

- **Windows 网络设置错误：**`NetLocalGroupAdd(finsafe-net): 5` 等失败现提供清晰指引，要求运行 `finsafe setup-windows`，而非只有晦涩的 Win32 错误。
- **`finsafe-winhelper` Windows 服务模式：**由 SCM 启动的 helper 不再强制使用控制台模式；开发/验收仍使用 `FINSAFE_WINHELPER_CONSOLE=1`。
- **Windows 包装器工作目录/冒烟：**策略 `filesystem.*_paths` 始终相对于 shell cwd 解析；`--work-dir` 只设置沙箱子进程的工作目录（修复两者都设为 `workspace` 时 `./workspace` 重复嵌套）。策略仅有一个相对 `read_write_paths` 项（如 `./workspace`）时，FinSAFE 自动创建目录，在 `cmd` / PowerShell 冒烟中自动将其用作子进程 cwd，并在 cwd 匹配该 RW 根时为其授予读取+写入权限。访问被拒绝提示引导操作员使用 `cmd /c echo hello`，而非 `cmd /c dir`。

## [0.8.9] - 2026-06-11

### 修复

- **交互控制台上的 Windows `stdio.mode: inherit`：**在 0.8.8 中，`finsafe run` 使用设置了 `stdio.mode: inherit` 的策略（如从嵌入式宿主部署复用的策略）时，在交互 PowerShell/cmd 会话里会静默无输出，连 `cmd /c dir` 都像是失效。启动器现检测自己的标准输出是否为控制台（而非宿主拥有的管道），并回退到缓冲采集+回放，保证显示输出。拥有管道的嵌入式宿主保持真正透传；确有需要时，`FINSAFE_WIN_PIPE_INHERIT_FORCE=1` 可强制向控制台透传。
- **Windows 包装器文本模式回放：**包装器 `run` 路径采集到的子进程输出现通过识别控制台的写入器（`WriteConsoleW`）回放，与 spec `run` 路径一致，使本地化（OEM 代码页）输出正确显示。

### 新增

- **Windows Agent 运行时自动授权（Hermes 开箱即用）：**解析后的命令目标位于 Python venv 中时（如 `…\venv\Scripts\` 下的 `hermes.exe`），FinSAFE 现自动为沙箱授予 venv 根及 `pyvenv.cfg` 引用的基础解释器的读取+执行权限。此前若策略未列举 venv 内部路径，启动会在加载器阶段以 `STATUS_DLL_INIT_FAILED`（0xC0000142）失败；但列举这些路径又会触发可继承 ACL 大小保护。首次启动标记运行时目录树一次，并打印进度行（`finsafe: granting sandbox read access to agent runtime …`）；后续启动保持快速。卷根/用户配置根绝不自动授权。
- **`examples/wrapper-policies/hermes-windows-oneshot.yaml`：**适用于单次 Hermes 命令（`hermes --version`、`hermes chat -q …`）的 Windows 策略，无需 venv 路径或 stdio 覆盖。

## [0.8.8] - 2026-06-11

### 新增

- **Windows PipeInherit stdio：**嵌入式宿主（如通过管道使用 JSON-RPC 的桌面 Agent）可在 CLI `run` 路径设置 **`stdio.mode: inherit`**，请求实时双向 stdio。沙箱子进程继承启动器自己的标准句柄，不使用 ConPTY、`stdin = NUL`，也不会采用等待退出才输出、使长时 Agent 死锁的缓冲采集。
- **Windows stdio 设计文档：**公开 Windows stdio 策略清单、MXC 对比及 PipeInherit 嵌入式宿主契约的设计参考。

### 修复

- **Windows 本地化 cmd 输出：**PipeCapture 通过 OEM/ACP 回退解码分离控制台宿主的 OEM 编码字节（如本地化 `dir` 表头），不再使用有损 UTF-8。
- **Windows 验收 cargo test：**`windows-acceptance` 以 `--no-fail-fast` 运行 `cargo test`，避免单个 crate 失败导致跳过 `finsafe-winsafe` 单元测试。

## [0.8.7] - 2026-06-10

### 变更

- **Windows self-confine 实时输出（Stage 2）：**真实 TTY 上的交互式 `self-confine` 现通过 ConPTY 泵实时传输 broker 输出，适用于**两个**后端（包括 AppContainer）。此前交互式 AppContainer 控制台宿主（`cmd`、PowerShell）被转到缓冲 ConPTY 采集，导致 broker 退出前屏幕冻结，并可能卡住 conhost 清理（脚本看似一直挂起，直到外部超时）。非 TTY 调用方保留管道采集和退出后回放。
- **有界 ConPTY 清理：**broker 退出后，Live ConPTY 标准输出排空最多等待 5 秒；conhost 刷新卡住时分离处理（输出 `FINSAFE_WIN_LAUNCH_DEBUG=1` 诊断），而非挂起监督进程。

### 修复

- **Windows self-confine 策略超时：**`self-confine` 现遵循编译后执行规范中的 `resources.timeout_ms`，不再始终无限等待；长时 broker 仍可省略此字段，让监督进程无限等待。`launch_windows_full` 超时参数已接入子进程等待（此前被忽略）。
- **Windows 可继承 ACL 快速路径：**目录树已具备可继承包 DACL 授权时，即使低完整性标签探测结果不明确，重复启动也跳过大型目录树失败时拒绝放行保护，与 `grant_path` 中幂等的 `SetNamedSecurityInfoW` 跳过逻辑一致。

### 新增

- `FINSAFE_WIN_PTY_MODE=live|buffered|pipe`——交互 stdio 管线的诊断覆盖选项，用于特定宿主行为异常的情况。
- `FINSAFE_SELF_CONFINE_FORCE_PTY=1`——无需 TTY 即可强制使用 ConPTY 路径的测试/诊断钩子；Windows 验收套件用它测试 AppContainer 下伪控制台附加和清理。

### 已知缺口

- 无界面 Windows 运行器上的非交互式 `self-confine` 使用控制台宿主（`cmd`、PowerShell）时，在部分 CI 环境中仍可能卡住数分钟。CI 默认跳过可选的 `cmd /c echo` 冒烟（本地运行可用 `FINSAFE_WIN_ACCEPTANCE_SELF_CONFINE_CMD=1`）。交互式 TTY 启动使用 Live ConPTY（Stage 2）。

## [0.8.6] - 2026-06-10

### 修复

- **Windows self-confine 交互输出：**ConPTY（`live_conpty`）启动现设置 `STARTF_USESTDHANDLES` 并传入空标准句柄，使控制台子系统子进程连接伪控制台，而非继承父终端句柄。此前 AppContainer 约束的 `cmd`、`whoami` 和 PowerShell 可在交互式 PowerShell 会话中成功退出，却不打印任何内容。

## [0.8.5] - 2026-06-06

### 修复

- **Windows AppContainer 拒绝读取：**通过对叶子文件封闭受保护 DACL，强制执行拒绝读取路径（显式策略项及 `workspace/.env`、`%USERPROFILE%/.ssh` 等内置默认项）。可写工作区祖先上继承的包读取 ALLOW ACE 不再使受约束进程读到被拒绝的秘密数据。
- **Windows 验收：**CI 恢复拒绝读取场景（`deny_read`、内置 `.env` 和 `.ssh`，及 `skip_default_deny_read` 退出选项）。

## [0.8.4] - 2026-06-04

### 新增

- **企业父级代理（试点）：**回环出站代理可通过上游 HTTP(S) CONNECT 父级代理转发出站 HTTPS，使用 `FINSAFE_PARENT_PROXY_URL` 及可选的 `FINSAFE_PARENT_PROXY_NO_PROXY`（凭据仅通过环境变量传入，不写入签名配置包）。
- **术语表：**公开文档增加沙箱、策略、集群和代理术语的中英文词汇表。

### 变更

- **回归矩阵：**Stage-2 增加 `net-parent-proxy-mock`，用于 macOS/Linux 父级代理链冒烟覆盖。

### 修复

- **Windows 验收 CI：**内联拒绝读取策略 YAML 包含必需的 `audit` 字段；网络拒绝场景断言 WFP 筛选器已安装。

## [0.8.3] - 2026-06-04

### 新增

- **感知请求正文的 L7 DLP：**MITM 出站代理可按策略 `dlp` 规则（正则模式、大小上限）检查 HTTP 请求正文；无法安全检查时，以 HTTP 403 阻止敏感负载。
- **Windows UI 隔离：**Tier B 沙箱子进程在私有 Win32 窗口站和桌面上派生，使其无法枚举或向交互式 `WinSta0\Default` 窗口发送消息，也无法使用交互剪贴板；结果以 `windows_desktop_isolation` 记录在运行验证信息中。
- **工具链配置：**`self-confine` 和策略合并支持工具链型宿主配置及随附策略覆盖层。

### 安全

- **敏感 Unix 套接字默认规则：**Linux（`deny_read` / bwrap 覆盖层）和 macOS（Seatbelt `unix-socket` 规则）内置拒绝常见容器控制套接字（Docker、containerd、podman、Docker Desktop / OrbStack shim）。Agent 必须使用本地容器 API 时，通过 `filesystem.allow_unix_socket_paths` 显式放行。`read_only_paths` 不阻止套接字 `connect()`，参见 [POLICY-QUICKREF](https://github.com/finogeeks/finsafe/blob/bada9f48043eb09878c529d824190e5d7aa84d1f/docs/POLICY-QUICKREF.md)。

## [0.8.2] - 2026-06-03

### 新增

- **公开发布历史：**[finogeeks/finsafe](https://github.com/finogeeks/finsafe/blob/main/CHANGELOG.md) 上的 `CHANGELOG.md`；GitHub Release 描述从匹配版本章节生成（不使用私有提交日志）。
- **沙箱出站代理：**TLS SNI 处理及回环代理支持，用于约束负载的受控出站流量。

### 修复

- **Linux `finsafe run`：**宿主缺少可选路径（如 `~/.aws`）时，Bubblewrap 拒绝读取不再失败。
- **Windows 托管构建：**WFP 网络隔离和 winhelper IPC 与 `windows-sys` 0.52 对齐，使发布及 CI Windows 目标可靠编译。

### 变更

- 更新 Linux 隔离 Landlock 策略测试和文档，以匹配预期路径布局。
