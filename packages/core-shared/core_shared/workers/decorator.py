import functools
from typing import Any

from core_shared.workers.service import enqueue_task, log_task_failure, log_task_start, log_task_success


def tracked_task(func):
    """Decorator that automatically logs task start/success/failure to TaskLog."""

    @functools.wraps(func)
    async def wrapper(ctx: dict, *args: Any, **kwargs: Any) -> Any:
        job_id = kwargs.get("job_id") or (ctx.get("job_id") if ctx else None)

        # Always ensure a TaskLog entry exists
        from core_shared.workers.models import TaskLog

        existing = await TaskLog.get_or_none(job_id=job_id) if job_id else None
        if not existing:
            task_log = await enqueue_task(
                task_name=func.__name__,
                input_data={k: v for k, v in kwargs.items() if k != "job_id"},
                job_id=job_id,
            )
            job_id = task_log.job_id

        await log_task_start(job_id)

        try:
            result = await func(ctx, *args, **kwargs)
            await log_task_success(job_id, result=result if isinstance(result, dict) else {"result": str(result)})
            return result
        except Exception as e:
            await log_task_failure(job_id, error=e)
            raise

    return wrapper
