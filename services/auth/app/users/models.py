from tortoise import fields

from core_shared.database import BaseModel
from core_shared.database.mixins import TimestampMixin


class User(BaseModel, TimestampMixin):
    email = fields.CharField(max_length=255, unique=True, index=True)
    hashed_password = fields.CharField(max_length=255)
    is_active = fields.BooleanField(default=True)
    is_superuser = fields.BooleanField(default=False)

    class Meta:
        table = "users"
