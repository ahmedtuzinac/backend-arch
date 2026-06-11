# Auth Service

Authentication and authorization microservice with OAuth2, JWT, and role-based access control.

## Features

- Login (email/password) -- no public registration, users are created by admin
- OAuth2 full flow (authorization_code, client_credentials, refresh_token)
- JWT access token (15min) + refresh token (7 days)
- Role-based access control (system, admin, employee)
- Auto-created admin user on startup
- User CRUD with admin-only endpoints
- Background workers (arq) -- welcome email, token cleanup cron
- Audit logging on all user mutations
- Dynamic table config for frontend
- Health check with database status and uptime

## Roles

| Role | Description |
|------|-------------|
| `system` | Full access, used for inter-service communication |
| `admin` | User management, OAuth client management |
| `employee` | Default role, read own data |

## API Endpoints

### Users (Admin only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/users/` | Admin | List users (paginated, filterable, sortable) |
| `GET` | `/users/config` | Admin | Table config for frontend DynamicTable |
| `POST` | `/users/register` | Admin | Create new user |
| `GET` | `/users/{id}` | Admin | Get user by ID |
| `PATCH` | `/users/{id}` | Admin | Update user (email, password, role, status) |
| `DELETE` | `/users/{id}` | Admin | Deactivate user |

### Users (Any authenticated)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/users/me` | Any | Get current user profile |
| `PATCH` | `/users/me` | Any | Update own email/password |

### Tokens

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/token` | - | Login (email/password), returns JWT |
| `POST` | `/token/refresh` | - | Refresh access token |
| `POST` | `/token/verify` | - | Verify if token is valid |

### OAuth2

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/oauth/clients` | Admin | Register OAuth2 client |
| `POST` | `/oauth/authorize` | Any | Get authorization code |
| `POST` | `/oauth/token` | - | Exchange code/credentials for token |
| `POST` | `/oauth/revoke` | - | Revoke token |

### Audit

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/audit/` | - | List audit logs (paginated, filterable) |

### Tasks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/tasks/` | - | List background tasks (paginated) |
| `GET` | `/tasks/{job_id}` | - | Get task details and status |

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | - | Service status, uptime, DB check |

## Background Workers

| Task | Trigger | Description |
|------|---------|-------------|
| `send_welcome_email` | On user creation | Sends welcome email to new user |
| `cleanup_expired_tokens` | Cron (every 6h) | Removes expired refresh tokens |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://...` | PostgreSQL connection string |
| `REDIS_URL` | `redis://...` | Redis connection string |
| `JWT_SECRET_KEY` | `change-me...` | Secret for JWT signing |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | Access token TTL |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token TTL |
| `ADMIN_EMAIL` | `admin@admin.local` | Auto-created admin email |
| `ADMIN_PASSWORD` | `admin` | Auto-created admin password |
