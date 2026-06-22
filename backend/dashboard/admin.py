"""注册 model 到 Django admin，调试期可直接查看数据。"""

from django.contrib import admin

from .models import MissingFile, Summary, Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("search_version", "product", "group_name", "tool_name", "is_active")
    list_filter = ("is_active", "search_version", "product")


@admin.register(Summary)
class SummaryAdmin(admin.ModelAdmin):
    list_display = ("task", "missing_count", "failed_count", "scan_time")


@admin.register(MissingFile)
class MissingFileAdmin(admin.ModelAdmin):
    list_display = ("file_name", "status", "sub_group", "is_overdue", "summary")
    list_filter = ("status", "is_overdue")
