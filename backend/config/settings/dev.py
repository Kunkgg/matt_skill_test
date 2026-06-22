"""开发环境 settings。"""

from .base import *  # noqa: F401,F403

DEBUG = True

# 开发期放开跨域，前端 Vite dev server（任意端口）可直接访问后端
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWED_ORIGINS = []
