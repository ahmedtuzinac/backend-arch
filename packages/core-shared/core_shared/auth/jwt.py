from datetime import UTC, datetime, timedelta

import jwt

from core_shared.auth.schemas import TokenPayload


def create_access_token(
    data: dict,
    secret_key: str,
    expires_delta: timedelta = timedelta(minutes=15),
    algorithm: str = "HS256",
) -> str:
    to_encode = data.copy()
    expire = datetime.now(UTC) + expires_delta
    to_encode["exp"] = int(expire.timestamp())
    return jwt.encode(to_encode, secret_key, algorithm=algorithm)


def decode_token(
    token: str,
    secret_key: str,
    algorithm: str = "HS256",
) -> TokenPayload:
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        return TokenPayload(**payload)
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired") from None
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token") from None
