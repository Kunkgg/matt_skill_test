# 单仓库托管前后端代码

后端（Django + DRF）和前端（Vue3 + Element Plus）放在同一个 Git 仓库中，各自独立目录（`backend/`、`frontend/`），由顶层 `Makefile` 统一编排开发、测试与 Lint 命令。

前后端共享同一份接口契约（`/api/missing-file/summary`），单仓库能让字段改动在一次提交里被两端同时看到，减少契约漂移；分仓的协作成本（跨仓库协调、独立 CI）对一个内部看板团队还没有收益。
