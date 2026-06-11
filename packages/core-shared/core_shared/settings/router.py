from fastapi import APIRouter

from core_shared.settings.models import AppSetting
from core_shared.settings.service import set_setting

settings_router = APIRouter(prefix="/settings", tags=["settings"])


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
async def update_settings(data: dict[str, str]):
    updated = {}
    for key, value in data.items():
        setting = await set_setting(key, value)
        updated[key] = setting.value
    return {"settings": updated}
