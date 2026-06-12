import contextlib

from fastapi import APIRouter, HTTPException, status

from core_shared.communication import ServiceClient
from core_shared.i18n.models import Language, Translation

i18n_router = APIRouter(prefix="/i18n", tags=["i18n"])

ws_client = ServiceClient(base_url="http://websocket:8002")


# --- Languages ---


@i18n_router.get("/languages")
async def list_languages():
    languages = await Language.filter(is_active=True).order_by("-is_default", "name")
    return {
        "languages": [
            {"id": lang.id, "code": lang.code, "name": lang.name, "is_default": lang.is_default}
            for lang in languages
        ]
    }


@i18n_router.post("/languages", status_code=status.HTTP_201_CREATED)
async def create_language(data: dict):
    existing = await Language.get_or_none(code=data["code"])
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Language already exists")
    lang = await Language.create(code=data["code"], name=data["name"])
    return {"id": lang.id, "code": lang.code, "name": lang.name, "is_default": lang.is_default}


@i18n_router.delete("/languages/{code}")
async def delete_language(code: str):
    lang = await Language.get_or_none(code=code)
    if lang is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Language not found")
    if lang.is_default:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete default language")
    await Translation.filter(language=lang).delete()
    await lang.delete()
    return {"status": "deleted"}


# --- Translations ---


@i18n_router.get("/translations/{lang_code}")
async def get_translations(lang_code: str):
    lang = await Language.get_or_none(code=lang_code)
    if lang is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Language not found")
    translations = await Translation.filter(language=lang)
    return {
        "language": lang_code,
        "translations": {t.key: t.value for t in translations},
    }


@i18n_router.put("/translations/{lang_code}")
async def update_translations(lang_code: str, data: dict[str, str]):
    lang = await Language.get_or_none(code=lang_code)
    if lang is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Language not found")

    for key, value in data.items():
        existing = await Translation.get_or_none(language=lang, key=key)
        if existing:
            existing.value = value
            await existing.save()
        else:
            await Translation.create(language=lang, key=key, value=value)

    with contextlib.suppress(Exception):
        await ws_client.post("/messages/broadcast", json={
            "type": "translations_updated",
            "language": lang_code,
        })

    return {"status": "updated", "count": len(data)}


@i18n_router.get("/keys")
async def list_translation_keys():
    """Get all unique translation keys across all languages."""
    translations = await Translation.all().distinct().values_list("key", flat=True)
    return {"keys": sorted(set(translations))}
