# FinSAFE 沙箱管理模型

**English:** [sandbox-management-model.md](./sandbox-management-model.md)

FinSAFE 托管模式建议用五个概念来理解：

1. **Sandbox policy（沙箱策略）** — 单个允许的 agent 或程序可访问哪些资源。
2. **Bundle（策略包）** — 面向设备队列的、已签名且带版本号的策略集合。
3. **Tag / fact（标签 / 事实）** — 用于构建设备队列的可信元数据。
4. **Group（分组）** — 由确定性规则定义的设备队列。
5. **Assignment（分配）** — 将一份 Bundle 应用到某个 Group，并附带 rollout 控制。

## Sandbox policy（沙箱策略）

沙箱策略定义单个 agent 或程序在运行时可访问的资源：文件系统与网络策略、资源上限、stdio 行为、审计要求及平台相关强制项。管理员应思考：「Hermes 运行时，Hermes 可以使用哪些资源？」

字段说明见 [POLICY-QUICKREF-zh.md](./POLICY-QUICKREF-zh.md)。在 **Linux/macOS** 上，编译器还会合并 **内置 deny-read 与受保护路径默认项**，除非策略显式关闭（`skip_default_deny_read`、`skip_default_protected_paths`）— 仅升级二进制、不重新发布 bundle 也可能改变桌面行为。见 [managed-mode-zh.md — 策略默认项](./managed-mode-zh.md#策略默认项舰队管理员)。

## Bundle（策略包）

Bundle 不是「一份 Hermes 策略」。Bundle 是匹配设备收到的**已签名策略集合**。Bundle 内部，FinSAFE 为所请求的程序精确选择一条沙箱策略。若无策略匹配，运行被拒绝；若多条策略匹配，Bundle 视为歧义并**失败关闭（fail closed）**。

示例 Bundle 内容：

- Hermes 标准策略
- Python 无网络策略
- Shell 诊断策略

Bundle 编写回答：「这份已签名策略集合里有哪些策略？」在管理 UI 的 **策略包** 页或通过 `finsafe-bundlectl bundle publish` 发布 Bundle **内容**。Bundle 发布**不决定**哪些设备收到该 Bundle——那是 **Assignment（分配）** 的职责。

## Tag / fact（标签与事实）

安全定向请使用 `admin:*` 标签，例如 `admin:department=finance` 或 `admin:agent=hermes`。这些标签由管理员、MDM 或可信库存集成分配，是策略定向的首选输入。

设备上报的事实（如 `device:os=macos`、`device:hostname`、`device:agent_version`）在 authority 将其视为已验证时可用于定向。在 **设备** 页或通过 MDM 集成打标签。

`observed:*` 事实（例如由遥测推导的健康状态、最后在线时间、拒绝率）用于仪表盘与调查，**不得**用于活跃的 Assignment 定向。动态遥测不应意外改变设备所处的安全策略。

## Group（分组）

Assignment 可用的分组使用**确定性规则**：所有必需谓词必须同时匹配，可添加直接排除项，OR 情况应拆分为独立分组。

示例规则（可读摘要）：

```text
admin:department=finance AND admin:agent=hermes AND device:os=macos AND NOT admin:cohort=blocked
```

JSON 规则使用 `all` 数组，每个子表达式都必须匹配。Assignment 定向支持的肯定谓词：

- `admin:*` 标签（必需形式：`admin:name=value`）
- authority 已验证的 `device:*` 事实
- `device_id`（最具体的定向输入）

否定谓词只能作为根 `all` 的直接 `not` 子项。Assignment 可用分组不允许嵌套布尔表达式和 `any`（OR）——请将 OR 拆分为独立 Group 或 Assignment。

在管理 UI **设置 → 设备分组** 中定义 Group。

## Assignment（分配）与 rollout

Assignment 将一份 Bundle 连接到一个 Group。**Rollout 属于 Assignment，不属于 Bundle。** Bundle 描述策略内容；Assignment 描述哪些设备收到该内容以及如何 rollout。

Assignment rollout 属性包括：

- **状态** — draft、previewed、active、paused、archived
- **百分比 rollout** — 可选；留空表示 100%
- **Rollout seed** — 与 device id 组合以形成稳定的百分比队列
- **开始与结束时间** — 可选 rollout 窗口

10% rollout 仅匹配稳定 rollout 队列中的设备；其余设备回退到更宽泛的匹配 Assignment，或收到 `no_assignment`。

**推荐流程：**

1. 用可信 `admin:*` 标签分类设备。
2. 用确定性规则定义可用于 Assignment 的 Group。
3. 编写并发布沙箱策略为已签名 Bundle。
4. 创建 Assignment，将 Bundle 关联到 Group。
5. 预览受影响设备，再激活 Assignment。

在管理 UI **Assignments（分配）** 页，或通过 `/v1/admin/assignments` 与 `/v1/admin/assignments/preview` 管理 Assignment。

当存在至少一条 active Assignment 时，`/v1/bundles/current` 通过 Assignment 解析有效 Bundle，而不再回退到「最新已发布 Bundle」。

## 冲突处理

若设备匹配多条 active Assignment，**最具体**的 Assignment 胜出。具体性按以下有序元组判定：

1. 精确 `device_id` 谓词数量
2. 必需 `admin:*` 谓词数量
3. 必需且 authority 已验证的 `device:*` 谓词数量
4. 其他肯定谓词数量

仅含否定谓词不增加具体性。若两条 Assignment 平局或无法比较，FinSAFE 阻止激活或以 `assignment_conflict` **失败关闭**。

若无 active Assignment 匹配设备（含 rollout 排除），authority 在 `/v1/bundles/current` 返回 `no_assignment`。

## 拒绝类别（目标模型）

| 类别 | 含义 |
|------|------|
| `no_assignment` | 无 active Assignment 匹配该设备。 |
| `assignment_conflict` | 多条 active Assignment 匹配且无确定性胜者。 |
| `no_program_policy` | 有效 Bundle 中无请求程序对应的沙箱策略。 |
| `program_policy_conflict` | 有效 Bundle 中多条沙箱策略匹配请求程序。 |

并非所有执行路径均已发出全部拒绝类别。请将下表视为管理员目标模型。

## 相关文档

- [admin-ui-zh.md](./admin-ui-zh.md) — Assignments 页、分组规则与管理 API
- [authority-deployment-zh.md](./authority-deployment-zh.md) — Bundle 发布与 Assignment API
- [managed-mode-zh.md](./managed-mode-zh.md) — agent、Bundle 与桌面强制
