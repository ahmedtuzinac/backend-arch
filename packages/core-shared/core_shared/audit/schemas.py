from datetime import datetime

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: int
    actor_id: int
    actor_email: str
    action: str
    resource: str
    resource_id: int | None
    details: dict
    created_at: datetime

    model_config = {"from_attributes": True}
