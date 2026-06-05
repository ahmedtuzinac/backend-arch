# Backend Architecture Template — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a production-ready backend microservice template with FastAPI, Tortoise ORM, PostgreSQL, Redis, Podman, and Nginx — ready to clone and run.

**Architecture:** Monorepo with a shared installable package (`core-shared`), two starter services (auth + websocket), a Copier template for generating new services, and full infrastructure (Nginx reverse proxy, PostgreSQL multi-db, Redis). Domain-driven structure within each service.

**Tech Stack:** Python 3.13, FastAPI, Tortoise ORM, Aerich, PostgreSQL 17, Redis 7, Podman, Nginx, OAuth2+JWT, Pydantic Settings, Structlog, pytest+httpx+testcontainers, Ruff, GitHub Actions, Copier

**Spec:** `~/work/ahmed/backend-arch.md`

---

## Task 1: Project Scaffolding

**Files:**
- Create: `pyproject.toml` (root — ruff config, workspace)
- Create: `Makefile`
- Create: `.gitignore`

- [ ] **Step 1: Initialize git repo**

```bash
cd /Users/ahmedtuzinac/projects/backned-arch
git init
```

- [ ] **Step 2: Create root pyproject.toml**

Create `pyproject.toml`:

```toml
[project]
name = "backend-arch"
version = "0.1.0"
description = "Backend microservice architecture template"
requires-python = ">=3.13"

[tool.ruff]
target-version = "py313"
line-length = 120

[tool.ruff.lint]
select = [
    "E",    # pycodestyle errors
    "W",    # pycodestyle warnings
    "F",    # pyflakes
    "I",    # isort
    "N",    # pep8-naming
    "UP",   # pyupgrade
    "B",    # flake8-bugbear
    "SIM",  # flake8-simplify
    "TCH",  # flake8-type-checking
]

[tool.ruff.lint.isort]
known-first-party = ["core_shared"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
```

- [ ] **Step 3: Create .gitignore**

Create `.gitignore`:

```gitignore
# Python
__pycache__/
*.py[cod]
*.egg-info/
dist/
build/
.eggs/
*.egg

# Virtual environments
.venv/
venv/

# Environment files
.env
!.env.example

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
.pytest_cache/
.coverage
htmlcov/

# Aerich
aerich.ini

# Podman/Docker
*.log
```

- [ ] **Step 4: Create Makefile**

Create `Makefile`:

```makefile
.PHONY: up down test test-auth test-ws lint format new-service migrate

up:
	podman-compose up --build

down:
	podman-compose down

test:
	cd services/auth && python -m pytest tests/ -v
	cd services/websocket && python -m pytest tests/ -v

test-auth:
	cd services/auth && python -m pytest tests/ -v

test-ws:
	cd services/websocket && python -m pytest tests/ -v

lint:
	ruff check .

format:
	ruff format .

new-service:
	@if [ -z "$(name)" ]; then echo "Usage: make new-service name=<service_name>"; exit 1; fi
	copier copy service-template services/$(name)

migrate:
	cd services/auth && aerich upgrade
	cd services/websocket && aerich upgrade
```

- [ ] **Step 5: Create directory structure**

```bash
mkdir -p packages/core-shared/core_shared/{auth,database,logging,communication,config,middleware}
mkdir -p services/auth/{app/{users,oauth,tokens},tests/{test_users,test_oauth,test_tokens},migrations}
mkdir -p services/websocket/{app/{connections,handlers},tests/{test_connections,test_handlers},migrations}
mkdir -p service-template/{app,tests}
mkdir -p infra/{nginx,postgres,redis}
mkdir -p .github/workflows
```

- [ ] **Step 6: Commit**

```bash
git add pyproject.toml Makefile .gitignore
git commit -m "chore: initialize project scaffolding with root config, Makefile, gitignore"
```

---

## Task 2: Core-Shared Package — Config & Database

**Files:**
- Create: `packages/core-shared/pyproject.toml`
- Create: `packages/core-shared/core_shared/__init__.py`
- Create: `packages/core-shared/core_shared/config/base.py`
- Create: `packages/core-shared/core_shared/config/__init__.py`
- Create: `packages/core-shared/core_shared/database/base_model.py`
- Create: `packages/core-shared/core_shared/database/connection.py`
- Create: `packages/core-shared/core_shared/database/mixins.py`
- Create: `packages/core-shared/core_shared/database/__init__.py`
- Test: `packages/core-shared/tests/test_config.py`
- Test: `packages/core-shared/tests/test_database.py`

- [ ] **Step 1: Create core-shared pyproject.toml**

Create `packages/core-shared/pyproject.toml`:

```toml
[project]
name = "core-shared"
version = "0.1.0"
description = "Shared utilities for backend microservices"
requires-python = ">=3.13"
dependencies = [
    "fastapi>=0.115.0",
    "tortoise-orm[asyncpg]>=0.22.0",
    "pydantic-settings>=2.7.0",
    "structlog>=24.4.0",
    "httpx>=0.28.0",
    "pyjwt[crypto]>=2.10.0",
    "redis[hiredis]>=5.2.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.25.0",
    "pytest-testcontainers>=0.1.0",
    "testcontainers[postgres,redis]>=4.9.0",
    "httpx>=0.28.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

- [ ] **Step 2: Create package __init__.py**

Create `packages/core-shared/core_shared/__init__.py`:

```python
"""Core shared utilities for backend microservices."""
```

- [ ] **Step 3: Write failing test for BaseSettings**

Create `packages/core-shared/tests/__init__.py` (empty).

Create `packages/core-shared/tests/test_config.py`:

```python
import os

from core_shared.config import BaseAppSettings


def test_base_settings_defaults():
    settings = BaseAppSettings(app_name="test-service")
    assert settings.app_name == "test-service"
    assert settings.debug is False
    assert settings.log_level == "INFO"


def test_base_settings_from_env(monkeypatch):
    monkeypatch.setenv("APP_NAME", "my-service")
    monkeypatch.setenv("DEBUG", "true")
    monkeypatch.setenv("LOG_LEVEL", "DEBUG")
    settings = BaseAppSettings()
    assert settings.app_name == "my-service"
    assert settings.debug is True
    assert settings.log_level == "DEBUG"
```

- [ ] **Step 4: Run test to verify it fails**

```bash
cd packages/core-shared && pip install -e ".[dev]" && python -m pytest tests/test_config.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'core_shared.config'`

- [ ] **Step 5: Implement BaseAppSettings**

Create `packages/core-shared/core_shared/config/__init__.py`:

```python
from core_shared.config.base import BaseAppSettings

__all__ = ["BaseAppSettings"]
```

Create `packages/core-shared/core_shared/config/base.py`:

```python
from pydantic_settings import BaseSettings


class BaseAppSettings(BaseSettings):
    app_name: str = "service"
    debug: bool = False
    log_level: str = "INFO"

    model_config = {"env_prefix": "", "env_file": ".env", "extra": "ignore"}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
cd packages/core-shared && python -m pytest tests/test_config.py -v
```

Expected: PASS

- [ ] **Step 7: Write failing test for BaseModel and mixins**

Create `packages/core-shared/tests/test_database.py`:

```python
from core_shared.database import BaseModel, TimestampMixin, SoftDeleteMixin
from tortoise import fields


def test_base_model_has_id_field():
    field_names = BaseModel._meta.fields_map.keys()
    assert "id" in field_names


def test_timestamp_mixin_has_fields():
    """TimestampMixin should define created_at and updated_at."""
    assert hasattr(TimestampMixin, "created_at")
    assert hasattr(TimestampMixin, "updated_at")


def test_soft_delete_mixin_has_fields():
    """SoftDeleteMixin should define deleted_at and is_deleted."""
    assert hasattr(SoftDeleteMixin, "deleted_at")
    assert hasattr(SoftDeleteMixin, "is_deleted")
```

- [ ] **Step 8: Run test to verify it fails**

```bash
cd packages/core-shared && python -m pytest tests/test_database.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'core_shared.database'`

- [ ] **Step 9: Implement database module**

Create `packages/core-shared/core_shared/database/__init__.py`:

```python
from core_shared.database.base_model import BaseModel
from core_shared.database.mixins import SoftDeleteMixin, TimestampMixin

__all__ = ["BaseModel", "SoftDeleteMixin", "TimestampMixin"]
```

Create `packages/core-shared/core_shared/database/base_model.py`:

```python
from tortoise import fields
from tortoise.models import Model


class BaseModel(Model):
    id = fields.IntField(pk=True)

    class Meta:
        abstract = True
```

Create `packages/core-shared/core_shared/database/mixins.py`:

```python
from tortoise import fields


class TimestampMixin:
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)


class SoftDeleteMixin:
    deleted_at = fields.DatetimeField(null=True)
    is_deleted = fields.BooleanField(default=False)
```

Create `packages/core-shared/core_shared/database/connection.py`:

```python
from tortoise import Tortoise


async def init_db(db_url: str, modules: dict[str, list[str]]) -> None:
    await Tortoise.init(db_url=db_url, modules=modules)
    await Tortoise.generate_schemas()


async def close_db() -> None:
    await Tortoise.close_connections()
```

- [ ] **Step 10: Run test to verify it passes**

```bash
cd packages/core-shared && python -m pytest tests/test_database.py -v
```

Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add packages/core-shared/
git commit -m "feat: add core-shared package with config and database modules"
```

---

## Task 3: Core-Shared Package — Auth Module

**Files:**
- Create: `packages/core-shared/core_shared/auth/__init__.py`
- Create: `packages/core-shared/core_shared/auth/jwt.py`
- Create: `packages/core-shared/core_shared/auth/schemas.py`
- Create: `packages/core-shared/core_shared/auth/dependencies.py`
- Test: `packages/core-shared/tests/test_auth.py`

- [ ] **Step 1: Write failing test for JWT encode/decode**

Create `packages/core-shared/tests/test_auth.py`:

