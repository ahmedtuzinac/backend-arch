from pydantic import BaseModel


class TokenPayload(BaseModel):
    sub: str
    scopes: list[str] = []
    exp: int | None = None


class CurrentUser(BaseModel):
    id: str
    scopes: list[str] = []
