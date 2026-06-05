from pydantic import BaseModel


class SendMessageRequest(BaseModel):
    room: str | None = None
    user_id: str | None = None
    content: str
    type: str = "message"


class SendMessageResponse(BaseModel):
    status: str = "sent"
    recipients: int = 0
