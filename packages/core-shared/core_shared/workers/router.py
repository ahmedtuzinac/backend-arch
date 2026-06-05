from fastapi import APIRouter, HTTPException, status

from core_shared.workers.models import TaskLog
from core_shared.workers.schemas import TaskLogListResponse, TaskLogResponse

task_router = APIRouter(prefix="/tasks", tags=["tasks"])


@task_router.get("/", response_model=TaskLogListResponse)
async def list_tasks(
    status_filter: str | None = None,
    task_name: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    query = TaskLog.all()
    if status_filter:
        query = query.filter(status=status_filter)
    if task_name:
        query = query.filter(task_name=task_name)

    total = await query.count()
    tasks = await query.order_by("-created_at").offset(offset).limit(limit)
    return TaskLogListResponse(tasks=tasks, total=total)


@task_router.get("/{job_id}", response_model=TaskLogResponse)
async def get_task(job_id: str):
    task_log = await TaskLog.get_or_none(job_id=job_id)
    if task_log is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task_log
