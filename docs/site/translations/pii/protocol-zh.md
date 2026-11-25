# 插件协议 v1

[English](https://github.com/finogeeks/finsafe/blob/main/pii-plugins/docs/protocol.md)

FinShield 先解析模型 API 请求，并选择当前输入单元。随后通过本地命名管道将选定文本发送给插件。插件不需要实现 OpenAI Chat Completions 或 Anthropic Messages 解析。

~~~mermaid
flowchart LR
    A[模型 API 请求] --> B[FinShield 选择当前输入]
    B --> C[插件请求]
    C --> D[插件检测结果与修改]
    D --> E[FinShield 将允许的修改应用到原始字段]
~~~

## 请求

每帧由四字节无符号大端载荷长度及对应长度的 UTF-8 JSON 组成，上限为 16 MiB。SDK 处理分帧，并回传版本号与请求 ID；回调函数接收文本片段。

~~~json
{
  "schema_version": 1,
  "request_id": "request-123",
  "segments": [
    {"id": "s0", "role": "assistant", "text": "{\"path\":\"customer.txt\"}"},
    {"id": "s1", "role": "tool", "text": "File says: 11010119900101123X"}
  ]
}
~~~

独立测试页面发送一个用户文本片段。生产环境中的用户消息含多个文本块时，一次调用可包含多个用户片段。工具结果调用可包含多个片段：助手文本、推理文本、工具参数字符串，以及一个或多个工具结果文本。片段 ID 在单次请求内唯一；不得将其顺序或值作为持久会话 ID。

`role` 是原始消息角色，例如 `user`、`assistant` 或 `tool`。版本 1 的插件载荷不含 `field_kind`、工具名称、`tool_call_id`、会话 ID 或完整原始请求。例如，上面的助手片段是一个参数字符串；仅凭角色无法确定它来自哪个助手字段。宿主自行保留源字段映射。插件处理所提供的片段，并返回对应片段 ID。

## 当前输入与工具

对 Chat Completions，如果最后一条消息是用户消息，宿主选择该消息中支持的文本字段。如果请求以工具消息结束，则选择末尾的工具结果及紧邻其前的助手消息，包括其中支持的推理和参数文本。它不会重新扫描更早的用户或助手历史。

例如，模型请求可以包含：

~~~json
{
  "model": "local-test",
  "messages": [
    {"role": "user", "content": "Read customer.txt"},
    {
      "role": "assistant",
      "tool_calls": [{
        "id": "read-1",
        "type": "function",
        "function": {"name": "read_file", "arguments": "{\"path\":\"customer.txt\"}"}
      }]
    },
    {"role": "tool", "tool_call_id": "read-1", "content": "File says: 11010119900101123X"}
  ]
}
~~~

该请求产生上面的插件请求。第一条用户指令仍保留在模型请求中，但不属于本次调用的当前输入单元。

Anthropic Messages 的 `tool_result` 文本也会归一化为工具片段。简单 Messages 当前文本支持改写。复杂 Messages 工具结果及思考内容的源字段映射尚不支持改写；返回的修改会校验失败，不会误改其他字段。Chat Completions 的工具结果及参数字符串映射支持改写。

插件只能检查被拦截的出站模型请求中实际存在的文本。未发送给模型的本地文件读取不在插件观察范围内。图片、二进制附件及不透明内容块不会被解码或执行 OCR。

## 响应

对于上面的请求，示例脱敏插件返回：

~~~json
{
  "schema_version": 1,
  "request_id": "request-123",
  "output": {
    "findings": [{
      "segment_id": "s1",
      "category": "example.cn_resident_id",
      "start": 11,
      "end": 29,
      "confidence": 1.0
    }],
    "edits": [{"segment_id": "s1", "text": "File says: 110XXX123X"}]
  }
}
~~~

检测结果的偏移量是原始片段中的半开 UTF-8 字节区间。每条修改包含整个替换片段，不是补丁，也不是整个模型请求。省略修改时保留原始文本。同一片段中的多个身份证号产生多条检测结果及一条合并修改。多个片段可各有一条修改。ID、角色、顺序及外围 JSON 仍由宿主管理。

空的 `findings`／`edits` 表示检查成功且没有结果。`output: null` 表示处理失败。版本、请求关联、分帧、范围或片段引用无效都属于错误。只有启用 `allow_rewrite`，且现有检测结果策略允许转发时，FinShield 才应用有效修改。

## 页面验证范围

公开开发者页面将输入文本视为用户消息，创建只有一个片段的插件请求，并显示返回结果及预览。它不验证模型 API 解析器，也不向模型转发请求。

私有 Core 集成页面将输入的用户／工具文本封装为真实 Chat Completions 请求，经生产解析器与代理处理，再显示自有本地接收端收到的载荷。它不联系外部模型服务。此阶段检查输入选择、源字段映射及实际交付。
