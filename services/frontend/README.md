# Frontend Service

React + TypeScript + Vite + Tailwind CSS frontend application.

## Features

- Login page (email/password, no public registration)
- Dashboard with user info and role display
- JWT authentication (token in memory)
- Nginx proxy to backend services in production

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4

## Development

```bash
cd services/frontend
npm install
npm run dev
```

Runs on `http://localhost:3000`. Vite proxy forwards `/auth/*` to auth service on port 8001.

## Production (Podman)

Multi-stage build: Vite builds static files, served by Nginx with proxy to backend services.

## Pages

| Path | Auth | Description |
|------|------|-------------|
| `/` | No | Login page |
| `/` | Yes | Dashboard |
