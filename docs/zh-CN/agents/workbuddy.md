# WorkBuddy 桌面接入（Windows）

[English](../../en/agents/workbuddy.md) · [Agent 接入](README.md)

FinShield 为 Windows x64 上的 WorkBuddy 提供受保护的桌面启动入口。WorkBuddy 继续使用自己的账号、模型和任务界面；FinShield 按选定授权与配置约束执行路径。

## 使用条件

- 单独安装 WorkBuddy 并完成登录。
- 按[安装指南](../getting-started/install.md#windows)安装 Windows FinShield。
- 在[兼容矩阵](compatibility.md)中核对所交付版本和形态。本指南使用 FinShield 桌面入口，不要求安装 WorkBuddy 插件。

## 准备权限

1. 提前保存正在进行的 WorkBuddy 任务，再进行准备或应用替换。
2. 打开 FinShield 悬浮控件；显示“待准备”时，选择“开始准备”。
3. 在辅助控制台检查请求的访问范围；需要时完成 Windows 授权。
4. 在控制台确认 WorkBuddy 安装目录。自动发现的目录无效时，改为实际安装位置。
5. 等待“智能体待命”后再启动 WorkBuddy。

## 启动与使用

1. 展开悬浮控件的智能体列表，选择 WorkBuddy。
2. 通过 FinShield 启动入口运行，等待确认运行状态。
3. 在专用测试工作区开始任务；之后再次选择运行中的智能体，可打开已有实例。

安装、准备与受保护运行是不同状态。直接从 WorkBuddy 原厂快捷方式打开窗口，不能据此证明 FinShield 保护已生效。

## 验证保护

按[授权范围验证](../getting-started/install.md#验证授权范围)操作：先在可写目录创建并读取测试文件，再检查已设为只读及明确禁止访问的目录。核对工具结果与真实文件内容，不能把模型口头拒绝当作防护证据。

公开对照案例与测试条件见 [Safety Arena](https://safety.finaios.ai/)，结果只对应所记录的版本、配置和场景。

## 常见问题

- **未发现 WorkBuddy 或路径无效：** 在控制台检查实际安装目录。
- **一直显示待准备：** 完成准备并查看授权操作的实际结果。
- **窗口已打开，但不确定是否受保护：** 核对所选启动入口和实际进程状态，再执行允许与拒绝两类文件测试。
- **任务被拦截：** 先检查选定目录及授权范围，再使用测试数据验证。

## 更新与停用

按[升级与卸载](../getting-started/install.md#升级与卸载)处理，并提前保存任务。FinShield 的更新、移除与 WorkBuddy 自身的更新是不同操作；变更后重新核对准备状态和受保护启动。

## 相关资料

- [Windows 防护能力](../overview/windows.md)
- [兼容矩阵](compatibility.md)
- [安装与验证](../getting-started/install.md)
