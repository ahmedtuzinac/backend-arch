# WebSocket Service

Real-time communication microservice with WebSocket connections, rooms, and message broadcasting.

## Features

- WebSocket connections with JWT authentication
- Room management (join, leave, broadcast)
- Direct messaging between users
- REST API for sending messages from other services
- Redis Pub/Sub ready for multi-instance broadcasting
- ConnectionManager tracks active connections in memory

## API Endpoints

### WebSocket

| Path | Auth | Description |
|------|------|-------------|
| `WS /ws/connect?token=<jwt>` | JWT | Connect to WebSocket |

### REST

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/messages/send` | - | Send message to user/room/broadcast |
| `GET` | `/health` | - | Health check |

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

## REST API — Send Message

Other services can push messages to connected users via HTTP:

```bash
# Send to specific user
curl -X POST http://websocket:8002/messages/send \
  -H "Content-Type: application/json" \
  -d '{"user_id": "123", "content": "You have a new notification"}'

# Broadcast to room
curl -X POST http://websocket:8002/messages/send \
  -H "Content-Type: application/json" \
  -d '{"room": "general", "content": "System update"}'

# Broadcast to all
curl -X POST http://websocket:8002/messages/send \
  -H "Content-Type: application/json" \
  -d '{"content": "Server maintenance in 5 minutes"}'
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://...` | PostgreSQL connection string |
| `REDIS_URL` | `redis://...` | Redis connection string |
| `JWT_SECRET_KEY` | `change-me...` | Same secret as auth service |
