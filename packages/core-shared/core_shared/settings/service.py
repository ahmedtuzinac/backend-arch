from core_shared.settings.models import AppSetting

DEFAULTS = {
    "app_name": {"value": "Dashboard", "description": "Application display name"},
    "app_logo_url": {"value": "", "description": "URL to application logo"},
    "timezone": {"value": "UTC", "description": "Default timezone"},
    "date_format": {"value": "DD/MM/YYYY", "description": "Date display format"},
    "primary_color": {"value": "#111827", "description": "Primary brand color (hex)"},
}


async def ensure_defaults() -> None:
    for key, data in DEFAULTS.items():
        existing = await AppSetting.get_or_none(key=key)
        if existing is None:
            await AppSetting.create(key=key, **data)


async def get_setting(key: str) -> str:
    setting = await AppSetting.get_or_none(key=key)
    if setting is None:
        default = DEFAULTS.get(key)
        return default["value"] if default else ""
    return setting.value


async def set_setting(key: str, value: str) -> AppSetting:
    setting = await AppSetting.get_or_none(key=key)
    if setting is None:
        setting = await AppSetting.create(key=key, value=value)
    else:
        setting.value = value
        await setting.save()
    return setting


async def get_all_settings() -> dict[str, str]:
    settings = await AppSetting.all()
    result = {}
    for s in settings:
        result[s.key] = s.value
    return result
