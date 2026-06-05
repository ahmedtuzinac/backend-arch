from core_shared.config import BaseAppSettings


class WebSocketSettings(BaseAppSettings):
    database_url: str = "postgres://postgres:postgres@localhost:5432/websocket_db"
    redis_url: str = "redis://localhost:6379/1"
    jwt_secret_key: str = "change-me-in-production"
    host: str = "0.0.0.0"
    port: int = 8002


settings = WebSocketSettings()
