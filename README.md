# Backend Architecture Template

Production-ready microservice backend template with FastAPI, PostgreSQL, Redis, S3, Podman, and a React admin dashboard. Real-time updates via WebSocket.

## Stack

**Backend:**
- **Python 3.13** + **FastAPI**
- **Tortoise ORM** + **Aerich** (migrations)
- **PostgreSQL 17** + **Redis 7**
- **S3-compatible storage** (MinIO for dev, AWS S3 for production)
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
- **react-router-dom**
- **WebSocket** real-time updates

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

**Development mode:** Backend uses volume mounts with `--reload` for instant code changes. Frontend uses `npm run dev` for hot reload.

## Project Structure

```
backend-arch/
├── packages/
│   └── core-shared/              # Shared Python package
│       ├── auth/                  # JWT validation, dependencies
│       ├── database/              # BaseModel, mixins
│       ├── workers/               # TaskLog, arq, tracked_task decorator
│       ├── audit/                 # AuditLog model, router
│       ├── health/                # Health check with DB status + uptime
│       ├── pagination/            # Generic pagination
│       ├── table/                 # Dynamic table config + user column preferences
│       ├── settings/              # App settings (key-value, per-app config)
│       ├── logging/               # Structlog setup
│       ├── communication/         # httpx async client with retry
│       └── middleware/            # CORS, error handler, request ID
├── services/
│   ├── auth/                      # Auth service (OAuth2, JWT, RBAC)
│   ├── websocket/                 # WebSocket service (rooms, online, broadcast)
│   ├── files/                     # File upload service (S3, thumbnails)
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
- Login (email/password) -- no public registration, admin creates users
- OAuth2 (authorization_code, client_credentials, refresh_token)
- JWT access + refresh tokens
- RBAC (system, admin, employee)
- Auto admin user on startup
- User CRUD (admin only) with first/last name, phone, avatar
- Background workers (welcome email, token cleanup cron)
- Audit logging on all mutations
- Dynamic table config for frontend with avatar column
- App settings (name, logo, timezone, date format, primary color)
- Health check with DB status and uptime

### WebSocket Service
- WebSocket connections with JWT auth
- Rooms (join, leave, broadcast)
- Direct messaging
- Online status tracking (`GET /messages/online`)
- Broadcast endpoint (`POST /messages/broadcast`) for real-time events
- Stable reconnection (handles page reload without losing online status)
- Health check with DB status and uptime

### Files Service
- File upload to S3-compatible storage (MinIO / AWS S3)
- Auto thumbnail generation for images (worker)
- HEIC/HEIF support (pillow-heif)
- On-demand HEIC-to-JPEG preview conversion
- File listing with search, pagination
- File details, download, delete
- Storage health check (bucket status)
- Real-time updates via WebSocket (upload, delete, thumbnail ready)

### Frontend
- Login page with session persistence (refresh token)
- Admin dashboard with sidebar navigation and SVG icons
- **Home** -- welcome page
- **Health** -- live service status with uptime ticker for Auth, WebSocket, Files, Storage
- **Users** -- DynamicTable with filters, sorting, avatar with online indicator, column picker with reorder, CRUD
- **Profile** -- avatar (initials or URL), first/last name, email, phone, password
- **Files** -- drag & drop upload, multi-file, progress bar, thumbnail grid/table, preview modal, file details side panel, copy link, search
- **Audit Log** -- who did what with avatars, filterable by action
- **Settings** -- app name, logo URL, timezone, date format, primary color (live preview)
- Real-time updates via WebSocket:
  - Table auto-refresh when data changes (users + files)
  - Settings (color, name, date format) update live across all tabs
  - Online presence on avatars
  - Thumbnail appears live after worker generates it
- Backend-driven DynamicTable (columns, filters, sorting, badge colors, avatar type from API)
- Per-user column preferences (hide/show, reorder, persisted on backend)
- Primary color theming from settings (buttons, links, sidebar, avatars)

## Shared Package (core-shared)

Installable Python package used by all services:

| Module | Description |
|--------|-------------|
| `auth` | JWT validation, `get_current_user`, `require_scope()` |
| `database` | BaseModel, TimestampMixin, SoftDeleteMixin, connection helpers |
| `workers` | TaskLog, `tracked_task` decorator, arq cron support |
| `audit` | AuditLog model, `log_action()`, audit router |
| `health` | `create_health_router()` with DB checks and live uptime |
| `pagination` | `paginate()` + `PaginatedResponse[T]` |
| `table` | `TableConfig`, `ColumnDef`, `FilterDef`, user column preferences |
| `settings` | `AppSetting` model, `get/set_setting()`, settings router with WS broadcast |
| `logging` | Structlog JSON setup |
| `communication` | `ServiceClient` httpx async wrapper with retry |
| `middleware` | CORS, error handler, X-Request-ID |

## Real-Time (WebSocket)

All real-time features use a single WebSocket connection per user:

- **Table updates** -- when data changes in any service, all clients see it instantly
- **Settings sync** -- color, name, date format update live across all tabs
- **Online presence** -- green dot on avatar for connected users
- **File thumbnails** -- appear live after worker generates them
- **Broadcast API** -- any service can push events via `POST /messages/broadcast`

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
