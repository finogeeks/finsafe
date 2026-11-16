# 身份证脱敏插件接入 FinSAFE

个人版包含插件加载能力，插件 EXE 单独安装。插件包由
`finsafe-pii-redactor.exe`、`network-policy.example.yaml`、`apply_network_policy.py` 三个核心文件组成，
再附中英文说明，不需要 SDK 或调试网页。
示例把 `11010119900101123X` 改成 `110XXX123X`；只做简单格式正则，不验证日期或校验码。

1. 使用包含外部 PII 插件支持的 FinSAFE 版本。将三个文件放在同一个固定目录。
2. 在这个目录运行下面的脚本。它会定位包内 EXE 的绝对路径，不需要手填插件位置。

```powershell
python -m pip install PyYAML
python .\apply_network_policy.py
```

指定其他安装位置或开发版本时，可传入 `--finsafe` 和 `--config-dir`。
脚本需要已安装的 FinSAFE、Python 和 PyYAML。它是普通 Python 文件，方便开发者直接改。
脚本自动备份活动配置目录中的 `candidate.yaml` 和 `effective.yaml`。
   默认目录是 `C:\ProgramData\FinSAFE\config`；若安装选择了其他目录，以活动目录为准。
3. 脚本用 `network-policy.example.yaml` 中的完整 `network` 替换 `candidate.yaml` 的 `policy.network`。
   文件里的 `network:` 要放在现有 `policy:` 下，多缩进两个空格。
   保留 `policy.filesystem`、`policy.resources`、安全域及其他配置，不要覆盖整个 candidate。
4. 下面是模板中的完整 `network`；脚本会把相对的 `executable` 替换成包内 EXE 的绝对路径：

```yaml
network:
  mode: proxy
  tls_terminate: true
  endpoints: ["*.*"]
  llm_content:
    retention: true
    max_body_bytes: 16777216
    plugins:
      - id: resident-id-mask
        detector: external
        on_finding: warning
        executable: finsafe-pii-redactor.exe
        timeout_ms: 2000
        allow_rewrite: true
```

`mode: proxy` 让请求经过 FinSAFE 代理；`tls_terminate: true` 开启 HTTPS 模型请求的内容检查。
`endpoints` 是允许访问的目标，`"*.*"` 沿用个人版默认值；已有更严格的范围时，应保留原来的列表。
模板保留原文留存和 16 MiB 请求体上限，第一项选择这个外部插件。

**只执行 `plugins` 的第一项。** 即使配置了第二项，也不会调用它；第一项未命中或失败时同样不会转到第二项。
后续条目不会创建 worker 或启动 EXE。若要改用内置 PII，将第一项替换为：

```yaml
plugins:
  - id: builtin-pii
    detector: pii
    on_finding: warning
    categories: [global.email, cn.resident_id]
```

所选条目包含 `id`、`detector`、`on_finding`。
内置 PII 使用 `categories`，外部插件使用 `executable`、`timeout_ms`、`allow_rewrite`。
脚本只解析第一项外部插件的相对 EXE 路径，绝对路径保持原样。

内置与外部插件共用：解压 → 调用 → 回填文本 → 按原编码重新压缩 → 发送。
原请求是 gzip，无论是否改写，处理后仍重新压缩为 gzip；压缩失败返回 HTTP 错误，不丢弃改写后发送原文。
命中时 `warning` 允许发送，`approval_required` 等待原有审批，`block` 或审批拒绝停止发送。

5. 脚本使用 PyYAML 读取模板，替换 `candidate.policy.network`，把两个旧配置复制为
   `candidate.yaml.bak`、`effective.yaml.bak`，然后保存 candidate。
   再调用现有 `config materialize --on-conflict replace` 生成 effective，最后调用现有 `app tls-inspector --refresh`。

遇到错误直接抛出并停止，开发者自行修正，不做自动重试、回滚或授权，也不增加 FinSAFE 配置 API。
如果保存 candidate 后生成 effective 失败，candidate 已改变、effective 保持旧内容；修正后重跑，
或先恢复 `.bak`。每次运行会覆盖上一次的 `.bak`。
原有网络权限范围不变时，仅添加或修改 PII 插件配置不会改变 Windows 权限授权摘要。
如果启用原先未开启的 TLS 检查或扩大网络范围，需要按 FinSAFE 原有流程授权，脚本不处理授权。
只改 candidate 不会让运行中的检查器生效；生成 effective 并刷新后才应用新设置。
检查器没有运行时，刷新会报告该状态，之后正常启动受保护应用即可加载新配置。

`id` 是检测器名称，`executable` 是 EXE 路径，`timeout_ms` 是启动／调用超时，
`allow_rewrite: true` 允许改写文本。FinSAFE 自动启动插件并处理 IPC，不要手动运行 EXE。

从 FinSAFE 保护的应用发送合成测试文本，检查实际发给模型的内容已脱敏。
要测试“脱敏后继续发送”，这个外部插件项应使用 `on_finding: warning`；`block` 会拦截命中请求，
`approval_required` 会进入原有审批流程。插件只返回检测和改写结果，不决定审批。
用户输入框仍可能显示原文，应核对实际转发的数据。测试普通文本、多号码及工具返回文本。

停用时只移除 `plugins` 中这个插件的条目，再生成并刷新配置，若仍有其他条目，新的第一项会成为生效插件。
开发者从完整 `pii-plugins` 根目录运行 `cargo build --release -p finsafe-pii-redactor --locked`
即可编译这个示例。
