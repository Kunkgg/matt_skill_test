# 缺失文件扫描结果看板 — 工程脚手架

Status: ready-for-agent

## Problem Statement

我们需要一个看板来呈现公司各软件组件「缺失文件扫描」的结果——把扫描工具的结果与组件文件清单比对，找出未被扫描覆盖的文件，帮助快速定位问题。但当前仓库是空工程：没有可运行的后端接口、没有前端页面，也没有测试与 Lint 工具链。在实现完整看板功能之前，我们需要先搭起一套工程脚手架——能跑通一个真实的后端总览接口（`/api/missing-file/summary`）和一个渲染该接口数据的前端 demo 页面，并且开发、测试、Lint 都能用一条命令驱动，让后续功能开发有一个干净、可验证的起点。

## Solution

采用 monorepo（见 `docs/adr/0001-monorepo.md`）搭建前后端分离的工程脚手架：

- **后端**：Python + Django + Django REST Framework，实现 `/api/missing-file/summary` 总览接口，dev/test 用 SQLite + seed 演示数据，prod 可切 MySQL。
- **前端**：Vue3 + Element Plus（JavaScript），一个渲染总览数据的 demo 页面。
- **顶层 `Makefile`** 统一编排开发、测试、Lint 命令；前后端同仓库、共享同一份接口契约，减少字段漂移。

数据模型与领域语言以 `CONTEXT.md` 为准（Task / Summary / Missing file / Group / group_name / Sub-group）。

## User Stories

1. 作为接手脚手架的工程师，我希望 clone 仓库后能用一条命令装好后端依赖，这样我能快速开始开发。
2. 作为工程师，我希望用一条命令启动后端开发服务器，这样我能调用 API 验证接口。
3. 作为工程师，我希望用一条命令启动前端开发服务器，这样我能看到 demo 页面。
4. 作为工程师，我希望用一条命令同时启动前后端开发服务器，这样我能端到端联调。
5. 作为工程师，我希望有一份 seed 命令灌入演示数据，这样我不必手动造数据就能看到看板效果。
6. 作为工程师，我希望用一条命令运行全部测试，这样我能确认改动没有破坏既有行为。
7. 作为工程师，我希望用一条命令运行 Lint，这样我能保持前后端代码风格一致。
8. 作为工程师，我希望测试和 Lint 同时覆盖前后端，这样两端质量都有保障。
9. 作为工程师，我希望 dev 用 SQLite、prod 用 MySQL 的切换只改配置不改代码，这样环境迁移没有额外负担。
10. 作为工程师，我希望数据库连接等配置通过环境变量注入，这样 secrets 不进代码库。
11. 作为工程师，我希望前端在 dev 环境跨域调用后端不被浏览器拦截，这样前后端分离开发顺畅。
12. 作为工程师，我希望所有接口统一在 `/api/` 前缀下，这样接口边界清晰。
13. 作为新人，我希望有顶层 `Makefile` 暴露常用命令，这样我不必猜测怎么跑项目。
14. 作为工程师，我希望 Task 与 Summary 在 demo 阶段保持 1:1，这样数据模型简单，但相关字段保留以备未来扩展为 1:N。
15. 作为看板用户，我希望调用总览接口能拿到所有启用任务（`is_active=1`）的聚合数据，这样我能了解整体缺失情况。
16. 作为看板用户，我希望数据按 Group（扫描版本、产品、组件组名、语言、源码类型、数据类型）聚合，这样我能定位到具体维度。
17. 作为看板用户，我希望每个 Group 下按工具（tool_name）分开看 Summary，这样我能区分不同扫描工具的结果。
18. 作为看板用户，我希望看到每个 Summary 的缺失、失败、逾期缺失、逾期失败、重映射、屏蔽计数，这样我能评估问题严重程度。
19. 作为看板用户，我希望逾期缺失和逾期失败有单独计数，这样我能优先处理超期问题。
20. 作为看板用户，我希望看到每个 Summary 的通过文件数和报告链接，这样我能评估覆盖率和跳转查看明细。
21. 作为看板用户，我希望有 Sub-group 维度的拆分，这样我能定位缺失集中在组件组的哪个子分组。
22. 作为看板用户，我希望无子分组的组件组返回空 `sub_groups`，这样我不会把它误读为"数据缺失"。
23. 作为看板用户，我希望 Sub-group 视图聚焦异常分布（不含通过数），这样我能快速定位问题子分组。
24. 作为看板用户，我希望禁用的任务不出现在看板中，这样我只看到当前活跃的扫描。
25. 作为看板用户，我希望前端 demo 页面能渲染总览数据，按 Group / Summary / Sub-group 分层展示，这样我能直观看到看板效果。
26. 作为工程师，我希望接口支持按七个维度（含工具）做可选过滤，这样看板未来能做筛选而无需改接口。

