import pytest

from core_shared.pagination import PaginatedResponse, paginate
from core_shared.workers.models import TaskLog


@pytest.mark.asyncio
async def test_paginate_empty(init_db):
    result = await paginate(TaskLog.all(), page=1, per_page=10)
    assert result["items"] == []
    assert result["total"] == 0
    assert result["page"] == 1
    assert result["pages"] == 0


@pytest.mark.asyncio
async def test_paginate_with_items(init_db):
    for i in range(25):
        await TaskLog.create(job_id=f"job-{i}", task_name="test", input_data={})

    result = await paginate(TaskLog.all(), page=1, per_page=10)
    assert len(result["items"]) == 10
    assert result["total"] == 25
    assert result["pages"] == 3

    result2 = await paginate(TaskLog.all(), page=3, per_page=10)
    assert len(result2["items"]) == 5


@pytest.mark.asyncio
async def test_paginate_clamps_values(init_db):
    result = await paginate(TaskLog.all(), page=-1, per_page=200)
    assert result["page"] == 1
    assert result["per_page"] == 100


@pytest.mark.asyncio
async def test_paginated_response_schema():
    resp = PaginatedResponse[dict](items=[{"a": 1}], total=1, page=1, per_page=10, pages=1)
    assert resp.items == [{"a": 1}]
    assert resp.total == 1
