import structlog

from core_shared.workers import tracked_task

logger = structlog.get_logger()


@tracked_task
async def send_welcome_email(ctx: dict, *, user_id: int, job_id: str | None = None) -> dict:
    """Send welcome email to newly registered user."""
    from app.users.models import User

    user = await User.get(id=user_id)

    # TODO: Replace with actual email sending (SMTP, SendGrid, etc.)
    await logger.ainfo("sending_welcome_email", user_id=user_id, email=user.email)

    return {"status": "sent", "email": user.email}


@tracked_task
async def cleanup_expired_tokens(ctx: dict, *, job_id: str | None = None) -> dict:
    """Remove expired refresh tokens from the database."""
    from datetime import UTC, datetime

    from app.oauth.models import RefreshToken

    expired = await RefreshToken.filter(expires_at__lt=datetime.now(UTC)).delete()

    await logger.ainfo("cleaned_expired_tokens", count=expired)

    return {"deleted": expired}
