## 缺失文件看板页面

我们需要一个看板来呈现公司各软件组件「缺失文件扫描」的结果——把扫描工具的结果与组件文件清单比对，找出未被扫描覆盖的文件，帮助快速定位问题。

### 核心诉求

1. **组件用户**：快速定位缺失文件，了解缺失文件的数量、类型、扫描工具覆盖情况。
2. **管理员**：
   - 了解缺失文件的整体情况，发现扫描工具漏扫问题。
   - 了解缺失文件的分布情况，发现组件组组织结构问题。

### 数据模型

#### Task

- 表示缺失文件扫描任务配置
- 字段:
   - id: 任务唯一标识
   - search_version: 组件版本号
   - group_name: 组件组名称
   - product: 产品名称 (如: 4G/5G/IAB/EMRU)
   - source_type: 代码类型(如: self_dev/self_tool/adapt/risk_mbts/bsdiy)
   - lan: 编程语言(如: clike/python/lua)
   - data_type: 数据类型(如: 版本级/全量源码级)
   - tool_type: 扫描工具类型(如: codetyle/codemars/secbrella/aps-molint/cooddy/binexplorer/sai/secoptions)
   - is_active: 是否启用, 1 表示启用, 0 表示禁用

#### Summary

- 表示根据 task 执行缺失文件扫描的一次结果汇总
- 字段:
   - id: 汇总唯一标识
   - task_id: 关联的 task id
   - passed_count: 扫描通过文件数量
   - missed_count: 缺失文件数量
   - failed_count: 扫描失败文件数量
   - expired_missed_count: 过期缺失文件数量
   - expired_failed_count: 过期扫描失败文件数量
   - shileded_count: 屏蔽文件数量
   - remapped_count: 重映射文件数量
   - start_time: 扫描工程开始时间
   - created_at: 扫描结果创建时间
   - report_url: 报告链接
   - is_active: 实现软删除, 1 表示最近一次扫描结果, 0 表示历史扫描结果
- 关系
   - task: belongs_to Task

#### Missing file

- 表示缺失文件扫描结果中的缺失文件
- 字段:
   - id: 缺失文件唯一标识
   - summary_id: 关联的 summary id
   - file_path: 缺失文件路径
   - status: 缺失文件状态(如: missed/failed/shielded/remapped)
   - is_expired: 是否过期, 1 表示过期, 0 表示未过期
   - whitebox_created_at: 首次发现时间
   - ownership: 文件归属子分组(如: BSP/TRAN/APP/TEST/TOOLS)
- 关系
   - summary: belongs_to Summary

### 页面结构

#### 过滤控制

- search_version 过滤:
   - 组件版本号下拉选择框, 默认选中最新版本号
- group_name 过滤:
   - 组件组名称下拉选择框, 默认选中全部组件组
- product 过滤:
   - 产品名称下拉选择框, 默认选中全部产品
- source_type 过滤:
   - 代码类型下拉选择框, 默认选中全部代码类型
- lan 过滤:
   - 编程语言下拉选择框, 默认选中全部编程语言
- data_type 过滤:
   - 数据类型下拉选择框, 默认选中全部数据类型
- tool_type 过滤(可选):
   - 扫描工具类型下拉选择框, 默认选中全部扫描工具类型
- show_issue_only 过滤(可选):
   - 是否只显示有缺失文件(missed_count > 0 or failed_count > 0)的扫描结果, 默认选中「否」
- show_expired_only 过滤(可选):
   - 是否只显示有过期缺失文件(expired_missed_count > 0 or expired_failed_count > 0)的扫描结果, 默认选中「否」
- 结果不要分页显示

#### 总览

- 页面顶部过滤后的汇总信息, 包括:
   - 任务数
   - 没有任何扫描结果的任务数
   - 有缺失文件的任务数
   - 有过期缺失文件的任务数

#### 详情

- 任务信息
   - 组件版本号
   - 组件组名称
   - 产品名称
   - 代码类型
   - 编程语言
   - 数据类型
   - 扫描工具类型
   - 扫描开始时间
   - 扫描结果创建时间
   - 详情报告链接
- 扫描结果状态
   - 扫描通过文件数量
   - 缺失文件数量
   - 扫描失败文件数量
   - 过期缺失文件数量
   - 过期扫描失败文件数量
   - 屏蔽文件数量
   - 重映射文件数量
   - 支持点击数量查询对应详情数据
- 子分组
   - 子分组名称
   - 缺失文件数量
   - 扫描失败文件数量
   - 过期缺失文件数量
   - 过期扫描失败文件数量
   - 支持点击数量查询对应详情数据

### 痛点

- 重复数据多
   -  task `search_version`、`product`、`group_name`、`lan`、`source_type`、`data_type`、`tool_name` 相同的情况下, 通常都有 `tool_type` 不同的 8 个相似的任务配置。显示结果看起来重复的信息比较多


