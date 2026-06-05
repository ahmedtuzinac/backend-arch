from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user, require_role
from app.oauth.schemas import (
    AuthorizationRequest,
    OAuthClientCreate,
    OAuthClientResponse,
    TokenRequest,
)
from app.oauth.service import (
    client_credentials_grant,
    create_authorization_code,
    create_oauth_client,
    exchange_authorization_code,
)
from app.tokens.schemas import TokenResponse
from app.users.models import User, UserRole

router = APIRouter(prefix="/oauth", tags=["oauth"])


@router.post("/clients", response_model=OAuthClientResponse, status_code=status.HTTP_201_CREATED)
async def register_client(
    data: OAuthClientCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.SYSTEM, UserRole.ADMIN))],
):
    return await create_oauth_client(data)


@router.post("/authorize")
async def authorize(
    data: AuthorizationRequest,
    current_user: Annotated[User, Depends(get_current_user)],
):
    try:
        code = await create_authorization_code(
            client_id=data.client_id,
            user_id=current_user.id,
            redirect_uri=data.redirect_uri,
            scopes=data.scope.split() if data.scope else [],
        )
        return {
            "code": code,
            "state": data.state,
            "redirect_uri": f"{data.redirect_uri}?code={code}&state={data.state or ''}",
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from None


@router.post("/token", response_model=TokenResponse)
async def token(data: TokenRequest):
    try:
        if data.grant_type == "authorization_code":
            return await exchange_authorization_code(
                code=data.code,
                client_id=data.client_id,
                client_secret=data.client_secret,
                redirect_uri=data.redirect_uri,
            )
        elif data.grant_type == "client_credentials":
            return await client_credentials_grant(
                client_id=data.client_id,
                client_secret=data.client_secret,
                scopes=data.scope.split() if data.scope else [],
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported grant_type: {data.grant_type}",
            )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e)) from None


@router.post("/revoke")
async def revoke():
    return {"status": "revoked"}
