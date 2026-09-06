# 可视化沙箱

**English：** [visual-sandbox.md](./visual-sandbox.md)

`finsafe --visual` 会在本机打开一个网页，跑的是这台电脑上的真实命令。多数标签会把同一个动作跑两遍：一次不设沙箱，一次在 FinSAFE 里。没有预录。界面嵌在个人版 CLI 里，不需要 Bun、Node，也不需要克隆仓库。

```bash
finsafe --visual
# 等价写法；不加 --open 不会自动打开浏览器：
finsafe visual-sandbox --port 8787 --open
```

打开 **http://127.0.0.1:8787**。默认只监听回环地址。

## 可以试什么

| 标签 | 看什么 |
| --- | ------ |
| 说明 | 这页做什么，以及 Linux / macOS / Windows 各自真正拦得住什么 |
| 文件保险箱 | 带永不可读规则的读写 vs 主机直访 |
| 网络访问 | 开放 / 白名单 / 断网 vs 真页面或拦截 |
| HTTPS 检查 | CONNECT+密文 vs 解密后的方法/路径（商业 MITM 需许可证——此界面使用本地实验 CA） |
| 失控任务 | 挂起 / CPU / 内存 / 进程上限，并如实标注本机是否强制 |
| 智能体 | 检测 PATH 上的 Hermes / FinClaw；在 FinSAFE 里一次性提问，控制台打在页面上。缺省提示词会让智能体去访问**不在** LLM 白名单里的网站 |

## HTTP 客户端

网络相关标签优先用 PATH 上的 **`curl`**，这样沙箱包住的是普通工具。如果没有 curl（演示用的锁定电脑上很常见），界面会改用同一个程序里的 **`finsafe visual-http`**。之后装上 curl 仍然有意义：沙箱本来就该包住你实际在跑的工具。

CPU / 内存失控场景仍然需要 `python3`。

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

启动时打印的临时目录里会生成假的薪酬/PII 样例，供文件保险箱演示拦截。

## 开发者

界面源码在私有 FinSAFE 仓库的 `ui/visual-sandbox/`。那里的 `bun run dev` 是热更新开发方式；发行版二进制由 `finsafe` 进程直接提供编译后的页面。
