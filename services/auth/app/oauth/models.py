from tortoise import fields

from core_shared.database import BaseModel
from core_shared.database.mixins import TimestampMixin


class OAuthClient(BaseModel, TimestampMixin):
    client_id = fields.CharField(max_length=255, unique=True, index=True)
    client_secret = fields.CharField(max_length=255)
    redirect_uri = fields.CharField(max_length=512)
    name = fields.CharField(max_length=255)
    scopes = fields.JSONField(default=[])
    grant_types = fields.JSONField(default=["authorization_code", "refresh_token"])
    is_active = fields.BooleanField(default=True)

    class Meta:
        table = "oauth_clients"


class AuthorizationCode(BaseModel, TimestampMixin):
    code = fields.CharField(max_length=255, unique=True, index=True)
    client = fields.ForeignKeyField("models.OAuthClient", related_name="auth_codes")
    user = fields.ForeignKeyField("models.User", related_name="auth_codes")
    redirect_uri = fields.CharField(max_length=512)
    scopes = fields.JSONField(default=[])
    expires_at = fields.DatetimeField()
    is_used = fields.BooleanField(default=False)

    class Meta:
        table = "authorization_codes"


class RefreshToken(BaseModel, TimestampMixin):
    token = fields.CharField(max_length=512, unique=True, index=True)
    user = fields.ForeignKeyField("models.User", related_name="refresh_tokens")
    client = fields.ForeignKeyField("models.OAuthClient", related_name="refresh_tokens", null=True)
    scopes = fields.JSONField(default=[])
    expires_at = fields.DatetimeField()
    is_revoked = fields.BooleanField(default=False)

    class Meta:
        table = "refresh_tokens"
