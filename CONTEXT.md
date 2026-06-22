# 缺失文件扫描看板（Missing File Scan Dashboard）

展示公司各软件组件「缺失文件扫描」结果的看板：每个软件组件按要求应被编码规范等扫描工具覆盖，扫描工具可能漏扫部分文件；本看板比对扫描结果与组件文件清单，呈现"未被扫描覆盖"的文件情况，帮助快速定位问题。

## Language

### 核心实体

**Task**:
一次缺失文件扫描任务的定义，由七个维度唯一定位：扫描版本、产品、组件组名、语言、源码类型、数据类型、工具。`is_active` 标记是否纳入看板查询。
_Avoid_: job, scan, check

**Summary**:
一个 Task 当次扫描的结果汇总，持有各类文件计数（通过 / 缺失 / 失败 / 逾期 / 重映射 / 屏蔽）、报告链接与扫描时间。一个 Task 对应一份当前 Summary（demo 阶段 1:1）。
_Avoid_: result, report, statistics

**Missing file**:
一份被判定为"未按要求被扫描覆盖"的文件记录，挂属于某个 Summary。`status` 取 `missing` / `failed` / `remapped` / `shielded` 四态之一——**没有 `passed`，通过的文件不进此表**。
_Avoid_: file, issue, violation

### 聚合与分组

**Group**:
看板的聚合视图，**不是实体表**。由 Task 的六个维度——扫描版本、产品、组件组名、语言、源码类型、数据类型（**不含工具**）——组合而成的自然键；同一 Group 下按工具分成多份 Summary。
_Avoid_: category, cluster, bucket

**group_name**:
Task 的一个维度字段，软件组件的组织分组名称（如「核心网」「传输」）。是 Group 六维之一，**不要与 Group 混淆**——Group 是六维聚合，group_name 只是其中一维。
_Avoid_: team, module

**Sub-group**:
组件组下更细的划分。在数据模型里是 `missing_file.sub_group` 字段——一份缺失文件按文件路径归入的子分组标签，**可为空**（表示该组件组无子分组结构）。接口中的 `sub_groups[]` 由 Missing file 按 Sub-group 聚合派生。
_Avoid_: subgroup（连写）, sub-team, sub-module
