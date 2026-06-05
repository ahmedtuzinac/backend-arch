import traceback as tb
import uuid
from datetime import UTC, datetime

import structlog

from core_shared.workers.models import TaskLog, TaskStatus

logger = structlog.get_logger()


def generate_job_id() -> str:
    return str(uuid.uuid4())


async def enqueue_task(
    task_name: str,
    input_data: dict | None = None,
    job_id: str | None = None,
    max_retries: int = 3,
) -> TaskLog:
    job_id = job_id or generate_job_id()
    task_log = await TaskLog.create(
        job_id=job_id,
        task_name=task_name,
        status=TaskStatus.PENDING,
        input_data=input_data or {},
        max_retries=max_retries,
    )
    await logger.ainfo("task_enqueued", task=task_name, job_id=job_id)
    return task_log


async def log_task_start(job_id: str) -> TaskLog | None:
    task_log = await TaskLog.get_or_none(job_id=job_id)
    if task_log is None:
        return None
    task_log.status = TaskStatus.RUNNING
    task_log.started_at = datetime.now(UTC)
    await task_log.save()
    await logger.ainfo("task_started", task=task_log.task_name, job_id=job_id)
    return task_log


async def log_task_success(job_id: str, result: dict | None = None) -> TaskLog | None:
    task_log = await TaskLog.get_or_none(job_id=job_id)
    if task_log is None:
        return None
    task_log.status = TaskStatus.COMPLETED
    task_log.result = result
    task_log.finished_at = datetime.now(UTC)
    await task_log.save()
    await logger.ainfo(
        "task_completed",
        task=task_log.task_name,
        job_id=job_id,
        duration_ms=int((task_log.finished_at - task_log.started_at).total_seconds() * 1000)
        if task_log.started_at
        else None,
    )
    return task_log


async def log_task_failure(job_id: str, error: Exception) -> TaskLog | None:
    task_log = await TaskLog.get_or_none(job_id=job_id)
    if task_log is None:
        return None
    task_log.status = TaskStatus.FAILED
    task_log.error = str(error)
    task_log.traceback = tb.format_exc()
    task_log.finished_at = datetime.now(UTC)
    await task_log.save()
    await logger.aerror(
        "task_failed",
        task=task_log.task_name,
        job_id=job_id,
        error=str(error),
        attempt=task_log.attempt,
    )
    return task_log
