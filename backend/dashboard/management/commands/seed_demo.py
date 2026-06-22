"""灌入缺失文件看板演示数据。先清空旧数据（demo 用）。"""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from dashboard.models import MissingFile, Summary, Task

# demo 子分组清单需与 dashboard/views.py 的 SUB_GROUP_REGISTRY 一致：
#   "核心网" → [AMF, SMF, UPF]；其它 group_name（如「无线」）无子分组结构。
# 每条 = (文件名, status, sub_group 或 None, 是否逾期)
SEED = [
    {
        "task": {
            "search_version": "29A",
            "product": "5G",
            "group_name": "核心网",
            "lan": "C++",
            "source_type": "self_dev",
            "data_type": "版本级",
            "tool_name": "codestyle",
        },
        "summary": {
            "passed_count": 1000,
            "missing_count": 10,
            "failed_count": 5,
            "overdue_missing_count": 2,
            "overdue_failed_count": 1,
            "remapped_count": 3,
            "shielded_count": 4,
            "report_url": "http://example.com/report/1",
        },
        "files": [
            ("core/amf/handler.cpp", MissingFile.Status.MISSING, "AMF", True),
            ("core/amf/init.cpp", MissingFile.Status.FAILED, "AMF", False),
            ("core/amf/msg.cpp", MissingFile.Status.FAILED, "AMF", True),
            ("core/smf/session.cpp", MissingFile.Status.MISSING, "SMF", True),
            ("core/smf/ctx.cpp", MissingFile.Status.REMAPPED, "SMF", False),
            ("core/upf/forward.cpp", MissingFile.Status.MISSING, "UPF", False),
            ("core/upf/pipe.cpp", MissingFile.Status.SHIELDED, "UPF", False),
            # sub_group 为空：计入 summary 总量，但不进入任何子分组桶
            ("core/common/util.cpp", MissingFile.Status.MISSING, None, False),
        ],
    },
    {
        "task": {
            "search_version": "29A",
            "product": "5G",
            "group_name": "核心网",
            "lan": "C++",
            "source_type": "self_dev",
            "data_type": "版本级",
            "tool_name": "secbrella",
        },
        "summary": {
            "passed_count": 200,
            "missing_count": 8,
            "failed_count": 6,
            "overdue_missing_count": 1,
            "overdue_failed_count": 2,
            "remapped_count": 2,
            "shielded_count": 1,
            "report_url": "http://example.com/report/2",
        },
        "files": [
            ("core/amf/sec.cpp", MissingFile.Status.MISSING, "AMF", True),
            ("core/smf/auth.cpp", MissingFile.Status.FAILED, "SMF", True),
            ("core/upf/nat.cpp", MissingFile.Status.MISSING, "UPF", False),
        ],
    },
    {
        "task": {
            "search_version": "29A",
            "product": "5G",
            "group_name": "无线",
            "lan": "C",
            "source_type": "self_dev",
            "data_type": "版本级",
            "tool_name": "codestyle",
        },
        "summary": {
            "passed_count": 500,
            "missing_count": 4,
            "failed_count": 2,
            "overdue_missing_count": 1,
            "overdue_failed_count": 0,
            "remapped_count": 1,
            "shielded_count": 1,
            "report_url": "http://example.com/report/3",
        },
        # group_name="无线" 不在 SUB_GROUP_REGISTRY → 该组件组无子分组 → sub_groups=[]
        "files": [
            ("rf/antenna.c", MissingFile.Status.MISSING, None, True),
            ("rf/power.c", MissingFile.Status.FAILED, None, False),
        ],
    },
    {
        "task": {
            "search_version": "28B",
            "product": "5G",
            "group_name": "核心网",
            "lan": "C++",
            "source_type": "self_dev",
            "data_type": "版本级",
            "tool_name": "codestyle",
        },
        "summary": {
            "passed_count": 800,
            "missing_count": 6,
            "failed_count": 3,
            "overdue_missing_count": 0,
            "overdue_failed_count": 1,
            "remapped_count": 1,
            "shielded_count": 2,
            "report_url": "http://example.com/report/4",
        },
        "files": [
            ("core/amf/v2.cpp", MissingFile.Status.MISSING, "AMF", False),
            ("core/smf/v2.cpp", MissingFile.Status.FAILED, "SMF", True),
        ],
    },
    # is_active=False 的任务：看板查询应排除它
    {
        "task": {
            "search_version": "29A",
            "product": "5G",
            "group_name": "核心网",
            "lan": "C++",
            "source_type": "self_dev",
            "data_type": "版本级",
            "tool_name": "legacy_tool",
            "is_active": False,
        },
        "summary": {
            "passed_count": 10,
            "missing_count": 99,
            "failed_count": 0,
            "overdue_missing_count": 0,
            "overdue_failed_count": 0,
            "remapped_count": 0,
            "shielded_count": 0,
            "report_url": "",
        },
        "files": [],
    },
]


class Command(BaseCommand):
    help = "灌入缺失文件看板演示数据（先清空）"

    def handle(self, *args, **options):
        Task.objects.all().delete()  # 级联删除 Summary / MissingFile
        now = timezone.now()
        n_files = 0
        for item in SEED:
            task = Task.objects.create(**item["task"])
            summary = Summary.objects.create(
                task=task,
                scan_time=now - timedelta(hours=2),
                **item["summary"],
            )
            for file_name, status, sub_group, is_overdue in item["files"]:
                MissingFile.objects.create(
                    summary=summary,
                    file_name=file_name,
                    status=status,
                    sub_group=sub_group,
                    is_overdue=is_overdue,
                    first_detected_time=now - timedelta(days=20 if is_overdue else 1),
                )
                n_files += 1
        self.stdout.write(
            self.style.SUCCESS(
                f"已灌入 {len(SEED)} 个任务、{Summary.objects.count()} 个汇总、{n_files} 条缺失文件"
            )
        )
