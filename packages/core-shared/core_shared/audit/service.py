import structlog

from core_shared.audit.models import AuditLog

logger = structlog.get_logger()


async def log_action(
    actor_id: int,
    actor_email: str,
    action: str,
    resource: str,
    resource_id: int | None = None,
    details: dict | None = None,
) -> AuditLog:
    entry = await AuditLog.create(
        actor_id=actor_id,
        actor_email=actor_email,
        action=action,
        resource=resource,
        resource_id=resource_id,
        details=details or {},
    )
    await logger.ainfo(
        "audit",
        actor=actor_email,
        action=action,
        resource=resource,
        resource_id=resource_id,
    )
    return entry
