"""dashboard app 的路由。挂在 /api/ 下（见 config/urls.py）。"""

from django.urls import path

from .views import MissingFileSummaryView

urlpatterns = [
    path("missing-file/summary", MissingFileSummaryView.as_view()),
]