## Implementation Decisions

### 架构
- **monorepo**：`backend/`（Django）与 `frontend/`（Vue）同仓库，顶层 `Makefile` 编排。依据 ADR-0001。
- 顶层提供 `make dev`（同起前后端）/ `make test`（前后端测试）/ `make lint`（前后端 Lint）等目标。

### 后端
- 技术栈：Python + Django + Django REST Framework。
- 依赖管理：**uv**。
- Django 项目为单个 app：**dashboard**（Task / Summary / Missing file 的 model、serializer、view 都放这里，不过度拆分）。
- settings 分环境：用 **django-environ** 读 `.env`，`DATABASE_URL` 环境变量驱动数据库选择；`dj-database-url` 解析。dev/test 默认 SQLite，prod 指向 MySQL。
- MySQL 驱动 `mysqlclient` 仅作为 prod 依赖，dev/test 不安装。
- API 统一前缀 `/api/`，**不加版本号**（demo 阶段不搞 `/v1/`）。
- CORS：**django-cors-headers**，dev 允许前端开发服务器来源（如 `localhost:5173`）。
- 外层响应统一包装为 `{ code, message, data }`。

### 数据模型（三张表，术语见 CONTEXT.md）
- **Task**：`task_id`(PK)、`search_version`、`product`、`group_name`、`lan`、`source_type`、`data_type`、`tool_name`、`is_active`。
- **Summary**：`summary_id`(PK)、`task_id`(FK → Task)、`passed_count`、`missing_count`、`failed_count`、`overdue_missing_count`、`overdue_failed_count`、`remapped_count`、`shielded_count`、`report_url`、`scan_time`、`create_time`、`is_active`。
  - demo 阶段 Task → Summary 为 **1:1**：`task_id` 加唯一约束。`scan_time`/`create_time`/`is_active` 字段保留，未来切 1:N（多次扫描快照）只需放宽唯一约束 + 加查询过滤，不必重写 model。
- **Missing file**：`missing_file_id`(PK)、`summary_id`(FK → Summary)、`file_name`、`status`（`missing`/`failed`/`remapped`/`shielded` 四态，**无 `passed`**）、`first_detected_time`、`is_overdue`、`sub_group`（**可空**）。
  - 关键：`sub_group` 是 Missing file 的字段（**不是独立实体表**）。`status` 没有通过态——通过的文件不进此表。

### 接口契约：`GET /api/missing-file/summary`
- Query 参数（全部可选，做维度过滤）：`search_version`、`product`、`group_name`、`lan`、`source_type`、`data_type`、`tool_name`。
- 只返回 `Task.is_active = 1` 的任务。
- 响应 200，`data` 是 Group 聚合数组，形状（契约 schema，非实现）：
  ```json
  {
    "code": 0, "message": "success",
    "data": [
      {
        "search_version": "...", "product": "...", "group_name": "...",
        "lan": "...", "source_type": "...", "data_type": "...",
        "summarys": [
          {
            "summary_id": 1, "tool_name": "...",
            "passed_count": 0, "missing_count": 0, "failed_count": 0,
            "overdue_missing_count": 0, "overdue_failed_count": 0,
            "remapped_count": 0, "shielded_count": 0,
            "report_url": "...", "scan_time": "...", "create_time": "...",
            "sub_groups": [
              { "sub_group_name": "...",
                "missing_count": 0, "failed_count": 0,
                "overdue_missing_count": 0, "overdue_failed_count": 0,
                "remapped_count": 0, "shielded_count": 0 }
            ]
          }
        ]
      }
    ]
  }
  ```
- 契约要点（锁定 grilling 结论）：
  - 顶层 `data[]` 元素 = **Group**，由 Task 的六维（不含 `tool_name`）聚合而成。
  - `Group.summarys[]` 按 `tool_name` 区分，每个工具一个 Summary。
  - `sub_groups[]` 元素**只有 6 个 count，没有 `passed_count`**（passed 无法从 Missing file 聚合）。
  - 组件组无子分组结构 → `sub_groups = []`。

