from arq import cron
from arq.connections import RedisSettings
from tortoise import Tortoise

from app.config import settings
from app.workers.tasks import cleanup_expired_tokens, send_welcome_email

TORTOISE_ORM = {
    "connections": {"default": settings.database_url},
    "apps": {
        "models": {
            "models": ["app.users.models", "app.oauth.models", "core_shared.workers.models"],
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
    functions = [send_welcome_email, cleanup_expired_tokens]
    cron_jobs = [
        cron(cleanup_expired_tokens, hour={0, 6, 12, 18}),  # every 6 hours
    ]
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    max_jobs = 10
    job_timeout = 300
