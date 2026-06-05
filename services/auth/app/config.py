from core_shared.config import BaseAppSettings


class AuthSettings(BaseAppSettings):
    database_url: str = "postgres://postgres:postgres@localhost:5432/auth_db"
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret_key: str = "change-me-in-production"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7

    oauth2_authorization_code_expire_minutes: int = 10

    admin_email: str = "admin@admin.local"
    admin_password: str = "admin"

    host: str = "0.0.0.0"
    port: int = 8001


settings = AuthSettings()
