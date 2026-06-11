# Frontend Service

React admin dashboard with TypeScript, Vite, and Tailwind CSS.

## Features

- Login page (email/password, no public registration)
- Session persistence with refresh token
- WebSocket auto-connect for online presence
- Admin dashboard with sidebar navigation:
  - **Home** -- welcome page
  - **Health** -- live service status, uptime ticker, DB checks
  - **Users** -- DynamicTable with filters, sorting, online status, CRUD
  - **Profile** -- update email and password
  - **Audit Log** -- who did what, filterable by action
- DynamicTable component (backend-driven columns, filters, sorting, pagination)
- Role-based UI (admin pages hidden for non-admin users)

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- react-router-dom

## Development

```bash
cd services/frontend
npm install
npm run dev
```

Runs on `http://localhost:3000`. Vite proxy forwards:
- `/auth/*` to auth service (port 8001)
- `/ws/*` to websocket service (port 8002)

## Production (Podman)

Multi-stage build: Vite builds static files, served by Nginx with proxy to backend services.

## Pages

| Path | Auth | Role | Description |
|------|------|------|-------------|
| `/login` | No | - | Login page |
| `/` | Yes | Any | Home |
| `/health` | Yes | Admin | Service health dashboard |
| `/users` | Yes | Admin | User management |
| `/profile` | Yes | Any | Edit own profile |
| `/audit` | Yes | Admin | Audit log viewer |
