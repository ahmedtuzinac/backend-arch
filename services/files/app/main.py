from contextlib import asynccontextmanager

from app.config import settings
from app.storage.client import ensure_bucket
from app.uploads.router import router as uploads_router
from fastapi import FastAPI
from tortoise import Tortoise

from core_shared.health import create_health_router
from core_shared.logging import setup_logging
from core_shared.middleware import RequestIdMiddleware, setup_cors, setup_error_handler
from core_shared.workers import task_router

TORTOISE_ORM = {
    "connections": {"default": settings.database_url},
    "apps": {
        "models": {
            "models": [
                "app.uploads.models",
                "core_shared.workers.models",
                "aerich.models",
            ],
            "default_connection": "default",
        }
    },
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(log_level=settings.log_level)
    await Tortoise.init(config=TORTOISE_ORM)
    await Tortoise.generate_schemas()
    ensure_bucket()
    yield
    await Tortoise.close_connections()


app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
)

setup_cors(app)
setup_error_handler(app)
app.add_middleware(RequestIdMiddleware)

app.include_router(uploads_router)
app.include_router(task_router)
app.include_router(create_health_router("files"))
