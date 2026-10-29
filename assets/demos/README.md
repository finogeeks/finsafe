# README demo excerpts / README 演示素材

These GIFs are edited excerpts of recordings published in the [FinSafe Safety Arena](https://finsafe-safety-arena.finogeeks.club/#overview). The original test product was named FinSafe, version **0.9.79**, on Windows with DSH. Original footage retains that name. No new Agent or system test was run to produce these assets.

这些 GIF 来自案例站已公开的实测录像，仅作节选展示。本次没有重新运行攻击、操作系统设置或执行案例提示词。

| GIF | Case | Ordinary-group preview range | Protected-group preview range | Framing |
| --- | --- | --- | --- | --- |
| [Window storm](window-storm.gif) | [UI-21](https://finsafe-safety-arena.finogeeks.club/cases/UI-21/index.html), 2026-10-26 | 8–12 s | 0–4 s | Top 1920×800 area; omits an unrelated desktop notification below the crop |
| [Window shaking](window-shake.gif) | [UI-11](https://finsafe-safety-arena.finogeeks.club/cases/UI-11/index.html), 2026-10-24 | 12–16 s | 0–4 s | Full preview frame |
| [Clipboard](clipboard.gif) | [UI-10](https://finsafe-safety-arena.finogeeks.club/cases/UI-10/index.html), 2026-10-27 | 27–31 s | 140–144 s | Observation panel: x=980, y=140, width=940, height=650 |

Ranges refer to the case site's **published preview MP4s**, not the original full-recording timeline. Each output loops a four-second excerpt at approximately 8 frames per second. The two columns are separate runs, selected from different moments; they are **not synchronized**. UI-21/UI-11's protected previews already contain only the final four seconds of their respective source recordings.

时间均相对于案例页的预览 MP4。左右是两次独立实验的节选，起点不同，不能按左右同一帧推断同时发生的事件。UI-21 与 UI-11 的保护组预览本身仅展示结束前四秒；本 GIF 没有把它扩充成完整过程录像。

Editing consists of time selection, the disclosed crops, scaling, palette reduction, and added comparison labels. No window movements, clipboard values, refusal dialogs, or Agent results were generated or inserted. The clipboard excerpt enlarges the independent observation panel so the copied-text difference remains readable.

制作仅包含截取、上述裁剪、缩放、GIF 调色与标题标注，没有补画窗口运动、篡改剪贴板内容或伪造拒绝结果。完整请求、工具结果和独立观测应以对应案例页为准。

The cases have different confinement settings. In particular, UI-21 demonstrates that a private-desktop window storm did not reach the user's desktop, even though target APIs reported success. It does not establish that every GUI launch uses a private desktop or that all window-creation calls are denied. WorkBuddy's interactive GUI configuration differs from these private-desktop tests.

[sources.json](sources.json) records source URLs, input hashes, time ranges, crops, dimensions, and output hashes for checking these edits.
