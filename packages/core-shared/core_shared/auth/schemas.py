from pydantic import BaseModel


class TokenPayload(BaseModel):
    sub: str
    role: str = "employee"
    scopes: list[str] = []
    exp: int | None = None


class CurrentUser(BaseModel):
    id: str
    role: str = "employee"
    scopes: list[str] = []
