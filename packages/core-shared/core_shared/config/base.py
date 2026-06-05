from pydantic_settings import BaseSettings


class BaseAppSettings(BaseSettings):
    app_name: str = "service"
    debug: bool = False
    log_level: str = "INFO"

    model_config = {"env_prefix": "", "env_file": ".env", "extra": "ignore"}