```python
from datetime import timedelta

import pytest

from core_shared.auth.jwt import create_access_token, decode_token
from core_shared.auth.schemas import TokenPayload


SECRET_KEY = "test-secret-key-that-is-long-enough-for-hs256"


def test_create_and_decode_token():
    token = create_access_token(
        data={"sub": "123", "scopes": ["read:users"]},
        secret_key=SECRET_KEY,
        expires_delta=timedelta(minutes=15),
    )
    payload = decode_token(token, secret_key=SECRET_KEY)
    assert payload.sub == "123"
    assert payload.scopes == ["read:users"]
    assert payload.exp is not None


def test_decode_expired_token():
    token = create_access_token(
        data={"sub": "123", "scopes": []},
        secret_key=SECRET_KEY,
        expires_delta=timedelta(seconds=-1),
    )
    with pytest.raises(ValueError, match="Token has expired"):
        decode_token(token, secret_key=SECRET_KEY)


def test_decode_invalid_token():
    with pytest.raises(ValueError, match="Invalid token"):
        decode_token("not-a-real-token", secret_key=SECRET_KEY)
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/core-shared && python -m pytest tests/test_auth.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'core_shared.auth'`

- [ ] **Step 3: Implement auth module**

Create `packages/core-shared/core_shared/auth/__init__.py`:

```python
from core_shared.auth.dependencies import get_current_user, require_scope
from core_shared.auth.jwt import create_access_token, decode_token
from core_shared.auth.schemas import CurrentUser, TokenPayload

__all__ = [
    "create_access_token",
    "decode_token",
    "get_current_user",
    "require_scope",
    "CurrentUser",
    "TokenPayload",
]
```

Create `packages/core-shared/core_shared/auth/schemas.py`:

```python
from pydantic import BaseModel


class TokenPayload(BaseModel):
    sub: str
    scopes: list[str] = []
    exp: int | None = None


class CurrentUser(BaseModel):
    id: str
    scopes: list[str] = []
```

Create `packages/core-shared/core_shared/auth/jwt.py`:

```python
from datetime import UTC, datetime, timedelta

import jwt

from core_shared.auth.schemas import TokenPayload


def create_access_token(
    data: dict,
    secret_key: str,
    expires_delta: timedelta = timedelta(minutes=15),
    algorithm: str = "HS256",
) -> str:
    to_encode = data.copy()
    expire = datetime.now(UTC) + expires_delta
    to_encode["exp"] = int(expire.timestamp())
    return jwt.encode(to_encode, secret_key, algorithm=algorithm)


def decode_token(
    token: str,
    secret_key: str,
    algorithm: str = "HS256",
) -> TokenPayload:
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        return TokenPayload(**payload)
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")
```

Create `packages/core-shared/core_shared/auth/dependencies.py`:

```python
from typing import Annotated

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import OAuth2PasswordBearer, SecurityScopes

from core_shared.auth.jwt import decode_token
from core_shared.auth.schemas import CurrentUser

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token", scopes={})


def get_current_user(
    secret_key: str,
) -> "Depends":
    async def _get_current_user(
        security_scopes: SecurityScopes,
        token: Annotated[str, Depends(oauth2_scheme)],
    ) -> CurrentUser:
        try:
            payload = decode_token(token, secret_key=secret_key)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(e),
                headers={"WWW-Authenticate": "Bearer"},
            )

        for scope in security_scopes.scopes:
            if scope not in payload.scopes:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing required scope: {scope}",
                )

        return CurrentUser(id=payload.sub, scopes=payload.scopes)

    return _get_current_user


def require_scope(scope: str) -> Security:
    return Security(get_current_user, scopes=[scope])
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd packages/core-shared && python -m pytest tests/test_auth.py -v
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core-shared/core_shared/auth/ packages/core-shared/tests/test_auth.py
git commit -m "feat: add auth module to core-shared with JWT encode/decode and FastAPI dependencies"
```

---

## Task 4: Core-Shared Package — Logging, Communication, Middleware

**Files:**
- Create: `packages/core-shared/core_shared/logging/__init__.py`
- Create: `packages/core-shared/core_shared/logging/setup.py`
- Create: `packages/core-shared/core_shared/communication/__init__.py`
- Create: `packages/core-shared/core_shared/communication/client.py`
- Create: `packages/core-shared/core_shared/middleware/__init__.py`
- Create: `packages/core-shared/core_shared/middleware/cors.py`
- Create: `packages/core-shared/core_shared/middleware/error_handler.py`
- Create: `packages/core-shared/core_shared/middleware/request_id.py`
- Test: `packages/core-shared/tests/test_logging.py`
- Test: `packages/core-shared/tests/test_communication.py`
- Test: `packages/core-shared/tests/test_middleware.py`

- [ ] **Step 1: Write failing test for structlog setup**

Create `packages/core-shared/tests/test_logging.py`:

```python
import structlog

from core_shared.logging import setup_logging


def test_setup_logging_configures_structlog():
    setup_logging(log_level="DEBUG")
    logger = structlog.get_logger()
    assert logger is not None


def test_setup_logging_returns_logger():
    logger = setup_logging(log_level="INFO")
    assert logger is not None
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/core-shared && python -m pytest tests/test_logging.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'core_shared.logging'`

- [ ] **Step 3: Implement logging module**

Create `packages/core-shared/core_shared/logging/__init__.py`:

```python
from core_shared.logging.setup import setup_logging

__all__ = ["setup_logging"]
```

Create `packages/core-shared/core_shared/logging/setup.py`:

```python
import logging

import structlog


def setup_logging(log_level: str = "INFO") -> structlog.stdlib.BoundLogger:
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
    logging.basicConfig(format="%(message)s", level=getattr(logging, log_level.upper()))
    return structlog.get_logger()
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd packages/core-shared && python -m pytest tests/test_logging.py -v
```

Expected: PASS

- [ ] **Step 5: Write failing test for httpx client**

Create `packages/core-shared/tests/test_communication.py`:

```python
import pytest

from core_shared.communication import ServiceClient


@pytest.fixture
def client():
    return ServiceClient(base_url="http://localhost:8000", timeout=5.0, max_retries=2)


def test_client_initializes():
    client = ServiceClient(base_url="http://localhost:8000")
    assert client.base_url == "http://localhost:8000"
    assert client.timeout == 10.0
    assert client.max_retries == 3


def test_client_custom_config():
    client = ServiceClient(base_url="http://auth:8001", timeout=5.0, max_retries=1)
    assert client.base_url == "http://auth:8001"
    assert client.timeout == 5.0
    assert client.max_retries == 1
```

- [ ] **Step 6: Run test to verify it fails**

```bash
cd packages/core-shared && python -m pytest tests/test_communication.py -v
```

Expected: FAIL

- [ ] **Step 7: Implement communication module**

Create `packages/core-shared/core_shared/communication/__init__.py`:

```python
from core_shared.communication.client import ServiceClient

__all__ = ["ServiceClient"]
```

Create `packages/core-shared/core_shared/communication/client.py`:

```python
from typing import Any

import httpx
import structlog

logger = structlog.get_logger()


class ServiceClient:
    def __init__(
        self,
        base_url: str,
        timeout: float = 10.0,
        max_retries: int = 3,
    ) -> None:
        self.base_url = base_url
        self.timeout = timeout
        self.max_retries = max_retries

    async def request(
        self,
        method: str,
        path: str,
        *,
        json: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
        params: dict[str, Any] | None = None,
    ) -> httpx.Response:
        url = f"{self.base_url}{path}"
        last_exception: Exception | None = None

        for attempt in range(1, self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.request(
                        method, url, json=json, headers=headers, params=params
                    )
                    response.raise_for_status()
                    return response
            except (httpx.HTTPStatusError, httpx.RequestError) as e:
                last_exception = e
                await logger.awarning(
                    "service_request_failed",
                    url=url,
                    attempt=attempt,
                    error=str(e),
                )

        raise last_exception

    async def get(self, path: str, **kwargs: Any) -> httpx.Response:
        return await self.request("GET", path, **kwargs)

    async def post(self, path: str, **kwargs: Any) -> httpx.Response:
        return await self.request("POST", path, **kwargs)

    async def patch(self, path: str, **kwargs: Any) -> httpx.Response:
        return await self.request("PATCH", path, **kwargs)

    async def delete(self, path: str, **kwargs: Any) -> httpx.Response:
        return await self.request("DELETE", path, **kwargs)
```

- [ ] **Step 8: Run test to verify it passes**

```bash
cd packages/core-shared && python -m pytest tests/test_communication.py -v
```

Expected: PASS

- [ ] **Step 9: Write failing test for middleware**

Create `packages/core-shared/tests/test_middleware.py`:

```python
import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from core_shared.middleware import setup_cors, setup_error_handler, RequestIdMiddleware


@pytest.fixture
def app():
    app = FastAPI()
    setup_cors(app, origins=["http://localhost:3000"])
    setup_error_handler(app)
    app.add_middleware(RequestIdMiddleware)

    @app.get("/test")
    async def test_endpoint():
        return {"status": "ok"}

    @app.get("/error")
    async def error_endpoint():
        raise ValueError("test error")

    return app


@pytest.mark.asyncio
async def test_request_id_middleware(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/test")
        assert response.status_code == 200
        assert "x-request-id" in response.headers


@pytest.mark.asyncio
async def test_request_id_passed_through(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/test", headers={"X-Request-ID": "my-custom-id"})
        assert response.headers["x-request-id"] == "my-custom-id"


@pytest.mark.asyncio
async def test_error_handler(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/error")
        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
```

- [ ] **Step 10: Run test to verify it fails**

```bash
cd packages/core-shared && python -m pytest tests/test_middleware.py -v
```

Expected: FAIL

- [ ] **Step 11: Implement middleware module**

Create `packages/core-shared/core_shared/middleware/__init__.py`:

```python
from core_shared.middleware.cors import setup_cors
from core_shared.middleware.error_handler import setup_error_handler
from core_shared.middleware.request_id import RequestIdMiddleware

__all__ = ["setup_cors", "setup_error_handler", "RequestIdMiddleware"]
```

Create `packages/core-shared/core_shared/middleware/cors.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def setup_cors(
    app: FastAPI,
    origins: list[str] | None = None,
) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
```

Create `packages/core-shared/core_shared/middleware/error_handler.py`:

