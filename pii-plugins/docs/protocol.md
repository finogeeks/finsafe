# Plugin protocol v1

FinShield first parses the model API request and selects the current input unit.
It sends selected text to the plugin through a local named pipe. The plugin does
not need to implement OpenAI Chat Completions or Anthropic Messages parsing.

~~~mermaid
flowchart LR
    A[Model API request] --> B[FinShield selects current input]
    B --> C[Plugin request]
    C --> D[Plugin findings and edits]
    D --> E[FinShield applies permitted edits to source fields]
~~~

## Request

Each frame is four bytes of unsigned big-endian payload length, then that many
bytes of UTF-8 JSON. The limit is 16 MiB. The SDK handles framing and echoes the
version and request ID; the callback receives the segments.

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

The standalone page sends one user segment. A production user-message call can
contain several user segments when its content has multiple text blocks. A tool-result call can have
several segments: assistant text, reasoning text, tool argument strings, and
one or more tool result texts. Segment IDs are unique within the request;
their order and values must not be treated as persistent conversation IDs.

The role is the original message role, such as user, assistant or tool.
Version 1 has no field_kind, tool name, tool_call_id, conversation ID or full
original request in the plugin payload. For example, the assistant segment
above is an argument string; role alone does not identify which assistant
field it came from. The host keeps the source mapping privately. A plugin
processes each supplied segment and returns its segment ID.

## Current input and tools

For Chat Completions, when the last message is user, the host selects that
message's supported text fields. When the request ends with tool messages,
it selects the trailing tool results and their immediately preceding assistant
message, including its supported reasoning and argument text. It does not
rescan earlier user/assistant history.

For example, a model request can contain:

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

This produces the plugin request shown above. The first user instruction remains
in the model request but is outside this call's current input unit.

Anthropic Messages tool_result text is normalized into tool segments too.
Simple Messages current text supports rewriting. Complex Messages tool-result
and thinking source mappings do not yet support rewriting; a returned edit
fails validation rather than modifying another field. Chat Completions tool
result and argument string mappings support rewriting.

Only text present in the intercepted outbound model request can be inspected.
Local file reads that are never sent to the model are not observed by this
plugin. Images, binary attachments and opaque blocks are not decoded or OCRed.

## Response

For the request above, the example redactor returns:

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

Finding offsets are half-open UTF-8 byte ranges into the original segment.
An edit contains the whole replacement segment, not a patch or a whole model
request. Omitted edits keep the original text. Multiple IDs in one segment
produce multiple findings and one combined edit. Multiple segments can each
have an edit. IDs, role, order and surrounding JSON stay under host ownership.

Empty findings/edits mean successful checking with no result. output: null
means processing failed. Invalid version, correlation, framing, ranges or
segment references are errors. FinShield applies valid edits only when
allow_rewrite is enabled and the existing finding policy permits forwarding.

## What the pages test

The public developer page treats the entered text as a user message. It creates
a one-segment plugin request and displays the returned result and preview. It
does not test the model API parser or forward a request to a model.

The private Core integration page wraps the entered user/tool text in a real
Chat Completions request, sends it through the production parser and proxy,
then shows the payload received by an owned local receiver. No external model
service is contacted. This stage checks selection, mapping and actual delivery.
