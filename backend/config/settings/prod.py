"""生产环境 settings：必须由环境变量提供真实 SECRET_KEY / DATABASE_URL / CORS 白名单。"""

from .base import *  # noqa: F401,F403
from .base import env

DEBUG = False

# 生产环境只允许显式配置的前端来源
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])
