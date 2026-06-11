from fastapi import APIRouter

from app.connections.router import get_manager
from app.handlers.schemas import SendMessageRequest, SendMessageResponse
from app.handlers.service import send_message

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("/send", response_model=SendMessageResponse)
async def send(data: SendMessageRequest):
    return await send_message(data)


@router.post("/broadcast")
async def broadcast(data: dict):
    mgr = get_manager()
    count = await mgr.broadcast_all(data)
    return {"recipients": count}


@router.get("/online")
async def online_users():
    mgr = get_manager()
    return {"user_ids": list(mgr.active_connections.keys())}
