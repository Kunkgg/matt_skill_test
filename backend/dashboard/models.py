"""缺失文件扫描看板的数据模型。领域术语见仓库根目录 CONTEXT.md。"""

from django.db import models


class Task(models.Model):
    """一次缺失文件扫描任务的定义，由七个维度唯一定位。"""

    search_version = models.CharField("扫描版本", max_length=16)
    product = models.CharField("产品", max_length=32)
    group_name = models.CharField("组件组名", max_length=64)
    lan = models.CharField("编程语言", max_length=32)
    source_type = models.CharField("源码类型", max_length=32)
    data_type = models.CharField("数据类型", max_length=32)
    tool_name = models.CharField("工具名称", max_length=64)
    is_active = models.BooleanField("是否启用", default=True)

    class Meta:
        verbose_name = "扫描任务"
        verbose_name_plural = "扫描任务"
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "search_version",
                    "product",
                    "group_name",
                    "lan",
                    "source_type",
                    "data_type",
                    "tool_name",
                ],
                name="uniq_task_dimensions",
            ),
        ]

    def __str__(self):
        return f"{self.search_version}/{self.product}/{self.group_name}/{self.tool_name}"


class Summary(models.Model):
    """一个 Task 当次扫描的结果汇总。demo 阶段 Task ↔ Summary 为 1:1。"""

    task = models.OneToOneField(
        Task,
        on_delete=models.CASCADE,
        verbose_name="任务",
    )
    passed_count = models.PositiveIntegerField("通过文件数", default=0)
    missing_count = models.PositiveIntegerField("缺失文件数", default=0)
    failed_count = models.PositiveIntegerField("失败文件数", default=0)
    overdue_missing_count = models.PositiveIntegerField("逾期缺失文件数", default=0)
    overdue_failed_count = models.PositiveIntegerField("逾期失败文件数", default=0)
    remapped_count = models.PositiveIntegerField("重映射文件数", default=0)
    shielded_count = models.PositiveIntegerField("屏蔽文件数", default=0)
    report_url = models.URLField("报告URL", blank=True, default="")
    scan_time = models.DateTimeField("工程扫描时间", null=True, blank=True)
    create_time = models.DateTimeField("数据刷新时间", auto_now_add=True)
    is_active = models.BooleanField("是否启用", default=True)

    class Meta:
        verbose_name = "扫描汇总"
        verbose_name_plural = "扫描汇总"

    def __str__(self):
        return f"Summary(task={self.task_id})"


class MissingFile(models.Model):
    """一份被判定为未按要求被扫描覆盖的文件记录。status 无 passed。"""

    class Status(models.TextChoices):
        MISSING = "missing", "缺失"
        FAILED = "failed", "失败"
        REMAPPED = "remapped", "重映射"
        SHIELDED = "shielded", "屏蔽"

    summary = models.ForeignKey(
        Summary,
        on_delete=models.CASCADE,
        related_name="missing_files",
        verbose_name="汇总",
    )
    file_name = models.CharField("文件名称", max_length=512)
    status = models.CharField("文件状态", max_length=16, choices=Status.choices)
    sub_group = models.CharField("子分组", max_length=64, null=True, blank=True)
    first_detected_time = models.DateTimeField("首次发现时间", null=True, blank=True)
    is_overdue = models.BooleanField("是否逾期", default=False)

    class Meta:
        verbose_name = "缺失文件"
        verbose_name_plural = "缺失文件"

    def __str__(self):
        return f"{self.file_name} [{self.status}]"
