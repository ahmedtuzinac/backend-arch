# WebSocket Service

Real-time communication microservice with WebSocket connections, rooms, message broadcasting, and online status tracking.

## Features

- WebSocket connections with JWT authentication
- Room management (join, leave, broadcast)
- Direct messaging between users
- Online status tracking (list connected users)
- REST API for sending messages from other services
- Redis Pub/Sub ready for multi-instance broadcasting
- Health check with database status and uptime

## API Endpoints

### WebSocket

| Path | Auth | Description |
|------|------|-------------|
| `WS /ws/connect?token=<jwt>` | JWT | Connect to WebSocket |

### REST

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/messages/send` | - | Send message to user/room/broadcast |
| `GET` | `/messages/online` | - | List currently connected user IDs |
| `GET` | `/health` | - | Service status, uptime, DB check |

## WebSocket Message Types

### Client sends:

```json
{"type": "join", "room": "general"}
{"type": "leave", "room": "general"}
{"type": "message", "room": "general", "content": "Hello everyone!"}
{"type": "direct", "target_user_id": "123", "content": "Hello!"}
```

### Server sends:

```json
{"type": "joined", "room": "general"}
{"type": "left", "room": "general"}
{"type": "message", "room": "general", "content": "Hello!", "from": "456"}
{"type": "direct", "content": "Hello!", "from": "456"}
```

## Online Status

The frontend polls `GET /messages/online` every 5 seconds to show green/gray dots next to users in the admin dashboard. Users are considered online when they have an active WebSocket connection (auto-connected on login, disconnected on tab close).

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://...` | PostgreSQL connection string |
| `REDIS_URL` | `redis://...` | Redis connection string |
| `JWT_SECRET_KEY` | `change-me...` | Same secret as auth service |
