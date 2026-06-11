from fastapi import APIRouter

from core_shared.table.models import UserTablePreference

preference_router = APIRouter(prefix="/table-preferences", tags=["table-preferences"])


@preference_router.get("/{table_name}")
async def get_preference(table_name: str, user_id: int):
    pref = await UserTablePreference.get_or_none(user_id=user_id, table_name=table_name)
    if pref:
        return {"hidden_columns": pref.hidden_columns, "column_order": pref.column_order}
    return {"hidden_columns": [], "column_order": []}


@preference_router.put("/{table_name}")
async def set_preference(table_name: str, user_id: int, data: dict):
    hidden = data.get("hidden_columns", [])
    order = data.get("column_order", [])
    pref = await UserTablePreference.get_or_none(user_id=user_id, table_name=table_name)
    if pref:
        pref.hidden_columns = hidden
        pref.column_order = order
        await pref.save()
    else:
        pref = await UserTablePreference.create(
            user_id=user_id,
            table_name=table_name,
            hidden_columns=hidden,
            column_order=order,
        )
    return {"hidden_columns": pref.hidden_columns, "column_order": pref.column_order}
