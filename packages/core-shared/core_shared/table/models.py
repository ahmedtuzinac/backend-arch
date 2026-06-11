from tortoise import fields

from core_shared.database import BaseModel
from core_shared.database.mixins import TimestampMixin


class UserTablePreference(BaseModel, TimestampMixin):
    user_id = fields.IntField(index=True)
    table_name = fields.CharField(max_length=100, index=True)
    hidden_columns = fields.JSONField(default=[])
    column_order = fields.JSONField(default=[])

    class Meta:
        table = "user_table_preferences"
        unique_together = (("user_id", "table_name"),)
