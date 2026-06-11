import time

from fastapi import APIRouter
from tortoise import Tortoise

_start_time = time.time()


def create_health_router(service_name: str, checks: dict | None = None) -> APIRouter:
    """Create a health router with detailed service status."""
    router = APIRouter(tags=["health"])

    @router.get("/health")
    async def health():
        uptime_seconds = int(time.time() - _start_time)
        hours, remainder = divmod(uptime_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)

        result = {
            "status": "ok",
            "service": service_name,
            "uptime": f"{hours}h {minutes}m {seconds}s",
            "uptime_seconds": uptime_seconds,
            "checks": {},
        }

        # Database check
        try:
            conn = Tortoise.get_connection("default")
            await conn.execute_query("SELECT 1")
            result["checks"]["database"] = {"status": "ok"}
        except Exception as e:
            result["checks"]["database"] = {"status": "error", "detail": str(e)}
            result["status"] = "degraded"

        # Custom checks
        if checks:
            for name, check_fn in checks.items():
                try:
                    await check_fn()
                    result["checks"][name] = {"status": "ok"}
                except Exception as e:
                    result["checks"][name] = {"status": "error", "detail": str(e)}
                    result["status"] = "degraded"

        return result

    return router
