from app.config import settings
from app.workers.tasks import generate_thumbnail
from arq.connections import RedisSettings
from tortoise import Tortoise

TORTOISE_ORM = {
    "connections": {"default": settings.database_url},
    "apps": {
        "models": {
            "models": [
                "app.uploads.models",
                "core_shared.workers.models",
            ],
            "default_connection": "default",
        }
    },
}


async def startup(ctx: dict) -> None:
    await Tortoise.init(config=TORTOISE_ORM)
    await Tortoise.generate_schemas()


async def shutdown(ctx: dict) -> None:
    await Tortoise.close_connections()


class WorkerSettings:
    functions = [generate_thumbnail]
    cron_jobs = []
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    max_jobs = 10
    job_timeout = 300
