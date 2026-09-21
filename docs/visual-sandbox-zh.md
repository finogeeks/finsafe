# 可视化沙箱

**English：** [visual-sandbox.md](./visual-sandbox.md)

`finsafe --visual` 会在本机打开网页。首页是 **场景演示**：选智能体、选场景（输入框会填入当前语言的提示词），再发送。演示智能体把你的提示词只显示一次，下面左右对照 **没有 FinSAFE** / **有 FinSAFE**，并带上任务产物（浏览器、文件、上传、计时）。真实智能体（Hermes / FinClaw）同样左右对照。命令、JSON、策略 YAML 只在 **查看审计证据** 里。没有预录。界面嵌在个人版 CLI 里，不需要 Bun、Node，也不需要克隆仓库。

```bash
finsafe --visual
# 等价写法；不加 --open 不会自动打开浏览器：
finsafe visual-sandbox --port 8787 --open
```

打开 **http://127.0.0.1:8787**。默认只监听回环地址。

## 双击演示包（对方机器不必先装 finsafe）

还是同一份 `finsafe` 二进制，改个名字后双击就会打开界面。对方 **不必** 事先安装或配置 PATH。

| 系统 | 发给对方的文件 | 怎么用 |
| --- | --- | --- |
| Windows | `finsafe-visual.exe` | 双击。黑窗口要留着，关掉就停止。 |
| macOS | `FinSAFE-Visual.dmg`（里面是 `FinSAFE Visual.app`） | 打开镜像，双击 app。 |

在本仓库打包：

```bash
./scripts/dev/package-finsafe-visual.sh --release   # macOS → .app + .dmg
# Windows（PowerShell，先 cargo build -p finsafe-cli）：
#   pwsh -File .\scripts\dev\package-finsafe-visual.ps1 -Release
```

演示智能体只靠这个文件就能跑。Hermes / FinClaw 仍需对方自己安装。Windows 上锁网 / 白名单仍需要 `finsafe-winhelper` 和一次 `finsafe setup-windows`；这个包不包含 helper。

## 第一次就能跑（不装别的工具）

缺省选中 **演示智能体**：内置确定性执行器（不调用大模型，不需要 Hermes/FinClaw，也不需要 `curl` / `python3` / `openssl`）。它会做智能体工具常做的文件、网络、挂起动作，并且跑两遍：无保护 vs FinSAFE。

缺省场景：打开百度并给出页面标题。如果这台机器连不上公网，界面会写 **本机网络不可用**——那不是 FinSAFE 的拦截。

场景：

| 场景 | 看什么 |
| --- | ------ |
| 访问外部网站 | 未批准的目的地 vs 白名单 |
| 读取敏感文件 | 项目简介可读；合成 `vault/internal-config.ini` 被拒 |
| 把数据发到公司外面 | 把一段非敏感周报 POST 到可访问的 `https://postman-echo.com/post`；演示智能体无保护侧仍打到回环接收端；FinSAFE 拦住该主机 |
| 拦住失控任务 | 执行 60 秒的 `sleep` / `Start-Sleep`；FinSAFE 在时间上限处强制停止 |

检测到的 Hermes / FinClaw 会出现在同一个智能体选择器里。自由提问在 **智能体对话**，同样左右对照没有 FinSAFE / 有 FinSAFE。没有本机智能体时发送按钮为灰色。

原来的文件保险箱 / 网络访问 / HTTPS 检查 / 失控任务仍在 **高级实验室**。

## HTTP 客户端（高级实验室）

实验室网络页优先用 PATH 上的 **`curl`**。没有 curl 时改用 **`finsafe visual-http`**。实验室里的 CPU / 内存失控场景仍然需要 `python3`。

## 各系统真正拦得住什么

| | Linux | macOS | Windows |
|---|---|---|---|
| 文件 | 内核（bwrap / Landlock） | Seatbelt | AppContainer / RestrictedToken |
| 网络白名单 | 回环代理 | 回环代理 | 代理 + WFP（要在 Windows 主机上跑过才算证明） |
| 超时 | 有 | 有 | 有 |
| CPU 配额 | cgroup | Seatbelt 没有 | 不宣称 |
| 内存 / 进程数 | cgroup 杀死 | Seatbelt 没有 | Job Object 杀死 |

这套界面在 Windows 上的对照结果，要等有人在 Windows 主机上跑过 `finsafe --visual`，才能当真。

## 实验文件

启动时打印的临时目录里会生成标了 **SYNTHETIC / CANARY** 的样例，避免用真实密钥做演示。

## 开发者

界面源码在私有 FinSAFE 仓库的 `ui/visual-sandbox/`。那里的 `bun run dev` 是热更新开发方式；发行版二进制由 `finsafe` 进程直接提供编译后的页面。
