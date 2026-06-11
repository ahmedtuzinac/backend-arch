from tortoise import fields

from core_shared.database import BaseModel
from core_shared.database.mixins import TimestampMixin


class AppSetting(BaseModel, TimestampMixin):
    key = fields.CharField(max_length=100, unique=True, index=True)
    value = fields.TextField(default="")
    description = fields.CharField(max_length=255, default="")

    class Meta:
        table = "app_settings"
