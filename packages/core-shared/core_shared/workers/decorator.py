import functools
from typing import Any

from core_shared.workers.service import log_task_failure, log_task_start, log_task_success


def tracked_task(func):
    """Decorator that automatically logs task start/success/failure to TaskLog."""

    @functools.wraps(func)
    async def wrapper(ctx: dict, *args: Any, **kwargs: Any) -> Any:
        job_id = kwargs.get("job_id") or (ctx.get("job_id") if ctx else None)
        if job_id:
            await log_task_start(job_id)

        try:
            result = await func(ctx, *args, **kwargs)
            if job_id:
                await log_task_success(job_id, result=result if isinstance(result, dict) else {"result": str(result)})
            return result
        except Exception as e:
            if job_id:
                await log_task_failure(job_id, error=e)
            raise

    return wrapper
