from typing import Any

from fastapi import APIRouter

from core_shared.table.schemas import TableConfig


def create_table_router(
    prefix: str,
    table_config: TableConfig,
    queryset_fn: Any,
    response_model: Any,
    tags: list[str] | None = None,
    dependencies: list | None = None,
) -> APIRouter:
    """Create a router with /config and /data endpoints for a dynamic table."""
    router = APIRouter(prefix=prefix, tags=tags or [])

    @router.get("/config", response_model=TableConfig)
    async def get_config():
        return table_config

    return router
