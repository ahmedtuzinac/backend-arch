import math

from pydantic import BaseModel
from tortoise.queryset import QuerySet


class PaginatedResponse[T](BaseModel):
    items: list[T]
    total: int
    page: int
    per_page: int
    pages: int


async def paginate(
    queryset: QuerySet,
    page: int = 1,
    per_page: int = 20,
) -> dict:
    if page < 1:
        page = 1
    if per_page < 1:
        per_page = 20
    if per_page > 100:
        per_page = 100

    total = await queryset.count()
    pages = math.ceil(total / per_page) if total > 0 else 0
    offset = (page - 1) * per_page
    items = await queryset.offset(offset).limit(per_page)

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages,
    }
