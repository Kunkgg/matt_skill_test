.PHONY: install dev test lint seed \
        backend-install backend-dev backend-test backend-lint seed \
        frontend-install frontend-dev frontend-test frontend-lint

PY ?= python3.12

# ---------- 一键 ----------

install: backend-install frontend-install

test: backend-test frontend-test

lint: backend-lint frontend-lint

# 同时起前后端（Ctrl+C 一起停）
dev:
	@trap 'kill 0' INT TERM EXIT; \
	(cd backend && uv run python manage.py runserver 0.0.0.0:8000) & \
	(cd frontend && pnpm dev)

# ---------- 后端 ----------

backend-install:
	cd backend && uv sync

backend-dev:
	cd backend && uv run python manage.py runserver 0.0.0.0:8000

backend-test:
	cd backend && uv run pytest

backend-lint:
	cd backend && uv run ruff check . && uv run ruff format --check .

seed:
	cd backend && uv run python manage.py seed_demo

migrate:
	cd backend && uv run python manage.py migrate

# ---------- 前端 ----------

frontend-install:
	cd frontend && pnpm install

frontend-dev:
	cd frontend && pnpm dev

frontend-test:
	cd frontend && pnpm test

frontend-lint:
	cd frontend && pnpm lint
