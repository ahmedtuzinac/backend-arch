import pytest

from core_shared.workers.models import TaskStatus
from core_shared.workers.service import enqueue_task, log_task_failure, log_task_start, log_task_success


@pytest.mark.asyncio
async def test_enqueue_task(init_db):
    task_log = await enqueue_task(task_name="test_task", input_data={"key": "value"})
    assert task_log.job_id is not None
    assert task_log.task_name == "test_task"
    assert task_log.status == TaskStatus.PENDING
    assert task_log.input_data == {"key": "value"}


@pytest.mark.asyncio
async def test_log_task_start(init_db):
    task_log = await enqueue_task(task_name="test_task")
    updated = await log_task_start(task_log.job_id)
    assert updated.status == TaskStatus.RUNNING
    assert updated.started_at is not None


@pytest.mark.asyncio
async def test_log_task_success(init_db):
    task_log = await enqueue_task(task_name="test_task")
    await log_task_start(task_log.job_id)
    updated = await log_task_success(task_log.job_id, result={"done": True})
    assert updated.status == TaskStatus.COMPLETED
    assert updated.result == {"done": True}
    assert updated.finished_at is not None


@pytest.mark.asyncio
async def test_log_task_failure(init_db):
    task_log = await enqueue_task(task_name="test_task")
    await log_task_start(task_log.job_id)
    updated = await log_task_failure(task_log.job_id, error=ValueError("something broke"))
    assert updated.status == TaskStatus.FAILED
    assert updated.error == "something broke"
    assert updated.finished_at is not None
