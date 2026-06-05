from datetime import datetime

from pydantic import BaseModel


class RoomCreate(BaseModel):
    name: str


class RoomResponse(BaseModel):
    id: int
    name: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class WSMessage(BaseModel):
    type: str  # "message", "join", "leave", "broadcast", "direct"
    room: str | None = None
    content: str = ""
    target_user_id: str | None = None
