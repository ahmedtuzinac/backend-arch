import contextlib

from fastapi import APIRouter

from core_shared.audit import log_action
from core_shared.communication import ServiceClient
from core_shared.settings.models import AppSetting
from core_shared.settings.service import set_setting

settings_router = APIRouter(prefix="/settings", tags=["settings"])

ws_client = ServiceClient(base_url="http://websocket:8002")


@settings_router.get("/")
async def list_settings():
    settings = await AppSetting.all()
    return {
        "settings": [
            {
                "key": s.key,
                "value": s.value,
                "description": s.description,
            }
            for s in settings
        ]
    }


@settings_router.patch("/")
async def update_settings(
    data: dict[str, str],
    actor_id: int = 0,
    actor_email: str = "",
):
    updated = {}
    for key, value in data.items():
        setting = await set_setting(key, value)
        updated[key] = setting.value

    if actor_id:
        with contextlib.suppress(Exception):
            await log_action(
                actor_id=actor_id,
                actor_email=actor_email,
                action="updated",
                resource="settings",
                details=updated,
            )

    with contextlib.suppress(Exception):
        await ws_client.post("/messages/broadcast", json={
            "type": "settings_updated",
            "settings": updated,
            "actor_email": actor_email,
        })

    return {"settings": updated}
