from enum import StrEnum

from tortoise import fields

from core_shared.database import BaseModel
from core_shared.database.mixins import TimestampMixin


class TaskStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"


class TaskLog(BaseModel, TimestampMixin):
    job_id = fields.CharField(max_length=255, unique=True, index=True)
    task_name = fields.CharField(max_length=255, index=True)
    status = fields.CharEnumField(TaskStatus, default=TaskStatus.PENDING)
    input_data = fields.JSONField(default={})
    result = fields.JSONField(null=True)
    error = fields.TextField(null=True)
    traceback = fields.TextField(null=True)
    attempt = fields.IntField(default=1)
    max_retries = fields.IntField(default=3)
    started_at = fields.DatetimeField(null=True)
    finished_at = fields.DatetimeField(null=True)

    class Meta:
        table = "task_logs"
