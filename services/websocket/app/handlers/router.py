from fastapi import APIRouter

from app.handlers.schemas import SendMessageRequest, SendMessageResponse
from app.handlers.service import send_message

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("/send", response_model=SendMessageResponse)
async def send(data: SendMessageRequest):
    return await send_message(data)
