from datetime import datetime

from pydantic import BaseModel


class TaskLogResponse(BaseModel):
    id: int
    job_id: str
    task_name: str
    status: str
    input_data: dict = {}
    result: dict | None = None
    error: str | None = None
    traceback: str | None = None
    attempt: int
    max_retries: int
    started_at: datetime | None = None
    finished_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskLogListResponse(BaseModel):
    tasks: list[TaskLogResponse]
    total: int
