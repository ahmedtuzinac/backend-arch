from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from tortoise import Tortoise

from app.config import settings
from app.oauth.router import router as oauth_router
from app.tokens.router import router as tokens_router
from app.users.router import router as users_router
from core_shared.audit import audit_router
from core_shared.health import create_health_router
from core_shared.logging import setup_logging
from core_shared.middleware import RequestIdMiddleware, setup_cors, setup_error_handler
from core_shared.settings.router import settings_router
from core_shared.settings.service import ensure_defaults
from core_shared.table.preference_router import preference_router
from core_shared.workers import task_router

TORTOISE_ORM = {
    "connections": {"default": settings.database_url},
    "apps": {
        "models": {
            "models": [
                "app.users.models",
                "app.oauth.models",
                "core_shared.workers.models",
                "core_shared.audit.models",
                "core_shared.settings.models",
                "core_shared.table.models",
                "aerich.models",
            ],
            "default_connection": "default",
        }
    },
}


async def ensure_admin_user() -> None:
    """Create default admin user if it doesn't exist."""
    import bcrypt

    from app.users.models import User, UserRole

    existing = await User.get_or_none(email=settings.admin_email)
    if existing is None:
        hashed = bcrypt.hashpw(settings.admin_password.encode(), bcrypt.gensalt()).decode()
        await User.create(
            email=settings.admin_email,
            hashed_password=hashed,
            role=UserRole.ADMIN,
        )
        structlog.get_logger().info("admin_user_created", email=settings.admin_email)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(log_level=settings.log_level)
    await Tortoise.init(config=TORTOISE_ORM)
    await Tortoise.generate_schemas()
    await ensure_admin_user()
    await ensure_defaults()
    yield
    await Tortoise.close_connections()


app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
)

setup_cors(app)
setup_error_handler(app)
app.add_middleware(RequestIdMiddleware)

app.include_router(users_router)
app.include_router(tokens_router)
app.include_router(oauth_router)
app.include_router(audit_router)
app.include_router(task_router)
app.include_router(settings_router)
app.include_router(preference_router)
app.include_router(create_health_router("auth"))
