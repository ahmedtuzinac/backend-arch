from pydantic import BaseModel


class ColumnDef(BaseModel):
    key: str
    label: str
    type: str = "text"  # text, badge, boolean, date, datetime
    sortable: bool = False
    options: list[str] | None = None  # for badge type
    badge_colors: dict[str, str] | None = None  # value -> tailwind color class


class FilterDef(BaseModel):
    key: str
    label: str
    type: str = "select"  # select, text, boolean
    options: list[dict[str, str]] | None = None  # [{"value": "admin", "label": "Admin"}]


class TableConfig(BaseModel):
    name: str
    columns: list[ColumnDef]
    filters: list[FilterDef] = []
    searchable: bool = False
    search_field: str | None = None
    search_placeholder: str = "Search..."
    actions: list[str] = []  # edit, deactivate, delete
