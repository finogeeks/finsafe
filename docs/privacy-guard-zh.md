# 隐私防护：准备、测试与运行

本页的 Privacy Guard、SOCKS 和检测器等级说明适用于 Linux、macOS。Windows 保留 trial 的内容检查与加解密实现，不支持 Privacy Guard 策略字段。

**English:** [privacy-guard.md](./privacy-guard.md)

隐私防护会在受支持的出站请求到达远程模型前进行检查。检测在智安盾出口代理本机运行，不会把内容发送到云端 DLP 服务。检测并非完美；只有当 Agent 的出站流量确实经过智安盾代理且可被检查时，内容防护才生效。

## 产品模式与检测器等级

智安盾与隐私防护是两个独立选项：

- **原有智安盾（关闭隐私防护）：** 使用智安盾现有的沙箱和策略功能，不检查出站内容中的个人信息。此模式没有检测器等级。
- **开启隐私防护，Tier-1：** 使用智安盾内置的模式和规则检查，不需要 NER/OCR 检测器或模型文件。
- **开启隐私防护，Tier-2：** 在相同检查基础上，增加本机 NER/OCR 检测器；前提是完整签名模型集已安装且检测器已就绪。当前模型集提供中文 NER 和 OCR；Tier-2 不代表能够完整检测所有内容。

Tier-1 和 Tier-2 描述的是已启用隐私防护可用的检测器能力，不是智安盾产品版本、沙箱强度等级或检测准确率等级。未发现可选检测器时，隐私防护仍可按 Tier-1 运行；需要 OCR 但 OCR 不可用、或因其他原因无法检查的请求默认会被阻止。若显式设置的 `FINSAFE_PII_DETECTOR` 或 `FINSAFE_PII_MODELS` 路径无效，启动会失败，不会静默降级。受保护 Agent 快捷命令在策略未设置时会默认启用防护；设置 `privacy_guard.enabled: false` 可恢复原有的关闭防护行为。通用的 `finsafe run` 和 `finsafe self-confine` 启动不会自动启用防护。

## 1. 安装并检查前提

