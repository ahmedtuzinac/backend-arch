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
