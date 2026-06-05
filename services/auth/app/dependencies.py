from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.config import settings
from app.users.models import User
from core_shared.auth import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    try:
        payload = decode_token(token, secret_key=settings.jwt_secret_key)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    user = await User.get_or_none(id=int(payload.sub))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user
