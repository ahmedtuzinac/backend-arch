from typing import Annotated

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import OAuth2PasswordBearer, SecurityScopes

from core_shared.auth.jwt import decode_token
from core_shared.auth.schemas import CurrentUser

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token", scopes={})


def get_current_user(
    secret_key: str,
):
    async def _get_current_user(
        security_scopes: SecurityScopes,
        token: Annotated[str, Depends(oauth2_scheme)],
    ) -> CurrentUser:
        try:
            payload = decode_token(token, secret_key=secret_key)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(e),
                headers={"WWW-Authenticate": "Bearer"},
            )

        for scope in security_scopes.scopes:
            if scope not in payload.scopes:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing required scope: {scope}",
                )

        return CurrentUser(id=payload.sub, scopes=payload.scopes)

    return _get_current_user


def require_scope(scope: str) -> Security:
    return Security(get_current_user, scopes=[scope])
