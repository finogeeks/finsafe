# 隐私防护：准备、测试与运行

**English:** [privacy-guard.md](./privacy-guard.md)

隐私防护会在受支持的出站请求到达远程模型前进行检查。检测在 FinSAFE 出口代理本机运行，不会把内容发送到云端 DLP 服务。检测并非完美；只有当 Agent 的出站流量确实经过 FinSAFE 代理且可被检查时，内容防护才生效。

## 1. 安装并检查前提

从 [GitHub Releases](https://github.com/finogeeks/finsafe/releases) 安装 FinSAFE，校验 `SHA256SUMS`，并单独安装 Agent。确认 CLI 包含受保护 Agent 命令：

```sh
finsafe version
finsafe --help
```

CLI 帮助中应列出 `hermes`、`codex`、`pi` 或 `finclaw`。若命令无法识别，请更新到包含隐私防护 CLI 的 FinSAFE 发行版。

可选的 NER/OCR 检测器及签名模型与核心模式检测器分开提供。是否随发行包提供取决于具体版本；安装器不会自动下载模型。若要依赖图片 OCR 或模型辅助检测，请先检查发行说明和压缩包。缺少检测器时，代理仍会运行内置模式检查，但无法进行图片 OCR 或模型辅助类别检测。

## 2. 在防护下运行受支持的 Agent

使用 FinSAFE 的受保护 Agent 命令，不要直接启动 Agent 二进制：

```sh
# Hermes 交互会话
finsafe hermes

# Hermes 单次查询
finsafe hermes chat -q "总结我选择的文档。"

# FinClaw
finsafe finclaw
```

通过上述 FinSAFE 命令启动 `hermes`、`codex`、`pi`、`pi-agent` 和 `finclaw` 时，默认启用隐私防护。显式设置 `enabled: false` 会关闭防护：包装策略 YAML 使用顶层扁平字段 `privacy_guard`，High-level 策略 YAML 使用 `network.privacy_guard`。其他 `finsafe run` 或 `finsafe self-confine` 启动方式不会自动获得此消费者默认行为；请在对应策略中启用隐私防护。参见 [策略速查](./POLICY-QUICKREF-zh.md#field-semantics)。

为检查内容，受保护启动会把出站流量导向本地代理并尝试进行 TLS 检查。代理无法检查的请求（例如使用证书固定的客户端或不支持的协议）不具备内容级防护。请阅读下方覆盖范围和平台限制；成功启动不代表每个请求都已检查。

## 3. 测试文本检测与代理改写路径

请使用测试或合成内容，不要使用真实个人信息。`finsafe pii detect` 使用内置确定性检测器扫描文本，只输出类别/大类/级别摘要，不输出匹配值：

```sh
printf '联系邮箱：privacy-test@example.invalid\n' > privacy-sample.txt
finsafe pii detect --file privacy-sample.txt --json
```

如需测试隐私过滤器的改写/阻止路径，请使用 `privacy verify`。它通过生产隐私过滤器将样本发送到仅绑定本机回环地址的临时 TLS Mock，不会连接远程服务商：

```sh
finsafe privacy verify --file privacy-sample.txt --json
```

受保护结果会报告检测类别及 `rewrite` 或 `deny` 等动作。退出码 `0` 表示样本已改写或阻止；`4` 表示没有检测到受保护结果，或敏感内容可能未改动地转发；`2` 表示输入/策略无效；`3` 表示本地验证器设置或传输失败。验证器只输出摘要，样本上限为 1 MiB。

## 4. 测试图片 OCR

在 macOS 或 Linux 上提供 PNG、JPEG、GIF 或 WebP 测试图片：

```sh
finsafe privacy verify --image ./synthetic-id-card.png --json
```

图片验证需要安装并由 FinSAFE 找到可选的 `finsafe-pii-detector` 可执行文件和签名 OCR 模型。缺少这些组件时，该命令不能证明 OCR 防护有效。成功结果会报告类别/动作及 `sample_forwarded_unchanged: false`；验证只使用本机回环 Mock。

图片验证器接受最大 1 MiB 的样本。参考检测器对图像尺寸和推理设有上限。OCR 不保证识别所有图片、语言、方向、文档类型或图像质量；当前不解析 PDF/Office 文档。当前不支持通过该检测器在 Windows 上验证图片。

## 5. `pii` 与 `privacy` 的区别

两个命令组服务于不同工作流：

- **`finsafe pii detect --text …` / `--file …`** 在本机扫描文本类别；不扫描图片，也不测试出站代理。
- **`finsafe privacy verify --file …` / `--image …`** 使用回环 Mock 测试隐私过滤器的改写/阻止路径；不会启动 Agent，也不能证明该 Agent 的所有流量均受覆盖。
- **`finsafe pii placeholder`** 与 **`finsafe pii approvals`** 是供共享 FinSAFE 进程内状态的配合型宿主代码使用的接口。单独运行这些 CLI 命令不会连接到另一个正在运行的 Agent 代理状态。它们不是独立的 FinClaw Hook 或审批界面。

## 覆盖范围与限制

只有当请求经过 FinSAFE 代理、TLS 可检查且载荷格式受支持时，隐私防护才能检查内容。证书固定、不可见流量、不支持的协议以及绕过代理的流量，都可能降低或失去内容级覆盖。具体部署必须通过 FinSAFE 沙箱/网络边界防止绕过。

内置检测器使用模式和校验规则识别受支持的类别。可选 NER/OCR 可扩大检测范围，但不意味着检测完整。Agent、服务商、平台和图片的实测覆盖范围有限；不能根据成功启动或验证就推断为普遍覆盖。FinClaw 可选的 prompt/tool Hook 属于单独集成，运行 `finsafe finclaw` 不会自动启用这些 Hook。

另请参阅：[Agent 沙箱指南](./agent-sandbox-guide-zh.md) · [策略字段速查](./POLICY-QUICKREF-zh.md) · [隐私防护示例说明](../examples/privacy-guard/README.md)。