```python
import structlog
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

logger = structlog.get_logger()


def setup_error_handler(app: FastAPI) -> None:
    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        await logger.aerror(
            "unhandled_exception",
            path=request.url.path,
            method=request.method,
            error=str(exc),
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )
```

Create `packages/core-shared/core_shared/middleware/request_id.py`:

```python
import uuid

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)
        response = await call_next(request)
        response.headers["x-request-id"] = request_id
        return response
```

- [ ] **Step 12: Run test to verify it passes**

```bash
cd packages/core-shared && python -m pytest tests/test_middleware.py -v
```

Expected: PASS

- [ ] **Step 13: Run all core-shared tests**

```bash
cd packages/core-shared && python -m pytest tests/ -v
```

Expected: All PASS

- [ ] **Step 14: Commit**

```bash
git add packages/core-shared/
git commit -m "feat: add logging, communication, and middleware modules to core-shared"
```

---

## Task 5: Infrastructure — PostgreSQL, Redis, Nginx

**Files:**
- Create: `infra/postgres/init.sql`
- Create: `infra/redis/redis.conf`
- Create: `infra/nginx/nginx.conf`

- [ ] **Step 1: Create PostgreSQL init script**

Create `infra/postgres/init.sql`:

```sql
-- Create databases for each service
CREATE DATABASE auth_db;
CREATE DATABASE websocket_db;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE auth_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE websocket_db TO postgres;
```

- [ ] **Step 2: Create Redis config**

Create `infra/redis/redis.conf`:

```conf
# Redis configuration for development
bind 0.0.0.0
port 6379
maxmemory 256mb
maxmemory-policy allkeys-lru
appendonly yes
appendfsync everysec
```

- [ ] **Step 3: Create Nginx config**

Create `infra/nginx/nginx.conf`:

```nginx
upstream auth_service {
    server auth:8001;
}

upstream websocket_service {
    server websocket:8002;
}

server {
    listen 80;
    server_name localhost;

    # Auth service
    location /auth/ {
        proxy_pass http://auth_service/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Request-ID $request_id;
    }

    # WebSocket service — HTTP endpoints
    location /ws/ {
        proxy_pass http://websocket_service/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Request-ID $request_id;
    }

    # WebSocket upgrade
    location /ws/connect {
        proxy_pass http://websocket_service/ws/connect;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }

    # Health check
    location /health {
        return 200 '{"status": "ok"}';
        add_header Content-Type application/json;
    }
}
```

- [ ] **Step 4: Commit**

```bash
git add infra/
git commit -m "feat: add infrastructure configs for PostgreSQL, Redis, and Nginx"
```

---

## Task 6: Podman Compose & Service .env Files

**Files:**
- Create: `podman-compose.yml`
- Create: `services/auth/.env.example`
- Create: `services/websocket/.env.example`

- [ ] **Step 1: Create podman-compose.yml**

Create `podman-compose.yml`:

```yaml
version: "3.9"

services:
  # --- Infrastructure ---
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./infra/nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      auth:
        condition: service_healthy
      websocket:
        condition: service_healthy
    restart: unless-stopped

  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infra/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server /usr/local/etc/redis/redis.conf
    volumes:
      - redis_data:/data
      - ./infra/redis/redis.conf:/usr/local/etc/redis/redis.conf:ro
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # --- Services ---
  auth:
    build:
      context: .
      dockerfile: services/auth/Dockerfile
    env_file: services/auth/.env
    ports:
      - "8001:8001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "python", "-c", "import httpx; httpx.get('http://localhost:8001/health')"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  websocket:
    build:
      context: .
      dockerfile: services/websocket/Dockerfile
    env_file: services/websocket/.env
    ports:
      - "8002:8002"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "python", "-c", "import httpx; httpx.get('http://localhost:8002/health')"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

- [ ] **Step 2: Create auth .env.example**

Create `services/auth/.env.example`:

```env
APP_NAME=auth-service
DEBUG=true
LOG_LEVEL=DEBUG

# Database
DATABASE_URL=postgres://postgres:postgres@postgres:5432/auth_db

# Redis
REDIS_URL=redis://redis:6379/0

# JWT
JWT_SECRET_KEY=change-me-in-production-use-a-long-random-string
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# OAuth2
OAUTH2_AUTHORIZATION_CODE_EXPIRE_MINUTES=10

# Server
HOST=0.0.0.0
PORT=8001
```

- [ ] **Step 3: Create websocket .env.example**

Create `services/websocket/.env.example`:

```env
APP_NAME=websocket-service
DEBUG=true
LOG_LEVEL=DEBUG

# Database
DATABASE_URL=postgres://postgres:postgres@postgres:5432/websocket_db

# Redis
REDIS_URL=redis://redis:6379/1

# JWT (same secret as auth service for local validation)
JWT_SECRET_KEY=change-me-in-production-use-a-long-random-string

