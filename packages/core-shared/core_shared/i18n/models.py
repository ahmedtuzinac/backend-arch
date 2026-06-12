from tortoise import fields

from core_shared.database import BaseModel
from core_shared.database.mixins import TimestampMixin


class Language(BaseModel, TimestampMixin):
    code = fields.CharField(max_length=10, unique=True, index=True)
    name = fields.CharField(max_length=50)
    is_default = fields.BooleanField(default=False)
    is_active = fields.BooleanField(default=True)

    class Meta:
        table = "languages"


class Translation(BaseModel, TimestampMixin):
    language = fields.ForeignKeyField("models.Language", related_name="translations")
    key = fields.CharField(max_length=255, index=True)
    value = fields.TextField(default="")

    class Meta:
        table = "translations"
        unique_together = (("language_id", "key"),)
