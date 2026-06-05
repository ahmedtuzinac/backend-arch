import secrets
from datetime import UTC, datetime, timedelta

from app.config import settings
from app.oauth.models import AuthorizationCode, OAuthClient
from app.oauth.schemas import OAuthClientCreate
from app.tokens.schemas import TokenResponse
from app.tokens.service import create_token_pair
from core_shared.auth import create_access_token


async def create_oauth_client(data: OAuthClientCreate) -> OAuthClient:
    return await OAuthClient.create(
        client_id=secrets.token_urlsafe(32),
        client_secret=secrets.token_urlsafe(64),
        name=data.name,
        redirect_uri=data.redirect_uri,
        scopes=data.scopes,
        grant_types=data.grant_types,
    )


async def get_oauth_client(client_id: str) -> OAuthClient | None:
    return await OAuthClient.get_or_none(client_id=client_id, is_active=True)


async def create_authorization_code(
    client_id: str,
    user_id: int,
    redirect_uri: str,
    scopes: list[str],
) -> str:
    client = await get_oauth_client(client_id)
    if client is None:
        raise ValueError("Invalid client_id")

    if redirect_uri != client.redirect_uri:
        raise ValueError("Invalid redirect_uri")

    invalid_scopes = set(scopes) - set(client.scopes)
    if invalid_scopes:
        raise ValueError(f"Invalid scopes: {invalid_scopes}")

    code = secrets.token_urlsafe(48)
    await AuthorizationCode.create(
        code=code,
        client=client,
        user_id=user_id,
        redirect_uri=redirect_uri,
        scopes=scopes,
        expires_at=datetime.now(UTC) + timedelta(minutes=settings.oauth2_authorization_code_expire_minutes),
    )
    return code


async def exchange_authorization_code(
    code: str,
    client_id: str,
    client_secret: str,
    redirect_uri: str,
) -> TokenResponse:
    auth_code = await AuthorizationCode.get_or_none(
        code=code, is_used=False
    ).prefetch_related("client", "user")

    if auth_code is None:
        raise ValueError("Invalid authorization code")

    if auth_code.expires_at < datetime.now(UTC):
        raise ValueError("Authorization code expired")

    if auth_code.client.client_id != client_id:
        raise ValueError("Client mismatch")

    if auth_code.client.client_secret != client_secret:
        raise ValueError("Invalid client secret")

    if auth_code.redirect_uri != redirect_uri:
        raise ValueError("Redirect URI mismatch")

    auth_code.is_used = True
    await auth_code.save()

    return await create_token_pair(
        auth_code.user,
        scopes=auth_code.scopes,
        client_id=auth_code.client.id,
    )


async def client_credentials_grant(
    client_id: str,
    client_secret: str,
    scopes: list[str],
) -> TokenResponse:
    client = await get_oauth_client(client_id)
    if client is None or client.client_secret != client_secret:
        raise ValueError("Invalid client credentials")

    if "client_credentials" not in client.grant_types:
        raise ValueError("Grant type not allowed")

    invalid_scopes = set(scopes) - set(client.scopes)
    if invalid_scopes:
        raise ValueError(f"Invalid scopes: {invalid_scopes}")

    access_token = create_access_token(
        data={"sub": f"client:{client.id}", "scopes": scopes},
        secret_key=settings.jwt_secret_key,
        expires_delta=timedelta(minutes=settings.jwt_access_token_expire_minutes),
    )

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.jwt_access_token_expire_minutes * 60,
        refresh_token=None,
        scope=" ".join(scopes),
    )
