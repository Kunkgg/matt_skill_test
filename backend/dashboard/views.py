"""GET /api/missing-file/summary —— 缺失文件扫描结果总览接口。

把启用中的 Task 按六个维度聚合成 Group，每 Group 下按工具排 Summary，
每个 Summary 再按子分组拆出 sub_groups（无 passed_count）。
领域语义见仓库根目录 CONTEXT.md、PRD。
"""

from collections import OrderedDict

from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MissingFile, Task

# demo：子分组完整清单（硬编码）。
#   key = group_name；清单为空 → 该组件组无子分组结构（sub_groups 返回 []）。
# 生产化时这份数据源与 key 粒度（group_name 还是完整六维 Group）待定，见 PRD Further Notes。
SUB_GROUP_REGISTRY = {
    "核心网": ["AMF", "SMF", "UPF"],
}

# Group 由这六个维度聚合（不含 tool_name）
GROUP_DIMENSIONS = [
    "search_version",
    "product",
    "group_name",
    "lan",
    "source_type",
    "data_type",
]
# 可选的 query 过滤维度（Group 六维 + tool_name）
QUERY_FILTERS = GROUP_DIMENSIONS + ["tool_name"]

# sub_groups 元素持有的 6 个 count（无 passed_count —— passed 无法从 missing_file 聚合）
SUB_GROUP_COUNT_FIELDS = [
    "missing_count",
    "failed_count",
    "overdue_missing_count",
    "overdue_failed_count",
    "remapped_count",
    "shielded_count",
]


def _aggregate_sub_group(missing_files):
    """把单个子分组内的 MissingFile 列表聚合成 6 个 count。"""
    counts = {field: 0 for field in SUB_GROUP_COUNT_FIELDS}
    for mf in missing_files:
        if mf.status == MissingFile.Status.MISSING:
            counts["missing_count"] += 1
            if mf.is_overdue:
                counts["overdue_missing_count"] += 1
        elif mf.status == MissingFile.Status.FAILED:
            counts["failed_count"] += 1
            if mf.is_overdue:
                counts["overdue_failed_count"] += 1
        elif mf.status == MissingFile.Status.REMAPPED:
            counts["remapped_count"] += 1
        elif mf.status == MissingFile.Status.SHIELDED:
            counts["shielded_count"] += 1
    return counts


def _build_sub_groups(summary):
    """构造 summary.sub_groups：按 SUB_GROUP_REGISTRY 展开全部子分组，无子分组返回 []。"""
    names = SUB_GROUP_REGISTRY.get(summary.task.group_name, [])
    if not names:
        return []
    files = list(summary.missing_files.all())
    result = []
    for name in names:
        bucket = [mf for mf in files if mf.sub_group == name]
        item = OrderedDict([("sub_group_name", name)])
        item.update(_aggregate_sub_group(bucket))
        result.append(item)
    return result


def _build_summary_dict(summary):
    return OrderedDict(
        [
            ("summary_id", summary.id),
            ("tool_name", summary.task.tool_name),
            ("passed_count", summary.passed_count),
            ("missing_count", summary.missing_count),
            ("failed_count", summary.failed_count),
            ("overdue_missing_count", summary.overdue_missing_count),
            ("overdue_failed_count", summary.overdue_failed_count),
            ("remapped_count", summary.remapped_count),
            ("shielded_count", summary.shielded_count),
            ("report_url", summary.report_url),
            (
                "scan_time",
                summary.scan_time.isoformat() if summary.scan_time else None,
            ),
            (
                "create_time",
                summary.create_time.isoformat() if summary.create_time else None,
            ),
            ("sub_groups", _build_sub_groups(summary)),
        ]
    )


class MissingFileSummaryView(APIView):
    """返回所有启用任务的缺失文件扫描结果总览，按 Group 聚合。"""

    def get(self, request):
        tasks = Task.objects.filter(is_active=True)
        for field in QUERY_FILTERS:
            value = request.query_params.get(field)
            if value:
                tasks = tasks.filter(**{field: value})

        tasks = (
            tasks.select_related("summary")
            .prefetch_related("summary__missing_files")
            .order_by(*GROUP_DIMENSIONS, "tool_name")
        )

        groups = OrderedDict()
        for task in tasks:
            key = tuple(getattr(task, field) for field in GROUP_DIMENSIONS)
            group = groups.get(key)
            if group is None:
                group = OrderedDict((field, getattr(task, field)) for field in GROUP_DIMENSIONS)
                group["summarys"] = []
                groups[key] = group
            if hasattr(task, "summary"):
                group["summarys"].append(_build_summary_dict(task.summary))

        return Response({"code": 0, "message": "success", "data": list(groups.values())})
