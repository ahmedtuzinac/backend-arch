from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.tokens.schemas import TokenResponse, TokenVerifyRequest, TokenVerifyResponse
from app.tokens.service import create_token_pair, refresh_access_token, verify_access_token
from app.users.service import get_user_by_email, verify_password

router = APIRouter(tags=["tokens"])


@router.post("/token", response_model=TokenResponse)
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = await get_user_by_email(form_data.username)
    if user is None or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return await create_token_pair(user, scopes=form_data.scopes)


@router.post("/token/refresh", response_model=TokenResponse)
async def refresh(data: dict):
    try:
        return await refresh_access_token(data["refresh_token"])
    except (ValueError, KeyError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.post("/token/verify", response_model=TokenVerifyResponse)
async def verify(data: TokenVerifyRequest):
    return verify_access_token(data.token)