从 [GitHub Releases](https://github.com/finogeeks/finsafe/releases) 安装智安盾，校验 `SHA256SUMS`，并单独安装 Agent。确认 CLI 包含受保护 Agent 命令：

```sh
finsafe version
finsafe --help
```

CLI 帮助中应列出 `hermes`、`codex`、`pi` 或 `finclaw`。若命令无法识别，请更新到包含隐私防护 CLI 的智安盾发行版。

CLI 和 Fleet 发行压缩包通过 `artifact-capability.json` 声明
`tier1-only` 或 `tier2-required`；`release.json` 也会记录每个资产的等级。
Tier-1-only 是默认配置，可以不包含检测器资产。macOS/Linux 的
Tier-2-required 压缩包必须包含完整签名模型集，否则打包会失败。发行版
安装器不会下载模型：它会先验证压缩包中的模型集，再安装到
`~/.finsafe/plugins/finsafe-pii-detector/`。Tier-1-only 安装缺少检测器时，
已启用的防护仍会运行内置模式检查，但无法进行图片 OCR 或模型辅助类别检测。

Tier-2-required 发行包仅支持 macOS 和 Linux；Windows 对该检测器仍仅提供
Tier-1。发行工作流默认使用 Tier-1-only。Tier-2 目前是实验性预览，尚未
经过准确率认证，也未基于代表性语料完成基准评估。每个支持的发行目标都会
运行合成文本改写、图片 OCR 改写、签名模型集启动、压缩包完整性和安装器
行为测试；这些测试不衡量检测召回率，也不能证明广泛的个人信息覆盖范围。
请勿将其作为唯一的隐私控制措施。`tier2-required` 表示安装/运行时必须具备
这些资产，不代表准确率保证。每个 Tier-2 安装包都会在检测器旁附带
`THIRD-PARTY-NOTICES.txt` 和 Apache-2.0 许可证文本。

### 配置下载的发行版

根据操作系统和 CPU 架构下载个人版 `finsafe-v*` 压缩包，校验其校验和，并按发行说明安装或解压。将 `finsafe` 所在目录加入 shell 的 `PATH`，然后确认使用的是下载的二进制文件：

```sh
command -v finsafe
finsafe --version
```

按照各 Agent 的官方说明单独安装其 CLI。从启动智安盾的同一 shell 中，Agent 可执行文件必须能通过 `PATH` 找到；保留正常用户的 `HOME` 和 Agent 配置，以便 Agent 使用自己的登录信息、服务商凭据和状态目录。智安盾不会替你安装、配置或登录 Hermes、FinClaw、Codex 或 Pi。

启用 Tier-2 检测时，请使用 `tier2-required` 压缩包的安装器。安装器会先
验证模型集，再原子替换 `~/.finsafe/plugins/finsafe-pii-detector/` 中的
已安装插件。手动安装时，可将压缩包中的
`plugins/finsafe-pii-detector/` 目录复制到该位置，并使用随包提供的检测器
`--verify-bundle` 模式验证。Tier-2 模型集必须包含 `pii-models/ner/model.onnx`
及 `pii-models/ocr/` 下的全部必需文件。若使用运维人员管理的其他路径，请在
启动智安盾的环境中同时设置 `FINSAFE_PII_DETECTOR` 和
`FINSAFE_PII_MODELS`。二进制不会下载缺少的组件。Tier-2-required 压缩包在
插件缺失或无效时会拒绝受保护启动；Tier-1-only 压缩包可继续运行内置模式检查。
依赖 NER/OCR 前请先确认检测器启动诊断。

外置模型的环境变量示例：

```sh
export FINSAFE_PII_DETECTOR="$HOME/.local/share/finsafe/finsafe-pii-detector"
export FINSAFE_PII_MODELS="$HOME/.local/share/finsafe/pii-models"
```

## 2. 在防护下运行受支持的 Agent

使用智安盾的受保护 Agent 命令，不要直接启动 Agent 二进制：

```sh
# Hermes 交互会话
finsafe hermes

# Hermes 单次查询
finsafe hermes chat -q "总结我选择的文档。"

# FinClaw
finsafe finclaw

# Codex
finsafe codex exec "总结我选择的文档。"

# Pi
finsafe pi --print "总结我选择的文档。"
```

通过上述智安盾命令启动 `hermes`、`codex`、`pi`、`pi-agent` 和 `finclaw` 时，默认启用隐私防护。显式设置 `enabled: false` 会关闭防护：包装策略 YAML 使用顶层扁平字段 `privacy_guard`，High-level 策略 YAML 使用 `network.privacy_guard`。其他 `finsafe run` 或 `finsafe self-confine` 启动方式不会自动获得此消费者默认行为；请在对应策略中启用隐私防护。参见 [策略速查](./POLICY-QUICKREF-zh.md#field-semantics)。

这些是受保护快捷命令；应通过智安盾启动已安装的 Agent，而不是直接运行 Agent 二进制。命令会将参数转发给单独安装的 Agent，并使用当前用户已有的 Agent 配置和认证信息。首次受保护启动时，如果没有有效的 CA 证书/密钥对，智安盾会在 `~/.finsafe/mitm/ca.crt` 创建检查 CA，并在 `~/.finsafe/mitm/ca.key` 保存私钥。受保护进程会通过常见客户端信任环境变量获得 CA 证书；Agent 无权读取私钥。请确保 `HOME` 指向拥有该 Agent 配置的同一账户。不要分发或暴露私钥。此 CA 用于智安盾本机检查连接，并非上游信任证书包。

为检查内容，受保护启动会把出站流量导向本地代理并尝试进行 TLS 检查。代理无法检查的请求（例如使用证书固定的客户端或不支持的协议）不具备内容级防护。请阅读下方覆盖范围和平台限制；成功启动不代表每个请求都已检查。

受保护 Agent 快捷命令目前不提供 dry-run。`finsafe self-confine --dry-run` 可以检查通用策略，但不会复现快捷命令的 `host` + 隐私防护代理配置，因此其输出不能证明受保护 Agent 的代理或检查 CA 已配置。可使用下文的 `finsafe privacy verify` 检查本机代理/过滤器；它不是 Agent 端到端测试。

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

图片验证需要安装并由智安盾找到可选的 `finsafe-pii-detector` 可执行文件和签名 OCR 模型。缺少这些组件时，该命令不能证明 OCR 防护有效。成功结果会报告类别/动作及 `sample_forwarded_unchanged: false`；验证只使用本机回环 Mock。

图片验证器接受最大 1 MiB 的样本。参考检测器对图像尺寸和推理设有上限。OCR 不保证识别所有图片、语言、方向、文档类型或图像质量；当前不解析 PDF/Office 文档。当前不支持通过该检测器在 Windows 上验证图片。

## 5. `pii` 与 `privacy` 的区别

两个命令组服务于不同工作流：

- **`finsafe pii detect --text …` / `--file …`** 在本机扫描文本类别；不扫描图片，也不测试出站代理。
- **`finsafe privacy verify --file …` / `--image …`** 使用回环 Mock 测试隐私过滤器的改写/阻止路径；不会启动 Agent，也不能证明该 Agent 的所有流量均受覆盖。
- **`finsafe pii placeholder`** 与 **`finsafe pii approvals`** 是供共享智安盾进程内状态的配合型宿主代码使用的接口。单独运行这些 CLI 命令不会连接到另一个正在运行的 Agent 代理状态。它们不是独立的 FinClaw Hook 或审批界面。

## 覆盖范围与限制

只有当请求经过智安盾代理、TLS 可检查且载荷格式受支持时，隐私防护才能检查内容。证书固定、不可见流量、不支持的协议以及绕过代理的流量，都可能降低或失去内容级覆盖。具体部署必须通过智安盾沙箱/网络边界防止绕过。

内置检测器使用模式和校验规则识别受支持的类别。可选 NER/OCR 可扩大检测范围，但不意味着检测完整。Agent、服务商、平台和图片的实测覆盖范围有限；不能根据成功启动或验证就推断为普遍覆盖。FinClaw 可选的 prompt/tool Hook 属于单独集成，运行 `finsafe finclaw` 不会自动启用这些 Hook。

另请参阅：[Agent 沙箱指南](./agent-sandbox-guide-zh.md) · [策略字段速查](./POLICY-QUICKREF-zh.md) · [隐私防护示例说明](../examples/privacy-guard/README.md)。