### 聚合逻辑（关键实现决策）
- Group = 按 `(search_version, product, group_name, lan, source_type, data_type)` 对 Task 分组；每组下挂该组所有（过滤后、启用的）Task 的 Summary，按 `tool_name` 排列。
- demo 阶段每个 Task 取其当前唯一 Summary（1:1）。
- `sub_groups[]` 由该 Summary 名下的 Missing file 按 `sub_group` 聚合各 count 派生。
- **Sub-group 完整清单（demo）**：硬编码在代码内的列表（demo 随机生成即可）。清单中的子分组即使本次 0 缺失也列入（count 全 0）；Task 无子分组结构（清单为空）→ `sub_groups = []`。
- **Sub-group 为空的 Missing file**（文件路径未能映射到子分组）：计入 Summary 总量，但不进入任何子分组桶（默认实现假设；见 Further Notes）。

### 前端
- 技术栈：Vue3 + Vite（`vue` 模板）+ **JavaScript**（非 TypeScript）。
- 包管理：**pnpm**。
- UI：**Element Plus**。
- HTTP：**axios**，baseURL `/api`。
- 测试：**Vitest** + `@vue/test-utils`。
- Lint/格式化：**ESLint 9**（flat config）+ `eslint-plugin-vue` + **Prettier**。
- **不引入** Pinia、vue-router（demo 单页用不上，需要时再加）。
- demo 页面：一个 `SummaryDashboard` 组件，调用总览接口并把 Group → Summary → Sub-group 分层渲染。demo 阶段渲染全量即可，筛选 UI 不做。

## Testing Decisions

**好测试的原则**：只测对外行为（对外 HTTP 契约 / 组件对外渲染），不测内部实现细节（model 字段赋值、serializer 内部、聚合函数私有逻辑）。这样实现重构不会拖累测试。

- **主接缝（理想的那 1 个）—— API 契约集成测试**：
  - 工具 `pytest-django`，用测试 client 请求 `GET /api/missing-file/summary`。
  - 由 seed 演示数据驱动，断言完整 JSON 契约：外层 `code/message/data` 包装；`data[]` 按 Group 六维聚合；`summarys[]` 按 `tool_name` 分；Summary 含 7 个 count + `report_url` + `scan_time` + `create_time`；`sub_groups[]` 元素**只有 6 个 count（无 `passed_count`）**；无子分组 Task → `sub_groups = []`；`is_active=0` 的 Task 不返回。
  - 这一个接缝覆盖 model、serializer、聚合、sub_group 派生、is_active 过滤的全部外部行为。
- **次要接缝 —— 前端渲染组件测试**：
  - 工具 Vitest + `@vue/test-utils`，给 `SummaryDashboard` 喂 mock 的契约数据（形状同主接缝响应），断言 Group / Summary / Sub-group 被正确渲染。
  - 从属于主契约，不独立验证业务规则。
- **Prior art**：全新工程，无现成测试范式；以上两个接缝将作为本仓库的测试基准。

## Out of Scope

- 真实数据接入（连真实 MySQL / 导入真实扫描结果）——demo 用 SQLite + seed。
- Missing file **详情**接口（缺失文件列表）——本 PRD 只实现总览接口。
- 认证 / 鉴权。
- 前端路由、多页面、状态管理（Pinia）、筛选 UI。
- TypeScript、由 OpenAPI 生成前端类型。
- 生产部署（容器化、CI/CD、nginx 反代）。
- Sub-group 完整清单的真实数据源（demo 硬编码）。
- Task ↔ Summary 的 1:N 历史快照逻辑（demo 1:1）。
- 时间维度的趋势 / 历史看板。

## Further Notes

- **PRD 原始文档需回填两处**（`missin_file_result_page.md`，`CONTEXT.md` 已记录正确版本）：
  1. `missing_file` 模型补 `sub_group` 字段。
  2. 接口示例 `sub_groups[]` 删除 `passed_count`。
- **demo 技术债**（生产化时再决）：
  - Sub-group 完整清单的 key 粒度（挂在 `group_name` 还是完整六维 Group）待定。
  - Task ↔ Summary 切 1:N 的查询逻辑（`is_active` / 取最新）。
  - 前端 JS，字段漂移靠人工对齐；未来可补 OpenAPI 生成类型。
- **Open question（实现时按默认处理）**：当 Task 有子分组结构但某份 Missing file 的 `sub_group` 为空时，该文件默认计入 Summary 总量但不进入任何子分组桶（因此各子分组 count 之和可能小于 Summary 对应 count）。若业务需要"未分组"桶，再行调整。
