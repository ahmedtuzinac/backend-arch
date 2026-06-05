from fastapi import APIRouter, HTTPException, status

from core_shared.pagination import PaginatedResponse, paginate
from core_shared.workers.models import TaskLog
from core_shared.workers.schemas import TaskLogResponse

task_router = APIRouter(prefix="/tasks", tags=["tasks"])


@task_router.get("/", response_model=PaginatedResponse[TaskLogResponse])
async def list_tasks(
    status_filter: str | None = None,
    task_name: str | None = None,
    page: int = 1,
    per_page: int = 20,
):
    query = TaskLog.all().order_by("-created_at")
    if status_filter:
        query = query.filter(status=status_filter)
    if task_name:
        query = query.filter(task_name=task_name)

    return await paginate(query, page=page, per_page=per_page)


@task_router.get("/{job_id}", response_model=TaskLogResponse)
async def get_task(job_id: str):
    task_log = await TaskLog.get_or_none(job_id=job_id)
    if task_log is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task_log