# Server
HOST=0.0.0.0
PORT=8002
```

- [ ] **Step 4: Commit**

```bash
git add podman-compose.yml services/auth/.env.example services/websocket/.env.example
git commit -m "feat: add podman-compose and service environment configs"
```

---

## Task 7: Auth Service — Models & Schemas

**Files:**
- Create: `services/auth/pyproject.toml`
- Create: `services/auth/app/__init__.py`
- Create: `services/auth/app/config.py`
- Create: `services/auth/app/users/models.py`
- Create: `services/auth/app/users/schemas.py`
- Create: `services/auth/app/oauth/models.py`
- Create: `services/auth/app/oauth/schemas.py`
- Create: `services/auth/app/tokens/schemas.py`
- Test: `services/auth/tests/conftest.py`
- Test: `services/auth/tests/test_users/test_models.py`

- [ ] **Step 1: Create auth service pyproject.toml**

Create `services/auth/pyproject.toml`:

```toml
[project]
name = "auth-service"
version = "0.1.0"
description = "Authentication and authorization microservice"
requires-python = ">=3.13"
dependencies = [
    "core-shared @ file:///${PROJECT_ROOT}/packages/core-shared",
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.34.0",
    "tortoise-orm[asyncpg]>=0.22.0",
    "aerich>=0.8.0",
    "pydantic-settings>=2.7.0",
    "passlib[bcrypt]>=1.7.4",
    "redis[hiredis]>=5.2.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.25.0",
    "httpx>=0.28.0",
    "testcontainers[postgres,redis]>=4.9.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

- [ ] **Step 2: Create auth config**

Create `services/auth/app/__init__.py` (empty).

Create `services/auth/app/config.py`:

```python
from core_shared.config import BaseAppSettings


class AuthSettings(BaseAppSettings):
    database_url: str = "postgres://postgres:postgres@localhost:5432/auth_db"
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret_key: str = "change-me-in-production"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7

    oauth2_authorization_code_expire_minutes: int = 10

    host: str = "0.0.0.0"
    port: int = 8001


settings = AuthSettings()
```

- [ ] **Step 3: Create domain __init__ files**

Create `services/auth/app/users/__init__.py` (empty).
Create `services/auth/app/oauth/__init__.py` (empty).
Create `services/auth/app/tokens/__init__.py` (empty).

- [ ] **Step 4: Create User model**

Create `services/auth/app/users/models.py`:

```python
from tortoise import fields

from core_shared.database import BaseModel
from core_shared.database.mixins import TimestampMixin


class User(BaseModel, TimestampMixin):
    email = fields.CharField(max_length=255, unique=True, index=True)
    hashed_password = fields.CharField(max_length=255)
    is_active = fields.BooleanField(default=True)
    is_superuser = fields.BooleanField(default=False)

    class Meta:
        table = "users"
```

- [ ] **Step 5: Create User schemas**

Create `services/auth/app/users/schemas.py`:

```python
from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    password: str | None = None


class UserResponse(BaseModel):
    id: int
    email: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 6: Create OAuth models**

Create `services/auth/app/oauth/models.py`:

```python
from tortoise import fields

from core_shared.database import BaseModel
from core_shared.database.mixins import TimestampMixin


class OAuthClient(BaseModel, TimestampMixin):
    client_id = fields.CharField(max_length=255, unique=True, index=True)
    client_secret = fields.CharField(max_length=255)
    redirect_uri = fields.CharField(max_length=512)
    name = fields.CharField(max_length=255)
    scopes = fields.JSONField(default=[])
    grant_types = fields.JSONField(default=["authorization_code", "refresh_token"])
    is_active = fields.BooleanField(default=True)

    class Meta:
        table = "oauth_clients"


class AuthorizationCode(BaseModel, TimestampMixin):
    code = fields.CharField(max_length=255, unique=True, index=True)
    client = fields.ForeignKeyField("models.OAuthClient", related_name="auth_codes")
    user = fields.ForeignKeyField("models.User", related_name="auth_codes")
    redirect_uri = fields.CharField(max_length=512)
    scopes = fields.JSONField(default=[])
    expires_at = fields.DatetimeField()
    is_used = fields.BooleanField(default=False)

    class Meta:
        table = "authorization_codes"


class RefreshToken(BaseModel, TimestampMixin):
    token = fields.CharField(max_length=512, unique=True, index=True)
    user = fields.ForeignKeyField("models.User", related_name="refresh_tokens")
    client = fields.ForeignKeyField("models.OAuthClient", related_name="refresh_tokens", null=True)
    scopes = fields.JSONField(default=[])
    expires_at = fields.DatetimeField()
    is_revoked = fields.BooleanField(default=False)

    class Meta:
        table = "refresh_tokens"
```

- [ ] **Step 7: Create OAuth schemas**

Create `services/auth/app/oauth/schemas.py`:

```python
from pydantic import BaseModel


class OAuthClientCreate(BaseModel):
    name: str
    redirect_uri: str
    scopes: list[str] = []
    grant_types: list[str] = ["authorization_code", "refresh_token"]


class OAuthClientResponse(BaseModel):
    id: int
    client_id: str
    name: str
    redirect_uri: str
    scopes: list[str]
    grant_types: list[str]
    is_active: bool

    model_config = {"from_attributes": True}


class AuthorizationRequest(BaseModel):
    response_type: str = "code"
    client_id: str
    redirect_uri: str
    scope: str = ""
    state: str | None = None


class TokenRequest(BaseModel):
    grant_type: str
    code: str | None = None
    redirect_uri: str | None = None
    client_id: str | None = None
    client_secret: str | None = None
    refresh_token: str | None = None
    scope: str | None = None
```

- [ ] **Step 8: Create Token schemas**

Create `services/auth/app/tokens/schemas.py`:

```python
from pydantic import BaseModel


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: str | None = None
    scope: str = ""


class TokenVerifyRequest(BaseModel):
    token: str


class TokenVerifyResponse(BaseModel):
    active: bool
    sub: str | None = None
    scopes: list[str] = []
    exp: int | None = None
```

- [ ] **Step 9: Write test for User model with testcontainers**

Create `services/auth/tests/__init__.py` (empty).
Create `services/auth/tests/test_users/__init__.py` (empty).
Create `services/auth/tests/test_oauth/__init__.py` (empty).
Create `services/auth/tests/test_tokens/__init__.py` (empty).

Create `services/auth/tests/conftest.py`:

```python
import asyncio
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from testcontainers.postgres import PostgresContainer
from tortoise import Tortoise


TORTOISE_MODELS = [
    "app.users.models",
    "app.oauth.models",
]


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def postgres_url():
    with PostgresContainer("postgres:17-alpine") as postgres:
        yield postgres.get_connection_url().replace("postgresql+psycopg2://", "postgres://")


@pytest.fixture(autouse=True)
async def init_db(postgres_url):
    await Tortoise.init(
        db_url=postgres_url,
        modules={"models": TORTOISE_MODELS},
    )
    await Tortoise.generate_schemas()
    yield
    await Tortoise._drop_databases()
    await Tortoise.close_connections()


@pytest.fixture
async def client(init_db) -> AsyncGenerator[AsyncClient, None]:
    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
```

Create `services/auth/tests/test_users/test_models.py`:

```python
import pytest

from app.users.models import User


@pytest.mark.asyncio
async def test_create_user(init_db):
    user = await User.create(
        email="test@example.com",
        hashed_password="hashed123",
    )
    assert user.id is not None
    assert user.email == "test@example.com"
    assert user.is_active is True
    assert user.is_superuser is False


@pytest.mark.asyncio
async def test_user_unique_email(init_db):
    await User.create(email="unique@example.com", hashed_password="hash1")
    with pytest.raises(Exception):
        await User.create(email="unique@example.com", hashed_password="hash2")
```

- [ ] **Step 10: Run test to verify it works**

```bash
cd services/auth && pip install -e ".[dev]" && pip install -e ../../packages/core-shared && python -m pytest tests/test_users/test_models.py -v
```

Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add services/auth/
git commit -m "feat: add auth service models, schemas, config, and test setup with testcontainers"
```

---

## Task 8: Auth Service — Users Domain (Service + Router)

**Files:**
- Create: `services/auth/app/users/service.py`
- Create: `services/auth/app/users/router.py`
- Create: `services/auth/app/dependencies.py`
- Test: `services/auth/tests/test_users/test_service.py`
- Test: `services/auth/tests/test_users/test_router.py`

- [ ] **Step 1: Write failing test for user service**

Create `services/auth/tests/test_users/test_service.py`:

```python
import pytest

from app.users.service import create_user, get_user_by_email, update_user
from app.users.schemas import UserCreate, UserUpdate


@pytest.mark.asyncio
async def test_create_user(init_db):
    user_data = UserCreate(email="test@example.com", password="StrongPass123!")
    user = await create_user(user_data)
    assert user.email == "test@example.com"
    assert user.hashed_password != "StrongPass123!"  # should be hashed


@pytest.mark.asyncio
async def test_get_user_by_email(init_db):
    user_data = UserCreate(email="find@example.com", password="StrongPass123!")
    await create_user(user_data)
    found = await get_user_by_email("find@example.com")
    assert found is not None
    assert found.email == "find@example.com"


@pytest.mark.asyncio
async def test_get_user_by_email_not_found(init_db):
    found = await get_user_by_email("nonexistent@example.com")
    assert found is None


@pytest.mark.asyncio
async def test_update_user(init_db):
    user_data = UserCreate(email="update@example.com", password="StrongPass123!")
    user = await create_user(user_data)
    updated = await update_user(user.id, UserUpdate(email="new@example.com"))
    assert updated.email == "new@example.com"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd services/auth && python -m pytest tests/test_users/test_service.py -v
```

Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Implement user service**

Create `services/auth/app/users/service.py`:

```python
from passlib.hash import bcrypt

from app.users.models import User
from app.users.schemas import UserCreate, UserUpdate


async def create_user(data: UserCreate) -> User:
    hashed_password = bcrypt.hash(data.password)
    return await User.create(email=data.email, hashed_password=hashed_password)


async def get_user_by_email(email: str) -> User | None:
    return await User.get_or_none(email=email)


async def get_user_by_id(user_id: int) -> User | None:
    return await User.get_or_none(id=user_id)


async def update_user(user_id: int, data: UserUpdate) -> User:
    user = await User.get(id=user_id)
    update_data = data.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = bcrypt.hash(update_data.pop("password"))
    await user.update_from_dict(update_data).save()
    return user


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.verify(plain_password, hashed_password)
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd services/auth && python -m pytest tests/test_users/test_service.py -v
```

Expected: PASS

- [ ] **Step 5: Create auth dependencies**

Create `services/auth/app/dependencies.py`:

```python
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.config import settings
from app.users.models import User
from core_shared.auth import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    try:
        payload = decode_token(token, secret_key=settings.jwt_secret_key)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await User.get_or_none(id=int(payload.sub))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user
```

- [ ] **Step 6: Write failing test for user router**

Create `services/auth/tests/test_users/test_router.py`:

```python
import pytest
from httpx import ASGITransport, AsyncClient


@pytest.mark.asyncio
async def test_register_user(client):
    response = await client.post("/users/register", json={
        "email": "new@example.com",
        "password": "StrongPass123!",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new@example.com"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    await client.post("/users/register", json={
        "email": "dup@example.com",
        "password": "StrongPass123!",
    })
    response = await client.post("/users/register", json={
        "email": "dup@example.com",
        "password": "StrongPass123!",
    })
    assert response.status_code == 409
```

- [ ] **Step 7: Implement user router**

Create `services/auth/app/users/router.py`:

```python
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.users.models import User
from app.users.schemas import UserCreate, UserResponse, UserUpdate
from app.users.service import create_user, get_user_by_email, update_user

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate):
    existing = await get_user_by_email(data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    user = await create_user(data)
    return user


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
):
    return await update_user(current_user.id, data)
```

- [ ] **Step 8: Create minimal main.py for testing**

Create `services/auth/app/main.py`:

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from tortoise import Tortoise

from app.config import settings
from app.users.router import router as users_router
from core_shared.logging import setup_logging
from core_shared.middleware import RequestIdMiddleware, setup_cors, setup_error_handler

TORTOISE_ORM = {
    "connections": {"default": settings.database_url},
    "apps": {
        "models": {
            "models": ["app.users.models", "app.oauth.models", "aerich.models"],
            "default_connection": "default",
        }
    },
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(log_level=settings.log_level)
    await Tortoise.init(config=TORTOISE_ORM)
    await Tortoise.generate_schemas()
    yield
    await Tortoise.close_connections()


app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
)

setup_cors(app)
setup_error_handler(app)
app.add_middleware(RequestIdMiddleware)

app.include_router(users_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 9: Run router tests**

```bash
cd services/auth && python -m pytest tests/test_users/ -v
```

Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add services/auth/
git commit -m "feat: add auth service users domain with registration, profile, and tests"
```

---

## Task 9: Auth Service — Tokens Domain

**Files:**
- Create: `services/auth/app/tokens/service.py`
- Create: `services/auth/app/tokens/router.py`
- Test: `services/auth/tests/test_tokens/test_service.py`
- Test: `services/auth/tests/test_tokens/test_router.py`

- [ ] **Step 1: Write failing test for token service**

Create `services/auth/tests/test_tokens/test_service.py`:

```python
import pytest

from app.tokens.service import create_token_pair, verify_access_token, refresh_access_token
from app.users.service import create_user
from app.users.schemas import UserCreate
from app.config import settings


@pytest.mark.asyncio
async def test_create_token_pair(init_db):
    user = await create_user(UserCreate(email="token@example.com", password="Pass123!"))
    tokens = await create_token_pair(user, scopes=["read:users"])
    assert tokens.access_token is not None
    assert tokens.refresh_token is not None
    assert tokens.token_type == "bearer"
    assert tokens.expires_in == settings.jwt_access_token_expire_minutes * 60


@pytest.mark.asyncio
async def test_verify_access_token(init_db):
    user = await create_user(UserCreate(email="verify@example.com", password="Pass123!"))
    tokens = await create_token_pair(user, scopes=["read:users"])
    result = verify_access_token(tokens.access_token)
    assert result.active is True
    assert result.sub == str(user.id)
    assert "read:users" in result.scopes


@pytest.mark.asyncio
async def test_refresh_access_token(init_db):
    user = await create_user(UserCreate(email="refresh@example.com", password="Pass123!"))
    tokens = await create_token_pair(user, scopes=["read:users"])
    new_tokens = await refresh_access_token(tokens.refresh_token)
    assert new_tokens.access_token is not None
    assert new_tokens.access_token != tokens.access_token
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd services/auth && python -m pytest tests/test_tokens/test_service.py -v
```

Expected: FAIL

- [ ] **Step 3: Implement token service**

Create `services/auth/app/tokens/service.py`:

```python
import secrets
from datetime import UTC, datetime, timedelta

from app.config import settings
from app.oauth.models import RefreshToken
from app.tokens.schemas import TokenResponse, TokenVerifyResponse
from app.users.models import User
from core_shared.auth import create_access_token, decode_token


async def create_token_pair(
    user: User,
    scopes: list[str] | None = None,
    client_id: int | None = None,
) -> TokenResponse:
    scopes = scopes or []
    access_token = create_access_token(
        data={"sub": str(user.id), "scopes": scopes},
        secret_key=settings.jwt_secret_key,
        expires_delta=timedelta(minutes=settings.jwt_access_token_expire_minutes),
    )

    refresh_token_str = secrets.token_urlsafe(64)
    await RefreshToken.create(
        token=refresh_token_str,
        user=user,
        client_id=client_id,
        scopes=scopes,
        expires_at=datetime.now(UTC) + timedelta(days=settings.jwt_refresh_token_expire_days),
    )

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.jwt_access_token_expire_minutes * 60,
        refresh_token=refresh_token_str,
        scope=" ".join(scopes),
    )


def verify_access_token(token: str) -> TokenVerifyResponse:
    try:
        payload = decode_token(token, secret_key=settings.jwt_secret_key)
        return TokenVerifyResponse(
            active=True,
            sub=payload.sub,
            scopes=payload.scopes,
            exp=payload.exp,
        )
    except ValueError:
        return TokenVerifyResponse(active=False)


async def refresh_access_token(refresh_token: str) -> TokenResponse:
    stored = await RefreshToken.get_or_none(token=refresh_token, is_revoked=False).prefetch_related("user")
    if stored is None or stored.expires_at < datetime.now(UTC):
        raise ValueError("Invalid or expired refresh token")

    stored.is_revoked = True
    await stored.save()

    return await create_token_pair(stored.user, scopes=stored.scopes)
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd services/auth && python -m pytest tests/test_tokens/test_service.py -v
```

Expected: PASS

- [ ] **Step 5: Write failing test for token router**

Create `services/auth/tests/test_tokens/test_router.py`:

```python
import pytest
from httpx import ASGITransport, AsyncClient


@pytest.mark.asyncio
async def test_login(client):
    # Register first
    await client.post("/users/register", json={
        "email": "login@example.com",
        "password": "Pass123!",
    })
    # Login
    response = await client.post("/token", data={
        "grant_type": "password",
        "username": "login@example.com",
        "password": "Pass123!",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post("/users/register", json={
        "email": "wrong@example.com",
        "password": "Pass123!",
    })
    response = await client.post("/token", data={
        "grant_type": "password",
        "username": "wrong@example.com",
        "password": "WrongPass!",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_token_refresh(client):
    await client.post("/users/register", json={
        "email": "refreshrouter@example.com",
        "password": "Pass123!",
    })
    login = await client.post("/token", data={
        "grant_type": "password",
        "username": "refreshrouter@example.com",
        "password": "Pass123!",
    })
    refresh_token = login.json()["refresh_token"]
    response = await client.post("/token/refresh", json={
        "refresh_token": refresh_token,
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_token_verify(client):
    await client.post("/users/register", json={
        "email": "verifyr@example.com",
        "password": "Pass123!",
    })
    login = await client.post("/token", data={
        "grant_type": "password",
        "username": "verifyr@example.com",
        "password": "Pass123!",
    })
    token = login.json()["access_token"]
    response = await client.post("/token/verify", json={"token": token})
    assert response.status_code == 200
    assert response.json()["active"] is True
```

- [ ] **Step 6: Implement token router**

Create `services/auth/app/tokens/router.py`:

```python
from fastapi import APIRouter, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Depends
from typing import Annotated

from app.tokens.schemas import TokenResponse, TokenVerifyRequest, TokenVerifyResponse
from app.tokens.service import create_token_pair, refresh_access_token, verify_access_token
from app.users.service import get_user_by_email, verify_password

router = APIRouter(tags=["tokens"])


@router.post("/token", response_model=TokenResponse)
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = await get_user_by_email(form_data.username)
    if user is None or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return await create_token_pair(user, scopes=form_data.scopes)


@router.post("/token/refresh", response_model=TokenResponse)
async def refresh(data: dict):
    try:
        return await refresh_access_token(data["refresh_token"])
    except (ValueError, KeyError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.post("/token/verify", response_model=TokenVerifyResponse)
async def verify(data: TokenVerifyRequest):
    return verify_access_token(data.token)
```

- [ ] **Step 7: Add token router to main.py**

Modify `services/auth/app/main.py` — add after the users_router import:

```python
from app.tokens.router import router as tokens_router
```

Add after `app.include_router(users_router)`:

```python
app.include_router(tokens_router)
```

- [ ] **Step 8: Run all token tests**

```bash
cd services/auth && python -m pytest tests/test_tokens/ -v
```

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add services/auth/
git commit -m "feat: add auth service tokens domain with login, refresh, verify"
```

---

## Task 10: Auth Service — OAuth Domain

**Files:**
- Create: `services/auth/app/oauth/service.py`
- Create: `services/auth/app/oauth/router.py`
- Test: `services/auth/tests/test_oauth/test_service.py`
- Test: `services/auth/tests/test_oauth/test_router.py`

- [ ] **Step 1: Write failing test for OAuth service**

Create `services/auth/tests/test_oauth/test_service.py`:

```python
import pytest

from app.oauth.service import (
    create_oauth_client,
    create_authorization_code,
    exchange_authorization_code,
    client_credentials_grant,
)
from app.oauth.schemas import OAuthClientCreate
from app.users.service import create_user
from app.users.schemas import UserCreate


@pytest.mark.asyncio
async def test_create_oauth_client(init_db):
    data = OAuthClientCreate(
        name="Test App",
        redirect_uri="http://localhost:3000/callback",
        scopes=["read:users", "write:users"],
    )
    client = await create_oauth_client(data)
    assert client.name == "Test App"
    assert client.client_id is not None
    assert client.client_secret is not None
    assert client.scopes == ["read:users", "write:users"]


@pytest.mark.asyncio
async def test_authorization_code_flow(init_db):
    user = await create_user(UserCreate(email="oauth@example.com", password="Pass123!"))
    client_data = OAuthClientCreate(
        name="OAuth App",
        redirect_uri="http://localhost:3000/callback",
        scopes=["read:users"],
    )
    client = await create_oauth_client(client_data)

    code = await create_authorization_code(
        client_id=client.client_id,
        user_id=user.id,
        redirect_uri="http://localhost:3000/callback",
        scopes=["read:users"],
    )
    assert code is not None

    tokens = await exchange_authorization_code(
        code=code,
        client_id=client.client_id,
        client_secret=client.client_secret,
        redirect_uri="http://localhost:3000/callback",
    )
    assert tokens.access_token is not None
    assert tokens.refresh_token is not None


@pytest.mark.asyncio
async def test_client_credentials_grant(init_db):
    client_data = OAuthClientCreate(
        name="Service App",
        redirect_uri="http://localhost:3000/callback",
        scopes=["read:users"],
        grant_types=["client_credentials"],
    )
    client = await create_oauth_client(client_data)

    tokens = await client_credentials_grant(
        client_id=client.client_id,
        client_secret=client.client_secret,
        scopes=["read:users"],
    )
    assert tokens.access_token is not None
    assert tokens.refresh_token is None  # no refresh token for client_credentials
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd services/auth && python -m pytest tests/test_oauth/test_service.py -v
```

Expected: FAIL

- [ ] **Step 3: Implement OAuth service**

Create `services/auth/app/oauth/service.py`:

```python
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status

from app.config import settings
from app.oauth.models import AuthorizationCode, OAuthClient
from app.oauth.schemas import OAuthClientCreate
from app.tokens.schemas import TokenResponse
from app.tokens.service import create_token_pair
from app.users.models import User
from core_shared.auth import create_access_token


async def create_oauth_client(data: OAuthClientCreate) -> OAuthClient:
    return await OAuthClient.create(
        client_id=secrets.token_urlsafe(32),
        client_secret=secrets.token_urlsafe(64),
        name=data.name,
        redirect_uri=data.redirect_uri,
        scopes=data.scopes,
        grant_types=data.grant_types,
    )


async def get_oauth_client(client_id: str) -> OAuthClient | None:
    return await OAuthClient.get_or_none(client_id=client_id, is_active=True)


async def create_authorization_code(
    client_id: str,
    user_id: int,
    redirect_uri: str,
    scopes: list[str],
) -> str:
    client = await get_oauth_client(client_id)
    if client is None:
        raise ValueError("Invalid client_id")

    if redirect_uri != client.redirect_uri:
        raise ValueError("Invalid redirect_uri")

    invalid_scopes = set(scopes) - set(client.scopes)
    if invalid_scopes:
        raise ValueError(f"Invalid scopes: {invalid_scopes}")

    code = secrets.token_urlsafe(48)
    await AuthorizationCode.create(
        code=code,
        client=client,
        user_id=user_id,
        redirect_uri=redirect_uri,
        scopes=scopes,
        expires_at=datetime.now(UTC) + timedelta(minutes=settings.oauth2_authorization_code_expire_minutes),
    )
    return code


async def exchange_authorization_code(
    code: str,
    client_id: str,
    client_secret: str,
    redirect_uri: str,
) -> TokenResponse:
    auth_code = await AuthorizationCode.get_or_none(
        code=code, is_used=False
    ).prefetch_related("client", "user")

    if auth_code is None:
        raise ValueError("Invalid authorization code")

    if auth_code.expires_at < datetime.now(UTC):
        raise ValueError("Authorization code expired")

    if auth_code.client.client_id != client_id:
        raise ValueError("Client mismatch")

    if auth_code.client.client_secret != client_secret:
        raise ValueError("Invalid client secret")

    if auth_code.redirect_uri != redirect_uri:
        raise ValueError("Redirect URI mismatch")

    auth_code.is_used = True
    await auth_code.save()

    return await create_token_pair(
        auth_code.user,
        scopes=auth_code.scopes,
        client_id=auth_code.client.id,
    )


async def client_credentials_grant(
    client_id: str,
    client_secret: str,
    scopes: list[str],
) -> TokenResponse:
    client = await get_oauth_client(client_id)
    if client is None or client.client_secret != client_secret:
        raise ValueError("Invalid client credentials")

    if "client_credentials" not in client.grant_types:
        raise ValueError("Grant type not allowed")

    invalid_scopes = set(scopes) - set(client.scopes)
    if invalid_scopes:
        raise ValueError(f"Invalid scopes: {invalid_scopes}")

    access_token = create_access_token(
        data={"sub": f"client:{client.id}", "scopes": scopes},
        secret_key=settings.jwt_secret_key,
        expires_delta=timedelta(minutes=settings.jwt_access_token_expire_minutes),
    )

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.jwt_access_token_expire_minutes * 60,
        refresh_token=None,
        scope=" ".join(scopes),
    )
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd services/auth && python -m pytest tests/test_oauth/test_service.py -v
```

Expected: PASS

- [ ] **Step 5: Implement OAuth router**

Create `services/auth/app/oauth/router.py`:

```python
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.oauth.schemas import (
    AuthorizationRequest,
    OAuthClientCreate,
    OAuthClientResponse,
    TokenRequest,
)
from app.oauth.service import (
    client_credentials_grant,
    create_authorization_code,
    create_oauth_client,
    exchange_authorization_code,
)
from app.tokens.schemas import TokenResponse
from app.users.models import User

router = APIRouter(prefix="/oauth", tags=["oauth"])


@router.post("/clients", response_model=OAuthClientResponse, status_code=status.HTTP_201_CREATED)
async def register_client(
    data: OAuthClientCreate,
    current_user: Annotated[User, Depends(get_current_user)],
):
    return await create_oauth_client(data)


@router.post("/authorize")
async def authorize(
    data: AuthorizationRequest,
    current_user: Annotated[User, Depends(get_current_user)],
):
    try:
        code = await create_authorization_code(
            client_id=data.client_id,
            user_id=current_user.id,
            redirect_uri=data.redirect_uri,
            scopes=data.scope.split() if data.scope else [],
        )
        return {
            "code": code,
            "state": data.state,
            "redirect_uri": f"{data.redirect_uri}?code={code}&state={data.state or ''}",
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/token", response_model=TokenResponse)
async def token(data: TokenRequest):
    try:
        if data.grant_type == "authorization_code":
            return await exchange_authorization_code(
                code=data.code,
                client_id=data.client_id,
                client_secret=data.client_secret,
                redirect_uri=data.redirect_uri,
            )
        elif data.grant_type == "client_credentials":
            return await client_credentials_grant(
                client_id=data.client_id,
                client_secret=data.client_secret,
                scopes=data.scope.split() if data.scope else [],
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported grant_type: {data.grant_type}",
            )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/revoke")
async def revoke():
    return {"status": "revoked"}
```

- [ ] **Step 6: Add OAuth router to main.py**

Modify `services/auth/app/main.py` — add import:

```python
from app.oauth.router import router as oauth_router
```

Add after other `include_router` calls:

```python
app.include_router(oauth_router)
```

- [ ] **Step 7: Run all auth tests**

```bash
cd services/auth && python -m pytest tests/ -v
```

Expected: All PASS

- [ ] **Step 8: Commit**

```bash
git add services/auth/
git commit -m "feat: add auth service OAuth2 domain with authorization code and client credentials flows"
```

---

## Task 11: Auth Service — Dockerfile

**Files:**
- Create: `services/auth/Dockerfile`

- [ ] **Step 1: Create Dockerfile**

Create `services/auth/Dockerfile`:

```dockerfile
FROM python:3.13-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install core-shared first
COPY packages/core-shared /tmp/core-shared
RUN pip install --no-cache-dir /tmp/core-shared && rm -rf /tmp/core-shared

# Install service dependencies
COPY services/auth/pyproject.toml .
RUN pip install --no-cache-dir .

# Copy service code
COPY services/auth/app ./app

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

- [ ] **Step 2: Verify Dockerfile builds**

```bash
cd /Users/ahmedtuzinac/projects/backned-arch && podman build -f services/auth/Dockerfile -t auth-service .
```

Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add services/auth/Dockerfile
git commit -m "feat: add Dockerfile for auth service"
```

---

## Task 12: WebSocket Service — Models, Config, Schemas

**Files:**
- Create: `services/websocket/pyproject.toml`
- Create: `services/websocket/app/__init__.py`
- Create: `services/websocket/app/config.py`
- Create: `services/websocket/app/dependencies.py`
- Create: `services/websocket/app/connections/__init__.py`
- Create: `services/websocket/app/connections/models.py`
- Create: `services/websocket/app/connections/schemas.py`
- Create: `services/websocket/app/handlers/__init__.py`
- Create: `services/websocket/app/handlers/schemas.py`

- [ ] **Step 1: Create websocket service pyproject.toml**

Create `services/websocket/pyproject.toml`:

```toml
[project]
name = "websocket-service"
version = "0.1.0"
description = "WebSocket microservice for real-time communication"
requires-python = ">=3.13"
dependencies = [
    "core-shared @ file:///${PROJECT_ROOT}/packages/core-shared",
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.34.0",
    "tortoise-orm[asyncpg]>=0.22.0",
    "aerich>=0.8.0",
    "pydantic-settings>=2.7.0",
    "redis[hiredis]>=5.2.0",
    "websockets>=14.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.25.0",
    "httpx>=0.28.0",
    "testcontainers[postgres,redis]>=4.9.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

- [ ] **Step 2: Create websocket config**

Create `services/websocket/app/__init__.py` (empty).
Create `services/websocket/app/connections/__init__.py` (empty).
Create `services/websocket/app/handlers/__init__.py` (empty).

Create `services/websocket/app/config.py`:

```python
from core_shared.config import BaseAppSettings


class WebSocketSettings(BaseAppSettings):
    database_url: str = "postgres://postgres:postgres@localhost:5432/websocket_db"
    redis_url: str = "redis://localhost:6379/1"
    jwt_secret_key: str = "change-me-in-production"
    host: str = "0.0.0.0"
    port: int = 8002


settings = WebSocketSettings()
```

- [ ] **Step 3: Create websocket dependencies**

Create `services/websocket/app/dependencies.py`:

```python
import redis.asyncio as redis

from app.config import settings

redis_client: redis.Redis | None = None


async def get_redis() -> redis.Redis:
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(settings.redis_url)
    return redis_client


async def close_redis() -> None:
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None
```

- [ ] **Step 4: Create connection models and schemas**

Create `services/websocket/app/connections/models.py`:

```python
from tortoise import fields

from core_shared.database import BaseModel
from core_shared.database.mixins import TimestampMixin


class Room(BaseModel, TimestampMixin):
    name = fields.CharField(max_length=255, unique=True, index=True)
    is_active = fields.BooleanField(default=True)

    class Meta:
        table = "rooms"
```

Create `services/websocket/app/connections/schemas.py`:

```python
from datetime import datetime

from pydantic import BaseModel


class RoomCreate(BaseModel):
    name: str


class RoomResponse(BaseModel):
    id: int
    name: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class WSMessage(BaseModel):
    type: str  # "message", "join", "leave", "broadcast"
    room: str | None = None
    content: str = ""
    target_user_id: str | None = None
```

Create `services/websocket/app/handlers/schemas.py`:

```python
from pydantic import BaseModel


class SendMessageRequest(BaseModel):
    room: str | None = None
    user_id: str | None = None
    content: str
    type: str = "message"


class SendMessageResponse(BaseModel):
    status: str = "sent"
    recipients: int = 0
```

- [ ] **Step 5: Commit**

```bash
git add services/websocket/
git commit -m "feat: add websocket service scaffolding with models, schemas, config"
```

---

## Task 13: WebSocket Service — ConnectionManager

**Files:**
- Create: `services/websocket/app/connections/manager.py`
- Test: `services/websocket/tests/test_connections/test_manager.py`

- [ ] **Step 1: Create test conftest**

Create `services/websocket/tests/__init__.py` (empty).
Create `services/websocket/tests/test_connections/__init__.py` (empty).
Create `services/websocket/tests/test_handlers/__init__.py` (empty).

Create `services/websocket/tests/conftest.py`:

```python
import asyncio
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from testcontainers.postgres import PostgresContainer
from testcontainers.redis import RedisContainer
from tortoise import Tortoise


TORTOISE_MODELS = [
    "app.connections.models",
]


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def postgres_url():
    with PostgresContainer("postgres:17-alpine") as postgres:
        yield postgres.get_connection_url().replace("postgresql+psycopg2://", "postgres://")


@pytest.fixture(scope="session")
def redis_url():
    with RedisContainer("redis:7-alpine") as redis_container:
        yield f"redis://{redis_container.get_container_host_ip()}:{redis_container.get_exposed_port(6379)}/0"


@pytest.fixture(autouse=True)
async def init_db(postgres_url):
    await Tortoise.init(
        db_url=postgres_url,
        modules={"models": TORTOISE_MODELS},
    )
    await Tortoise.generate_schemas()
    yield
    await Tortoise._drop_databases()
    await Tortoise.close_connections()


@pytest.fixture
async def client(init_db) -> AsyncGenerator[AsyncClient, None]:
    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
```

- [ ] **Step 2: Write failing test for ConnectionManager**

Create `services/websocket/tests/test_connections/test_manager.py`:

```python
import pytest
from unittest.mock import AsyncMock, MagicMock

from app.connections.manager import ConnectionManager


@pytest.fixture
def manager():
    return ConnectionManager()


@pytest.fixture
def mock_ws():
    ws = AsyncMock()
    ws.send_json = AsyncMock()
    ws.close = AsyncMock()
    return ws


@pytest.mark.asyncio
async def test_connect(manager, mock_ws):
    await manager.connect(mock_ws, user_id="user1")
    assert "user1" in manager.active_connections


@pytest.mark.asyncio
async def test_disconnect(manager, mock_ws):
    await manager.connect(mock_ws, user_id="user1")
    manager.disconnect(user_id="user1")
    assert "user1" not in manager.active_connections


@pytest.mark.asyncio
async def test_join_room(manager, mock_ws):
    await manager.connect(mock_ws, user_id="user1")
    manager.join_room(user_id="user1", room="general")
    assert "user1" in manager.rooms["general"]


@pytest.mark.asyncio
async def test_leave_room(manager, mock_ws):
    await manager.connect(mock_ws, user_id="user1")
    manager.join_room(user_id="user1", room="general")
    manager.leave_room(user_id="user1", room="general")
    assert "user1" not in manager.rooms.get("general", set())


@pytest.mark.asyncio
async def test_send_to_user(manager, mock_ws):
    await manager.connect(mock_ws, user_id="user1")
    await manager.send_to_user("user1", {"type": "message", "content": "hello"})
    mock_ws.send_json.assert_called_once_with({"type": "message", "content": "hello"})


@pytest.mark.asyncio
async def test_broadcast_to_room(manager, mock_ws):
    ws2 = AsyncMock()
    ws2.send_json = AsyncMock()

    await manager.connect(mock_ws, user_id="user1")
    await manager.connect(ws2, user_id="user2")
    manager.join_room(user_id="user1", room="general")
    manager.join_room(user_id="user2", room="general")

    await manager.broadcast_to_room("general", {"type": "message", "content": "hello all"})
    mock_ws.send_json.assert_called_once()
    ws2.send_json.assert_called_once()
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd services/websocket && pip install -e ".[dev]" && pip install -e ../../packages/core-shared && python -m pytest tests/test_connections/test_manager.py -v
```

Expected: FAIL

- [ ] **Step 4: Implement ConnectionManager**

Create `services/websocket/app/connections/manager.py`:

```python
from collections import defaultdict
from typing import Any

import structlog
from fastapi import WebSocket

logger = structlog.get_logger()


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: dict[str, WebSocket] = {}
        self.rooms: dict[str, set[str]] = defaultdict(set)

    async def connect(self, websocket: WebSocket, user_id: str) -> None:
        await websocket.accept()
        self.active_connections[user_id] = websocket
        await logger.ainfo("ws_connected", user_id=user_id)

    def disconnect(self, user_id: str) -> None:
        self.active_connections.pop(user_id, None)
        for room_users in self.rooms.values():
            room_users.discard(user_id)

    def join_room(self, user_id: str, room: str) -> None:
        self.rooms[room].add(user_id)

    def leave_room(self, user_id: str, room: str) -> None:
        if room in self.rooms:
            self.rooms[room].discard(user_id)
            if not self.rooms[room]:
                del self.rooms[room]

    async def send_to_user(self, user_id: str, data: dict[str, Any]) -> bool:
        ws = self.active_connections.get(user_id)
        if ws is None:
            return False
        await ws.send_json(data)
        return True

    async def broadcast_to_room(self, room: str, data: dict[str, Any]) -> int:
        user_ids = self.rooms.get(room, set())
        sent = 0
        for user_id in user_ids:
            if await self.send_to_user(user_id, data):
                sent += 1
        return sent

    async def broadcast_all(self, data: dict[str, Any]) -> int:
        sent = 0
        for user_id in list(self.active_connections):
            if await self.send_to_user(user_id, data):
                sent += 1
        return sent
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd services/websocket && python -m pytest tests/test_connections/test_manager.py -v
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add services/websocket/
git commit -m "feat: add WebSocket ConnectionManager with room support and tests"
```

---

## Task 14: WebSocket Service — Routers & Main

**Files:**
- Create: `services/websocket/app/connections/router.py`
- Create: `services/websocket/app/handlers/router.py`
- Create: `services/websocket/app/handlers/service.py`
- Create: `services/websocket/app/main.py`
- Test: `services/websocket/tests/test_handlers/test_router.py`

- [ ] **Step 1: Implement WebSocket connection router**

Create `services/websocket/app/connections/router.py`:

```python
import structlog
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.config import settings
from app.connections.manager import ConnectionManager
from app.connections.schemas import WSMessage
from core_shared.auth import decode_token

logger = structlog.get_logger()

router = APIRouter()
manager = ConnectionManager()


def get_manager() -> ConnectionManager:
    return manager


@router.websocket("/ws/connect")
async def websocket_endpoint(websocket: WebSocket, token: str | None = None):
    if token is None:
        await websocket.close(code=4001, reason="Missing token")
        return

    try:
        payload = decode_token(token, secret_key=settings.jwt_secret_key)
        user_id = payload.sub
    except ValueError:
        await websocket.close(code=4001, reason="Invalid token")
        return

    await manager.connect(websocket, user_id=user_id)

    try:
        while True:
            data = await websocket.receive_json()
            msg = WSMessage(**data)

            if msg.type == "join":
                manager.join_room(user_id=user_id, room=msg.room)
                await manager.send_to_user(user_id, {"type": "joined", "room": msg.room})

            elif msg.type == "leave":
                manager.leave_room(user_id=user_id, room=msg.room)
                await manager.send_to_user(user_id, {"type": "left", "room": msg.room})

            elif msg.type == "message" and msg.room:
                await manager.broadcast_to_room(msg.room, {
                    "type": "message",
                    "room": msg.room,
                    "content": msg.content,
                    "from": user_id,
                })

            elif msg.type == "direct" and msg.target_user_id:
                await manager.send_to_user(msg.target_user_id, {
                    "type": "direct",
                    "content": msg.content,
                    "from": user_id,
                })

    except WebSocketDisconnect:
        manager.disconnect(user_id=user_id)
        await logger.ainfo("ws_disconnected", user_id=user_id)
```

- [ ] **Step 2: Implement handlers service and router**

Create `services/websocket/app/handlers/service.py`:

```python
from app.connections.router import get_manager
from app.handlers.schemas import SendMessageRequest, SendMessageResponse


async def send_message(data: SendMessageRequest) -> SendMessageResponse:
    mgr = get_manager()

    if data.user_id:
        sent = await mgr.send_to_user(data.user_id, {
            "type": data.type,
            "content": data.content,
        })
        return SendMessageResponse(recipients=1 if sent else 0)

    if data.room:
        count = await mgr.broadcast_to_room(data.room, {
            "type": data.type,
            "room": data.room,
            "content": data.content,
        })
        return SendMessageResponse(recipients=count)

    count = await mgr.broadcast_all({
        "type": data.type,
        "content": data.content,
    })
    return SendMessageResponse(recipients=count)
```

Create `services/websocket/app/handlers/router.py`:

```python
from fastapi import APIRouter

from app.handlers.schemas import SendMessageRequest, SendMessageResponse
from app.handlers.service import send_message

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("/send", response_model=SendMessageResponse)
async def send(data: SendMessageRequest):
    return await send_message(data)
```

- [ ] **Step 3: Create main.py**

Create `services/websocket/app/main.py`:

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from tortoise import Tortoise

from app.config import settings
from app.connections.router import router as ws_router
from app.dependencies import close_redis
from app.handlers.router import router as handlers_router
from core_shared.logging import setup_logging
from core_shared.middleware import RequestIdMiddleware, setup_cors, setup_error_handler

TORTOISE_ORM = {
    "connections": {"default": settings.database_url},
    "apps": {
        "models": {
            "models": ["app.connections.models", "aerich.models"],
            "default_connection": "default",
        }
    },
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(log_level=settings.log_level)
    await Tortoise.init(config=TORTOISE_ORM)
    await Tortoise.generate_schemas()
    yield
    await close_redis()
    await Tortoise.close_connections()


app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
)

setup_cors(app)
setup_error_handler(app)
app.add_middleware(RequestIdMiddleware)

app.include_router(ws_router)
app.include_router(handlers_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 4: Write test for REST handler**

Create `services/websocket/tests/test_handlers/test_router.py`:

```python
import pytest
from httpx import ASGITransport, AsyncClient


@pytest.mark.asyncio
async def test_send_message_endpoint(client):
    response = await client.post("/messages/send", json={
        "content": "hello world",
        "type": "broadcast",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "sent"
    assert data["recipients"] == 0  # no connected clients


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 5: Run all websocket tests**

```bash
cd services/websocket && python -m pytest tests/ -v
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add services/websocket/
git commit -m "feat: add websocket service with WS endpoint, REST handler, and main app"
```

---

## Task 15: WebSocket Service — Dockerfile

**Files:**
- Create: `services/websocket/Dockerfile`

- [ ] **Step 1: Create Dockerfile**

Create `services/websocket/Dockerfile`:

```dockerfile
FROM python:3.13-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install core-shared first
COPY packages/core-shared /tmp/core-shared
RUN pip install --no-cache-dir /tmp/core-shared && rm -rf /tmp/core-shared

# Install service dependencies
COPY services/websocket/pyproject.toml .
RUN pip install --no-cache-dir .

# Copy service code
COPY services/websocket/app ./app

EXPOSE 8002

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]
```

- [ ] **Step 2: Verify Dockerfile builds**

```bash
cd /Users/ahmedtuzinac/projects/backned-arch && podman build -f services/websocket/Dockerfile -t websocket-service .
```

Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add services/websocket/Dockerfile
git commit -m "feat: add Dockerfile for websocket service"
```

---

## Task 16: Copier Service Template

**Files:**
- Create: `service-template/copier.yml`
- Create: `service-template/app/main.py.jinja`
- Create: `service-template/app/config.py.jinja`
- Create: `service-template/app/dependencies.py.jinja`
- Create: `service-template/tests/conftest.py.jinja`
- Create: `service-template/Dockerfile.jinja`
- Create: `service-template/pyproject.toml.jinja`
- Create: `service-template/.env.example.jinja`

- [ ] **Step 1: Create copier.yml**

Create `service-template/copier.yml`:

```yaml
_envops:
  block_start_string: "{%"
  block_end_string: "%}"
  variable_start_string: "{{"
  variable_end_string: "}}"
  comment_start_string: "{#"
  comment_end_string: "#}"

_subdirectory: .

service_name:
  type: str
  help: "Name of the service (e.g., notifications)"

port:
  type: int
  help: "Port number for the service"
  default: 8003

needs_postgres:
  type: bool
  help: "Does this service need a PostgreSQL database?"
  default: true

needs_redis:
  type: bool
  help: "Does this service need Redis?"
  default: false
```

- [ ] **Step 2: Create pyproject.toml.jinja**

Create `service-template/pyproject.toml.jinja`:

```toml
[project]
name = "{{ service_name }}-service"
version = "0.1.0"
description = "{{ service_name }} microservice"
requires-python = ">=3.13"
dependencies = [
    "core-shared @ file:///${PROJECT_ROOT}/packages/core-shared",
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.34.0",
{%- if needs_postgres %}
    "tortoise-orm[asyncpg]>=0.22.0",
    "aerich>=0.8.0",
{%- endif %}
    "pydantic-settings>=2.7.0",
{%- if needs_redis %}
    "redis[hiredis]>=5.2.0",
{%- endif %}
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.25.0",
    "httpx>=0.28.0",
{%- if needs_postgres %}
    "testcontainers[postgres]>=4.9.0",
{%- endif %}
{%- if needs_redis %}
    "testcontainers[redis]>=4.9.0",
{%- endif %}
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

- [ ] **Step 3: Create config.py.jinja**

Create `service-template/app/config.py.jinja`:

```python
from core_shared.config import BaseAppSettings


class {{ service_name | capitalize }}Settings(BaseAppSettings):
{%- if needs_postgres %}
    database_url: str = "postgres://postgres:postgres@localhost:5432/{{ service_name }}_db"
{%- endif %}
{%- if needs_redis %}
    redis_url: str = "redis://localhost:6379/0"
{%- endif %}
    host: str = "0.0.0.0"
    port: int = {{ port }}


settings = {{ service_name | capitalize }}Settings()
```

- [ ] **Step 4: Create dependencies.py.jinja**

Create `service-template/app/dependencies.py.jinja`:

```python
{%- if needs_redis %}
import redis.asyncio as redis

from app.config import settings

redis_client: redis.Redis | None = None


async def get_redis() -> redis.Redis:
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(settings.redis_url)
    return redis_client


async def close_redis() -> None:
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None
{%- else %}
# Add service-specific dependencies here
{%- endif %}
```

- [ ] **Step 5: Create main.py.jinja**

Create `service-template/app/main.py.jinja`:

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
{%- if needs_postgres %}
from tortoise import Tortoise
{%- endif %}

from app.config import settings
{%- if needs_redis %}
from app.dependencies import close_redis
{%- endif %}
from core_shared.logging import setup_logging
from core_shared.middleware import RequestIdMiddleware, setup_cors, setup_error_handler

{%- if needs_postgres %}

TORTOISE_ORM = {
    "connections": {"default": settings.database_url},
    "apps": {
        "models": {
            "models": ["aerich.models"],
            "default_connection": "default",
        }
    },
}
{%- endif %}


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(log_level=settings.log_level)
{%- if needs_postgres %}
    await Tortoise.init(config=TORTOISE_ORM)
    await Tortoise.generate_schemas()
{%- endif %}
    yield
{%- if needs_redis %}
    await close_redis()
{%- endif %}
{%- if needs_postgres %}
    await Tortoise.close_connections()
{%- endif %}


app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
)

setup_cors(app)
setup_error_handler(app)
app.add_middleware(RequestIdMiddleware)


@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 6: Create conftest.py.jinja**

Create `service-template/tests/conftest.py.jinja`:

```python
{%- if needs_postgres %}
import asyncio
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from testcontainers.postgres import PostgresContainer
from tortoise import Tortoise


TORTOISE_MODELS: list[str] = []


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def postgres_url():
    with PostgresContainer("postgres:17-alpine") as postgres:
        yield postgres.get_connection_url().replace("postgresql+psycopg2://", "postgres://")


@pytest.fixture(autouse=True)
async def init_db(postgres_url):
    await Tortoise.init(
        db_url=postgres_url,
        modules={"models": TORTOISE_MODELS},
    )
    await Tortoise.generate_schemas()
    yield
    await Tortoise._drop_databases()
    await Tortoise.close_connections()


@pytest.fixture
async def client(init_db) -> AsyncGenerator[AsyncClient, None]:
    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
{%- else %}
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
{%- endif %}
```

- [ ] **Step 7: Create Dockerfile.jinja**

Create `service-template/Dockerfile.jinja`:

```dockerfile
FROM python:3.13-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install core-shared first
COPY packages/core-shared /tmp/core-shared
RUN pip install --no-cache-dir /tmp/core-shared && rm -rf /tmp/core-shared

# Install service dependencies
COPY services/{{ service_name }}/pyproject.toml .
RUN pip install --no-cache-dir .

# Copy service code
COPY services/{{ service_name }}/app ./app

EXPOSE {{ port }}

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "{{ port }}"]
```

- [ ] **Step 8: Create .env.example.jinja**

Create `service-template/.env.example.jinja`:

```env
APP_NAME={{ service_name }}-service
DEBUG=true
LOG_LEVEL=DEBUG

{%- if needs_postgres %}

# Database
DATABASE_URL=postgres://postgres:postgres@postgres:5432/{{ service_name }}_db
{%- endif %}

{%- if needs_redis %}

# Redis
REDIS_URL=redis://redis:6379/0
{%- endif %}

# Server
HOST=0.0.0.0
PORT={{ port }}
```

- [ ] **Step 9: Test Copier generation**

```bash
cd /Users/ahmedtuzinac/projects/backned-arch && copier copy service-template /tmp/test-service --data service_name=notifications --data port=8003 --data needs_postgres=true --data needs_redis=false
```

Verify generated files exist and look correct:

```bash
ls -la /tmp/test-service/app/
cat /tmp/test-service/app/main.py
rm -rf /tmp/test-service
```

- [ ] **Step 10: Commit**

```bash
git add service-template/
git commit -m "feat: add Copier service template for generating new microservices"
```

---

## Task 17: GitHub Actions CI/CD

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/build-push.yml`

- [ ] **Step 1: Create CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.13"
      - name: Install Ruff
        run: pip install ruff
      - name: Run Ruff check
        run: ruff check .
      - name: Run Ruff format check
        run: ruff format --check .

  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [auth, websocket]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.13"
      - name: Install core-shared
        run: pip install -e packages/core-shared
      - name: Install service dependencies
        run: |
          cd services/${{ matrix.service }}
          pip install -e ".[dev]"
      - name: Run tests
        run: |
          cd services/${{ matrix.service }}
          python -m pytest tests/ -v

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    strategy:
      matrix:
        service: [auth, websocket]
    steps:
      - uses: actions/checkout@v4
      - name: Build container image
        run: |
          docker build -f services/${{ matrix.service }}/Dockerfile -t ${{ matrix.service }}-service .
      - name: Verify image healthcheck
        run: |
          docker run -d --name test-${{ matrix.service }} -p 0:8001 ${{ matrix.service }}-service || true
          sleep 5
          docker logs test-${{ matrix.service }} || true
          docker rm -f test-${{ matrix.service }} || true
```

- [ ] **Step 2: Create build-push workflow**

Create `.github/workflows/build-push.yml`:

```yaml
name: Build & Push

on:
  push:
    tags:
      - "v*"

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ${{ github.repository }}

jobs:
  build-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    strategy:
      matrix:
        service: [auth, websocket]
    steps:
      - uses: actions/checkout@v4

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/${{ matrix.service }}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          file: services/${{ matrix.service }}/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

- [ ] **Step 3: Commit**

```bash
git add .github/
git commit -m "feat: add GitHub Actions CI/CD workflows for lint, test, build, and push"
```

---

## Task 18: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README**

Create `README.md`:

```markdown
# Backend Architecture Template

Production-ready microservice backend template with FastAPI, PostgreSQL, Redis, and Podman.

## Stack

- **Python 3.13** + **FastAPI**
- **Tortoise ORM** + **Aerich** (migrations)
- **PostgreSQL 17** + **Redis 7**
- **Podman** + **podman-compose**
- **Nginx** (reverse proxy)
- **OAuth2 + JWT** authentication
- **Structlog** (structured JSON logging)
- **pytest** + **testcontainers**

## Quick Start

```bash
# Clone and enter
git clone <repo-url> && cd backend-arch

# Copy env files
cp services/auth/.env.example services/auth/.env
cp services/websocket/.env.example services/websocket/.env

# Start everything
make up
```

Services available at:
- Auth API: http://localhost/auth/
- WebSocket: ws://localhost/ws/connect
- Health: http://localhost/health

## Project Structure

```
backend-arch/
├── packages/core-shared/      # Shared Python package
├── services/
│   ├── auth/                  # Auth service (OAuth2 + JWT)
│   └── websocket/             # WebSocket service
├── service-template/          # Copier template for new services
├── infra/                     # Nginx, PostgreSQL, Redis configs
├── podman-compose.yml
└── Makefile
```

## Creating a New Service

```bash
make new-service name=notifications
```

After generation, follow the printed instructions to add the service to:
1. `podman-compose.yml`
2. `infra/nginx/nginx.conf`
3. `.github/workflows/ci.yml` matrix

## Commands

| Command | Description |
|---------|-------------|
| `make up` | Start all services |
| `make down` | Stop all services |
| `make test` | Run all tests |
| `make test-auth` | Run auth service tests |
| `make test-ws` | Run websocket service tests |
| `make lint` | Run Ruff linter |
| `make format` | Format code with Ruff |
| `make new-service name=X` | Generate new service |
| `make migrate` | Run database migrations |

## Architecture

Each service follows a domain-driven structure:

```
services/<name>/app/
├── <domain>/
│   ├── router.py       # FastAPI routes
│   ├── service.py      # Business logic
│   ├── models.py       # Tortoise ORM models
│   └── schemas.py      # Pydantic schemas
├── config.py
├── dependencies.py
└── main.py
```

Services communicate via **httpx async** (request-response). JWT token validation is done **locally** in each service using `core-shared` — no HTTP call to auth service needed.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with quick start, project structure, and usage guide"
```

---

## Task 19: Final Verification

- [ ] **Step 1: Run linter on entire project**

```bash
cd /Users/ahmedtuzinac/projects/backned-arch && ruff check .
```

Expected: No errors

- [ ] **Step 2: Run all tests**

```bash
make test
```

Expected: All PASS

- [ ] **Step 3: Verify podman-compose builds**

```bash
podman-compose build
```

Expected: All images build successfully

- [ ] **Step 4: Verify podman-compose starts**

```bash
podman-compose up -d
sleep 10
curl http://localhost/health
curl http://localhost/auth/health
podman-compose down
```

Expected: Health endpoints return `{"status": "ok"}`

- [ ] **Step 5: Fix any issues found and commit**

If any issues found, fix them and create a final commit:

```bash
git add -A
git commit -m "fix: resolve issues found during final verification"
```
