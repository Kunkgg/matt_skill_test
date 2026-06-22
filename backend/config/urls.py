"""根路由：/admin/ 后台，/api/ 下挂 dashboard 接口。"""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("dashboard.urls")),
]
