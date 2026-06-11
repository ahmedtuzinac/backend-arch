# Backend Architecture Template

Production-ready microservice backend template with FastAPI, PostgreSQL, Redis, Podman, and a React admin dashboard.

## Stack

**Backend:**
- **Python 3.13** + **FastAPI**
- **Tortoise ORM** + **Aerich** (migrations)
- **PostgreSQL 17** + **Redis 7**
- **Podman** + **podman-compose**
- **Nginx** (reverse proxy)
- **OAuth2 + JWT** authentication
- **arq** (async background workers + cron)
- **Structlog** (structured JSON logging)
- **Ruff** (linting + formatting)
- **pytest** + **testcontainers**
- **GitHub Actions** CI/CD

**Frontend:**
- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4**

## Quick Start

```bash
# Clone and enter
git clone <repo-url> && cd backend-arch

# Initialize project
make init-project

# Start everything
make up
```

Default admin: `admin@admin.local` / `admin` (configurable via .env)

Frontend: http://localhost:3000

## Project Structure

```
backend-arch/
├── packages/
│   └── core-shared/              # Shared Python package
│       ├── auth/                  # JWT validation, dependencies
│       ├── database/              # BaseModel, mixins
│       ├── workers/               # TaskLog, arq, tracked_task decorator
│       ├── audit/                 # AuditLog model, router
│       ├── health/                # Health check router with DB checks
│       ├── pagination/            # Generic pagination
│       ├── table/                 # Dynamic table config (backend-driven)
│       ├── logging/               # Structlog setup
│       ├── communication/         # httpx async client
│       └── middleware/            # CORS, error handler, request ID
├── services/
│   ├── auth/                      # Auth service (OAuth2, JWT, RBAC)
│   ├── websocket/                 # WebSocket service (rooms, online status)
│   └── frontend/                  # React admin dashboard
├── service-template/              # Copier template for new services
├── infra/                         # Nginx, PostgreSQL, Redis configs
├── scripts/                       # init-project.sh
├── .github/workflows/             # CI/CD
├── podman-compose.yml
└── Makefile
```

## Services

### Auth Service
- Login (email/password) -- no public registration
- OAuth2 (authorization_code, client_credentials, refresh_token)
- JWT access + refresh tokens
- RBAC (system, admin, employee)
- Auto admin user on startup
- User CRUD (admin only)
- Background workers (welcome email, token cleanup cron)
- Audit logging
- Dynamic table config

### WebSocket Service
- WebSocket connections with JWT auth
- Rooms (join, leave, broadcast)
- Direct messaging
- Online status tracking (`GET /messages/online`)
- REST API for sending messages from other services

### Frontend
- Login page
- Admin dashboard with sidebar navigation
- User management (DynamicTable, filters, sorting, online status)
- Profile page (email, password update)
- Audit log viewer
- Health dashboard (live uptime, service status, DB checks)
- Session persistence (refresh token)
- WebSocket auto-connect for online presence

## Shared Package (core-shared)

Installable Python package used by all services:

| Module | Description |
|--------|-------------|
| `auth` | JWT validation, `get_current_user`, `require_scope()` |
| `database` | BaseModel, TimestampMixin, SoftDeleteMixin, connection helpers |
| `workers` | TaskLog, `tracked_task` decorator, arq cron support |
| `audit` | AuditLog model, `log_action()`, audit router |
| `health` | `create_health_router()` with DB/Redis checks and uptime |
| `pagination` | `paginate()` + `PaginatedResponse[T]` |
| `table` | `TableConfig`, `ColumnDef`, `FilterDef` for backend-driven tables |
| `logging` | Structlog JSON setup |
| `communication` | `ServiceClient` httpx async wrapper with retry |
| `middleware` | CORS, error handler, X-Request-ID |

## Creating a New Service

```bash
make new-service name=notifications
```

Copier asks for service name, port, PostgreSQL, Redis, and workers options.

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
| `make init-project` | Initialize new project from template |

## Using as a Template

This repo is a GitHub Template Repository. Click **"Use this template"** on GitHub, then:

```bash
git clone <your-new-repo> && cd <your-new-repo>
make init-project
```
