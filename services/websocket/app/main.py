from contextlib import asynccontextmanager

from fastapi import FastAPI
from tortoise import Tortoise

from app.config import settings
from app.connections.router import router as ws_router
from app.dependencies import close_redis
from app.handlers.router import router as handlers_router
from core_shared.logging import setup_logging
from core_shared.middleware import RequestIdMiddleware, setup_cors, setup_error_handler

TORTOISE_ORM = {
    "connections": {"default": settings.database_url},
    "apps": {
        "models": {
            "models": ["app.connections.models", "aerich.models"],
            "default_connection": "default",
        }
    },
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(log_level=settings.log_level)
    await Tortoise.init(config=TORTOISE_ORM)
    await Tortoise.generate_schemas()
    yield
    await close_redis()
    await Tortoise.close_connections()


app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
)

setup_cors(app)
setup_error_handler(app)
app.add_middleware(RequestIdMiddleware)

app.include_router(ws_router)
app.include_router(handlers_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
