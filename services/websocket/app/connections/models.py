from tortoise import fields

from core_shared.database import BaseModel
from core_shared.database.mixins import TimestampMixin


class Room(BaseModel, TimestampMixin):
    name = fields.CharField(max_length=255, unique=True, index=True)
    is_active = fields.BooleanField(default=True)

    class Meta:
        table = "rooms"
