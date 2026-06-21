## 缺失文件扫描结果看板

用于显示缺失文件扫描结果的看板，帮助用户快速了解扫描结果和缺失文件的情况。

### 缺失文件检查

什么是缺失文件检查?

所有软件组件日常开发和对外发布过程都需要进行编码规范, 安全检查, 性能检查等多项扫描检查。我们公司通过自研工具实现这些检查。但是由于扫描工具扫描过程中可能存在一些问题，导致部分文件未被扫描到，或者扫描结果不完整。为了确保每个软件组件的文件按照要求被编码规范检查工程扫描到，我们需要进行缺失文件检查。检查方法是通过扫描结果和组件文件列表进行比对，找出未被扫描到的文件，并将其记录在缺失文件检查结果中。

公司内部有多个软件产品， 每个软件产品由若干软件组件组成。需要对所有软件组件进行缺失文件扫描，确保每个组件的文件按照要求被编码规范检查工程扫描到。

### 缺失文件扫描结果看板

展示每天的缺失文件扫描结果，帮助用户快速了解扫描结果和缺失文件的情况。看板主要包括以下内容：

- 缺失文件扫描结果总览：展示每天的缺失文件扫描结果，包括扫描总数、缺失文件数量、缺失文件占比等信息。
- 缺失文件扫描结果详情：展示每天的缺失文件扫描结果详情，包括缺失文件列表、缺失文件所在组件、缺失文件类型等信息。
- 子分组数据：部分组件存在子分组， 看板需要展示子分组数据，帮助用户了解子分组的缺失文件情况。


### 数据模型

1. task
   - task_id: 任务ID
   - search_version: 扫描版本 (26B/27A/27B/28A/28B/29A/29B)
   - product: 产品名称 (LTE/5G/IAB/NTN)
   - group_name: 组件组名称
   - lan: 编程语言
   - source_type: 源码类型（self_dev/self_tool/adapt/bsdiy/risk_mbts）
   - data_type: 数据类型（版本级/全量源码级）
   - tool_name: 工具名称（缺失文件扫描工具）
   - is_active: 是否启用（0：禁用，1：启用）

2. summary
   - summary_id: 汇总ID
   - task_id: 任务ID
   - passed_count: 通过文件数量
   - missing_count: 缺失文件数量
   - failed_count: 失败文件数量
   - overdue_missing_count: 逾期缺失文件数量
   - overdue_failed_count: 逾期失败文件数量
   - remapped_count: 重映射文件数量
   - shielded_count: 屏蔽文件数量
   - report_url: 报告URL
   - scan_time: 工程扫描时间
   - create_time: 数据刷新时间
   - is_active: 是否启用（0：禁用，1：启用）

3. missing_file
    - missing_file_id: 缺失文件ID
    - summary_id: 汇总ID
    - file_name: 文件名称
    - status: 文件状态（missing/failed/remapped/shielded）
    - first_detected_time: 首次发现时间
    - is_overdue: 是否逾期（0：否，1：是）

### 后端接口

#### 获取缺失文件扫描结果总览

返回 task 表中所有启用的任务的缺失文件扫描结果总览信息。多个工具任务根据 search_version、product、group_name、lan、source_type、data_type 进行区分。返回每个工具的缺失文件数据，包括 missing_count、failed_count、overdue_missing_count、overdue_failed_count、remapped_count、shielded_count 等信息。

- URL: /api/missing-file/summary
- Method: GET
- Query Parameters:
  - search_version: 扫描版本 (26B/27A/27B/28A/28B/29A/29B)
  - product: 产品名称 (LTE/5G/IAB/NTN)
  - group_name: 组件组名称
  - lan: 编程语言
  - source_type: 源码类型（self_dev/self_tool/adapt/bsdiy/risk_mbts）
  - data_type: 数据类型（版本级/全量源码级
  - tool_name: 工具名称（缺失文件扫描工具）
- Response:
  - 200 OK
  - Body:
    ```json
    {
      "code": 0,
      "message": "success",
      "data": [
        {
          "search_version": "29A",
          "product": "5G",
          "group_name": "核心网",
          "lan": "C++",
          "source_type": "self_dev",
          "data_type": "版本级",
          "summarys": [
            {
              "summary_id": 1,
              "tool_name": "codestyle",
              "passed_count": 1000,
              "missing_count": 10,
              "failed_count": 5,
              "overdue_missing_count": 2,
              "overdue_failed_count": 1,
              "remapped_count": 3,
              "shielded_count": 4,
              "report_url": "http://example.com/report/1",
              "scan_time": "2024-06-01T12:00:00Z",
              "create_time": "2024-06-01T12:00:00Z",
              "sub_groups": [
                {
                  "sub_group_name": "子分组A",
                  "passed_count": 500,
                  "missing_count": 5,
                  "failed_count": 2,
                  "overdue_missing_count": 1,
                  "overdue_failed_count": 0,
                  "remapped_count": 1,
                  "shielded_count": 2
                },
                {
                  "sub_group_name": "子分组B",
                  "passed_count": 500,
                  "missing_count": 5,
                  "failed_count": 3,
                  "overdue_missing_count": 1,
                  "overdue_failed_count": 1,
                  "remapped_count": 2,
                  "shielded_count": 2
                }
              ]
            },
            {
              "summary_id": 12,
              "tool_name": "secbrella",
              "passed_count": 200,
              "missing_count": 500,
              "failed_count": 421,
              "overdue_missing_count": 2,
              "overdue_failed_count": 1,
              "remapped_count": 32,
              "shielded_count": 41,
              "report_url": "http://example.com/report/2",
              "scan_time": "2024-06-02T12:00:00Z",
              "create_time": "2024-06-03T12:00:00Z",
              "sub_groups": [
                {
                  "sub_group_name": "子分组C",
                  "passed_count": 100,
                  "missing_count": 250,
                  "failed_count": 210,
                  "overdue_missing_count": 1,
                  "overdue_failed_count": 0,
                  "remapped_count": 15,
                  "shielded_count": 20
                },
                {
                  "sub_group_name": "子分组D",
                  "passed_count": 100,
                  "missing_count": 250,
                  "failed_count": 211,
                  "overdue_missing_count": 1,
                  "overdue_failed_count": 1,
                  "remapped_count": 17,
                  "shielded_count": 21
                }
              ]
            },
            ...
          ],
        },
        ...
      ]
    }
    ```







