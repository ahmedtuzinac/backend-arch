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

Services communicate via **httpx async** (request-response). JWT token validation is done **locally** in each service using `core-shared` -- no HTTP call to auth service needed.
