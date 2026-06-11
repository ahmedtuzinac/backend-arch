from tortoise import fields

from core_shared.database import BaseModel
from core_shared.database.mixins import TimestampMixin


class AuditLog(BaseModel, TimestampMixin):
    actor_id = fields.IntField(index=True)
    actor_email = fields.CharField(max_length=255)
    action = fields.CharField(max_length=100, index=True)
    resource = fields.CharField(max_length=100, index=True)
    resource_id = fields.IntField(null=True)
    details = fields.JSONField(default={})

    class Meta:
        table = "audit_logs"
