import secrets
from datetime import UTC, datetime, timedelta

from app.config import settings
from app.oauth.models import RefreshToken
from app.tokens.schemas import TokenResponse, TokenVerifyResponse
from app.users.models import User
from core_shared.auth import create_access_token, decode_token


async def create_token_pair(
    user: User,
    scopes: list[str] | None = None,
    client_id: int | None = None,
) -> TokenResponse:
    scopes = scopes or []
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role, "scopes": scopes},
        secret_key=settings.jwt_secret_key,
        expires_delta=timedelta(minutes=settings.jwt_access_token_expire_minutes),
    )

    refresh_token_str = secrets.token_urlsafe(64)
    await RefreshToken.create(
        token=refresh_token_str,
        user=user,
        client_id=client_id,
        scopes=scopes,
        expires_at=datetime.now(UTC) + timedelta(days=settings.jwt_refresh_token_expire_days),
    )

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.jwt_access_token_expire_minutes * 60,
        refresh_token=refresh_token_str,
        scope=" ".join(scopes),
    )


def verify_access_token(token: str) -> TokenVerifyResponse:
    try:
        payload = decode_token(token, secret_key=settings.jwt_secret_key)
        return TokenVerifyResponse(
            active=True,
            sub=payload.sub,
            scopes=payload.scopes,
            exp=payload.exp,
        )
    except ValueError:
        return TokenVerifyResponse(active=False)


async def refresh_access_token(refresh_token: str) -> TokenResponse:
    stored = await RefreshToken.get_or_none(token=refresh_token, is_revoked=False).prefetch_related("user")
    if stored is None or stored.expires_at < datetime.now(UTC):
        raise ValueError("Invalid or expired refresh token")

    stored.is_revoked = True
    await stored.save()

    return await create_token_pair(stored.user, scopes=stored.scopes)
