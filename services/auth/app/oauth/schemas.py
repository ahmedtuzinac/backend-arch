from pydantic import BaseModel


class OAuthClientCreate(BaseModel):
    name: str
    redirect_uri: str
    scopes: list[str] = []
    grant_types: list[str] = ["authorization_code", "refresh_token"]


class OAuthClientResponse(BaseModel):
    id: int
    client_id: str
    name: str
    redirect_uri: str
    scopes: list[str]
    grant_types: list[str]
    is_active: bool

    model_config = {"from_attributes": True}


class AuthorizationRequest(BaseModel):
    response_type: str = "code"
    client_id: str
    redirect_uri: str
    scope: str = ""
    state: str | None = None


class TokenRequest(BaseModel):
    grant_type: str
    code: str | None = None
    redirect_uri: str | None = None
    client_id: str | None = None
    client_secret: str | None = None
    refresh_token: str | None = None
    scope: str | None = None
