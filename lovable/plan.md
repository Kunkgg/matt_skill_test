## 缺失文件扫描看板

一个纯前端看板，用示例数据呈现各软件组件「缺失文件扫描」结果。按任务分组合并 8 个 tool_type 相似任务，支持多维过滤、顶部总览，点击数量在侧边抽屉中查看文件明细。无后端、无登录。

### 数据层（示例数据）

在 `src/data/` 下放置内存示例数据与类型定义：

- `types.js`：`Task`、`Summary`、`MissingFile` 三个接口，字段严格对应需求。
- `sample-data.js`：构造一组真实感的示例数据
  - 覆盖多个 `search_version`（如 V100R001 / V100R002）、多个 `group_name`、`product`（4G/5G/IAB/EMRU）、`source_type`、`lan`、`data_type`。
  - 每个「配置组」（version/group/product/source_type/lan/data_type 相同）生成 8 个 `tool_type` 任务（codetyle/codemars/secbrella/aps-molint/cooddy/binexplorer/sai/secoptions）。
  - 部分任务无 Summary（无扫描结果），部分有缺失/失败/过期文件，部分干净。
  - 每个有缺失的 Summary 关联若干 `MissingFile`，带 `status`、`is_expired`、`ownership`（BSP/TRAN/APP/TEST/TOOLS）。
- `selectors.js`：纯函数——按 `is_active=1` 取每个任务最近一次 Summary、关联组装、按配置分组、计算总览与子分组汇总。

### 页面

- 过滤条件用 URL search params，刷新/分享保留状态。

#### 1. 过滤控制（顶部 sticky 工具栏）
下拉过滤：search_version（默认最新）、group_name、product、source_type、lan、data_type、tool_type（默认全部）。
开关过滤：show_issue_only（默认否）、show_expired_only（默认否）。
结果不分页，全部渲染。一个「重置」按钮。

#### 2. 总览（过滤后统计卡片行）
- 任务数
- 无任何扫描结果的任务数
- 有缺失文件的任务数
- 有过期缺失文件的任务数

#### 3. 详情列表（按配置分组合并 —— 解决重复信息痛点）
- 每个「配置组」一张卡片，卡片头部展示一次共享信息：组件版本号、组件组、产品、代码类型、编程语言、数据类型。
- 卡片内是一张「工具行表」：每行 = 一个 tool_type，列展示扫描结果状态计数：
  - 通过 / 缺失 / 失败 / 过期缺失 / 过期失败 / 屏蔽 / 重映射
  - 扫描开始时间、结果创建时间、报告链接
  - 无扫描结果的工具行显示「未扫描」徽标。
  - 有缺失/失败的计数用强调色（如缺失红、过期橙）。
- 每个计数可点击 → 打开侧边抽屉。

#### 4. 侧边抽屉（文件明细 + 子分组）
点击某工具行的某个计数后，Drawer 滑出，标题展示该任务上下文（版本/组/产品/工具）：
- 顶部「子分组」汇总小表：ownership × (缺失/失败/过期缺失/过期失败)，每格可点击进一步筛选下方列表。
- 下方文件明细表：file_path、status、is_expired、whitebox_created_at（首次发现时间）、ownership。
- 根据点击的计数类型预筛（如点「缺失」只显 status=missed；点「过期缺失」显 missed 且 expired）。
- 报告链接按钮。

### 视觉方向

工程/运维数据看板气质，信息密度高但清爽：
- 浅色中性背景，卡片白底细边框；状态用语义色：通过=绿、缺失=红、失败=琥珀、过期=橙、屏蔽/重映射=中性灰蓝。
- 字体：标题 Outfit，正文 Figtree（通过 @fontsource 安装），等宽用于 file_path。
- 计数用紧凑数字徽标，0 值弱化为灰色以突出非零问题。
- 所有颜色走 @lovable/styles.css 语义 token，不硬编码。
- 效果截图参考 @lovable/screenshot_1.png 和 @lovable/screenshot_2.png

### 技术要点

- 全部 ElementPlus 组件复用现有 ui 库（Select、Drawer、Table、Badge、Card、Switch）。
- 过滤、分组、汇总均为纯函数，便于日后替换为真实接口。
- 使用 VUE3 (组合式 API) + Javascript 实现
- 对文件进行合理分拆
