"""pytest 全局 fixtures —— django_db 下自动灌入 seed 演示数据。"""

import pytest
from django.core.management import call_command


@pytest.fixture(autouse=True)
def _seed_db(db):
    """每个测试自动调用 seed_demo，确保测试在可重现的数据上运行。"""
    call_command("seed_demo")
