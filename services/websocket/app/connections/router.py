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
                await manager.broadcast_to_room(
                    msg.room,
                    {
                        "type": "message",
                        "room": msg.room,
                        "content": msg.content,
                        "from": user_id,
                    },
                )

            elif msg.type == "direct" and msg.target_user_id:
                await manager.send_to_user(
                    msg.target_user_id,
                    {
                        "type": "direct",
                        "content": msg.content,
                        "from": user_id,
                    },
                )

    except WebSocketDisconnect:
        manager.disconnect(user_id=user_id)
        await logger.ainfo("ws_disconnected", user_id=user_id)
